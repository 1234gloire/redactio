/**
 * MEDACTIO — Compteur de mots affiché sous l'éditeur de relecture (étape 4) pour le volet projet_smr.
 * Le prompt impose 250 à 350 mots (400 maximum) ; le compteur aide le praticien à le vérifier.
 *
 * Intégration (étape 4, sous « Éditeur de document — … ») :
 *   {h === "projet_smr" && <WordCounter html={editorHtml} />}
 * où editorHtml = contenu courant de l'éditeur (état déjà présent : texte généré / édité).
 */
import { useMemo } from "react";

const MAX = 400;

export function WordCounter({ html }: { html: string }) {
  const n = useMemo(() => {
    const text = (html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\[À COMPLÉTER PAR LE MÉDECIN\]/g, " ");
    return (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g) ?? []).length;
  }, [html]);

  return (
    <p className={`redaction-wordcount${n > MAX ? " is-over" : ""}`}>
      Synthèse : {n} / {MAX} mots
      {n > MAX && " — texte trop long, pensez à régénérer ou à raccourcir"}
    </p>
  );
}
