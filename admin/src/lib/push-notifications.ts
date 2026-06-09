import { supabase } from "@/lib/supabase";

export const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushSupportStatus =
  | "supported"
  | "missing-vapid-key"
  | "unsupported"
  | "denied"
  | "inactive"
  | "active";

export type StoredPushSubscription = {
  id: string;
  endpoint: string;
};

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushStatus(userId: string): Promise<PushSupportStatus> {
  if (!isPushSupported()) return "unsupported";
  if (!vapidPublicKey) return "missing-vapid-key";
  if (Notification.permission === "denied") return "denied";

  const registration = await getServiceWorkerRegistration();
  const browserSubscription = await registration.pushManager.getSubscription();

  if (!browserSubscription) return "inactive";

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("endpoint", browserSubscription.endpoint)
    .maybeSingle();

  if (error) throw error;

  return data ? "active" : "inactive";
}

export async function enablePushNotifications(userId: string) {
  if (!isPushSupported()) {
    throw new Error("Este navegador não suporta notificações push.");
  }

  if (!vapidPublicKey) {
    throw new Error("Configure VITE_VAPID_PUBLIC_KEY no frontend do admin.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Permissão de notificação não concedida.");
  }

  const registration = await getServiceWorkerRegistration();
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const serialized = subscription.toJSON();
  const endpoint = serialized.endpoint;
  const p256dh = serialized.keys?.p256dh;
  const auth = serialized.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Não foi possível ler a inscrição push do navegador.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw error;

  return subscription;
}

export async function testPushNotification() {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    message?: string;
    sent?: number;
  }>("send-push-notification", {
    body: { test: true },
  });

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || "Não foi possível testar a notificação.");
  if (!data.sent) throw new Error("Nenhum dispositivo inscrito para receber notificações.");

  return data;
}

async function getServiceWorkerRegistration() {
  const existingRegistration = await navigator.serviceWorker.getRegistration("/");

  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
