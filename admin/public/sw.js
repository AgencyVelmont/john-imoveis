const APP_SHELL_CACHE = "felipe-admin-shell-v2";
const ADMIN_ORIGIN = "https://admin.felipecorretor.com.br";
const ADMIN_LEADS_URL = `${ADMIN_ORIGIN}/leads`;
const SPA_FALLBACK_URL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) =>
        cache.addAll([
          "/",
          SPA_FALLBACK_URL,
          "/manifest.webmanifest",
          "/favicon.png",
          "/icons/icon-192x192.png",
        ]),
      ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== APP_SHELL_CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) return response;
        return caches.match(SPA_FALLBACK_URL).then((fallback) => fallback || response);
      })
      .catch(() =>
        caches.match(SPA_FALLBACK_URL).then((response) => response || fetch(SPA_FALLBACK_URL)),
      ),
  );
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "Novo lead recebido",
    body: "Abra o painel para ver os detalhes do novo contato.",
    url: "/leads",
  };

  const payload = event.data ? parsePushPayload(event.data.text(), fallback) : fallback;

  event.waitUntil(
    self.registration.showNotification(payload.title || fallback.title, {
      body: payload.body || fallback.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-128x128.png",
      data: {
        url: payload.url || fallback.url,
      },
      tag: payload.tag || "novo-lead",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = notificationTargetUrl(event.notification.data?.url);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const sameOriginClient = clients.find(
        (client) => new URL(client.url).origin === new URL(url).origin,
      );

      if (sameOriginClient) {
        return sameOriginClient
          .navigate(url)
          .then((client) => (client || sameOriginClient).focus());
      }

      return self.clients.openWindow(url);
    }),
  );
});

function parsePushPayload(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function notificationTargetUrl(url) {
  if (!url) return ADMIN_LEADS_URL;

  try {
    const targetUrl = new URL(url, ADMIN_ORIGIN);

    if (targetUrl.origin !== ADMIN_ORIGIN) {
      return ADMIN_LEADS_URL;
    }

    targetUrl.pathname = "/leads";
    targetUrl.search = "";
    targetUrl.hash = "";

    return targetUrl.href;
  } catch {
    return ADMIN_LEADS_URL;
  }
}
