// Admin API: login, published content, publish, and password change.
// Written against the web Request/Response API so the same handlers run as
// Netlify Functions and behind the local Express server.
//
// Password: until it is changed in the admin, the password is the
// ADMIN_PASSWORD environment variable. Changing it stores a salted scrypt
// hash instead, and every session issued before the change stops working.
import crypto from "node:crypto";
import { promisify } from "node:util";
import defaults from "../../data/content.json" with { type: "json" };
import { openStore } from "./store.mjs";

const scrypt = promisify(crypto.scrypt);

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 10 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_CONTENT_BYTES = 512 * 1024;
export const CONTENT_CACHE_TAG = "portfolio-content";

const KEYS = { content: "content", auth: "auth", secret: "session-secret" };

// ---------- responses ----------
function json(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }
    });
}

const fail = (status, error) => json({ error }, status);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readJson(req) {
    try {
        return await req.json();
    } catch {
        return null;
    }
}

// ---------- content ----------
export async function getContent(store = openStore()) {
    const published = await store.get(KEYS.content);
    return published
        ? { content: published, source: "published" }
        : { content: defaults, source: "defaults" };
}

export async function handleContent(req) {
    if (req.method !== "GET" && req.method !== "HEAD") return fail(405, "Use GET.");
    const { content } = await getContent();
    const url = new URL(req.url);

    // The CDN keeps a copy for up to 5 minutes; publishing purges it by tag
    // so changes normally show at once.
    const cacheHeaders = {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, durable, s-maxage=300, stale-while-revalidate=86400",
        "Netlify-Cache-Tag": CONTENT_CACHE_TAG
    };

    if (url.pathname.endsWith(".js")) {
        const body = `window.PORTFOLIO_DATA = ${JSON.stringify(content).replace(/</g, "\\u003c")};\n`;
        return new Response(body, {
            headers: { "Content-Type": "application/javascript; charset=utf-8", ...cacheHeaders }
        });
    }
    return json(content, 200, cacheHeaders);
}

// ---------- sessions ----------
const b64url = (buf) => Buffer.from(buf).toString("base64url");

async function sessionSecret(store) {
    if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
    const saved = await store.get(KEYS.secret);
    if (saved?.value) return saved.value;
    const value = crypto.randomBytes(32).toString("hex");
    await store.set(KEYS.secret, { value });
    return value;
}

function sign(secret, payload) {
    return b64url(crypto.createHmac("sha256", secret).update(payload).digest());
}

async function issueToken(store, passwordVersion) {
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const payload = b64url(JSON.stringify({ exp: expiresAt, pv: passwordVersion }));
    return { token: `${payload}.${sign(await sessionSecret(store), payload)}`, expiresAt };
}

function safeEqual(a, b) {
    const ab = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

async function authenticate(req, store) {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    if (!safeEqual(signature, sign(await sessionSecret(store), payload))) return null;

    let claims;
    try {
        claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        return null;
    }
    const auth = await store.get(KEYS.auth);
    if (claims.exp < Date.now() || claims.pv !== (auth?.version || 0)) return null;
    return { auth };
}

// ---------- passwords ----------
async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = (await scrypt(password, salt, 64)).toString("hex");
    return { salt, hash };
}

async function checkPassword(store, password) {
    const auth = await store.get(KEYS.auth);
    if (auth?.hash) {
        const { hash } = await hashPassword(password, auth.salt);
        return { configured: true, ok: safeEqual(hash, auth.hash), auth };
    }
    const starter = process.env.ADMIN_PASSWORD;
    if (!starter) return { configured: false, ok: false, auth: null };
    // Compare digests so the comparison takes the same time for any length
    const digest = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
    return { configured: true, ok: safeEqual(digest(password), digest(starter)), auth: null };
}

// ---------- login throttling ----------
function throttleKey(ip) {
    return `throttle-${crypto.createHash("sha256").update(String(ip || "unknown")).digest("hex").slice(0, 24)}`;
}

