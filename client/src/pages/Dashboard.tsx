import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
import {
  ArrowRight,
  Bone,
  BookOpen,
  Check,
  Clock3,
  FilePenLine,
  FileText,
  Mic,
  Shield,
  Stethoscope,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "wouter";

const MODULES = [
  {
    id: "courrier_sortie",
    title: "Courrier de sortie",
    desc: "Rédaction structurée du courrier de sortie d'hospitalisation.",
    accent: "var(--teal)",
    Icon: FileText,
    href: "/redaction?volet=courrier_sortie",
  },
  {
    id: "conciliation",
    title: "Conciliation médicamenteuse",
    desc: "Bilan de conciliation à l'admission, au transfert ou à la sortie.",
    accent: "var(--navy)",
    Icon: Stethoscope,
    href: "/redaction?volet=conciliation",
  },
  {
    id: "correspondance",
    title: "Correspondance médicale",
    desc: "Rédaction de courriers entre professionnels de santé.",
    accent: "var(--gold)",
    Icon: BookOpen,
    href: "/redaction?volet=correspondance",
  },
  {
    id: "observation",
    title: "Observation médicale",
    desc: "Prise de notes, suivi journalier, transmissions ciblées.",
    accent: "var(--purple)",
    Icon: FilePenLine,
    href: "/redaction?volet=observation",
  },
  {
    id: "chirurgie_orthopedique",
    title: "Chirurgie orthopédique",
    desc: "Compte rendu opératoire et courrier de sortie structurés.",
    accent: "var(--blue)",
    Icon: Bone,
    href: "/redaction/chirurgie-orthopedique",
  },
];

function firstName(name?: string | null) {
  return name?.split(" ").filter(Boolean)[0] ?? "Docteur";
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="dashboard-step">
      <span>{n}</span>
      <div>
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6f7]">
        <div className="w-8 h-8 border-2 border-[#0e9c8e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <RedactioLayout>
      <style>{dashboardStyles}</style>
      <main className="dashboard-main">
        <h1 className="dashboard-title">
          Bonjour, <em>{firstName(user.name)}</em>.
        </h1>
        <p className="dashboard-subtitle">
          Choisissez un module pour démarrer. Vos saisies restent en mémoire de session et sont
          effacées à la déconnexion.
        </p>

        <div className="dashboard-pill">
          <b>NOUVEAU</b>
          <Mic aria-hidden="true" />
          Dictée vocale disponible dans les outils compatibles
        </div>

        <p className="dashboard-section-label">Démarrer une rédaction</p>

        <section className="dashboard-grid" aria-label="Modules de rédaction">
          {MODULES.map(({ id, title, desc, accent, Icon, href }) => (
            <Link
              key={id}
              href={href}
              className="dashboard-tool"
              style={{ "--accent": accent } as CSSProperties}
              aria-label={`Démarrer ${title}`}
            >
              <span className="dashboard-tool-icon">
                <Icon aria-hidden="true" />
              </span>
              <h2>{title}</h2>
              <p>{desc}</p>
              <span className="dashboard-tool-foot">
                <span className="dashboard-go">
                  Démarrer <ArrowRight aria-hidden="true" />
                </span>
                <span className="dashboard-dictee">
                  <Mic aria-hidden="true" />
                  dictée
                </span>
              </span>
            </Link>
          ))}
        </section>

        <section className="dashboard-panels">
          <div className="dashboard-panel">
            <h2>
              <Clock3 aria-hidden="true" />
              En trois temps
            </h2>
            <p className="dashboard-panel-intro">
              Un flux simple, de la note brute au document prêt à signer.
            </p>
            <Step
              n="01"
              title="Dictez ou collez vos notes"
              desc="Forme libre, abréviations admises — sans identifiant direct du patient."
            />
            <Step
              n="02"
              title="REDACTIO structure"
              desc="Pseudonymisation puis mise en sections du document choisi."
            />
            <Step
              n="03"
              title="Vous relisez et validez"
              desc="Chaque document reste sous votre contrôle avant signature."
            />
          </div>

          <div className="dashboard-panel">
            <h2>
              <Shield aria-hidden="true" />
              Conformité données de santé
            </h2>
            <p className="dashboard-panel-intro">
              Les exigences RGPD et de protection des données de santé, intégrées au fonctionnement
              de la plateforme.
            </p>
            <div className="dashboard-chips">
              <span>RGPD</span>
              <span>HDS</span>
              <span>Secret médical</span>
              <span>Pseudonymisation</span>
            </div>
            <div className="dashboard-ok">
              <Check aria-hidden="true" />
              <p><b>Aucune donnée patient stockée.</b> Tout vit en mémoire de session et disparaît à la déconnexion.</p>
            </div>
            <div className="dashboard-ok">
              <Check aria-hidden="true" />
              <p><b>Vous validez chaque document</b> avant tout usage clinique.</p>
            </div>
          </div>
        </section>
      </main>
    </RedactioLayout>
  );
}

