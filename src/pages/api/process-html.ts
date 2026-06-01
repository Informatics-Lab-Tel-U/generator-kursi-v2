import type { APIRoute } from "astro";
import { parse } from "node-html-parser";

export const prerender = false;

if (!(global as any).leaderboardData) {
    (global as any).leaderboardData = {};
}
if (!(global as any).leaderboardClients) {
    (global as any).leaderboardClients = {};
}

export const OPTIONS: APIRoute = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    });
};

export const POST: APIRoute = async ({ request, url }) => {
    try {
        const room = url.searchParams.get("room") || "default";
        const body = await request.json();
        const html = body.html;

        if (!html) {
            return new Response(JSON.stringify({ error: "No HTML provided" }), { status: 400 });
        }

        const root = parse(html);
        const rows = root.querySelectorAll("tbody tr");
        const headers = root.querySelectorAll("thead th").map(th => th.textContent.trim().replace(/\s+/g, ' '));
        
        const data = [];

        for (const row of rows) {
            const cells = row.querySelectorAll("td");
            if (cells.length === 0) continue;

            const rowData: Record<string, string> = {};
            let isRelevant = false;

            cells.forEach((cell, index) => {
                const header = headers[index] || `Column ${index}`;
                let text = cell.textContent.trim().replace(/\s+/g, ' ');
                
                rowData[header] = text;
                if (text && text !== '-' && text !== 'Not yet graded') {
                    isRelevant = true;
                }
            });

            // Handle standard Moodle columns
            const firstName = rowData["First name"] || rowData["Nama depan"] || "";
            const surname = rowData["Surname"] || rowData["Nama akhir"] || "";
            if (firstName || surname) {
                rowData["NAME"] = `${firstName} ${surname}`.trim();
            } else if (rowData["Name"]) {
                rowData["NAME"] = rowData["Name"];
            } else if (rowData["Nama"]) {
                rowData["NAME"] = rowData["Nama"];
            }

            // Translate state for consistency
            if (rowData["State"]) {
                rowData["STATE"] = rowData["State"];
            } else if (rowData["Keadaan"]) {
                if (rowData["Keadaan"].toLowerCase().includes("selesai")) {
                    rowData["STATE"] = "Finished";
                } else if (rowData["Keadaan"].toLowerCase().includes("sedang")) {
                    rowData["STATE"] = "In progress";
                } else {
                    rowData["STATE"] = rowData["Keadaan"];
                }
            }

            if (rowData["Time taken"]) {
                rowData["TIME TAKEN"] = rowData["Time taken"];
            } else if (rowData["Waktu yang diperlukan"]) {
                rowData["TIME TAKEN"] = rowData["Waktu yang diperlukan"];
            }

            if (isRelevant && rowData["NAME"]) {
                data.push(rowData);
            }
        }

        (global as any).leaderboardData[room] = data;

        const clients = (global as any).leaderboardClients[room] || new Set();
        const payload = JSON.stringify(data);
        for (const client of clients) {
            try {
                client.write(`data: ${payload}\n\n`);
            } catch (e) {
                // Ignore write errors
            }
        }

        return new Response(JSON.stringify({ success: true, count: data.length }), {
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
