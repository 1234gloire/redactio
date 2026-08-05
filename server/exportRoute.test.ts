import { describe, expect, it } from "vitest";
import { buildDocxContent } from "./exportRoute";

describe("DOCX export", () => {
  it("nettoie les fragments HTML échappés dans les cellules de conciliation", async () => {
    const html = [
      "<table><tbody>",
      "<tr><th>Traitement avant hospitalisation</th><th>Commentaires</th></tr>",
      "<tr>",
      "<td>MACROGOL 10 g sachet</td>",
      "<td>Arrêt laxatif osmotique — motif : &lt;font color=&quot;#7a4a00&quot;&gt;&lt;span style=&quot;font-size: 11px; background-color: rgb(255, 241, 194);&quot;&gt;&lt;b&gt;diarrhées&lt;/b&gt;&lt;/span&gt;&lt;/font&gt;&nbsp;; réévaluation du transit à domicile</td>",
      "</tr>",
      "</tbody></table>",
    ].join("");

    const docxTree = JSON.stringify(buildDocxContent(html));

    expect(docxTree).toContain("MACROGOL 10 g sachet");
    expect(docxTree).toContain("diarrhées");
    expect(docxTree).not.toContain("font color");
    expect(docxTree).not.toContain("span style");
    expect(docxTree).not.toContain("b&gt;diarrhées");
  });
});
