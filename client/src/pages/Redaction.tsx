import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
<<<<<<< Updated upstream
import {
  getDefaultSubtype,
  isValidVolet,
  REDACTION_SUBTYPES,
  type RedactionSubtype,
  type Volet,
} from "@shared/redactionOptions";
=======
import VoiceRecorder from "@/components/VoiceRecorder";
>>>>>>> Stashed changes
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type FileChild,
  type ParagraphChild,
} from "docx";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  Download,
  FileUp,
  FileText,
  Loader2,
  Mic,
  RotateCcw,
  Stethoscope,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { useLocation } from "wouter";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const RAW_DATA_MAX_CHARS = 200_000;
type ConciliationImportTarget = "entry" | "exit";

const VOLETS: Record<Volet, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  courrier_sortie: {
    label: "Courrier de sortie",
    icon: <FileText className="w-6 h-6" />,
    description: "Rédaction du courrier de sortie d'hospitalisation à destination du médecin traitant ou d'un correspondant.",
    color: "blue",
  },
  conciliation: {
    label: "Conciliation médicamenteuse",
    icon: <Stethoscope className="w-6 h-6" />,
    description: "Bilan de conciliation médicamenteuse à l'admission, au transfert ou à la sortie.",
    color: "emerald",
  },
  correspondance: {
    label: "Correspondance médicale",
    icon: <BookOpen className="w-6 h-6" />,
    description: "Rédaction d'une correspondance médicale professionnelle entre praticiens.",
    color: "violet",
  },
};

const STEPS = [
  { id: 1, label: "Volet" },
  { id: 2, label: "Données" },
  { id: 3, label: "Génération" },
  { id: 4, label: "Relecture" },
  { id: 5, label: "Export" },
];

// Regex pour détecter les balises [À COMPLÉTER PAR LE MÉDECIN]
const TAG_REGEX = /\[À COMPLÉTER PAR LE MÉDECIN\]/g;

function highlightTags(text: string): string {
  return text.replace(
    TAG_REGEX,
    '<mark class="tag-a-completer" title="Cliquez pour compléter">[À COMPLÉTER PAR LE MÉDECIN]</mark>'
  );
}

function isMarkdownTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isLikelyMarkdownTableStart(currentLine: string, nextLine: string): boolean {
  if (!currentLine.includes("|")) return false;
  return isMarkdownTableSeparator(nextLine) || nextLine.includes("|");
}

function createDocxRuns(text: string, options: { bold?: boolean } = {}): ParagraphChild[] {
  const runs: ParagraphChild[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), ...options }));
    }

    const token = match[0];
    const isBold = token.startsWith("**");
    runs.push(
      new TextRun({
        text: isBold ? token.slice(2, -2) : token.slice(1, -1),
        bold: options.bold || isBold,
        italics: !isBold,
      })
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), ...options }));
  }

  return runs.length ? runs : [new TextRun({ text: "", ...options })];
}

function createDocxParagraph(text = "", options: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; bullet?: boolean } = {}) {
  return new Paragraph({
    heading: options.heading,
    children: createDocxRuns(options.bullet ? text.replace(/^[-*]\s+/, "") : text),
    bullet: options.bullet ? { level: 0 } : undefined,
    spacing: { after: 160 },
  });
}

function createDocxCell(text: string, header = false) {
  return new TableCell({
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    width: { size: 100, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: createDocxRuns(text, { bold: header }),
        spacing: { after: 0 },
      }),
    ],
  });
}

async function createDocxBlobFromText(text: string): Promise<Blob> {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const children: FileChild[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const nextLine = lines[index + 1] ?? "";

    if (isLikelyMarkdownTableStart(line, nextLine)) {
      const headers = parseMarkdownTableRow(line);
      const rows: string[][] = [];
      index += isMarkdownTableSeparator(nextLine) ? 2 : 1;

      while (index < lines.length && lines[index]?.includes("|")) {
        const row = lines[index] ?? "";
        if (!isMarkdownTableSeparator(row)) rows.push(parseMarkdownTableRow(row));
        index++;
      }
      index--;

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: headers.map((header) => createDocxCell(header, true)),
            }),
            ...rows.map(
              (row) =>
                new TableRow({
                  children: headers.map((_header, cellIndex) => createDocxCell(row[cellIndex] ?? "")),
                })
            ),
          ],
        })
      );
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      children.push(createDocxParagraph(""));
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const heading =
        headingMatch[1].length === 1
          ? HeadingLevel.HEADING_1
          : headingMatch[1].length === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;
      children.push(createDocxParagraph(headingMatch[2], { heading }));
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      children.push(createDocxParagraph(trimmed, { bullet: true }));
      continue;
    }

    children.push(createDocxParagraph(trimmed));
  }

  const document = new Document({
    creator: "REDACTIO",
    title: "Rapport REDACTIO",
    sections: [{ children }],
  });

  return Packer.toBlob(document);
}

