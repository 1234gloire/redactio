import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bone, Check, Copy, FileText, RefreshCw, Shield } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const ORTHO_SUBTYPE = "chirurgie_orthopedique";
const MISS = "[à préciser par l'opérateur]";

type Side = "D" | "G" | "B" | "";
type Preset = {
  label: string;
  motif: string;
  motifGender: "m" | "f";
  geste: string;
  gesteGender: "m" | "f" | "n";
  finalite: "med" | "chir" | "fonc" | "n";
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
    finalite: "med",
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
    finalite: "med",
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
    finalite: "chir",
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
    finalite: "med",
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
    finalite: "chir",
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
    finalite: "chir",
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
    finalite: "chir",
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
    finalite: "med",
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
    finalite: "chir",
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
    finalite: "chir",
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
    finalite: "fonc",
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
    finalite: "chir",
    anesth: "anesthésie générale",
    radios: "",
    consignes: [
      "Soins locaux : [rythme] jusqu'à cicatrisation.",
      "Antalgie : palier 1 systématique, palier 2 à la demande.",
    ],
  },
} satisfies Record<string, Preset>;

type PresetKey = keyof typeof PRESETS;

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
  if (!value) return MISS;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

const ORTHO_DIRECTIVE = `# CONSIGNE — Aide RÉDACTIONNELLE. Mets en forme le courrier de sortie à partir du bloc §2 ci-dessous (toutes les données saisies par le médecin dans le formulaire).
Respecte STRICTEMENT la trame du prompt "Prompt_Courrier_Sortie_Chirurgie_Ortho.md" (structure §5, moteur d'expansion §3, trames §4, style §6) :
- Le bloc §2 ci-dessous contient TOUT ce qui a été saisi dans le formulaire (motif, âge, dates, type de chirurgie, déroulement per-op, antécédents, suites, consignes, RDV, radios). Utilise-le intégralement : ne rédige jamais un courrier "vide" si le bloc contient des données.
- MOTIF = pathologie causale ayant conduit au geste (jamais le geste seul).
- DATES : les dates du champ 3 (Entrée / Intervention / Sortie ou Transfert) sont RÉELLES et VALIDÉES par le médecin. Recopie-les TELLES QUELLES dans « SÉJOUR HOSPITALIER » et dans la phrase d'introduction. N'écris JAMAIS "${MISS}" à la place d'une date fournie ; seule une date réellement vide reste un espace à compléter.
- ÂGE : reprends l'âge du champ 2 dans la phrase d'introduction (« … ans »).
- Reformule et structure UNIQUEMENT ce qui est saisi. N'ajoute AUCUNE valeur clinique (durée, délai, rythme, molécule, modalité d'appui/immobilisation) : laisse les [ ] tels quels ou "${MISS}".
- SUITES POST-OP : si « simples », bloc stéréotypé (§3-c). Sinon, intègre le texte du champ 7 EN PROSE FLUIDE ET LITTÉRAIRE, rattaché au récit de l'évolution — n'utilise JAMAIS « À noter : … » ni aucune formule de liste sèche (voir §6 du prompt).
- CONSIGNES DE SORTIE : reconstruis la liste UNIQUEMENT à partir du champ 8, dans l'ordre des rubriques habituelles du §4 pour ce geste ; ne remplace ni n'invente aucune valeur.
- N'inclus AUCUNE section traitement ni tableau de médicaments (transmis séparément).
- Aucun nom de professionnel ni donnée d'identité (cryptés en entrée). Conserve dates, âge, latéralité, matériel, antécédents complets, noms des structures.
- Sortie en TEXTE BRUT (pas de markdown : pas de **gras**, pas de #titres). Titres de rubriques en MAJUSCULES suivis de « : », comme dans la structure §5.
- Ton confraternel, 3e personne, synthétique. L'outil met en forme, il ne décide pas.`;

function sideWord(gender: Preset["motifGender"] | Preset["gesteGender"], side: Side) {
  if (!side || gender === "n") return "";
  const masculine = { D: "droit", G: "gauche", B: "bilatéral" } as const;
  const feminine = { D: "droite", G: "gauche", B: "bilatérale" } as const;
  return (gender === "f" ? feminine : masculine)[side];
}

function bulletList(lines: string[]) {
  return lines.map((line) => `• ${line}`).join("\n");
}

