/**
 * REDACTIO — MedicalTextHighlighter
 *
 * Affiche un texte transcrit avec :
 *   - Surlignage vert  : terme médical reconnu exactement (ou via synonyme)
 *   - Surlignage orange : suggestion de correction (distance de Levenshtein ≤ seuil)
 *
 * Chaque terme surligné est cliquable → Tooltip avec définition, catégorie, synonymes.
 * Bouton "Appliquer toutes les corrections" remplace les termes orange par leur forme canonique.
 * Correction individuelle possible en cliquant sur un terme orange.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Loader2, Wand2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchedTerm {
  start: number;
  end: number;
  original: string;
  canonical: string;
  termId: number;
  category: string;
  definition: string | null;
  synonyms: string[];
  isExact: boolean;
  distance: number;
}

interface Props {
  /** Texte brut à analyser (transcription Whisper) */
  text: string;
  /** Callback appelé avec le texte (éventuellement corrigé) quand l'utilisateur valide */
  onTextChange: (newText: string) => void;
  className?: string;
}

// ─── Couleurs par catégorie ───────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  medicament: "bg-primary/10 text-primary",
  pathologie: "bg-destructive/10 text-destructive",
  symptome: "bg-warning/15 text-warning-foreground",
  anatomie: "bg-secondary text-secondary-foreground",
  biologie: "bg-muted text-muted-foreground",
  procedure: "bg-primary/10 text-primary",
  autre: "bg-muted text-muted-foreground",
};

