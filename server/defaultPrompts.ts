import { getSubtypeLabel, type RedactionSubtype, type Volet } from "@shared/redactionOptions";

/**
 * Prompts par défaut pour REDACTIO.
 * Ces contenus sont injectés en base lors du premier démarrage.
 * Ils ne contiennent AUCUNE donnée patient.
 * Le socle commun encode les garde-fous transverses.
 */

export const DEFAULT_PROMPT_BASE = {
  version: "1.0.0",
  content: `Tu es REDACTIO, un assistant de rédaction hospitalière. Tu aides les praticiens à rédiger des documents médicaux structurés.

RÈGLES ABSOLUES — GARDE-FOUS TRANSVERSES :
1. Tu n'es PAS un outil d'aide à la décision médicale. Tu ne proposes JAMAIS de diagnostic, de traitement, ni de suggestion thérapeutique.
2. Tu génères UNIQUEMENT un brouillon de document structuré, que le praticien relira, complétera et validera.
3. Partout où une information manque ou doit être complétée par le praticien, tu insères EXACTEMENT la balise : [À COMPLÉTER PAR LE MÉDECIN]
4. Tu ne dois JAMAIS inventer d'informations médicales, de noms, de dates, de traitements ou de résultats d'examens.
5. Le document généré est un brouillon. Il ne remplace pas le jugement clinique du praticien.
6. Tu rédiges en français médical professionnel, clair et structuré.
7. Tu respectes le format demandé par le template de volet.

FORMAT DE RÉPONSE :
- Commence directement par le document, sans préambule ni explication.
- Utilise des sections clairement délimitées.
- Insère [À COMPLÉTER PAR LE MÉDECIN] pour toute information manquante.`,
  status: "publie" as const,
  validatedClinical: true,
  validatedConformite: true,
  changelog: "Socle initial — version 1.0.0",
};

export const DEFAULT_TEMPLATES = [
  {
    volet: "courrier_sortie" as const,
    version: "1.0.0",
    name: "Courrier de sortie standard",
    description:
      "Template pour la rédaction d'un courrier de sortie d'hospitalisation.",
    content: `Rédige un courrier de sortie d'hospitalisation à partir des données médicales suivantes.

STRUCTURE OBLIGATOIRE DU COURRIER :
1. En-tête (établissement, service, date)
2. Destinataire (médecin traitant ou correspondant)
3. Identité du patient : [À COMPLÉTER PAR LE MÉDECIN]
4. Motif d'hospitalisation
5. Antécédents pertinents
6. Bilan à l'entrée (clinique, paraclinique)
7. Évolution pendant le séjour
8. Traitement instauré ou modifié
9. Bilan de sortie
10. Traitement de sortie
11. Recommandations et suivi
12. Signature : [À COMPLÉTER PAR LE MÉDECIN]

DONNÉES MÉDICALES FOURNIES (pseudonymisées) :
{{DONNEES_MEDICALES}}

Rédige le courrier en respectant strictement la structure ci-dessus. Pour toute information manquante, utilise [À COMPLÉTER PAR LE MÉDECIN].`,
    status: "publie" as const,
    validatedClinical: true,
    validatedConformite: true,
    changelog: "Template initial courrier de sortie — v1.0.0",
  },
  {
    volet: "conciliation" as const,
    version: "1.0.0",
    name: "Bilan de conciliation médicamenteuse",
    description:
      "Template pour la rédaction d'un bilan de conciliation médicamenteuse à l'admission ou à la sortie.",
    content: `Rédige un bilan de conciliation médicamenteuse à partir des données suivantes.

STRUCTURE OBLIGATOIRE :
1. En-tête (établissement, service, date, type : admission/sortie/transfert)
2. Identité du patient : [À COMPLÉTER PAR LE MÉDECIN]
3. Source(s) d'information utilisée(s)
4. Traitement habituel (avant hospitalisation)
   - Pour chaque médicament : DCI, posologie, voie, fréquence
5. Traitement prescrit (à l'admission ou à la sortie)
   - Pour chaque médicament : DCI, posologie, voie, fréquence
6. Divergences identifiées
   - Divergences intentionnelles (justifiées)
   - Divergences non intentionnelles (à corriger)
7. Actions correctives réalisées
8. Recommandations pour le suivi
9. Pharmacien/praticien responsable : [À COMPLÉTER PAR LE MÉDECIN]

DONNÉES FOURNIES (pseudonymisées) :
{{DONNEES_MEDICALES}}

Rédige le bilan en respectant la structure. Pour toute information manquante, utilise [À COMPLÉTER PAR LE MÉDECIN].`,
    status: "publie" as const,
    validatedClinical: true,
    validatedConformite: true,
    changelog: "Template initial conciliation médicamenteuse — v1.0.0",
  },
  {
    volet: "correspondance" as const,
    version: "1.0.0",
    name: "Correspondance médicale",
    description:
      "Template pour la rédaction d'une correspondance médicale entre praticiens.",
    content: `Rédige une correspondance médicale professionnelle à partir des données suivantes.

STRUCTURE OBLIGATOIRE :
1. En-tête (établissement expéditeur, service, date)
2. Destinataire : [À COMPLÉTER PAR LE MÉDECIN]
3. Objet de la correspondance
4. Identité du patient : [À COMPLÉTER PAR LE MÉDECIN]
5. Contexte clinique (motif de la correspondance)
6. Éléments cliniques pertinents
7. Résultats d'examens complémentaires
8. Conclusion et demande
9. Traitement en cours
10. Formule de politesse professionnelle
11. Signature : [À COMPLÉTER PAR LE MÉDECIN]

DONNÉES FOURNIES (pseudonymisées) :
{{DONNEES_MEDICALES}}

Rédige la correspondance en respectant la structure. Pour toute information manquante, utilise [À COMPLÉTER PAR LE MÉDECIN].`,
    status: "publie" as const,
    validatedClinical: true,
    validatedConformite: true,
    changelog: "Template initial correspondance médicale — v1.0.0",
  },
];

