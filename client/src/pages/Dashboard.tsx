import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Grid2X2,
  HelpCircle,
  Info,
  LayoutDashboard,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import { Link } from "wouter";

const VOLETS = [
  {
    id: "courrier_sortie",
    label: "Courrier de sortie",
    description: "Rédaction structurée du courrier de sortie d'hospitalisation.",
    icon: FileText,
    accent: "#0E9C8E",
    accentDeep: "#0A7B70",
  },
  {
    id: "conciliation",
    label: "Conciliation médicamenteuse",
    description: "Bilan de conciliation à l'admission, au transfert ou à la sortie.",
    icon: Stethoscope,
    accent: "#1E3A5F",
    accentDeep: "#1E3A5F",
  },
  {
    id: "correspondance",
    label: "Correspondance médicale",
    description: "Rédaction de courriers entre professionnels de santé.",
    icon: BookOpen,
    accent: "#C58A12",
    accentDeep: "#A0700C",
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  praticien: "Praticien",
  editeur_medical: "Éditeur médical",
  relecteur_clinique: "Relecteur clinique",
  responsable_conformite: "Responsable conformité",
};

function getInitials(name?: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFirstName(name?: string | null) {
  return name?.split(" ").filter(Boolean)[0] ?? "Docteur";
}

export default function Dashboard() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF3F5]">
        <div className="w-8 h-8 border-2 border-[#0E9C8E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userRole = (user as { role?: string })?.role ?? "praticien";
  const canManagePrompts = ["editeur_medical", "relecteur_clinique", "responsable_conformite", "admin"].includes(userRole);
  const isAdmin = userRole === "admin";

  return (
    <div className="redactio-dashboard">
      <style>{dashboardStyles}</style>
      <div className="rd-app">
        <aside className="rd-sidebar" aria-label="Navigation principale">
          <Link href="/dashboard" className="rd-brand" aria-label="REDACTIO - Tableau de bord">
            <span className="rd-mark">
              <FileText size={20} strokeWidth={1.8} />
            </span>
            <span>
              <span className="rd-name">REDACTIO</span>
              <br />
              <span className="rd-sub">Rédaction hospitalière</span>
            </span>
          </Link>

          <nav className="rd-nav" aria-label="Menu principal">
            <Link href="/dashboard" className="rd-link active" aria-current="page">
              <Grid2X2 size={18} strokeWidth={1.9} />
              Tableau de bord
            </Link>
            <Link href="/redaction" className="rd-link">
              <FileText size={18} strokeWidth={1.9} />
              Nouvelle rédaction
            </Link>

            <div className="rd-cap">Repères</div>
            <a href="#confidentialite" className="rd-link">
              <Shield size={18} strokeWidth={1.9} />
              Sécurité & données
            </a>
            <a href="#workflow" className="rd-link">
              <HelpCircle size={18} strokeWidth={1.9} />
              Aide
            </a>

            {canManagePrompts && (
              <Link href="/backoffice" className="rd-link">
                <BookOpen size={18} strokeWidth={1.9} />
                Back-office prompts
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/organisations" className="rd-link">
                  <LayoutDashboard size={18} strokeWidth={1.9} />
                  Organisations
                </Link>
                <Link href="/utilisateurs" className="rd-link">
                  <Users size={18} strokeWidth={1.9} />
                  Utilisateurs
                </Link>
              </>
            )}
          </nav>

          <Link href="/profil" className="rd-user">
            <span className="rd-avatar">{getInitials(user.name)}</span>
            <span>
              <span className="rd-uname">{user.name ?? "Utilisateur"}</span>
              <br />
              <span className="rd-urole">{ROLE_LABELS[userRole] ?? userRole}</span>
            </span>
            <ChevronRight className="rd-chev" size={16} strokeWidth={2} />
          </Link>
        </aside>

        <main className="rd-main">
          <div className="rd-warning" role="alert" aria-live="polite">
            <AlertTriangle size={18} strokeWidth={2} />
            <span>
              <b>Consigne de saisie :</b> n'indiquez aucun identifiant direct du patient — ni nom,
              prénom, n° de sécurité sociale, date de naissance ou adresse.
            </span>
          </div>

          <div className="rd-content">
            <h1 className="rd-greet">
              Bonjour, {getFirstName(user.name)} <span className="rd-wave">👋</span>
            </h1>
            <p className="rd-greet-sub">
              Choisissez un outil pour démarrer une nouvelle rédaction. Vos saisies restent en mémoire de session
              et sont effacées à la déconnexion.
            </p>

            <div className="rd-block-cap">Démarrer une rédaction</div>
            <div className="rd-cards">
              {VOLETS.map((volet) => {
                const Icon = volet.icon;
                return (
                  <Link
                    key={volet.id}
                    href={`/redaction?volet=${volet.id}`}
                    className="rd-card"
                    style={{
                      "--rd-ac": volet.accent,
                      "--rd-ac-deep": volet.accentDeep,
                    } as React.CSSProperties}
                    aria-label={`Démarrer ${volet.label}`}
                  >
                    <span className="rd-card-icon">
                      <Icon size={22} strokeWidth={1.7} />
                    </span>
                    <span className="rd-card-name">{volet.label}</span>
                    <span className="rd-card-description">{volet.description}</span>
                    <span className="rd-card-action">
                      Démarrer <ArrowRight className="rd-card-arrow" size={15} strokeWidth={2} />
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="rd-row">
              <section className="rd-panel" id="workflow" aria-labelledby="workflow-title">
                <h2 className="rd-panel-title" id="workflow-title">
                  <Clock3 size={18} strokeWidth={1.9} />
                  En trois temps
                </h2>
                <div className="rd-flow">
                  <div className="rd-step">
                    <span className="rd-step-number">01</span>
                    <div>
                      <div className="rd-step-title">Dictez ou collez vos notes</div>
                      <div className="rd-step-description">
                        Forme libre, abréviations admises — sans identifiant direct du patient.
                      </div>
                    </div>
                  </div>
                  <div className="rd-step">
                    <span className="rd-step-number">02</span>
                    <div>
                      <div className="rd-step-title">REDACTIO structure</div>
                      <div className="rd-step-description">
                        Pseudonymisation puis mise en sections du document choisi.
                      </div>
                    </div>
                  </div>
                  <div className="rd-step">
                    <span className="rd-step-number">03</span>
                    <div>
                      <div className="rd-step-title">Vous relisez & validez</div>
                      <div className="rd-step-description">
                        Vous corrigez et signez : le document final reste le vôtre.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rd-panel" id="confidentialite" aria-labelledby="privacy-title">
                <h2 className="rd-privacy-title" id="privacy-title">
                  <Shield size={18} strokeWidth={1.9} />
                  Confidentialité par conception
                </h2>
                <p className="rd-privacy-sub">
                  La conformité RGPD intégrée au fonctionnement de la plateforme.
                </p>
                <ul className="rd-privacy-list">
                  <li>
                    <Check size={16} strokeWidth={2.2} />
                    <span>
                      <b>Aucune donnée patient stockée.</b> Tout vit en mémoire de session, purgé à la déconnexion.
                    </span>
                  </li>
                  <li>
                    <Check size={16} strokeWidth={2.2} />
                    <span>
                      <b>Pseudonymisation automatique</b> avant tout envoi au moteur d'IA.
                    </span>
                  </li>
                  <li>
                    <Check size={16} strokeWidth={2.2} />
                    <span>
                      <b>Vous restez l'unique auteur</b> et responsable du document final.
                    </span>
                  </li>
                </ul>
                <div className="rd-privacy-note">session-only · pseudonymisation · aucune décision automatisée</div>
              </section>
            </div>

            {canManagePrompts && (
              <div className="rd-admin">
                <Info size={16} />
                <span>
                  Accès administrateur disponible : <Link href="/backoffice">ouvrir le back-office</Link>
                  {isAdmin ? <> · <Link href="/organisations">organisations</Link> · <Link href="/utilisateurs">utilisateurs</Link></> : null}
                </span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const dashboardStyles = `
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

.redactio-dashboard {
  --rd-ink:#0C1E2E;
  --rd-slate:#1E3A5F;
  --rd-soin:#0E9C8E;
  --rd-soin-deep:#0A7B70;
  --rd-paper:#FBFAF8;
  --rd-bg:#FFFFFF;
  --rd-mist:#EEF3F5;
  --rd-mist-deep:#E6EDF1;
  --rd-line:#D9E2E7;
  --rd-line-soft:#E8EEF1;
  --rd-seal:#C58A12;
  --rd-seal-bg:#FBF3DE;
  --rd-muted:#5A6B78;
  --rd-muted-light:#8497A2;
  --rd-serif:'Spectral',Georgia,serif;
  --rd-sans:'Hanken Grotesk',system-ui,sans-serif;
  --rd-mono:'JetBrains Mono',monospace;
  min-height: 100vh;
  background: var(--rd-mist);
  color: var(--rd-ink);
  font-family: var(--rd-sans);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.redactio-dashboard * {
  box-sizing: border-box;
}

.redactio-dashboard a {
  color: inherit;
  text-decoration: none;
}

.rd-app {
  display: grid;
  grid-template-columns: 268px 1fr;
  min-height: 100vh;
}

.rd-sidebar {
  background: var(--rd-bg);
  border-right: 1px solid var(--rd-line);
  display: flex;
  flex-direction: column;
  padding: 22px 18px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.rd-brand {
  display: flex;
  align-items: center;
  gap: .7em;
  padding: 6px 8px 22px;
}

.rd-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--rd-slate);
  display: grid;
  place-items: center;
  color: #fff;
  flex-shrink: 0;
}

.rd-name {
  font-weight: 800;
  letter-spacing: .04em;
  font-size: 1.02rem;
  line-height: 1;
}

.rd-sub {
  font-family: var(--rd-mono);
  font-size: .6rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--rd-muted);
  margin-top: 4px;
}

.rd-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.rd-cap {
  font-family: var(--rd-mono);
  font-size: .6rem;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: var(--rd-muted-light);
  padding: 14px 12px 6px;
}

.rd-link {
  display: flex;
  align-items: center;
  gap: .75em;
  padding: .7em .85em;
  border-radius: 10px;
  font-size: .93rem;
  font-weight: 500;
  color: var(--rd-muted);
  transition: background .15s,color .15s;
}

.rd-link svg {
  color: var(--rd-muted-light);
  transition: color .15s;
}

.rd-link:hover {
  background: var(--rd-mist);
  color: var(--rd-ink);
}

.rd-link.active {
  background: var(--rd-soin);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 8px 18px -10px rgba(14,156,142,.8);
}

.rd-link.active svg {
  color: #fff;
}

.rd-user {
  border-top: 1px solid var(--rd-line-soft);
  padding-top: 14px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: .7em;
  padding: 14px 8px 4px;
}

.rd-avatar {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: var(--rd-mist-deep);
  color: var(--rd-slate);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: .8rem;
  font-family: var(--rd-mono);
}

.rd-uname {
  font-weight: 600;
  font-size: .9rem;
  line-height: 1.1;
}

.rd-urole {
  font-size: .75rem;
  color: var(--rd-muted);
}

.rd-chev {
  margin-left: auto;
  color: var(--rd-muted-light);
}

.rd-main {
  display: flex;
  flex-direction: column;
}

.rd-warning {
  display: flex;
  align-items: center;
  gap: .7em;
  background: var(--rd-seal-bg);
  border-bottom: 1px solid #EBD9A8;
  padding: .85em 36px;
  font-size: .86rem;
  color: #7A5A0E;
}

.rd-warning svg {
  color: var(--rd-seal);
  flex-shrink: 0;
}

.rd-warning b {
  font-weight: 700;
}

.rd-content {
  padding: 40px 36px 48px;
  max-width: 1080px;
  width: 100%;
}

.rd-greet {
  font-family: var(--rd-serif);
  font-weight: 600;
  font-size: 2.1rem;
  letter-spacing: 0;
  display: flex;
  align-items: center;
  gap: .3em;
}

.rd-wave {
  font-size: 1.6rem;
}

.rd-greet-sub {
  color: var(--rd-muted);
  font-size: 1.02rem;
  margin-top: .35em;
  max-width: 52ch;
}

.rd-block-cap {
  font-family: var(--rd-mono);
  font-size: .68rem;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: var(--rd-muted);
  display: flex;
  align-items: center;
  gap: .7em;
  margin: 38px 0 18px;
}

.rd-block-cap::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--rd-line-soft);
}

.rd-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.rd-card {
  background: var(--rd-bg);
  border: 1px solid var(--rd-line);
  border-radius: 14px;
  padding: 24px 22px 20px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .22s ease, border-color .2s;
  display: flex;
  flex-direction: column;
  min-height: 230px;
}

.rd-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--rd-ac);
}

.rd-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 44px -26px rgba(12,30,46,.32);
  border-color: var(--rd-line-soft);
}

.rd-card-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--rd-ac);
  margin-bottom: 16px;
}

.rd-card-name {
  font-family: var(--rd-serif);
  font-weight: 600;
  font-size: 1.16rem;
  margin-bottom: .3em;
}

.rd-card-description {
  font-size: .86rem;
  color: var(--rd-muted);
  margin-bottom: 1.1em;
  flex: 1;
}

.rd-card-action {
  display: inline-flex;
  align-items: center;
  gap: .45em;
  font-weight: 600;
  font-size: .88rem;
  color: var(--rd-ac-deep);
}

.rd-card-arrow {
  transition: transform .18s;
}

.rd-card:hover .rd-card-arrow {
  transform: translateX(3px);
}

.rd-row {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 18px;
  margin-top: 18px;
}

.rd-panel {
  background: var(--rd-bg);
  border: 1px solid var(--rd-line);
  border-radius: 14px;
  padding: 24px 24px 22px;
}

.rd-panel-title,
.rd-privacy-title {
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: .55em;
  margin-bottom: 18px;
}

.rd-panel-title svg,
.rd-privacy-title svg {
  color: var(--rd-soin-deep);
}

.rd-flow {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rd-step {
  display: flex;
  gap: .85em;
  align-items: flex-start;
}

.rd-step-number {
  font-family: var(--rd-mono);
  font-size: .7rem;
  color: var(--rd-soin-deep);
  font-weight: 500;
  border: 1px solid var(--rd-line);
  border-radius: 7px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.rd-step-title {
  font-weight: 600;
  font-size: .9rem;
}

.rd-step-description {
  font-size: .82rem;
  color: var(--rd-muted);
}

.rd-privacy-title {
  color: var(--rd-slate);
  margin-bottom: 6px;
}

.rd-privacy-sub {
  font-size: .8rem;
  color: var(--rd-muted);
  margin-bottom: 16px;
}

.rd-privacy-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
}

.rd-privacy-list li {
  display: flex;
  gap: .7em;
  align-items: flex-start;
  font-size: .85rem;
}

.rd-privacy-list svg {
  color: var(--rd-soin);
  flex-shrink: 0;
  margin-top: 2px;
}

.rd-privacy-list b {
  font-weight: 700;
}

.rd-privacy-note {
  font-family: var(--rd-mono);
  font-size: .68rem;
  color: var(--rd-muted-light);
  letter-spacing: .04em;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--rd-line-soft);
}

.rd-admin {
  display: flex;
  align-items: center;
  gap: .55rem;
  color: var(--rd-muted);
  font-size: .82rem;
  margin-top: 18px;
}

.rd-admin svg {
  color: var(--rd-soin-deep);
}

.rd-admin a {
  color: var(--rd-soin-deep);
  font-weight: 700;
}

.redactio-dashboard :focus-visible {
  outline: 2px solid var(--rd-soin);
  outline-offset: 2px;
  border-radius: 6px;
}

@media (max-width: 980px) {
  .rd-app {
    grid-template-columns: 1fr;
  }

  .rd-sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--rd-line);
  }

  .rd-nav {
    flex: initial;
  }

  .rd-cards,
  .rd-row {
    grid-template-columns: 1fr;
  }

  .rd-content,
  .rd-warning {
    padding-left: 22px;
    padding-right: 22px;
  }
}
`;
