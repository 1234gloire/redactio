import { describe, expect, it } from "vitest";
import { hasUsableExtractedText } from "./fileExtraction";

describe("hasUsableExtractedText", () => {
  it("rejects page markers as usable PDF text", () => {
    expect(hasUsableExtractedText("-- 1 of 2 --\n\n-- 2 of 2 --")).toBe(false);
  });

  it("accepts medical report text as usable PDF text", () => {
    expect(
      hasUsableExtractedText(
        "Indication : suspicion d'AVC sylvien.\nRésultat : Pas de saignement intracrânien ni de syndrome de masse."
      )
    ).toBe(true);
  });
});
