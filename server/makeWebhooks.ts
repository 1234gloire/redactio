import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";

type DemoRequestPayload = {
  name: string;
  fonction: string;
  etablissement: string;
  email: string;
  praticiensConcernes: string;
  besoin?: string;
};

type SignupPayload = {
  userId: number;
  name: string | null;
  email: string | null;
  role: string | null;
  specialite?: string;
  rpps?: string;
  marketingOptIn: boolean;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function postToMake(webhookUrl: string, payload: Record<string, unknown>) {
  if (!webhookUrl) return { skipped: true as const };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  let response: globalThis.Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Make webhook failed with status ${response.status}`);
  }

  return { skipped: false as const };
}

export async function notifySignupCreated(payload: SignupPayload) {
  try {
    await postToMake(ENV.makeSignupWebhookUrl, {
      event: "signup_created",
      source: "redactio",
      signupType: "praticien_individuel",
      paymentStatus: "pending",
      nextStep: "stripe_checkout",
      submittedAt: new Date().toISOString(),
      ...payload,
    });
  } catch (error) {
    console.error("[MakeWebhook] signup_created failed", {
      message: error instanceof Error ? error.message : String(error),
      email: payload.email,
    });
  }
}

export function registerMakeWebhookRoutes(app: Express) {
  app.post("/api/demo-request", async (req: Request, res: Response) => {
    try {
      if (!ENV.makeDemoWebhookUrl) {
        res.status(503).json({ error: "Le webhook de démonstration n'est pas configuré." });
        return;
      }

      const payload: DemoRequestPayload = {
        name: cleanString(req.body?.name),
        fonction: cleanString(req.body?.fonction),
        etablissement: cleanString(req.body?.etablissement),
        email: cleanString(req.body?.email).toLowerCase(),
        praticiensConcernes: cleanString(req.body?.praticiensConcernes),
        besoin: cleanString(req.body?.besoin),
      };

      if (!payload.name || !payload.email || !payload.etablissement) {
        res.status(400).json({ error: "Nom, email et établissement sont requis." });
        return;
      }

      await postToMake(ENV.makeDemoWebhookUrl, {
        event: "demo_request",
        source: "redactio_landing",
        submittedAt: new Date().toISOString(),
        ...payload,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[MakeWebhook] demo_request failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      res.status(502).json({ error: "Demande non envoyée pour le moment. Réessayez dans quelques instants." });
    }
  });
}
