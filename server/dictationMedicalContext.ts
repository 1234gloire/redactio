export type DictationField =
  | "antecedents"
  | "examen_clinique"
  | "traitement"
  | "conciliation_entree"
  | "conciliation_sortie"
  | "correspondance"
  | "orthopedie"
  | "general";

export type DictationCorrectionModification = {
  original: string;
  corrige: string;
  type: "orthographe" | "grammaire" | "ponctuation" | "terminologie" | "ambigu";
};

const GENERIC_PROMPT =
  "Antécédents : hypertension artérielle traitée par Kardégic 75 mg et un comprimé d'Atorvastatine 10 mg le soir. Diabète de type 2, dyslipidémie, fibrillation atriale sous Apixaban 5 mg, un comprimé matin et soir. Examen clinique : auscultation cardiopulmonaire normale, absence de signe de décompensation. Traitement en cours : Indapamide, Irbésartan, Pantoprazole, un comprimé par jour, Mirtazapine 15 mg le soir.";

const ORTHOPEDIC_PROMPT =
  "Motif d'entrée : coxarthrose droite invalidante. Gonarthrose gauche évoluée. Fracture pertrochantérienne de la hanche droite. Fracture du radius distal gauche. Type de chirurgie : prothèse totale de hanche droite, ostéosynthèse par clou gamma, plaque de radius distal, arthroplastie totale de genou, ligamentoplastie du ligament croisé antérieur. Consignes de sortie : appui total autorisé, ablation des agrafes à J21, thromboprophylaxie par Lovenox 4000 UI, un comprimé d'antalgique de palier 1, kinésithérapie de rééducation à la marche, bas de contention.";

const FIELD_PROMPTS: Record<DictationField, string> = {
  antecedents:
    "Antécédents médico-chirurgicaux : accident ischémique transitoire, glaucome, appendicectomie, prothèse totale de genou bilatérale, prothèse totale de hanche, dyslipidémie, hypertension artérielle, trouble anxio-dépressif, fibrillation atriale, diabète de type 2, insuffisance rénale chronique, embolie pulmonaire, accident vasculaire cérébral ischémique, maladie d'Alzheimer, syndrome démentiel, dénutrition protéino-énergétique, ostéoporose, cardiopathie ischémique, insuffisance cardiaque à fraction d'éjection préservée, allergie à la pénicilline.",
  examen_clinique:
    "Patiente adressée par le service de cardiologie du centre hospitalier de Valenciennes pour poursuite de la prise en charge rééducative au décours d'un épisode d'embolie pulmonaire segmentaire, avec thrombus au sein des branches artérielles, compliquée d'une dilatation des cavités cardiaques droites. Sur le plan cardiovasculaire, tension artérielle mesurée, fréquence cardiaque régulière, absence d'œdème des membres inférieurs. Sur le plan respiratoire, saturation en oxygène en air ambiant satisfaisante, auscultation pulmonaire libre. Sur le plan neurologique, orientation dans le temps et l'espace conservée.",
  traitement:
    "Traitement habituel du domicile : Indapamide 1,5 mg, un comprimé par jour. Irbésartan 150 mg, un comprimé par jour. Atorvastatine 10 mg, un comprimé par jour le soir. Kardégic 75 mg, un comprimé par jour. Bêta-Histine 24 mg, un comprimé deux fois par jour. Alprazolam 0,25 mg, un comprimé le soir au coucher. Traitement d'entrée : Pantoprazole 20 mg, un comprimé le soir, per os. Mirtazapine 15 mg, un comprimé le soir. Apixaban 5 mg, un comprimé matin et soir. Furosémide 40 mg, un comprimé le matin. Diffu-K 600 mg, une gélule matin, midi et soir. Fungizone suspension buvable, une cuillère mesure matin, midi et soir pendant deux semaines.",
  conciliation_entree:
    "Traitement habituel du domicile : Indapamide 1,5 mg, un comprimé par jour. Irbésartan 150 mg, un comprimé par jour. Atorvastatine 10 mg, un comprimé par jour le soir. Kardégic 75 mg, un comprimé par jour. Bêta-Histine 24 mg, un comprimé deux fois par jour. Alprazolam 0,25 mg, un comprimé le soir au coucher. Traitement d'entrée : Pantoprazole 20 mg, un comprimé le soir, per os. Mirtazapine 15 mg, un comprimé le soir. Apixaban 5 mg, un comprimé matin et soir. Furosémide 40 mg, un comprimé le matin. Diffu-K 600 mg, une gélule matin, midi et soir. Fungizone suspension buvable, une cuillère mesure matin, midi et soir pendant deux semaines.",
  conciliation_sortie:
    "Traitement habituel du domicile : Indapamide 1,5 mg, un comprimé par jour. Irbésartan 150 mg, un comprimé par jour. Atorvastatine 10 mg, un comprimé par jour le soir. Kardégic 75 mg, un comprimé par jour. Bêta-Histine 24 mg, un comprimé deux fois par jour. Alprazolam 0,25 mg, un comprimé le soir au coucher. Traitement d'entrée : Pantoprazole 20 mg, un comprimé le soir, per os. Mirtazapine 15 mg, un comprimé le soir. Apixaban 5 mg, un comprimé matin et soir. Furosémide 40 mg, un comprimé le matin. Diffu-K 600 mg, une gélule matin, midi et soir. Fungizone suspension buvable, une cuillère mesure matin, midi et soir pendant deux semaines.",
  correspondance:
    "Antécédents : hypertension artérielle traitée par Kardégic 75 mg et un comprimé d'Atorvastatine 10 mg le soir. Diabète de type 2, dyslipidémie, fibrillation atriale sous Apixaban 5 mg, un comprimé matin et soir. Examen clinique : auscultation cardiopulmonaire normale, absence de signe de décompensation. Traitement en cours : Indapamide, Irbésartan, Pantoprazole, un comprimé par jour, Mirtazapine 15 mg le soir. Je sollicite votre avis en cardiologie concernant votre patiente suivie pour une insuffisance cardiaque.",
  orthopedie: ORTHOPEDIC_PROMPT,
  general: GENERIC_PROMPT,
};

