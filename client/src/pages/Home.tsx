import { useEffect, useRef } from "react";

export default function Home() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "REDACTIO — La rédaction hospitalière assistée par IA";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = "Rédaction hospitalière assistée par IA. Courrier de sortie, conciliation médicamenteuse, correspondance, observation médicale. Collez ou dictez vos notes : documents structurés, pseudonymisés, conformes. Pour les praticiens et les établissements.";

    const root = rootRef.current;
    if (!root) return;

    const year = root.querySelector("#yr");
    if (year) year.textContent = String(new Date().getFullYear());

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) root.classList.add("reduced");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    root.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

    const copy = {
      prat: {
        title: "Vos écrits hospitaliers, <em>structurés</em> par l'IA. La plume reste la vôtre.",
        lead: "Courrier de sortie, conciliation médicamenteuse, correspondance, observation : collez ou dictez vos notes, REDACTIO les met en forme — pseudonymisées, conformes, prêtes à relire et signer.",
        actions: '<a class="btn teal" href="#offres">Commencer une rédaction <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><a class="btn outline" href="#outils">Voir les outils</a>',
        trust: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Pseudonymisation automatique<span class="sep"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Vous validez chaque document',
      },
      etab: {
        title: "La rédaction hospitalière <em>assistée</em>, à l'échelle de vos services.",
        lead: "Des lettres de liaison complètes et homogènes, au bon format, le jour de la sortie. Un enjeu de qualité (QLS), de financement (IFAQ) et de certification — pour toutes vos équipes.",
        actions: '<a class="btn dark" href="#contact">Demander une démonstration <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><a class="btn outline" href="#etablissements">L\'offre établissement</a>',
        trust: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>Format décret 2016-995<span class="sep"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Déploiement par service',
      },
    } as const;

    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(".seg button"));
    const heroTitle = root.querySelector<HTMLElement>("#heroTitle");
    const heroLead = root.querySelector<HTMLElement>("#heroLead");
    const heroActions = root.querySelector<HTMLElement>("#heroActions");
    const heroTrust = root.querySelector<HTMLElement>("#heroTrust");
    const onTabClick = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const audience = button.dataset.aud === "etab" ? "etab" : "prat";
      tabs.forEach((tab) => tab.setAttribute("aria-selected", "false"));
      button.setAttribute("aria-selected", "true");
      heroTitle!.innerHTML = copy[audience].title;
      heroLead!.innerHTML = copy[audience].lead;
      heroActions!.innerHTML = copy[audience].actions;
      heroTrust!.innerHTML = copy[audience].trust;
    };
    tabs.forEach((button) => button.addEventListener("click", onTabClick));

    const menuButton = root.querySelector("#menuBtn");
    const onMenuClick = () => root.querySelector("#outils")?.scrollIntoView({ behavior: "smooth" });
    menuButton?.addEventListener("click", onMenuClick);

    const demoForm = root.querySelector<HTMLFormElement>("#demoRequestForm");
    const demoStatus = root.querySelector<HTMLElement>("#demoRequestStatus");
    const demoSubmit = demoForm?.querySelector<HTMLButtonElement>('button[type="submit"]');
    const onDemoSubmit = async (event: Event) => {
      event.preventDefault();
      if (!demoForm) return;
      const formData = new FormData(demoForm);
      const payload = {
        name: String(formData.get("name") ?? "").trim(),
        fonction: String(formData.get("fonction") ?? "").trim(),
        etablissement: String(formData.get("etablissement") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        praticiensConcernes: String(formData.get("praticiensConcernes") ?? "").trim(),
        besoin: String(formData.get("besoin") ?? "").trim(),
      };

      if (demoStatus) {
        demoStatus.textContent = "Envoi de la demande...";
        demoStatus.dataset.state = "pending";
      }
      if (demoSubmit) demoSubmit.disabled = true;

      try {
        const response = await fetch("/api/demo-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Demande non envoyée.");
        }
        demoForm.reset();
        if (demoStatus) {
          demoStatus.textContent = "Demande envoyée. Nous vous recontacterons rapidement.";
          demoStatus.dataset.state = "success";
        }
      } catch (error) {
        if (demoStatus) {
          demoStatus.textContent = error instanceof Error ? error.message : "Demande non envoyée.";
          demoStatus.dataset.state = "error";
        }
      } finally {
        if (demoSubmit) demoSubmit.disabled = false;
      }
    };
    demoForm?.addEventListener("submit", onDemoSubmit);

    return () => {
      observer.disconnect();
      tabs.forEach((button) => button.removeEventListener("click", onTabClick));
      menuButton?.removeEventListener("click", onMenuClick);
      demoForm?.removeEventListener("submit", onDemoSubmit);
    };
  }, []);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />;
}

