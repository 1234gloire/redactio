import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  AlertTriangle,
  BookOpen,
  PlayCircle,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "../contexts/ThemeContext";
import { trpc } from "../lib/trpc";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Nouvelle rédaction",
    href: "/redaction",
    icon: <FileText className="w-4 h-4" />,
    roles: ["praticien", "admin"],
  },
  {
    label: "Tutoriels",
    href: "/tutoriels",
    icon: <PlayCircle className="w-4 h-4" />,
  },
  {
    label: "Back-office prompts",
    href: "/backoffice",
    icon: <BookOpen className="w-4 h-4" />,
    roles: ["editeur_medical", "relecteur_clinique", "responsable_conformite", "admin"],
  },
  {
    label: "Organisations",
    href: "/organisations",
    icon: <Building2 className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Utilisateurs",
    href: "/utilisateurs",
    icon: <Users className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Journal d'audit",
    href: "/audit",
    icon: <Shield className="w-4 h-4" />,
    roles: ["admin", "responsable_conformite"],
  },
  {
    label: "Dictionnaire médical",
    href: "/dictionnaire",
    icon: <Library className="w-4 h-4" />,
    roles: ["admin"],
  },
];

interface RedactioLayoutProps {
  children: React.ReactNode;
}

export default function RedactioLayout({ children }: RedactioLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme: _toggleTheme } = useTheme();
  const toggleTheme = _toggleTheme ?? (() => {});
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">REDACTIO</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Assistant IA de rédaction hospitalière
            </h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous avec votre compte professionnel pour accéder à la plateforme.
            </p>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Se connecter
          </Button>
          <p className="text-xs text-muted-foreground">
            Plateforme réservée aux professionnels de santé habilités.
          </p>
        </div>
      </div>
    );
  }

  const userRole = (user as { role?: string })?.role ?? "praticien";
  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="redactio-app min-h-screen flex flex-col bg-background">
      {/* ─── Bannière d'avertissement permanente ─── */}
      <div className="redactio-warning-banner" role="alert" aria-live="polite">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>
          <strong>Avertissement :</strong> Ne saisissez aucun identifiant direct du patient
          (nom, prénom, numéro de sécurité sociale, date de naissance, adresse).
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar desktop ─── */}
        <aside
          className={cn(
            "hidden lg:flex flex-col w-60 border-r border-border bg-card",
            "shrink-0"
          )}
          aria-label="Navigation principale"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-none">REDACTIO</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rédaction hospitalière</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Menu principal">
            {visibleNav.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Profil utilisateur */}
          <div className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                  aria-label="Menu utilisateur"
                >
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {user?.name ?? "Praticien"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {userRole.replace(/_/g, " ")}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profil" className="flex items-center gap-2 w-full">
                    <Settings className="w-4 h-4" />
                    Profil & paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <><Sun className="w-4 h-4 mr-2" />Mode clair</>
                  ) : (
                    <><Moon className="w-4 h-4 mr-2" />Mode sombre</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* ─── Sidebar mobile ─── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative flex flex-col w-64 bg-card border-r border-border z-10 animate-slide-up">
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm text-foreground">REDACTIO</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Fermer le menu"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {visibleNav.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* ─── Contenu principal ─── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header mobile */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground">REDACTIO</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Changer le thème">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </TooltipContent>
            </Tooltip>
          </header>

          {/* Zone de contenu scrollable */}
          <main className="flex-1 overflow-y-auto" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
