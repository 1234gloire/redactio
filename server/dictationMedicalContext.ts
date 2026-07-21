export type DictationField =
  | "antecedents"
  | "examen_clinique"
  | "traitement"
  | "conciliation_entree"
  | "conciliation_sortie"
  | "correspondance"
  | "general";

export type DictationCorrectionModification = {
  original: string;
  corrige: string;
  type: "orthographe" | "grammaire" | "ponctuation" | "terminologie" | "ambigu";
};

const GENERIC_PROMPT =
  "Dictée médicale en français. Antécédents : hypertension artérielle, diabète de type 2, fibrillation atriale, insuffisance cardiaque, BPCO, insuffisance rénale chronique. Examen clinique : dyspnée, douleur thoracique, œdèmes des membres inférieurs, fièvre, saturation en oxygène. Traitement en cours : Kardégic, Eliquis, Xarelto, Lovenox, Lasilix, Bisoprolol, Ramipril, Metformine, Paracétamol.";

const FIELD_PROMPTS: Record<DictationField, string> = {
  antecedents:
    "Antécédents : hypertension artérielle, diabète de type 2, dyslipidémie, fibrillation atriale, insuffisance cardiaque, BPCO, asthme, insuffisance rénale chronique, AVC, AIT, infarctus du myocarde, prothèse totale de hanche, prothèse totale du genou. Allergies : Bactrim, pénicilline, iode.",
  examen_clinique:
    "Examen clinique : patient apyrétique, tension artérielle, fréquence cardiaque, saturation en oxygène, auscultation cardio-pulmonaire, murmure vésiculaire, abdomen souple, douleur à la palpation, œdèmes des membres inférieurs, déficit neurologique focal, marche avec cannes, cicatrice propre.",
  traitement:
    "Traitement en cours : Kardégic 75 mg, Eliquis 5 mg, Xarelto 20 mg, Lovenox, Innohep, Lasilix, Bisoprolol, Ténormine, Ramipril, Périndopril, Amlodipine, Metformine, Gliclazide, Atorvastatine, Préviscan, Paracétamol, Tramadol, Actiskenan, Oméprazole.",
  conciliation_entree:
    "Traitement d'entrée : Amlodipine 5 mg, Ramipril 5 mg, Bisoprolol 2,5 mg, Kardégic 75 mg, Eliquis 5 mg, Xarelto 20 mg, Metformine 1000 mg, Atorvastatine 40 mg, Lasilix 40 mg, Zopiclone 7,5 mg. Statuts : poursuivi, arrêté, modifié, ajouté.",
  conciliation_sortie:
    "Traitement de sortie : Paracétamol 1 gramme, Tramadol 50 mg, Lovenox 4000 UI, Innohep, Eliquis, Kardégic, Oméprazole, Amlodipine, Bisoprolol, Ramipril, Metformine, Atorvastatine. Posologie : matin, midi, soir, au coucher, pendant sept jours, pendant quarante-cinq jours.",
  correspondance:
    "Correspondance médicale : demande d'avis spécialisé, courrier de transfert, courrier de liaison, motif de recours, question posée, examens complémentaires, biologie, imagerie, traitement en cours, résumé de prise en charge, évolution, conclusion et surveillance.",
  general: GENERIC_PROMPT,
};

export function normalizeDictationField(value: unknown): DictationField {
  const raw = String(value ?? "").toLowerCase();
  if (/ant[eé]c[eé]dent|allerg/.test(raw)) return "antecedents";
  if (/examen|clinique|constante|signes?/.test(raw)) return "examen_clinique";
  if (/traitement d.?entr[eé]e|bilan m[eé]dicamenteux/.test(raw)) return "conciliation_entree";
  if (/traitement de sortie|ordonnance finale/.test(raw)) return "conciliation_sortie";
  if (/traitement|m[eé]dicament|ordonnance|posologie/.test(raw)) return "traitement";
  if (/correspondance|avis|transfert|liaison|question|motif du recours|destination/.test(raw)) return "correspondance";
  return "general";
}

export function buildWhisperMedicalPrompt(field: DictationField): string {
  return FIELD_PROMPTS[field] ?? GENERIC_PROMPT;
}

export function buildDictationCorrectionSystemPrompt(field: DictationField): string {
  const context = FIELD_PROMPTS[field] ?? GENERIC_PROMPT;
  return `Tu es REDACTIO, correcteur de transcription de dictée médicale française.

Périmètre strict :
- Corrige uniquement orthographe, grammaire, ponctuation et segmentation.
- Corrige un terme médical seulement si le contexte permet d'identifier sans ambiguïté le mot prononcé.
- Ne reformule pas le style, ne résume pas, ne raccourcis pas.
- N'ajoute jamais de diagnostic, valeur, posologie, durée, médicament ou conduite à tenir absent du texte source.
- Si un terme reste ambigu, conserve-le sous la forme [terme incertain : ...].
- Retourne uniquement un JSON valide, sans markdown.

Contexte lexical attendu, à utiliser uniquement comme aide orthographique :
${context}`;
}
