import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import {
  getDefaultSubtype,
  isValidSubtypeForVolet,
  type RedactionSubtype,
} from "@shared/redactionOptions";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { hashPassword, verifyPassword } from "./_core/passwords";
import { getLocalOpenId, sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  countMedicalTerms,
  createMedicalTerm,
  deactivateMedicalTerm,
  incrementMedicalTermUsage,
  listMedicalTermsPaginated,
  searchMedicalTerms,
  updateMedicalTerm,
  createAuditLog,
  createOrganisation,
  createPromptBase,
  createPromptTemplate,
  createTestCase,
  getActivePromptBase,
  getActiveTemplateByVolet,
  getOrganisationById,
  getPromptBaseById,
  getPromptTemplateById,
  getUserByEmail,
  getUserById,
  listAuditLogs,
  listOrganisations,
  listPromptBases,
  listPromptTemplates,
  listTestCases,
  listUsersByOrg,
  updateOrganisation,
  updatePromptBase,
  updatePromptTemplate,
  updateTestCase,
  updateUser,
  upsertUser,
} from "./db";
import { pseudonymise } from "./pseudonymisation";
import { createAnthropicMessage } from "./_core/anthropic";
import {
  buildTemplateForSubtype,
  DEFAULT_PROMPT_BASE,
  DEFAULT_TEMPLATES,
  DEFAULT_TEST_CASES,
} from "./defaultPrompts";

const RAW_DATA_MAX_CHARS = 200_000;

// ─── Helpers RBAC ─────────────────────────────────────────────────────────────

type UserRole =
  | "praticien"
  | "editeur_medical"
  | "relecteur_clinique"
  | "responsable_conformite"
  | "admin";

function requireRole(userRole: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès refusé : rôle insuffisant.",
    });
  }
}

const adminOrEditorProcedure = protectedProcedure.use(({ ctx, next }) => {
  requireRole(ctx.user.role as UserRole, [
    "admin",
    "editeur_medical",
    "responsable_conformite",
  ]);
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  requireRole(ctx.user.role as UserRole, ["admin"]);
  return next({ ctx });
});

