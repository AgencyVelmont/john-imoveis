import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, ArrowRight, Target, Heart, Compass, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import felipe from "@/assets/felipe.png";
import { WHATSAPP_LINK, SITE } from "@/lib/site";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Felipe Vasconcelos | Corretor de Imóveis" },
      { name: "description", content: "Conheça Felipe Vasconcelos: corretor de imóveis em Santarém-PA, com foco em atendimento personalizado e transparência." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <SiteLayout>
      <section className="bg-navy px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="relative mx-auto lg:mx-0">
            <div className="absolute -bottom-6 -right-6 h-56 w-56 border-2 border-gold" />
            <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden bg-navy-mid">
              <img src={felipe} alt="Felipe Vasconcelos" className="h-full w-full object-cover object-top" />
            </div>
          </div>

          <div className="text-white">
            <span className="eyebrow text-gold">Sobre mim</span>
            <h1 className="mt-4 font-display text-[clamp(38px,5vw,60px)] font-light leading-[1.05]">
              Realizar sonhos através de <em className="italic text-gold-light">imóveis</em>
            </h1>
            <p className="mt-6 text-[15px] leading-[1.8] text-white/70">
              Sou Felipe Vasconcelos, corretor de imóveis em {SITE.region}. Acredito que cada imóvel carrega uma história — e meu trabalho é unir a sua história ao espaço certo para você viver, investir ou começar de novo.
            </p>
            <p className="mt-4 text-[15px] leading-[1.8] text-white/70">
              Com anos de mercado na região, conheço os bairros, os preços, os caminhos da documentação e os detalhes que fazem diferença na hora de comprar, vender ou alugar. Minha proposta é simples: transparência, agilidade e atendimento personalizado de ponta a ponta.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {[
                "Corretor registrado e atuante em Santarém-PA",
                "Especialista em residencial, comercial e investimento",
                "Acompanhamento completo de documentação e financiamento",
                "Atendimento personalizado e disponibilidade real",
              ].map((c) => (
                <div key={c} className="flex items-center gap-3 text-[14px] text-white/85">
                  <span className="h-px w-5 flex-shrink-0 bg-gold" /> {c}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={WHATSAPP_LINK("Olá Felipe, vim do site e gostaria de conversar sobre imóveis.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-gold px-7 py-3.5 text-[13px] uppercase tracking-[0.08em] text-navy transition-all hover:bg-gold-light"
              >
                <MessageCircle className="h-4 w-4" /> Falar comigo
              </a>
              <Link
                to="/imoveis"
                className="inline-flex items-center gap-2 border border-white/30 px-7 py-3.5 text-[13px] uppercase tracking-[0.08em] text-white hover:border-gold hover:text-gold"
              >
                Ver imóveis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Missão */}
      <section className="bg-off-white px-6 py-24 md:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <SectionHeader tag="Missão" title="Conectar pessoas ao" titleEm="imóvel ideal" align="center"
            subtitle="Cada cliente, cada família, cada investidor tem uma necessidade única. Meu compromisso é ouvir, entender e entregar uma experiência que vai além da transação." />
        </div>
      </section>

      {/* Diferenciais pessoais */}
      <section className="bg-white px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader tag="O que me move" title="Princípios que guiam meu" titleEm="trabalho" />
          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: "Empatia", text: "Comprar ou alugar é uma decisão grande. Estou aqui para ouvir antes de oferecer." },
              { icon: Target, title: "Foco", text: "Apresento apenas imóveis alinhados ao que você realmente precisa." },
              { icon: Compass, title: "Direção", text: "Te guio pela documentação, financiamento e burocracia sem sustos." },
              { icon: Sparkles, title: "Excelência", text: "Atendimento premium, comunicação clara e acompanhamento até o pós-venda." },
            ].map((d) => (
              <div key={d.title} className="bg-off-white p-10">
                <d.icon className="mb-5 h-8 w-8 text-gold" />
                <h3 className="font-display text-2xl font-normal text-navy">{d.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-navy px-6 py-20 text-center md:px-12">
        <h2 className="font-display text-[clamp(32px,4vw,48px)] font-light text-white">
          Vamos conversar sobre o seu <em className="italic text-gold-light">próximo passo</em>?
        </h2>
        <a
          href={WHATSAPP_LINK()}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-3 bg-[oklch(0.7_0.18_145)] px-9 py-4 text-[13px] uppercase tracking-[0.08em] text-white hover:-translate-y-0.5 hover:bg-[oklch(0.6_0.18_145)]"
        >
          <MessageCircle className="h-5 w-5" /> Iniciar conversa
        </a>
      </section>
    </SiteLayout>
  );
}