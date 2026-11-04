// ============ Motion & pointer preferences ============
// The admin's "animations" switch turns motion off the same way the OS setting does
const MOTION_OK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    && !document.documentElement.classList.contains('no-motion');
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Show Ctrl instead of ⌘ for keyboard hints off Apple devices
if (!IS_MAC) {
    document.querySelectorAll('.kbd-mod').forEach((el) => {
        el.textContent = 'Ctrl ';
    });
}

// ============ Navigation ============
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

function setMenuOpen(open) {
    navMenu.classList.toggle('active', open);
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

hamburger.addEventListener('click', () => setMenuOpen(!navMenu.classList.contains('active')));
navMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-shell')) setMenuOpen(false);
});

// ============ Scroll: progress bar, nav shadow, back-to-top, active link ============
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');
const navSections = [...document.querySelectorAll('.nav-menu .nav-link')]
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(({ section }) => section);

let scrollTicking = false;
function onScroll() {
    scrollTicking = false;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    backToTop.classList.toggle('visible', scrollTop > 600);
    navbar.classList.toggle('scrolled', scrollTop > 20);

    const probe = scrollTop + window.innerHeight * 0.35;
    navSections.forEach(({ link, section }) => {
        const inView = probe >= section.offsetTop && probe < section.offsetTop + section.offsetHeight;
        link.classList.toggle('active', inView);
    });
}

window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(onScroll);
}, { passive: true });
onScroll();

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: MOTION_OK ? 'smooth' : 'auto' });
});

function scrollToTarget(selector) {
    const target = document.querySelector(selector);
    target?.scrollIntoView({ behavior: MOTION_OK ? 'smooth' : 'auto', block: 'start' });
}

// ============ Theme ============
const themeToggle = document.getElementById('themeToggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function currentTheme() {
    return document.documentElement.dataset.theme || (systemDark.matches ? 'dark' : 'light');
}

function updateThemeLabel() {
    themeToggle.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
        localStorage.setItem('theme', next);
    } catch (e) {
        // Storage blocked (private mode): the choice lasts for this visit only
    }
    updateThemeLabel();
}

themeToggle.addEventListener('click', toggleTheme);
systemDark.addEventListener('change', updateThemeLabel);
updateThemeLabel();

// ============ Scroll reveal ============
const revealEls = document.querySelectorAll('.reveal');

// Stagger tiles that share a grid so a row arrives as a ripple, not a block
document.querySelectorAll('.bento, .featured-list, .timeline, .edu-list').forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty('--delay', `${(i % 4) * 70}ms`));
});

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
} else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
}

// ============ Hero stat counters ============
document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (!MOTION_OK || !Number.isFinite(target)) return;

    const duration = 1100;
    const start = performance.now() + 500;
    el.textContent = '0' + suffix;
    (function tick(now) {
        const t = Math.min(Math.max((now - start) / duration, 0), 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (t < 1) requestAnimationFrame(tick);
    })(performance.now());
});

// ============ Cursor glow on tiles and project cards ============
if (FINE_POINTER && !document.documentElement.classList.contains('no-glow')) {
    document.querySelectorAll('.tile, .featured-card').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        });
    });
}

// ============ Rotating role titles under the name ============
(function initRoles() {
    const roleEl = document.getElementById('heroRole');
    const bars = [...document.querySelectorAll('.role-bars li')];
    if (!roleEl || bars.length < 2 || !MOTION_OK) return;

    const HOLD_MS = 3200; // matches the bar fill animation in styles.css
    let index = 0;
    setInterval(() => {
        if (document.hidden) return;
        bars[index].classList.remove('active');
        index = (index + 1) % bars.length;
        bars[index].classList.add('active');
        roleEl.classList.remove('swap');
        void roleEl.offsetWidth; // restart the swap animation
        roleEl.textContent = bars[index].dataset.role;
        roleEl.classList.add('swap');
    }, HOLD_MS);
})();

// ============ Statement: words light up as the section scrolls past ============
(function initStatement() {
    const section = document.getElementById('statement');
    const words = [...document.querySelectorAll('.statement-title .sw')];
    if (!section || !words.length) return;
    if (!MOTION_OK) {
        words.forEach((w) => w.classList.add('lit'));
        return;
    }

    let ticking = false;
    function update() {
        ticking = false;
        const rect = section.getBoundingClientRect();
        // 0 when the section's top reaches 85% of the viewport, 1 by 35%
        const progress = Math.min(Math.max((window.innerHeight * 0.85 - rect.top) / (window.innerHeight * 0.5), 0), 1);
        const lit = Math.round(progress * words.length);
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    update();
})();

// ============ 3D tilt on cards ============
if (FINE_POINTER && MOTION_OK) {
    document.querySelectorAll('.tilt, .tile, .featured-card').forEach((card) => {
        const strength = card.classList.contains('featured-card') ? 3 : 6;
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty('--rx', `${(-py * strength).toFixed(2)}deg`);
            card.style.setProperty('--ry', `${(px * strength).toFixed(2)}deg`);
        });
        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });
}

