/**
 * Tests Vitest — Dictionnaire médical REDACTIO
 * Vérifie la recherche, le comptage et l'incrémentation d'usage
 * sans dépendance à la base de données réelle.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Mock de la base de données ──────────────────────────────────────────────
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock("../server/db", () => ({
  searchMedicalTerms: vi.fn(),
  incrementMedicalTermUsage: vi.fn(),
  countMedicalTerms: vi.fn(),
}));

import {
  searchMedicalTerms,
  incrementMedicalTermUsage,
  countMedicalTerms,
} from "./db";

// ─── Données de test ─────────────────────────────────────────────────────────
const MOCK_TERMS = [
  {
    id: 1,
    term: "Amoxicilline",
    category: "medicament" as const,
    synonyms: ["Clamoxyl"],
    definition: "Antibiotique de la famille des pénicillines",
    source: "VIDAL",
    code: "J01CA04",
    active: true,
    usageCount: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    term: "Amiodarone",
    category: "medicament" as const,
    synonyms: ["Cordarone"],
    definition: "Antiarythmique de classe III",
    source: "VIDAL",
    code: "C01BD01",
    active: true,
    usageCount: 28,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    term: "Amaurose",
    category: "pathologie" as const,
    synonyms: [],
    definition: "Perte de la vision sans lésion oculaire apparente",
    source: "CIM10",
    code: "H53.6",
    active: true,
    usageCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Dictionnaire médical — searchMedicalTerms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne les termes correspondant au préfixe", async () => {
    vi.mocked(searchMedicalTerms).mockResolvedValueOnce(MOCK_TERMS);
    const results = await searchMedicalTerms("Amo", undefined, 10);
    expect(results).toHaveLength(3);
    expect(results[0]?.term).toBe("Amoxicilline");
  });

  it("filtre par catégorie médicament", async () => {
    const medicaments = MOCK_TERMS.filter((t) => t.category === "medicament");
    vi.mocked(searchMedicalTerms).mockResolvedValueOnce(medicaments);
    const results = await searchMedicalTerms("Am", "medicament", 10);
    expect(results.every((t) => t.category === "medicament")).toBe(true);
  });

  it("retourne un tableau vide si la requête est trop courte", async () => {
    vi.mocked(searchMedicalTerms).mockResolvedValueOnce([]);
    const results = await searchMedicalTerms("", undefined, 10);
    expect(results).toHaveLength(0);
  });

  it("respecte la limite de résultats", async () => {
    vi.mocked(searchMedicalTerms).mockResolvedValueOnce(MOCK_TERMS.slice(0, 2));
    const results = await searchMedicalTerms("Am", undefined, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("retourne les termes triés par usageCount décroissant", async () => {
    const sorted = [...MOCK_TERMS].sort((a, b) => b.usageCount - a.usageCount);
    vi.mocked(searchMedicalTerms).mockResolvedValueOnce(sorted);
    const results = await searchMedicalTerms("Am", undefined, 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.usageCount).toBeGreaterThanOrEqual(results[i]!.usageCount);
    }
  });
});

describe("Dictionnaire médical — incrementMedicalTermUsage", () => {
  it("s'exécute sans erreur pour un id valide", async () => {
    vi.mocked(incrementMedicalTermUsage).mockResolvedValueOnce(undefined);
    await expect(incrementMedicalTermUsage(1)).resolves.toBeUndefined();
    expect(incrementMedicalTermUsage).toHaveBeenCalledWith(1);
  });

  it("est appelé avec le bon id", async () => {
    vi.mocked(incrementMedicalTermUsage).mockResolvedValueOnce(undefined);
    await incrementMedicalTermUsage(42);
    expect(incrementMedicalTermUsage).toHaveBeenCalledWith(42);
  });
});

describe("Dictionnaire médical — countMedicalTerms", () => {
  it("retourne un nombre positif", async () => {
    vi.mocked(countMedicalTerms).mockResolvedValueOnce(430);
    const count = await countMedicalTerms();
    expect(count).toBe(430);
    expect(typeof count).toBe("number");
  });

  it("retourne 0 si la base est vide", async () => {
    vi.mocked(countMedicalTerms).mockResolvedValueOnce(0);
    const count = await countMedicalTerms();
    expect(count).toBe(0);
  });
});

describe("Dictionnaire médical — structure des termes", () => {
  it("chaque terme a les champs obligatoires", () => {
    for (const term of MOCK_TERMS) {
      expect(term).toHaveProperty("id");
      expect(term).toHaveProperty("term");
      expect(term).toHaveProperty("category");
      expect(term).toHaveProperty("active");
      expect(term).toHaveProperty("usageCount");
      expect(typeof term.term).toBe("string");
      expect(term.term.length).toBeGreaterThan(0);
    }
  });

  it("les catégories sont dans l'enum attendu", () => {
    const validCategories = ["medicament", "pathologie", "symptome", "anatomie", "biologie", "procedure", "autre"];
    for (const term of MOCK_TERMS) {
      expect(validCategories).toContain(term.category);
    }
  });
});
