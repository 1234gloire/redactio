import { describe, expect, it } from "vitest";
import {
  buildDictationCorrectionSystemPrompt,
  buildWhisperMedicalPrompt,
  normalizeDictationTranscription,
  normalizeDictationField,
} from "./dictationMedicalContext";

describe("dictationMedicalContext", () => {
  it("sélectionne le contexte traitement pour les champs médicamenteux", () => {
    expect(normalizeDictationField("Traitement en cours")).toBe("traitement");
    expect(buildWhisperMedicalPrompt("traitement")).toContain("Kardégic");
    expect(buildWhisperMedicalPrompt("traitement")).toContain("un comprimé");
    expect(buildWhisperMedicalPrompt("traitement")).toContain("Diffu-K 600 mg");
  });

  it("distingue les traitements d'entrée et de sortie en conciliation", () => {
    expect(normalizeDictationField("Traitement d'entrée")).toBe("conciliation_entree");
    expect(normalizeDictationField("Traitement de sortie")).toBe("conciliation_sortie");
  });

  it("retombe sur un contexte général pour un champ inconnu", () => {
    expect(normalizeDictationField("Données médicales brutes")).toBe("general");
    expect(buildWhisperMedicalPrompt("general")).toContain("fibrillation atriale");
  });

  it("sélectionne le contexte suivi évolution avant l'examen clinique", () => {
    expect(normalizeDictationField("Réévaluation clinique du jour")).toBe("suivi_evolution");
    expect(normalizeDictationField("Observation du jour")).toBe("suivi_evolution");
    expect(buildWhisperMedicalPrompt("suivi_evolution")).toContain("toux isolée");
  });

  it("sélectionne un biais orthopédique pour les champs de chirurgie ortho", () => {
    expect(normalizeDictationField("Type de chirurgie")).toBe("orthopedie");
    expect(normalizeDictationField("Consignes de sortie orthopédie")).toBe("orthopedie");
    expect(buildWhisperMedicalPrompt("orthopedie")).toContain("ostéosynthèse par clou gamma");
  });

  it("encadre la correction IA des noms médicamenteux phonétiques", () => {
    const prompt = buildDictationCorrectionSystemPrompt("traitement");
    expect(prompt).toContain("proximité phonétique");
    expect(prompt).toContain("dosage ou la forme galénique");
    expect(prompt).toContain("[terme incertain");
  });

  it("normalise les ponctuations parasites avant correction IA", () => {
    expect(normalizeDictationTranscription("patiente vue ce jour,. , pas de plainte particulière")).toBe(
      "Patiente vue ce jour. Pas de plainte particulière."
    );
    expect(normalizeDictationTranscription("Conclusion deux points tableau probable")).toBe(
      "Conclusion\u00A0: tableau probable."
    );
  });
});