// ============ Section rail (wide screens) ============
(function initRail() {
    const rail = document.getElementById('scrollRail');
    if (!rail || !navSections.length) return;
    rail.innerHTML = '<span class="rail-track"><span class="rail-fill"></span></span>';
    const fill = rail.querySelector('.rail-fill');
    const marks = navSections.map(({ link, section }) => {
        const mark = document.createElement('a');
        mark.className = 'rail-mark';
        mark.href = link.getAttribute('href');
        mark.innerHTML = '<span class="rail-label"></span>';
        mark.querySelector('.rail-label').textContent = link.textContent;
        rail.appendChild(mark);
        return { mark, section };
    });

    function place() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        marks.forEach(({ mark, section }) => {
            mark.style.top = `${Math.min(Math.max(section.offsetTop / (max + window.innerHeight), 0), 1) * 100}%`;
        });
    }

    let ticking = false;
    function update() {
        ticking = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        fill.style.transform = `scaleY(${max > 0 ? window.scrollY / max : 0})`;
        const probe = window.scrollY + window.innerHeight * 0.35;
        marks.forEach(({ mark, section }) => {
            mark.classList.toggle('active', probe >= section.offsetTop && probe < section.offsetTop + section.offsetHeight);
        });
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    window.addEventListener('resize', place);
    window.addEventListener('load', place);
    place();
    update();
})();

// ============ Tech marquee: duplicate the track so the loop is seamless ============
if (MOTION_OK) {
    document.querySelectorAll('.marquee-track').forEach((track) => {
        [...track.children].forEach((item) => {
            const clone = item.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
    });
}

// ============ Hero agent demo ============
// Scripted runs of the kind of pipeline each production platform uses,
// edited in the admin under Profile → Hero agent demo.
const DEMO_RUNS = (SITE_DATA.demo || [])
    .filter((run) => run && run.query)
    .map((run) => ({ ...run, steps: (run.steps || []).filter(Boolean).slice(0, 5) }));

const toSlug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(function initAgentDemo() {
    const demo = document.querySelector('.agent-demo');
    if (!demo || !DEMO_RUNS.length) return;
    const projectEl = document.getElementById('demoProject');
    const queryEl = document.getElementById('demoQuery');
    const answerEl = document.getElementById('demoAnswer');
    const stepEls = [...document.querySelectorAll('#demoSteps li')];

    function paint(run, { typed = run.query.length, doneUpTo = -1, active = -1, answer = false, timings = [] } = {}) {
        demo.dataset.tone = run.tone;
        projectEl.textContent = run.project;
        queryEl.textContent = run.query.slice(0, typed);
        stepEls.forEach((li, i) => {
            const label = (run.steps || [])[i] || '';
            li.hidden = !label;
            li.querySelector('.step-label').textContent = label;
            li.classList.toggle('done', i <= doneUpTo);
            li.classList.toggle('active', i === active);
            li.querySelector('.step-ms').textContent = i <= doneUpTo && timings[i] ? `${timings[i]}ms` : '';
        });
        answerEl.textContent = run.answer;
        answerEl.classList.toggle('visible', answer);
    }

    if (!MOTION_OK) {
        paint(DEMO_RUNS[0], { doneUpTo: stepEls.length - 1, answer: true, timings: [38, 212, 164, 9, 640] });
        return;
    }

    let heroVisible = true;
    new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
    }).observe(demo);
    const whenVisible = async () => {
        while (!heroVisible || document.hidden) await sleep(400);
    };

    (async function loop() {
        for (let r = 0; ; r = (r + 1) % DEMO_RUNS.length) {
            const run = DEMO_RUNS[r];
            const timings = (run.steps || []).map((_, i) => (i === run.steps.length - 1 ? 500 + Math.round(Math.random() * 400) : 20 + Math.round(Math.random() * 260)));
            await whenVisible();
            for (let c = 0; c <= run.query.length; c++) {
                paint(run, { typed: c });
                await sleep(28);
            }
            await sleep(350);
            for (let s = 0; s < run.steps.length; s++) {
                await whenVisible();
                paint(run, { doneUpTo: s - 1, active: s, timings });
                await sleep(520);
            }
            paint(run, { doneUpTo: run.steps.length - 1, answer: true, timings });
            await sleep(3600);
        }
    })();
})();

// ============ Business / technical view toggles ============
document.querySelectorAll('.featured-card').forEach((card) => {
    const buttons = card.querySelectorAll('.view-btn');
    const panes = card.querySelectorAll('.view-pane');

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            buttons.forEach((b) => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-selected', String(b === btn));
            });
            panes.forEach((p) => p.classList.toggle('active', p.dataset.pane === view));
        });
    });
});

