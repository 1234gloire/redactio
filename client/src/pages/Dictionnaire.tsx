import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import RedactioLayout from "../components/RedactioLayout";

type Category =
  | "medicament"
  | "pathologie"
  | "symptome"
  | "anatomie"
  | "biologie"
  | "procedure"
  | "autre";

const CATEGORY_LABELS: Record<Category, string> = {
  medicament: "Médicament",
  pathologie: "Pathologie",
  symptome: "Symptôme",
  anatomie: "Anatomie",
  biologie: "Biologie",
  procedure: "Procédure",
  autre: "Autre",
};

const CATEGORY_COLORS: Record<Category, string> = {
  medicament: "bg-primary/10 text-primary",
  pathologie: "bg-destructive/10 text-destructive",
  symptome: "bg-warning/15 text-warning-foreground",
  anatomie: "bg-secondary text-secondary-foreground",
  biologie: "bg-muted text-muted-foreground",
  procedure: "bg-primary/10 text-primary",
  autre: "bg-muted text-muted-foreground",
};

interface TermForm {
  term: string;
  category: Category;
  synonyms: string; // comma-separated
  definition: string;
  source: string;
  code: string;
}

const EMPTY_FORM: TermForm = {
  term: "",
  category: "medicament",
  synonyms: "",
  definition: "",
  source: "",
  code: "",
};

