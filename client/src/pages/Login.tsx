import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";

const TRUST_CHIPS = [
  "RGPD",
  "Hébergement HDS",
  "Secret médical",
  "Pseudonymisation",
];

type Tab = "login" | "signup";
type SignupMode = "practitioner" | "hospital";

function RedactioMark({ inverted = false }: { inverted?: boolean }) {
  if (inverted) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
        <span
          className="translate-y-px text-[30px] font-semibold italic leading-none tracking-[-2px] text-[#7fe3d3]"
          style={{ fontFamily: '"Spectral", Georgia, serif' }}
        >
          Rd
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-[#1e3a5f] shadow-[0_8px_20px_-8px_rgba(30,58,95,.55)]">
      <span
        className="-translate-x-px translate-y-px text-[21px] font-semibold italic leading-none tracking-[-1.5px] text-white"
        style={{ fontFamily: '"Spectral", Georgia, serif' }}
      >
        Rd
      </span>
    </div>
  );
}

function BrandLockup({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <RedactioMark inverted={inverted} />

      <div>
        <div
          className={`text-[19px] font-extrabold leading-none tracking-[.03em] ${
            inverted ? "text-white" : "text-[#0b1b29]"
          }`}
        >
          REDACTIO
        </div>

        <div
          className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[2.4px] ${
            inverted ? "text-[#a9c0cb]" : "text-[#8a99a4]"
          }`}
        >
          Rédaction hospitalière
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [tab, setTab] = useState<Tab>("login");
  const [signupMode, setSignupMode] =
    useState<SignupMode>("practitioner");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [rpps, setRpps] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      setLocation("/dashboard");
      window.location.reload();
    },
    onError: (err) => {
      setError(err.message || "Connexion impossible.");
    },
  });

  const signupMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setLocation("/paiement");
      window.location.reload();
    },
    onError: (err) => {
      setSignupError(err.message || "Inscription impossible.");
    },
  });

  useEffect(() => {
    document.title = "REDACTIO — Bienvenue dans votre espace praticien";
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);
    setError(null);
    setSignupError(null);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError(null);

    if (signupMode === "hospital") {
      window.location.href = "/#demo";
      return;
    }

    signupMutation.mutate({
      name: fullName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      specialite: specialty.trim(),
      rpps: rpps.trim(),
      marketingOptIn: marketingConsent,
    });
  };

  const inputClass =
    "h-auto w-full rounded-xl border-[1.5px] border-[#e4ebee] bg-[#f7fafa] px-3.5 py-3 text-[14.5px] text-[#0b1b29] placeholder:text-[#8a99a4] transition focus-visible:border-[#0e9c8e] focus-visible:bg-white focus-visible:ring-[4px] focus-visible:ring-[#0e9c8e]/15";

  const activeTabClass =
    "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,.18),0_0_0_1px_rgba(14,156,142,.16)]";

  const inactiveTabClass =
    "text-[#5a6b78] hover:bg-white/60 hover:text-[#0a7b70]";

  return (
    <div
      className="min-h-screen bg-white text-[#0b1b29]"
      style={{
        fontFamily:
          '"Hanken Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap");
      `}</style>

      <div className="flex min-h-screen flex-col min-[861px]:flex-row">
        <section
          className="relative flex min-h-[290px] flex-none flex-col justify-end overflow-hidden bg-[#0b1b29] px-[26px] pb-[30px] pt-20 text-white min-[861px]:min-h-screen min-[861px]:min-w-0 min-[861px]:flex-[1_1_56%] min-[861px]:px-10 min-[861px]:py-12 min-[1081px]:px-[60px] min-[1081px]:py-14"
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
              {TRUST_CHIPS.map((label) => (
                <span key={label} className="inline-flex items-center gap-1">
                  <span className="font-bold text-[#5fd6c6]">✓</span>
                  {label}
                </span>
              ))}
            </span>
          </div>

          <h2
            className="m-0 max-w-none text-[32px] font-semibold leading-[1.1] tracking-[-.5px] drop-shadow-[0_2px_30px_rgba(0,0,0,.35)] min-[861px]:max-w-[13ch] min-[861px]:text-[clamp(34px,3.6vw,54px)]"
            style={{ fontFamily: '"Spectral", Georgia, serif' }}
          >
            Bienvenue dans votre espace{" "}
            <em className="italic text-[#7fe3d3]">praticien</em>.
          </h2>

          <p className="mt-[18px] hidden max-w-[46ch] text-[16px] leading-[1.55] text-[#d6e3e9] min-[861px]:block">
            Courrier de sortie, conciliation médicamenteuse,
            correspondance, observation : collez ou dictez vos notes,
            REDACTIO les met en forme — pseudonymisées, conformes, prêtes
            à relire et signer.
          </p>

          <div className="mt-[34px] hidden border-t border-white/20 pt-[26px] min-[861px]:block">
            <BrandLockup inverted />
          </div>
        </section>

        <main className="flex w-full flex-1 flex-col justify-center overflow-y-auto px-6 py-8 min-[861px]:w-[460px] min-[861px]:max-w-[460px] min-[861px]:flex-[0_0_460px] min-[861px]:px-9 min-[861px]:py-10 min-[1081px]:w-[520px] min-[1081px]:max-w-[520px] min-[1081px]:flex-[0_0_520px] min-[1081px]:px-14 min-[1081px]:py-12">
          <div className="mb-[30px]">
            <BrandLockup />
          </div>

          <section>
            {tab === "login" ? (
              <>
                <h1
                  className="m-0 text-[31px] font-semibold leading-[1.15] tracking-[-.3px]"
                  style={{ fontFamily: '"Spectral", Georgia, serif' }}
                >
                  Bon{" "}
                  <em className="italic text-[#0a7b70]">retour</em>.
                </h1>

                <p className="mb-6 mt-1.5 text-[14.5px] leading-[1.5] text-[#5a6b78]">
                  Connectez-vous à votre espace REDACTIO.
                </p>
              </>
            ) : (
              <>
                <h1
                  className="m-0 text-[31px] font-semibold leading-[1.15] tracking-[-.3px]"
                  style={{ fontFamily: '"Spectral", Georgia, serif' }}
                >
                  Créons votre{" "}
                  <em className="italic text-[#0a7b70]">compte</em>.
                </h1>

                <p className="mb-6 mt-1.5 text-[14.5px] leading-[1.5] text-[#5a6b78]">
                  Choisissez le parcours adapté : praticien individuel ou
                  convention hospitalière.
                </p>
              </>
            )}

            <div className="mb-[22px] flex gap-1 rounded-[14px] bg-[#eef2f4] p-[5px]">
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className={`flex-1 rounded-[10px] border-0 px-2 py-[11px] text-[14.5px] font-bold transition ${
                  tab === "login" ? activeTabClass : inactiveTabClass
                }`}
              >
                Connexion
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("signup")}
                className={`flex-1 rounded-[10px] border-0 px-2 py-[11px] text-[14.5px] font-bold transition ${
                  tab === "signup" ? activeTabClass : inactiveTabClass
                }`}
              >
                Inscription
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <Label
                    htmlFor="email"
                    className="mb-[7px] block text-[13px] font-bold text-[#0b1b29]"
                  >
                    Adresse email
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="mb-4">
                  <div className="mb-[7px] flex items-baseline justify-between">
                    <Label
                      htmlFor="password"
                      className="text-[13px] font-bold text-[#0b1b29]"
                    >
                      Mot de passe
                    </Label>

                    <a
                      href="#"
                      className="text-[12.5px] font-bold text-[#0e9c8e] hover:underline"
                    >
                      Oublié ?
                    </a>
                  </div>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className={`${inputClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((currentValue) => !currentValue)
                      }
                      className={`absolute right-3 top-1/2 flex -translate-y-1/2 border-0 bg-transparent p-1 transition ${
                        showPassword
                          ? "text-[#0e9c8e]"
                          : "text-[#8a99a4] hover:text-[#0e9c8e]"
                      }`}
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

                {error && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="h-auto w-full gap-2 rounded-full border-0 bg-[#0e9c8e] py-[15px] text-[15.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(14,156,142,.9)] transition hover:-translate-y-px hover:bg-[#0c8a7d] hover:shadow-[0_16px_32px_-12px_rgba(14,156,142,.95)] disabled:pointer-events-none disabled:opacity-60"
                >
                  <Lock className="h-[17px] w-[17px]" />
                  {loginMutation.isPending
                    ? "Connexion…"
                    : "Se connecter"}
                </Button>

                <nav className="mt-[26px] overflow-hidden rounded-2xl border border-[#e4ebee] bg-white">
                  <a
                    href="#"
                    className="flex items-center justify-between gap-2.5 border-b border-[#e4ebee] px-[18px] py-[15px] text-[14px] font-semibold text-[#0b1b29] transition hover:bg-[#eef6f4] hover:text-[#0a7b70]"
                  >
                    J&apos;ai oublié mon mot de passe
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8a99a4]" />
                  </a>

                  <a
                    href="/conformite"
                    className="flex items-center justify-between gap-2.5 border-b border-[#e4ebee] px-[18px] py-[15px] text-[14px] font-semibold text-[#0b1b29] transition hover:bg-[#eef6f4] hover:text-[#0a7b70]"
                  >
                    Sécurité &amp; protection des données
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8a99a4]" />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-between gap-2.5 px-[18px] py-[15px] text-[14px] font-semibold text-[#0b1b29] transition hover:bg-[#eef6f4] hover:text-[#0a7b70]"
                  >
                    Liens utiles et documentation
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8a99a4]" />
                  </a>
                </nav>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <div className="mb-[18px] flex gap-1 rounded-[14px] bg-[#eef2f4] p-[5px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupMode("practitioner");
                      setSignupError(null);
                    }}
                    className={`flex flex-1 items-center justify-center gap-[7px] rounded-[10px] border-0 px-2 py-[11px] text-[14px] font-bold transition ${
                      signupMode === "practitioner"
                        ? activeTabClass
                        : inactiveTabClass
                    }`}
                  >
                    <UserRound className="h-4 w-4" />
                    Praticien
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSignupMode("hospital");
                      setSignupError(null);
                    }}
                    className={`flex flex-1 items-center justify-center gap-[7px] rounded-[10px] border-0 px-2 py-[11px] text-[14px] font-bold transition ${
                      signupMode === "hospital"
                        ? activeTabClass
                        : inactiveTabClass
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Convention
                  </button>
                </div>

                <div className="mb-5 rounded-xl border border-[#0e9c8e]/20 bg-[#eef6f4] px-[15px] py-[13px] text-[13px] leading-[1.5] text-[#5a6b78]">
                  {signupMode === "practitioner" ? (
                    <>
                      <strong className="text-[#0a7b70]">
                        Inscription praticien individuel.
                      </strong>{" "}
                      Ce compte est personnel et déclenche le suivi
                      d&apos;inscription REDACTIO.
                    </>
                  ) : (
                    <>
                      <strong className="text-[#0a7b70]">
                        Convention hospitalière.
                      </strong>{" "}
                      Votre établissement signe une convention : nous vous
                      recontactons pour ouvrir les accès de votre service.
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <Label
                    htmlFor="fullName"
                    className="mb-[7px] block text-[13px] font-bold text-[#0b1b29]"
                  >
                    Nom complet
                  </Label>

                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                {signupMode === "hospital" && (
                  <div className="mb-4">
                    <Label
                      htmlFor="hospitalName"
                      className="mb-[7px] block text-[13px] font-bold text-[#0b1b29]"
                    >
                      Établissement / service
                    </Label>

                    <Input
                      id="hospitalName"
                      type="text"
                      placeholder="CH de … — service de …"
                      value={hospitalName}
                      onChange={(event) =>
                        setHospitalName(event.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <Label
                    htmlFor="signupEmail"
                    className="mb-[7px] block text-[13px] font-bold text-[#0b1b29]"
                  >
                    Adresse email
                  </Label>

                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(event) =>
                      setSignupEmail(event.target.value)
                    }
                    required
                    className={inputClass}
                  />
                </div>

                <div className="mb-4">
                  <Label
                    htmlFor="signupPassword"
                    className="mb-[7px] block text-[13px] font-bold text-[#0b1b29]"
                  >
                    Mot de passe
                  </Label>

                  <div className="relative">
                    <Input
                      id="signupPassword"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={signupPassword}
                      onChange={(event) =>
                        setSignupPassword(event.target.value)
                      }
                      required={signupMode === "practitioner"}
                      minLength={8}
                      className={`${inputClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowSignupPassword(
                          (currentValue) => !currentValue,
                        )
                      }
                      className={`absolute right-3 top-1/2 flex -translate-y-1/2 border-0 bg-transparent p-1 transition ${
                        showSignupPassword
                          ? "text-[#0e9c8e]"
                          : "text-[#8a99a4] hover:text-[#0e9c8e]"
                      }`}
                      aria-label={
                        showSignupPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-[19px] w-[19px]" />
                      ) : (
                        <Eye className="h-[19px] w-[19px]" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                  <div className="mb-4">
                    <Label
                      htmlFor="specialty"
                      className="mb-[7px] block text-[13px] font-bold text-[#0b1b29]"
                    >
                      Spécialité
                    </Label>

                    <Input
                      id="specialty"
                      type="text"
                      placeholder="Cardiologie"
                      value={specialty}
                      onChange={(event) =>
                        setSpecialty(event.target.value)
                      }
                      required={signupMode === "practitioner"}
                      className={inputClass}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="mb-[7px] flex items-baseline justify-between">
                      <Label
                        htmlFor="rpps"
                        className="text-[13px] font-bold text-[#0b1b29]"
                      >
                        RPPS
                      </Label>

                      <span className="text-[12px] font-semibold text-[#8a99a4]">
                        (facultatif)
                      </span>
                    </div>

                    <Input
                      id="rpps"
                      type="text"
                      inputMode="numeric"
                      placeholder="11 chiffres"
                      pattern="\d{11}"
                      title="Le numéro RPPS doit comporter 11 chiffres"
                      value={rpps}
                      onChange={(event) => setRpps(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <label className="mb-[18px] mt-1.5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e4ebee] bg-[#f7fafa] px-[15px] py-3.5 text-[12.7px] leading-[1.45] text-[#5a6b78]">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(event) =>
                      setMarketingConsent(event.target.checked)
                    }
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#0e9c8e]"
                  />

                  <span>
                    J&apos;accepte de recevoir des emails d&apos;information,
                    newsletters et actualités de REDACTIO.{" "}
                    <em className="italic">(facultatif)</em>
                  </span>
                </label>

                {signupError && signupMode === "practitioner" && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    signupMode === "practitioner" &&
                    signupMutation.isPending
                  }
                  className={`h-auto w-full gap-2 rounded-full border-0 py-[15px] text-[15.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(14,156,142,.9)] transition hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60 ${
                    signupMode === "hospital"
                      ? "bg-[#1e3a5f] hover:bg-[#0b1b29]"
                      : "bg-[#0e9c8e] hover:bg-[#0c8a7d] hover:shadow-[0_16px_32px_-12px_rgba(14,156,142,.95)]"
                  }`}
                >
                  {signupMode === "hospital" ? (
                    <>
                      <ArrowRight className="h-[17px] w-[17px]" />
                      Demander une convention
                    </>
                  ) : (
                    <>
                      <Check className="h-[17px] w-[17px]" />
                      {signupMutation.isPending
                        ? "Création…"
                        : "Créer mon compte"}
                    </>
                  )}
                </Button>

                <p className="mx-0.5 mt-4 text-center text-[11.8px] leading-[1.55] text-[#8a99a4]">
                  En créant un compte, vous acceptez nos{" "}
                  <a
                    href="#"
                    className="font-semibold text-[#0e9c8e] hover:underline"
                  >
                    Conditions d&apos;utilisation
                  </a>{" "}
                  et notre{" "}
                  <a
                    href="#"
                    className="font-semibold text-[#0e9c8e] hover:underline"
                  >
                    Politique de confidentialité
                  </a>
                  .
                </p>
              </form>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-[#e4ebee] pt-5">
              {TRUST_CHIPS.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0e9c8e]/20 bg-[#eef6f4] px-[11px] py-1.5 text-[11.5px] font-semibold text-[#0a7b70]"
                >
                  <ShieldCheck className="h-[13px] w-[13px]" />
                  {label}
                </span>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
