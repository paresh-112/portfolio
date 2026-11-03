// Key-value storage for the admin: Netlify Blobs when deployed, a local
// JSON folder (.data/, git-ignored) when running `node server.js`.
import { getStore } from "@netlify/blobs";
import fs from "node:fs/promises";
import path from "node:path";

const STORE_NAME = "portfolio";

function fileStore(dir) {
    const fileFor = (key) => path.join(dir, `${key.replace(/[^a-z0-9_-]/gi, "_")}.json`);
    return {
        kind: "file",
        async get(key) {
            try {
                return JSON.parse(await fs.readFile(fileFor(key), "utf8"));
            } catch (err) {
                if (err.code === "ENOENT") return null;
                throw err;
            }
        },
        async set(key, value) {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2));
        },
        async delete(key) {
            await fs.rm(fileFor(key), { force: true });
        }
    };
}

function blobStore() {
    // Strong consistency: a publish must be visible to the very next read.
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    return {
        kind: "blobs",
        get: (key) => store.get(key, { type: "json" }),
        set: (key, value) => store.setJSON(key, value),
        delete: (key) => store.delete(key)
    };
}

export function openStore() {
    try {
        return blobStore();
    } catch (err) {
        // Thrown straight away when not running on Netlify
        if (err.name !== "MissingBlobsEnvironmentError") throw err;
        return fileStore(process.env.PORTFOLIO_DATA_DIR || path.join(process.cwd(), ".data"));
    }
}
