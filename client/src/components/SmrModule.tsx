export const MODULE_TEXTS: Record<
  string,
  { cardHint: string; fieldLabel: string; placeholder: string; hint: string }
> = {
  courrier_sortie: {
    // textes actuels, inchangés (repris ici pour centraliser)
    cardHint:
      "Oriente la structure du courrier généré (ex. plan gériatrique ajouté en court séjour gériatrique).",
    fieldLabel: "Données médicales brutes",
    placeholder:
      "Exemple : entrée le [date], sortie le [date], motif d'hospitalisation : ... Antécédents : ... Traitement à domicile : ... Mode de vie : ... Histoire de la maladie : ... Examen clinique : ... Biologie (avec dates) : ... Examens paracliniques : ... Évolution : ... Traitement de sortie : ... Devenir : domicile / transfert vers ...",
    hint: "Saisie libre, abréviations admises — le contenu est mis en forme selon la trame du service sélectionné ci-dessus. Aucune donnée n'est inventée : tout élément manquant reste « [à compléter] ».",
  },
  projet_smr: {
    // NOUVEAU
    cardHint:
      "Oriente le contenu du projet généré (priorités, volets de prise en charge, mode de sortie).",
    fieldLabel: "Observation d'entrée",
    placeholder:
      "Exemple : âge : ... Motif d'admission / provenance : ... Antécédents : ... Traitement en cours : ... Histoire de la maladie : ... Mode de vie (logement, entourage, aides, autonomie antérieure) : ... Examen clinique : ... Examens complémentaires (facultatif) : ...",
    hint: "Saisie libre, abréviations admises — le projet est rédigé selon le type de SMR sélectionné ci-dessus. Aucune donnée n'est inventée : tout élément manquant reste « [à compléter] ».",
  },
};

/* ---------- 7. Aide contextuelle sous les pastilles (spécifique SMR) ---------- */
export const SMR_TYPE_HINTS: Record<string, { title: string; text: string }> = {
  geriatrie: {
    title: "Patient de plus de 75 ans, fragile, polypathologique.",
    text: "Priorités : revue de la médication, chutes, nutrition (critères HAS), cognition et thymie, aides et aidants.",
  },
  locomoteur: {
    title: "Après traumatisme ou chirurgie orthopédique.",
    text: "Priorités : consignes du chirurgien (appui, amplitudes), cicatrisation, renforcement, marche.",
  },
  neurologie: {
    title: "AVC, traumatisme crânien, SEP, Parkinson…",
    text: "Priorités : spasticité, déglutition, troubles vésico-sphinctériens, cognition, orthophonie.",
  },
  cardio_respiratoire: {
    title: "Réadaptation cardiaque et/ou respiratoire.",
    text: "Priorités : réentraînement à l'effort surveillé, éducation thérapeutique, auto-surveillance, sevrage tabagique.",
  },
  digestif_endocrinien: {
    title: "Système digestif, endocrinologie, diabétologie, nutrition.",
    text: "Priorités : équilibre métabolique, état nutritionnel, éducation thérapeutique.",
  },
  oncologie: {
    title: "Patient atteint de cancer, à tout stade.",
    text: "Priorités : toxicités et calendrier des traitements, nutrition, fatigue, soins de support, lien avec l'oncologue.",
  },
  polyvalent: {
    title: "Réadaptation médicale non spécialisée.",
    text: "Priorités : stabilisation médicale, récupération fonctionnelle, préparation de la sortie.",
  },
  entree_directe: {
    title: "Admission depuis le domicile ou un EHPAD, sans hospitalisation récente.",
    text: "Rédigée sur la trame gériatrique : provenance, motif de l'admission directe, bilan à compléter, lien avec le médecin traitant.",
  },
};

export function SmrTypeHint({ subtype }: { subtype: string | null }) {
  const h = subtype ? SMR_TYPE_HINTS[subtype] : null;
  if (!h) return null;
  return (
    <p className="redaction-typehint" aria-live="polite">
      <b>{h.title}</b> {h.text}
    </p>
  );
}
