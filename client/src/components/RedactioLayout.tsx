import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { requiresIndividualPaymentActivation } from "@/lib/billingAccess";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  PlayCircle,
  Shield,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "../lib/trpc";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  section?: "main" | "admin" | "repere";
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: <LayoutDashboard />,
    section: "main",
  },
  {
    label: "Nouvelle rédaction",
    href: "/redaction",
    icon: <FileText />,
    roles: ["praticien", "org_admin", "admin"],
    section: "main",
  },
  {
    label: "Tutoriels",
    href: "/tutoriels",
    icon: <PlayCircle />,
    section: "main",
  },
  {
    label: "Sécurité & données",
    href: "/conformite",
    icon: <Shield />,
    section: "repere",
  },
  {
    label: "Aide",
    href: "/tutoriels",
    icon: <CircleHelp />,
    section: "repere",
  },
  {
    label: "Back-office prompts",
    href: "/backoffice",
    icon: <BookOpen />,
    roles: ["editeur_medical", "relecteur_clinique", "responsable_conformite", "admin"],
    section: "admin",
  },
  {
    label: "Organisations",
    href: "/organisations",
    icon: <Building2 />,
    roles: ["admin"],
    section: "admin",
  },
  {
    label: "Utilisateurs",
    href: "/utilisateurs",
    icon: <Users />,
    roles: ["admin", "org_admin"],
    section: "admin",
  },
  {
    label: "Journal d'audit",
    href: "/audit",
    icon: <Shield />,
    roles: ["admin", "responsable_conformite"],
    section: "admin",
  },
  {
    label: "Dictionnaire médical",
    href: "/dictionnaire",
    icon: <Library />,
    roles: ["admin"],
    section: "admin",
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  org_admin: "Admin organisme",
  praticien: "Praticien",
  editeur_medical: "Éditeur médical",
  relecteur_clinique: "Relecteur clinique",
  responsable_conformite: "Responsable conformité",
};

interface RedactioLayoutProps {
  children: React.ReactNode;
}

