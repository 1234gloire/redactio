/**
 * FILTRE DE PSEUDONYMISATION — Composant critique MEDACTIO
 *
 * EXG-PSE-01 [BLOQUANT] : Filtre synchrone appliqué en sortie avant retour utilisateur.
 * EXG-PSE-02 [BLOQUANT] : Traitement en mémoire uniquement — aucune persistance.
 * EXG-PSE-04 [MAJEUR]   : Privilégie le rappel (ne rien laisser passer) sur la précision.
 *
 * Ce module ne doit jamais être importé côté client.
 * Il ne doit jamais écrire dans un log, une base, ou un fichier.
 */

export interface PseudonymisationResult {
  /** Texte avec tous les identifiants masqués */
  filteredText: string;
  /** Nombre de masquages effectués */
  maskCount: number;
  /** Types de masquages détectés (pour signalement au praticien) */
  detectedCategories: string[];
  /** Indicateur de sur-masquage potentiel */
  hasPotentialOvermasking: boolean;
}

// ─── Règles regex pour identifiants structurés ────────────────────────────────

const RULES: Array<{ name: string; pattern: RegExp; replacement: string }> = [
  // NIR / Numéro de sécurité sociale (15 chiffres, avec ou sans espaces/tirets)
  {
    name: "NIR",
    pattern: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
    replacement: "[NIR_MASQUÉ]",
  },
  // IPP (Identifiant Permanent Patient) — format numérique 7-12 chiffres précédé d'un label
  {
    name: "IPP",
    pattern: /\b(?:IPP|ipp|N°\s?IPP|numéro\s+patient)\s*:?\s*\d{6,12}\b/gi,
    replacement: "[IPP_MASQUÉ]",
  },
  // Numéro de séjour
  {
    name: "SEJOUR",
    pattern: /\b(?:séjour|n°\s?séjour|hospitalisation)\s*:?\s*[A-Z0-9]{6,14}\b/gi,
    replacement: "[SEJOUR_MASQUÉ]",
  },
  // Date de naissance complète (JJ/MM/AAAA, JJ-MM-AAAA, AAAA-MM-JJ).
  // Les dates de parcours de soins (entrée, intervention, sortie, RDV)
  // ne sont pas des identifiants directs et doivent rester lisibles.
  {
    name: "DATE_NAISSANCE",
    pattern:
      /\b(?:né(?:e)?\s+le|date\s+de\s+naissance|DDN|ddn)\s*:?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
    replacement: "[DATE_NAISSANCE_MASQUÉE]",
  },
  // Numéro de téléphone français (06, 07, 01-05, +33)
  {
    name: "TELEPHONE",
    pattern:
      /\b(?:\+33\s?|0033\s?)?(?:0[1-9])(?:[\s\.\-]?\d{2}){4}\b/g,
    replacement: "[TEL_MASQUÉ]",
  },
  // Adresse e-mail
  {
    name: "EMAIL",
    pattern: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
    replacement: "[EMAIL_MASQUÉ]",
  },
  // Adresse postale (numéro + rue + code postal)
  {
    name: "ADRESSE",
    pattern:
      /\b\d{1,4}(?:\s+(?:bis|ter|quater))?\s+(?:rue|avenue|boulevard|allée|impasse|chemin|place|route|voie|passage|square|résidence)\s+[^\n,;]{3,50}(?:\s*,?\s+\d{5}\s+[A-ZÀ-Ÿa-zà-ÿ\-]+)?\b/gi,
    replacement: "[ADRESSE_MASQUÉE]",
  },
  // Numéro RPPS (8 à 11 chiffres selon les sources transmises)
  {
    name: "RPPS",
    pattern: /\b(?:RPPS|rpps)\s*:?\s*\d{8,11}\b/gi,
    replacement: "[RPPS_MASQUÉ]",
  },
];

// ─── NER simplifié pour noms propres (heuristique) ────────────────────────────
// En production HDS, ce moteur serait remplacé par un modèle NER souverain.
// Cette implémentation heuristique couvre les cas les plus courants.

const FRENCH_TITLES = [
  "M\\.",
  "Mme",
  "Mme\\.",
  "Monsieur",
  "Madame",
  "Dr",
  "Dr\\.",
  "Docteur",
  "Pr",
  "Pr\\.",
  "Professeur",
];

const CONTEXT_KEYWORDS = [
  "patient",
  "patiente",
  "identité",
  "nom",
  "prénom",
  "appelé",
  "appelée",
  "concernant",
  "personne de confiance",
  "accompagnant",
  "parent",
  "conjoint",
  "époux",
  "épouse",
  "enfant",
];

const NAME_TOKEN =
  "[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ][A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇa-zàâäéèêëîïôùûüç\\-']+";
const NAME_SEQUENCE = `${NAME_TOKEN}(?:\\s+${NAME_TOKEN}){0,3}`;

/**
 * Détection NER heuristique des noms propres.
 * Le périmètre EXG-PSE-01 est volontairement strict : seuls les noms de
 * personnes ancrés par une civilité ou un libellé d'identité sont masqués.
 */
