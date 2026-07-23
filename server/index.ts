import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { registerFileExtraction } from "./fileExtraction";
import { registerExportRoutes } from "./exportRoute";
import { registerObservationExamExtraction } from "./observationExamExtraction";
import { registerStreamGeneration } from "./streamGeneration";
import { registerVoiceTranscription } from "./voiceTranscriptionRoute";
import { registerMakeWebhookRoutes } from "./makeWebhooks";
import { registerStripeWebhookRoutes } from "./stripeBilling";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { ensureLocalAdmin } from "./db";

const PORT = process.env.PORT ?? 3001;
const app = express();

registerStripeWebhookRoutes(app);
app.use(express.json());

app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
registerStreamGeneration(app);
registerVoiceTranscription(app);
registerFileExtraction(app);
registerObservationExamExtraction(app);
registerExportRoutes(app);
registerMakeWebhookRoutes(app);

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

ensureLocalAdmin()
  .catch((error) => {
    console.error("[MEDACTIO] Initialisation admin locale impossible", error);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`[MEDACTIO] Serveur démarré sur http://localhost:${PORT}`);
    });
  });