// ============ Contact ============
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const subject = document.getElementById('cf-subject').value.trim();
    const message = document.getElementById('cf-message').value.trim();

    const body = `${message}\n\n— ${name} (${email})`;
    const mailto = `mailto:${contactForm.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    contactForm.reset();
});

const copyEmailBtn = document.getElementById('copyEmail');

async function copyEmail() {
    if (!copyEmailBtn) return;
    const email = copyEmailBtn.dataset.email;
    const label = copyEmailBtn.querySelector('.copy-label');
    try {
        await navigator.clipboard.writeText(email);
        label.textContent = 'Copied!';
    } catch (e) {
        // Clipboard unavailable (insecure context or denied): fall back to the mail app
        window.location.href = `mailto:${email}`;
        return;
    }
    setTimeout(() => {
        label.textContent = 'Copy';
    }, 2000);
}

copyEmailBtn?.addEventListener('click', copyEmail);

// ============ Command palette (⌘K / Ctrl+K) ============
const cmdkOverlay = document.getElementById('cmdk');
const cmdkInput = document.getElementById('cmdkInput');
const cmdkList = document.getElementById('cmdkList');
const cmdkOpenBtn = document.getElementById('cmdkOpen');
let cmdkActive = 0;
let cmdkVisible = [];
let cmdkReturnFocus = null;

const SECTION_ICONS = {
    about: 'fas fa-user',
    skills: 'fas fa-toolbox',
    experience: 'fas fa-briefcase',
    projects: 'fas fa-layer-group',
    education: 'fas fa-graduation-cap',
    contact: 'fas fa-envelope'
};

// Built from what was actually rendered, so hidden sections and projects
// edited in the admin never leave dead entries behind.
const CMDK_ITEMS = [
    ...[...document.querySelectorAll('.nav-menu .nav-link')].map((link) => {
        const id = link.getAttribute('href').slice(1);
        return { group: 'Sections', label: link.textContent, icon: SECTION_ICONS[id] || 'fas fa-hashtag', keywords: id, run: () => scrollToTarget(`#${id}`) };
    }),
    ...[...(SITE_DATA.projects?.featured || []), ...(SITE_DATA.projects?.more || [])]
        .filter((pr) => document.getElementById(toSlug(pr.id || pr.name)))
        .map((pr) => ({ group: 'Projects', label: pr.name, hint: pr.tagline, icon: pr.icon || 'fas fa-folder', run: () => scrollToTarget(`#${toSlug(pr.id || pr.name)}`) })),
    { group: 'Actions', label: 'Ask my AI assistant', icon: 'fas fa-wand-magic-sparkles', keywords: 'chat bot question', run: () => openChat() },
    ...(document.querySelector('[data-resume]') ? [{ group: 'Actions', label: 'Download resume', icon: 'fas fa-file-arrow-down', keywords: 'cv pdf', run: () => document.querySelector('[data-resume]').click() }] : []),
    ...(copyEmailBtn ? [{ group: 'Actions', label: 'Copy email address', icon: 'fas fa-copy', keywords: 'contact mail', run: () => copyEmail() }] : []),
    { group: 'Actions', label: 'Switch light / dark theme', icon: 'fas fa-circle-half-stroke', keywords: 'theme mode colour color', run: () => toggleTheme() },
    { group: 'Actions', label: 'Open terminal', icon: 'fas fa-terminal', keywords: 'shell easter egg', run: () => openTerminal() },
    ...(SITE_DATA.profile?.github ? [{ group: 'Links', label: 'GitHub', icon: 'fab fa-github', run: () => window.open(SITE_DATA.profile.github, '_blank', 'noopener') }] : []),
    ...(SITE_DATA.profile?.linkedin ? [{ group: 'Links', label: 'LinkedIn', icon: 'fab fa-linkedin-in', run: () => window.open(SITE_DATA.profile.linkedin, '_blank', 'noopener') }] : [])
];