export default function Redaction() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Récupérer le volet depuis l'URL
  const searchParams = new URLSearchParams(window.location.search);
  const requestedVolet = searchParams.get("volet");
  const initialVolet = requestedVolet && isValidVolet(requestedVolet) ? requestedVolet : null;

  const [step, setStep] = useState(initialVolet ? 2 : 1);
  const [selectedVolet, setSelectedVolet] = useState<Volet | null>(initialVolet);
  const [selectedSubtype, setSelectedSubtype] = useState<RedactionSubtype | null>(
    initialVolet ? getDefaultSubtype(initialVolet) : null
  );
  const [rawData, setRawData] = useState("");
  const [treatmentEntryData, setTreatmentEntryData] = useState("");
  const [treatmentExitData, setTreatmentExitData] = useState("");
  const [treatmentExitDate, setTreatmentExitDate] = useState("");
  const [conciliationImportTarget, setConciliationImportTarget] = useState<ConciliationImportTarget>("entry");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const [validated, setValidated] = useState(false);
  const [pseudoInfo, setPseudoInfo] = useState<{
    maskCount: number;
    detectedCategories: string[];
    hasPotentialOvermasking: boolean;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [streamingText, setStreamingText] = useState("");

  // ─── Dictée vocale ───────────────────────────────────────────────────────────
  /**
   * Appelé par VoiceRecorder quand la transcription est prête.
   * Le texte est ajouté à la fin du contenu existant (mode append),
   * séparé par un saut de ligne si le champ n'est pas vide.
   */
  const handleVoiceTranscript = useCallback((text: string) => {
    setRawData((prev) => {
      if (!prev.trim()) return text;
      // Ajouter une séparation propre si le dernier caractère n'est pas déjà un saut de ligne
      const separator = prev.endsWith("\n") ? "" : "\n";
      return `${prev}${separator}${text}`;
    });
    toast.success("Dictée ajoutée au champ de saisie.");
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  // Génération via streaming SSE
  const handleStreamGenerate = useCallback(async (
    volet: Volet,
    subtype: RedactionSubtype,
    rawData: string
  ) => {
    setIsGenerating(true);
    setGeneratedDoc("");
    setStreamingText("");
    setValidated(false);
    setPseudoInfo(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";

    try {
      const response = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ volet, subtype, rawData }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erreur réseau" }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "pseudonymisation") {
              setPseudoInfo({
                maskCount: parsed.maskCount,
                detectedCategories: parsed.detectedCategories,
                hasPotentialOvermasking: parsed.hasPotentialOvermasking,
              });
            } else if (parsed.type === "token") {
              accumulated += parsed.content;
              setStreamingText(accumulated);
            } else if (parsed.type === "done") {
              setGeneratedDoc(accumulated);
              setIsGenerating(false);
              setStep(4);
            } else if (parsed.type === "error") {
              throw new Error(parsed.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err: unknown) {
      setStep(2);
      if (err instanceof Error && err.name === "AbortError") {
        setIsGenerating(false);
        toast.info("Génération annulée.");
        return;
      }
      setIsGenerating(false);
      toast.error(err instanceof Error ? err.message : "Erreur lors de la génération.");
    }
  }, []);

  // Éditeur TipTap
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        "aria-label": "Éditeur de document médical",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });

  // Mettre à jour l'éditeur quand le document est généré
  useEffect(() => {
    if (editor && generatedDoc) {
      const htmlContent = highlightTags(
        generatedDoc
          .split("\n")
          .map((line) => `<p>${line || "&nbsp;"}</p>`)
          .join("")
      );
      editor.commands.setContent(htmlContent);
    }
  }, [editor, generatedDoc]);

  const buildGenerationRawData = useCallback(() => {
    if (selectedVolet !== "conciliation") return rawData;
    return `TRAITEMENT D'ENTRÉE :
${treatmentEntryData.trim() || "[À COMPLÉTER PAR LE MÉDECIN]"}

TRAITEMENT DE SORTIE :
${treatmentExitData.trim() || "[À COMPLÉTER PAR LE MÉDECIN]"}

DATE DE RÉDACTION DE LA SORTIE :
${treatmentExitDate.trim() || "[À COMPLÉTER PAR LE MÉDECIN]"}`;
  }, [rawData, selectedVolet, treatmentEntryData, treatmentExitData, treatmentExitDate]);

  const currentInputLength = selectedVolet === "conciliation"
    ? treatmentEntryData.length + treatmentExitData.length + treatmentExitDate.length
    : rawData.length;
  const canGenerate = selectedVolet === "conciliation"
    ? Boolean(selectedSubtype && treatmentEntryData.trim().length >= 3 && treatmentExitData.trim().length >= 3)
    : Boolean(selectedSubtype && rawData.trim().length >= 10);

  const handleGenerate = useCallback(() => {
    if (!selectedVolet || !selectedSubtype || !canGenerate) return;
    handleStreamGenerate(selectedVolet, selectedSubtype, buildGenerationRawData());
  }, [buildGenerationRawData, canGenerate, selectedVolet, selectedSubtype, handleStreamGenerate]);

  const handleFileUpload = useCallback(async (file: File | null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setIsExtractingFile(true);

    try {
      const response = await fetch("/api/extract-file", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Extraction du fichier impossible.");
      }

      const extractedText = String(payload.text ?? "").trim();
      if (!extractedText) {
        throw new Error("Aucun texte exploitable trouvé dans ce fichier.");
      }

      if (selectedVolet === "conciliation") {
        const updateTreatment = conciliationImportTarget === "exit" ? setTreatmentExitData : setTreatmentEntryData;
        updateTreatment((current) => {
          const separator = current.trim().length > 0 ? "\n\n--- Contenu importé ---\n\n" : "";
          return `${current}${separator}${extractedText}`.slice(0, RAW_DATA_MAX_CHARS);
        });
      } else {
        setRawData((current) => {
          const separator = current.trim().length > 0 ? "\n\n--- Contenu importé ---\n\n" : "";
          return `${current}${separator}${extractedText}`.slice(0, RAW_DATA_MAX_CHARS);
        });
      }
      toast.success(`Texte extrait depuis ${payload.filename || file.name}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Extraction du fichier impossible.");
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [conciliationImportTarget, selectedVolet]);

  const handleFileDrag = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isExtractingFile) return;
    setIsFileDragOver(event.type === "dragenter" || event.type === "dragover");
  }, [isExtractingFile]);

  const handleFileDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsFileDragOver(false);
    if (isExtractingFile) return;
    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    void handleFileUpload(file);
  }, [handleFileUpload, isExtractingFile]);

  const handleCancelGeneration = useCallback(() => {
    setIsGenerating(false);
    abortRef.current?.abort();
  }, []);

  const handleCopy = useCallback(() => {
    if (!validated) return;
    const text = editor?.getText() ?? generatedDoc;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Document copié dans le presse-papier.");
    });
  }, [validated, editor, generatedDoc]);

  const handleDownloadWord = useCallback(async () => {
    if (!validated) return;
    try {
      const text = editor?.getText() ?? generatedDoc;
      const blob = await createDocxBlobFromText(text);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redactio_${selectedVolet}_${new Date().toISOString().slice(0, 10)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Document Word téléchargé.");
    } catch {
      toast.error("Téléchargement Word impossible.");
    }
  }, [validated, editor, generatedDoc, selectedVolet]);

  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedVolet(null);
    setSelectedSubtype(null);
    setRawData("");
    setTreatmentEntryData("");
    setTreatmentExitData("");
    setTreatmentExitDate("");
    setConciliationImportTarget("entry");
    setGeneratedDoc("");
    setValidated(false);
    setPseudoInfo(null);
    editor?.commands.setContent("");
  }, [editor]);

  if (authLoading) return null;
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const progress = (step / 5) * 100;

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* En-tête avec étapes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Nouvelle rédaction</h1>
            <Button variant="ghost" size="sm" onClick={handleReset} aria-label="Recommencer">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Recommencer
            </Button>
          </div>

          {/* Indicateur d'étapes */}
          <div className="space-y-2">
            <Progress value={progress} className="h-1.5" aria-label={`Étape ${step} sur 5`} />
            <div className="flex items-center justify-between" role="list" aria-label="Étapes du parcours">
              {STEPS.map((s) => (
                <div key={s.id} className="step-indicator" role="listitem">
                  <div
                    className={cn("step-dot", {
                      active: step === s.id,
                      completed: step > s.id,
                      pending: step < s.id,
                    })}
                    aria-current={step === s.id ? "step" : undefined}
                  >
                    {step > s.id ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span
                    className={cn("text-xs hidden sm:block", {
                      "text-primary font-semibold": step === s.id,
                      "text-muted-foreground": step !== s.id,
                    })}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Étape 1 : Choix du volet ─── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Choisissez un volet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sélectionnez le type de document à rédiger.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.entries(VOLETS) as [Volet, typeof VOLETS[Volet]][]).map(([id, volet]) => (
                <button
                  key={id}
                  className={cn("volet-card text-left", { selected: selectedVolet === id })}
                  onClick={() => {
                    setSelectedVolet(id);
                    setSelectedSubtype(getDefaultSubtype(id));
                  }}
                  aria-pressed={selectedVolet === id}
                  aria-label={`Sélectionner ${volet.label}`}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    volet.color === "blue" && "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
                    volet.color === "emerald" && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
                    volet.color === "violet" && "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
                  )}>
                    {volet.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{volet.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{volet.description}</p>
                  </div>
                  {selectedVolet === id && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedVolet}
                className="gap-2"
              >
                Continuer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Étape 2 : Injection des données ─── */}
        {step === 2 && selectedVolet && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setStep(1)} aria-label="Retour">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {VOLETS[selectedVolet].label}
                </h2>
                <p className="text-sm text-muted-foreground">Saisissez ou dictez les données médicales du patient.</p>
              </div>
            </div>

            {/* Avertissement renforcé */}
            <div
              className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <p className="font-semibold">Consigne de confidentialité obligatoire</p>
                <p>
                  Ne saisissez <strong>aucun identifiant direct</strong> du patient : ni nom, ni prénom,
                  ni numéro de sécurité sociale, ni date de naissance, ni adresse, ni numéro de téléphone.
                </p>
                <p className="text-xs opacity-80">
                  Le filtre de pseudonymisation détectera et masquera automatiquement les identifiants
                  structurés, mais vous restez responsable de ne pas saisir d'identité directe.
                </p>
              </div>
            </div>

            {/* ── Bloc de saisie avec dictée vocale intégrée ── */}
            <div className="space-y-2">
<<<<<<< Updated upstream
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  Type de document
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REDACTION_SUBTYPES[selectedVolet].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedSubtype(option.id)}
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                        selectedSubtype === option.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/60"
                      )}
                      aria-pressed={selectedSubtype === option.id}
                    >
                      <span className="font-medium leading-snug">{option.label}</span>
                      {selectedSubtype === option.id && <CheckCircle className="h-4 w-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="space-y-2">
              {selectedVolet === "conciliation" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="treatmentEntryData" className="text-sm font-medium text-foreground">
                        Traitement d'entrée
                        <span className="text-muted-foreground font-normal ml-1">(bilan médicamenteux)</span>
                      </label>
                      <Textarea
                        id="treatmentEntryData"
                        value={treatmentEntryData}
                        onChange={(e) => setTreatmentEntryData(e.target.value)}
                        onFocus={() => setConciliationImportTarget("entry")}
                        placeholder={`Exemple :\nAMLODIPINE 5 mg gélule : 1 le matin\nZOPICLONE 7,5 mg cp : 1 au coucher\nKARDEGIC 75 mg : 1 sachet à midi`}
                        className="min-h-[220px] font-mono text-sm resize-y"
                        maxLength={RAW_DATA_MAX_CHARS}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="treatmentExitData" className="text-sm font-medium text-foreground">
                        Traitement de sortie
                        <span className="text-muted-foreground font-normal ml-1">(ordonnance finale)</span>
                      </label>
                      <Textarea
                        id="treatmentExitData"
                        value={treatmentExitData}
                        onChange={(e) => setTreatmentExitData(e.target.value)}
                        onFocus={() => setConciliationImportTarget("exit")}
                        placeholder={`Exemple :\nAMLODIPINE 5 mg gélule : 1 le matin\nAPIXABAN 5 mg cp : 1 matin et 1 soir\nKARDEGIC 75 mg : arrêté`}
                        className="min-h-[220px] font-mono text-sm resize-y"
                        maxLength={RAW_DATA_MAX_CHARS}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="treatmentExitDate" className="text-sm font-medium text-foreground">
                      Date de rédaction de la sortie
                      <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>
                    </label>
                    <input
                      id="treatmentExitDate"
                      type="text"
                      value={treatmentExitDate}
                      onChange={(e) => setTreatmentExitDate(e.target.value)}
                      placeholder="JJ/MM/AAAA"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      maxLength={32}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <label htmlFor="rawData" className="text-sm font-medium text-foreground">
                    Données médicales brutes
                    <span className="text-muted-foreground font-normal ml-1">(sans identifiant direct)</span>
                  </label>
                  <Textarea
                    id="rawData"
                    value={rawData}
                    onChange={(e) => setRawData(e.target.value)}
                    placeholder={`Exemple pour ${VOLETS[selectedVolet].label} :\n\nService : Cardiologie\nMotif d'hospitalisation : Décompensation cardiaque\nAntécédents : HTA, FA chronique, insuffisance cardiaque FE 35%\nTraitement habituel : Furosémide 40mg, Bisoprolol 5mg, Rivaroxaban 20mg\n...`}
                    className="min-h-[280px] font-mono text-sm resize-y"
                    aria-describedby="rawData-help"
                    maxLength={RAW_DATA_MAX_CHARS}
                  />
                </>
              )}
              <div className="flex items-center justify-between">
                <p id="rawData-help" className="text-xs text-muted-foreground">
                  {currentInputLength}/{RAW_DATA_MAX_CHARS.toLocaleString("fr-FR")} caractères
                </p>
                {currentInputLength > 0 && (
=======
              {/* En-tête du champ avec bouton dictée */}
              <div className="flex items-center justify-between">
                <label htmlFor="rawData" className="text-sm font-medium text-foreground">
                  Données médicales brutes
                  <span className="text-muted-foreground font-normal ml-1">(sans identifiant direct)</span>
                </label>
                {/* Dictée vocale — visible pour les 3 volets */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    <Mic className="w-3 h-3 inline mr-1" />
                    Dictée vocale
                  </span>
                  <VoiceRecorder
                    onTranscript={handleVoiceTranscript}
                    disabled={isGenerating}
                    size="icon"
                  />
                </div>
              </div>

              {/* Zone de texte — saisie clavier + dictée vocale */}
              <div className="relative">
                <Textarea
                  id="rawData"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder={`Exemple pour ${VOLETS[selectedVolet].label} :\n\nService : Cardiologie\nMotif d'hospitalisation : Décompensation cardiaque\nAntécédents : HTA, FA chronique, insuffisance cardiaque FE 35%\nTraitement habituel : Furosémide 40mg, Bisoprolol 5mg, Rivaroxaban 20mg\n...\n\nVous pouvez aussi utiliser le bouton microphone pour dicter directement.`}
                  className="min-h-[280px] font-mono text-sm resize-y pr-4"
                  aria-describedby="rawData-help rawData-voice-hint"
                  maxLength={8000}
                />
              </div>

              {/* Barre d'info sous le textarea */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <p id="rawData-help" className="text-xs text-muted-foreground">
                    {rawData.length}/8000 caractères
                  </p>
                  <p id="rawData-voice-hint" className="text-xs text-muted-foreground hidden sm:block">
                    · Cliquez sur le micro pour dicter
                  </p>
                </div>
                {rawData.length > 0 && (
>>>>>>> Stashed changes
                  <Badge variant="secondary" className="text-xs">
                    Pseudonymisation automatique activée
                  </Badge>
                )}
              </div>
<<<<<<< Updated upstream
              <div
                className={cn(
                  "flex flex-col gap-3 rounded-md border border-dashed p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  isFileDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30"
                )}
                onDragEnter={handleFileDrag}
                onDragOver={handleFileDrag}
                onDragLeave={handleFileDrag}
                onDrop={handleFileDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.csv,.json,.xml,.html,.rtf,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
                  onChange={(event) => handleFileUpload(event.target.files?.[0] ?? null)}
                />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                    {isExtractingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Glissez-déposez un fichier ici
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedVolet === "conciliation"
                        ? `Destination : traitement ${conciliationImportTarget === "entry" ? "d'entrée" : "de sortie"}.`
                        : "PDF, Word .docx, TXT, Markdown, CSV ou JSON"}
                    </p>
                  </div>
                </div>
                {selectedVolet === "conciliation" && (
                  <div className="flex rounded-md border bg-background p-0.5">
                    <button
                      type="button"
                      onClick={() => setConciliationImportTarget("entry")}
                      className={cn(
                        "h-8 rounded px-3 text-xs font-medium transition-colors",
                        conciliationImportTarget === "entry"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={conciliationImportTarget === "entry"}
                    >
                      Entrée
                    </button>
                    <button
                      type="button"
                      onClick={() => setConciliationImportTarget("exit")}
                      className={cn(
                        "h-8 rounded px-3 text-xs font-medium transition-colors",
                        conciliationImportTarget === "exit"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={conciliationImportTarget === "exit"}
                    >
                      Sortie
                    </button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 self-start sm:self-auto"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtractingFile}
                >
                  {isExtractingFile ? "Extraction…" : "Parcourir"}
                </Button>
=======

              {/* Aide contextuelle dictée vocale */}
              <div className="flex items-start gap-2 p-3 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                <Mic className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <span>
                  <strong className="text-foreground">Dictée vocale disponible</strong> pour les 3 volets (Courrier de sortie, Conciliation médicamenteuse, Correspondance médicale).
                  Cliquez sur le bouton microphone pour démarrer l'enregistrement. La transcription est ajoutée automatiquement à la suite du texte saisi.
                  Durée maximale : 5 minutes par dictée.
                </span>
>>>>>>> Stashed changes
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Retour
              </Button>
              <Button
                onClick={() => { setStep(3); handleGenerate(); }}
                disabled={!canGenerate}
                className="gap-2"
              >
                Générer le document
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Étape 3 : Génération en cours ─── */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-4 py-8">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Génération en cours…</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Le moteur IA rédige votre document à partir des données pseudonymisées.
                  Cela prend généralement quelques secondes.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Pseudonymisation appliquée — contenu filtré avant envoi au moteur</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelGeneration}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* ─── Étape 4 : Relecture et édition ─── */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Relecture et édition</h2>
                <p className="text-sm text-muted-foreground">
                  Relisez, corrigez et complétez le document avant validation.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep(2); setGeneratedDoc(""); }}
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Régénérer
              </Button>
            </div>

            {/* Informations de pseudonymisation */}
            {pseudoInfo && pseudoInfo.maskCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-xs text-muted-foreground font-medium">Masquages appliqués :</span>
                <span className="mask-badge">
                  {pseudoInfo.maskCount} identifiant{pseudoInfo.maskCount > 1 ? "s" : ""} masqué{pseudoInfo.maskCount > 1 ? "s" : ""}
                </span>
                {pseudoInfo.detectedCategories.map((cat) => (
                  <span key={cat} className="mask-badge">{cat.replace(/_/g, " ")}</span>
                ))}
                {pseudoInfo.hasPotentialOvermasking && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Sur-masquage possible — vérifiez le document
                  </span>
                )}
              </div>
            )}

            {/* Légende des balises */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tag-a-completer text-xs">[À COMPLÉTER PAR LE MÉDECIN]</span>
              <span>= zones à compléter obligatoirement avant export</span>
            </div>

            {/* Éditeur riche */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                <span className="text-xs text-muted-foreground font-medium">
                  Éditeur de document — {selectedVolet && VOLETS[selectedVolet].label}
                </span>
              </div>
              <EditorContent editor={editor} />
            </div>

            {/* Validation */}
            {!validated ? (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-3 flex-1">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Validation requise avant export</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          En validant ce document, vous confirmez l'avoir relu, corrigé et complété toutes les
                          balises <strong>[À COMPLÉTER PAR LE MÉDECIN]</strong>. Vous assumez la responsabilité
                          médicale du contenu.
                        </p>
                      </div>
                      <Button
                        onClick={() => { setValidated(true); setStep(5); }}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="w-4 h-4" />
                        Je valide ce document
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-end">
                <Button onClick={() => setStep(5)} className="gap-2">
                  Continuer vers l'export
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── Étape 5 : Export ─── */}
        {step === 5 && validated && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Document validé</h2>
              <p className="text-sm text-muted-foreground">
                Vous pouvez maintenant copier ou télécharger le document.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Options d'export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={handleCopy}
                >
                  <Copy className="w-4 h-4" />
                  Copier dans le presse-papier
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={handleDownloadWord}
                >
                  <Download className="w-4 h-4" />
                  Télécharger en Word (.docx)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-4">
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                  <strong>Rappel :</strong> Ce document sera purgé de la mémoire à la fermeture de la session.
                  Aucune donnée médicale n'est conservée sur la plateforme.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Nouvelle rédaction
              </Button>
            </div>
          </div>
        )}
      </div>
    </RedactioLayout>
  );
}
