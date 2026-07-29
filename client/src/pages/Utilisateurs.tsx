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
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

const ROLE_LABELS: Record<string, string> = {
  praticien: "Praticien",
  org_admin: "Admin organisme",
  editeur_medical: "Éditeur médical",
  relecteur_clinique: "Relecteur clinique",
  responsable_conformite: "Resp. conformité",
  admin: "Administrateur",
};

type PathView = "conventions" | "libre";

type UserRow = inferRouterOutputs<AppRouter>["user"]["list"][number];
type OrganisationRow = inferRouterOutputs<AppRouter>["organisations"]["list"][number];

export default function Utilisateurs() {
  const { user } = useAuth();
  const userRole = (user as { role?: string })?.role ?? "praticien";
  const isRedactioAdmin = userRole === "admin";
  const isOrgAdmin = userRole === "org_admin";
  const organisationId = (user as { organisationId?: number | null })?.organisationId ?? undefined;

  const { data: users, refetch } = trpc.user.list.useQuery();
  const { data: orgs } = trpc.organisations.list.useQuery(undefined, {
    enabled: isRedactioAdmin,
  });
  const { data: currentOrg } = trpc.organisations.get.useQuery(
    { id: organisationId ?? 0 },
    { enabled: isOrgAdmin && Boolean(organisationId) }
  );

  // Navigation à deux chemins (uniquement pour l'admin RÉDACTIO)
  const [pathView, setPathView] = useState<PathView | null>(null);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<number>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string | null; email: string | null } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: number; name: string | null; email: string | null; } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    organisationId: "",
    name: "",
    email: "",
    password: "",
    specialite: "",
    rpps: "",
  });

  const showOrgSelect = isRedactioAdmin && pathView === "conventions";

  const activePractitioners = users?.filter((item) => item.role === "praticien" && item.active).length ?? 0;

  // Praticiens libres = rôle praticien ET sans organisation rattachée
  // (exclut les org_admin / admin sans organisationId renseigné)
  const freePractitioners = useMemo<UserRow[]>(
    () => (users ?? []).filter((u) => !u.organisationId && u.role === "praticien"),
    [users]
  );

  const sortedOrgs = useMemo(() => {
    if (!orgs) return { active: [] as OrganisationRow[], inactive: [] as OrganisationRow[] };
    const active = orgs.filter((o) => o.subscription?.status === "actif");
    const inactive = orgs.filter((o) => o.subscription?.status !== "actif");
    return { active, inactive };
  }, [orgs]);

  const usersByOrg = useMemo(() => {
    const map = new Map<number, UserRow[]>();
    (users ?? []).forEach((u) => {
      if (!u.organisationId) return;
      const list = map.get(u.organisationId) ?? [];
      list.push(u);
      map.set(u.organisationId, list);
    });
    return map;
  }, [users]);

  const selectedOrg = showOrgSelect && form.organisationId
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

  const getOrganisationName = (orgId?: number | null) => {
    if (!orgId) {
      return "Praticien libre";
    }
    if (isRedactioAdmin) {
      return orgs?.find((org) => org.id === orgId)?.name ?? `Organisation #${orgId}`;
    }
    return currentOrg?.name ?? `Organisation #${orgId}`;
  };

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
  const deactivateUserMutation = trpc.user.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur désactivé.");
      setDeactivateTarget(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur supprimé.");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  function toggleOrg(id: number) {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function openCreateDialog(presetOrgId?: number) {
    setForm({
      organisationId: presetOrgId ? String(presetOrgId) : "",
      name: "",
      email: "",
      password: "",
      specialite: "",
      rpps: "",
    });
    setCreateOpen(true);
  }

  function submitCreatePractitioner() {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error("Nom, email et mot de passe de 8 caractères minimum sont requis.");
      return;
    }
    if (showOrgSelect && !form.organisationId) {
      toast.error("Sélectionnez l'organisation du praticien.");
      return;
    }
    createPractitioner.mutate({
      organisationId: showOrgSelect ? Number(form.organisationId) : undefined,
      name: form.name,
      email: form.email,
      password: form.password,
      specialite: form.specialite,
      rpps: form.rpps,
    });
  }

  function renderPractitionerRow(item: UserRow) {
    return (
      <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {item.name ? item.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{item.name ?? "Sans nom"}</p>
            <p className="text-xs text-muted-foreground truncate">{item.email ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={item.active ? "secondary" : "outline"} className="text-[11px]">
            {item.active ? "Actif" : "Inactif"}
          </Badge>
          {isRedactioAdmin && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                disabled={!item.active}
                onClick={() =>
                  setDeactivateTarget({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                  })
                }
                aria-label="Désactiver l'utilisateur"
                title={item.active ? "Désactiver" : "Utilisateur déjà inactif"}
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() =>
                  setDeleteTarget({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                  })
                }
                aria-label="Supprimer définitivement l'utilisateur"
                title="Supprimer définitivement"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const createDialog = (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {showOrgSelect ? "Ajouter un praticien conventionné" : "Ajouter un praticien libre"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {showOrgSelect && (
            <div className="space-y-2">
              <Label>Organisation</Label>
              <Select
                value={form.organisationId}
                onValueChange={(orgId) => setForm({ ...form, organisationId: orgId })}
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
          <Button onClick={submitCreatePractitioner} disabled={createPractitioner.isPending || (showOrgSelect && selectedOrgFull)}>
            {createPractitioner.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le praticien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const deactivateDialog = (
    <AlertDialog
      open={Boolean(deactivateTarget)}
      onOpenChange={(open) => !open && setDeactivateTarget(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Désactiver cet utilisateur ?</AlertDialogTitle>

          <AlertDialogDescription>
            Le compte{" "}
            {deactivateTarget?.name ||
              deactivateTarget?.email ||
              "sélectionné"}{" "}
            sera conservé, mais l’utilisateur ne pourra plus accéder à MEDACTIO.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>

          <AlertDialogAction
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={() =>
              deactivateTarget &&
              deactivateUserMutation.mutate({
                userId: deactivateTarget.id,
              })
            }
            disabled={deactivateUserMutation.isPending}
          >
            {deactivateUserMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Désactiver
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const deleteDialog = (
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le compte {deleteTarget?.name || deleteTarget?.email || "sélectionné"} sera supprimé de MEDACTIO.
           Cette action est définitive : le compte et ses données associées seront supprimés de MEDACTIO.
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
  );

  // ---- Vue org_admin : inchangée, liste unique des praticiens de son organisme ----
  if (isOrgAdmin) {
    return (
      <RedactioLayout>
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Praticiens de l'organisme</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez les praticiens de votre organisme, dans la limite contractuelle fixée par MEDACTIO.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border bg-card px-4 py-3 text-right">
                <div className="text-xs text-muted-foreground">Praticiens actifs</div>
                <div className="text-2xl font-bold">{activePractitioners}</div>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => openCreateDialog()}>
                <Plus className="h-4 w-4" />
                Ajouter un praticien
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {!users ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Aucun utilisateur enregistré.</div>
            ) : (
              users.map((item) => renderPractitionerRow(item))
            )}
          </div>
        </div>
        {createDialog}
        {deactivateDialog}
        {deleteDialog}
      </RedactioLayout>
    );
  }

  // ---- Vue admin RÉDACTIO : écran d'arrivée à deux chemins ----
  if (isRedactioAdmin && !pathView) {
    return (
      <RedactioLayout>
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion globale des comptes, rôles RBAC, organismes et suppressions admin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer transition hover:border-primary hover:shadow-sm"
              onClick={() => setPathView("conventions")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Conventions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organismes conventionnés, quotas de praticiens et informations associées.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  {orgs ? `${orgs.length} organisation(s)` : "Chargement…"}
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition hover:border-primary hover:shadow-sm"
              onClick={() => setPathView("libre")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserRound className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Praticien libre</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Praticiens sans organisme rattaché et leurs informations.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  {users ? `${freePractitioners.length} praticien(s)` : "Chargement…"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        {createDialog}
        {deactivateDialog}
        {deleteDialog}
      </RedactioLayout>
    );
  }

  // ---- Vue admin RÉDACTIO : Conventions (pas de création de praticien ici — c'est le rôle de l'admin d'organisme) ----
  if (isRedactioAdmin && pathView === "conventions") {
    return (
      <RedactioLayout>
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => setPathView(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour
              </button>
              <h1 className="text-xl font-bold text-foreground">Conventions</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Organismes conventionnés, triés par statut, avec leur effectif de praticiens.
              </p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 text-right">
              <div className="text-xs text-muted-foreground">Organisations</div>
              <div className="text-2xl font-bold">{orgs?.length ?? 0}</div>
            </div>
          </div>

          {!orgs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : orgs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Aucune organisation conventionnée.</div>
          ) : (
            <div className="space-y-6">
              {([
                { label: "Actives", items: sortedOrgs.active },
                { label: "Inactives", items: sortedOrgs.inactive },
              ] as const).map(({ label, items }) =>
                items.length > 0 ? (
                  <div key={label} className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {label} ({items.length})
                    </h2>
                    <div className="space-y-3">
                      {items.map((org) => {
                        const isExpanded = expandedOrgs.has(org.id);
                        const orgPractitioners = usersByOrg.get(org.id) ?? [];
                        const isActive = org.subscription?.status === "actif";
                        return (
                          <Card key={org.id}>
                            <CardHeader
                              className="pb-2 cursor-pointer select-none"
                              onClick={() => toggleOrg(org.id)}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  )}
                                  <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <CardTitle className="text-sm truncate">{org.name}</CardTitle>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {org.practitionerCount}/{org.subscription?.seats ?? "?"} praticiens
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={isActive ? "secondary" : "outline"} className="text-xs shrink-0">
                                  {org.subscription?.status ?? "non configurée"}
                                </Badge>
                              </div>
                            </CardHeader>
                            {isExpanded && (
                              <CardContent className="space-y-2 pt-0">
                                {orgPractitioners.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2">
                                    Aucun praticien rattaché à cette organisation.
                                  </p>
                                ) : (
                                  orgPractitioners.map((item) => renderPractitionerRow(item))
                                )}
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
        {createDialog}
        {deactivateDialog}
        {deleteDialog}
      </RedactioLayout>
    );
  }

  // ---- Vue admin RÉDACTIO : Praticien libre ----
  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => setPathView(null)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour
            </button>
            <h1 className="text-xl font-bold text-foreground">Praticien libre</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Praticiens sans organisme conventionné rattaché.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-card px-4 py-3 text-right">
              <div className="text-xs text-muted-foreground">Praticiens libres</div>
              <div className="text-2xl font-bold">{freePractitioners.length}</div>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => openCreateDialog()}>
              <Plus className="h-4 w-4" />
              Ajouter un praticien
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {!users ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : freePractitioners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aucun praticien libre enregistré.
            </div>
          ) : (
            freePractitioners.map((item) => renderPractitionerRow(item))
          )}
        </div>
      </div>
      {createDialog}
      {deactivateDialog}
      {deleteDialog}
    </RedactioLayout>
  );
}
