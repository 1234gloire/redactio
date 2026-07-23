import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const email = new URLSearchParams(window.location.search).get("email") ?? "";
  const resetMutation = trpc.auth.resetPasswordSimple.useMutation({
    onSuccess: () => {
      setSuccess(true);
      window.setTimeout(() => setLocation("/login"), 1500);
    },
    onError: (mutationError) => setError(mutationError.message),
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
      setError("Retournez à la page de connexion et saisissez votre adresse email avant de cliquer sur « Mot de passe oublié »." );
      return;
    }
    resetMutation.mutate({ email, password });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fafa] px-6 py-10 text-[#0b1b29]">
      <section className="w-full max-w-[460px] rounded-2xl border border-[#e4ebee] bg-white p-8 shadow-[0_18px_45px_-28px_rgba(11,27,41,.45)]">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#5a6b78] hover:text-[#0a7b70]"><ArrowLeft className="h-4 w-4" /> Retour à la connexion</Link>
        <h1 className="text-[30px] font-semibold leading-tight" style={{ fontFamily: '"Spectral", Georgia, serif' }}>Nouveau mot de <em className="italic text-[#0a7b70]">passe</em></h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="new-password" className="mb-2 block text-[13px] font-bold">Nouveau mot de passe</Label>
            <div className="relative">
              <Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-auto rounded-xl border-[1.5px] border-[#e4ebee] bg-[#f7fafa] px-3.5 py-3 pr-11" />
              <button type="button" onClick={() => setShowPassword((currentValue) => !currentValue)} className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1 text-[#8a99a4] hover:text-[#0e9c8e]" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                {showPassword ? <EyeOff className="h-[19px] w-[19px]" /> : <Eye className="h-[19px] w-[19px]" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-password" className="mb-2 block text-[13px] font-bold">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input id="confirm-password" type={showConfirmation ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required className="h-auto rounded-xl border-[1.5px] border-[#e4ebee] bg-[#f7fafa] px-3.5 py-3 pr-11" />
              <button type="button" onClick={() => setShowConfirmation((currentValue) => !currentValue)} className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1 text-[#8a99a4] hover:text-[#0e9c8e]" aria-label={showConfirmation ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}>
                {showConfirmation ? <EyeOff className="h-[19px] w-[19px]" /> : <Eye className="h-[19px] w-[19px]" />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p role="status" className="rounded-xl border border-[#0e9c8e]/20 bg-[#eef6f4] px-3 py-2 text-sm font-semibold text-[#0a7b70]">Mot de passe réinitialisé avec succès. Redirection vers la connexion…</p>}
          <Button type="submit" disabled={success || resetMutation.isPending} className="h-auto w-full gap-2 rounded-full bg-[#0e9c8e] py-3.5 font-bold hover:bg-[#0c8a7d]"><Lock className="h-4 w-4" />{resetMutation.isPending ? "Modification…" : "Modifier le mot de passe"}</Button>
        </form>
      </section>
    </main>
  );
}
