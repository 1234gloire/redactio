/**
 * Endpoint de transcription vocale pour REDACTIO.
 * Reçoit un fichier audio en multipart/form-data, le transcrit via Whisper,
 * et retourne le texte transcrit. Aucun contenu médical n'est journalisé.
 */
import { Express, Request, Response } from "express";
import multer from "multer";
import { transcribeAudio } from "./_core/voiceTranscription";
import { sdk } from "./_core/sdk";

// Stockage en mémoire uniquement — pas de fichier sur disque
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/ogg",
      "audio/m4a",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type audio non supporté : ${file.mimetype}`));
    }
  },
});

export function registerVoiceTranscription(app: Express): void {
  app.post(
    "/api/voice/transcribe",
    upload.single("audio"),
    async (req: Request, res: Response) => {
      // Vérification de l'authentification
      try {
        const user = await sdk.authenticateRequest(req);
        if (!user) {
          res.status(401).json({ error: "Non authentifié" });
          return;
        }
      } catch {
        res.status(401).json({ error: "Session invalide" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Aucun fichier audio reçu" });
        return;
      }

      try {
        // Convertir le buffer en Data URL pour le helper transcribeAudio
        const mimeType = req.file.mimetype;
        const base64 = req.file.buffer.toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64}`;

        const result = await transcribeAudio({
          audioUrl: dataUrl,
          language: "fr",
          prompt:
            "Transcription médicale en français. Vocabulaire médical hospitalier, noms de médicaments, pathologies, actes médicaux.",
        });

        if ("error" in result) {
          res.status(422).json({ error: result.error, details: result.details });
          return;
        }

        // Retourner uniquement le texte — aucun log du contenu
        res.json({
          text: result.text,
          language: result.language ?? "fr",
          duration: result.duration ?? null,
        });
      } catch (err) {
        console.error("[VoiceTranscription] Erreur inattendue (sans contenu)");
        res.status(500).json({ error: "Erreur interne lors de la transcription" });
      }
    }
  );
}
