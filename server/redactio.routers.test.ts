import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type CookieCall = { name: string; options: Record<string, unknown> };

function makeCtx(role: "admin" | "praticien" | "user" = "praticien"): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
} {
  const clearedCookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@chu.fr",
      name: "Dr. Test",
      loginMethod: "email",
      role: role as "admin" | "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

// ─── Tests auth ──────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("efface le cookie de session et retourne success:true", async () => {
    const { ctx, clearedCookies } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });

  it("retourne l'utilisateur courant via auth.me", async () => {
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("test@chu.fr");
  });
});

// ─── Tests pseudonymisation (via le routeur) ──────────────────────────────────

describe("generation.pseudonymisePreview", () => {
  it("masque un NIR dans le texte brut — retourne maskCount > 0", async () => {
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generation.pseudonymisePreview({
      text: "Patient NIR 1 85 06 75 112 345 12, né le 15/03/1965",
    });
    expect(result.maskCount).toBeGreaterThan(0);
    expect(result.detectedCategories).toContain("NIR");
  });

  it("retourne maskCount=0 pour un texte sans identifiant", async () => {
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generation.pseudonymisePreview({
      text: "Insuffisance cardiaque gauche avec FEVG à 35%.",
    });
    expect(result.maskCount).toBe(0);
    expect(result.hasPotentialOvermasking).toBe(false);
  });
});
