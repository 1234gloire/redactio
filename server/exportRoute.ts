/**
 * Endpoint d'export de documents au format .docx.
 * Reçoit un contenu textuel et le convertit en un document Word téléchargeable.
 *
 * EXG-EXP-01 [MAJEUR] : Ne jamais journaliser le contenu reçu.
 * EXG-EXP-02 [MAJEUR] : Utiliser des en-têtes HTTP corrects pour le type de fichier.
 */
import { Express, Request, Response } from "express";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { sdk } from "./_core/sdk";
import { pseudonymise } from "./pseudonymisation";

const RAW_DATA_MAX_CHARS = 200_000;

// Content width (in twips/dxa) for a Letter page with 1" margins. Word mishandles the
// fractional percentage widths this docx version emits (e.g. "33.333...%"), collapsing
// columns to near-zero — fixed dxa widths avoid that entirely.
const TABLE_WIDTH_DXA = 9000;

const HEADING_LEVEL_BY_TAG: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  h2: HeadingLevel.HEADING_1,
  h3: HeadingLevel.HEADING_2,
  h4: HeadingLevel.HEADING_3,
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeInlineHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:span|font)[^>]*>/gi, "")
    .replace(/<b\b[^>]*>/gi, "<strong>")
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<i\b[^>]*>/gi, "<em>")
    .replace(/<\/i>/gi, "</em>")
    .replace(/<mark\b[^>]*>/gi, "<mark>")
    .replace(/<\/mark>/gi, "</mark>");
}

function cleanTextNode(value: string): string {
  return decodeHtmlEntities(value)
    // Browser contenteditable can re-emit rich fragments as escaped HTML text.
    // Strip those fragments after decoding so exports never contain
    // "font color=... span style=... b>..." artifacts in table cells.
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\b(?:font|span)\b\s+[^>]*>/gi, "")
    .replace(/\b\/(?:font|span|strong|em|mark|b|i)>/gi, "")
    .replace(/\b(?:strong|em|mark|b|i)>/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

// Parse the constrained inline vocabulary produced by the client's renderInlineMarkdown().
function parseInlineRuns(html: string): TextRun[] {
  const normalizedHtml = normalizeInlineHtml(html);
  const inlineRegex = /<strong>([\s\S]*?)<\/strong>|<em>([\s\S]*?)<\/em>|<mark>([\s\S]*?)<\/mark>|([^<]+)/g;
  const runs: TextRun[] = [];
  let match: RegExpExecArray | null;
  while ((match = inlineRegex.exec(normalizedHtml)) !== null) {
    const [, bold, italic, marked, plain] = match;
    const rawText = bold ?? italic ?? marked ?? plain ?? "";
    const text = cleanTextNode(rawText);
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
    const fallbackText = cleanTextNode(normalizedHtml);
    return [new TextRun({ text: fallbackText })];
  }
  return runs;
}

// ─── Tableau "Conciliation médicamenteuse — modèle HAS 2018" ────────────────
// Le modèle HAS impose un double en-tête fusionné (colspan 3 / colspan 2 /
// rowspan 2) que le Markdown ne peut pas représenter : quel que soit ce que
// le modèle a réellement émis à l'écran, on reconstruit ici l'en-tête et le
// style HAS à partir du contenu des 6 colonnes de données, en se basant sur
// les intitulés bruts pour détecter ce tableau.
const CONCILIATION_TEAL = "489A93";
const CONCILIATION_DARK = "152726";
const CONCILIATION_LINE = "A3BCBA";
const CONCILIATION_STATUS_COLORS: Record<string, string> = {
  "arrêté": "A12027",
  "arrete": "A12027",
  "modifié": "B26B00",
  "modifie": "B26B00",
  "ajouté": "3B783B",
  "ajoute": "3B783B",
};
// Proportions HAS (2900/1900/1900/2900/1900/3620 DXA en A4 paysage), remises
// à l'échelle de la largeur de page utilisée par le reste du document.
const CONCILIATION_COLUMN_RATIOS = [2900, 1900, 1900, 2900, 1900, 3620];

function stripTags(html: string): string {
  return cleanTextNode(html.replace(/<br\s*\/?>/gi, " "));
}

function isConciliationHeaderRow(cellsText: string[]): boolean {
  if (cellsText.length !== 6) return false;
  const joined = cellsText.join(" | ").toLowerCase();
  return (
    joined.includes("traitement avant hospitalisation") &&
    (joined.includes("traitement à la sortie") || joined.includes("traitement a la sortie")) &&
    joined.includes("devenir du traitement")
  );
}

function conciliationColumnWidths(): number[] {
  const total = CONCILIATION_COLUMN_RATIOS.reduce((sum, value) => sum + value, 0);
  const widths = CONCILIATION_COLUMN_RATIOS.map((ratio) => Math.round((ratio / total) * TABLE_WIDTH_DXA));
  const roundingError = TABLE_WIDTH_DXA - widths.reduce((sum, value) => sum + value, 0);
  widths[widths.length - 1] += roundingError;
  return widths;
}

function conciliationHeaderCell(text: string, fill: string, width: number, span?: { colSpan?: number; rowSpan?: number }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill, color: "auto" },
    columnSpan: span?.colSpan,
    rowSpan: span?.rowSpan,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function buildConciliationHeaderRows(colWidths: number[]): TableRow[] {
  const [avantNom, avantPosologie, devenir, sortieNom, sortiePosologie, commentaires] = colWidths;
  return [
    new TableRow({
      tableHeader: true,
      children: [
        conciliationHeaderCell(
          "Traitement AVANT hospitalisation (bilan médicamenteux)",
          CONCILIATION_TEAL,
          avantNom + avantPosologie + devenir,
          { colSpan: 3 }
        ),
        conciliationHeaderCell("Traitement À LA SORTIE", CONCILIATION_DARK, sortieNom + sortiePosologie, { colSpan: 2 }),
        conciliationHeaderCell("Commentaires", CONCILIATION_DARK, commentaires, { rowSpan: 2 }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        conciliationHeaderCell("Nom / dosage / forme (DCI)", CONCILIATION_TEAL, avantNom),
        conciliationHeaderCell("Posologie", CONCILIATION_TEAL, avantPosologie),
        conciliationHeaderCell("Devenir du traitement", CONCILIATION_TEAL, devenir),
        conciliationHeaderCell("Nom / dosage / forme (DCI)", CONCILIATION_DARK, sortieNom),
        conciliationHeaderCell("Posologie", CONCILIATION_DARK, sortiePosologie),
      ],
    }),
  ];
}

function conciliationDataCell(
  text: string,
  width: number,
  options: { center?: boolean; italicGray?: boolean; statusColor?: string } = {}
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        alignment: options.center ? AlignmentType.CENTER : undefined,
        children: [
          new TextRun({
            text: text || "—",
            italics: options.italicGray || undefined,
            color: options.italicGray ? "555555" : options.statusColor,
          }),
        ],
      }),
    ],
  });
}

