import type { APIRoute } from "astro";

export const prerender = false;

if (!(global as any).leaderboardClients) {
    (global as any).leaderboardClients = {};
}
if (!(global as any).leaderboardData) {
    (global as any).leaderboardData = {};
}

export const GET: APIRoute = async ({ request, url }) => {
    const room = url.searchParams.get("room") || "default";

    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const stream = new ReadableStream({
        start(controller) {
            const client = {
                write: (data: string) => {
                    try {
                        controller.enqueue(new TextEncoder().encode(data));
                    } catch (e) {
                        // Controller might be closed
                    }
                }
            };

            if (!(global as any).leaderboardClients[room]) {
                (global as any).leaderboardClients[room] = new Set();
            }
            (global as any).leaderboardClients[room].add(client);

            // Send initial data if available
            const initialData = (global as any).leaderboardData[room];
            if (initialData) {
                client.write(`data: ${JSON.stringify(initialData)}\n\n`);
            }

            request.signal.addEventListener("abort", () => {
                (global as any).leaderboardClients[room].delete(client);
                try {
                    controller.close();
                } catch(e) {}
            });
        }
    });

    return new Response(stream, {
        status: 200,
        headers
    });
}
