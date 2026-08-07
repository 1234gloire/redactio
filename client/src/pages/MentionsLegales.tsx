import { useEffect } from "react";

export default function MentionsLegales() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Mentions légales — MEDACTIO";

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
      "Consultez les mentions légales du site et de l'application MEDACTIO édités par Grays & Co.";

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

        <h1>Mentions légales</h1>

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
            <h2>Éditeur du site</h2>

            <p>
              Le site{" "}
              <a
                href="https://www.medactio.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.medactio.fr
              </a>{" "}
              ainsi que l&apos;application MEDACTIO qui lui est associée sont
              édités par la société <strong>Grays &amp; Co</strong> (ci-après
              « l&apos;Éditeur »).
            </p>

            <ul>
              <li>
                Forme juridique et capital social : société par actions
                simplifiée (SAS) au capital de <strong>1 000 €</strong>
              </li>

              <li>
                Immatriculation RCS :{" "}
                <span className="legal-tbd">
                  à préciser ultérieurement
                </span>
              </li>

              <li>
                Siège social :{" "}
                <span className="legal-tbd">
                  adresse à préciser ultérieurement
                </span>
              </li>

              <li>
                Adresse e-mail :{" "}
                <a href="mailto:contact@medactio.fr">
                  contact@medactio.fr
                </a>
              </li>

              <li>
                Numéro de TVA intracommunautaire :{" "}
                <span className="legal-tbd">
                  à préciser ultérieurement
                </span>
              </li>

              <li>Directeur de la publication : Monsieur Roland MAFOUTA</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Hébergement du site</h2>

            <p>
              Le site et l&apos;application MEDACTIO sont hébergés par la
              société <strong>OVH</strong>, société par actions simplifiée au
              capital de 50 000 000 €, immatriculée au Registre du Commerce et
              des Sociétés de Lille Métropole sous le numéro 424 761 419, dont
              le siège social est situé 2 rue Kellermann, 59100 Roubaix.
            </p>

            <ul>
              <li>Numéro de téléphone : 09 72 10 10 07</li>

              <li>N° de TVA intracommunautaire : FR 22 424 761 419</li>

              <li>
                Directeur de la publication : Monsieur Benjamin Revcolevschi
              </li>

              <li>
                Certification : hébergeur agréé pour l&apos;hébergement de
                données de santé à caractère personnel (HDS)
              </li>
            </ul>

            <p className="legal-muted">
              Conformément à l&apos;article L.1111-8 du Code de la santé
              publique, les données de santé à caractère personnel traitées
              dans le cadre de l&apos;utilisation de l&apos;application
              MEDACTIO sont hébergées auprès d&apos;OVH, hébergeur certifié
              HDS.
              {" "}
              MEDACTIO n&apos;a pas vocation à héberger de données de santé à
              caractère directement identifiant. L&apos;Utilisateur s&apos;interdit
              de saisir dans le Service tout identifiant direct du Patient
              (nom, prénom, date de naissance, numéro de sécurité sociale ou
              tout autre élément permettant une identification directe) et de
              déposer tout Document contenant de telles données non
              pseudonymisées. Dans l&apos;hypothèse où de telles données seraient
              néanmoins saisies ou déposées, elles font l&apos;objet,
              préalablement à tout traitement, d&apos;une pseudonymisation
              intégrale au moyen du filtre technique dédié de MEDACTIO, avant
              toute transmission au moteur d&apos;intelligence artificielle.
            </p>
          </section>

          <section className="legal-section">
            <h2>Propriété intellectuelle</h2>

            <p>
              L&apos;ensemble des éléments composant le site et
              l&apos;application MEDACTIO (textes, structure, logiciels, bases
              de données, graphismes, logos, marques, etc.) est la propriété
              exclusive de Grays &amp; Co ou de ses partenaires, et est protégé
              par le droit de la propriété intellectuelle. Toute reproduction,
              représentation, modification ou diffusion, totale ou partielle,
              sans autorisation préalable écrite de Grays &amp; Co, est
              interdite.
            </p>
          </section>

          <section className="legal-section">
            <h2>Données personnelles</h2>

            <p>
              Le traitement des données à caractère personnel effectué via le
              site ou l&apos;application MEDACTIO est décrit dans notre
              politique de confidentialité, disponible sur simple demande à
              l&apos;adresse{" "}
              <a href="mailto:contact@medactio.fr">
                contact@medactio.fr
              </a>
              .
            </p>

            <p>
              Conformément au Règlement Général sur la Protection des Données
              (RGPD) et à la loi « Informatique et Libertés », vous disposez
              d&apos;un droit d&apos;accès, de rectification,
              d&apos;effacement, de limitation, d&apos;opposition et de
              portabilité de vos données, que vous pouvez exercer en écrivant à
              l&apos;adresse ci-dessus.
            </p>
          </section>

          <section className="legal-section">
            <h2>Cookies</h2>

            <p>
              Le site est susceptible d&apos;utiliser des cookies nécessaires à
              son bon fonctionnement, ainsi que, le cas échéant, des cookies de
              mesure d&apos;audience. L&apos;utilisateur peut à tout moment
              configurer son navigateur pour refuser les cookies.
            </p>
          </section>

          <section className="legal-section">
            <h2>Droit applicable</h2>

            <p>
              Les présentes mentions légales sont soumises au droit français.
              Tout litige relatif à l&apos;utilisation du site ou de
              l&apos;application MEDACTIO relève de la compétence des tribunaux
              français.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>

            <p>
              Pour toute question relative aux présentes mentions légales, vous
              pouvez nous contacter à l&apos;adresse :{" "}
              <a href="mailto:contact@medactio.fr">
                contact@medactio.fr
              </a>
            </p>
          </section>
        </div>

        <div className="legal-updated">
          Dernière mise à jour : 5 août 2026
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