export function normalizeDictationField(value: unknown): DictationField {
  const raw = String(value ?? "").toLowerCase();
  if (/ant[eé]c[eé]dent|allerg/.test(raw)) return "antecedents";
  if (/examen|clinique|constante|\bsignes?\b/.test(raw)) return "examen_clinique";
  if (/traitement d.?entr[eé]e|bilan m[eé]dicamenteux/.test(raw)) return "conciliation_entree";
  if (/traitement de sortie|ordonnance finale/.test(raw)) return "conciliation_sortie";
  if (/ortho|chirurgie|geste|lat[eé]ralit[eé]|motif d.?entr[eé]e|consignes? de sortie|proth[eè]se|ost[eé]osynth[eè]se|arthroplastie/.test(raw)) return "orthopedie";
  if (/traitement|m[eé]dicament|ordonnance|posologie/.test(raw)) return "traitement";
  if (/correspondance|avis|transfert|liaison|question|motif du recours|destination/.test(raw)) return "correspondance";
  return "general";
}

export function buildWhisperMedicalPrompt(field: DictationField): string {
  return FIELD_PROMPTS[field] ?? GENERIC_PROMPT;
}

export function buildDictationCorrectionSystemPrompt(field: DictationField): string {
  const context = FIELD_PROMPTS[field] ?? GENERIC_PROMPT;
  return `Tu es MEDACTIO, correcteur de transcription de dictée médicale française.

Périmètre strict :
- Corrige uniquement orthographe, grammaire, ponctuation et segmentation.
- Corrige un terme médical seulement si le contexte permet d'identifier sans ambiguïté le mot prononcé.
- Si un terme médicamenteux déformé correspond, par proximité phonétique, à un médicament réel et que le dosage ou la forme galénique dictés sont cohérents, tu peux le corriger en type "terminologie". Sinon, signale-le entre crochets.
- Ne reformule pas le style, ne résume pas, ne raccourcis pas.
- N'ajoute jamais de diagnostic, valeur, posologie, durée, médicament ou conduite à tenir absent du texte source.
- Si un terme reste ambigu, conserve-le sous la forme [terme incertain : ...].
- Retourne uniquement un JSON valide, sans markdown.

Contexte lexical attendu, à utiliser uniquement comme aide orthographique :
${context}`;
}