function renderCmdk() {
    const q = cmdkInput.value.trim().toLowerCase();
    cmdkVisible = CMDK_ITEMS.filter((item) => !q || `${item.label} ${item.hint || ''} ${item.keywords || ''} ${item.group}`.toLowerCase().includes(q));
    cmdkActive = Math.min(cmdkActive, Math.max(cmdkVisible.length - 1, 0));
    cmdkList.innerHTML = '';

    if (!cmdkVisible.length) {
        cmdkList.innerHTML = '<li class="cmdk-empty">No matches — try “projects” or “resume”.</li>';
        cmdkInput.removeAttribute('aria-activedescendant');
        return;
    }

    let lastGroup = '';
    cmdkVisible.forEach((item, i) => {
        if (item.group !== lastGroup) {
            lastGroup = item.group;
            const heading = document.createElement('li');
            heading.className = 'cmdk-group';
            heading.setAttribute('role', 'presentation');
            heading.textContent = item.group;
            cmdkList.appendChild(heading);
        }
        const li = document.createElement('li');
        li.className = 'cmdk-item' + (i === cmdkActive ? ' active' : '');
        li.id = `cmdk-item-${i}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === cmdkActive));
        li.innerHTML = `<i class="${item.icon.replace(/[^a-z0-9 -]/gi, '')}"></i><span></span>${item.hint ? '<span class="cmdk-hint"></span>' : ''}`;
        li.querySelector('span').textContent = item.label;
        if (item.hint) li.querySelector('.cmdk-hint').textContent = item.hint;
        li.addEventListener('mousemove', () => {
            if (cmdkActive !== i) {
                cmdkActive = i;
                renderCmdk();
            }
        });
        li.addEventListener('click', () => runCmdk(i));
        cmdkList.appendChild(li);
    });
    cmdkInput.setAttribute('aria-activedescendant', `cmdk-item-${cmdkActive}`);
    document.getElementById(`cmdk-item-${cmdkActive}`)?.scrollIntoView({ block: 'nearest' });
}

function openCmdk() {
    cmdkReturnFocus = document.activeElement;
    cmdkOverlay.hidden = false;
    cmdkInput.value = '';
    cmdkActive = 0;
    renderCmdk();
    cmdkInput.focus();
}

function closeCmdk() {
    cmdkOverlay.hidden = true;
    cmdkReturnFocus?.focus?.();
}

function runCmdk(index) {
    const item = cmdkVisible[index];
    if (!item) return;
    closeCmdk();
    item.run();
}

cmdkOpenBtn.addEventListener('click', openCmdk);
cmdkInput.addEventListener('input', () => {
    cmdkActive = 0;
    renderCmdk();
});
cmdkInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        cmdkActive = (cmdkActive + step + cmdkVisible.length) % Math.max(cmdkVisible.length, 1);
        renderCmdk();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        runCmdk(cmdkActive);
    } else if (e.key === 'Escape') {
        closeCmdk();
    } else if (e.key === 'Tab') {
        e.preventDefault(); // keep focus inside the dialog
    }
});
cmdkOverlay.addEventListener('click', (e) => {
    if (e.target === cmdkOverlay) closeCmdk();
});
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (cmdkOverlay.hidden) openCmdk();
        else closeCmdk();
    }
});

// ============ Terminal Easter Egg ============
const terminalOverlay = document.getElementById('terminal-overlay');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const terminalClose = document.getElementById('terminal-close');
const heroTerminal = document.getElementById('heroTerminal');

const TERMINAL_BANNER = `<span class="t-accent">Welcome to Paresh's portfolio shell</span> <span class="t-muted">(v1.0.0)</span>
<span class="t-muted">Type</span> <span class="t-cmd">help</span> <span class="t-muted">to see available commands.</span>`;

const terminalHistory = [];
let terminalHistoryIndex = -1;

function terminalPrint(html, className = '') {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.innerHTML = html;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

async function terminalPrintStaged(lines, delay = 340) {
    terminalInput.disabled = true;
    for (const line of lines) {
        terminalPrint(line);
        await sleep(delay);
    }
    terminalInput.disabled = false;
    terminalInput.focus();
}

const TERMINAL_COMMANDS = {
    help() {
        terminalPrint(`<span class="t-cmd">help</span>          <span class="t-muted">show this list</span>
<span class="t-cmd">whoami</span>        <span class="t-muted">who is paresh?</span>
<span class="t-cmd">skills</span>        <span class="t-muted">tech stack</span>
<span class="t-cmd">projects</span>      <span class="t-muted">what he's shipped</span>
<span class="t-cmd">contact</span>       <span class="t-muted">how to reach him</span>
<span class="t-cmd">resume</span>        <span class="t-muted">download resume.pdf</span>
<span class="t-cmd">sudo hire-me</span>  <span class="t-muted">(try it)</span>
<span class="t-cmd">clear</span> / <span class="t-cmd">exit</span>  <span class="t-muted">housekeeping</span>`);
    },
    whoami() {
        terminalPrint(`<span class="t-ok">Paresh Prajapati</span> — AI/ML Engineer · Generative AI Specialist
<span class="t-muted">3+ years shipping production GenAI: agentic systems, RAG pipelines,
document intelligence — on AWS with LangChain/LangGraph + FastAPI.</span>`);
    },
    skills() {
        terminalPrint(`<span class="t-accent">genai/</span>     LLMs · LangChain · LangGraph · tool-calling agents · text-to-SQL
<span class="t-accent">rag/</span>       hybrid retrieval · Qdrant · OpenSearch · Docling
<span class="t-accent">backend/</span>   Python · FastAPI · Django · Flask · SSE streaming · ARQ
<span class="t-accent">cloud/</span>     AWS Bedrock · ECS Fargate · Textract · Redis · MySQL · MongoDB
<span class="t-accent">llmops/</span>    evals · OpenTelemetry tracing · token &amp; cost tracking
<span class="t-accent">ml/</span>        Pandas · NumPy · TensorFlow · Scikit-learn · Hugging Face · QLoRA`);
    },
    projects() {
        terminalPrint(`<span class="t-ok">●</span> <span class="t-accent">CaterNest</span>    AI catering marketplace — LangGraph agent, Bedrock, OpenSearch
<span class="t-ok">●</span> <span class="t-accent">PolicyGuard</span>  school compliance &amp; safeguarding — hybrid RAG, async AI jobs
<span class="t-ok">●</span> <span class="t-accent">IsleWay</span>      AI travel companion — FastAPI agentic chat
<span class="t-muted">  + FinScribe, CarePilot, AthleteIQ, MenuForge, ClauseLens, AskHR, MatchMind, QueryMind</span>
<span class="t-muted">Scroll to the Projects section for the full deep-dives.</span>`);
    },
    contact() {
        terminalPrint(`<span class="t-muted">email:</span>    <a href="mailto:prajapatipareshkumar1032@gmail.com">prajapatipareshkumar1032@gmail.com</a>
<span class="t-muted">phone:</span>    <a href="tel:+918849581032">+91 8849581032</a>
<span class="t-muted">github:</span>   <a href="https://github.com/paresh-112" target="_blank" rel="noopener">github.com/paresh-112</a>
<span class="t-muted">linkedin:</span> <a href="https://www.linkedin.com/in/paresh-prajapati-00a5b7243" target="_blank" rel="noopener">linkedin.com/in/paresh-prajapati-00a5b7243</a>`);
    },
    resume() {
        terminalPrint(`<span class="t-muted">Downloading</span> <span class="t-cmd">Paresh_Prajapati_Resume.pdf</span> <span class="t-ok">✔</span>`);
        const link = document.createElement('a');
        link.href = 'Paresh_Prajapati_Resume.pdf';
        link.download = 'Paresh_Prajapati_Resume.pdf';
        link.click();
    },
    ls() {
        terminalPrint(`<span class="t-accent">projects/</span>  <span class="t-accent">skills/</span>  resume.pdf  <span class="t-muted">secrets/ (nice try)</span>`);
    },
    clear() {
        terminalOutput.innerHTML = '';
    },
    exit() {
        closeTerminal();
    }
};

async function sudoHireMe() {
    await terminalPrintStaged([
        `<span class="t-muted">[sudo] password for recruiter:</span> ********`,
        `<span class="t-ok">Access granted ✔</span>`,
        `<span class="t-muted">Initiating hiring sequence…</span>`,
        `<span class="t-ok">✔</span> Production AI experience: <span class="t-ok">3+ years found</span>`,
        `<span class="t-ok">✔</span> Shipped platforms: <span class="t-ok">3 in production</span>`,
        `<span class="t-ok">✔</span> Enthusiasm check: <span class="t-ok">PASSED</span>`,
        `→ Opening secure channel: <a href="mailto:prajapatipareshkumar1032@gmail.com">prajapatipareshkumar1032@gmail.com</a> 🚀`
    ]);
}

function runTerminalCommand(raw) {
    const input = raw.trim();
    if (!input) return;

    terminalPrint(`<span class="t-ok">➜ ~</span> <span class="t-cmd">${input.replace(/</g, '&lt;')}</span>`);
    terminalHistory.push(input);
    terminalHistoryIndex = terminalHistory.length;

    const cmd = input.toLowerCase().replace(/\s+/g, ' ');

    if (cmd === 'sudo hire-me' || cmd === 'sudo hire me' || cmd === 'hire-me' || cmd === 'hire me') {
        sudoHireMe();
        return;
    }
    if (cmd.startsWith('sudo')) {
        terminalPrint(`<span class="t-muted">recruiter is not in the sudoers file. This incident will be reported… to Paresh. Try</span> <span class="t-cmd">sudo hire-me</span>`);
        return;
    }
    if (TERMINAL_COMMANDS[cmd]) {
        TERMINAL_COMMANDS[cmd]();
        return;
    }
    terminalPrint(`<span class="t-muted">command not found:</span> ${cmd.replace(/</g, '&lt;')} <span class="t-muted">— type</span> <span class="t-cmd">help</span>`);
}

function openTerminal() {
    terminalOverlay.classList.remove('hidden');
    terminalOverlay.setAttribute('aria-hidden', 'false');
    if (!terminalOutput.innerHTML) {
        terminalPrint(TERMINAL_BANNER);
    }
    terminalInput.focus();
}

function closeTerminal() {
    terminalOverlay.classList.add('hidden');
    terminalOverlay.setAttribute('aria-hidden', 'true');
}

heroTerminal?.addEventListener('click', openTerminal);
heroTerminal?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openTerminal();
    }
});
terminalClose.addEventListener('click', closeTerminal);
terminalOverlay.addEventListener('click', (e) => {
    if (e.target === terminalOverlay) closeTerminal();
});

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        runTerminalCommand(terminalInput.value);
        terminalInput.value = '';
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (terminalHistoryIndex > 0) {
            terminalHistoryIndex--;
            terminalInput.value = terminalHistory[terminalHistoryIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (terminalHistoryIndex < terminalHistory.length - 1) {
            terminalHistoryIndex++;
            terminalInput.value = terminalHistory[terminalHistoryIndex];
        } else {
            terminalHistoryIndex = terminalHistory.length;
            terminalInput.value = '';
        }
    }
});

document.addEventListener('keydown', (e) => {
    const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if ((e.key === '`' || e.key === '~') && !typing) {
        e.preventDefault();
        openTerminal();
    } else if (e.key === 'Escape' && !terminalOverlay.classList.contains('hidden')) {
        closeTerminal();
    }
});

