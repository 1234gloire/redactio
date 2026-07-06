import { describe, expect, it } from "vitest";
import { formatObservationExamBlocks, isEmptyExtractionMessage } from "./observationExamExtraction";

describe("formatObservationExamBlocks", () => {
  it("converts markdown biology tables into readable blocks", () => {
    const input = `--- EXAMEN 1 - [BIO] ---

**HÉMOGRAMME**

| Analyse | Résultat | Unité | Valeurs de [NOM_MASQUÉ] | Anomalie |
|---|---|---|---|---|
| Leucocytes | 8.94 | Giga/L | 3.80 – 10.00 | |
| CCMH | 32.0 | g/dL | 32.3 – 36.1 | ↓ |`;

    const output = formatObservationExamBlocks(input);

    expect(output).not.toContain("|---|");
    expect(output).not.toContain("| Analyse |");
    expect(output).toContain("HÉMOGRAMME");
    expect(output).toContain("- Leucocytes : résultat : 8.94 ; unité : Giga/L ; référence : 3.80 – 10.00");
    expect(output).toContain("- CCMH : résultat : 32.0 ; unité : g/dL ; référence : 32.3 – 36.1 ; anomalie : ↓");
  });

  it("detects empty extraction sentinel messages", () => {
    expect(isEmptyExtractionMessage("[DOCUMENT VIDE - aucun résultat à extraire]")).toBe(true);
    expect(isEmptyExtractionMessage("[DOCUMENT VIDE - aucun resultat a extraire]")).toBe(true);
    expect(isEmptyExtractionMessage("[DOCUMENT VIDE — aucun résultat à extraire]")).toBe(true);
    expect(isEmptyExtractionMessage("Leucocytes : 8.94 Giga/L")).toBe(false);
  });
});
