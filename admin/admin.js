// Portfolio admin panel.
//
// Edits a draft of the site content (data/content.json's shape). The draft is
// kept in this browser's localStorage, so nothing is lost on refresh, and the
// live site can show it with /?preview. Publish sends it to /api/admin/publish.
(() => {
    const API = '/api/admin';
    const TOKEN_KEY = 'portfolio-admin-token';
    const DRAFT_KEY = 'portfolio-admin-draft';

    const state = {
        token: null,
        session: null,
        published: null,
        draft: null,
        restoredDraft: false,
        refreshers: []
    };

    // ============ Small utilities ============
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const app = document.getElementById('app');

    function storage(kind) {
        try {
            return kind === 'session' ? window.sessionStorage : window.localStorage;
        } catch (e) {
            return null;
        }
    }

    // h('div', { class: 'x', onclick }, child, 'text') — children are nodes or text
    function h(tag, attrs = {}, ...children) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs || {})) {
            if (value === null || value === undefined || value === false) continue;
            if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
            else if (key === 'class') el.className = value;
            else if (key === 'text') el.textContent = value;
            else if (key in el && typeof value !== 'string') el[key] = value;
            else el.setAttribute(key, value === true ? '' : value);
        }
        for (const child of children.flat(Infinity)) {
            if (child === null || child === undefined || child === false) continue;
            el.append(child instanceof Node ? child : document.createTextNode(String(child)));
        }
        return el;
    }

    const icon = (cls) => h('i', { class: String(cls || '').replace(/[^a-z0-9 -]/gi, '') });

    function getAt(path) {
        return path.reduce((obj, key) => (obj == null ? undefined : obj[key]), state.draft);
    }

    function setAt(path, value) {
        let obj = state.draft;
        path.slice(0, -1).forEach((key, i) => {
            if (obj[key] == null) obj[key] = typeof path[i + 1] === 'number' ? [] : {};
            obj = obj[key];
        });
        obj[path[path.length - 1]] = value;
        changed();
    }

    const slugify = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    function toast(message, kind = '') {
        const el = h('div', { class: `toast ${kind}`, role: 'status' }, icon(kind === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-circle-check'), message);
        document.getElementById('toasts').append(el);
        setTimeout(() => el.remove(), 3600);
    }

    function timeAgo(iso) {
        if (!iso) return 'never';
        const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `${hours} h ago`;
        return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // WCAG contrast of a colour against white text
    function contrastWithWhite(hex) {
        const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
        if (!m) return 0;
        const [r, g, b] = [0, 2, 4].map((i) => {
            const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return 1.05 / (lum + 0.05);
    }

    // ============ API ============
    async function api(path, { method = 'GET', body } = {}) {
        const res = await fetch(`${API}/${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 && path !== 'login') {
            signOut(data.error || 'Your session has ended. Please sign in again.');
            throw new Error('signed-out');
        }
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        return data;
    }

    // ============ Draft & dirty state ============
    let saveTimer = null;

    function saveDraftNow() {
        clearTimeout(saveTimer);
        const store = storage('local');
        if (!store) return;
        try {
            if (same(state.draft, state.published)) store.removeItem(DRAFT_KEY);
            else store.setItem(DRAFT_KEY, JSON.stringify(state.draft));
        } catch (e) { /* quota or blocked: the draft just isn't kept across reloads */ }
    }

    function changed() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDraftNow, 300);
        updateDirtyUI();
        state.refreshers.forEach((fn) => fn());
    }

    const isDirty = () => state.draft && !same(state.draft, state.published);

    function updateDirtyUI() {
        const chip = document.getElementById('statusChip');
        const publishBtn = document.getElementById('topPublish');
        if (!chip) return;
        const dirty = isDirty();
        chip.classList.toggle('dirty', dirty);
        chip.textContent = dirty ? 'Unpublished changes' : 'All changes live';
        publishBtn.disabled = !dirty;
    }

    window.addEventListener('beforeunload', saveDraftNow);

    // ============ Field builders (bound to a path in the draft) ============
    function field(label, control, hint) {
        return h('div', { class: 'field' }, h('label', {}, label), control, hint ? h('span', { class: 'hint' }, hint) : null);
    }

    function textField(path, label, { hint, placeholder, type = 'text', rows, max } = {}) {
        const value = getAt(path) ?? '';
        const id = `f-${path.join('-')}`;
        const counter = max ? h('span', { class: 'counter' }) : null;
        const updateCounter = (v) => {
            if (!counter) return;
            counter.textContent = `${v.length} / ${max}`;
            counter.classList.toggle('over', v.length > max);
        };
        const input = rows
            ? h('textarea', { id, rows, placeholder })
            : h('input', { id, type, placeholder });
        input.value = value;
        updateCounter(String(value));
        input.addEventListener('input', () => {
            setAt(path, type === 'number' ? Number(input.value) : input.value);
            updateCounter(input.value);
        });
        const wrap = h('div', { class: 'field' }, h('label', { for: id }, label), input);
        if (hint) wrap.append(h('span', { class: 'hint' }, hint));
        if (counter) wrap.append(counter);
        return wrap;
    }

    // An array of strings, edited one per line
    function linesField(path, label, { hint, rows = 4, max } = {}) {
        const id = `f-${path.join('-')}`;
        const input = h('textarea', { id, rows });
        input.value = (getAt(path) || []).join('\n');
        input.addEventListener('input', () => {
            let lines = input.value.split('\n').map((l) => l.trim()).filter(Boolean);
            if (max) lines = lines.slice(0, max);
            setAt(path, lines);
        });
        return h('div', { class: 'field' }, h('label', { for: id }, label), input,
            h('span', { class: 'hint' }, hint || 'One per line.'));
    }

    // An array of strings, edited comma-separated
    function tagsField(path, label, hint = 'Separate with commas.') {
        const id = `f-${path.join('-')}`;
        const input = h('input', { id, type: 'text' });
        input.value = (getAt(path) || []).join(', ');
        input.addEventListener('input', () => {
            setAt(path, input.value.split(',').map((t) => t.trim()).filter(Boolean));
        });
        return h('div', { class: 'field' }, h('label', { for: id }, label), input, h('span', { class: 'hint' }, hint));
    }

    function toggleField(path, title, description) {
        const input = h('input', { type: 'checkbox', role: 'switch', 'aria-label': title });
        input.checked = getAt(path) !== false;
        input.addEventListener('change', () => setAt(path, input.checked));
        return h('div', { class: 'toggle' },
            h('div', { class: 'toggle-text' }, h('strong', {}, title), description ? h('span', {}, description) : null),
            h('label', { class: 'switch' }, input, h('span', { class: 'track' })));
    }

    function selectField(path, label, options, hint) {
        const id = `f-${path.join('-')}`;
        const select = h('select', { id }, options.map(([value, text]) => h('option', { value }, text)));
        select.value = getAt(path) ?? options[0][0];
        select.addEventListener('change', () => setAt(path, select.value));
        const wrap = h('div', { class: 'field' }, h('label', { for: id }, label), select);
        if (hint) wrap.append(h('span', { class: 'hint' }, hint));
        return wrap;
    }

    const TONES = [['indigo', 'Primary colour'], ['teal', 'Secondary colour'], ['amber', 'Warm amber']];
    const toneField = (path) => selectField(path, 'Accent', TONES);

    function iconField(path, label = 'Icon') {
        const id = `f-${path.join('-')}`;
        const preview = h('span', { class: 'icon-preview' }, icon(getAt(path)));
        const input = h('input', { id, type: 'text', placeholder: 'fas fa-robot' });
        input.value = getAt(path) || '';
        input.addEventListener('input', () => {
            setAt(path, input.value.trim());
            preview.replaceChildren(icon(input.value));
        });
        return h('div', { class: 'field' }, h('label', { for: id }, label),
            h('div', { class: 'icon-input' }, preview, input),
            h('span', { class: 'hint' }, 'A Font Awesome class. Browse icons at ',
                h('a', { href: 'https://fontawesome.com/search?o=r&m=free', target: '_blank', rel: 'noopener' }, 'fontawesome.com'), '.'));
    }

    // A list of objects, each in a collapsible card with move and remove
    function repeater(path, { titleOf, fields, create, addLabel, empty }) {
        const wrap = h('div', { class: 'repeater' });
        const openSet = new Set();

        function draw() {
            const items = getAt(path) || [];
            wrap.replaceChildren();
            if (!items.length && empty) wrap.append(h('p', { class: 'hint' }, empty));

            items.forEach((item, i) => {
                const itemPath = [...path, i];
                const title = h('span', { class: 'rep-title' }, titleOf(item, i) || `Item ${i + 1}`);
                const card = h('div', { class: `rep-item${openSet.has(i) ? ' open' : ''}` });
                const move = (delta) => {
                    const list = getAt(path);
                    const j = i + delta;
                    if (j < 0 || j >= list.length) return;
                    [list[i], list[j]] = [list[j], list[i]];
                    const wasOpen = openSet.has(i);
                    openSet.delete(i);
                    if (wasOpen) openSet.add(j);
                    changed();
                    draw();
                };

                const head = h('div', { class: 'rep-head' },
                    h('button', {
                        type: 'button',
                        class: 'rep-toggle',
                        'aria-expanded': String(openSet.has(i)),
                        onclick: (e) => {
                            card.classList.toggle('open');
                            const open = card.classList.contains('open');
                            if (open) openSet.add(i); else openSet.delete(i);
                            e.currentTarget.setAttribute('aria-expanded', String(open));
                        }
                    }, icon('fas fa-chevron-right'), title),
                    h('button', { type: 'button', class: 'btn btn-ghost btn-sm icon-only', title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, onclick: () => move(-1) }, icon('fas fa-arrow-up')),
                    h('button', { type: 'button', class: 'btn btn-ghost btn-sm icon-only', title: 'Move down', 'aria-label': 'Move down', disabled: i === items.length - 1, onclick: () => move(1) }, icon('fas fa-arrow-down')),
                    h('button', {
                        type: 'button', class: 'btn btn-ghost btn-sm icon-only', title: 'Remove', 'aria-label': 'Remove',
                        onclick: () => {
                            if (!confirm(`Remove “${titleOf(item, i) || 'this item'}”?`)) return;
                            getAt(path).splice(i, 1);
                            openSet.clear();
                            changed();
                            draw();
                        }
                    }, icon('fas fa-trash-can')));

                card.append(head, h('div', { class: 'rep-body' }, fields(itemPath, item)));
                wrap.append(card);
                state.refreshers.push(() => {
                    const current = getAt(itemPath);
                    if (current) title.textContent = titleOf(current, i) || `Item ${i + 1}`;
                });
            });

            wrap.append(h('button', {
                type: 'button',
                class: 'btn btn-sm rep-add',
                onclick: () => {
                    const list = getAt(path) || [];
                    if (!getAt(path)) setAt(path, list);
                    list.push(create());
                    openSet.add(list.length - 1);
                    changed();
                    draw();
                }
            }, icon('fas fa-plus'), addLabel));
        }

        draw();
        return wrap;
    }

    const card = (title, sub, ...children) => h('section', { class: 'card' }, h('h2', {}, title), sub ? h('p', { class: 'card-sub' }, sub) : null, ...children);
    const BOLD_HINT = 'Wrap words in **double stars** to make them bold.';

    // ============ Pages ============
    const PAGES = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-gauge', group: 'Overview', render: renderDashboard },
        { id: 'profile', label: 'Profile', icon: 'fas fa-user', group: 'Content', render: renderProfile },
        { id: 'skills', label: 'Skills', icon: 'fas fa-toolbox', group: 'Content', render: renderSkills },
        { id: 'experience', label: 'Experience', icon: 'fas fa-briefcase', group: 'Content', render: renderExperience },
        { id: 'projects', label: 'Projects', icon: 'fas fa-layer-group', group: 'Content', render: renderProjects },
        { id: 'education', label: 'Education', icon: 'fas fa-graduation-cap', group: 'Content', render: renderEducation },
        { id: 'theme', label: 'Theme & style', icon: 'fas fa-palette', group: 'Look & feel', render: renderTheme },
        { id: 'sections', label: 'Sections', icon: 'fas fa-table-list', group: 'Look & feel', render: renderSections },
        { id: 'seo', label: 'SEO & sharing', icon: 'fas fa-magnifying-glass', group: 'Look & feel', render: renderSeo },
        { id: 'publish', label: 'Publish', icon: 'fas fa-rocket', group: 'Site', render: renderPublish },
        { id: 'security', label: 'Security', icon: 'fas fa-lock', group: 'Site', render: renderSecurity }
    ];

    function checklist() {
        const d = state.draft;
        return [
            { label: 'Set your own admin password', done: !state.session?.usingStarterPassword, page: 'security' },
            { label: 'Add your name, role and bio', done: Boolean(d.profile?.name && d.profile?.lede), page: 'profile' },
            { label: 'Set your contact email', done: /\S+@\S+\.\S+/.test(d.profile?.email || ''), page: 'profile' },
            { label: 'Add your projects', done: (d.projects?.featured?.length || 0) > 0, page: 'projects' },
            { label: 'Set your website address for SEO', done: Boolean(d.meta?.siteUrl), page: 'seo' },
            { label: 'Publish your changes', done: Boolean(state.session?.publishedAt) && !isDirty(), page: 'publish' }
        ];
    }

    function renderDashboard() {
        const d = state.draft;
        const items = checklist();
        const done = items.filter((i) => i.done).length;
        const firstName = (d.profile?.name || '').split(' ')[0];

        return [
            h('div', { class: 'welcome' },
                h('h2', {}, `Hello${firstName ? `, ${firstName}` : ''} 👋`),
                h('p', {}, 'Edit anything on the left, preview it on the real site, then publish when you’re happy.')),
            state.session?.usingStarterPassword ? h('div', { class: 'notice notice-warn' }, icon('fas fa-key'),
                h('div', { class: 'notice-body' },
                    h('strong', {}, 'You signed in with the password from your site settings. '),
                    'Set your own in Security — it’s stored as a secure hash, not as text.',
                    h('div', { class: 'notice-actions' }, h('a', { class: 'btn btn-sm', href: '#/security' }, 'Change password')))) : null,
            h('div', { class: 'stat-row' },
                [
                    [(d.projects?.featured?.length || 0) + (d.projects?.more?.length || 0), 'projects'],
                    [(d.skills || []).reduce((n, g) => n + (g.items?.length || 0), 0), 'skills listed'],
                    [(d.experience || []).length, 'roles'],
                    [timeAgo(state.session?.publishedAt), 'last published']
                ].map(([value, label]) => h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', {}, label)))),
            card('Get your site ready', `${done} of ${items.length} done`,
                h('div', { class: 'progress' }, h('span', { style: `width:${(done / items.length) * 100}%` })),
                h('ul', { class: 'checklist' }, items.map((item) => h('li', { class: item.done ? 'done' : '' },
                    h('span', { class: 'check-dot' }, icon('fas fa-check')),
                    h('span', { class: 'check-label' }, item.label),
                    item.done ? null : h('a', { class: 'btn btn-sm', href: `#/${item.page}` }, 'Open'))))),
            card('Quick actions', null,
                h('div', { class: 'btn-row' },
                    h('button', { class: 'btn', type: 'button', onclick: openPreview }, icon('fas fa-eye'), 'Preview draft'),
                    h('a', { class: 'btn', href: '/', target: '_blank', rel: 'noopener' }, icon('fas fa-arrow-up-right-from-square'), 'Open live site'),
                    h('a', { class: 'btn', href: '#/theme' }, icon('fas fa-palette'), 'Change colours')))
        ];
    }

    function renderProfile() {
        return [
            card('Basics', 'How you appear in the menu and across the site.',
                h('div', { class: 'grid-2' },
                    textField(['profile', 'name'], 'Full name'),
                    textField(['profile', 'role'], 'Job title'),
                    textField(['profile', 'shortName'], 'Short name', { hint: 'Shown next to the logo.' }),
                    textField(['profile', 'initials'], 'Logo initials', { hint: 'Two or three letters.' }))),
            card('Hero', 'The first thing visitors see.',
                toggleField(['profile', 'openToWork'], 'Open to new opportunities', 'Shows the green status badge above your headline.'),
                textField(['profile', 'status'], 'Badge text'),
                h('div', { class: 'grid-2' },
                    textField(['profile', 'headlineTop'], 'Headline — first line'),
                    textField(['profile', 'headlineBottom'], 'Headline — second line')),
                textField(['profile', 'headlineAccent'], 'Highlighted word', { hint: 'Shown in your accent colours at the end of the headline.' }),
                textField(['profile', 'lede'], 'Intro', { rows: 3, hint: BOLD_HINT }),
                h('p', { class: 'field-label' }, 'Stats under the intro'),
                repeater(['profile', 'stats'], {
                    titleOf: (s) => `${s.value ?? ''}${s.suffix || ''} ${s.label || ''}`.trim(),
                    create: () => ({ value: 1, suffix: '', label: 'New stat' }),
                    addLabel: 'Add stat',
                    fields: (p) => h('div', { class: 'grid-2' },
                        textField([...p, 'value'], 'Number', { type: 'number' }),
                        textField([...p, 'suffix'], 'After the number', { hint: 'For example + or %.' }),
                        textField([...p, 'label'], 'Label'))
                })),
            card('Contact & links', null,
                h('div', { class: 'grid-2' },
                    textField(['profile', 'email'], 'Email', { type: 'email' }),
                    textField(['profile', 'phone'], 'Phone (optional)'),
                    textField(['profile', 'location'], 'Location'),
                    textField(['profile', 'locationNote'], 'Location note', { hint: 'For example “Open to remote”.' }),
                    textField(['profile', 'github'], 'GitHub URL', { type: 'url' }),
                    textField(['profile', 'linkedin'], 'LinkedIn URL', { type: 'url' })),
                textField(['profile', 'resume'], 'Résumé link (optional)', { hint: 'A file in the site (Paresh_Prajapati_Resume.pdf) or a full URL.' })),
            card('About section', null,
                textField(['about', 'lead'], 'Opening line', { rows: 3, hint: BOLD_HINT }),
                linesField(['about', 'paragraphs'], 'More about you', { rows: 5, hint: `One paragraph per line. ${BOLD_HINT}` }),
                h('div', { class: 'grid-2' },
                    textField(['about', 'nowTitle'], '“Right now” title'),
                    textField(['about', 'nowSubtitle'], '“Right now” detail')),
                linesField(['about', 'principles'], 'How I work', { rows: 3 }),
                textField(['about', 'askTitle'], 'Ask-my-AI heading'),
                h('p', { class: 'field-label' }, 'Suggested questions for your AI assistant'),
                repeater(['about', 'ask'], {
                    titleOf: (q) => q.label,
                    create: () => ({ label: 'New question', question: '' }),
                    addLabel: 'Add question',
                    fields: (p) => h('div', { class: 'grid-2' },
                        textField([...p, 'label'], 'Button text'),
                        textField([...p, 'question'], 'Question sent to the assistant'))
                })),
            card('Hero agent demo', 'The animated “agent run” card. It cycles through these examples.',
                repeater(['demo'], {
                    titleOf: (r) => r.project,
                    create: () => ({ project: 'New project', tone: 'indigo', query: '', steps: [], answer: '' }),
                    addLabel: 'Add example',
                    empty: 'No examples: the demo card is hidden.',
                    fields: (p) => [
                        h('div', { class: 'grid-2' }, textField([...p, 'project'], 'Project name'), toneField([...p, 'tone'])),
                        textField([...p, 'query'], 'Question typed in'),
                        linesField([...p, 'steps'], 'Steps (up to 5)', { rows: 5, max: 5 }),
                        textField([...p, 'answer'], 'Answer shown at the end', { rows: 2 })
                    ]
                }))
        ];
    }

    function renderSkills() {
        return [
            card('Skill groups', 'Each group is a card on the site. Wide cards span two columns.',
                repeater(['skills'], {
                    titleOf: (g) => `${g.name || 'Untitled'} · ${(g.items || []).length} skills`,
                    create: () => ({ name: 'New group', icon: 'fas fa-star', tone: 'indigo', wide: false, items: [] }),
                    addLabel: 'Add skill group',
                    fields: (p) => [
                        h('div', { class: 'grid-2' }, textField([...p, 'name'], 'Group name'), toneField([...p, 'tone'])),
                        iconField([...p, 'icon']),
                        linesField([...p, 'items'], 'Skills', { rows: 6 }),
                        toggleField([...p, 'wide'], 'Wide card', 'Takes two columns on large screens.')
                    ]
                })),
            card('Scrolling tech strip', 'The band of tools that scrolls under the hero.',
                repeater(['marquee'], {
                    titleOf: (m) => m.label,
                    create: () => ({ label: 'New tool', icon: 'fas fa-cube' }),
                    addLabel: 'Add tool',
                    empty: 'No tools: the strip is hidden.',
                    fields: (p) => [textField([...p, 'label'], 'Name'), iconField([...p, 'icon'])]
                }))
        ];
    }

    function renderExperience() {
        return [card('Roles', 'Newest first.',
            repeater(['experience'], {
                titleOf: (j) => [j.role, j.company].filter(Boolean).join(' — '),
                create: () => ({ role: 'New role', company: '', start: '', end: '', current: false, bullets: [] }),
                addLabel: 'Add role',
                fields: (p) => [
                    h('div', { class: 'grid-2' },
                        textField([...p, 'role'], 'Job title'),
                        textField([...p, 'company'], 'Company (optional)'),
                        textField([...p, 'start'], 'Start', { placeholder: 'Feb 2026' }),
                        textField([...p, 'end'], 'End', { placeholder: 'Oct 2025', hint: 'Ignored while “current” is on.' })),
                    toggleField([...p, 'current'], 'I currently work here'),
                    linesField([...p, 'bullets'], 'Key achievements', { rows: 5, hint: `One per line. ${BOLD_HINT}` })
                ]
            }))];
    }

    function renderProjects() {
        const idField = (p) => {
            const wrap = textField([...p, 'id'], 'Link name', { hint: 'Used in the page address, like #caternest. Letters, numbers and dashes.' });
            const input = wrap.querySelector('input');
            input.addEventListener('change', () => {
                input.value = slugify(input.value);
                setAt([...p, 'id'], input.value);
            });
            return wrap;
        };
        return [
            card('Featured projects', 'Large cards with a “Business impact / Under the hood” switch.',
                repeater(['projects', 'featured'], {
                    titleOf: (pr) => pr.name,
                    create: () => ({ id: `project-${Date.now().toString(36)}`, name: 'New project', tagline: '', icon: 'fas fa-cube', tone: 'indigo', status: 'In production', tags: [], intro: '', business: [], technical: [] }),
                    addLabel: 'Add featured project',
                    fields: (p) => [
                        h('div', { class: 'grid-2' }, textField([...p, 'name'], 'Project name'), textField([...p, 'tagline'], 'Tagline')),
                        h('div', { class: 'grid-2' }, textField([...p, 'status'], 'Status badge', { hint: 'Leave empty to hide.' }), toneField([...p, 'tone'])),
                        iconField([...p, 'icon']),
                        idField(p),
                        tagsField([...p, 'tags'], 'Tech stack'),
                        textField([...p, 'intro'], 'Business summary', { rows: 3, hint: BOLD_HINT }),
                        linesField([...p, 'business'], 'Business impact points', { rows: 4, hint: `One per line. Start with **Title:** for a bold lead-in.` }),
                        linesField([...p, 'technical'], 'Under-the-hood points', { rows: 5, hint: `One per line. Start with **Title:** for a bold lead-in.` })
                    ]
                })),
            card('More projects', 'Smaller cards in a grid below the featured ones.',
                repeater(['projects', 'more'], {
                    titleOf: (pr) => pr.name,
                    create: () => ({ id: `project-${Date.now().toString(36)}`, name: 'New project', tagline: '', icon: 'fas fa-cube', tone: 'indigo', wide: false, description: '', tags: [] }),
                    addLabel: 'Add project',
                    fields: (p) => [
                        h('div', { class: 'grid-2' }, textField([...p, 'name'], 'Project name'), textField([...p, 'tagline'], 'Tagline')),
                        h('div', { class: 'grid-2' }, toneField([...p, 'tone']), idField(p)),
                        iconField([...p, 'icon']),
                        textField([...p, 'description'], 'Description', { rows: 3, hint: BOLD_HINT }),
                        tagsField([...p, 'tags'], 'Tech stack'),
                        toggleField([...p, 'wide'], 'Wide card', 'Takes two columns on large screens.')
                    ]
                }))
        ];
    }

    function renderEducation() {
        return [card('Education', null,
            repeater(['education'], {
                titleOf: (e) => e.degree,
                create: () => ({ degree: 'New qualification', school: '', grade: '', start: '', end: '', icon: 'fas fa-graduation-cap' }),
                addLabel: 'Add qualification',
                fields: (p) => [
                    textField([...p, 'degree'], 'Degree / qualification'),
                    textField([...p, 'school'], 'School / university'),
                    h('div', { class: 'grid-2' },
                        textField([...p, 'start'], 'Start year'),
                        textField([...p, 'end'], 'End year'),
                        textField([...p, 'grade'], 'Grade (optional)')),
                    iconField([...p, 'icon'])
                ]
            }))];
    }

    const PRESETS = [
        ['Indigo & teal', '#4f46e5', '#0f766e'],
        ['Ocean', '#1d4ed8', '#0e7490'],
        ['Forest', '#15803d', '#a16207'],
        ['Sunset', '#c2410c', '#be185d'],
        ['Grape', '#7c3aed', '#c026d3'],
        ['Graphite', '#334155', '#0f766e']
    ];

    const FONTS = ['Bricolage Grotesque', 'Space Grotesk', 'Sora', 'Fraunces', 'Outfit'];

    function renderTheme() {
        const colorInput = (key, label) => {
            const path = ['theme', key];
            const picker = h('input', { type: 'color', 'aria-label': `${label} picker` });
            const text = h('input', { type: 'text', 'aria-label': `${label} hex value`, maxlength: 7 });
            const badge = h('span', { class: 'badge' });
            const sync = () => {
                const value = getAt(path) || '#000000';
                picker.value = value;
                if (document.activeElement !== text) text.value = value;
                const ratio = contrastWithWhite(value);
                badge.className = `badge ${ratio >= 4.5 ? 'badge-ok' : 'badge-warn'}`;
                badge.replaceChildren(icon(ratio >= 4.5 ? 'fas fa-check' : 'fas fa-triangle-exclamation'),
                    `${ratio.toFixed(1)}:1 ${ratio >= 4.5 ? 'readable' : 'hard to read'}`);
            };
            picker.addEventListener('input', () => setAt(path, picker.value));
            text.addEventListener('input', () => {
                if (/^#[0-9a-f]{6}$/i.test(text.value)) setAt(path, text.value.toLowerCase());
            });
            state.refreshers.push(sync);
            sync();
            return h('div', { class: 'field' }, h('span', { class: 'field-label' }, label),
                h('div', { class: 'color-field' }, picker, text, badge),
                h('span', { class: 'hint' }, 'White text on this colour must be at least 4.5:1 so everyone can read it.'));
        };

        const previewBox = (dark) => {
            const box = h('div', { class: `theme-preview${dark ? ' dark' : ''}` });
            const draw = () => {
                const t = state.draft.theme || {};
                const mix = (hex) => (dark ? `color-mix(in srgb, ${hex} 55%, white)` : hex);
                const soft = (hex) => (dark ? `color-mix(in srgb, ${hex} 22%, transparent)` : `color-mix(in srgb, ${hex} 12%, white)`);
                box.style.fontFamily = `'${t.headingFont || FONTS[0]}', system-ui, sans-serif`;
                box.replaceChildren(
                    h('span', { class: 'tp-title' }, 'I build AI ', h('span', { style: `color:${mix(t.primary)}` }, 'that ships.')),
                    h('div', { class: 'tp-row' },
                        h('span', { class: 'tp-btn', style: `background:${t.primary};${dark ? `background:${mix(t.primary)};color:#0b0d12` : ''}` }, 'See my work'),
                        h('span', { class: 'tp-chip', style: `background:${soft(t.primary)};color:${mix(t.primary)}` }, 'LangGraph'),
                        h('span', { class: 'tp-chip', style: `background:${soft(t.secondary)};color:${mix(t.secondary)}` }, 'Qdrant')),
                    h('span', { style: 'font-family:Inter,sans-serif;font-size:.8rem;opacity:.7' }, dark ? 'Dark mode' : 'Light mode'));
            };
            state.refreshers.push(draw);
            draw();
            return box;
        };

        return [
            card('Colours', 'Pick a preset or choose your own. Dark mode gets a lighter version of each colour automatically.',
                h('div', { class: 'presets' }, PRESETS.map(([name, a, b]) => h('button', {
                    type: 'button', class: 'preset',
                    onclick: () => {
                        setAt(['theme', 'primary'], a);
                        setAt(['theme', 'secondary'], b);
                    }
                }, h('span', { class: 'dots' }, h('span', { style: `background:${a}` }), h('span', { style: `background:${b}` })), name))),
                h('div', { class: 'grid-2' }, colorInput('primary', 'Primary colour'), colorInput('secondary', 'Secondary colour')),
                h('div', { class: 'preview-pair' }, previewBox(false), previewBox(true))),
            card('Type & mode', null,
                h('div', { class: 'grid-2' },
                    selectField(['theme', 'headingFont'], 'Heading font', FONTS.map((f) => [f, f])),
                    selectField(['theme', 'defaultMode'], 'Default colour mode',
                        [['system', 'Follow the visitor’s device'], ['light', 'Light'], ['dark', 'Dark']],
                        'Visitors can still switch with the sun/moon button.'))),
            card('Effects', null,
                toggleField(['theme', 'animations'], 'Animations', 'Headline entrance, agent demo, scrolling strip and scroll reveals. Always off for visitors who ask their device for less motion.'),
                toggleField(['theme', 'cursorGlow'], 'Cursor glow on cards', 'A soft light that follows the mouse over cards.'),
                toggleField(['theme', 'sectionNumbers'], 'Section numbers', 'Shows 01, 02, 03… before each section label.'))
        ];
    }

    function renderSections() {
        const NAMES = { about: 'About', skills: 'Skills', experience: 'Experience', projects: 'Projects', education: 'Education', contact: 'Contact' };
        return Object.entries(NAMES).map(([key, name]) => card(name, null,
            toggleField(['sections', key, 'show'], 'Show this section', 'Hidden sections also leave the menu.'),
            h('div', { class: 'grid-2' },
                textField(['sections', key, 'label'], 'Menu label'),
                textField(['sections', key, 'index'], 'Small label above the heading')),
            textField(['sections', key, 'heading'], 'Heading'),
            textField(['sections', key, 'subheading'], 'Subheading (optional)', { rows: key === 'contact' || key === 'projects' ? 2 : undefined }),
            key === 'projects' ? h('div', { class: 'grid-2' },
                textField(['sections', key, 'moreHeading'], '“More projects” heading'),
                textField(['sections', key, 'moreSubheading'], '“More projects” subheading')) : null));
    }

    function renderSeo() {
        const title = h('div', { class: 'serp-title' });
        const desc = h('div', { class: 'serp-desc' });
        const url = h('div', { class: 'serp-url' });
        state.refreshers.push(() => {
            const m = state.draft.meta || {};
            title.textContent = m.title || state.draft.profile?.name || 'Your portfolio';
            desc.textContent = m.description || 'Add a description so search engines show something useful here.';
            url.textContent = m.siteUrl || 'https://your-site.netlify.app';
        });
        state.refreshers[state.refreshers.length - 1]();

        return [
            card('Search engines', 'What Google shows for your site.',
                textField(['meta', 'title'], 'Page title', { max: 60 }),
                textField(['meta', 'description'], 'Meta description', { rows: 3, max: 160 }),
                textField(['meta', 'keywords'], 'Extra keywords', { hint: 'Comma separated, for example other spellings of your name.' }),
                h('p', { class: 'field-label' }, 'Preview'),
                h('div', { class: 'serp' }, url, title, desc)),
            card('Sharing', 'Used when your link is shared on LinkedIn, WhatsApp, Slack and so on.',
                textField(['meta', 'siteUrl'], 'Website address', { type: 'url', placeholder: 'https://pareshprajapati.netlify.app' }),
                textField(['meta', 'ogImage'], 'Share image', { placeholder: 'assets/og-image.png', hint: 'A 1200×630 image in the site, or a full URL.' }))
        ];
    }

    const SECTION_NAMES = {
        meta: 'SEO & sharing', theme: 'Theme & style', profile: 'Profile', about: 'About section', demo: 'Hero agent demo',
        marquee: 'Scrolling tech strip', skills: 'Skills', experience: 'Experience', projects: 'Projects',
        education: 'Education', sections: 'Sections'
    };

    function renderPublish() {
        const changes = Object.keys(SECTION_NAMES).filter((key) => !same(state.draft[key], state.published[key]));
        const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            try {
                const data = JSON.parse(await file.text());
                if (!data.profile || !data.sections) throw new Error('This file is not a portfolio backup.');
                state.draft = { ...data, updatedAt: state.published.updatedAt };
                changed();
                toast('Backup loaded as a draft. Publish to make it live.');
                route();
            } catch (err) {
                toast(err.message || 'Could not read that file.', 'error');
            }
        });

        return [
            card('Publish', state.session?.publishedAt ? `Last published ${timeAgo(state.session.publishedAt)}.` : 'Not published yet — the site shows the built-in content.',
                changes.length
                    ? h('div', {}, h('p', { class: 'field-label' }, 'Changed since you last published:'),
                        h('ul', { class: 'change-list' }, changes.map((k) => h('li', {}, icon('fas fa-pen'), SECTION_NAMES[k]))))
                    : h('p', {}, 'Nothing to publish — your site already shows everything here.'),
                h('div', { class: 'btn-row', style: 'margin-top:16px' },
                    h('button', { type: 'button', class: 'btn btn-primary', disabled: !changes.length, onclick: publish }, icon('fas fa-rocket'), 'Publish now'),
                    h('button', { type: 'button', class: 'btn', onclick: openPreview }, icon('fas fa-eye'), 'Preview first'),
                    h('button', {
                        type: 'button', class: 'btn btn-danger', disabled: !changes.length,
                        onclick: () => {
                            if (!confirm('Throw away all unpublished changes?')) return;
                            state.draft = clone(state.published);
                            changed();
                            route();
                            toast('Changes discarded.');
                        }
                    }, icon('fas fa-rotate-left'), 'Discard changes'))),
            card('Backups', 'Keep a copy of your content, or restore one.',
                h('div', { class: 'btn-row' },
                    h('button', {
                        type: 'button', class: 'btn',
                        onclick: () => {
                            const blob = new Blob([JSON.stringify(state.draft, null, 2)], { type: 'application/json' });
                            const a = h('a', { href: URL.createObjectURL(blob), download: `portfolio-content-${new Date().toISOString().slice(0, 10)}.json` });
                            a.click();
                            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                        }
                    }, icon('fas fa-download'), 'Download backup'),
                    h('button', { type: 'button', class: 'btn', onclick: () => fileInput.click() }, icon('fas fa-upload'), 'Load a backup'),
                    h('button', {
                        type: 'button', class: 'btn',
                        onclick: async () => {
                            if (!confirm('Replace your draft with the original content that shipped with the site?')) return;
                            try {
                                const original = await (await fetch('/data/content.json', { cache: 'no-cache' })).json();
                                state.draft = { ...original, updatedAt: state.published.updatedAt };
                                changed();
                                route();
                                toast('Original content loaded as a draft.');
                            } catch (e) {
                                toast('Could not load the original content.', 'error');
                            }
                        }
                    }, icon('fas fa-clock-rotate-left'), 'Start from original content')),
                fileInput)
        ];
    }

    function renderSecurity() {
        const err = h('div', { class: 'form-error', hidden: true });
        const pw = (id, label, autocomplete) => {
            const input = h('input', { id, type: 'password', autocomplete, required: true });
            return { input, el: h('div', { class: 'field' }, h('label', { for: id }, label), input) };
        };
        const current = pw('pw-current', 'Current password', 'current-password');
        const next = pw('pw-next', 'New password', 'new-password');
        const confirmPw = pw('pw-confirm', 'Type the new password again', 'new-password');
        const strength = h('span', { class: 'hint' }, 'At least 8 characters. A short sentence is easy to remember and hard to guess.');

        next.input.addEventListener('input', () => {
            const v = next.input.value;
            const score = [v.length >= 12, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^a-z0-9]/i.test(v)].filter(Boolean).length;
            strength.textContent = v.length < 8 ? 'Too short — use at least 8 characters.' : ['Weak', 'Fair', 'Good', 'Strong', 'Very strong'][score];
        });
        next.el.append(strength);

        const form = h('form', {
            onsubmit: async (e) => {
                e.preventDefault();
                err.hidden = true;
                if (next.input.value !== confirmPw.input.value) {
                    err.replaceChildren(icon('fas fa-circle-exclamation'), 'The new passwords don’t match.');
                    err.hidden = false;
                    return;
                }
                const button = form.querySelector('button[type="submit"]');
                button.disabled = true;
                try {
                    const result = await api('password', { method: 'POST', body: { current: current.input.value, next: next.input.value } });
                    setToken(result.token);
                    state.session.usingStarterPassword = false;
                    form.reset();
                    toast('Password changed. Other signed-in sessions have been signed out.');
                    route();
                } catch (error) {
                    if (error.message === 'signed-out') return;
                    err.replaceChildren(icon('fas fa-circle-exclamation'), error.message);
                    err.hidden = false;
                } finally {
                    button.disabled = false;
                }
            }
        }, err, current.el, h('div', { class: 'grid-2' }, next.el, confirmPw.el),
        h('button', { type: 'submit', class: 'btn btn-primary' }, icon('fas fa-key'), 'Change password'));

        return [
            card('Admin password', state.session?.usingStarterPassword
                ? 'You’re using the password from your site settings (ADMIN_PASSWORD). Set your own here — it’s stored as a secure hash.'
                : `Last changed ${timeAgo(state.session?.passwordChangedAt)}.`, form),
            card('Session', 'You stay signed in for 12 hours in this tab. After 5 wrong passwords, sign-in pauses for 10 minutes.',
                h('button', { type: 'button', class: 'btn', onclick: () => signOut() }, icon('fas fa-right-from-bracket'), 'Sign out'))
        ];
    }

    // ============ Actions ============
    function openPreview() {
        saveDraftNow();
        const store = storage('local');
        try {
            store?.setItem(DRAFT_KEY, JSON.stringify(state.draft));
        } catch (e) { /* preview will show the published content instead */ }
        window.open('/?preview=1', '_blank', 'noopener');
    }

    async function publish() {
        const buttons = document.querySelectorAll('#topPublish, .btn-primary');
        buttons.forEach((b) => { b.disabled = true; });
        try {
            const { publishedAt } = await api('publish', { method: 'POST', body: { content: state.draft } });
            state.draft.updatedAt = publishedAt;
            state.published = clone(state.draft);
            state.session.publishedAt = publishedAt;
            saveDraftNow();
            toast('Published! Your site is updated.');
            route();
        } catch (err) {
            if (err.message !== 'signed-out') toast(err.message, 'error');
            updateDirtyUI();
        }
    }

    function setToken(token) {
        state.token = token;
        try {
            storage('session')?.setItem(TOKEN_KEY, token);
        } catch (e) { /* stays signed in for this page only */ }
    }

    function signOut(message) {
        state.token = null;
        try {
            storage('session')?.removeItem(TOKEN_KEY);
        } catch (e) { /* nothing stored */ }
        renderLogin(message);
    }

    function toggleAdminTheme() {
        const root = document.documentElement;
        const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
        root.dataset.theme = dark ? 'light' : 'dark';
        try {
            localStorage.setItem('admin-theme', root.dataset.theme);
        } catch (e) { /* not remembered */ }
    }

    // ============ Screens ============
    function renderLogin(message) {
        const err = h('div', { class: 'form-error', hidden: !message }, icon('fas fa-circle-exclamation'), message || '');
        const input = h('input', { id: 'password', type: 'password', autocomplete: 'current-password', required: true, autofocus: true });
        const reveal = h('button', {
            type: 'button', class: 'reveal-btn', 'aria-label': 'Show password',
            onclick: () => {
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                reveal.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
                reveal.replaceChildren(icon(show ? 'fas fa-eye-slash' : 'fas fa-eye'));
            }
        }, icon('fas fa-eye'));
        const submit = h('button', { type: 'submit', class: 'btn btn-primary' }, 'Sign in');

        const form = h('form', {
            class: 'login-card',
            onsubmit: async (e) => {
                e.preventDefault();
                submit.disabled = true;
                submit.textContent = 'Signing in…';
                err.hidden = true;
                try {
                    const result = await api('login', { method: 'POST', body: { password: input.value } });
                    setToken(result.token);
                    await loadApp();
                } catch (error) {
                    err.replaceChildren(icon('fas fa-circle-exclamation'), error.message);
                    err.hidden = false;
                    submit.disabled = false;
                    submit.textContent = 'Sign in';
                    input.select();
                }
            }
        },
        h('div', { class: 'login-brand' }, icon('fas fa-shield-halved'), 'Portfolio admin'),
        h('h1', {}, 'Welcome back'),
        h('p', {}, 'Sign in to edit your portfolio.'),
        err,
        h('div', { class: 'field' }, h('label', { for: 'password' }, 'Password'), h('div', { class: 'password-wrap' }, input, reveal)),
        submit,
        h('p', { class: 'login-foot' }, h('a', { href: '/' }, '← Back to site')));

        app.replaceChildren(h('main', { class: 'login' }, form));
        input.focus();
    }

    function currentPage() {
        const id = location.hash.replace(/^#\/?/, '') || 'dashboard';
        return PAGES.find((p) => p.id === id) || PAGES[0];
    }

    function route() {
        if (!state.draft) return;
        const page = currentPage();
        state.refreshers = [];
        const p = state.draft.profile || {};

        let lastGroup = '';
        const sideLinks = [];
        PAGES.forEach((item) => {
            if (item.group !== lastGroup) {
                lastGroup = item.group;
                sideLinks.push(h('div', { class: 'side-group' }, item.group));
            }
            const showBadge = item.id === 'security' && state.session?.usingStarterPassword;
            sideLinks.push(h('a', {
                class: `side-link${item.id === page.id ? ' active' : ''}`,
                href: `#/${item.id}`,
                'aria-current': item.id === page.id ? 'page' : null
            }, icon(item.icon), item.label, showBadge ? h('span', { class: 'badge badge-warn' }, '!') : null));
        });

        const sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Admin sections' },
            h('div', { class: 'side-brand' }, h('span', { class: 'mark' }, p.initials || 'PA'),
                h('div', {}, h('strong', {}, p.name || 'Portfolio'), h('span', {}, 'Portfolio admin'))),
            sideLinks,
            h('div', { class: 'side-foot' },
                h('a', { class: 'side-link', href: '/', target: '_blank', rel: 'noopener' }, icon('fas fa-arrow-up-right-from-square'), 'View live site'),
                h('button', { type: 'button', class: 'side-link', onclick: () => signOut() }, icon('fas fa-right-from-bracket'), 'Sign out')));

        const topbar = h('header', { class: 'topbar' },
            h('button', { type: 'button', class: 'btn btn-ghost icon-only menu-btn', 'aria-label': 'Open menu', onclick: () => sidebar.classList.toggle('open') }, icon('fas fa-bars')),
            h('h1', {}, page.label),
            h('span', { id: 'statusChip', class: 'status-chip hide-sm' }),
            h('button', { type: 'button', class: 'btn btn-ghost icon-only', 'aria-label': 'Switch light / dark admin', title: 'Switch light / dark admin', onclick: toggleAdminTheme },
                h('i', { class: 'fas fa-moon icon-moon' }), h('i', { class: 'fas fa-sun icon-sun' })),
            h('button', { type: 'button', class: 'btn hide-sm', onclick: openPreview }, icon('fas fa-eye'), 'Preview'),
            h('button', { type: 'button', id: 'topPublish', class: 'btn btn-primary', onclick: publish }, icon('fas fa-rocket'), 'Publish'));

        const notices = [];
        if (state.restoredDraft) {
            notices.push(h('div', { class: 'notice notice-info' }, icon('fas fa-clock-rotate-left'),
                h('div', { class: 'notice-body' }, 'We restored unpublished changes from your last visit.',
                    h('div', { class: 'notice-actions' },
                        h('button', { type: 'button', class: 'btn btn-sm', onclick: () => { state.restoredDraft = false; route(); } }, 'Keep them'),
                        h('button', {
                            type: 'button', class: 'btn btn-sm',
                            onclick: () => {
                                state.draft = clone(state.published);
                                state.restoredDraft = false;
                                changed();
                                route();
                            }
                        }, 'Discard')))));
        }

        const main = h('div', { class: 'main' }, topbar,
            h('div', { class: 'content' }, notices, page.render()));

        app.replaceChildren(h('div', { class: 'shell' }, sidebar, main));
        updateDirtyUI();
        document.title = `${page.label} · Admin`;
        window.scrollTo(0, 0);
    }

    async function loadApp() {
        app.replaceChildren(h('div', { class: 'loading' }, icon('fas fa-circle-notch fa-spin'), ' Loading your content…'));
        const [session, { content }] = await Promise.all([api('session'), api('content')]);
        state.session = session;
        state.published = clone(content);

        let saved = null;
        try {
            saved = JSON.parse(storage('local')?.getItem(DRAFT_KEY) || 'null');
        } catch (e) { /* unreadable draft: start fresh */ }
        state.restoredDraft = Boolean(saved && !same(saved, content));
        state.draft = state.restoredDraft ? saved : clone(content);
        route();
    }

    window.addEventListener('hashchange', route);

    // ============ Boot ============
    try {
        state.token = storage('session')?.getItem(TOKEN_KEY) || null;
    } catch (e) { /* not signed in */ }

    if (state.token) {
        loadApp().catch((err) => {
            if (err.message !== 'signed-out') renderLogin(err.message);
        });
    } else {
        renderLogin();
    }
})();
