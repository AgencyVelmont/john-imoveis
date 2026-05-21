import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo-felipe.png";
import { SITE, WHATSAPP_LINK } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-[oklch(0.18_0.02_250)] px-6 pt-16 pb-8 text-white/60 md:px-12">
      <div className="mx-auto grid max-w-7xl gap-12 border-b border-white/10 pb-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <img src={logo} alt="Felipe Vasconcelos" className="mb-4 h-10 w-auto" />
          <p className="max-w-xs text-sm leading-relaxed">
            Corretor de imóveis em {SITE.region}. Atendimento personalizado para quem busca o imóvel ideal — com transparência, agilidade e visão de mercado.
          </p>
        </div>

        <div>
          <h4 className="mb-5 text-[11px] uppercase tracking-[0.15em] text-white">Navegação</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li><Link to="/" className="hover:text-gold-light">Início</Link></li>
            <li><Link to="/imoveis" className="hover:text-gold-light">Imóveis</Link></li>
            <li><Link to="/sobre" className="hover:text-gold-light">Sobre mim</Link></li>
            <li><Link to="/contato" className="hover:text-gold-light">Contato</Link></li>
            <li><Link to="/faq" className="hover:text-gold-light">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-[11px] uppercase tracking-[0.15em] text-white">Atendimento</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gold" /> {SITE.address}</li>
            <li><a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-gold-light"><Mail className="h-3.5 w-3.5 text-gold" /> {SITE.email}</a></li>
            <li><a href={WHATSAPP_LINK()} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold-light"><MessageCircle className="h-3.5 w-3.5 text-gold" /> {SITE.phone}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-[11px] uppercase tracking-[0.15em] text-white">Social</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li><a href={SITE.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold-light"><Instagram className="h-3.5 w-3.5 text-gold" /> Instagram</a></li>
            <li><a href={WHATSAPP_LINK()} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold-light"><MessageCircle className="h-3.5 w-3.5 text-gold" /> WhatsApp</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 text-xs md:flex-row md:items-center">
        <span>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</span>
        <span className="text-gold">{SITE.creci}</span>
      </div>
    </footer>
  );
}