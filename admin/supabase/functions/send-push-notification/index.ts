import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";
import webpush from "npm:web-push@3.6.7";
import { corsHeaders, getServiceRoleKey, jsonResponse, readBearerToken } from "../_shared/http.ts";

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  active?: boolean;
};

type LeadPayload = {
  id?: string;
  name?: string;
  nome?: string;
  phone?: string;
  telefone?: string;
  message?: string;
  mensagem?: string;
};

type RequestPayload = {
  title?: string;
  body?: string;
  test?: boolean;
  lead?: LeadPayload;
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST")
    return jsonResponse(req, { ok: false, message: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getServiceRoleKey();
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@johnandrade.com.br";
  const triggerSecret = Deno.env.get("SEND_PUSH_SECRET") || "";

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return jsonResponse(req, { ok: false, message: "Função sem variáveis de ambiente." }, 500);
  }

  const payload = (await req.json().catch(() => null)) as RequestPayload | null;
  const isTriggerCall = Boolean(
    triggerSecret && timingSafeEqual(req.headers.get("x-send-push-secret") || "", triggerSecret),
  );
  const token = readBearerToken(req.headers.get("Authorization"));

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let requesterId = "";
  if (!isTriggerCall) {
    if (!token)
      return jsonResponse(req, { ok: false, message: "Sessão obrigatória para enviar push." }, 401);

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user)
      return jsonResponse(req, { ok: false, message: "Sessão inválida ou expirada." }, 401);

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role,active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile?.active || !["admin", "super_admin"].includes(profile.role)) {
      return jsonResponse(
        req,
        { ok: false, message: "Usuário sem permissão para enviar push." },
        403,
      );
    }

    requesterId = data.user.id;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  let query = supabaseAdmin
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (!isTriggerCall) query = query.eq("user_id", requesterId);

  const { data: subscriptions, error } = await query;
  if (error)
    return jsonResponse(
      req,
      { ok: false, message: "Não foi possível carregar inscrições push." },
      400,
    );

  const notification = buildNotificationPayload(payload);
  const results = await Promise.allSettled(
    (subscriptions ?? []).map((subscription) => sendNotification(subscription, notification)),
  );

  const expiredIds = results
    .map((result, index) => ({ result, subscription: subscriptions?.[index] }))
    .filter(({ result }) => result.status === "fulfilled" && result.value.expired)
    .map(({ subscription }) => subscription?.id)
    .filter(Boolean) as string[];

  const sentIds = results
    .map((result, index) => ({ result, subscription: subscriptions?.[index] }))
    .filter(
      ({ result }) => result.status === "fulfilled" && !result.value.expired && result.value.ok,
    )
    .map(({ subscription }) => subscription?.id)
    .filter(Boolean) as string[];

  if (expiredIds.length > 0)
    await supabaseAdmin
      .from("push_subscriptions")
      .update({ active: false, updated_at: new Date().toISOString() })
      .in("id", expiredIds);

  if (sentIds.length > 0)
    await supabaseAdmin
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", sentIds);

  const sent = results.filter(
    (result) => result.status === "fulfilled" && !result.value.expired && result.value.ok,
  ).length;
  const failed = results.length - sent - expiredIds.length;

  return jsonResponse(req, { ok: true, sent, failed, deactivated: expiredIds.length });
});

async function sendNotification(
  subscription: PushSubscriptionRow,
  payload: ReturnType<typeof buildNotificationPayload>,
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );

    return { ok: true, expired: false };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) return { ok: false, expired: true };

    console.error("Erro ao enviar push", error);
    return { ok: false, expired: false };
  }
}

function buildNotificationPayload(payload: RequestPayload | null) {
  if (payload?.test) {
    return {
      title: "Notificações ativadas",
      body: "Seu celular já pode receber novos leads do painel.",
      url: "/leads",
      tag: `teste-${Date.now()}`,
    };
  }

  const lead = payload?.lead ?? {};
  const name = cleanText(lead.name ?? lead.nome, "Sem nome");
  const phone = cleanText(lead.phone ?? lead.telefone, "Sem telefone");
  const interest = cleanText(lead.message ?? lead.mensagem, "Novo interesse recebido");

  return {
    title: cleanText(payload?.title, "Novo lead recebido"),
    body: cleanText(payload?.body, `${name} • ${phone} • ${interest}`).slice(0, 180),
    url: lead.id ? `/leads?lead=${encodeURIComponent(String(lead.id))}` : "/leads",
    tag: lead.id ? `lead-${lead.id}` : `lead-${Date.now()}`,
  };
}

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function timingSafeEqual(received: string, expected: string) {
  const encoder = new TextEncoder();
  const receivedBytes = encoder.encode(received);
  const expectedBytes = encoder.encode(expected);
  const maxLength = Math.max(receivedBytes.length, expectedBytes.length);
  let diff = receivedBytes.length ^ expectedBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (receivedBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0);
  }

  return diff === 0;
}
