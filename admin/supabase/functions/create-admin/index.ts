import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateAdminPayload = {
  name?: string;
  email?: string;
  password?: string;
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
    return jsonResponse({ ok: false, message: "Sessão obrigatória para criar admin." }, 401);
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
    return jsonResponse({ ok: false, message: "Usuário sem permissão para criar admins." }, 403);
  }

  const payload = (await req.json().catch(() => null)) as CreateAdminPayload | null;
  const name = String(payload?.name ?? "").trim();
  const email = String(payload?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(payload?.password ?? "");

  const validationMessage = validatePayload({ name, email, password });

  if (validationMessage) {
    return jsonResponse({ ok: false, message: validationMessage }, 422);
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: "admin",
    },
    app_metadata: {
      role: "admin",
    },
  });

  if (error) {
    return jsonResponse({ ok: false, message: authErrorMessage(error.message) }, 400);
  }

  return jsonResponse(
    {
      ok: true,
      message: "Admin criado com sucesso.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    },
    200,
  );
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

function validatePayload({ name, email, password }: Required<CreateAdminPayload>) {
  if (name.length < 2) return "Informe o nome do admin.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail válido.";
  if (password.length < 6) return "A senha inicial precisa ter pelo menos 6 caracteres.";
  return "";
}

function isAdmin(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  return user.app_metadata?.role === "admin" || user.user_metadata?.role === "admin";
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already") || normalized.includes("registered")) {
    return "Este e-mail já está cadastrado.";
  }

  if (normalized.includes("password")) {
    return "A senha não atende às regras do Supabase Auth.";
  }

  return "Não foi possível criar o admin.";
}
