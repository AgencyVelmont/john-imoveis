import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ResetPayload = {
  confirmation?: string;
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
    return jsonResponse({ ok: false, message: "Sessão obrigatória para resetar dados." }, 401);
  }

  const payload = (await req.json().catch(() => null)) as ResetPayload | null;

  if (payload?.confirmation !== "RESETAR") {
    return jsonResponse({ ok: false, message: "Confirmação inválida." }, 422);
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
    return jsonResponse({ ok: false, message: "Usuário sem permissão para resetar dados." }, 403);
  }

  try {
    const eventsDeleted = await clearTable(supabaseAdmin, "property_events");
    const leadsDeleted = await clearTable(supabaseAdmin, "leads");

    return jsonResponse(
      {
        ok: true,
        message: "Dados do dashboard resetados.",
        deleted: {
          property_events: eventsDeleted,
          leads: leadsDeleted,
        },
      },
      200,
    );
  } catch (error) {
    console.error(error);
    return jsonResponse(
      {
        ok: false,
        message:
          String((error as { message?: string }).message || "") ||
          "Não foi possível resetar os dados do dashboard.",
      },
      400,
    );
  }
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

async function clearTable(
  supabaseAdmin: ReturnType<typeof createClient>,
  table: "property_events" | "leads",
) {
  let deletedCount = 0;

  while (true) {
    const { data, error: selectError } = await supabaseAdmin.from(table).select("id").limit(1000);

    if (selectError) throw selectError;

    const ids = (data ?? []).map((row: { id: string }) => row.id).filter(Boolean);
    if (ids.length === 0) break;

    const { error: deleteError } = await supabaseAdmin.from(table).delete().in("id", ids);

    if (deleteError) throw deleteError;

    deletedCount += ids.length;
  }

  const { count, error: countError } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;

  if ((count ?? 0) > 0) {
    throw new Error(`Ainda existem ${count} registros em ${table}.`);
  }

  return deletedCount;
}
