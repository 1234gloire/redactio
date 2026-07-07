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
        actions: '<a class="btn btn-primary" href="#offres">Commencer une rédaction <svg class="arr" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a><a class="btn btn-ghost" href="#produits">Voir les outils</a>',
        trust: '<span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg> Pseudonymisation automatique</span><span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Vous validez chaque document</span>',
      },
      etab: {
        title: "La rédaction hospitalière <em>assistée</em>, à l'échelle de vos services.",
        lead: "Des lettres de liaison complètes et homogènes, au bon format, le jour de la sortie. Un enjeu de qualité (QLS), de financement (IFAQ) et de certification — pour toutes vos équipes.",
        actions: '<a class="btn btn-slate" href="#demo">Demander une démonstration <svg class="arr" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a><a class="btn btn-ghost" href="#etablissements">L\\\'offre établissement</a>',
        trust: '<span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg> Format décret 2016-995</span><span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg> Déploiement par service</span>',
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
    const onMenuClick = () => root.querySelector("#produits")?.scrollIntoView({ behavior: "smooth" });
    menuButton?.addEventListener("click", onMenuClick);

    const tallyForm = root.querySelector<HTMLFormElement>("#tallyDemoForm");
    const onTallySubmit = (event: Event) => {
      event.preventDefault();
      const formData = new FormData(tallyForm!);
      const params = new URLSearchParams();
      for (const [key, value] of Array.from(formData.entries())) {
        const text = String(value).trim();
        if (text) params.set(key, text);
      }
      const query = params.toString();
      window.location.href = `https://tally.so/r/VLy8dE${query ? `?${query}` : ""}`;
    };
    tallyForm?.addEventListener("submit", onTallySubmit);

    return () => {
      observer.disconnect();
      tabs.forEach((button) => button.removeEventListener("click", onTabClick));
      menuButton?.removeEventListener("click", onMenuClick);
      tallyForm?.removeEventListener("submit", onTallySubmit);
    };
  }, []);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />;
}

