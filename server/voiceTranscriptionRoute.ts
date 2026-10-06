/**
 * Endpoint de transcription vocale pour MEDACTIO.
 * Reçoit un fichier audio en multipart/form-data, le transcrit via Whisper,
 * corrige la dictée via IA, puis retourne le texte corrigé.
 * Aucun contenu médical n'est journalisé.
 */
import { Express, Request, Response } from "express";
import multer from "multer";
import { transcribeAudio } from "./_core/voiceTranscription";
import { sdk } from "./_core/sdk";
import { createAnthropicMessage } from "./_core/anthropic";
import {
  buildDictationCorrectionSystemPrompt,
  buildWhisperMedicalPrompt,
  normalizeDictationTranscription,
  normalizeDictationField,
  type DictationCorrectionModification,
  type DictationField,
} from "./dictationMedicalContext";

const DICTATION_CORRECTION_TYPES = [
  "orthographe",
  "grammaire",
  "ponctuation",
  "terminologie",
  "nombre",
  "nom_propre",
  "ambigu",
] as const;

function isDictationCorrectionType(
  value: string
): value is DictationCorrectionModification["type"] {
  return DICTATION_CORRECTION_TYPES.includes(
    value as DictationCorrectionModification["type"]
  );
}

type DictationCorrectionPayload = {
  texte_corrige: string;
  modifications: DictationCorrectionModification[];
  genre_retenu: "masculin" | "feminin" | "indetermine";
};

function sanitizeCorrectionJson(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

function normalizeCorrectionGenre(value: unknown): DictationCorrectionPayload["genre_retenu"] {
  return value === "masculin" || value === "feminin" ? value : "indetermine";
}

function parseDictationCorrection(content: string): DictationCorrectionPayload {
  const parsed = JSON.parse(sanitizeCorrectionJson(content)) as {
    texte_corrige?: unknown;
    modifications?: unknown;
    genre_retenu?: unknown;
  };

  if (typeof parsed.texte_corrige !== "string" || !parsed.texte_corrige.trim()) {
    throw new Error("Réponse IA invalide : champ texte_corrige absent");
  }

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
        .filter((item): item is DictationCorrectionModification => Boolean(item))
    : [];

  return {
    texte_corrige: parsed.texte_corrige.trim(),
    modifications,
    genre_retenu: normalizeCorrectionGenre(parsed.genre_retenu),
  };
}

async function correctDictationText(rawText: string, field: DictationField): Promise<DictationCorrectionPayload> {
  const normalizedText = normalizeDictationTranscription(rawText);
  const content = await createAnthropicMessage({
    system: buildDictationCorrectionSystemPrompt(field),
    maxTokens: 2500,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Corrige cette transcription de dictée médicale. Applique R1 à R8. Retourne exactement ce JSON :
{
  "texte_corrige": "...",
  "modifications": [
    {"original":"...", "corrige":"...", "type":"orthographe|grammaire|ponctuation|terminologie|nombre|nom_propre|ambigu"}
  ],
  "genre_retenu": "masculin|feminin|indetermine"
}

TRANSCRIPTION SOURCE :
${normalizedText}`,
      },
    ],
  });

  return parseDictationCorrection(content);
}

function logDictationCorrectionError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "erreur inconnue";
  console.error(`[DictationCorrection] ${scope} (sans contenu): ${message}`);
}

// Stockage en mémoire uniquement — pas de fichier sur disque
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16 MB max
  },
  fileFilter: (_req, file, cb) => {
    const mimeType = file.mimetype.split(";")[0]?.trim().toLowerCase() || file.mimetype;
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
    if (allowed.includes(mimeType)) {
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

        const transcribedText = result.text?.trim() ?? "";
        if (!transcribedText) {
          res.status(422).json({ error: "Aucun texte détecté dans l'enregistrement" });
          return;
        }

        let correction: DictationCorrectionPayload;
        try {
          correction = await correctDictationText(transcribedText, field);
        } catch (error) {
          logDictationCorrectionError("Correction après transcription échouée", error);
          res.status(502).json({
            error: "Correction IA indisponible",
            details: "La transcription a réussi, mais le texte corrigé n'a pas pu être produit. Le texte non corrigé n'a pas été inséré.",
          });
          return;
        }

        // Retourner le texte corrigé — aucun log du contenu
        res.json({
          text: correction.texte_corrige,
          texte_corrige: correction.texte_corrige,
          modifications: correction.modifications,
          genre_retenu: correction.genre_retenu,
          correctionApplied: true,
          language: result.language ?? "fr",
          duration: result.duration ?? null,
          provider: "openai+anthropic",
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
      const correction = await correctDictationText(rawText, field);

      res.json({
        texte_corrige: correction.texte_corrige,
        modifications: correction.modifications,
        genre_retenu: correction.genre_retenu,
      });
    } catch (error) {
      logDictationCorrectionError("Correction manuelle échouée", error);
      res.status(502).json({
        error: "Correction IA indisponible",
        details: "Le texte corrigé n'a pas pu être produit. Le texte non corrigé n'a pas été renvoyé.",
      });
    }
  });
}
