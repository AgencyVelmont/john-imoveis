import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { applySiteTheme, DEFAULT_SITE_SETTINGS, fetchSiteSettings } from "@/lib/site";

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const overlapsHeader = pathname === "/";
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  useEffect(() => {
    applySiteTheme(site.theme);
  }, [site.theme]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className={`flex-1 ${overlapsHeader ? "" : "pt-[var(--site-header-offset)]"}`}>
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
