/**
 * VoiceRecorder — Composant de dictée vocale pour REDACTIO.
 *
 * Fonctionnement :
 * 1. L'utilisateur clique sur le bouton micro → enregistrement MediaRecorder (WebM/opus)
 * 2. À l'arrêt, le blob audio est envoyé à /api/voice/transcribe (Whisper)
 * 3. Le texte transcrit est inséré dans le textarea via onTranscript(text)
 * 4. Le mode "append" ajoute le texte à la fin du contenu existant
 *
 * Aucun audio n'est stocké côté serveur — traitement en mémoire uniquement.
 */
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Loader2, Mic, MicOff, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type RecordingState = "idle" | "recording" | "transcribing" | "error";

interface VoiceRecorderProps {
  /** Appelé avec le texte transcrit — à insérer dans le champ cible */
  onTranscript: (text: string) => void;
  /** Désactiver le bouton (ex : pendant la génération IA) */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
  /** Taille du bouton */
  size?: "sm" | "default" | "lg" | "icon";
}

const MAX_RECORDING_MS = 5 * 60 * 1000; // 5 minutes max

export default function VoiceRecorder({
  onTranscript,
  disabled = false,
  className,
  size = "icon",
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0); // secondes
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  };

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    // Arrêt automatique après MAX_RECORDING_MS
    autoStopRef.current = setTimeout(() => {
      toast.warning("Durée maximale atteinte (5 min). Arrêt automatique.");
      stopRecording();
    }, MAX_RECORDING_MS);
  };

  const getMimeType = (): string => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const startRecording = useCallback(async () => {
    if (state !== "idle") return;

    // Vérifier le support du navigateur
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("La dictée vocale n'est pas supportée par ce navigateur.");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        chunksRef.current = [];

        if (blob.size < 1000) {
          toast.error("Enregistrement trop court ou vide. Veuillez réessayer.");
          setState("idle");
          return;
        }

        await transcribeBlob(blob, mimeType || "audio/webm");
      };

      recorder.start(250); // collecte par chunks de 250ms
      setState("recording");
      startTimer();
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          toast.error(
            "Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres du navigateur."
          );
        } else if (err.name === "NotFoundError") {
          toast.error("Aucun microphone détecté sur cet appareil.");
        } else {
          toast.error(`Impossible d'accéder au microphone : ${err.message}`);
        }
      }
      setState("idle");
    }
  }, [state]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      setState("transcribing");
    }
  }, [state]);

  const transcribeBlob = async (blob: Blob, mimeType: string) => {
    setState("transcribing");
    try {
      const formData = new FormData();
      // Déterminer l'extension selon le mimeType
      const ext = mimeType.includes("webm")
        ? "webm"
        : mimeType.includes("ogg")
        ? "ogg"
        : mimeType.includes("mp4")
        ? "mp4"
        : "audio";
      formData.append("audio", blob, `recording.${ext}`);

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erreur réseau" }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.text || !data.text.trim()) {
        toast.warning("Aucun texte détecté dans l'enregistrement. Veuillez réessayer.");
        setState("idle");
        return;
      }

      onTranscript(data.text.trim());
      toast.success("Dictée transcrite avec succès.");
      setState("idle");
      setElapsed(0);
    } catch (err) {
      console.error("[VoiceRecorder] Erreur transcription");
      toast.error(
        err instanceof Error
          ? `Transcription échouée : ${err.message}`
          : "Erreur lors de la transcription vocale."
      );
      setState("idle");
    }
  };

  const handleClick = () => {
    if (state === "idle") startRecording();
    else if (state === "recording") stopRecording();
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";
  const isDisabled = disabled || isTranscribing;

  const tooltipText =
    state === "idle"
      ? "Démarrer la dictée vocale"
      : state === "recording"
      ? `Arrêter l'enregistrement (${formatElapsed(elapsed)})`
      : state === "transcribing"
      ? "Transcription en cours…"
      : "Dictée vocale";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size={size}
            onClick={handleClick}
            disabled={isDisabled}
            aria-label={tooltipText}
            aria-pressed={isRecording}
            className={cn(
              "relative transition-all duration-200",
              isRecording && "ring-2 ring-red-400 ring-offset-1 animate-pulse-subtle",
              isTranscribing && "opacity-70 cursor-not-allowed"
            )}
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording ? (
              <Square className="w-4 h-4" />
            ) : state === "error" ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>

      {/* Indicateur de durée pendant l'enregistrement */}
      {isRecording && (
        <div
          className="flex items-center gap-1.5 text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md border border-red-200 dark:border-red-800"
          aria-live="polite"
          aria-atomic="true"
          role="timer"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {formatElapsed(elapsed)}
        </div>
      )}

      {/* Indicateur de transcription */}
      {isTranscribing && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Transcription…
        </span>
      )}
    </div>
  );
}
