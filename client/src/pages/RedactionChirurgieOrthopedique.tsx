import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bone, Check, Copy, FileText, RefreshCw, Shield } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const ORTHO_SUBTYPE = "chirurgie_orthopedique";

type Side = "D" | "G" | "B" | "";
type Preset = {
  label: string;
  motif: string;
  motifGender: "m" | "f";
  geste: string;
  gesteGender: "m" | "f" | "n";
  anesth: string;
  radios: string;
  consignes: string[];
};

const PRESETS = {
  PTG: {
    label: "PTG (genou)",
    motif: "Gonarthrose invalidante",
    motifGender: "f",
    geste: "arthroplastie totale du genou",
    gesteGender: "m",
    anesth: "anesthésie générale",
    radios: "genou face + profil + défilé fémoro-patellaire + pangonogramme",
    consignes: [
      "Soins locaux : [rythme] jusqu'à cicatrisation complète.",
      "Ablation du matériel de suture : [agrafes/fils] à [délai].",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
      "Appui : [modalité] sur le membre opéré, sous couvert de cannes.",
      "Bas de contention pour limiter l'œdème.",
      "Kinésithérapie : amplitudes, renforcement du quadriceps, remise à la marche.",
      "Thromboprophylaxie veineuse : [molécule] pendant [durée].",
    ],
  },
  PTH: {
    label: "PTH (hanche)",
    motif: "Coxarthrose invalidante",
    motifGender: "f",
    geste: "arthroplastie totale de hanche",
    gesteGender: "f",
    anesth: "anesthésie générale",
    radios: "bassin de face + hanche profil (Dunn / Lequesne)",
    consignes: [
      "Soins locaux : [rythme] jusqu'à cicatrisation complète.",
      "Ablation du matériel de suture : [agrafes/fils] à [délai].",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
      "Appui : [modalité] sur le membre opéré, sous couvert de cannes.",
      "Prévention de la luxation selon la voie d'abord.",
      "Kinésithérapie : marche, transferts, amplitudes.",
      "Bas de contention.",
      "Thromboprophylaxie veineuse : [molécule] pendant [durée].",
    ],
  },
  OSTEO_HANCHE: {
    label: "Ostéosynthèse hanche",
    motif: "Fracture pertrochantérienne de la hanche",
    motifGender: "f",
    geste: "ostéosynthèse par clou gamma",
    gesteGender: "m",
    anesth: "rachianesthésie",
    radios: "bassin de face + hanche profil",
    consignes: [
      "Soins de pansement : [rythme] jusqu'à cicatrisation complète.",
      "Ablation du matériel de suture : [agrafes/fils] à [délai].",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
      "Appui / mise en charge : [modalité] (aides techniques si besoin).",
      "Rééducation à la marche avec kinésithérapeute.",
      "Thromboprophylaxie veineuse : [molécule] pendant [durée] ([surveillance si HBPM]).",
    ],
  },
  EPAULE: {
    label: "Arthroplastie épaule",
    motif: "Omarthrose",
    motifGender: "f",
    geste: "arthroplastie d'épaule (prothèse inversée)",
    gesteGender: "f",
    anesth: "anesthésie générale",
    radios: "épaule de face + profil (contrôle)",
    consignes: [
      "Immobilisation : [dispositif] pendant [durée], retirable pour la toilette.",
      "Rééducation : [protocole] (passif d'abord, puis actif-aidé) selon prescription.",
      "Soins locaux : [rythme] jusqu'à cicatrisation.",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
    ],
  },
  RADIUS: {
    label: "Plaque radius",
    motif: "Fracture de l'extrémité distale du radius",
    motifGender: "f",
    geste: "ostéosynthèse par plaque antérieure",
    gesteGender: "f",
    anesth: "anesthésie loco-régionale",
    radios: "poignet face + profil",
    consignes: [
      "Mobilisation des doigts dès le lendemain de l'intervention.",
      "Attelle de poignet pendant [durée].",
      "Port de charges : [consigne] pendant l'immobilisation.",
      "Soins locaux : [rythme] ([type de fils]).",
      "Rééducation : [modalités].",
    ],
  },
  OLECRANE: {
    label: "Olécrane",
    motif: "Fracture de l'olécrane",
    motifGender: "f",
    geste: "embrochage-haubanage",
    gesteGender: "m",
    anesth: "anesthésie générale",
    radios: "coude face + profil",
    consignes: [
      "Immobilisation : [dispositif] selon le montage.",
      "Soins locaux : [rythme].",
      "Ablation des fils à [délai].",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
    ],
  },
  RACHIS: {
    label: "Arthrodèse / rachis",
    motif: "Lombosciatique sur hernie discale",
    motifGender: "f",
    geste: "arthrodèse lombaire",
    gesteGender: "f",
    anesth: "anesthésie générale",
    radios: "rachis lombaire face + profil",
    consignes: [
      "Lever et marche : [modalités] ; reprise progressive des activités.",
      "Port de charges lourdes : [consigne / durée].",
      "Mouvements à éviter (rotations, flexions forcées) : [durée].",
      "Corset : [prescription].",
      "Reprise de la conduite : après sevrage des antalgiques altérant la vigilance.",
      "Délai de consolidation de la greffe : [à préciser].",
    ],
  },
  LCA: {
    label: "LCA / arthroscopie",
    motif: "Rupture du ligament croisé antérieur",
    motifGender: "f",
    geste: "ligamentoplastie du LCA",
    gesteGender: "m",
    anesth: "anesthésie générale",
    radios: "genou face + profil",
    consignes: [
      "Attelle et appui : [protocole].",
      "Auto-mobilisation précoce (flexion-extension).",
      "Kinésithérapie : [modalités] dès la cicatrisation.",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
    ],
  },
  CHEVILLE: {
    label: "Cheville",
    motif: "Fracture bimalléolaire",
    motifGender: "f",
    geste: "ostéosynthèse",
    gesteGender: "f",
    anesth: "rachianesthésie",
    radios: "cheville face + profil",
    consignes: [
      "Immobilisation : [dispositif].",
      "Appui : [modalité] pendant [durée] jusqu'à consolidation.",
      "Reprise de l'appui et rééducation après consolidation.",
      "Soins locaux : [rythme] ; ablation des fils à [délai].",
      "Thromboprophylaxie veineuse : [molécule] pendant [durée] ([surveillance si HBPM]).",
    ],
  },
  HALLUX: {
    label: "Hallux valgus",
    motif: "Hallux valgus",
    motifGender: "m",
    geste: "chirurgie de l'avant-pied (ostéotomie)",
    gesteGender: "m",
    anesth: "anesthésie loco-régionale",
    radios: "pied face + profil en charge",
    consignes: [
      "Chaussure de décharge : [type] pendant [durée].",
      "Surélévation du pied et glaçage.",
      "Soins locaux : [rythme].",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
    ],
  },
  FONCTIONNEL: {
    label: "Traitement fonctionnel",
    motif: "Fracture du cadre obturateur",
    motifGender: "f",
    geste: "traitement fonctionnel (abstention chirurgicale)",
    gesteGender: "n",
    anesth: "[sans objet]",
    radios: "bassin de face + hanches",
    consignes: [
      "Mise au fauteuil en fonction de la douleur.",
      "Remise en charge : [modalité / délai].",
    ],
  },
  AUTRE: {
    label: "Autre / libre",
    motif: "",
    motifGender: "f",
    geste: "",
    gesteGender: "m",
    anesth: "anesthésie générale",
    radios: "",
    consignes: [
      "Soins locaux : [rythme] jusqu'à cicatrisation.",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
    ],
  },
} satisfies Record<string, Preset>;