const LANDING_HTML = String.raw`
<style>
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
:root{
  --ink:#0B1B29;--slate:#1E3A5F;--slate-soft:#2C4D74;
  --soin:#0E9C8E;--soin-deep:#0A7B70;--soin-tint:#E7F4F2;
  --obs:#5B54CC;--obs-deep:#4842A8;--obs-tint:#ECEBFA;
  --paper:#FBFAF8;--bg:#FFFFFF;--mist:#EEF3F5;--mist-deep:#E2EAEE;
  --line:#D9E2E7;--line-soft:#E8EEF1;--seal:#C58A12;--seal-soft:#E1AB20;--seal-bg:#FBF3DE;
  --muted:#5A6B78;--muted-light:#8497A2;
  --serif:'Spectral',Georgia,serif;--sans:'Hanken Grotesk',system-ui,-apple-system,sans-serif;--mono:'JetBrains Mono',monospace;
  --maxw:1200px;--r:16px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);color:var(--ink);background:var(--bg);line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 30px}
.eyebrow{font-family:var(--mono);font-size:.71rem;letter-spacing:.18em;text-transform:uppercase;color:var(--soin-deep);font-weight:500;display:inline-flex;align-items:center;gap:.6em}
.eyebrow::before{content:"";width:22px;height:1.5px;background:var(--seal-soft);display:inline-block}
.eyebrow.light{color:#8FD8CE}
.ruled{position:relative;display:inline-block;padding-bottom:.42em}
.ruled::after{content:"";position:absolute;left:0;bottom:0;width:48px;height:2px;background:var(--seal-soft)}
.btn{display:inline-flex;align-items:center;gap:.5em;font-family:var(--sans);font-weight:600;font-size:.95rem;padding:.82em 1.5em;border-radius:11px;cursor:pointer;border:none;transition:transform .18s ease,box-shadow .28s ease,background .2s ease;white-space:nowrap}
.btn-primary{background:var(--soin);color:#fff;box-shadow:0 10px 26px -12px rgba(14,156,142,.75)}
.btn-primary:hover{background:var(--soin-deep);transform:translateY(-2px);box-shadow:0 16px 34px -12px rgba(14,156,142,.7)}
.btn-slate{background:var(--slate);color:#fff;box-shadow:0 10px 26px -12px rgba(30,58,95,.7)}
.btn-slate:hover{background:var(--ink);transform:translateY(-2px)}
.btn-ghost{background:transparent;color:var(--ink);border:1.5px solid var(--line)}
.btn-ghost:hover{border-color:var(--slate);background:var(--mist)}
.btn-light{background:#fff;color:var(--slate)}.btn-light:hover{background:#EAF6F4}
.btn .arr{transition:transform .18s}.btn:hover .arr{transform:translateX(3px)}
header.nav{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.85);backdrop-filter:blur(16px);border-bottom:1px solid var(--line-soft)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:74px}
.brand{display:flex;align-items:center;gap:.72em}
.brand-mark{width:40px;height:40px;border-radius:10px;background:var(--slate);display:grid;place-items:center;color:#fff;flex-shrink:0}
.brand-name{font-weight:800;letter-spacing:.05em;font-size:1.08rem;line-height:1}
.brand-sub{font-family:var(--mono);font-size:.6rem;letter-spacing:.13em;color:var(--muted);text-transform:uppercase;margin-top:3px}
.nav-links{display:flex;align-items:center;gap:1.9rem;list-style:none}
.nav-links a{font-size:.92rem;font-weight:500;color:var(--muted);transition:color .15s}
.nav-links a:hover{color:var(--ink)}
.nav-cta{display:flex;align-items:center;gap:1rem}
.nav-login{font-size:.92rem;font-weight:600}
.menu-btn{display:none;background:none;border:none;cursor:pointer;color:var(--ink)}
.hero{position:relative;background:radial-gradient(ellipse 80% 60% at 78% 0%,rgba(14,156,142,.07),transparent 60%),linear-gradient(180deg,var(--bg),var(--paper));padding:64px 0 100px;overflow:hidden}
.hero-grid{display:grid;grid-template-columns:1.02fr .98fr;gap:58px;align-items:center}
.seg{display:inline-flex;background:var(--mist);border:1px solid var(--line);border-radius:13px;padding:4px;gap:4px;margin-bottom:26px}
.seg button{font-family:var(--sans);font-weight:600;font-size:.86rem;border:none;background:transparent;color:var(--muted);padding:.6em 1.05em;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:.5em;transition:all .18s}
.seg button svg{opacity:.75}
.seg button[aria-selected="true"]{background:#fff;box-shadow:0 2px 9px -3px rgba(11,27,41,.28)}
.seg button[data-aud="prat"][aria-selected="true"]{color:var(--soin-deep)}
.seg button[data-aud="etab"][aria-selected="true"]{color:var(--slate)}
.hero h1{font-family:var(--serif);font-weight:600;font-size:clamp(2.35rem,4.6vw,3.6rem);line-height:1.07;letter-spacing:-.015em;margin:0 0 .42em;color:var(--ink)}
.hero h1 em{font-style:italic;color:var(--soin-deep);font-weight:500}
.hero-lead{font-size:1.14rem;color:var(--muted);max-width:42ch;margin-bottom:1.7em;min-height:3.4em}
.hero-actions{display:flex;gap:.8rem;flex-wrap:wrap;margin-bottom:1.7em}
.hero-trust{display:flex;gap:1.4rem;flex-wrap:wrap;font-size:.83rem;color:var(--muted);font-weight:500}
.hero-trust span{display:inline-flex;align-items:center;gap:.45em}
.hero-trust svg{color:var(--soin)}
.demo-card{background:#fff;border:1px solid var(--line);border-radius:var(--r);box-shadow:0 40px 90px -45px rgba(11,27,41,.45);overflow:hidden;position:relative}
.dc-head{display:flex;align-items:center;gap:.6em;padding:.9em 1.2em;border-bottom:1px solid var(--line-soft);background:linear-gradient(180deg,#fff,var(--mist))}
.dc-dot{width:9px;height:9px;border-radius:50%;background:var(--line)}
.dc-dot.live{background:var(--soin);animation:pulse 2.2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(14,156,142,.5)}70%{box-shadow:0 0 0 7px rgba(14,156,142,0)}100%{box-shadow:0 0 0 0 rgba(14,156,142,0)}}
.dc-title{font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-left:.3em}
.dc-modes{margin-left:auto;display:flex;gap:4px;font-family:var(--mono);font-size:.62rem;letter-spacing:.04em}
.dc-modes span{padding:.25em .55em;border-radius:6px;color:var(--muted-light);border:1px solid var(--line-soft)}
.dc-modes span.on{color:var(--soin-deep);border-color:#BFE6E0;background:var(--soin-tint)}
.dc-modes span.on svg{vertical-align:-2px;margin-right:.25em}
.dc-body{display:grid;grid-template-columns:1fr 1fr}
.dc-pane{padding:1.05em 1.2em;min-height:330px}
.dc-pane.raw{background:var(--ink);color:#C7D3DC;border-right:1px solid var(--line-soft)}
.pane-tag{font-family:var(--mono);font-size:.62rem;letter-spacing:.13em;text-transform:uppercase;margin-bottom:.85em;display:block}
.raw .pane-tag{color:#6E8290}.out .pane-tag{color:var(--soin-deep)}
.raw-text{font-family:var(--mono);font-size:.78rem;line-height:1.75;color:#9FB1BD}
.raw-text b{color:#E6EDF1;font-weight:500}
.out{background:var(--paper)}
.osec{margin-bottom:.82em;opacity:0;transform:translateY(6px);animation:rise .5s forwards}
.reduced .osec{opacity:1;transform:none;animation:none}
@keyframes rise{to{opacity:1;transform:none}}
.osec .l{font-weight:700;font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:var(--soin-deep);margin-bottom:.12em}
.osec .t{font-family:var(--serif);font-size:.85rem;line-height:1.4;color:var(--ink)}
.osec .seal{display:inline-flex;align-items:center;gap:.4em;margin-top:.3em;font-weight:600;font-size:.72rem;color:var(--seal)}
.wave{display:inline-flex;align-items:center;gap:2px;height:13px;vertical-align:middle}
.wave span{width:2.5px;border-radius:2px;background:currentColor;animation:wv 1.1s ease-in-out infinite}
@keyframes wv{0%,100%{height:4px;opacity:.5}50%{height:13px;opacity:1}}
.reduced .wave span{height:7px;animation:none}
.band{padding:98px 0;position:relative}
.band-mist{background:var(--mist)}
.band-paper{background:var(--paper)}
.sec-head{max-width:58ch;margin-bottom:50px}
.sec-head.center{margin-left:auto;margin-right:auto;text-align:center}
.sec-head h2{font-family:var(--serif);font-weight:600;font-size:clamp(1.8rem,3.1vw,2.55rem);line-height:1.13;letter-spacing:-.012em;margin:.5em 0 .35em}
.sec-head p{color:var(--muted);font-size:1.06rem}
.strip{border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);background:var(--bg)}
.strip-inner{display:flex;flex-wrap:wrap}
.strip-item{flex:1 1 220px;padding:26px;border-right:1px solid var(--line-soft);display:flex;gap:.85em;align-items:flex-start}
.strip-item:last-child{border-right:none}
.strip-ic{width:36px;height:36px;border-radius:9px;background:var(--mist);display:grid;place-items:center;color:var(--soin-deep);flex-shrink:0}
.strip-t{font-weight:700;font-size:.92rem;line-height:1.2}
.strip-d{font-size:.8rem;color:var(--muted);margin-top:2px}
.prod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.prod{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:28px 24px 24px;position:relative;overflow:hidden;transition:transform .22s ease,box-shadow .25s ease}
.prod::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent)}
.prod:hover{transform:translateY(-5px);box-shadow:0 28px 56px -30px rgba(11,27,41,.32)}
.prod-ic{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;color:#fff;background:var(--accent);margin-bottom:18px}
.prod-n{font-family:var(--serif);font-weight:600;font-size:1.18rem;margin-bottom:.32em;line-height:1.2}
.prod-d{font-size:.88rem;color:var(--muted);margin-bottom:1em}
.prod-tag{font-family:var(--mono);font-size:.62rem;letter-spacing:.05em;text-transform:uppercase;color:var(--accent-deep);background:var(--accent-tint);border-radius:6px;padding:.32em .6em;display:inline-flex;align-items:center;gap:.4em}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
.step{padding:0 32px;border-left:1px solid var(--line)}
.step:first-child{padding-left:0;border-left:none}
.step-num{font-family:var(--mono);font-size:.78rem;color:var(--soin-deep);font-weight:500;letter-spacing:.1em}
.step h3{font-family:var(--serif);font-weight:600;font-size:1.32rem;margin:.5em 0 .4em}
.step p{color:var(--muted);font-size:.93rem}
.step .kbd{display:inline-flex;align-items:center;gap:.4em;margin-top:1em;font-family:var(--mono);font-size:.74rem;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:.45em .75em}
.cherry-card{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;background:linear-gradient(150deg,#fff,var(--soin-tint));border:1px solid #CDEAE5;border-radius:22px;padding:44px;position:relative;overflow:hidden}
.cherry-badge{display:inline-flex;align-items:center;gap:.5em;font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;text-transform:uppercase;color:var(--soin-deep);background:#fff;border:1px solid #CDEAE5;border-radius:999px;padding:.4em .9em;margin-bottom:18px}
.cherry-card h2{font-family:var(--serif);font-weight:600;font-size:clamp(1.6rem,2.7vw,2.1rem);line-height:1.14;margin-bottom:.4em;max-width:18ch}
.cherry-card h2 em{font-style:italic;color:var(--soin-deep)}
.cherry-card p{color:var(--muted);font-size:1rem;max-width:42ch;margin-bottom:1.3em}
.cherry-pts{list-style:none;display:flex;flex-direction:column;gap:10px}
.cherry-pts li{display:flex;gap:.6em;align-items:center;font-size:.9rem}
.cherry-pts svg{color:var(--soin)}
.mic-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:26px;box-shadow:0 30px 60px -36px rgba(11,27,41,.3)}
.mic-row{display:flex;align-items:center;gap:1em;margin-bottom:18px}
.mic-ring{width:54px;height:54px;border-radius:50%;background:var(--soin);display:grid;place-items:center;color:#fff;flex-shrink:0;box-shadow:0 0 0 0 rgba(14,156,142,.5);animation:pulse 1.8s infinite}
.mic-meta .l{font-family:var(--mono);font-size:.72rem;letter-spacing:.05em;color:var(--soin-deep)}
.mic-meta .s{font-size:.78rem;color:var(--muted)}
.mic-card .wave{height:26px}.mic-card .wave span{width:3px;color:var(--soin)}
.mic-flow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:var(--mono);font-size:.72rem;color:var(--muted)}
.mic-flow .node{background:var(--mist);border:1px solid var(--line);border-radius:7px;padding:.45em .7em}
.mic-flow .node.act{color:var(--soin-deep);border-color:#BFE6E0;background:var(--soin-tint)}
.mic-flow svg{color:var(--muted-light)}
.doors{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.door{border-radius:var(--r);padding:32px;border:1px solid var(--line);position:relative;overflow:hidden;transition:transform .2s,box-shadow .25s}
.door:hover{transform:translateY(-3px);box-shadow:0 28px 56px -32px rgba(11,27,41,.3)}
.door-prat{background:linear-gradient(165deg,#fff,var(--soin-tint))}
.door-etab{background:linear-gradient(165deg,#fff,var(--mist-deep))}
.door-k{font-family:var(--mono);font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;margin-bottom:.5em}
.door-prat .door-k{color:var(--soin-deep)}.door-etab .door-k{color:var(--slate)}
.door h3{font-family:var(--serif);font-weight:600;font-size:1.45rem;margin-bottom:.4em}
.door p{font-size:.94rem;color:var(--muted);margin-bottom:1.3em}
.feat{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.fcard{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:28px}
.fcard-ic{width:44px;height:44px;border-radius:11px;background:var(--soin-tint);color:var(--soin-deep);display:grid;place-items:center;margin-bottom:16px}
.fcard h4{font-family:var(--serif);font-weight:600;font-size:1.14rem;margin-bottom:.35em}
.fcard p{font-size:.88rem;color:var(--muted)}
.etab{background:var(--ink);color:#CDD9E2;position:relative;overflow:hidden}
.etab::after{content:"";position:absolute;right:-150px;top:-110px;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgba(143,216,206,.14),transparent 70%)}
.etab h2{font-family:var(--serif);font-weight:600;color:#fff;font-size:clamp(1.8rem,3.1vw,2.5rem);line-height:1.13;margin:.5em 0 .4em;max-width:24ch}
.etab-lead{color:#9FB4C2;font-size:1.07rem;max-width:54ch}
.reg{display:flex;gap:1em;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-left:3px solid #8FD8CE;border-radius:13px;padding:24px;margin:36px 0 12px;position:relative;z-index:1}
.reg svg{color:#8FD8CE;flex-shrink:0;margin-top:2px}
.reg h4{color:#fff;font-size:1.04rem;margin-bottom:.3em}
.reg p{color:#94A9B8;font-size:.9rem}
.reg .mono{font-family:var(--mono);font-size:.7rem;color:#8FD8CE;letter-spacing:.04em}
.etab-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:32px;position:relative;z-index:1}
.ecard{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:13px;padding:24px}
.ecard-ic{color:#8FD8CE;margin-bottom:12px}
.ecard h4{color:#fff;font-size:1rem;margin-bottom:.35em}
.ecard p{color:#94A9B8;font-size:.86rem}
.deploy{display:flex;gap:14px;flex-wrap:wrap;margin-top:34px;position:relative;z-index:1}
.dstep{flex:1 1 200px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:13px;padding:22px}
.dstep .num{font-family:var(--mono);font-size:.72rem;color:#8FD8CE;letter-spacing:.1em}
.dstep h5{color:#fff;font-size:.98rem;margin:.4em 0 .3em}
.dstep p{color:#94A9B8;font-size:.84rem}
.segment-chips{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:28px;position:relative;z-index:1}
.chip{font-family:var(--mono);font-size:.7rem;letter-spacing:.06em;color:#9FB4C2;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:.45em .95em}
.etab-cta{margin-top:38px;position:relative;z-index:1;display:flex;gap:.8rem;flex-wrap:wrap}
.secure{background:var(--slate);color:#D6E0E8}
.secure .eyebrow{color:#A9E2DA}
.secure h2{font-family:var(--serif);color:#fff;font-weight:600;font-size:clamp(1.7rem,2.9vw,2.3rem);margin:.5em 0 .4em;max-width:22ch}
.secure-lead{color:#AFC2D0;font-size:1.03rem;max-width:50ch}
.secure-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:38px}
.scard{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:22px}
.scard-ic{color:#A9E2DA;margin-bottom:12px}
.scard h4{color:#fff;font-size:.96rem;margin-bottom:.35em}
.scard p{color:#AFC2D0;font-size:.82rem}
.plans{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:900px;margin:0 auto}
.plan{border:1px solid var(--line);border-radius:18px;padding:34px 32px;background:#fff;position:relative}
.plan.etab-plan{border-color:var(--slate);box-shadow:0 28px 56px -32px rgba(30,58,95,.42)}
.plan-k{font-family:var(--mono);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase}
.plan-prat .plan-k{color:var(--soin-deep)}.plan-etab-k{color:var(--slate)}
.plan h3{font-family:var(--serif);font-weight:600;font-size:1.55rem;margin:.3em 0 .2em}
.plan-desc{font-size:.9rem;color:var(--muted);margin-bottom:1.3em;min-height:2.6em}
.plan ul{list-style:none;margin-bottom:1.7em}
.plan li{display:flex;gap:.55em;align-items:flex-start;font-size:.88rem;padding:.36em 0}
.plan li svg{color:var(--soin);flex-shrink:0;margin-top:3px}
.plan-etab li svg{color:var(--slate)}
.plan .btn{width:100%;justify-content:center}
.badge{position:absolute;top:-12px;right:26px;background:var(--slate);color:#fff;font-size:.68rem;font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:.4em .85em;border-radius:999px}
.demo{display:grid;grid-template-columns:.9fr 1.1fr;gap:50px;align-items:center;background:var(--mist);border:1px solid var(--line);border-radius:22px;padding:46px}
.demo h2{font-family:var(--serif);font-weight:600;font-size:2rem;line-height:1.13;margin-bottom:.4em}
.demo p{color:var(--muted);font-size:.98rem;margin-bottom:1em}
.demo-pts{list-style:none;font-size:.9rem}
.demo-pts li{display:flex;gap:.55em;align-items:center;padding:.32em 0}
.demo-pts svg{color:var(--soin)}
.form{background:#fff;border:1px solid var(--line);border-radius:16px;padding:28px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.field{display:flex;flex-direction:column;gap:.35em; position: relative; z-index: 1;}
.field.full{grid-column:1/-1}
.field label{font-size:.78rem;font-weight:600}
.field input,.field select,.field textarea{font-family:var(--sans);font-size:.9rem;padding:.72em .85em;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);width:100%}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--soin);box-shadow:0 0 0 3px var(--soin-tint)}
.form .btn{width:100%;justify-content:center;margin-top:4px}
.form-note{font-size:.72rem;color:var(--muted-light);margin-top:10px;text-align:center}
.cta{background:var(--slate);color:#fff;border-radius:24px;padding:62px;text-align:center;position:relative;overflow:hidden}
.cta::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 0%,rgba(14,156,142,.34),transparent 52%),radial-gradient(circle at 100% 100%,rgba(143,216,206,.16),transparent 46%)}
.cta-in{position:relative;z-index:1}
.cta h2{font-family:var(--serif);font-weight:600;color:#fff;font-size:clamp(1.8rem,3.1vw,2.5rem);line-height:1.14;margin-bottom:.4em;max-width:22ch;margin-left:auto;margin-right:auto}
.cta p{color:#B9C9D6;font-size:1.05rem;margin-bottom:1.9em;max-width:46ch;margin-left:auto;margin-right:auto}
.cta-actions{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap}
footer{background:var(--paper);border-top:1px solid var(--line);padding:56px 0 40px; position: relative; z-index: 2;}
.foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:34px;margin-bottom:40px}
.foot-brand p{font-size:.86rem;color:var(--muted);max-width:30ch;margin-top:14px}
.foot-col h5{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-light);font-family:var(--mono);margin-bottom:14px;font-weight:500}
.foot-col a{display:block;font-size:.9rem;padding:.3em 0;transition:color .15s}
.foot-col a:hover{color:var(--soin-deep)}
.foot-bar{border-top:1px solid var(--line);padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:.8rem;color:var(--muted)}
.foot-bar .eco{font-family:var(--mono);letter-spacing:.04em}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
.reveal.in{opacity:1;transform:none}
.reduced .reveal{opacity:1;transform:none;transition:none}
.cbar{background:var(--ink);color:#CFE0DA}
.cbar-in{display:flex;align-items:center;justify-content:center;gap:1.3rem;flex-wrap:wrap;padding:.62em 30px;text-align:center}
.cbar .lead{display:inline-flex;align-items:center;gap:.5em;font-weight:600;color:#fff;font-size:.82rem}
.cbar .lead svg{color:#8FD8CE;flex-shrink:0}
.cbar .items{display:inline-flex;gap:1.05rem;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;letter-spacing:.03em;color:#9FC0B9}
.cbar .items span{display:inline-flex;align-items:center;gap:.35em}
.cbar .items svg{color:#8FD8CE}
.cbadges{display:flex;gap:.55rem;flex-wrap:wrap;margin-top:1.2em}
.cbadge{display:inline-flex;align-items:center;gap:.42em;font-size:.76rem;font-weight:600;color:var(--slate);background:#fff;border:1px solid var(--line);border-radius:999px;padding:.42em .85em;box-shadow:0 3px 10px -5px rgba(11,27,41,.22)}
.cbadge svg{color:var(--soin-deep)}
.cert-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:34px 0 6px;position:relative;z-index:1}
.cert{display:flex;align-items:flex-start;gap:.75em;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:13px;padding:16px 18px}
.cert svg{color:#A9E2DA;flex-shrink:0;margin-top:1px}
.cert .n{font-weight:700;color:#fff;font-size:.92rem;line-height:1.2}
.cert .d{font-size:.76rem;color:#AFC2D0;margin-top:2px}
.foot-compliance{display:flex;gap:1.1rem;flex-wrap:wrap;align-items:center;padding:18px 0;border-top:1px solid var(--line);margin-bottom:6px}
.foot-compliance .b{display:inline-flex;align-items:center;gap:.42em;font-size:.78rem;font-weight:600;color:var(--slate)}
.foot-compliance .b svg{color:var(--soin-deep)}
@media(max-width:980px){.prod-grid{grid-template-columns:1fr 1fr}.secure-grid{grid-template-columns:1fr 1fr}.cert-row{grid-template-columns:1fr}}
@media(max-width:880px){.hero-grid{grid-template-columns:1fr;gap:44px}.feat{grid-template-columns:1fr}.etab-grid,.doors,.plans,.demo,.cherry-card{grid-template-columns:1fr}.cherry-card{gap:28px;padding:32px}.demo{gap:28px;padding:32px}.steps{grid-template-columns:1fr;gap:34px}.step{border-left:2px solid var(--line);padding:0 0 0 18px}.step:first-child{padding-left:18px}.foot-grid{grid-template-columns:1fr 1fr}.nav-links{display:none}.menu-btn{display:block}.strip-item{flex:1 1 100%;border-right:none;border-bottom:1px solid var(--line-soft)}.strip-item:last-child{border-bottom:none}}
@media(max-width:760px){.cbar .lead .txt{display:none}.cbar-in{gap:.8rem}}
@media(max-width:560px){.prod-grid,.secure-grid{grid-template-columns:1fr}.frow{grid-template-columns:1fr}.cta,.plan{padding:32px 24px}.wrap{padding:0 20px}.dc-body{grid-template-columns:1fr}.dc-pane.raw{border-right:none;border-bottom:1px solid rgba(255,255,255,.08);min-height:0}.dc-pane{min-height:0}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
:focus-visible{outline:2px solid var(--soin);outline-offset:3px;border-radius:4px}
</style>

<div class="cbar">
 <div class="wrap cbar-in">
   <span class="lead"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg> <span class="txt">Conforme aux exigences de protection des données de santé</span></span>
   <span class="items">
     <span><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> RGPD</span>
     <span><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Hébergement HDS</span>
     <span><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Secret médical</span>
     <span><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Pseudonymisation</span>
   </span>
 </div>
</div>

<header class="nav">
 <div class="wrap nav-inner">
   <a class="brand" href="#top" aria-label="REDACTIO accueil">
     <span class="brand-mark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h6"/><path d="M9 17h4"/></svg></span>
     <span><span class="brand-name">REDACTIO</span><span class="brand-sub">Rédaction hospitalière</span></span>
   </a>
   <nav><ul class="nav-links">
     <li><a href="#produits">Les outils</a></li>
     <li><a href="#fonctionnement">Fonctionnement</a></li>
     <li><a href="#praticiens">Praticiens</a></li>
     <li><a href="#etablissements">Établissements</a></li>
     <li><a href="#securite">Sécurité</a></li>
   </ul></nav>
   <div class="nav-cta">
     <a class="nav-login" href="/login">Connexion</a>
     <a class="btn btn-primary" href="#offres">Commencer</a>
     <button class="menu-btn" id="menuBtn" aria-label="Menu"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
   </div>
 </div>
</header>

<section class="hero" id="top">
 <div class="wrap hero-grid">
   <div class="hero-copy">
     <div class="seg" role="tablist" aria-label="Choisir votre profil">
       <button role="tab" data-aud="prat" aria-selected="true"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/></svg> Je suis praticien</button>
       <button role="tab" data-aud="etab" aria-selected="false"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg> Établissement</button>
     </div>
     <h1 id="heroTitle">Vos écrits hospitaliers, <em>structurés</em> par l'IA. La plume reste la vôtre.</h1>
     <p class="hero-lead" id="heroLead">Courrier de sortie, conciliation médicamenteuse, correspondance, observation : collez ou dictez vos notes, REDACTIO les met en forme — pseudonymisées, conformes, prêtes à relire et signer.</p>
     <div class="hero-actions" id="heroActions">
       <a class="btn btn-primary" href="#offres">Commencer une rédaction <svg class="arr" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>
       <a class="btn btn-ghost" href="#produits">Voir les outils</a>
     </div>
     <div class="hero-trust" id="heroTrust">
       <span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg> Pseudonymisation automatique</span>
       <span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Vous validez chaque document</span>
     </div>
     <div class="cbadges" id="heroBadges">
       <span class="cbadge"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg> RGPD</span>
       <span class="cbadge"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Hébergement HDS</span>
       <span class="cbadge"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg> Secret médical</span>
       <span class="cbadge"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m4 4 16 16"/></svg> Pseudonymisation</span>
     </div>
   </div>
   <div class="demo-card" aria-label="Démonstration : des notes brutes au document structuré">
     <div class="dc-head">
       <span class="dc-dot"></span><span class="dc-dot"></span><span class="dc-dot live"></span>
       <span class="dc-title">courrier-de-sortie</span>
       <span class="dc-modes"><span>clavier</span><span class="on"><svg width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/></svg>dictée</span></span>
     </div>
     <div class="dc-body">
       <div class="dc-pane raw">
         <span class="pane-tag">Vos notes · collées ou dictées</span>
         <p class="raw-text"><b>H 72a</b>, hosp 12/03 dlr thoracique. <b>SCA NST+</b>. corona → <b>stent IVA</b>. sortie J4. ttt: aspirine 75, <b>ticagrelor</b> 90×2, atorva 80, bisop 2.5, ramipril 5. FEVG 48%. revoir cardio 1 mois + ETT. arrêt tabac.</p>
       </div>
       <div class="dc-pane out">
         <span class="pane-tag">Lettre de liaison structurée</span>
         <div class="osec" style="animation-delay:.2s"><div class="l">Motif</div><div class="t">Syndrome coronarien aigu sans sus-décalage de ST.</div></div>
         <div class="osec" style="animation-delay:.5s"><div class="l">Synthèse du séjour</div><div class="t">Coronarographie + angioplastie avec stent actif sur l'IVA. Suites simples.</div></div>
         <div class="osec" style="animation-delay:.8s"><div class="l">Traitement de sortie</div><div class="t">Aspirine 75 mg, ticagrelor 90 mg ×2, atorvastatine 80 mg, bisoprolol 2,5 mg, ramipril 5 mg.</div></div>
         <div class="osec" style="animation-delay:1.1s"><span class="seal"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg> À relire et valider par le praticien</span></div>
       </div>
     </div>
   </div>
 </div>
</section>

<section class="strip">
 <div class="wrap strip-inner">
   <div class="strip-item"><span class="strip-ic"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="6" rx="1"/><rect x="14" y="14" width="7" height="6" rx="1"/></svg></span><div><div class="strip-t">4 documents couverts</div><div class="strip-d">Sortie · conciliation · courrier · observation</div></div></div>
   <div class="strip-item"><span class="strip-ic"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></span><div><div class="strip-t">Structuration par IA</div><div class="strip-d">Des notes brutes au document propre</div></div></div>
   <div class="strip-item"><span class="strip-ic"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg></span><div><div class="strip-t">Format lettre de liaison</div><div class="strip-d">Aligné sur le décret 2016-995</div></div></div>
   <div class="strip-item"><span class="strip-ic"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><div><div class="strip-t">Conformité données de santé</div><div class="strip-d">RGPD · HDS · pseudonymisation</div></div></div>
 </div>
</section>

<section class="band" id="produits">
 <div class="wrap">
   <div class="sec-head reveal">
     <span class="eyebrow">Les outils</span>
     <h2 class="ruled">Toute votre rédaction hospitalière, assistée.</h2>
     <p>Les quatre écrits qui prennent du temps — mis en forme par l'IA à partir de ce que vous savez déjà du dossier.</p>
   </div>
   <div class="prod-grid">
     <article class="prod reveal" style="--accent:#0E9C8E;--accent-deep:#0A7B70;--accent-tint:#E7F4F2"><span class="prod-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h6M9 17h4"/></svg></span><h3 class="prod-n">Courrier de sortie</h3><p class="prod-d">Rédaction structurée du courrier de sortie d'hospitalisation.</p><span class="prod-tag">Format lettre de liaison</span></article>
     <article class="prod reveal" style="--accent:#1E3A5F;--accent-deep:#1E3A5F;--accent-tint:#E2EAEE"><span class="prod-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M5 3v6a4 4 0 0 0 8 0V3M5 3H4M12 3h1M9 13v3a4 4 0 0 0 8 0v-1a2 2 0 1 0-2 2"/></svg></span><h3 class="prod-n">Conciliation médicamenteuse</h3><p class="prod-d">Bilan de conciliation à l'admission, au transfert ou à la sortie.</p><span class="prod-tag">Volet médicamenteux</span></article>
     <article class="prod reveal" style="--accent:#C58A12;--accent-deep:#A0700C;--accent-tint:#FBF3DE"><span class="prod-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M2 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2ZM22 4h-7a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22Z"/></svg></span><h3 class="prod-n">Correspondance médicale</h3><p class="prod-d">Courriers entre professionnels de santé, du bon ton et au bon format.</p><span class="prod-tag">Ville · hôpital</span></article>
     <article class="prod reveal" style="--accent:#5B54CC;--accent-deep:#4842A8;--accent-tint:#ECEBFA"><span class="prod-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M15.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M9 13l2 2 4-4"/></svg></span><h3 class="prod-n">Observation médicale</h3><p class="prod-d">Prise de notes, suivi journalier, transmissions ciblées.</p><span class="prod-tag"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.3" viewBox="0 0 24 24"><path d="M12 2v6M5 5l3 3M19 5l-3 3"/></svg> Nouveau</span></article>
   </div>
 </div>
</section>

<section class="band band-mist" id="fonctionnement"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Fonctionnement</span><h2 class="ruled">De vos notes au document signé, en trois temps.</h2><p>Une séquence courte, pensée pour s'insérer dans le flux d'un service — pas pour le ralentir.</p></div><div class="steps"><div class="step reveal"><span class="step-num">TEMPS 01</span><h3>Vous saisissez</h3><p>Collez vos notes ou dictez-les, en forme libre. Sans identifiant direct du patient.</p><span class="kbd">clavier · dictée</span></div><div class="step reveal"><span class="step-num">TEMPS 02</span><h3>REDACTIO structure</h3><p>Le contenu est pseudonymisé puis mis en sections, dans le format du document choisi.</p><span class="kbd">Motif · Synthèse · Traitement…</span></div><div class="step reveal"><span class="step-num">TEMPS 03</span><h3>Vous relisez &amp; validez</h3><p>Vous corrigez, complétez, signez. Le document final est le vôtre.</p><span class="kbd">Exporter · Copier · Signer</span></div></div></div></section>

<section class="band band-paper" id="dictee"><div class="wrap"><div class="cherry-card reveal"><div><span class="cherry-badge"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/></svg> En plus · Dictée IA</span><h2>Et, cerise sur le gâteau : <em>dictez</em>.</h2><p>Toute la rédaction fonctionne au clavier. Mais si vous préférez, énoncez simplement vos notes : REDACTIO les transcrit, les pseudonymise et les structure — dans les quatre outils.</p><ul class="cherry-pts"><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Disponible sur les 4 documents</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Pseudonymisation conservée sur la voix</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Un brouillon, jamais une décision</li></ul></div><div class="mic-card"><div class="mic-row"><span class="mic-ring"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg></span><span class="wave" style="color:var(--soin)" aria-hidden="true"><span style="animation-delay:0s"></span><span style="animation-delay:.12s"></span><span style="animation-delay:.28s"></span><span style="animation-delay:.18s"></span><span style="animation-delay:.34s"></span><span style="animation-delay:.06s"></span><span style="animation-delay:.22s"></span><span style="animation-delay:.3s"></span></span><span style="margin-left:auto" class="mic-meta"><span class="l">00:14 · à l'écoute</span><br><span class="s">dictée vocale</span></span></div><div class="mic-flow"><span class="node act">voix</span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span class="node act">pseudonymisation</span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span class="node act">structuration</span><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span class="node">validation</span></div></div></div></div></section>

<section class="band"><div class="wrap"><div class="sec-head center reveal"><span class="eyebrow">Deux usages, une même plateforme</span><h2>Que vous écriviez seul ou pour tout un service.</h2></div><div class="doors"><a class="door door-prat reveal" href="#praticiens"><div class="door-k">Praticien · à titre individuel</div><h3>Reprenez du temps clinique</h3><p>Un compte personnel, prêt en deux minutes. Pour les praticiens hospitaliers, les internes et les PADHUE qui veulent maîtriser le format français.</p><span class="btn btn-primary">Offre praticien <svg class="arr" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h9M8 4l4 4-4 4"/></svg></span></a><a class="door door-etab reveal" href="#etablissements"><div class="door-k">Hôpital · clinique · GHT</div><h3>Déployez à l'échelle d'un service</h3><p>Des lettres de liaison conformes et homogènes pour toutes vos équipes — un enjeu de qualité, de financement IFAQ et de certification HAS.</p><span class="btn btn-slate">Offre établissement <svg class="arr" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h9M8 4l4 4-4 4"/></svg></span></a></div></div></section>

<section class="band band-mist" id="praticiens"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Pour les praticiens</span><h2 class="ruled">Moins de minutes sur le clavier, plus au lit du patient.</h2><p>Un outil personnel, sans installation. Vous gardez la main sur chaque mot.</p></div><div class="feat"><div class="fcard reveal"><div class="fcard-ic"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></div><h4>La fin de la page blanche</h4><p>Un document propre à relire et compléter, plutôt qu'à bâtir de zéro en fin de garde.</p></div><div class="fcard reveal"><div class="fcard-ic"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg></div><h4>Le format français, maîtrisé</h4><p>Pour les PADHUE et les internes : s'approprier la structure et les codes du document hospitalier attendu en France.</p></div><div class="fcard reveal"><div class="fcard-ic"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg></div><h4>Vos patients, jamais conservés</h4><p>Pseudonymisation automatique, aucune donnée stockée, tout purgé à la déconnexion. Vous restez l'unique auteur.</p></div></div><div style="margin-top:36px"><a class="btn btn-primary" href="#offres">Créer mon compte praticien <svg class="arr" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a></div></div></section>

<section class="band etab" id="etablissements"><div class="wrap"><span class="eyebrow light">Pour les établissements</span><h2>La lettre de liaison conforme, à l'échelle de vos services.</h2><p class="etab-lead">Un enjeu réglementaire, financier et de certification. REDACTIO aide vos équipes à produire des lettres complètes, dans le bon format, le jour de la sortie.</p><div class="reg"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg><div><h4>Le cadre : décret n°2016-995 &amp; indicateur QLS</h4><p>Depuis 2017, la lettre de liaison doit être remise au patient le jour de sa sortie et adressée au médecin traitant. Sa qualité est évaluée par l'indicateur QLS (IQSS), mobilisé dans l'IFAQ et la certification HAS — objectif de performance fixé à 80/100. <span class="mono">décret 2016-995 · QLS · IFAQ · certification</span></p></div></div><div class="etab-grid"><div class="ecard reveal"><div class="ecard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div><h4>Conformité de la lettre de liaison</h4><p>Les sections produites couvrent les critères QLS : motif, synthèse, traitements de sortie, suivi.</p></div><div class="ecard reveal"><div class="ecard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></div><h4>Des écrits homogènes</h4><p>Même structure et même niveau de qualité d'un praticien à l'autre, d'un service à l'autre.</p></div><div class="ecard reveal"><div class="ecard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h4>Comptes équipes &amp; pilotage</h4><p>Déploiement par service, gestion des accès, interlocuteur dédié pour vos référents qualité et DSI.</p></div><div class="ecard reveal"><div class="ecard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h4>Conformité contractuelle</h4><p>Cadre de traitement (convention/DPA), hébergement et réversibilité à définir avec votre DPO.</p></div></div><div class="deploy"><div class="dstep reveal"><span class="num">ÉTAPE 01</span><h5>Pilote sur un service</h5><p>Mise en route rapide auprès d'une équipe volontaire, sans intégration lourde.</p></div><div class="dstep reveal"><span class="num">ÉTAPE 02</span><h5>Déploiement progressif</h5><p>Extension service par service, création des comptes, prise en main accompagnée.</p></div><div class="dstep reveal"><span class="num">ÉTAPE 03</span><h5>Accompagnement continu</h5><p>Support, mises à jour des référentiels, point qualité régulier avec vos référents.</p></div></div><div class="segment-chips"><span class="chip">CHU · CH</span><span class="chip">Cliniques privées</span><span class="chip">GHT</span><span class="chip">SSR · SMR</span><span class="chip">HAD</span><span class="chip">EHPAD</span></div><div class="etab-cta"><a class="btn btn-primary" href="#demo">Demander une démonstration <svg class="arr" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a><a class="btn btn-ghost" href="#offres" style="color:#D6E0E8;border-color:rgba(255,255,255,.25)">Voir l'offre établissement</a></div></div></section>

<section class="band secure" id="securite"><div class="wrap"><span class="eyebrow">Conformité &amp; sécurité des données de santé</span><h2>Conforme aux exigences de protection des données de santé.</h2><p class="secure-lead">Ce n'est pas une option : c'est le socle de REDACTIO. Du praticien isolé à la DSI d'un CHU, chaque garantie est intégrée au fonctionnement même de la plateforme.</p><div class="cert-row"><div class="cert"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg><div><div class="n">RGPD</div><div class="d">Traitement conforme au Règlement Général sur la Protection des Données.</div></div></div><div class="cert"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><div><div class="n">Hébergement HDS</div><div class="d">Hébergement agréé Données de Santé pour les traitements concernés.</div></div></div><div class="cert"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5Z"/><path d="M12 8v4M12 15h.01"/></svg><div><div class="n">Secret médical</div><div class="d">Respect du secret professionnel et de la confidentialité des soins.</div></div></div></div><div class="secure-grid"><div class="scard reveal"><div class="scard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div><h4>Aucune donnée stockée</h4><p>Mémoire de session uniquement, purgée à la déconnexion.</p></div><div class="scard reveal"><div class="scard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m4 4 16 16"/><path d="M2 12s3-7 10-7 10 7 10 7" opacity=".5"/></svg></div><h4>Pseudonymisation auto</h4><p>Sur le texte comme sur la dictée, avant tout envoi au moteur d'IA.</p></div><div class="scard reveal"><div class="scard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M4 4v6h6M20 20v-6h-6"/><path d="M4 10a8 8 0 0 1 14-3M20 14a8 8 0 0 1-14 3"/></svg></div><h4>Pas d'entraînement sur vos données</h4><p>Vos contenus ne servent jamais à entraîner les modèles.</p></div><div class="scard reveal"><div class="scard-ic"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h4"/></svg></div><h4>Cadre contractuel</h4><p>Convention de traitement (DPA), réversibilité &amp; DPO pour les établissements.</p></div></div><div style="margin-top:34px"><a class="btn btn-light" href="/conformite.html">Consulter la page conformité &amp; sécurité <svg class="arr" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a></div></div></section>

<section class="band band-mist" id="offres"><div class="wrap"><div class="sec-head center reveal"><span class="eyebrow">Offres</span><h2>Une porte d'entrée pour chacun.</h2><p>Commencez seul en quelques minutes, ou équipez tout un service.</p></div><div class="plans"><div class="plan plan-prat reveal"><span class="plan-k">Praticien</span><h3>À titre individuel</h3><p class="plan-desc">Pour un médecin, un interne ou un candidat PADHUE qui rédige pour lui-même.</p><ul><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Les 4 outils, dictée comprise</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Compte personnel immédiat</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Confidentialité par conception</li></ul><a class="btn btn-primary" href="https://redactio.evc-pae.fr/dashboard">Essayer gratuitement</a></div><div class="plan plan-etab etab-plan reveal"><span class="badge">Recommandé</span><span class="plan-k plan-etab-k">Établissement</span><h3>Service · Hôpital · GHT</h3><p class="plan-desc">Pour équiper des équipes et fiabiliser vos lettres de liaison à l'échelle.</p><ul><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Comptes équipes &amp; déploiement par service</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Accompagnement &amp; interlocuteur dédié</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Convention de traitement (DPA) sur mesure</li></ul><a class="btn btn-slate" href="#demo">Demander une démo &amp; un devis</a></div></div></div></section>

<section class="band" id="demo"><div class="wrap"><div class="demo reveal"><div><span class="eyebrow">Établissements</span><h2 style="margin-top:.6em">Parlons de votre service.</h2><p>Une démonstration de 30 minutes, adaptée à votre activité (MCO, SSR/SMR, psychiatrie…) et à vos enjeux QLS.</p><ul class="demo-pts"><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Cas d'usage sur vos propres types de courriers</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Réponse à vos questions sécurité &amp; conformité</li><li><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Proposition de pilote sur un service</li></ul></div><form class="form" id="tallyDemoForm"><div class="frow"><div class="field"><label for="f-nom">Nom</label><input id="f-nom" name="Nom" type="text" placeholder="Dr Martin"></div><div class="field"><label for="f-fonction">Fonction</label><input id="f-fonction" name="Fonction" type="text" placeholder="Chef de service, DIM, DSI…"></div></div><div class="frow"><div class="field full"><label for="f-etab">Établissement</label><input id="f-etab" name="Établissement" type="text" placeholder="CH / CHU / Clinique / GHT"></div></div><div class="frow"><div class="field"><label for="f-mail">E-mail professionnel</label><input id="f-mail" name="Email" type="email" placeholder="nom@etablissement.fr"></div><div class="field"><label for="f-taille">Praticiens concernés</label><select id="f-taille" name="Praticiens concernés"><option>1 à 10</option><option>10 à 50</option><option>50 à 200</option><option>200+</option></select></div></div><div class="field full"><label for="f-msg">Votre besoin (facultatif)</label><textarea id="f-msg" name="Besoin" rows="3" placeholder="Type de courriers, volumétrie, échéances…"></textarea></div><button type="submit" class="btn btn-slate">Demander une démonstration</button><p class="form-note">Formulaire sécurisé via Tally. Aucune donnée patient ici.</p></form></div></div></section>

<section class="band" style="padding-top:0"><div class="wrap"><div class="cta reveal"><div class="cta-in"><h2>Votre prochain document hospitalier, structuré en quelques instants.</h2><p>Que vous écriviez pour vous ou pour tout un service — sans jamais conserver vos patients.</p><div class="cta-actions"><a class="btn btn-light" href="https://redactio.evc-pae.fr/dashboard">Essayer gratuitement</a><a class="btn btn-primary" href="#demo">Demander une démo établissement</a></div></div></div></div></section>

<footer><div class="wrap"><div class="foot-grid"><div class="foot-brand"><a class="brand" href="#top"><span class="brand-mark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h6"/></svg></span><span><span class="brand-name">REDACTIO</span><span class="brand-sub">Rédaction hospitalière</span></span></a><p>La rédaction hospitalière assistée par IA — sans jamais conserver vos patients.</p></div><div class="foot-col"><h5>Produit</h5><a href="#produits">Les 4 outils</a><a href="#fonctionnement">Fonctionnement</a><a href="#dictee">Dictée IA</a></div><div class="foot-col"><h5>Établissements</h5><a href="#etablissements">Pour les établissements</a><a href="#offres">Offre établissement</a><a href="#demo">Demander une démo</a></div><div class="foot-col"><h5>Plateforme</h5><a href="/conformite.html">Conformité &amp; sécurité</a><a href="https://redactio.evc-pae.fr/dashboard">Connexion</a><a href="#">Mentions légales</a></div></div><div class="foot-compliance"><span class="b"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg> Conforme aux exigences de protection des données de santé</span><span class="b">RGPD</span><span class="b">Hébergement HDS</span><span class="b">Secret médical</span><span class="b">Pseudonymisation</span><span class="b">Aucune donnée conservée</span></div><div class="foot-bar"><span>© <span id="yr"></span> REDACTIO — Aide à la rédaction, jamais à la décision médicale.</span><span class="eco">un service de l'écosystème evc-pae.fr</span></div></div></footer>
`;
