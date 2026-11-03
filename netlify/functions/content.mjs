// Serves the published portfolio content (or the shipped defaults).
// /api/content.js is loaded by index.html before the page renders.
import { handleContent } from "../../src/admin/api.mjs";

export default (req) => handleContent(req);

export const config = {
    path: ["/api/content", "/api/content.js"]
};
