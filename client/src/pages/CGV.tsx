import { useEffect } from "react";

export default function CGV() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Conditions générales de vente — MEDACTIO";

    let metaDescription =
      document.querySelector<HTMLMetaElement>('meta[name="description"]');

    const metaAlreadyExisted = Boolean(metaDescription);
    const previousDescription = metaDescription?.content ?? "";

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }

    metaDescription.content =
      "Consultez les conditions générales de vente du site et de l'application MEDACTIO éditée par Grays & Co.";

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });

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

        <h1>Conditions générales de vente</h1>

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
          <section className="legal-section">
            <h2>Article 1 — Objet et champ d&apos;application</h2>

            <p>
              Les présentes conditions générales de vente (ci-après « CGV »)
              régissent la souscription et l&apos;utilisation des offres
              payantes du service MEDACTIO (ci-après le « Service »), édité
              par la société <strong>Grays &amp; Co</strong> (ci-après
              « l&apos;Éditeur »), accessible à l&apos;adresse{" "}
              <a
                href="https://www.medactio.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.medactio.fr
              </a>
              .
            </p>

            <p>
              Elles s&apos;appliquent, sans restriction ni réserve, à toute
              souscription réalisée par un praticien à titre individuel ou
              par un établissement de santé (hôpital, clinique, GHT, SSR/SMR,
              HAD, EHPAD), ci-après désigné le « Client ». Toute souscription
              au Service implique l&apos;acceptation pleine et entière des
              présentes CGV.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 2 — Description du Service</h2>

            <p>
              MEDACTIO est un outil d&apos;aide à la rédaction hospitalière
              assisté par intelligence artificielle. Il permet, à partir de
              notes saisies au clavier ou dictées par l&apos;utilisateur, de
              générer des documents structurés (courrier de sortie,
              conciliation médicamenteuse, correspondance médicale,
              observation médicale).
            </p>

            <p className="legal-muted">
              MEDACTIO est un outil d&apos;aide à la rédaction. Il ne se
              substitue en aucun cas au jugement clinique du praticien, qui
              demeure seul responsable de la relecture, de la correction et
              de la validation de tout document avant signature, remise au
              patient ou intégration au dossier médical.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 3 — Offres et tarifs</h2>

            <p>
              Le Service est proposé selon deux types d&apos;offres :
            </p>

            <ul>
              <li>
                <strong>Offre Praticien</strong> : destinée à un usage
                individuel (médecin, interne, candidat PADHUE), donnant
                accès aux quatre outils de rédaction, dictée vocale comprise.
              </li>

              <li>
                <strong>Offre Établissement</strong> : destinée aux hôpitaux,
                cliniques et GHT, donnant accès à des comptes équipes, à un
                déploiement par service et à un accompagnement dédié. Cette
                offre fait l&apos;objet d&apos;un devis et, le cas échéant,
                d&apos;une convention de traitement (DPA) spécifique.
              </li>
            </ul>

            <p>
              Les tarifs applicables sont ceux affichés sur le site au
              moment de la souscription, ou ceux indiqués dans le devis
              accepté par le Client pour l&apos;offre Établissement. Ils sont
              exprimés en euros. L&apos;Éditeur se réserve le droit de
              modifier ses tarifs à tout moment, les nouveaux tarifs
              s&apos;appliquant aux souscriptions ou renouvellements
              postérieurs à leur publication.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 4 — Souscription et accès au Service</h2>

            <p>
              Pour l&apos;offre Praticien, la souscription s&apos;effectue en
              ligne, par la création d&apos;un compte personnel et le
              paiement du montant correspondant à l&apos;offre choisie.
              L&apos;accès au Service est activé dès validation du paiement.
            </p>

            <p>
              Pour l&apos;offre Établissement, la souscription intervient à
              l&apos;issue d&apos;une phase d&apos;échanges (démonstration,
              devis, le cas échéant convention de traitement des données),
              formalisée par un bon de commande ou un contrat signé des deux
              parties.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 5 — Modalités de paiement</h2>

            <p>
              Le paiement de l&apos;offre Praticien s&apos;effectue en ligne,
              par carte bancaire, via un prestataire de paiement sécurisé.
              L&apos;Éditeur ne conserve aucune donnée de carte bancaire.
            </p>

            <p>
              Le paiement de l&apos;offre Établissement s&apos;effectue selon
              les modalités convenues dans le devis ou le contrat (virement
              bancaire, périodicité de facturation).
            </p>

            <p>
              Toute somme non payée à échéance pourra donner lieu, après mise
              en demeure restée infructueuse, à la suspension de
              l&apos;accès au Service, sans préjudice de toute autre voie de
              droit.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 6 — Durée, renouvellement et résiliation</h2>

            <p>
              Les offres sont souscrites pour la durée indiquée lors de la
              souscription (mensuelle, annuelle, ou durée définie au
              contrat pour l&apos;offre Établissement). Sauf mention
              contraire, elles se renouvellent tacitement pour une durée
              identique, sauf résiliation par le Client avant l&apos;échéance,
              dans les conditions et délais indiqués sur le compte du Client
              ou dans le contrat.
            </p>

            <p>
              Le Client peut résilier son abonnement à tout moment depuis son
              espace personnel ou en écrivant à{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
              La résiliation prend effet à la fin de la période en cours,
              sans remboursement de la période déjà entamée, sauf disposition
              contraire prévue au contrat pour l&apos;offre Établissement.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 7 — Droit de rétractation</h2>

            <p>
              Conformément à l&apos;article L221-28 du Code de la
              consommation, le droit de rétractation ne s&apos;applique pas
              aux contrats de fourniture de services pleinement exécutés
              avant la fin du délai de rétractation, lorsque leur exécution
              a commencé après accord préalable exprès du consommateur.
              L&apos;accès immédiat au Service lors de la souscription vaut
              demande expresse d&apos;exécution immédiate et renonciation au
              droit de rétractation, dans les conditions prévues par la loi.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 8 — Obligations du Client</h2>

            <p>
              Le Client s&apos;engage à utiliser le Service conformément à
              sa destination et à ne saisir dans le Service aucun identifiant
              direct du patient (nom, prénom, date de naissance, numéro de
              sécurité sociale, ou tout autre élément permettant une
              identification directe), conformément aux conditions
              d&apos;utilisation du Service.
            </p>

            <p>
              Le Client demeure seul responsable de la relecture, de la
              validation et de l&apos;usage des documents générés par le
              Service, celui-ci constituant une aide à la rédaction et non
              une aide à la décision médicale.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 9 — Responsabilité</h2>

            <p>
              L&apos;Éditeur met en œuvre les moyens raisonnables pour
              assurer un accès continu et sécurisé au Service, sans garantie
              d&apos;absence totale d&apos;interruption. L&apos;Éditeur ne
              saurait être tenu responsable des dommages résultant d&apos;une
              utilisation non conforme du Service, d&apos;un document produit
              sans relecture ni validation par le praticien, ou de tout
              événement échappant à son contrôle raisonnable.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 10 — Propriété intellectuelle</h2>

            <p>
              L&apos;ensemble des éléments composant le Service (textes,
              structure, logiciels, bases de données, graphismes, logos,
              marques, etc.) demeure la propriété exclusive de Grays &amp; Co
              ou de ses partenaires. La souscription à une offre ne confère
              au Client aucun droit de propriété intellectuelle sur le
              Service, mais uniquement un droit d&apos;usage personnel, non
              exclusif et non cessible, pour la durée de son abonnement.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 11 — Données personnelles</h2>

            <p>
              Le traitement des données à caractère personnel effectué dans
              le cadre de la souscription et de l&apos;exécution du Service
              est décrit dans la politique de confidentialité de MEDACTIO,
              disponible sur simple demande à l&apos;adresse{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 12 — Réclamations et médiation</h2>

            <p>
              Toute réclamation relative aux présentes CGV peut être
              adressée à l&apos;Éditeur à l&apos;adresse{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>.
              Conformément aux dispositions du Code de la consommation
              relatives au règlement amiable des litiges, le Client
              consommateur peut recourir gratuitement au service de
              médiation de la consommation compétent, dans les conditions
              prévues par la loi.
            </p>
          </section>

          <section className="legal-section">
            <h2>Article 13 — Droit applicable et juridiction compétente</h2>

            <p>
              Les présentes CGV sont soumises au droit français. Tout litige
              relatif à leur validité, leur interprétation ou leur exécution
              relève de la compétence des tribunaux français, sous réserve
              des règles impératives applicables aux consommateurs.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>

            <p>
              Pour toute question relative aux présentes conditions générales
              de vente, vous pouvez nous contacter à l&apos;adresse :{" "}
              <a href="mailto:contact@medactio.fr">contact@medactio.fr</a>
            </p>
          </section>
        </div>

        <div className="legal-updated">
          Dernière mise à jour : 7 août 2026
        </div>
      </main>

      <footer className="legal-footer">
        © 2026 Grays &amp; Co — MEDACTIO
      </footer>
    </div>
  );
}

const LEGAL_STYLES = `
  .legal-page {
    --legal-navy: #101b34;
    --legal-navy-2: #16233f;
    --legal-accent: #3b5bdb;
    --legal-text: #1c2333;
    --legal-muted: #5b6478;
    --legal-line: #e6e9f0;
    --legal-bg: #f7f8fb;

    min-height: 100vh;
    margin: 0;
    background: var(--legal-bg);
    color: var(--legal-text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }

  .legal-page,
  .legal-page * {
    box-sizing: border-box;
  }

  .legal-header {
    background: linear-gradient(
      135deg,
      var(--legal-navy) 0%,
      var(--legal-navy-2) 100%
    );
    color: #ffffff;
    padding: 48px 24px 40px;
  }

  .legal-header-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 820px;
    margin: 0 auto;
  }

  .legal-logo-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.12);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .legal-brand {
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-decoration: none;
  }

  .legal-brand:hover {
    text-decoration: none;
    opacity: 0.9;
  }

  .legal-header h1 {
    max-width: 820px;
    margin: 24px auto 0;
    padding: 0;
    color: #ffffff;
    font-family: inherit;
    font-size: 30px;
    font-weight: 700;
    line-height: 1.25;
  }

  .legal-subtitle {
    max-width: 820px;
    margin: 8px auto 0;
    padding: 0;
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
  }

  .legal-subtitle a {
    color: inherit;
  }

  .legal-main {
    max-width: 820px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }

  .legal-card {
    padding: 32px 36px;
    border: 1px solid var(--legal-line);
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(16, 27, 52, 0.04);
  }

  .legal-section {
    margin-bottom: 32px;
  }

  .legal-section:last-child {
    margin-bottom: 0;
  }

  .legal-section h2 {
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--legal-line);
    color: var(--legal-navy);
    font-family: inherit;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
  }

  .legal-section p {
    margin: 0 0 10px;
    color: var(--legal-text);
    font-size: 15px;
  }

  .legal-section p:last-child {
    margin-bottom: 0;
  }

  .legal-section .legal-muted {
    color: var(--legal-muted);
  }

  .legal-section ul {
    margin: 8px 0 0;
    padding-left: 20px;
  }

  .legal-section li {
    margin-bottom: 6px;
    color: var(--legal-text);
    font-size: 15px;
  }

  .legal-section li:last-child {
    margin-bottom: 0;
  }

  .legal-page a {
    color: var(--legal-accent);
    text-decoration: none;
  }

  .legal-page a:hover {
    text-decoration: underline;
  }

  .legal-tbd {
    display: inline-block;
    padding: 1px 8px;
    border: 1px solid #f2d9a6;
    border-radius: 6px;
    background: #fff4e0;
    color: #8a5a00;
    font-size: 13px;
    font-weight: 600;
  }

  .legal-updated {
    margin-top: 40px;
    color: var(--legal-muted);
    font-size: 13px;
    text-align: center;
  }

  .legal-footer {
    padding: 24px;
    color: var(--legal-muted);
    font-size: 13px;
    text-align: center;
  }

  @media (max-width: 640px) {
    .legal-header {
      padding: 36px 20px 32px;
    }

    .legal-header h1 {
      margin-top: 20px;
      font-size: 27px;
    }

    .legal-main {
      padding: 28px 16px 60px;
    }

    .legal-card {
      padding: 24px 20px;
      border-radius: 12px;
    }

    .legal-section {
      margin-bottom: 28px;
    }
  }

  @media (max-width: 380px) {
    .legal-header-inner {
      gap: 12px;
    }

    .legal-logo-mark {
      width: 40px;
      height: 40px;
      flex-basis: 40px;
    }

    .legal-brand {
      font-size: 18px;
    }

    .legal-header h1 {
      font-size: 25px;
    }

    .legal-card {
      padding: 22px 16px;
    }
  }

  @media print {
    .legal-page {
      background: #ffffff;
    }

    .legal-header {
      padding: 24px;
      background: #ffffff;
      color: var(--legal-text);
      border-bottom: 1px solid var(--legal-line);
    }

    .legal-brand,
    .legal-header h1,
    .legal-subtitle,
    .legal-subtitle a {
      color: var(--legal-text);
    }

    .legal-logo-mark {
      border-color: var(--legal-line);
      background: var(--legal-bg);
      color: var(--legal-navy);
    }

    .legal-main {
      max-width: none;
      padding: 24px 0;
    }

    .legal-card {
      border: 0;
      box-shadow: none;
    }

    .legal-footer {
      padding-bottom: 0;
    }
  }
`;