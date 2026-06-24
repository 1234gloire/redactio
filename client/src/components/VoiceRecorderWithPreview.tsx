/**
 * VoiceRecorderWithPreview — Composant de dictée vocale avec prévisualisation
 * avant insertion dans le champ cible. Conforme aux exigences REDACTIO :
 * - Enregistrement via MediaRecorder (WebM/Opus)
 * - Transcription via Whisper (/api/voice/transcribe)
 * - Prévisualisation dans une modal avant insertion
 * - Aucun contenu médical n'est journalisé côté serveur
 */
import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Eye, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RecordingState = "idle" | "recording" | "transcribing" | "preview";

interface VoiceRecorderWithPreviewProps {
  /** Appelé quand l'utilisateur valide la transcription — insère le texte */
  onInsert: (text: string) => void;
  /** Libellé du champ cible affiché dans la modal de prévisualisation */
  fieldLabel?: string;
  /** Mode d'insertion : 'append' ajoute à la suite, 'replace' remplace */
  insertMode?: "append" | "replace";
  /** Classe CSS supplémentaire pour le bouton déclencheur */
  className?: string;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Taille du bouton */
  size?: "sm" | "default" | "lg";
}

const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function VoiceRecorderWithPreview({
  onInsert,
  fieldLabel = "le champ",
  insertMode = "append",
  className,
  disabled = false,
  size = "sm",
}: VoiceRecorderWithPreviewProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [previewText, setPreviewText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [duration, setDuration] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    stopTimer();
  }, [stopTimer]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setState("transcribing");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", "fr");

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur de transcription" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text: string = data.text?.trim() || "";

      if (!text) {
        toast.warning("Aucun texte détecté dans l'enregistrement.");
        setState("idle");
        return;
      }

      setPreviewText(text);
      setEditedText(text);
      setState("preview");
      setShowPreview(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de transcription";
      toast.error(`Transcription échouée : ${msg}`);
      setState("idle");
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        transcribeAudio(blob);
      };

      recorder.start(250); // chunks toutes les 250ms
      setState("recording");
      startTimer();

      // Arrêt automatique après 5 minutes
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
        toast.info("Enregistrement arrêté automatiquement (limite 5 min).");
      }, MAX_DURATION_MS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Accès au microphone refusé";
      toast.error(`Impossible d'accéder au microphone : ${msg}`);
      setState("idle");
    }
  }, [disabled, startTimer, stopRecording, transcribeAudio]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    // onstop sera appelé automatiquement par MediaRecorder
  }, [stopRecording]);

  const handleInsert = useCallback(() => {
    const textToInsert = editedText.trim();
    if (!textToInsert) {
      toast.warning("Le texte de transcription est vide.");
      return;
    }
    onInsert(textToInsert);
    setShowPreview(false);
    setState("idle");
    setPreviewText("");
    setEditedText("");
    toast.success(
      insertMode === "append"
        ? "Transcription ajoutée au champ."
        : "Champ remplacé par la transcription."
    );
  }, [editedText, onInsert, insertMode]);

  const handleCancel = useCallback(() => {
    setShowPreview(false);
    setState("idle");
    setPreviewText("");
    setEditedText("");
  }, []);

  const handleRetry = useCallback(() => {
    setShowPreview(false);
    setState("idle");
    setPreviewText("");
    setEditedText("");
    // Relancer immédiatement l'enregistrement
    setTimeout(() => handleStartRecording(), 100);
  }, [handleStartRecording]);

  // ── Rendu du bouton déclencheur ─────────────────────────────────────────────
  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";
  const isIdle = state === "idle";

  return (
    <>
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size={size}
        disabled={disabled || isTranscribing}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        className={cn(
          "gap-1.5 transition-all duration-200",
          isRecording && "animate-pulse",
          className
        )}
        title={
          isRecording
            ? `Arrêter l'enregistrement (${formatDuration(duration)})`
            : isTranscribing
            ? "Transcription en cours..."
            : "Démarrer la dictée vocale"
        }
      >
        {isTranscribing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-3.5 w-3.5" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
        {isRecording && (
          <span className="text-xs font-mono tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
        {isTranscribing && <span className="text-xs">Transcription...</span>}
      </Button>

      {/* ── Modal de prévisualisation ──────────────────────────────────────── */}
      <Dialog open={showPreview} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Prévisualisation de la transcription
            </DialogTitle>
            <DialogDescription>
              Vérifiez et corrigez si nécessaire le texte transcrit avant de l'insérer dans{" "}
              <strong>{fieldLabel}</strong>.{" "}
              {insertMode === "append"
                ? "Le texte sera ajouté à la suite du contenu existant."
                : "Le texte remplacera le contenu existant."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Texte original Whisper */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Texte transcrit (modifiable)
                </span>
                <Badge variant="secondary" className="text-xs">
                  Whisper FR
                </Badge>
              </div>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={8}
                className="font-mono text-sm resize-none"
                placeholder="Texte transcrit..."
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {editedText.trim().split(/\s+/).filter(Boolean).length} mots ·{" "}
                {editedText.length} caractères
              </p>
            </div>

            {/* Diff si le texte a été modifié */}
            {editedText !== previewText && (
              <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Le texte a été modifié par rapport à la transcription originale.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Recommencer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleInsert}
              disabled={!editedText.trim()}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {insertMode === "append" ? "Insérer à la suite" : "Remplacer le contenu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VoiceRecorderWithPreview;
