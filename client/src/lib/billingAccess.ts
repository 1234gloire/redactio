type BillingUser = {
  role?: string | null;
  stripeSubscriptionStatus?: string | null;
};

const ACTIVE_STRIPE_STATUSES = new Set(["trialing", "active"]);

export function requiresIndividualPaymentActivation(user: BillingUser | null | undefined) {
  if (!user) return false;
  if (user.role !== "praticien") return false;
  return !ACTIVE_STRIPE_STATUSES.has(user.stripeSubscriptionStatus ?? "");
}

