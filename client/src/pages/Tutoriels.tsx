import RedactioLayout from "@/components/RedactioLayout";
import {
  Bone,
  BookOpen,
  FilePenLine,
  FileText,
  Info,
  Play,
  Stethoscope,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type TutorialCard = {
  title: string;
  level: string;
  duration: string;
  description: string;
  accent: string;
  icon: ReactNode;
};

const TUTORIALS: TutorialCard[] = [
  {
    title: "Courrier de sortie",
    level: "Bloc · Débutant",
    duration: "5:38",
    description:
      "Générer un courrier de sortie d'hospitalisation structuré à partir de notes libres, section par section.",
    accent: "var(--teal)",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Conciliation médicamenteuse",
    level: "Bloc · Intermédiaire",
    duration: "6:04",
    description:
      "Établir un bilan de conciliation à l'admission, au transfert ou à la sortie, sans erreur de recopie.",
    accent: "var(--navy)",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    title: "Correspondance médicale",
    level: "Bloc · Débutant",
    duration: "3:52",
    description:
      "Rédiger un courrier confraternel entre praticiens à partir de quelques points clés.",
    accent: "var(--gold)",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Observation médicale",
    level: "Bloc · Débutant",
    duration: "4:47",
    description:
      "Prise de notes, suivi journalier et transmissions ciblées, mis en forme automatiquement.",
    accent: "var(--purple)",
    icon: <FilePenLine className="h-5 w-5" />,
  },
  {
    title: "Chirurgie orthopédique",
    level: "Bloc · Avancé",
    duration: "7:15",
    description:
      "Compte rendu opératoire et courrier de sortie : latéralité, matériel, dates et consignes de suivi.",
    accent: "var(--blue)",
    icon: <Bone className="h-5 w-5" />,
  },
];

export default function Tutoriels() {
  return (
    <RedactioLayout>
      <style>{tutorialStyles}</style>

      <main className="tutorial-main">
        <h1 className="tutorial-title">
          Tutoriels <em>vidéo</em>
        </h1>
        <p className="tutorial-subtitle">
          Prenez REDACTIO en main en quelques minutes. Chaque vidéo démontre
          l&apos;utilisation d&apos;un bloc, de la saisie à l&apos;export du document validé.
        </p>

        <section className="tutorial-featured" aria-label="Vidéo à la une">
          <button
            type="button"
            className="tutorial-player"
            aria-label="Lire la vidéo de prise en main"
          >
            <span className="tutorial-player-tag">PRISE EN MAIN</span>
            <span className="tutorial-player-play" aria-hidden="true">
              <Play fill="currentColor" strokeWidth={0} />
            </span>
            <span className="tutorial-duration">4:12</span>
          </button>

          <div className="tutorial-featured-meta">
            <div className="tutorial-kick">Commencez ici</div>
            <h2>Découvrir REDACTIO en 4 minutes</h2>
            <p>
              Le parcours complet : choisir un volet, dicter ou coller vos notes,
              laisser la pseudonymisation structurer le document, puis relire,
              valider et exporter. Le fil conducteur commun à tous les blocs.
            </p>
            <button type="button" className="tutorial-cta">
              <Play fill="currentColor" strokeWidth={0} />
              Lire la vidéo
            </button>
          </div>
        </section>

        <p className="tutorial-section-label">Un tutoriel par bloc</p>

        <section className="tutorial-grid" aria-label="Liste des tutoriels vidéo">
          {TUTORIALS.map((tutorial) => (
            <button
              key={tutorial.title}
              type="button"
              className="tutorial-card"
              style={{ "--accent": tutorial.accent } as CSSProperties}
              aria-label={`Lire le tutoriel ${tutorial.title}`}
            >
              <div className="tutorial-thumb">
                <span className="tutorial-icon" aria-hidden="true">
                  {tutorial.icon}
                </span>
                <span className="tutorial-thumb-play" aria-hidden="true">
                  <Play fill="currentColor" strokeWidth={0} />
                </span>
                <span className="tutorial-duration">{tutorial.duration}</span>
              </div>

              <div className="tutorial-card-body">
                <div className="tutorial-level">{tutorial.level}</div>
                <h3>{tutorial.title}</h3>
                <p>{tutorial.description}</p>
              </div>
            </button>
          ))}
        </section>

        <aside className="tutorial-note">
          <Info aria-hidden="true" />
          <div>
            Les vidéos sont des démonstrations sur données fictives. Aucune
            information réelle de patient n&apos;y figure — conformément au fonctionnement
            de la plateforme, aucune donnée n&apos;est stockée.
          </div>
        </aside>
      </main>
    </RedactioLayout>
  );
}

const tutorialStyles = `
@import url("https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap");

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

.tutorial-main,
.tutorial-main *{
  box-sizing:border-box;
}

.tutorial-main{
  width:100%;
  max-width:1180px;
  min-height:calc(100vh - 40px);
  margin:0 auto;
  padding:34px 40px 48px;
  color:var(--ink);
  font-family:"Hanken Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}

.tutorial-title{
  font-family:"Spectral",Georgia,serif;
  font-weight:600;
  font-size:29px;
  line-height:1.12;
  letter-spacing:-.2px;
  margin:0 0 6px;
  color:var(--ink);
}

.tutorial-title em{
  font-style:italic;
  color:var(--teal-deep);
}

.tutorial-subtitle{
  max-width:660px;
  color:var(--ink-soft);
  font-size:14.5px;
  line-height:1.55;
  margin:0 0 26px;
}

.tutorial-section-label{
  font-size:11px;
  letter-spacing:2px;
  text-transform:uppercase;
  color:var(--ink-faint);
  font-weight:700;
  margin:0 0 16px;
}

/* ---------- VIDÉO À LA UNE ---------- */
.tutorial-featured{
  display:grid;
  grid-template-columns:1.35fr 1fr;
  gap:26px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:18px;
  padding:18px;
  box-shadow:0 2px 6px rgba(11,27,41,.04);
  margin-bottom:40px;
}

.tutorial-player{
  appearance:none;
  -webkit-appearance:none;
  position:relative;
  border:0;
  border-radius:13px;
  overflow:hidden;
  aspect-ratio:16/9;
  background:linear-gradient(135deg,#12303f,#1e3a5f);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  padding:0;
  color:var(--teal-deep);
}

.tutorial-player::after{
  content:"";
  position:absolute;
  inset:0;
  background:radial-gradient(circle at 50% 45%,rgba(14,156,142,.28),transparent 60%);
}

.tutorial-player-play{
  position:relative;
  z-index:1;
  width:74px;
  height:74px;
  border-radius:50%;
  background:rgba(255,255,255,.94);
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 14px 34px -10px rgba(0,0,0,.5);
  transition:.18s ease;
}

.tutorial-player:hover .tutorial-player-play{
  transform:scale(1.06);
}

.tutorial-player-play svg{
  width:30px;
  height:30px;
  margin-left:4px;
}

.tutorial-player-tag{
  position:absolute;
  z-index:1;
  top:14px;
  left:14px;
  background:rgba(11,27,41,.6);
  color:#fff;
  font-size:11px;
  font-weight:700;
  letter-spacing:.5px;
  padding:5px 11px;
  border-radius:999px;
  backdrop-filter:blur(4px);
}

.tutorial-duration{
  position:absolute;
  z-index:1;
  bottom:14px;
  right:14px;
  background:rgba(11,27,41,.72);
  color:#fff;
  font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  font-size:12px;
  line-height:1;
  padding:5px 9px;
  border-radius:7px;
}

.tutorial-featured-meta{
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:8px 14px 8px 4px;
}

.tutorial-kick{
  font-size:11px;
  letter-spacing:2px;
  text-transform:uppercase;
  color:var(--teal-deep);
  font-weight:700;
  margin-bottom:10px;
}

.tutorial-featured-meta h2{
  font-family:"Spectral",Georgia,serif;
  font-weight:600;
  font-size:24px;
  line-height:1.2;
  margin:0 0 12px;
  color:var(--ink);
}

.tutorial-featured-meta p{
  color:var(--ink-soft);
  font-size:14px;
  line-height:1.55;
  margin:0 0 20px;
}

.tutorial-cta{
  appearance:none;
  -webkit-appearance:none;
  display:inline-flex;
  align-items:center;
  gap:8px;
  align-self:flex-start;
  background:var(--teal);
  color:#fff;
  font-weight:700;
  font-size:14px;
  border:none;
  border-radius:11px;
  padding:12px 20px;
  cursor:pointer;
  box-shadow:0 12px 24px -12px rgba(14,156,142,.9);
  transition:.15s ease;
}

.tutorial-cta:hover{
  background:var(--teal-deep);
}

.tutorial-cta svg{
  width:16px;
  height:16px;
}

/* ---------- GRILLE TUTORIELS ---------- */
.tutorial-grid{
  display:flex;
  flex-wrap:wrap;
  gap:22px;
  justify-content:center;
}

.tutorial-card{
  appearance:none;
  -webkit-appearance:none;
  flex:1 1 300px;
  max-width:346px;
  min-width:270px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 2px 6px rgba(11,27,41,.04);
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  cursor:pointer;
  display:flex;
  flex-direction:column;
  padding:0;
  text-align:left;
  color:var(--ink);
  font:inherit;
}

.tutorial-card:hover{
  transform:translateY(-3px);
  box-shadow:0 20px 40px -22px rgba(11,27,41,.35);
  border-color:color-mix(in srgb,var(--accent) 40%,var(--line));
}

.tutorial-thumb{
  position:relative;
  aspect-ratio:16/9;
  background:var(--accent);
  display:flex;
  align-items:center;
  justify-content:center;
}

.tutorial-thumb::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(0,0,0,.28));
}

.tutorial-icon{
  position:absolute;
  top:13px;
  left:13px;
  z-index:1;
  width:38px;
  height:38px;
  border-radius:10px;
  background:rgba(255,255,255,.22);
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  backdrop-filter:blur(3px);
}

.tutorial-icon svg{
  width:19px;
  height:19px;
}

.tutorial-thumb-play{
  position:relative;
  z-index:1;
  width:54px;
  height:54px;
  border-radius:50%;
  background:rgba(255,255,255,.94);
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--ink);
  box-shadow:0 10px 24px -8px rgba(0,0,0,.45);
}

.tutorial-thumb-play svg{
  width:22px;
  height:22px;
  margin-left:3px;
}

.tutorial-thumb .tutorial-duration{
  bottom:11px;
  right:12px;
  font-size:11.5px;
  padding:4px 8px;
  border-radius:6px;
}

.tutorial-card-body{
  padding:17px 19px 19px;
}

.tutorial-level{
  font-size:11px;
  letter-spacing:1px;
  text-transform:uppercase;
  color:var(--accent);
  font-weight:700;
  margin-bottom:7px;
}

.tutorial-card h3{
  font-family:"Spectral",Georgia,serif;
  font-weight:600;
  font-size:18.5px;
  line-height:1.22;
  margin:0 0 7px;
  color:var(--ink);
}

.tutorial-card p{
  color:var(--ink-soft);
  font-size:13.4px;
  line-height:1.5;
  margin:0;
}

.tutorial-note{
  display:flex;
  gap:10px;
  align-items:flex-start;
  margin-top:38px;
  background:var(--mint);
  border:1px solid rgba(14,156,142,.22);
  border-radius:14px;
  padding:16px 18px;
  color:var(--ink);
  font-size:13.6px;
  line-height:1.5;
}

.tutorial-note svg{
  width:18px;
  height:18px;
  color:var(--teal-deep);
  flex:none;
  margin-top:1px;
}

@media(max-width:1000px){
  .tutorial-featured{
    grid-template-columns:1fr;
  }

  .tutorial-featured-meta{
    padding:0 4px 4px;
  }
}

@media(max-width:860px){
  .tutorial-main{
    padding:26px 20px 40px;
  }

  .tutorial-grid{
    justify-content:stretch;
  }

  .tutorial-card{
    max-width:none;
    min-width:100%;
  }
}

@media(max-width:560px){
  .tutorial-cta{
    width:100%;
    justify-content:center;
  }
}
`;
