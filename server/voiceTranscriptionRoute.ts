/**
 * Endpoint de transcription vocale pour REDACTIO.
 * Reçoit un fichier audio en multipart/form-data, le transcrit via Whisper,
 * et retourne le texte transcrit. Aucun contenu médical n'est journalisé.
 */
import { Express, Request, Response } from "express";
import multer from "multer";
import { transcribeAudio } from "./_core/voiceTranscription";
import { sdk } from "./_core/sdk";
import { createAnthropicMessage } from "./_core/anthropic";
import {
  buildDictationCorrectionSystemPrompt,
  buildWhisperMedicalPrompt,
  normalizeDictationField,
  type DictationCorrectionModification,
} from "./dictationMedicalContext";

const DICTATION_CORRECTION_TYPES = [
  "orthographe",
  "grammaire",
  "ponctuation",
  "terminologie",
  "ambigu",
] as const;

function isDictationCorrectionType(
  value: string
): value is DictationCorrectionModification["type"] {
  return DICTATION_CORRECTION_TYPES.includes(
    value as DictationCorrectionModification["type"]
  );
}

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
        const mimeType = req.file.mimetype;

        // Convertir le buffer en Data URL pour le helper transcribeAudio
        const base64 = req.file.buffer.toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64}`;

        const field = normalizeDictationField(req.body?.champ ?? req.body?.fieldLabel ?? req.body?.field ?? "");
        const result = await transcribeAudio({
          audioUrl: dataUrl,
          language: String(req.body?.language ?? "fr") || "fr",
          prompt: buildWhisperMedicalPrompt(field),
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
          provider: "openai",
        });
      } catch (err) {
        console.error("[VoiceTranscription] Erreur inattendue (sans contenu)");
        res.status(500).json({ error: "Erreur interne lors de la transcription" });
      }
    }
  );

  app.post("/api/dictation/correct", async (req: Request, res: Response) => {
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

    const rawText = typeof req.body?.texte_brut === "string" ? req.body.texte_brut.trim() : "";
    if (!rawText) {
      res.status(400).json({ error: "Texte à corriger manquant" });
      return;
    }
    if (rawText.length > 20_000) {
      res.status(413).json({ error: "Texte trop long pour la correction de dictée" });
      return;
    }

    const field = normalizeDictationField(req.body?.champ ?? req.body?.fieldLabel ?? "");

    try {
      const content = await createAnthropicMessage({
        system: buildDictationCorrectionSystemPrompt(field),
        maxTokens: 2500,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `Corrige cette transcription de dictée médicale et retourne ce JSON exact :
{
  "texte_corrige": "...",
  "modifications": [
    {"original":"...", "corrige":"...", "type":"orthographe|grammaire|ponctuation|terminologie|ambigu"}
  ]
}

TRANSCRIPTION SOURCE :
${rawText}`,
          },
        ],
      });

      const cleaned = content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");
      const parsed = JSON.parse(cleaned) as {
        texte_corrige?: unknown;
        modifications?: unknown;
      };
      const corrected = typeof parsed.texte_corrige === "string" ? parsed.texte_corrige.trim() : rawText;
      const modifications = Array.isArray(parsed.modifications)
        ? parsed.modifications
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const record = item as Record<string, unknown>;
              const type = String(record.type ?? "");
              if (!isDictationCorrectionType(type)) return null;
              return {
                original: String(record.original ?? ""),
                corrige: String(record.corrige ?? ""),
                type,
              } satisfies DictationCorrectionModification;
            })
            .filter(Boolean)
        : [];

      res.json({
        texte_corrige: corrected,
        modifications,
      });
    } catch (error) {
      console.error("[DictationCorrection] Erreur correction IA (sans contenu)");
      res.status(502).json({ error: "Correction IA indisponible" });
    }
  });
}