function initials(name?: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isActive(location: string, href: string) {
  return location === href || location.startsWith(`${href}/`);
}

export default function RedactioLayout({ children }: RedactioLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    if (location === "/paiement") return;
    if (!requiresIndividualPaymentActivation(user)) return;
    window.location.href = "/paiement";
  }, [isAuthenticated, loading, location, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6f7]">
        <div className="w-8 h-8 border-2 border-[#0e9c8e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f6f7] px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-[13px] bg-[#1e3a5f] text-white flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-['Spectral',Georgia,serif] text-2xl font-semibold text-[#0b1b29]">
              REDACTIO
            </h1>
            <p className="text-sm text-[#5a6b78] mt-1">
              Connectez-vous avec votre compte professionnel.
            </p>
          </div>
          <button
            className="w-full rounded-full bg-[#0e9c8e] px-5 py-3 font-bold text-white"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (requiresIndividualPaymentActivation(user) && location !== "/paiement") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6f7]">
        <div className="w-8 h-8 border-2 border-[#0e9c8e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userRole = (user as { role?: string })?.role ?? "praticien";
  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );
  const grouped = {
    main: visibleNav.filter((item) => item.section === "main"),
    repere: visibleNav.filter((item) => item.section === "repere"),
    admin: visibleNav.filter((item) => item.section === "admin"),
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(location, item.href);
    return (
      <Link
        key={`${item.section}-${item.href}-${item.label}`}
        href={item.href}
        className={`rl-nav-link ${active ? "active" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="rl-root">
      <style>{layoutStyles}</style>

      <div className="rl-warn" role="alert" aria-live="polite">
        <AlertTriangle aria-hidden="true" />
        <span>
          <b>Avertissement :</b> Ne saisissez aucun identifiant direct du patient
          (nom, prénom, numéro de sécurité sociale, date de naissance, adresse).
        </span>
      </div>

      <div className="rl-app">
        <aside className="rl-side" aria-label="Navigation principale">
          <Link href="/dashboard" className="rl-brand" aria-label="REDACTIO">
            <span className="rl-logo">
              <span className="rl-logo-mark">Rd</span>
            </span>
            <span>
              <span className="rl-name">REDACTIO</span>
              <span className="rl-sub">Rédaction hospitalière</span>
            </span>
          </Link>

          <nav className="rl-nav" aria-label="Menu principal">
            {grouped.main.map(renderNavItem)}
            <div className="rl-label">Repères</div>
            {grouped.repere.map(renderNavItem)}
            {grouped.admin.length > 0 && (
              <>
                <div className="rl-label">Administration</div>
                {grouped.admin.map(renderNavItem)}
              </>
            )}
          </nav>

          <Link
            href="/profil"
            className={`rl-user ${isActive(location, "/profil") ? "active" : ""}`}
            aria-current={isActive(location, "/profil") ? "page" : undefined}
          >
            <span className="rl-avatar">{initials(user?.name)}</span>
            <span className="rl-user-copy">
              <span className="rl-user-name">{user?.name ?? "Utilisateur"}</span>
              <span className="rl-user-role">{ROLE_LABELS[userRole] ?? userRole}</span>
            </span>
            <ChevronRight className="rl-user-chev" />
          </Link>

          <button
            type="button"
            className="rl-logout"
            onClick={() => {
              if (window.confirm("Se déconnecter de votre session REDACTIO ?")) {
                logoutMutation.mutate();
              }
            }}
            disabled={logoutMutation.isPending}
          >
            <LogOut />
            Se déconnecter
          </button>
        </aside>

        <main className="rl-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

const layoutStyles = `
@import url("https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap");

.rl-root{
  --ink:#0b1b29; --ink-soft:#5a6b78; --ink-faint:#8a99a4;
  --teal:#0e9c8e; --teal-deep:#0a7b70;
  --line:#e6edf0; --field:#f6f9f9; --mint:#eef6f4;
  --navy:#1e3a5f; --amber:#b9740a; --amber-bg:#fdf4e7; --amber-line:#f0dcb4;
  --red:#b3261e; --red-bg:#fdecea; --red-line:#f3c6c2; --bg:#f3f6f7;
  min-height:100vh;
  color:var(--ink);
  background:var(--bg);
  font-family:"Hanken Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}
.rl-root *{box-sizing:border-box}
.rl-warn{
  display:flex;align-items:center;gap:10px;
  background:var(--amber-bg);border-bottom:1px solid var(--amber-line);
  color:#7a5108;font-size:13.5px;font-weight:600;padding:12px 24px;
}
.rl-warn svg{width:17px;height:17px;flex:none;color:var(--amber)}
.rl-app{display:flex;min-height:calc(100vh - 45px)}
.rl-side{
  width:264px;flex:none;background:#fff;border-right:1px solid var(--line);
  display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:calc(100vh - 45px);
}
.rl-brand{display:flex;align-items:center;gap:11px;padding:4px 8px 24px;text-decoration:none;color:var(--ink)}
.rl-logo{width:42px;height:42px;border-radius:12px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px -8px rgba(30,58,95,.6);flex:none}
.rl-logo-mark{
  font-family:"Spectral",Georgia,serif;
  font-style:italic;
  font-weight:600;
  font-size:19px;
  letter-spacing:-1.5px;
  line-height:1;
  color:#fff;
  transform:translate(-1px,1px);
}
.rl-name{display:block;font-weight:800;font-size:17px;letter-spacing:.3px;line-height:1}
.rl-sub{display:block;font-size:9px;letter-spacing:2px;color:var(--ink-faint);text-transform:uppercase;margin-top:4px;font-weight:600}
.rl-nav{display:flex;flex-direction:column;gap:4px;overflow-y:auto;padding-right:2px}
.rl-nav-link{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:11px;text-decoration:none;color:var(--ink-soft);font-weight:600;font-size:14.5px;transition:.15s}
.rl-nav-link svg{width:18px;height:18px;flex:none}
.rl-nav-link:hover{background:var(--field);color:var(--ink)}
.rl-nav-link.active{background:var(--teal);color:#fff;box-shadow:0 10px 22px -10px rgba(14,156,142,.8)}
.rl-label{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--ink-faint);font-weight:700;padding:20px 13px 8px}
.rl-user{margin-top:auto;display:flex;align-items:center;gap:11px;padding:12px 10px;border-top:1px solid var(--line);text-decoration:none;border-radius:11px;color:var(--ink)}
.rl-user:hover{background:var(--field)}
.rl-user.active{background:var(--mint);border:1px solid rgba(14,156,142,.28)}
.rl-avatar{width:38px;height:38px;border-radius:10px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:none}
.rl-user-copy{min-width:0}
.rl-user-name{display:block;font-weight:700;font-size:14px;line-height:1.2;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:135px}
.rl-user-role{display:block;font-size:12px;color:var(--ink-faint)}
.rl-user.active .rl-user-role{color:var(--teal-deep);font-weight:700}
.rl-user-chev{margin-left:auto;color:var(--ink-faint);width:16px;height:16px;flex:none}
.rl-logout{
  margin-top:8px;display:flex;align-items:center;gap:9px;
  padding:10px 12px;border-radius:11px;border:1px solid var(--line);
  background:#fff;color:var(--ink-soft);font-weight:700;font-size:13px;
  cursor:pointer;text-decoration:none;transition:.15s;width:100%;font-family:inherit;
}
.rl-logout:hover{border-color:var(--red-line);background:var(--red-bg);color:var(--red)}
.rl-logout:disabled{opacity:.65;cursor:wait}
.rl-logout svg{width:16px;height:16px;flex:none}
.rl-main{flex:1;min-width:0;overflow:auto}
@media(max-width:860px){
  .rl-side{display:none}
  .rl-app{display:block}
  .rl-main{min-height:calc(100vh - 45px)}
  .rl-warn{align-items:flex-start;padding:10px 16px;font-size:12.5px}
}
`;
