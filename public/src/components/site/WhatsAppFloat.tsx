import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings, WHATSAPP_LINK } from "@/lib/site";

export function WhatsAppFloat() {
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  return (
    <a
      href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="premium-cta fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-elegant-lg hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
