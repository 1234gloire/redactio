import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { hashPassword } from "./_core/passwords";
import {
  AuditLog,
  InsertAuditLog,
  InsertOrganisation,
  InsertPromptBase,
  InsertPromptTemplate,
  InsertSubscription,
  InsertTestCase,
  InsertUser,
  Organisation,
  PromptBase,
  PromptTemplate,
  Subscription,
  TestCase,
  User,
  auditLogs,
  InsertMedicalTerm,
  MedicalTerm,
  medicalTerms,
  organisations,
  promptBases,
  promptTemplates,
  subscriptions,
  testCases,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.passwordUpdatedAt !== undefined) {
      values.passwordUpdatedAt = user.passwordUpdatedAt;
      updateSet.passwordUpdatedAt = user.passwordUpdatedAt;
    }
    if (user.marketingOptIn !== undefined) {
      values.marketingOptIn = user.marketingOptIn;
      updateSet.marketingOptIn = user.marketingOptIn;
    }
    if (user.termsAcceptedAt !== undefined) {
      values.termsAcceptedAt = user.termsAcceptedAt;
      updateSet.termsAcceptedAt = user.termsAcceptedAt;
    }
    if (user.privacyAcceptedAt !== undefined) {
      values.privacyAcceptedAt = user.privacyAcceptedAt;
      updateSet.privacyAcceptedAt = user.privacyAcceptedAt;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    return result[0];
  } catch (error) {
    console.error(`[Database] Failed to get user by email ${email}:`, error);
    return undefined;
  }
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(id: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function ensureLocalAdmin() {
  if (!ENV.localAdminEmail || !ENV.localAdminPassword) {
    return;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot ensure local admin: database not available");
    return;
  }

  const existingAdmin = await getUserByEmail(ENV.localAdminEmail);
  if (existingAdmin) {
    return;
  }

  console.log(`[Database] Creating local admin user: ${ENV.localAdminEmail}`);
  const passwordHash = await hashPassword(ENV.localAdminPassword);
  await upsertUser({
    openId: `local:${ENV.localAdminEmail}`,
    email: ENV.localAdminEmail,
    name: ENV.localAdminName ?? "Admin",
    passwordHash,
    role: "admin",
    loginMethod: "password",
  });
}

export async function listUsersByOrg(organisationId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.organisationId, organisationId));
}

// ─── Organisations ────────────────────────────────────────────────────────────

export async function createOrganisation(data: InsertOrganisation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(organisations).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function getOrganisationById(id: number): Promise<Organisation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organisations).where(eq(organisations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listOrganisations(): Promise<Organisation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(organisations);
}

export async function updateOrganisation(id: number, data: Partial<InsertOrganisation>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(organisations).set(data).where(eq(organisations.id, id));
}

// ─── Abonnements ──────────────────────────────────────────────────────────────

export async function getSubscriptionByOrg(organisationId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organisationId, organisationId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Partial<InsertSubscription> = {
    plan: data.plan,
    status: data.status,
    seats: data.seats,
  };
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate;
  }
  await db.insert(subscriptions).values(data).onDuplicateKeyUpdate({
    set: updateData,
  });
}

// ─── Prompts — Socle commun ───────────────────────────────────────────────────

export async function getActivePromptBase(): Promise<PromptBase | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(promptBases)
    .where(eq(promptBases.status, "publie"))
    .orderBy(desc(promptBases.publishedAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listPromptBases(): Promise<PromptBase[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promptBases).orderBy(desc(promptBases.createdAt));
}

export async function createPromptBase(data: InsertPromptBase): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(promptBases).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function updatePromptBase(id: number, data: Partial<InsertPromptBase>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(promptBases).set(data).where(eq(promptBases.id, id));
}

export async function getPromptBaseById(id: number): Promise<PromptBase | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promptBases).where(eq(promptBases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Prompts — Templates par volet ───────────────────────────────────────────

export async function getActiveTemplateByVolet(
  volet: "courrier_sortie" | "conciliation" | "correspondance"
): Promise<PromptTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(promptTemplates)
    .where(and(eq(promptTemplates.volet, volet), eq(promptTemplates.status, "publie")))
    .orderBy(desc(promptTemplates.publishedAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listPromptTemplates(): Promise<PromptTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promptTemplates).orderBy(desc(promptTemplates.createdAt));
}

export async function listPromptTemplatesByVolet(
  volet: "courrier_sortie" | "conciliation" | "correspondance"
): Promise<PromptTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.volet, volet))
    .orderBy(desc(promptTemplates.createdAt));
}

