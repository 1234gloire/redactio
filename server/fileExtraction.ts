import type { Express, Request, Response } from "express";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { sdk } from "./_core/sdk";
import { createMemoryFileUpload, runSingleFileUpload } from "./fileUpload";

const execFileAsync = promisify(execFile);
const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv", ".json", ".xml", ".html", ".rtf"]);
const upload = createMemoryFileUpload();

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

function isPageMarkerLine(line: string) {
  return (
    /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/i.test(line) ||
    /^\s*page\s+\d+\s+(?:sur|of)\s+\d+\s*$/i.test(line)
  );
}

function cleanOcrText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !isPageMarkerLine(line))
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

export function hasUsableExtractedText(text: string) {
  return scoreOcrText(text) >= 120;
}

async function execTesseract(imagePath: string, args: string[]) {
  const { stdout } = await execFileAsync("tesseract", [imagePath, "stdout", ...args], {
    maxBuffer: 30 * 1024 * 1024,
  });
  return stdout;
}

async function runTesseract(imagePath: string) {
  // PSM 6 (uniform block of text) covers the common case — a typed letter/report page.
  // Other modes are only tried if 6 doesn't produce a usable result, to avoid running
  // OCR up to 4x per page (very slow on multi-page documents).
  const pageSegmentationModes = ["6", "4", "3", "11"];
  let languageError: unknown = null;
  let best = "";
  let bestScore = -1;

  for (const psm of pageSegmentationModes) {
    let text: string | null = null;
    try {
      text = await execTesseract(imagePath, ["-l", "fra+eng", "--oem", "1", "--psm", psm, "-c", "preserve_interword_spaces=1"]);
    } catch (error) {
      if (isCommandMissing(error)) throw error;
      languageError = error;
      try {
        text = await execTesseract(imagePath, ["--psm", psm]);
      } catch (fallbackError) {
        if (isCommandMissing(fallbackError)) throw fallbackError;
        continue;
      }
    }

    const cleaned = cleanOcrText(text ?? "");
    const score = scoreOcrText(cleaned);
    if (score > bestScore) {
      best = cleaned;
      bestScore = score;
    }
    if (bestScore >= 120) break; // usable text found, no need to try further modes
  }

  if (bestScore < 0 && languageError) throw languageError;
  return best;
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
      const text = cleanOcrText(parsed.text?.trim() ?? "");
      if (!hasUsableExtractedText(text)) {
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
  app.post("/api/extract-file", async (req: Request, res: Response) => {
    const uploadOk = await runSingleFileUpload(upload.single("file"), req, res, "FileExtraction");
    if (!uploadOk) return;

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
      console.error("[FileExtraction] failed", { message });
      res.status(400).json({ error: message });
    }
  });
}