function buildConciliationDataRow(cellsText: string[], colWidths: number[]): TableRow {
  const devenirRaw = (cellsText[2] ?? "").trim();
  const devenirKey = devenirRaw.toLowerCase();
  const statusColor = CONCILIATION_STATUS_COLORS[devenirKey];
  return new TableRow({
    children: [
      conciliationDataCell(cellsText[0] ?? "", colWidths[0]),
      conciliationDataCell(cellsText[1] ?? "", colWidths[1], { center: true }),
      conciliationDataCell(devenirRaw, colWidths[2], { center: true, statusColor }),
      conciliationDataCell(cellsText[3] ?? "", colWidths[3]),
      conciliationDataCell(cellsText[4] ?? "", colWidths[4], { center: true }),
      conciliationDataCell(cellsText[5] ?? "", colWidths[5], { italicGray: true }),
    ],
  });
}

function buildConciliationTable(dataRowsText: string[][]): Table {
  const colWidths = conciliationColumnWidths();
  const rows = [
    ...buildConciliationHeaderRows(colWidths),
    ...dataRowsText.map((cells) => buildConciliationDataRow(cells, colWidths)),
  ];
  return new Table({
    rows,
    width: { size: TABLE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: colWidths,
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: CONCILIATION_LINE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: CONCILIATION_LINE },
      left: { style: BorderStyle.SINGLE, size: 4, color: CONCILIATION_LINE },
      right: { style: BorderStyle.SINGLE, size: 4, color: CONCILIATION_LINE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: CONCILIATION_LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: CONCILIATION_LINE },
    },
  });
}

function parseTableRowsAsText(tableHtml: string): string[][] {
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g;
  const rows: string[][] = [];
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }
    rows.push(cells);
  }
  return rows;
}

function buildTableRows(tableHtml: string): { rows: TableRow[]; columnCount: number } {
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g;
  const rows: TableRow[] = [];
  let columnCount = 0;
  let rowMatch: RegExpExecArray | null;
  let isFirstRow = true;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellsHtml: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cellsHtml.push(cellMatch[1]);
    }
    columnCount = Math.max(columnCount, cellsHtml.length);
    const columnWidth = Math.floor(TABLE_WIDTH_DXA / Math.max(cellsHtml.length, 1));
    rows.push(
      new TableRow({
        tableHeader: isFirstRow,
        children: cellsHtml.map(
          (cellHtml) =>
            new TableCell({
              width: { size: columnWidth, type: WidthType.DXA },
              children: [new Paragraph({ children: parseInlineRuns(cellHtml) })],
            })
        ),
      })
    );
    isFirstRow = false;
  }
  return { rows, columnCount };
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
      const textRows = parseTableRowsAsText(tableHtml);
      if (textRows.length > 0 && isConciliationHeaderRow(textRows[0])) {
        content.push(buildConciliationTable(textRows.slice(1)));
        continue;
      }
      const { rows, columnCount } = buildTableRows(tableHtml);
      if (rows.length > 0) {
        const columnWidth = Math.floor(TABLE_WIDTH_DXA / Math.max(columnCount, 1));
        content.push(
          new Table({
            rows,
            width: { size: TABLE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: Array(columnCount).fill(columnWidth),
            layout: TableLayoutType.FIXED,
          })
        );
      }
    } else if (paragraphHtml !== undefined) {
      content.push(new Paragraph({ children: parseInlineRuns(paragraphHtml) }));
    }
  }
  return content;
}

export function buildDocxContent(content: string): (Paragraph | Table)[] {
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
      res.setHeader("Content-Disposition", `attachment; filename="medactio.docx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.send(buffer);
    } catch (err) {
      console.error("[Export DOCX] Erreur interne (sans contenu)");
      // En cas d'erreur, renvoyer une erreur JSON et non un fichier
      res.status(500).json({ error: "Erreur interne lors de la génération du document." });
    }
  });
}
