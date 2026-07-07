import { describe, expect, it } from "vitest";
import { pseudonymise, containsDirectIdentifier, pseudonymiseExamExtractionOutput } from "./pseudonymisation";

describe("pseudonymisation — règles regex", () => {
  it("masque un NIR (numéro de sécurité sociale)", () => {
    const result = pseudonymise("Patient NIR : 1 85 06 75 112 345 12");
    expect(result.filteredText).not.toContain("1 85 06 75 112 345 12");
    expect(result.maskCount).toBeGreaterThan(0);
    expect(result.detectedCategories).toContain("NIR");
  });

  it("masque une adresse e-mail", () => {
    const result = pseudonymise("Contacter le patient : jean.dupont@hopital.fr");
    expect(result.filteredText).not.toContain("jean.dupont@hopital.fr");
    expect(result.detectedCategories).toContain("EMAIL");
  });

  it("masque un numéro de téléphone", () => {
    const result = pseudonymise("Téléphone : 06 12 34 56 78");
    expect(result.filteredText).not.toContain("06 12 34 56 78");
    expect(result.detectedCategories).toContain("TELEPHONE");
  });

  it("masque une date de naissance", () => {
    const result = pseudonymise("Né le 15/03/1965 à Paris");
    expect(result.filteredText).not.toContain("15/03/1965");
    expect(result.detectedCategories).toContain("DATE_NAISSANCE");
  });

  it("masque une date de naissance avec libellé explicite", () => {
    const result = pseudonymise("Date de naissance : 03/05/1941");
    expect(result.filteredText).not.toContain("03/05/1941");
    expect(result.filteredText).toContain("[DATE_NAISSANCE_MASQUÉE]");
    expect(result.detectedCategories).toContain("DATE_NAISSANCE");
  });

  it("conserve les dates de séjour et d'intervention", () => {
    const result = pseudonymise("Entrée le 18/02/2026, intervention le 20/02/2026, sortie le 27/02/2026.");
    expect(result.filteredText).toContain("18/02/2026");
    expect(result.filteredText).toContain("20/02/2026");
    expect(result.filteredText).toContain("27/02/2026");
    expect(result.filteredText).not.toContain("[DATE_MASQUÉE]");
    expect(result.detectedCategories).not.toContain("DATE_SENSIBLE");
  });

  it("conserve les dates et horaires de rendez-vous de contrôle", () => {
    const result = pseudonymise("RDV de contrôle le 26/03/2026 à 10h30.");
    expect(result.filteredText).toContain("26/03/2026");
    expect(result.filteredText).toContain("10h30");
    expect(result.filteredText).not.toContain("[DATE_MASQUÉE]");
  });

  it("masque un code postal", () => {
    const result = pseudonymise("Adresse : 12 rue de la Paix, 75001 Paris");
    expect(result.filteredText).not.toContain("75001");
    expect(result.detectedCategories).toContain("ADRESSE");
  });

  it("ne masque pas un texte médical sans identifiants directs", () => {
    const text = "Insuffisance cardiaque gauche avec FEVG à 35%, traitée par bisoprolol 5 mg/j et ramipril 10 mg/j.";
    const result = pseudonymise(text);
    // Aucune règle regex ne doit se déclencher sur ce texte purement clinique
    expect(result.detectedCategories).not.toContain("NIR");
    expect(result.detectedCategories).not.toContain("EMAIL");
    expect(result.detectedCategories).not.toContain("TELEPHONE");
  });

  it("retourne hasPotentialOvermasking=false pour un texte propre", () => {
    const result = pseudonymise("Diagnostic retenu : insuffisance cardiaque gauche.");
    expect(result.hasPotentialOvermasking).toBe(false);
  });
});

describe("containsDirectIdentifier", () => {
  it("détecte un NIR dans le texte", () => {
    expect(containsDirectIdentifier("NIR 1 85 06 75 112 345 12")).toBe(true);
  });

  it("retourne false pour un texte sans identifiant", () => {
    expect(containsDirectIdentifier("Traitement par bêtabloquants et IEC")).toBe(false);
  });
});

describe("pseudonymiseExamExtractionOutput", () => {
  it("conserve les résultats négatifs et les dates cliniques", () => {
    const result = pseudonymiseExamExtractionOutput(
      "Indication : Début des symptômes le 03/06/2026.\nRésultat : Pas de saignement intracrânien ni de collection péricérébrale."
    );

    expect(result.filteredText).toContain("Début des symptômes le 03/06/2026");
    expect(result.filteredText).toContain("Pas de saignement intracrânien");
    expect(result.filteredText).not.toContain("[NOM_MASQUÉ]");
    expect(result.filteredText).not.toContain("[DATE_MASQUÉE]");
  });

  it("masque une date de naissance explicite en sortie", () => {
    const result = pseudonymiseExamExtractionOutput("Patiente née le 06/12/1928. Résultat : pas de syndrome de masse.");

    expect(result.filteredText).not.toContain("06/12/1928");
    expect(result.detectedCategories).toContain("DATE_NAISSANCE");
  });
});
