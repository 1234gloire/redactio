/**
 * MedicalAutocomplete — Textarea enrichie avec autocomplétion médicale
 * Utilise le dictionnaire médical MEDACTIO (430+ termes) pour suggérer
 * des termes pendant la saisie. Conforme aux exigences de confidentialité :
 * seul le terme saisi (sans contexte patient) est envoyé au serveur.
 */
import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface Suggestion {
  id: number;
  term: string;
  category: string;
  definition: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  medicament: { label: "Méd.", color: "bg-primary/10 text-primary" },
  pathologie: { label: "Path.", color: "bg-destructive/10 text-destructive" },
  symptome: { label: "Sympt.", color: "bg-warning/15 text-warning-foreground" },
  anatomie: { label: "Anat.", color: "bg-secondary text-secondary-foreground" },
  biologie: { label: "Bio.", color: "bg-muted text-muted-foreground" },
  procedure: { label: "Proc.", color: "bg-primary/10 text-primary" },
  autre: { label: "Autre", color: "bg-muted text-muted-foreground" },
};

interface MedicalAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  "aria-describedby"?: string;
  /** Texte intermédiaire (interim) de la reconnaissance vocale — affiché en gris sous le champ */
  interimText?: string;
}

/** Extrait le mot en cours de saisie (dernier mot non vide) */
function getCurrentWord(text: string, cursorPos: number): { word: string; start: number; end: number } {
  const before = text.slice(0, cursorPos);
  const match = before.match(/[\w\u00C0-\u024F\u1E00-\u1EFF-]+$/);
  if (!match) return { word: "", start: cursorPos, end: cursorPos };
  const start = cursorPos - match[0].length;
  const after = text.slice(cursorPos);
  const endMatch = after.match(/^[\w\u00C0-\u024F\u1E00-\u1EFF-]*/);
  const end = cursorPos + (endMatch ? endMatch[0].length : 0);
  return { word: match[0], start, end };
}

export function MedicalAutocomplete({
  id,
  value,
  onChange,
  onFocus,
  placeholder,
  className,
  rows = 10,
  maxLength,
  disabled = false,
  "aria-describedby": ariaDescribedBy,
  interimText = "",
}: MedicalAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<{ word: string; start: number; end: number }>({
    word: "",
    start: 0,
    end: 0,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackUsage = trpc.medical.trackUsage.useMutation();

  const searchQuery = trpc.medical.search.useQuery(
    { query: currentWord.word, limit: 8 },
    {
      enabled: currentWord.word.length >= 3,
      staleTime: 30_000,
    }
  );

  // Mettre à jour les suggestions quand la recherche retourne des résultats
  useEffect(() => {
    if (searchQuery.data && currentWord.word.length >= 3) {
      setSuggestions(searchQuery.data as Suggestion[]);
      setShowSuggestions(searchQuery.data.length > 0);
      setActiveIndex(0);
    } else if (currentWord.word.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery.data, currentWord.word]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      const cursor = e.target.selectionStart ?? newValue.length;
      const { word, start, end } = getCurrentWord(newValue, cursor);
      setCurrentWord({ word, start, end });

      if (word.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [onChange]
  );

  const insertSuggestion = useCallback(
    (suggestion: Suggestion) => {
      const { start, end } = currentWord;
      const newValue = value.slice(0, start) + suggestion.term + value.slice(end);
      onChange(newValue);
      setSuggestions([]);
      setShowSuggestions(false);
      // Tracker l'usage pour améliorer le tri
      trackUsage.mutate({ id: suggestion.id });
      // Repositionner le curseur après le terme inséré
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursor = start + suggestion.term.length;
          textareaRef.current.setSelectionRange(newCursor, newCursor);
          textareaRef.current.focus();
        }
      }, 0);
    },
    [currentWord, value, onChange, trackUsage]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (showSuggestions && suggestions[activeIndex]) {
          e.preventDefault();
          insertSuggestion(suggestions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, suggestions, activeIndex, insertSuggestion]
  );

  // Fermer les suggestions si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={() => {
          // Délai pour permettre le clic sur une suggestion
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y font-mono",
          className
        )}
      />

      {/* Texte intermédiaire de la reconnaissance vocale */}
      {interimText && (
        <div
          className="mt-1 px-3 py-1.5 rounded-md bg-muted/40 border border-dashed border-muted-foreground/25 text-sm text-muted-foreground italic leading-relaxed"
          aria-live="polite"
          aria-label="Texte en cours de reconnaissance"
        >
          <span className="text-xs font-medium not-italic text-muted-foreground/60 mr-1.5">En cours :</span>
          {interimText}
        </div>
      )}

      {/* Dropdown des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Suggestions médicales"
          className={cn(
            "absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-lg",
            "max-h-64 overflow-y-auto"
          )}
        >
          <div className="px-2 py-1.5 border-b border-border">
            <p className="text-xs text-muted-foreground">
              Dictionnaire médical — <kbd className="text-xs bg-muted px-1 rounded">↑↓</kbd> naviguer ·{" "}
              <kbd className="text-xs bg-muted px-1 rounded">Tab</kbd> ou{" "}
              <kbd className="text-xs bg-muted px-1 rounded">Entrée</kbd> insérer ·{" "}
              <kbd className="text-xs bg-muted px-1 rounded">Échap</kbd> fermer
            </p>
          </div>
          {suggestions.map((s, i) => {
            const cat = CATEGORY_LABELS[s.category] ?? CATEGORY_LABELS.autre;
            return (
              <div
                key={s.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertSuggestion(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors",
                  i === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{s.term}</span>
                  {s.definition && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{s.definition}</p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={cn("text-xs shrink-0 font-normal", cat.color)}
                >
                  {cat.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MedicalAutocomplete;