const LANDING_HTML = String.raw`
<style>
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
:root{
  --ink:#0b1b29; --ink-soft:#5a6b78; --ink-faint:#8a99a4;
  --teal:#0e9c8e; --teal-deep:#0a7b70; --teal-light:#5fd6c4;
  --navy:#1e3a5f;
  --line:#e6edf0; --field:#f6f9f9; --mint:#eef6f4;
  --cream:#fdf6ef; --sand:#f5efe6;
  --bg:#f3f6f7;
  --radius:14px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:"Hanken Grotesk",system-ui,-apple-system,sans-serif;color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:"Spectral",Georgia,serif;font-weight:600;margin:0}
.wrap{max-width:1160px;margin:0 auto;padding:0 40px}
em{font-style:italic}
a{color:inherit}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:var(--teal-deep);margin-bottom:14px}
.eyebrow::before{content:"";width:22px;height:2px;background:var(--gold,#c58a17);display:inline-block}
.section{padding:90px 0}
.center{text-align:center}
.lede{color:var(--ink-soft);font-size:16px;line-height:1.6;max-width:560px}
.center .lede{margin-left:auto;margin-right:auto}

/* ---------- LOGO (commun header + footer) ---------- */
.brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}
.brand .mark{
  width:38px;height:38px;border-radius:11px;flex:none;
  display:block;object-fit:cover;
}
.brand .name{font-weight:800;font-size:16.5px;letter-spacing:.3px;line-height:1}
.brand .sub{font-size:8.5px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-faint);margin-top:3px;font-weight:700}

/* ---------- TOP COMPLIANCE BAR ---------- */
.compliance-bar{background:var(--ink);color:#dbe6ec;font-size:12.5px;padding:10px 0}
.compliance-bar .wrap{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.compliance-bar .lead{display:flex;align-items:center;gap:7px;font-weight:600;color:#fff}
.compliance-bar .lead svg{width:14px;height:14px;color:var(--teal-light)}
.compliance-bar .checks{display:flex;gap:16px;flex-wrap:wrap}
.compliance-bar .checks span::before{content:"✓";color:var(--teal-light);font-weight:700;margin-right:4px}

/* ---------- HEADER ---------- */
header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
header .wrap{display:flex;align-items:center;gap:34px;padding-top:15px;padding-bottom:15px}
nav.mainnav{display:flex;gap:28px;flex:1;justify-content:center}
nav.mainnav a{text-decoration:none;color:var(--ink-soft);font-weight:600;font-size:14px}
nav.mainnav a:hover{color:var(--ink)}
.head-actions{display:flex;align-items:center;gap:22px}
.head-actions .login{font-weight:700;font-size:14px;text-decoration:none;color:var(--ink)}
.menu-btn{display:none;background:none;border:0;cursor:pointer;color:var(--ink);padding:4px}
.btn{display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;font-family:inherit;font-weight:700;font-size:14.5px;border-radius:999px;padding:12px 22px;text-decoration:none;transition:.15s}
.btn.teal{background:var(--teal);color:#fff;box-shadow:0 10px 22px -10px rgba(14,156,142,.85)}
.btn.teal:hover{background:var(--teal-dark,var(--teal-deep))}
.btn.outline{background:#fff;color:var(--ink);border:1.5px solid var(--line)}
.btn.outline:hover{border-color:#d3dde2}
.btn.dark{background:var(--navy);color:#fff}
.btn.ghost-light{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.3)}
.btn:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:none}

/* ---------- HERO ---------- */
.hero{padding:64px 0 70px}
.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:60px;align-items:center}
.seg{display:inline-flex;background:var(--field);border:1px solid var(--line);border-radius:999px;padding:5px;gap:4px;margin-bottom:28px}
.seg button{border:0;background:transparent;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--ink-soft);padding:9px 16px;border-radius:999px;display:inline-flex;align-items:center;gap:7px}
.seg button svg{opacity:.75}
.seg button[aria-selected="true"]{background:#fff;color:var(--ink);box-shadow:0 4px 10px -4px rgba(11,27,41,.18)}
.seg button svg{width:15px;height:15px}
.hero h1{font-size:44px;line-height:1.15;letter-spacing:-.5px;max-width:14ch;margin-bottom:20px}
.hero h1 em{color:var(--teal-deep)}
.hero .claim{color:var(--ink-soft);font-size:16.5px;line-height:1.6;max-width:44ch;margin-bottom:30px}
.hero-ctas{display:flex;gap:14px;margin-bottom:26px;flex-wrap:wrap}
.hero-trust{display:flex;align-items:center;gap:8px;color:var(--ink-soft);font-size:13px;margin-bottom:18px;flex-wrap:wrap}
.hero-trust svg{width:15px;height:15px;color:var(--teal)}
.hero-trust .sep{width:1px;height:14px;background:var(--line);margin:0 4px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--teal-deep);background:var(--mint);border:1px solid rgba(14,156,142,.18);padding:6px 11px;border-radius:999px}
.chip svg{width:12px;height:12px}

/* ---------- HERO VISUAL CARD ---------- */
.demo-card{background:var(--ink);border-radius:18px;overflow:hidden;box-shadow:0 40px 70px -30px rgba(11,27,41,.5)}
.demo-topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
.demo-dots{display:flex;gap:6px}
.demo-dots span{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.18)}
.demo-dots span:last-child{background:var(--teal-light)}
.demo-title{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:1.5px;color:#9fb3bf;text-transform:uppercase}
.demo-tabs{display:flex;gap:6px}
.demo-tabs span{font-size:10.5px;color:#9fb3bf;background:rgba(255,255,255,.06);padding:5px 10px;border-radius:8px;display:flex;align-items:center;gap:5px}
.demo-tabs span.mic{color:var(--teal-light)}
.demo-body{display:grid;grid-template-columns:1fr 1fr}
.demo-col{padding:20px}
.demo-col.notes{background:#0e2033;border-right:1px solid rgba(255,255,255,.06)}
.demo-label{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7690a1;font-weight:700;margin-bottom:12px}
.demo-col.notes .demo-label{color:#7690a1}
.demo-notes-text{font-family:"JetBrains Mono",monospace;font-size:11.5px;line-height:1.75;color:#c7d6de}
.demo-notes-text b{color:#fff}
.demo-col.result{background:#0b1b29}
.demo-block{margin-bottom:14px}
.demo-block h4{font-size:9.5px;letter-spacing:1.4px;text-transform:uppercase;color:var(--teal-light);font-weight:700;margin:0 0 5px}
.demo-block p{font-size:12.5px;line-height:1.55;color:#dbe6ec;margin:0}
.demo-footer-note{font-size:10.5px;color:#8a9fab;display:flex;align-items:center;gap:6px;margin-top:16px}
.demo-footer-note svg{width:11px;height:11px}

/* ---------- FEATURE STRIP ---------- */
.strip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}
.strip .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.strip-item{display:flex;gap:13px;padding:26px 26px 26px 0;border-left:1px solid var(--line)}
.strip-item:first-child{border-left:0;padding-left:0}
.strip-item .ic{width:38px;height:38px;border-radius:10px;background:var(--mint);color:var(--teal-deep);display:flex;align-items:center;justify-content:center;flex:none}
.strip-item .ic svg{width:18px;height:18px}
.strip-item h4{font-family:"Hanken Grotesk",sans-serif;font-weight:800;font-size:14.5px;margin:0 0 4px}
.strip-item p{font-size:12.5px;color:var(--ink-soft);margin:0;line-height:1.4}

/* ---------- TOOLS GRID ---------- */
.tools-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px;margin-top:50px}
.tool-card{background:var(--field);border:1px solid var(--line);border-radius:var(--radius);padding:28px;display:flex;gap:16px}
.tool-card .ic{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none;color:#fff}
.tool-card .ic svg{width:22px;height:22px}
.tool-card h3{font-size:18px;margin:0 0 8px}
.tool-card p{font-size:13.6px;color:var(--ink-soft);line-height:1.55;margin:0}
.tool-card .tag{display:inline-block;margin-top:12px;font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--ink-faint);text-transform:uppercase}

/* ---------- 3-STEPS ---------- */
.steps-section{background:var(--field)}
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:50px}
.step-num{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:1.5px;color:var(--teal-deep);font-weight:700;margin-bottom:10px}
.step-col h3{font-size:19px;margin-bottom:10px}
.step-col p{font-size:13.8px;color:var(--ink-soft);line-height:1.55;margin-bottom:16px}
.step-col hr{border:0;border-top:2px solid var(--gold,#c58a17);width:36px;margin:0 0 18px;opacity:.55}
.step-tag{display:inline-flex;font-family:"JetBrains Mono",monospace;font-size:11px;background:#fff;border:1px solid var(--line);padding:6px 12px;border-radius:8px;color:var(--ink-soft)}

/* ---------- DICTEE ---------- */
.dictee-section{background:var(--cream)}
.dictee-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.dictee-grid h2{font-size:30px;max-width:14ch;margin-bottom:18px}
.dictee-grid p.lede{max-width:none;margin-bottom:20px}
.checklist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.checklist li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--ink)}
.checklist li svg{width:16px;height:16px;color:var(--teal-deep);flex:none;margin-top:2px}
.mic-card{background:var(--ink);border-radius:18px;padding:26px;color:#fff}
.mic-row{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.mic-btn{width:44px;height:44px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;flex:none}
.mic-btn svg{width:20px;height:20px;color:#fff}
.mic-wave{display:flex;gap:3px;align-items:center}
.mic-wave span{width:3px;background:var(--teal-light);border-radius:2px}
.mic-meta{margin-left:auto;text-align:right;font-size:11px;color:#9fb3bf}
.mic-meta b{display:block;color:#fff;font-family:"JetBrains Mono",monospace;font-size:12px}
.mic-flow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mic-flow span{font-size:11px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);padding:6px 11px;border-radius:8px;color:#dbe6ec}
.mic-flow svg{width:13px;height:13px;color:#7690a1}

/* ---------- DEUX USAGES ---------- */
.usages-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:50px}
.usage-card{border-radius:var(--radius);padding:32px;border:1px solid var(--line)}
.usage-card.a{background:var(--mint)}
.usage-card.b{background:var(--ink);color:#fff;border-color:var(--ink)}
.usage-card .tag{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;opacity:.65;margin-bottom:10px;display:block}
.usage-card h3{font-size:22px;margin-bottom:12px}
.usage-card p{font-size:14px;line-height:1.6;margin-bottom:22px}
.usage-card.a p{color:var(--ink-soft)}
.usage-card.b p{color:#c9d6dd}

/* ---------- PRATICIENS (3 cards) ---------- */
.praticiens-section{background:var(--bg)}
.cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:50px}
.card3{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:26px}
.card3 .ic{width:40px;height:40px;border-radius:10px;background:var(--mint);color:var(--teal-deep);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.card3 .ic svg{width:19px;height:19px}
.card3 h4{font-size:16px;margin:0 0 8px}
.card3 p{font-size:13.4px;color:var(--ink-soft);line-height:1.5;margin:0}

/* ---------- ETABLISSEMENTS (dark) ---------- */
.etab-section{background:var(--ink);color:#fff}
.etab-section .eyebrow{color:var(--teal-light)}
.etab-section h2{color:#fff;font-size:32px;max-width:16ch;margin-bottom:16px}
.etab-section .lede2{color:#c9d6dd;font-size:15.5px;line-height:1.6;max-width:56ch;margin-bottom:30px}
.decree-box{display:flex;gap:16px;background:rgba(255,255,255,.05);border:1px solid rgba(95,214,196,.35);border-left:3px solid var(--teal-light);border-radius:12px;padding:20px 22px;margin-bottom:36px}
.decree-box svg{width:18px;height:18px;color:var(--teal-light);flex:none;margin-top:2px}
.decree-box h4{font-size:14.5px;margin:0 0 6px;color:#fff}
.decree-box p{font-size:13px;color:#b9c8d1;line-height:1.55;margin:0}
.decree-box code{font-family:"JetBrains Mono",monospace;font-size:11px;color:#8fdccb}
.etab-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:36px}
.etab-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:22px}
.etab-card svg{width:19px;height:19px;color:var(--teal-light);margin-bottom:12px}
.etab-card h4{font-size:15px;margin:0 0 6px;color:#fff}
.etab-card p{font-size:13px;color:#b9c8d1;line-height:1.5;margin:0}
.tag-row{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:30px}
.tag-pill{font-size:12px;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:7px 14px;color:#dbe6ec}
.etab-ctas{display:flex;gap:14px;flex-wrap:wrap}

/* ---------- SECURITE (navy) ---------- */
.secu-section{background:var(--navy);color:#fff}
.secu-section .eyebrow{color:var(--teal-light)}
.secu-section h2{color:#fff;font-size:32px;max-width:16ch;margin-bottom:16px}
.secu-section .lede2{color:#c9d6dd;font-size:15.5px;line-height:1.6;max-width:56ch;margin-bottom:36px}
.secu-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:36px}
.secu-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:22px}
.secu-card svg{width:19px;height:19px;color:var(--teal-light);margin-bottom:12px}
.secu-card h4{font-size:15px;margin:0 0 6px;color:#fff}
.secu-card p{font-size:13px;color:#c9d6dd;line-height:1.5;margin:0}

/* ---------- OFFRES ---------- */
.offres-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:50px}
.offer-card{position:relative;background:#fff;border:1.5px solid var(--line);border-radius:18px;padding:32px}
.offer-card.reco{border-color:var(--navy)}
.reco-badge{position:absolute;top:-13px;right:28px;background:var(--navy);color:#fff;font-size:10.5px;font-weight:800;letter-spacing:1px;padding:6px 14px;border-radius:999px}
.offer-card .tag{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;color:var(--teal-deep);margin-bottom:8px;display:block}
.offer-card h3{font-size:22px;margin-bottom:10px}
.offer-card p.desc{font-size:13.8px;color:var(--ink-soft);line-height:1.5;margin-bottom:20px}
.offer-card .checklist{margin-bottom:26px}
.offer-card .checklist li{font-size:13.6px}
.offer-card .btn{width:100%;justify-content:center}

/* ---------- CONTACT FORM ---------- */
.contact-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:60px;align-items:flex-start;margin-top:40px}
.contact-grid h2{font-size:30px;max-width:12ch;margin-bottom:16px}
.form-card{background:var(--field);border:1px solid var(--line);border-radius:18px;padding:30px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-field label{display:block;font-size:12.5px;font-weight:700;margin-bottom:7px}
.form-field input, .form-field select, .form-field textarea{
  width:100%;font-family:inherit;font-size:14px;color:var(--ink);
  background:#fff;border:1.5px solid var(--line);border-radius:10px;padding:11px 13px;
}
.form-field textarea{resize:vertical;min-height:70px}
.form-note{font-size:11.5px;color:var(--ink-faint);text-align:center;margin-top:12px}
.form-note[data-state="pending"]{color:var(--navy)}
.form-note[data-state="success"]{color:var(--teal-deep);font-weight:600}
.form-note[data-state="error"]{color:#b42318;font-weight:600}

/* ---------- FINAL CTA ---------- */
.final-cta{background:var(--field);border-radius:24px;padding:60px 40px;text-align:center}
.final-cta h2{font-size:32px;max-width:20ch;margin:0 auto 14px}
.final-cta p{color:var(--ink-soft);font-size:15px;max-width:44ch;margin:0 auto 28px}
.final-cta .ctas{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}

/* ---------- FOOTER ---------- */
footer{background:var(--sand);padding:60px 0 0}
.footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:30px;padding-bottom:36px}
.footer-tagline{font-size:13.5px;color:var(--ink-soft);line-height:1.55;margin-top:14px;max-width:26ch}
.footer-col h5{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-faint);font-weight:700;margin:0 0 14px}
.footer-col a{display:block;font-size:13.6px;color:var(--ink);text-decoration:none;margin-bottom:11px;font-weight:600}
.footer-col a:hover{color:var(--teal-deep)}
.footer-bottom{border-top:1px solid var(--line);padding:20px 0;display:flex;gap:18px;flex-wrap:wrap;align-items:center;font-size:12.3px;color:var(--ink-soft)}
.footer-bottom svg{width:13px;height:13px;color:var(--teal-deep);vertical-align:-2px;margin-right:5px}
.footer-legal{display:flex;justify-content:space-between;padding:16px 0 30px;font-size:12px;color:var(--ink-faint);flex-wrap:wrap;gap:10px}
.reveal{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}
.reveal.in{opacity:1;transform:none}
.reduced .reveal{opacity:1;transform:none;transition:none}
:focus-visible{outline:2px solid var(--teal);outline-offset:3px;border-radius:4px}

@media(max-width:980px){
  .hero-grid,.dictee-grid,.tools-grid,.usages-grid,.offres-grid,.contact-grid,.footer-grid,.etab-grid{grid-template-columns:1fr}
  .steps-grid,.cards3,.secu-grid,.strip .wrap{grid-template-columns:1fr 1fr}
  nav.mainnav{display:none}
  .menu-btn{display:block}
}
@media(max-width:560px){
  .tools-grid,.cards3,.secu-grid,.steps-grid,.strip .wrap{grid-template-columns:1fr}
  .form-row{grid-template-columns:1fr}
  .wrap{padding:0 20px}
}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>

<!-- ================= BANDEAU CONFORMITÉ ================= -->
<div class="compliance-bar">
  <div class="wrap">
    <span class="lead">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Conforme aux exigences de protection des données de santé
    </span>
    <span class="checks"><span>RGPD</span><span>Hébergement HDS</span><span>Secret médical</span><span>Pseudonymisation</span></span>
  </div>
</div>

<!-- ================= HEADER ================= -->
<header>
  <div class="wrap">
    <a class="brand" href="#top" aria-label="REDACTIO accueil">
      <img class="mark" src="/logo-mark-navy.png" alt="" />
      <div><div class="name">REDACTIO</div><div class="sub">Rédaction hospitalière</div></div>
    </a>
    <nav class="mainnav">
      <a href="#outils">Les outils</a>
      <a href="#fonctionnement">Fonctionnement</a>
      <a href="#praticiens">Praticiens</a>
      <a href="#etablissements">Établissements</a>
      <a href="#securite">Sécurité</a>
    </nav>
    <div class="head-actions">
      <a class="login" href="/login">Connexion</a>
      <a class="btn teal" href="#offres">Commencer</a>
      <button class="menu-btn" id="menuBtn" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
    </div>
  </div>
</header>

<!-- ================= HERO ================= -->
<section class="hero" id="top">
  <div class="wrap hero-grid">
    <div>
      <div class="seg" role="tablist" aria-label="Choisir votre profil">
        <button role="tab" data-aud="prat" aria-selected="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>Je suis praticien</button>
        <button role="tab" data-aud="etab" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5"/></svg>Établissement</button>
      </div>
      <h1 id="heroTitle">Vos écrits hospitaliers, <em>structurés</em> par l'IA. La plume reste la vôtre.</h1>
      <p class="claim" id="heroLead">Courrier de sortie, conciliation médicamenteuse, correspondance, observation : collez ou dictez vos notes, REDACTIO les met en forme — pseudonymisées, conformes, prêtes à relire et signer.</p>
      <div class="hero-ctas" id="heroActions">
        <a class="btn teal" href="#offres">Commencer une rédaction <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        <a class="btn outline" href="#outils">Voir les outils</a>
      </div>
      <div class="hero-trust" id="heroTrust">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Pseudonymisation automatique
        <span class="sep"></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        Vous validez chaque document
      </div>
      <div class="chips">
        <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>RGPD</span>
        <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Hébergement HDS</span>
        <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/></svg>Secret médical</span>
        <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>Pseudonymisation</span>
      </div>
    </div>

    <div class="demo-card" aria-label="Démonstration : des notes brutes au document structuré">
      <div class="demo-topbar">
        <div class="demo-dots"><span></span><span></span><span></span></div>
        <div class="demo-title">Courrier-de-sortie</div>
        <div class="demo-tabs"><span>⌨ clavier</span><span class="mic">🎤 dictée</span></div>
      </div>
      <div class="demo-body">
        <div class="demo-col notes">
          <div class="demo-label">Vos notes · collées ou dictées</div>
          <div class="demo-notes-text"><b>H 72a</b>, hosp 12/03 dlr thoracique. <b>SCA NST+</b>. corona → <b>stent IVA</b>. sortie J4. ttt: aspirine 75, <b>ticagrelor</b> 90×2, atorva 80, bisop 2.5, ramipril 5. FEVG 48%. revoir cardio 1 mois + ETT. arrêt tabac.</div>
        </div>
        <div class="demo-col result">
          <div class="demo-label">Lettre de liaison structurée</div>
          <div class="demo-block"><h4>Motif</h4><p>Syndrome coronarien aigu sans sus-décalage de ST.</p></div>
          <div class="demo-block"><h4>Synthèse du séjour</h4><p>Coronarographie + angioplastie avec stent actif sur l'IVA. Suites simples.</p></div>
          <div class="demo-block"><h4>Traitement de sortie</h4><p>Aspirine 75 mg, ticagrelor 90 mg ×2, atorvastatine 80 mg, bisoprolol 2,5 mg, ramipril 5 mg.</p></div>
          <div class="demo-footer-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>À relire et valider par le praticien</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ================= FEATURE STRIP ================= -->
<section class="strip">
  <div class="wrap">
    <div class="strip-item"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div><div><h4>4 documents couverts</h4><p>Sortie · conciliation · courrier · observation</p></div></div>
    <div class="strip-item"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg></div><div><h4>Structuration par IA</h4><p>Des notes brutes au document propre</p></div></div>
    <div class="strip-item"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg></div><div><h4>Format lettre de liaison</h4><p>Aligné sur le décret 2016-995</p></div></div>
    <div class="strip-item"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div><div><h4>Conformité données de santé</h4><p>RGPD · HDS · pseudonymisation</p></div></div>
  </div>
</section>

<!-- ================= LES OUTILS ================= -->
<section class="section" id="outils">
  <div class="wrap center">
    <div class="eyebrow" style="justify-content:center">Les outils</div>
    <h2 style="font-size:32px">Toute votre rédaction hospitalière, assistée.</h2>
    <p class="lede">Quatre documents, une seule logique : collez ou dictez, REDACTIO structure, vous validez.</p>
  </div>
  <div class="wrap">
    <div class="tools-grid">
      <div class="tool-card reveal">
        <div class="ic" style="background:var(--teal)"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div>
        <div><h3>Courrier de sortie</h3><p>Lettre de liaison structurée (motif, synthèse, traitement de sortie, suivi), conforme au décret 2016-995.</p><span class="tag">Chirurgie · médecine polyvalente</span></div>
      </div>
      <div class="tool-card reveal">
        <div class="ic" style="background:var(--navy)"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v18M15 3v18M4 8h4M16 8h4M4 16h4M16 16h4"/></svg></div>
        <div><h3>Conciliation médicamenteuse</h3><p>Bilan de conciliation à l'admission, au transfert ou à la sortie — traitement d'entrée / sortie en 6 colonnes HAS.</p><span class="tag">Volet médicamenteux</span></div>
      </div>
      <div class="tool-card reveal">
        <div class="ic" style="background:#c58a17"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H7l-3 3z"/></svg></div>
        <div><h3>Correspondance médicale</h3><p>Courriers adressés à un confrère ou à un service — motif, éléments cliniques, conduite proposée.</p><span class="tag">Adressage · avis spécialisé</span></div>
      </div>
      <div class="tool-card reveal">
        <div class="ic" style="background:#6d5bd0"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M12 14a4 4 0 1 0-4-4M12 14a4 4 0 1 1 4-4"/></svg></div>
        <div><h3>Observation médicale</h3><p>Mise en forme d'une observation libre, dictée ou saisie, prête à être insérée au dossier.</p><span class="tag">Suivi quotidien</span></div>
      </div>
    </div>
  </div>
</section>

<!-- ================= FONCTIONNEMENT ================= -->
<section class="section steps-section" id="fonctionnement">
  <div class="wrap">
    <div class="eyebrow">Fonctionnement</div>
    <h2 style="font-size:32px;max-width:16ch">De vos notes au document signé, en trois temps.</h2>
    <p class="lede">Une séquence courte, pensée pour s'insérer dans le flux d'un service — pas pour le ralentir.</p>
    <div class="steps-grid">
      <div class="step-col reveal"><div class="step-num">TEMPS 01</div><h3>Vous saisissez</h3><hr><p>Collez vos notes ou dictez-les, en forme libre. Sans identifiant direct du patient.</p><span class="step-tag">clavier · dictée</span></div>
      <div class="step-col reveal"><div class="step-num">TEMPS 02</div><h3>REDACTIO structure</h3><hr><p>Le contenu est pseudonymisé puis mis en sections, dans le format du document choisi.</p><span class="step-tag">Motif · Synthèse · Traitement…</span></div>
      <div class="step-col reveal"><div class="step-num">TEMPS 03</div><h3>Vous relisez &amp; validez</h3><hr><p>Vous corrigez, complétez, signez. Le document final est le vôtre.</p><span class="step-tag">Exporter · Copier · Signer</span></div>
    </div>
  </div>
</section>

<!-- ================= DICTEE VOCALE ================= -->
<section class="section dictee-section" id="dictee">
  <div class="wrap dictee-grid">
    <div>
      <h2>La dictée vocale, dans les quatre outils.</h2>
      <p class="lede">Toute la rédaction fonctionne au clavier. Mais si vous préférez, énoncez simplement vos notes : REDACTIO les transcrit, les pseudonymise et les structure — dans les quatre outils.</p>
      <ul class="checklist">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Disponible sur les 4 documents</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Pseudonymisation conservée sur la voix</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Un brouillon, jamais une décision</li>
      </ul>
    </div>
    <div class="mic-card">
      <div class="mic-row">
        <div class="mic-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/></svg></div>
        <div class="mic-wave">
          <span style="height:10px"></span><span style="height:18px"></span><span style="height:9px"></span><span style="height:22px"></span><span style="height:13px"></span><span style="height:19px"></span><span style="height:8px"></span>
        </div>
        <div class="mic-meta"><b>06:14</b>à l'écoute · dictée vocale</div>
      </div>
      <div class="mic-flow">
        <span>voix</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        <span>pseudonymisation</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        <span>structuration</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        <span>validation</span>
      </div>
    </div>
  </div>
</section>

<!-- ================= DEUX USAGES ================= -->
<section class="section">
  <div class="wrap center">
    <div class="eyebrow" style="justify-content:center">Deux usages, une même plateforme</div>
    <h2 style="font-size:32px">Que vous écriviez seul ou pour tout un service.</h2>
  </div>
  <div class="wrap">
    <div class="usages-grid">
      <div class="usage-card a reveal">
        <span class="tag">Praticien · à titre individuel</span>
        <h3>Reprenez du temps clinique</h3>
        <p>Un compte personnel, prêt en deux minutes. Pour les praticiens hospitaliers, les internes et les PADHUE qui veulent maîtriser le format français.</p>
        <a class="btn teal" href="#offres">Offre praticien <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      </div>
      <div class="usage-card b reveal">
        <span class="tag">Hôpital · Clinique · GHT</span>
        <h3>Déployez à l'échelle d'un service</h3>
        <p>Des lettres de liaison conformes et homogènes pour toutes vos équipes — un enjeu de qualité, de financement IFAQ et de certification HAS.</p>
        <a class="btn ghost-light" href="#etablissements">Offre établissement <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      </div>
    </div>
  </div>
</section>

<!-- ================= POUR LES PRATICIENS ================= -->
<section class="section praticiens-section" id="praticiens">
  <div class="wrap">
    <div class="eyebrow">Pour les praticiens</div>
    <h2 style="font-size:32px;max-width:14ch">Moins de minutes sur le clavier, plus au lit du patient.</h2>
    <p class="lede">Un outil personnel, sans installation. Vous gardez la main sur chaque mot.</p>
    <div class="cards3">
      <div class="card3 reveal">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg></div>
        <h4>La fin de la page blanche</h4>
        <p>Un document propre à relire et compléter, plutôt qu'à bâtir de zéro en fin de garde.</p>
      </div>
      <div class="card3 reveal">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
        <h4>Le format français, maîtrisé</h4>
        <p>Pour les PADHUE et les internes : s'approprier la structure et les codes du document hospitalier attendu en France.</p>
      </div>
      <div class="card3 reveal">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
        <h4>Vos patients, jamais conservés</h4>
        <p>Pseudonymisation automatique, aucune donnée stockée, tout purgé à la déconnexion. Vous restez l'unique auteur.</p>
      </div>
    </div>
  </div>
</section>

<!-- ================= POUR LES ÉTABLISSEMENTS ================= -->
<section class="section etab-section" id="etablissements"><div class="wrap">
  <div class="eyebrow">Pour les établissements</div>
  <h2>La lettre de liaison conforme, à l'échelle de vos services.</h2>
  <p class="lede2">Un enjeu réglementaire, financier et de certification. REDACTIO aide vos équipes à produire des lettres complètes, dans le bon format, le jour de la sortie.</p>

  <div class="decree-box">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
    <div>
      <h4>Le cadre : décret n°2016-995 &amp; indicateur QLS</h4>
      <p>Depuis 2017, la lettre de liaison doit être remise au patient le jour de sa sortie et adressée au médecin traitant. Sa qualité est évaluée par l'indicateur QLS (IQSS), mobilisé dans l'IFAQ et la certification HAS — objectif de performance fixé à 80/100. <code>décret 2016-995 · QLS · IFAQ · certification</code></p>
    </div>
  </div>

  <div class="etab-grid">
    <div class="etab-card reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg><h4>Conformité de la lettre de liaison</h4><p>Les sections produites couvrent les critères QLS : motif, synthèse, traitements de sortie, suivi.</p></div>
    <div class="etab-card reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg><h4>Des écrits homogènes</h4><p>Même structure et même niveau de qualité d'un praticien à l'autre, d'un service à l'autre.</p></div>
    <div class="etab-card reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><circle cx="18" cy="9" r="2.4"/><path d="M17 20v-.6a3.8 3.8 0 0 1 3.5-3.8"/></svg><h4>Comptes équipes &amp; pilotage</h4><p>Déploiement par service, gestion des accès, interlocuteur dédié pour vos référents qualité et DSI.</p></div>
    <div class="etab-card reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><h4>Conformité contractuelle</h4><p>Cadre de traitement (convention/DPA), hébergement et réversibilité à définir avec votre DPO.</p></div>
  </div>

  <div class="tag-row">
    <span class="tag-pill">CHU · CH</span>
    <span class="tag-pill">Cliniques privées</span>
    <span class="tag-pill">GHT</span>
    <span class="tag-pill">SSR · SMR</span>
    <span class="tag-pill">HAD</span>
    <span class="tag-pill">EHPAD</span>
  </div>

  <div class="etab-ctas">
    <a class="btn teal" href="#contact">Demander une démonstration <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    <a class="btn ghost-light" href="#offres">Voir l'offre établissement</a>
  </div>
</div></section>

<!-- ================= CONFORMITÉ & SÉCURITÉ ================= -->
<section class="section secu-section" id="securite"><div class="wrap">
  <div class="eyebrow">Conformité &amp; sécurité des données de santé</div>
  <h2>Conforme aux exigences de protection des données de santé.</h2>
  <p class="lede2">Ce n'est pas une option : c'est le socle de REDACTIO. Du praticien isolé à la DSI d'un CHU, chaque garantie est intégrée au fonctionnement même de la plateforme.</p>
  <div class="secu-grid">
    <div class="secu-card reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><h4>RGPD</h4><p>Traitement conforme au Règlement Général sur la Protection des Données.</p></div>
    <div class="secu-card reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><h4>Hébergement HDS</h4><p>Hébergement agréé Données de Santé pour les traitements concernés.</p></div>
    <div class="secu-card reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/></svg><h4>Secret médical</h4><p>Respect du secret professionnel et de la confidentialité des soins.</p></div>
  </div>
  <a class="btn outline" href="/conformite.html" style="background:#fff">Consulter la page conformité &amp; sécurité <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
</div></section>

<!-- ================= OFFRES ================= -->
<section class="section" id="offres">
  <div class="wrap center">
    <div class="eyebrow" style="justify-content:center">Offres</div>
    <h2 style="font-size:32px">Une porte d'entrée pour chacun.</h2>
    <p class="lede">Commencez seul en quelques minutes, ou équipez tout un service.</p>
  </div>
  <div class="wrap">
    <div class="offres-grid">
      <div class="offer-card reveal">
        <span class="tag">Praticien</span>
        <h3>À titre individuel</h3>
        <p class="desc">Pour un médecin, un interne ou un candidat PADHUE qui rédige pour lui-même.</p>
        <ul class="checklist">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Les 4 outils, dictée comprise</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Compte personnel immédiat</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Confidentialité par conception</li>
        </ul>
        <a class="btn teal" href="https://redactio.evc-pae.fr/dashboard">Essayer gratuitement</a>
      </div>
      <div class="offer-card reco reveal">
        <span class="reco-badge">RECOMMANDÉ</span>
        <span class="tag">Établissement</span>
        <h3>Service · Hôpital · GHT</h3>
        <p class="desc">Pour équiper des équipes et fiabiliser vos lettres de liaison à l'échelle.</p>
        <ul class="checklist">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Comptes équipes &amp; déploiement par service</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Accompagnement &amp; interlocuteur dédié</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Convention de traitement (DPA) sur mesure</li>
        </ul>
        <a class="btn dark" href="#contact">Demander une démo &amp; un devis</a>
      </div>
    </div>
  </div>
</section>

<!-- ================= CONTACT ÉTABLISSEMENTS ================= -->
<section class="section" id="contact" style="background:var(--field)">
  <div class="wrap">
    <div class="eyebrow">Établissements</div>
    <div class="contact-grid">
      <div>
        <h2>Parlons de votre service.</h2>
        <p class="lede" style="margin-bottom:24px">Une démonstration de 30 minutes, adaptée à votre activité (MCO, SSR/SMR, psychiatrie…) et à vos enjeux QLS.</p>
        <ul class="checklist">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Cas d'usage sur vos propres types de courriers</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Réponse à vos questions sécurité &amp; conformité</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Proposition de pilote sur un service</li>
        </ul>
      </div>
      <form class="form-card" id="demoRequestForm">
        <div class="form-row">
          <div class="form-field"><label for="f-nom">Nom</label><input id="f-nom" name="name" type="text" placeholder="Dr Martin" required></div>
          <div class="form-field"><label for="f-fonction">Fonction</label><input id="f-fonction" name="fonction" type="text" placeholder="Chef de service, DIM, DSI…"></div>
        </div>
        <div class="form-field" style="margin-bottom:16px"><label for="f-etab">Établissement</label><input id="f-etab" name="etablissement" type="text" placeholder="CH / CHU / Clinique / GHT" required></div>
        <div class="form-row">
          <div class="form-field"><label for="f-mail">E-mail professionnel</label><input id="f-mail" name="email" type="email" placeholder="nom@etablissement.fr" required></div>
          <div class="form-field"><label for="f-taille">Praticiens concernés</label>
            <select id="f-taille" name="praticiensConcernes"><option>1 à 10</option><option>10 à 50</option><option>50 et +</option></select>
          </div>
        </div>
        <div class="form-field" style="margin-bottom:20px"><label for="f-msg">Votre besoin (facultatif)</label><textarea id="f-msg" name="besoin" rows="3" placeholder="Type de courriers, volumétrie, échéances…"></textarea></div>
        <button type="submit" class="btn dark" style="width:100%;justify-content:center">Demander une démonstration</button>
        <p class="form-note" id="demoRequestStatus" aria-live="polite">Formulaire sécurisé REDACTIO. Aucune donnée patient ici.</p>
      </form>
    </div>
  </div>
</section>

<!-- ================= CTA FINALE ================= -->
<section class="section">
  <div class="wrap">
    <div class="final-cta">
      <h2>Votre prochain document hospitalier, structuré en quelques instants.</h2>
      <p>Que vous écriviez pour vous ou pour tout un service — sans jamais conserver vos patients.</p>
      <div class="ctas">
        <a class="btn outline" href="https://redactio.evc-pae.fr/dashboard">Essayer gratuitement</a>
        <a class="btn teal" href="#contact">Demander une démo établissement</a>
      </div>
    </div>
  </div>
</section>

<!-- ================= FOOTER ================= -->
<footer><div class="wrap"><div class="footer-grid">
  <div>
    <a class="brand" href="#top">
      <img class="mark" src="/logo-mark-navy.png" alt="" />
      <div><div class="name">REDACTIO</div><div class="sub">Rédaction hospitalière</div></div>
    </a>
    <p class="footer-tagline">La rédaction hospitalière assistée par IA — sans jamais conserver vos patients.</p>
  </div>
  <div class="footer-col">
    <h5>Produit</h5>
    <a href="#outils">Les 4 outils</a>
    <a href="#fonctionnement">Fonctionnement</a>
    <a href="#dictee">Dictée IA</a>
  </div>
  <div class="footer-col">
    <h5>Établissements</h5>
    <a href="#etablissements">Pour les établissements</a>
    <a href="#offres">Offre établissement</a>
    <a href="#contact">Demander une démo</a>
  </div>
  <div class="footer-col">
    <h5>Plateforme</h5>
    <a href="/conformite.html">Conformité &amp; sécurité</a>
    <a href="https://redactio.evc-pae.fr/dashboard">Connexion</a>
    <a href="#">Mentions légales</a>
  </div>
</div>
<div class="footer-bottom">
  <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Conforme aux exigences de protection des données de santé</span>
  <span>RGPD</span><span>Hébergement HDS</span><span>Secret médical</span><span>Pseudonymisation</span><span>Aucune donnée conservée</span>
</div>
<div class="footer-legal">
  <span>© <span id="yr"></span> REDACTIO — Aide à la rédaction, jamais à la décision médicale.</span>
  <span>un service de l'écosystème evc-pae.fr</span>
</div>
</div></footer>
`;
