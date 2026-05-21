import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, ArrowRight, Search, Handshake, KeyRound, ShieldCheck, Clock, MapPin, Award } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties } from "@/data/properties";
import { WHATSAPP_LINK, SITE } from "@/lib/site";
import felipe from "@/assets/felipe.png";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Felipe Vasconcelos | Corretor de Imóveis em Santarém-PA" },
      { name: "description", content: "Casas, apartamentos e imóveis comerciais em Santarém-PA com atendimento personalizado. Encontre seu próximo imóvel com Felipe Vasconcelos." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = properties.filter((p) => p.featured);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative -mt-20 min-h-[100svh] overflow-hidden bg-gradient-navy">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center", mixBlendMode: "luminosity" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
        <div className="pointer-events-none absolute right-[5%] top-1/2 hidden h-[600px] w-[600px] -translate-y-1/2 rounded-full md:block"
          style={{ background: "radial-gradient(circle, oklch(0.76 0.09 80 / 0.15) 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-6 pt-32 pb-20 md:px-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-2xl">
            <span className="mb-8 inline-flex items-center gap-2 border border-gold/30 bg-gold/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] text-gold-light">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Corretor de Imóveis · Santarém-PA
            </span>
            <h1 className="font-display text-[clamp(44px,6vw,80px)] font-light leading-[1.05] text-white">
              Encontre o imóvel <em className="italic text-gold-light">ideal</em> com quem entende de Santarém
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/65">
              Atendimento personalizado para compra, venda e locação. Casas, apartamentos, coberturas e imóveis comerciais — selecionados com critério para você decidir com confiança.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/imoveis"
                className="inline-flex items-center gap-2.5 bg-gold px-8 py-4 text-[13px] font-medium uppercase tracking-[0.08em] text-navy transition-all hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-elegant-md"
              >
                Ver imóveis <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={WHATSAPP_LINK()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 border border-white/30 px-8 py-4 text-[13px] uppercase tracking-[0.08em] text-white transition-colors hover:border-gold hover:text-gold"
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </div>

            <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
              {[
                { num: "+200", label: "Imóveis atendidos" },
                { num: "8 anos", label: "De mercado" },
                { num: "100%", label: "Atendimento dedicado" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <span className="font-display text-[32px] font-light leading-none text-white">{s.num}</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-white/50">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden justify-end lg:flex">
            <div className="relative">
              <div className="absolute -bottom-6 -right-6 h-72 w-72 border-2 border-gold" />
              <img
                src={felipe}
                alt="Felipe Vasconcelos"
                className="relative z-10 h-[560px] w-auto object-contain drop-shadow-[0_30px_50px_oklch(0_0_0/0.5)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="bg-off-white px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <SectionHeader tag="Seleção" title="Imóveis em" titleEm="destaque" subtitle="Uma curadoria atual dos melhores imóveis disponíveis em Santarém e região." />
            <Link to="/imoveis" className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] text-navy hover:text-gold">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-white px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader tag="O método" title="Como funciona o" titleEm="atendimento" subtitle="Um processo simples, transparente e focado em fazer você economizar tempo e tomar a decisão certa." align="center" />
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { icon: Search, title: "1. Entender você", text: "Conversamos sobre objetivos, orçamento, prazo e o estilo de vida que você busca." },
              { icon: Handshake, title: "2. Selecionar e visitar", text: "Apresento opções alinhadas ao seu perfil e organizo visitas sem stress." },
              { icon: KeyRound, title: "3. Fechar com segurança", text: "Conduzo proposta, documentação e financiamento até a entrega das chaves." },
            ].map((step) => (
              <div key={step.title} className="border border-border bg-off-white p-10 text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center bg-navy text-gold">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-normal text-navy">{step.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="bg-off-white px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader tag="Diferenciais" title="Por que trabalhar" titleEm="comigo" />
          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Confiança", text: "Transparência em cada etapa, do primeiro contato à assinatura." },
              { icon: Clock, title: "Agilidade", text: "Respostas rápidas e processos otimizados para você não perder tempo." },
              { icon: MapPin, title: "Conhecimento local", text: "Profundo entendimento dos bairros e do mercado de Santarém-PA." },
              { icon: Award, title: "Atendimento premium", text: "Cada cliente é tratado de forma exclusiva, do início ao pós-venda." },
            ].map((d) => (
              <div key={d.title} className="bg-white p-10">
                <d.icon className="mb-5 h-8 w-8 text-gold" />
                <h3 className="font-display text-2xl font-normal text-navy">{d.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WHATSAPP */}
      <section className="relative overflow-hidden bg-gradient-navy px-6 py-24 text-center md:px-12">
        <div className="relative mx-auto max-w-3xl">
          <h2 className="font-display text-[clamp(36px,4vw,56px)] font-light text-white">
            Pronto para encontrar seu <em className="italic text-gold-light">próximo imóvel</em>?
          </h2>
          <p className="mt-5 text-[16px] text-white/60">
            Fale comigo agora pelo WhatsApp. Vou entender o que você procura e te enviar as melhores opções disponíveis em {SITE.region}.
          </p>
          <a
            href={WHATSAPP_LINK()}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-3 bg-[oklch(0.7_0.18_145)] px-10 py-4 text-[14px] font-medium uppercase tracking-[0.08em] text-white transition-all hover:-translate-y-1 hover:bg-[oklch(0.6_0.18_145)] hover:shadow-elegant-lg"
          >
            <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}
