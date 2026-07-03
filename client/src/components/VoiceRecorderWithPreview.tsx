/**
 * VoiceRecorderWithPreview — Dictée vocale avec contrôles complets et prévisualisation.
 *
 * Contrôles : Start → Pause → Reprise → Stop → Modal prévisualisation → Insérer / Annuler
 * Indicateur visuel : onde sonore animée (Web Audio API), pulsation orange en pause,
 * spinner pendant la transcription.
 *
 * Modal de prévisualisation :
 *   - Onglet "Édition" : texte éditable
 *   - Onglet "Analyse médicale" : surlignage des termes reconnus + auto-correction Levenshtein
 *
 * Aucun audio n'est stocké côté serveur — traitement en mémoire uniquement.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyVoicePunctuation } from "@/lib/voicePunctuation";
import { Check, Eye, FlaskConical, Loader2, Mic, Pause, Play, RotateCcw, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import MedicalTextHighlighter from "./MedicalTextHighlighter";

type RecordingState = "idle" | "recording" | "paused" | "transcribing" | "preview";
type SpeechProvider = "openai" | "browser";

type BrowserSpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript?: string };
  }>;
};

type BrowserSpeechRecognitionErrorEvent = {
  error?: string;
  message?: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface VoiceRecorderWithPreviewProps {
  /** Appelé quand l'utilisateur valide la transcription */
  onInsert: (text: string) => void;
  /** Libellé du champ cible affiché dans la modal */
  fieldLabel?: string;
  /** Mode d'insertion : 'append' ajoute à la suite, 'replace' remplace */
  insertMode?: "append" | "replace";
  /** Classe CSS supplémentaire */
  className?: string;
  /** Désactiver le composant */
  disabled?: boolean;
}

const MAX_DURATION_MS = 5 * 60 * 1000;

