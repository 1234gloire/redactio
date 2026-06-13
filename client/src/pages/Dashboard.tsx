import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Info,
  Shield,
  Stethoscope,
} from "lucide-react";
import { Link } from "wouter";

const VOLETS = [
  {
    id: "courrier_sortie",
    label: "Courrier de sortie",
    description: "Rédaction structurée du courrier de sortie d'hospitalisation.",
    icon: <FileText className="w-6 h-6" />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "conciliation",
    label: "Conciliation médicamenteuse",
    description: "Bilan de conciliation à l'admission, au transfert ou à la sortie.",
    icon: <Stethoscope className="w-6 h-6" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    id: "correspondance",
    label: "Correspondance médicale",
    description: "Rédaction de courriers entre professionnels de santé.",
    icon: <BookOpen className="w-6 h-6" />,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = (user as { role?: string })?.role ?? "praticien";

  return (
    <RedactioLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Bonjour{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur REDACTIO. Choisissez un volet pour démarrer une nouvelle rédaction.
          </p>
        </div>

        {/* Volets de génération */}
        {(userRole === "praticien" || userRole === "admin") && (
          <section aria-labelledby="volets-heading">
            <h2 id="volets-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Démarrer une rédaction
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {VOLETS.map((volet) => (
                <Link
                  key={volet.id}
                  href={`/redaction?volet=${volet.id}`}
                  className="volet-card group"
                  aria-label={`Démarrer ${volet.label}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${volet.bg} flex items-center justify-center ${volet.color}`}>
                    {volet.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground text-sm">{volet.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {volet.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium mt-auto">
                    <span>Démarrer</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Rappel de conformité */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Shield className="w-4 h-4" />
              Rappel de conformité RGPD
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-700/80 dark:text-blue-300/80 space-y-1">
            <p>
              <strong>Aucune donnée patient n'est stockée</strong> sur cette plateforme. Les données saisies
              et les documents générés existent uniquement en mémoire de session et sont purgés à la déconnexion.
            </p>
            <p>
              La pseudonymisation est appliquée automatiquement avant tout envoi au moteur IA.
              Vous restez l'unique auteur et responsable du document final.
            </p>
          </CardContent>
        </Card>

        {/* Accès rapide back-office */}
        {["editeur_medical", "relecteur_clinique", "responsable_conformite", "admin"].includes(userRole) && (
          <section aria-labelledby="backoffice-heading">
            <h2 id="backoffice-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Administration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/backoffice" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      Back-office de prompts
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Gérer les socles et templates de prompts, campagnes de non-régression.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              {userRole === "admin" && (
                <Link href="/organisations" className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Gestion des organisations
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Établissements, abonnements, utilisateurs.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </RedactioLayout>
  );
}
