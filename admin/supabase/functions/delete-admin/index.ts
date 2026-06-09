import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DeleteAdminPayload = {
  userId?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true }, 200);
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, message: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, message: "Função sem variáveis de ambiente." }, 500);
  }

  const token = readBearerToken(req.headers.get("Authorization"));

  if (!token) {
    return jsonResponse({ ok: false, message: "Sessão obrigatória para excluir admin." }, 401);
  }

  const payload = (await req.json().catch(() => null)) as DeleteAdminPayload | null;
  const userId = String(payload?.userId ?? "").trim();

  if (!userId) {
    return jsonResponse({ ok: false, message: "Informe o admin que será excluído." }, 422);
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
    return jsonResponse({ ok: false, message: "Usuário sem permissão para excluir admins." }, 403);
  }

  if (requester.id === userId) {
    return jsonResponse({ ok: false, message: "Você não pode excluir o próprio usuário." }, 403);
  }

  const { data: targetResult, error: targetError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (targetError || !targetResult.user) {
    return jsonResponse({ ok: false, message: "Admin não encontrado." }, 404);
  }

  if (!isAdmin(targetResult.user)) {
    return jsonResponse({ ok: false, message: "Este usuário não é um admin." }, 400);
  }

  const { data: usersResult, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    return jsonResponse({ ok: false, message: "Não foi possível validar os admins ativos." }, 400);
  }

  const adminCount = usersResult.users.filter(isAdmin).length;

  if (adminCount <= 1) {
    return jsonResponse({ ok: false, message: "Não é possível excluir o último admin." }, 403);
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    return jsonResponse({ ok: false, message: "Não foi possível excluir o admin." }, 400);
  }

  return jsonResponse({ ok: true, message: "Admin excluído com sucesso." }, 200);
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
