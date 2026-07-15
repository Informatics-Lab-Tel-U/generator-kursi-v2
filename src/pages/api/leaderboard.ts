import type { APIRoute } from "astro";
import { kv } from "@vercel/kv";

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
    try {
        const room = url.searchParams.get("room") || "default";

        // Fetch the leaderboard data from Vercel KV
        const data = await kv.get(`leaderboard:${room}`);

        return new Response(JSON.stringify(data || []), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}
