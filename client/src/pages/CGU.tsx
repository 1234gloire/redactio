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
  "Abonnement, semaine gratuite et modalités de paiement",
  "Données à caractère personnel et secret médical",
  "Suspension et résiliation d'accès à la Plateforme",
  "Suppression d'un Compte Utilisateur et restitution des données",
  "Divers",
  "Droit applicable et règlement des litiges",
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
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
          <p
            role="note"
            style={{
              margin: "0 0 24px",
              color: "#a36200",
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            Document de travail — les clauses signalées en italique orangé sont
            à faire valider par un conseil juridique avant publication.
          </p>
          <nav className="legal-section" aria-label="Sommaire">
            <h2>Sommaire</h2>
            <ol>
              {sections.map((title, index) => (
                <li key={title}>
                  <a href={`#section-${index + 1}`}>
                    {index + 1}. {title}
                  </a>
                </li>
              ))}
              <li>
                <a href="#annexe-1">Annexe 1 — Traitement des données</a>
              </li>
              <li>
                <a href="#annexe-2">Annexe 2 — Mesures de sécurité</a>
              </li>
              <li>
                <a href="#annexe-3">Annexe 3 — Sous-traitants ultérieurs</a>
              </li>
            </ol>
          </nav>

          <Section id="section-1" title="1. Objet">
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (ci-après «{" "}
              <strong>CGU</strong> ») régissent les conditions d&apos;accès et
              d&apos;utilisation de la plateforme « MEDACTIO », accessible à
              l&apos;adresse{" "}
              <a href="https://www.medactio.fr">www.medactio.fr</a>, permettant
              aux Professionnels de santé de bénéficier d&apos;une assistance
              rédactionnelle par intelligence artificielle pour la production de
              documents médicaux courants (courriers de sortie, correspondances
              médicales, conciliations médicamenteuses, observations médicales,
              comptes rendus, etc.), à tout Professionnel de santé ayant créé un
              Compte Utilisateur dans les conditions définies ci-après (la «{" "}
              <strong>Plateforme</strong> »).
            </p>
            <p>
              La Plateforme est éditée par la société{" "}
              <strong>Grays &amp; Co</strong>, société par actions simplifiée
              (SAS) au capital social de 1 000 €, dont le siège social est situé
              229 rue Solférino, 59000 Lille, immatriculée au Registre du
              Commerce et des Sociétés de Lille Métropole sous le numéro 109 564
              427 (ci-après « Grays &amp; Co », « MEDACTIO » ou « Nous »).
            </p>
            <ul>
              <li>
                Adresse mail :{" "}
                <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>
              </li>
              <li>Numéro de TVA intracommunautaire : FR63109564427</li>
              <li>
                Directeur de la publication : M. Christel Roland MAFOUTA,
                Président de Grays &amp; Co
              </li>
            </ul>
            <p>
              Les données de santé à caractère personnel collectées et traitées
              dans le cadre de l&apos;utilisation de la Plateforme sont
              hébergées auprès d&apos;un hébergeur certifié pour
              l&apos;hébergement de données de santé, conformément à
              l&apos;article L.1111-8 du Code de la santé publique.
            </p>
            <p>
              Les données de santé sont hébergées par <strong>OVH</strong>,
              société par actions simplifiée au capital de 50 000 000 €,
              immatriculée au Registre du Commerce et des Sociétés de Lille
              Métropole sous le numéro 424 761 419, dont le siège social est sis
              2 rue Kellermann à Roubaix (59100), certifiée hébergeur de données
              de santé (HDS).
            </p>
            <p style={{ color: "#a36200", fontStyle: "italic" }}>
              L&apos;infogérance des serveurs est assurée par OVH (cette
              rubrique sera complétée dès la confirmation du prestataire retenu,
              le cas échéant certifié HDS sur son périmètre).
            </p>
          </Section>

          <Section id="section-2" title="2. Définitions">
            <p>
              <strong>« Administrateur » :</strong> employé ou membre de
              l&apos;équipe d&apos;un Établissement Client, autorisé par
              celui-ci et ayant conclu un Contrat SaaS avec MEDACTIO, habilité à
              créer et gérer les Comptes Utilisateurs et à réaliser certaines
              actions selon l&apos;abonnement souscrit.
            </p>
            <p>
              <strong>« Autorité de Contrôle » :</strong> a la signification qui
              lui est attribuée à l&apos;article 4 du Règlement européen
              2016/679 du 27 avril 2016 (« RGPD »).
            </p>
            <p>
              <strong>« Client » ou « Établissement » :</strong> établissement
              de santé, clinique ou structure médicale ayant conclu un Contrat
              SaaS avec MEDACTIO pour les besoins de tout ou partie de ses
              équipes médicales.
            </p>
            <p>
              <strong>« Compte Utilisateur » :</strong> compte permettant au
              Professionnel de santé d&apos;accéder à son espace privé et
              sécurisé sur la Plateforme, créé directement par
              l&apos;Utilisateur pour un usage individuel par abonnement ou
              selon les instructions de l&apos;Établissement Client ou de ses
              Administrateurs.
            </p>
            <p>
              <strong>« Contenu Utilisateur » :</strong> ensemble des
              informations, textes et éléments dictés ou saisis par
              l&apos;Utilisateur dans la Plateforme en vue de la génération
              d&apos;un Document Généré.
            </p>
            <p>
              <strong>« Contrat SaaS » :</strong> contrat conclu entre MEDACTIO
              et un Établissement Client déterminant les conditions de mise à
              disposition de la Plateforme aux Utilisateurs Habilités, le
              paramétrage du Service et les prestations de support associées.
            </p>
            <p>
              <strong>« Document Généré » :</strong> document médical produit
              par le Service MEDACTIO à partir du Contenu Utilisateur, notamment
              courrier de sortie, correspondance médicale, compte rendu,
              observation médicale ou tableau de conciliation médicamenteuse.
            </p>
            <p>
              <strong>« Données à Caractère Personnel » :</strong> a la
              signification attribuée à l&apos;article 4 du RGPD.
            </p>
            <p>
              <strong>« Données de santé » :</strong> a la signification
              attribuée à l&apos;article 4 du RGPD.
            </p>
            <p>
              <strong>« Identifiants » :</strong> adresse email identifiant
              l&apos;Utilisateur (« login ») et mot de passe associé (« password
              »), créés selon l&apos;Article 6.3.
            </p>
            <p>
              <strong>« Parties » :</strong> conjointement MEDACTIO et
              l&apos;Utilisateur.
            </p>
            <p>
              <strong>« Personnes Concernées » :</strong> a la signification
              attribuée à l&apos;article 4 du RGPD.
            </p>
            <p>
              <strong>« Plateforme » :</strong> a le sens donné à l&apos;Article
              1 « Objet ».
            </p>
            <p>
              <strong>« Professionnel de santé » :</strong> professionnel de
              santé au sens du Code de la santé publique, disposant d&apos;un
              numéro RPPS ou ADELI et pouvant accéder à la Plateforme sous
              réserve des conditions de l&apos;Article 6.1. Selon le cas, ce
              terme désigne le Professionnel Individuel et/ou le Professionnel
              Établissement.
            </p>
            <p>
              <strong>« Professionnel Individuel » :</strong> Professionnel de
              santé souscrivant et utilisant le Service à titre personnel, pour
              les besoins d&apos;un exercice individuel, par abonnement payant
              selon l&apos;Article 14.1.
            </p>
            <p>
              <strong>« Professionnel Établissement » :</strong> Professionnel
              de santé utilisant le Service pour son activité au sein d&apos;un
              Établissement Client ayant conclu un Contrat SaaS, selon
              l&apos;Article 14.2.
            </p>
            <p>
              <strong>
                « Réglementation Applicable en matière de Protection des Données
                » :
              </strong>{" "}
              RGPD, loi française n° 78-17 du 6 janvier 1978 dite « loi
              Informatique et Libertés », ainsi que toute loi nationale
              applicable transposant la directive 2002/58/CE dite « e-Privacy »,
              telle que mise à jour, modifiée ou remplacée.
            </p>
            <p>
              <strong>« Responsable du Traitement » :</strong> a la
              signification attribuée à l&apos;article 4 du RGPD.
            </p>
            <p>
              <strong>« Service MEDACTIO » :</strong> service d&apos;assistance
              rédactionnelle par intelligence artificielle fourni via la
              Plateforme et décrit à l&apos;Article 3.
            </p>
            <p>
              <strong>« Sous-traitant » :</strong> a la signification attribuée
              à l&apos;article 4 du RGPD.
            </p>
            <p>
              <strong>« Traitement » :</strong> a la signification attribuée à
              l&apos;article 4 du RGPD.
            </p>
            <p>
              <strong>« Utilisateur » ou « Vous » :</strong> toute personne
              bénéficiant d&apos;un Compte Utilisateur (Professionnel Individuel
              ou Professionnel Établissement) et/ou autorisée par un
              Établissement Client à accéder à la Plateforme, sous réserve du
              respect des CGU et, le cas échéant, du Contrat SaaS.
            </p>
            <p>
              <strong>« Utilisateur Habilité » :</strong> tout Utilisateur
              autorisé par un Établissement Client et/ou ses Administrateurs à
              accéder à la Plateforme et à utiliser le Service.
            </p>
            <p>
              <strong>« Violation de Données à Caractère Personnel » :</strong>{" "}
              a la signification attribuée à l&apos;article 4 du RGPD.
            </p>
          </Section>

          <Section id="section-3" title="3. Description du Service MEDACTIO">
            <p>
              MEDACTIO met à disposition des Professionnels de santé une
              solution d&apos;assistance rédactionnelle par intelligence
              artificielle leur permettant de produire plus rapidement des
              documents médicaux courants à partir des informations qu&apos;ils
              saisissent ou dictent eux-mêmes.
            </p>
            <p>
              <strong>
                Positionnement du Service — assistance strictement
                rédactionnelle.
              </strong>{" "}
              Le Service MEDACTIO est un outil d&apos;aide rédactionnelle. Il
              met en forme, reformule et structure les informations médicales
              fournies, saisies ou dictées et validées par le Professionnel de
              santé. Il ne constitue en aucun cas un outil d&apos;aide à la
              décision médicale : il ne recommande, ne calcule et
              n&apos;applique de façon autonome aucune valeur clinique
              (posologie, molécule, durée de traitement, délai, modalité de
              surveillance ou d&apos;immobilisation, etc.). Toute valeur
              clinique figurant dans un Document Généré est celle que le
              Professionnel de santé a lui-même saisie, dictée ou validée. Le
              Professionnel de santé demeure seul responsable du contenu médical
              de chaque Document Généré, de sa pertinence clinique et de sa
              conformité aux données acquises de la science, comme s&apos;il
              avait rédigé ce document sans assistance.
            </p>
            <p>
              Le Service permet notamment d&apos;utiliser les modules suivants,
              liste non exhaustive susceptible d&apos;évoluer :
            </p>
            <ul>
              <li>
                Courrier de sortie, dont les déclinaisons par spécialité (par
                exemple chirurgie orthopédique, court séjour gériatrique,
                médecine polyvalente) ;
              </li>
              <li>Correspondance médicale ;</li>
              <li>Conciliation médicamenteuse ;</li>
              <li>Observation médicale ;</li>
              <li>
                Extraction et mise en forme de comptes rendus d&apos;examens ;
              </li>
              <li>
                Dictée vocale assistée par intelligence artificielle, avec
                correction automatique des erreurs de reconnaissance vocale.
              </li>
            </ul>
            <p>
              Chaque Document Généré demeure un projet de document, destiné à
              être relu, complété et validé par le Professionnel de santé avant
              tout usage clinique, administratif ou transmission à un tiers,
              conformément à l&apos;Article 8.1.
            </p>
          </Section>

          <Section id="section-4" title="4. Documentation contractuelle">
            <p>
              Les présentes CGU régissent Votre accès et Votre utilisation de la
              Plateforme et du Service MEDACTIO.
            </p>
            <p>
              Tout bon de commande, accusé de réception ou autre formulaire
              commercial émis par l&apos;une ou l&apos;autre des Parties en
              relation avec la Plateforme est uniquement destiné à la commodité
              interne de la partie émettrice et ne modifiera, n&apos;amendera ni
              ne complétera les présentes CGU, même s&apos;il prétend le faire
              ou s&apos;il est contresigné ou reconnu par l&apos;autre Partie.
            </p>
            <p>
              Lorsqu&apos;applicable, en cas de conflit entre les présentes CGU
              et un Contrat SaaS conclu avec un Établissement Client, les
              stipulations du Contrat SaaS prévaudront dans la mesure du
              conflit.
            </p>
          </Section>

          <Section id="section-5" title="5. Durée">
            <p>
              Les présentes CGU s&apos;appliquent dès leur acceptation lorsque
              Vous Vous connectez à la Plateforme et restent en vigueur pendant
              toute la durée de Votre utilisation autorisée de la Plateforme et
              du Service, sous réserve des Articles 16 et 17 (la « Durée »).
            </p>
          </Section>

          <Section id="section-6" title="6. Accès à la Plateforme">
            <p>
              L&apos;accès à la Plateforme et son utilisation sont exclusivement
              réservés aux Utilisateurs disposant d&apos;un Compte Utilisateur
              conforme aux conditions ci-après.
            </p>
            <h3>6.1. Conditions préalables d&apos;accès</h3>
            <p>
              Vous ne pouvez Vous inscrire et bénéficier du Service en tant que
              Professionnel de santé qu&apos;à la condition d&apos;être inscrit
              au fichier RPPS ou ADELI. Cette validité est contrôlée lors de
              l&apos;inscription par comparaison avec les bases de données de
              référence mises à disposition par les autorités compétentes.
            </p>
            <p>
              La fourniture, l&apos;installation et la maintenance des
              équipements ainsi que les frais de communications électroniques
              (coûts téléphoniques et d&apos;accès à Internet) résultant de
              l&apos;utilisation relèvent de la seule responsabilité de
              l&apos;Utilisateur et sont à sa charge.
            </p>
            <h3>6.2. Modalités de mise à disposition</h3>
            <p>
              La Plateforme et le Service sont mis à disposition selon deux
              modalités, exclusives l&apos;une de l&apos;autre pour un même
              usage :
            </p>
            <ul>
              <li>
                <strong>Utilisation Individuelle par abonnement :</strong> le
                Professionnel de santé souscrit personnellement un abonnement
                payant selon l&apos;Article 14.1. Il n&apos;existe pas
                d&apos;offre totalement gratuite ; l&apos;abonnement inclut
                toutefois une semaine (7 jours) gratuite, à l&apos;issue de
                laquelle l&apos;abonnement payant démarre automatiquement sauf
                résiliation.
              </li>
              <li>
                <strong>
                  Utilisation dans le cadre d&apos;un Établissement (Contrat
                  SaaS) :
                </strong>{" "}
                lorsque le Service est mis à disposition d&apos;un établissement
                de santé, d&apos;une clinique ou d&apos;une structure médicale
                pour tout ou partie de ses équipes dans le cadre d&apos;un
                Contrat SaaS. L&apos;utilisation est régie par les présentes CGU
                et les stipulations complémentaires du Contrat SaaS, notamment
                sur le prix, la facturation et le périmètre des équipes. En
                accédant à la Plateforme à ce titre, Vous certifiez (i) être
                autorisé par l&apos;Établissement et désigné comme Utilisateur
                Habilité et (ii) avoir pris connaissance des éventuelles
                stipulations complémentaires du Contrat SaaS et Vous Vous
                engagez à les respecter.
              </li>
            </ul>
            <p>
              <strong>Activité mixte :</strong> si Vous exercez à la fois comme
              Professionnel Individuel et Professionnel Établissement, Vous
              pouvez utiliser la Plateforme au titre de chacune de ces
              activités, selon les modalités et tarifs respectifs.
            </p>
            <p>
              Si Vous changez de statut pendant la Durée des CGU, Vous pourrez
              conserver Votre Compte Utilisateur, qui est personnel, sous
              réserve de la mise à jour de son mode de facturation.
            </p>
            <h3>6.3. Création d&apos;un Compte Utilisateur</h3>
            <p>
              La création d&apos;un Compte Utilisateur est subordonnée à la
              transmission d&apos;un formulaire d&apos;inscription dûment
              complété.
            </p>
            <p>
              Pour un usage individuel, Vous devez renseigner Votre nom, adresse
              email, spécialité, le cas échéant Votre numéro RPPS, choisir un
              mot de passe, puis accepter les CGU selon l&apos;Article 6.4.
            </p>
            <p>
              Pour un Établissement Client sous Contrat SaaS, le Compte peut
              être créé par MEDACTIO selon les instructions de
              l&apos;Établissement ou de ses Administrateurs. Vous recevrez un
              lien de connexion permettant de finaliser l&apos;inscription et
              d&apos;accepter les CGU.
            </p>
            <p>
              En cas d&apos;incohérence avec les éléments de vérification (base
              RPPS/ADELI), MEDACTIO peut solliciter des informations
              complémentaires. Si Vous ne les communiquez pas ou transmettez des
              informations inexactes ou incomplètes, l&apos;inscription ne sera
              pas validée.
            </p>
            <h3>6.4. Acceptation et modification des CGU</h3>
            <p>
              Les CGU et leurs versions ultérieures sont accessibles à tout
              moment en cliquant sur le lien « CGU » de la Plateforme.
            </p>
            <p>
              La création d&apos;un Compte et l&apos;utilisation du Service sont
              conditionnées à la consultation et à l&apos;acceptation préalable
              et sans réserve des CGU. Si Vous ne les acceptez pas, Vous ne
              devez pas utiliser la Plateforme ni le Service.
            </p>
            <p>
              MEDACTIO peut modifier les CGU à tout moment et en informera les
              Utilisateurs en temps utile, notamment lors d&apos;une
              identification ou connexion ultérieure ou par email. La nouvelle
              version se substituera à la précédente et sera applicable à
              compter de sa publication.
            </p>
            <p>
              Si l&apos;Utilisateur n&apos;accepte pas les CGU modifiées, il
              devra cesser d&apos;utiliser le Service et se désinscrire, sous
              réserve, pour le Professionnel Individuel abonné, des modalités de
              résiliation de l&apos;Article 14.1.
            </p>
          </Section>

          <Section
            id="section-7"
            title="7. Utilisation de la Plateforme et du Service MEDACTIO"
          >
            <h3>7.1. Droits d&apos;accès et d&apos;utilisation</h3>
            <p>
              Sous réserve du respect des CGU et, le cas échéant, du Contrat
              SaaS, Nous Vous accordons pour la Durée un droit non exclusif, non
              cessible et non transférable (y compris par sous-licence)
              d&apos;accéder en mode SaaS à la Plateforme et d&apos;utiliser le
              Service dans les limites des droits attribués à Votre profil. Vous
              ne pouvez les utiliser que conformément à leur destination et pour
              Vos besoins professionnels ou ceux de l&apos;Établissement Client
              auquel Vous appartenez.
            </p>
            <h3>7.2. Restrictions d&apos;utilisation</h3>
            <p>
              Sauf disposition légale ou réglementaire contraire ou autorisation
              expresse des CGU, Vous ne devez pas :
            </p>
            <ul>
              <li>
                utiliser la Plateforme ou le Service à d&apos;autres fins que
                celles prévues par les CGU ou le Contrat SaaS, ou d&apos;une
                manière interdite par la loi ;
              </li>
              <li>
                utiliser un Document Généré comme seul fondement d&apos;une
                décision clinique, sans relecture, vérification et jugement
                médical propre ;
              </li>
              <li>
                porter atteinte aux droits d&apos;autrui, notamment au secret
                médical et à la vie privée des patients ;
              </li>
              <li>
                perturber la Plateforme, le Service ou leur utilisation par un
                autre Client, Professionnel de santé ou Utilisateur ;
              </li>
              <li>
                copier, modifier, altérer, fusionner, adapter, intégrer,
                supprimer, dupliquer, créer des œuvres dérivées, republier,
                télécharger, transmettre ou distribuer tout ou partie de la
                Plateforme, du Service ou de leur contenu ;
              </li>
              <li>
                décompiler, désassembler, faire de l&apos;ingénierie inverse,
                traduire ou réduire de toute autre manière tout ou partie de la
                Plateforme ;
              </li>
              <li>
                concéder une sous-licence, vendre, louer, transférer, afficher,
                divulguer, diffuser, distribuer, exploiter commercialement ou
                mettre la Plateforme ou le Service à la disposition d&apos;un
                tiers sans accord écrit préalable de MEDACTIO ;
              </li>
              <li>
                accéder à la Plateforme ou au Service afin de développer un
                produit ou service concurrent ;
              </li>
              <li>
                accéder, stocker, distribuer ou transmettre, pendant
                l&apos;utilisation, tout virus, donnée ou matériel illégal,
                illicite, nuisible, menaçant, diffamatoire, obscène, abusif,
                attentatoire aux droits d&apos;autrui ou contraire aux lois
                applicables ;
              </li>
              <li>
                supprimer ou modifier la marque, le logo ou tout autre signe
                distinctif de MEDACTIO ;
              </li>
              <li>
                utiliser un système ou logiciel automatisé (robots, spiders ou
                lecteurs hors ligne) pour accéder anormalement à la Plateforme
                ou en extraire des données (« screen scraping »).
              </li>
            </ul>
            <p>
              MEDACTIO se réserve le droit, à tout moment et sans préavis, de
              désactiver ou suspendre l&apos;accès à la Plateforme dans la
              mesure et pour la durée nécessaires en cas de non-respect de ces
              stipulations.
            </p>
          </Section>

          <Section id="section-8" title="8. Obligations de l'Utilisateur">
            <h3>8.1. Obligations générales et positionnement rédactionnel</h3>
            <p>
              Les Utilisateurs s&apos;engagent à utiliser la Plateforme et le
              Service dans le respect des CGU et, le cas échéant, du Contrat
              SaaS, des lois et règlements en vigueur, des droits des tiers
              (notamment propriété intellectuelle, santé publique, déontologie
              médicale et secret professionnel), de manière loyale et
              conformément à leur destination.
            </p>
            <p>
              <strong>
                Obligation de relecture et de validation médicale.
              </strong>{" "}
              Chaque Document Généré est un projet produit à partir des seules
              informations saisies, dictées ou validées par l&apos;Utilisateur.
              Celui-ci s&apos;engage à relire, vérifier et valider
              systématiquement tout Document Généré avant tout usage clinique,
              administratif ou transmission à un tiers (patient, confrère,
              établissement, organisme). Il ne doit jamais s&apos;appuyer
              uniquement sur son contenu sans exercer son propre jugement
              clinique et professionnel.
            </p>
            <p>
              Toute atteinte au droit à l&apos;image, au respect de la vie
              privée ou au secret professionnel et médical peut faire
              l&apos;objet de sanctions, y compris pénales.
            </p>
            <p>
              L&apos;Utilisateur s&apos;engage à fournir à MEDACTIO les
              justificatifs, documents et informations sollicités, notamment
              pour confirmer son identité, et à les tenir à jour.
            </p>
            <h3>8.2. Confidentialité et gestion des Identifiants</h3>
            <p>
              Les Identifiants sont strictement personnels et confidentiels.
              L&apos;Utilisateur s&apos;interdit de les communiquer à un tiers.
            </p>
            <p>
              Lors de la création de son compte personnel, l&apos;Utilisateur
              garantit remplir les conditions de création, avoir la capacité
              d&apos;accepter les CGU, fournir des informations exactes,
              complètes et à jour sur son identité et son droit d&apos;exercice
              conformément à sa déontologie et aux règles professionnelles, et
              ne pas usurper l&apos;identité d&apos;une personne physique ou
              morale.
            </p>
            <p>
              L&apos;Utilisateur conserve secrets ses Identifiants et ne les
              divulgue sous aucune forme. Il est responsable de la
              confidentialité de son mot de passe et doit se déconnecter à la
              fin de chaque session, en particulier depuis un ordinateur public.
            </p>
            <p>
              L&apos;Utilisateur est seul responsable de l&apos;utilisation de
              ses Identifiants et des conséquences d&apos;une utilisation non
              conforme. En cas de divulgation involontaire ou de présomption de
              vol, il s&apos;engage à modifier sans délai son mot de passe et à
              contacter{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
            </p>
            <h3>8.3. Contenu Utilisateur et Documents Générés</h3>
            <p>
              Les Utilisateurs peuvent saisir ou dicter via la Plateforme les
              informations pertinentes pour produire un Document Généré (le «
              Contenu Utilisateur »).
            </p>
            <p>
              La communication d&apos;informations ou fichiers sans lien avec la
              production d&apos;un Document Généré est strictement interdite.
              Tout partage de Données de santé entre Professionnels de santé
              doit respecter l&apos;article L.1110-4 du Code de la santé
              publique. Pour les données relatives aux patients,
              l&apos;Utilisateur est responsable du respect du secret médical et
              du recueil des autorisations nécessaires, notamment de
              l&apos;information du patient.
            </p>
            <p>
              <strong>Filtre de pseudonymisation.</strong> À la sortie du
              Service, un filtre masque automatiquement l&apos;identité directe
              du patient (nom, prénom et variantes, date de naissance,
              NIR/NIP/INS, numéro de dossier, coordonnées) ainsi que celle du
              médecin et de l&apos;équipe soignante nommément désignés (nom,
              prénom, RPPS) figurant dans le Document Généré. Les autres
              informations médicales du corps du document (dates de prise en
              charge, traitements et posologies, termes médicaux, pathologies,
              diagnostics, noms de services ou d&apos;établissements) demeurent
              en clair et relèvent de la responsabilité de l&apos;Utilisateur
              quant à leur diffusion ultérieure. Ce filtre réduit le risque mais
              ne dispense pas l&apos;Utilisateur de relire et vérifier le
              Document avant toute transmission, conformément à l&apos;Article
              8.1.
            </p>
            <p>
              Le patient n&apos;accède ni à la Plateforme ni au Service. La
              communication au patient d&apos;informations ou de documents issus
              du Document Généré relève de la responsabilité exclusive de
              l&apos;Utilisateur. MEDACTIO n&apos;est pas responsable de la
              qualité ou du contenu médical des Contenus Utilisateur et
              Documents Générés : l&apos;Utilisateur est seul responsable des
              informations et documents qu&apos;il saisit, dicte, dépose,
              consulte et diffuse via la Plateforme.
            </p>
            <h3>8.4. Indemnisation</h3>
            <p>
              L&apos;Utilisateur reconnaît être responsable (i) de son
              utilisation de la Plateforme et du Service, (ii) de
              l&apos;utilisation de son Compte et de ses Identifiants, (iii) du
              Contenu Utilisateur et des Documents Générés et (iv) de
              l&apos;utilisation de ces éléments par un autre Utilisateur. Il
              garantit détenir tous les droits et autorisations nécessaires sur
              le Contenu Utilisateur.
            </p>
            <p>
              L&apos;Utilisateur s&apos;engage à indemniser MEDACTIO contre
              toute action, procédure ou réclamation d&apos;un tiers (notamment
              Professionnel de santé, Utilisateur, patient ou autorité
              compétente) liée (i) à une utilisation de la Plateforme ou du
              Service en violation des CGU ou du Contrat SaaS, ou illégale,
              immorale ou frauduleuse ; (ii) au Contenu Utilisateur ou à un
              Document Généré ; ou (iii) à la violation de droits de tiers,
              notamment propriété intellectuelle, droit à l&apos;image, vie
              privée et protection des Données à Caractère Personnel.
            </p>
          </Section>

          <Section
            id="section-9"
            title="9. Obligations de MEDACTIO et disponibilité du Service"
          >
            <p>
              MEDACTIO s&apos;engage à administrer la Plateforme et à faire ses
              meilleurs efforts pour assurer le bon fonctionnement du Service.
              MEDACTIO n&apos;assume qu&apos;une obligation de moyens.
            </p>
            <p>
              Le Service peut être interrompu, notamment pour maintenance ou
              sécurité, en raison de problèmes informatiques,
              d&apos;interruption ou de dysfonctionnement du service Internet,
              de défaillance de matériel ou de lignes de communication, ou
              d&apos;autres circonstances imprévues.
            </p>
            <p>
              MEDACTIO peut modifier l&apos;infrastructure technique de la
              Plateforme, supprimer ou ajouter des fonctionnalités ou modules.
            </p>
            <p>
              Pour toute difficulté ou dysfonctionnement, les Utilisateurs
              peuvent contacter{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
            </p>
          </Section>

          <Section id="section-10" title="10. Propriété intellectuelle">
            <p>
              L&apos;accès ou l&apos;utilisation de la Plateforme et du Service
              ne reconnaît ni ne confère à l&apos;Utilisateur aucun droit de
              propriété intellectuelle sur la Plateforme, le Service ou leurs
              éléments.
            </p>
            <p>
              MEDACTIO, ses sociétés affiliées et, le cas échéant, ses
              concédants demeurent propriétaires exclusifs de tous les droits, y
              compris de propriété intellectuelle, sur la Plateforme, le
              Service, leurs composants, fonctionnalités, modules (textes,
              graphiques, images, logos, noms, marques, désignations, sons,
              photographies, données, bases de données et logiciels) et leur
              documentation (« Propriétés de MEDACTIO »).
            </p>
            <p>
              <strong>Propriété des Documents Générés.</strong> Par exception,
              l&apos;Utilisateur demeure seul propriétaire des Contenus
              Utilisateur qu&apos;il saisit ou dicte ainsi que des Documents
              Générés qui en résultent. MEDACTIO ne revendique aucun droit de
              propriété intellectuelle sur ces Documents, sous réserve de
              l&apos;utilisation de certaines données à des fins statistiques,
              d&apos;amélioration du Service et de conformité, selon
              l&apos;Article 15.
            </p>
            <p>
              Toute violation du présent Article est susceptible de constituer
              une contrefaçon civilement et pénalement sanctionnable.
            </p>
          </Section>

          <Section id="section-11" title="11. Logiciels et Services de tiers">
            <p>
              La Plateforme et le Service font appel à des logiciels, produits
              ou services tiers, notamment pour l&apos;hébergement, l&apos;envoi
              de communications transactionnelles et la transcription assistée
              de la dictée vocale (les « Logiciels et Services de tiers »). La
              liste des principaux prestataires figure en Annexe 3.
            </p>
            <p>
              MEDACTIO n&apos;est pas responsable et n&apos;offre aucune
              garantie, expresse ou implicite, pour les informations, contenus,
              produits ou services contenus dans les Logiciels et Services de
              tiers ou accessibles via ceux-ci.
            </p>
          </Section>

          <Section id="section-12" title="12. Garanties">
            <p>
              <strong>
                La Plateforme, le Service MEDACTIO et tous leurs éléments sont
                fournis « en l&apos;état ». Vous acceptez que leur utilisation
                se fasse entièrement à Vos risques et périls.
              </strong>
            </p>
            <p>
              MEDACTIO et ses sociétés affiliées excluent toute garantie ou
              représentation, expresse ou implicite, concernant la Plateforme,
              le Service, leurs éléments ou tout contenu, média ou information
              qu&apos;ils contiennent ou auxquels ils donnent accès.
            </p>
            <p>
              MEDACTIO ne garantit pas que l&apos;accès à la Plateforme ou au
              Service, ou à une partie de ceux-ci, sera ininterrompu ou exempt
              de défauts. MEDACTIO décline toute garantie implicite de qualité
              marchande, d&apos;adéquation à un usage particulier, de titre ou
              d&apos;absence de contrefaçon.
            </p>
            <p>
              Le rôle de MEDACTIO se limite à celui d&apos;un prestataire
              technique d&apos;assistance rédactionnelle. MEDACTIO ne peut être
              tenue responsable du contenu médical des Documents Générés, du
              comportement des Utilisateurs, de l&apos;utilisation des Documents
              Générés, ni des résultats ou décisions cliniques pris par
              l&apos;Utilisateur ou un tiers sur leur fondement.
            </p>
          </Section>

          <Section id="section-13" title="13. Responsabilité">
            <p>
              MEDACTIO ne pourra être tenue responsable des dommages directs ou
              indirects causés à l&apos;Utilisateur, à un Professionnel de santé
              ou à un tiers en cas :
            </p>
            <ul>
              <li>
                de force majeure au sens de la loi et des tribunaux français
                ayant un impact sur la Plateforme ou le Service ;
              </li>
              <li>de problèmes liés au réseau Internet ;</li>
              <li>
                de pannes ou dommages résultant des équipements de
                l&apos;Utilisateur ou de la contamination de son système par des
                virus, attaques ou actes malveillants de tiers ;
              </li>
              <li>
                d&apos;indisponibilité ou de dysfonctionnement de la Plateforme
                ou du Service, quelle qu&apos;en soit la raison ;
              </li>
              <li>
                d&apos;utilisation non conforme aux CGU ou au Contrat SaaS ;
              </li>
              <li>
                d&apos;inexactitude, d&apos;incomplétude ou d&apos;absence de
                validation du Contenu Utilisateur avant la génération d&apos;un
                Document ;
              </li>
              <li>
                d&apos;utilisation d&apos;un Document Généré sans la relecture
                et la validation médicale prévues à l&apos;Article 8.1.
              </li>
            </ul>
            <p>
              MEDACTIO et ses sociétés affiliées ne sauraient être tenues
              responsables envers l&apos;Utilisateur, le Client ou un tiers de
              dommages indirects ou immatériels liés à la Plateforme, au Service
              ou aux informations qu&apos;ils contiennent, tels que manque à
              gagner, interruption d&apos;activité, perte d&apos;exploitation,
              de chiffre d&apos;affaires, de bénéfice, de clientèle ou de
              patientèle, de contrats, de données, perte d&apos;une chance,
              préjudice d&apos;image ou atteinte à la réputation.
            </p>
            <p>
              <strong>Plafond de responsabilité.</strong> En toute hypothèse, en
              cas de faute prouvée de MEDACTIO envers l&apos;Utilisateur, la
              responsabilité totale de MEDACTIO au titre des CGU est limitée,
              tous dommages et pénalités confondus, aux sommes effectivement
              versées par l&apos;Utilisateur au titre de son abonnement au cours
              des douze (12) mois précédant le fait générateur (Professionnel
              Individuel), ou au plafond défini au Contrat SaaS (Établissement
              Client).
            </p>
          </Section>

          <Section
            id="section-14"
            title="14. Abonnement, semaine gratuite et modalités de paiement"
          >
            <h3>14.1. Utilisation Individuelle par abonnement</h3>
            <p>
              L&apos;accès au Service pour une Utilisation Individuelle est
              payant. Il n&apos;existe pas d&apos;offre totalement gratuite ;
              tout abonnement inclut une semaine (7 jours) gratuite à compter de
              l&apos;inscription.
            </p>
            <p>
              Le moyen de paiement du Professionnel Individuel est enregistré
              dès l&apos;inscription. Aucun débit n&apos;intervient pendant les
              7 premiers jours. Sauf résiliation avant la fin de cette période,
              le premier prélèvement intervient automatiquement à son issue,
              puis l&apos;abonnement se renouvelle automatiquement chaque mois
              au tarif en vigueur affiché lors de l&apos;inscription et rappelé
              avant tout prélèvement.
            </p>
            <p>
              À titre indicatif, l&apos;offre « Praticien individuel » affichée
              sur la Plateforme est de{" "}
              <strong>
                32,00 € HT / mois (38,40 € TTC / mois, TVA à 20 % incluse)
              </strong>
              .
            </p>
            <p>
              L&apos;Utilisateur peut résilier à tout moment, sans engagement ni
              justification, depuis son espace praticien. La résiliation prend
              effet à la fin de la période déjà facturée ; elle empêche tout
              renouvellement ultérieur mais ne modifie pas les sommes dues pour
              la période en cours.
            </p>
            <p>
              En cas d&apos;échec de paiement à l&apos;échéance, MEDACTIO peut
              suspendre l&apos;accès jusqu&apos;à régularisation, sans préjudice
              de l&apos;Article 16.
            </p>
            <p>
              Les tarifs applicables sont ceux en vigueur au jour du
              renouvellement. Toute évolution tarifaire sera communiquée avec un
              préavis raisonnable avant son application.
            </p>
            <h3>
              14.2. Utilisation dans le cadre d&apos;un Établissement (Contrat
              SaaS)
            </h3>
            <p>
              Pour les Établissements Clients, le prix, la facturation, la
              périodicité de paiement et le périmètre des équipes couvertes sont
              exclusivement définis par le Contrat SaaS, qui prévaut en cas de
              conflit conformément à l&apos;Article 4.
            </p>
            <p>
              Les Professionnels Établissement ne sont pas facturés
              individuellement : la relation contractuelle et financière est
              portée par l&apos;Établissement Client.
            </p>
          </Section>

          <Section
            id="section-15"
            title="15. Données à caractère personnel et secret médical"
          >
            <h3>15.1. Description des traitements</h3>
            <p>
              Dans le cadre du Service, plusieurs traitements de Données à
              Caractère Personnel sont mis en œuvre, pour lesquels les rôles et
              responsabilités des Parties diffèrent :
            </p>
            <ul>
              <li>
                <strong>Utilisation Individuelle :</strong> le Professionnel
                Individuel est Responsable du Traitement des données
                personnelles de ses patients saisies ou dictées sur la
                Plateforme ; MEDACTIO agit comme Sous-traitant. Les obligations
                respectives sont définies au présent Article 15.
              </li>
              <li>
                <strong>Utilisation dans un Établissement :</strong>{" "}
                l&apos;Établissement Client est Responsable du Traitement et
                MEDACTIO Sous-traitant. Les obligations sont définies dans un
                accord de traitement des données complétant le Contrat SaaS.
              </li>
              <li>
                <strong>Fourniture des comptes utilisateurs :</strong> MEDACTIO
                est Responsable du Traitement pour la gestion des comptes des
                Professionnels de santé (données d&apos;identification, de
                connexion et de facturation), les Utilisateurs étant alors les
                Personnes Concernées.
              </li>
            </ul>
            <p>
              Les Articles 15.2 à 15.9 s&apos;appliquent aux traitements
              réalisés dans le cadre d&apos;une Utilisation Individuelle. Pour
              ces Articles, « Utilisateur Concerné » désigne le Professionnel
              Individuel.
            </p>
            <h3>15.2. Filtre de pseudonymisation</h3>
            <p>
              Conformément à l&apos;Article 8.3, un filtre appliqué en sortie du
              Service masque l&apos;identité directe du patient ainsi que celle
              du Professionnel de santé et de l&apos;équipe soignante nommément
              désignés. Les autres catégories de données médicales (dates,
              traitements et posologies, termes médicaux, pathologies,
              diagnostics, noms de services ou d&apos;établissements) ne sont
              pas masquées et demeurent, le cas échéant, des Données de santé au
              sens du RGPD traitées selon le présent Article 15.
            </p>
            <h3>
              15.3. Obligations de MEDACTIO envers l&apos;Utilisateur Concerné
            </h3>
            <p>
              Pour fournir la Plateforme et le Service à l&apos;Utilisateur
              Concerné, MEDACTIO peut traiter des Données à Caractère Personnel
              de celui-ci et de ses patients en qualité de Sous-traitant, dans
              les conditions précisées à l&apos;Annexe 1.
            </p>
            <p>
              MEDACTIO s&apos;engage à traiter les données confiées dans le
              strict respect des CGU et de la Réglementation Applicable en
              matière de Protection des Données, et à mettre en œuvre les
              mesures techniques et organisationnelles adaptées pour préserver
              leur sécurité, disponibilité, confidentialité et intégrité,
              notamment contre la destruction accidentelle ou illicite, la
              perte, l&apos;altération, la diffusion ou l&apos;accès non
              autorisé. Les mesures sont listées en Annexe 2.
            </p>
            <p>
              MEDACTIO s&apos;engage notamment à traiter les données uniquement
              pour les finalités de l&apos;Annexe 1 et selon les instructions de
              l&apos;Utilisateur Concerné ; à l&apos;informer si un transfert
              vers un pays tiers est requis ; à prendre les précautions utiles
              pour garantir leur confidentialité ; à veiller à ce que les
              personnes autorisées s&apos;engagent à la confidentialité et
              reçoivent la formation nécessaire ; et à aider l&apos;Utilisateur
              Concerné dans la réalisation d&apos;analyses d&apos;impact
              relatives à la protection des données.
            </p>
            <h3>15.4. Sous-traitance ultérieure</h3>
            <p>
              MEDACTIO peut faire appel à des Sous-traitants ultérieurs pour des
              activités de Traitement spécifiques. La liste des sous-traitants
              autorisés figure à l&apos;Annexe 3. Toute modification de cette
              liste sera préalablement notifiée par écrit à l&apos;Utilisateur
              Concerné, qui dispose de trente (30) jours à compter de la
              réception de cette information pour présenter ses objections.
            </p>
            <p>
              MEDACTIO s&apos;assure que le sous-traitant ultérieur présente les
              mêmes garanties concernant les mesures techniques et
              organisationnelles appropriées. Si celui-ci ne remplit pas ses
              obligations de protection des données, MEDACTIO demeure pleinement
              responsable envers l&apos;Utilisateur Concerné.
            </p>
            <h3>15.5. Exercice des droits des personnes</h3>
            <p>
              Dans la mesure du possible, MEDACTIO aide l&apos;Utilisateur
              Concerné à répondre aux demandes d&apos;exercice des droits des
              Personnes Concernées (accès, rectification, effacement,
              opposition, limitation et portabilité).
            </p>
            <p>
              Si une Personne Concernée exerce ses droits auprès de MEDACTIO,
              celle-ci transmet la demande dans les meilleurs délais et au plus
              tard dans les huit (8) jours ouvrés à l&apos;Utilisateur Concerné,
              à l&apos;adresse email renseignée lors de la création du compte.
            </p>
            <h3>15.6. Notification des violations de données</h3>
            <p>
              MEDACTIO notifie à l&apos;Utilisateur Concerné toute Violation de
              Données à Caractère Personnel dans les meilleurs délais et au plus
              tard dans les quarante-huit (48) heures après en avoir pris
              connaissance, par email à l&apos;adresse renseignée lors de la
              création du compte. La notification décrit la violation, les
              données concernées, sa cause et toute documentation utile pour
              permettre, si nécessaire, une notification à l&apos;Autorité de
              Contrôle compétente.
            </p>
            <h3>15.7. Sort des données</h3>
            <p>
              À l&apos;expiration de la relation contractuelle, quelle
              qu&apos;en soit la cause, MEDACTIO devra, selon la demande de
              l&apos;Utilisateur Concerné, détruire les données et toutes leurs
              copies ou les restituer puis détruire les copies existantes, sauf
              obligation de conservation au titre de la Réglementation
              Applicable, dont MEDACTIO informera l&apos;Utilisateur Concerné.
            </p>
            <h3>15.8. Obligations de l&apos;Utilisateur envers MEDACTIO</h3>
            <p>
              L&apos;Utilisateur Concerné s&apos;engage à fournir les données
              nécessaires au Service ; à veiller, avant et pendant la relation
              contractuelle, au respect de la Réglementation Applicable et du
              Code de la santé publique, notamment à l&apos;information des
              patients ; et à obtenir, lorsque les dispositions légales
              l&apos;exigent, le consentement des Personnes Concernées au
              partage de leurs données avec d&apos;autres Professionnels de
              santé.
            </p>
            <p>
              L&apos;Utilisateur Concerné est seul responsable de
              l&apos;exactitude des données fournies à MEDACTIO ainsi que de la
              conformité et de la légalité du Traitement mis en œuvre via la
              Plateforme.
            </p>
            <h3>15.9. Coordonnées et points de contact</h3>
            <p>
              Pour toute question relative à la protection des Données à
              Caractère Personnel, l&apos;Utilisateur peut contacter MEDACTIO à{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
            </p>
          </Section>

          <Section
            id="section-16"
            title="16. Suspension et résiliation d'accès à la Plateforme"
          >
            <p>
              Sans préjudice de ses autres droits ou recours, MEDACTIO peut
              unilatéralement, de plein droit et sans préavis, suspendre,
              limiter ou résilier un Compte Utilisateur, temporairement ou
              définitivement : (i) en cas de violation des CGU, du Contrat SaaS,
              ou d&apos;une loi ou réglementation ; (ii) en cas
              d&apos;utilisation susceptible de porter atteinte aux droits de
              tiers ; (iii) en cas d&apos;utilisation susceptible de nuire au
              fonctionnement de la Plateforme ou du Service ou à leur
              utilisation par d&apos;autres Utilisateurs ; (iv) si la loi, la
              réglementation ou une autorité compétente l&apos;exige ; ou (v) en
              cas de défaut de paiement non régularisé d&apos;un Professionnel
              Individuel.
            </p>
            <p>
              À l&apos;expiration ou à la résiliation du Contrat SaaS entre
              l&apos;Établissement Client et MEDACTIO, les Comptes des
              Professionnels Établissement ne sont pas automatiquement
              désactivés, sauf demande écrite de l&apos;Établissement. Le Compte
              reste personnel et unique au Professionnel de santé, qui peut
              continuer à y accéder comme Professionnel Individuel, sans accès
              aux données et Documents Générés liés à l&apos;Établissement
              Client.
            </p>
          </Section>

          <Section
            id="section-17"
            title="17. Suppression d'un Compte Utilisateur et restitution des données"
          >
            <p>
              L&apos;Utilisateur peut supprimer son Compte à tout moment en
              écrivant à{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a> ou
              via la Plateforme. MEDACTIO désactivera alors les Identifiants et
              le Compte associé.
            </p>
            <p>
              Après suppression du Compte, le Professionnel de santé n&apos;aura
              plus accès aux Contenus Utilisateur ni aux Documents Générés
              stockés sur la Plateforme. Il peut en demander la restitution à
              MEDACTIO par email avant la suppression de son Compte.
            </p>
            <p>
              La Plateforme est un outil d&apos;assistance rédactionnelle et ne
              se substitue pas au dossier médical du patient. Il appartient à
              l&apos;Utilisateur de télécharger chaque Document Généré et de
              l&apos;intégrer au dossier médical du patient concerné, après
              relecture et validation, dans les délais utiles à son suivi.
            </p>
          </Section>

          <Section id="section-18" title="18. Divers">
            <h3>18.1. Renonciation</h3>
            <p>
              Le fait pour une Partie de ne pas se prévaloir à un moment donné
              d&apos;une stipulation des présentes ne vaut pas renonciation à
              cette stipulation ni au droit de s&apos;en prévaloir
              ultérieurement.
            </p>
            <h3>18.2. Nullité partielle</h3>
            <p>
              Si une stipulation des CGU est nulle, illégale, inopposable ou
              inapplicable, la validité, la légalité et l&apos;application des
              autres stipulations ne sont pas affectées ; celles-ci demeurent en
              vigueur et conservent leur plein effet.
            </p>
          </Section>

          <Section
            id="section-19"
            title="19. Droit applicable et règlement des litiges"
          >
            <p>Les présentes CGU sont soumises au droit français.</p>
            <p>
              Tout différend relatif aux CGU, à leur validité, opposabilité,
              interprétation ou exécution qui n&apos;aura pu être réglé
              amiablement sera soumis à la compétence exclusive du Tribunal de
              commerce de Lille Métropole, étant entendu que chaque Partie
              pourra demander une injonction immédiate à tout tribunal
              compétent.
            </p>
          </Section>

          <Section
            id="annexe-1"
            title="Annexe 1 — Détails sur le traitement des données à caractère personnel"
          >
            <p className="legal-tbd">
              Contenu de l&apos;annexe non fourni dans le document transmis — à
              compléter avant publication.
            </p>
          </Section>
          <Section
            id="annexe-2"
            title="Annexe 2 — Mesures de sécurité mises en œuvre"
          >
            <p className="legal-tbd">
              Contenu de l&apos;annexe non fourni dans le document transmis — à
              compléter avant publication.
            </p>
          </Section>
          <Section
            id="annexe-3"
            title="Annexe 3 — Liste des sous-traitants ultérieurs autorisés"
          >
            <p className="legal-tbd">
              Contenu de l&apos;annexe non fourni dans le document transmis — à
              compléter avant publication.
            </p>
          </Section>
        </div>

        <div className="legal-updated">
          Dernière mise à jour : 29 septembre 2026
        </div>
      </main>

      <footer className="legal-footer">
        © 2026 Grays &amp; Co — MEDACTIO
      </footer>
    </div>
  );
}
