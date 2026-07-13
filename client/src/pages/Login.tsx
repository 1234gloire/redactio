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
  FileText,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";

const TRUST_CHIPS = ["RGPD", "Hébergement HDS", "Secret médical", "Pseudonymisation"];

type Tab = "login" | "signup";
type SignupMode = "practitioner" | "hospital";

function RedactioMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
        inverted ? "bg-white text-[#0b1b29]" : "bg-[#0b1b29] text-white"
      } shadow-[0_8px_20px_-8px_rgba(11,27,41,.55)]`}
    >
      <FileText className="h-[22px] w-[22px]" />
    </div>
  );
}

function BrandLockup({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <RedactioMark inverted={inverted} />
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

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("login");
  const [signupMode, setSignupMode] = useState<SignupMode>("practitioner");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
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
    onError: (err) => setError(err.message || "Connexion impossible."),
  });

  const signupMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setLocation("/dashboard");
      window.location.reload();
    },
    onError: (err) => setSignupError(err.message || "Inscription impossible."),
  });

  useEffect(() => {
    document.title = "REDACTIO — Bienvenue dans votre espace praticien";
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError(null);

    if (signupMode === "hospital") {
      window.location.href = "/#demo";
      return;
    }

    signupMutation.mutate({
      name: fullName,
      email: signupEmail,
      password: signupPassword,
      specialite: specialty,
      rpps,
      marketingOptIn: marketingConsent,
    });
  };

  const inputClass =
    "h-auto rounded-xl border-[1.5px] border-[#e4ebee] bg-[#f7fafa] px-3.5 py-3 text-[14.5px] text-[#0b1b29] placeholder:text-[#8a99a4] focus-visible:border-[#0e9c8e] focus-visible:bg-white focus-visible:ring-[4px] focus-visible:ring-[#0e9c8e]/15";

  return (
    <div className="min-h-screen bg-white text-[#0b1b29]" style={{ fontFamily: '"Hanken Grotesk", system-ui, -apple-system, sans-serif' }}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <section
          className="relative flex min-h-[290px] flex-col justify-end overflow-hidden bg-[#0b1b29] px-6 pb-8 pt-20 text-white lg:min-h-screen lg:flex-[1_1_56%] lg:px-[60px] lg:py-14"
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

          <h2 className="max-w-[13ch] font-serif text-[32px] font-semibold leading-[1.1] tracking-[-.01em] drop-shadow-[0_2px_30px_rgba(0,0,0,.35)] lg:text-[clamp(34px,3.6vw,54px)]">
            Bienvenue dans votre espace <em className="italic text-[#7fe3d3]">praticien</em>.
          </h2>
          <p className="mt-5 hidden max-w-[46ch] text-[16px] leading-relaxed text-[#d6e3e9] lg:block">
            Courrier de sortie, conciliation médicamenteuse, correspondance, observation : collez ou dictez vos notes, REDACTIO les met en forme, pseudonymisées, conformes, prêtes à relire et signer.
          </p>
          <div className="mt-8 hidden border-t border-white/20 pt-6 lg:block">
            <BrandLockup inverted />
          </div>
        </section>

        <main className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-8 lg:max-w-[520px] lg:flex-[0_0_520px] lg:px-14 lg:py-12">
          <div className="mb-8">
            <BrandLockup />
          </div>

          <section>
            {tab === "login" ? (
              <>
                <h1 className="font-serif text-[31px] font-semibold leading-tight tracking-[-.01em]">
                  Bon <em className="italic text-[#0a7b70]">retour</em>.
                </h1>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#5a6b78]">
                  Connectez-vous à votre espace REDACTIO.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-serif text-[31px] font-semibold leading-tight tracking-[-.01em]">
                  Créons votre <em className="italic text-[#0a7b70]">compte</em>.
                </h1>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#5a6b78]">
                  Choisissez le parcours adapté : praticien individuel ou convention hospitalière.
                </p>
              </>
            )}

            <div className="mt-6 flex gap-1 rounded-[14px] bg-[#eef2f4] p-[5px]">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 rounded-[10px] px-2 py-3 text-[14.5px] font-bold transition ${
                  tab === "login"
                    ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,.18),0_0_0_1px_rgba(14,156,142,.16)]"
                    : "text-[#5a6b78]"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`flex-1 rounded-[10px] px-2 py-3 text-[14.5px] font-bold transition ${
                  tab === "signup"
                    ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,.18),0_0_0_1px_rgba(14,156,142,.16)]"
                    : "text-[#5a6b78]"
                }`}
              >
                Inscription
              </button>
            </div>

            {tab === "login" ? (
              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div>
                  <Label htmlFor="email" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
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

                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <Label htmlFor="password" className="text-[13px] font-bold text-[#0b1b29]">
                      Mot de passe
                    </Label>
                    <a href="#" className="text-[12.5px] font-bold text-[#0e9c8e] hover:underline">
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
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a99a4] hover:text-[#0e9c8e]"
                      aria-label="Afficher le mot de passe"
                    >
                      {showPassword ? <EyeOff className="h-[19px] w-[19px]" /> : <Eye className="h-[19px] w-[19px]" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="h-auto w-full gap-2 rounded-full bg-[#0e9c8e] py-4 text-[15.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(14,156,142,.9)] transition hover:-translate-y-px hover:bg-[#0c8a7d] hover:shadow-[0_16px_32px_-12px_rgba(14,156,142,.95)]"
                >
                  <Lock className="h-4 w-4" />
                  {loginMutation.isPending ? "Connexion…" : "Se connecter"}
                </Button>

                <nav className="mt-7 overflow-hidden rounded-2xl border border-[#e4ebee] bg-white">
                  {[
                    "J'ai oublié mon mot de passe",
                    "Sécurité & protection des données",
                    "Liens utiles et documentation",
                  ].map((label) => (
                    <a
                      key={label}
                      href={label.includes("Sécurité") ? "/conformite" : "#"}
                      className="flex items-center justify-between border-b border-[#e4ebee] px-4 py-4 text-[14px] font-semibold text-[#0b1b29] transition last:border-b-0 hover:bg-[#eef6f4] hover:text-[#0a7b70]"
                    >
                      {label}
                      <ChevronRight className="h-4 w-4 text-[#8a99a4]" />
                    </a>
                  ))}
                </nav>
              </form>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handleSignup}>
                <div className="flex gap-1 rounded-[14px] bg-[#eef2f4] p-[5px]">
                  <button
                    type="button"
                    onClick={() => setSignupMode("practitioner")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] px-2 py-3 text-[14px] font-bold transition ${
                      signupMode === "practitioner"
                        ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,.18),0_0_0_1px_rgba(14,156,142,.16)]"
                        : "text-[#5a6b78]"
                    }`}
                  >
                    <UserRound className="h-4 w-4" />
                    Praticien
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupMode("hospital")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] px-2 py-3 text-[14px] font-bold transition ${
                      signupMode === "hospital"
                        ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,.18),0_0_0_1px_rgba(14,156,142,.16)]"
                        : "text-[#5a6b78]"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Convention
                  </button>
                </div>

                <div className="rounded-xl border border-[#0e9c8e]/20 bg-[#eef6f4] px-4 py-3 text-[13px] leading-relaxed text-[#5a6b78]">
                  {signupMode === "practitioner" ? (
                    <>
                      <b className="text-[#0a7b70]">Inscription praticien individuel.</b> Ce compte est personnel et déclenche le suivi d'inscription REDACTIO.
                    </>
                  ) : (
                    <>
                      <b className="text-[#0a7b70]">Convention hospitalière.</b> Votre établissement signe une convention : nous vous recontactons pour ouvrir les accès de votre service.
                    </>
                  )}
                </div>

                <div>
                  <Label htmlFor="fullName" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
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
                  <div>
                    <Label htmlFor="hospital" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                      Établissement / service
                    </Label>
                    <Input
                      id="hospital"
                      type="text"
                      placeholder="CH de ... — service de ..."
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="signupEmail" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                    Adresse email
                  </Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label htmlFor="signupPassword" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="signupPassword"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={signupPassword}
                      onChange={(event) => setSignupPassword(event.target.value)}
                      required={signupMode === "practitioner"}
                      minLength={8}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a99a4] hover:text-[#0e9c8e]"
                      aria-label="Afficher le mot de passe"
                    >
                      {showSignupPassword ? <EyeOff className="h-[19px] w-[19px]" /> : <Eye className="h-[19px] w-[19px]" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="specialty" className="mb-2 block text-[13px] font-bold text-[#0b1b29]">
                      Spécialité
                    </Label>
                    <Input
                      id="specialty"
                      type="text"
                      placeholder="Cardiologie"
                      value={specialty}
                      onChange={(event) => setSpecialty(event.target.value)}
                      required={signupMode === "practitioner"}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-baseline justify-between">
                      <Label htmlFor="rpps" className="text-[13px] font-bold text-[#0b1b29]">
                        RPPS
                      </Label>
                      <span className="text-[12px] font-semibold text-[#8a99a4]">(facultatif)</span>
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

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e4ebee] bg-[#f7fafa] px-4 py-3.5 text-[12.7px] leading-relaxed text-[#5a6b78]">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(event) => setMarketingConsent(event.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#0e9c8e]"
                  />
                  <span>
                    J'accepte de recevoir des emails d'information, newsletters et actualités de REDACTIO.{" "}
                    <em className="italic">(facultatif)</em>
                  </span>
                </label>

                {signupMode === "hospital" && (
                  <div className="space-y-2.5 rounded-xl border border-[#d9e2e7] bg-[#f8fbfb] p-4 text-[12.8px] leading-relaxed text-[#0b1b29]">
                    {[
                      "Un super utilisateur établissement est défini dans la convention.",
                      "Le contrat fixe le nombre de praticiens autorisés et les services concernés.",
                      "Le super utilisateur pourra inviter les praticiens de l'hôpital dans la limite du quota.",
                    ].map((item) => (
                      <div key={item} className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0e9c8e]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {signupError && signupMode === "practitioner" && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className={`h-auto w-full gap-2 rounded-full py-4 text-[15.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(14,156,142,.9)] transition hover:-translate-y-px ${
                    signupMode === "hospital"
                      ? "bg-[#1e3a5f] hover:bg-[#0b1b29]"
                      : "bg-[#0e9c8e] hover:bg-[#0c8a7d] hover:shadow-[0_16px_32px_-12px_rgba(14,156,142,.95)]"
                  }`}
                >
                  {signupMode === "hospital" ? (
                    <>
                      Demander une convention
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : signupMutation.isPending ? (
                    "Création…"
                  ) : (
                    "Créer mon compte"
                  )}
                </Button>

                <p className="px-1 text-center text-[11.8px] leading-relaxed text-[#8a99a4]">
                  En créant un compte, vous acceptez nos{" "}
                  <a href="#" className="font-semibold text-[#0e9c8e] hover:underline">
                    Conditions d'utilisation
                  </a>{" "}
                  et notre{" "}
                  <a href="#" className="font-semibold text-[#0e9c8e] hover:underline">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0e9c8e]/20 bg-[#eef6f4] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#0a7b70]"
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
