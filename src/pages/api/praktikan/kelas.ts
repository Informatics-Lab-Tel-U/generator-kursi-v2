import type { APIRoute } from "astro";

export const prerender = false;

const kelasCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 jam

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const mataKuliah = url.searchParams.get("mata_kuliah") || url.searchParams.get("matakuliah");

        if (!mataKuliah) {
            return new Response(JSON.stringify({ ok: false, error: "mata_kuliah wajib diisi" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const cached = kelasCache.get(mataKuliah);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return new Response(JSON.stringify(cached.data), {
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

        const targetUrl = `${apiUrl}/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(mataKuliah)}`;
        console.log(`[EXTERNAL_API] Requesting kelas from: GET ${targetUrl}`);

        const res = await fetch(targetUrl, { headers });
        const data = await res.json();
        
        if (res.ok && data) {
            kelasCache.set(mataKuliah, { data, timestamp: Date.now() });
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
