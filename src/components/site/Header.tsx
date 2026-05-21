import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Menu, X } from "lucide-react";
import logo from "@/assets/logo-felipe.png";
import { WHATSAPP_LINK } from "@/lib/site";

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
          <img src={logo} alt="Felipe Vasconcelos — Corretor de Imóveis" className="h-10 w-auto object-contain md:h-11" />
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
            href={WHATSAPP_LINK()}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 bg-gold px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-navy transition-all hover:bg-gold-light hover:-translate-y-0.5 md:inline-flex"
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
          </nav>
        </div>
      )}
    </header>
  );
}