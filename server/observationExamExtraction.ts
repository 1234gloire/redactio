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
import { pseudonymiseExamExtractionOutput } from "./pseudonymisation";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const RAW_DATA_MAX_CHARS = 200_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

const SYSTEM_PROMPT = `Tu es un moteur d'extraction documentaire médical intégré à REDACTIO, plateforme d'assistance rédactionnelle hospitalière.

Mission unique : extraire et restituer exclusivement les données résultats propres au patient d'un document médical transmis, en supprimant toute information administrative ou identitaire.

Tu n'es pas un outil d'aide à la décision clinique. Tu n'interprètes pas les résultats, tu ne les commentes pas, tu ne les complètes pas, tu ne suggères pas de diagnostic. Tu extrais et tu structures.

Anti-invention :
- Ne génère aucune valeur, aucun résultat, aucune donnée qui ne figure pas explicitement dans le document.
- Si une information est illisible, absente ou ambiguë, signale-le avec [ILLISIBLE] ou [INCOMPLET].

Résultat patient uniquement :
- Extrais uniquement les valeurs mesurées propres au patient.
- N'extrais jamais les valeurs de référence, normes, intervalles de normalité, valeurs usuelles, valeurs théoriques/prédites, bornes basses/hautes ou % de la théorique.
- Les seuls éléments d'interprétation conservés sont les flags ou conclusions présents tels quels dans le document : H, L, *, ↑, ↓, "anormal", conclusion du compte rendu.
- Ne recalcule jamais un flag à partir d'une norme.

Pseudonymisation à périmètre strictement identitaire :
- La pseudonymisation porte exclusivement sur les éléments d'identité et d'administration.
- Elle ne s'applique jamais au contenu clinique, biologique ou paraclinique : résultats, descriptions, lésions, structures anatomiques, organes, termes médicaux, produits de contraste, techniques, scores ou conclusions.
- Ne remplace jamais un résultat ou un terme clinique par [NOM_MASQUÉ] ou équivalent.
- En cas de doute, ne masque pas : un terme médical n'est jamais un identifiant.

Supprime uniquement :
- nom, prénom, nom de naissance du patient ;
- date de naissance ;
- NIR/NIP, NDA, IPP, numéro d'accession, numéro de dossier, code-barres ;
- adresse, téléphone, courriel du patient ;
- nom, prénom, titre de tout médecin ou soignant ;
- nom, adresse, FINESS, coordonnées de l'établissement, du laboratoire ou du service ;
- mentions légales, signatures, tampons, logos ;
- dates administratives : entrée/sortie, prélèvement, réception, compte rendu, validation/signature ;
- "Demandé par", "Copie pour", "Page X/Y", pieds de page.

Dates cliniques conservées :
- Les dates porteuses d'une information clinique sont obligatoirement conservées : début des symptômes, début de traitement, ancienneté datée d'une lésion ou d'un antécédent, date intégrée à l'indication ou à la description clinique.

Indication / motif / renseignements cliniques :
- L'indication, le motif, le contexte clinique, la question posée ou les renseignements cliniques de l'examen sont obligatoirement conservés s'ils figurent dans le document.
- Ils ne sont jamais masqués, supprimés ni reformulés, sauf retrait d'identifiants directs.

RÈGLE D'EXHAUSTIVITÉ — AUCUN RÉSULTAT OMIS :
- Tu restitues TOUTES les lignes de résultat présentes dans le document, sans exception et dans leur ordre d'apparition.
- Tu n'omets, ne fusionnes ni ne résumes aucun résultat.
- Les résultats NÉGATIFS ou NORMAUX ("Pas de...", "Absence de...", "Sans particularité", "Non visualisé", "Éléments en place") ont la même valeur diagnostique que les résultats positifs et doivent impérativement être restitués.
- Un résultat négatif n'est jamais superflu : il documente l'absence de signe et fait partie intégrante du compte rendu.
- Omettre une ligne de résultat, positive ou négative, est une erreur grave qui compromet la fiabilité du système.
- Mettre tous les résultats, positifs et négatifs, sans masquage comme ici : "Pas de [NOM_MASQUÉ]". Tu dois les remettre intégralement comme dans le document source.

Ne réponds jamais "document vide" si tu vois au moins une valeur biologique, un résultat d'imagerie, une conclusion, un intitulé d'examen, une unité, un germe, un antibiogramme, une mesure ECG/EFR, une indication ou un fragment de compte rendu exploitable, même si l'OCR est imparfait.

Si et seulement si le document ne contient que des informations identitaires et administratives, restitue :
[DOCUMENT VIDE - aucun resultat a extraire]`;

