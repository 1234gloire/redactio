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

  it("deux point (singulier, sans 's' final) → :", () => {
    // Le "s" final de "points" est muet en français — la reconnaissance vocale
    // le transcrit souvent au singulier ; la commande doit rester reconnue.
    expect(applyVoicePunctuation("deux point").text).toBe(":");
    expect(applyVoicePunctuation("deux-point").text).toBe(":");
  });

  it("ouvrir/fermer guillemet (singulier) → « / »", () => {
    expect(applyVoicePunctuation("ouvrir guillemet").text).toContain("«");
    expect(applyVoicePunctuation("fermer guillemet").text).toContain("»");
  });

  it("point-virgule → ;", () => {
    expect(applyVoicePunctuation("point-virgule").text).toBe(";");
    expect(applyVoicePunctuation("point virgule").text).toBe(";");
  });

  it("points de suspension → …", () => {
    expect(applyVoicePunctuation("points de suspension").text).toBe("…");
    expect(applyVoicePunctuation("trois points").text).toBe("…");
  });

  it("crochets → [ / ]", () => {
    expect(applyVoicePunctuation("ouvrir crochet").text).toBe("[");
    expect(applyVoicePunctuation("fermer crochet").text).toBe("]");
  });

  it("slash / barre oblique → /", () => {
    expect(applyVoicePunctuation("slash").text).toBe("/");
    expect(applyVoicePunctuation("barre oblique").text).toBe("/");
  });

  it("trait d'union et apostrophe", () => {
    expect(applyVoicePunctuation("trait d'union").text).toBe("-");
    expect(applyVoicePunctuation("apostrophe").text).toBe("’");
  });

  it("symboles numériques explicites", () => {
    expect(applyVoicePunctuation("pour cent").text).toBe("%");
    expect(applyVoicePunctuation("plus ou moins").text).toBe("±");
    expect(applyVoicePunctuation("signe plus").text).toBe("+");
    expect(applyVoicePunctuation("signe moins").text).toBe("-");
    expect(applyVoicePunctuation("signe inférieur").text).toBe("<");
    expect(applyVoicePunctuation("signe supérieur").text).toBe(">");
    expect(applyVoicePunctuation("signe égal").text).toBe("=");
    expect(applyVoicePunctuation("inférieur ou égal").text).toBe("≤");
    expect(applyVoicePunctuation("supérieur ou égal").text).toBe("≥");
  });

  it("à la ligne → \\n", () => {
    expect(applyVoicePunctuation("à la ligne").text).toBe("\n");
    expect(applyVoicePunctuation("a la ligne").text).toBe("\n");
    expect(applyVoicePunctuation("retour à la ligne").text).toBe("\n");
    expect(applyVoicePunctuation("retourne à la ligne").text).toBe("\n");
    expect(applyVoicePunctuation("aller à la ligne").text).toBe("\n");
    expect(applyVoicePunctuation("passer à la ligne").text).toBe("\n");
    expect(applyVoicePunctuation("ligne suivante").text).toBe("\n");
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

  it("patient stable point retour à la ligne sortie autorisée → point puis nouvelle ligne", () => {
    const r = applyVoicePunctuation("patient stable point retour à la ligne sortie autorisée");
    expect(r.text).toBe("Patient stable.\nSortie autorisée");
  });

  it("patient stable retourne à la ligne sortie autorisée → nouvelle ligne", () => {
    const r = applyVoicePunctuation("patient stable retourne à la ligne sortie autorisée");
    expect(r.text).toBe("Patient stable\nSortie autorisée");
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

  it("TA 12 barre oblique 8 et saturation 95 pour cent → signes collés", () => {
    const r = applyVoicePunctuation("TA 12 barre oblique 8 saturation 95 pour cent");
    expect(r.text).toBe("TA 12/8 saturation 95%");
  });

  it("anti trait d'union inflammatoire et l apostrophe patient → signes typographiques", () => {
    const r = applyVoicePunctuation("anti trait d'union inflammatoire et l apostrophe patient");
    expect(r.text).toBe("Anti-inflammatoire et l’patient");
  });

  it("CRP signe inférieur 5 et tolérance plus ou moins correcte → comparateurs", () => {
    const r = applyVoicePunctuation("CRP signe inférieur 5 et tolérance plus ou moins correcte");
    expect(r.text).toBe("CRP<5 et tolérance±correcte");
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