export default function Dictionnaire() {
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState<number | null>(null);
  const [form, setForm] = useState<TermForm>(EMPTY_FORM);
  const [confirmDeactivate, setConfirmDeactivate] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.medical.list.useQuery(
    {
      page,
      pageSize,
      query: debouncedQuery || undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
    },
    { enabled: !!user }
  );

  const statsQuery = trpc.medical.stats.useQuery(undefined, { enabled: !!user });

  const createMutation = trpc.medical.create.useMutation({
    onSuccess: () => {
      toast.success("Terme créé avec succès");
      setShowCreateDialog(false);
      setForm(EMPTY_FORM);
      utils.medical.list.invalidate();
      utils.medical.stats.invalidate();
    },
    onError: (e) => toast.error(`Erreur : ${e.message}`),
  });

  const updateMutation = trpc.medical.update.useMutation({
    onSuccess: () => {
      toast.success("Terme mis à jour");
      setEditingTerm(null);
      setForm(EMPTY_FORM);
      utils.medical.list.invalidate();
    },
    onError: (e) => toast.error(`Erreur : ${e.message}`),
  });

  const deactivateMutation = trpc.medical.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Terme désactivé");
      setConfirmDeactivate(null);
      utils.medical.list.invalidate();
      utils.medical.stats.invalidate();
    },
    onError: (e) => toast.error(`Erreur : ${e.message}`),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  const handleSubmitCreate = () => {
    if (!form.term.trim()) {
      toast.error("Le terme est obligatoire");
      return;
    }
    createMutation.mutate({
      term: form.term.trim(),
      category: form.category,
      synonyms: form.synonyms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      definition: form.definition || undefined,
      source: form.source || undefined,
      code: form.code || undefined,
    });
  };

  const handleSubmitEdit = () => {
    if (!editingTerm || !form.term.trim()) return;
    updateMutation.mutate({
      id: editingTerm,
      term: form.term.trim(),
      category: form.category,
      synonyms: form.synonyms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      definition: form.definition || undefined,
      source: form.source || undefined,
      code: form.code || undefined,
    });
  };

  const openEdit = (term: {
    id: number;
    term: string;
    category: string;
    synonyms?: string | null;
    definition?: string | null;
    source?: string | null;
    code?: string | null;
  }) => {
    setEditingTerm(term.id);
    let synonymsArr: string[] = [];
    try {
      synonymsArr = JSON.parse(term.synonyms ?? "[]");
    } catch {}
    setForm({
      term: term.term,
      category: term.category as Category,
      synonyms: synonymsArr.join(", "),
      definition: term.definition ?? "",
      source: term.source ?? "",
      code: term.code ?? "",
    });
  };

  return (
    <RedactioLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dictionnaire médical</h1>
              <p className="text-sm text-muted-foreground">
                {statsQuery.data?.count ?? "…"} termes indexés — 7 catégories
              </p>
            </div>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setShowCreateDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un terme
          </Button>
        </div>

        {/* Statistiques par catégorie */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(selectedCategory === cat ? "all" : cat);
                setPage(1);
              }}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                selectedCategory === cat
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${CATEGORY_COLORS[cat]}`}>
                {label}
              </div>
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un terme médical…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select
                value={selectedCategory}
                onValueChange={(v) => { setSelectedCategory(v as Category | "all"); setPage(1); }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([cat, label]) => (
                    <SelectItem key={cat} value={cat}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tableau */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>
                {isLoading ? "Chargement…" : `${data?.total ?? 0} terme${(data?.total ?? 0) > 1 ? "s" : ""}`}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                Page {page} / {totalPages}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Terme</TableHead>
                    <TableHead className="w-[120px]">Catégorie</TableHead>
                    <TableHead>Synonymes</TableHead>
                    <TableHead className="hidden lg:table-cell">Définition</TableHead>
                    <TableHead className="w-[80px]">Code</TableHead>
                    <TableHead className="w-[70px] text-right">Usages</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : !data?.items.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Aucun terme trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((term) => {
                      let synonymsArr: string[] = [];
                      try { synonymsArr = JSON.parse((term.synonyms as string) ?? "[]"); } catch {}
                      return (
                        <TableRow key={term.id} className="group">
                          <TableCell className="font-medium">{term.term}</TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[term.category as Category]}`}>
                              {CATEGORY_LABELS[term.category as Category] ?? term.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {synonymsArr.slice(0, 3).join(", ")}
                            {synonymsArr.length > 3 && <span className="text-xs"> +{synonymsArr.length - 3}</span>}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[300px] truncate">
                            {term.definition}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {term.code}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {term.usageCount}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEdit({ ...term, synonyms: term.synonyms as string | null, definition: term.definition as string | null, source: term.source as string | null, code: term.code as string | null })}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setConfirmDeactivate(term.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data?.total ?? 0)} sur {data?.total ?? 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="gap-1"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Créer */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un terme médical</DialogTitle>
          </DialogHeader>
          <TermFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleSubmitCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Éditer */}
      <Dialog open={editingTerm !== null} onOpenChange={(open) => { if (!open) { setEditingTerm(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le terme</DialogTitle>
          </DialogHeader>
          <TermFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingTerm(null); setForm(EMPTY_FORM); }}>Annuler</Button>
            <Button onClick={handleSubmitEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmer désactivation */}
      <Dialog open={confirmDeactivate !== null} onOpenChange={(open) => { if (!open) setConfirmDeactivate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Désactiver ce terme ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Le terme sera masqué de l'autocomplétion mais conservé en base de données.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeactivate && deactivateMutation.mutate({ id: confirmDeactivate })}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Désactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RedactioLayout>
  );
}

function TermFormFields({
  form,
  setForm,
}: {
  form: TermForm;
  setForm: React.Dispatch<React.SetStateAction<TermForm>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Terme <span className="text-destructive">*</span></Label>
          <Input
            value={form.term}
            onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
            placeholder="Ex : Amoxicilline"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Catégorie <span className="text-destructive">*</span></Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([cat, label]) => (
                <SelectItem key={cat} value={cat}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Code (CIM-10 / LOINC / CCAM)</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Ex : J01CA04"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Synonymes (séparés par des virgules)</Label>
          <Input
            value={form.synonyms}
            onChange={(e) => setForm((f) => ({ ...f, synonyms: e.target.value }))}
            placeholder="Ex : Clamoxyl, Amoxil"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Définition</Label>
          <Textarea
            value={form.definition}
            onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))}
            placeholder="Courte définition clinique…"
            rows={3}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Source</Label>
          <Input
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            placeholder="Ex : VIDAL, CIM-10, LOINC, SNOMED"
          />
        </div>
      </div>
    </div>
  );
}
