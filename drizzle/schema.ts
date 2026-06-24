import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Organisations / Établissements ───────────────────────────────────────────
export const organisations = mysqlTable("organisations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  type: varchar("type", { length: 64 }).default("hopital"),
  address: text("address"),
  siret: varchar("siret", { length: 14 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organisation = typeof organisations.$inferSelect;
export type InsertOrganisation = typeof organisations.$inferInsert;

// ─── Utilisateurs ─────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  passwordUpdatedAt: timestamp("passwordUpdatedAt"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // RBAC : rôles métier REDACTIO
  role: mysqlEnum("role", [
    "praticien",
    "editeur_medical",
    "relecteur_clinique",
    "responsable_conformite",
    "admin",
  ])
    .default("praticien")
    .notNull(),
  organisationId: int("organisationId"),
  specialite: varchar("specialite", { length: 128 }),
  rpps: varchar("rpps", { length: 11 }), // Numéro RPPS praticien
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  twoFactorSecret: varchar("twoFactorSecret", { length: 64 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Abonnements ──────────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  plan: mysqlEnum("plan", ["essai", "standard", "premium", "entreprise"])
    .default("essai")
    .notNull(),
  status: mysqlEnum("status", ["actif", "suspendu", "expire", "annule"])
    .default("actif")
    .notNull(),
  seats: int("seats").default(1).notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Socle commun de prompts ──────────────────────────────────────────────────
export const promptBases = mysqlTable("prompt_bases", {
  id: int("id").autoincrement().primaryKey(),
  version: varchar("version", { length: 32 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["brouillon", "candidat", "publie", "retire"])
    .default("brouillon")
    .notNull(),
  // Traçabilité des validations
  validatedClinical: boolean("validatedClinical").default(false).notNull(),
  validatedClinicalBy: int("validatedClinicalBy"),
  validatedClinicalAt: timestamp("validatedClinicalAt"),
  validatedConformite: boolean("validatedConformite").default(false).notNull(),
  validatedConformiteBy: int("validatedConformiteBy"),
  validatedConformiteAt: timestamp("validatedConformiteAt"),
  publishedAt: timestamp("publishedAt"),
  retiredAt: timestamp("retiredAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  changelog: text("changelog"),
});

export type PromptBase = typeof promptBases.$inferSelect;
export type InsertPromptBase = typeof promptBases.$inferInsert;

// ─── Templates de prompts par volet ──────────────────────────────────────────
export const promptTemplates = mysqlTable("prompt_templates", {
  id: int("id").autoincrement().primaryKey(),
  volet: mysqlEnum("volet", [
    "courrier_sortie",
    "conciliation",
    "correspondance",
  ]).notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["brouillon", "candidat", "publie", "retire"])
    .default("brouillon")
    .notNull(),
  // Traçabilité des validations
  validatedClinical: boolean("validatedClinical").default(false).notNull(),
  validatedClinicalBy: int("validatedClinicalBy"),
  validatedClinicalAt: timestamp("validatedClinicalAt"),
  validatedConformite: boolean("validatedConformite").default(false).notNull(),
  validatedConformiteBy: int("validatedConformiteBy"),
  validatedConformiteAt: timestamp("validatedConformiteAt"),
  publishedAt: timestamp("publishedAt"),
  retiredAt: timestamp("retiredAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  changelog: text("changelog"),
});

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplates.$inferInsert;

// ─── Cas de test de non-régression (données fictives uniquement) ──────────────
export const testCases = mysqlTable("test_cases", {
  id: int("id").autoincrement().primaryKey(),
  volet: mysqlEnum("volet", [
    "courrier_sortie",
    "conciliation",
    "correspondance",
  ]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  // Données d'entrée fictives pseudonymisées
  inputData: text("inputData").notNull(),
  // Critères d'acceptation (JSON)
  criteria: json("criteria"),
  active: boolean("active").default(true).notNull(),
  version: int("version").default(1).notNull(),
  parentId: int("parentId"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = typeof testCases.$inferInsert;

// ─── Résultats de campagnes de non-régression ─────────────────────────────────
export const testCampaigns = mysqlTable("test_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  promptTemplateId: int("promptTemplateId").notNull(),
  promptBaseId: int("promptBaseId").notNull(),
  status: mysqlEnum("status", ["en_cours", "reussie", "echouee"])
    .default("en_cours")
    .notNull(),
  totalCases: int("totalCases").default(0).notNull(),
  passedCases: int("passedCases").default(0).notNull(),
  failedCases: int("failedCases").default(0).notNull(),
  // Résultats détaillés (JSON) — sans contenu médical
  results: json("results"),
  runBy: int("runBy").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type TestCampaign = typeof testCampaigns.$inferSelect;
export type InsertTestCampaign = typeof testCampaigns.$inferInsert;

// ─── Journal technique (sans contenu médical) ────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 128 }).notNull(),
  resource: varchar("resource", { length: 128 }),
  resourceId: varchar("resourceId", { length: 64 }),
  // JAMAIS de contenu médical dans ce champ
  metadata: json("metadata"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Dictionnaire médical français ───────────────────────────────────────────
export const medicalTerms = mysqlTable("medical_terms", {
  id: int("id").autoincrement().primaryKey(),
  // Terme principal (DCI, nom de spécialité, terme clinique, etc.)
  term: varchar("term", { length: 512 }).notNull(),
  // Catégorie : medicament, pathologie, symptome, anatomie, biologie, procedure, autre
  category: mysqlEnum("category", [
    "medicament",
    "pathologie",
    "symptome",
    "anatomie",
    "biologie",
    "procedure",
    "autre",
  ])
    .default("autre")
    .notNull(),
  // Synonymes et abréviations (JSON array de strings)
  synonyms: json("synonyms"),
  // Définition courte (optionnelle)
  definition: text("definition"),
  // Source : HAS, VIDAL, CIM10, SNOMED, LOINC, manuel
  source: varchar("source", { length: 64 }).default("manuel"),
  // Code de référence (CIM-10, ATC, etc.)
  code: varchar("code", { length: 64 }),
  // Actif / archivé
  active: boolean("active").default(true).notNull(),
  // Fréquence d'utilisation (pour trier les suggestions)
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalTerm = typeof medicalTerms.$inferSelect;
export type InsertMedicalTerm = typeof medicalTerms.$inferInsert;
