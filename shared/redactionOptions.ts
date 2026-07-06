export const REDACTION_SUBTYPES = {
  courrier_sortie: [
    { id: "medecine_aigue", label: "Médecine aiguë" },
    { id: "chirurgie", label: "Chirurgie" },
    { id: "chirurgie_orthopedique", label: "Chirurgie orthopédique" },
    { id: "court_sejour_geriatrique", label: "Court séjour gériatrique" },
    { id: "smr", label: "SMR (soins de suite et réadaptation)" },
  ],
  conciliation: [
    { id: "traitement_entree", label: "Traitement d'entrée" },
    { id: "traitement_sortie", label: "Traitement de sortie" },
  ],
  correspondance: [
    { id: "transfert_urgence", label: "Transfert vers un service d'urgence" },
    { id: "transfert_inter_service", label: "Transfert inter-service" },
    { id: "consultation_specialisee", label: "Consultation spécialisée" },
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
