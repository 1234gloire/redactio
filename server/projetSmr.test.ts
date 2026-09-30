import { beforeEach, describe, expect, it, vi } from "vitest";
import { REDACTION_SUBTYPES } from "../shared/redactionOptions";
import { buildProjetSmrSystemPrompt, PROJET_SMR_SUBTYPES } from "./prompts/projetSmrPrompt";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), stream: vi.fn(), audit: vi.fn(), base: vi.fn(), template: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.auth } }));
vi.mock("./db", () => ({ createAuditLog: mocks.audit, getActivePromptBase: mocks.base, getActiveTemplateByVolet: mocks.template }));
vi.mock("./_core/anthropic", () => ({ createAnthropicStream: mocks.stream, extractAnthropicStopReason: () => null, extractAnthropicTextDelta: (data: string) => JSON.parse(data).text }));
import { registerStreamGeneration } from "./streamGeneration";
async function generate(body: unknown) {
  let handler: any;
  registerStreamGeneration({ post: (_path: string, fn: any) => { handler = fn; } } as any);
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn(), flushHeaders: vi.fn(), on: vi.fn(), off: vi.fn(), write: vi.fn(), end: vi.fn(), writableEnded: false };
  await handler({ body }, res);
  return res;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ id: Math.random() });
  mocks.stream.mockImplementation(async () => new Response('data: {"text":"PROJET THÉRAPEUTIQUE SMR\\n- Mobilité à réévaluer."}\n\n'));
});
describe("Projet thérapeutique SMR", () => {
  it("expose les huit profils et assemble uniquement celui choisi", () => {
    expect(REDACTION_SUBTYPES.projet_smr.map(x => x.id)).toEqual([...PROJET_SMR_SUBTYPES]);
    const prompts = PROJET_SMR_SUBTYPES.map(buildProjetSmrSystemPrompt);
    expect(new Set(prompts).size).toBe(8);
    expect(buildProjetSmrSystemPrompt("locomoteur")).toContain("PROFIL SMR : LOCOMOTEUR");
    expect(buildProjetSmrSystemPrompt("locomoteur")).not.toContain("PROFIL SMR : GÉRIATRIE");
    expect(buildProjetSmrSystemPrompt("entree_directe")).toContain("PROFIL SMR : GÉRIATRIE");
    expect(buildProjetSmrSystemPrompt("entree_directe")).toContain("COMPLÉMENT : ENTRÉE DIRECTE");
  });
  it("rejette un profil invalide avant tout appel au moteur", async () => {
    const res = await generate({ volet: "projet_smr", subtype: "smr", rawData: "Observation clinique complète" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.stream).not.toHaveBeenCalled();
  });
  it("pseudonymise l'observation avant le moteur et retourne le contrat SSE", async () => {
    const res = await generate({ volet: "projet_smr", subtype: "locomoteur", rawData: "Patient : téléphone 06 12 34 56 78. Email : patient@example.fr. Rééducation après fracture." });
    const request = mocks.stream.mock.calls[0][0];
    expect(request.system).toContain("PROFIL SMR : LOCOMOTEUR");
    expect(request.messages[0].content).not.toContain("patient@example.fr");
    expect(request.messages[0].content).not.toContain("06 12 34 56 78");
    expect(request.messages[0].content).toContain("Rééducation après fracture");
    expect(mocks.base).not.toHaveBeenCalled();
    expect(mocks.template).not.toHaveBeenCalled();
    const events = res.write.mock.calls.map((x: string[]) => JSON.parse(x[0].slice(6)));
    expect(events.map((x: any) => x.type)).toEqual(["pseudonymisation", "token", "done"]);
    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain("fracture");
  });
});
