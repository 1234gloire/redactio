/**
 * SMT (Serveur Multi-Terminologies, ANS) — recherche de concepts officiels
 * (SNOMED CT, CIM-10, ATC...) pour enrichir le dictionnaire médical local.
 *
 * Documentation : https://smt.esante.gouv.fr/assistance/utilisation-des-api/
 * Swagger interactif (JS, non indexable) : https://smt.esante.gouv.fr/api-docs/
 *
 * Les schémas exacts de requête/réponse ne sont pas publiés en texte brut ;
 * ce module a été écrit à partir de la documentation disponible mais n'a pas
 * encore été testé avec une vraie clé API. `SMT_HEADER_MODE` ci-dessous liste
 * les deux façons courantes d'authentifier une clé API sur les API de l'ANS —
 * n'hésite pas à ajuster une fois la première réponse réelle observée.
 */
import { ENV } from "./_core/env";

const SMT_API_BASE = "https://smt.esante.gouv.fr/api";

export interface SmtConcept {
  code: string;
  label: string;
  terminology: string;
}

export class SmtNotConfiguredError extends Error {
  constructor() {
    super("Clé API SMT non configurée (SMT_API_KEY manquant).");
    this.name = "SmtNotConfiguredError";
  }
}

function authHeaders(): Record<string, string> {
  // D'après la doc ANS, l'en-tête attendu pour une clé API est `esante-api-key`.
  // Si le SMT répond 401, essayer `Authorization: Bearer ${ENV.smtApiKey}` à la place.
  return {
    "esante-api-key": ENV.smtApiKey,
    Accept: "application/json",
  };
}

async function smtFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ENV.smtApiKey) throw new SmtNotConfiguredError();

  const response = await fetch(`${SMT_API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SMT a répondu ${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }

  return response.json() as Promise<T>;
}

/** Cache mémoire des terminologyId (ex: SNOMED CT, CIM-10, ATC) résolus par nom. */
const terminologyIdCache = new Map<string, string>();

async function resolveTerminologyId(name: string): Promise<string | null> {
  if (terminologyIdCache.has(name)) return terminologyIdCache.get(name)!;

  const results = await smtFetch<Array<Record<string, unknown>>>(
    `/terminologies/search?text=${encodeURIComponent(name)}`
  );
  const first = Array.isArray(results) ? results[0] : undefined;
  const id =
    (first?.terminologyId as string | undefined) ??
    (first?.id as string | undefined) ??
    null;
  if (id) terminologyIdCache.set(name, id);
  return id;
}

function normalizeConcept(raw: Record<string, unknown>, fallbackTerminology: string): SmtConcept {
  const code = (raw.code as string) ?? (raw.conceptId as string) ?? (raw.id as string) ?? "";
  const label =
    (raw.label as string) ??
    (raw.preferredTerm as string) ??
    (raw.display as string) ??
    (raw.term as string) ??
    "";
  const terminology = (raw.terminology as string) ?? (raw.terminologyId as string) ?? fallbackTerminology;
  return { code, label, terminology };
}

/**
 * Recherche des concepts médicaux officiels dans une terminologie du SMT.
 * `terminologyName` accepte un nom lisible ("SNOMED CT", "CIM-10", "ATC"...).
 */
export async function searchSmtConcepts(query: string, terminologyName = "SNOMED CT"): Promise<SmtConcept[]> {
  const terminologyId = await resolveTerminologyId(terminologyName);
  if (!terminologyId) {
    throw new Error(`Terminologie "${terminologyName}" introuvable sur le SMT.`);
  }

  const results = await smtFetch<Array<Record<string, unknown>>>("/concepts/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      terminologyId,
      searchedText: query,
      lang: "fr",
      exact: false,
      size: 15,
    }),
  });

  const list = Array.isArray(results) ? results : ((results as { items?: unknown[] })?.items ?? []);
  return (list as Array<Record<string, unknown>>).map((item) => normalizeConcept(item, terminologyName));
}
