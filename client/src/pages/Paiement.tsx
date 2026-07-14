import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Check,
  Clock3,
  CreditCard,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
          REDACTIO
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

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export default function Paiement() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const trialEnd = useMemo(() => formatTrialEndDate(), []);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    document.title = "REDACTIO — Activez votre essai gratuit";
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Essai gratuit activé. Connexion à votre espace REDACTIO.");
    setLocation("/dashboard");
  };

  const inputClass =
    "h-auto rounded-xl border-[1.5px] border-[#e4ebee] bg-[#f7fafa] px-3.5 py-3 text-[14.5px] text-[#0b1b29] placeholder:text-[#8a99a4] focus-visible:border-[#0e9c8e] focus-visible:bg-white focus-visible:ring-[4px] focus-visible:ring-[#0e9c8e]/15";

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
              Paiement sécurisé — aucune donnée bancaire stockée par REDACTIO
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
            7 jours pour tester REDACTIO sans engagement. Aucun débit avant la fin de l'essai. Résiliable à tout moment depuis votre espace praticien.
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
              <span className="text-[15px] font-extrabold">Offre Praticien individuel</span>
              <span className="rounded-full border border-[#0e9c8e]/20 bg-[#eef6f4] px-3 py-1 text-[11px] font-bold text-[#0a7b70]">
                Facturation mensuelle
              </span>
            </div>
            <div className="flex justify-between py-1.5 text-[13.5px] text-[#5a6b78]">
              <span>Abonnement HT</span>
              <b className="text-[#0b1b29]">32,00 €</b>
            </div>
            <div className="flex justify-between py-1.5 text-[13.5px] text-[#5a6b78]">
              <span>TVA (20 %)</span>
              <b className="text-[#0b1b29]">6,40 €</b>
            </div>
            <div className="mt-2 flex justify-between border-t border-[#e4ebee] pt-3 text-[15px] font-extrabold">
              <span>Total TTC / mois</span>
              <span className="text-[#0a7b70]">38,40 €</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[#8a99a4]">
              Renouvellement automatique mensuel à partir du {trialEnd}. Résiliable à tout moment depuis votre espace.
            </p>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#8a99a4]">
              Coordonnées bancaires
            </div>

            <div>
              <Label htmlFor="cardName" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                Nom sur la carte
              </Label>
              <Input id="cardName" type="text" placeholder="Jean Dupont" autoComplete="cc-name" required className={inputClass} />
            </div>

            <div>
              <Label htmlFor="cardNumber" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                Numéro de carte
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                  required
                  className={`${inputClass} pr-12`}
                />
                <CreditCard className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a99a4]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[2fr_1fr_1fr]">
              <div>
                <Label htmlFor="expiry" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                  Expiration
                </Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM / AA"
                  autoComplete="cc-exp"
                  maxLength={7}
                  value={expiry}
                  onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="cvc" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                  CVC
                </Label>
                <div className="relative">
                  <Input
                    id="cvc"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    autoComplete="cc-csc"
                    maxLength={4}
                    value={cvc}
                    onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                    className={`${inputClass} pr-9`}
                  />
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a99a4]" />
                </div>
              </div>
              <div>
                <Label htmlFor="postalCode" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                  Code postal
                </Label>
                <Input id="postalCode" type="text" inputMode="numeric" placeholder="59000" maxLength={5} className={inputClass} />
              </div>
            </div>

            <div className="pt-1 text-[12px] font-extrabold uppercase tracking-[.08em] text-[#8a99a4]">
              Facturation
            </div>
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <Label htmlFor="billingAddress" className="text-[13px] font-bold text-[#0b1b29]">
                  Établissement / adresse de facturation
                </Label>
                <span className="text-[12px] font-semibold text-[#8a99a4]">(facultatif)</span>
              </div>
              <Input id="billingAddress" type="text" placeholder="Cabinet, service, ou adresse" className={inputClass} />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e4ebee] bg-[#f7fafa] px-4 py-3.5 text-[12.5px] leading-relaxed text-[#5a6b78]">
              <input type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#0e9c8e]" />
              <span>
                J'autorise REDACTIO à prélever <b className="text-[#0b1b29]">38,40 € TTC/mois</b> par carte bancaire à compter du{" "}
                <b className="text-[#0b1b29]">{trialEnd}</b>, sauf résiliation avant cette date. J'ai lu et j'accepte les{" "}
                <a href="#" className="font-bold text-[#0e9c8e] hover:underline">
                  Conditions Générales de Vente
                </a>.
              </span>
            </label>

            <Button
              type="submit"
              className="h-auto w-full gap-2 rounded-full bg-[#0e9c8e] py-4 text-[15.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(14,156,142,.9)] transition hover:-translate-y-px hover:bg-[#0c8a7d] hover:shadow-[0_16px_32px_-12px_rgba(14,156,142,.95)]"
            >
              <Lock className="h-4 w-4" />
              Démarrer mon essai gratuit de 7 jours
            </Button>

            <p className="px-1 text-center text-[12px] leading-relaxed text-[#8a99a4]">
              Aucun débit aujourd'hui. Vous pouvez annuler à tout moment avant le {trialEnd} depuis votre espace, sans justification.
            </p>
          </form>

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
