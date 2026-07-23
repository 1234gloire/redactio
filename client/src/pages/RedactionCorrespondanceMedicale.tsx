import { useAuth } from "@/_core/hooks/useAuth";
import VoiceRecorderWithPreview from "@/components/VoiceRecorderWithPreview";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, BookOpen, Check, Copy, FileUp, Mic, RefreshCw, Shield } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const MISS = "[à préciser par le médecin]";

type CorrespondanceType = "consultation_specialisee" | "transfert_inter_service" | "liaison_fin_suivi";

const TYPES: Record<CorrespondanceType, { label: string; short: string }> = {
  consultation_specialisee: { label: "Demande d'avis spécialisé", short: "Demande d'avis spécialisé" },
  transfert_inter_service: { label: "Courrier de transfert", short: "Courrier de transfert" },
  liaison_fin_suivi: { label: "Courrier de liaison / fin de suivi", short: "Liaison / fin de suivi" },
};

function formatDate(value: string) {
  if (!value) return MISS;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function valueOrMiss(value: string) {
  return value.trim() || MISS;
}

function addSection(title: string, lines: string[]) {
  return `${title}\n${lines.join("\n")}`;
}

export default function RedactionCorrespondanceMedicale() {
  const loginUrl = getLoginUrl("/redaction/correspondance-medicale");
  const { isAuthenticated, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: loginUrl,
  });

  const importTarget = useRef<"antecedents" | "examenClinique" | "traitement" | null>(null);

  const [type, setType] = useState<CorrespondanceType>("consultation_specialisee");
  const [age, setAge] = useState("");
  const [antecedents, setAntecedents] = useState("sans particularité");
  const [examenClinique, setExamenClinique] = useState("");
  const [traitement, setTraitement] = useState("");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [a5, setA5] = useState("");
  const [a6, setA6] = useState("non urgent");
  const [a6Text, setA6Text] = useState("");
  const [b1, setB1] = useState("");
  const [b2, setB2] = useState("");
  const [b3a, setB3a] = useState("");
  const [b3b, setB3b] = useState("");
  const [b4, setB4] = useState("");
  const [c1, setC1] = useState("");
  const [c2, setC2] = useState("");
  const [c3a, setC3a] = useState("");
  const [c3b, setC3b] = useState("");
  const [c4, setC4] = useState("");
  const [c5, setC5] = useState("");
  const [c6, setC6] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pseudoInfo, setPseudoInfo] = useState<{ maskCount: number; detectedCategories: string[] } | null>(null);

  const blocText = useMemo(() => {
    const common = [
      `0. TYPE DE COURRIER : ${TYPES[type].label}`,
      `0bis. ÂGE DU PATIENT : ${age.trim() ? `${age.trim()} ans` : MISS}`,
      `ANTÉCÉDENTS : ${valueOrMiss(antecedents)}`,
      `EXAMEN CLINIQUE : ${valueOrMiss(examenClinique)}`,
      `TRAITEMENT EN COURS : ${valueOrMiss(traitement)}`,
    ];

    if (type === "consultation_specialisee") {
      return [
        ...common,
        addSection("A. DEMANDE D'AVIS SPÉCIALISÉ", [
          `A1. Spécialité / service sollicité : ${valueOrMiss(a1)}`,
          `A2. Motif du recours : ${valueOrMiss(a2)}`,
          `A3. Question posée : ${valueOrMiss(a3)}`,
          `A5. Examens déjà réalisés : ${valueOrMiss(a5)}`,
          `A6. Degré d'urgence : ${a6 === "autre" ? valueOrMiss(a6Text) : a6}`,
        ]),
      ].join("\n");
    }

    if (type === "transfert_inter_service") {
      return [
        ...common,
        addSection("B. COURRIER DE TRANSFERT", [
          `B1. Service / structure destinataire : ${valueOrMiss(b1)}`,
          `B2. Motif du transfert : ${valueOrMiss(b2)}`,
          `B3. Dates de prise en charge : admission ${formatDate(b3a)} — transfert ${formatDate(b3b)}`,
          `B4. Résumé de la prise en charge : ${valueOrMiss(b4)}`,
        ]),
      ].join("\n");
    }

    return [
      ...common,
      addSection("C. COURRIER DE LIAISON / FIN DE SUIVI", [
        `C1. Destinataire fonctionnel : ${valueOrMiss(c1)}`,
        `C2. Motif initial du suivi : ${valueOrMiss(c2)}`,
        `C3. Période de suivi : du ${formatDate(c3a)} au ${formatDate(c3b)}`,
        `C4. Évolution : ${valueOrMiss(c4)}`,
        `C5. Conclusion / devenir : ${valueOrMiss(c5)}`,
        `C6. Surveillance proposée / points à reprendre : ${valueOrMiss(c6)}`,
      ]),
    ].join("\n");
  }, [a1, a2, a3, a5, a6, a6Text, age, antecedents, b1, b2, b3a, b3b, b4, c1, c2, c3a, c3b, c4, c5, c6, examenClinique, traitement, type]);

  const missingCount = (blocText.match(/\[/g) ?? []).length;

  const generationInput = useMemo(() => `# CONSIGNE — Correspondance médicale
Rédige directement le courrier final à partir du bloc §2 ci-dessous.
Utilise le prompt "Prompt_Correspondance_Medicale.md".
Ne demande pas à l'utilisateur de coller un autre bloc.
N'ajoute aucune donnée clinique absente. Nomme le destinataire par fonction/service, jamais par nom.
Sortie en texte brut, prête à relire.

BLOC §2 RENSEIGNÉ PAR LE MÉDECIN :
${blocText}`, [blocText]);

  const buildLocalCourrier = useCallback(() => {
    const ageLine = age.trim() ? `Patient(e) de ${age.trim()} ans.` : `Patient(e) : ${MISS}.`;
    if (type === "consultation_specialisee") {
      return `Cher Confrère,

Je vous adresse ce courrier afin de solliciter un avis auprès de ${valueOrMiss(a1)}.

OBJET :
${valueOrMiss(a2)}

CONTEXTE CLINIQUE :
${ageLine}
Antécédents : ${valueOrMiss(antecedents)}
Examen clinique : ${valueOrMiss(examenClinique)}
Traitement en cours : ${valueOrMiss(traitement)}

QUESTION POSÉE :
${valueOrMiss(a3)}

EXAMENS DÉJÀ RÉALISÉS :
${valueOrMiss(a5)}

DEGRÉ D'URGENCE :
${a6 === "autre" ? valueOrMiss(a6Text) : a6}

Bien confraternellement,`;
    }

    if (type === "transfert_inter_service") {
      return `Cher Confrère,

Je vous adresse ce courrier dans le cadre du transfert vers ${valueOrMiss(b1)}.

MOTIF DU TRANSFERT :
${valueOrMiss(b2)}

PÉRIODE DE PRISE EN CHARGE :
Du ${formatDate(b3a)} au ${formatDate(b3b)}.

CONTEXTE CLINIQUE :
${ageLine}
Antécédents : ${valueOrMiss(antecedents)}
Examen clinique : ${valueOrMiss(examenClinique)}
Traitement en cours : ${valueOrMiss(traitement)}

RÉSUMÉ DE LA PRISE EN CHARGE :
${valueOrMiss(b4)}

Bien confraternellement,`;
    }

    return `Cher Confrère,

Je vous adresse ce courrier de liaison concernant la fin du suivi / relais de prise en charge.

DESTINATAIRE FONCTIONNEL :
${valueOrMiss(c1)}

MOTIF INITIAL DU SUIVI :
${valueOrMiss(c2)}

PÉRIODE DE SUIVI :
Du ${formatDate(c3a)} au ${formatDate(c3b)}.

CONTEXTE CLINIQUE :
${ageLine}
Antécédents : ${valueOrMiss(antecedents)}
Examen clinique : ${valueOrMiss(examenClinique)}
Traitement en cours : ${valueOrMiss(traitement)}

ÉVOLUTION :
${valueOrMiss(c4)}

CONCLUSION / DEVENIR :
${valueOrMiss(c5)}

SURVEILLANCE / POINTS À REPRENDRE :
${valueOrMiss(c6)}

Bien confraternellement,`;
  }, [a1, a2, a3, a5, a6, a6Text, age, antecedents, b1, b2, b3a, b3b, b4, c1, c2, c3a, c3b, c4, c5, c6, examenClinique, traitement, type]);

  const handleGenerate = useCallback(async () => {
    setGeneratedText("");
    setStreamingText("");
    setPseudoInfo(null);
    setIsGenerating(true);
    let accumulated = "";

    try {
      const response = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          volet: "correspondance",
          subtype: type,
          rawData: generationInput,
        }),
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ error: "Erreur réseau" }));
        throw new Error(errorPayload.error || `HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Flux de génération indisponible.");
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
          const parsed = JSON.parse(data);
          if (parsed.type === "pseudonymisation") {
            setPseudoInfo({
              maskCount: Number(parsed.maskCount ?? 0),
              detectedCategories: Array.isArray(parsed.detectedCategories) ? parsed.detectedCategories : [],
            });
          } else if (parsed.type === "token") {
            accumulated += String(parsed.content ?? "");
            setStreamingText(accumulated);
          } else if (parsed.type === "done") {
            if (/coller.*bloc|merci de.*bloc|dès réception/i.test(accumulated)) {
              setStreamingText("");
              setGeneratedText(buildLocalCourrier());
              toast.warning("Le moteur n'a pas repris le bloc saisi : courrier local généré à partir des données.");
            } else {
              setGeneratedText(accumulated);
              toast.success("Correspondance générée.");
            }
          } else if (parsed.type === "error") {
            throw new Error(parsed.message || "Erreur de génération.");
          }
        }
      }
    } catch (error) {
      setGeneratedText(buildLocalCourrier());
      toast.warning(error instanceof Error ? `Backend indisponible : génération locale utilisée. ${error.message}` : "Backend indisponible : génération locale utilisée.");
    } finally {
      setIsGenerating(false);
    }
  }, [buildLocalCourrier, generationInput, type]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedText || streamingText || blocText);
    toast.success("Texte copié.");
  }, [blocText, generatedText, streamingText]);

  const appendImportedText = useCallback((target: NonNullable<typeof importTarget.current>, text: string) => {
    const setters = { antecedents: setAntecedents, examenClinique: setExamenClinique, traitement: setTraitement };
    setters[target]((current) => [current.trim(), text.trim()].filter(Boolean).join("\n"));
  }, []);

  const handleImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const target = importTarget.current;
    event.target.value = "";
    if (!file || !target) return;
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/extract-file", { method: "POST", body: data, credentials: "include" });
      if (!response.ok) throw new Error((await response.json().catch(() => ({ error: "Échec de l'import" }))).error);
      const payload = await response.json();
      const text = String(payload.text ?? "").trim();
      if (!text) throw new Error("Aucun texte extractible.");
      appendImportedText(target, text);
      toast.success("Document importé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'import.");
    } finally {
      importTarget.current = null;
    }
  }, [appendImportedText]);

  const reset = useCallback(() => {
    setAge("");
    setAntecedents("sans particularité");
    setExamenClinique("");
    setTraitement("");
    setA1(""); setA2(""); setA3(""); setA5(""); setA6("non urgent"); setA6Text("");
    setB1(""); setB2(""); setB3a(""); setB3b(""); setB4("");
    setC1(""); setC2(""); setC3a(""); setC3b(""); setC4(""); setC5(""); setC6("");
    setGeneratedText("");
    setStreamingText("");
    setPseudoInfo(null);
  }, []);

  if (authLoading || !isAuthenticated) {
    return <div className="correspondance-loading"><div /></div>;
  }

  const displayedText = generatedText || streamingText || "Le courrier généré s'affichera ici après un clic sur « Générer le courrier ».";

  return (
    <div className="correspondance-page">
      <style>{styles}</style>
      <header className="correspondance-top">
        <Link href="/dashboard" className="correspondance-back"><ArrowLeft size={16} /> Tableau de bord</Link>
        <h1><BookOpen size={24} /> Saisie rapide — Correspondance médicale</h1>
        <p>MEDACTIO · Aide rédactionnelle : met en forme ce que vous saisissez. Le destinataire n'est jamais nommé, il est décrit par sa fonction, spécialité ou service.</p>
        <p className="mic-note"><Mic size={13} /> La dictée vocale et l'import de fichier sont disponibles sur les champs de texte.</p>
      </header>

      <div className="correspondance-cbar">
        <span><Shield size={14} /> Conforme aux exigences de protection des données de santé</span>
        <span><Check size={12} /> RGPD</span>
        <span><Check size={12} /> HDS</span>
        <span><Check size={12} /> Pseudonymisation</span>
      </div>

      <main className="correspondance-wrap">
        <section className="correspondance-card">
          <h2>1 · Type de correspondance</h2>
          <div className="correspondance-tabs">
            {(Object.entries(TYPES) as [CorrespondanceType, typeof TYPES[CorrespondanceType]][]).map(([key, item]) => (
              <button key={key} type="button" className={cn({ on: type === key })} onClick={() => setType(key)}>
                {item.short}
              </button>
            ))}
          </div>

          <h2>2 · Données communes</h2>
          <div className="grid2">
            <Field label="Âge du patient" value={age} onChange={setAge} type="number" placeholder="ex. 74" />
            <div className="hint-box"><AlertTriangle size={16} /> Ne saisissez aucun nom, prénom, date de naissance, adresse, NIR ou téléphone du patient.</div>
          </div>
          <TextField label="Antécédents" value={antecedents} onChange={setAntecedents} importKey="antecedents" onImport={(key) => { importTarget.current = key; document.getElementById("correspondance-file")?.click(); }} />
          <TextField label="Examen clinique" value={examenClinique} onChange={setExamenClinique} importKey="examenClinique" onImport={(key) => { importTarget.current = key; document.getElementById("correspondance-file")?.click(); }} />
          <TextField label="Traitement en cours" value={traitement} onChange={setTraitement} importKey="traitement" onImport={(key) => { importTarget.current = key; document.getElementById("correspondance-file")?.click(); }} />
          <input id="correspondance-file" type="file" accept=".pdf,.docx,.txt,.md" className="hidden-file" onChange={handleImport} />

          {type === "consultation_specialisee" && (
            <>
              <h2>3 · Demande d'avis spécialisé</h2>
              <TextField label="Spécialité / service sollicité" value={a1} onChange={setA1} />
              <TextField label="Motif du recours" value={a2} onChange={setA2} />
              <TextField label="Question posée" value={a3} onChange={setA3} />
              <TextField label="Examens déjà réalisés" value={a5} onChange={setA5} />
              <label className="correspondance-label">Degré d'urgence</label>
              <select value={a6} onChange={(event) => setA6(event.target.value)}>
                <option value="non urgent">Non urgent</option>
                <option value="urgent">Urgent</option>
                <option value="autre">à préciser</option>
              </select>
              {a6 === "autre" && <TextField label="Précision urgence" value={a6Text} onChange={setA6Text} />}
            </>
          )}

          {type === "transfert_inter_service" && (
            <>
              <h2>3 · Courrier de transfert</h2>
              <TextField label="Structure / service de destination" value={b1} onChange={setB1} />
              <TextField label="Motif du transfert" value={b2} onChange={setB2} />
              <div className="grid2">
                <Field label="Date d'admission" value={b3a} onChange={setB3a} type="date" />
                <Field label="Date de transfert" value={b3b} onChange={setB3b} type="date" />
              </div>
              <TextField label="Résumé de la prise en charge" value={b4} onChange={setB4} />
            </>
          )}

          {type === "liaison_fin_suivi" && (
            <>
              <h2>3 · Liaison / fin de suivi</h2>
              <TextField label="Destinataire fonctionnel" value={c1} onChange={setC1} placeholder="Ex. médecin traitant, spécialiste référent, service adresseur" />
              <TextField label="Motif initial du suivi" value={c2} onChange={setC2} />
              <div className="grid2">
                <Field label="Début du suivi" value={c3a} onChange={setC3a} type="date" />
                <Field label="Fin / relais" value={c3b} onChange={setC3b} type="date" />
              </div>
              <TextField label="Évolution" value={c4} onChange={setC4} />
              <TextField label="Conclusion / devenir" value={c5} onChange={setC5} />
              <TextField label="Surveillance / points à reprendre" value={c6} onChange={setC6} />
            </>
          )}
        </section>

        <section className="correspondance-card">
          <h2>Courrier</h2>
          <div className="correspondance-actions">
            <Button type="button" className="correspondance-main-btn" onClick={handleGenerate} disabled={isGenerating}>
              <BookOpen size={17} /> {isGenerating ? "Génération..." : "Générer le courrier"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy}><Copy size={17} /> Copier</Button>
            <Button type="button" variant="outline" onClick={reset}><RefreshCw size={17} /> Réinitialiser</Button>
          </div>
          {missingCount > 0 && <div className="correspondance-warning">{missingCount} champ(s) restent à compléter avant l'envoi définitif.</div>}
          {pseudoInfo && <div className="correspondance-mask">Masquages appliqués : {pseudoInfo.maskCount} {pseudoInfo.detectedCategories.join(" · ")}</div>}
          <div className="correspondance-letter">{displayedText}</div>
          <div className="correspondance-note">
            Aide rédactionnelle : l'outil structure ce que vous saisissez et ne recommande aucune décision. Le praticien relit, complète et valide le courrier final.
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="correspondance-field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
  importKey,
  onImport,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  importKey?: "antecedents" | "examenClinique" | "traitement";
  onImport?: (target: "antecedents" | "examenClinique" | "traitement") => void;
}) {
  const insertDictation = useCallback((text: string) => {
    const next = [value.trim(), text.trim()].filter(Boolean).join(value.trim() ? " " : "");
    onChange(next);
  }, [onChange, value]);

  return (
    <label className="correspondance-field">
      <span className="field-head">
        {label}
        <span className="field-tools">
          {importKey && onImport && (
            <button type="button" onClick={() => onImport(importKey)}><FileUp size={14} /> Importer</button>
          )}
          <VoiceRecorderWithPreview onInsert={insertDictation} fieldLabel={label} insertMode="append" />
        </span>
      </span>
      <textarea value={value} placeholder={placeholder || "Saisie libre, sans identifiant direct du patient."} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

const styles = `
.correspondance-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#eef3f5}.correspondance-loading>div{width:32px;height:32px;border:2px solid #0e9c8e;border-top-color:transparent;border-radius:999px;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.correspondance-page{min-height:100vh;background:#f4f6f9;color:#1c2733;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.correspondance-top{background:linear-gradient(135deg,#0e9c8e,#0a7b70);color:#fff;padding:18px 22px}
.correspondance-back{display:inline-flex;align-items:center;gap:7px;color:#fff;text-decoration:none;font-size:.85rem;opacity:.9;margin-bottom:8px}
.correspondance-top h1{display:flex;align-items:center;gap:10px;margin:0;font-size:1.25rem;font-weight:800}
.correspondance-top p{margin:6px 0 0;opacity:.93;font-size:.88rem;max-width:1000px}
.correspondance-top .mic-note{display:flex;align-items:center;gap:6px;opacity:.86;font-size:.8rem}
.correspondance-cbar{background:#102233;color:#dbe6ec;display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;padding:10px 18px;font-size:.82rem}
.correspondance-cbar span{display:inline-flex;align-items:center;gap:6px}
.correspondance-wrap{max-width:1180px;margin:0 auto;padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
.correspondance-card{background:#fff;border:1px solid #dde4ec;border-radius:12px;padding:18px;box-shadow:0 2px 8px rgba(11,27,41,.04)}
.correspondance-card h2{margin:0 0 13px;font-size:.9rem;text-transform:uppercase;letter-spacing:.08em;color:#0a7b70}
.correspondance-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.correspondance-tabs button{flex:1;min-width:150px;border:1.5px solid #dde4ec;background:#fff;border-radius:10px;padding:11px 12px;font-weight:800;color:#1c2733;cursor:pointer;text-align:left}
.correspondance-tabs button.on{background:#e8f6f4;color:#0a7b70;border-color:#0e9c8e;box-shadow:0 0 0 2px rgba(14,156,142,.14)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.hint-box{border:1px solid #f0d9a8;background:#fff8e8;color:#7d560c;border-radius:10px;padding:12px;display:flex;gap:8px;align-items:flex-start;font-size:.84rem;font-weight:650}
.correspondance-field{display:block;margin:12px 0}
.correspondance-field span,.correspondance-label{display:block;font-size:.83rem;color:#5b6b7b;font-weight:800;margin-bottom:5px}
.correspondance-field input,.correspondance-field textarea,select{width:100%;border:1px solid #dde4ec;border-radius:9px;background:#fff;color:#1c2733;font:inherit;font-size:.94rem;padding:10px 11px}
.correspondance-field textarea{min-height:86px;resize:vertical}
.correspondance-field input:focus,.correspondance-field textarea:focus,select:focus{outline:none;border-color:#0e9c8e;box-shadow:0 0 0 3px rgba(14,156,142,.12)}
.field-head{display:flex!important;align-items:center;justify-content:space-between;gap:10px}
.field-tools{display:flex!important;align-items:center;justify-content:flex-end;gap:6px;margin:0!important;flex-wrap:wrap}
.field-tools button{display:inline-flex;align-items:center;gap:5px;border:1px solid #dde4ec;background:#fff;border-radius:999px;padding:5px 9px;color:#0a7b70;font-size:.75rem;font-weight:800;cursor:pointer}
.hidden-file{display:none}
.correspondance-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.correspondance-main-btn{background:#0e9c8e!important;color:#fff!important}
.correspondance-warning{border:1px solid #f0d9a8;background:#fff8e8;color:#7d560c;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:.9rem}
.correspondance-mask{border:1px solid #bfe6e0;background:#e7f4f2;color:#0a7b70;border-radius:999px;display:inline-flex;padding:6px 11px;font-size:.8rem;font-weight:800;margin:0 0 10px}
.correspondance-letter{border:1px dashed #dde4ec;border-radius:12px;background:#fff;min-height:360px;padding:18px;white-space:pre-wrap;font-size:.98rem;line-height:1.55;color:#1c2733}
.correspondance-note{border:1px solid #f0d9a8;background:#fff8e8;color:#7d560c;border-radius:10px;padding:10px 12px;margin-top:14px;font-size:.88rem;line-height:1.5}
@media(max-width:900px){.correspondance-wrap,.grid2{grid-template-columns:1fr}.correspondance-actions .correspondance-main-btn{width:100%}}
`;
