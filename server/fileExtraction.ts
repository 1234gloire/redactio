import type { Express, Request, Response } from "express";
import mammoth from "mammoth";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { sdk } from "./_core/sdk";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv", ".json", ".xml", ".html", ".rtf"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

function getExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

export async function extractText(file: Express.Multer.File) {
  const extension = getExtension(file.originalname);

  if (extension === ".pdf" || file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      const text = parsed.text?.trim() ?? "";
      if (!text) {
        throw new Error(
          "PDF scanné sans texte extractible. Ajoutez une version OCRisée ou copiez le compte rendu en texte."
        );
      }
      return text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    extension === ".docx" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.trim();
  }

  if (TEXT_EXTENSIONS.has(extension) || file.mimetype.startsWith("text/")) {
    return file.buffer.toString("utf-8").trim();
  }

  throw new Error("Format non pris en charge. Formats acceptés : PDF, DOCX, TXT, MD, CSV, JSON.");
}

export function registerFileExtraction(app: Express) {
  app.post("/api/extract-file", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Non authentifié." });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Aucun fichier fourni." });
        return;
      }

      const text = await extractText(req.file);
      if (!text) {
        res.status(422).json({ error: "Aucun texte exploitable trouvé dans ce fichier." });
        return;
      }

      res.json({
        filename: req.file.originalname,
        characterCount: text.length,
        text,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Extraction impossible.";
      res.status(400).json({ error: message });
    }
  });
}
