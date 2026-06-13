import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  BookOpen,
  CheckCircle,
  FileText,
  Lock,
  Shield,
  Stethoscope,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const FEATURES = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Pseudonymisation automatique",
    description:
      "Filtre synchrone et bloquant : aucune donnée identifiante n'atteint le moteur IA. Détection par règles et NER.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Génération IA en temps réel",
    description:
      "Courriers de sortie, conciliation médicamenteuse, correspondances — en quelques secondes.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Éditeur riche intégré",
    description:
      "Relecture, édition et mise en évidence des zones à compléter avant validation et export local.",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Zéro stockage médical",
    description:
      "Aucun contenu médical n'est journalisé ni conservé. Purge automatique à la déconnexion.",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Prompts versionnés",
    description:
      "Back-office de prompts avec cycle de vie brouillon → candidat → publié, double validation clinique et conformité.",
  },
  {
    icon: <Stethoscope className="w-5 h-5" />,
    title: "RBAC médical",
    description:
      "5 rôles distincts : praticien, éditeur médical, relecteur clinique, responsable conformité, administrateur.",
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">REDACTIO</span>
          </div>
          <Button
            size="sm"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Se connecter
          </Button>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="py-20 md:py-28">
        <div className="container max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Plateforme conforme RGPD — Données pseudonymisées avant envoi à l'IA
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance leading-tight">
            L'assistant IA de rédaction{" "}
            <span className="text-primary">hospitalière</span>
          </h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            REDACTIO aide les praticiens à rédiger des courriers de sortie, bilans de conciliation
            médicamenteuse et correspondances médicales — en toute sécurité, sans stocker aucune
            donnée patient.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 w-full sm:w-auto"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Accéder à la plateforme
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Réservé aux professionnels de santé habilités.
          </p>
        </div>
      </section>

      {/* ─── Fonctionnalités ─── */}
      <section className="py-16 border-t border-border bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">
            Conçu pour l'environnement hospitalier
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Card key={i} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-5 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Garanties ─── */}
      <section className="py-16 border-t border-border">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Garanties de conformité
          </h2>
          <div className="space-y-3">
            {[
              "Pseudonymisation synchrone et bloquante avant tout appel au moteur IA",
              "Zéro journalisation du contenu médical saisi ou généré",
              "Export local uniquement — après validation explicite du praticien",
              "Back-office de prompts avec double validation clinique et conformité",
              "Journal d'audit technique sans contenu médical",
              "Architecture RBAC avec 5 rôles distincts et plan administratif isolé",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">REDACTIO</p>
          <p>Assistant IA de rédaction hospitalière — Plateforme sécurisée et conforme RGPD</p>
          <p className="mt-2">
            Ce service est un outil d'aide à la rédaction. Il ne se substitue pas au jugement clinique du praticien.
          </p>
        </div>
      </footer>
    </div>
  );
}
