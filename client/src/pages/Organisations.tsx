import RedactioLayout from "@/components/RedactioLayout";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  CalendarClock,
  Loader2,
  Plus,
  Settings2,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

type OrganisationItem = inferRouterOutputs<AppRouter>["organisations"]["list"][number];

const PLAN_LABELS: Record<string, string> = {
  essai: "Essai",
  standard: "Standard",
  premium: "Premium",
  entreprise: "Entreprise",
};

const STATUS_LABELS: Record<string, string> = {
  actif: "Convention active",
  suspendu: "Suspendue",
  expire: "Expirée",
  annule: "Annulée",
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Sans échéance";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

function statusVariant(status?: string | null) {
  if (status === "actif") return "default" as const;
  if (status === "suspendu") return "secondary" as const;
  return "outline" as const;
}

export default function Organisations() {
  const { data: orgs, refetch } = trpc.organisations.list.useQuery();
  const [open, setOpen] = useState(false);
  const [conventionOpen, setConventionOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganisationItem | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", type: "", contactEmail: "" });
  const [conventionForm, setConventionForm] = useState({
    plan: "entreprise",
    status: "actif",
    seats: "25",
    endDate: "",
  });

  const create = trpc.organisations.create.useMutation({
    onSuccess: () => { toast.success("Organisation créée."); refetch(); setOpen(false); setForm({ name: "", slug: "", type: "", contactEmail: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.organisations.update.useMutation({
    onSuccess: () => { toast.success("Organisation mise à jour."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const saveConvention = trpc.organisations.upsertSubscription.useMutation({
    onSuccess: () => {
      toast.success("Convention mise à jour.");
      refetch();
      setConventionOpen(false);
      setSelectedOrg(null);
    },
    onError: (e) => toast.error(e.message),
  });

  function openConvention(org: OrganisationItem) {
    setSelectedOrg(org);
    setConventionForm({
      plan: org.subscription?.plan ?? "entreprise",
      status: org.subscription?.status ?? "actif",
      seats: String(org.subscription?.seats ?? 25),
      endDate: org.subscription?.endDate
        ? new Date(org.subscription.endDate).toISOString().slice(0, 10)
        : "",
    });
    setConventionOpen(true);
  }

  function submitConvention() {
    if (!selectedOrg) return;
    const seats = Number(conventionForm.seats);
    if (!Number.isInteger(seats) || seats < 1) {
      toast.error("Le nombre de praticiens doit être supérieur à 0.");
      return;
    }
    saveConvention.mutate({
      organisationId: selectedOrg.id,
      plan: conventionForm.plan as "essai" | "standard" | "premium" | "entreprise",
      status: conventionForm.status as "actif" | "suspendu" | "expire" | "annule",
      seats,
      endDate: conventionForm.endDate,
    });
  }

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Back-office organisations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              État des conventions hospitalières, quotas de praticiens et accès établissements.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Nouvelle organisation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle organisation</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nom</Label>
                  <Input id="org-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="CHU de Paris" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Identifiant (slug)</Label>
                  <Input id="org-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="chu-paris" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-type">Type</Label>
                  <Input id="org-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="CHU, CH, Clinique…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Email de contact</Label>
                  <Input id="org-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="contact@chu-paris.fr" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.name || !form.slug}>
                  {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Organisations</div>
              <div className="text-2xl font-bold mt-1">{orgs?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Conventions actives</div>
              <div className="text-2xl font-bold mt-1">
                {orgs?.filter((org) => org.subscription?.status === "actif").length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Sièges contractualisés</div>
              <div className="text-2xl font-bold mt-1">
                {orgs?.reduce((total, org) => total + (org.subscription?.seats ?? 0), 0) ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!orgs ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : orgs.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">
              Aucune organisation enregistrée.
            </div>
          ) : (
            orgs.map((org) => (
              <Card key={org.id} className={!org.active ? "opacity-75" : undefined}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <div className="min-w-0">
                      <CardTitle className="text-sm">{org.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-mono">{org.slug}</span>
                        {org.type ? ` · ${org.type}` : ""}
                      </p>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-2">
                      <Badge variant={org.active ? "default" : "secondary"} className="text-xs">
                        {org.active ? "Organisation active" : "Organisation inactive"}
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{org.active ? "Accès ouvert" : "Accès coupé"}</span>
                        <Switch
                          checked={org.active}
                          disabled={update.isPending}
                          onCheckedChange={(active) => update.mutate({ id: org.id, active })}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Users className="w-3.5 h-3.5" />
                        Praticiens
                      </div>
                      <div className="mt-1">
                        <span className="text-base font-bold text-foreground">{org.userCount}</span>
                        <span> / {org.subscription?.seats ?? "non défini"} sièges</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Échéance
                      </div>
                      <div className="mt-1">{formatDate(org.subscription?.endDate)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {org.subscription ? (
                      <>
                        <Badge variant={statusVariant(org.subscription.status)} className="text-xs">
                          {STATUS_LABELS[org.subscription.status] ?? org.subscription.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Plan {PLAN_LABELS[org.subscription.plan] ?? org.subscription.plan}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Convention à configurer
                      </Badge>
                    )}
                    {org.contactEmail && <span className="ml-auto">Contact : {org.contactEmail}</span>}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openConvention(org)}
                    >
                      <Settings2 className="w-4 h-4" />
                      Configurer la convention
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={conventionOpen} onOpenChange={setConventionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>État de la convention</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-semibold">{selectedOrg?.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Configuration contractuelle des accès établissement et du nombre de praticiens autorisés.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select
                    value={conventionForm.plan}
                    onValueChange={(plan) => setConventionForm({ ...conventionForm, plan })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essai">Essai</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="entreprise">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>État</Label>
                  <Select
                    value={conventionForm.status}
                    onValueChange={(status) => setConventionForm({ ...conventionForm, status })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                      <SelectItem value="expire">Expiré</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seats">Nombre de praticiens autorisés</Label>
                  <Input
                    id="seats"
                    type="number"
                    min={1}
                    value={conventionForm.seats}
                    onChange={(e) => setConventionForm({ ...conventionForm, seats: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Date de fin de convention</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={conventionForm.endDate}
                    onChange={(e) => setConventionForm({ ...conventionForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConventionOpen(false)}>
                Annuler
              </Button>
              <Button onClick={submitConvention} disabled={saveConvention.isPending}>
                {saveConvention.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enregistrer l'état
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RedactioLayout>
  );
}