const CATEGORY_LABELS: Record<string, string> = {
  medicament: "Médicament",
  pathologie: "Pathologie",
  symptome: "Symptôme",
  anatomie: "Anatomie",
  biologie: "Biologie",
  procedure: "Procédure",
  autre: "Autre",
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function MedicalTextHighlighter({ text, onTextChange, className }: Props) {
  const [currentText, setCurrentText] = useState(text);
  const [appliedCorrections, setAppliedCorrections] = useState<Set<number>>(new Set());

  // Analyse du texte via tRPC
  const { data: analysis, isLoading, error } = trpc.medical.analyzeText.useQuery(
    { text: currentText, maxSuggestions: 30 },
    {
      enabled: currentText.trim().length >= 3,
      staleTime: 30_000,
      retry: 1,
    }
  );

  // Tracker l'usage des termes reconnus
  const trackUsage = trpc.medical.trackUsage.useMutation();

  // ── Construire les segments du texte ────────────────────────────────────────
  const segments = useMemo(() => {
    if (!analysis || !analysis.matches.length) {
      return [{ type: "plain" as const, text: currentText, match: null }];
    }

    const parts: Array<{
      type: "plain" | "exact" | "suggestion";
      text: string;
      match: MatchedTerm | null;
    }> = [];

    let cursor = 0;
    for (const match of analysis.matches) {
      // Texte avant le match
      if (match.start > cursor) {
        parts.push({ type: "plain", text: currentText.slice(cursor, match.start), match: null });
      }
      // Le match lui-même
      parts.push({
        type: match.isExact ? "exact" : "suggestion",
        text: currentText.slice(match.start, match.end),
        match,
      });
      cursor = match.end;
    }
    // Texte après le dernier match
    if (cursor < currentText.length) {
      parts.push({ type: "plain", text: currentText.slice(cursor), match: null });
    }
    return parts;
  }, [analysis, currentText]);

  // ── Appliquer toutes les corrections ────────────────────────────────────────
  const handleApplyAll = () => {
    if (!analysis) return;
    const newText = analysis.correctedText;
    setCurrentText(newText);
    onTextChange(newText);
    // Tracker l'usage de tous les termes
    for (const m of analysis.matches) {
      trackUsage.mutate({ id: m.termId });
    }
    setAppliedCorrections(new Set(analysis.matches.map((m) => m.termId)));
  };

  // ── Appliquer une correction individuelle ────────────────────────────────────
  const handleApplyOne = (match: MatchedTerm) => {
    const replacement =
      match.original[0] === match.original[0].toUpperCase() &&
      match.original[0] !== match.original[0].toLowerCase()
        ? match.canonical.charAt(0).toUpperCase() + match.canonical.slice(1)
        : match.canonical;

    const newText =
      currentText.slice(0, match.start) + replacement + currentText.slice(match.end);
    setCurrentText(newText);
    onTextChange(newText);
    trackUsage.mutate({ id: match.termId });
    setAppliedCorrections((prev) => {
        const next = new Set<number>();
        prev.forEach((v) => next.add(v));
        next.add(match.termId);
        return next;
      });
  };

  // ── Réinitialiser ────────────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrentText(text);
    onTextChange(text);
    setAppliedCorrections(new Set());
  };

  const hasSuggestions = analysis && analysis.suggestionCount > 0;
  const hasExact = analysis && analysis.exactCount > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* ── Barre de statut ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {isLoading && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyse du dictionnaire médical…
          </span>
        )}
        {error && (
          <span className="text-xs text-destructive">
            Analyse indisponible — le texte sera inséré tel quel.
          </span>
        )}
        {analysis && !isLoading && (
          <>
            {hasExact && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {analysis.exactCount} terme{analysis.exactCount > 1 ? "s" : ""} reconnu{analysis.exactCount > 1 ? "s" : ""}
              </span>
            )}
            {hasSuggestions && (
              <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {analysis.suggestionCount} correction{analysis.suggestionCount > 1 ? "s" : ""} suggérée{analysis.suggestionCount > 1 ? "s" : ""}
              </span>
            )}
            {!hasExact && !hasSuggestions && (
              <span className="text-xs text-muted-foreground">
                Aucun terme médical détecté
              </span>
            )}
          </>
        )}

        {/* Boutons d'action */}
        <div className="ml-auto flex items-center gap-2">
          {hasSuggestions && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
              onClick={handleApplyAll}
            >
              <Wand2 className="w-3 h-3" />
              Appliquer toutes les corrections
            </Button>
          )}
          {currentText !== text && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1.5 text-muted-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* ── Texte surligné ── */}
      <div
        className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed font-mono whitespace-pre-wrap min-h-[80px] max-h-[300px] overflow-y-auto"
        aria-label="Texte transcrit avec analyse médicale"
      >
        {segments.map((seg, i) => {
          if (seg.type === "plain") {
            return <span key={i}>{seg.text}</span>;
          }

          const match = seg.match!;
          const isExact = seg.type === "exact";
          const alreadyApplied = appliedCorrections.has(match.termId);

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "rounded px-0.5 cursor-help border-b-2 transition-colors",
                    isExact
                      ? "bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-200"
                      : alreadyApplied
                      ? "bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-200"
                      : "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                  )}
                  onClick={() => {
                    if (!isExact && !alreadyApplied) handleApplyOne(match);
                  }}
                  role={!isExact && !alreadyApplied ? "button" : undefined}
                  tabIndex={!isExact && !alreadyApplied ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (!isExact && !alreadyApplied && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleApplyOne(match);
                    }
                  }}
                  aria-label={
                    isExact
                      ? `Terme reconnu : ${match.canonical}`
                      : `Suggestion : remplacer "${match.original}" par "${match.canonical}"`
                  }
                >
                  {seg.text}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs p-3 space-y-1.5"
                sideOffset={4}
              >
                {/* Terme canonique */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{match.canonical}</span>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs px-1.5 py-0", CATEGORY_COLORS[match.category] || CATEGORY_COLORS.autre)}
                  >
                    {CATEGORY_LABELS[match.category] || match.category}
                  </Badge>
                </div>

                {/* Indication de correction */}
                {!isExact && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Correction suggérée (distance {match.distance})
                    {!alreadyApplied && " — cliquez pour appliquer"}
                  </p>
                )}

                {/* Définition */}
                {match.definition && (
                  <p className="text-xs text-muted-foreground leading-snug">
                    {match.definition}
                  </p>
                )}

                {/* Synonymes */}
                {match.synonyms.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Synonymes : </span>
                    {match.synonyms.slice(0, 4).join(", ")}
                    {match.synonyms.length > 4 && ` +${match.synonyms.length - 4}`}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* ── Légende ── */}
      {analysis && (hasExact || hasSuggestions) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {hasExact && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-emerald-200 border border-emerald-400" />
              Terme reconnu
            </span>
          )}
          {hasSuggestions && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-amber-200 border border-amber-400" />
              Correction suggérée (cliquez pour appliquer)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
