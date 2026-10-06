export const REDACTION_SUBTYPES = {
  courrier_sortie: [
    { id: "medecine_aigue", label: "Médecine aiguë" },
    { id: "chirurgie", label: "Chirurgie" },
    { id: "court_sejour_geriatrique", label: "Court séjour gériatrique" },
    { id: "smr", label: "SMR (soins de suite et réadaptation)" },
  ],
  conciliation: [
    { id: "traitement_entree", label: "Traitement d'entrée" },
    { id: "traitement_sortie", label: "Traitement de sortie" },
  ],
  correspondance: [
    { id: "consultation_specialisee", label: "Demande d'avis spécialisé" },
    { id: "transfert_inter_service", label: "Courrier de transfert" },
  ],
  projet_smr: [
    // NOUVEAU — l'ordre = l'ordre d'affichage ; le 1er est sélectionné par défaut (H0)
    { id: "geriatrie", label: "Gériatrique" },
    { id: "locomoteur", label: "Locomoteur" },
    { id: "neurologie", label: "Neurologique" },
    { id: "cardio_respiratoire", label: "Cardio-respiratoire" },
    { id: "digestif_endocrinien", label: "Digestif-endocrinien" },
    { id: "oncologie", label: "Oncologique" },
    { id: "polyvalent", label: "Polyvalent" },
    { id: "entree_directe", label: "Entrée directe" },
  ],
  observation: [
    { id: "observation_libre", label: "Observation libre" },
  ],
} as const;

export type Volet = keyof typeof REDACTION_SUBTYPES;
export type RedactionSubtype = (typeof REDACTION_SUBTYPES)[Volet][number]["id"];

export const VOLET_VALUES = Object.keys(REDACTION_SUBTYPES) as Volet[];

export function isValidVolet(value: string): value is Volet {
  return VOLET_VALUES.includes(value as Volet);
}

export function getDefaultSubtype(volet: Volet): RedactionSubtype {
  return REDACTION_SUBTYPES[volet][0].id;
}

export function isValidSubtypeForVolet(volet: Volet, subtype: string): subtype is RedactionSubtype {
  return REDACTION_SUBTYPES[volet].some((option) => option.id === subtype);
}

export function getSubtypeLabel(volet: Volet, subtype: RedactionSubtype): string {
  return REDACTION_SUBTYPES[volet].find((option) => option.id === subtype)?.label ?? subtype;
}
