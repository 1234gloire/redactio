export type DictationField =
  | "antecedents"
  | "examen_clinique"
  | "suivi_evolution"
  | "traitement"
  | "conciliation_entree"
  | "conciliation_sortie"
  | "correspondance"
  | "orthopedie"
  | "general";

export type DictationCorrectionModification = {
  original: string;
  corrige: string;
  type:
    | "orthographe"
    | "grammaire"
    | "ponctuation"
    | "terminologie"
    | "nombre"
    | "nom_propre"
    | "ambigu";
};

const GENERIC_PROMPT =
  "Antécédents : hypertension artérielle traitée par Kardégic 75 mg et un comprimé d'Atorvastatine 10 mg le soir. Diabète de type 2, dyslipidémie, fibrillation atriale sous Apixaban 5 mg, un comprimé matin et soir. Examen clinique : auscultation cardiopulmonaire normale, absence de signe de décompensation. Traitement en cours : Indapamide, Irbésartan, Pantoprazole, un comprimé par jour, Mirtazapine 15 mg le soir.";

const ORTHOPEDIC_PROMPT =
  "Motif d'entrée : coxarthrose droite invalidante, gonarthrose gauche évoluée, fracture pertrochantérienne de la hanche droite, fracture du radius distal gauche. Type de chirurgie : prothèse totale de hanche droite, ostéosynthèse par clou gamma, plaque de radius distal, arthroplastie totale de genou, ligamentoplastie du ligament croisé antérieur. Consignes de sortie : appui total autorisé, ablation des agrafes à J21, thromboprophylaxie par Lovenox 4000 UI, un comprimé d'antalgique de palier 1, kinésithérapie de rééducation à la marche, bas de contention.";

const FIELD_PROMPTS: Record<DictationField, string> = {
  antecedents:
    "Antécédents médico-chirurgicaux : hypertension artérielle, diabète de type 2, dyslipidémie, fibrillation atriale, cardiopathie ischémique, insuffisance cardiaque à fraction d'éjection préservée, insuffisance rénale chronique, bronchopneumopathie chronique obstructive, embolie pulmonaire, accident vasculaire cérébral ischémique, accident ischémique transitoire, maladie d'Alzheimer, syndrome démentiel, trouble anxio-dépressif, dénutrition protéino-énergétique, ostéoporose, glaucome, appendicectomie, prothèse totale de hanche, prothèse totale de genou bilatérale, hémorragie digestive à type de rectorragie, néoplasie rectale, allergie à la pénicilline.",
  examen_clinique:
    "Patiente réévaluée ce jour, état général stationnaire, pas de plainte particulière. Fébricule relevé par l'équipe soignante. Auscultation pulmonaire retrouvant des râles bronchiques de type ronchi aux deux champs pulmonaires, quelques crépitants des bases, sibilants expiratoires, sans foyer systématisé. Contexte de toux et d'encombrement bronchique modéré. Désaturation inférieure à 90 % en air ambiant, remontant à 94 % sous 3 litres d'oxygène. Auscultation cardiopulmonaire normale, absence d'œdème des membres inférieurs.",
  suivi_evolution:
    "Patiente vue ce jour. Pas de plainte particulière, pas d'hyperthermie, état clinique stationnaire par rapport au dernier examen. Il persiste quelques râles bronchiques diffus aux deux champs pulmonaires, sans encombrement bronchique associé. Notion de toux isolée, non fébrile, sans aggravation de l'altération de l'état général. Prescription de biologie standard avec PCR multiplex virale, ECBU et hémocultures. Conclusion : tableau probable de pneumopathie nosocomiale chez une patiente fragile. Initiation d'une céphalosporine de troisième génération, réévaluation à 48-72 heures.",
  traitement:
    "Traitement habituel du domicile : Indapamide 1,5 mg, un comprimé par jour. Irbésartan 150 mg, un comprimé par jour. Atorvastatine 10 mg, un comprimé le soir. Kardégic 75 mg, un comprimé par jour. Bêtahistine 24 mg, un comprimé deux fois par jour. Alprazolam 0,25 mg, un comprimé au coucher. Traitement d'entrée : Pantoprazole 20 mg, un comprimé le soir, per os. Apixaban 5 mg, un comprimé matin et soir. Furosémide 40 mg, un comprimé le matin. Diffu-K 600 mg, une gélule matin, midi et soir. Fungizone suspension buvable, une cuillère-mesure trois fois par jour.",
  conciliation_entree:
    "Traitement habituel du domicile : Indapamide 1,5 mg, un comprimé par jour. Irbésartan 150 mg, un comprimé par jour. Atorvastatine 10 mg, un comprimé le soir. Kardégic 75 mg, un comprimé par jour. Bêtahistine 24 mg, un comprimé deux fois par jour. Alprazolam 0,25 mg, un comprimé au coucher. Traitement d'entrée : Pantoprazole 20 mg, un comprimé le soir, per os. Apixaban 5 mg, un comprimé matin et soir. Furosémide 40 mg, un comprimé le matin. Diffu-K 600 mg, une gélule matin, midi et soir. Fungizone suspension buvable, une cuillère-mesure trois fois par jour.",
  conciliation_sortie:
    "Traitement habituel du domicile : Indapamide 1,5 mg, un comprimé par jour. Irbésartan 150 mg, un comprimé par jour. Atorvastatine 10 mg, un comprimé le soir. Kardégic 75 mg, un comprimé par jour. Bêtahistine 24 mg, un comprimé deux fois par jour. Alprazolam 0,25 mg, un comprimé au coucher. Traitement d'entrée : Pantoprazole 20 mg, un comprimé le soir, per os. Apixaban 5 mg, un comprimé matin et soir. Furosémide 40 mg, un comprimé le matin. Diffu-K 600 mg, une gélule matin, midi et soir. Fungizone suspension buvable, une cuillère-mesure trois fois par jour.",
  correspondance:
    "Je sollicite votre avis en cardiologie concernant votre patiente suivie pour une insuffisance cardiaque. Patiente de 94 ans, adressée par le service de médecine du centre hospitalier de Denain pour suite de prise en charge et convalescence au décours d'une hémorragie digestive à type de rectorragie, sur suspicion de néoplasie rectale. Antécédents : hypertension artérielle traitée par Kardégic 75 mg, Atorvastatine 10 mg le soir, diabète de type 2, fibrillation atriale sous Apixaban 5 mg matin et soir. Auscultation cardiopulmonaire normale, absence de signe de décompensation.",
  orthopedie: ORTHOPEDIC_PROMPT,
  general: GENERIC_PROMPT,
};

