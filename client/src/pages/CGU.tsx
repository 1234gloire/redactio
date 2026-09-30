import { useEffect } from "react";
import { LEGAL_STYLES } from "./CGV";

const sections = [
  "Objet",
  "Définitions",
  "Description du Service MEDACTIO",
  "Documentation contractuelle",
  "Durée",
  "Accès à la Plateforme",
  "Utilisation de la Plateforme et du Service MEDACTIO",
  "Obligations de l'Utilisateur",
  "Obligations de MEDACTIO et disponibilité du Service",
  "Propriété intellectuelle",
  "Logiciels et Services de tiers",
  "Garanties",
  "Responsabilité",
  "Abonnement, période d'essai de 7 jours et modalités de paiement",
  "Données à caractère personnel et secret médical",
  "Suspension et résiliation d'accès à la Plateforme",
  "Suppression d'un Compte Utilisateur",
  "Divers",
  "Droit applicable et règlement des litiges",
];

const CGU_EXTRA_STYLES = `
  .legal-section {
    scroll-margin-top: 24px;
  }

  .legal-section h3 {
    margin: 20px 0 8px;
    color: var(--legal-navy);
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
  }

  .legal-section ol {
    margin: 8px 0 0;
    padding-left: 20px;
  }

  .legal-section ol li {
    margin-bottom: 6px;
    color: var(--legal-text);
    font-size: 15px;
  }

  .legal-section ol li:last-child {
    margin-bottom: 0;
  }

  .legal-draft {
    margin: 0 0 24px;
    color: #a36200;
    font-size: 14px;
    font-style: italic;
  }

  .legal-section p.legal-draft {
    margin: 10px 0 10px;
    color: #a36200;
    font-size: 14px;
    font-style: italic;
  }
`;

function articleTitle(number: number, title: string) {
  return `Article ${number} — ${title}`;
}

