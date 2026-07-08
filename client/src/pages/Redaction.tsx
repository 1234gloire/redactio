import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
import MedicalAutocomplete from "@/components/MedicalAutocomplete";
import VoiceRecorderWithPreview from "@/components/VoiceRecorderWithPreview";
import { getLoginUrl } from "@/const";
import {
  getDefaultSubtype,
  isValidVolet,
  REDACTION_SUBTYPES,
  type RedactionSubtype,
  type Volet,
} from "@shared/redactionOptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bone,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  Download,
  FilePenLine,
  FileText,
  FileUp,
  Loader2,
  RotateCcw,
  Shield,
  Stethoscope,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const RAW_DATA_MAX_CHARS = 200_000;
type ConciliationImportTarget = "entry" | "exit";
type PseudonymisationInfo = {
  maskCount: number;
  detectedCategories: string[];
  hasPotentialOvermasking: boolean;
};

const VOLETS: Record<Volet, { label: string; icon: ReactNode; description: string; color: string }> = {
  courrier_sortie: {
    label: "Courrier de sortie",
    icon: <FileText className="w-6 h-6" />,
    description: "Rédaction structurée du courrier de sortie d'hospitalisation.",
    color: "teal",
  },
  conciliation: {
    label: "Conciliation médicamenteuse",
    icon: <Stethoscope className="w-6 h-6" />,
    description: "Bilan de conciliation médicamenteuse à l'admission, au transfert ou à la sortie.",
    color: "slate",
  },
  correspondance: {
    label: "Correspondance médicale",
    icon: <BookOpen className="w-6 h-6" />,
    description: "Rédaction d'une correspondance médicale professionnelle entre praticiens.",
    color: "seal",
  },
  observation: {
    label: "Observation médicale",
    icon: <FilePenLine className="w-6 h-6" />,
    description: "Prise de notes, suivi journalier, transmissions ciblées.",
    color: "indigo",
  },
};

const VOLET_ICON_CLASSES: Record<string, string> = {
  teal: "volet-icon-teal",
  teal_accent: "var(--teal)",
  slate: "volet-icon-slate",
  slate_accent: "var(--navy)",
  seal: "volet-icon-seal",
  seal_accent: "var(--gold)",
  indigo: "volet-icon-indigo",
  indigo_accent: "var(--purple)",
  ortho: "volet-icon-ortho",
  blue_accent: "var(--blue)",
};

function getCurrentRedactionReturnPath() {
  if (typeof window === "undefined") return "/redaction";
  return `${window.location.pathname}${window.location.search}`;
}

function getSubtypeLabel(volet: Volet) {
  if (volet === "courrier_sortie") return "Service / spécialité";
  if (volet === "conciliation") return "Type de conciliation";
  if (volet === "correspondance") return "Type de correspondance";
  return "Type de document";
}

function getSubtypeHint(volet: Volet) {
  if (volet === "courrier_sortie") return "oriente la structure du document";
  if (volet === "conciliation") return "étape du parcours de soins";
  if (volet === "correspondance") return "oriente le ton et la structure";
  return "oriente le document";
}

const STEPS_DEFAULT = [
  { id: 1, label: "Volet" },
  { id: 2, label: "Données" },
  { id: 3, label: "Génération" },
  { id: 4, label: "Relecture" },
  { id: 5, label: "Export" },
];

const STEPS_OBSERVATION = [
  { id: 1, label: "Volet" },
  { id: 2, label: "Données" },
  { id: 3, label: "Exporter" },
];



// Regex pour détecter les balises [À COMPLÉTER PAR LE MÉDECIN]
const TAG_REGEX = /\[À COMPLÉTER PAR LE MÉDECIN\]/g;