export function normalizeDictationField(value: unknown): DictationField {
  const raw = String(value ?? "").toLowerCase();
  if (/ant[eé]c[eé]dent|allerg/.test(raw)) return "antecedents";
  if (/suivi|[eé]volution|transmission|note quotidienne|r[eé][eé]valuation|observation du jour|visite/.test(raw)) {
    return "suivi_evolution";
  }
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

export function normalizeDictationTranscription(raw: string): string {
  let text = raw ?? "";

  text = text.replace(/\u00A0/g, " ").replace(/\r\n?/g, "\n");
  text = text.replace(/\s*\bdeux[\s-]points?\b\s*[.,;:]*/gi, " : ");
  text = text.replace(
    /\s*\b(virgule|point[\s-]virgule|point final|point d'interrogation|point d'exclamation)\b\s*(?=[.,;:!?])/gi,
    ""
  );
  text = text.replace(/\s*\bpoint\b\s*\.?\s+(?=[A-ZÀ-Þ])/g, ". ");
  text = text.replace(/\s*([,;:.!?])(?:\s*[,;:.!?])+/g, (match) => {
    if (/[!?]/.test(match)) return match.match(/[!?]/)?.[0] ?? ".";
    if (/\./.test(match)) return ".";
    if (/:/.test(match)) return "\u00A0:";
    if (/;/.test(match)) return "\u00A0;";
    return ",";
  });
  text = text.replace(/\s+([,.])/g, "$1");
  text = text.replace(/\s*([;:!?])/g, "\u00A0$1");
  text = text.replace(/(\d)\s*%/g, "$1\u00A0%");
  text = text.replace(/([,.;:!?])(?![\s\d])/g, "$1 ");
  text = text.replace(/«\s*/g, "«\u00A0").replace(/\s*»/g, "\u00A0»");
  text = text.replace(/([.!?]\s+)([a-zà-ÿ])/g, (_, prefix: string, char: string) => prefix + char.toUpperCase());
  text = text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  if (text) text = text.charAt(0).toUpperCase() + text.slice(1);
  if (text && !/[.!?…]$/.test(text)) text += ".";

  return text;
}

export function buildDictationCorrectionSystemPrompt(field: DictationField): string {
  const context = FIELD_PROMPTS[field] ?? GENERIC_PROMPT;
  return `Tu es le correcteur de transcription de dictée médicale de MEDACTIO. Tu reçois une transcription vocale française déjà normalisée typographiquement. Tu produis un texte sans aucune faute de français, sans jamais modifier le contenu clinique.

PRINCIPE ABSOLU — CONTENU
Le contenu clinique est la propriété du praticien. Tu n'ajoutes, ne supprimes et ne reformules aucun élément de sens. Tu ne résumes pas, tu ne raccourcis pas, tu n'améliores pas le style, tu ne réordonnes pas les phrases. Tu corriges la forme.
Il est strictement interdit d'introduire un diagnostic, une valeur, une posologie, une durée, un médicament, un examen ou une conduite à tenir qui ne figure pas dans la source.

R1 — PONCTUATION
1. Supprime tout résidu de commande vocale de ponctuation encore présent : les mots "point", "virgule", "deux points", "point-virgule" employés comme commande, et non comme terme clinique. Attention : "point de côté", "point de ponction", "deux points de suture", "un virgule cinq" sont du CONTENU, à conserver.
2. Supprime toute ponctuation redondante ou orpheline restante.
3. Arbitre virgule / point selon la syntaxe : deux propositions indépendantes, chacune avec son verbe ou constituant une énumération sémiologique autonome, sont séparées par un POINT, et la suivante commence par une majuscule.
4. Les mots "Conclusion", "Au total", "Synthèse", "Conduite à tenir", "Motif" en tête d'énoncé sont suivis de deux points, jamais d'un point.
5. Typographie française : espace insécable avant ; : ! ? et avant %. Pas d'espace avant , et . Espace après chaque signe.
6. Chaque phrase commence par une majuscule et le texte se termine par un point.

R2 — ORTHOGRAPHE ET MOTS INEXISTANTS
Aucun mot du texte final ne peut être absent du français ou du vocabulaire médical français. Si la transcription contient une suite de lettres qui n'est pas un mot, identifie le mot réellement prononcé par proximité phonétique ET cohérence de la phrase. Si les deux conditions ne sont pas réunies, applique R7.

R3 — GRAMMAIRE, ACCORDS, CONJUGAISON
1. Genre du patient : détermine-le par cohérence interne sur l'ENSEMBLE du texte. Retiens la forme MAJORITAIRE et accorde tout le texte dessus. Si aucune majorité ne se dégage, ne touche à aucun accord de genre et signale "[genre du patient à vérifier]" en fin de texte.
2. Nombre : "chez patientes fragiles" -> "chez une patiente fragile" si le texte ne concerne qu'un seul patient.
3. Conjugaison : corrige les formes verbales phonétiquement voisines mais grammaticalement impossibles. Les confusions typiques de la dictée sont -ant / -ons / -er / -é : "remontons à 94 %" -> "remontant à 94 %", "excluer une infection" -> "excluant une infection".
4. Élisions, liaisons parasites, articles manquants : "Prescription biologie standard" -> "Prescription de biologie standard". "PCR multiplex virale à ECBU" -> "PCR multiplex virale, ECBU".

R4 — TERMINOLOGIE MÉDICALE
Corrige un terme médical uniquement si le contexte permet d'identifier le mot prononcé sans ambiguïté. Confusions phonétiques à corriger systématiquement lorsqu'elles apparaissent en contexte cohérent :
branchique, branchiques -> bronchique, bronchiques
Rankine, Ranqui, ronqui, ronki -> ronchi
tout en contexte respiratoire -> toux
rectoragie -> rectorragie
hémoragie -> hémorragie
crépitement -> crépitants, dans "râles crépitants"
civilant, sibillant -> sibilant
dispnée -> dyspnée
api rétique -> apyrétique
hémo culture -> hémoculture
incomprimé, decomprimé -> un comprimé
escare -> escarre
pneumopatie -> pneumopathie

R5 — MÉDICAMENTS
Si un nom de médicament déformé correspond par proximité phonétique à une spécialité réelle ET que le dosage ou la forme galénique dictés sont cohérents avec elle, corrige-le. Si l'une des deux conditions manque, applique R7. Ne modifie jamais un dosage, une unité, une fréquence ou une durée.

R6 — NOMS PROPRES ET ÉTABLISSEMENTS
Les noms de villes, d'établissements et de correspondants figurant dans le contexte lexical fourni font autorité : si la transcription contient une forme phonétiquement proche de l'un d'eux, corrige-la. Exemple, si le contexte mentionne "centre hospitalier de Denain" : "centre hospitalier de Nain" -> "centre hospitalier de Denain". Un nom propre absent du contexte et non identifiable relève de R7.

R7 — AMBIGUÏTÉ
Quand un terme reste incertain, conserve la forme entendue encadrée ainsi : [terme incertain : forme entendue]. Ne devine jamais.

R8 — NOMBRES ET UNITÉS
Les nombres dictés en toutes lettres dans une posologie ou une mesure sont écrits en chiffres, avec la virgule décimale française et l'espace insécable avant l'unité : "un virgule cinq milligrammes" -> "1,5 mg" ; "trois litres d'oxygène" -> "3 litres d'oxygène" ; "quatre-vingt-dix pour cent" -> "90 %". Les âges restent en chiffres. Ne convertis, n'arrondis et ne recalcule jamais une valeur.

SORTIE
Retourne uniquement un JSON valide, sans balise markdown, sans commentaire.

Contexte lexical du champ en cours de dictée, à utiliser exclusivement comme aide orthographique et comme référentiel de noms propres :
${context}`;
}
