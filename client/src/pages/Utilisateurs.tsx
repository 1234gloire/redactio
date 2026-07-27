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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { Building2, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  praticien: "Praticien",
  org_admin: "Admin organisme",
  editeur_medical: "Éditeur médical",
  relecteur_clinique: "Relecteur clinique",
  responsable_conformite: "Resp. conformité",
  admin: "Administrateur",
};

export default function Utilisateurs() {
  const { user } = useAuth();
  const userRole = (user as { role?: string })?.role ?? "praticien";
  const isRedactioAdmin = userRole === "admin";
  const isOrgAdmin = userRole === "org_admin";
  const { data: users, refetch } = trpc.user.list.useQuery();
  const { data: orgs } = trpc.organisations.list.useQuery(undefined, {
    enabled: isRedactioAdmin,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string | null; email: string | null } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    organisationId: "",
    name: "",
    email: "",
    password: "",
    specialite: "",
    rpps: "",
  });

  const activePractitioners = users?.filter((item) => item.role === "praticien" && item.active).length ?? 0;
  const selectedOrg = isRedactioAdmin && form.organisationId
    ? orgs?.find((org) => org.id === Number(form.organisationId))
    : null;
  const orgLimit = selectedOrg?.subscription?.seats ?? null;
  const orgPractitionerCount = selectedOrg?.practitionerCount ?? null;
  const selectedOrgFull = Boolean(
    selectedOrg &&
      selectedOrg.subscription &&
      selectedOrg.subscription.status === "actif" &&
      selectedOrg.practitionerCount >= selectedOrg.subscription.seats
  );

  const setRole = trpc.user.setRole.useMutation({
    onSuccess: () => { toast.success("Rôle mis à jour."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createPractitioner = trpc.user.createPractitioner.useMutation({
    onSuccess: () => {
      toast.success("Praticien ajouté.");
      setCreateOpen(false);
      setForm({ organisationId: "", name: "", email: "", password: "", specialite: "", rpps: "" });
      refetch();
    },
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

  function submitCreatePractitioner() {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error("Nom, email et mot de passe de 8 caractères minimum sont requis.");
      return;
    }
    if (isRedactioAdmin && !form.organisationId) {
      toast.error("Sélectionnez l'organisation du praticien.");
      return;
    }
    createPractitioner.mutate({
      organisationId: isRedactioAdmin ? Number(form.organisationId) : undefined,
      name: form.name,
      email: form.email,
      password: form.password,
      specialite: form.specialite,
      rpps: form.rpps,
    });
  }

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isOrgAdmin ? "Praticiens de l'organisme" : "Utilisateurs"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isOrgAdmin
                ? "Ajoutez les praticiens de votre organisme, dans la limite contractuelle fixée par MEDACTIO."
                : "Gestion globale des comptes, rôles RBAC, organismes et suppressions admin."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-card px-4 py-3 text-right">
              <div className="text-xs text-muted-foreground">{isOrgAdmin ? "Praticiens actifs" : "Comptes"}</div>
              <div className="text-2xl font-bold">{isOrgAdmin ? activePractitioners : users?.length ?? 0}</div>
            </div>
            {(isOrgAdmin || isRedactioAdmin) && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Ajouter un praticien
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un praticien conventionné</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {isRedactioAdmin && (
                      <div className="space-y-2">
                        <Label>Organisation</Label>
                        <Select
                          value={form.organisationId}
                          onValueChange={(organisationId) => setForm({ ...form, organisationId })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir l'organisation" />
                          </SelectTrigger>
                          <SelectContent>
                            {orgs?.map((org) => (
                              <SelectItem key={org.id} value={String(org.id)}>
                                {org.name} · {org.practitionerCount}/{org.subscription?.seats ?? "?"} praticiens
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedOrg && (
                          <p className="text-xs text-muted-foreground">
                            Convention : {selectedOrg.subscription?.status ?? "non configurée"} · quota {orgPractitionerCount}/{orgLimit ?? "?"}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="practitioner-name">Nom complet</Label>
                      <Input id="practitioner-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practitioner-email">Email professionnel</Label>
                      <Input id="practitioner-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practitioner-password">Mot de passe temporaire</Label>
                      <Input id="practitioner-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="practitioner-specialite">Spécialité</Label>
                        <Input id="practitioner-specialite" value={form.specialite} onChange={(event) => setForm({ ...form, specialite: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="practitioner-rpps">RPPS</Label>
                        <Input
                          id="practitioner-rpps"
                          inputMode="numeric"
                          value={form.rpps}
                          onChange={(event) => setForm({ ...form, rpps: event.target.value.replace(/\D/g, "").slice(0, 11) })}
                        />
                      </div>
                    </div>
                    {selectedOrgFull && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        Limite contractuelle atteinte pour cette organisation.
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                    <Button onClick={submitCreatePractitioner} disabled={createPractitioner.isPending || selectedOrgFull}>
                      {createPractitioner.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Créer le praticien
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
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
                      {isRedactioAdmin ? (
                        <Select
                          value={user.role}
                          onValueChange={(role) => setRole.mutate({ userId: user.id, role: role as "praticien" | "org_admin" | "editeur_medical" | "relecteur_clinique" | "responsable_conformite" | "admin" })}
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
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={isOrgAdmin && user.role !== "praticien"}
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
                  <p className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Organisation : {user.organisationId ?? "Compte individuel"}
                  </p>
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
                Le compte {deleteTarget?.name || deleteTarget?.email || "sélectionné"} sera supprimé de MEDACTIO.
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