export default function CGU() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Conditions générales d'utilisation — MEDACTIO";

    let metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const metaAlreadyExisted = Boolean(metaDescription);
    const previousDescription = metaDescription?.content ?? "";

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }

    metaDescription.content =
      "Consultez les conditions générales d'utilisation de la plateforme MEDACTIO éditée par Grays & Co.";
    window.scrollTo({ top: 0, behavior: "auto" });

    return () => {
      document.title = previousTitle;
      if (!metaDescription) return;
      if (metaAlreadyExisted) {
        metaDescription.content = previousDescription;
      } else {
        metaDescription.remove();
      }
    };
  }, []);

  return (
    <div className="legal-page">
      <style>{LEGAL_STYLES}</style>
      <style>{CGU_EXTRA_STYLES}</style>

      <header className="legal-header">
        <div className="legal-header-inner">
          <div className="legal-logo-mark" aria-hidden="true">
            M
          </div>

          <a className="legal-brand" href="/" aria-label="Retour à MEDACTIO">
            MEDACTIO
          </a>
        </div>

        <h1>Conditions générales d&apos;utilisation</h1>

        <div className="legal-subtitle">
          Site{" "}
          <a
            href="https://www.medactio.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.medactio.fr
          </a>
        </div>
      </header>

      <main className="legal-main">
        <div className="legal-card">
          <nav className="legal-section" aria-label="Sommaire">
            <h2>Sommaire</h2>
            <ol style={{ listStyle: "none", paddingLeft: 0 }}>
              {sections.map((title, index) => (
                <li key={title}>
                  <a href={`#section-${index + 1}`}>
                    {articleTitle(index + 1, title)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section className="legal-section" id="section-1">
            <h2>Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après «{" "}
              <strong>CGU</strong> ») régissent les conditions d'accès et
              d'utilisation de la plateforme « MEDACTIO », accessible à
              l'adresse{" "}
              <em>
                <a
                  href="https://www.medactio.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.medactio.fr
                </a>
              </em>
              , permettant aux Professionnels de santé de bénéficier d'une
              assistance rédactionnelle par intelligence artificielle pour la
              production de documents médicaux courants (courriers de sortie,
              correspondances médicales, conciliations médicamenteuses,
              observations médicales, comptes rendus, etc.), à tout
              Professionnel de santé ayant créé un Compte Utilisateur dans les
              conditions plus amplement définies ci-après (ci-après la «{" "}
              <strong>Plateforme</strong> »).
            </p>
            <p>
              La Plateforme est éditée par la société{" "}
              <strong>Grays &amp; Co</strong>, société par actions simplifiée
              (SAS) au capital social de 1 000 € dont le siège social est situé
              229 rue Solférino, 59000 Lille, immatriculée au Registre du
              Commerce et des Sociétés de Lille Métropole sous le numéro 109 564
              427 (ci-après « <strong>Grays &amp; Co</strong> », «{" "}
              <strong>MEDACTIO</strong> » ou « <strong>Nous</strong> »).
            </p>
            <p>
              <strong>Adresse mail : </strong>
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>
            </p>
            <p>
              <strong>Numéro de TVA intracommunautaire : </strong>FR63109564427
            </p>
            <p>
              <strong>Directeur de la publication : </strong>Monsieur Christel
              Roland MAFOUTA, Président de Grays &amp; Co
            </p>
            <p>
              La Plateforme MEDACTIO est hébergée auprès d'un hébergeur agréé de
              santé, conformément aux dispositions de l'article L.1111-8 du Code
              de la santé publique. MEDACTIO ne stocke aucune donnée de santé de
              patients.
            </p>
            <p>
              Le site et l'application MEDACTIO sont hébergés par :{" "}
              <strong>OVH</strong>, société par actions simplifiée au capital de
              50 000 000 €, immatriculée au Registre du Commerce et des Sociétés
              de Lille Métropole sous le numéro 424 761 419, dont le siège
              social est sis 2 rue Kellermann à Roubaix (59100), certifiée
              hébergeur de données de santé (HDS).
            </p>
            <p>
              Le développement et la maintenance du site et de l'application
              sont assurés par : <strong>ELIKIA GROUP SARL</strong>, société de
              droit sénégalais dont le siège est situé à Dakar (Sénégal),
              prestataire informatique de Grays &amp; Co.
            </p>
          </section>
          <section className="legal-section" id="section-2">
            <h2>Article 2 — Définitions</h2>
            <p>
              <strong>« Administrateur » : </strong>désigne un employé ou un
              membre de l'équipe d'un Établissement Client, autorisé par
              celui-ci et ayant conclu un Contrat SaaS avec MEDACTIO, à créer et
              gérer les Comptes Utilisateurs et à réaliser certaines actions sur
              la Plateforme en fonction de l'abonnement souscrit par
              l'Établissement.
            </p>
            <p>
              <strong>« Autorité de Contrôle » : </strong>a la signification qui
              lui est attribuée à l'article 4 du Règlement Européen 2016/679 du
              27 avril 2016 (ci-après le « RGPD »).
            </p>
            <p>
              <strong>« Client / Établissement » : </strong>désigne
              l'établissement de santé, la clinique ou toute structure médicale
              ayant conclu un Contrat SaaS avec MEDACTIO pour les besoins d'une
              partie ou de la totalité de ses équipes médicales.
            </p>
            <p>
              <strong>« Compte Utilisateur » : </strong>désigne le compte
              permettant au Professionnel de santé d'accéder à son espace privé
              et sécurisé sur la Plateforme, créé soit directement par
              l'Utilisateur (utilisation individuelle par abonnement), soit
              selon les instructions communiquées par l'Établissement Client ou
              ses Administrateurs (utilisation dans le cadre d'un Contrat SaaS).
            </p>
            <p>
              <strong>« Contenu Utilisateur » : </strong>désigne l'ensemble des
              informations, textes, éléments saisis par l'Utilisateur dans la
              Plateforme en vue de la génération d'un Document Généré.
            </p>
            <p>
              <strong>« Contrat SaaS » : </strong>désigne le contrat conclu
              entre MEDACTIO et un Établissement Client ayant pour objet de
              déterminer les conditions applicables à la mise à disposition de
              la Plateforme aux Utilisateurs Habilités de cet Établissement, au
              paramétrage du Service MEDACTIO et aux prestations de support y
              afférentes.
            </p>
            <p>
              <strong>« Document Généré » : </strong>désigne tout document
              médical (courrier de sortie, correspondance médicale,
              compte-rendu, observation médicale, tableau de conciliation
              médicamenteuse, etc.) produit par le Service MEDACTIO à partir du
              Contenu Utilisateur.
            </p>
            <p>
              <strong>« Données à Caractère Personnel » : </strong>a la
              signification qui lui est attribuée à l'article 4 du RGPD.
            </p>
            <p>
              <strong>« Données de santé » : </strong>a la signification qui lui
              est attribuée à l'article 4 du RGPD.
            </p>
            <p>
              <strong>« Identifiants » : </strong>désigne l'adresse email
              identifiant un Utilisateur (« login ») ainsi que le mot de passe
              de connexion y étant associé (« password »), créés par
              l'Utilisateur dans les conditions décrites à l'Article 6.3 des
              présentes.
            </p>
            <p>
              <strong>« Parties » : </strong>désigne conjointement MEDACTIO et
              l'Utilisateur.
            </p>
            <p>
              <strong>« Personnes Concernées » : </strong>a la signification qui
              lui est attribuée à l'article 4 du RGPD.
            </p>
            <p>
              <strong>« Plateforme » : </strong>a le sens donné au sein de
              l'Article 1 « Objet » des présentes CGU.
            </p>
            <p>
              <strong>« Professionnel de santé » : </strong>désigne les
              professionnels de santé tels que définis par le Code de la santé
              publique, disposant d'un numéro RPPS ou ADELI, et pouvant avoir
              accès à la Plateforme sous réserve que les conditions figurant à
              l'Article 6.1 des CGU soient réunies. Ce terme désigne, selon le
              cas applicable, le Professionnel Individuel et/ou le Professionnel
              Établissement.
            </p>
            <p>
              <strong>« Professionnel Individuel » : </strong>désigne un
              Professionnel de santé souscrivant et utilisant le Service
              MEDACTIO via la Plateforme dans le cadre et pour les besoins d'un
              exercice individuel (à titre personnel), par voie d'abonnement
              payant tel que décrit à l'Article 14.1.
            </p>
            <p>
              <strong>« Professionnel Établissement » : </strong>désigne un
              Professionnel de santé utilisant le Service MEDACTIO via la
              Plateforme dans le cadre et pour les besoins de son activité au
              sein d'un Établissement Client ayant conclu un Contrat SaaS, tel
              que décrit à l'Article 14.2.
            </p>
            <p>
              <strong>
                « Réglementation Applicable en matière de Protection des Données
                » :{" "}
              </strong>
              désigne le RGPD, la loi française n°78-17 du 6 janvier 1978 dite «
              loi Informatique et Libertés », ainsi que toute loi nationale
              applicable transposant la directive européenne 2002/58/CE du 12
              juillet 2002 dite directive « e-Privacy », telle que régulièrement
              mise à jour, modifiée et/ou remplacée.
            </p>
            <p>
              <strong>« Responsable du Traitement » : </strong>a la
              signification qui lui est attribuée à l'article 4 du RGPD.
            </p>
            <p>
              <strong>« Service MEDACTIO » : </strong>désigne le service
              d'assistance rédactionnelle par intelligence artificielle fourni
              par MEDACTIO aux Utilisateurs via la Plateforme, décrit à
              l'Article 3 des présentes.
            </p>
            <p>
              <strong>« Sous-traitant » : </strong>a la signification qui lui
              est attribuée à l'article 4 du RGPD.
            </p>
            <p>
              <strong>« Traitement » : </strong>a la signification qui lui est
              attribuée à l'article 4 du RGPD.
            </p>
            <p>
              <strong>« Utilisateur(s) ou Vous » : </strong>désigne toute
              personne bénéficiant d'un Compte Utilisateur sur la Plateforme
              (Professionnel Individuel ou Professionnel Établissement) et/ou
              tout utilisateur autorisé par un Établissement Client à accéder à
              la Plateforme, sous réserve du respect des stipulations des
              présentes CGU et, selon le cas applicable, du Contrat SaaS.
            </p>
            <p>
              <strong>« Utilisateur(s) Habilité(s) » : </strong>désigne tout
              Utilisateur autorisé par un Établissement Client et/ou ses
              Administrateurs à accéder à la Plateforme et à utiliser le Service
              MEDACTIO, sous réserve du respect des stipulations des présentes
              CGU et, selon le cas applicable, du Contrat SaaS.
            </p>
            <p>
              <strong>« Violation de Données à Caractère Personnel » : </strong>
              a la signification qui lui est attribuée à l'article 4 du RGPD.
            </p>
          </section>
          <section className="legal-section" id="section-3">
            <h2>Article 3 — Description du Service MEDACTIO</h2>
            <p>
              MEDACTIO met à disposition des Professionnels de santé une
              solution d'assistance rédactionnelle par intelligence
              artificielle, leur permettant de produire plus rapidement des
              documents médicaux courants à partir des informations qu'ils
              saisissent eux-mêmes.
            </p>
            <p>
              <strong>
                Positionnement du Service — assistance strictement
                rédactionnelle.{" "}
              </strong>
              Le Service MEDACTIO est un outil d'aide RÉDACTIONNELLE. Il met en
              forme, reformule et structure les informations médicales fournies,
              saisies et validées par le Professionnel de santé. Il ne constitue
              en aucun cas un outil d'aide à la décision médicale : il ne
              recommande, ne calcule et n'applique de façon autonome aucune
              valeur clinique (posologie, molécule, durée de traitement, délai,
              modalité de surveillance ou d'immobilisation, etc.). Toute valeur
              clinique figurant dans un Document Généré est celle que le
              Professionnel de santé a lui-même saisie ou validée. Le
              Professionnel de santé demeure seul responsable du contenu médical
              de chaque Document Généré, de sa pertinence clinique et de sa
              conformité aux données acquises de la science, au même titre que
              s'il avait rédigé ce document sans assistance.
            </p>
            <p>
              Le Service MEDACTIO permet notamment aux Utilisateurs d'utiliser,
              via la Plateforme, les modules suivants (liste non exhaustive,
              susceptible d'évoluer) :
            </p>
            <ul>
              <li>
                Courrier de sortie (dont les déclinaisons par spécialité, par
                exemple chirurgie orthopédique, court séjour gériatrique,
                médecine polyvalente) ;
              </li>
              <li>Correspondance médicale ;</li>
              <li>Conciliation médicamenteuse ;</li>
              <li>Observation médicale ;</li>
              <li>Extraction et mise en forme de comptes rendus d'examens ;</li>
            </ul>
            <p>
              Chaque Document Généré demeure un projet de document, destiné à
              être relu, complété et validé par le Professionnel de santé avant
              tout usage clinique, administratif ou toute transmission à un
              tiers, conformément à l'Article 8.1 des présentes.
            </p>
          </section>
          <section className="legal-section" id="section-4">
            <h2>Article 4 — Documentation contractuelle</h2>
            <p>
              Les présentes CGU régissent Votre accès et Votre utilisation de la
              Plateforme et du Service MEDACTIO.
            </p>
            <p>
              Tout bon de commande, accusé de réception ou autre formulaire
              commercial émis par l'une ou l'autre des Parties en relation avec
              la Plateforme est uniquement destiné à la commodité interne de la
              partie émettrice et ne modifiera pas, n'amendera pas et ne
              complétera pas les dispositions des présentes CGU, même s'il
              prétend le faire ou s'il est contresigné ou reconnu par l'autre
              Partie.
            </p>
            <p>
              Lorsqu'applicable, en cas de conflit entre les stipulations des
              présentes CGU et celles d'un Contrat SaaS conclu avec un
              Établissement Client, les stipulations de ce Contrat SaaS
              prévaudront sur celles des CGU dans la mesure du conflit.
            </p>
          </section>
          <section className="legal-section" id="section-5">
            <h2>Article 5 — Durée</h2>
            <p>
              Les présentes CGU s'appliquent à Vous dès leur acceptation lorsque
              Vous vous connectez à la Plateforme et restent en vigueur pendant
              toute la durée de Votre utilisation autorisée de la Plateforme et
              du Service MEDACTIO, sous réserve des stipulations des Articles 16
              et 17 des présentes (ci-après la « Durée »).
            </p>
          </section>
          <section className="legal-section" id="section-6">
            <h2>Article 6 — Accès à la Plateforme</h2>
            <p>
              L'accès à la Plateforme et son utilisation sont exclusivement
              réservés aux Utilisateurs disposant d'un Compte Utilisateur
              conforme aux conditions détaillées ci-après.
            </p>
            <h3>6.1. Conditions préalables d'accès à la Plateforme</h3>
            <p>
              Vous n'êtes autorisé à Vous inscrire sur la Plateforme et à
              bénéficier du Service MEDACTIO en tant que Professionnel de santé
              qu'à la condition d'être inscrit au fichier RPPS ou ADELI. Cette
              validité est contrôlée lors de Votre inscription sur la
              Plateforme, par comparaison avec les bases de données de référence
              mises à disposition par les autorités compétentes. L'accès est
              également ouvert aux praticiens à diplôme hors Union européenne
              (PADHUE) en cours de parcours de consolidation des compétences,
              aux stagiaires associés et aux internes en médecine.
            </p>
            <p>
              L'Utilisateur reconnaît et accepte que la fourniture,
              l'installation et la maintenance des équipements ainsi que les
              frais relatifs aux communications électroniques (coûts
              téléphoniques, coûts d'accès à Internet) résultant de son
              utilisation relèvent de sa seule responsabilité et sont
              exclusivement à sa charge.
            </p>
            <h3>6.2. Modalités de mise à disposition de la Plateforme</h3>
            <p>
              La Plateforme et le Service MEDACTIO qui y est associé sont mis à
              disposition selon <strong>deux modalités</strong>, exclusives
              l'une de l'autre pour un même usage :
            </p>
            <ul>
              <li>
                <strong>Utilisation Individuelle par abonnement : </strong>le
                Professionnel de santé souscrit personnellement, à titre
                individuel, un abonnement payant à la Plateforme, dans les
                conditions décrites à l'Article 14.1. Il n'existe pas d'offre
                gratuite du Service MEDACTIO : l'abonnement débute par une
                période d'essai de 7 jours, à l'issue de laquelle, sauf
                résiliation, le Professionnel Individuel est débité et
                l'abonnement payant démarre automatiquement.
              </li>
              <li>
                <strong>
                  Utilisation dans le cadre d'un Établissement (Contrat SaaS)
                  :{" "}
                </strong>
                lorsque MEDACTIO est mis à disposition d'un établissement de
                santé, d'une clinique ou de toute autre structure médicale (l'«
                Établissement » ou le « Client »), pour une partie ou la
                totalité de ses équipes médicales, dans le cadre d'un Contrat
                SaaS conclu entre l'Établissement et MEDACTIO. Dans ce cadre,
                Votre utilisation de la Plateforme et du Service MEDACTIO sera
                régie par les présentes CGU mais également par toute stipulation
                complémentaire détaillée au sein du Contrat SaaS, notamment
                relative au prix, à la facturation et au périmètre des équipes
                concernées. En accédant à la Plateforme à ce titre, Vous
                certifiez (i) bénéficier de l'autorisation de l'Établissement
                Client pour accéder à la Plateforme et avoir été désigné par ce
                dernier comme Utilisateur Habilité ; et (ii) avoir pris
                connaissance des éventuelles stipulations complémentaires
                figurant dans le Contrat SaaS, que Vous vous engagez à
                respecter.
              </li>
            </ul>
            <p>
              Activité mixte : lorsque Vous exercez à la fois en tant que
              Professionnel Individuel et en tant que Professionnel
              Établissement (par exemple pour partie en exercice libéral et pour
              partie au sein d'un Établissement Client), Vous pouvez utiliser la
              Plateforme et le Service MEDACTIO au titre de chacune de ces deux
              activités, selon les modalités et la tarification qui leur sont
              respectivement applicables.
            </p>
            <p>
              Si Vous changez de statut pendant la Durée des CGU (Professionnel
              Individuel devenant Professionnel Établissement, ou inversement),
              Vous pourrez conserver Votre Compte Utilisateur pour continuer à
              accéder à la Plateforme, dans la mesure où celui-ci est un compte
              personnel à chaque Professionnel de santé, sous réserve de la mise
              à jour de son mode de facturation.
            </p>
            <h3>6.3. Création d'un Compte Utilisateur sur la Plateforme</h3>
            <p>
              La création d'un Compte Utilisateur par un Professionnel de santé
              est subordonnée à la transmission du formulaire d'inscription
              dûment complété, dans les conditions plus amplement décrites
              ci-après.
            </p>
            <p>
              Pour créer un Compte Utilisateur et bénéficier du Service
              MEDACTIO, en tant que Professionnel Individuel, Vous devez Vous
              rendre sur la page d'inscription et renseigner Votre nom, Votre
              adresse de courrier électronique, Votre spécialité, le cas échéant
              Votre numéro RPPS, choisir un mot de passe, puis accepter les
              présentes CGU dans les conditions décrites à l'Article 6.4
              ci-après.
            </p>
            <p>
              Si Vous appartenez à un Établissement Client sous Contrat SaaS,
              Votre Compte Utilisateur pourra être créé directement par MEDACTIO
              selon les instructions transmises par l'Établissement Client et/ou
              ses Administrateurs. Dans un tel cas, Vous recevrez un lien de
              connexion vous permettant de finaliser Votre inscription sur la
              Plateforme et d'accepter les CGU.
            </p>
            <p>
              En cas d'incohérence entre les informations transmises et les
              éléments de vérification (base RPPS/ADELI), MEDACTIO se réserve la
              possibilité de solliciter auprès de Vous des informations
              complémentaires. Si Vous ne communiquez pas l'ensemble des
              informations demandées, ou si Vous communiquez des informations
              inexactes et/ou incomplètes, Votre inscription sur la Plateforme
              ne sera pas validée.
            </p>
            <h3>6.4. Acceptation et modification des CGU</h3>
            <p>
              Les présentes CGU ainsi que toutes versions ultérieures sont
              accessibles à tout moment par l'Utilisateur directement en
              cliquant sur le lien « CGU » figurant sur la Plateforme.
            </p>
            <p>
              Toute création d'un Compte Utilisateur et utilisation du Service
              MEDACTIO est conditionnée à la consultation et à l'acceptation
              préalable et sans réserve des CGU par l'Utilisateur. Si Vous
              n'acceptez pas les présentes CGU, Vous ne devez pas utiliser la
              Plateforme et le Service MEDACTIO.
            </p>
            <p>
              MEDACTIO se réserve le droit de modifier les présentes CGU à tout
              moment, ce dont elle informera en temps utile les Utilisateurs par
              tout moyen, notamment lors de leur identification et/ou connexion
              ultérieure à la Plateforme ou par email. En cas de modification,
              la nouvelle version des CGU se substituera à la précédente et sera
              applicable automatiquement aux Utilisateurs à compter de sa date
              de publication.
            </p>
            <p>
              Si l'Utilisateur ne souhaite pas accepter les CGU modifiées, il
              devra arrêter l'usage du Service MEDACTIO et se désinscrire de la
              Plateforme, sous réserve, pour le Professionnel Individuel abonné,
              des modalités de résiliation prévues à l'Article 14.1.
            </p>
          </section>
          <section className="legal-section" id="section-7">
            <h2>
              Article 7 — Utilisation de la Plateforme et du Service MEDACTIO
            </h2>
            <h3>7.1. Droits d'accès et d'utilisation</h3>
            <p>
              Sous réserve que Vous respectiez les présentes CGU et,
              lorsqu'applicable, les stipulations du Contrat SaaS, Nous Vous
              accordons un droit non exclusif, non cessible, non transférable (y
              compris par voie de sous-licence), d'accéder en mode SaaS et
              d'utiliser la Plateforme et le Service MEDACTIO dans les limites
              des droits attribués à Votre profil Utilisateur, pour la Durée
              indiquée à l'Article 5. Vous ne pouvez accéder et utiliser la
              Plateforme et le Service MEDACTIO que conformément à leur
              destination et uniquement pour Vos besoins professionnels, ou
              selon le cas applicable, pour les besoins professionnels de
              l'Établissement Client auquel Vous appartenez.
            </p>
            <h3>
              7.2. Restrictions d'utilisation de la Plateforme et du Service
              MEDACTIO
            </h3>
            <p>
              Sauf dans les cas où les lois ou règlements applicables le
              permettent ou dans les cas expressément autorisés par les CGU,
              Vous ne devez pas :
            </p>
            <ul>
              <li>
                utiliser la Plateforme et/ou le Service MEDACTIO à des fins
                autres que celles explicitement prévues par les présentes CGU,
                le Contrat SaaS ou de toute manière interdite par une loi ou une
                réglementation applicable ;
              </li>
              <li>
                utiliser un Document Généré comme unique fondement d'une
                décision clinique, sans relecture, vérification et validation
                par un jugement médical propre ;
              </li>
              <li>
                utiliser la Plateforme et/ou le Service MEDACTIO pour porter
                atteinte aux droits d'autrui, notamment au secret médical et à
                la vie privée des patients ;
              </li>
              <li>
                utiliser la Plateforme et/ou le Service MEDACTIO d'une façon qui
                pourrait porter atteinte à la Plateforme, au Service MEDACTIO ou
                perturber leur utilisation par un autre Client, Professionnel de
                santé ou Utilisateur ;
              </li>
              <li>
                copier, modifier, altérer, fusionner, adapter, intégrer,
                supprimer, dupliquer, créer des œuvres dérivées, republier,
                télécharger, transmettre et/ou distribuer tout ou partie de la
                Plateforme, du Service MEDACTIO et/ou de son contenu, sous
                quelque forme ou support que ce soit ;
              </li>
              <li>
                tenter de décompiler, désassembler, faire de l'ingénierie
                inverse, traduire et/ou réduire de toute autre manière tout ou
                partie de la Plateforme ;
              </li>
              <li>
                accorder une sous-licence, vendre, louer, transférer, afficher,
                divulguer, diffuser, distribuer, exploiter commercialement ou
                mettre, de quelque manière que ce soit, la Plateforme et/ou le
                Service MEDACTIO à la disposition d'un tiers sans l'accord
                préalable et écrit de MEDACTIO ;
              </li>
              <li>
                accéder à tout ou partie de la Plateforme et/ou du Service
                MEDACTIO afin de développer un produit ou un service en
                concurrence avec la Plateforme, le Service MEDACTIO ou tout
                service fourni par MEDACTIO ;
              </li>
              <li>
                accéder, stocker, distribuer ou transmettre tout virus, toute
                donnée ou tout matériel pendant Votre utilisation de la
                Plateforme et/ou du Service MEDACTIO qui soit illégal, illicite,
                nuisible, menaçant, diffamatoire, obscène, abusif, ou qui porte
                atteinte à des droits, ou qui ne soit pas conforme aux lois
                applicables ;
              </li>
              <li>
                supprimer ou modifier la marque, le logo ou tout autre signe
                distinctif de MEDACTIO contenus dans la Plateforme et/ou le
                Service MEDACTIO ;
              </li>
              <li>
                utiliser un système ou un logiciel automatisé, y compris des «
                robots », « spiders » ou « lecteurs hors ligne », pour accéder à
                la Plateforme d'une manière anormale ou en extraire des données
                (« screen scraping »).
              </li>
            </ul>
            <p>
              MEDACTIO se réserve le droit, à tout moment et sans préavis, à sa
              seule et absolue discrétion, sans qu'elle puisse être tenue d'une
              quelconque responsabilité à Votre égard, de désactiver et
              suspendre Votre accès à la Plateforme dans la mesure et pour la
              durée nécessaire, en cas de non-respect des présentes
              stipulations.
            </p>
          </section>
          <section className="legal-section" id="section-8">
            <h2>Article 8 — Obligations de l'Utilisateur</h2>
            <h3>
              8.1. Obligations générales et positionnement rédactionnel du
              Service
            </h3>
            <p>
              De manière générale, les Utilisateurs s'engagent à utiliser la
              Plateforme et le Service MEDACTIO :
            </p>
            <ul>
              <li>
                dans le respect des stipulations des présentes CGU et,
                lorsqu'applicable, du Contrat SaaS ;
              </li>
              <li>dans le respect des lois et réglementations en vigueur ;</li>
              <li>
                dans le respect des droits des tiers, notamment des droits de
                propriété intellectuelle et industrielle, des règles applicables
                en matière de santé publique et de déontologie médicale, et plus
                particulièrement du secret professionnel ;
              </li>
              <li>de manière loyale et conformément à leur destination.</li>
            </ul>
            <p>
              <strong>
                Obligation de relecture et de validation médicale.{" "}
              </strong>
              L'Utilisateur reconnaît que chaque Document Généré est un projet
              de document, produit à partir des seules informations qu'il a
              lui-même saisies ou validées. Il s'engage à relire, vérifier et
              valider systématiquement tout Document Généré avant tout usage
              clinique, administratif ou toute transmission à un tiers (patient,
              confrère, établissement, organisme). L'Utilisateur ne doit en
              aucun cas s'appuyer uniquement sur le contenu d'un Document Généré
              sans exercer son propre jugement clinique et professionnel.
            </p>
            <p>
              À ce titre, l'Utilisateur est informé que toute atteinte au droit
              à l'image, au respect de la vie privée ou au secret professionnel
              et médical peut faire l'objet de sanctions, y compris pénales.
            </p>
            <p>
              L'Utilisateur s'engage par ailleurs à mettre à disposition de
              MEDACTIO tous les justificatifs, documents et informations
              sollicités par MEDACTIO permettant notamment de confirmer son
              identité et, plus généralement, requis dans le cadre de la
              fourniture du Service MEDACTIO, et à mettre à jour l'ensemble de
              ces informations.
            </p>
            <h3>8.2. Confidentialité et gestion des Identifiants</h3>
            <p>
              Les Identifiants de l'Utilisateur sont strictement personnels et
              confidentiels. L'Utilisateur s'interdit de les communiquer à un
              tiers.
            </p>
            <p>
              Dans le cadre de la création de son compte personnel,
              l'Utilisateur garantit notamment : remplir les conditions de
              création de compte précisées ci-avant ; avoir toute capacité pour
              accepter les CGU ; fournir des informations exactes, complètes et
              à jour sur son identité et, le cas échéant, sur son droit
              d'exercice, conformes à la déontologie et aux règles définies par
              sa profession et/ou son ordre professionnel ; ne pas usurper
              l'identité d'une autre personne physique ou morale.
            </p>
            <p>
              L'Utilisateur s'oblige à conserver secrets ses Identifiants et à
              ne pas les divulguer, sous quelque forme que ce soit. La
              sauvegarde de la confidentialité du mot de passe choisi relève de
              l'entière responsabilité de l'Utilisateur, qui est tenu de se
              déconnecter de manière effective de la Plateforme à l'issue de
              chaque session, en particulier lorsqu'il y accède depuis un
              ordinateur public.
            </p>
            <p>
              L'Utilisateur est seul responsable de l'utilisation qui est faite
              de ses Identifiants et supporte toutes les conséquences qui
              découleraient d'une utilisation non conforme aux CGU. En cas de
              divulgation involontaire ou de présomption de vol de ses
              Identifiants, l'Utilisateur s'engage à modifier sans délai son mot
              de passe et à contacter MEDACTIO à l'adresse{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
            </p>
            <h3>8.3. Contenu Utilisateur et Documents Générés</h3>
            <p>
              Les Utilisateurs ont la possibilité de saisir, via la Plateforme,
              toute information pertinente pour la production d'un Document
              Généré (ci-après le « Contenu Utilisateur »).
            </p>
            <p>
              Toute communication d'information ou de fichier qui n'est pas en
              lien avec la production d'un Document Généré est strictement
              interdite. L'Utilisateur reconnaît que tout partage de Données de
              santé à d'autres Professionnels de santé doit se faire
              conformément aux dispositions de l'article L.1110-4 du Code de la
              santé publique. Lors de la saisie d'informations relatives au
              patient, l'Utilisateur est responsable (i) du respect des règles
              attachées au secret médical et (ii) du recueil des autorisations
              nécessaires au respect des lois et réglementations en vigueur,
              notamment de l'information du patient.
            </p>
            <p>
              <strong>Filtre de pseudonymisation. </strong>Préalablement à tout
              traitement et avant toute transmission au moteur d'intelligence
              artificielle, un filtre de pseudonymisation masque automatiquement
              l'identité directe du patient (nom, prénom et variantes, date de
              naissance, NIR/NIP/INS, numéro de dossier, coordonnées) ainsi que
              celle du médecin et de l'équipe soignante nommément désignés (nom,
              prénom, RPPS) figurant dans le Contenu Utilisateur. Le moteur
              d'intelligence artificielle ne reçoit ainsi que des données
              pseudonymisées, à partir desquelles le Document Généré est
              produit. L'Utilisateur peut saisir ces données d'identification :
              elles sont pseudonymisées automatiquement. Les autres informations
              médicales contenues dans le corps du Contenu Utilisateur (dates de
              prise en charge, traitements et posologies, termes médicaux,
              pathologies, diagnostics, noms de services ou d'établissements)
              demeurent en clair et relèvent de la responsabilité de
              l'Utilisateur quant à leur diffusion ultérieure. Ce filtre
              constitue une mesure de réduction du risque ; il ne dispense en
              aucun cas l'Utilisateur de relire et de vérifier le Document
              Généré avant toute transmission, conformément à l'Article 8.1.
            </p>
            <p>
              Le patient n'accède pas à la Plateforme ni au Service MEDACTIO. La
              communication éventuelle au patient d'informations et/ou de
              documents résultant du Document Généré relève de la responsabilité
              exclusive de l'Utilisateur. MEDACTIO n'est pas responsable de la
              qualité et/ou du contenu médical des Contenus Utilisateur et des
              Documents Générés qui en résultent : l'Utilisateur est seul
              responsable des informations et documents qu'il saisit, dépose,
              consulte et diffuse via la Plateforme.
            </p>
            <h3>8.4. Indemnisation</h3>
            <p>
              L'Utilisateur reconnaît et accepte qu'il est responsable (i) de
              l'utilisation qu'il fait de la Plateforme et du Service MEDACTIO,
              (ii) de l'utilisation de son Compte Utilisateur et de ses
              Identifiants, (iii) du Contenu Utilisateur et des Documents
              Générés, et (iv) de l'utilisation de ces éléments par un autre
              Utilisateur. L'Utilisateur garantit qu'il détient tous les droits
              et autorisations nécessaires à l'utilisation du Contenu
              Utilisateur.
            </p>
            <p>
              L'Utilisateur s'engage à indemniser MEDACTIO contre toute action
              en justice, toute procédure ou réclamation d'un tiers (y compris
              un autre Professionnel de santé, Utilisateur ou patient, ou une
              autorité compétente), dont MEDACTIO pourrait faire l'objet, en
              lien avec (i) l'utilisation de la Plateforme et/ou du Service
              MEDACTIO en violation des présentes CGU et/ou du Contrat SaaS, ou
              de manière illégale, immorale ou frauduleuse ; (ii) le Contenu
              Utilisateur ou tout Document Généré ; ou (iii) la violation de
              tout droit de tiers, en ce compris tout droit de propriété
              intellectuelle, droit à l'image, droit au respect de la vie privée
              et à la protection des Données à Caractère Personnel.
            </p>
          </section>
          <section className="legal-section" id="section-9">
            <h2>
              Article 9 — Obligations de MEDACTIO et disponibilité du Service
            </h2>
            <p>
              MEDACTIO s'engage à administrer la Plateforme et à faire ses
              meilleurs efforts pour assurer le bon fonctionnement du Service
              MEDACTIO. À ce titre, MEDACTIO n'assume qu'une obligation de
              moyens dans l'exécution de ses obligations.
            </p>
            <p>
              L'Utilisateur reconnaît et accepte que le Service MEDACTIO rendu
              disponible via la Plateforme peut être interrompu, en particulier
              pour des raisons de maintenance, de sécurité, ou pour cause de
              problèmes informatiques, d'interruption ou de dysfonctionnement du
              service Internet, de défaillance de tout matériel de réception ou
              des lignes de communication, ou d'autres circonstances imprévues.
            </p>
            <p>
              MEDACTIO pourra librement modifier l'infrastructure technique de
              sa Plateforme, supprimer et/ou ajouter des fonctionnalités et/ou
              des modules.
            </p>
            <p>
              Pour toute difficulté d'utilisation ou dysfonctionnement de la
              Plateforme, les Utilisateurs sont invités à contacter MEDACTIO à
              l'adresse électronique suivante :{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
            </p>
          </section>
          <section className="legal-section" id="section-10">
            <h2>Article 10 — Propriété intellectuelle</h2>
            <p>
              L'accès et/ou l'utilisation de la Plateforme et du Service
              MEDACTIO ne constitue en aucun cas la reconnaissance d'un droit
              quelconque et, plus généralement, ne confère à l'Utilisateur aucun
              droit de propriété intellectuelle sur la Plateforme, le Service
              MEDACTIO ou l'un quelconque des éléments qui les composent.
            </p>
            <p>
              À cet égard, Vous reconnaissez et acceptez que MEDACTIO, ses
              sociétés affiliées et/ou, le cas échéant, l'un de ses concédants,
              sont et demeurent les propriétaires exclusifs de tous les droits
              (y compris tous les droits de propriété intellectuelle) sur la
              Plateforme, le Service MEDACTIO, tous ses composants,
              fonctionnalités et modules (textes, graphiques, images, logos,
              noms, marques, désignations, sons, photographies, données, bases
              de données et logiciels) et la documentation y étant associée («
              Propriétés de MEDACTIO »).
            </p>
            <p>
              <strong>Propriété des Documents Générés. </strong>Par exception,
              l'Utilisateur demeure seul propriétaire des Contenus Utilisateur
              qu'il saisit, ainsi que des Documents Générés qui en résultent.
              MEDACTIO ne revendique aucun droit de propriété intellectuelle sur
              ces Documents Générés, sous réserve du droit d'utiliser certaines
              données à des fins statistiques, d'amélioration du Service et de
              conformité, dans les conditions prévues à l'Article 15.
            </p>
            <p>
              L'Utilisateur reconnaît que toute violation des stipulations du
              présent Article est constitutive de contrefaçon civilement et
              pénalement sanctionnable.
            </p>
          </section>
          <section className="legal-section" id="section-11">
            <h2>Article 11 — Logiciels et Services de tiers</h2>
            <p>
              La Plateforme et le Service MEDACTIO font appel à certains
              logiciels, produits ou services tiers, notamment pour
              l'hébergement, le développement, la maintenance et l'envoi de
              communications transactionnelles (ci-après les « Logiciels et
              Services de tiers »), dont la liste des principaux prestataires
              figure en Annexe 3 des présentes.
            </p>
            <p>
              MEDACTIO n'est pas responsable et n'offre aucune garantie,
              expresse ou implicite, pour les informations, le contenu ou
              d'autres produits ou services contenus dans les Logiciels et
              Services de tiers ou accessibles via ces derniers.
            </p>
          </section>
          <section className="legal-section" id="section-12">
            <h2>Article 12 — Garanties</h2>
            <p>
              LA PLATEFORME, LE SERVICE MEDACTIO AINSI QUE L'ENSEMBLE DES
              ÉLÉMENTS QUI LES COMPOSENT SONT FOURNIS « EN L'ÉTAT ». À CET
              ÉGARD, VOUS ACCEPTEZ QUE VOTRE UTILISATION DE LA PLATEFORME ET/OU
              DU SERVICE MEDACTIO SE FASSE ENTIÈREMENT À VOS RISQUES ET PÉRILS.
            </p>
            <p>
              MEDACTIO et ses sociétés affiliées excluent toute garantie ou
              représentation de quelque nature que ce soit, qu'elle soit
              expresse ou implicite, concernant la Plateforme, le Service
              MEDACTIO, l'ensemble des éléments qui les composent ainsi que tout
              contenu, média ou information contenus sur la Plateforme ou
              accessibles via celle-ci.
            </p>
            <p>
              MEDACTIO ne garantit pas que Votre accès à la Plateforme et/ou au
              Service MEDACTIO, ou à une partie de ceux-ci, sera ininterrompu ou
              exempt de défauts. MEDACTIO décline toute garantie implicite de
              qualité marchande, d'adéquation à un usage particulier, de titre
              ou d'absence de contrefaçon.
            </p>
            <p>
              Vous reconnaissez que le rôle de MEDACTIO se limite à celui d'un
              prestataire technique d'assistance rédactionnelle, et que ce
              dernier ne peut en aucune manière être tenu responsable du contenu
              médical des Documents Générés, ni du comportement des Utilisateurs
              sur la Plateforme. MEDACTIO décline toute responsabilité quant à
              l'utilisation des Documents Générés et/ou aux résultats ou
              décisions cliniques prises par l'Utilisateur ou par un tiers sur
              leur fondement.
            </p>
          </section>
          <section className="legal-section" id="section-13">
            <h2>Article 13 — Responsabilité</h2>
            <p>
              En aucun cas MEDACTIO ne pourra être tenue responsable des
              dommages directs ou indirects causés à l'Utilisateur, à un
              Professionnel de santé et/ou à tout tiers, en cas :
            </p>
            <ul>
              <li>
                de survenance d'un événement de force majeure tel que défini par
                la loi et les tribunaux français ayant un impact sur la
                Plateforme et/ou le Service MEDACTIO ;
              </li>
              <li>de problèmes liés au réseau internet ;</li>
              <li>
                de pannes ou dommages résultant des équipements de l'Utilisateur
                ou de la contamination de son système informatique par des
                virus, attaques ou malveillances de tiers ;
              </li>
              <li>
                d'indisponibilité ou de dysfonctionnement de la Plateforme et/ou
                du Service MEDACTIO quelle qu'en soit la raison ;
              </li>
              <li>
                d'utilisation de la Plateforme par l'Utilisateur non conforme
                aux présentes CGU et/ou au Contrat SaaS ;
              </li>
              <li>
                d'inexactitude, d'incomplétude ou d'absence de validation du
                Contenu Utilisateur préalablement à la génération d'un Document
                Généré ;
              </li>
              <li>
                d'utilisation d'un Document Généré sans la relecture et la
                validation médicale prévues à l'Article 8.1.
              </li>
            </ul>
            <p>
              MEDACTIO ainsi que ses sociétés affiliées ne sauraient en aucun
              cas être tenues responsables envers l'Utilisateur, le Client et/ou
              tout tiers pour tout dommage indirect ou immatériel de quelque
              nature que ce soit résultant de ou en lien avec la Plateforme, le
              Service MEDACTIO et/ou les informations qu'ils contiennent, tels
              que notamment tout manque à gagner, interruption d'activité, perte
              d'exploitation, de chiffre d'affaires, de bénéfice, de clientèle
              ou de patientèle, de contrats, de données et perte d'une chance,
              préjudice d'image et atteinte à la réputation.
            </p>
            <p>
              <strong>Plafond de responsabilité.</strong>En toute hypothèse, en
              cas de faute prouvée de MEDACTIO à l'égard de l'Utilisateur,
              l'entière responsabilité de MEDACTIO au titre des présentes CGU
              est limitée, tous dommages et pénalités confondus, à un montant
              total équivalent aux sommes effectivement versées par
              l'Utilisateur au titre de son abonnement au cours des douze (12)
              mois précédant le fait générateur du dommage (pour un
              Professionnel Individuel), ou au montant plafonné défini au sein
              du Contrat SaaS (pour un Établissement Client).
            </p>
          </section>
          <section className="legal-section" id="section-14">
            <h2>
              Article 14 — Abonnement, période d'essai de 7 jours et modalités
              de paiement
            </h2>
            <h3>14.1. Utilisation Individuelle par abonnement</h3>
            <p>
              L'accès au Service MEDACTIO au titre d'une Utilisation
              Individuelle est payant. Il n'existe pas d'offre gratuite : tout
              abonnement débute par une période d'essai de 7 jours à compter de
              l'inscription, à l'issue de laquelle l'Utilisateur est débité.
            </p>
            <p>
              Le moyen de paiement du Professionnel Individuel est enregistré
              dès l'inscription. Aucun débit n'intervient pendant la période
              d'essai de 7 jours. Sauf résiliation avant son terme, le premier
              prélèvement intervient automatiquement après le 7e jour, puis
              l'abonnement se renouvelle automatiquement selon une périodicité
              mensuelle, au tarif en vigueur affiché lors de l'inscription et
              rappelé avant tout prélèvement.
            </p>
            <p>
              À titre indicatif, l'offre « Praticien individuel » actuellement
              affichée sur la Plateforme est de{" "}
              <strong>32,00 € HT / mois</strong> (soit{" "}
              <strong>38,40 € TTC / mois</strong> TVA à 20 % incluse),{" "}
            </p>
            <p>
              L'Utilisateur peut résilier son abonnement à tout moment, sans
              engagement de durée et sans justification, depuis son espace
              praticien. La résiliation prend effet à l'issue de la période déjà
              facturée en cours ; elle empêche tout renouvellement ultérieur
              mais reste sans effet sur les sommes déjà dues au titre de la
              période en cours.
            </p>
            <p>
              En cas d'échec de paiement à l'échéance, MEDACTIO pourra suspendre
              l'accès de l'Utilisateur au Service MEDACTIO jusqu'à
              régularisation, sans préjudice des stipulations de l'Article 16.
            </p>
            <p>
              Les tarifs applicables sont ceux en vigueur au jour du
              renouvellement ; toute évolution tarifaire sera communiquée à
              l'Utilisateur avec un préavis raisonnable avant son application.
            </p>
            <h3>
              14.2. Utilisation dans le cadre d'un Établissement (Contrat SaaS)
            </h3>
            <p>
              Pour les Établissements Clients, les modalités de prix, de
              facturation, de périodicité de paiement et le périmètre des
              équipes médicales couvertes (tout ou partie des Professionnels de
              santé de l'Établissement) sont exclusivement définies au sein du
              Contrat SaaS conclu entre l'Établissement et MEDACTIO, qui prévaut
              sur les présentes en cas de conflit conformément à l'Article 4.
            </p>
            <p>
              Les Professionnels Établissement accédant à la Plateforme dans ce
              cadre ne sont pas facturés individuellement : la relation
              contractuelle et financière est portée par l'Établissement Client.
            </p>
          </section>
          <section className="legal-section" id="section-15">
            <h2>
              Article 15 — Données à caractère personnel et secret médical
            </h2>
            <h3>15.1. Description des différents traitements mis en œuvre</h3>
            <p>
              Dans le cadre de la fourniture du Service MEDACTIO, les Parties
              reconnaissent et acceptent que plusieurs types de traitements de
              Données à Caractère Personnel sont mis en œuvre, pour lesquels les
              rôles, obligations et responsabilités des Parties diffèrent :
            </p>
            <ul>
              <li>
                <strong>Utilisation Individuelle : </strong>le Professionnel
                Individuel agit en qualité de Responsable du Traitement
                s'agissant des Données à Caractère Personnel de ses patients
                qu'il saisit sur la Plateforme ; MEDACTIO agit en qualité de
                Sous-traitant. Les obligations respectives des Parties pour ce
                Traitement sont définies au sein du présent Article 15.
              </li>
              <li>
                <strong>Utilisation dans le cadre d'un Établissement : </strong>
                l'Établissement Client agit en qualité de Responsable du
                Traitement ; MEDACTIO agit en qualité de Sous-traitant. Les
                obligations respectives des Parties sont définies au sein d'un
                convention de traitement des données complétant le Contrat SaaS
                conclu entre l'Établissement et MEDACTIO.
              </li>
              <li>
                <strong>
                  Traitements relatifs à la fourniture de comptes utilisateurs
                  :{" "}
                </strong>
                MEDACTIO agit en qualité de Responsable du Traitement pour la
                gestion des comptes des Professionnels de santé eux-mêmes
                (données d'identification, de connexion et de facturation), les
                Utilisateurs étant alors des Personnes Concernées.
              </li>
            </ul>
            <p>
              Les stipulations des Articles 15.2 à 15.9 ci-après ont vocation à
              s'appliquer aux Traitements mis en œuvre dans le cadre d'une
              Utilisation Individuelle. Pour les besoins de ces Articles, le
              terme « Utilisateur Concerné » désigne le Professionnel
              Individuel.
            </p>
            <h3>15.2. Filtre de pseudonymisation</h3>
            <p>
              Conformément à l'Article 8.3, un filtre de pseudonymisation
              appliqué préalablement à tout traitement et avant toute
              transmission au moteur d'intelligence artificielle masque
              l'identité directe du patient et celle du Professionnel de santé
              et de l'équipe soignante nommément désignés, y compris lorsque ces
              données ont été saisies par l'Utilisateur. Les autres catégories
              de données médicales (dates, traitements et posologies, termes
              médicaux, pathologies, diagnostics, noms de services ou
              d'établissements) ne sont pas masquées et demeurent, le cas
              échéant, des Données de santé au sens du RGPD, traitées dans les
              conditions du présent Article 15.
            </p>
            <h3>
              15.3. Obligation de MEDACTIO vis-à-vis de l'Utilisateur Concerné
            </h3>
            <p>
              Dans le cadre de la fourniture de la Plateforme et du Service
              MEDACTIO à l'Utilisateur Concerné, MEDACTIO est susceptible de
              traiter des Données à Caractère Personnel appartenant à
              l'Utilisateur Concerné et à ses patients, en qualité de
              Sous-traitant, dans les conditions précisées en Annexe 1 des
              présentes.
            </p>
            <p>
              À ce titre, MEDACTIO s'engage à traiter les données qui lui sont
              confiées par l'Utilisateur Concerné dans le strict respect des
              présentes stipulations contractuelles et de la Réglementation
              Applicable en matière de Protection des Données, et à mettre en
              œuvre toutes les mesures techniques et organisationnelles adaptées
              afin de préserver la sécurité, la disponibilité, la
              confidentialité et l'intégrité de ces Données à Caractère
              Personnel, notamment contre la destruction accidentelle ou
              illicite, la perte accidentelle, l'altération, la diffusion ou
              l'accès non autorisé. Les mesures de sécurité mises en place sont
              listées en Annexe 2 des présentes.
            </p>
            <p>
              MEDACTIO s'engage notamment à : traiter les données uniquement
              pour la ou les finalités énoncées en Annexe 1 et conformément aux
              instructions de l'Utilisateur Concerné ; informer l'Utilisateur
              Concerné s'il est tenu de procéder à un transfert de données vers
              un pays tiers ; prendre toutes précautions utiles pour garantir la
              confidentialité des données traitées ; veiller à ce que les
              personnes autorisées à traiter les Données à Caractère Personnel
              s'engagent à respecter la confidentialité et reçoivent la
              formation nécessaire ; aider l'Utilisateur Concerné pour la
              réalisation d'analyses d'impact relatives à la protection des
              données.
            </p>
            <h3>15.4. Sous-traitance ultérieure</h3>
            <p>
              MEDACTIO peut faire appel à des Sous-traitants ultérieurs pour
              mener des activités de Traitement spécifiques. La liste des
              sous-traitants ultérieurs autorisés à ce jour figure en Annexe 3
              des présentes. Dans le cas où MEDACTIO souhaiterait apporter une
              modification à cette liste, elle en informe préalablement et par
              écrit l'Utilisateur Concerné, qui dispose d'un délai de trente
              (30) jours à compter de la réception de cette information pour
              présenter ses objections.
            </p>
            <p>
              Il appartient à MEDACTIO de s'assurer que le sous-traitant
              ultérieur présente les mêmes garanties quant à la mise en œuvre de
              mesures techniques et organisationnelles appropriées. Si le
              sous-traitant ultérieur ne remplit pas ses obligations en matière
              de protection des données, MEDACTIO demeure pleinement responsable
              devant l'Utilisateur Concerné.
            </p>
            <h3>15.5. Exercice des droits des personnes</h3>
            <p>
              Dans la mesure du possible, MEDACTIO aidera l'Utilisateur Concerné
              à s'acquitter de son obligation de donner suite aux demandes
              d'exercice des droits des Personnes Concernées (droit d'accès, de
              rectification, d'effacement et d'opposition, droit à la limitation
              du traitement, droit à la portabilité des données).
            </p>
            <p>
              Si des Personnes Concernées venaient à exercer auprès de MEDACTIO
              des demandes d'exercice de leurs droits, MEDACTIO adressera ces
              demandes, dans les meilleurs délais et au plus tard dans les huit
              (8) jours ouvrés, à l'Utilisateur Concerné, à l'adresse email
              renseignée lors de la création de son compte.
            </p>
            <h3>
              15.6. Notification des Violations de Données à Caractère Personnel
            </h3>
            <p>
              MEDACTIO notifie à l'Utilisateur Concerné toute Violation de
              Données à Caractère Personnel dans les meilleurs délais et en tout
              état de cause dans un délai de quarante-huit (48) heures après en
              avoir pris connaissance, par email à l'adresse renseignée lors de
              la création du compte. Cette notification est accompagnée de la
              description de la violation, des données concernées, de la cause
              et de toute documentation utile afin de permettre à l'Utilisateur
              Concerné, si nécessaire, de notifier cette violation à l'Autorité
              de Contrôle compétente.
            </p>
            <h3>15.7. Sort des données</h3>
            <p>
              MEDACTIO ne stockant aucune donnée de santé de patients,
              l'expiration de la relation contractuelle n'entraîne aucune
              restitution ni destruction de telles données. À cette date,
              MEDACTIO supprime ou restitue, selon la demande de l'Utilisateur
              Concerné, les données de son compte, sauf lorsqu'elle est tenue de
              les conserver en application de la Réglementation Applicable en
              matière de Protection des Données, ce dont elle s'engage à
              informer l'Utilisateur Concerné.
            </p>
            <h3>15.8. Obligations de l'Utilisateur vis-à-vis de MEDACTIO</h3>
            <p>
              L'Utilisateur Concerné s'engage à : fournir à MEDACTIO les données
              nécessaires à la fourniture des services prévus au sein des
              présentes CGU ; veiller, préalablement et pendant toute la durée
              de la relation contractuelle, au respect des obligations prévues
              par la Réglementation Applicable en matière de Protection des
              Données et par les dispositions du Code de la Santé Publique,
              notamment à l'information des patients concernés par le Traitement
              ; obtenir, lorsque cela s'avère nécessaire en raison des
              dispositions légales applicables, le consentement des Personnes
              Concernées au partage de leurs données avec d'autres
              Professionnels de santé.
            </p>
            <p>
              L'Utilisateur Concerné reconnaît et accepte qu'il est seul
              responsable de l'exactitude des Données à Caractère Personnel
              qu'il fournit à MEDACTIO ainsi que de la conformité et de la
              légalité du Traitement mis en œuvre via la Plateforme.
            </p>
            <h3>15.9. Coordonnées et points de contact</h3>
            <p>
              Pour toute question relative à la protection des Données à
              Caractère Personnel, l'Utilisateur peut contacter MEDACTIO à
              l'adresse suivante :{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.{" "}
            </p>
          </section>
          <section className="legal-section" id="section-16">
            <h2>
              Article 16 — Suspension et résiliation d'accès à la Plateforme
            </h2>
            <p>
              Sans préjudice des autres droits ou recours dont dispose MEDACTIO,
              MEDACTIO pourra, unilatéralement, de plein droit et sans préavis,
              suspendre, limiter ou résilier un Compte Utilisateur, de manière
              permanente ou temporaire : (i) en cas de violation des présentes
              CGU, du Contrat SaaS applicable, ou de toute loi ou réglementation
              applicable ; (ii) en cas d'utilisation de la Plateforme
              susceptible de porter atteinte aux droits de tiers ; (iii) en cas
              d'utilisation susceptible de porter atteinte au bon fonctionnement
              de la Plateforme et/ou du Service MEDACTIO ou à son utilisation
              par d'autres Utilisateurs ; (iv) si la loi ou toute réglementation
              applicable et/ou toute autorité compétente l'exige ; et (v) en cas
              de défaut de paiement non régularisé, s'agissant d'un
              Professionnel Individuel.
            </p>
            <p>
              En cas d'expiration ou de résiliation du Contrat SaaS
              correspondant entre l'Établissement Client et MEDACTIO,
              l'Utilisateur est informé que les Comptes Utilisateurs des
              Professionnels Établissement ne sont pas automatiquement
              désactivés, sauf demande écrite de l'Établissement Client. Dans un
              tel cas, le Compte Utilisateur reste personnel et unique au
              Professionnel de santé, qui pourra continuer à y accéder en tant
              que Professionnel Individuel, étant précisé qu'il n'aura toutefois
              plus accès aux données et Documents Générés liés à l'Établissement
              Client.
            </p>
          </section>
          <section className="legal-section" id="section-17">
            <h2>Article 17 — Suppression d'un Compte Utilisateur</h2>
            <p>
              L'Utilisateur peut supprimer son Compte Utilisateur à tout moment
              en envoyant un email à l'adresse suivante :{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>, ou
              via la Plateforme. Vous reconnaissez et acceptez que, dans un tel
              cas, Nous désactiverons Vos Identifiants et le Compte qui y est
              associé.
            </p>
            <p>
              Une fois le Compte Utilisateur supprimé, le Professionnel de santé
              n'a plus accès à la Plateforme. MEDACTIO ne stockant aucun Contenu
              Utilisateur ni Document Généré contenant des données de santé de
              patients, aucune restitution de ces éléments n'est possible : il
              appartient à l'Utilisateur de télécharger chaque Document Généré
              dès sa production.
            </p>
            <p>
              La Plateforme est un outil d'assistance rédactionnelle et n'a pas
              vocation à se substituer au dossier médical du patient. Il
              appartient à l'Utilisateur de télécharger chaque Document Généré
              dès sa production et de l'intégrer, une fois relu et validé, au
              dossier médical du patient concerné, dans les délais utiles au
              suivi de ce dernier.
            </p>
          </section>
          <section className="legal-section" id="section-18">
            <h2>Article 18 — Divers</h2>
            <h3>18.1. Renonciation</h3>
            <p>
              Le fait pour l'une des Parties de ne pas se prévaloir à un moment
              donné d'une stipulation quelconque des présentes ne peut être
              considéré comme valant renonciation au bénéfice de cette
              stipulation ou au droit de s'en prévaloir ultérieurement.
            </p>
            <h3>18.2. Nullité partielle</h3>
            <p>
              Dans l'hypothèse où une stipulation des présentes CGU serait
              nulle, illégale, inopposable ou inapplicable d'une manière
              quelconque, la validité, la légalité ou l'application des autres
              stipulations des présentes CGU n'en seraient aucunement affectées
              ou altérées, les autres stipulations demeurant en vigueur et
              conservant leur plein et entier effet.
            </p>
          </section>
          <section className="legal-section" id="section-19">
            <h2>Article 19 — Droit applicable et règlement des litiges</h2>
            <p>Les présentes CGU sont soumises au droit français.</p>
            <p>
              Tout différend entre les Parties concernant les questions
              relatives aux présentes CGU, leur validité, leur opposabilité,
              leur interprétation ou leur exécution, qui n'aura pu être réglé
              par une solution amiable, sera soumis à la compétence exclusive du
              Tribunal de commerce de Lille Métropole, étant entendu que chaque
              Partie pourra demander une injonction immédiate à tout tribunal
              compétent.
            </p>
          </section>
        </div>

        <div className="legal-updated">
          Dernière mise à jour : 30 septembre 2026
        </div>
      </main>

      <footer className="legal-footer">
        © 2026 Grays &amp; Co — MEDACTIO
      </footer>
    </div>
  );
}
