import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircleQuestion } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

type Categorie = "Support Technique" | "Acces Licence" | "Facturation" | "Onboarding" | "Autre";

const CATEGORY_LABELS: Record<Categorie, string> = {
  "Support Technique": "Problème technique",
  "Acces Licence": "Accès ou compte",
  Facturation: "Facturation",
  Onboarding: "Prise en main",
  Autre: "Autre",
};

const EMPTY_FORM = { objet: "", description: "", categorie: "Support Technique" as Categorie, website: "" };

export default function SupportTicketButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [location] = useLocation();

  // Envoi non bloquant : la boîte de dialogue se ferme immédiatement, la requête part en
  // arrière-plan et le praticien peut continuer à rédiger sans attendre la réponse.
  // Le formulaire n'est réinitialisé qu'en cas de succès confirmé — en cas d'échec, le
  // brouillon reste disponible si le praticien rouvre "Besoin d'aide ?".
  const submitInBackground = (draft: typeof form) => {
    setSubmitting(true);
    fetch("/api/support/ticket", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objet: draft.objet.trim(),
        description: draft.description.trim() || undefined,
        categorie: draft.categorie,
        website: draft.website,
        contexte: {
          navigateur: navigator.userAgent,
          ecran: location,
        },
      }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "La demande n'a pas pu être transmise.");
        }
        toast.success("Votre demande a bien été transmise. Notre équipe vous répond sous 24 heures ouvrées.");
        setForm(EMPTY_FORM);
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? `${error.message} Écrivez-nous à support@medactio.fr.`
            : "Votre demande n'a pas pu être transmise. Écrivez-nous à support@medactio.fr."
        );
      })
      .finally(() => setSubmitting(false));
  };

  const handleSubmit = () => {
    if (form.objet.trim().length < 4) {
      toast.error("L'objet doit contenir au moins 4 caractères.");
      return;
    }
    submitInBackground(form);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="rl-help-fab"
        onClick={() => setOpen(true)}
        aria-label={
          submitting
            ? "Besoin d'aide ? Une demande précédente est en cours d'envoi."
            : "Besoin d'aide ? Ouvrir le formulaire d'assistance"
        }
      >
        {submitting ? <Loader2 className="animate-spin" /> : <MessageCircleQuestion />}
        <span>Besoin d'aide ?</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Besoin d'aide ?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-objet">
                Objet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ticket-objet"
                value={form.objet}
                onChange={(e) => setForm((f) => ({ ...f, objet: e.target.value }))}
                placeholder="Ex : Export du courrier de sortie impossible"
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-categorie">
                Catégorie <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.categorie}
                onValueChange={(v) => setForm((f) => ({ ...f, categorie: v as Categorie }))}
              >
                <SelectTrigger id="ticket-categorie">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [Categorie, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea
                id="ticket-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez votre demande…"
                rows={4}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                Merci de ne communiquer aucune donnée concernant un patient.
              </p>
            </div>

            {/* Champ piège anti-robot : invisible et inatteignable au clavier pour un humain. */}
            <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
              <label htmlFor="ticket-website">Site web</label>
              <input
                id="ticket-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>Envoyer la demande</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
