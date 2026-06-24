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

## Phase 10 — Dictée conciliation + Prévisualisation + Dictionnaire médical

- [x] Schéma BDD : table medical_terms (terme, catégorie, synonymes, source)
- [x] Migration SQL et import du dictionnaire médical français (430 termes couvrant 7 catégories)
- [x] API tRPC : recherche de termes médicaux (autocomplete, pagination) — router medical.search + medical.count + medical.incrementUsage
- [x] Composant VoiceRecorderWithPreview : modal de prévisualisation avant insertion (Dialog + édition du texte avant insertion)
- [x] Boutons microphone dédiés sur chaque colonne de conciliation (entrée + sortie) — VoiceRecorderWithPreview dans les 2 colonnes
- [x] Composant MedicalAutocomplete : suggestions de termes médicaux dans les champs (Popover + debounce 300ms)
- [x] Intégration autocomplete dans les champs de conciliation (entrée et sortie) + champ rawData des 3 volets
- [x] Tests Vitest dictionnaire médical (11 tests) — 25/25 tests au total
- [x] Checkpoint final v6a2c5a0c

## Phase 11 — Enrichissement dictionnaire & back-office

- [x] Enrichir le dictionnaire médical français (objectif 1000+ termes : médicaments DCI, CIM-10, CCAM, anatomie, biologie) — 1039 termes en base (7 catégories)
- [x] Pagination API tRPC dictionnaire médical (page/offset + total) — router medical.list avec page, pageSize, query, category
- [x] Page dédiée au dictionnaire médical dans le back-office (recherche, ajout, édition de termes) — /dictionnaire avec CRUD complet + filtres par catégorie

## Phase 12 — Expérience dictée vocale améliorée

- [x] Indicateur visuel animé (onde sonore / pulsation) pendant l'enregistrement — 5 barres via Web Audio API
- [x] Bouton Start (lancer l'enregistrement)
- [x] Bouton Pause (suspendre sans perdre l'audio)
- [x] Bouton Reprise (reprendre après pause)
- [x] Bouton Stop (terminer et déclencher la transcription)
- [x] Chronomètre visible (mm:ss) avec état pause
- [x] Appliquer VoiceRecorderWithPreview dans le champ rawData des 3 volets (courrier, conciliation, correspondance) — prévisualisation + Start/Pause/Reprise/Stop dans tous les champs
- [x] Appliquer dans VoiceRecorderWithPreview (colonnes de conciliation)
- [x] Vérifier TypeScript 0 erreur — 25/25 tests Vitest
- [x] Tests visuels et checkpoint — v1d3f8de6

## Phase 13 — Dictionnaire médical dans la prévisualisation

- [ ] Endpoint tRPC medical.analyzeText : tokenisation + matching contre la BDD (termes exacts + variantes)
- [ ] Algorithme de distance de Levenshtein pour les suggestions d'auto-correction
- [ ] Composant MedicalTextHighlighter : surlignage inline des termes reconnus (vert) et termes à corriger (orange)
- [ ] Tooltip sur chaque terme surligné : définition, catégorie, synonymes depuis la BDD
- [ ] Bouton "Appliquer toutes les corrections" dans la modal de prévisualisation
- [ ] Correction individuelle terme par terme (clic sur le terme orange → suggestion)
- [ ] Intégration dans VoiceRecorderWithPreview : analyse automatique après transcription Whisper
- [ ] Tests Vitest : analyzeText + distance de Levenshtein
- [ ] Checkpoint final
