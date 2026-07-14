const configuredAnthropicMaxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS ?? "12000");
const ANTHROPIC_MIN_OUTPUT_TOKENS = 12000;
const ANTHROPIC_MAX_OUTPUT_TOKENS = 128000;

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  transcriptionApiUrl: process.env.OPENAI_TRANSCRIPTION_BASE_URL ?? process.env.BUILT_IN_FORGE_API_URL ?? "https://api.openai.com/",
  transcriptionApiKey: process.env.OPENAI_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  anthropicMaxTokens: Number.isFinite(configuredAnthropicMaxTokens)
    ? Math.min(
        Math.max(configuredAnthropicMaxTokens, ANTHROPIC_MIN_OUTPUT_TOKENS),
        ANTHROPIC_MAX_OUTPUT_TOKENS
      )
    : ANTHROPIC_MIN_OUTPUT_TOKENS,
  localAdminEmail: process.env.LOCAL_ADMIN_EMAIL ?? "",
  localAdminPassword: process.env.LOCAL_ADMIN_PASSWORD ?? "",
  localAdminName: process.env.LOCAL_ADMIN_NAME ?? "Administrateur REDACTIO",
  makeDemoWebhookUrl: process.env.MAKE_DEMO_WEBHOOK_URL ?? "",
  makeSignupWebhookUrl: process.env.MAKE_SIGNUP_WEBHOOK_URL ?? "",
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePriceId: process.env.STRIPE_PRICE_ID ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};
