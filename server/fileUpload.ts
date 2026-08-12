import type { Request, RequestHandler, Response } from "express";
import multer from "multer";

export const MAX_UPLOAD_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function createMemoryFileUpload() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES, files: 1 },
  });
}

function formatSize(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} Mo`;
}

function getUploadErrorMessage(error: unknown) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return `Fichier trop volumineux. Taille maximale autorisée : ${formatSize(MAX_UPLOAD_FILE_SIZE_BYTES)}.`;
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return "Un seul fichier peut être importé à la fois.";
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return "Champ fichier invalide. Réessayez avec le bouton Parcourir.";
    }
    return `Upload du fichier impossible (${error.code}).`;
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("multipart")) {
    return "Upload du fichier invalide ou interrompu. Réessayez avec un fichier PDF, DOCX ou texte.";
  }
  return "Upload du fichier impossible.";
}

export function runSingleFileUpload(
  uploadSingleFile: RequestHandler,
  req: Request,
  res: Response,
  logTag: string
) {
  return new Promise<boolean>((resolve) => {
    uploadSingleFile(req, res, (error: unknown) => {
      if (!error) {
        resolve(true);
        return;
      }

      const message = getUploadErrorMessage(error);
      console.error(`[${logTag}] upload failed`, {
        message,
        code: error instanceof multer.MulterError ? error.code : undefined,
        originalMessage: error instanceof Error ? error.message : String(error),
      });
      res.status(error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: message });
      resolve(false);
    });
  });
}
