import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, User } from "lucide-react";
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function Profil() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [specialite, setSpecialite] = useState("");
  const [rpps, setRpps] = useState("");

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => toast.success("Profil mis à jour."),
    onError: (e) => toast.error(e.message),
  });

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Profil & paramètres</h1>
            <p className="text-sm text-muted-foreground mt-1">Gérez vos informations professionnelles.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informations professionnelles</CardTitle>
            <CardDescription className="text-xs">
              Ces informations sont utilisées pour personnaliser les documents générés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profil-name">Nom complet</Label>
              <Input
                id="profil-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profil-specialite">Spécialité</Label>
              <Input
                id="profil-specialite"
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
                placeholder="Cardiologie, Médecine interne…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profil-rpps">Numéro RPPS</Label>
              <Input
                id="profil-rpps"
                value={rpps}
                onChange={(e) => setRpps(e.target.value)}
                placeholder="11 chiffres"
                maxLength={11}
                pattern="[0-9]{11}"
              />
              <p className="text-xs text-muted-foreground">
                Le numéro RPPS n'est jamais transmis au moteur IA.
              </p>
            </div>
            <Separator />
            <Button
              onClick={() => updateProfile.mutate({ name, specialite, rpps: rpps || undefined })}
              disabled={updateProfile.isPending}
              className="gap-2"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rôle</span>
              <span className="font-medium capitalize">{((user as { role?: string })?.role ?? "praticien").replace(/_/g, " ")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </RedactioLayout>
  );
}
