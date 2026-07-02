export interface VoicePunctuationResult {
  text: string;
  isCommand: boolean;
  deleteLastWord: boolean;
}

function wpGlue(pattern: string): RegExp {
  return new RegExp("(\\s*)(?:" + pattern + ")(\\s*)", "gi");
}

const PUNCTUATION_RULES: [RegExp, string, boolean][] = [
  [wpGlue("point (?:à|a) la ligne|point retour(?:ne)? (?:à|a) la ligne|point nouvelle ligne|point ligne suivante"), ".\n", true],
  [wpGlue("point nouveau paragraphe|point nouvelle paragraphe|point saut de paragraphe|point paragraphe suivant"), ".\n\n", true],
  [wpGlue("nouveau paragraphe|nouvelle paragraphe|saut de paragraphe|paragraphe suivant|aller au paragraphe|passer au paragraphe"), "\n\n", true],
  [wpGlue("(?:à|a) la ligne|nouvelle ligne|saut de ligne|retour(?:ne)? (?:à|a) la ligne|retour ligne|aller (?:à|a) la ligne|passer (?:à|a) la ligne|ligne suivante|va (?:à|a) la ligne"), "\n", true],
  [wpGlue("point d['’ ]interrogation|point interrogation"), "?", true],
  [wpGlue("point d['’ ]exclamation|point exclamation"), "!", true],
  [wpGlue("point-virgule|point virgule"), ";", true],
  [wpGlue("deux[- ]?points?"), ":", true],
  [wpGlue("virgule"), ",", true],
  [wpGlue("point final|point"), ".", true],
  [wpGlue("ouvrir parenthèse|ouvrir parenthese|parenthèse ouvrante|parenthese ouvrante|ouvrir la parenthèse|ouvrir la parenthese"), "(", false],
  [wpGlue("fermer parenthèse|fermer parenthese|parenthèse fermante|parenthese fermante|fermer la parenthèse|fermer la parenthese"), ")", true],
  [wpGlue("ouvrir guillemets?|guillemets? ouvrants?|ouvrir les guillemets?"), "«\u00a0", false],
  [wpGlue("fermer guillemets?|guillemets? fermants?|fermer les guillemets?"), "\u00a0»", true],
  [wpGlue("tiret"), " -", true],
  [wpGlue("espace"), " ", false],
];

const DELETE_COMMAND = /\b(effacer|supprimer le dernier mot|annuler)\b/gi;

export function applyVoicePunctuation(raw: string): VoicePunctuationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { text: "", isCommand: false, deleteLastWord: false };

  if (DELETE_COMMAND.test(trimmed)) {
    DELETE_COMMAND.lastIndex = 0;
    return { text: "", isCommand: true, deleteLastWord: true };
  }
  DELETE_COMMAND.lastIndex = 0;

  let isPureCommand = false;
  for (const [pattern] of PUNCTUATION_RULES) {
    pattern.lastIndex = 0;
    const match = trimmed.match(pattern);
    if (match && match[0].trim().toLowerCase() === trimmed.toLowerCase()) {
      isPureCommand = true;
      break;
    }
    pattern.lastIndex = 0;
  }

  let result = trimmed;
  for (const [pattern, replacement, glueLeft] of PUNCTUATION_RULES) {
    pattern.lastIndex = 0;
    if (glueLeft) {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, (_match, _before, _after) => " " + replacement);
    }
    pattern.lastIndex = 0;
  }

  result = result.replace(/[ \t]{2,}/g, " ");
  result = result.replace(/ ([,.:;?!)])/g, "$1");
  result = result.replace(/([.:;?!])(?=\S)/g, "$1 ");
  result = result.replace(/\( /g, "(");
  result = result.replace(/^[ \t]+|[ \t]+$/g, "");
  result = result.replace(/(^|[.?!\n]\s*)([a-zàâäéèêëîïôùûüç])/g, (_, before, letter) => {
    return before + letter.toUpperCase();
  });

  return { text: result, isCommand: isPureCommand, deleteLastWord: false };
}
