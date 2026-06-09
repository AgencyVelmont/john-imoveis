import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";

import { Sidebar } from "@/components/admin/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { siteInfo } from "@/lib/site-info";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-3">Erro 404</p>
        <h1 className="text-5xl font-display text-navy">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A rota que você buscou não existe no painel.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center px-5 h-10 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-display text-navy">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex items-center justify-center px-5 h-10 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: siteInfo.title },
      {
        name: "description",
        content: siteInfo.description,
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: siteInfo.title },
      { property: "og:description", content: siteInfo.description },
      { property: "og:url", content: siteInfo.url },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: siteInfo.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: siteInfo.title },
      { name: "twitter:description", content: siteInfo.description },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const router = useRouter();
  const navigate = useNavigate();

  const isAuthPage = pathname.startsWith("/login");
  const isPublicPage =
    ["/sobre", "/contato", "/faq"].includes(pathname) ||
    pathname === "/imoveis" ||
    (pathname.startsWith("/imoveis/") && pathname !== "/imoveis/novo");
  const [session, setSession] = useState<Session | null>(null);

  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(session);
      setIsCheckingSession(false);

      if (!session && !isAuthPage && !isPublicPage) {
        navigate({ to: "/login", replace: true });
        return;
      }

      if (session && isAuthPage) {
        navigate({ to: "/", replace: true });
        return;
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setSession(session);

      if (!session && !isAuthPage && !isPublicPage) {
        navigate({ to: "/login", replace: true });
      }

      if (session && isAuthPage) {
        navigate({ to: "/", replace: true });
      }

      router.invalidate();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isAuthPage, isPublicPage, navigate, router]);

  if (isCheckingSession) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthPage || (!session && isPublicPage) ? (
        <Outlet />
      ) : (
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-0">
            <Outlet />
          </main>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
