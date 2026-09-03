type PasswordStrengthProps = {
  password: string;
};

function getStrength(password: string) {
  if (!password) {
    return { score: 0, label: "", color: "bg-[#e4ebee]", textColor: "text-[#8a99a4]" };
  }

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (score <= 2) {
    return { score, label: "Faible", color: "bg-[#d96b6b]", textColor: "text-[#b34d4d]" };
  }
  if (score <= 4) {
    return { score, label: "Moyen", color: "bg-[#d6a84f]", textColor: "text-[#9b731c]" };
  }
  return { score, label: "Fort", color: "bg-[#0e9c8e]", textColor: "text-[#0a7b70]" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getStrength(password);

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map(segment => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full transition-colors ${
              segment <= strength.score ? strength.color : "bg-[#e4ebee]"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1 text-[11px] font-semibold ${strength.textColor}`}>
        {strength.label || "Minimum 8 caractères"}
      </p>
    </div>
  );
}