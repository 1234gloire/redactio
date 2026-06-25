/**
 * Endpoint d'export de documents au format .docx.
 * Reçoit un contenu textuel et le convertit en un document Word téléchargeable.
 *
 * EXG-EXP-01 [MAJEUR] : Ne jamais journaliser le contenu reçu.
 * EXG-EXP-02 [MAJEUR] : Utiliser des en-têtes HTTP corrects pour le type de fichier.
 */
import { Express, Request, Response } from "express";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { sdk } from "./_core/sdk";

export function registerExportRoutes(app: Express): void {
  app.post("/api/export/docx", async (req: Request, res: Response) => {
    // 1. Vérification de l'authentification  
    console.log("[DOCX] cookies:", req.headers.cookie);

    try {
      const user = await sdk.authenticateRequest(req);
        console.log("[DOCX] user:", user);

      if (!user) {
        // Important : Toujours renvoyer une erreur JSON claire si non authentifié
        return res.status(401).json({ error: "Non authentifié" });
      }
    } catch {
      return res.status(401).json({ error: "Session invalide" });
    }

    // 2. Validation du contenu
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Contenu manquant ou invalide." });
    }

    try {
      // 3. Création du document Word en mémoire
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: content.split("\n").map(
              (textLine) =>
                new Paragraph({
                  children: [new TextRun(textLine)],
                })
            ),
          },
        ],
      });

      // 4. Génération du buffer du fichier
      const buffer = await Packer.toBuffer(doc);

      // 5. Envoi de la réponse avec les bons en-têtes
      res.setHeader("Content-Disposition", `attachment; filename="redactio.docx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.send(buffer);
    } catch (err) {
      console.error("[Export DOCX] Erreur interne (sans contenu)");
      // En cas d'erreur, renvoyer une erreur JSON et non un fichier
      res.status(500).json({ error: "Erreur interne lors de la génération du document." });
    }
  });
}