function numberedConsignes(value: string) {
  const lines = value
    .split("\n")
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter(Boolean);
  return lines.length ? lines.map((line, index) => `${index + 1}. ${line}`).join("\n") : MISS;
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
  const [age, setAge] = useState("");
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
  const [suites, setSuites] = useState<"simples" | "compliquees">("simples");
  const [suitesText, setSuitesText] = useState("");
  const [orthoGeriatrie, setOrthoGeriatrie] = useState(false);
  const [consignes, setConsignes] = useState(bulletList(preset.consignes));
  const [dateRdv, setDateRdv] = useState("");
  const [heureRdv, setHeureRdv] = useState("10:30");
  const [radios, setRadios] = useState("");
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

  const peropValue = perop === "__" ? peropText.trim() || MISS : perop;
  const ageValue = age.trim() ? `${age.trim()} ans` : MISS;
  const suitesValue = suites === "compliquees" ? suitesText.trim() || MISS : "simples";

  const blocText = useMemo(() => `1. MOTIF D'ENTRÉE        : ${motifSided || MISS}
2. ÂGE DU PATIENT        : ${ageValue}
3. DATES (réelles, à recopier telles quelles — ne pas remplacer par un placeholder) :
   - Entrée               : ${formatDate(dateEntree)}
   - Intervention         : ${formatDate(dateChirurgie)}
   - ${isTransfert ? "Transfert            " : "Sortie               "} : ${formatDate(dateSortie)}${isTransfert && structureAval ? ` (${structureAval})` : ""}
4. TYPE DE CHIRURGIE     : ${gesteSided || MISS}, ${anesth}
5. DÉROULEMENT PER-OP    : ${peropValue}
6. ANTÉCÉDENTS           : ${antecedents.trim() || "sans particularité"}
7. SUITES POST-OP        : ${suitesValue}${orthoGeriatrie ? " ; prise en charge ortho-gériatrique conjointe" : ""}
8. CONSIGNES DE SUIVI    :
${consignes.replace(/^/gm, "   ")}
   Suivi : consultation de contrôle radio-clinique le ${formatDate(dateRdv)} à ${heureRdv || MISS}.
   Radiographies : ${radios.trim() || MISS}.`, [
    ageValue,
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

  const generationInput = useMemo(() => `${ORTHO_DIRECTIVE}

BLOC §2 RENSEIGNÉ PAR LE MÉDECIN — UTILISER CES DONNÉES POUR RÉDIGER :
${blocText}

Rédige directement le courrier final. Ne demande pas de coller un autre bloc.`, [blocText]);

  const buildLocalCourrier = useCallback(() => {
    const finaliteMap: Record<Preset["finalite"], string> = {
      med: "prise en charge médico-rééducative post-opératoire",
      chir: "prise en charge chirurgicale",
      fonc: "prise en charge fonctionnelle (traitement non chirurgical)",
      n: "prise en charge",
    };
    const finalite = finaliteMap[preset.finalite] || "prise en charge";
    const sortieVerbe = isTransfert ? "transféré(e)" : "sorti(e)";
    const avalPhrase = isTransfert && structureAval.trim() ? ` vers ${structureAval.trim()}` : "";
    const motifValue = motifSided || MISS;
    const gesteValue = gesteSided || MISS;

    const evolution = suites === "simples"
      ? `Les suites opératoires ont été simples. La plaie est belle, de bonne allure. Le contrôle radiographique est satisfaisant.${/genou|hanche|fémur|cheville|clou/i.test(gesteValue) ? " Rééducation à la marche entreprise dans le service." : ""}`
      : suitesText.trim()
        ? `Les suites opératoires ont été marquées par ${suitesText.trim()}.`
        : `Les suites opératoires ont été compliquées : ${MISS}.`;

    const orthoPhrase = orthoGeriatrie
      ? "\n\nPrise en charge ortho-gériatrique conjointe pendant le séjour ; les consignes et prescriptions thérapeutiques de l'orthogériatre seront transmises séparément."
      : "";

    return `Cher Confrère,

Votre patient(e) ([sexe à préciser] ; ${ageValue}) a été hospitalisé(e) du ${formatDate(dateEntree)} au ${formatDate(dateSortie)} dans le service de [service / centre hospitalier à préciser], pour ${motifValue}.

MOTIF D'HOSPITALISATION :
${motifValue} ayant conduit à ${gesteValue}, pour ${finalite}.

SÉJOUR HOSPITALIER :
Le/la patient(e) a été admis(e) le ${formatDate(dateEntree)}. L'intervention, réalisée le ${formatDate(dateChirurgie)} sous ${anesth}, a consisté en une ${gesteValue} ; elle s'est déroulée ${peropValue}. Le/la patient(e) a ensuite été ${sortieVerbe} le ${formatDate(dateSortie)}${avalPhrase}.

ANTÉCÉDENTS :
${antecedents.trim() || "sans particularité"}
Allergies : ${MISS}.

ÉVOLUTION POST-OPÉRATOIRE :
${evolution}

CONSIGNES DE SORTIE :
${numberedConsignes(consignes)}${orthoPhrase}

SUIVI :
Consultation de contrôle radio-clinique le ${formatDate(dateRdv)} à ${heureRdv || MISS}.
Radiographies : ${radios.trim() || MISS}.

Bien confraternellement,

[Signataire — chirurgien, RPPS]`;
  }, [
    ageValue,
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
    preset.finalite,
    radios,
    structureAval,
    suites,
    suitesText,
  ]);

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
            if (/coller ci-dessous le bloc|coller ici le bloc|pour générer le courrier/i.test(accumulated)) {
              setStreamingText("");
              setGeneratedText(buildLocalCourrier());
              toast.warning("Le moteur a demandé le bloc au lieu de rédiger : courrier local généré à partir des données saisies.");
            } else {
              setGeneratedText(accumulated);
              toast.success("Courrier généré.");
            }
          } else if (parsed.type === "error") {
            throw new Error(parsed.message || "Erreur de génération.");
          }
        }
      }
    } catch (error) {
      const fallback = buildLocalCourrier();
      setGeneratedText(fallback);
      toast.warning(
        error instanceof Error
          ? `Backend indisponible : génération locale utilisée. ${error.message}`
          : "Backend indisponible : génération locale utilisée."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [blocText, buildLocalCourrier, generationInput]);

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
          <p className="ortho-hint">Un clic pré-remplit le motif probable, le geste et les rubriques de consignes. La radio reste libre : le preset propose seulement une suggestion.</p>

          {presetKey === "AUTRE" && (
            <div className="ortho-encadre">
              <b>Mode « Autre / libre »</b>
              <p>
                Aucun geste n'est prérempli. Saisissez vous-même ci-dessous le motif d'entrée
                (pathologie causale) et le type de chirurgie (geste + matériel). L'outil ne
                suggère aucune valeur clinique dans ce mode.
              </p>
            </div>
          )}

          <h2>2 · Contexte</h2>
          <label>Motif d'entrée — pathologie causale <span className="ortho-badge">≠ le geste</span></label>
          <textarea value={motif} onChange={(event) => setMotif(event.target.value)} placeholder="Saisie libre. Ex. Gonarthrose invalidante ; fracture pertrochantérienne de la hanche ; rupture du ligament croisé antérieur..." />
          <p className="ortho-hint">Zone de texte libre : décrivez la pathologie causale, jamais le geste.</p>

          <div className="ortho-row">
            <div>
              <label>Âge du patient</label>
              <input type="number" min={0} max={120} value={age} onChange={(event) => setAge(event.target.value)} placeholder="ex. 82" />
              <p className="ortho-hint">Conservé dans le courrier (« ... ans »).</p>
            </div>
            <div>
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
            </div>
          </div>

          <label>Type de chirurgie (geste + matériel)</label>
          <textarea value={geste} onChange={(event) => setGeste(event.target.value)} placeholder="Saisie libre. Ex. arthroplastie totale du genou ; ostéosynthèse par clou gamma ; plaque antérieure du radius distal..." />
          <p className="ortho-hint">Zone de texte libre : modifiable même après un preset.</p>

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
              <label>Déroulement per-opératoire</label>
              <select value={perop} onChange={(event) => setPerop(event.target.value)}>
                <option>sans particularité</option>
                <option>sans incident</option>
                <option>geste en bonnes conditions</option>
                <option value="__">à préciser…</option>
              </select>
            </div>
          </div>
          {perop === "__" && <textarea value={peropText} onChange={(event) => setPeropText(event.target.value)} placeholder="Décrire le déroulement per-opératoire (saignement, difficulté technique, incident...)" className="ortho-inline-input" />}

          <h2>3 · Dates</h2>
          <div className="ortho-row">
            <div><label>Entrée</label><input type="date" value={dateEntree} onChange={(event) => setDateEntree(event.target.value)} /></div>
            <div><label>Chirurgie</label><input type="date" value={dateChirurgie} onChange={(event) => handleDateChirurgieChange(event.target.value)} /></div>
            <div><label>Sortie / transfert</label><input type="date" value={dateSortie} onChange={(event) => setDateSortie(event.target.value)} /></div>
          </div>
          <p className="ortho-hint">Les dates saisies sont recopiées telles quelles dans le courrier. Une date laissée vide devient « [à préciser par l'opérateur] ».</p>
          <label className="ortho-check"><input type="checkbox" checked={isTransfert} onChange={(event) => setIsTransfert(event.target.checked)} /> Sortie = transfert</label>
          {isTransfert && <input value={structureAval} onChange={(event) => setStructureAval(event.target.value)} placeholder="structure d'aval (SMR, service...)" className="ortho-inline-input" />}

          <h2>4 · Clinique</h2>
          <label>Antécédents (+ allergies)</label>
          <textarea value={antecedents} onChange={(event) => setAntecedents(event.target.value)} />
          <label>Suites post-opératoires</label>
          <select value={suites} onChange={(event) => setSuites(event.target.value as "simples" | "compliquees")}>
            <option value="simples">simples</option>
            <option value="compliquees">compliquées → à décrire</option>
          </select>
          {suites === "compliquees" && <textarea value={suitesText} onChange={(event) => setSuitesText(event.target.value)} placeholder="Décrire les suites compliquées (ex. escarre talonnière ; anémie post-op ayant nécessité VENOFER ; sigmoïdite ; confusion post-op...)" className="ortho-inline-input" />}
          <label className="ortho-check"><input type="checkbox" checked={orthoGeriatrie} onChange={(event) => setOrthoGeriatrie(event.target.checked)} /> Prise en charge ortho-gériatrique conjointe</label>

          <h2>5 · Consignes de suivi</h2>
          <textarea className="ortho-consignes" value={consignes} onChange={(event) => setConsignes(event.target.value)} />
          <div className="ortho-flag">Trame à valider et compléter : les éléments entre [ ] relèvent de l'opérateur. L'outil n'en propose aucune valeur.</div>
          <button type="button" className="ortho-reset" onClick={() => setConsignes(bulletList(preset.consignes))}><RefreshCw size={14} /> Recharger la trame du geste</button>

          <div className="ortho-row">
            <div><label>RDV de contrôle</label><input type="date" value={dateRdv} onChange={(event) => setDateRdv(event.target.value)} /></div>
            <div><label>Heure</label><input type="time" value={heureRdv} onChange={(event) => setHeureRdv(event.target.value)} /></div>
          </div>
          <div className="ortho-encadre">
            <label>Radiographies de contrôle <span className="ortho-badge">saisie libre</span></label>
            <input value={radios} onChange={(event) => setRadios(event.target.value)} placeholder={preset.radios ? `Suggestion : ${preset.radios} — à valider / compléter` : "À remplir par le médecin"} />
            <p className="ortho-hint">Champ libre : non rempli automatiquement. Le preset propose seulement une suggestion en placeholder — c'est à vous de saisir la valeur retenue.</p>
          </div>
        </section>

        <section className="ortho-card">
          <h2>Courrier</h2>
          <div className="ortho-actions">
            <Button type="button" className="ortho-main-btn" onClick={handleGenerate} disabled={isGenerating || blocText.length < 10}>
              <FileText size={17} /> {isGenerating ? "Génération..." : "Générer le courrier"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy}><Copy size={16} /> Copier</Button>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}><RefreshCw size={16} /> Réinitialiser</Button>
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
            Complétez les [ ] et vérifiez côté, dates et consignes. Le protocole de l'opérateur prime.
          </div>
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
.ortho-badge{display:inline-block;background:var(--accent);color:var(--brand-d);border-radius:6px;padding:2px 8px;font-size:.72rem;font-weight:800;margin-left:6px}
.ortho-encadre{border:1.5px dashed var(--brand);background:var(--accent);border-radius:12px;padding:12px 14px;margin-top:12px}
.ortho-encadre b{display:block;color:var(--brand-d);margin-bottom:4px}.ortho-encadre p{margin:0;color:var(--muted);font-size:.84rem;line-height:1.45}.ortho-encadre label{margin-top:0!important}
.ortho-card label{display:block;font-weight:700;font-size:.82rem;color:var(--muted);margin:12px 0 5px}
.ortho-card input[type=text],.ortho-card input[type=number],.ortho-card input[type=date],.ortho-card input[type=time],.ortho-card select,.ortho-card textarea{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:10px;font-size:.92rem;font-family:inherit;background:#fff;color:var(--ink)}
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
.ortho-tabbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.ortho-tabbar button{padding:7px 12px;border-radius:8px;border:1px solid var(--line);background:#fff;cursor:pointer;font-size:.82rem;font-weight:800;color:var(--muted)}.ortho-tabbar button.on{background:var(--brand);color:#fff;border-color:var(--brand)}
.ortho-copy-preview{margin-top:10px}
.ortho-page :focus-visible{outline:2px solid #0E9C8E;outline-offset:2px;border-radius:5px}
@media(max-width:900px){.ortho-wrap{grid-template-columns:1fr;padding:18px}.ortho-row,.ortho-row:has(> div:nth-child(3)){grid-template-columns:1fr}.ortho-top{padding:20px}.ortho-top h1{font-size:1.45rem}}
`;
