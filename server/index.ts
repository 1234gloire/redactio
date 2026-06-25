import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { registerFileExtraction } from "./fileExtraction";
import { registerExportRoutes } from "./exportRoute";
import { registerStreamGeneration } from "./streamGeneration";
import { registerVoiceTranscription } from "./voiceTranscriptionRoute";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const PORT = process.env.PORT ?? 3001;
const app = express();

// --- Middlewares essentiels ---
app.use(express.json());

// --- Enregistrement des routes API ---
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
registerStreamGeneration(app);
registerVoiceTranscription(app);
registerFileExtraction(app);
registerExportRoutes(app);

// --- Service des fichiers statiques (pour la production) ---
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[REDACTIO] Serveur démarré sur http://localhost:${PORT}`);
});
