export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      // CORS básico (por si después llamás /log desde otro dominio)
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
  
      // Endpoint de logging
      if (url.pathname === "/log") {
        if (request.method !== "POST") {
          return new Response("Method Not Allowed", { status: 405 });
        }
  
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }
  
        const session_id = String(body.session_id || "");
        const ts = Number(body.ts || Date.now());
        const batch = body.batch ?? null;
  
        if (!session_id) return new Response("missing session_id", { status: 400 });
  
        await env.DB.prepare(
          "INSERT INTO eventos (id, session_id, timestamp, contenido) VALUES (?, ?, ?, ?)"
        )
          .bind(crypto.randomUUID(), session_id, ts, JSON.stringify(batch))
          .run();
        
  
        return new Response(JSON.stringify({ ok: true }), {
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
  
      // Todo lo demás: servir tu sitio estático desde assets
      return env.ASSETS.fetch(request);
    },
  };
  