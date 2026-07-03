import { ENV } from "./env";

export type GoogleTranscribeOptions = {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
};

export type GoogleTranscriptionResponse = {
  text: string;
  language: string;
  duration: number | null;
  provider: "google";
};

export type GoogleTranscriptionError = {
  error: string;
  code: "SERVICE_ERROR" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "FILE_TOO_LARGE";
  details?: string;
};

function getGoogleEncoding(mimeType: string): string | null {
  if (mimeType.includes("webm")) return "WEBM_OPUS";
  if (mimeType.includes("ogg")) return "OGG_OPUS";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "MP3";
  if (mimeType.includes("wav") || mimeType.includes("wave")) return "LINEAR16";
  return null;
}

function formatGoogleText(payload: unknown): string {
  const response = payload as {
    results?: Array<{
      alternatives?: Array<{ transcript?: string; confidence?: number }>;
    }>;
  };

  return (response.results ?? [])
    .map((result) => result.alternatives?.[0]?.transcript?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function transcribeAudioWithGoogle(
  options: GoogleTranscribeOptions
): Promise<GoogleTranscriptionResponse | GoogleTranscriptionError> {
  if (!ENV.googleSpeechApiKey) {
    return {
      error: "Google Speech-to-Text n'est pas configuré",
      code: "SERVICE_ERROR",
      details: "GOOGLE_SPEECH_API_KEY est absent",
    };
  }

  const sizeMB = options.audioBuffer.length / (1024 * 1024);
  if (sizeMB > 10) {
    return {
      error: "Audio trop volumineux pour le test Google Speech-to-Text",
      code: "FILE_TOO_LARGE",
      details: `Taille ${sizeMB.toFixed(2)}MB, maximum conseillé 10MB pour recognize synchrone`,
    };
  }

  const encoding = getGoogleEncoding(options.mimeType);
  if (!encoding) {
    return {
      error: "Format audio non supporté par le test Google Speech-to-Text",
      code: "INVALID_FORMAT",
      details: `MIME reçu : ${options.mimeType}. Utiliser de préférence WebM/Opus ou OGG/Opus.`,
    };
  }

  const languageCode = options.language?.startsWith("fr") ? "fr-FR" : options.language ?? "fr-FR";
  const url = new URL("https://speech.googleapis.com/v1/speech:recognize");
  url.searchParams.set("key", ENV.googleSpeechApiKey);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      config: {
        encoding,
        languageCode,
        enableAutomaticPunctuation: true,
        model: "medical_dictation",
        useEnhanced: true,
      },
      audio: {
        content: options.audioBuffer.toString("base64"),
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      error: "Google Speech-to-Text a refusé la transcription",
      code: "TRANSCRIPTION_FAILED",
      details: payload ? JSON.stringify(payload) : `${response.status} ${response.statusText}`,
    };
  }

  const text = formatGoogleText(payload);
  if (!text) {
    return {
      error: "Google Speech-to-Text n'a retourné aucun texte",
      code: "TRANSCRIPTION_FAILED",
      details: payload ? JSON.stringify(payload) : undefined,
    };
  }

  return {
    text,
    language: languageCode,
    duration: null,
    provider: "google",
  };
}
