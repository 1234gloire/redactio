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
import { Building2, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function Organisations() {
  const { data: orgs, refetch } = trpc.organisations.list.useQuery();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", type: "", contactEmail: "" });

  const create = trpc.organisations.create.useMutation({
    onSuccess: () => { toast.success("Organisation créée."); refetch(); setOpen(false); setForm({ name: "", slug: "", type: "", contactEmail: "" }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Organisations</h1>
            <p className="text-sm text-muted-foreground mt-1">Établissements et structures abonnées à REDACTIO.</p>
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
              <Card key={org.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm">{org.name}</CardTitle>
                    <Badge variant={org.active ? "default" : "secondary"} className="text-xs ml-auto">
                      {org.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Slug : <span className="font-mono">{org.slug}</span></p>
                  {org.type && <p>Type : {org.type}</p>}
                  {org.contactEmail && <p>Contact : {org.contactEmail}</p>}

                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RedactioLayout>
  );
}