// ============ AI Chatbot ============
const chatToggle = document.getElementById('chat-toggle');
const closeChat = document.getElementById('close-chat');
const clearChat = document.getElementById('clear-chat');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const chatMessages = document.getElementById('chat-messages');
const chatSuggestions = document.getElementById('chat-suggestions');
let sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
let isSending = false;

const WELCOME_HTML = `<div class="message incoming"><p>Hi! I'm Paresh's AI assistant. Ask me anything about his skills, projects, or whether he'd fit your role!</p></div>`;
const DEFAULT_PLACEHOLDER = 'Ask about skills, projects, fit...';

const scrollChatToBottom = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Toggle Chat Window
chatToggle.addEventListener('click', () => {
    chatContainer.classList.toggle('hidden');
    if (!chatContainer.classList.contains('hidden')) {
        chatInput.focus();
    }
});

closeChat.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
});

// Clear conversation (new session)
clearChat.addEventListener('click', () => {
    chatMessages.innerHTML = WELCOME_HTML;
    sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
    chatSuggestions.style.display = '';
});

// Suggested question chips
chatSuggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.textContent;
        sendMessage();
    });
});

// ---- Draggable chat window (desktop) ----
(function makeChatDraggable() {
    const header = chatContainer.querySelector('.chat-header');
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    const clampPosition = (left, top) => {
        const rect = chatContainer.getBoundingClientRect();
        return {
            left: Math.min(Math.max(left, 8), Math.max(8, window.innerWidth - rect.width - 8)),
            top: Math.min(Math.max(top, 8), Math.max(8, window.innerHeight - rect.height - 8))
        };
    };

    const setPosition = (left, top) => {
        chatContainer.style.position = 'fixed';
        chatContainer.style.left = left + 'px';
        chatContainer.style.top = top + 'px';
        chatContainer.style.right = 'auto';
        chatContainer.style.bottom = 'auto';
    };

    const resetPosition = () => {
        chatContainer.style.position = '';
        chatContainer.style.left = '';
        chatContainer.style.top = '';
        chatContainer.style.right = '';
        chatContainer.style.bottom = '';
    };

    header.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.chat-action')) return;
        if (window.innerWidth <= 768) return;

        dragging = true;
        const rect = chatContainer.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        chatContainer.classList.add('dragging');
        try {
            header.setPointerCapture(e.pointerId);
        } catch (err) {
            // Synthetic or already-released pointers can't be captured — drag still works
        }
    });

    header.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const { left, top } = clampPosition(startLeft + (e.clientX - startX), startTop + (e.clientY - startY));
        setPosition(left, top);
    });

    const endDrag = () => {
        dragging = false;
        chatContainer.classList.remove('dragging');
    };
    header.addEventListener('pointerup', endDrag);
    header.addEventListener('pointercancel', endDrag);

    // Double-click the header to snap back to the default corner
    header.addEventListener('dblclick', (e) => {
        if (e.target.closest('.chat-action')) return;
        resetPosition();
    });

    // Keep the window on-screen when the viewport shrinks
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            resetPosition();
            return;
        }
        if (chatContainer.style.position === 'fixed') {
            const rect = chatContainer.getBoundingClientRect();
            const { left, top } = clampPosition(rect.left, rect.top);
            setPosition(left, top);
        }
    });
})();