function highlightTags(text: string): string {
  return text.replace(
    TAG_REGEX,
    '<mark class="tag-a-completer" title="Cliquez pour compléter">[À COMPLÉTER PAR LE MÉDECIN]</mark>'
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isMarkdownTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function renderMarkdownTable(headerLine: string, bodyLines: string[]): string {
  const headers = splitMarkdownTableRow(headerLine);
  const rows = bodyLines
    .map(splitMarkdownTableRow)
    .filter((cells) => cells.some((cell) => cell.length > 0));

  return [
    '<div class="tableWrapper">',
    "<table>",
    "<tbody>",
    "<tr>",
    ...headers.map((cell) => `<th contenteditable="true" spellcheck="false">${renderInlineMarkdown(cell) || "&nbsp;"}</th>`),
    "</tr>",
    ...rows.flatMap((cells) => [
      "<tr>",
      ...headers.map((_, index) => `<td contenteditable="true" spellcheck="false">${renderInlineMarkdown(cells[index] ?? "") || "&nbsp;"}</td>`),
      "</tr>",
    ]),
    "</tbody>",
    "</table>",
    "</div>",
  ].join("");
}

function renderGeneratedDocumentHtml(documentText: string): string {
  const lines = documentText.split("\n");
  const html: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    let separatorIndex = index + 1;
    while (separatorIndex < lines.length && !lines[separatorIndex].trim()) {
      separatorIndex += 1;
    }

    if (line.includes("|") && isMarkdownTableSeparator(lines[separatorIndex] ?? "")) {
      const bodyLines: string[] = [];
      index = separatorIndex + 1;
      while (index < lines.length) {
        if (!lines[index].trim()) {
          index += 1;
          continue;
        }
        if (!lines[index].includes("|") || isMarkdownTableSeparator(lines[index])) {
          break;
        }
        bodyLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      html.push(renderMarkdownTable(line, bodyLines));
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    html.push(`<p>${line.trim() ? renderInlineMarkdown(line) : "&nbsp;"}</p>`);
  }

  return highlightTags(html.join(""));
}

export default function Redaction() {
  const [, setLocation] = useLocation();
  const loginUrl = getLoginUrl(getCurrentRedactionReturnPath());
  const { isAuthenticated, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: loginUrl,
  });

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
  const [noTreatmentEntry, setNoTreatmentEntry] = useState(false);
  const [conciliationImportTarget, setConciliationImportTarget] = useState<ConciliationImportTarget>("entry");
  const [observationText, setObservationText] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const [validated, setValidated] = useState(false);
  const [pseudoInfo, setPseudoInfo] = useState<PseudonymisationInfo | null>(null);
  const [observationSafeText, setObservationSafeText] = useState("");
  const [observationPseudoInfo, setObservationPseudoInfo] = useState<PseudonymisationInfo | null>(null);
  const [isSecuringObservation, setIsSecuringObservation] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentEditorRef = useRef<HTMLDivElement | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [renderedDocumentHtml, setRenderedDocumentHtml] = useState("");
  const [editedDocumentHtml, setEditedDocumentHtml] = useState("");

  // Génération via streaming SSE
  const handleStreamGenerate = useCallback(async (
    volet: Volet,
    subtype: RedactionSubtype,
    rawData: string
  ) => {
    setIsGenerating(true);
    setGeneratedDoc("");
    setEditedDocumentHtml("");
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

  useEffect(() => {
    if (generatedDoc) {
      const html = renderGeneratedDocumentHtml(generatedDoc);
      setRenderedDocumentHtml(html);
      setEditedDocumentHtml(html);
    }
  }, [generatedDoc]);

  const buildGenerationRawData = useCallback(() => {
    if (selectedVolet !== "conciliation") return rawData;
    return `TRAITEMENT D'ENTRÉE :
${noTreatmentEntry ? "Aucun traitement à l'entrée" : treatmentEntryData.trim() || "[À COMPLÉTER PAR LE MÉDECIN]"}

TRAITEMENT DE SORTIE :
${treatmentExitData.trim() || "[À COMPLÉTER PAR LE MÉDECIN]"}

DATE DE RÉDACTION DE LA SORTIE :
${treatmentExitDate.trim() || "[À COMPLÉTER PAR LE MÉDECIN]"}`;
  }, [rawData, selectedVolet, noTreatmentEntry, treatmentEntryData, treatmentExitData, treatmentExitDate]);

  const currentInputLength = selectedVolet === "conciliation"
    ? treatmentEntryData.length + treatmentExitData.length + treatmentExitDate.length
    : rawData.length;
  const canGenerate = selectedVolet === "conciliation"
    ? Boolean(selectedSubtype && (noTreatmentEntry || treatmentEntryData.trim().length >= 3) && treatmentExitData.trim().length >= 3)
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
      const isObservationExamImport = selectedVolet === "observation";
      const response = await fetch(isObservationExamImport ? "/api/observation/extract-exam" : "/api/extract-file", {
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
      } else if (selectedVolet === "observation") {
        setObservationText((current) => {
          const separator = current.trim().length > 0 ? "\n\n--- Résultats d'examen extraits ---\n\n" : "";
          return `${current}${separator}${extractedText}`.slice(0, RAW_DATA_MAX_CHARS);
        });
      } else {
        setRawData((current) => {
          const separator = current.trim().length > 0 ? "\n\n--- Contenu importé ---\n\n" : "";
          return `${current}${separator}${extractedText}`.slice(0, RAW_DATA_MAX_CHARS);
        });
      }
      if (isObservationExamImport && payload.warning) {
        toast.warning(String(payload.warning));
      } else {
        toast.success(
          isObservationExamImport
            ? `Résultats d'examen extraits depuis ${payload.filename || file.name}.`
            : `Texte extrait depuis ${payload.filename || file.name}.`
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Extraction du fichier impossible.");
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [conciliationImportTarget, selectedVolet]);

  // ─── Dictée vocale ─────────────────────────────────────────────────────────
  /**
   * Appelé par VoiceRecorder quand la transcription est prête.
   * Le texte est ajouté à la fin du contenu existant (mode append).
   * Pour la conciliation, le texte est ajouté dans le champ actif selon conciliationImportTarget.
   */
  const handleVoiceTranscript = useCallback((text: string) => {
    if (selectedVolet === "conciliation") {
      const updateTreatment = conciliationImportTarget === "exit" ? setTreatmentExitData : setTreatmentEntryData;
      updateTreatment((prev) => {
        if (!prev.trim()) return text;
        const separator = prev.endsWith("\n") ? "" : "\n";
        return `${prev}${separator}${text}`.slice(0, RAW_DATA_MAX_CHARS);
      });
    } else if (selectedVolet === "observation") {
      setObservationText((prev) => {
        if (!prev.trim()) return text;
        const separator = prev.endsWith("\n") ? "" : "\n";
        return `${prev}${separator}${text}`.slice(0, RAW_DATA_MAX_CHARS);
      });
    } else {
      setRawData((prev) => {
        if (!prev.trim()) return text;
        const separator = prev.endsWith("\n") ? "" : "\n";
        return `${prev}${separator}${text}`.slice(0, RAW_DATA_MAX_CHARS);
      });
    }
    toast.success("Dictée ajoutée au champ de saisie.");
  }, [conciliationImportTarget, selectedVolet]);
  // ─────────────────────────────────────────────────────────────────────────────

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
    const html = documentEditorRef.current?.innerHTML ?? editedDocumentHtml;
    const text = documentEditorRef.current?.innerText ?? html.replace(/<[^>]+>/g, "\n") ?? generatedDoc;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Document copié dans le presse-papier.");
    });
  }, [validated, editedDocumentHtml, generatedDoc]);

  const handleDownloadWord = useCallback(async () => {
    if (!validated) return;
    try {
      toast.info("Génération du document Word en cours...");
      const html = (documentEditorRef.current?.innerHTML ?? editedDocumentHtml) || renderedDocumentHtml;
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: html }),
      });

      if (!response.ok) {
        throw new Error("La génération du document a échoué.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redactio_${selectedVolet}_${new Date().toISOString().slice(0, 10)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Document Word généré et téléchargé.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Téléchargement Word impossible.");
    }
  }, [validated, editedDocumentHtml, renderedDocumentHtml, selectedVolet]);

  const handleSecureObservation = useCallback(async () => {
    if (selectedVolet !== "observation" || !observationText.trim()) return;
    setIsSecuringObservation(true);
    try {
      const response = await fetch("/api/security/pseudonymise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: observationText }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "La pseudonymisation de l'observation a échoué.");
      }

      const result = await response.json() as PseudonymisationInfo & { filteredText: string };
      setObservationSafeText(result.filteredText);
      setObservationPseudoInfo({
        maskCount: result.maskCount,
        detectedCategories: result.detectedCategories,
        hasPotentialOvermasking: result.hasPotentialOvermasking,
      });
      setStep(3);

      if (result.maskCount > 0) {
        toast.success(`${result.maskCount} identifiant${result.maskCount > 1 ? "s" : ""} masqué${result.maskCount > 1 ? "s" : ""} avant export.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pseudonymisation impossible.");
    } finally {
      setIsSecuringObservation(false);
    }
  }, [observationText, selectedVolet]);

  const getObservationExportText = useCallback(
    () => observationSafeText || observationText,
    [observationSafeText, observationText]
  );

  const handleDownloadObservationWord = useCallback(async () => {
    if (selectedVolet !== "observation") return;
    try {
      toast.info("Génération du document Word en cours...");
      const content = getObservationExportText();
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("La génération du document a échoué.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redactio_observation_${new Date().toISOString().slice(0, 10)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Document Word (.docx) téléchargé.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Téléchargement Word impossible.");
    }
  }, [getObservationExportText, selectedVolet]);

  const handleDownloadTxt = useCallback(() => {
    if (selectedVolet !== "observation") return;
    try {
      const text = getObservationExportText();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redactio_observation_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Document texte (.txt) téléchargé.");
    } catch (err) {
      toast.error("Téléchargement .txt impossible.");
    }
  }, [getObservationExportText, selectedVolet]);

  const handleCopyObservation = useCallback(() => {
    navigator.clipboard.writeText(getObservationExportText()).then(() => {
      toast.success("Observation copiée dans le presse-papier.");
    });
  }, [getObservationExportText]);

  const handleValidateDocument = useCallback(() => {
    setEditedDocumentHtml((documentEditorRef.current?.innerHTML ?? editedDocumentHtml) || renderedDocumentHtml);
    setValidated(true);
    setStep(5);
  }, [editedDocumentHtml, renderedDocumentHtml]);

  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedVolet(null);
    setSelectedSubtype(null);
    setRawData("");
    setTreatmentEntryData("");
    setTreatmentExitData("");
    setTreatmentExitDate("");
    setObservationText("");
    setObservationSafeText("");
    setObservationPseudoInfo(null);
    setConciliationImportTarget("entry");
    setGeneratedDoc("");
    setRenderedDocumentHtml("");
    setEditedDocumentHtml("");
    setValidated(false);
    setPseudoInfo(null);
  }, []);

  // Redirection via useEffect pour éviter setState pendant le rendu
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation(loginUrl);
    }
  }, [authLoading, isAuthenticated, loginUrl, setLocation]);


  const STEPS = selectedVolet === "observation" ? STEPS_OBSERVATION : STEPS_DEFAULT;

  return (
    <RedactioLayout>
      <style>{newRedactionStyles}</style>
      <div className="redaction-compliance-bar" aria-label="Conformité données de santé">
        <span className="redaction-compliance-lead">
          <Shield className="h-3.5 w-3.5" />
          <span>Conforme aux exigences de protection des données de santé</span>
        </span>
        <span className="redaction-compliance-items">
          <span><Check className="h-3 w-3" /> RGPD</span>
          <span><Check className="h-3 w-3" /> HDS</span>
          <span><Check className="h-3 w-3" /> Secret médical</span>
          <span><Check className="h-3 w-3" /> Pseudonymisation</span>
        </span>
      </div>
      <div className="redaction-shell">
        <div className="redaction-header">
          <div className="redaction-title-row">
            <h1 className="redaction-page-title">Nouvelle rédaction</h1>
            <Button variant="outline" size="sm" onClick={handleReset} aria-label="Recommencer" className="redaction-restart">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Recommencer
            </Button>
          </div>
          <div className="redaction-stepper" role="list" aria-label="Étapes du parcours">
            {STEPS.map((s, index) => (
              <div key={s.id} className="step-wrap">
                <div className={cn("step-indicator", { current: step === s.id, done: step > s.id })} role="listitem">
                  <div className={cn("step-dot", { active: step === s.id, completed: step > s.id, pending: step < s.id })} aria-current={step === s.id ? "step" : undefined}>
                    {step > s.id ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span className="step-label">{s.label}</span>
                </div>
                {index < STEPS.length - 1 && <span className="step-sep" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
        {/* ─── Étape 1 : Choix du volet ─── */}
        {step === 1 && (
          <div className="redaction-panel animate-fade-in">
            <div>
              <h2 className="redaction-section-title">Choisissez un volet</h2>
              <p className="redaction-step-subtitle">
                Sélectionnez le type de document à rédiger.
              </p>
            </div>
            <div className="redaction-volets">
              {(Object.entries(VOLETS) as [Volet, typeof VOLETS[Volet]][]).map(([id, volet]) => (
                <button
                  key={id}
                  type="button"
                  className={cn("volet", { sel: selectedVolet === id })}
                  style={{ "--accent": VOLET_ICON_CLASSES[`${volet.color}_accent`] } as CSSProperties}
                  onClick={() => { setSelectedVolet(id); setSelectedSubtype(getDefaultSubtype(id)); }}>
                  <span className="check"><Check /></span>
                  <div className="ic">
                    {volet.icon}
                  </div>
                  <div>
                    <h3>{volet.label}</h3>
                    <p>{volet.description}</p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                className="volet"
                style={{ "--accent": VOLET_ICON_CLASSES.blue_accent } as CSSProperties}
                onClick={() => setLocation("/redaction/chirurgie-orthopedique")}
                aria-label="Ouvrir Chirurgie orthopédique"
              >
                <span className="check"><Check /></span>
                <div className="ic">
                  <Bone className="w-6 h-6" />
                </div>
                <div>
                  <h3>Chirurgie orthopédique</h3>
                  <p>Compte rendu opératoire et courrier de sortie d'hospitalisation structurés.</p>
                </div>
              </button>
            </div>
            <div className="step-foot">
              <span className="hint">
                {selectedVolet ? `Volet sélectionné : ${VOLETS[selectedVolet].label}` : "Sélectionnez un volet pour continuer."}
              </span>
              <Button onClick={() => setStep(2)} disabled={!selectedVolet} className="gap-2 redaction-primary-button">
                Continuer <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        {/* ─── Étape 2 : Injection des données ─── */}
        {step === 2 && selectedVolet && selectedVolet !== "observation" && (
          <div className="redaction-panel animate-fade-in">
            <div className="redaction-back-heading">
              <Button variant="ghost" size="icon" onClick={() => setStep(1)} aria-label="Retour">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="redaction-step-title">
                  {VOLETS[selectedVolet].label}
                </h2>
                <p className="redaction-step-subtitle">Saisissez les données médicales — sans identifiant direct du patient.</p>
              </div>
            </div>

            {/* Avertissement renforcé */}
            <div
              className="redaction-confidentiality"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Consigne de confidentialité obligatoire</p>
                <p>
                  Ne saisissez <strong>aucun identifiant direct</strong> du patient : ni nom, ni prénom,
                  ni numéro de sécurité sociale, ni date de naissance, ni adresse, ni numéro de téléphone.
                </p>
                <p className="text-xs">
                  Le filtre de pseudonymisation détectera et masquera automatiquement les identifiants
                  structurés, mais vous restez responsable de ne pas saisir d'identité directe.
                </p>
              </div>
            </div>

            <div className="redaction-field-group">
              <fieldset className="space-y-2">
                <legend className="redaction-field-label">
                  {getSubtypeLabel(selectedVolet)}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({getSubtypeHint(selectedVolet)})
                  </span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REDACTION_SUBTYPES[selectedVolet].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedSubtype(option.id)}
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
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

            <div className="redaction-field-group">
              {selectedVolet === "conciliation" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Colonne Traitement d'entrée */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label htmlFor="treatmentEntryData" className="redaction-field-label">
                          Traitement d'entrée
                          <span className="text-muted-foreground font-normal ml-1">(bilan médicamenteux)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground hidden sm:inline">Dictée</span>
                          <VoiceRecorderWithPreview
                            onInsert={(text) => {
                              if (noTreatmentEntry) return;
                              setConciliationImportTarget("entry");
                              setTreatmentEntryData((prev) => {
                                if (!prev.trim()) return text;
                                return `${prev}${prev.endsWith("\n") ? "" : "\n"}${text}`.slice(0, RAW_DATA_MAX_CHARS);
                              });
                            }}
                            fieldLabel="Traitement d'entrée"
                            insertMode="append"
                            disabled={noTreatmentEntry}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant={noTreatmentEntry ? "default" : "outline"}
                        size="sm"
                        className="w-fit gap-2"
                        aria-pressed={noTreatmentEntry}
                        onClick={() => {
                          setNoTreatmentEntry((current) => {
                            const next = !current;
                            if (next) {
                              setTreatmentEntryData("");
                              setConciliationImportTarget("exit");
                            }
                            return next;
                          });
                        }}
                      >
                        {noTreatmentEntry && <Check className="h-4 w-4" />}
                        Pas de traitement d'entrée
                      </Button>
                      <MedicalAutocomplete
                        id="treatmentEntryData"
                        value={treatmentEntryData}
                        onChange={(value) => {
                          setTreatmentEntryData(value);
                          if (value.trim()) setNoTreatmentEntry(false);
                        }}
                        onFocus={() => {
                          if (!noTreatmentEntry) setConciliationImportTarget("entry");
                        }}
                        placeholder={noTreatmentEntry ? "Aucun traitement à l'entrée : le tableau HAS sera généré avec les traitements de sortie en statut Ajouté." : `Exemple :\nAMLODIPINE 5 mg gélule : 1 le matin\nZOPICLONE 7,5 mg cp : 1 au coucher\nKARDEGIC 75 mg : 1 sachet à midi`}
                        className="min-h-[220px]"
                        rows={10}
                        maxLength={RAW_DATA_MAX_CHARS}
                        disabled={noTreatmentEntry}
                      />
                      {noTreatmentEntry && (
                        <p className="text-xs text-muted-foreground">
                          Cas activé : la génération utilisera « Aucun traitement à l'entrée » et classera les traitements de sortie en ajoutés.
                        </p>
                      )}
                    </div>
                    {/* Colonne Traitement de sortie */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="treatmentExitData" className="redaction-field-label">
                          Traitement de sortie
                          <span className="text-muted-foreground font-normal ml-1">(ordonnance finale)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground hidden sm:inline">Dictée</span>
                          <VoiceRecorderWithPreview
                            onInsert={(text) => {
                              setConciliationImportTarget("exit");
                              setTreatmentExitData((prev) => {
                                if (!prev.trim()) return text;
                                return `${prev}${prev.endsWith("\n") ? "" : "\n"}${text}`.slice(0, RAW_DATA_MAX_CHARS);
                              });
                            }}
                            fieldLabel="Traitement de sortie"
                            insertMode="append"
                          />
                        </div>
                      </div>
                      <MedicalAutocomplete
                        id="treatmentExitData"
                        value={treatmentExitData}
                        onChange={setTreatmentExitData}
                        onFocus={() => setConciliationImportTarget("exit")}
                        placeholder={`Exemple :\nAMLODIPINE 5 mg gélule : 1 le matin\nAPIXABAN 5 mg cp : 1 matin et 1 soir\nKARDEGIC 75 mg : arrêté`}
                        className="min-h-[220px]"
                        rows={10}
                        maxLength={RAW_DATA_MAX_CHARS}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="treatmentExitDate" className="redaction-field-label">
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
                  <div className="flex items-center justify-between">
                    <label htmlFor="rawData" className="redaction-field-label">
                      Données médicales brutes
                      <span className="text-muted-foreground font-normal ml-1">(sans identifiant direct)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:inline">Dictée vocale</span>
                      <VoiceRecorderWithPreview
                        onInsert={handleVoiceTranscript}
                        fieldLabel="Données médicales brutes"
                        insertMode="append"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                  <MedicalAutocomplete
                    id="rawData"
                    value={rawData}
                    onChange={setRawData}
                    placeholder={`Exemple pour ${VOLETS[selectedVolet].label} :\n\nService : Cardiologie\nMotif d'hospitalisation : Décompensation cardiaque\nAntécédents : HTA, FA chronique, insuffisance cardiaque FE 35%\nTraitement habituel : Furosémide 40mg, Bisoprolol 5mg, Rivaroxaban 20mg\n...\n\nVous pouvez aussi utiliser le bouton microphone pour dicter directement.`}
                    className="min-h-[280px]"
                    rows={12}
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
                  <Badge variant="secondary" className="text-xs">
                    Pseudonymisation automatique activée
                  </Badge>
                )}
              </div>
              <div
                className={cn(
                  "redaction-dropzone",
                  isFileDragOver
                    ? "is-over"
                    : ""
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
                  <div className="redaction-dropzone-icon">
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
              </div>
            </div>

            <div className="step-foot">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Retour
              </Button>
              <span className="spacer" />
              <Button
                onClick={() => { setStep(3); handleGenerate(); }}
                disabled={!canGenerate}
                className="gap-2 redaction-primary-button"
              >
                Générer le document
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Étape 2 : Observation Médicale (Interface dédiée) ─── */}
        {step === 2 && selectedVolet === "observation" && (
          <div className="redaction-panel animate-fade-in">
            <div className="redaction-back-heading">
              <Button variant="ghost" size="icon" onClick={() => setStep(1)} aria-label="Retour">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="redaction-step-title">Observation Médicale</h2>
                <p className="redaction-step-subtitle">Saisissez ou dictez vos notes libres.</p>
              </div>
            </div>

            <div className="redaction-confidentiality" role="alert">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Consigne de confidentialité obligatoire</p>
                <p>
                  Ne saisissez <strong>aucun identifiant direct</strong> du patient : ni nom, ni prénom,
                  ni numéro de sécurité sociale, ni date de naissance, ni adresse, ni numéro de téléphone.
                </p>
                <p className="text-xs text-muted-foreground">
                  Le filtre de pseudonymisation détectera et masquera automatiquement les identifiants structurés avant copie ou export.
                </p>
              </div>
            </div>

            <div className="redaction-field-group">
              <div className="flex items-center justify-between">
                <label htmlFor="observation-text" className="redaction-field-label">
                  Contenu de l'observation
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Dictée vocale</span>
                  <VoiceRecorderWithPreview
                    onInsert={(text) => {
                      setObservationText((prev) => {
                        if (!prev.trim()) return text;
                        return `${prev}${prev.endsWith("\n") ? "" : "\n"}${text}`.slice(0, RAW_DATA_MAX_CHARS);
                      });
                    }}
                    fieldLabel="Observation médicale"
                    insertMode="append"
                  />
                </div>
              </div>
              <MedicalAutocomplete
                id="observation-text"
                value={observationText}
                onChange={setObservationText}
                placeholder="Saisissez ou dictez vos notes ici..."
                className="min-h-[320px]"
                rows={14}
                maxLength={RAW_DATA_MAX_CHARS}
              />
              <p className="text-xs text-muted-foreground">
                {observationText.length}/{RAW_DATA_MAX_CHARS.toLocaleString("fr-FR")} caractères
              </p>
              <p className="text-xs text-muted-foreground">
                Les fichiers déposés sont analysés avant insertion : résultats d'examen uniquement, données administratives supprimées.
              </p>
              {observationText.length > 0 && (
                <Badge variant="secondary" className="w-fit text-xs">
                  Pseudonymisation automatique activée avant export
                </Badge>
              )}
            </div>

            <div
              className={cn("redaction-dropzone", isFileDragOver ? "is-over" : "")}
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
                <div className="redaction-dropzone-icon">
                  {isExtractingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isExtractingFile ? "Extraction des données de l'examen en cours..." : "Glissez-déposez un fichier ici"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Les informations administratives et identitaires seront automatiquement supprimées.
                  </p>
                </div>
              </div>
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
            </div>

            <div className="step-foot">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Retour
              </Button>
              <span className="spacer" />
              <Button onClick={handleSecureObservation} disabled={!observationText.trim() || isSecuringObservation} className="gap-2 redaction-primary-button">
                {isSecuringObservation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sécurisation…
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

          </div>
        )}

        {/* ─── Étape 3 : Génération en cours ─── */}
        {step === 3 && selectedVolet !== "observation" && (
          <div className="redaction-panel animate-fade-in">
            <div className="redaction-generation">
              <div className="flex items-center justify-center">
                <div className="redaction-spinner-ring">
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
          <div className="redaction-panel animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="redaction-step-title">Relecture et édition</h2>
                <p className="redaction-step-subtitle">
                  Relisez, corrigez et complétez le document avant validation.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep(2); setGeneratedDoc(""); setEditedDocumentHtml(""); }}
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
              <div
                ref={documentEditorRef}
                className="tiptap-editor"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label="Éditeur de document médical"
                aria-multiline="true"
                dangerouslySetInnerHTML={{ __html: editedDocumentHtml || renderedDocumentHtml }}
              />
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
                        onClick={handleValidateDocument}
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

        {/* ─── Étape 3 : Export pour Observation Médicale ─── */}
        {step === 3 && selectedVolet === "observation" && (
          <div className="redaction-panel animate-fade-in">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Observation prête pour l'export</h2>
              <p className="text-sm text-muted-foreground">
                Vous pouvez maintenant copier ou télécharger vos notes pseudonymisées.
              </p>
            </div>

            {observationPseudoInfo && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        Pseudonymisation appliquée avant export
                      </p>
                      <p className="text-muted-foreground">
                        {observationPseudoInfo.maskCount} identifiant{observationPseudoInfo.maskCount > 1 ? "s" : ""} masqué{observationPseudoInfo.maskCount > 1 ? "s" : ""}.
                        {observationPseudoInfo.detectedCategories.length > 0 && (
                          <> Catégories : {observationPseudoInfo.detectedCategories.join(", ")}.</>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Options d'export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={handleCopyObservation}
                >
                  <Copy className="w-4 h-4" />
                  Copier le texte
                </Button>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={handleDownloadTxt}
                >
                  <Download className="w-4 h-4" />
                  Télécharger en texte (.txt)
                </Button>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={handleDownloadObservationWord}
                >
                  <Download className="w-4 h-4" />
                  Télécharger en Word (.docx)
                </Button>

              </CardContent>
            </Card>

            <div className="flex justify-center">
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Revenir à la relecture
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Nouvelle rédaction
                </Button>
              </div>
            </div>
          </div>
        )}


        {/* ─── Étape 5 : Export ─── */}
        {step === 5 && validated && (
          <div className="redaction-panel animate-fade-in">
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

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-xs text-primary">
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

const newRedactionStyles = `
@import url("https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap");

:root{
  --ink:#0b1b29;
  --ink-soft:#5a6b78;
  --ink-faint:#8a99a4;
  --teal:#0e9c8e;
  --teal-deep:#0a7b70;
  --line:#e6edf0;
  --field:#f6f9f9;
  --mint:#eef6f4;
  --navy:#1e3a5f;
  --gold:#c58a17;
  --purple:#6d5bd0;
  --blue:#2f6fb0;
  --bg:#f3f6f7;
}

.redaction-shell,
.redaction-shell *{
  box-sizing:border-box;
}

.redaction-shell{
  width:100%;
  max-width:1180px;
  min-height:calc(100vh - 40px);
  margin:0 auto;
  padding:34px 44px 40px;
  display:flex;
  flex-direction:column;
  color:var(--ink);
  font-family:"Hanken Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}

.redaction-compliance-bar{
  max-width:1180px;
  margin:0 auto 14px;
  padding:10px 16px;
  border:1px solid var(--line);
  border-radius:14px;
  background:#fff;
  color:var(--ink-soft);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  font-family:"Hanken Grotesk",system-ui,sans-serif;
  box-shadow:0 2px 8px rgba(11,27,41,.04);
}

.redaction-compliance-lead,
.redaction-compliance-items,
.redaction-compliance-items span{
  display:flex;
  align-items:center;
  gap:7px;
}

.redaction-compliance-lead{
  font-weight:700;
  color:var(--ink);
  font-size:13px;
}

.redaction-compliance-items{
  flex-wrap:wrap;
  justify-content:flex-end;
  font-size:12px;
  font-weight:600;
  color:var(--ink-soft);
}

.redaction-header{
  margin-bottom:8px;
}

.redaction-title-row{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
  margin-bottom:22px;
}

.redaction-page-title{
  font-family:"Spectral",Georgia,serif;
  font-weight:600;
  font-size:29px;
  line-height:1.1;
  letter-spacing:-.2px;
  margin:0;
  color:var(--ink);
}

.redaction-restart{
  display:inline-flex !important;
  align-items:center;
  gap:8px;
  height:auto !important;
  min-height:40px;
  background:#fff !important;
  border:1px solid var(--line) !important;
  border-radius:11px !important;
  padding:10px 16px !important;
  font-weight:600 !important;
  font-size:13.5px !important;
  color:var(--ink-soft) !important;
  box-shadow:none !important;
  transition:.15s ease;
}

.redaction-restart:hover{
  color:var(--ink) !important;
  border-color:#d3dde2 !important;
  background:#fff !important;
}

.redaction-restart svg{
  width:15px;
  height:15px;
}

/* ---------- PROGRESSION ---------- */
.redaction-stepper{
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:40px;
  flex-wrap:wrap;
}

.step-wrap{
  display:flex;
  align-items:center;
  gap:10px;
}

.step-indicator{
  display:flex;
  align-items:center;
  gap:10px;
}

.step-dot{
  width:30px;
  height:30px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
  font-size:13px;
  line-height:1;
  flex:none;
  border:1.5px solid var(--line);
  color:var(--ink-faint);
  background:#fff;
  transition:.18s ease;
}

.step-indicator.done .step-dot,
.step-indicator.current .step-dot{
  border-color:var(--navy);
  background:var(--navy);
  color:#fff;
}

.step-dot svg{
  width:14px;
  height:14px;
}

.step-label{
  font-weight:600;
  font-size:14px;
  color:var(--ink-faint);
}

.step-indicator.current .step-label{
  color:var(--ink);
}

.step-sep{
  width:46px;
  height:1.5px;
  background:var(--line);
  display:inline-flex;
}

/* ---------- PANELS ---------- */
.redaction-panel{
  width:100%;
  display:flex;
  flex-direction:column;
  flex:1;
}

.redaction-section-title,
.h2,
.redaction-step-title{
  font-family:"Spectral",Georgia,serif;
  font-weight:600;
  font-size:22px;
  line-height:1.2;
  margin:0 0 6px;
  color:var(--ink);
}

.redaction-step-subtitle{
  color:var(--ink-soft);
  font-size:14.5px;
  line-height:1.5;
  margin:0 0 24px;
}

.redaction-back-heading{
  display:flex;
  align-items:flex-start;
  gap:12px;
  margin-bottom:20px;
}

.redaction-back-heading > button{
  border-radius:10px !important;
  color:var(--ink-soft) !important;
}

/* ---------- BLOC SÉLECTION ---------- */
.redaction-volets{
  display:flex;
  flex-wrap:wrap;
  gap:20px;
  justify-content:center;
}

.volet{
  appearance:none;
  -webkit-appearance:none;
  position:relative;
  flex:1 1 300px;
  max-width:344px;
  min-width:272px;
  min-height:210px;
  background:#fff;
  border:1.5px solid var(--line);
  border-radius:16px;
  padding:24px 24px 22px;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  text-align:left;
  color:var(--ink);
  box-shadow:0 2px 6px rgba(11,27,41,.04);
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  cursor:pointer;
  font:inherit;
}

.volet:hover{
  transform:translateY(-3px);
  box-shadow:0 20px 40px -22px rgba(11,27,41,.32);
  border-color:color-mix(in srgb,var(--accent) 45%,var(--line));
}

.volet.sel{
  border-color:var(--accent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent),0 18px 38px -22px rgba(11,27,41,.35);
}

.volet .ic{
  width:52px;
  height:52px;
  border-radius:13px;
  background:var(--accent);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom:18px;
}

.volet .ic svg{
  width:25px;
  height:25px;
}

.volet h3{
  font-family:"Spectral",Georgia,serif;
  font-weight:600;
  font-size:20px;
  line-height:1.2;
  margin:0 0 9px;
  color:var(--ink);
}

.volet p{
  color:var(--ink-soft);
  font-size:13.7px;
  line-height:1.5;
  margin:0;
}

.volet .check{
  position:absolute;
  top:18px;
  right:18px;
  width:24px;
  height:24px;
  border-radius:50%;
  border:1.5px solid var(--line);
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  transition:.15s ease;
}

.volet .check svg{
  width:14px;
  height:14px;
  opacity:0;
  transition:.15s ease;
  stroke-width:3px;
}

.volet.sel .check{
  background:var(--accent);
  border-color:var(--accent);
}

.volet.sel .check svg{
  opacity:1;
}

/* ---------- FORMULAIRES ---------- */
.redaction-confidentiality{
  display:flex;
  align-items:flex-start;
  gap:12px;
  margin:0 0 22px;
  padding:16px 18px;
  border:1px solid rgba(197,138,23,.28);
  border-radius:14px;
  background:#fff8ed;
  color:#6f4a08;
}

.redaction-confidentiality p{
  margin:0;
  line-height:1.45;
}

.redaction-field-group{
  background:#fff;
  border:1px solid var(--line);
  border-radius:16px;
  padding:20px;
  box-shadow:0 2px 6px rgba(11,27,41,.04);
  margin-bottom:18px;
}

.redaction-field-label{
  display:block;
  color:var(--ink);
  font-size:13.5px;
  font-weight:700;
  margin-bottom:8px;
}

.redaction-dropzone{
  border:1.5px dashed #cbd6dc;
  border-radius:15px;
  background:var(--field);
  padding:16px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  flex-wrap:wrap;
  transition:.15s ease;
}

.redaction-dropzone.is-over{
  border-color:var(--teal);
  background:var(--mint);
}

.redaction-dropzone-icon{
  width:38px;
  height:38px;
  border-radius:11px;
  background:#fff;
  color:var(--teal-deep);
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--line);
}

.mask-badge,
.tag-a-completer{
  display:inline-flex;
  align-items:center;
  border-radius:999px;
  padding:3px 8px;
  font-size:11px;
  font-weight:700;
}

.mask-badge{
  color:var(--teal-deep);
  background:var(--mint);
  border:1px solid rgba(14,156,142,.18);
}

.tag-a-completer{
  color:#7a4a00;
  background:#fff1c2;
  border:1px solid #ffd56b;
}

.tableWrapper{
  width:100%;
  overflow-x:auto;
  margin:14px 0;
  border:1px solid var(--line);
  border-radius:12px;
}

.tableWrapper table{
  width:100%;
  border-collapse:collapse;
  background:#fff;
}

.tableWrapper th,
.tableWrapper td{
  padding:10px 12px;
  border-bottom:1px solid var(--line);
  text-align:left;
  vertical-align:top;
  font-size:13px;
  cursor:text;
}

.tableWrapper th{
  background:var(--field);
  color:var(--ink);
  font-weight:800;
}

.tiptap-editor{
  min-height:420px;
  background:#fff;
  padding:22px;
  color:var(--ink);
  line-height:1.65;
  outline:none;
}

.tiptap-editor h2,
.tiptap-editor h3,
.tiptap-editor h4{
  font-family:"Spectral",Georgia,serif;
  color:var(--ink);
  margin:18px 0 8px;
}

.tiptap-editor p{
  margin:0 0 8px;
}

/* ---------- GÉNÉRATION / EXPORT ---------- */
.redaction-generation{
  min-height:420px;
  border:1px solid var(--line);
  border-radius:18px;
  background:#fff;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:20px;
  text-align:center;
  box-shadow:0 2px 6px rgba(11,27,41,.04);
}

.redaction-spinner-ring{
  width:72px;
  height:72px;
  border-radius:50%;
  background:var(--mint);
  display:flex;
  align-items:center;
  justify-content:center;
}

/* ---------- BARRE ACTIONS ---------- */
.step-foot{
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:14px;
  margin-top:40px;
  padding-top:34px;
  border-top:1px solid var(--line);
}

.spacer{
  flex:1;
}

.hint{
  margin-right:auto;
  font-size:13px;
  color:var(--ink-faint);
}

.redaction-primary-button{
  display:inline-flex !important;
  align-items:center;
  gap:9px;
  min-height:46px;
  background:var(--teal) !important;
  color:#fff !important;
  border:none !important;
  border-radius:12px !important;
  padding:13px 24px !important;
  font-weight:700 !important;
  font-size:14.5px !important;
  box-shadow:0 12px 24px -12px rgba(14,156,142,.9);
  transition:.15s ease;
}

.redaction-primary-button:hover:not(:disabled){
  background:var(--teal-deep) !important;
}

.redaction-primary-button:disabled{
  background:#a8d8d2 !important;
  box-shadow:none !important;
  cursor:not-allowed;
  opacity:.85;
}

@media(max-width:860px){
  .redaction-shell{
    padding:26px 20px 34px;
  }
  .redaction-compliance-bar{
    margin:0 20px 12px;
    align-items:flex-start;
    flex-direction:column;
  }
  .step-label{
    display:none;
  }
  .step-sep{
    width:20px;
  }
  .redaction-volets{
    justify-content:stretch;
  }
  .volet{
    max-width:none;
    min-width:100%;
  }
}

@media(max-width:560px){
  .redaction-title-row,
  .step-foot{
    align-items:stretch;
    flex-direction:column;
  }
  .hint,
  .spacer{
    margin-right:0;
  }
  .redaction-restart,
  .redaction-primary-button{
    width:100%;
    justify-content:center;
  }
  .redaction-dropzone{
    align-items:stretch;
    flex-direction:column;
  }
}
`;
