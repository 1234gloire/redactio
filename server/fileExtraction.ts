import type { Express, Request, Response } from "express";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import mammoth from "mammoth";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { sdk } from "./_core/sdk";

const execFileAsync = promisify(execFile);
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

function isCommandMissing(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      ((error as { code?: unknown }).code === "ENOENT" || (error as { code?: unknown }).code === 127)
  );
}

function getOcrInstallMessage() {
  return "PDF scanné sans texte extractible. Installez l'OCR serveur (poppler-utils, tesseract-ocr, tesseract-ocr-fra) ou ajoutez une version OCRisée.";
}

async function runTesseract(imagePath: string) {
  try {
    const { stdout } = await execFileAsync(
      "tesseract",
      [imagePath, "stdout", "-l", "fra+eng", "--psm", "6"],
      { maxBuffer: 20 * 1024 * 1024 }
    );
    return stdout;
  } catch (error) {
    if (isCommandMissing(error)) throw error;
    const { stdout } = await execFileAsync("tesseract", [imagePath, "stdout", "--psm", "6"], {
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout;
  }
}

async function extractScannedPdfText(buffer: Buffer) {
  const workDir = await mkdtemp(path.join(tmpdir(), "redactio-ocr-"));
  try {
    const pdfPath = path.join(workDir, "source.pdf");
    const outputPrefix = path.join(workDir, "page");
    await writeFile(pdfPath, buffer);

    try {
      await execFileAsync("pdftoppm", ["-png", "-r", "220", pdfPath, outputPrefix], {
        maxBuffer: 20 * 1024 * 1024,
      });
    } catch (error) {
      if (isCommandMissing(error)) {
        throw new Error(getOcrInstallMessage());
      }
      throw error;
    }

    const imageFiles = (await readdir(workDir))
      .filter((filename) => filename.startsWith("page-") && filename.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (imageFiles.length === 0) {
      throw new Error("PDF scanné sans page image exploitable.");
    }

    const pageTexts: string[] = [];
    for (const imageFile of imageFiles) {
      try {
        const text = await runTesseract(path.join(workDir, imageFile));
        if (text.trim()) pageTexts.push(text.trim());
      } catch (error) {
        if (isCommandMissing(error)) {
          throw new Error(getOcrInstallMessage());
        }
        throw error;
      }
    }

    return pageTexts.join("\n\n").trim();
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export async function extractText(file: Express.Multer.File) {
  const extension = getExtension(file.originalname);

  if (extension === ".pdf" || file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      const text = parsed.text?.trim() ?? "";
      if (!text) {
        return extractScannedPdfText(file.buffer);
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