// Assistant replies are LLM output shaped by visitor input, so the rendered
// HTML is always sanitized before it reaches the DOM. If either library failed
// to load we fail closed and render as plain text rather than trusting it.
function renderMarkdown(text) {
    const raw = String(text ?? '');
    if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
        const p = document.createElement('p');
        p.textContent = raw;
        return p.outerHTML;
    }
    return DOMPurify.sanitize(marked.parse(raw, { gfm: true, breaks: true }));
}

// Add Message to UI
function addMessage(text, isOutgoing = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;

    if (isOutgoing) {
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
    } else {
        messageDiv.innerHTML = renderMarkdown(text);
    }

    chatMessages.appendChild(messageDiv);
    scrollChatToBottom();
}

// ---- Agent trace panel: live view of the RAG pipeline per reply ----
const TRACE_ICONS = {
    analyze: 'fa-wand-magic-sparkles',
    retrieve: 'fa-magnifying-glass',
    generate: 'fa-pen-nib'
};

function formatMs(ms) {
    if (typeof ms !== 'number') return '';
    return ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : ms + 'ms';
}

function createAgentTrace() {
    const root = document.createElement('div');
    root.className = 'agent-trace';
    root.innerHTML = '<button class="trace-summary" type="button" title="Show pipeline steps"></button><div class="trace-steps"></div>';
    const summaryBtn = root.querySelector('.trace-summary');
    const stepsWrap = root.querySelector('.trace-steps');
    const stepEls = {};

    summaryBtn.addEventListener('click', () => root.classList.toggle('expanded'));

    // Local pipeline steps finish in ~1-5ms; a short reveal gap keeps them readable.
    const queue = [];
    let draining = false;
    function drainQueue() {
        if (draining) return;
        draining = true;
        (function next() {
            const task = queue.shift();
            if (!task) {
                draining = false;
                return;
            }
            task();
            setTimeout(next, 220);
        })();
    }
    const enqueue = (task) => {
        queue.push(task);
        drainQueue();
    };

    function renderStart(evt) {
        root.classList.add('active');
        const icon = TRACE_ICONS[evt.step] || 'fa-gear';
        const step = document.createElement('div');
        step.className = 'trace-step';
        step.innerHTML = `
            <div class="trace-step-row">
                <span class="trace-icon"><i class="fas fa-circle-notch fa-spin"></i></span>
                <span class="trace-label">${evt.label || evt.step}</span>
                <span class="trace-ms"></span>
            </div>`;
        step.dataset.icon = icon;
        stepEls[evt.step] = step;
        stepsWrap.appendChild(step);
        scrollChatToBottom();
    }

    function renderDone(evt) {
        if (!stepEls[evt.step]) {
            renderStart(evt);
        }
        const step = stepEls[evt.step];
        step.classList.add('done');
        step.querySelector('.trace-icon').innerHTML = '<i class="fas fa-check"></i>';
        if (evt.label) step.querySelector('.trace-label').textContent = evt.label;
        step.querySelector('.trace-ms').textContent = formatMs(evt.ms);
        if (evt.detail && !step.querySelector('.trace-detail')) {
            const detail = document.createElement('span');
            detail.className = 'trace-detail';
            detail.textContent = evt.detail;
            step.querySelector('.trace-step-row').insertAdjacentElement('afterend', detail);
        }
        scrollChatToBottom();
    }

    function renderSummary(meta) {
        const seconds = (meta.total_ms / 1000).toFixed(1);
        const tokens = (meta.input_tokens || 0) + (meta.output_tokens || 0);
        const tokenLabel = `${meta.estimated ? '~' : ''}${tokens.toLocaleString()} tokens`;
        summaryBtn.innerHTML = `<i class="fas fa-bolt"></i> ${seconds}s · <i class="fas fa-layer-group"></i> ${meta.chunks} chunks · <i class="fas fa-coins"></i> ${tokenLabel} <i class="fas fa-chevron-down trace-chevron"></i>`;
        root.classList.add('done');
        scrollChatToBottom();
    }

    return {
        root,
        onTrace(evt) {
            enqueue(() => (evt.status === 'start' ? renderStart(evt) : renderDone(evt)));
        },
        onMeta(meta) {
            enqueue(() => renderSummary(meta));
        },
        // Buffered transports (Netlify) return the finished trace with real
        // timings — replay it so the deployed site shows the same pipeline.
        async playback(trace, meta) {
            for (const evt of trace || []) {
                renderStart(evt);
                await sleep(Math.min(Math.max(evt.ms || 0, 200), 850));
                renderDone(evt);
            }
            if (meta) renderSummary(meta);
        }
    };
}

