/**
 * LiveSpeechRecorder — Dictée vocale temps réel via Web Speech API.
 *
 * Le texte reconnu apparaît directement dans le champ cible pendant la dictée :
 *  - Texte intermédiaire (interim) : affiché en italique gris dans la zone de prévisualisation
 *  - Texte final : traité par le moteur de ponctuation puis inséré dans le champ
 *
 * Commandes vocales de ponctuation reconnues :
 *   "virgule"           → ,
 *   "point"             → .
 *   "point d'interrogation" / "point interrogation" → ?
 *   "point d'exclamation" / "point exclamation"     → !
 *   "deux points"       → :
 *   "point-virgule" / "point virgule" → ;
 *   "à la ligne" / "nouvelle ligne"   → \n
 *   "nouveau paragraphe" / "nouvelle paragraphe" → \n\n
 *   "ouvrir parenthèse" / "parenthèse ouvrante"  → (
 *   "fermer parenthèse" / "parenthèse fermante"  → )
 *   "tiret"             → -
 *   "ouvrir guillemets" / "guillemets ouvrants"  → «\u00a0
 *   "fermer guillemets" / "guillemets fermants"  → \u00a0»
 *   "espace"            → (espace forcé)
 *   "effacer"           → (supprime le dernier mot inséré)
 *
 * Contrôles : Dicter → (texte apparaît en direct) → Pause → Reprendre → Arrêter
 *
 * Compatibilité : Chrome, Edge, Safari 14.1+. Fallback gracieux pour Firefox.
 */
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyVoicePunctuation } from "@/lib/voicePunctuation";
import { Mic, MicOff, Pause, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ── Types Web Speech API (non inclus dans lib.dom par défaut) ──────────────
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

type RecordingState = "idle" | "listening" | "paused";

export interface LiveSpeechRecorderProps {
  /** Appelé à chaque fragment final reconnu — à concaténer dans le champ cible */
  onPartialResult: (text: string) => void;
  /** Appelé quand la commande "effacer" est prononcée — supprimer le dernier mot du champ */
  onDeleteLastWord?: () => void;
  /** Texte intermédiaire (interim) en cours de reconnaissance — à afficher en gris */
  onInterimResult?: (text: string) => void;
  /** Appelé quand la session se termine proprement */
  onStop?: () => void;
  /** Classe CSS supplémentaire */
  className?: string;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Langue de reconnaissance (défaut : fr-FR) */
  lang?: string;
}

// ── Tooltip avec liste des commandes ──────────────────────────────────────
const COMMANDS_HELP = [
  { cmd: "virgule", result: "," },
  { cmd: "point", result: "." },
  { cmd: "point d'interrogation", result: "?" },
  { cmd: "point d'exclamation", result: "!" },
  { cmd: "deux points", result: ":" },
  { cmd: "point-virgule", result: ";" },
  { cmd: "à la ligne", result: "↵" },
  { cmd: "nouveau paragraphe", result: "¶" },
  { cmd: "ouvrir parenthèse", result: "(" },
  { cmd: "fermer parenthèse", result: ")" },
  { cmd: "ouvrir guillemets", result: "«" },
  { cmd: "fermer guillemets", result: "»" },
  { cmd: "tiret", result: "–" },
  { cmd: "effacer", result: "⌫ mot" },
];

export default function LiveSpeechRecorder({
  onPartialResult,
  onDeleteLastWord,
  onInterimResult,
  onStop,
  className,
  disabled = false,
  lang = "fr-FR",
}: LiveSpeechRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [isSupported] = useState(() => !!getSpeechRecognition());

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const stoppingRef = useRef(false);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Créer et configurer une instance SpeechRecognition ────────────────────
  const createRecognition = useCallback((): SpeechRecognitionInstance | null => {
    const SR = getSpeechRecognition();
    if (!SR) return null;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          const { text, deleteLastWord } = applyVoicePunctuation(transcript);
          if (deleteLastWord) {
            onDeleteLastWord?.();
          } else if (text) {
            // Ajouter un espace de séparation si le texte ne se termine pas par
            // une ponctuation collante ou un saut de ligne
            const needsTrailingSpace = !/[\n,.:;?!()\u00bb]$/.test(text);
            onPartialResult(text + (needsTrailingSpace ? " " : ""));
          }
        } else {
          interimTranscript += transcript;
        }
      }
      onInterimResult?.(interimTranscript);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast.error("Accès au microphone refusé. Vérifiez les permissions du navigateur.");
        handleStop();
        return;
      }
      if (event.error === "network") {
        toast.error("Erreur réseau lors de la reconnaissance vocale.");
        handleStop();
        return;
      }
      console.warn("[LiveSpeech] error:", event.error, event.message);
    };

    rec.onend = () => {
      onInterimResult?.("");
      if (!pausedRef.current && !stoppingRef.current) {
        try { recognitionRef.current?.start(); } catch { /* ignore */ }
      } else if (stoppingRef.current) {
        stoppingRef.current = false;
        stopTimer();
        setState("idle");
        setElapsed(0);
        onStop?.();
      }
    };

    return rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, onPartialResult, onDeleteLastWord, onInterimResult, onStop, stopTimer]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stoppingRef.current = true;
      recognitionRef.current?.abort();
      stopTimer();
    };
  }, [stopTimer]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (disabled || state !== "idle") return;
    if (!isSupported) {
      toast.error("La reconnaissance vocale n'est pas disponible dans ce navigateur. Utilisez Chrome ou Edge.");
      return;
    }
    stoppingRef.current = false;
    pausedRef.current = false;

    const rec = createRecognition();
    if (!rec) return;
    recognitionRef.current = rec;

    try {
      rec.start();
      setState("listening");
      setElapsed(0);
      startTimer();
    } catch (err) {
      console.error("[LiveSpeech] start failed:", err);
      toast.error("Impossible de démarrer la reconnaissance vocale.");
    }
  }, [disabled, state, isSupported, createRecognition, startTimer]);

  const handlePause = useCallback(() => {
    if (state !== "listening") return;
    pausedRef.current = true;
    recognitionRef.current?.stop();
    stopTimer();
    onInterimResult?.("");
    setState("paused");
  }, [state, stopTimer, onInterimResult]);

  const handleResume = useCallback(() => {
    if (state !== "paused") return;
    pausedRef.current = false;
    stoppingRef.current = false;

    const rec = createRecognition();
    if (!rec) return;
    recognitionRef.current = rec;

    try {
      rec.start();
      setState("listening");
      startTimer();
    } catch (err) {
      console.error("[LiveSpeech] resume failed:", err);
      toast.error("Impossible de reprendre la reconnaissance vocale.");
    }
  }, [state, createRecognition, startTimer]);

  const handleStop = useCallback(() => {
    if (state === "idle") return;
    stoppingRef.current = true;
    pausedRef.current = false;
    recognitionRef.current?.stop();
    stopTimer();
    onInterimResult?.("");
    setState("idle");
    setElapsed(0);
    onStop?.();
  }, [state, stopTimer, onInterimResult, onStop]);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const isListening = state === "listening";
  const isPaused = state === "paused";
  const isActive = isListening || isPaused;

  if (!isSupported) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className={cn("gap-1.5 opacity-50 cursor-not-allowed", className)}
          >
            <MicOff className="w-3.5 h-3.5" />
            <span className="text-xs">Dictée</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Reconnaissance vocale non disponible dans ce navigateur.<br />Utilisez Chrome ou Edge.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>

      {/* DÉMARRER */}
      {state === "idle" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStart}
              disabled={disabled}
              aria-label="Démarrer la dictée vocale en direct"
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all duration-150 active:scale-[0.97]"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="text-xs">Dicter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs font-semibold mb-1.5">Dictée en direct — commandes vocales disponibles :</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {COMMANDS_HELP.map(({ cmd, result }) => (
                <div key={cmd} className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground/80 italic">"{cmd}"</span>
                  <span className="font-mono font-bold text-foreground">{result}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* INDICATEUR D'ÉCOUTE + CHRONO */}
      {isActive && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono select-none",
            isListening
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
          )}
          role="status"
          aria-live="polite"
          aria-label={isListening ? "Écoute en cours" : "Dictée en pause"}
        >
          {isListening && (
            <>
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="font-medium">Écoute</span>
            </>
          )}
          {isPaused && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">PAUSE</span>
            </>
          )}
          <span className="tabular-nums">{fmt(elapsed)}</span>
        </div>
      )}

      {/* PAUSE */}
      {isListening && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePause}
              aria-label="Mettre en pause"
              className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30 transition-all duration-150 active:scale-[0.97]"
            >
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResume}
              aria-label="Reprendre la dictée"
              className="gap-1.5 border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30 transition-all duration-150 active:scale-[0.97]"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="text-xs">Reprendre</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs">Reprendre la dictée</p></TooltipContent>
        </Tooltip>
      )}

      {/* ARRÊTER */}
      {isActive && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStop}
              aria-label="Arrêter la dictée"
              className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 transition-all duration-150 active:scale-[0.97]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs">Arrêter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs">Arrêter la dictée</p></TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
