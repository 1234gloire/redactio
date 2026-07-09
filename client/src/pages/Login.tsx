import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Building2, Check, Eye, EyeOff, FileText, Lock, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";

const TRUST_CHIPS = ["RGPD", "Hébergement HDS", "Secret médical", "Pseudonymisation"];

type Tab = "login" | "signup";
type SignupMode = "practitioner" | "hospital";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("login");
  const [signupMode, setSignupMode] = useState<SignupMode>("practitioner");

  // --- Connexion ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Inscription ---
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
    onError: (err) => {
      setError(err.message || "Connexion impossible.");
    },
  });

  const signupMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setLocation("/dashboard");
      window.location.reload();
    },
    onError: (err) => {
      setSignupError(err.message || "Inscription impossible.");
    },
  });

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
    signupMutation.mutate({
      name: fullName,
      email: signupEmail,
      password: signupPassword,
      specialite: specialty,
      rpps,
      marketingOptIn: marketingConsent,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#eaf3f0] to-[#e3eef2]">
      {/* Bandeau conformité */}
      <div className="bg-[#0b1b29] text-[#c7d3dc] text-[12.5px] px-4 py-2.5 flex flex-wrap items-center justify-center gap-5">
        <span className="flex items-center gap-2 text-[#e7edf2] font-medium">
          <ShieldCheck className="w-[15px] h-[15px] text-[#0e9c8e]" />
          Conforme aux exigences de protection des données de santé
        </span>
        <span className="flex flex-wrap gap-4">
          {TRUST_CHIPS.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 before:content-['✓'] before:text-[#0e9c8e] before:font-bold"
            >
              {label}
            </span>
          ))}
        </span>
      </div>

      {/* Centre */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px] bg-white border border-white/70 rounded-3xl shadow-[0_30px_70px_-30px_rgba(11,27,41,0.28),0_2px_8px_rgba(11,27,41,0.05)] px-10 py-9">
          {/* Logo lockup */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#0b1b29] text-white flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(11,27,41,0.6)]">
              <FileText className="w-[22px] h-[22px]" />
            </div>
            <div>
              <div className="font-extrabold text-[19px] tracking-wide leading-none text-[#0b1b29]">
                REDACTIO
              </div>
              <div className="text-[9.5px] tracking-[2.4px] text-[#8a99a4] uppercase mt-1 font-semibold">
                Rédaction hospitalière
              </div>
            </div>
          </div>

          {tab === "login" ? (
            <>
              <h1 className="font-serif font-semibold text-[30px] leading-tight tracking-tight text-[#0b1b29] mb-1.5">
                Bon <em className="italic text-[#0a7b70]">retour</em>.
              </h1>
              <p className="text-[#5a6b78] text-[14.5px] mb-6">
                Connectez-vous à votre espace REDACTIO.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif font-semibold text-[30px] leading-tight tracking-tight text-[#0b1b29] mb-1.5">
                Créons votre <em className="italic text-[#0a7b70]">compte</em>.
              </h1>
              <p className="text-[#5a6b78] text-[14.5px] mb-6">
                Choisissez le parcours adapté : praticien individuel ou convention hospitalière.
              </p>
            </>
          )}

          {/* Tabs */}
          <div className="flex bg-[#eef2f4] rounded-2xl p-1.5 gap-1 mb-6">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 text-[14.5px] font-bold rounded-[10px] py-2.5 px-2 transition-all ${
                tab === "login"
                  ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,0.18),0_0_0_1px_rgba(14,156,142,0.14)]"
                  : "text-[#5a6b78]"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 text-[14.5px] font-bold rounded-[10px] py-2.5 px-2 transition-all ${
                tab === "signup"
                  ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,0.18),0_0_0_1px_rgba(14,156,142,0.14)]"
                  : "text-[#5a6b78]"
              }`}
            >
              Inscription
            </button>
          </div>

          {/* ===== CONNEXION ===== */}
          {tab === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="email" className="text-[13px] font-bold text-[#0b1b29] mb-1.5 block">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="bg-[#f6f9f9] border-[1.5px] border-[#e4ebee] rounded-[11px] px-3.5 py-3 text-[14.5px] placeholder:text-[#8a99a4] focus-visible:ring-[3px] focus-visible:ring-[#0e9c8e]/20 focus-visible:border-[#0e9c8e]"
                />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1.5">
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
                    className="bg-[#f6f9f9] border-[1.5px] border-[#e4ebee] rounded-[11px] px-3.5 py-3 pr-10 text-[14.5px] placeholder:text-[#8a99a4] focus-visible:ring-[3px] focus-visible:ring-[#0e9c8e]/20 focus-visible:border-[#0e9c8e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a99a4] hover:text-[#0e9c8e]"
                    aria-label="Afficher le mot de passe"
                  >
                    {showPassword ? <EyeOff className="w-[19px] h-[19px]" /> : <Eye className="w-[19px] h-[19px]" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[11px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full gap-2 bg-[#0e9c8e] hover:bg-[#0c8a7d] text-white font-bold text-[15.5px] rounded-[11px] py-6 shadow-[0_12px_26px_-12px_rgba(14,156,142,0.85)] hover:shadow-[0_16px_30px_-12px_rgba(14,156,142,0.9)] transition-all"
              >
                <Lock className="w-4 h-4" />
                {loginMutation.isPending ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
          )}

          {/* ===== INSCRIPTION ===== */}
          {tab === "signup" && (
            <>
            <div className="grid grid-cols-2 gap-2 mb-5 rounded-2xl bg-[#eef2f4] p-1.5">
              <button
                type="button"
                onClick={() => setSignupMode("practitioner")}
                className={`flex items-center justify-center gap-2 rounded-[10px] px-2 py-2.5 text-[13px] font-bold transition-all ${
                  signupMode === "practitioner"
                    ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,0.18),0_0_0_1px_rgba(14,156,142,0.14)]"
                    : "text-[#5a6b78]"
                }`}
              >
                <UserRound className="h-4 w-4" />
                Praticien
              </button>
              <button
                type="button"
                onClick={() => setSignupMode("hospital")}
                className={`flex items-center justify-center gap-2 rounded-[10px] px-2 py-2.5 text-[13px] font-bold transition-all ${
                  signupMode === "hospital"
                    ? "bg-white text-[#0a7b70] shadow-[0_4px_12px_-4px_rgba(11,27,41,0.18),0_0_0_1px_rgba(14,156,142,0.14)]"
                    : "text-[#5a6b78]"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Convention
              </button>
            </div>

            {signupMode === "practitioner" ? (
            <form className="space-y-4" onSubmit={handleSignup}>
              <div className="rounded-[11px] border border-[#0e9c8e]/20 bg-[#eef6f4] px-3.5 py-3 text-[12.8px] leading-relaxed text-[#0a7b70]">
                <strong>Inscription praticien individuel.</strong> Ce compte est personnel et déclenche le suivi d'inscription REDACTIO.
              </div>
              <div>
                <Label htmlFor="fullName" className="text-[13px] font-bold text-[#0b1b29] mb-1.5 block">
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
                  className="bg-[#f6f9f9] border-[1.5px] border-[#e4ebee] rounded-[11px] px-3.5 py-3 text-[14.5px] placeholder:text-[#8a99a4] focus-visible:ring-[3px] focus-visible:ring-[#0e9c8e]/20 focus-visible:border-[#0e9c8e]"
                />
              </div>

              <div>
                <Label htmlFor="signupEmail" className="text-[13px] font-bold text-[#0b1b29] mb-1.5 block">
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
                  className="bg-[#f6f9f9] border-[1.5px] border-[#e4ebee] rounded-[11px] px-3.5 py-3 text-[14.5px] placeholder:text-[#8a99a4] focus-visible:ring-[3px] focus-visible:ring-[#0e9c8e]/20 focus-visible:border-[#0e9c8e]"
                />
              </div>

              <div>
                <Label htmlFor="signupPassword" className="text-[13px] font-bold text-[#0b1b29] mb-1.5 block">
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
                    required
                    minLength={8}
                    className="bg-[#f6f9f9] border-[1.5px] border-[#e4ebee] rounded-[11px] px-3.5 py-3 pr-10 text-[14.5px] placeholder:text-[#8a99a4] focus-visible:ring-[3px] focus-visible:ring-[#0e9c8e]/20 focus-visible:border-[#0e9c8e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a99a4] hover:text-[#0e9c8e]"
                    aria-label="Afficher le mot de passe"
                  >
                    {showSignupPassword ? <EyeOff className="w-[19px] h-[19px]" /> : <Eye className="w-[19px] h-[19px]" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <Label htmlFor="specialty" className="text-[13px] font-bold text-[#0b1b29] mb-1.5 block">
                    Spécialité
                  </Label>
                  <Input
                    id="specialty"
                    type="text"
                    placeholder="Cardiologie"
                    value={specialty}
                    onChange={(event) => setSpecialty(event.target.value)}
                    required
                    className="bg-[#f6f9f9] border-[1.5px] border-[#e4ebee] rounded-[11px] px-3.5 py-3 text-[14.5px] placeholder:text-[#8a99a4] focus-visible:ring-[3px] focus-visible:ring-[#0e9c8e]/20 focus-visible:border-[#0e9c8e]"
                  />
                </div>
                <div>
                  <Label htmlFor="rpps" className="text-[13px] font-bold text-[#0b1b29] mb-1.5 block">
                    RPPS <span className="font-normal text-[#5a6b78]">(facultatif)</span>
                  </Label>
                  <Input
                    id="rpps"
                    type="text"
                    inputMode="numeric"
                    placeholder="11 chiffres"
                    pattern="\d{11}"
                    title="Le numéro RPPS doit comporter 11 chiffres"
                    value={rpps}
                    onChange={(event) => setRpps(event.target.value)}
                    className="bg-[#f6f9f9] border-[1.5px] border-[#e4ebee] rounded-[11px] px-3.5 py-3 text-[14.5px] placeholder:text-[#8a99a4] focus-visible:ring-[3px] focus-visible:ring-[#0e9c8e]/20 focus-visible:border-[#0e9c8e]"
                  />
                </div>
              </div>

              <label className="flex gap-3 items-start bg-[#eef6f4] border border-[#e4ebee] rounded-[11px] px-3.5 py-3.5 text-[12.7px] text-[#5a6b78] leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) => setMarketingConsent(event.target.checked)}
                  className="w-5 h-5 accent-[#0e9c8e] mt-0.5 shrink-0"
                />
                <span>
                  J'accepte de recevoir des emails d'information, newsletters et actualités de REDACTIO.{" "}
                  <em className="italic">(facultatif)</em>
                </span>
              </label>

              {signupError && (
                <div className="flex items-start gap-2 rounded-[11px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{signupError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-[#0e9c8e] hover:bg-[#0c8a7d] text-white font-bold text-[15.5px] rounded-[11px] py-6 shadow-[0_12px_26px_-12px_rgba(14,156,142,0.85)] hover:shadow-[0_16px_30px_-12px_rgba(14,156,142,0.9)] transition-all"
              >
                {signupMutation.isPending ? "Création…" : "Créer mon compte"}
              </Button>

              <p className="text-center text-[11.8px] text-[#8a99a4] leading-relaxed">
                En créant un compte, vous acceptez nos{" "}
                <a href="#" className="text-[#0e9c8e] font-semibold hover:underline">
                  Conditions d'utilisation
                </a>{" "}
                et notre{" "}
                <a href="#" className="text-[#0e9c8e] font-semibold hover:underline">
                  Politique de confidentialité
                </a>
                .
              </p>
            </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[14px] border border-[#d9e2e7] bg-[#f8fbfb] p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1b29] text-white">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-[15px] font-extrabold text-[#0b1b29]">Convention hospitalière</h2>
                      <p className="mt-1 text-[12.8px] leading-relaxed text-[#5a6b78]">
                        Ce parcours n'ouvre pas un compte automatiquement. L'accès est créé après validation du contrat établissement.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-[12.8px] leading-relaxed text-[#0b1b29]">
                    <div className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0e9c8e]" />
                      <span>Un super utilisateur établissement est défini dans la convention.</span>
                    </div>
                    <div className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0e9c8e]" />
                      <span>Le contrat fixe le nombre de praticiens autorisés et les services concernés.</span>
                    </div>
                    <div className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0e9c8e]" />
                      <span>Le super utilisateur pourra ensuite inviter les praticiens de l'hôpital dans la limite du quota.</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[11px] border border-[#f0d9a8] bg-[#fff8e6] px-3.5 py-3 text-[12.7px] leading-relaxed text-[#7a5a0e]">
                  Pour mettre en place une convention, passez par la demande de démonstration établissement ou par votre interlocuteur REDACTIO. Aucun webhook d'inscription individuelle n'est déclenché ici.
                </div>

                <Button
                  type="button"
                  onClick={() => { window.location.href = "/#demo"; }}
                  className="w-full bg-[#1e3a5f] hover:bg-[#0b1b29] text-white font-bold text-[15.5px] rounded-[11px] py-6 shadow-[0_12px_26px_-12px_rgba(30,58,95,0.75)] transition-all"
                >
                  Demander une convention hospitalière
                </Button>
              </div>
            )}
            </>
          )}

          {/* Chips confiance */}
          <div className="flex flex-wrap gap-2 justify-center mt-6 pt-5 border-t border-[#e4ebee]">
            {TRUST_CHIPS.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0a7b70] bg-[#eef6f4] border border-[#0e9c8e]/20 px-2.5 py-1.5 rounded-full"
              >
                <ShieldCheck className="w-[13px] h-[13px]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
