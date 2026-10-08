/**
 * MEDACTIO — Compteur de mots affiché sous l'éditeur de relecture (étape 4) pour le volet projet_smr.
 * Information de relecture : aucune longueur maximale n'est imposée au praticien.
 *
 * Le compteur s'abonne aux saisies de l'éditeur `contentEditable` via sa ref : la frappe ne
 * provoque donc que le rendu du compteur, et non celui de toute la page de rédaction.
 */
import { useEffect, useState, type RefObject } from "react";

function countWords(html: string): number {
  const text = (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[À COMPLÉTER PAR LE MÉDECIN\]/g, " ");
  return (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g) ?? []).length;
}

export function WordCounter({
  editorRef,
  sourceHtml,
}: {
  editorRef: RefObject<HTMLElement | null>;
  sourceHtml: string;
}) {
  const [words, setWords] = useState(() => countWords(sourceHtml));

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      setWords(countWords(sourceHtml));
      return;
    }
    const update = () => setWords(countWords(editor.innerHTML));
    update();
    editor.addEventListener("input", update);
    return () => editor.removeEventListener("input", update);
  }, [editorRef, sourceHtml]);

  return <p className="redaction-wordcount">Synthèse : {words} mots</p>;
}
