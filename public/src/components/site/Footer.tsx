import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import logo from "@/assets/brand/john-logo-horizontal-light.png";
import { DEFAULT_SITE_SETTINGS, SITE, fetchSiteSettings, WHATSAPP_LINK } from "@/lib/site";

export function Footer() {
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  return (
    <footer className="w-full bg-deep-green px-5 py-10 text-white md:px-10">
      <div className="mx-auto grid max-w-[1480px] gap-10 border-y border-white/10 bg-white/[0.03] p-6 md:p-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <img
            src={logo}
            alt="John Andrade Corretor de Imóveis"
            className="h-16 w-auto object-contain md:h-20"
          />
          <p className="mt-7 max-w-lg text-[13px] leading-[1.6] text-white/62">{site.bio}</p>
          <p className="mt-6 max-w-sm text-[11px] uppercase tracking-[0.24em] text-peach">
            Integridade · Transparência · Confiança · Excelência
          </p>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.22em] text-white">Mapa</h4>
          <nav className="mt-5 grid gap-3 text-[13px] leading-[1.5] text-white/62">
            <Link to="/" className="transition hover:text-peach">
              Inicio
            </Link>
            <Link to="/imoveis" className="transition hover:text-peach">
              Portfólio
            </Link>
            <Link to="/sobre" className="transition hover:text-peach">
              Sobre John
            </Link>
            <Link to="/contato" className="transition hover:text-peach">
              Contato
            </Link>
          </nav>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.22em] text-white">Atendimento</h4>
          <ul className="mt-5 grid gap-3 text-[13px] leading-[1.5] text-white/62">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-peach" /> Atuação em PA e SC.
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-peach">
                <Mail className="h-4 w-4 text-peach" /> {site.email}
              </a>
            </li>
            <li>
              <a href={site.phoneHref} className="flex items-center gap-2 hover:text-peach">
                <Phone className="h-4 w-4 text-peach" /> {site.phone}
              </a>
            </li>
            <li>
              <a
                href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-peach"
              >
                <MessageCircle className="h-4 w-4 text-peach" /> WhatsApp
              </a>
            </li>
            <li>
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-peach"
              >
                <Instagram className="h-4 w-4 text-peach" /> {site.instagramHandle}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-[1480px] flex-col justify-between gap-3 px-2 text-center text-xs leading-[1.5] text-white/42 md:flex-row md:text-left">
        <span>
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </span>
        <span className="flex flex-col gap-1 md:items-end">
          <span>{site.creci}</span>
          <a
            href={SITE.developerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/38 transition hover:text-peach/80"
          >
            Desenvolvido por <span className="text-white/58">SouVelmont</span>
          </a>
        </span>
      </div>
    </footer>
  );
}
