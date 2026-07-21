import { describe, expect, it } from "vitest";
import { buildWhisperMedicalPrompt, normalizeDictationField } from "./dictationMedicalContext";

describe("dictationMedicalContext", () => {
  it("sélectionne le contexte traitement pour les champs médicamenteux", () => {
    expect(normalizeDictationField("Traitement en cours")).toBe("traitement");
    expect(buildWhisperMedicalPrompt("traitement")).toContain("Kardégic");
  });

  it("distingue les traitements d'entrée et de sortie en conciliation", () => {
    expect(normalizeDictationField("Traitement d'entrée")).toBe("conciliation_entree");
    expect(normalizeDictationField("Traitement de sortie")).toBe("conciliation_sortie");
  });

  it("retombe sur un contexte général pour un champ inconnu", () => {
    expect(normalizeDictationField("Données médicales brutes")).toBe("general");
    expect(buildWhisperMedicalPrompt("general")).toContain("Dictée médicale en français");
  });
});
