import RedactioLayout from "@/components/RedactioLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  praticien: "Praticien",
  editeur_medical: "Éditeur médical",
  relecteur_clinique: "Relecteur clinique",
  responsable_conformite: "Resp. conformité",
  admin: "Administrateur",
};

export default function Utilisateurs() {
  const { data: users, refetch } = trpc.user.list.useQuery();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string | null; email: string | null } | null>(null);
  const setRole = trpc.user.setRole.useMutation({
    onSuccess: () => { toast.success("Rôle mis à jour."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur supprimé.");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion globale des comptes, rôles RBAC et suppressions admin.
            </p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 text-right">
            <div className="text-xs text-muted-foreground">Comptes</div>
            <div className="text-2xl font-bold">{users?.length ?? 0}</div>
          </div>
        </div>

        <div className="space-y-3">
          {!users ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aucun utilisateur enregistré.
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
                      <Badge variant={user.active ? "secondary" : "outline"} className="text-xs">
                        {user.active ? "Actif" : "Inactif"}
                      </Badge>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: user.id, name: user.name, email: user.email })}
                        aria-label="Supprimer l'utilisateur"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
                  <p>Rôle : <Badge variant={user.role === "admin" ? "destructive" : "outline"} className="text-[11px]">{ROLE_LABELS[user.role]}</Badge></p>
                  <p>Organisation : {user.organisationId ?? "Compte individuel"}</p>
                  <p>Dernière connexion : {new Date(user.lastSignedIn).toLocaleDateString("fr-FR")}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le compte {deleteTarget?.name || deleteTarget?.email || "sélectionné"} sera supprimé de REDACTIO.
                Cette action retire son accès à l'application.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && deleteUser.mutate({ userId: deleteTarget.id })}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RedactioLayout>
  );
}
