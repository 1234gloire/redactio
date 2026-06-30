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

function cleanOcrText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/i.test(line))
    .filter((line) => !/^\s*page\s+\d+\s+(?:sur|of)\s+\d+\s*$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function scoreOcrText(text: string) {
  const cleaned = cleanOcrText(text);
  const letters = cleaned.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g)?.length ?? 0;
  const medicalHits = (
    cleaned.match(
      /\b(?:indication|technique|r[ée]sultat|conclusion|scanner|irm|radio|échographie|angio|patient|patiente|examen|c[ée]r[ée]bral|cr[âa]ne|injection|lésion|saignement|st[ée]nose)\b/gi
    ) ?? []
  ).length;
  return letters + medicalHits * 80;
}

async function execTesseract(imagePath: string, args: string[]) {
  const { stdout } = await execFileAsync("tesseract", [imagePath, "stdout", ...args], {
    maxBuffer: 30 * 1024 * 1024,
  });
  return stdout;
}

async function runTesseract(imagePath: string) {
  const pageSegmentationModes = ["4", "3", "6", "11"];
  const attempts = pageSegmentationModes.map((psm) => [
    "-l",
    "fra+eng",
    "--oem",
    "1",
    "--psm",
    psm,
    "-c",
    "preserve_interword_spaces=1",
  ]);
  let languageError: unknown = null;
  const candidates: string[] = [];

  try {
    for (const args of attempts) {
      candidates.push(await execTesseract(imagePath, args));
    }
  } catch (error) {
    if (isCommandMissing(error)) throw error;
    languageError = error;
  }

  if (candidates.length === 0) {
    try {
      for (const psm of pageSegmentationModes) {
        candidates.push(await execTesseract(imagePath, ["--psm", psm]));
      }
    } catch (error) {
      if (isCommandMissing(error)) throw error;
      throw languageError ?? error;
    }
  }

  return candidates
    .map(cleanOcrText)
    .sort((a, b) => scoreOcrText(b) - scoreOcrText(a))[0] ?? "";
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
        const text = cleanOcrText(await runTesseract(path.join(workDir, imageFile)));
        if (text.trim()) pageTexts.push(text.trim());
      } catch (error) {
        if (isCommandMissing(error)) {
          throw new Error(getOcrInstallMessage());
        }
        throw error;
      }
    }

    const text = cleanOcrText(pageTexts.join("\n\n"));
    if (scoreOcrText(text) < 120) {
      throw new Error(
        "OCR terminé, mais aucun texte médical exploitable n'a été reconnu. Essayez un scan plus net ou une version PDF OCRisée."
      );
    }
    return text;
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