export function VoiceRecorderWithPreview({
  onInsert,
  fieldLabel = "le champ",
  insertMode = "append",
  className,
  disabled = false,
}: VoiceRecorderWithPreviewProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewText, setPreviewText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [analyzedText, setAnalyzedText] = useState(""); // texte après analyse/correction médicale
  const [activeTab, setActiveTab] = useState<"edit" | "analyze">("edit");
  const [bars, setBars] = useState([0.3, 0.6, 1.0, 0.6, 0.3]);
  const [mimeType, setMimeType] = useState("");
  const [speechProvider, setSpeechProvider] = useState<SpeechProvider>("openai");
  const [lastProvider, setLastProvider] = useState<SpeechProvider>("openai");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const browserRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const browserTranscriptRef = useRef("");
  const browserInterimTranscriptRef = useRef("");
  const browserStopModeRef = useRef<"idle" | "pause" | "finish" | "cancel">("idle");
  const stateRef = useRef<RecordingState>(state);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Nettoyage
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopWave();
      browserStopModeRef.current = "cancel";
      browserRecognitionRef.current?.abort();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  };
  const pauseTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };

  // ── Onde sonore ────────────────────────────────────────────────────────────
  const startWave = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(data);
        setBars([data[1], data[3], data[5], data[3], data[1]].map((v) => Math.max(0.15, v / 255)));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch { /* fallback CSS */ }
  };

  const stopWave = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    analyserRef.current = null;
    setBars([0.3, 0.6, 1.0, 0.6, 0.3]);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getMime = (): string => {
    for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const getBrowserSpeechRecognition = (): BrowserSpeechRecognitionConstructor | null => {
    const speechWindow = window as unknown as {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  };

  const openPreview = useCallback((rawText: string, provider: SpeechProvider) => {
    const text = rawText.trim();
    if (!text) {
      toast.warning("Aucun texte détecté. Veuillez réessayer.");
      setState("idle");
      setElapsed(0);
      return;
    }

    const normalizedText = applyVoicePunctuation(text).text;
    setPreviewText(normalizedText);
    setEditedText(normalizedText);
    setAnalyzedText(normalizedText);
    setLastProvider(provider);
    setActiveTab("analyze");
    setState("preview");
  }, []);

  const startBrowserRecognition = useCallback(() => {
    const Recognition = getBrowserSpeechRecognition();
    if (!Recognition) {
      toast.error("Test Voice navigateur disponible uniquement sur Chrome ou Edge.");
      setState("idle");
      setElapsed(0);
      stopTimer();
      return;
    }

    const recognition = new Recognition();
    browserRecognitionRef.current = recognition;
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalText += ` ${transcript}`;
        else interimText += ` ${transcript}`;
      }
      if (finalText.trim()) {
        browserTranscriptRef.current = `${browserTranscriptRef.current} ${finalText}`.trim();
        browserInterimTranscriptRef.current = "";
      } else {
        browserInterimTranscriptRef.current = interimText.trim();
      }
    };

    recognition.onerror = (event) => {
      if (browserStopModeRef.current !== "idle") return;
      const error = event.error ?? event.message ?? "erreur inconnue";
      if (error === "not-allowed") toast.error("Accès au microphone refusé dans le navigateur.");
      else if (error === "no-speech") toast.warning("Aucune parole détectée. Réessayez en parlant plus près du micro.");
      else toast.error(`Test Voice navigateur indisponible : ${error}`);
      browserStopModeRef.current = "cancel";
      stopTimer();
      setState("idle");
      setElapsed(0);
    };

    recognition.onend = () => {
      const mode = browserStopModeRef.current;
      browserRecognitionRef.current = null;
      if (mode === "pause") {
        browserStopModeRef.current = "idle";
        return;
      }
      if (mode === "finish") {
        browserStopModeRef.current = "idle";
        openPreview(`${browserTranscriptRef.current} ${browserInterimTranscriptRef.current}`, "browser");
        return;
      }
      if (mode === "cancel") {
        browserStopModeRef.current = "idle";
        return;
      }

      if (stateRef.current === "recording") {
        try {
          startBrowserRecognition();
        } catch {
          browserStopModeRef.current = "finish";
          openPreview(`${browserTranscriptRef.current} ${browserInterimTranscriptRef.current}`, "browser");
        }
      }
    };

    try {
      recognition.start();
    } catch (err) {
      toast.error(`Impossible de démarrer Test Voice navigateur : ${err instanceof Error ? err.message : "erreur inconnue"}`);
      browserRecognitionRef.current = null;
      stopTimer();
      setState("idle");
      setElapsed(0);
    }
  }, [openPreview]);

  // ── Transcription ──────────────────────────────────────────────────────────
  const transcribeBlob = useCallback(async (blob: Blob, mime: string) => {
    setState("transcribing");
    stopWave();
    try {
      const formData = new FormData();
      const ext = mime.includes("webm") ? "webm" : mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "mp4" : "audio";
      formData.append("audio", blob, `recording.${ext}`);
      formData.append("language", "fr");

      const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur réseau" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const text: string = data.text?.trim() || "";
      openPreview(text, "openai");
    } catch (err: unknown) {
      toast.error(`Transcription échouée : ${err instanceof Error ? err.message : "Erreur inconnue"}`);
      setState("idle");
    }
  }, [openPreview]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (disabled || state !== "idle") return;
    if (speechProvider === "browser") {
      browserTranscriptRef.current = "";
      browserInterimTranscriptRef.current = "";
      browserStopModeRef.current = "idle";
      setState("recording");
      setElapsed(0);
      startTimer();
      startBrowserRecognition();
      toast.info("Test Voice navigateur actif : reconnaissance native Chrome/Edge, sans clé API.");
      maxTimerRef.current = setTimeout(() => {
        toast.warning("Durée maximale atteinte (5 min). Arrêt automatique.");
        browserStopModeRef.current = "finish";
        browserRecognitionRef.current?.stop();
        stopTimer();
        setState("transcribing");
      }, MAX_DURATION_MS);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("La dictée vocale n'est pas supportée par ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mime = getMime();
      setMimeType(mime);
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        chunksRef.current = [];
        if (blob.size < 1000) {
          toast.error("Enregistrement trop court. Veuillez réessayer.");
          setState("idle");
          setElapsed(0);
          return;
        }
        transcribeBlob(blob, mime || "audio/webm");
      };

      recorder.start(250);
      setState("recording");
      setElapsed(0);
      startTimer();
      startWave(stream);

      maxTimerRef.current = setTimeout(() => {
        toast.warning("Durée maximale atteinte (5 min). Arrêt automatique.");
        handleStop();
      }, MAX_DURATION_MS);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") toast.error("Accès au microphone refusé.");
        else if (err.name === "NotFoundError") toast.error("Aucun microphone détecté.");
        else toast.error(`Microphone inaccessible : ${err.message}`);
      }
      setState("idle");
    }
  }, [disabled, state, transcribeBlob, speechProvider, startBrowserRecognition]);

  const handlePause = useCallback(() => {
    if (state !== "recording") return;
    if (speechProvider === "browser") {
      browserStopModeRef.current = "pause";
      browserRecognitionRef.current?.stop();
      pauseTimer();
      setState("paused");
      return;
    }
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.pause();
    pauseTimer();
    stopWave();
    setState("paused");
  }, [state, speechProvider]);

  const handleResume = useCallback(() => {
    if (state !== "paused") return;
    if (speechProvider === "browser") {
      browserStopModeRef.current = "idle";
      startTimer();
      setState("recording");
      startBrowserRecognition();
      return;
    }
    if (mediaRecorderRef.current?.state === "paused") mediaRecorderRef.current.resume();
    startTimer();
    if (streamRef.current) startWave(streamRef.current);
    setState("recording");
  }, [state, speechProvider, startBrowserRecognition]);

  const handleStop = useCallback(() => {
    if (state !== "recording" && state !== "paused") return;
    if (speechProvider === "browser") {
      browserStopModeRef.current = "finish";
      stopTimer();
      setState("transcribing");
      browserRecognitionRef.current?.stop();
      return;
    }
    if (mediaRecorderRef.current?.state === "paused") mediaRecorderRef.current.resume();
    mediaRecorderRef.current?.stop();
    stopTimer();
    stopWave();
    setState("transcribing");
  }, [state, speechProvider]);

  // Texte final à insérer = texte de l'onglet actif
  const getFinalText = () => {
    if (activeTab === "analyze") return analyzedText.trim();
    return editedText.trim();
  };

  const handleInsert = useCallback(() => {
    const text = getFinalText();
    if (!text) { toast.warning("Le texte est vide."); return; }
    onInsert(text);
    setState("idle");
    setPreviewText("");
    setEditedText("");
    setAnalyzedText("");
    setElapsed(0);
    toast.success(insertMode === "append" ? "Transcription ajoutée." : "Champ remplacé.");
  }, [editedText, analyzedText, activeTab, onInsert, insertMode]);

  const handleCancel = useCallback(() => {
    browserStopModeRef.current = "cancel";
    browserRecognitionRef.current?.abort();
    setState("idle");
    setPreviewText("");
    setEditedText("");
    setAnalyzedText("");
    setElapsed(0);
  }, []);

  const handleRetry = useCallback(() => {
    handleCancel();
    setTimeout(() => handleStart(), 150);
  }, [handleCancel, handleStart]);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isTranscribing = state === "transcribing";
  const isActive = isRecording || isPaused;
  const isIdle = state === "idle";

  return (
    <>
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {isIdle && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Button
              type="button"
              variant={speechProvider === "openai" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSpeechProvider("openai")}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              OpenAI
            </Button>
            <Button
              type="button"
              variant={speechProvider === "browser" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSpeechProvider("browser")}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              Test Voice navigateur
            </Button>
          </div>
        )}

        {/* START */}
        {isIdle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStart}
                disabled={disabled}
                aria-label="Démarrer la dictée vocale"
                className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all duration-150"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="text-xs">{speechProvider === "browser" ? "Dicter Chrome/Edge" : "Dicter"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Démarrer la dictée vocale</p></TooltipContent>
          </Tooltip>
        )}

        {/* Indicateur onde sonore + chrono */}
        {isActive && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono",
              isRecording
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
            )}
            role="status"
            aria-live="polite"
          >
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", isRecording ? "bg-red-500 animate-pulse" : "bg-amber-500")} />
            {isRecording && (
              <div className="flex items-center gap-0.5 h-4" aria-hidden="true">
                {bars.map((h, i) => (
                  <div key={i} className="w-0.5 bg-red-500 dark:bg-red-400 rounded-full transition-all duration-75" style={{ height: `${Math.round(h * 16)}px` }} />
                ))}
              </div>
            )}
            {isPaused && <span className="font-semibold text-amber-600 dark:text-amber-400">PAUSE</span>}
            <span className="tabular-nums">{fmt(elapsed)}</span>
          </div>
        )}

        {/* PAUSE */}
        {isRecording && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="sm" onClick={handlePause}
                aria-label="Mettre en pause"
                className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30 transition-all duration-150">
                <Pause className="w-3.5 h-3.5" />
                <span className="text-xs">Pause</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Mettre en pause</p></TooltipContent>
          </Tooltip>
        )}

        {/* REPRENDRE */}
        {isPaused && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="sm" onClick={handleResume}
                aria-label="Reprendre l'enregistrement"
                className="gap-1.5 border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30 transition-all duration-150">
                <Play className="w-3.5 h-3.5" />
                <span className="text-xs">Reprendre</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Reprendre l'enregistrement</p></TooltipContent>
          </Tooltip>
        )}

        {/* STOP */}
        {isActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="destructive" size="sm" onClick={handleStop}
                aria-label="Arrêter et transcrire"
                className="gap-1.5 transition-all duration-150 active:scale-95">
                <Square className="w-3.5 h-3.5" />
                <span className="text-xs">Arrêter</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Arrêter et transcrire</p></TooltipContent>
          </Tooltip>
        )}

        {/* TRANSCRIPTION EN COURS */}
        {isTranscribing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Transcription {speechProvider === "browser" ? "navigateur" : "OpenAI"} en cours…</span>
          </div>
        )}
      </div>

      {/* ── Modal de prévisualisation ──────────────────────────────────────── */}
      <Dialog open={state === "preview"} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                : "Le texte remplacera le contenu existant."}{" "}
              Les commandes vocales comme « point », « virgule » ou « à la ligne » sont converties automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "analyze")}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="edit" className="flex-1 gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Édition manuelle
                </TabsTrigger>
                <TabsTrigger value="analyze" className="flex-1 gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Analyse médicale
                  <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 bg-primary/10 text-primary">IA</Badge>
                </TabsTrigger>
              </TabsList>

              {/* ── Onglet Édition ── */}
              <TabsContent value="edit" className="space-y-3 mt-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Texte transcrit (modifiable)
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {lastProvider === "browser" ? "Web Speech Chrome/Edge" : "OpenAI Whisper"}
                    </Badge>
                  </div>
                  <Textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={8}
                    className="font-mono text-sm resize-none"
                    placeholder="Texte transcrit..."
                    autoFocus={activeTab === "edit"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editedText.trim().split(/\s+/).filter(Boolean).length} mots · {editedText.length} caractères
                  </p>
                </div>

                {editedText !== previewText && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Le texte a été modifié par rapport à la transcription originale.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Onglet Analyse médicale ── */}
              <TabsContent value="analyze" className="space-y-3 mt-0">
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-primary mb-3">
                  <p className="font-medium mb-1">Analyse du dictionnaire médical</p>
                  <p className="text-muted-foreground">
                    Les termes médicaux reconnus sont{" "}
                    <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-200 border border-emerald-400 mx-0.5 align-middle" />
                    surlignés en vert. Les corrections orthographiques suggérées sont{" "}
                    <span className="inline-block w-2.5 h-2.5 rounded bg-amber-200 border border-amber-400 mx-0.5 align-middle" />
                    surlignées en orange — cliquez pour les appliquer individuellement.
                  </p>
                </div>

                <MedicalTextHighlighter
                  text={editedText}
                  onTextChange={(newText) => setAnalyzedText(newText)}
                />

                {analyzedText !== editedText && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-3">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Des corrections ont été appliquées. Le texte corrigé sera inséré si vous validez depuis cet onglet.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={handleRetry} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Recommencer
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleInsert}
              disabled={!getFinalText()}
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
