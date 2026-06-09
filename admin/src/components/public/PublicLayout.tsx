import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, Phone } from "lucide-react";
import { loadSiteSettings, type SiteSettingsInput } from "@/lib/settings";
import { buildPhoneHref, buildWhatsappUrlForPhone, siteInfo } from "@/lib/site-info";

type PublicLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

const navLinks = [
  { to: "/imoveis", label: "Imóveis" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
  { to: "/faq", label: "FAQ" },
] as const;

export function PublicLayout({ eyebrow, title, description, children }: PublicLayoutProps) {
  const [settings, setSettings] = useState<SiteSettingsInput | null>(null);

  useEffect(() => {
    let active = true;

    loadSiteSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((error) => {
        console.warn(error);
      });

    return () => {
      active = false;
    };
  }, []);

  const contact = getPublicContact(settings);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader contact={contact} />
      <section className="relative overflow-hidden border-b border-border">
        <div className="premium-reflection absolute inset-x-0 top-0 h-px" />
        <div className="mx-auto grid min-h-[calc(100vh-210px)] max-w-6xl content-center gap-10 px-6 py-16 md:grid-cols-[1.05fr_0.7fr]">
          <div>
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            <h1 className="max-w-3xl text-5xl font-display text-navy md:text-7xl">{title}</h1>
            {description && (
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsappCta phone={contact.phone} />
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="premium-button-secondary inline-flex h-11 items-center gap-2 border border-border px-5 text-xs uppercase tracking-[0.14em] text-navy"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
                Instagram
              </a>
            </div>
          </div>
          <aside className="premium-panel self-center border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Atendimento direto
            </p>
            <a
              href={contact.phoneHref}
              className="mt-3 inline-flex text-2xl font-display text-navy transition-colors hover:text-gold"
            >
              {contact.phone}
            </a>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Fale pelo WhatsApp para receber uma seleção alinhada ao seu objetivo, orçamento e
              estilo de vida.
            </p>
          </aside>
        </div>
      </section>
      {children}
      <PublicFooter contact={contact} />
      <WhatsappFloat phone={contact.phone} />
    </main>
  );
}

type PublicContact = {
  name: string;
  phone: string;
  phoneHref: string;
  instagramUrl: string;
  instagramHandle: string;
  description: string;
};

function getPublicContact(settings: SiteSettingsInput | null): PublicContact {
  const instagramUrl = settings?.instagram_url || siteInfo.instagramUrl;

  return {
    name: settings?.name || siteInfo.name,
    phone: settings?.phone || siteInfo.phoneDisplay,
    phoneHref: buildPhoneHref(settings?.phone || siteInfo.phoneDisplay),
    instagramUrl,
    instagramHandle: instagramUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@"),
    description: settings?.bio || siteInfo.description,
  };
}

function PublicHeader({ contact }: { contact: PublicContact }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 px-6 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6">
        <Link to="/" className="font-display text-2xl text-navy transition-colors hover:text-gold">
          {contact.name}
        </Link>
        <nav className="hidden items-center gap-5 text-xs uppercase tracking-[0.15em] text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="premium-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={contact.instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="premium-icon-button"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <a href={contact.phoneHref} aria-label="Telefone" className="premium-icon-button">
            <Phone className="h-4 w-4" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </header>
  );
}

function PublicFooter({ contact }: { contact: PublicContact }) {
  return (
    <footer className="border-t border-border bg-navy px-6 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 py-10 md:grid-cols-[1fr_auto_auto]">
        <div>
          <p className="font-display text-3xl">{contact.name}</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/60">{contact.description}</p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Contato</p>
          <a
            href={contact.phoneHref}
            className="block text-white/75 transition-colors hover:text-gold"
          >
            {contact.phone}
          </a>
          <a
            href={buildWhatsappUrlForPhone(contact.phone)}
            target="_blank"
            rel="noreferrer"
            className="block text-white/75 transition-colors hover:text-gold"
          >
            WhatsApp
          </a>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Social</p>
          <a
            href={contact.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-white/75 transition-colors hover:text-gold"
          >
            {contact.instagramHandle}
          </a>
        </div>
      </div>
    </footer>
  );
}

export function WhatsappCta({
  label = "Falar no WhatsApp",
  phone = siteInfo.phoneDisplay,
}: {
  label?: string;
  phone?: string;
}) {
  return (
    <a
      href={buildWhatsappUrlForPhone(phone)}
      target="_blank"
      rel="noreferrer"
      className="premium-button inline-flex h-11 items-center gap-2 bg-navy px-5 text-xs uppercase tracking-[0.14em] text-white"
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
      {label}
    </a>
  );
}

function WhatsappFloat({ phone }: { phone: string }) {
  return (
    <a
      href={buildWhatsappUrlForPhone(phone)}
      target="_blank"
      rel="noreferrer"
      className="premium-float fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-xl"
      aria-label="Abrir conversa no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.6} />
    </a>
  );
}
