import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Instagram, MessageCircle, Menu, X } from "lucide-react";
import logo from "@/assets/logo-felipe.png";
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings, WHATSAPP_LINK } from "@/lib/site";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/imoveis", label: "Imóveis" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
  { to: "/faq", label: "FAQ" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "h-16" : "h-20"
      }`}
      style={{
        background: scrolled ? "oklch(0.2 0.04 255 / 0.98)" : "oklch(0.2 0.04 255 / 0.94)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid oklch(0.76 0.09 80 / 0.15)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-12">
        <Link to="/" className="flex items-center" aria-label="Página inicial">
          <img
            src={logo}
            alt="Felipe Vasconcelos — Corretor de Imóveis"
            className="h-10 w-auto object-contain md:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-[13px] uppercase tracking-[0.08em] text-white/75 transition-colors hover:text-gold-light"
              activeProps={{ className: "text-gold-light" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="hidden h-10 w-10 items-center justify-center border border-white/15 text-white/75 transition-all hover:-translate-y-0.5 hover:border-gold/70 hover:text-gold-light md:inline-flex"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
            target="_blank"
            rel="noreferrer"
            className="premium-cta hidden items-center gap-2 bg-gold px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-navy hover:bg-gold-light md:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <button
            type="button"
            className="text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy px-6 py-6 lg:hidden">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.1em] text-white/80"
                activeProps={{ className: "text-gold-light" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm uppercase tracking-[0.1em] text-white/80"
            >
              <Instagram className="h-4 w-4 text-gold" /> Instagram
            </a>
            <a
              href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="premium-cta mt-2 inline-flex w-fit items-center gap-2 bg-gold px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-navy"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
