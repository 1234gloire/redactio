/**
 * streamGeneration.ts
 * Endpoint Express SSE pour la génération IA en streaming.
 * EXG-API-02 : Aucun contenu médical n'est journalisé.
 * EXG-PSE-01 : La pseudonymisation est synchrone et bloquante.
 */
import type { Express, Request, Response } from "express";
import { pseudonymise } from "./pseudonymisation";
import { createAuditLog, getActivePromptBase, getActiveTemplateByVolet } from "./db";
import { DEFAULT_PROMPT_BASE, DEFAULT_TEMPLATES } from "./defaultPrompts";
import { sdk } from "./_core/sdk";
import { createAnthropicStream, extractAnthropicTextDelta } from "./_core/anthropic";

const RAW_DATA_MAX_CHARS = 50_000;

// ─── Rate limiting en mémoire (par userId) ───────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 générations / minute / utilisateur

const rateLimitMap = new Map<number, { count: number; windowStart: number }>();

function checkRateLimit(userId: number): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true };
}

// ─── Volets valides ───────────────────────────────────────────────────────────
type Volet = "courrier_sortie" | "conciliation" | "correspondance";
const VALID_VOLETS: Volet[] = ["courrier_sortie", "conciliation", "correspondance"];

// ─── Enregistrement de la route SSE ──────────────────────────────────────────
export function registerStreamGeneration(app: Express) {
  app.post("/api/generate/stream", async (req: Request, res: Response) => {
    // 1. Authentification via cookie de session
    let userId: number;
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Non authentifié." });
        return;
      }
      userId = user.id;
    } catch {
      res.status(401).json({ error: "Session invalide." });
      return;
    }

    // 2. Validation des paramètres
    const { volet, rawData } = req.body as { volet?: string; rawData?: string };
    if (!volet || !VALID_VOLETS.includes(volet as Volet)) {
      res.status(400).json({ error: "Volet invalide." });
      return;
    }
    if (!rawData || typeof rawData !== "string" || rawData.trim().length < 10) {
      res.status(400).json({ error: "Données médicales trop courtes (min 10 caractères)." });
      return;
    }
    if (rawData.length > RAW_DATA_MAX_CHARS) {
      res.status(400).json({ error: `Données médicales trop longues (max ${RAW_DATA_MAX_CHARS} caractères).` });
      return;
    }

    // 3. Rate limiting
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: `Trop de requêtes. Réessayez dans ${Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)} secondes.`,
      });
      return;
    }

    // 4. Pseudonymisation synchrone et bloquante (EXG-PSE-01)
    const pseudoResult = pseudonymise(rawData);

    // 5. Résolution du prompt actif
    const [base, template] = await Promise.all([
      getActivePromptBase(),
      getActiveTemplateByVolet(volet as Volet),
    ]);
    const baseContent = base?.content ?? DEFAULT_PROMPT_BASE.content;
    const templateContent = (
      template?.content ??
      DEFAULT_TEMPLATES.find((t) => t.volet === volet)?.content ??
      ""
    ).replace("{{DONNEES_MEDICALES}}", pseudoResult.filteredText);

    // 6. Configuration SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // 7. Envoi des méta-données de pseudonymisation
    res.write(
      `data: ${JSON.stringify({
        type: "pseudonymisation",
        maskCount: pseudoResult.maskCount,
        detectedCategories: pseudoResult.detectedCategories,
        hasPotentialOvermasking: pseudoResult.hasPotentialOvermasking,
      })}\n\n`
    );

    // 8. Appel LLM en streaming
    let finished = false;
    let tokenCount = 0;

    const handleClose = () => {
      finished = true;
    };
    res.on("close", handleClose);

    try {
      const llmResponse = await createAnthropicStream({
        system: baseContent,
        messages: [{ role: "user", content: templateContent }],
      });

      if (!llmResponse.ok || !llmResponse.body) {
        const errorText = await llmResponse.text().catch(() => "");
        throw new Error(`Anthropic stream failed: ${llmResponse.status} ${errorText}`);
      }

      const reader = llmResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (finished) break;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            finished = true;
            break;
          }
          try {
            const delta = extractAnthropicTextDelta(data);
            if (delta) {
              tokenCount++;
              res.write(`data: ${JSON.stringify({ type: "token", content: delta })}\n\n`);
            }
          } catch (error) {
            if (error instanceof SyntaxError) continue;
            throw error;
          }
        }
      }

      reader.cancel().catch(() => {});
    } catch (err) {
      if (!finished) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: "Le moteur de génération est temporairement indisponible.",
          })}\n\n`
        );
      }
    }

    // 9. Journalisation technique SANS contenu médical (EXG-API-02)
    try {
      await createAuditLog({
        userId,
        action: "generation.stream.complete",
        resource: "generation",
        metadata: {
          volet,
          maskCount: pseudoResult.maskCount,
          detectedCategories: pseudoResult.detectedCategories,
          hasPotentialOvermasking: pseudoResult.hasPotentialOvermasking,
          tokenCount,
          promptBaseVersion: base?.version ?? "default",
          promptTemplateVersion: template?.version ?? "default",
          // JAMAIS de contenu médical ici
        },
      });
    } catch {
      // Audit non bloquant
    }

    // 10. Fin du stream
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    }

    res.off("close", handleClose);
  });
}
