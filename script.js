// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link, .nav-cta');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
    });
});

// Scroll progress bar + back-to-top visibility
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    backToTop.classList.toggle('visible', scrollTop > 500);
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Active navigation link on scroll
const sections = document.querySelectorAll('section[id]');

function scrollActive() {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 100;
        const sectionId = current.getAttribute('id');
        const navLink = document.querySelector('.nav-menu a[href*=' + sectionId + ']');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink?.classList.add('active');
        } else {
            navLink?.classList.remove('active');
        }
    });
}

window.addEventListener('scroll', scrollActive);

// Intersection Observer for scroll-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) translateX(0)';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.skill-category, .project-card, .education-card, .featured-card, .contact-item').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${(index % 4) * 0.08}s, transform 0.6s ease ${(index % 4) * 0.08}s`;
    observer.observe(card);
});

document.querySelectorAll('.timeline-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-30px)';
    item.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
    observer.observe(item);
});

// Rotating typing effect for hero roles
const roles = [
    'agentic AI systems',
    'RAG pipelines',
    'LLM-powered products',
    'document intelligence',
    'production AI on AWS'
];
const typedRole = document.getElementById('typed-role');
let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
    const current = roles[roleIndex];

    if (!deleting) {
        typedRole.textContent = current.slice(0, ++charIndex);
        if (charIndex === current.length) {
            deleting = true;
            setTimeout(typeLoop, 1800);
            return;
        }
        setTimeout(typeLoop, 65);
    } else {
        typedRole.textContent = current.slice(0, --charIndex);
        if (charIndex === 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
        }
        setTimeout(typeLoop, 32);
    }
}

window.addEventListener('load', () => {
    typedRole.textContent = '';
    charIndex = 0;
    setTimeout(typeLoop, 600);
});

// Counter animation for stats
const statNumbers = document.querySelectorAll('.stat-item h3');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const number = parseFloat(target.dataset.count || target.textContent);
            const suffix = target.dataset.suffix || '';

            let current = 0;
            const increment = Math.max(number / 40, 0.5);

            const updateCounter = () => {
                current += increment;
                if (current < number) {
                    target.textContent = Math.floor(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    target.textContent = number + suffix;
                }
            };

            updateCounter();
            statsObserver.unobserve(target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => statsObserver.observe(stat));

// Business / Technical view toggles on featured project cards
document.querySelectorAll('.featured-card').forEach(card => {
    const buttons = card.querySelectorAll('.view-btn');
    const panes = card.querySelectorAll('.view-pane');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            buttons.forEach(b => b.classList.toggle('active', b === btn));
            panes.forEach(p => p.classList.toggle('active', p.dataset.pane === view));
        });
    });
});

// Contact form → opens the visitor's email client pre-filled
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const subject = document.getElementById('cf-subject').value.trim();
    const message = document.getElementById('cf-message').value.trim();

    const body = `${message}\n\n— ${name} (${email})`;
    const mailto = `mailto:prajapatipareshkumar1032@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    contactForm.reset();
});

// ============ Motion preferences ============
const MOTION_OK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ Cursor spotlight on the hero grid ============
(function initHeroSpotlight() {
    const hero = document.querySelector('.hero');
    const spotlight = document.getElementById('heroSpotlight');
    if (!hero || !spotlight || !MOTION_OK || !FINE_POINTER) return;

    let pending = false;
    hero.addEventListener('mousemove', (e) => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            const rect = hero.getBoundingClientRect();
            spotlight.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px)`;
            pending = false;
        });
    });
})();

// ============ Magnetic hover on buttons ============
(function initMagneticButtons() {
    if (!MOTION_OK || !FINE_POINTER) return;

    document.querySelectorAll('.btn').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            const pull = 0.18;
            const x = Math.max(-6, Math.min(6, dx * pull));
            const y = Math.max(-4, Math.min(4, dy * pull));
            btn.style.transform = `translate(${x}px, ${y - 2}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
})();

// ============ Subtle 3D tilt on cards ============
(function initCardTilt() {
    if (!MOTION_OK || !FINE_POINTER) return;

    document.querySelectorAll('.project-card, .skill-category').forEach((card) => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.12s ease-out';
        });
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(700px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.35s ease';
            card.style.transform = '';
        });
    });
})();

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
<span class="t-muted">  + ClauseLens, AskHR, MatchMind, QueryMind</span>
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

// Console message for developers
console.log('%c👋 Welcome to Paresh Prajapati\'s Portfolio!', 'color: #818cf8; font-size: 20px; font-weight: bold;');
console.log('%cPsst — press ~ for a surprise. Interested in the code? Reach out!', 'color: #a78bfa; font-size: 14px;');