async function typewriterRender(contentDiv, text) {
    const step = Math.max(6, Math.round(text.length / 90));
    for (let i = step; i < text.length; i += step) {
        contentDiv.innerHTML = renderMarkdown(text.slice(0, i));
        scrollChatToBottom();
        await sleep(12);
    }
    contentDiv.innerHTML = renderMarkdown(text);
    scrollChatToBottom();
}

// Re-rendering markdown on every token re-parses the whole reply and rebuilds
// the DOM — that flickers, drops any text the visitor has selected, and gets
// quadratically slower as the reply grows. Coalesce into at most one paint per
// STREAM_RENDER_MS so long structured answers stream smoothly.
const STREAM_RENDER_MS = 60;

function createStreamRenderer(contentDiv) {
    let scheduled = false;
    let lastPaint = 0;
    let latest = '';

    const paint = () => {
        scheduled = false;
        lastPaint = performance.now();
        contentDiv.innerHTML = renderMarkdown(latest);
        scrollChatToBottom();
    };

    return {
        update(text) {
            latest = text;
            if (scheduled) return;
            scheduled = true;
            const wait = Math.max(0, STREAM_RENDER_MS - (performance.now() - lastPaint));
            setTimeout(() => requestAnimationFrame(paint), wait);
        },
        // Guarantees the complete reply is painted once the stream ends, even
        // if a throttled render was still pending.
        finish() {
            if (latest) paint();
        }
    };
}

