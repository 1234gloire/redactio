import RedactioLayout from "@/components/RedactioLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  praticien: "Praticien",
  editeur_medical: "Éditeur médical",
  relecteur_clinique: "Relecteur clinique",
  responsable_conformite: "Resp. conformité",
  admin: "Administrateur",
};

const ROLE_COLORS: Record<string, string> = {
  praticien: "secondary",
  editeur_medical: "default",
  relecteur_clinique: "outline",
  responsable_conformite: "outline",
  admin: "destructive",
};

export default function Utilisateurs() {
  // On liste les utilisateurs de l'organisation 1 par défaut (admin)
  const { data: users, refetch } = trpc.user.listByOrg.useQuery({ organisationId: 1 });
  const setRole = trpc.user.setRole.useMutation({
    onSuccess: () => { toast.success("Rôle mis à jour."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des comptes et des rôles RBAC.</p>
        </div>

        <div className="space-y-3">
          {!users ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aucun utilisateur dans cette organisation.
            </div>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {user.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{user.name ?? "Sans nom"}</CardTitle>
                        <p className="text-xs text-muted-foreground">{user.email ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(role) => setRole.mutate({ userId: user.id, role: role as "praticien" | "editeur_medical" | "relecteur_clinique" | "responsable_conformite" | "admin" })}
                      >
                        <SelectTrigger className="h-7 w-44 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>Dernière connexion : {new Date(user.lastSignedIn).toLocaleDateString("fr-FR")}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RedactioLayout>
  );
}
