import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Eye, EyeOff, FileText, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type AuthMode = "login" | "register";

function getReturnPath() {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const returnPath = params.get("returnPath");
  if (!returnPath || !returnPath.startsWith("/")) return "/dashboard";
  if (returnPath.startsWith("//")) return "/dashboard";
  return returnPath;
}

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const returnPath = useMemo(getReturnPath, []);
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    specialite: "",
    rpps: "",
    marketingOptIn: false,
  });

  const finishAuth = () => {
    setLocation(returnPath);
    window.location.assign(returnPath);
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: finishAuth,
    onError: (err) => {
      setError(err.message || "Connexion impossible.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: finishAuth,
    onError: (err) => {
      setError(err.message || "Inscription impossible.");
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation(returnPath);
    }
  }, [isAuthenticated, loading, returnPath, setLocation]);

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    registerMutation.mutate({
      ...registerForm,
      rpps: registerForm.rpps.trim() || undefined,
      specialite: registerForm.specialite.trim() || undefined,
    });
  };

  return (
    <main className="min-h-screen bg-[#EEF7F7] text-[#0B2A26]">
      <div className="fixed inset-y-0 left-0 hidden w-10 bg-[#26A69A] shadow-[10px_0_40px_rgba(38,166,154,0.18)] sm:block" />
      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[560px] rounded-[24px] border border-[#CFE0DE] bg-white px-8 py-9 shadow-[0_28px_80px_rgba(11,42,38,0.12)] sm:px-12 sm:py-12">
          <div className="mb-8 flex items-start gap-4">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1E3A5F] text-white">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[2.15rem] font-extrabold leading-tight tracking-[-0.02em] text-[#0B2A26]">
                Bon retour
              </h1>
              <p className="mt-2 text-xl font-medium text-[#66807C]">
                Connectez-vous à votre espace REDACTIO.
              </p>
            </div>
          </div>

          <div className="mb-8 grid rounded-[18px] bg-[#EAF0EF] p-1.5">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                className={`rounded-[15px] px-5 py-4 text-lg font-extrabold transition ${
                  mode === "login"
                    ? "bg-white text-[#0B2A26] shadow-[0_3px_12px_rgba(11,42,38,0.12)]"
                    : "text-[#6B817D]"
                }`}
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                Connexion
              </button>
              <button
                type="button"
                className={`rounded-[15px] px-5 py-4 text-lg font-extrabold transition ${
                  mode === "register"
                    ? "bg-white text-[#0B2A26] shadow-[0_3px_12px_rgba(11,42,38,0.12)]"
                    : "text-[#6B817D]"
                }`}
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                Inscription
              </button>
            </div>
          </div>

          {mode === "login" ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              <Field label="Adresse email" htmlFor="login-email">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((form) => ({ ...form, email: event.target.value }))
                  }
                  required
                  className="auth-input"
                />
              </Field>

              <Field
                label="Mot de passe"
                htmlFor="login-password"
                right={
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() =>
                      setError(
                        "La réinitialisation du mot de passe sera activée avec le module email."
                      )
                    }
                  >
                    Oublié ?
                  </button>
                }
              >
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  show={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  onChange={(password) =>
                    setLoginForm((form) => ({ ...form, password }))
                  }
                />
              </Field>

              <AuthError message={error} />

              <SubmitButton pending={isPending} label="Se connecter" />
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleRegister}>
              <Field label="Nom complet" htmlFor="register-name">
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Dr Martin"
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((form) => ({ ...form, name: event.target.value }))
                  }
                  required
                  className="auth-input"
                />
              </Field>

              <Field label="Adresse email" htmlFor="register-email">
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((form) => ({ ...form, email: event.target.value }))
                  }
                  required
                  className="auth-input"
                />
              </Field>

              <Field label="Mot de passe" htmlFor="register-password">
                <PasswordInput
                  id="register-password"
                  autoComplete="new-password"
                  value={registerForm.password}
                  show={showPassword}
                  minLength={8}
                  onToggle={() => setShowPassword((value) => !value)}
                  onChange={(password) =>
                    setRegisterForm((form) => ({ ...form, password }))
                  }
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Spécialité" htmlFor="register-specialite">
                  <input
                    id="register-specialite"
                    type="text"
                    placeholder="Cardiologie"
                    value={registerForm.specialite}
                    onChange={(event) =>
                      setRegisterForm((form) => ({
                        ...form,
                        specialite: event.target.value,
                      }))
                    }
                    className="auth-input"
                  />
                </Field>
                <Field label="RPPS" htmlFor="register-rpps">
                  <input
                    id="register-rpps"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    placeholder="11 chiffres"
                    value={registerForm.rpps}
                    onChange={(event) =>
                      setRegisterForm((form) => ({ ...form, rpps: event.target.value }))
                    }
                    className="auth-input"
                  />
                </Field>
              </div>

              <label className="flex cursor-pointer gap-4 rounded-[16px] border border-[#D7E5E2] bg-[#F8FBFA] p-4 text-base font-semibold leading-relaxed text-[#66807C] transition hover:border-[#26A69A]">
                <span className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#26A69A] bg-white">
                  <input
                    type="checkbox"
                    checked={registerForm.marketingOptIn}
                    onChange={(event) =>
                      setRegisterForm((form) => ({
                        ...form,
                        marketingOptIn: event.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <span className="h-3.5 w-3.5 rounded-full bg-[#26A69A] opacity-0 transition peer-checked:opacity-100" />
                </span>
                <span>
                  J'accepte de recevoir des emails d'information, newsletters et
                  actualités de la formation d'Agape Formation.{" "}
                  <span className="font-bold">(facultatif)</span>
                </span>
              </label>

              <AuthError message={error} />

              <SubmitButton pending={isPending} label="Créer mon compte" />
              <p className="text-center text-sm font-semibold leading-relaxed text-[#66807C]">
                En créant un compte, vous acceptez nos{" "}
                <a className="text-[#07998F] hover:underline" href="/conditions-utilisation">
                  Conditions d'utilisation
                </a>{" "}
                et notre{" "}
                <a className="text-[#07998F] hover:underline" href="/politique-confidentialite">
                  Politique de confidentialité
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </section>

      <style>{`
        .auth-input {
          width: 100%;
          height: 58px;
          border-radius: 14px;
          border: 1.5px solid #CFE0DE;
          background: #F7FBFA;
          padding: 0 18px;
          color: #0B2A26;
          font-size: 1.06rem;
          font-weight: 650;
          outline: none;
          transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
        }
        .auth-input::placeholder { color: #6F8884; opacity: 1; }
        .auth-input:focus {
          border-color: #26A69A;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(38,166,154,.15);
        }
        .auth-link {
          color: #159C92;
          font-size: .95rem;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  right,
  children,
}: {
  label: string;
  htmlFor: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-lg font-extrabold text-[#0B2A26]">
          {label}
        </label>
        {right}
      </div>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  autoComplete,
  value,
  show,
  minLength,
  onToggle,
  onChange,
}: {
  id: string;
  autoComplete: string;
  value: string;
  show: boolean;
  minLength?: number;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder="••••••••"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={minLength}
        className="auth-input pr-14"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B817D] transition hover:text-[#0B2A26]"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-[62px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#26A69A] text-lg font-extrabold text-white shadow-[0_10px_22px_rgba(38,166,154,0.22)] transition hover:bg-[#1E958B] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 className="h-5 w-5 animate-spin" />}
      {pending ? "Veuillez patienter…" : label}
    </button>
  );
}
