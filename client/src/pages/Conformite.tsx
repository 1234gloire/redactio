import {
  ArrowLeft,
  Check,
  EyeOff,
  Lock,
  RefreshCw,
  Shield,
  TriangleAlert,
} from "lucide-react";

const toc = [
  ["engagements", "Nos engagements"],
  ["hebergement", "Hébergement (HDS)"],
  ["donnees", "Données & finalités"],
  ["conservation", "Conservation"],
  ["roles", "Rôles & base légale"],
  ["sous-traitants", "Sous-traitants & IA"],
  ["securite", "Sécurité technique"],
  ["droits", "Droits des personnes"],
  ["responsabilites", "Vos responsabilités"],
  ["etablissements", "Établissements"],
  ["contact", "Contact DPO"],
];

export default function Conformite() {
  return (
    <div className="compliance-page">
      <style>{styles}</style>

      <div className="draft">
        <TriangleAlert size={16} />
        <span>Modèle à finaliser — compléter les champs [À COMPLÉTER] et faire valider par le DPO avant mise en ligne.</span>
      </div>

      <div className="cbar">
        <div className="wrap cbar-in">
          <span><Shield size={14} /> Conforme aux exigences de protection des données de santé</span>
          <b>RGPD</b><b>Hébergement HDS</b><b>Secret médical</b><b>Pseudonymisation</b>
        </div>
      </div>

      <header className="nav">
        <div className="wrap nav-inner">
          <a className="brand" href="/" aria-label="REDACTIO accueil">
            <span className="brand-mark"><span className="brand-mark-text">Rd</span></span>
            <span><strong>REDACTIO</strong><small>Rédaction hospitalière</small></span>
          </a>
          <a className="back" href="/"><ArrowLeft size={15} /> Retour à l'accueil</a>
        </div>
      </header>

      <section className="phead">
        <div className="wrap">
          <span className="eyebrow">Trust center</span>
          <h1>Conformité & sécurité des données de santé</h1>
          <p>Comment REDACTIO protège les données traitées sur la plateforme, et le cadre réglementaire dans lequel le service s'inscrit. Cette page s'adresse aux praticiens comme aux référents qualité, DSI et DPO des établissements.</p>
          <div className="updated">Dernière mise à jour : <Tag>[À COMPLÉTER : date]</Tag> · Version <Tag>[v1.0]</Tag></div>
        </div>
      </section>

      <main className="wrap layout">
        <nav className="toc" aria-label="Sommaire">
          <div>Sommaire</div>
          {toc.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <article className="doc">
          <DocSection id="engagements" n="01" title="Nos engagements">
            <p className="lead">La protection des données de santé n'est pas une fonctionnalité de REDACTIO : c'est sa condition de fonctionnement.</p>
            <div className="commit">
              <Commit icon={Shield} title="Aucune donnée patient stockée" text="Les saisies et documents vivent en mémoire de session, puis sont purgés à la déconnexion." />
              <Commit icon={EyeOff} title="Pseudonymisation automatique" text="Appliquée au texte comme à la dictée, avant tout envoi au moteur d'IA." />
              <Commit icon={Lock} title="Hébergement HDS" text="Hébergement agréé Données de Santé pour les traitements concernés." />
              <Commit icon={Shield} title="Secret médical" text="Respect du secret professionnel et de la confidentialité des soins." />
              <Commit icon={RefreshCw} title="Pas d'entraînement sur vos données" text="Vos contenus ne servent jamais à entraîner les modèles d'IA." />
              <Commit icon={Check} title="Le praticien reste l'auteur" text="Aide à la rédaction, jamais à la décision : aucun diagnostic, aucun acte automatisé." />
            </div>
          </DocSection>

          <DocSection id="hebergement" n="02" title="Hébergement des données (HDS)">
            <p>Les données traitées par REDACTIO susceptibles de relever des données de santé à caractère personnel sont hébergées auprès d'un hébergeur certifié <strong>Hébergeur de Données de Santé (HDS)</strong>, conformément à l'article L.1111-8 du Code de la santé publique.</p>
            <InfoTable rows={[
              ["Hébergeur", <Tag>[À COMPLÉTER : raison sociale de l'hébergeur]</Tag>],
              ["Certification HDS", <Tag>[À COMPLÉTER : périmètre & n° / organisme certificateur]</Tag>],
              ["Localisation des données", <Tag>[À COMPLÉTER : France / Union européenne]</Tag>],
              ["Transferts hors UE", <Tag>[À COMPLÉTER : aucun / encadrés par …]</Tag>],
            ]} />
            <div className="callout"><strong>À vérifier :</strong> ne mentionnez la certification HDS que si votre hébergement en bénéficie effectivement pour le périmètre concerné.</div>
          </DocSection>

          <DocSection id="donnees" n="03" title="Données traitées & finalités">
            <p>REDACTIO a une finalité unique : <strong>l'aide à la rédaction de documents hospitaliers</strong> : courrier de sortie, conciliation médicamenteuse, correspondance, observation médicale.</p>
            <Checklist items={[
              <><strong>Données de compte :</strong> <Tag>[À COMPLÉTER : nom, e-mail, identifiant professionnel…]</Tag>.</>,
              <><strong>Contenus de rédaction :</strong> notes saisies ou dictées, traitées en session puis non conservées.</>,
              <><strong>Aucun identifiant direct patient</strong> n'est requis ; la pseudonymisation est appliquée avant tout traitement par l'IA.</>,
            ]} />
          </DocSection>

          <DocSection id="conservation" n="04" title="Conservation & suppression">
            <Checklist items={[
              <><strong>Contenus de rédaction :</strong> conservés uniquement en mémoire de session, purgés à la déconnexion.</>,
              <><strong>Données de compte :</strong> conservées pendant la durée de la relation, puis <Tag>[À COMPLÉTER : durée]</Tag>.</>,
              <><strong>Journaux techniques :</strong> conservés <Tag>[À COMPLÉTER : durée]</Tag> à des fins de sécurité.</>,
            ]} />
          </DocSection>

          <DocSection id="roles" n="05" title="Rôles & base légale (RGPD)">
            <p>Le traitement est encadré par le RGPD et la loi Informatique et Libertés.</p>
            <Checklist items={[
              <><strong>Praticien individuel :</strong> REDACTIO agit en qualité de <Tag>[À COMPLÉTER : responsable / sous-traitant]</Tag>, sur la base légale <Tag>[À COMPLÉTER]</Tag>.</>,
              <><strong>Établissement :</strong> l'établissement demeure responsable de traitement ; REDACTIO agit comme sous-traitant, encadré par une convention de traitement (DPA).</>,
            ]} />
          </DocSection>

          <DocSection id="sous-traitants" n="06" title="Sous-traitants & moteur d'IA">
            <InfoTable rows={[
              [<Tag>[Hébergeur]</Tag>, "Hébergement HDS"],
              [<Tag>[Fournisseur d'IA]</Tag>, "Structuration des textes"],
            ]} />
            <Checklist items={[<>Les contenus transmis au moteur d'IA sont <strong>pseudonymisés au préalable</strong> et <strong>ne sont pas utilisés pour entraîner les modèles</strong> <Tag>[À VÉRIFIER]</Tag>.</>]} />
          </DocSection>

          <DocSection id="securite" n="07" title="Sécurité technique">
            <Checklist items={[
              <><strong>Chiffrement en transit</strong> (TLS) de tous les échanges.</>,
              <><strong>Authentification</strong> des comptes et gestion des accès <Tag>[À COMPLÉTER : MFA, SSO…]</Tag>.</>,
              <><strong>Journalisation</strong> et supervision de sécurité <Tag>[À COMPLÉTER]</Tag>.</>,
              <><strong>Gestion des incidents</strong> et notification conforme au RGPD <Tag>[À COMPLÉTER]</Tag>.</>,
            ]} />
          </DocSection>

          <DocSection id="droits" n="08" title="Droits des personnes">
            <p>Conformément au RGPD, toute personne dispose de droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur ses données à caractère personnel.</p>
            <p>REDACTIO ne conservant pas de données patient, ces droits concernent principalement les données de compte des praticiens. Une réclamation peut être adressée à la CNIL.</p>
          </DocSection>

          <DocSection id="responsabilites" n="09" title="Vos responsabilités en tant que praticien">
            <Checklist items={[
              <>Ne saisir <strong>aucun identifiant direct du patient</strong> : nom, prénom, numéro de sécurité sociale, date de naissance, adresse.</>,
              <><strong>Relire et valider</strong> chaque document : vous en êtes l'unique auteur et responsable.</>,
              <>REDACTIO est une <strong>aide à la rédaction</strong>, pas un dispositif médical ni un outil d'aide à la décision.</>,
            ]} />
          </DocSection>

          <DocSection id="etablissements" n="10" title="Pour les établissements">
            <Checklist items={[
              <><strong>Convention de traitement (DPA)</strong> au sens de l'article 28 du RGPD.</>,
              <>Éléments nécessaires à votre <strong>analyse d'impact (AIPD/DPIA)</strong> sur demande.</>,
              <><strong>Réversibilité</strong> et gestion des accès par service <Tag>[À COMPLÉTER : modalités]</Tag>.</>,
            ]} />
          </DocSection>

          <DocSection id="contact" n="11" title="Contact — Délégué à la protection des données">
            <InfoTable rows={[
              ["Éditeur", <Tag>[À COMPLÉTER : raison sociale / SIREN]</Tag>],
              ["DPO", <Tag>[À COMPLÉTER : nom / e-mail]</Tag>],
              ["Contact conformité", <Tag>[À COMPLÉTER : e-mail]</Tag>],
            ]} />
          </DocSection>
        </article>
      </main>

      <footer>
        <div className="wrap foot-in">
          <span>© {new Date().getFullYear()} REDACTIO — Aide à la rédaction, jamais à la décision médicale.</span>
          <span className="foot-links"><a href="/">Accueil</a><a href="#engagements">Conformité</a><a href="#contact">Contact DPO</a></span>
          <span className="eco">un service de l'écosystème evc-pae.fr</span>
        </div>
      </footer>
    </div>
  );
}

function DocSection({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return <section id={id}><h2><span>{n}</span>{title}</h2>{children}</section>;
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="todo">{children}</span>;
}

function Commit({ icon: Icon, title, text }: { icon: typeof Shield; title: string; text: string }) {
  return <div className="ccard"><Icon size={20} /><div><b>{title}</b><p>{text}</p></div></div>;
}

function Checklist({ items }: { items: React.ReactNode[] }) {
  return <ul>{items.map((item, index) => <li key={index}><Check size={16} /><span>{item}</span></li>)}</ul>;
}

function InfoTable({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return <table><tbody>{rows.map(([a, b], index) => <tr key={index}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>;
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
.compliance-page{--ink:#0B1B29;--slate:#1E3A5F;--soin:#0E9C8E;--soin-deep:#0A7B70;--soin-tint:#E7F4F2;--paper:#FBFAF8;--bg:#fff;--mist:#EEF3F5;--line:#D9E2E7;--line-soft:#E8EEF1;--seal:#C58A12;--seal-bg:#FBF3DE;--muted:#5A6B78;--muted-light:#8497A2;--serif:'Spectral',Georgia,serif;--sans:'Hanken Grotesk',system-ui,-apple-system,sans-serif;--mono:'JetBrains Mono',monospace;color:var(--ink);background:var(--bg);font-family:var(--sans);line-height:1.62;-webkit-font-smoothing:antialiased}.compliance-page *{box-sizing:border-box}.compliance-page a{color:var(--soin-deep);text-decoration:none}.compliance-page a:hover{text-decoration:underline}.wrap{max-width:1180px;margin:0 auto;padding:0 30px}.draft{display:flex;align-items:center;justify-content:center;gap:.7em;background:repeating-linear-gradient(135deg,#FBF3DE,#FBF3DE 14px,#F7ECCB 14px,#F7ECCB 28px);border-bottom:1px solid #EBD9A8;color:#7A5A0E;font-size:.82rem;padding:.7em 30px;text-align:center;font-weight:700}.cbar{background:var(--ink);color:#CFE0DA}.cbar-in{display:flex;align-items:center;justify-content:center;gap:1.2rem;flex-wrap:wrap;padding:.6em 30px;text-align:center}.cbar span{display:inline-flex;align-items:center;gap:.5em;font-weight:700;color:#fff;font-size:.8rem}.cbar svg{color:#8FD8CE}.cbar b{font-family:var(--mono);font-size:.68rem;color:#9FC0B9;font-weight:500}.nav{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.9);backdrop-filter:blur(14px);border-bottom:1px solid var(--line-soft)}.nav-inner{display:flex;align-items:center;justify-content:space-between;height:70px}.brand{display:flex;align-items:center;gap:.7em;color:var(--ink)!important}.brand:hover{text-decoration:none}.brand-mark{width:38px;height:38px;border-radius:9px;background:var(--slate);display:grid;place-items:center;color:#fff;flex-shrink:0}.brand-mark-text{font-family:var(--serif);font-style:italic;font-weight:600;font-size:1.02rem;letter-spacing:-1px;line-height:1;color:#fff;transform:translate(-1px,1px)}.brand strong{display:block;font-weight:800;letter-spacing:.05em;font-size:1.05rem;line-height:1}.brand small{display:block;font-family:var(--mono);font-size:.6rem;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-top:3px}.back{font-size:.9rem;font-weight:700;color:var(--muted)!important;display:inline-flex;align-items:center;gap:.4em}.phead{background:linear-gradient(180deg,var(--bg),var(--paper));border-bottom:1px solid var(--line-soft);padding:54px 0 46px}.eyebrow{font-family:var(--mono);font-size:.71rem;letter-spacing:.16em;text-transform:uppercase;color:var(--soin-deep);font-weight:600;display:inline-flex;align-items:center;gap:.6em}.eyebrow:before{content:"";width:22px;height:1.5px;background:#E1AB20}.phead h1{font-family:var(--serif);font-weight:600;font-size:clamp(2rem,3.6vw,2.9rem);line-height:1.1;letter-spacing:0;margin:.5em 0 .3em}.phead p{color:var(--muted);font-size:1.08rem;max-width:60ch}.updated{font-family:var(--mono);font-size:.72rem;color:var(--muted-light);margin-top:16px;letter-spacing:.03em}.layout{display:grid;grid-template-columns:248px 1fr;gap:54px;padding:54px 30px 80px;align-items:start}.toc{position:sticky;top:96px}.toc div{font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;text-transform:uppercase;color:var(--muted-light);margin-bottom:14px}.toc a{display:block;font-size:.88rem;color:var(--muted);padding:.4em 0 .4em 14px;border-left:2px solid var(--line);transition:all .15s}.toc a:hover{color:var(--ink);border-color:var(--soin);text-decoration:none}.doc h2{font-family:var(--serif);font-weight:600;font-size:1.5rem;letter-spacing:0;margin:0 0 .5em;scroll-margin-top:96px}.doc h2 span{font-family:var(--mono);font-size:.8rem;color:var(--soin-deep);font-weight:500;margin-right:.5em}.doc section{margin-bottom:48px;padding-bottom:40px;border-bottom:1px solid var(--line-soft)}.doc p{margin-bottom:1em;color:#22323E}.lead{font-size:1.05rem;color:var(--ink)!important}.commit{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:6px 0 4px}.ccard{display:flex;gap:.75em;align-items:flex-start;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px 18px}.ccard svg{color:var(--soin-deep);flex-shrink:0;margin-top:2px}.ccard b{display:block;font-weight:800;font-size:.92rem;line-height:1.2}.ccard p{font-size:.82rem;color:var(--muted);margin:2px 0 0}.todo{background:var(--seal-bg);border:1px solid #EBD9A8;color:#7A5A0E;border-radius:5px;padding:.06em .45em;font-family:var(--mono);font-size:.84em;font-weight:500;white-space:nowrap}.callout{background:var(--soin-tint);border:1px solid #BFE6E0;border-left:3px solid var(--soin);border-radius:10px;padding:16px 18px;font-size:.9rem;color:#0C3B36;margin:6px 0 2px}table{width:100%;border-collapse:collapse;font-size:.88rem;margin:4px 0 6px}td{text-align:left;padding:.7em .8em;border-bottom:1px solid var(--line);color:#22323E;vertical-align:top}.doc ul{list-style:none;margin:0 0 1.1em;padding:0}.doc li{display:flex;gap:.6em;padding:.32em 0;align-items:flex-start;color:#22323E}.doc li svg{color:var(--soin);flex-shrink:0;margin-top:.42em}footer{background:var(--paper);border-top:1px solid var(--line);padding:40px 0}.foot-in{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;font-size:.82rem;color:var(--muted)}.foot-links{display:flex;gap:1.2rem;flex-wrap:wrap}.eco{font-family:var(--mono)}@media(max-width:880px){.layout{grid-template-columns:1fr;gap:0}.toc{position:static;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid var(--line-soft)}.toc a{display:inline-block;border-left:0;border-bottom:2px solid var(--line);margin-right:8px;padding:.3em .2em}.commit{grid-template-columns:1fr}.draft svg{display:none}}:focus-visible{outline:2px solid var(--soin);outline-offset:3px;border-radius:4px}
`;
