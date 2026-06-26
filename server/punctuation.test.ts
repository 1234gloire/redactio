/**
 * Tests du moteur de ponctuation vocale (applyVoicePunctuation).
 *
 * Ces tests valident les règles de remplacement des commandes vocales
 * en ponctuation française dans les composants de dictée.
 */
import { applyVoicePunctuation } from "../client/src/lib/voicePunctuation";
import { describe, expect, it } from "vitest";

// ── Tests ──────────────────────────────────────────────────────────────────
describe("applyVoicePunctuation — commandes pures", () => {
  it("virgule → ,", () => {
    const r = applyVoicePunctuation("virgule");
    expect(r.text).toBe(",");
    expect(r.isCommand).toBe(true);
  });

  it("point → .", () => {
    const r = applyVoicePunctuation("point");
    expect(r.text).toBe(".");
    expect(r.isCommand).toBe(true);
  });

  it("point d'interrogation → ?", () => {
    expect(applyVoicePunctuation("point d'interrogation").text).toBe("?");
    expect(applyVoicePunctuation("point d interrogation").text).toBe("?");
    expect(applyVoicePunctuation("point interrogation").text).toBe("?");
  });

  it("point d'exclamation → !", () => {
    expect(applyVoicePunctuation("point d'exclamation").text).toBe("!");
    expect(applyVoicePunctuation("point d exclamation").text).toBe("!");
  });

  it("deux points → :", () => {
    expect(applyVoicePunctuation("deux points").text).toBe(":");
    expect(applyVoicePunctuation("deux-points").text).toBe(":");
  });

  it("point-virgule → ;", () => {
    expect(applyVoicePunctuation("point-virgule").text).toBe(";");
    expect(applyVoicePunctuation("point virgule").text).toBe(";");
  });

  it("à la ligne → \\n", () => {
    expect(applyVoicePunctuation("à la ligne").text).toBe("\n");
    expect(applyVoicePunctuation("a la ligne").text).toBe("\n");
  });

  it("nouveau paragraphe → \\n\\n", () => {
    expect(applyVoicePunctuation("nouveau paragraphe").text).toBe("\n\n");
  });

  it("effacer → deleteLastWord=true", () => {
    const r = applyVoicePunctuation("effacer");
    expect(r.deleteLastWord).toBe(true);
    expect(r.text).toBe("");
  });

  it("annuler → deleteLastWord=true", () => {
    expect(applyVoicePunctuation("annuler").deleteLastWord).toBe(true);
  });
});

describe("applyVoicePunctuation — commandes intégrées dans une phrase", () => {
  it("tension 14 virgule 5 → tension 14,5", () => {
    const r = applyVoicePunctuation("tension 14 virgule 5");
    expect(r.text).toBe("Tension 14,5");
    expect(r.isCommand).toBe(false);
  });

  it("patient stable point sortie autorisée → phrase avec point", () => {
    const r = applyVoicePunctuation("patient stable point sortie autorisée");
    expect(r.text).toBe("Patient stable. Sortie autorisée");
    expect(r.text).not.toContain(" .");
  });

  it("patient stable point à la ligne sortie autorisée → point puis nouvelle ligne", () => {
    const r = applyVoicePunctuation("patient stable point à la ligne sortie autorisée");
    expect(r.text).toBe("Patient stable.\nSortie autorisée");
  });

  it("fréquence cardiaque 72 deux points rythme sinusal → colon sans espace avant", () => {
    const r = applyVoicePunctuation("fréquence cardiaque 72 deux points rythme sinusal");
    expect(r.text).toContain("72:");
    expect(r.text).not.toContain("72 :");
  });

  it("diagnostic point d'interrogation insuffisance cardiaque → ? sans espace avant", () => {
    const r = applyVoicePunctuation("diagnostic point d'interrogation insuffisance cardiaque");
    expect(r.text).toContain("?");
    expect(r.text).not.toContain(" ?");
  });

  it("à la ligne dans une phrase → \\n inséré", () => {
    const r = applyVoicePunctuation("motif d'hospitalisation à la ligne douleur thoracique");
    expect(r.text).toContain("\n");
  });
});

describe("applyVoicePunctuation — capitalisation", () => {
  it("capitalise le premier mot", () => {
    const r = applyVoicePunctuation("patient stable");
    expect(r.text[0]).toBe(r.text[0].toUpperCase());
  });

  it("capitalise après un point", () => {
    const r = applyVoicePunctuation("patient stable point sortie autorisée");
    const parts = r.text.split(".");
    if (parts.length > 1) {
      const afterDot = parts[1].trim();
      if (afterDot.length > 0) {
        expect(afterDot[0]).toBe(afterDot[0].toUpperCase());
      }
    }
  });
});

describe("applyVoicePunctuation — cas limites", () => {
  it("texte vide → texte vide", () => {
    expect(applyVoicePunctuation("").text).toBe("");
    expect(applyVoicePunctuation("  ").text).toBe("");
  });

  it("texte sans commande → texte capitalisé inchangé", () => {
    const r = applyVoicePunctuation("insuffisance cardiaque sévère");
    expect(r.text).toBe("Insuffisance cardiaque sévère");
    expect(r.isCommand).toBe(false);
    expect(r.deleteLastWord).toBe(false);
  });

  it("pas d'espace double dans le résultat", () => {
    const r = applyVoicePunctuation("tension 14 virgule 5 point fréquence 72");
    expect(r.text).not.toMatch(/  /);
  });
});