const USER_PROMPT = `Voici un document médical transmis par le praticien. Identifie son type, puis applique les règles d'extraction correspondantes.

Rappel transversal :
- Seules les valeurs propres au patient sont extraites.
- Aucune valeur de référence, norme, valeur usuelle ou valeur théorique n'est restituée.
- La pseudonymisation ne touche que l'identité administrative : aucun résultat ni terme clinique n'est masqué.
- Tous les résultats sont restitués, y compris les résultats négatifs/normaux.
- Affichage REDACTIO : n'utilise pas de tableau Markdown visible. Utilise des titres fonctionnels, paragraphes courts et listes à puces.

Types possibles :
[BIO], [MICRO], [ANAPATH], [IMAGERIE], [CARDIO], [EFR], [ENDOSCOPIE], [OPERATOIRE], [AUTRE].

BIO :
- Groupe les analyses par famille : Hématologie, Biochimie, Coagulation, Gaz du sang, Immunologie, Autre.
- N'utilise jamais de tableau.
- N'extrais jamais les valeurs de référence.
- Ligne attendue : "- Analyse : résultat unité ; anomalie : flag présent".
- Si plusieurs prélèvements distincts : Série 1, Série 2, sans date administrative.

MICRO :
- Nature du prélèvement, site anatomique, examen direct, culture, micro-organismes, antibiogramme, résistances, PCR/sérologie, conclusion.
- Antibiogramme en blocs : "- Antibiotique : CMI si disponible ; interprétation S/I/R".

ANAPATH :
- Structure chaque prélèvement : site, nature, taille/dimensions, macroscopie, histologie, colorations/immunohistochimie, conclusion.
- Reproduis fidèlement et intégralement les conclusions.
- Conserve les renseignements cliniques fournis.

IMAGERIE :
- Structure : Technique / Modalité, Indication clinique fournie, Résultats par région ou système anatomique, Conclusion radiologique, Recommandations si présentes.
- L'indication clinique est obligatoire si présente et ne doit jamais être masquée.
- Restitue toutes les phrases de résultat, y compris "Pas de...", "Absence de...", "Sans...".
- Ne conserve pas le nom d'appareil, le centre, les médecins, les numéros ni les dates administratives.

CARDIO :
- Conserve l'indication clinique si présente.
- ECG : rythme, fréquence, axe, PR, QRS, QT/QTc, onde P, repolarisation, conclusion.
- Échocardiographie : VG, VD, valves, péricarde, conclusion.
- Holter / effort / coronarographie : résultats bruts + conclusion.

EFR :
- Conserve l'indication clinique si présente.
- Paramètres en blocs : "- Paramètre : valeur mesurée unité ; interprétation si explicitement présente".
- N'extrais jamais la valeur théorique/prédite ni le % de la théorique.
- Ajoute gazométrie, test de réversibilité, conclusion, classification si présents.

ENDOSCOPIE :
- Type d'examen, indication, préparation/qualité, muqueuse par segment, lésions, gestes, prélèvements, conclusion.

OPERATOIRE :
- Intervention, voie d'abord, constatations, gestes, incidents, pièce adressée, conclusion.

AUTRE :
- Précise le type identifié et restitue les résultats bruts dans l'ordre du document.

Règles de forme :
- Fidélité absolue au texte médical.
- Aucun commentaire ajouté.
- Pas d'astérisques décoratifs, pas de bloc de code.
- Aucun séparateur de tableau avec des pipes "|".
- Document composite : sépare avec --- EXAMEN N - [TYPE] ---.
- Utilise [ILLISIBLE], [INCOMPLET] ou [NON EXTRAIT - IDENTIFIANT] si nécessaire.
- Langue identique au document source.`;

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

export function isEmptyExtractionMessage(text: string) {
  return /^\s*\[DOCUMENT VIDE\s*[-—]\s*aucun r[ée]sultat [àa] extraire\]\s*$/i.test(text);
}

function cleanMarkdownEmphasis(text: string) {
  return text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1");
}

function splitMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanMarkdownEmphasis(cell.trim()));
}

