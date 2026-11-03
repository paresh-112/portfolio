// Renders the page from the portfolio content, then starts the page script.
//
// Content comes from, in order:
//   1. the admin's unpublished draft, when the page is opened as ?preview
//   2. window.PORTFOLIO_DATA, set by /api/content.js (the published content)
//   3. data/content.json, the defaults shipped with the site
// Everything typed in the admin is escaped before it reaches the DOM, and
// links are limited to http(s), mailto, tel and site-relative paths.
(function () {
    const DRAFT_KEY = 'portfolio-admin-draft';
    const DEFAULT_PRIMARY = '#4f46e5';
    const DEFAULT_SECONDARY = '#0f766e';
    const DEFAULT_FONT = 'Bricolage Grotesque';
    const HEADING_FONTS = {
        'Bricolage Grotesque': 'Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800',
        'Space Grotesk': 'Space+Grotesk:wght@500;600;700',
        'Sora': 'Sora:wght@600;700;800',
        'Fraunces': 'Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800',
        'Outfit': 'Outfit:wght@600;700;800'
    };

    // ---------- safe output helpers ----------
    const esc = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // **bold** is the only markup the admin supports
    const rich = (value) => esc(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    function safeUrl(value) {
        const url = String(value ?? '').trim();
        if (!url) return '';
        if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
        if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return ''; // javascript:, data:, etc.
        return url;
    }

    const icon = (value, fallback = 'fas fa-circle') => {
        const cls = String(value ?? '').toLowerCase().replace(/[^a-z0-9 -]/g, '').trim();
        return cls || fallback;
    };

    const tone = (value) => (['indigo', 'teal', 'amber'].includes(value) ? value : 'indigo');
    const slug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const list = (value) => (Array.isArray(value) ? value : []);
    const isHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value ?? ''));

    // ---------- loading ----------
    function readDraft() {
        if (!new URLSearchParams(location.search).has('preview')) return null;
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    async function loadContent() {
        const draft = readDraft();
        if (draft) return { data: draft, preview: true };
        if (window.PORTFOLIO_DATA) return { data: window.PORTFOLIO_DATA, preview: false };
        const res = await fetch('data/content.json', { cache: 'no-cache' });
        return { data: await res.json(), preview: false };
    }

    // ---------- theme ----------
    function applyTheme(theme = {}) {
        const root = document.documentElement;
        let savedMode = null;
        try {
            savedMode = localStorage.getItem('theme');
        } catch (e) { /* storage blocked */ }
        if (!savedMode && (theme.defaultMode === 'light' || theme.defaultMode === 'dark')) {
            root.dataset.theme = theme.defaultMode;
        }

        root.classList.toggle('no-motion', theme.animations === false);
        root.classList.toggle('no-glow', theme.cursorGlow === false);
        root.classList.toggle('no-section-numbers', theme.sectionNumbers === false);

        const css = [];
        const primary = isHex(theme.primary) ? theme.primary : DEFAULT_PRIMARY;
        const secondary = isHex(theme.secondary) ? theme.secondary : DEFAULT_SECONDARY;

        // The default palette is hand-tuned per mode; custom colours are mixed
        // lighter for dark mode so they keep their contrast there.
        if (primary.toLowerCase() !== DEFAULT_PRIMARY || secondary.toLowerCase() !== DEFAULT_SECONDARY) {
            const light = `--indigo:${primary};--indigo-soft:color-mix(in srgb, ${primary} 11%, white);--teal:${secondary};--teal-soft:color-mix(in srgb, ${secondary} 12%, white);`;
            const dark = `--indigo:color-mix(in srgb, ${primary} 55%, white);--indigo-soft:color-mix(in srgb, ${primary} 22%, transparent);--teal:color-mix(in srgb, ${secondary} 55%, white);--teal-soft:color-mix(in srgb, ${secondary} 22%, transparent);`;
            css.push(`:root{${light}}`);
            css.push(`@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`);
            css.push(`:root[data-theme="dark"]{${dark}}`);
        }

        const font = HEADING_FONTS[theme.headingFont] ? theme.headingFont : DEFAULT_FONT;
        if (font !== DEFAULT_FONT) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${HEADING_FONTS[font]}&display=swap`;
            document.head.appendChild(link);
            css.push(`:root{--font-display:'${font}','Inter',system-ui,sans-serif;}`);
        }

        if (css.length) {
            const style = document.createElement('style');
            style.id = 'theme-overrides';
            style.textContent = css.join('\n');
            document.head.appendChild(style);
        }
    }

    // ---------- meta ----------
    function setMeta(selector, attr, value) {
        const el = document.head.querySelector(selector);
        if (el && value) el.setAttribute(attr, value);
    }

    function applyMeta(meta = {}) {
        if (meta.title) document.title = meta.title;
        setMeta('meta[name="description"]', 'content', meta.description);
        setMeta('meta[name="keywords"]', 'content', meta.keywords);
        setMeta('meta[property="og:title"]', 'content', meta.title);
        setMeta('meta[property="og:description"]', 'content', meta.description);
        setMeta('meta[property="og:image"]', 'content', meta.ogImage && meta.siteUrl ? new URL(meta.ogImage, meta.siteUrl).href : meta.ogImage);
        setMeta('link[rel="canonical"]', 'href', meta.siteUrl);
    }

    // ---------- section helpers ----------
    function sectionHead(cfg, number, extraNote) {
        const indexLabel = `<span class="section-number">${String(number).padStart(2, '0')} — </span>${esc(cfg.index || cfg.label)}`;
        const sub = cfg.subheading && !extraNote ? `<br><span class="muted-title">${esc(cfg.subheading)}</span>` : '';
        const note = extraNote && cfg.subheading ? `<p class="section-note">${esc(cfg.subheading)}</p>` : '';
        return `<header class="section-head reveal">
                    <p class="section-index">${indexLabel}</p>
                    <h2 class="section-title">${esc(cfg.heading)}${sub}</h2>
                    ${note}
                </header>`;
    }

    const tags = (items) => `<ul class="project-tags">${list(items).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    const bullets = (items) => `<ul>${list(items).map((b) => `<li>${rich(b)}</li>`).join('')}</ul>`;

    // ---------- renderers ----------
    function renderNav(data, shown) {
        const p = data.profile || {};
        document.querySelector('.brand-mark').textContent = p.initials || '';
        document.querySelector('.brand-name').innerHTML = `${esc(p.shortName || p.name)}<span class="brand-dot">.</span>`;
        document.querySelector('.nav-brand').setAttribute('aria-label', `${p.name || ''} — home`);
        document.getElementById('navMenu').innerHTML = shown
            .map(({ key, cfg }) => `<li><a href="#${key}" class="nav-link">${esc(cfg.label)}</a></li>`)
            .join('');
        document.querySelector('.nav-cta').hidden = !data.sections?.contact?.show;
    }

    function renderHero(data) {
        const p = data.profile || {};
        const firstRun = list(data.demo)[0] || { project: '', query: '', steps: [], answer: '' };
        const resume = safeUrl(p.resume);
        const resumeName = resume.split('/').pop();

        document.getElementById('heroCopy').innerHTML = `
            ${p.openToWork !== false && p.status ? `<p class="status-pill"><span class="pulse-dot"></span> ${esc(p.status)}</p>` : ''}
            <h1 class="hero-title">
                <span class="hero-line"><span class="word">${esc(p.headlineTop)}</span></span>
                <span class="hero-line">${p.headlineBottom ? `<span class="word">${esc(p.headlineBottom)}</span> ` : ''}<span class="word accent-word">${esc(p.headlineAccent)}</span></span>
            </h1>
            <p class="hero-lede">${rich(p.lede)}</p>
            <div class="hero-actions">
                ${data.sections?.projects?.show !== false ? '<a href="#projects" class="btn btn-primary"><i class="fas fa-arrow-down"></i> See my work</a>' : ''}
                <button type="button" class="btn btn-soft" data-open-chat><i class="fas fa-wand-magic-sparkles"></i> Ask my AI</button>
                ${resume ? `<a href="${esc(resume)}" download="${esc(resumeName)}" class="btn btn-ghost" data-resume><i class="fas fa-file-arrow-down"></i> Resume</a>` : ''}
            </div>
            ${list(p.stats).length ? `<ul class="hero-stats" aria-label="At a glance">${list(p.stats).map((s) => `
                <li><strong data-count="${Number(s.value) || 0}" data-suffix="${esc(s.suffix)}">${esc(s.value)}${esc(s.suffix)}</strong><span>${esc(s.label)}</span></li>`).join('')}
            </ul>` : ''}`;

        document.getElementById('demoProject').textContent = firstRun.project;
        document.getElementById('demoQuery').textContent = firstRun.query;
        document.getElementById('demoSteps').innerHTML = ['fa-brain', 'fa-magnifying-glass', 'fa-screwdriver-wrench', 'fa-shield-halved', 'fa-bolt']
            .map((ic, i) => `<li data-step="${i}"><span class="step-icon"><i class="fas ${ic}"></i></span><span class="step-label">${esc(list(firstRun.steps)[i])}</span><span class="step-ms"></span></li>`)
            .join('');
        document.querySelector('.agent-demo').hidden = !list(data.demo).length;
        document.querySelector('.hero-inner').classList.toggle('no-demo', !list(data.demo).length);
    }

    function renderMarquee(data) {
        const band = document.querySelector('.marquee-band');
        const items = list(data.marquee);
        band.hidden = !items.length;
        band.querySelector('.marquee-track').innerHTML = items
            .map((m) => `<li><i class="${esc(icon(m.icon))}"></i> ${esc(m.label)}</li>`)
            .join('');
    }

    function renderAbout(data, cfg, n) {
        const a = data.about || {};
        const p = data.profile || {};
        const ask = list(a.ask);
        return `<div class="container">
            ${sectionHead(cfg, n)}
            <div class="bento about-bento">
                <article class="tile tile-xl reveal">
                    <p class="tile-kicker">Who I am</p>
                    <p class="about-lead">${rich(a.lead)}</p>
                    ${list(a.paragraphs).map((t) => `<p>${rich(t)}</p>`).join('')}
                </article>
                <article class="tile tile-accent reveal">
                    <p class="tile-kicker">Right now</p>
                    <p class="tile-big">${esc(a.nowTitle)}</p>
                    <p class="tile-sub">${esc(a.nowSubtitle)}</p>
                </article>
                <article class="tile reveal">
                    <p class="tile-kicker">How I work</p>
                    <ul class="check-list">${list(a.principles).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
                </article>
                <article class="tile reveal">
                    <p class="tile-kicker">Based in</p>
                    <p class="tile-big"><i class="fas fa-location-dot"></i> ${esc(p.location)}</p>
                    <p class="tile-sub">${esc(p.locationNote)}</p>
                </article>
                ${ask.length ? `<article class="tile tile-ask reveal">
                    <div>
                        <p class="tile-kicker">Short on time?</p>
                        <p class="tile-big">${esc(a.askTitle || 'Ask my AI instead')}</p>
                    </div>
                    <div class="ask-chips">${ask.map((q) => `<button type="button" class="ask-chip" data-ask="${esc(q.question)}">${esc(q.label)}</button>`).join('')}</div>
                </article>` : ''}
            </div>
        </div>`;
    }

    function renderSkills(data, cfg, n) {
        return `<div class="container">
            ${sectionHead(cfg, n)}
            <div class="bento skills-bento">
                ${list(data.skills).map((g) => `
                <article class="tile skill-tile${g.wide ? ' tile-wide' : ''} reveal" data-tone="${tone(g.tone)}">
                    <div class="skill-head"><span class="skill-icon"><i class="${esc(icon(g.icon))}"></i></span><h3>${esc(g.name)}</h3></div>
                    <ul class="chips">${list(g.items).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
                </article>`).join('')}
            </div>
        </div>`;
    }

    function renderExperience(data, cfg, n) {
        return `<div class="container">
            ${sectionHead(cfg, n)}
            <ol class="timeline">
                ${list(data.experience).map((job) => `
                <li class="timeline-item reveal">
                    <div class="timeline-meta">
                        <span class="timeline-date">${esc(job.start)} – ${job.current ? 'Present' : esc(job.end)}</span>
                        ${job.current ? '<span class="timeline-tag">Current</span>' : ''}
                    </div>
                    <div class="timeline-body">
                        <h3>${esc(job.role)}${job.company ? ` <span class="at">— ${esc(job.company)}</span>` : ''}</h3>
                        ${bullets(job.bullets)}
                    </div>
                </li>`).join('')}
            </ol>
        </div>`;
    }

    function renderProjects(data, cfg, n) {
        const featured = list(data.projects?.featured);
        const more = list(data.projects?.more);
        return `<div class="container">
            ${sectionHead(cfg, n, true)}
            <div class="featured-list">
                ${featured.map((pr) => {
                    const id = slug(pr.id || pr.name);
                    return `
                <article class="featured-card reveal" data-tone="${tone(pr.tone)}" id="${esc(id)}">
                    <div class="featured-side">
                        <div class="featured-icon"><i class="${esc(icon(pr.icon))}"></i></div>
                        ${pr.status ? `<span class="featured-status"><span class="pulse-dot"></span> ${esc(pr.status)}</span>` : ''}
                        <h3>${esc(pr.name)}</h3>
                        <p class="featured-tagline">${esc(pr.tagline)}</p>
                        ${tags(pr.tags)}
                    </div>
                    <div class="featured-main">
                        <div class="view-toggle" role="tablist" aria-label="${esc(pr.name)} details">
                            <button class="view-btn active" data-view="business" role="tab" aria-selected="true"><i class="fas fa-briefcase"></i> Business impact</button>
                            <button class="view-btn" data-view="technical" role="tab" aria-selected="false"><i class="fas fa-microchip"></i> Under the hood</button>
                        </div>
                        <div class="view-panes">
                            <div class="view-pane active" data-pane="business" role="tabpanel">
                                ${pr.intro ? `<p>${rich(pr.intro)}</p>` : ''}
                                ${bullets(pr.business)}
                            </div>
                            <div class="view-pane" data-pane="technical" role="tabpanel">
                                ${bullets(pr.technical)}
                            </div>
                        </div>
                    </div>
                </article>`;
                }).join('')}
            </div>
            ${more.length ? `
            <div class="more-head reveal">
                <h3 class="more-title">${esc(cfg.moreHeading)}</h3>
                ${cfg.moreSubheading ? `<p class="section-note">${esc(cfg.moreSubheading)}</p>` : ''}
            </div>
            <div class="bento projects-bento">
                ${more.map((pr) => `
                <article class="tile project-tile${pr.wide ? ' tile-wide' : ''} reveal" data-tone="${tone(pr.tone)}" id="${esc(slug(pr.id || pr.name))}">
                    <div class="project-icon"><i class="${esc(icon(pr.icon))}"></i></div>
                    <h4>${esc(pr.name)}</h4>
                    <p class="project-tagline">${esc(pr.tagline)}</p>
                    <p>${rich(pr.description)}</p>
                    ${tags(pr.tags)}
                </article>`).join('')}
            </div>` : ''}
        </div>`;
    }

    function renderEducation(data, cfg, n) {
        return `<div class="container">
            ${sectionHead(cfg, n)}
            <ul class="edu-list">
                ${list(data.education).map((ed) => `
                <li class="edu-item reveal">
                    <span class="edu-icon"><i class="${esc(icon(ed.icon, 'fas fa-graduation-cap'))}"></i></span>
                    <div><h3>${esc(ed.degree)}</h3><p>${esc([ed.school, ed.grade].filter(Boolean).join(' · '))}</p></div>
                    <span class="edu-year">${esc([ed.start, ed.end].filter(Boolean).join(' – '))}</span>
                </li>`).join('')}
            </ul>
        </div>`;
    }

    function renderContact(data, cfg, n) {
        const p = data.profile || {};
        const email = String(p.email || '').trim();
        const phone = String(p.phone || '').trim();
        const github = safeUrl(p.github);
        const linkedin = safeUrl(p.linkedin);
        return `<div class="container">
            <div class="contact-panel reveal">
                <div class="contact-copy">
                    <p class="section-index"><span class="section-number">${String(n).padStart(2, '0')} — </span>${esc(cfg.index || cfg.label)}</p>
                    <h2 class="contact-title">${esc(cfg.heading)}</h2>
                    ${cfg.subheading ? `<p class="contact-lede">${esc(cfg.subheading)}</p>` : ''}
                    ${email ? `<button type="button" class="email-copy" id="copyEmail" data-email="${esc(email)}">
                        <i class="fas fa-envelope"></i>
                        <span class="email-text">${esc(email)}</span>
                        <span class="copy-label" aria-live="polite">Copy</span>
                    </button>` : ''}
                    <ul class="contact-links">
                        ${phone ? `<li><a href="tel:${esc(phone.replace(/[^+\d]/g, ''))}"><i class="fas fa-phone"></i> ${esc(phone)}</a></li>` : ''}
                        ${linkedin ? `<li><a href="${esc(linkedin)}" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i> LinkedIn</a></li>` : ''}
                        ${github ? `<li><a href="${esc(github)}" target="_blank" rel="noopener"><i class="fab fa-github"></i> GitHub</a></li>` : ''}
                    </ul>
                </div>
                ${email ? `<form id="contactForm" class="contact-form" data-email="${esc(email)}">
                    <div class="form-row">
                        <label class="field"><span>Name</span><input type="text" id="cf-name" autocomplete="name" required></label>
                        <label class="field"><span>Email</span><input type="email" id="cf-email" autocomplete="email" required></label>
                    </div>
                    <label class="field"><span>Subject</span><input type="text" id="cf-subject" required></label>
                    <label class="field"><span>Message</span><textarea id="cf-message" rows="4" required></textarea></label>
                    <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-paper-plane"></i> Send message</button>
                    <p class="form-hint">Opens your email app with the message filled in.</p>
                </form>` : ''}
            </div>
        </div>`;
    }

    function renderFooter(data) {
        const p = data.profile || {};
        const email = String(p.email || '').trim();
        const github = safeUrl(p.github);
        const linkedin = safeUrl(p.linkedin);
        document.getElementById('footerCopy').textContent = `© ${new Date().getFullYear()} ${p.name || ''} · Built with vanilla JS — and a little AI.`;
        document.getElementById('footerSocial').innerHTML = [
            email ? `<a href="mailto:${esc(email)}" aria-label="Email"><i class="fas fa-envelope"></i></a>` : '',
            linkedin ? `<a href="${esc(linkedin)}" aria-label="LinkedIn" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>` : '',
            github ? `<a href="${esc(github)}" aria-label="GitHub" target="_blank" rel="noopener"><i class="fab fa-github"></i></a>` : ''
        ].join('');
    }

    const SECTION_RENDERERS = {
        about: renderAbout,
        skills: renderSkills,
        experience: renderExperience,
        projects: renderProjects,
        education: renderEducation,
        contact: renderContact
    };

    function renderSite(data) {
        const sections = data.sections || {};
        const shown = Object.keys(SECTION_RENDERERS)
            .filter((key) => sections[key]?.show !== false)
            .map((key) => ({ key, cfg: sections[key] || {} }));

        applyTheme(data.theme);
        applyMeta(data.meta);
        renderNav(data, shown);
        renderHero(data);
        renderMarquee(data);

        Object.keys(SECTION_RENDERERS).forEach((key) => {
            const el = document.getElementById(key);
            const at = shown.findIndex((s) => s.key === key);
            if (at === -1) {
                el.remove();
                return;
            }
            el.innerHTML = SECTION_RENDERERS[key](data, shown[at].cfg, at + 1);
        });

        renderFooter(data);
    }

    function startPageScript() {
        const script = document.createElement('script');
        script.src = 'script.js';
        document.body.appendChild(script);
    }

    function showPreviewBanner() {
        const bar = document.createElement('div');
        bar.className = 'preview-banner';
        bar.innerHTML = '<i class="fas fa-eye"></i> Preview of your unpublished draft <a href="admin/">Back to admin</a>';
        document.body.prepend(bar);
    }

    loadContent()
        .then(({ data, preview }) => {
            window.SITE_DATA = data;
            renderSite(data);
            if (preview) showPreviewBanner();
        })
        .catch((err) => {
            console.error('Could not load portfolio content:', err);
            document.getElementById('main').insertAdjacentHTML('afterbegin',
                '<p class="load-error">Sorry — this page could not load its content. Please refresh.</p>');
        })
        .finally(startPageScript);
})();