// ─── Router principal ─────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ─── Authentification ──────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        let user = await getUserByEmail(email);

        const expectedBootstrapEmail = ENV.localAdminEmail.trim().toLowerCase();
        const isBootstrapAdmin =
          Boolean(ENV.localAdminEmail && ENV.localAdminPassword) &&
          email === expectedBootstrapEmail;

        if (isBootstrapAdmin) {
          if (!user) {
            const passwordHash = await hashPassword(ENV.localAdminPassword);
            await upsertUser({
              openId: getLocalOpenId(email),
              name: ENV.localAdminName,
              email,
              passwordHash,
              passwordUpdatedAt: new Date(),
              loginMethod: "password",
              role: "admin",
              lastSignedIn: new Date(),
            });
            user = await getUserByEmail(email);
          } else if (!user.passwordHash) {
            await updateUser(user.id, {
              passwordHash: await hashPassword(ENV.localAdminPassword),
              passwordUpdatedAt: new Date(),
              loginMethod: "password",
              role: "admin",
            });
            user = await getUserByEmail(email);
          }
        }

        if (!user || !user.active || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Identifiants invalides.",
          });
        }

        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Identifiants invalides.",
          });
        }

        await updateUser(user.id, { lastSignedIn: new Date() });

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profil utilisateur ────────────────────────────────────────────────────
  user: router({
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(128).optional(),
          specialite: z.string().max(128).optional(),
          rpps: z.string().length(11).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUser(ctx.user.id, input);
        await createAuditLog({
          userId: ctx.user.id,
          action: "user.update_profile",
          resource: "user",
          resourceId: String(ctx.user.id),
          metadata: { fields: Object.keys(input) },
        });
        return { success: true };
      }),

    listByOrg: adminProcedure
      .input(z.object({ organisationId: z.number() }))
      .query(async ({ input }) => {
        return listUsersByOrg(input.organisationId);
      }),

    setRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum([
            "praticien",
            "editeur_medical",
            "relecteur_clinique",
            "responsable_conformite",
            "admin",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUser(input.userId, { role: input.role });
        await createAuditLog({
          userId: ctx.user.id,
          action: "admin.set_role",
          resource: "user",
          resourceId: String(input.userId),
          metadata: { newRole: input.role },
        });
        return { success: true };
      }),
  }),

  // ─── Organisations ─────────────────────────────────────────────────────────
  organisations: router({
    list: protectedProcedure.query(async () => {
      return listOrganisations();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const org = await getOrganisationById(input.id);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        return org;
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(2).max(255),
          slug: z.string().min(2).max(128),
          type: z.string().optional(),
          address: z.string().optional(),
          siret: z.string().length(14).optional(),
          contactEmail: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createOrganisation(input);
        await createAuditLog({
          userId: ctx.user.id,
          action: "org.create",
          resource: "organisation",
          resourceId: String(id),
          metadata: { name: input.name },
        });
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).max(255).optional(),
          address: z.string().optional(),
          contactEmail: z.string().email().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateOrganisation(id, data);
        await createAuditLog({
          userId: ctx.user.id,
          action: "org.update",
          resource: "organisation",
          resourceId: String(id),
          metadata: { fields: Object.keys(data) },
        });
        return { success: true };
      }),
  }),

  // ─── Génération IA ─────────────────────────────────────────────────────────
  // EXG-API-02 [BLOQUANT] : Aucune journalisation du contenu médical
  generation: router({
    generate: protectedProcedure
      .input(
        z.object({
          volet: z.enum(["courrier_sortie", "conciliation", "correspondance"]),
          subtype: z.string().optional(),
          rawData: z.string().min(10).max(RAW_DATA_MAX_CHARS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const selectedSubtype: RedactionSubtype =
          input.subtype && isValidSubtypeForVolet(input.volet, input.subtype)
            ? input.subtype
            : getDefaultSubtype(input.volet);

        // EXG-PSE-01 [BLOQUANT] : Pseudonymisation synchrone et bloquante
        const pseudoResult = pseudonymise(input.rawData);

        // Résolution du prompt actif (socle + template)
        const [base, template] = await Promise.all([
          getActivePromptBase(),
          getActiveTemplateByVolet(input.volet),
        ]);

        // Fallback si aucun prompt publié : utiliser les défauts
        const baseContent = base?.content ?? DEFAULT_PROMPT_BASE.content;
        const baseTemplate = (
          template?.content ??
          DEFAULT_TEMPLATES.find((t) => t.volet === input.volet)?.content ??
          ""
        );
        const templateContent = buildTemplateForSubtype({
          volet: input.volet,
          subtype: selectedSubtype,
          baseTemplate,
          data: pseudoResult.filteredText,
        });

        // Assemblage du prompt final
        const systemPrompt = baseContent;
        const userPrompt = templateContent;

        // Appel du moteur IA via adaptateur abstrait
        // EXG-API-02 : Le contenu n'est JAMAIS journalisé
        let generatedText = "";
        try {
          generatedText = await createAnthropicMessage({
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          });
        } catch (err) {
          // Dégradation maîtrisée — aucun contenu dans le log
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Le moteur de génération est temporairement indisponible. Vos données saisies sont conservées dans la session.",
          });
        }

        // Journalisation technique SANS contenu médical
        await createAuditLog({
          userId: ctx.user.id,
          action: "generation.complete",
          resource: "generation",
          metadata: {
            volet: input.volet,
            subtype: selectedSubtype,
            maskCount: pseudoResult.maskCount,
            detectedCategories: pseudoResult.detectedCategories,
            hasPotentialOvermasking: pseudoResult.hasPotentialOvermasking,
            promptBaseVersion: base?.version ?? "default",
            promptTemplateVersion: template?.version ?? "default",
            // JAMAIS de contenu médical ici
          },
        });

        return {
          document: generatedText,
          pseudonymisationInfo: {
            maskCount: pseudoResult.maskCount,
            detectedCategories: pseudoResult.detectedCategories,
            hasPotentialOvermasking: pseudoResult.hasPotentialOvermasking,
          },
        };
      }),

    // Endpoint de pseudonymisation seule (pour prévisualisation)
    pseudonymisePreview: protectedProcedure
      .input(z.object({ text: z.string().max(RAW_DATA_MAX_CHARS) }))
      .mutation(async ({ input }) => {
        const result = pseudonymise(input.text);
        // Ne retourner que les méta-données, pas le texte filtré
        return {
          maskCount: result.maskCount,
          detectedCategories: result.detectedCategories,
          hasPotentialOvermasking: result.hasPotentialOvermasking,
        };
      }),
  }),

  // ─── Back-office de prompts ────────────────────────────────────────────────
  prompts: router({
    // Socle commun
    listBases: adminOrEditorProcedure.query(async () => {
      return listPromptBases();
    }),

    getBase: adminOrEditorProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const base = await getPromptBaseById(input.id);
        if (!base) throw new TRPCError({ code: "NOT_FOUND" });
        return base;
      }),

    createBase: adminOrEditorProcedure
      .input(
        z.object({
          version: z.string().min(1).max(32),
          content: z.string().min(50),
          changelog: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createPromptBase({
          ...input,
          status: "brouillon",
          validatedClinical: false,
          validatedConformite: false,
          createdBy: ctx.user.id,
        });
        await createAuditLog({
          userId: ctx.user.id,
          action: "prompt_base.create",
          resource: "prompt_base",
          resourceId: String(id),
          metadata: { version: input.version },
        });
        return { id };
      }),

    updateBase: adminOrEditorProcedure
      .input(
        z.object({
          id: z.number(),
          content: z.string().min(50).optional(),
          changelog: z.string().optional(),
          status: z
            .enum(["brouillon", "candidat", "publie", "retire"])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const base = await getPromptBaseById(id);
        if (!base) throw new TRPCError({ code: "NOT_FOUND" });

        // Vérification : publication nécessite double validation
        if (data.status === "publie") {
          if (!base.validatedClinical || !base.validatedConformite) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "La publication nécessite une validation clinique ET une validation conformité.",
            });
          }
          data.status = "publie";
        }

        await updatePromptBase(id, {
          ...data,
          ...(data.status === "publie" ? { publishedAt: new Date() } : {}),
          ...(data.status === "retire" ? { retiredAt: new Date() } : {}),
        });
        await createAuditLog({
          userId: ctx.user.id,
          action: "prompt_base.update",
          resource: "prompt_base",
          resourceId: String(id),
          metadata: { fields: Object.keys(data), newStatus: data.status },
        });
        return { success: true };
      }),

    validateBase: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          type: z.enum(["clinical", "conformite"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role as UserRole;
        if (
          input.type === "clinical" &&
          !["relecteur_clinique", "admin"].includes(role)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Validation clinique réservée aux relecteurs cliniques.",
          });
        }
        if (
          input.type === "conformite" &&
          !["responsable_conformite", "admin"].includes(role)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Validation conformité réservée aux responsables conformité.",
          });
        }
        const updateData =
          input.type === "clinical"
            ? {
                validatedClinical: true,
                validatedClinicalBy: ctx.user.id,
                validatedClinicalAt: new Date(),
              }
            : {
                validatedConformite: true,
                validatedConformiteBy: ctx.user.id,
                validatedConformiteAt: new Date(),
              };
        await updatePromptBase(input.id, updateData);
        await createAuditLog({
          userId: ctx.user.id,
          action: `prompt_base.validate_${input.type}`,
          resource: "prompt_base",
          resourceId: String(input.id),
          metadata: { validationType: input.type },
        });
        return { success: true };
      }),

    // Templates par volet
    listTemplates: adminOrEditorProcedure.query(async () => {
      return listPromptTemplates();
    }),

    getTemplate: adminOrEditorProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const tpl = await getPromptTemplateById(input.id);
        if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
        return tpl;
      }),

    createTemplate: adminOrEditorProcedure
      .input(
        z.object({
          volet: z.enum(["courrier_sortie", "conciliation", "correspondance"]),
          version: z.string().min(1).max(32),
          name: z.string().min(2).max(255),
          description: z.string().optional(),
          content: z.string().min(50),
          changelog: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createPromptTemplate({
          ...input,
          status: "brouillon",
          validatedClinical: false,
          validatedConformite: false,
          createdBy: ctx.user.id,
        });
        await createAuditLog({
          userId: ctx.user.id,
          action: "prompt_template.create",
          resource: "prompt_template",
          resourceId: String(id),
          metadata: { volet: input.volet, version: input.version },
        });
        return { id };
      }),

    updateTemplate: adminOrEditorProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).max(255).optional(),
          description: z.string().optional(),
          content: z.string().min(50).optional(),
          changelog: z.string().optional(),
          status: z
            .enum(["brouillon", "candidat", "publie", "retire"])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const tpl = await getPromptTemplateById(id);
        if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });

        if (data.status === "publie") {
          if (!tpl.validatedClinical || !tpl.validatedConformite) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "La publication nécessite une validation clinique ET une validation conformité.",
            });
          }
        }

        await updatePromptTemplate(id, {
          ...data,
          ...(data.status === "publie" ? { publishedAt: new Date() } : {}),
          ...(data.status === "retire" ? { retiredAt: new Date() } : {}),
        });
        await createAuditLog({
          userId: ctx.user.id,
          action: "prompt_template.update",
          resource: "prompt_template",
          resourceId: String(id),
          metadata: { fields: Object.keys(data), newStatus: data.status },
        });
        return { success: true };
      }),

    validateTemplate: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          type: z.enum(["clinical", "conformite"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role as UserRole;
        if (
          input.type === "clinical" &&
          !["relecteur_clinique", "admin"].includes(role)
        ) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (
          input.type === "conformite" &&
          !["responsable_conformite", "admin"].includes(role)
        ) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const updateData =
          input.type === "clinical"
            ? {
                validatedClinical: true,
                validatedClinicalBy: ctx.user.id,
                validatedClinicalAt: new Date(),
              }
            : {
                validatedConformite: true,
                validatedConformiteBy: ctx.user.id,
                validatedConformiteAt: new Date(),
              };
        await updatePromptTemplate(input.id, updateData);
        await createAuditLog({
          userId: ctx.user.id,
          action: `prompt_template.validate_${input.type}`,
          resource: "prompt_template",
          resourceId: String(input.id),
          metadata: { validationType: input.type },
        });
        return { success: true };
      }),

    // Cas de test
    listTestCases: adminOrEditorProcedure
      .input(
        z.object({
          volet: z
            .enum(["courrier_sortie", "conciliation", "correspondance"])
            .optional(),
        })
      )
      .query(async ({ input }) => {
        return listTestCases(input.volet);
      }),

    createTestCase: adminOrEditorProcedure
      .input(
        z.object({
          volet: z.enum(["courrier_sortie", "conciliation", "correspondance"]),
          name: z.string().min(2).max(255),
          inputData: z.string().min(10),
          criteria: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createTestCase({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    updateTestCase: adminOrEditorProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          inputData: z.string().optional(),
          criteria: z.any().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTestCase(id, data);
        return { success: true };
      }),

    // Initialisation des prompts par défaut
    initDefaults: adminProcedure.mutation(async ({ ctx }) => {
      const existingBases = await listPromptBases();
      if (existingBases.length === 0) {
        await createPromptBase({
          ...DEFAULT_PROMPT_BASE,
          validatedClinicalBy: ctx.user.id,
          validatedClinicalAt: new Date(),
          validatedConformiteBy: ctx.user.id,
          validatedConformiteAt: new Date(),
          publishedAt: new Date(),
          createdBy: ctx.user.id,
        });
      }

      const existingTemplates = await listPromptTemplates();
      if (existingTemplates.length === 0) {
        for (const tpl of DEFAULT_TEMPLATES) {
          await createPromptTemplate({
            ...tpl,
            validatedClinicalBy: ctx.user.id,
            validatedClinicalAt: new Date(),
            validatedConformiteBy: ctx.user.id,
            validatedConformiteAt: new Date(),
            publishedAt: new Date(),
            createdBy: ctx.user.id,
          });
        }
      }

      const existingCases = await listTestCases();
      if (existingCases.length === 0) {
        for (const tc of DEFAULT_TEST_CASES) {
          await createTestCase({ ...tc, createdBy: ctx.user.id });
        }
      }

      return { success: true, message: "Prompts par défaut initialisés." };
    }),
  }),

  // u2500u2500u2500 Dictionnaire mu00e9dical (autocomplete) u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500
  // ─── Journal d'audit (admin uniquement) ───────────────────────────────────
  medical: router({
    search: protectedProcedure
      .input(
        z.object({
          query: z.string().min(1).max(100),
          category: z
            .enum(["medicament", "pathologie", "symptome", "anatomie", "biologie", "procedure", "autre"])
            .optional(),
          limit: z.number().min(1).max(50).default(10),
        })
      )
      .query(async ({ input }) => {
        return searchMedicalTerms(input.query, input.category, input.limit);
      }),
    trackUsage: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await incrementMedicalTermUsage(input.id);
        return { success: true };
      }),
    stats: adminProcedure.query(async () => {
      const count = await countMedicalTerms();
      return { count };
    }),
    // ─── Back-office : liste paginée, CRUD ───────────────────────────────────
    list: adminProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(30),
          query: z.string().max(100).optional(),
          category: z
            .enum(["medicament", "pathologie", "symptome", "anatomie", "biologie", "procedure", "autre"])
            .optional(),
        })
      )
      .query(async ({ input }) => {
        return listMedicalTermsPaginated(input.page, input.pageSize, input.query, input.category);
      }),
    create: adminProcedure
      .input(
        z.object({
          term: z.string().min(1).max(255),
          category: z.enum(["medicament", "pathologie", "symptome", "anatomie", "biologie", "procedure", "autre"]),
          synonyms: z.array(z.string()).default([]),
          definition: z.string().max(1000).optional(),
          source: z.string().max(100).optional(),
          code: z.string().max(50).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createMedicalTerm({
          term: input.term,
          category: input.category,
          synonyms: JSON.stringify(input.synonyms),
          definition: input.definition ?? null,
          source: input.source ?? null,
          code: input.code ?? null,
          active: true,
          usageCount: 0,
        });
        return { id };
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          term: z.string().min(1).max(255).optional(),
          category: z.enum(["medicament", "pathologie", "symptome", "anatomie", "biologie", "procedure", "autre"]).optional(),
          synonyms: z.array(z.string()).optional(),
          definition: z.string().max(1000).optional(),
          source: z.string().max(100).optional(),
          code: z.string().max(50).optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, synonyms, ...rest } = input;
        await updateMedicalTerm(id, {
          ...rest,
          ...(synonyms !== undefined ? { synonyms: JSON.stringify(synonyms) } : {}),
        });
        return { success: true };
      }),
    deactivate: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deactivateMedicalTerm(input.id);
        return { success: true };
      }),
  }),
    audit: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
      .query(async ({ input }) => {
        return listAuditLogs(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