// Send Message to Backend with Real-Time LLM Token Streaming or JSON/Text Response
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    chatSuggestions.style.display = 'none';

    // Add user message
    addMessage(text, true);
    chatInput.value = '';

    // Create incoming AI message container: agent trace panel + typing indicator
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message incoming';
    const traceUI = createAgentTrace();
    messageDiv.appendChild(traceUI.root);
    const contentDiv = document.createElement('div');
    contentDiv.className = 'reply-body';
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollChatToBottom();

    // Resolve API endpoint based on environment (Netlify vs Local file)
    const apiEndpoint = window.location.protocol === 'file:'
        ? 'http://localhost:8000/api/chat'
        : '/api/chat';

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: text,
                session_id: sessionId
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error (${response.status})`);
        }

        const contentType = response.headers.get('content-type') || '';

        // If server returns standard JSON or plain text (e.g. Netlify Function)
        if (contentType.includes('application/json') || !contentType.includes('text/event-stream')) {
            const rawText = await response.text();
            let fullReply = '';
            let parsed = null;

            try {
                parsed = JSON.parse(rawText);
                if (parsed.error) {
                    throw new Error(parsed.error);
                }
                fullReply = parsed.reply || parsed.content || parsed.message || '';
            } catch (e) {
                if (parsed && parsed.error) throw e;
                // If not JSON, use raw plain text
                fullReply = rawText;
            }

            if (fullReply) {
                // Replay the pipeline trace (real timings from the backend)
                if (parsed && Array.isArray(parsed.trace) && parsed.trace.length) {
                    await traceUI.playback(parsed.trace, parsed.meta);
                }
                await typewriterRender(contentDiv, fullReply);
                return;
            }

            // response.text() above already drained the body, so falling
            // through to the SSE reader would throw. Report the real problem.
            throw new Error('The server returned an empty response.');
        }

        // Handle Real-Time SSE Stream (e.g. Express backend)
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const streamRenderer = createStreamRenderer(contentDiv);
        contentDiv.classList.add('streaming');
        let fullText = '';
        let isFirstChunk = true;
        let streamBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split('\n');
            // Keep the last potentially incomplete line in streamBuffer
            streamBuffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;

                const dataStr = trimmed.replace(/^data:\s*/, '').trim();
                if (dataStr === '[DONE]') break;

                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.trace) {
                        traceUI.onTrace(parsed.trace);
                    } else if (parsed.meta) {
                        traceUI.onMeta(parsed.meta);
                    } else if (parsed.content) {
                        if (isFirstChunk) {
                            fullText = '';
                            isFirstChunk = false;
                        }
                        fullText += parsed.content;
                        streamRenderer.update(fullText);
                    } else if (parsed.reply) {
                        fullText = parsed.reply;
                        streamRenderer.update(fullText);
                    }
                } catch (e) {
                    // Ignore parse error for non-JSON SSE metadata
                }
            }
        }

        streamRenderer.finish();

        if (!fullText) {
            contentDiv.innerHTML = "<p>Sorry, I didn't receive a response. Please try again.</p>";
        }
    } catch (error) {
        console.error('Chat Error:', error);
        contentDiv.innerHTML = `<p>Sorry, I'm having trouble connecting right now. Please try again later — or reach Paresh directly at <a href="mailto:prajapatipareshkumar1032@gmail.com">prajapatipareshkumar1032@gmail.com</a>.</p>`;
    } finally {
        contentDiv.classList.remove('streaming');
        isSending = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// ---- Voice input: record → Groq Whisper transcription → send ----
let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;
let recordingTimer = null;
let placeholderTimer = null;
const MAX_RECORDING_MS = 20000;

function flashPlaceholder(text, revertMs = 2600) {
    clearTimeout(placeholderTimer);
    chatInput.placeholder = text;
    if (revertMs > 0) {
        placeholderTimer = setTimeout(() => {
            chatInput.placeholder = DEFAULT_PLACEHOLDER;
        }, revertMs);
    }
}

function pickRecordingMime() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function setMicIcon(className) {
    micBtn.querySelector('i').className = className;
}

micBtn.addEventListener('click', async () => {
    if (micBtn.classList.contains('busy')) return;

    // Tap while recording = stop and transcribe
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        flashPlaceholder('Voice input is not supported in this browser.');
        return;
    }

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
        flashPlaceholder('Microphone access was denied.');
        return;
    }

    audioChunks = [];
    const mime = pickRecordingMime();
    mediaRecorder = new MediaRecorder(recordingStream, mime ? { mimeType: mime } : undefined);
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size) audioChunks.push(e.data);
    };
    mediaRecorder.onstop = handleRecordingStop;
    mediaRecorder.start();

    micBtn.classList.add('recording');
    setMicIcon('fas fa-stop');
    flashPlaceholder('Listening… tap ■ to stop', 0);
    recordingTimer = setTimeout(() => {
        if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    }, MAX_RECORDING_MS);
});

async function handleRecordingStop() {
    clearTimeout(recordingTimer);
    recordingStream?.getTracks().forEach((t) => t.stop());
    micBtn.classList.remove('recording');
    setMicIcon('fas fa-microphone');
    chatInput.placeholder = DEFAULT_PLACEHOLDER;

    const blob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
    if (blob.size < 2000) return; // too short to contain speech

    micBtn.classList.add('busy');
    setMicIcon('fas fa-circle-notch fa-spin');

    const endpoint = window.location.protocol === 'file:'
        ? 'http://localhost:8000/api/transcribe'
        : '/api/transcribe';

    try {
        const audio = await blobToBase64(blob);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio, mime: blob.type })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.text) {
            throw new Error(data.error || `Transcription failed (${response.status})`);
        }
        chatInput.value = data.text;
        sendMessage();
    } catch (error) {
        console.warn('Voice transcription error:', error);
        flashPlaceholder('Voice is unavailable right now — please type.');
    } finally {
        micBtn.classList.remove('busy');
        setMicIcon('fas fa-microphone');
    }
}

// Event Listeners for Input
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ---- Entry points into the chat from the page ----
function openChat(question) {
    chatContainer.classList.remove('hidden');
    if (question) {
        chatInput.value = question;
        sendMessage();
    } else {
        chatInput.focus();
    }
}

document.querySelectorAll('[data-open-chat]').forEach((btn) => btn.addEventListener('click', () => openChat()));
document.querySelectorAll('[data-ask]').forEach((chip) => chip.addEventListener('click', () => openChat(chip.dataset.ask)));

// Console message for developers
console.log('%c👋 Welcome to Paresh Prajapati\'s Portfolio!', 'color: #818cf8; font-size: 20px; font-weight: bold;');
console.log('%cPsst — press ~ for a surprise. Interested in the code? Reach out!', 'color: #a78bfa; font-size: 14px;');
