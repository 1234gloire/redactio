import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { requiresIndividualPaymentActivation } from "@/lib/billingAccess";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Check,
  Clock3,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";

const TRUST_CHIPS = ["Paiement chiffré", "RGPD", "Résiliable à tout moment"];

function BrandLockup({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          inverted ? "bg-white text-[#0b1b29]" : "bg-[#0b1b29] text-white"
        } shadow-[0_8px_20px_-8px_rgba(11,27,41,.55)]`}
      >
        <FileText className="h-[22px] w-[22px]" />
      </div>
      <div>
        <div className={`text-[19px] font-extrabold leading-none tracking-[.03em] ${inverted ? "text-white" : "text-[#0b1b29]"}`}>
          MEDACTIO
        </div>
        <div className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[2.4px] ${inverted ? "text-[#a9c0cb]" : "text-[#8a99a4]"}`}>
          Rédaction hospitalière
        </div>
      </div>
    </div>
  );
}

function formatTrialEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatStripeAmount(amount: number | undefined, currency: string | undefined) {
  if (amount === undefined || !currency) return "Chargement...";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export default function Paiement() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const trialEnd = useMemo(() => formatTrialEndDate(), []);
  const planQuery = trpc.billing.getPlan.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const plan = planQuery.data;
  const amountLabel = formatStripeAmount(plan?.amount, plan?.currency);
  const intervalLabel = plan?.interval ?? "mois";
  const createCheckoutSession = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    document.title = "MEDACTIO — Activez votre essai gratuit";
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    if (requiresIndividualPaymentActivation(user)) return;
    setLocation("/dashboard");
  }, [isAuthenticated, loading, setLocation, user]);

  useEffect(() => {
    if (location.includes("checkout=cancelled")) {
      toast.info("Paiement annulé. Vous pouvez reprendre l'activation quand vous voulez.");
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white text-[#0b1b29]" style={{ fontFamily: '"Hanken Grotesk", system-ui, -apple-system, sans-serif' }}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <section
          className="relative flex min-h-[230px] flex-col justify-end overflow-hidden bg-[#0b1b29] px-6 pb-8 pt-20 text-white lg:min-h-screen lg:flex-[1_1_56%] lg:px-[60px] lg:py-14"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,27,41,.15) 0%, rgba(11,27,41,.45) 55%, rgba(11,27,41,.88) 100%), url('/medecin-redactio.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "62% center",
          }}
        >
          <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-4 bg-[#0b1b29]/55 px-6 py-3 text-[11.5px] text-[#dbe6ec] backdrop-blur-md lg:px-[60px] lg:text-[12.5px]">
            <span className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="h-[15px] w-[15px] text-[#5fd6c6]" />
              Paiement sécurisé — aucune donnée bancaire stockée par MEDACTIO
            </span>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {["PCI-DSS", "RGPD", "Hébergement HDS"].map((label) => (
                <span key={label} className="inline-flex items-center gap-1">
                  <span className="font-bold text-[#5fd6c6]">✓</span>
                  {label}
                </span>
              ))}
            </span>
          </div>

          <h2 className="max-w-[14ch] font-serif text-[28px] font-semibold leading-[1.12] tracking-[-.01em] drop-shadow-[0_2px_30px_rgba(0,0,0,.35)] lg:text-[clamp(32px,3.4vw,50px)]">
            Votre essai <em className="italic text-[#7fe3d3]">gratuit</em> commence aujourd'hui.
          </h2>
          <p className="mt-5 hidden max-w-[44ch] text-[16px] leading-relaxed text-[#d6e3e9] lg:block">
            7 jours pour tester MEDACTIO sans engagement. Aucun débit avant la fin de l'essai. Résiliable à tout moment depuis votre espace praticien.
          </p>

          <div className="my-8 hidden flex-col gap-3 lg:flex">
            {[
              { label: "Inscription praticien", state: "done", marker: "✓" },
              { label: "Informations bancaires", state: "current", marker: "2" },
              { label: "Accès à votre espace", state: "todo", marker: "3" },
            ].map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-3 text-[14px] ${
                  step.state === "current" ? "font-bold text-white" : step.state === "todo" ? "text-[#dbe6ec]/65" : "text-[#dbe6ec]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-extrabold ${
                    step.state === "done"
                      ? "bg-[#5fd6c6] text-[#0b1b29]"
                      : step.state === "current"
                        ? "bg-white text-[#0b1b29]"
                        : "bg-white/25 text-white"
                  }`}
                >
                  {step.marker}
                </span>
                {step.label}
              </div>
            ))}
          </div>

          <div className="hidden border-t border-white/20 pt-6 lg:block">
            <BrandLockup inverted />
          </div>
        </section>

        <main className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-8 lg:max-w-[560px] lg:flex-[0_0_560px] lg:px-14 lg:py-12">
          <div className="mb-7">
            <BrandLockup />
          </div>

          <h1 className="font-serif text-[29px] font-semibold leading-tight tracking-[-.01em]">
            Activez votre <em className="italic text-[#0a7b70]">essai gratuit</em>.
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5a6b78]">
            Renseignez vos informations bancaires pour débloquer votre accès. Vous ne serez prélevé qu'à l'issue des 7 jours d'essai.
          </p>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#0e9c8e]/25 bg-[#eef6f4] px-4 py-3.5">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#0a7b70]" />
            <div className="text-[13.5px] leading-relaxed text-[#0b1b29]">
              <b className="text-[#0a7b70]">0,00 € aujourd'hui.</b> Premier prélèvement le{" "}
              <b>{trialEnd}</b>, sauf résiliation avant cette date.
            </div>
          </div>

          <div className="mt-5 rounded-2xl border-[1.5px] border-[#e4ebee] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[15px] font-extrabold">{plan?.planLabel ?? "Offre Praticien individuel"}</span>
              <span className="rounded-full border border-[#0e9c8e]/20 bg-[#eef6f4] px-3 py-1 text-[11px] font-bold text-[#0a7b70]">
                Facturation / {intervalLabel}
              </span>
            </div>
            <div className="flex justify-between py-1.5 text-[13.5px] text-[#5a6b78]">
              <span>Prix configuré dans Stripe</span>
              <b className="text-[#0b1b29]">{amountLabel}</b>
            </div>
            <div className="mt-2 flex justify-between border-t border-[#e4ebee] pt-3 text-[15px] font-extrabold">
              <span>Total / {intervalLabel}</span>
              <span className="text-[#0a7b70]">{amountLabel}</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[#8a99a4]">
              Renouvellement automatique tous les {intervalLabel} à partir du {trialEnd}. Résiliable à tout moment depuis votre espace.
              {planQuery.isError ? " Le prix Stripe n'a pas pu être chargé pour le moment." : ""}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#8a99a4]">
              Paiement sécurisé Stripe
            </div>

            <div className="rounded-2xl border border-[#e4ebee] bg-[#f7fafa] p-5 text-[13.5px] leading-relaxed text-[#5a6b78]">
              <div className="mb-3 flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#0a7b70]" />
                <div>
                  <b className="text-[#0b1b29]">Vos coordonnées bancaires seront saisies sur Stripe Checkout.</b>
                  <br />
                  MEDACTIO ne reçoit, ne stocke et ne traite aucun numéro de carte.
                </div>
              </div>
              <ul className="ml-8 list-disc space-y-1">
                <li>0,00 € aujourd&apos;hui.</li>
                <li>Essai gratuit de {plan?.trialDays ?? 7} jours.</li>
                <li>Premier prélèvement de {amountLabel} le {trialEnd}, sauf résiliation.</li>
              </ul>
            </div>

            <Button
              type="button"
              disabled={createCheckoutSession.isPending}
              onClick={() => createCheckoutSession.mutate()}
              className="h-auto w-full gap-2 rounded-full bg-[#0e9c8e] py-4 text-[15.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(14,156,142,.9)] transition hover:-translate-y-px hover:bg-[#0c8a7d] hover:shadow-[0_16px_32px_-12px_rgba(14,156,142,.95)]"
            >
              <Lock className="h-4 w-4" />
              {createCheckoutSession.isPending
                ? "Ouverture de Stripe..."
                : "Continuer vers Stripe et démarrer l'essai"}
            </Button>

            <p className="px-1 text-center text-[12px] leading-relaxed text-[#8a99a4]">
              Aucun débit aujourd'hui. Vous pouvez annuler à tout moment avant le {trialEnd} depuis votre espace, sans justification.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-[#e4ebee] pt-5">
            {TRUST_CHIPS.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0e9c8e]/20 bg-[#eef6f4] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#0a7b70]"
              >
                {label === "Paiement chiffré" ? <Lock className="h-[13px] w-[13px]" /> : label === "RGPD" ? <ShieldCheck className="h-[13px] w-[13px]" /> : <Check className="h-[13px] w-[13px]" />}
                {label}
              </span>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
