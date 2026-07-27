import RedactioLayout from "@/components/RedactioLayout";
import {
  AlertTriangle,
  Bone,
  BookOpen,
  ChevronDown,
  FilePenLine,
  FileText,
  Info,
  Plus,
  Search,
  Shield,
  Stethoscope,
} from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

type GuideModule = {
  id: string;
  title: string;
  description: string;
  accent: string;
  badge: string;
  icon: ReactNode;
  steps: Array<{
    title: string;
    body: ReactNode;
  }>;
};

type FaqCategory =
  | "general"
  | "courrier"
  | "conciliation"
  | "observation"
  | "ortho"
  | "correspondance"
  | "securite";

type FaqItem = {
  category: FaqCategory;
  question: string;
  answer: string;
};

const GUIDE_MODULES: GuideModule[] = [
  {
    id: "guide-courrier",
    title: "Courrier de sortie",
    description:
      "Sélection du service, dépôt des données, génération, correction par le praticien.",
    accent: "var(--teal)",
    badge: "4 étapes",
    icon: <FileText />,
    steps: [
      {
        title: "Sélectionner le service",
        body: (
          <>
            Ouvrez l&apos;onglet Courrier de sortie et choisissez le service concerné :
            <ul>
              <li>MCO (Médecine, Chirurgie, Obstétrique)</li>
              <li>SMR (Soins Médicaux et de Réadaptation)</li>
            </ul>
          </>
        ),
      },
      {
        title: "Déposer les données cliniques",
        body: (
          <>
            Deux méthodes combinables. Par glisser-déposer (recommandé), copiez
            l&apos;ensemble des observations du séjour, dans n&apos;importe quel ordre, puis
            déposez le fichier dans la zone prévue. La présence d&apos;une date sur
            chaque observation optimise la mise en forme automatique. Sources utiles :
            observation d&apos;entrée, notes d&apos;évolution, comptes rendus d&apos;examens,
            observations en mode suite. Par saisie ou dictée directe : si aucun
            fichier n&apos;est disponible, rédigez ou dictez les éléments cliniques
            manuellement.
          </>
        ),
      },
      {
        title: "Générer le document",
        body: (
          <>
            Cliquez sur Générer.
            <div className="emploi-callout warn">
              <AlertTriangle aria-hidden="true" />
              <div>
                <b>Important :</b> n&apos;ajoutez pas le traitement de sortie à cette
                étape. Il se gère exclusivement dans l&apos;onglet Conciliation
                médicamenteuse.
              </div>
            </div>
          </>
        ),
      },
      {
        title: "Révision par le praticien",
        body:
          "Une fois le document généré, vous relisez le courrier, corrigez les éventuelles inexactitudes, complétez les éléments manquants, puis transmettez le document finalisé à la secrétaire médicale.",
      },
    ],
  },
  {
    id: "guide-conciliation",
    title: "Conciliation médicamenteuse",
    description:
      "Saisie des traitements, génération du tableau HAS, révision et export.",
    accent: "var(--navy)",
    badge: "3 étapes",
    icon: <Stethoscope />,
    steps: [
      {
        title: "Saisir les traitements d'entrée et de sortie",
        body: (
          <>
            Traitement d&apos;entrée et traitement de sortie suivent les mêmes méthodes :
            glisser-déposer du fichier correspondant (recommandé), ou saisie/dictée
            directe en l&apos;absence de fichier.
            <div className="emploi-callout warn">
              <AlertTriangle aria-hidden="true" />
              <div>
                En cas d&apos;absence de traitement à l&apos;entrée, cochez impérativement
                la case <b>« Pas de traitement d&apos;entrée »</b> avant de passer à
                l&apos;étape suivante.
              </div>
            </div>
          </>
        ),
      },
      {
        title: "Générer la conciliation",
        body:
          "Une fois les deux traitements renseignés, cliquez sur Continuer. MEDACTIO produit automatiquement un tableau conforme aux recommandations HAS 2018 à 6 colonnes, reprenant l'intégralité des molécules prescrites en DCI, même saisies sous leur nom commercial, ainsi qu'une synthèse récapitulative classant chaque thérapeutique selon son statut.",
      },
      {
        title: "Révision, validation et export",
        body: (
          <ul>
            <li>Vérifiez les commentaires du tableau et adaptez-les.</li>
            <li>Complétez les mentions signalées dans la synthèse récapitulative.</li>
            <li>Validez le document dans l&apos;application.</li>
            <li>Téléchargez au format Word (.docx).</li>
            <li>Transmettez le fichier à la secrétaire médicale.</li>
          </ul>
        ),
      },
    ],
  },
  {
    id: "guide-observation",
    title: "Observation médicale",
    description:
      "Suivi quotidien : intégration des bilans, comptes rendus et rédaction clinique.",
    accent: "var(--purple)",
    badge: "3 étapes",
    icon: <FilePenLine />,
    steps: [
      {
        title: "Choisir le type d'observation",
        body: (
          <>
            Ce module s&apos;adapte à tous les contextes de suivi :
            <ul>
              <li>Visite du jour</li>
              <li>Contre-visite</li>
              <li>Expertise médicale</li>
            </ul>
          </>
        ),
      },
      {
        title: "Intégrer les bilans et comptes rendus",
        body:
          "Par glisser-déposer, déposez un bilan biologique, un compte rendu d'imagerie ou tout autre compte rendu paramédical. MEDACTIO produit automatiquement une version épurée du document source : les résultats bruts sont conservés, les données d'identité et les mentions administratives sont supprimées.",
      },
      {
        title: "Rédiger le suivi clinique",
        body:
          "Au-delà de l'intégration des bilans, ce module sert à la rédaction de l'observation médicale proprement dite : saisie manuelle des éléments cliniques de la visite ou dictée numérique, idéale pour le suivi quotidien.",
      },
    ],
  },
  {
    id: "guide-ortho",
    title: "Chirurgie orthopédique",
    description:
      "Saisie orientée par champs structurés pour un courrier de sortie complet.",
    accent: "var(--blue)",
    badge: "4 étapes",
    icon: <Bone />,
    steps: [
      {
        title: "Renseigner le contexte clinique",
        body: (
          <ul>
            <li>Motif d&apos;entrée : raison ayant conduit à la prise en charge.</li>
            <li>Pathologie : diagnostic ayant motivé l&apos;intervention.</li>
            <li>Antécédents du patient : à renseigner dans le champ prévu.</li>
          </ul>
        ),
      },
      {
        title: "Décrire l'acte chirurgical",
        body: (
          <ul>
            <li>Type de geste chirurgical réalisé.</li>
            <li>Type d&apos;anesthésie.</li>
            <li>Déroulement peropératoire.</li>
            <li>Déroulement postopératoire.</li>
          </ul>
        ),
      },
      {
        title: "Renseigner les consignes de suivi",
        body:
          "Précisez les consignes de suivi à transmettre au patient et au médecin correspondant, la prescription de la radiographie de contrôle, et la date du rendez-vous de contrôle radio-clinique.",
      },
      {
        title: "Générer, corriger et récupérer",
        body:
          "Cliquez sur Générer : MEDACTIO produit le courrier de sortie orthopédique. Vous relisez et corrigez le document généré, puis récupérez le fichier finalisé pour transmission au secrétariat.",
      },
    ],
  },
  {
    id: "guide-correspondance",
    title: "Correspondance médicale",
    description:
      "Tout type de courrier médical sortant, en dehors du courrier de sortie standard.",
    accent: "var(--gold)",
    badge: "3 étapes",
    icon: <BookOpen />,
    steps: [
      {
        title: "Choisir le type de correspondance",
        body: "Sélectionnez le type de courrier parmi les options disponibles.",
      },
      {
        title: "Compléter les champs",
        body:
          "Renseignez les informations correspondant au type de courrier choisi.",
      },
      {
        title: "Générer, corriger et transmettre",
        body:
          "Cliquez sur Générer le courrier. MEDACTIO produit un courrier brut initial. Vous relisez et corrigez le document généré, copiez le courrier finalisé, puis le remettez au secrétariat pour mise en forme et envoi.",
      },
    ],
  },
];

