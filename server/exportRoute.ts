/**
 * Endpoint d'export de documents au format .docx.
 * Reçoit un contenu textuel et le convertit en un document Word téléchargeable.
 *
 * EXG-EXP-01 [MAJEUR] : Ne jamais journaliser le contenu reçu.
 * EXG-EXP-02 [MAJEUR] : Utiliser des en-têtes HTTP corrects pour le type de fichier.
 */
import { Express, Request, Response } from "express";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { sdk } from "./_core/sdk";
import { pseudonymise } from "./pseudonymisation";

const RAW_DATA_MAX_CHARS = 200_000;

const HEADING_LEVEL_BY_TAG: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  h2: HeadingLevel.HEADING_1,
  h3: HeadingLevel.HEADING_2,
  h4: HeadingLevel.HEADING_3,
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Parse the constrained inline vocabulary produced by the client's renderInlineMarkdown().
function parseInlineRuns(html: string): TextRun[] {
  const inlineRegex = /<strong>([\s\S]*?)<\/strong>|<em>([\s\S]*?)<\/em>|<mark[^>]*>([\s\S]*?)<\/mark>|([^<]+)/g;
  const runs: TextRun[] = [];
  let match: RegExpExecArray | null;
  while ((match = inlineRegex.exec(html)) !== null) {
    const [, bold, italic, marked, plain] = match;
    const rawText = bold ?? italic ?? marked ?? plain ?? "";
    const text = decodeHtmlEntities(rawText.replace(/<[^>]+>/g, ""));
    if (!text) continue;
    runs.push(
      new TextRun({
        text,
        bold: bold !== undefined || marked !== undefined,
        italics: italic !== undefined,
        highlight: marked !== undefined ? "yellow" : undefined,
      })
    );
  }
  if (runs.length === 0) {
    const fallbackText = decodeHtmlEntities(html.replace(/<[^>]+>/g, ""));
    return [new TextRun({ text: fallbackText })];
  }
  return runs;
}

function buildTableRows(tableHtml: string): TableRow[] {
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g;
  const rows: TableRow[] = [];
  let rowMatch: RegExpExecArray | null;
  let isFirstRow = true;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellsHtml: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cellsHtml.push(cellMatch[1]);
    }
    const columnWidth = 100 / Math.max(cellsHtml.length, 1);
    rows.push(
      new TableRow({
        tableHeader: isFirstRow,
        children: cellsHtml.map(
          (cellHtml) =>
            new TableCell({
              width: { size: columnWidth, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: parseInlineRuns(cellHtml) })],
            })
        ),
      })
    );
    isFirstRow = false;
  }
  return rows;
}

// Convert the editor's rendered HTML (headings, bold, tables) into real Word elements
// instead of dumping flattened plain text, so exports keep the same structure as the screen.
function buildDocxContentFromHtml(html: string): (Paragraph | Table)[] {
  const blockRegex = /<h([2-4])>([\s\S]*?)<\/h\1>|<table>([\s\S]*?)<\/table>|<p>([\s\S]*?)<\/p>/g;
  const content: (Paragraph | Table)[] = [];
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html)) !== null) {
    const [, headingLevel, headingText, tableHtml, paragraphHtml] = match;
    if (headingLevel !== undefined) {
      content.push(
        new Paragraph({
          heading: HEADING_LEVEL_BY_TAG[`h${headingLevel}`],
          children: parseInlineRuns(headingText),
        })
      );
    } else if (tableHtml !== undefined) {
      const rows = buildTableRows(tableHtml);
      if (rows.length > 0) {
        content.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      }
    } else if (paragraphHtml !== undefined) {
      content.push(new Paragraph({ children: parseInlineRuns(paragraphHtml) }));
    }
  }
  return content;
}

function buildDocxContent(content: string): (Paragraph | Table)[] {
  const looksLikeRenderedHtml = /<(h[2-4]|p|table)[ >]/.test(content);
  if (!looksLikeRenderedHtml) {
    return content.split("\n").map((textLine) => new Paragraph({ children: [new TextRun(textLine)] }));
  }
  return buildDocxContentFromHtml(content);
}

export function registerExportRoutes(app: Express): void {
  app.post("/api/security/pseudonymise", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Non authentifié" });
      }
    } catch {
      return res.status(401).json({ error: "Session invalide" });
    }

    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Contenu manquant ou invalide." });
    }
    if (content.length > RAW_DATA_MAX_CHARS) {
      return res.status(400).json({ error: `Contenu trop long (max ${RAW_DATA_MAX_CHARS} caractères).` });
    }

    const result = pseudonymise(content);
    return res.json({
      filteredText: result.filteredText,
      maskCount: result.maskCount,
      detectedCategories: result.detectedCategories,
      hasPotentialOvermasking: result.hasPotentialOvermasking,
    });
  });

  app.post("/api/export/docx", async (req: Request, res: Response) => {
    // 1. Vérification de l'authentification  
    try {
      const user = await sdk.authenticateRequest(req);

      if (!user) {
        // Important : Toujours renvoyer une erreur JSON claire si non authentifié
        return res.status(401).json({ error: "Non authentifié" });
      }
    } catch {
      return res.status(401).json({ error: "Session invalide" });
    }

    // 2. Validation du contenu
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Contenu manquant ou invalide." });
    }

    try {
      // 3. Création du document Word en mémoire
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: buildDocxContent(content),
          },
        ],
      });

      // 4. Génération du buffer du fichier
      const buffer = await Packer.toBuffer(doc);

      // 5. Envoi de la réponse avec les bons en-têtes
      res.setHeader("Content-Disposition", `attachment; filename="redactio.docx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.send(buffer);
    } catch (err) {
      console.error("[Export DOCX] Erreur interne (sans contenu)");
      // En cas d'erreur, renvoyer une erreur JSON et non un fichier
      res.status(500).json({ error: "Erreur interne lors de la génération du document." });
    }
  });
}
