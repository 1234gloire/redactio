/**
 * Import en masse depuis le SMT (ANS) vers le dictionnaire médical local.
 *
 * Usage :
 *   node scripts/import-smt-terms.mjs ATC
 *   node scripts/import-smt-terms.mjs CIM-10 --dry-run
 *   node scripts/import-smt-terms.mjs CCAM --max-depth=4
 *
 * Terminologies publiques disponibles (aucune clé API requise, voir
 * server/smtTerminology.ts pour le détail du contrat vérifié empiriquement) :
 *   ATC, CIM-10, CCAM, LOINC
 *
 * IMPORTANT — pourquoi une marche hiérarchique et pas une recherche par lettre :
 * `/api/concepts/search` avec un texte d'une seule lettre ne filtre pas les
 * libellés par préfixe (vérifié empiriquement) : pour une requête courte
 * comme "a", il matche aussi les CODES (ex. tous les codes ATC commençant
 * par "A" à tous les niveaux), pas les libellés — inutilisable pour une
 * énumération complète et fiable. La seule méthode fiable est de parcourir
 * l'arbre réel via /api/concepts/roots puis /api/concepts/child, en ne
 * conservant que les feuilles (`leaf: true`, ce sont les entrées concrètes
 * type "amoxicilline", pas les catégories génériques comme "voies
 * digestives et métabolisme").
 *
 * Parcours en largeur avec un pool de workers à parallélisme fixe (pas de
 * récursion séquentielle par branche, qui sérialise inutilement les appels).
 * ATC ≈ 1200 appels /concepts/child pour ~7000 feuilles. CIM-10 et LOINC
 * sont nettement plus volumineux (dizaines de milliers de feuilles) : ça
 * peut prendre longtemps. Utiliser --max-depth pour limiter si besoin d'un
 * import plus rapide/partiel.
 */
import mysql from "mysql2/promise";
import "dotenv/config";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}

const SMT_API_BASE = "https://smt.esante.gouv.fr/api";
const CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 12000;

const TERMINOLOGIES = {
  "ATC": { terminologyId: "terminologie-atc", category: "medicament" },
  "CIM-10": { terminologyId: "terminologie-cim-10", category: "pathologie" },
  "CCAM": { terminologyId: "terminologie-ccam", category: "procedure" },
  "LOINC": { terminologyId: "terminologie-loinc-international", category: "biologie" },
};

const args = process.argv.slice(2);
const terminologyName = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const maxDepthArg = args.find((a) => a.startsWith("--max-depth="));
const maxDepth = maxDepthArg ? Number(maxDepthArg.split("=")[1]) : Infinity;

const config = TERMINOLOGIES[terminologyName];
if (!config) {
  console.error(`Terminologie inconnue ou manquante. Usage: node scripts/import-smt-terms.mjs <${Object.keys(TERMINOLOGIES).join("|")}> [--dry-run] [--max-depth=N]`);
  process.exit(1);
}

function codeFromId(id) {
  const parts = id.split("/");
  return decodeURIComponent(parts[parts.length - 1]);
}

async function fetchJson(url, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === attempts) throw e;
      await new Promise((r) => setTimeout(r, 500 * i));
    }
  }
}

async function getRoots() {
  const url = `${SMT_API_BASE}/concepts/roots?terminologyId=${encodeURIComponent(config.terminologyId)}`;
  return fetchJson(url);
}

async function getChildren(conceptId) {
  const params = new URLSearchParams({ terminologyId: config.terminologyId, conceptId });
  const data = await fetchJson(`${SMT_API_BASE}/concepts/child?${params.toString()}`);
  return data[conceptId]?.conceptSubClasses ?? [];
}

async function upsertTerm(conn, { code, label }) {
  const term = label.trim();
  if (!term) return "skipped";

  const [existing] = await conn.execute("SELECT id, code FROM medical_terms WHERE term = ? LIMIT 1", [term]);
  if (existing.length > 0) {
    if (existing[0].code !== code) {
      await conn.execute("UPDATE medical_terms SET code = ?, source = ? WHERE id = ?", [code, terminologyName, existing[0].id]);
      return "updated";
    }
    return "unchanged";
  }

  await conn.execute(
    `INSERT INTO medical_terms (term, category, synonyms, definition, source, code, active, usageCount)
     VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
    [term, config.category, JSON.stringify([]), null, terminologyName, code]
  );
  return "inserted";
}

async function main() {
  console.log(`Import SMT — terminologie: ${terminologyName} (${config.terminologyId}) -> catégorie "${config.category}"`);
  if (dryRun) console.log("Mode --dry-run : aucune écriture en base.");
  if (maxDepth !== Infinity) console.log(`Profondeur limitée à ${maxDepth}.`);

  const conn = dryRun ? null : await mysql.createConnection(DB_URL);
  const stats = { branchesVisited: 0, leaves: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 0, errors: 0 };

  const roots = await getRoots();
  // File FIFO d'items {id, labelFr, leaf, depth} à traiter.
  const queue = roots.map((r) => ({ ...r, depth: 0 }));
  let pending = queue.length; // items en file ou en cours de traitement
  let lastLog = Date.now();

  async function handleItem(item) {
    if (item.leaf) {
      stats.leaves++;
      const term = { code: codeFromId(item.id), label: item.labelFr };
      if (!dryRun) {
        try {
          const result = await upsertTerm(conn, term);
          stats[result] = (stats[result] ?? 0) + 1;
        } catch (e) {
          console.warn(`  Échec sur "${term.label}": ${e.message}`);
          stats.errors++;
        }
      }
      return;
    }

    stats.branchesVisited++;
    if (item.depth >= maxDepth) return; // on n'explore pas plus loin

    try {
      const children = await getChildren(item.id);
      for (const child of children) {
        pending++;
        queue.push({ ...child, depth: item.depth + 1 });
      }
    } catch (e) {
      console.warn(`  Échec récupération enfants de "${item.labelFr}": ${e.message}`);
      stats.errors++;
    }
  }

  async function worker() {
    while (pending > 0) {
      const item = queue.shift();
      if (!item) {
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }
      await handleItem(item);
      pending--;

      if (Date.now() - lastLog > 3000) {
        console.log(`... ${stats.branchesVisited} branches visitées, ${stats.leaves} feuilles trouvées, file: ${queue.length}`);
        lastLog = Date.now();
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (conn) await conn.end();

  console.log("\n--- Résumé ---");
  console.log(stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
