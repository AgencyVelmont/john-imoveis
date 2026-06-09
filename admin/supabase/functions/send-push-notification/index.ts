import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-send-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type LeadPayload = {
  id?: string;
  name?: string;
  nome?: string;
  phone?: string;
  telefone?: string;
  email?: string;
  message?: string;
  mensagem?: string;
  property_id?: string | null;
  source?: string;
  origem?: string;
};

type RequestPayload = {
  title?: string;
  body?: string;
  test?: boolean;
  lead?: LeadPayload;
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
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@felipecorretor.com.br";
  const triggerSecret = Deno.env.get("SEND_PUSH_SECRET") || "";

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return jsonResponse({ ok: false, message: "Função sem variáveis de ambiente." }, 500);
  }

  const payload = (await req.json().catch(() => null)) as RequestPayload | null;
  const isTest = Boolean(payload?.test);
  const isPublicLeadNotification = Boolean(payload?.lead && !isTest);

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const secretHeader = req.headers.get("x-send-push-secret") || "";
  const isTriggerCall = Boolean(triggerSecret && secretHeader && secretHeader === triggerSecret);
  const token = readBearerToken(req.headers.get("Authorization"));
  let requesterId = "";

  if (!isTriggerCall && !isPublicLeadNotification) {
    if (!token) {
      return jsonResponse({ ok: false, message: "Sessão obrigatória para enviar push." }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return jsonResponse({ ok: false, message: "Sessão inválida ou expirada." }, 401);
    }

    requesterId = user.id;
  }

  const lead = payload?.lead ?? {};

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  let query = supabaseAdmin
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")
    .order("created_at", { ascending: false });

  if (!isTriggerCall && requesterId) {
    query = query.eq("user_id", requesterId);
  }

  const { data: subscriptions, error } = await query;

  if (error) {
    return jsonResponse({ ok: false, message: "Não foi possível carregar inscrições push." }, 400);
  }

  const notification = buildNotificationPayload(payload, lead, isTest);
  const results = await Promise.allSettled(
    (subscriptions ?? []).map((subscription) => sendNotification(subscription, notification)),
  );

  const expiredIds = results
    .map((result, index) => ({ result, subscription: subscriptions?.[index] }))
    .filter(({ result }) => result.status === "fulfilled" && result.value.expired)
    .map(({ subscription }) => subscription?.id)
    .filter(Boolean) as string[];

  if (expiredIds.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  const sent = results.filter(
    (result) => result.status === "fulfilled" && !result.value.expired && result.value.ok,
  ).length;
  const failed = results.length - sent - expiredIds.length;

  return jsonResponse({ ok: true, sent, failed, removed: expiredIds.length }, 200);
});

async function sendNotification(
  subscription: PushSubscriptionRow,
  payload: ReturnType<typeof buildNotificationPayload>,
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
    );

    return { ok: true, expired: false };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;

    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, expired: true };
    }

    console.error("Erro ao enviar push", error);
    return { ok: false, expired: false };
  }
}

function buildNotificationPayload(
  payload: RequestPayload | null,
  lead: LeadPayload,
  isTest: boolean,
) {
  if (isTest) {
    return {
      title: "Notificações ativadas",
      body: "Seu celular já pode receber novos leads do painel.",
      url: "/leads",
      tag: `teste-${Date.now()}`,
    };
  }

  const name = cleanText(lead.name ?? lead.nome, "Sem nome");
  const phone = cleanText(lead.phone ?? lead.telefone, "Sem telefone");
  const interest = cleanText(lead.message ?? lead.mensagem, "Novo interesse recebido");

  return {
    title: cleanText(payload?.title, "Novo lead recebido"),
    body: cleanText(payload?.body, `${name} • ${phone} • ${interest}`).slice(0, 180),
    url: "/leads",
    tag: lead.id ? `lead-${lead.id}` : `lead-${Date.now()}`,
  };
}

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

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
