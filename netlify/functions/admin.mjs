// Admin panel API: /api/admin/login, /session, /content, /publish, /password.
import { purgeCache } from "@netlify/functions";
import { handleAdmin, CONTENT_CACHE_TAG } from "../../src/admin/api.mjs";

export default (req, context) =>
    handleAdmin(req, {
        ip: context.ip,
        purge: () => purgeCache({ tags: [CONTENT_CACHE_TAG] })
    });

export const config = {
    path: "/api/admin/*"
};