// ---------- validation ----------
function validateContent(content) {
    if (!content || typeof content !== "object" || Array.isArray(content)) return "Content must be an object.";
    for (const key of ["profile", "sections", "theme", "projects"]) {
        if (!content[key] || typeof content[key] !== "object") return `Content is missing “${key}”.`;
    }
    if (Buffer.byteLength(JSON.stringify(content)) > MAX_CONTENT_BYTES) return "Content is too large (over 512 KB).";
    return null;
}

// ---------- routes ----------
async function login(req, store, ip) {
    const body = await readJson(req);
    const key = throttleKey(ip);
    const throttle = (await store.get(key)) || { failures: 0, lockedUntil: 0 };

    if (throttle.lockedUntil > Date.now()) {
        const minutes = Math.ceil((throttle.lockedUntil - Date.now()) / 60000);
        return fail(429, `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    }

    const result = await checkPassword(store, body?.password ?? "");
    if (!result.configured) {
        return fail(503, "No admin password is set. Add ADMIN_PASSWORD to the site's environment variables.");
    }
    if (!result.ok) {
        const failures = throttle.failures + 1;
        await store.set(key, {
            failures: failures >= MAX_FAILURES ? 0 : failures,
            lockedUntil: failures >= MAX_FAILURES ? Date.now() + LOCKOUT_MS : 0
        });
        await sleep(600); // slow down guessing
        return fail(401, "That password isn't right.");
    }

    if (throttle.failures) await store.delete(key);
    const session = await issueToken(store, result.auth?.version || 0);
    return json({ ...session, usingStarterPassword: !result.auth });
}

async function changePassword(req, store, session) {
    const body = await readJson(req);
    const current = body?.current ?? "";
    const next = String(body?.next ?? "");

    if (!(await checkPassword(store, current)).ok) {
        await sleep(600);
        return fail(401, "Your current password isn't right.");
    }
    if (next.length < MIN_PASSWORD_LENGTH) return fail(400, `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (next === current) return fail(400, "The new password must be different.");

    const version = (session.auth?.version || 0) + 1;
    await store.set(KEYS.auth, { ...(await hashPassword(next)), version, changedAt: new Date().toISOString() });
    // Old sessions carry the old version and stop working; hand back a fresh one
    return json({ ...(await issueToken(store, version)), usingStarterPassword: false });
}

async function publish(req, store, purge) {
    const body = await readJson(req);
    const content = body?.content;
    const problem = validateContent(content);
    if (problem) return fail(400, problem);

    const publishedAt = new Date().toISOString();
    await store.set(KEYS.content, { ...content, updatedAt: publishedAt });
    try {
        await purge?.();
    } catch (err) {
        // Not fatal: the CDN copy expires within 5 minutes anyway
        console.warn("Cache purge failed:", err.message);
    }
    return json({ publishedAt });
}

export async function handleAdmin(req, { ip, purge } = {}) {
    const route = new URL(req.url).pathname.replace(/^\/api\/admin\/?/, "").replace(/\/$/, "");
    const store = openStore();

    if (route === "login") {
        return req.method === "POST" ? login(req, store, ip) : fail(405, "Use POST.");
    }

    const session = await authenticate(req, store);
    if (!session) return fail(401, "Your session has ended. Please sign in again.");

    switch (`${req.method} ${route}`) {
        case "GET session": {
            const { content, source } = await getContent(store);
            return json({
                usingStarterPassword: !session.auth,
                passwordChangedAt: session.auth?.changedAt || null,
                publishedAt: source === "published" ? content.updatedAt : null,
                storage: store.kind
            });
        }
        case "GET content":
            return json(await getContent(store));
        case "POST publish":
            return publish(req, store, purge);
        case "POST password":
            return changePassword(req, store, session);
        default:
            return fail(404, "Unknown admin route.");
    }
}
