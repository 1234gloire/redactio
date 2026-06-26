/**
 * VoiceRecorder — Composant de dictée vocale pour REDACTIO.
 *
 * Contrôles complets : Start → Pause → Reprise → Stop
 * Indicateur visuel : onde sonore animée pendant l'enregistrement,
 * pulsation orange pendant la pause, spinner pendant la transcription.
 *
 * Aucun audio n'est stocké côté serveur — traitement en mémoire uniquement.
 */
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyVoicePunctuation } from "@/lib/voicePunctuation";
import { Loader2, Mic, MicOff, Pause, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type RecordingState = "idle" | "recording" | "paused" | "transcribing" | "error";

interface VoiceRecorderProps {
  /** Appelé avec le texte transcrit — à insérer dans le champ cible */
  onTranscript: (text: string) => void;
  /** Désactiver le bouton (ex : pendant la génération IA) */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}

const MAX_RECORDING_MS = 5 * 60 * 1000; // 5 minutes max

export default function VoiceRecorder({
  onTranscript,
  disabled = false,
  className,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0); // secondes cumulées (hors pause)
  const [mimeType, setMimeType] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Amplitude bars pour l'onde sonore (5 barres)
  const [bars, setBars] = useState([0.3, 0.6, 1.0, 0.6, 0.3]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      stopTimer();
      stopWaveAnimation();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
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
    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Onde sonore (Web Audio API) ───────────────────────────────────────────
  const startWaveAnimation = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        // Prendre 5 bins représentatifs
        const newBars = [
          dataArray[1] / 255,
          dataArray[3] / 255,
          dataArray[5] / 255,
          dataArray[3] / 255,
          dataArray[1] / 255,
        ].map((v) => Math.max(0.15, v));
        setBars(newBars);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch {
      // Fallback : animation CSS pulsante si Web Audio API indisponible
    }
  };

  const stopWaveAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    setBars([0.3, 0.6, 1.0, 0.6, 0.3]);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Transcription ─────────────────────────────────────────────────────────
  const transcribeBlob = useCallback(async (blob: Blob, mime: string) => {
    setState("transcribing");
    stopWaveAnimation();
    try {
      const formData = new FormData();
      const ext = mime.includes("webm") ? "webm" : mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "mp4" : "audio";
      formData.append("audio", blob, `recording.${ext}`);
      formData.append("language", "fr");

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
      if (!data.text?.trim()) {
        toast.warning("Aucun texte détecté dans l'enregistrement. Veuillez réessayer.");
        setState("idle");
        setElapsed(0);
        return;
      }

      const normalizedText = applyVoicePunctuation(data.text.trim()).text;
      onTranscript(normalizedText);
      toast.success("Dictée transcrite avec succès.");
      setState("idle");
      setElapsed(0);
    } catch (err) {
      toast.error(err instanceof Error ? `Transcription échouée : ${err.message}` : "Erreur lors de la transcription vocale.");
      setState("idle");
    }
  }, [onTranscript]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (disabled || state !== "idle") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("La dictée vocale n'est pas supportée par ce navigateur.");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mime = getMimeType();
      setMimeType(mime);
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        chunksRef.current = [];
        if (blob.size < 1000) {
          toast.error("Enregistrement trop court ou vide. Veuillez réessayer.");
          setState("idle");
          setElapsed(0);
          return;
        }
        await transcribeBlob(blob, mime || "audio/webm");
      };

      recorder.start(250);
      setState("recording");
      setElapsed(0);
      startTimer();
      startWaveAnimation(stream);

      // Arrêt automatique après 5 min
      autoStopRef.current = setTimeout(() => {
        toast.warning("Durée maximale atteinte (5 min). Arrêt automatique.");
        handleStop();
      }, MAX_RECORDING_MS);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          toast.error("Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.");
        } else if (err.name === "NotFoundError") {
          toast.error("Aucun microphone détecté sur cet appareil.");
        } else {
          toast.error(`Impossible d'accéder au microphone : ${err.message}`);
        }
      }
      setState("idle");
    }
  }, [disabled, state, transcribeBlob]);

  const handlePause = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
      pauseTimer();
      stopWaveAnimation();
      setState("paused");
    }
  }, [state]);

  const handleResume = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      if (mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
      startTimer();
      if (streamRef.current) startWaveAnimation(streamRef.current);
      setState("recording");
    }
  }, [state]);

  const handleStop = useCallback(() => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      // Si en pause, reprendre brièvement pour déclencher onstop proprement
      if (mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
      mediaRecorderRef.current.stop();
      stopTimer();
      stopWaveAnimation();
      setState("transcribing");
    }
  }, [state]);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isTranscribing = state === "transcribing";
  const isActive = isRecording || isPaused;
  const isIdle = state === "idle" || state === "error";

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>

      {/* ── Bouton START (visible uniquement à l'état idle) ─────────────── */}
      {isIdle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStart}
              disabled={disabled || isTranscribing}
              aria-label="Démarrer la dictée vocale"
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all duration-150"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="text-xs">Dicter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs">Démarrer la dictée vocale</p></TooltipContent>
        </Tooltip>
      )}

      {/* ── Indicateur d'onde sonore + chronomètre (pendant enregistrement) ── */}
      {isActive && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200",
            isRecording
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
          )}
          role="status"
          aria-live="polite"
        >
          {/* Point REC animé */}
          <span
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              isRecording ? "bg-red-500 animate-pulse" : "bg-amber-500"
            )}
          />

          {/* Onde sonore (5 barres) */}
          {isRecording && (
            <div className="flex items-center gap-0.5 h-4" aria-hidden="true">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-red-500 dark:bg-red-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.round(h * 16)}px` }}
                />
              ))}
            </div>
          )}

          {/* Icône pause */}
          {isPaused && (
            <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">PAUSE</span>
          )}

          {/* Chronomètre */}
          <span className="tabular-nums" aria-label={`Durée : ${formatElapsed(elapsed)}`}>
            {formatElapsed(elapsed)}
          </span>
        </div>
      )}

      {/* ── Bouton PAUSE (visible pendant enregistrement) ───────────────── */}
      {isRecording && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePause}
              aria-label="Mettre en pause"
              className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30 transition-all duration-150"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="text-xs">Pause</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs">Mettre en pause</p></TooltipContent>
        </Tooltip>
      )}

      {/* ── Bouton REPRENDRE (visible pendant pause) ────────────────────── */}
      {isPaused && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResume}
              aria-label="Reprendre l'enregistrement"
              className="gap-1.5 border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30 transition-all duration-150"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="text-xs">Reprendre</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs">Reprendre l'enregistrement</p></TooltipContent>
        </Tooltip>
      )}

      {/* ── Bouton STOP (visible pendant enregistrement ou pause) ───────── */}
      {isActive && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleStop}
              aria-label="Arrêter et transcrire"
              className="gap-1.5 transition-all duration-150 active:scale-95"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="text-xs">Arrêter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs">Arrêter et transcrire</p></TooltipContent>
        </Tooltip>
      )}

      {/* ── État transcription en cours ─────────────────────────────────── */}
      {isTranscribing && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Transcription en cours…</span>
        </div>
      )}

      {/* ── Erreur micro ────────────────────────────────────────────────── */}
      {state === "error" && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <MicOff className="w-3.5 h-3.5" />
          <span>Microphone indisponible</span>
        </div>
      )}
    </div>
  );
}
