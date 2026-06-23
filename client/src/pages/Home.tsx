import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  CheckCircle,
  Clock,
  EyeOff,
  FileText,
  Lock,
  Menu,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const heroCopy = {
  prat: {
    title: (
      <>
        Le courrier de sortie, <em>rédigé</em> pendant que vous passez au patient suivant.
      </>
    ),
    lead:
      "Dictez ou collez vos notes. REDACTIO les structure en un document hospitalier propre, prêt à relire et signer. Vous restez l'auteur — l'outil tient la plume.",
    primary: "Essayer gratuitement",
    primaryHref: getLoginUrl(),
    secondary: "Voir les outils",
    secondaryHref: "#produits",
    trust: ["Aucune donnée patient stockée", "Vous validez chaque document"],
  },
  etab: {
    title: (
      <>
        Des lettres de liaison <em>conformes</em>, dans tous vos services.
      </>
    ),
    lead:
      "Aidez vos équipes à produire des lettres complètes, au bon format, le jour de la sortie. Un enjeu de qualité (QLS), de financement (IFAQ) et de certification.",
    primary: "Demander une démonstration",
    primaryHref: "#demo",
    secondary: "L'offre établissement",
    secondaryHref: "#etablissements",
    trust: ["Format décret 2016-995", "Déploiement par service"],
  },
};

