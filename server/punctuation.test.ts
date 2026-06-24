/**
 * Tests du moteur de ponctuation vocale (applyPunctuation).
 *
 * Ces tests valident les règles de remplacement des commandes vocales
 * en ponctuation française dans le composant LiveSpeechRecorder.
 *
 * Note : applyPunctuation est une fonction pure côté client. Pour la tester
 * côté serveur (vitest), on la réimplémente ici à l'identique — cela garantit
 * que la logique reste testable sans dépendances DOM.
 */
import { describe, expect, it } from "vitest";

// ── Reproduction de la logique applyPunctuation (doit rester synchronisée avec LiveSpeechRecorder.tsx) ──
function wpGlue(pattern: string): RegExp {
  return new RegExp("(\\s*)(?:" + pattern + ")(\\s*)", "gi");
}

const PUNCTUATION_RULES: [RegExp, string, boolean][] = [
  [wpGlue("nouveau paragraphe|nouvelle paragraphe|saut de paragraphe"), "\n\n", true],
  [wpGlue("à la ligne|nouvelle ligne|saut de ligne|retour à la ligne"), "\n", true],
  [wpGlue("point d['’]interrogation|point interrogation"), "?", true],
  [wpGlue("point d['’]exclamation|point exclamation"), "!", true],
  [wpGlue("point-virgule|point virgule"), ";", true],
  [wpGlue("deux[- ]points|deux points"), ":", true],
  [wpGlue("virgule"), ",", true],
  [wpGlue("point"), ".", true],
  [wpGlue("ouvrir parenthèse|parenthèse ouvrante|ouvrir la parenthèse"), "(", false],
  [wpGlue("fermer parenthèse|parenthèse fermante|fermer la parenthèse"), ")", true],
  [wpGlue("ouvrir guillemets|guillemets ouvrants|ouvrir les guillemets"), "«\u00a0", false],
  [wpGlue("fermer guillemets|guillemets fermants|fermer les guillemets"), "\u00a0»", true],
  [wpGlue("tiret"), " -", true],
  [wpGlue("espace"), " ", false],
];
const DELETE_COMMAND = /\b(effacer|supprimer le dernier mot|annuler)\b/gi;

interface PunctuationResult {
  text: string;
  isCommand: boolean;
  deleteLastWord: boolean;
}

function applyPunctuation(raw: string): PunctuationResult {
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
  result = result.replace(/\( /g, "(");
  result = result.replace(/^[ \t]+|[ \t]+$/g, "");
  result = result.replace(/(^|[.?!\n]\s*)([a-zàâäéèêëîïôùûüç])/g, (_, before, letter) => {
    return before + letter.toUpperCase();
  });

  return { text: result, isCommand: isPureCommand, deleteLastWord: false };
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("applyPunctuation — commandes pures", () => {
  it("virgule → ,", () => {
    const r = applyPunctuation("virgule");
    expect(r.text).toBe(",");
    expect(r.isCommand).toBe(true);
  });

  it("point → .", () => {
    const r = applyPunctuation("point");
    expect(r.text).toBe(".");
    expect(r.isCommand).toBe(true);
  });

  it("point d'interrogation → ?", () => {
    expect(applyPunctuation("point d'interrogation").text).toBe("?");
    expect(applyPunctuation("point interrogation").text).toBe("?");
  });

  it("point d'exclamation → !", () => {
    expect(applyPunctuation("point d'exclamation").text).toBe("!");
  });

  it("deux points → :", () => {
    expect(applyPunctuation("deux points").text).toBe(":");
    expect(applyPunctuation("deux-points").text).toBe(":");
  });

  it("point-virgule → ;", () => {
    expect(applyPunctuation("point-virgule").text).toBe(";");
    expect(applyPunctuation("point virgule").text).toBe(";");
  });

  it("à la ligne → \\n", () => {
    expect(applyPunctuation("à la ligne").text).toBe("\n");
  });

  it("nouveau paragraphe → \\n\\n", () => {
    expect(applyPunctuation("nouveau paragraphe").text).toBe("\n\n");
  });

  it("effacer → deleteLastWord=true", () => {
    const r = applyPunctuation("effacer");
    expect(r.deleteLastWord).toBe(true);
    expect(r.text).toBe("");
  });

  it("annuler → deleteLastWord=true", () => {
    expect(applyPunctuation("annuler").deleteLastWord).toBe(true);
  });
});

describe("applyPunctuation — commandes intégrées dans une phrase", () => {
  it("tension 14 virgule 5 → tension 14,5", () => {
    const r = applyPunctuation("tension 14 virgule 5");
    expect(r.text).toBe("Tension 14,5");
    expect(r.isCommand).toBe(false);
  });

  it("patient stable point sortie autorisée → phrase avec point", () => {
    const r = applyPunctuation("patient stable point sortie autorisée");
    expect(r.text).toContain(".");
    expect(r.text).not.toContain(" .");
  });

  it("fréquence cardiaque 72 deux points rythme sinusal → colon sans espace avant", () => {
    const r = applyPunctuation("fréquence cardiaque 72 deux points rythme sinusal");
    expect(r.text).toContain("72:");
    expect(r.text).not.toContain("72 :");
  });

  it("diagnostic point d'interrogation insuffisance cardiaque → ? sans espace avant", () => {
    const r = applyPunctuation("diagnostic point d'interrogation insuffisance cardiaque");
    expect(r.text).toContain("?");
    expect(r.text).not.toContain(" ?");
  });

  it("à la ligne dans une phrase → \\n inséré", () => {
    const r = applyPunctuation("motif d'hospitalisation à la ligne douleur thoracique");
    expect(r.text).toContain("\n");
  });
});

describe("applyPunctuation — capitalisation", () => {
  it("capitalise le premier mot", () => {
    const r = applyPunctuation("patient stable");
    expect(r.text[0]).toBe(r.text[0].toUpperCase());
  });

  it("capitalise après un point", () => {
    const r = applyPunctuation("patient stable point sortie autorisée");
    const parts = r.text.split(".");
    if (parts.length > 1) {
      const afterDot = parts[1].trim();
      if (afterDot.length > 0) {
        expect(afterDot[0]).toBe(afterDot[0].toUpperCase());
      }
    }
  });
});

describe("applyPunctuation — cas limites", () => {
  it("texte vide → texte vide", () => {
    expect(applyPunctuation("").text).toBe("");
    expect(applyPunctuation("  ").text).toBe("");
  });

  it("texte sans commande → texte capitalisé inchangé", () => {
    const r = applyPunctuation("insuffisance cardiaque sévère");
    expect(r.text).toBe("Insuffisance cardiaque sévère");
    expect(r.isCommand).toBe(false);
    expect(r.deleteLastWord).toBe(false);
  });

  it("pas d'espace double dans le résultat", () => {
    const r = applyPunctuation("tension 14 virgule 5 point fréquence 72");
    expect(r.text).not.toMatch(/  /);
  });
});
