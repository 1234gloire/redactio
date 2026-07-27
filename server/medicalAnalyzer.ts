/**
 * MEDACTIO — Analyseur de texte médical
 * Tokenise un texte transcrit, le compare au dictionnaire médical en BDD,
 * et retourne :
 *   - les termes reconnus (correspondance exacte ou synonyme)
 *   - les suggestions d'auto-correction (distance de Levenshtein ≤ seuil)
 *
 * Aucun contenu médical n'est journalisé (EXG-API-02).
 */

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { medicalTerms } from "../drizzle/schema";

// ─── Types publics ────────────────────────────────────────────────────────────

export interface MatchedTerm {
  /** Position de début du token dans le texte original (index caractère) */
  start: number;
  /** Position de fin (exclusive) */
  end: number;
  /** Token tel qu'il apparaît dans le texte */
  original: string;
  /** Terme canonique de la BDD */
  canonical: string;
  /** Identifiant BDD du terme */
  termId: number;
  /** Catégorie médicale */
  category: string;
  /** Définition courte (peut être null) */
  definition: string | null;
  /** Synonymes disponibles */
  synonyms: string[];
  /** true = correspondance exacte/synonyme ; false = suggestion de correction */
  isExact: boolean;
  /** Distance de Levenshtein (0 si exact) */
  distance: number;
}

export interface AnalysisResult {
  /** Texte original non modifié */
  originalText: string;
  /** Texte avec corrections appliquées (termes remplacés par leur forme canonique) */
  correctedText: string;
  /** Liste des correspondances trouvées */
  matches: MatchedTerm[];
  /** Nombre de termes reconnus (exact) */
  exactCount: number;
  /** Nombre de suggestions de correction */
  suggestionCount: number;
}

// ─── Algorithme de Levenshtein ────────────────────────────────────────────────

/**
 * Calcule la distance de Levenshtein entre deux chaînes.
 * Optimisé avec une matrice à deux lignes (O(n) espace).
 */