const SUBTYPE_PROMPT_INSTRUCTIONS: Record<RedactionSubtype, string> = {
  medecine_aigue: `PROMPT SPÉCIFIQUE — MÉDECINE AIGUË :
- Oriente le courrier vers une synthèse de prise en charge médicale aiguë.
- Mets en avant le motif d'admission, les diagnostics retenus, l'évolution clinique, les examens significatifs, les traitements modifiés et le suivi.
- Ne transforme pas le courrier en compte rendu opératoire.`,
  chirurgie: `PROMPT SPÉCIFIQUE — CHIRURGIE :
- Oriente le courrier vers une prise en charge chirurgicale.
- Fais ressortir l'indication opératoire, le geste réalisé, les suites opératoires, les consignes de pansement, d'anticoagulation, d'antalgiques, de rééducation et de consultation postopératoire si ces informations sont fournies.
- N'invente jamais de geste opératoire, de voie d'abord ou de complication.`,
  court_sejour_geriatrique: `PROMPT SPÉCIFIQUE — COURT SÉJOUR GÉRIATRIQUE :
- Oriente le courrier vers une synthèse gériatrique globale.
- Structure les éléments autour du motif d'hospitalisation, des comorbidités, de l'autonomie, du risque de chute, de la cognition, de la nutrition, du traitement et du devenir.
- Signale avec [À COMPLÉTER PAR LE MÉDECIN] toute information gériatrique attendue mais absente.`,
  smr: `PROMPT SPÉCIFIQUE — SMR :
- Oriente le courrier vers une prise en charge en soins médicaux et de réadaptation.
- Fais ressortir le motif d'admission en SMR, les objectifs de réadaptation, l'évolution fonctionnelle, les soins réalisés, l'autonomie, les aides nécessaires et le projet de sortie.
- N'ajoute aucun score fonctionnel absent des données.`,
  traitement_entree: `PROMPT SPÉCIFIQUE — CONCILIATION, TRAITEMENT D'ENTRÉE :
- Rédige une conciliation médicamenteuse centrée sur le traitement à l'entrée.
- Compare le traitement habituel avant admission au traitement prescrit à l'entrée.
- Distingue clairement divergences intentionnelles, divergences non intentionnelles et actions à mener si les données le permettent.`,
  traitement_sortie: `PROMPT SPÉCIFIQUE — CONCILIATION, TRAITEMENT DE SORTIE :
- Rédige une conciliation médicamenteuse centrée sur le traitement de sortie.
- Compare le traitement avant hospitalisation, les modifications pendant le séjour et le traitement de sortie.
- Mets en évidence les arrêts, introductions, modifications de posologie et recommandations de suivi si elles sont fournies.`,
  transfert_urgence: `PROMPT SPÉCIFIQUE — TRANSFERT VERS UN SERVICE D'URGENCE :
- Rédige une correspondance courte et opérationnelle pour transfert vers les urgences.
- Priorise le motif de transfert, le contexte, les constantes ou signes de gravité fournis, les examens déjà réalisés, les traitements administrés et la demande explicite.
- N'ajoute pas de triage ou de niveau d'urgence absent des données.`,
  transfert_inter_service: `PROMPT SPÉCIFIQUE — TRANSFERT INTER-SERVICE :
- Rédige une correspondance structurée pour transfert entre services.
- Mets en avant le motif du transfert, le résumé du séjour ou de la prise en charge, l'état clinique actuel, les traitements en cours, les surveillances et les points à reprendre.
- Garde un ton direct, clinique et utile au service receveur.`,
  consultation_specialisee: `PROMPT SPÉCIFIQUE — CONSULTATION SPÉCIALISÉE :
- Rédige une demande ou synthèse pour consultation spécialisée.
- Mets en avant la question posée au spécialiste, le contexte clinique, les antécédents pertinents, les examens disponibles, le traitement en cours et les attentes du demandeur.
- Si la spécialité exacte n'est pas fournie, insère [À COMPLÉTER PAR LE MÉDECIN].`,
};