function isMarkdownTableSeparator(line: string) {
  const cells = splitMarkdownTableRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function normalizeTableHeader(header: string) {
  return header
    .replace(/Valeurs?\s+de\s+\[NOM_MASQU[ÉE]\]/gi, "référence")
    .replace(/Valeurs?\s+de\s+r[ée]f[ée]rence/gi, "référence")
    .replace(/^R[ée]sultat\s*$/i, "résultat")
    .replace(/^Unit[ée]\s*$/i, "unité")
    .replace(/^Anomalie\s*$/i, "anomalie")
    .trim();
}

function isEmptyTableCell(value: string) {
  return !value || value === "—" || value === "-";
}

function convertMarkdownTableToBlocks(tableLines: string[]) {
  const headers = splitMarkdownTableRow(tableLines[0]).map(normalizeTableHeader);
  const rows = tableLines.slice(2).map(splitMarkdownTableRow);
  const blocks = rows.map((cells) => {
    const label = cells[0]?.trim() || "Résultat";
    const details = cells.slice(1).flatMap((value, index) => {
      if (isEmptyTableCell(value)) return [];
      const header = normalizeTableHeader(headers[index + 1] || `colonne ${index + 2}`);
      return `${header} : ${value}`;
    });
    return details.length > 0 ? `- ${label} : ${details.join(" ; ")}` : `- ${label}`;
  });
  return blocks.join("\n");
}

export function formatObservationExamBlocks(text: string) {
  const lines = cleanMarkdownEmphasis(text).split(/\r?\n/);
  const output: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const nextLine = lines[index + 1];
    const isTableStart = line.trim().startsWith("|") && nextLine?.trim().startsWith("|") && isMarkdownTableSeparator(nextLine);

    if (!isTableStart) {
      output.push(line);
      continue;
    }

    const tableLines = [line, nextLine];
    index += 2;
    while (index < lines.length && lines[index].trim().startsWith("|")) {
      tableLines.push(lines[index]);
      index++;
    }
    index--;
    output.push(convertMarkdownTableToBlocks(tableLines));
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/Valeurs?\s+de\s+\[NOM_MASQU[ÉE]\]/gi, "référence")
    .trim();
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

      let generatedText = "";
      let extractionMode: "ai" | "pseudonymised_raw" = "ai";
      let warning: string | undefined;

      try {
        generatedText = await createAnthropicMessage({
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `${USER_PROMPT}\n\n--- DOCUMENT BRUT À EXTRAIRE — NON FILTRÉ EN ENTRÉE ---\n${rawText}`,
            },
          ],
          maxTokens: 4000,
          temperature: 0.1,
        });
      } catch (aiError) {
        extractionMode = "pseudonymised_raw";
        warning = "Extraction intelligente indisponible : le texte extrait a été pseudonymisé et ajouté sans restructuration IA.";
        generatedText = rawText;
        console.error("[ObservationExamExtraction] AI extraction fallback", {
          userId,
          message: aiError instanceof Error ? aiError.message : String(aiError),
        });
      }

      if (isEmptyExtractionMessage(generatedText)) {
        extractionMode = "pseudonymised_raw";
        if (rawText.trim()) {
          warning = "L'extraction intelligente n'a pas identifié de résultat structuré : le texte OCR extrait a été pseudonymisé et ajouté pour relecture.";
          generatedText = rawText;
        } else {
          res.status(422).json({
            error:
              "OCR terminé, mais aucun texte médical exploitable n'a été reconnu. Essayez un scan plus net ou une version PDF OCRisée.",
          });
          return;
        }
      }

      const outputPseudo = pseudonymiseExamExtractionOutput(formatObservationExamBlocks(generatedText));
      if (!outputPseudo.filteredText) {
        res.status(422).json({ error: "Aucun résultat médical exploitable trouvé dans ce fichier." });
        return;
      }
      const outputText = formatObservationExamBlocks(outputPseudo.filteredText);

      try {
        await createAuditLog({
          userId,
          action: "observation.exam_extract.complete",
          resource: "observation_exam_extract",
          metadata: {
            fileExtension: getExtension(req.file.originalname),
            sourceCharacters: rawText.length,
            outputCharacters: outputText.length,
            outputMaskCount: outputPseudo.maskCount,
            extractionMode,
            detectedCategories: outputPseudo.detectedCategories,
            hasPotentialOvermasking: outputPseudo.hasPotentialOvermasking,
          },
        });
      } catch {
        // Audit non bloquant.
      }

      res.json({
        filename: req.file.originalname,
        characterCount: outputText.length,
        text: outputText,
        extractionMode,
        warning,
        pseudonymisationInfo: {
          outputMaskCount: outputPseudo.maskCount,
          detectedCategories: outputPseudo.detectedCategories,
          hasPotentialOvermasking: outputPseudo.hasPotentialOvermasking,
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