const FAQ_LABELS: Record<FaqCategory | "tous", string> = {
  tous: "Tous",
  general: "Général",
  courrier: "Courrier de sortie",
  conciliation: "Conciliation",
  observation: "Observation médicale",
  ortho: "Chirurgie ortho",
  correspondance: "Correspondance",
  securite: "Sécurité & données",
};

const FAQ_ITEMS: FaqItem[] = [
  {
    category: "general",
    question: "Mes données patient sont-elles conservées par MEDACTIO ?",
    answer:
      "Non. Aucune donnée patient n'est stockée : tout reste en mémoire de votre session et disparaît à la déconnexion. Pensez à exporter ou copier vos documents avant de vous déconnecter.",
  },
  {
    category: "general",
    question: "Puis-je utiliser la dictée vocale sur tous les modules ?",
    answer:
      "Oui, la dictée vocale est disponible sur l'ensemble des modules qui proposent une saisie de texte libre, identifiés par le bouton « Dicter ». Elle est particulièrement adaptée au suivi quotidien en Observation médicale.",
  },
  {
    category: "general",
    question: "Que faire si le document généré comporte une erreur ou une omission ?",
    answer:
      "Chaque document généré doit être relu et validé par vous avant transmission. Vous pouvez corriger directement le texte affiché, compléter les éléments manquants, puis régénérer une section si nécessaire.",
  },
  {
    category: "general",
    question: "Sous quel format puis-je récupérer mes documents ?",
    answer:
      "Selon le module, vous pouvez copier le texte directement ou télécharger le document au format Word (.docx).",
  },
  {
    category: "courrier",
    question: "Dois-je respecter un ordre pour déposer les observations du séjour ?",
    answer:
      "Non, les observations peuvent être déposées dans n'importe quel ordre. La présence d'une date sur chaque observation reste toutefois conseillée pour optimiser la mise en forme automatique.",
  },
  {
    category: "courrier",
    question: "Puis-je saisir le traitement de sortie dans le module Courrier de sortie ?",
    answer:
      "Non. Le traitement de sortie se gère exclusivement dans le module Conciliation médicamenteuse, pour rester conforme au circuit HAS de conciliation.",
  },
  {
    category: "conciliation",
    question: "Que faire si le patient n'avait aucun traitement à l'entrée ?",
    answer:
      "Cochez impérativement la case « Pas de traitement d'entrée » avant de poursuivre. La conciliation reste due même sans traitement d'entrée : cette confirmation explicite évite un champ vide ambigu.",
  },
  {
    category: "conciliation",
    question: "Les médicaments saisis sous leur nom commercial sont-ils reconnus ?",
    answer:
      "Oui. MEDACTIO les convertit automatiquement en DCI dans le tableau à 6 colonnes conforme aux recommandations HAS 2018.",
  },
  {
    category: "observation",
    question: "Les données administratives des comptes rendus déposés apparaissent-elles dans le document final ?",
    answer:
      "Non. MEDACTIO conserve les résultats bruts du bilan ou de l'examen mais supprime automatiquement les données d'identité et les mentions administratives obligatoires.",
  },
  {
    category: "observation",
    question: "Quels types de comptes rendus puis-je déposer ?",
    answer:
      "Un bilan biologique, un compte rendu d'imagerie ou tout autre compte rendu paramédical : ECG, EFR, endoscopie, etc.",
  },
  {
    category: "ortho",
    question: "Puis-je décrire librement le geste chirurgical réalisé ?",
    answer:
      "Le type de geste et le type d'anesthésie se sélectionnent parmi des options guidées, pour garantir un vocabulaire homogène ; le déroulement peropératoire et postopératoire se saisit librement.",
  },
  {
    category: "correspondance",
    question: "Quelle différence avec le module Courrier de sortie ?",
    answer:
      "Correspondance médicale couvre tout courrier médical sortant en dehors du courrier de sortie standard : avis, courrier confraternel, réponse à un correspondant, etc.",
  },
  {
    category: "securite",
    question: "Qui peut relire et valider les documents avant transmission ?",
    answer:
      "Vous, en tant que praticien en charge du patient, restez seul responsable de la relecture, de la correction et de la validation avant transmission.",
  },
];

