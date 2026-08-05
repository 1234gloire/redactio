/**
 * SMT (Serveur Multi-Terminologies, ANS) — recherche de concepts officiels
 * (ATC, CIM-10, CCAM, LOINC...) pour enrichir le dictionnaire médical local.
 *
 * Contrat vérifié empiriquement le 2026-07-29 (aucune doc publique en clair
 * ne le documente ; le Swagger interactif à /api/swagger-ui n'expose pas son
 * spec JSON sur ce déploiement) :
 *
 *   POST https://smt.esante.gouv.fr/api/concepts/search
 *     ?searchedText=<query>&pagination=<page 1-indexé>&size=<n>&adv=false
 *     &terminologyFilters=<terminologyId>&lang=fr&isBrowserSnomedLicence=false
 *   body: {"facets":[],"terminologySpecifiqueFacets":[]}
 *   -> { concepts: [{ code, prefLabel, terminologyLabel, ... }], numberOfConcepts }
 *
 * Les terminologies non protégées (ATC, CIM-10, CCAM, LOINC) répondent sans
 * aucune authentification. SNOMED CT ("terminologie-snomed-ct-fr") est
 * marquée `forProtected` côté SMT et attend un vrai JWT en
 * `Authorization: Bearer` — envoyer la clé API brute échoue ("jeton JWT non
 * valide"). Le mécanisme d'échange clé -> JWT n'est pas documenté
 * publiquement ; contacter ans-terminologies@esante.gouv.fr si SNOMED CT
 * devient nécessaire. En attendant, SNOMED CT n'est pas proposée ici.
 */

const SMT_API_BASE = "https://smt.esante.gouv.fr/api";

/** terminologyId vérifiés via GET /api/terminologies/list/with-concepts. */
export const SMT_TERMINOLOGIES = {
  "ATC": "terminologie-atc",
  "CIM-10": "terminologie-cim-10",
  "CCAM": "terminologie-ccam",
  "LOINC": "terminologie-loinc-international",
} as const;

export type SmtTerminologyName = keyof typeof SMT_TERMINOLOGIES;

export interface SmtConcept {
  code: string;
  label: string;
  terminology: string;
}

interface SmtSearchResponse {
  numberOfConcepts: number;
  concepts: Array<{
    code: string;
    prefLabel: string;
    terminologyLabel: string;
  }> | null;
}

/**
 * Recherche des concepts médicaux officiels dans une terminologie publique du SMT.
 */
export async function searchSmtConcepts(query: string, terminologyName: SmtTerminologyName): Promise<SmtConcept[]> {
  const terminologyId = SMT_TERMINOLOGIES[terminologyName];
  if (!terminologyId) {
    throw new Error(`Terminologie "${terminologyName}" non prise en charge.`);
  }

  const params = new URLSearchParams({
    searchedText: query,
    pagination: "1",
    size: "15",
    adv: "false",
    terminologyFilters: terminologyId,
    lang: "fr",
    isBrowserSnomedLicence: "false",
  });

  const response = await fetch(`${SMT_API_BASE}/concepts/search?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ facets: [], terminologySpecifiqueFacets: [] }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Le SMT a répondu ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as SmtSearchResponse;
  return (data.concepts ?? []).map((c) => ({
    code: c.code,
    label: c.prefLabel,
    terminology: c.terminologyLabel,
  }));
}
