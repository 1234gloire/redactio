import { useAuth } from "@/_core/hooks/useAuth";
import RedactioLayout from "@/components/RedactioLayout";
import {
  AlertTriangle,
  Check,
  CircleX,
  Clock,
  RotateCw,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  praticien: "Praticien",
  editeur_medical: "Éditeur médical",
  relecteur_clinique: "Relecteur clinique",
  responsable_conformite: "Responsable conformité",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Profil() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [specialite, setSpecialite] = useState((user as { specialite?: string })?.specialite ?? "");
  const [rpps, setRpps] = useState((user as { rpps?: string })?.rpps ?? "");
  const [subscriptionState, setSubscriptionState] = useState<"active" | "confirm" | "cancelled">("active");

  useEffect(() => {
    setName(user?.name ?? "");
    setSpecialite((user as { specialite?: string })?.specialite ?? "");
    setRpps((user as { rpps?: string })?.rpps ?? "");
  }, [user]);

  const accessDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 21);
    return formatDate(date);
  }, []);

  const role = (user as { role?: string })?.role ?? "praticien";

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => toast.success("Profil mis à jour."),
    onError: (e) => toast.error(e.message),
  });

  return (
    <RedactioLayout>
      <style>{profileStyles}</style>
      <main className="profile-main">
        <header className="profile-head">
          <User aria-hidden="true" />
          <div>
            <h1>Profil &amp; paramètres</h1>
            <p>Gérez vos informations professionnelles et votre abonnement.</p>
          </div>
        </header>

        <section className="profile-card">
          <h2>Informations professionnelles</h2>
          <p className="intro">
            Ces informations sont utilisées pour personnaliser les documents générés.
          </p>

          <label className="profile-field">
            <span>Nom complet</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="profile-field">
            <span>Spécialité</span>
            <input
              value={specialite}
              onChange={(event) => setSpecialite(event.target.value)}
              placeholder="Cardiologie, Médecine interne..."
            />
          </label>

          <label className="profile-field">
            <span>Numéro RPPS</span>
            <input
              value={rpps}
              onChange={(event) => setRpps(event.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="11 chiffres"
              inputMode="numeric"
            />
            <small>Le numéro RPPS n&apos;est jamais transmis au moteur IA.</small>
          </label>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-btn primary"
              onClick={() => updateProfile.mutate({ name, specialite, rpps: rpps || undefined })}
              disabled={updateProfile.isPending}
            >
              <Save aria-hidden="true" />
              {updateProfile.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </section>

        <section className="profile-card compact">
          <h2>Compte</h2>
          <div className="kv">
            <span>Email</span>
            <b>{user?.email ?? "—"}</b>
          </div>
          <div className="kv">
            <span>Rôle</span>
            <b>{ROLE_LABELS[role] ?? role.replace(/_/g, " ")}</b>
          </div>
        </section>

        <section className="profile-card">
          <div className="subscription-head">
            <div>
              <h2>Abonnement</h2>
              <strong>Offre Praticien individuel</strong>
            </div>
            <span className={`status ${subscriptionState === "cancelled" ? "cancelled" : "active"}`}>
              <Check aria-hidden="true" />
              {subscriptionState === "cancelled" ? "Résilié" : "Actif"}
            </span>
          </div>

          <div className="recap">
            <div><span>Abonnement HT</span><b>32,00 €</b></div>
            <div><span>TVA (20 %)</span><b>6,40 €</b></div>
            <div className="total"><span>Total TTC / mois</span><b>38,40 €</b></div>
          </div>

          {subscriptionState === "active" && (
            <div className="subscription-state">
              <div className="notice info">
                <Clock aria-hidden="true" />
                <span>
                  Prochain prélèvement : <b>{accessDate}</b> · 38,40 € TTC.
                  Renouvellement automatique mensuel.
                </span>
              </div>
              <button type="button" className="profile-btn danger-outline" onClick={() => setSubscriptionState("confirm")}>
                <CircleX aria-hidden="true" />
                Résilier mon abonnement
              </button>
            </div>
          )}

          {subscriptionState === "confirm" && (
            <div className="subscription-state">
              <div className="confirm-box">
                <h3>Confirmer la résiliation ?</h3>
                <p>
                  Votre abonnement s&apos;arrêtera. <b>Vous conservez l&apos;accès à
                  REDACTIO jusqu&apos;au {accessDate}</b>, puis votre compte passera en
                  accès restreint. Aucun nouveau prélèvement n&apos;aura lieu.
                </p>
                <p>
                  Votre compte et vos paramètres sont conservés. Seul l&apos;abonnement est arrêté.
                </p>
              </div>
              <div className="confirm-actions">
                <button type="button" className="profile-btn danger" onClick={() => setSubscriptionState("cancelled")}>
                  Oui, résilier mon abonnement
                </button>
                <button type="button" className="profile-btn ghost" onClick={() => setSubscriptionState("active")}>
                  Ne pas résilier
                </button>
              </div>
            </div>
          )}

          {subscriptionState === "cancelled" && (
            <div className="subscription-state">
              <div className="notice warn">
                <AlertTriangle aria-hidden="true" />
                <span>
                  Abonnement résilié. Accès maintenu jusqu&apos;au <b>{accessDate}</b>.
                  Aucun prélèvement ne sera effectué.
                </span>
              </div>
              <div className="notice danger">
                <AlertTriangle aria-hidden="true" />
                <span>
                  En cas de réabonnement, <b>vous ne bénéficierez plus de la semaine
                  d&apos;essai gratuit</b> : le prélèvement de 38,40 € TTC démarrera immédiatement.
                </span>
              </div>
              <button
                type="button"
                className="profile-btn primary"
                onClick={() => {
                  setSubscriptionState("active");
                  toast.info("Réabonnement à brancher au prestataire de paiement.");
                }}
              >
                <RotateCw aria-hidden="true" />
                Me réabonner maintenant
              </button>
            </div>
          )}
        </section>

        <section className="danger-zone">
          <h2>Fermer mon compte</h2>
          <p>
            Action différente de la résiliation d&apos;abonnement : ceci supprime
            définitivement votre compte, votre profil et l&apos;accès à REDACTIO.
          </p>
          <button
            type="button"
            className="profile-btn danger-outline"
            onClick={() => toast.info("Suppression de compte à brancher côté serveur.")}
          >
            <Trash2 aria-hidden="true" />
            Supprimer définitivement mon compte
          </button>
        </section>
      </main>
    </RedactioLayout>
  );
}

const profileStyles = `
.profile-main{
  --ink:#0b1b29; --ink-soft:#5a6b78; --ink-faint:#8a99a4;
  --teal:#0e9c8e; --teal-deep:#0a7b70;
  --line:#e6edf0; --field:#f6f9f9; --mint:#eef6f4;
  --amber:#b9740a; --amber-bg:#fdf4e7; --amber-line:#f0dcb4;
  --red:#b3261e; --red-bg:#fdecea; --red-line:#f3c6c2;
  width:100%;
  max-width:900px;
  padding:34px 40px 60px;
  color:var(--ink);
}
.profile-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:26px}
.profile-head > svg{width:22px;height:22px;color:var(--teal-deep);margin-top:5px;flex:none}
.profile-head h1{font-family:"Spectral",Georgia,serif;font-weight:600;font-size:27px;letter-spacing:-.2px;margin:0 0 4px}
.profile-head p{color:var(--ink-soft);font-size:14.5px;margin:0}
.profile-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px 28px;box-shadow:0 2px 6px rgba(11,27,41,.04);margin-bottom:22px}
.profile-card.compact{padding-bottom:20px}
.profile-card h2{font-family:"Spectral",Georgia,serif;font-weight:600;font-size:18.5px;margin:0 0 4px}
.profile-card .intro{color:var(--ink-soft);font-size:13.5px;margin:0 0 20px}
.profile-field{display:block;margin-bottom:18px}
.profile-field span{display:block;font-weight:700;font-size:13.5px;margin-bottom:7px}
.profile-field input{width:100%;font-family:inherit;font-size:14.5px;color:var(--ink);background:var(--field);border:1.5px solid var(--line);border-radius:11px;padding:12px 14px;transition:.15s}
.profile-field input:focus{outline:none;border-color:var(--teal);background:#fff;box-shadow:0 0 0 4px rgba(14,156,142,.13)}
.profile-field small{display:block;font-size:12px;color:var(--ink-faint);margin-top:6px}
.profile-actions{border-top:1px solid var(--line);padding-top:20px}
.profile-btn{display:inline-flex;align-items:center;gap:9px;border:0;cursor:pointer;font-family:inherit;font-weight:700;font-size:14.5px;border-radius:999px;padding:12px 20px;transition:.15s}
.profile-btn svg{width:16px;height:16px}
.profile-btn.primary{background:var(--teal);color:#fff;box-shadow:0 10px 22px -10px rgba(14,156,142,.8)}
.profile-btn.primary:hover{background:var(--teal-deep)}
.profile-btn.primary:disabled{opacity:.65;cursor:wait}
.profile-btn.danger-outline{background:#fff;color:var(--red);border:1.5px solid var(--red-line)}
.profile-btn.danger-outline:hover{background:var(--red-bg)}
.profile-btn.danger{background:var(--red);color:#fff}
.profile-btn.ghost{background:transparent;color:var(--ink-soft);padding-left:8px;padding-right:8px}
.profile-btn.ghost:hover{color:var(--ink)}
.kv{display:flex;justify-content:space-between;gap:16px;padding:9px 0;font-size:14px}
.kv span{color:var(--ink-soft)}
.kv b{font-weight:700;text-align:right}
.subscription-head{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px}
.subscription-head strong{font-weight:800;font-size:16px}
.status{font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;display:inline-flex;align-items:center;gap:5px}
.status svg{width:12px;height:12px}
.status.active{color:var(--teal-deep);background:var(--mint);border:1px solid rgba(14,156,142,.25)}
.status.cancelled{color:var(--amber);background:var(--amber-bg);border:1px solid var(--amber-line)}
.recap{border:1.5px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:18px;background:var(--field)}
.recap div{display:flex;justify-content:space-between;gap:16px;font-size:13.5px;color:var(--ink-soft);padding:5px 0}
.recap b{font-weight:700;color:var(--ink)}
.recap .total{border-top:1px solid var(--line);margin-top:6px;padding-top:11px;font-size:14.5px;font-weight:800;color:var(--ink)}
.recap .total b{color:var(--teal-deep)}
.notice{display:flex;gap:11px;align-items:flex-start;border-radius:12px;padding:13px 15px;font-size:13px;line-height:1.5;margin-bottom:18px}
.notice svg{width:17px;height:17px;flex:none;margin-top:1px}
.notice.info{background:var(--mint);border:1px solid rgba(14,156,142,.22);color:var(--ink)}
.notice.info svg{color:var(--teal-deep)}
.notice.warn{background:var(--amber-bg);border:1px solid var(--amber-line);color:#7a5108}
.notice.warn svg{color:var(--amber)}
.notice.danger{background:var(--red-bg);border:1px solid var(--red-line);color:#7a231d}
.notice.danger svg{color:var(--red)}
.confirm-box{border:1.5px dashed var(--red-line);background:var(--red-bg);border-radius:14px;padding:18px 20px;margin-top:4px}
.confirm-box h3{margin:0 0 8px;font-size:15px;font-weight:800;color:#7a231d}
.confirm-box p{margin:0 0 12px;font-size:13.5px;color:#7a231d;line-height:1.5}
.confirm-box p:last-child{margin-bottom:0}
.confirm-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.danger-zone{border:1px solid var(--red-line);border-radius:16px;padding:22px 24px;background:#fff;margin-bottom:40px}
.danger-zone h2{font-family:"Spectral",Georgia,serif;font-weight:600;font-size:17px;margin:0 0 6px;color:var(--red)}
.danger-zone p{margin:0 0 14px;color:var(--ink-soft);font-size:13.5px;line-height:1.5}
@media(max-width:860px){
  .profile-main{padding:26px 20px}
}
`;
