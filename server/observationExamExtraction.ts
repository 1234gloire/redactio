/**
 * Endpoint d'extraction d'examens pour le bloc Observation médicale.
 * Le contenu médical n'est jamais journalisé.
 */
import type { Express, Request, Response } from "express";
import multer from "multer";
import { createAnthropicMessage } from "./_core/anthropic";
import { sdk } from "./_core/sdk";
import { createAuditLog } from "./db";
import { extractText } from "./fileExtraction";
import { pseudonymise } from "./pseudonymisation";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const RAW_DATA_MAX_CHARS = 200_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

const SYSTEM_PROMPT = `Tu es un module REDACTIO d'extraction de resultats d'examens medicaux.

Objectif unique : extraire et restituer uniquement les resultats medicaux utiles d'un document depose dans le bloc Observation medicale.

Interdictions strictes :
- Ne fournis aucune aide a la decision clinique.
- N'interprete pas, ne diagnostique pas, ne recommande pas.
- N'invente aucune valeur, unite, conclusion ou contexte absent du document.
- Ne conserve aucune information administrative, identifiante ou contextuelle non medicale.

Supprime systematiquement :
- noms, prenoms, date de naissance, NIR, NIP, NDA, IPP, numeros de dossier, accession, codes-barres ;
- adresse, telephone, email du patient ;
- noms/titres des medecins, secretaires, techniciens, biologistes ;
- noms, adresses, contacts, FINESS, logos, tampons et signatures d'etablissements, laboratoires ou services ;
- mentions legales, pieds de page, "demande par", "copie pour" ;
- numeros internes d'examen, de prelevement ou de dossier ;
- toutes les dates, sans exception, y compris dates relatives J1/J2/J+ ;
- toute information permettant d'identifier directement ou indirectement une personne ou une structure.

Exception a conserver : les renseignements cliniques, indications, motifs et contexte clinique quand ils sont medicalement utiles et presents dans le document.

Ne reponds jamais "document vide" si tu vois au moins une valeur biologique, un resultat d'imagerie, une conclusion, un intitulé d'examen, une unite, une norme, un germe, un antibiogramme, une mesure ECG/EFR, ou un fragment de compte rendu exploitable, meme si l'OCR est imparfait.

Si et seulement si le document ne contient que des informations administratives ou identifiantes, reponds exactement :
[DOCUMENT VIDE - aucun resultat a extraire]`;

const USER_PROMPT = `Analyse le document pseudonymise fourni et produis une sortie directement exploitable dans l'editeur d'observation medicale.

1. Identifie le ou les types d'examens :
[BIO], [MICRO], [ANAPATH], [IMAGERIE], [CARDIO], [EFR], [ENDOSCOPIE], [OPERATOIRE], [AUTRE].

2. Restitue les resultats selon le type.

BIO :
- Groupe les resultats par famille biologique si possible.
- Utilise un tableau simple avec les colonnes : Analyse | Resultat | Unite | Valeurs de reference | Anomalie.
- Si plusieurs series de prelevements existent, separe-les sans indiquer de date.

MICRO :
- Structure : Prelevement, Examen direct, Culture, Identification, Antibiogramme, Conclusion.
- Antibiogramme en tableau : Antibiotique | Resultat | CMI si presente.

ANAPATH :
- Separe chaque prelevement.
- Conserve exactement les conclusions et comptes rendus diagnostiques presents.
- Conserve les renseignements cliniques s'ils existent.

IMAGERIE :
- Structure : Modalite/Technique, Indication, Resultats par region, Conclusion, Recommandations uniquement si elles figurent explicitement dans le document.

CARDIO :
- ECG : rythme, frequence, conduction, repolarisation, conclusion.
- Echographie : cavites, fonction systolique, valves, pressions, pericarde, conclusion.
- Holter ou autre : restitue les resultats objectifs.

EFR :
- Tableau : Parametre | Valeur mesuree | Unite | % de la theorique | Interpretation.
- Ajoute gazometrie, reversibilite et conclusion si presents.

ENDOSCOPIE / OPERATOIRE / AUTRE :
- Conserve les titres fonctionnels et les resultats objectifs.
- Ne conserve pas les signatures, operateurs, lieux, dates ou numeros.

Regles de forme :
- Fidelite maximale au document source.
- Meme langue que le document source.
- Aucun bloc de code.
- Pas de decoration markdown inutile.
- Les tableaux doivent etre lisibles dans un editeur riche.
- Si le document contient plusieurs examens, separe-les avec : --- EXAMEN N - [TYPE] ---
- Utilise [ILLISIBLE], [INCOMPLET] ou [NON EXTRAIT - IDENTIFIANT] si necessaire.
- Ne signale pas les informations supprimees sauf si cela rend une ligne medicale incomprehensible.`;

function getClientErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("Format non pris en charge")) {
    return message;
  }
  if (message.includes("Aucun texte exploitable")) {
    return message;
  }
  if (message.includes("ANTHROPIC_API_KEY")) {
    return "Configuration Anthropic manquante. Vérifiez la clé API côté serveur.";
  }
  if (message.includes("401") || message.includes("403")) {
    return "Clé Anthropic invalide ou non autorisée.";
  }
  if (message.includes("429")) {
    return "Quota ou limite Anthropic atteint. Réessayez plus tard.";
  }
  if (message.includes("413") || message.toLowerCase().includes("too large")) {
    return "Fichier trop volumineux pour l'extraction intelligente.";
  }
  return "Extraction intelligente temporairement indisponible.";
}

function getExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

function isEmptyExtractionMessage(text: string) {
  return /^\s*\[DOCUMENT VIDE\s*[-—]\s*aucun r[ée]sultat [àa] extraire\]\s*$/i.test(text);
}

export function registerObservationExamExtraction(app: Express) {
  app.post("/api/observation/extract-exam", upload.single("file"), async (req: Request, res: Response) => {
    let userId: number | null = null;

    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Non authentifié." });
        return;
      }
      userId = user.id;

      if (!req.file) {
        res.status(400).json({ error: "Aucun fichier fourni." });
        return;
      }

      const rawText = await extractText(req.file);
      if (!rawText) {
        res.status(422).json({ error: "Aucun texte exploitable trouvé dans ce fichier." });
        return;
      }
      if (rawText.length > RAW_DATA_MAX_CHARS) {
        res.status(413).json({
          error: `Le texte extrait dépasse ${RAW_DATA_MAX_CHARS.toLocaleString("fr-FR")} caractères.`,
        });
        return;
      }

      const inputPseudo = pseudonymise(rawText);
      let generatedText = "";
      let extractionMode: "ai" | "pseudonymised_raw" = "ai";
      let warning: string | undefined;

      try {
        generatedText = await createAnthropicMessage({
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `${USER_PROMPT}\n\n--- DOCUMENT PSEUDONYMISÉ À EXTRAIRE ---\n${inputPseudo.filteredText}`,
            },
          ],
          maxTokens: 4000,
          temperature: 0.1,
        });
      } catch (aiError) {
        extractionMode = "pseudonymised_raw";
        warning = "Extraction intelligente indisponible : le texte extrait a été pseudonymisé et ajouté sans restructuration IA.";
        generatedText = inputPseudo.filteredText;
        console.error("[ObservationExamExtraction] AI extraction fallback", {
          userId,
          message: aiError instanceof Error ? aiError.message : String(aiError),
        });
      }

      if (isEmptyExtractionMessage(generatedText) && inputPseudo.filteredText.trim().length > 80) {
        extractionMode = "pseudonymised_raw";
        warning = "L'extraction intelligente n'a pas identifié de résultat structuré : le texte extrait a été pseudonymisé et ajouté pour relecture.";
        generatedText = inputPseudo.filteredText;
      }

      const outputPseudo = pseudonymise(generatedText.trim());
      if (!outputPseudo.filteredText) {
        res.status(422).json({ error: "Aucun résultat médical exploitable trouvé dans ce fichier." });
        return;
      }

      try {
        await createAuditLog({
          userId,
          action: "observation.exam_extract.complete",
          resource: "observation_exam_extract",
          metadata: {
            fileExtension: getExtension(req.file.originalname),
            sourceCharacters: rawText.length,
            outputCharacters: outputPseudo.filteredText.length,
            inputMaskCount: inputPseudo.maskCount,
            outputMaskCount: outputPseudo.maskCount,
            extractionMode,
            detectedCategories: Array.from(
              new Set([...inputPseudo.detectedCategories, ...outputPseudo.detectedCategories])
            ),
            hasPotentialOvermasking: inputPseudo.hasPotentialOvermasking || outputPseudo.hasPotentialOvermasking,
          },
        });
      } catch {
        // Audit non bloquant.
      }

      res.json({
        filename: req.file.originalname,
        characterCount: outputPseudo.filteredText.length,
        text: outputPseudo.filteredText,
        extractionMode,
        warning,
        pseudonymisationInfo: {
          inputMaskCount: inputPseudo.maskCount,
          outputMaskCount: outputPseudo.maskCount,
          detectedCategories: Array.from(
            new Set([...inputPseudo.detectedCategories, ...outputPseudo.detectedCategories])
          ),
          hasPotentialOvermasking: inputPseudo.hasPotentialOvermasking || outputPseudo.hasPotentialOvermasking,
        },
      });
    } catch (error) {
      console.error("[ObservationExamExtraction] failed", {
        userId,
        message: error instanceof Error ? error.message : String(error),
      });
      res.status(400).json({ error: getClientErrorMessage(error) });
    }
  });
}
