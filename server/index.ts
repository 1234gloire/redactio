import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";
import { ensureLocalAdmin } from "../db";

async function main() {
  if (ENV.isDev) {
    console.log("🌱 Starting development server...");
  }

  // Ensure local admin exists on startup
  await ensureLocalAdmin();

  const server = createHTTPServer({
    router: appRouter,
    createContext,
  });

  server.listen(ENV.port);

  console.log(`🚀 Server listening on http://localhost:${ENV.port}`);
}

main().catch((err) => console.error(err));