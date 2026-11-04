// The 3D "vector space" behind the page: clusters of points, like text
// embeddings grouped by topic, drawn in perspective on one 2D canvas.
//
// - It turns slowly, tilts toward the cursor, and swings round as you scroll.
// - The cluster for the section on screen lights up in the accent colour.
// - Every few seconds a query point flies in and links to its nearest
//   neighbours, the way retrieval works in a RAG pipeline.
// Visitors who ask for reduced motion (or the admin's animations switch)
// get a single still frame. Drawing stops while the tab is hidden.
(function () {
    const canvas = document.getElementById('space');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const root = document.documentElement;
    const still = !window.matchMedia('(prefers-reduced-motion: no-preference)').matches || root.classList.contains('no-motion');

    // Topic clusters, placed around a sphere; each section maps to one
    const CLUSTERS = [
        { name: 'agents', at: [-1.15, 0.45, 0.35] },
        { name: 'retrieval', at: [0.95, 0.7, -0.25] },
        { name: 'backend', at: [0.25, -0.95, 0.85] },
        { name: 'cloud', at: [1.25, -0.35, 0.75] },
        { name: 'llmops', at: [-0.6, -0.65, -1.05] },
        { name: 'ml', at: [-0.15, 1.2, -0.95] }
    ];
    const SECTION_CLUSTER = { about: 0, skills: 1, experience: 2, projects: 3, education: 5, contact: 4 };

    // Deterministic random, so the cloud has the same shape on every visit
    let seed = 7;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
    const gauss = () => {
        const u = Math.max(rand(), 1e-9);
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
    };

    const small = window.innerWidth < 720;
    const PER_CLUSTER = small ? 40 : 64;
    const DUST = small ? 90 : 170;

    const points = [];
    CLUSTERS.forEach((cluster, c) => {
        for (let i = 0; i < PER_CLUSTER; i++) {
            points.push({
                x: cluster.at[0] + gauss() * 0.24,
                y: cluster.at[1] + gauss() * 0.24,
                z: cluster.at[2] + gauss() * 0.24,
                c
            });
        }
    });
    for (let i = 0; i < DUST; i++) {
        // Loose background points spread through a larger sphere
        const r = 1.1 + rand() * 1.4;
        const t = rand() * Math.PI * 2;
        const p = Math.acos(2 * rand() - 1);
        points.push({ x: r * Math.sin(p) * Math.cos(t), y: r * Math.cos(p), z: r * Math.sin(p) * Math.sin(t), c: -1 });
    }

    // Link each clustered point to its two nearest neighbours in the cluster
    const edges = [];
    const edgeKeys = new Set();
    CLUSTERS.forEach((_, c) => {
        const members = points.map((p, i) => [p, i]).filter(([p]) => p.c === c);
        members.forEach(([p, i]) => {
            members
                .filter(([, j]) => j !== i)
                .map(([q, j]) => [j, (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2])
                .sort((a, b) => a[1] - b[1])
                .slice(0, 2)
                .forEach(([j]) => {
                    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
                    if (!edgeKeys.has(key)) {
                        edgeKeys.add(key);
                        edges.push([i, j]);
                    }
                });
        });
    });

    // ---------- colours from the page's theme tokens ----------
    const probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
    let palette = {};

    function resolve(token) {
        probe.style.color = `var(${token})`;
        const m = getComputedStyle(probe).color.match(/[\d.]+/g) || [128, 128, 128];
        return m.slice(0, 3).map(Number);
    }

    function readPalette() {
        palette = { accent: resolve('--indigo'), second: resolve('--teal'), ink: resolve('--text'), muted: resolve('--muted') };
    }

    const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;

    // ---------- view state ----------
    let width = 0;
    let height = 0;
    let dpr = 1;
    let yaw = 0.6;
    let pitch = 0.18;
    let mouseX = 0;
    let mouseY = 0;
    let scrollP = 0;
    let active = -1; // -1 = hero: every cluster equally lit
    const glow = CLUSTERS.map(() => 0);
    let query = null;
    let nextQueryAt = 2500;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(p, cosY, sinY, cosX, sinX, cx, cy, scale) {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const k = scale / (4.6 - z2);
        return { x: cx + x1 * k, y: cy - y1 * k, z: z2, k };
    }

    function draw(time) {
        const wide = width > 900;
        // In the hero the cloud sits to the right of your name; further down it centres
        const heroWeight = Math.max(0, 1 - window.scrollY / (height * 0.9));
        const cx = width * (wide ? 0.5 + 0.2 * heroWeight : 0.5);
        const cy = height * (wide ? 0.5 : 0.42);
        const scale = Math.min(width, height) * (wide ? 1.15 : 1.0);

        const targetYaw = 0.6 + time * 0.00004 + mouseX * 0.35 + scrollP * 2.4;
        const targetPitch = 0.18 + mouseY * 0.22 + Math.sin(scrollP * Math.PI) * 0.15;
        yaw += (targetYaw - yaw) * 0.05;
        pitch += (targetPitch - pitch) * 0.05;

        CLUSTERS.forEach((_, c) => {
            const target = active === -1 ? 0.7 : c === active ? 1 : 0.16;
            glow[c] += (target - glow[c]) * 0.06;
        });

        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosX = Math.cos(pitch);
        const sinX = Math.sin(pitch);
        const proj = points.map((p) => project(p, cosY, sinY, cosX, sinX, cx, cy, scale));
        const depth = (z) => Math.min(Math.max((z + 2.4) / 4.8, 0), 1); // 0 far, 1 near

        ctx.clearRect(0, 0, width, height);

        // Edges inside clusters
        ctx.lineWidth = 1;
        for (const [i, j] of edges) {
            const a = proj[i];
            const b = proj[j];
            const c = points[i].c;
            const d = (depth(a.z) + depth(b.z)) / 2;
            ctx.strokeStyle = rgba(c === active ? palette.accent : palette.muted, (0.07 + d * 0.26) * (0.35 + glow[c]));
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        // Points, far to near
        const order = proj.map((p, i) => i).sort((i, j) => proj[i].z - proj[j].z);
        for (const i of order) {
            const p = proj[i];
            const pt = points[i];
            const d = depth(p.z);
            if (pt.c === -1) {
                ctx.fillStyle = rgba(palette.muted, 0.18 + d * 0.4);
                ctx.fillRect(p.x, p.y, 1.4, 1.4);
                continue;
            }
            const lit = glow[pt.c];
            const colour = pt.c === active ? palette.accent : pt.c % 2 ? palette.second : palette.ink;
            const r = (0.8 + d * 2.1) * (0.85 + lit * 0.6);
            const alpha = (0.24 + d * 0.62) * (0.35 + lit * 0.9);
            // Near, lit points get a soft halo, which sells the depth
            if (d > 0.55 && lit > 0.5) {
                ctx.fillStyle = rgba(colour, alpha * 0.12);
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = rgba(colour, Math.min(alpha, 1));
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cluster labels, like axis annotations
        ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace';
        CLUSTERS.forEach((cluster, c) => {
            const p = project({ x: cluster.at[0], y: cluster.at[1] + 0.42, z: cluster.at[2] }, cosY, sinY, cosX, sinX, cx, cy, scale);
            const a = (0.15 + depth(p.z) * 0.35) * (0.4 + glow[c]);
            ctx.fillStyle = rgba(c === active ? palette.accent : palette.muted, Math.min(a, 0.9));
            ctx.fillText(`${String(c + 1).padStart(2, '0')} · ${cluster.name}`, p.x + 8, p.y);
        });

        drawQuery(time, proj, cosY, sinY, cosX, sinX, cx, cy, scale);
    }

    // A query point flies in, then links to its nearest neighbours
    function drawQuery(time, proj, cosY, sinY, cosX, sinX, cx, cy, scale) {
        if (still) return;
        if (!query && time > nextQueryAt) {
            const c = active === -1 ? Math.floor(rand() * CLUSTERS.length) : active;
            const target = CLUSTERS[c].at;
            const from = [target[0] * 2.6 + gauss() * 0.4, target[1] * 2.6 + gauss() * 0.4, target[2] * 2.6];
            const end = [target[0] + gauss() * 0.08, target[1] + gauss() * 0.08, target[2] + gauss() * 0.08];
            const hits = points
                .map((p, i) => [i, p.c === c ? (p.x - end[0]) ** 2 + (p.y - end[1]) ** 2 + (p.z - end[2]) ** 2 : Infinity])
                .sort((a, b) => a[1] - b[1])
                .slice(0, 5)
                .map(([i]) => i);
            query = { from, end, hits, start: time };
        }
        if (!query) return;

        const t = (time - query.start) / 1000;
        const fly = Math.min(t / 1.1, 1);
        const ease = 1 - (1 - fly) ** 3;
        const pos = query.from.map((v, i) => v + (query.end[i] - v) * ease);
        const q = project({ x: pos[0], y: pos[1], z: pos[2] }, cosY, sinY, cosX, sinX, cx, cy, scale);
        const fade = t < 1.1 ? 1 : Math.max(0, 1 - (t - 1.1) / 1.8);

        if (fly >= 1) {
            ctx.lineWidth = 1.2;
            query.hits.forEach((i, n) => {
                const reach = Math.min(Math.max((t - 1.1 - n * 0.08) / 0.3, 0), 1);
                const h = proj[i];
                ctx.strokeStyle = rgba(palette.accent, 0.75 * fade);
                ctx.beginPath();
                ctx.moveTo(q.x, q.y);
                ctx.lineTo(q.x + (h.x - q.x) * reach, q.y + (h.y - q.y) * reach);
                ctx.stroke();
                if (reach === 1) {
                    ctx.strokeStyle = rgba(palette.accent, 0.9 * fade);
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, 4.5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
            ctx.fillStyle = rgba(palette.accent, 0.85 * fade);
            ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillText('query · top-k 5', q.x + 10, q.y - 10);
        }

        ctx.fillStyle = rgba(palette.accent, fade);
        ctx.beginPath();
        ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = rgba(palette.accent, 0.35 * fade);
        ctx.beginPath();
        ctx.arc(q.x, q.y, 9 + Math.sin(time / 180) * 2, 0, Math.PI * 2);
        ctx.stroke();

        if (fade === 0) {
            query = null;
            nextQueryAt = time + 2600 + rand() * 2200;
        }
    }

    // ---------- inputs ----------
    window.addEventListener('pointermove', (e) => {
        mouseX = e.clientX / window.innerWidth - 0.5;
        mouseY = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    window.addEventListener('scroll', () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollP = max > 0 ? window.scrollY / max : 0;
    }, { passive: true });

    if ('IntersectionObserver' in window) {
        const visible = new Map();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => visible.set(entry.target.id, entry.intersectionRatio));
            let best = null;
            let bestRatio = 0.15;
            visible.forEach((ratio, id) => {
                if (ratio > bestRatio) {
                    best = id;
                    bestRatio = ratio;
                }
            });
            active = best in SECTION_CLUSTER ? SECTION_CLUSTER[best] : -1;
            if (still) frame(performance.now());
        }, { threshold: [0, 0.15, 0.3, 0.5, 0.7] });
        document.querySelectorAll('main > section[id]').forEach((s) => observer.observe(s));
    }

    // Re-read colours when the theme changes (toggle, system setting or admin preview)
    new MutationObserver(() => {
        readPalette();
        if (still) frame(performance.now());
    }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        readPalette();
        if (still) frame(performance.now());
    });

    window.addEventListener('resize', () => {
        resize();
        if (still) frame(performance.now());
    });

    // ---------- loop ----------
    function frame(time) {
        draw(time);
    }

    function loop(time) {
        if (!document.hidden) frame(time);
        requestAnimationFrame(loop);
    }

    readPalette();
    resize();
    if (still) {
        // Settle the camera and glow before the one still frame
        for (let i = 0; i < 80; i++) draw(0);
    } else {
        requestAnimationFrame(loop);
    }
    // Web fonts arrive after first paint; redraw so the labels use them
    document.fonts?.ready.then(() => {
        readPalette();
        if (still) frame(0);
    });
})();
