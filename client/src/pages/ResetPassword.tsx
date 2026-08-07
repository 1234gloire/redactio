import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const TRUST_CHIPS = [
  "RGPD",
  "Hébergement HDS",
  "Secret médical",
  "Pseudonymisation",
];

function MedactioMark({ inverted = false }: { inverted?: boolean }) {
  if (inverted) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
        <img
          src="/logo-mark-teal.png"
          alt=""
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[13px] shadow-[0_8px_20px_-8px_rgba(30,58,95,.55)]">
      <img
        src="/logo-mark-navy.png"
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function BrandLockup({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <MedactioMark inverted={inverted} />

      <div>
        <div
          className={`text-[19px] font-extrabold leading-none tracking-[.03em] ${inverted ? "text-white" : "text-[#0b1b29]"
            }`}
        >
          MEDACTIO
        </div>

        <div
          className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[2.4px] ${inverted ? "text-[#a9c0cb]" : "text-[#8a99a4]"
            }`}
        >
          Rédaction hospitalière
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const email =
    new URLSearchParams(window.location.search).get("email") ?? "";

  useEffect(() => {
    document.title = "MEDACTIO — Réinitialisation du mot de passe";
  }, []);

  const resetMutation = trpc.auth.resetPasswordSimple.useMutation({
    onSuccess: () => {
      setSuccess(true);

      window.setTimeout(() => {
        setLocation("/login");
      }, 1500);
    },

    onError: mutationError => {
      setError(mutationError.message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!email) {
      setError(
        "Retournez à la page de connexion et saisissez votre adresse email avant de cliquer sur « Mot de passe oublié ».",
      );
      return;
    }

    resetMutation.mutate({
      email,
      password,
    });
  };

  const inputClass =
    "h-auto w-full rounded-xl border-[1.5px] border-[#e4ebee] bg-[#f7fafa] px-3.5 py-3 pr-11 text-[14.5px] text-[#0b1b29] transition placeholder:text-[#8a99a4] focus-visible:border-[#0e9c8e] focus-visible:bg-white focus-visible:ring-[4px] focus-visible:ring-[#0e9c8e]/15";

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-white text-[#0b1b29] min-[861px]:h-screen min-[861px]:overflow-hidden"
      style={{
        fontFamily:
          '"Hanken Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap");
      `}</style>

      <div className="flex min-h-screen w-full flex-col min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-row">
        {/* Partie gauche : identique au login */}
        <section
          className="relative flex min-h-[290px] flex-none flex-col justify-end overflow-hidden bg-[#0b1b29] px-[26px] pb-[30px] pt-20 text-white min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:min-w-0 min-[861px]:flex-[1_1_56%] min-[861px]:px-10 min-[861px]:py-12 min-[1081px]:px-[60px] min-[1081px]:py-14"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,27,41,.15) 0%, rgba(11,27,41,.45) 55%, rgba(11,27,41,.88) 100%), url('/medecin-redactio.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "62% center",
          }}
        >
          <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-3 bg-[#0b1b29]/55 px-[26px] py-3 text-[11.5px] text-[#dbe6ec] backdrop-blur-md min-[861px]:gap-4 min-[861px]:px-10 min-[861px]:text-[12.5px] min-[1081px]:px-[60px]">
            <span className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="h-[15px] w-[15px] shrink-0 text-[#5fd6c6]" />

              Conforme aux exigences de protection des données de santé
            </span>

            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {TRUST_CHIPS.map(label => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1"
                >
                  <span className="font-bold text-[#5fd6c6]">✓</span>
                  {label}
                </span>
              ))}
            </span>
          </div>

          <h2
            className="m-0 max-w-none text-[32px] font-semibold leading-[1.1] tracking-[-.5px] drop-shadow-[0_2px_30px_rgba(0,0,0,.35)] min-[861px]:max-w-[13ch] min-[861px]:text-[clamp(34px,3.6vw,54px)]"
            style={{
              fontFamily: '"Spectral", Georgia, serif',
            }}
          >
            Bienvenue dans votre espace{" "}
            <em className="italic text-[#7fe3d3]">praticien</em>.
          </h2>

          <p className="mt-[18px] hidden max-w-[46ch] text-[16px] leading-[1.55] text-[#d6e3e9] min-[861px]:block">
            Courrier de sortie, conciliation médicamenteuse,
            correspondance, observation : collez ou dictez vos notes,
            MEDACTIO les met en forme — pseudonymisées, conformes,
            prêtes à relire et signer.
          </p>

          <div className="mt-[34px] hidden border-t border-white/20 pt-[26px] min-[861px]:block">
            <BrandLockup inverted />
          </div>
        </section>

        {/* Partie droite : formulaire de réinitialisation */}
        <main className="flex w-full flex-1 flex-col justify-center overflow-y-auto px-6 py-8 min-[861px]:h-full min-[861px]:w-[460px] min-[861px]:max-w-[460px] min-[861px]:flex-[0_0_460px] min-[861px]:px-9 min-[861px]:py-10 min-[1081px]:w-[520px] min-[1081px]:max-w-[520px] min-[1081px]:flex-[0_0_520px] min-[1081px]:px-14 min-[1081px]:py-12">          <div className="mb-[30px]">
            <BrandLockup />
          </div>

          <section>
            <Link
              href="/login"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#5a6b78] transition hover:text-[#0a7b70]"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>

            <h1
              className="m-0 text-[31px] font-semibold leading-[1.15] tracking-[-.3px]"
              style={{
                fontFamily: '"Spectral", Georgia, serif',
              }}
            >
              Nouveau mot de{" "}
              <em className="italic text-[#0a7b70]">passe</em>.
            </h1>

            <p className="mb-7 mt-2 text-[14.5px] leading-[1.5] text-[#5a6b78]">
              Définissez un nouveau mot de passe sécurisé pour votre
              compte MEDACTIO.
            </p>

            {email && (
              <div className="mb-5 rounded-xl border border-[#dce7e9] bg-[#f7fafa] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[.08em] text-[#8a99a4]">
                  Compte concerné
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-[#0b1b29]">
                  {email}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Label
                  htmlFor="new-password"
                  className="mb-[7px] block text-[13px] font-bold"
                >
                  Nouveau mot de passe
                </Label>

                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    required
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(currentValue => !currentValue)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1 text-[#8a99a4] transition hover:text-[#0e9c8e]"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-[19px] w-[19px]" />
                    ) : (
                      <Eye className="h-[19px] w-[19px]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <Label
                  htmlFor="confirm-password"
                  className="mb-[7px] block text-[13px] font-bold"
                >
                  Confirmer le mot de passe
                </Label>

                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmation ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmation}
                    onChange={event =>
                      setConfirmation(event.target.value)
                    }
                    required
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmation(
                        currentValue => !currentValue,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1 text-[#8a99a4] transition hover:text-[#0e9c8e]"
                    aria-label={
                      showConfirmation
                        ? "Masquer la confirmation du mot de passe"
                        : "Afficher la confirmation du mot de passe"
                    }
                  >
                    {showConfirmation ? (
                      <EyeOff className="h-[19px] w-[19px]" />
                    ) : (
                      <Eye className="h-[19px] w-[19px]" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="mb-4 rounded-xl border border-[#0e9c8e]/20 bg-[#eef6f4] px-3.5 py-3 text-sm font-semibold text-[#0a7b70]"
                >
                  Mot de passe réinitialisé avec succès. Redirection vers
                  la connexion…
                </p>
              )}

              <Button
                type="submit"
                disabled={success || resetMutation.isPending}
                className="h-auto w-full gap-2 rounded-full bg-[#0e9c8e] py-3.5 font-bold shadow-[0_12px_25px_-12px_rgba(14,156,142,.75)] hover:bg-[#0c8a7d]"
              >
                <Lock className="h-4 w-4" />

                {resetMutation.isPending
                  ? "Modification…"
                  : "Modifier le mot de passe"}
              </Button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}