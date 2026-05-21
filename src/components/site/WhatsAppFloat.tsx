import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/site";

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_LINK()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.7_0.18_145)] text-white shadow-elegant-lg transition-transform hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}