const dashboardStyles = `
.dashboard-main{
  --ink:#0b1b29; --ink-soft:#5a6b78; --ink-faint:#8a99a4;
  --teal:#0e9c8e; --teal-deep:#0a7b70;
  --line:#e6edf0; --field:#f6f9f9; --mint:#eef6f4;
  --navy:#1e3a5f; --gold:#c58a17; --purple:#6d5bd0; --blue:#2f6fb0;
  width:100%;
  max-width:1180px;
  padding:34px 40px 48px;
  color:var(--ink);
}
.dashboard-main *{box-sizing:border-box}
.dashboard-title{font-family:"Spectral",Georgia,serif;font-weight:600;font-size:29px;letter-spacing:-.2px;margin:0 0 6px}
.dashboard-title em{font-style:italic;color:var(--teal-deep)}
.dashboard-subtitle{color:var(--ink-soft);font-size:14.5px;margin:0 0 20px;max-width:640px;line-height:1.55}
.dashboard-pill{display:inline-flex;align-items:center;gap:9px;background:var(--mint);border:1px solid rgba(14,156,142,.25);border-radius:999px;padding:8px 15px;font-size:13px;color:var(--ink);margin-bottom:30px}
.dashboard-pill b{background:var(--teal);color:#fff;font-size:10.5px;letter-spacing:1px;padding:3px 8px;border-radius:6px;font-weight:800}
.dashboard-pill svg{width:15px;height:15px;color:var(--teal-deep)}
.dashboard-section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-faint);font-weight:700;margin:0 0 16px}
.dashboard-grid{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;margin-bottom:36px}
.dashboard-tool{flex:1 1 300px;max-width:340px;min-width:270px;background:#fff;border:1px solid var(--line);border-radius:16px;border-top:3px solid var(--accent,var(--teal));padding:24px 24px 20px;display:flex;flex-direction:column;box-shadow:0 2px 6px rgba(11,27,41,.04);transition:.18s;text-decoration:none;color:var(--ink)}
.dashboard-tool:hover{transform:translateY(-3px);box-shadow:0 20px 40px -22px rgba(11,27,41,.35)}
.dashboard-tool-icon{width:52px;height:52px;border-radius:13px;background:var(--accent,var(--teal));color:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.dashboard-tool-icon svg{width:25px;height:25px}
.dashboard-tool h2{font-family:"Spectral",Georgia,serif;font-weight:600;font-size:20px;line-height:1.2;margin:0 0 9px}
.dashboard-tool p{color:var(--ink-soft);font-size:13.7px;line-height:1.5;margin:0 0 22px;flex:1}
.dashboard-tool-foot{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dashboard-go{display:inline-flex;align-items:center;gap:6px;color:var(--accent,var(--teal));font-weight:700;font-size:14px}
.dashboard-go svg{width:16px;height:16px}
.dashboard-dictee{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--ink-faint);background:var(--field);border:1px solid var(--line);border-radius:999px;padding:5px 10px;font-weight:600}
.dashboard-dictee svg{width:12px;height:12px}
.dashboard-panels{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.dashboard-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px 28px;box-shadow:0 2px 6px rgba(11,27,41,.04)}
.dashboard-panel h2{display:flex;align-items:center;gap:9px;font-family:"Spectral",Georgia,serif;font-weight:600;font-size:18px;margin:0 0 6px}
.dashboard-panel h2 svg{width:19px;height:19px;color:var(--teal-deep)}
.dashboard-panel-intro{color:var(--ink-soft);font-size:13.5px;margin:0 0 18px}
.dashboard-step{display:flex;gap:14px;margin-bottom:16px}
.dashboard-step:last-child{margin-bottom:0}
.dashboard-step > span{flex:none;width:30px;height:30px;border:1.5px solid var(--line);border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--teal-deep);font-weight:600}
.dashboard-step strong{display:block;font-weight:700;font-size:14px;margin-bottom:2px}
.dashboard-step p{font-size:13px;color:var(--ink-soft);line-height:1.45;margin:0}
.dashboard-chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 18px}
.dashboard-chips span{font-size:12px;font-weight:600;color:var(--ink-soft);background:var(--field);border:1px solid var(--line);border-radius:999px;padding:6px 12px}
.dashboard-ok{display:flex;gap:9px;font-size:13.5px;color:var(--ink);line-height:1.45;margin-bottom:12px}
.dashboard-ok:last-child{margin-bottom:0}
.dashboard-ok svg{width:17px;height:17px;color:var(--teal);flex:none;margin-top:1px}
.dashboard-ok p{margin:0}
.dashboard-ok b{font-weight:700}
@media(max-width:1080px){.dashboard-panels{grid-template-columns:1fr}}
@media(max-width:860px){.dashboard-main{padding:26px 20px}.dashboard-tool{max-width:none}}
`;
