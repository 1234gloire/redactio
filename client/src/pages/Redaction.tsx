import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
import MedicalAutocomplete from "@/components/MedicalAutocomplete";
import VoiceRecorderWithPreview from "@/components/VoiceRecorderWithPreview";
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
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  Download,
  FilePenLine,
  FileUp,
  FileText,
  Loader2,
  RotateCcw,
  Stethoscope,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
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

const VOLETS: Record<Volet, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  courrier_sortie: {
    label: "Courrier de sortie",
    icon: <FileText className="w-6 h-6" />,
    description: "Rédaction du courrier de sortie d'hospitalisation à destination du médecin traitant ou d'un correspondant.",
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
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
  slate: "bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400",
  seal: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400", // 'seal' est interprété comme 'blue'
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
};

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
  const [streamingText, setStreamingText] = useState("");

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
    const text = editor?.getText() ?? generatedDoc;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Document copié dans le presse-papier.");
    });
  }, [validated, editor, generatedDoc]);

  const handleDownloadWord = useCallback(async () => {
    if (!validated) return;
    try {
      toast.info("Génération du document Word en cours...");
      const text = editor?.getText() ?? generatedDoc;
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
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
  }, [validated, editor, generatedDoc, selectedVolet]);

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
    setValidated(false);
    setPseudoInfo(null);
    editor?.commands.setContent("");
  }, [editor]);

  // Redirection via useEffect pour éviter setState pendant le rendu
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || !isAuthenticated) return null;

  const STEPS = selectedVolet === "observation" ? STEPS_OBSERVATION : STEPS_DEFAULT;

  const progressStyle = {
    "--redaction-progress": `${(step / STEPS.length) * 100}%`,
  } as CSSProperties;

  return (
    <RedactioLayout>
      <div className="redaction-shell">
        {/* En-tête avec étapes */}
        <div className="redaction-header">
          <div className="redaction-title-row">
            <h1 className="redaction-page-title">Nouvelle rédaction</h1>
            <Button variant="outline" size="sm" onClick={handleReset} aria-label="Recommencer" className="redaction-restart">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Recommencer
            </Button>
          </div>

          {/* Indicateur d'étapes */}
          <div className="redaction-stepper" style={progressStyle} role="list" aria-label="Étapes du parcours">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={cn("step-indicator", {
                    current: step === s.id,
                    done: step > s.id,
                  })}
                  role="listitem"
                >
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
                  <span className="step-label">{s.label}</span>
                </div>
              ))}
          </div>
        </div>

        {/* ─── Étape 1 : Choix du volet ─── */}
        {step === 1 && (
          <div className="redaction-panel animate-fade-in">
            <div>
              <h2 className="redaction-step-title">Choisissez un volet</h2>
              <p className="redaction-step-subtitle">
                Sélectionnez le type de document à rédiger.
              </p>
            </div>
            <div className="redaction-volets">
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
                  <div className={cn("volet-icon", VOLET_ICON_CLASSES[volet.color])}>
                    {volet.icon}
                  </div>
                  <div>
                    <h3>{volet.label}</h3>
                    <p>{volet.description}</p>
                  </div>
                  {selectedVolet === id && (
                    <div className="volet-check">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="step-foot">
              <span className="spacer" />
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedVolet}
                className="gap-2 redaction-primary-button"
              >
                Continuer
                <ArrowRight className="w-4 h-4" />
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
                <p className="redaction-step-subtitle">Saisissez les données médicales du patient.</p>
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
                  Type de document
                  {selectedVolet === "courrier_sortie"
                    ? "Choix de service (spécialité)"
                    : selectedVolet === "conciliation"
                    ? "Type de conciliation"
                    : "Type de correspondance"}
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
                      <div className="flex items-center justify-between">
                        <label htmlFor="treatmentEntryData" className="redaction-field-label">
                          Traitement d'entrée
                          <span className="text-muted-foreground font-normal ml-1">(bilan médicamenteux)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground hidden sm:inline">Dictée</span>
                          <VoiceRecorderWithPreview
                            onInsert={(text) => {
                              setConciliationImportTarget("entry");
                              setTreatmentEntryData((prev) => {
                                if (!prev.trim()) return text;
                                return `${prev}${prev.endsWith("\n") ? "" : "\n"}${text}`.slice(0, RAW_DATA_MAX_CHARS);
                              });
                            }}
                            fieldLabel="Traitement d'entrée"
                            insertMode="append"
                          />
                        </div>
                      </div>
                      <MedicalAutocomplete
                        id="treatmentEntryData"
                        value={treatmentEntryData}
                        onChange={setTreatmentEntryData}
                        onFocus={() => setConciliationImportTarget("entry")}
                        placeholder={`Exemple :\nAMLODIPINE 5 mg gélule : 1 le matin\nZOPICLONE 7,5 mg cp : 1 au coucher\nKARDEGIC 75 mg : 1 sachet à midi`}
                        className="min-h-[220px]"
                        rows={10}
                        maxLength={RAW_DATA_MAX_CHARS}
                      />
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
              {observationText.length > 0 && (
                <Badge variant="secondary" className="w-fit text-xs">
                  Pseudonymisation automatique activée avant export
                </Badge>
              )}
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
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Nouvelle rédaction
              </Button>
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
