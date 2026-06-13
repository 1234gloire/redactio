import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  FlaskConical,
  Loader2,
  Plus,
  Shield,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { cn } from "../lib/utils";
import { toast } from "sonner";

type PromptStatus = "brouillon" | "candidat" | "publie" | "retire";
type Volet = "courrier_sortie" | "conciliation" | "correspondance";

const STATUS_LABELS: Record<PromptStatus, string> = {
  brouillon: "Brouillon",
  candidat: "Candidat",
  publie: "Publié",
  retire: "Retiré",
};

const VOLET_LABELS: Record<Volet, string> = {
  courrier_sortie: "Courrier de sortie",
  conciliation: "Conciliation",
  correspondance: "Correspondance",
};

function StatusBadge({ status }: { status: PromptStatus }) {
  return (
    <span className={cn("status-badge", status)}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PromptCard({
  prompt,
  type,
  onRefetch,
  userRole,
}: {
  prompt: { id: number; version: string; status: string; content: string; name?: string; volet?: string; validatedClinical: boolean; validatedConformite: boolean; changelog?: string | null };
  type: "base" | "template";
  onRefetch: () => void;
  userRole: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(prompt.content);
  const [editChangelog, setEditChangelog] = useState("");

  const utils = trpc.useUtils();

  const updateBase = trpc.prompts.updateBase.useMutation({
    onSuccess: () => { toast.success("Socle mis à jour."); onRefetch(); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateTemplate = trpc.prompts.updateTemplate.useMutation({
    onSuccess: () => { toast.success("Template mis à jour."); onRefetch(); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const validateBase = trpc.prompts.validateBase.useMutation({
    onSuccess: () => { toast.success("Validation enregistrée."); onRefetch(); },
    onError: (e) => toast.error(e.message),
  });
  const validateTemplate = trpc.prompts.validateTemplate.useMutation({
    onSuccess: () => { toast.success("Validation enregistrée."); onRefetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleStatusChange = (newStatus: string) => {
    if (type === "base") {
      updateBase.mutate({ id: prompt.id, status: newStatus as PromptStatus });
    } else {
      updateTemplate.mutate({ id: prompt.id, status: newStatus as PromptStatus });
    }
  };

  const handleValidate = (validationType: "clinical" | "conformite") => {
    if (type === "base") {
      validateBase.mutate({ id: prompt.id, type: validationType });
    } else {
      validateTemplate.mutate({ id: prompt.id, type: validationType });
    }
  };

  const handleSaveEdit = () => {
    if (type === "base") {
      updateBase.mutate({ id: prompt.id, content: editContent, changelog: editChangelog });
    } else {
      updateTemplate.mutate({ id: prompt.id, content: editContent, changelog: editChangelog });
    }
  };

  const canValidateClinical = ["relecteur_clinique", "admin"].includes(userRole);
  const canValidateConformite = ["responsable_conformite", "admin"].includes(userRole);
  const canEdit = ["editeur_medical", "admin"].includes(userRole);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {prompt.name && (
                <CardTitle className="text-sm">{prompt.name}</CardTitle>
              )}
              <Badge variant="outline" className="text-xs font-mono">v{prompt.version}</Badge>
              <StatusBadge status={prompt.status as PromptStatus} />
              {prompt.volet && (
                <Badge variant="secondary" className="text-xs">
                  {VOLET_LABELS[prompt.volet as Volet]}
                </Badge>
              )}
            </div>
            {prompt.changelog && (
              <CardDescription className="text-xs">{prompt.changelog}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Modifier">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Modifier le {type === "base" ? "socle" : "template"}</DialogTitle>
                    <DialogDescription>
                      La modification crée une nouvelle version. Une campagne de non-régression sera nécessaire avant publication.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-content">Contenu du prompt</Label>
                      <Textarea
                        id="edit-content"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[300px] font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-changelog">Note de modification</Label>
                      <Input
                        id="edit-changelog"
                        value={editChangelog}
                        onChange={(e) => setEditChangelog(e.target.value)}
                        placeholder="Décrivez les modifications apportées…"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
                    <Button onClick={handleSaveEdit} disabled={updateBase.isPending || updateTemplate.isPending}>
                      {(updateBase.isPending || updateTemplate.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Réduire" : "Développer"}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Contenu du prompt */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-48 overflow-y-auto">
              {prompt.content}
            </pre>
          </div>

          <Separator />

          {/* Validations */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Validations requises avant publication
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {prompt.validatedClinical ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-xs text-foreground">Validation clinique</span>
                {!prompt.validatedClinical && canValidateClinical && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => handleValidate("clinical")}
                    disabled={validateBase.isPending || validateTemplate.isPending}
                  >
                    <Stethoscope className="w-3 h-3 mr-1" />
                    Valider
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {prompt.validatedConformite ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-xs text-foreground">Validation conformité</span>
                {!prompt.validatedConformite && canValidateConformite && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => handleValidate("conformite")}
                    disabled={validateBase.isPending || validateTemplate.isPending}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Valider
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Changement de statut */}
          {canEdit && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Changer le statut :</span>
              <Select
                value={prompt.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="candidat">Candidat</SelectItem>
                  <SelectItem
                    value="publie"
                    disabled={!prompt.validatedClinical || !prompt.validatedConformite}
                  >
                    Publié {(!prompt.validatedClinical || !prompt.validatedConformite) && "(validations requises)"}
                  </SelectItem>
                  <SelectItem value="retire">Retiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function Backoffice() {
  const { user } = useAuth();
  const userRole = (user as { role?: string })?.role ?? "praticien";
  const [newBaseOpen, setNewBaseOpen] = useState(false);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);

  // Formulaires de création
  const [newBase, setNewBase] = useState({ version: "", content: "", changelog: "" });
  const [newTemplate, setNewTemplate] = useState({
    volet: "courrier_sortie" as Volet,
    version: "",
    name: "",
    description: "",
    content: "",
    changelog: "",
  });

  const { data: bases, refetch: refetchBases } = trpc.prompts.listBases.useQuery();
  const { data: templates, refetch: refetchTemplates } = trpc.prompts.listTemplates.useQuery();
  const { data: testCases } = trpc.prompts.listTestCases.useQuery({});

  const createBase = trpc.prompts.createBase.useMutation({
    onSuccess: () => { toast.success("Socle créé."); refetchBases(); setNewBaseOpen(false); setNewBase({ version: "", content: "", changelog: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const createTemplate = trpc.prompts.createTemplate.useMutation({
    onSuccess: () => { toast.success("Template créé."); refetchTemplates(); setNewTemplateOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const initDefaults = trpc.prompts.initDefaults.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetchBases(); refetchTemplates(); },
    onError: (e) => toast.error(e.message),
  });

  const canEdit = ["editeur_medical", "admin"].includes(userRole);

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Back-office de prompts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion versionnée du socle commun et des templates par volet.
            </p>
          </div>
          {userRole === "admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => initDefaults.mutate()}
              disabled={initDefaults.isPending}
              className="gap-2"
            >
              {initDefaults.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Initialiser les défauts
            </Button>
          )}
        </div>

        <Tabs defaultValue="bases">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bases" className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Socles communs
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <Edit className="w-3.5 h-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Cas de test
            </TabsTrigger>
          </TabsList>

          {/* ─── Socles communs ─── */}
          <TabsContent value="bases" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Le socle commun encode les garde-fous transverses hérités par tous les templates.
              </p>
              {canEdit && (
                <Dialog open={newBaseOpen} onOpenChange={setNewBaseOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      Nouveau socle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nouveau socle commun</DialogTitle>
                      <DialogDescription>
                        Créez un nouveau socle de prompt. Il devra être validé cliniquement et en conformité avant publication.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="base-version">Version</Label>
                        <Input
                          id="base-version"
                          value={newBase.version}
                          onChange={(e) => setNewBase({ ...newBase, version: e.target.value })}
                          placeholder="ex. 1.1.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="base-content">Contenu du socle</Label>
                        <Textarea
                          id="base-content"
                          value={newBase.content}
                          onChange={(e) => setNewBase({ ...newBase, content: e.target.value })}
                          className="min-h-[250px] font-mono text-xs"
                          placeholder="Contenu du prompt de base…"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="base-changelog">Note de version</Label>
                        <Input
                          id="base-changelog"
                          value={newBase.changelog}
                          onChange={(e) => setNewBase({ ...newBase, changelog: e.target.value })}
                          placeholder="Décrivez les modifications…"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewBaseOpen(false)}>Annuler</Button>
                      <Button
                        onClick={() => createBase.mutate(newBase)}
                        disabled={createBase.isPending || !newBase.version || !newBase.content}
                      >
                        {createBase.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Créer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="space-y-3">
              {!bases ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : bases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun socle. Utilisez "Initialiser les défauts" pour créer les prompts de démarrage.
                </div>
              ) : (
                bases.map((base) => (
                  <PromptCard
                    key={base.id}
                    prompt={base}
                    type="base"
                    onRefetch={refetchBases}
                    userRole={userRole}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* ─── Templates ─── */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Chaque volet dispose d'un template qui est assemblé avec le socle actif lors de la génération.
              </p>
              {canEdit && (
                <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      Nouveau template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nouveau template de volet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Volet</Label>
                          <Select
                            value={newTemplate.volet}
                            onValueChange={(v) => setNewTemplate({ ...newTemplate, volet: v as Volet })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="courrier_sortie">Courrier de sortie</SelectItem>
                              <SelectItem value="conciliation">Conciliation</SelectItem>
                              <SelectItem value="correspondance">Correspondance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tpl-version">Version</Label>
                          <Input
                            id="tpl-version"
                            value={newTemplate.version}
                            onChange={(e) => setNewTemplate({ ...newTemplate, version: e.target.value })}
                            placeholder="ex. 1.0.0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tpl-name">Nom du template</Label>
                        <Input
                          id="tpl-name"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                          placeholder="ex. Courrier de sortie standard"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tpl-content">Contenu du template</Label>
                        <Textarea
                          id="tpl-content"
                          value={newTemplate.content}
                          onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                          className="min-h-[250px] font-mono text-xs"
                          placeholder="Utilisez {{DONNEES_MEDICALES}} pour injecter les données pseudonymisées…"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewTemplateOpen(false)}>Annuler</Button>
                      <Button
                        onClick={() => createTemplate.mutate(newTemplate)}
                        disabled={createTemplate.isPending || !newTemplate.version || !newTemplate.name || !newTemplate.content}
                      >
                        {createTemplate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Créer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="space-y-3">
              {!templates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun template. Utilisez "Initialiser les défauts" pour créer les templates de démarrage.
                </div>
              ) : (
                templates.map((tpl) => (
                  <PromptCard
                    key={tpl.id}
                    prompt={tpl}
                    type="template"
                    onRefetch={refetchTemplates}
                    userRole={userRole}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* ─── Cas de test ─── */}
          <TabsContent value="tests" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Banque de cas de test avec données fictives pseudonymisées. Ces cas servent aux campagnes de non-régression.
            </p>
            <div className="space-y-3">
              {!testCases ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : testCases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun cas de test. Utilisez "Initialiser les défauts" pour créer les cas de démarrage.
                </div>
              ) : (
                testCases.map((tc) => (
                  <Card key={tc.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">{tc.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {VOLET_LABELS[tc.volet as Volet]}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">v{tc.version}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                        {tc.inputData}
                      </pre>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RedactioLayout>
  );
}