export default function ModeEmploi() {
  const [query, setQuery] = useState("");
  const [faqFilter, setFaqFilter] = useState<FaqCategory | "tous">("tous");
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(["guide-courrier"])
  );
  const [openFaq, setOpenFaq] = useState<Set<string>>(
    () => new Set([FAQ_ITEMS[0].question])
  );

  const filteredFaq = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = faqFilter === "tous" || item.category === faqFilter;
      const matchesQuery =
        !normalized ||
        `${item.question} ${item.answer}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [faqFilter, query]);

  const faqByCategory = useMemo(() => {
    return filteredFaq.reduce<Record<FaqCategory, FaqItem[]>>(
      (acc, item) => {
        acc[item.category].push(item);
        return acc;
      },
      {
        general: [],
        courrier: [],
        conciliation: [],
        observation: [],
        ortho: [],
        correspondance: [],
        securite: [],
      }
    );
  }, [filteredFaq]);

  const toggleModule = (id: string) => {
    setOpenModules((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFaq = (question: string) => {
    setOpenFaq((current) => {
      const next = new Set(current);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });
  };

  return (
    <RedactioLayout>
      <style>{monEmploiStyles}</style>

      <main className="emploi-main">
        <h1 className="emploi-title">
          Mode <em>d&apos;emploi</em>
        </h1>
        <p className="emploi-subtitle">
          Le guide complet de MEDACTIO, module par module, et les réponses aux
          questions que se posent le plus souvent les praticiens.
        </p>

        <label className="emploi-search" aria-label="Rechercher dans le mode d'emploi">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher dans le mode d'emploi (ex. traitement de sortie, dictée, export...)"
          />
        </label>

        <nav className="emploi-jump" aria-label="Accès rapide">
          {GUIDE_MODULES.map((module) => (
            <a key={module.id} href={`#${module.id}`}>
              {module.title}
            </a>
          ))}
          <a href="#faq">Questions fréquentes</a>
        </nav>

        <p className="emploi-section-label">Guide par module</p>

        <section className="emploi-guide" aria-label="Guide par module">
          {GUIDE_MODULES.map((module) => {
            const isOpen = openModules.has(module.id);
            return (
              <article
                key={module.id}
                id={module.id}
                className={`emploi-module ${isOpen ? "open" : ""}`}
                style={{ "--accent": module.accent } as CSSProperties}
              >
                <button
                  type="button"
                  className="emploi-module-head"
                  onClick={() => toggleModule(module.id)}
                  aria-expanded={isOpen}
                >
                  <span className="emploi-module-icon" aria-hidden="true">
                    {module.icon}
                  </span>
                  <span className="emploi-module-copy">
                    <span className="emploi-module-title">{module.title}</span>
                    <span className="emploi-module-desc">{module.description}</span>
                  </span>
                  <span className="emploi-module-badge">{module.badge}</span>
                  <ChevronDown className="emploi-chevron" aria-hidden="true" />
                </button>

                <div className="emploi-module-body" hidden={!isOpen}>
                  {module.steps.map((step, index) => (
                    <div key={step.title} className="emploi-step">
                      <span className="emploi-step-num">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="emploi-step-title">{step.title}</div>
                        <div className="emploi-step-body">{step.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section id="faq" className="emploi-faq" aria-label="Questions fréquentes">
          <div className="emploi-faq-head">
            <p className="emploi-section-label">Questions fréquentes</p>
            <div className="emploi-chips" role="list" aria-label="Filtres FAQ">
              {(Object.keys(FAQ_LABELS) as Array<FaqCategory | "tous">).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`emploi-chip ${faqFilter === category ? "active" : ""}`}
                  onClick={() => setFaqFilter(category)}
                >
                  {FAQ_LABELS[category]}
                </button>
              ))}
            </div>
          </div>

          {filteredFaq.length === 0 ? (
            <div className="emploi-empty">
              <Search aria-hidden="true" />
              Aucune question ne correspond à votre recherche.
            </div>
          ) : (
            (Object.keys(faqByCategory) as FaqCategory[]).map((category) => {
              const items = faqByCategory[category];
              if (items.length === 0) return null;
              return (
                <div key={category} className="emploi-faq-group">
                  <h2>{FAQ_LABELS[category]}</h2>
                  {items.map((item) => {
                    const isOpen = openFaq.has(item.question) || query.trim() !== "";
                    return (
                      <article key={item.question} className={`emploi-faq-item ${isOpen ? "open" : ""}`}>
                        <button
                          type="button"
                          className="emploi-faq-question"
                          onClick={() => toggleFaq(item.question)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.question}</span>
                          <Plus aria-hidden="true" />
                        </button>
                        <div className="emploi-faq-answer" hidden={!isOpen}>
                          <p>{item.answer}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })
          )}
        </section>

        <aside className="emploi-note">
          <Info aria-hidden="true" />
          <div>
            Ce guide reflète le fonctionnement actuel des modules. En cas de
            question non couverte ici, vous pouvez consulter les tutoriels vidéo
            ou vous rapprocher du support MEDACTIO.
          </div>
        </aside>
      </main>
    </RedactioLayout>
  );
}

const monEmploiStyles = `
@import url("https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap");

.emploi-main,
.emploi-main *{box-sizing:border-box}

.emploi-main{
  --ink:#0b1b29; --ink-soft:#5a6b78; --ink-faint:#8a99a4;
  --teal:#0e9c8e; --teal-deep:#0a7b70; --line:#e6edf0;
  --field:#f6f9f9; --mint:#eef6f4; --navy:#1e3a5f;
  --gold:#c58a17; --purple:#6d5bd0; --blue:#2f6fb0;
  --amber:#b9740a; --amber-bg:#fdf4e7; --amber-line:#f0dcb4;
  width:100%;
  max-width:1180px;
  min-height:calc(100vh - 40px);
  margin:0 auto;
  padding:34px 40px 60px;
  color:var(--ink);
  font-family:"Hanken Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}

.emploi-title{
  font-family:"Spectral",Georgia,serif;
  font-size:29px;
  font-weight:600;
  line-height:1.12;
  margin:0 0 6px;
  color:var(--ink);
}

.emploi-title em{font-style:italic;color:var(--teal-deep)}

.emploi-subtitle{
  max-width:680px;
  margin:0 0 24px;
  color:var(--ink-soft);
  font-size:14.5px;
  line-height:1.55;
}

.emploi-search{
  position:relative;
  display:block;
  max-width:560px;
  margin-bottom:22px;
}

.emploi-search svg{
  position:absolute;
  left:16px;
  top:50%;
  width:18px;
  height:18px;
  color:var(--ink-faint);
  transform:translateY(-50%);
}

.emploi-search input{
  width:100%;
  border:1.5px solid var(--line);
  border-radius:13px;
  background:#fff;
  color:var(--ink);
  font:inherit;
  font-size:14.5px;
  padding:13px 16px 13px 46px;
  transition:.15s ease;
}

.emploi-search input:focus{
  outline:none;
  border-color:var(--teal);
  box-shadow:0 0 0 4px rgba(14,156,142,.13);
}

.emploi-jump{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-bottom:38px;
}

.emploi-jump a{
  border:1px solid var(--line);
  border-radius:999px;
  background:#fff;
  color:var(--ink-soft);
  font-size:12.5px;
  font-weight:700;
  padding:8px 14px;
  text-decoration:none;
  transition:.15s ease;
}

.emploi-jump a:hover{
  border-color:var(--teal);
  background:var(--mint);
  color:var(--teal-deep);
}

.emploi-section-label{
  margin:0 0 16px;
  color:var(--ink-faint);
  font-size:11px;
  font-weight:700;
  letter-spacing:2px;
  text-transform:uppercase;
}

.emploi-guide{
  display:flex;
  flex-direction:column;
  gap:14px;
  margin-bottom:46px;
}

.emploi-module{
  scroll-margin-top:24px;
  overflow:hidden;
  border:1px solid var(--line);
  border-top:3px solid var(--accent,var(--teal));
  border-radius:16px;
  background:#fff;
  box-shadow:0 2px 6px rgba(11,27,41,.04);
}

.emploi-module-head{
  width:100%;
  border:0;
  background:transparent;
  color:inherit;
  cursor:pointer;
  display:flex;
  align-items:center;
  gap:16px;
  padding:20px 24px;
  text-align:left;
  font:inherit;
}

.emploi-module-icon{
  width:46px;
  height:46px;
  flex:none;
  border-radius:12px;
  background:var(--accent,var(--teal));
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
}

.emploi-module-icon svg{width:22px;height:22px}
.emploi-module-copy{flex:1;min-width:0}
.emploi-module-title{
  display:block;
  font-family:"Spectral",Georgia,serif;
  font-size:19px;
  font-weight:600;
  line-height:1.2;
  margin-bottom:3px;
}
.emploi-module-desc{
  display:block;
  color:var(--ink-soft);
  font-size:13.4px;
  line-height:1.45;
}

.emploi-module-badge{
  flex:none;
  border:1px solid color-mix(in srgb,var(--accent,var(--teal)) 30%,var(--line));
  border-radius:999px;
  background:color-mix(in srgb,var(--accent,var(--teal)) 12%,#fff);
  color:var(--accent,var(--teal));
  font-size:11.5px;
  font-weight:700;
  padding:6px 12px;
  white-space:nowrap;
}

.emploi-chevron{
  width:20px;
  height:20px;
  flex:none;
  color:var(--ink-faint);
  transition:transform .2s ease;
}

.emploi-module.open .emploi-chevron{transform:rotate(180deg)}

.emploi-module-body{
  border-top:1px solid var(--line);
  padding:22px 24px 26px;
}

.emploi-step{
  display:flex;
  gap:14px;
  margin-bottom:18px;
}

.emploi-step:last-child{margin-bottom:0}
.emploi-step-num{
  width:30px;
  height:30px;
  flex:none;
  border:1.5px solid var(--line);
  border-radius:9px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--accent,var(--teal-deep));
  font-family:"JetBrains Mono",monospace;
  font-size:12px;
  font-weight:600;
}

.emploi-step-title{
  margin-bottom:3px;
  color:var(--ink);
  font-size:14.5px;
  font-weight:700;
}

.emploi-step-body{
  color:var(--ink-soft);
  font-size:13.4px;
  line-height:1.55;
}

.emploi-step-body ul{
  margin:8px 0 0;
  padding-left:18px;
}

.emploi-callout{
  display:flex;
  gap:10px;
  align-items:flex-start;
  margin:10px 0 4px;
  border-radius:12px;
  padding:12px 14px;
  font-size:13px;
  line-height:1.5;
}

.emploi-callout.warn{
  border:1px solid var(--amber-line);
  background:var(--amber-bg);
  color:#7a5108;
}

.emploi-callout svg{
  width:16px;
  height:16px;
  flex:none;
  margin-top:1px;
  color:var(--amber);
}

.emploi-faq-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  flex-wrap:wrap;
  gap:14px;
  margin-bottom:16px;
}

.emploi-faq-head .emploi-section-label{margin:0}
.emploi-chips{display:flex;flex-wrap:wrap;gap:8px}
.emploi-chip{
  border:1px solid var(--line);
  border-radius:999px;
  background:#fff;
  color:var(--ink-soft);
  cursor:pointer;
  font:inherit;
  font-size:12.5px;
  font-weight:700;
  padding:7px 13px;
  transition:.15s ease;
}

.emploi-chip:hover{border-color:var(--ink-faint)}
.emploi-chip.active{
  border-color:var(--teal);
  background:var(--teal);
  color:#fff;
}

.emploi-faq-group{margin-bottom:22px}
.emploi-faq-group h2{
  margin:0 0 10px;
  color:var(--ink-faint);
  font-size:12px;
  font-weight:700;
  letter-spacing:1px;
  text-transform:uppercase;
}

.emploi-faq-item{
  overflow:hidden;
  margin-bottom:9px;
  border:1px solid var(--line);
  border-radius:13px;
  background:#fff;
}

.emploi-faq-question{
  width:100%;
  border:0;
  background:transparent;
  color:var(--ink);
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  padding:15px 18px;
  text-align:left;
  font:inherit;
}

.emploi-faq-question span{
  font-size:14.3px;
  font-weight:700;
  line-height:1.4;
}

.emploi-faq-question svg{
  width:17px;
  height:17px;
  flex:none;
  color:var(--ink-faint);
  transition:transform .2s ease,color .2s ease;
}

.emploi-faq-item.open .emploi-faq-question svg{
  transform:rotate(45deg);
  color:var(--teal-deep);
}

.emploi-faq-answer p{
  margin:0;
  padding:0 18px 17px;
  color:var(--ink-soft);
  font-size:13.6px;
  line-height:1.6;
}

.emploi-empty{
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--ink-faint);
  font-size:13.6px;
  padding:24px 4px;
}

.emploi-empty svg{width:18px;height:18px}

.emploi-note{
  display:flex;
  gap:10px;
  align-items:flex-start;
  margin-top:34px;
  border:1px solid rgba(14,156,142,.22);
  border-radius:14px;
  background:var(--mint);
  color:var(--ink);
  font-size:13.6px;
  line-height:1.5;
  padding:16px 18px;
}

.emploi-note svg{
  width:18px;
  height:18px;
  flex:none;
  margin-top:1px;
  color:var(--teal-deep);
}

@media(max-width:860px){
  .emploi-main{padding:26px 20px}
}

@media(max-width:620px){
  .emploi-module-head{
    align-items:flex-start;
    flex-wrap:wrap;
  }
  .emploi-module-badge{
    margin-left:62px;
  }
}
`;
