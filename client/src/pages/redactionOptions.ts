export type Volet =
  | "courrier_sortie"
  | "conciliation"
  | "correspondance"
  | "observation";

export type RedactionSubtype =
  | "cardiologie"
  | "pneumologie"
  | "medecine_interne"
  | "geriatrie"
  | "admission"
  | "sortie"
  | "transfert"
  | "avis_specialise"
  | "suivi"
  | "autre";

export const REDACTION_SUBTYPES: Record<Volet, { id: RedactionSubtype; label: string }[]> = {
  courrier_sortie: [
    { id: "cardiologie", label: "Cardiologie" },
    { id: "pneumologie", label: "Pneumologie" },
    { id: "medecine_interne", label: "Médecine interne" },
    { id: "geriatrie", label: "Gériatrie" },
  ],
  conciliation: [
    { id: "admission", label: "Admission" },
    { id: "sortie", label: "Sortie" },
    { id: "transfert", label: "Transfert" },
  ],
  correspondance: [
    { id: "avis_specialise", label: "Avis spécialisé" },
    { id: "suivi", label: "Courrier de suivi" },
    { id: "autre", label: "Autre" },
  ],
  observation: [], // Pas de sous-type pour l'observation
};

export function isValidVolet(volet: string): volet is Volet {
  return ["courrier_sortie", "conciliation", "correspondance", "observation"].includes(volet);
}

export function getDefaultSubtype(volet: Volet): RedactionSubtype {
  return REDACTION_SUBTYPES[volet][0]?.id ?? "autre";
}

export function isValidSubtypeForVolet(volet: Volet, subtype: string): subtype is RedactionSubtype {
  return REDACTION_SUBTYPES[volet].some((s) => s.id === subtype);
}