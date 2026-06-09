import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true }, 200);
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ ok: false, message: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, message: "Função sem variáveis de ambiente." }, 500);
  }

  const token = readBearerToken(req.headers.get("Authorization"));

  if (!token) {
    return jsonResponse({ ok: false, message: "Sessão obrigatória para listar admins." }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user: requester },
    error: requesterError,
  } = await supabaseAdmin.auth.getUser(token);

  if (requesterError || !requester) {
    return jsonResponse({ ok: false, message: "Sessão inválida ou expirada." }, 401);
  }

  if (Deno.env.get("REQUIRE_ADMIN_ROLE") === "true" && !isAdmin(requester)) {
    return jsonResponse({ ok: false, message: "Usuário sem permissão para listar admins." }, 403);
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return jsonResponse({ ok: false, message: "Não foi possível listar admins." }, 400);
  }

  const admins = data.users.filter(isAdmin).map((user) => ({
    id: user.id,
    email: user.email ?? "",
    name: String(user.user_metadata?.name ?? ""),
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    role: String(user.app_metadata?.role ?? user.user_metadata?.role ?? "admin"),
    confirmed_at: user.confirmed_at,
  }));

  return jsonResponse({ ok: true, admins }, 200);
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function readBearerToken(authorization: string | null) {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

function isAdmin(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  return user.app_metadata?.role === "admin" || user.user_metadata?.role === "admin";
}