export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  // Limite rapide : si les longueurs diffèrent trop, distance forcément élevée
  if (Math.abs(la - lb) > 4) return Math.abs(la - lb);

  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array<number>(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insertion
        prev[j] + 1,            // suppression
        prev[j - 1] + cost      // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

// ─── Tokenisation ─────────────────────────────────────────────────────────────

interface Token {
  value: string;
  start: number;
  end: number;
}

/**
 * Tokenise le texte en mots (séquences alphanumériques + tirets/apostrophes internes).
 * Conserve les positions de chaque token pour la reconstruction du texte.
 */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // Regex : mot = séquence de lettres/chiffres, avec tirets/apostrophes internes autorisés
  const re = /[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ value: m[0], start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

// ─── Seuils de correspondance ─────────────────────────────────────────────────

/**
 * Retourne le seuil de distance de Levenshtein acceptable selon la longueur du token.
 * - Tokens courts (< 4 car) : correspondance exacte uniquement
 * - Tokens moyens (4-7 car) : distance ≤ 1
 * - Tokens longs (≥ 8 car) : distance ≤ 2
 */
function maxDistance(tokenLength: number): number {
  if (tokenLength < 4) return 0;
  if (tokenLength < 8) return 1;
  return 2;
}

// ─── Chargement du dictionnaire ───────────────────────────────────────────────

interface DictEntry {
  id: number;
  term: string;
  termLower: string;
  category: string;
  definition: string | null;
  synonyms: string[];
  synonymsLower: string[];
}

let _dictCache: DictEntry[] | null = null;
let _dictCacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FALLBACK_DICTIONARY: DictEntry[] = [
  {
    id: -1,
    term: "paracétamol",
    termLower: "paracétamol",
    category: "medicament",
    definition: "Antalgique et antipyrétique.",
    synonyms: ["paracetamol", "doliprane", "dafalgan", "efferalgan"],
    synonymsLower: ["paracetamol", "doliprane", "dafalgan", "efferalgan"],
  },
  {
    id: -2,
    term: "amoxicilline",
    termLower: "amoxicilline",
    category: "medicament",
    definition: "Antibiotique de la famille des bêta-lactamines.",
    synonyms: ["amoxiciline", "clamoxyl"],
    synonymsLower: ["amoxiciline", "clamoxyl"],
  },
  {
    id: -3,
    term: "hypertension artérielle",
    termLower: "hypertension artérielle",
    category: "pathologie",
    definition: "Élévation chronique de la pression artérielle.",
    synonyms: ["hta", "hypertension"],
    synonymsLower: ["hta", "hypertension"],
  },
  {
    id: -4,
    term: "diabète",
    termLower: "diabète",
    category: "pathologie",
    definition: "Trouble chronique de la régulation glycémique.",
    synonyms: ["diabete", "diabète type 2", "dt2"],
    synonymsLower: ["diabete", "diabète type 2", "dt2"],
  },
  {
    id: -5,
    term: "insuffisance cardiaque",
    termLower: "insuffisance cardiaque",
    category: "pathologie",
    definition: "Incapacité du cœur à assurer un débit adapté aux besoins de l'organisme.",
    synonyms: ["ic", "décompensation cardiaque", "decompensation cardiaque"],
    synonymsLower: ["ic", "décompensation cardiaque", "decompensation cardiaque"],
  },
  {
    id: -6,
    term: "dyspnée",
    termLower: "dyspnée",
    category: "symptome",
    definition: "Sensation de gêne respiratoire.",
    synonyms: ["dyspnee", "essoufflement"],
    synonymsLower: ["dyspnee", "essoufflement"],
  },
  {
    id: -7,
    term: "douleur thoracique",
    termLower: "douleur thoracique",
    category: "symptome",
    definition: "Douleur localisée au thorax.",
    synonyms: ["dlr thoracique", "douleurs thoraciques"],
    synonymsLower: ["dlr thoracique", "douleurs thoraciques"],
  },
  {
    id: -8,
    term: "fibrillation atriale",
    termLower: "fibrillation atriale",
    category: "pathologie",
    definition: "Trouble du rythme supraventriculaire.",
    synonyms: ["fa", "fibrillation auriculaire"],
    synonymsLower: ["fa", "fibrillation auriculaire"],
  },
  {
    id: -9,
    term: "coronarographie",
    termLower: "coronarographie",
    category: "procedure",
    definition: "Examen radiologique invasif des artères coronaires.",
    synonyms: ["coro"],
    synonymsLower: ["coro"],
  },
  {
    id: -10,
    term: "créatinine",
    termLower: "créatinine",
    category: "biologie",
    definition: "Marqueur biologique utilisé pour évaluer la fonction rénale.",
    synonyms: ["creatinine"],
    synonymsLower: ["creatinine"],
  },
];

async function loadDictionary(): Promise<DictEntry[]> {
  const now = Date.now();
  if (_dictCache && now - _dictCacheTs < CACHE_TTL_MS) return _dictCache;

  const db = await getDb();
  if (!db) return FALLBACK_DICTIONARY;

  let rows: Array<typeof medicalTerms.$inferSelect>;
  try {
    rows = await db
      .select()
      .from(medicalTerms)
      .where(and(eq(medicalTerms.active, true)))
      .orderBy(sql`LENGTH(${medicalTerms.term}) DESC`); // termes longs en premier pour éviter les faux positifs
  } catch {
    // Ne jamais faire échouer la dictée si la table de dictionnaire n'est pas encore migrée ou accessible.
    return FALLBACK_DICTIONARY;
  }

  if (rows.length === 0) return FALLBACK_DICTIONARY;

  _dictCache = rows.map((r) => {
    let synonyms: string[] = [];
    try {
      const raw = r.synonyms;
      if (Array.isArray(raw)) synonyms = raw as string[];
      else if (typeof raw === "string") synonyms = JSON.parse(raw);
    } catch {
      synonyms = [];
    }
    return {
      id: r.id,
      term: r.term,
      termLower: r.term.toLowerCase(),
      category: r.category,
      definition: r.definition ?? null,
      synonyms,
      synonymsLower: synonyms.map((s) => s.toLowerCase()),
    };
  });
  _dictCacheTs = now;
  return _dictCache;
}

/** Invalide le cache (à appeler après modification du dictionnaire) */
export function invalidateDictCache(): void {
  _dictCache = null;
  _dictCacheTs = 0;
}

// ─── Analyse principale ───────────────────────────────────────────────────────

/**
 * Analyse un texte transcrit et retourne les correspondances avec le dictionnaire médical.
 *
 * Stratégie :
 * 1. Tokeniser le texte
 * 2. Pour chaque token, chercher une correspondance exacte (terme ou synonyme)
 * 3. Si pas de correspondance exacte, chercher la meilleure suggestion par Levenshtein
 * 4. Éviter les doublons (un token ne peut avoir qu'une seule correspondance)
 * 5. Construire le texte corrigé en remplaçant les tokens suggérés par leur forme canonique
 *
 * @param text Texte à analyser (transcription Whisper brute)
 * @param maxSuggestions Nombre maximum de suggestions de correction à retourner
 */
export async function analyzeText(
  text: string,
  maxSuggestions = 20
): Promise<AnalysisResult> {
  const dict = await loadDictionary();
  const tokens = tokenize(text);
  const matches: MatchedTerm[] = [];

  // Index des positions déjà matchées pour éviter les chevauchements
  const usedPositions = new Set<number>();

  for (const token of tokens) {
    const tokenLower = token.value.toLowerCase();
    const tokenLen = token.value.length;

    // Ignorer les tokens trop courts (articles, prépositions, etc.)
    if (tokenLen < 3) continue;

    // ── 1. Recherche exacte ──────────────────────────────────────────────────
    let exactEntry: DictEntry | undefined;

    // Correspondance exacte sur le terme principal
    exactEntry = dict.find((e) => e.termLower === tokenLower);

    // Correspondance exacte sur un synonyme
    if (!exactEntry) {
      exactEntry = dict.find((e) => e.synonymsLower.includes(tokenLower));
    }

    if (exactEntry) {
      // Marquer toutes les positions du token comme utilisées
      for (let p = token.start; p < token.end; p++) usedPositions.add(p);

      matches.push({
        start: token.start,
        end: token.end,
        original: token.value,
        canonical: exactEntry.term,
        termId: exactEntry.id,
        category: exactEntry.category,
        definition: exactEntry.definition,
        synonyms: exactEntry.synonyms,
        isExact: true,
        distance: 0,
      });
      continue;
    }

    // ── 2. Recherche par Levenshtein ─────────────────────────────────────────
    // Seulement si le token a une longueur suffisante
    const threshold = maxDistance(tokenLen);
    if (threshold === 0) continue;

    let bestEntry: DictEntry | undefined;
    let bestDist = threshold + 1;

    for (const entry of dict) {
      // Comparer avec le terme principal
      const d1 = levenshtein(tokenLower, entry.termLower);
      if (d1 <= threshold && d1 < bestDist) {
        bestDist = d1;
        bestEntry = entry;
      }
      // Comparer avec les synonymes
      for (const syn of entry.synonymsLower) {
        const d2 = levenshtein(tokenLower, syn);
        if (d2 <= threshold && d2 < bestDist) {
          bestDist = d2;
          bestEntry = entry;
        }
      }
    }

    if (bestEntry && bestDist > 0) {
      for (let p = token.start; p < token.end; p++) usedPositions.add(p);
      matches.push({
        start: token.start,
        end: token.end,
        original: token.value,
        canonical: bestEntry.term,
        termId: bestEntry.id,
        category: bestEntry.category,
        definition: bestEntry.definition,
        synonyms: bestEntry.synonyms,
        isExact: false,
        distance: bestDist,
      });
    }
  }

  // Limiter les suggestions (pas les exactes)
  const exactMatches = matches.filter((m) => m.isExact);
  const suggestions = matches.filter((m) => !m.isExact).slice(0, maxSuggestions);
  const allMatches = [...exactMatches, ...suggestions].sort((a, b) => a.start - b.start);

  // ── 3. Construire le texte corrigé ──────────────────────────────────────────
  let correctedText = text;
  // Appliquer les corrections en partant de la fin pour ne pas décaler les indices
  const toCorrect = [...allMatches].reverse();
  for (const m of toCorrect) {
    if (!m.isExact && m.original.toLowerCase() !== m.canonical.toLowerCase()) {
      // Préserver la casse originale si le token commence par une majuscule
      const replacement =
        m.original[0] === m.original[0].toUpperCase() && m.original[0] !== m.original[0].toLowerCase()
          ? m.canonical.charAt(0).toUpperCase() + m.canonical.slice(1)
          : m.canonical;
      correctedText = correctedText.slice(0, m.start) + replacement + correctedText.slice(m.end);
    }
  }

  return {
    originalText: text,
    correctedText,
    matches: allMatches,
    exactCount: exactMatches.length,
    suggestionCount: suggestions.length,
  };
}