const products = [
  {
    title: "Courrier de sortie",
    description: "La rédaction structurée du courrier de sortie d'hospitalisation, section par section.",
    icon: FileText,
    accent: "#3ECCC4",
    deep: "#7CE7DF",
    tag: "Format lettre de liaison",
    items: ["Motif, synthèse du séjour, conclusion", "Traitement de sortie hiérarchisé", "Consignes de suivi et de surveillance"],
  },
  {
    title: "Conciliation médicamenteuse",
    description: "Le bilan de conciliation à l'admission, au transfert ou à la sortie.",
    icon: Stethoscope,
    accent: "#F59F0A",
    deep: "#FFD48A",
    tag: "Volet médicamenteux LLS",
    items: ["Bilan médicamenteux mis au propre", "Divergences repérées et explicitées", "Volet médicamenteux prêt à transmettre"],
  },
  {
    title: "Correspondance médicale",
    description: "Les courriers entre professionnels de santé, du bon ton et au bon format.",
    icon: BookOpen,
    accent: "#279B65",
    deep: "#8FE2B8",
    tag: "Ville · hôpital",
    items: ["Courrier d'adresse pour consultation", "Synthèse du dossier au confrère", "Formules et structure professionnelles"],
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [audience, setAudience] = useState<"prat" | "etab">("prat");
  const copy = heroCopy[audience];

  useEffect(() => {
    if (!loading && isAuthenticated) setLocation("/dashboard");
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="redactio-landing" id="top">
      <style>{landingStyles}</style>

      <header className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <a className="lp-brand" href="#top" aria-label="REDACTIO accueil">
            <span className="lp-brand-mark">
              <FileText size={19} strokeWidth={1.8} />
            </span>
            <span>
              <span className="lp-brand-name">REDACTIO</span>
              <span className="lp-brand-sub">Rédaction hospitalière</span>
            </span>
          </a>
          <nav className="lp-links" aria-label="Navigation landing page">
            <a href="#produits">Les outils</a>
            <a href="#praticiens">Praticiens</a>
            <a href="#etablissements">Établissements</a>
            <a href="#securite">Sécurité</a>
            <a href="#offres">Offres</a>
          </nav>
          <div className="lp-nav-cta">
            <a className="lp-login" href={getLoginUrl()}>Connexion</a>
            <a className="lp-btn lp-btn-primary" href="#offres">Commencer</a>
            <button className="lp-menu" type="button" aria-label="Menu" onClick={() => document.querySelector("#produits")?.scrollIntoView({ behavior: "smooth" })}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-segment" role="tablist" aria-label="Choisir votre profil">
              <button type="button" role="tab" aria-selected={audience === "prat"} onClick={() => setAudience("prat")}>
                <Users size={15} /> Je suis praticien
              </button>
              <button type="button" role="tab" aria-selected={audience === "etab"} onClick={() => setAudience("etab")}>
                <Building2 size={15} /> Établissement
              </button>
            </div>
            <h1>{copy.title}</h1>
            <p className="lp-hero-lead">{copy.lead}</p>
            <div className="lp-hero-actions">
              <a className={audience === "etab" ? "lp-btn lp-btn-slate" : "lp-btn lp-btn-primary"} href={copy.primaryHref}>
                {copy.primary} <ArrowRight className="lp-arr" size={16} />
              </a>
              <a className="lp-btn lp-btn-ghost" href={copy.secondaryHref}>{copy.secondary}</a>
            </div>
            <div className="lp-trust">
              {copy.trust.map((item) => (
                <span key={item}><Check size={15} /> {item}</span>
              ))}
            </div>
          </div>

          <div className="lp-doc-card" aria-label="Transformation de notes brutes en courrier de sortie">
            <div className="lp-doc-head">
              <span />
              <span />
              <span className="live" />
              <b>courrier-de-sortie · brouillon</b>
            </div>
            <div className="lp-doc-body">
              <div className="lp-doc-pane lp-raw">
                <span className="lp-pane-tag">Vos notes brutes</span>
                <p>
                  <b>H 72a</b>, hosp 12/03 dlr thoracique. <b>SCA NST+</b>. corona → <b>stent IVA</b>. sortie J4.
                  ttt: aspirine 75, <b>ticagrelor</b> 90×2, atorva 80, bisop 2.5, ramipril 5. FEVG 48%.
                  revoir cardio 1 mois + ETT. arrêt tabac.
                </p>
              </div>
              <div className="lp-doc-pane lp-out">
                <span className="lp-pane-tag">Lettre de liaison structurée</span>
                <DocSection label="Motif" text="Syndrome coronarien aigu sans sus-décalage de ST." />
                <DocSection label="Synthèse du séjour" text="Coronarographie + angioplastie avec stent actif sur l'IVA. Suites simples." />
                <DocSection label="Traitement de sortie" text="Aspirine 75 mg, ticagrelor 90 mg ×2, atorvastatine 80 mg, bisoprolol 2,5 mg, ramipril 5 mg." />
                <DocSection label="Suivi" text="Cardiologie à 1 mois avec ETT (FEVG 48 %). Sevrage tabagique." />
                <span className="lp-seal"><CheckCircle size={14} /> Relu et validé par le praticien</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-strip">
        <div className="lp-wrap lp-strip-inner">
          <StripItem icon={FileText} title="3 documents couverts" text="Sortie · conciliation · correspondance" />
          <StripItem icon={CheckCircle} title="Format lettre de liaison" text="Aligné sur le décret 2016-995" />
          <StripItem icon={Lock} title="Mémoire de session" text="Tout purgé à la déconnexion" />
          <StripItem icon={Users} title="Praticiens & établissements" text="Du compte individuel au déploiement" />
        </div>
      </section>

      <section className="lp-band" id="produits">
        <div className="lp-wrap">
          <SectionHead eyebrow="Les outils" title="Trois écrits du quotidien hospitalier, un même réflexe." text="Les documents qui prennent du temps en fin de journée — mis en forme à partir de ce que vous savez déjà du dossier." />
          <div className="lp-product-grid">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <article className="lp-product" key={product.title} style={{ "--accent": product.accent, "--accent-deep": product.deep } as React.CSSProperties}>
                  <span className="lp-product-icon"><Icon size={22} strokeWidth={1.7} /></span>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <ul>{product.items.map((item) => <li key={item}>{item}</li>)}</ul>
                  <span className="lp-tag">{product.tag}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-band lp-mist" id="fonctionnement">
        <div className="lp-wrap">
          <SectionHead eyebrow="Fonctionnement" title="De vos notes au document signé, en trois temps." text="Une séquence courte, pensée pour s'insérer dans le flux d'un service — pas pour le ralentir." />
          <div className="lp-steps">
            <Step number="TEMPS 01" title="Vous dictez ou collez" text="Abréviations, télégraphique, copier-coller : peu importe la forme. Sans identifiant direct du patient." kbd="H 72a · SCA NST+ · stent IVA…" />
            <Step number="TEMPS 02" title="REDACTIO structure" text="Le texte est pseudonymisé puis remis en sections claires, dans le format du document choisi." kbd="Motif · Synthèse · Traitement…" />
            <Step number="TEMPS 03" title="Vous relisez & validez" text="Vous corrigez, complétez, signez. Le document final est le vôtre — REDACTIO ne décide rien." kbd="Exporter · Copier · Signer" />
          </div>
        </div>
      </section>

      <section className="lp-band lp-paper">
        <div className="lp-wrap">
          <SectionHead centered eyebrow="Deux usages, une même plateforme" title="Que vous écriviez seul ou pour tout un service." />
          <div className="lp-doors">
            <a className="lp-door lp-door-prat" href="#praticiens">
              <span>Praticien · à titre individuel</span>
              <h3>Reprenez du temps clinique</h3>
              <p>Un compte personnel, prêt en deux minutes. Idéal pour les praticiens hospitaliers, les internes et les PADHUE qui veulent maîtriser le format français.</p>
              <b>Découvrir l'offre praticien <ArrowRight size={15} /></b>
            </a>
            <a className="lp-door lp-door-etab" href="#etablissements">
              <span>Hôpital · clinique · GHT</span>
              <h3>Déployez à l'échelle d'un service</h3>
              <p>Des lettres de liaison conformes et homogènes pour toutes vos équipes — un enjeu de qualité, de financement IFAQ et de certification HAS.</p>
              <b>Découvrir l'offre établissement <ArrowRight size={15} /></b>
            </a>
          </div>
        </div>
      </section>

      <section className="lp-band" id="praticiens">
        <div className="lp-wrap">
          <SectionHead eyebrow="Pour les praticiens" title="Moins de minutes sur le clavier, plus de minutes au lit du patient." text="Un outil personnel, sans installation ni configuration. Vous gardez la main sur chaque mot." />
          <div className="lp-feature-grid">
            <Feature icon={Clock} title="La fin de la page blanche" text="Un squelette propre à relire et compléter plutôt qu'un courrier à bâtir de zéro en fin de garde." />
            <Feature icon={BookOpen} title="Le format français, maîtrisé" text="Pour les PADHUE et les internes : s'approprier la structure et les codes du document hospitalier attendu en France." />
            <Feature icon={Shield} title="Vos patients, jamais conservés" text="Aucune donnée stockée, pseudonymisation automatique, tout purgé à la déconnexion." />
          </div>
          <a className="lp-btn lp-btn-primary lp-mt" href={getLoginUrl()}>Créer mon compte praticien <ArrowRight className="lp-arr" size={16} /></a>
        </div>
      </section>

      <section className="lp-band lp-etab" id="etablissements">
        <div className="lp-wrap">
          <span className="lp-eyebrow light">Pour les établissements</span>
          <h2>La lettre de liaison conforme, à l'échelle de vos services.</h2>
          <p className="lp-etab-lead">Un enjeu réglementaire, financier et de certification — pas seulement de confort. REDACTIO aide vos équipes à produire des lettres complètes, dans le bon format, le jour de la sortie.</p>
          <div className="lp-reg">
            <FileText size={26} />
            <div>
              <h4>Le cadre : décret n°2016-995 & indicateur QLS</h4>
              <p>Depuis 2017, la lettre de liaison doit être remise au patient le jour de sa sortie et adressée au médecin traitant. Sa qualité est évaluée par l'indicateur QLS (IQSS), mobilisé dans l'IFAQ et la certification HAS — objectif de performance fixé à 80/100.</p>
            </div>
          </div>
          <div className="lp-etab-grid">
            <Feature dark icon={CheckCircle} title="Conformité de la lettre de liaison" text="Les sections produites couvrent les critères QLS : motif, synthèse, traitements de sortie, suivi, identification du signataire." />
            <Feature dark icon={Users} title="Des écrits homogènes" text="Une même structure et un même niveau de qualité d'un praticien à l'autre, d'un service à l'autre." />
            <Feature dark icon={Building2} title="Comptes équipes & pilotage" text="Déploiement par service, gestion des accès, et un interlocuteur dédié pour vos référents qualité et DSI." />
            <Feature dark icon={Lock} title="Conformité contractuelle" text="Cadre de traitement des données à formaliser avec votre DPO." />
          </div>
          <div className="lp-cta-row">
            <a className="lp-btn lp-btn-primary" href="#demo">Demander une démonstration</a>
            <a className="lp-btn lp-btn-dark-ghost" href="#offres">Voir l'offre établissement</a>
          </div>
        </div>
      </section>

      <section className="lp-band lp-secure" id="securite">
        <div className="lp-wrap">
          <span className="lp-eyebrow light">Sécurité & données de santé</span>
          <h2>Conçu pour ne jamais conserver vos patients.</h2>
          <p>La première objection des soignants face à l'IA est notre première exigence — pour le praticien isolé comme pour la DSI d'un CHU.</p>
          <div className="lp-secure-grid">
            <Feature dark icon={Shield} title="Aucune donnée stockée" text="Mémoire de session uniquement, purgée à la déconnexion." />
            <Feature dark icon={EyeOff} title="Pseudonymisation auto" text="Appliquée avant tout envoi au moteur d'IA." />
            <Feature dark icon={Check} title="Le médecin reste l'auteur" text="Aucun diagnostic, aucune décision automatisée." />
            <Feature dark icon={Lock} title="Cadre établissement" text="Convention/DPA, hébergement & réversibilité à formaliser." />
          </div>
          <p className="lp-disclaimer">Bloc à valider avant mise en ligne : adaptez chaque affirmation à votre conformité réelle, avec votre DPO.</p>
        </div>
      </section>

      <section className="lp-band lp-mist" id="offres">
        <div className="lp-wrap">
          <SectionHead centered eyebrow="Offres" title="Une porte d'entrée pour chacun." text="Commencez seul en quelques minutes, ou équipez tout un service." />
          <div className="lp-plans">
            <Plan kind="Praticien" title="À titre individuel" text="Pour un médecin, un interne ou un candidat PADHUE qui rédige pour lui-même." cta="Essayer gratuitement" href={getLoginUrl()} items={["Les 3 outils de rédaction", "Compte personnel immédiat", "Confidentialité par conception"]} />
            <Plan featured kind="Établissement" title="Service · Hôpital · GHT" text="Pour équiper des équipes et fiabiliser vos lettres de liaison à l'échelle." cta="Demander une démo & un devis" href="#demo" items={["Comptes équipes & déploiement par service", "Accompagnement & interlocuteur dédié", "Convention de traitement (DPA) sur mesure"]} />
          </div>
        </div>
      </section>

      <section className="lp-band" id="demo">
        <div className="lp-wrap">
          <div className="lp-demo">
            <div>
              <span className="lp-eyebrow">Établissements</span>
              <h2>Parlons de votre service.</h2>
              <p>Une démonstration de 30 minutes, adaptée à votre activité et à vos enjeux QLS.</p>
              <ul>
                <li><Check size={16} /> Cas d'usage sur vos propres types de courriers</li>
                <li><Check size={16} /> Réponse à vos questions sécurité & conformité</li>
                <li><Check size={16} /> Proposition de pilote sur un service</li>
              </ul>
            </div>
            <form className="lp-form" onSubmit={(event) => event.preventDefault()}>
              <div className="lp-form-row">
                <Field label="Nom" placeholder="Dr Martin" />
                <Field label="Fonction" placeholder="Chef de service, DIM, DSI…" />
              </div>
              <Field label="Établissement" placeholder="CH / CHU / Clinique / GHT" />
              <div className="lp-form-row">
                <Field label="E-mail professionnel" placeholder="nom@etablissement.fr" type="email" />
                <label>
                  <span>Praticiens concernés</span>
                  <select><option>1 à 10</option><option>10 à 50</option><option>50 à 200</option><option>200+</option></select>
                </label>
              </div>
              <label>
                <span>Votre besoin (facultatif)</span>
                <textarea rows={3} placeholder="Type de courriers, volumétrie, échéances…" />
              </label>
              <button className="lp-btn lp-btn-slate" type="submit">Demander une démonstration</button>
              <p>Formulaire à connecter à votre outil CRM / e-mail. Aucune donnée patient ici.</p>
            </form>
          </div>
        </div>
      </section>

      <section className="lp-band lp-final-band">
        <div className="lp-wrap">
          <div className="lp-final">
            <h2>Votre prochain courrier, structuré en quelques instants.</h2>
            <p>Que vous écriviez pour vous ou pour tout un service, REDACTIO vous fait gagner le temps de la mise en forme — sans jamais conserver vos patients.</p>
            <div>
              <a className="lp-btn lp-btn-light" href={getLoginUrl()}>Essayer gratuitement</a>
              <a className="lp-btn lp-btn-primary" href="#demo">Demander une démo établissement</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-foot-grid">
            <div>
              <a className="lp-brand" href="#top">
                <span className="lp-brand-mark"><FileText size={19} /></span>
                <span><span className="lp-brand-name">REDACTIO</span><span className="lp-brand-sub">Rédaction hospitalière</span></span>
              </a>
              <p>L'assistant de rédaction qui structure vos écrits hospitaliers — sans jamais conserver vos patients.</p>
            </div>
            <FooterCol title="Praticiens" links={[["Les outils", "#produits"], ["Fonctionnement", "#fonctionnement"], ["Essayer gratuitement", getLoginUrl()]]} />
            <FooterCol title="Établissements" links={[["Pour les établissements", "#etablissements"], ["Offre établissement", "#offres"], ["Demander une démo", "#demo"]]} />
            <FooterCol title="Plateforme" links={[["Sécurité & données", "#securite"], ["Connexion", getLoginUrl()], ["Mentions légales", "#"]]} />
          </div>
          <div className="lp-foot-bar">
            <span>© {new Date().getFullYear()} REDACTIO — Aide à la rédaction, jamais à la décision médicale.</span>
            <span>un service de l'écosystème evc-pae.fr</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DocSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="lp-doc-section">
      <div>{label}</div>
      <p>{text}</p>
    </div>
  );
}

function SectionHead({ eyebrow, title, text, centered }: { eyebrow: string; title: string; text?: string; centered?: boolean }) {
  return (
    <div className={centered ? "lp-section-head center" : "lp-section-head"}>
      <span className="lp-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function StripItem({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return (
    <div className="lp-strip-item">
      <span><Icon size={18} /></span>
      <div><b>{title}</b><p>{text}</p></div>
    </div>
  );
}

function Step({ number, title, text, kbd }: { number: string; title: string; text: string; kbd: string }) {
  return (
    <div className="lp-step">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <kbd>{kbd}</kbd>
    </div>
  );
}

function Feature({ icon: Icon, title, text, dark }: { icon: typeof Shield; title: string; text: string; dark?: boolean }) {
  return (
    <div className={dark ? "lp-feature dark" : "lp-feature"}>
      <div><Icon size={22} strokeWidth={1.7} /></div>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

function Plan({ kind, title, text, items, cta, href, featured }: { kind: string; title: string; text: string; items: string[]; cta: string; href: string; featured?: boolean }) {
  return (
    <div className={featured ? "lp-plan featured" : "lp-plan"}>
      {featured ? <span className="lp-badge">Recommandé</span> : null}
      <span>{kind}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <ul>{items.map((item) => <li key={item}><Check size={16} /> {item}</li>)}</ul>
      <a className={featured ? "lp-btn lp-btn-slate" : "lp-btn lp-btn-primary"} href={href}>{cta}</a>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} placeholder={placeholder} />
    </label>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="lp-foot-col">
      <h5>{title}</h5>
      {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
    </div>
  );
}

const landingStyles = `
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
.redactio-landing{--ink:#122524;--panel:#fff;--panel-2:#F5FBFA;--border:#D5E9E7;--text:#122524;--muted:#708986;--muted-strong:#3B5451;--accent:#4EA39E;--accent-2:#71C9C4;--amber:#F59F0A;--green:#279B65;--surface:#fff;--surface-soft:#F2F8F7;--shadow:0 22px 54px -36px rgba(18,37,36,.34);--sans:'Hanken Grotesk',system-ui,-apple-system,sans-serif;--display:'Spectral',Georgia,serif;--mono:'JetBrains Mono',monospace;color:var(--text);background:#F7FBFA;font-family:var(--sans);line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.redactio-landing *{box-sizing:border-box}.redactio-landing a{color:inherit;text-decoration:none}.lp-wrap{max-width:1180px;margin:0 auto;padding:0 28px}.lp-nav{position:sticky;top:0;z-index:60;background:rgba(247,251,250,.88);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}.lp-nav-inner{height:70px;display:flex;align-items:center;justify-content:space-between;gap:24px}.lp-brand{display:flex;align-items:center;gap:.7em}.lp-brand-mark{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,var(--accent),#71C9C4);display:grid;place-items:center;color:#fff;flex-shrink:0;box-shadow:0 12px 24px -18px rgba(78,163,158,.72)}.lp-brand-name{display:block;font-family:var(--display);font-weight:800;letter-spacing:.04em;font-size:1.05rem;line-height:1;color:var(--text)}.lp-brand-sub{display:block;font-family:var(--mono);font-size:.58rem;letter-spacing:.14em;color:var(--accent);text-transform:uppercase;margin-top:4px}.lp-links{display:flex;align-items:center;gap:1.8rem}.lp-links a{font-size:.92rem;font-weight:700;color:var(--muted)}.lp-links a:hover{color:var(--text)}.lp-nav-cta{display:flex;align-items:center;gap:.9rem}.lp-login{font-size:.92rem;font-weight:800;color:var(--text)}.lp-menu{display:none;background:none;border:0;color:var(--text)}
.lp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;font-weight:800;font-size:.95rem;padding:.86em 1.45em;border-radius:12px;border:1px solid transparent;white-space:nowrap;transition:transform .18s ease,box-shadow .25s ease,background .2s ease,border-color .2s ease;cursor:pointer}.lp-btn-primary{background:var(--accent);color:#fff;box-shadow:0 18px 34px -24px rgba(78,163,158,.9)}.lp-btn-primary:hover{background:#428F8A;transform:translateY(-2px)}.lp-btn-slate{background:#fff;border-color:var(--border);color:var(--text)}.lp-btn-slate:hover{border-color:var(--accent);background:#F2FAF9;transform:translateY(-2px)}.lp-btn-ghost,.lp-btn-dark-ghost{background:#fff;color:var(--text);border-color:var(--border)}.lp-btn-ghost:hover,.lp-btn-dark-ghost:hover{border-color:var(--accent);background:#F2FAF9}.lp-btn-light{background:#fff;color:var(--text);border-color:var(--border)}.lp-arr{transition:transform .18s}.lp-btn:hover .lp-arr{transform:translateX(3px)}
.lp-hero{background:radial-gradient(circle at 78% 8%,rgba(113,201,196,.22),transparent 34%),linear-gradient(180deg,#F7FBFA 0%,#F3F9F8 100%);padding:72px 0 98px;overflow:hidden}.lp-hero-grid{display:grid;grid-template-columns:1.04fr .96fr;gap:54px;align-items:center}.lp-segment{display:inline-flex;background:#EEF7F6;border:1px solid var(--border);border-radius:999px;padding:4px;gap:4px;margin-bottom:28px;box-shadow:0 8px 22px -20px rgba(18,37,36,.28)}.lp-segment button{font-weight:800;font-size:.86rem;border:0;background:transparent;color:var(--muted);padding:.62em 1.05em;border-radius:999px;cursor:pointer;display:flex;align-items:center;gap:.5em}.lp-segment button[aria-selected=true]{background:var(--accent-2);color:var(--text);box-shadow:0 10px 22px -20px rgba(78,163,158,.9)}.lp-hero h1{font-family:var(--display);font-weight:800;font-size:clamp(2.65rem,5.6vw,4.55rem);line-height:1.02;letter-spacing:0;margin:0 0 .38em;color:var(--text)}.lp-hero h1 em{font-style:normal;color:var(--accent)}.lp-hero-lead{font-size:1.12rem;color:var(--muted-strong);max-width:44ch;margin-bottom:1.7em;min-height:3.4em}.lp-hero-actions{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5em}.lp-trust{display:flex;gap:1.3rem;flex-wrap:wrap;font-size:.84rem;color:var(--muted);font-weight:700}.lp-trust span{display:inline-flex;align-items:center;gap:.45em}.lp-trust svg{color:var(--accent)}
.lp-doc-card{background:#fff;border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);overflow:hidden}.lp-doc-head{display:flex;align-items:center;gap:.6em;padding:.9em 1.15em;border-bottom:1px solid var(--border);background:#EEF7F6}.lp-doc-head span{width:9px;height:9px;border-radius:50%;background:#C9DFDD}.lp-doc-head .live{background:var(--accent)}.lp-doc-head b{font-family:var(--mono);font-size:.7rem;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-left:.3em}.lp-doc-body{display:grid;grid-template-columns:1fr 1fr}.lp-doc-pane{padding:1.1em 1.15em;min-height:330px}.lp-raw{background:#122524;color:#C7D3DC;border-right:1px solid var(--border)}.lp-pane-tag{font-family:var(--mono);font-size:.64rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:.9em;display:block;color:var(--muted)}.lp-raw p{font-family:var(--mono);font-size:.78rem;line-height:1.75;color:#B7C9C7}.lp-raw b{color:#fff;font-weight:600}.lp-out{background:#fff;color:var(--text)}.lp-out .lp-pane-tag,.lp-doc-section div{color:#0A7B70}.lp-doc-section{margin-bottom:.85em}.lp-doc-section div{font-weight:800;font-size:.66rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:.15em}.lp-doc-section p{font-family:var(--sans);font-size:.85rem;line-height:1.5;color:var(--text)}.lp-seal{display:inline-flex;align-items:center;gap:.45em;margin-top:.4em;font-weight:800;font-size:.72rem;color:#9A6507}
.lp-strip{border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:#fff}.lp-strip-inner{display:flex;flex-wrap:wrap}.lp-strip-item{flex:1 1 220px;padding:24px;border-right:1px solid var(--border);display:flex;gap:.85em;align-items:flex-start}.lp-strip-item:last-child{border-right:0}.lp-strip-item>span{width:34px;height:34px;border-radius:10px;background:#E8F6F5;display:grid;place-items:center;color:var(--accent);flex-shrink:0}.lp-strip-item b{font-weight:800;font-size:.92rem;line-height:1.2;color:var(--text)}.lp-strip-item p{font-size:.8rem;color:var(--muted);margin-top:2px}
.lp-band{padding:92px 0;background:#F7FBFA}.lp-mist,.lp-paper{background:#F1F7F6}.lp-section-head{max-width:58ch;margin-bottom:46px}.lp-section-head.center{margin-left:auto;margin-right:auto;text-align:center}.lp-eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700;display:inline-flex;align-items:center;gap:.55em}.lp-eyebrow:before{content:"";width:18px;height:1.5px;background:var(--accent);display:inline-block}.lp-eyebrow.light{color:var(--accent)}.lp-eyebrow.light:before{background:var(--accent)}.lp-section-head h2,.lp-etab h2,.lp-secure h2,.lp-demo h2,.lp-final h2{font-family:var(--display);font-weight:800;font-size:clamp(2rem,3.6vw,3rem);line-height:1.08;letter-spacing:0;margin:.45em 0 .35em;color:var(--text)}.lp-section-head p{color:var(--muted);font-size:1.05rem}
.lp-product-grid,.lp-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.lp-product,.lp-feature,.lp-plan{background:#fff;border:1px solid var(--border);border-radius:18px;padding:30px 26px 26px;position:relative;box-shadow:0 16px 38px -34px rgba(18,37,36,.34)}.lp-product:before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent)}.lp-product:hover,.lp-door:hover{transform:translateY(-4px);box-shadow:0 24px 50px -36px rgba(18,37,36,.38);border-color:rgba(78,163,158,.42)}.lp-product-icon{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;color:#fff;background:var(--accent);margin-bottom:20px}.lp-product h3,.lp-feature h4,.lp-door h3,.lp-plan h3{font-family:var(--display);font-weight:800;font-size:1.22rem;margin-bottom:.35em;color:var(--text)}.lp-product p,.lp-feature p,.lp-plan p,.lp-door p{font-size:.92rem;color:var(--muted);margin-bottom:1.1em}.lp-product ul,.lp-plan ul{list-style:none;margin:0 0 1.3em;padding:0}.lp-product li,.lp-plan li{display:flex;gap:.55em;padding:.28em 0;align-items:flex-start;font-size:.83rem;color:var(--muted-strong)}.lp-product li:before{content:"";width:6px;height:6px;border-radius:2px;background:var(--accent);margin-top:.5em;flex-shrink:0}.lp-tag{font-family:var(--mono);font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-deep);background:#EAF7F6;border:1px solid var(--border);border-radius:999px;padding:.35em .7em}
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0}.lp-step{padding:0 30px;border-left:1px solid var(--border)}.lp-step:first-child{padding-left:0;border-left:0}.lp-step span,.lp-plan>span:first-child,.lp-door>span{font-family:var(--mono);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}.lp-step h3{font-family:var(--display);font-weight:800;font-size:1.3rem;margin:.5em 0 .4em;color:var(--text)}.lp-step p{color:var(--muted);font-size:.93rem}.lp-step kbd{display:inline-block;margin-top:1em;font-family:var(--mono);font-size:.74rem;background:#fff;border:1px solid var(--border);border-radius:999px;padding:.45em .75em;color:var(--muted-strong)}
.lp-doors,.lp-plans{display:grid;grid-template-columns:1fr 1fr;gap:18px}.lp-door{border-radius:18px;padding:30px;border:1px solid var(--border);background:#fff;transition:transform .2s,box-shadow .25s,border-color .2s;box-shadow:0 16px 38px -34px rgba(18,37,36,.34)}.lp-door-prat{background:linear-gradient(180deg,#fff,#EFF9F8)}.lp-door-etab{background:linear-gradient(180deg,#fff,#FFF8EA)}.lp-door-etab>span{color:#A36B05}.lp-door b{display:inline-flex;align-items:center;gap:.45em;color:var(--accent)}.lp-door-etab b{color:#A36B05}.lp-mt{margin-top:34px}.lp-feature div{width:42px;height:42px;border-radius:12px;background:#EAF7F6;color:var(--accent);display:grid;place-items:center;margin-bottom:14px}.lp-feature.dark{background:#fff;border-color:var(--border)}.lp-feature.dark div{background:#EAF7F6;color:var(--accent)}.lp-feature.dark h4{color:var(--text)}.lp-feature.dark p{color:var(--muted)}
.lp-etab,.lp-secure{background:#F7FBFA;color:var(--muted-strong)}.lp-etab h2,.lp-secure h2{color:var(--text);max-width:24ch}.lp-etab-lead,.lp-secure>div>p{color:var(--muted);font-size:1.06rem;max-width:52ch}.lp-reg{display:flex;gap:1em;align-items:flex-start;background:#fff;border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:16px;padding:22px 24px;margin:34px 0 12px;box-shadow:var(--shadow)}.lp-reg svg{color:var(--accent)}.lp-reg h4{color:var(--text);font-size:1.02rem;margin-bottom:.3em}.lp-reg p{color:var(--muted);font-size:.9rem}.lp-etab-grid,.lp-secure-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px}.lp-etab-grid{grid-template-columns:repeat(2,1fr)}.lp-cta-row{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:34px}.lp-disclaimer{font-size:.78rem;color:var(--muted);margin-top:26px;max-width:74ch}
.lp-plans{max-width:880px;margin:0 auto}.lp-plan.featured{border-color:rgba(78,163,158,.55);box-shadow:0 24px 50px -34px rgba(78,163,158,.42)}.lp-badge{position:absolute;top:-11px;right:24px;background:#EAF7F6;color:var(--accent);border:1px solid var(--border);font-size:.68rem;font-family:var(--mono);font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.4em .9em;border-radius:999px}.lp-plan li svg{color:var(--accent);flex-shrink:0;margin-top:3px}.lp-plan .lp-btn{width:100%}
.lp-demo{display:grid;grid-template-columns:.9fr 1.1fr;gap:48px;align-items:center;background:#fff;border:1px solid var(--border);border-radius:22px;padding:44px;box-shadow:var(--shadow)}.lp-demo p{color:var(--muted);font-size:.98rem;margin-bottom:1em}.lp-demo ul{list-style:none;padding:0}.lp-demo li{display:flex;gap:.55em;align-items:center;padding:.3em 0;color:var(--muted-strong)}.lp-demo li svg{color:var(--accent)}.lp-form{background:#F7FBFA;border:1px solid var(--border);border-radius:18px;padding:26px}.lp-form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.lp-form label{display:flex;flex-direction:column;gap:.35em;margin-bottom:14px}.lp-form span{font-size:.78rem;font-weight:800;color:var(--text)}.lp-form input,.lp-form select,.lp-form textarea{font:inherit;font-size:.9rem;padding:.78em .85em;border:1px solid var(--border);border-radius:12px;background:#fff;color:var(--text);width:100%}.lp-form input::placeholder,.lp-form textarea::placeholder{color:#8AA8A7}.lp-form .lp-btn{width:100%}.lp-form p{font-size:.72rem;color:var(--muted);margin-top:10px;text-align:center}
.lp-final-band{padding-top:0}.lp-final{background:linear-gradient(180deg,#fff,#EEF8F7);border:1px solid var(--border);color:var(--text);border-radius:22px;padding:56px;text-align:center;box-shadow:var(--shadow)}.lp-final h2{color:var(--text);max-width:22ch;margin-left:auto;margin-right:auto}.lp-final p{color:var(--muted);font-size:1.04rem;margin:0 auto 1.8em;max-width:46ch}.lp-final>div{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap}.lp-footer{background:#fff;border-top:1px solid var(--border);padding:54px 0 38px}.lp-foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:34px;margin-bottom:38px}.lp-foot-grid p{font-size:.86rem;color:var(--muted);max-width:30ch;margin-top:14px}.lp-foot-col h5{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-family:var(--mono);margin-bottom:14px;font-weight:700}.lp-foot-col a{display:block;font-size:.9rem;padding:.3em 0;color:var(--muted-strong)}.lp-foot-bar{border-top:1px solid var(--border);padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:.8rem;color:var(--muted)}
.redactio-landing .lp-btn-primary{color:#fff}.redactio-landing .lp-btn-slate,.redactio-landing .lp-btn-ghost,.redactio-landing .lp-btn-dark-ghost,.redactio-landing .lp-btn-light{color:var(--text)}
@media(max-width:900px){.lp-hero-grid,.lp-product-grid,.lp-feature-grid,.lp-etab-grid,.lp-secure-grid,.lp-doors,.lp-plans,.lp-demo{grid-template-columns:1fr}.lp-links{display:none}.lp-menu{display:block}.lp-steps{grid-template-columns:1fr;gap:32px}.lp-step{border-left:2px solid var(--border);padding:0 0 0 18px}.lp-step:first-child{padding-left:18px;border-left:2px solid var(--border)}.lp-foot-grid{grid-template-columns:1fr 1fr}.lp-strip-item{flex:1 1 100%;border-right:0;border-bottom:1px solid var(--border)}}@media(max-width:520px){.lp-wrap{padding:0 20px}.lp-doc-body,.lp-form-row{grid-template-columns:1fr}.lp-raw{border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.lp-doc-pane{min-height:0}.lp-final,.lp-demo,.lp-plan{padding:30px 24px}.lp-nav-cta .lp-btn,.lp-login{display:none}}
.redactio-landing :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
`;