export async function createPromptTemplate(data: InsertPromptTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(promptTemplates).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function updatePromptTemplate(id: number, data: Partial<InsertPromptTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(promptTemplates).set(data).where(eq(promptTemplates.id, id));
}

export async function getPromptTemplateById(id: number): Promise<PromptTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promptTemplates).where(eq(promptTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Cas de test ──────────────────────────────────────────────────────────────

export async function listTestCases(volet?: "courrier_sortie" | "conciliation" | "correspondance"): Promise<TestCase[]> {
  const db = await getDb();
  if (!db) return [];
  if (volet) {
    return db.select().from(testCases).where(and(eq(testCases.volet, volet), eq(testCases.active, true)));
  }
  return db.select().from(testCases).where(eq(testCases.active, true));
}

export async function createTestCase(data: InsertTestCase): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(testCases).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function updateTestCase(id: number, data: Partial<InsertTestCase>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(testCases).set(data).where(eq(testCases.id, id));
}

// ─── Journal d'audit (sans contenu médical) ───────────────────────────────────

export async function createAuditLog(data: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Garantie : aucun champ de contenu médical ne doit figurer dans metadata
  await db.insert(auditLogs).values(data);
}

// ─── Dictionnaire médical ─────────────────────────────────────────────────────

/**
 * Recherche des termes médicaux par préfixe (autocomplete).
 * Limite à 20 résultats, triés par fréquence d'usage décroissante.
 */
export async function searchMedicalTerms(
  query: string,
  category?: string,
  limit = 20
): Promise<MedicalTerm[]> {
  const db = await getDb();
  if (!db || !query.trim()) return [];
  const q = `${query.trim()}%`;
  const conditions = [like(medicalTerms.term, q), eq(medicalTerms.active, true)];
  if (category) {
    conditions.push(eq(medicalTerms.category, category as MedicalTerm["category"]));
  }
  return db
    .select()
    .from(medicalTerms)
    .where(and(...conditions))
    .orderBy(desc(medicalTerms.usageCount))
    .limit(limit);
}

/**
 * Incrémente le compteur d'utilisation d'un terme médical.
 */
export async function incrementMedicalTermUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(medicalTerms)
    .set({ usageCount: sql`${medicalTerms.usageCount} + 1` })
    .where(eq(medicalTerms.id, id));
}

/**
 * Retourne le nombre total de termes médicaux en base.
 */
export async function countMedicalTerms(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(medicalTerms);
  return result[0]?.count ?? 0;
}

/**
 * Liste paginée des termes médicaux (back-office).
 */
export async function listMedicalTermsPaginated(
  page = 1,
  pageSize = 30,
  query?: string,
  category?: string
): Promise<{ items: MedicalTerm[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * pageSize;
  const conditions: ReturnType<typeof eq>[] = [];
  if (query?.trim()) {
    conditions.push(like(medicalTerms.term, `%${query.trim()}%`) as any);
  }
  if (category) {
    conditions.push(eq(medicalTerms.category, category as MedicalTerm["category"]) as any);
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(medicalTerms)
      .where(whereClause)
      .orderBy(desc(medicalTerms.usageCount), medicalTerms.term)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(medicalTerms).where(whereClause),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

/**
 * Crée un nouveau terme médical.
 */
export async function createMedicalTerm(data: InsertMedicalTerm): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(medicalTerms).values(data);
  return (result[0] as any).insertId;
}

/**
 * Met à jour un terme médical existant.
 */
export async function updateMedicalTerm(id: number, data: Partial<InsertMedicalTerm>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(medicalTerms).set(data).where(eq(medicalTerms.id, id));
}

/**
 * Supprime (désactive) un terme médical.
 */
export async function deactivateMedicalTerm(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(medicalTerms).set({ active: false }).where(eq(medicalTerms.id, id));
}

export async function listAuditLogs(limit = 100): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