function applyNER(text: string): { result: string; count: number } {
  let result = text;
  let count = 0;

  // Pattern 1 : Titre civil suivi d'un ou plusieurs mots capitalisés
  const titlePattern = new RegExp(
    `\\b(${FRENCH_TITLES.join("|")})\\s+(${NAME_SEQUENCE})`,
    "g"
  );
  result = result.replace(titlePattern, (_match, title) => {
    count++;
    return `${title} [NOM_MASQUÉ]`;
  });

  // Pattern 2 : Contexte "patient(e) : Prénom NOM" ou "nom : NOM"
  const contextPattern = new RegExp(
    `\\b(${CONTEXT_KEYWORDS.join("|")})\\s*:?\\s+(${NAME_SEQUENCE})`,
    "gi"
  );
  result = result.replace(contextPattern, (_match, keyword) => {
    count++;
    return `${keyword} [NOM_MASQUÉ]`;
  });

  return { result, count };
}

function applyExamOutputNER(text: string): { result: string; count: number } {
  let result = text;
  let count = 0;

  const titlePattern = new RegExp(
    `\\b(${FRENCH_TITLES.join("|")})\\s+(${NAME_SEQUENCE})`,
    "g"
  );
  result = result.replace(titlePattern, (_match, title) => {
    count++;
    return `${title} [NOM_MASQUÉ]`;
  });

  const identityKeywords = [
    "patient",
    "patiente",
    "identité",
    "nom",
    "prénom",
    "appelé",
    "appelée",
  ];
  const contextPattern = new RegExp(
    `\\b(${identityKeywords.join("|")})\\s*:?\\s+(${NAME_SEQUENCE})`,
    "gi"
  );
  result = result.replace(contextPattern, (_match, keyword) => {
    count++;
    return `${keyword} [NOM_MASQUÉ]`;
  });

  return { result, count };
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Applique le filtre de pseudonymisation complet.
 *
 * INVARIANT : Cette fonction ne doit JAMAIS être appelée avec du contenu
 * déjà pseudonymisé, ni persister son entrée ou sa sortie.
 *
 * @param rawText Texte brut saisi par le praticien (en mémoire uniquement)
 * @returns Résultat de pseudonymisation (en mémoire uniquement)
 */
export function pseudonymise(rawText: string): PseudonymisationResult {
  if (!rawText || typeof rawText !== "string") {
    return {
      filteredText: "",
      maskCount: 0,
      detectedCategories: [],
      hasPotentialOvermasking: false,
    };
  }

  let text = rawText;
  let totalMaskCount = 0;
  const detectedCategories: string[] = [];

  // Étape 1 : Règles regex sur identifiants structurés
  for (const rule of RULES) {
    const before = text;
    text = text.replace(rule.pattern, rule.replacement);
    if (text !== before) {
      const matches = (before.match(rule.pattern) || []).length;
      totalMaskCount += matches;
      if (!detectedCategories.includes(rule.name)) {
        detectedCategories.push(rule.name);
      }
    }
  }

  // Étape 2 : NER heuristique pour noms propres
  const nerResult = applyNER(text);
  text = nerResult.result;
  if (nerResult.count > 0) {
    totalMaskCount += nerResult.count;
    if (!detectedCategories.includes("NOM_PROPRE")) {
      detectedCategories.push("NOM_PROPRE");
    }
  }

  // Détection de sur-masquage potentiel
  // (si plus de 20% du texte est masqué, on signale)
  const maskedTokens = (text.match(/\[[\w_]+_MASQUÉ[E]?\]/g) || []).length;
  const totalWords = rawText.split(/\s+/).length;
  const hasPotentialOvermasking = totalWords > 0 && maskedTokens / totalWords > 0.2;

  return {
    filteredText: text,
    maskCount: totalMaskCount,
    detectedCategories,
    hasPotentialOvermasking,
  };
}

/**
 * Filtre de sortie pour l'extraction d'examens.
 *
 * Contrairement au filtre général, il ne masque pas les dates génériques :
 * dans les comptes rendus paracliniques, une date peut être clinique
 * (début des symptômes, début de traitement, ancienneté d'une lésion).
 */
export function pseudonymiseExamExtractionOutput(rawText: string): PseudonymisationResult {
  if (!rawText || typeof rawText !== "string") {
    return {
      filteredText: "",
      maskCount: 0,
      detectedCategories: [],
      hasPotentialOvermasking: false,
    };
  }

  let text = rawText;
  let totalMaskCount = 0;
  const detectedCategories: string[] = [];
  const allowedRules = RULES;

  for (const rule of allowedRules) {
    const before = text;
    text = text.replace(rule.pattern, rule.replacement);
    if (text !== before) {
      const matches = (before.match(rule.pattern) || []).length;
      totalMaskCount += matches;
      if (!detectedCategories.includes(rule.name)) {
        detectedCategories.push(rule.name);
      }
    }
  }

  const nerResult = applyExamOutputNER(text);
  text = nerResult.result;
  if (nerResult.count > 0) {
    totalMaskCount += nerResult.count;
    if (!detectedCategories.includes("NOM_PROPRE")) {
      detectedCategories.push("NOM_PROPRE");
    }
  }

  const maskedTokens = (text.match(/\[[\w_]+_MASQUÉ[E]?\]/g) || []).length;
  const totalWords = rawText.split(/\s+/).length;

  return {
    filteredText: text,
    maskCount: totalMaskCount,
    detectedCategories,
    hasPotentialOvermasking: totalWords > 0 && maskedTokens / totalWords > 0.2,
  };
}

/**
 * Vérifie qu'un texte ne contient plus d'identifiants directs connus.
 * Utilisé pour la validation de la banque de tests.
 */
export function containsDirectIdentifier(text: string): boolean {
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) return true;
  }
  return false;
}

/**
 * Retourne les catégories de masquage disponibles (pour documentation).
 */
export function getMaskCategories(): string[] {
  return RULES.map((r) => r.name).concat(["NOM_PROPRE"]);
}
