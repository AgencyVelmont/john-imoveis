import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo-felipe.png";
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings, WHATSAPP_LINK } from "@/lib/site";

export function Footer() {
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  return (
    <footer className="bg-[oklch(0.18_0.02_250)] px-6 pt-16 pb-8 text-white/60 md:px-12">
      <div className="mx-auto grid max-w-7xl gap-12 border-b border-white/10 pb-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <img src={logo} alt="Felipe Vasconcelos" className="mb-4 h-10 w-auto" />
          <p className="max-w-xs text-sm leading-relaxed">{site.bio}</p>
        </div>

        <div>
          <h4 className="mb-5 text-[11px] uppercase tracking-[0.15em] text-white">Navegação</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link to="/" className="link-premium inline-flex hover:text-gold-light">
                Início
              </Link>
            </li>
            <li>
              <Link to="/imoveis" className="link-premium inline-flex hover:text-gold-light">
                Imóveis
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="link-premium inline-flex hover:text-gold-light">
                Sobre mim
              </Link>
            </li>
            <li>
              <Link to="/contato" className="link-premium inline-flex hover:text-gold-light">
                Contato
              </Link>
            </li>
            <li>
              <Link to="/faq" className="link-premium inline-flex hover:text-gold-light">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-[11px] uppercase tracking-[0.15em] text-white">Atendimento</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gold" /> {site.address}
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="link-premium flex items-center gap-2 hover:text-gold-light"
              >
                <Mail className="h-3.5 w-3.5 text-gold" /> {site.email}
              </a>
            </li>
            <li>
              <a
                href={site.phoneHref}
                className="link-premium flex items-center gap-2 hover:text-gold-light"
              >
                <Phone className="h-3.5 w-3.5 text-gold" /> {site.phone}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-[11px] uppercase tracking-[0.15em] text-white">Social</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="link-premium flex items-center gap-2 hover:text-gold-light"
              >
                <Instagram className="h-3.5 w-3.5 text-gold" /> {site.instagramHandle}
              </a>
            </li>
            <li>
              <a
                href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                className="link-premium flex items-center gap-2 hover:text-gold-light"
              >
                <MessageCircle className="h-3.5 w-3.5 text-gold" /> WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 text-xs md:flex-row md:items-center">
        <span>
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </span>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="text-gold">{site.creci}</span>
          <a
            href="https://www.instagram.com/souvelmont"
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex overflow-hidden text-[10px] uppercase tracking-[0.18em] text-white/35 transition-colors duration-300 hover:text-gold-light"
            aria-label="Desenvolvido por Velmont"
          >
            <span className="relative z-10">Desenvolvido por Velmont®</span>
            <span className="absolute inset-y-0 left-[-30%] w-1/3 -skew-x-12 bg-white/25 opacity-0 blur-[1px] transition-all duration-500 group-hover:left-[115%] group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}
