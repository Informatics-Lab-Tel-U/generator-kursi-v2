import type { APIRoute } from "astro";

export const prerender = false;

let cachedMatkul: any = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 jam

export const GET: APIRoute = async ({ request }) => {
    try {
        if (cachedMatkul && Date.now() - cacheTime < CACHE_TTL) {
            return new Response(JSON.stringify(cachedMatkul), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const apiKey = process.env["PRAKTIKAN_GET_API_KEY"] || import.meta.env.PRAKTIKAN_GET_API_KEY || "";
        const apiUrl = process.env["PRAKTIKAN_API_URL"] || import.meta.env.PRAKTIKAN_API_URL || "http://localhost:3001";

        const headers = new Headers();
        headers.set("x-praktikan-api-key", apiKey);
        headers.set("x-api-key", apiKey);
        headers.set("Authorization", `Bearer ${apiKey}`);

        const targetUrl = `${apiUrl}/api/praktikan/mata-kuliah`;
        console.log(`[EXTERNAL_API] Requesting mata-kuliah from: GET ${targetUrl}`);

        const res = await fetch(targetUrl, { headers });
        const data = await res.json();
        
        if (res.ok && data) {
            cachedMatkul = data;
            cacheTime = Date.now();
        }

        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