type PresetKey = keyof typeof PRESETS;

const MOTIFS = [
  "Gonarthrose invalidante",
  "Coxarthrose invalidante",
  "Fracture pertrochantérienne de la hanche",
  "Fracture du col fémoral",
  "Fracture péri-prothétique de la hanche",
  "Omarthrose",
  "Fracture de l'extrémité supérieure de l'humérus",
  "Luxation de l'épaule",
  "Fracture de l'extrémité distale du radius",
  "Fracture de l'olécrane",
  "Lombosciatique sur hernie discale",
  "Rupture du ligament croisé antérieur",
  "Fracture bimalléolaire",
  "Hallux valgus",
  "Fracture du cadre obturateur",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(value: string, days: number) {
  if (!value) return "";
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "[à compléter]";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function sideWord(gender: Preset["motifGender"] | Preset["gesteGender"], side: Side) {
  if (!side || gender === "n") return "";
  const masculine = { D: "droit", G: "gauche", B: "bilatéral" } as const;
  const feminine = { D: "droite", G: "gauche", B: "bilatérale" } as const;
  return (gender === "f" ? feminine : masculine)[side];
}

function bulletList(lines: string[]) {
  return lines.map((line) => `• ${line}`).join("\n");
}

export default function RedactionChirurgieOrthopedique() {
  const loginUrl = getLoginUrl("/redaction/chirurgie-orthopedique");
  const { isAuthenticated, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: loginUrl,
  });

  const [presetKey, setPresetKey] = useState<PresetKey>("PTG");
  const preset = PRESETS[presetKey];
  const [side, setSide] = useState<Side>("D");
  const [motif, setMotif] = useState(preset.motif);
  const [geste, setGeste] = useState(preset.geste);
  const [anesth, setAnesth] = useState(preset.anesth);
  const [perop, setPerop] = useState("sans particularité");
  const [peropText, setPeropText] = useState("");
  const [dateEntree, setDateEntree] = useState("");
  const [dateChirurgie, setDateChirurgie] = useState("");
  const [dateSortie, setDateSortie] = useState(todayIso());
  const [isTransfert, setIsTransfert] = useState(false);
  const [structureAval, setStructureAval] = useState("");
  const [antecedents, setAntecedents] = useState("sans particularité");
  const [suites, setSuites] = useState("simples");
  const [suitesText, setSuitesText] = useState("");
  const [orthoGeriatrie, setOrthoGeriatrie] = useState(false);
  const [consignes, setConsignes] = useState(bulletList(preset.consignes));
  const [dateRdv, setDateRdv] = useState("");
  const [heureRdv, setHeureRdv] = useState("10:30");
  const [radios, setRadios] = useState(preset.radios);
  const [generatedText, setGeneratedText] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pseudoInfo, setPseudoInfo] = useState<{ maskCount: number; detectedCategories: string[] } | null>(null);

  const applyPreset = useCallback((key: PresetKey) => {
    const next = PRESETS[key];
    setPresetKey(key);
    setMotif(next.motif);
    setGeste(next.geste);
    setAnesth(next.anesth);
    setRadios(next.radios);
    setConsignes(bulletList(next.consignes));
  }, []);

  const handleDateChirurgieChange = useCallback((value: string) => {
    setDateChirurgie(value);
    if (value && !dateRdv) setDateRdv(addDaysIso(value, 35));
  }, [dateRdv]);

  const motifSided = useMemo(() => {
    const suffix = sideWord(preset.motifGender, side);
    return `${motif}${suffix ? ` ${suffix}` : ""}`.trim();
  }, [motif, preset.motifGender, side]);

  const gesteSided = useMemo(() => {
    const suffix = sideWord(preset.gesteGender, side);
    return `${geste}${suffix ? ` ${suffix}` : ""}`.trim();
  }, [geste, preset.gesteGender, side]);

  const peropValue = perop === "__" ? peropText || "[à préciser]" : perop;
  const suitesValue = suites === "__" ? suitesText || "[à préciser]" : "simples";

  const blocText = useMemo(() => `1. MOTIF D'ENTRÉE     : ${motifSided || "[à compléter]"}
2. DATE DE CHIRURGIE  : chirurgie ${formatDate(dateChirurgie)} ; entrée ${formatDate(dateEntree)} ; ${isTransfert ? "transfert" : "sortie"} ${formatDate(dateSortie)}${isTransfert && structureAval ? ` (${structureAval})` : ""}
3. TYPE DE CHIRURGIE  : ${gesteSided || "[à compléter]"}, ${anesth}
4. DÉROULEMENT PER-OP : ${peropValue}
5. ANTÉCÉDENTS       : ${antecedents || "sans particularité"}
6. SUITES OPÉRATOIRES : ${suitesValue}${orthoGeriatrie ? " ; prise en charge ortho-gériatrique conjointe" : ""}
7. CONSIGNES DE SUIVI :
${consignes.replace(/^/gm, "   ")}
   Suivi : consultation de contrôle radio-clinique le ${formatDate(dateRdv)} à ${heureRdv || "[à compléter]"}.
   Radiographies : ${radios || "[à préciser]"}.`, [
    anesth,
    antecedents,
    consignes,
    dateChirurgie,
    dateEntree,
    dateRdv,
    dateSortie,
    gesteSided,
    heureRdv,
    isTransfert,
    motifSided,
    orthoGeriatrie,
    peropValue,
    radios,
    structureAval,
    suitesValue,
  ]);

  const missingCount = (blocText.match(/\[/g) ?? []).length;

  const handleGenerate = useCallback(async () => {
    if (blocText.trim().length < 10) return;
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
          volet: "courrier_sortie",
          subtype: ORTHO_SUBTYPE,
          rawData: blocText,
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
            setGeneratedText(accumulated);
            toast.success("Courrier généré.");
          } else if (parsed.type === "error") {
            throw new Error(parsed.message || "Erreur de génération.");
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération.");
    } finally {
      setIsGenerating(false);
    }
  }, [blocText]);

  const handleCopy = useCallback(async () => {
    const text = generatedText || streamingText || blocText;
    await navigator.clipboard.writeText(text);
    toast.success("Texte copié.");
  }, [blocText, generatedText, streamingText]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF3F5]">
        <div className="w-8 h-8 border-2 border-[#0E9C8E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="ortho-page">
      <style>{orthoStyles}</style>
      <header className="ortho-top">
        <div>
          <Link href="/dashboard" className="ortho-back"><ArrowLeft size={16} /> Tableau de bord</Link>
          <h1><Bone size={24} /> Saisie rapide — Courrier de sortie de chirurgie orthopédique</h1>
          <p>AGAPE / REDACTIO · Aide rédactionnelle : l'outil met en forme ce que vous saisissez. Les valeurs entre crochets restent à compléter par l'opérateur.</p>
        </div>
      </header>

      <div className="ortho-cbar">
        <span><Shield size={14} /> Conforme aux exigences de protection des données de santé</span>
        <span><Check size={12} /> RGPD</span>
        <span><Check size={12} /> HDS</span>
        <span><Check size={12} /> Pseudonymisation</span>
      </div>

      <main className="ortho-wrap">
        <section className="ortho-card">
          <h2>1 · Geste (trame)</h2>
          <div className="ortho-presets">
            {(Object.entries(PRESETS) as [PresetKey, Preset][]).map(([key, item]) => (
              <button key={key} type="button" className={cn("ortho-preset", key === presetKey && "active")} onClick={() => applyPreset(key)}>
                {item.label}
              </button>
            ))}
          </div>
          <p className="ortho-hint">Un clic pré-remplit le motif probable, le geste, les rubriques de consignes et les radios. Les valeurs cliniques restent en [ ] à compléter.</p>

          <h2>2 · Contexte</h2>
          <label>Motif d'entrée — pathologie causale</label>
          <input value={motif} list="ortho-motifs" onChange={(event) => setMotif(event.target.value)} placeholder="ex. Gonarthrose invalidante" />
          <datalist id="ortho-motifs">{MOTIFS.map((item) => <option value={item} key={item} />)}</datalist>

          <label>Latéralité</label>
          <div className="ortho-seg">
            {[
              ["D", "Droite"],
              ["G", "Gauche"],
              ["B", "Bilatérale"],
              ["", "Sans objet"],
            ].map(([value, label]) => (
              <button key={label} type="button" className={side === value ? "on" : ""} onClick={() => setSide(value as Side)}>
                {label}
              </button>
            ))}
          </div>

          <label>Type de chirurgie (geste + matériel)</label>
          <input value={geste} onChange={(event) => setGeste(event.target.value)} placeholder="ex. arthroplastie totale du genou" />

          <div className="ortho-row">
            <div>
              <label>Anesthésie</label>
              <select value={anesth} onChange={(event) => setAnesth(event.target.value)}>
                <option>anesthésie générale</option>
                <option>anesthésie loco-régionale</option>
                <option>rachianesthésie</option>
                <option>[à préciser]</option>
              </select>
            </div>
            <div>
              <label>Déroulement per-op</label>
              <select value={perop} onChange={(event) => setPerop(event.target.value)}>
                <option>sans particularité</option>
                <option>sans incident</option>
                <option>geste en bonnes conditions</option>
                <option value="__">à préciser…</option>
              </select>
            </div>
          </div>
          {perop === "__" && <input value={peropText} onChange={(event) => setPeropText(event.target.value)} placeholder="précision per-op" className="ortho-inline-input" />}

          <h2>3 · Dates</h2>
          <div className="ortho-row">
            <div><label>Entrée</label><input type="date" value={dateEntree} onChange={(event) => setDateEntree(event.target.value)} /></div>
            <div><label>Chirurgie</label><input type="date" value={dateChirurgie} onChange={(event) => handleDateChirurgieChange(event.target.value)} /></div>
            <div><label>Sortie / transfert</label><input type="date" value={dateSortie} onChange={(event) => setDateSortie(event.target.value)} /></div>
          </div>
          <label className="ortho-check"><input type="checkbox" checked={isTransfert} onChange={(event) => setIsTransfert(event.target.checked)} /> Sortie = transfert</label>
          {isTransfert && <input value={structureAval} onChange={(event) => setStructureAval(event.target.value)} placeholder="structure d'aval (SMR, service...)" className="ortho-inline-input" />}

          <h2>4 · Clinique</h2>
          <label>Antécédents (+ allergies)</label>
          <textarea value={antecedents} onChange={(event) => setAntecedents(event.target.value)} />
          <label>Suites opératoires</label>
          <select value={suites} onChange={(event) => setSuites(event.target.value)}>
            <option value="simples">simples</option>
            <option value="__">à préciser…</option>
          </select>
          {suites === "__" && <input value={suitesText} onChange={(event) => setSuitesText(event.target.value)} placeholder="ex. anémie post-op, escarre..." className="ortho-inline-input" />}
          <label className="ortho-check"><input type="checkbox" checked={orthoGeriatrie} onChange={(event) => setOrthoGeriatrie(event.target.checked)} /> Prise en charge ortho-gériatrique conjointe</label>

          <h2>5 · Consignes de suivi</h2>
          <textarea className="ortho-consignes" value={consignes} onChange={(event) => setConsignes(event.target.value)} />
          <div className="ortho-flag">Trame à valider et compléter : les éléments entre [ ] relèvent de l'opérateur. L'outil n'en propose aucune valeur.</div>
          <button type="button" className="ortho-reset" onClick={() => setConsignes(bulletList(preset.consignes))}><RefreshCw size={14} /> Recharger la trame du geste</button>

          <div className="ortho-row">
            <div><label>RDV de contrôle</label><input type="date" value={dateRdv} onChange={(event) => setDateRdv(event.target.value)} /></div>
            <div><label>Heure</label><input type="time" value={heureRdv} onChange={(event) => setHeureRdv(event.target.value)} /></div>
          </div>
          <label>Radiographies de contrôle</label>
          <input value={radios} onChange={(event) => setRadios(event.target.value)} />
        </section>

        <section className="ortho-card">
          <h2>Courrier</h2>
          <div className="ortho-actions">
            <Button type="button" className="ortho-main-btn" onClick={handleGenerate} disabled={isGenerating || blocText.length < 10}>
              <FileText size={17} /> {isGenerating ? "Génération..." : "Générer le courrier"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy}><Copy size={16} /> Copier</Button>
          </div>

          {missingCount > 0 && (
            <div className="ortho-flag">{missingCount} champ(s) [ ] restent à compléter avant l'envoi définitif.</div>
          )}
          {pseudoInfo && (
            <div className="ortho-mask">Masquages appliqués : {pseudoInfo.maskCount} {pseudoInfo.detectedCategories.join(" · ")}</div>
          )}

          <div className="ortho-letter">
            {generatedText || streamingText || "Le courrier généré s'affichera ici après un clic sur « Générer le courrier »."}
          </div>

          <div className="ortho-flag">
            Aide rédactionnelle : l'outil met en forme ce que vous saisissez et ne recommande aucune valeur.
            Le protocole de l'opérateur prime.
          </div>

          <details className="ortho-details">
            <summary>Aperçu technique</summary>
            <pre>{blocText}</pre>
          </details>
        </section>
      </main>
    </div>
  );
}

