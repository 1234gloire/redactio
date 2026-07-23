import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const mutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email: email.trim() });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fafa] px-6 py-10 text-[#0b1b29]">
      <section className="w-full max-w-[460px] rounded-2xl border border-[#e4ebee] bg-white p-8 shadow-[0_18px_45px_-28px_rgba(11,27,41,.45)]">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#5a6b78] hover:text-[#0a7b70]">
          <ArrowLeft className="h-4 w-4" /> Retour à la connexion
        </Link>
        <h1 className="text-[30px] font-semibold leading-tight" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Mot de passe <em className="italic text-[#0a7b70]">oublié</em> ?
        </h1>
        {submitted ? (
          <p className="mt-4 rounded-xl border border-[#0e9c8e]/20 bg-[#eef6f4] px-4 py-3 text-sm leading-relaxed text-[#315c5a]">
            Si un compte correspond à cette adresse, un lien de réinitialisation va être envoyé. Pensez à vérifier vos courriers indésirables.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <p className="text-sm leading-relaxed text-[#5a6b78]">Saisissez l’adresse utilisée pour votre compte REDACTIO.</p>
            <div>
              <Label htmlFor="reset-email" className="mb-2 block text-[13px] font-bold">Adresse email</Label>
              <Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-auto rounded-xl border-[1.5px] border-[#e4ebee] bg-[#f7fafa] px-3.5 py-3" />
            </div>
            {mutation.error && <p role="alert" className="text-sm text-red-700">Une erreur est survenue. Réessayez dans quelques instants.</p>}
            <Button type="submit" disabled={mutation.isPending} className="h-auto w-full gap-2 rounded-full bg-[#0e9c8e] py-3.5 font-bold hover:bg-[#0c8a7d]">
              <Mail className="h-4 w-4" />
              {mutation.isPending ? "Envoi…" : "Recevoir le lien"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
