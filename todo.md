# REDACTIO — TODO

## Phase 2 — Schéma BDD & configuration

- [x] Schéma Drizzle : organisations, users étendu (rôle RBAC), abonnements, prompts, templates, campagnes de test
- [x] Migration SQL appliquée
- [x] Configuration globale : thème hospitalier, fonts, CSS variables clair/sombre
- [x] PWA manifest + icônes 192px et 512px

## Phase 3 — Authentification & RBAC

- [x] Extension du rôle utilisateur (praticien, editeur_medical, relecteur_clinique, responsable_conformite, admin)
- [x] Gestion des organisations / établissements
- [x] Page profil praticien
- [x] Page administration des comptes et abonnements

## Phase 4 — Pseudonymisation & IA

- [x] Filtre de pseudonymisation (règles regex + NER heuristique)
- [x] Adaptateur IA abstrait (invokeLLM)
- [x] Orchestrateur de prompts (socle + template par volet)
- [x] Endpoint de génération : streaming SSE, zéro journalisation du contenu
- [x] Rate limiting sur l'endpoint de génération

## Phase 5 — Parcours praticien

- [x] Étape 1 : Accès sécurisé (auth)
- [x] Étape 2 : Choix du volet (courrier de sortie, conciliation, correspondances)
- [x] Étape 3 : Injection des données brutes + avertissement permanent
- [x] Étape 4 : Génération IA avec streaming + indicateur de progression + annulation
- [x] Étape 5 : Éditeur riche TipTap + balises [À COMPLÉTER PAR LE MÉDECIN] surlignées
- [x] Validation explicite du praticien avant export
- [x] Copie en un clic et téléchargement local (après validation)
- [x] Signalement des sur-masquages détectés

## Phase 6 — Back-office de prompts

- [x] Liste des prompts (socle + templates par volet)
- [x] Cycle de vie : brouillon → candidat → publié → retiré
- [x] Double validation (clinique + conformité) tracée
- [x] Cas de test NLP pour non-régression
- [x] Initialisation des prompts par défaut
- [x] Mise à jour sans redéploiement

## Phase 7 — UI/UX & PWA

- [x] Design sobre et professionnel hospitalier (bleu médical)
- [x] Mode clair / sombre (ThemeProvider switchable)
- [x] Responsive (poste fixe + tablette)
- [x] PWA installable (manifest.json)
- [x] Avertissement permanent non masquable
- [x] Accessibilité RGAA AA (focus visible, aria-labels)

## Phase 8 — Tests & livraison

- [x] Tests vitest : filtre de pseudonymisation (9 tests)
- [x] Tests vitest : routeurs REDACTIO (4 tests)
- [x] Tests vitest : auth.logout (1 test)
- [x] 14/14 tests passent — zéro erreur TypeScript
- [x] Checkpoint final
- [x] Streaming SSE réel (fetch + ReadableStream) — remplacement de la mutation tRPC
- [x] Correction des ancres imbriquées <Link><a> dans RedactioLayout
- [x] Enregistrement de l'endpoint /api/generate/stream dans Express

## Phase 9 — Dictée vocale & correctifs

- [x] Correction erreur ancres imbriquées Dashboard.tsx (cards volets et admin)
- [x] Composant VoiceRecorder (MediaRecorder + états visuels + chronomètre + arrêt auto 5min)
- [x] Endpoint /api/voice/transcribe (multer + Whisper API via voiceTranscription helper)
- [x] Enregistrement de l'endpoint dans Express (index.ts)
- [x] Intégration dictée vocale dans les 3 volets : Courrier de sortie, Conciliation médicamenteuse, Correspondance médicale
- [x] Mode append : la transcription s'ajoute à la suite du texte existant
- [x] Aide contextuelle visible dans le bloc de saisie