const orthoStyles = `
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
.ortho-page{--bg:#EEF3F5;--card:#fff;--ink:#0B1B29;--muted:#5A6B78;--line:#D9E2E7;--brand:#0E6BA8;--brand-d:#0A4D78;--accent:#E8F2FA;--seal:#C58A12;--seal-bg:#FBF3DE;min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Hanken Grotesk',system-ui,sans-serif;line-height:1.5}
.ortho-page *{box-sizing:border-box}
.ortho-top{background:linear-gradient(135deg,var(--brand),var(--brand-d));color:#fff;padding:22px 30px}
.ortho-back{display:inline-flex;align-items:center;gap:8px;color:#DDECF6;font-size:.9rem;font-weight:700;margin-bottom:14px;text-decoration:none}
.ortho-top h1{display:flex;align-items:center;gap:12px;margin:0;font-family:'Spectral',Georgia,serif;font-size:1.75rem;line-height:1.1}
.ortho-top p{margin:8px 0 0;color:#DDECF6;max-width:980px}
.ortho-cbar{display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;background:#0B1B29;color:#CFE0DA;padding:.62rem 24px;font-family:'JetBrains Mono',monospace;font-size:.72rem}
.ortho-cbar span{display:inline-flex;align-items:center;gap:.4rem}.ortho-cbar span:first-child{font-family:'Hanken Grotesk',system-ui,sans-serif;font-weight:700;color:#fff;font-size:.84rem}
.ortho-wrap{max-width:1180px;margin:0 auto;padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
.ortho-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;box-shadow:0 18px 44px -34px rgba(11,27,41,.35)}
.ortho-card h2{margin:18px 0 12px;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:var(--brand-d);font-weight:800}.ortho-card h2:first-child{margin-top:0}
.ortho-presets{display:flex;flex-wrap:wrap;gap:8px}.ortho-preset{border:1px solid var(--line);background:#EEF3F5;border-radius:999px;padding:7px 13px;font-size:.82rem;font-weight:700;cursor:pointer;color:var(--brand-d);transition:.15s}.ortho-preset:hover{background:var(--accent);border-color:var(--brand)}.ortho-preset.active{background:var(--brand);color:#fff;border-color:var(--brand)}
.ortho-hint{font-size:.78rem;color:var(--muted);margin:10px 0 0}
.ortho-card label{display:block;font-weight:700;font-size:.82rem;color:var(--muted);margin:12px 0 5px}
.ortho-card input[type=text],.ortho-card input[type=date],.ortho-card input[type=time],.ortho-card select,.ortho-card textarea{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:10px;font-size:.92rem;font-family:inherit;background:#fff;color:var(--ink)}
.ortho-card textarea{resize:vertical;min-height:72px}.ortho-consignes{min-height:170px!important}
.ortho-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ortho-row:has(> div:nth-child(3)){grid-template-columns:repeat(3,minmax(0,1fr))}
.ortho-seg{display:flex;gap:7px;flex-wrap:wrap}.ortho-seg button{flex:1;min-width:76px;padding:9px;border:1px solid var(--line);background:#fff;border-radius:9px;cursor:pointer;font-size:.84rem;font-weight:700;color:var(--muted)}.ortho-seg button.on{background:var(--brand);color:#fff;border-color:var(--brand)}
.ortho-check{display:flex!important;align-items:center;gap:8px;margin-top:11px!important;color:var(--ink)!important}.ortho-check input{width:auto}
.ortho-inline-input{margin-top:7px}
.ortho-flag{background:var(--seal-bg);border:1px solid #EBD9A8;color:#7A5A0E;border-radius:10px;padding:10px 12px;font-size:.84rem;margin-top:12px}
.ortho-reset{display:inline-flex;align-items:center;gap:7px;margin-top:10px;border:1px solid var(--brand);background:#fff;color:var(--brand-d);border-radius:9px;padding:8px 12px;font-weight:800;cursor:pointer}
.ortho-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}.ortho-main-btn{background:#0E9C8E!important}
.ortho-mask{border:1px solid #BFE6E0;background:#E7F4F2;color:#0A7B70;border-radius:999px;display:inline-flex;padding:6px 11px;font-size:.8rem;font-weight:700;margin:10px 0}
.ortho-letter{background:#fff;border:1px dashed var(--line);border-radius:12px;padding:18px;min-height:360px;white-space:pre-wrap;font-size:.94rem;color:var(--ink)}
.ortho-details{border-top:1px solid var(--line);margin-top:16px;padding-top:12px}.ortho-details summary{cursor:pointer;font-size:.85rem;font-weight:800;color:var(--muted)}.ortho-details pre{background:#0f1b26;color:#e7eef5;border-radius:10px;padding:14px;overflow:auto;font-size:.78rem;white-space:pre-wrap;margin:12px 0 0;font-family:'JetBrains Mono',monospace}
.ortho-page :focus-visible{outline:2px solid #0E9C8E;outline-offset:2px;border-radius:5px}
@media(max-width:900px){.ortho-wrap{grid-template-columns:1fr;padding:18px}.ortho-row,.ortho-row:has(> div:nth-child(3)){grid-template-columns:1fr}.ortho-top{padding:20px}.ortho-top h1{font-size:1.45rem}}
`;