export function buildTemplateForSubtype(params: {
  volet: Volet;
  subtype: RedactionSubtype;
  baseTemplate: string;
  data: string;
}) {
  const subtypeLabel = getSubtypeLabel(params.volet, params.subtype);
  const subtypeInstructions = SUBTYPE_PROMPT_INSTRUCTIONS[params.subtype];
  return `TYPE SÉLECTIONNÉ PAR L'UTILISATEUR :
${subtypeLabel}

${subtypeInstructions}

${params.baseTemplate}`.replaceAll("{{DONNEES_MEDICALES}}", params.data);
}

export const DEFAULT_TEST_CASES = [
  {
    volet: "courrier_sortie" as const,
    name: "Cas test 1 — Chirurgie orthopédique",
    inputData: `Patient fictif : [NOM_MASQUÉ], [DATE_MASQUÉE]
Service : Chirurgie orthopédique
Motif : Prothèse totale de hanche droite
Durée de séjour : 5 jours
Antécédents : HTA traitée, diabète type 2
Intervention : PTH droite par voie postéro-latérale, sans complication
Traitement de sortie : Anticoagulants 30 jours, antalgiques, rééducation
Suivi : Consultation à 6 semaines`,
    criteria: { mustContain: ["PTH", "anticoagulants", "rééducation"], mustNotContain: [] },
  },
  {
    volet: "conciliation" as const,
    name: "Cas test 2 — Conciliation à l'admission",
    inputData: `Patient fictif : [NOM_MASQUÉ]
Type : Conciliation à l'admission
Traitement habituel : Metformine 1000mg x2/j, Ramipril 5mg/j, Atorvastatine 40mg/j
Traitement prescrit à l'admission : Metformine suspendue, Ramipril 5mg/j, Atorvastatine 40mg/j, Insuline rapide
Divergence : Suspension Metformine (intentionnelle — insuffisance rénale aiguë)`,
    criteria: { mustContain: ["Metformine", "divergence", "intentionnelle"], mustNotContain: [] },
  },
  {
    volet: "correspondance" as const,
    name: "Cas test 3 — Correspondance cardiologie",
    inputData: `Patient fictif : [NOM_MASQUÉ]
Objet : Avis cardiologique
Contexte : Douleur thoracique atypique, ECG normal, troponines négatives
Demande : Avis spécialisé pour bilan étiologique
Traitement en cours : Aspirine 100mg, Bisoprolol 5mg`,
    criteria: { mustContain: ["avis", "cardiologique", "ECG"], mustNotContain: [] },
  },
];
