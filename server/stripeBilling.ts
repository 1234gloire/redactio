import crypto from "crypto";
import express from "express";
import { TRPCError } from "@trpc/server";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  createAuditLog,
  getUserByStripeCustomerId,
  updateUser,
  updateUserByStripeCustomerId,
} from "./db";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2025-11-17.clover";
const PLAN_LABEL = "REDACTIO - Praticien individuel";
const TRIAL_DAYS = 7;

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  customer: string | null;
  subscription: string | null;
  client_reference_id: string | null;
};

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number | null;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
};

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: unknown };
};

function assertStripeConfigured() {
  if (!ENV.stripeSecretKey || !ENV.stripePriceId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Stripe n'est pas encore configuré sur le serveur.",
    });
  }
}

function timestampToDate(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

function appendForm(params: URLSearchParams, key: string, value: string | number | boolean | null | undefined) {
  if (value === undefined || value === null) return;
  params.append(key, String(value));
}

async function stripeRequest<T>(path: string, params: URLSearchParams): Promise<T> {
  assertStripeConfigured();
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: params,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? (data as { error?: { message?: string } }).error?.message
        : undefined;
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: message ?? "Stripe a refusé la demande.",
    });
  }
  return data as T;
}

async function createStripeCustomer(user: User) {
  const params = new URLSearchParams();
  appendForm(params, "email", user.email ?? undefined);
  appendForm(params, "name", user.name ?? undefined);
  appendForm(params, "metadata[userId]", user.id);
  appendForm(params, "metadata[source]", "redactio");
  const customer = await stripeRequest<{ id: string }>("/customers", params);
  await updateUser(user.id, { stripeCustomerId: customer.id });
  return customer.id;
}

function resolveOrigin(req: express.Request) {
  if (ENV.publicAppUrl) return ENV.publicAppUrl.replace(/\/$/, "");
  const forwardedProto = req.get("x-forwarded-proto");
  const proto = forwardedProto?.split(",")[0]?.trim() || req.protocol || "http";
  return `${proto}://${req.get("host")}`;
}

export async function createStripeCheckoutSession(user: User, req: express.Request) {
  assertStripeConfigured();
  const customerId = user.stripeCustomerId || await createStripeCustomer(user);
  const origin = resolveOrigin(req);
  const params = new URLSearchParams();

  appendForm(params, "mode", "subscription");
  appendForm(params, "customer", customerId);
  appendForm(params, "client_reference_id", user.id);
  appendForm(params, "line_items[0][price]", ENV.stripePriceId);
  appendForm(params, "line_items[0][quantity]", 1);
  appendForm(params, "payment_method_collection", "always");
  appendForm(params, "billing_address_collection", "auto");
  appendForm(params, "customer_update[name]", "auto");
  appendForm(params, "customer_update[address]", "auto");
  appendForm(params, "subscription_data[trial_period_days]", TRIAL_DAYS);
  appendForm(params, "subscription_data[metadata][userId]", user.id);
  appendForm(params, "subscription_data[metadata][plan]", "praticien_individuel");
  appendForm(params, "metadata[userId]", user.id);
  appendForm(params, "metadata[plan]", "praticien_individuel");
  appendForm(params, "success_url", `${origin}/dashboard?checkout=success`);
  appendForm(params, "cancel_url", `${origin}/paiement?checkout=cancelled`);
  appendForm(params, "custom_text[submit][message]", "Aucun débit aujourd'hui. L'essai gratuit dure 7 jours.");

  const session = await stripeRequest<StripeCheckoutSession>("/checkout/sessions", params);
  if (!session.url) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Stripe n'a pas retourné d'URL de paiement.",
    });
  }

  await createAuditLog({
    userId: user.id,
    action: "billing.checkout_session_created",
    resource: "stripe.checkout_session",
    resourceId: session.id,
    metadata: { plan: PLAN_LABEL },
  });

  return { url: session.url };
}

export async function createStripeBillingPortalSession(user: User, req: express.Request) {
  assertStripeConfigured();
  if (!user.stripeCustomerId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Aucun abonnement Stripe n'est encore rattaché à ce compte.",
    });
  }

  const origin = resolveOrigin(req);
  const params = new URLSearchParams();
  appendForm(params, "customer", user.stripeCustomerId);
  appendForm(params, "return_url", `${origin}/profil`);

  const session = await stripeRequest<{ id: string; url: string }>("/billing_portal/sessions", params);

  await createAuditLog({
    userId: user.id,
    action: "billing.portal_session_created",
    resource: "stripe.billing_portal_session",
    resourceId: session.id,
    metadata: { customer: user.stripeCustomerId },
  });

  return { url: session.url };
}

function parseStripeSignature(signature: string | undefined) {
  if (!signature) return null;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  return parts.t && parts.v1 ? { timestamp: parts.t, signature: parts.v1 } : null;
}

function verifyStripeSignature(rawBody: Buffer, signatureHeader: string | undefined) {
  if (!ENV.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET missing");
  }
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) return false;
  const signedPayload = `${parsed.timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", ENV.stripeWebhookSecret)
    .update(signedPayload)
    .digest("hex");
  if (expected.length !== parsed.signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.signature));
}

async function syncSubscription(subscription: StripeSubscription) {
  const customerId = subscription.customer;
  const existingUser = await getUserByStripeCustomerId(customerId);
  if (!existingUser) {
    console.warn(`[Stripe] Aucun utilisateur REDACTIO pour customer ${customerId}`);
    return;
  }

  await updateUserByStripeCustomerId(customerId, {
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status,
    stripeCurrentPeriodEnd: timestampToDate(subscription.current_period_end),
    stripeTrialEnd: timestampToDate(subscription.trial_end),
    stripeCancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });

  await createAuditLog({
    userId: existingUser.id,
    action: "billing.subscription_synced",
    resource: "stripe.subscription",
    resourceId: subscription.id,
    metadata: { status: subscription.status },
  });
}

async function handleCheckoutCompleted(session: StripeCheckoutSession) {
  const userId = Number(session.client_reference_id);
  if (!Number.isFinite(userId) || !session.customer) return;
  await updateUser(userId, {
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription ?? undefined,
  });
  await createAuditLog({
    userId,
    action: "billing.checkout_completed",
    resource: "stripe.checkout_session",
    resourceId: session.id,
    metadata: { subscription: session.subscription },
  });
}

export function registerStripeWebhookRoutes(app: express.Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      if (!ENV.stripeWebhookSecret) {
        res.status(503).send("Stripe webhook not configured");
        return;
      }

      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
      if (!verifyStripeSignature(rawBody, req.get("stripe-signature"))) {
        res.status(400).send("Invalid Stripe signature");
        return;
      }

      let event: StripeWebhookEvent | null = null;

      try {
        const parsedEvent = JSON.parse(rawBody.toString("utf8")) as StripeWebhookEvent;
        event = parsedEvent;
        if (event.type === "checkout.session.completed") {
          await handleCheckoutCompleted(event.data.object as StripeCheckoutSession);
        }

        if (
          event.type === "customer.subscription.created" ||
          event.type === "customer.subscription.updated" ||
          event.type === "customer.subscription.deleted"
        ) {
          await syncSubscription(event.data.object as StripeSubscription);
        }
      } catch (error) {
        console.error(`[Stripe] Webhook ${event?.type ?? "unknown"} failed`, error);
        res.status(500).send("Webhook handler failed");
        return;
      }

      res.json({ received: true });
    }
  );
}
