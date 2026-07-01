import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Instagram, Menu, MessageCircle, X } from "lucide-react";
import logo from "@/assets/brand/john-logo-horizontal-light.png";
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings, WHATSAPP_LINK } from "@/lib/site";

const navItems = [
  { to: "/", label: "Inicio" },
  { to: "/imoveis", label: "Portfólio" },
  { to: "/sobre", label: "John" },
  { to: "/contato", label: "Contato" },
  { to: "/faq", label: "Dúvidas" },
] as const;

export function Header() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-site-header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        compact ? "px-0 pt-0" : "px-3 pt-3 md:px-6"
      }`}
    >
      <div
        className={`john-nav mx-auto flex max-w-[1480px] items-center justify-between px-4 transition-all duration-300 md:px-7 ${
          compact ? "is-compact h-14 md:h-[3.75rem]" : "h-20"
        }`}
      >
        <Link to="/" className="flex items-center" aria-label="Página inicial">
          <img
            src={logo}
            alt="John Andrade Corretor de Imóveis"
            className={`w-auto object-contain transition-all duration-300 ${
              compact ? "h-11 md:h-12" : "h-[3.25rem] md:h-[3.75rem]"
            }`}
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-[clamp(0.76rem,0.85vw,0.88rem)] font-semibold uppercase tracking-[0.15em] text-white/74 transition-colors hover:text-peach"
              activeProps={{ className: "text-peach" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="hidden h-10 w-10 items-center justify-center rounded-[2px] border border-white/15 text-white/75 transition hover:border-peach hover:text-peach md:inline-flex"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
            target="_blank"
            rel="noreferrer"
            className="hidden h-11 items-center gap-2 px-2 text-[clamp(0.76rem,0.85vw,0.88rem)] font-semibold uppercase tracking-[0.12em] text-white transition hover:text-peach md:inline-flex"
          >
            Atendimento <span aria-hidden="true">→</span>
          </a>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-white/15 text-white lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="john-mobile-menu mx-auto mt-2 max-w-[1480px] px-5 py-5 lg:hidden">
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-[2px] px-4 py-3 text-sm uppercase tracking-[0.14em] text-white/78"
                activeProps={{ className: "bg-white text-deep-green" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-[2px] bg-peach px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-deep-green"
            >
              <MessageCircle className="h-4 w-4" /> Atendimento
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
