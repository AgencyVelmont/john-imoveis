const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-send-push-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function readBearerToken(authorization: string | null) {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

export function getServiceRoleKey() {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
}
