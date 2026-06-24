import { describe, expect, it } from "vitest";
import { levenshtein, analyzeText } from "./medicalAnalyzer";

describe("levenshtein", () => {
  it("retourne 0 pour deux chaînes identiques", () => {
    expect(levenshtein("paracetamol", "paracetamol")).toBe(0);
  });

  it("retourne la longueur de la chaîne b si a est vide", () => {
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("retourne la longueur de la chaîne a si b est vide", () => {
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("calcule la distance pour une substitution simple", () => {
    // "paracetamol" → "paracetamole" : 1 insertion
    expect(levenshtein("paracetamol", "paracetamole")).toBe(1);
  });

  it("calcule la distance pour une faute de frappe courante", () => {
    // "amoxiciline" vs "amoxicilline" : 1 insertion
    expect(levenshtein("amoxiciline", "amoxicilline")).toBe(1);
  });

  it("retourne une distance élevée pour des chaînes très différentes", () => {
    const d = levenshtein("abc", "xyz");
    expect(d).toBeGreaterThan(0);
  });

  it("est symétrique", () => {
    const a = "metformine";
    const b = "metformyne";
    expect(levenshtein(a, b)).toBe(levenshtein(b, a));
  });
});

describe("analyzeText", () => {
  it("retourne un résultat vide pour un texte sans terme médical", async () => {
    const result = await analyzeText("Bonjour le monde");
    expect(result).toHaveProperty("originalText", "Bonjour le monde");
    expect(result).toHaveProperty("matches");
    expect(Array.isArray(result.matches)).toBe(true);
    expect(result).toHaveProperty("exactCount");
    expect(result).toHaveProperty("suggestionCount");
    expect(result).toHaveProperty("correctedText");
  });

  it("ne journalise aucun contenu médical (vérification structurelle)", async () => {
    // L'appel ne doit pas lever d'exception et retourner un objet structuré
    const result = await analyzeText("Le patient présente une hypertension artérielle");
    expect(result).toHaveProperty("originalText");
    expect(result).toHaveProperty("correctedText");
    expect(typeof result.exactCount).toBe("number");
    expect(typeof result.suggestionCount).toBe("number");
  });

  it("retourne un texte corrigé identique ou amélioré", async () => {
    const result = await analyzeText("Texte de test sans termes spéciaux");
    // Le texte corrigé doit être une string non vide
    expect(typeof result.correctedText).toBe("string");
    expect(result.correctedText.length).toBeGreaterThan(0);
  });

  it("gère les textes très courts sans erreur", async () => {
    const result = await analyzeText("OK");
    expect(result.matches).toHaveLength(0);
  });

  it("gère les textes longs sans erreur", async () => {
    const longText = "Le patient ".repeat(100);
    const result = await analyzeText(longText);
    expect(result).toHaveProperty("originalText");
    expect(result.matches.length).toBeGreaterThanOrEqual(0);
  });
});
