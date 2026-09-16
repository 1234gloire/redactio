/**
 * Relais serveur vers la plateforme de pilotage (tickets d'assistance).
 * Le secret partagé (PILOTAGE_TICKET_SECRET) ne doit jamais transiter côté client.
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { getOrganisationById } from "./db";

const TICKET_CATEGORIES = ["Support Technique", "Acces Licence", "Facturation", "Onboarding", "Autre"] as const;

const ticketInputSchema = z.object({
  objet: z.string().trim().min(4, "L'objet doit contenir au moins 4 caractères."),
  description: z.string().trim().max(5000).optional(),
  categorie: z.enum(TICKET_CATEGORIES).default("Support Technique"),
  website: z.string().optional(), // champ piège anti-robot, transmis tel quel
  contexte: z
    .object({
      version: z.string().optional(),
      navigateur: z.string().optional(),
      ecran: z.string().optional(),
      identifiantSession: z.string().optional(),
    })
    .partial()
    .optional(),
});

const PILOTAGE_TIMEOUT_MS = 8000;

interface OuvrirTicketParams {
  praticien: { email: string; nomComplet: string; etablissement: string | null };
  objet: string;
  description?: string;
  categorie: string;
  website?: string;
  contexte?: Record<string, string | undefined>;
}

async function ouvrirTicketPilotage({ praticien, objet, description, categorie, website, contexte }: OuvrirTicketParams) {
  const url = ENV.pilotageTicketUrl;
  const secret = ENV.pilotageTicketSecret;
  if (!url || !secret) throw new Error("Raccordement au pilotage non configuré.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PILOTAGE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        email: praticien.email,
        fullName: praticien.nomComplet,
        organizationName: praticien.etablissement,
        title: objet,
        description,
        category: categorie,
        context: contexte,
        website,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    return { status: response.status, payload };
  } finally {
    clearTimeout(timeout);
  }
}

export function registerSupportTicketRoute(app: Express): void {
  app.post("/api/support/ticket", async (req: Request, res: Response) => {
    let userId: number | null = null;
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
    try {
      user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Non authentifié." });
        return;
      }
      userId = user.id;
    } catch {
      res.status(401).json({ error: "Session invalide." });
      return;
    }

    try {
      const parsed = ticketInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Données invalides.",
          fieldErrors: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        });
        return;
      }
      const { objet, description, categorie, website, contexte } = parsed.data;

      const organisation = user.organisationId ? await getOrganisationById(user.organisationId) : undefined;

      const { status, payload } = await ouvrirTicketPilotage({
        praticien: {
          email: user.email ?? "",
          nomComplet: user.name ?? "",
          etablissement: organisation?.name ?? null,
        },
        objet,
        description,
        categorie,
        website,
        contexte,
      });

      // 201 (créé) et 202 (champ piège rempli) reçoivent la même confirmation
      // côté praticien : ne jamais révéler qu'un robot a été détecté.
      if (status === 201 || status === 202) {
        res.status(200).json({ success: true, ticketId: payload.ticketId, linked: payload.linked ?? false });
        return;
      }
      if (status === 400) {
        res.status(400).json({ error: "Données refusées par la plateforme de pilotage." });
        return;
      }
      if (status === 403) {
        console.error("[SupportTicket] Secret pilotage invalide", { userId });
        res.status(502).json({ error: "La demande n'a pas pu être transmise." });
        return;
      }
      console.error("[SupportTicket] Échec plateforme de pilotage", { userId, status });
      res.status(502).json({ error: "La demande n'a pas pu être transmise." });
    } catch (error) {
      console.error("[SupportTicket] failed", { userId, message: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "La demande n'a pas pu être transmise." });
    }
  });
}
