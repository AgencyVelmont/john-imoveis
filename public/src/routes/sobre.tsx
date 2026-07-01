import { createFileRoute } from "@tanstack/react-router";
import { Target, Heart, Compass, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { EditorialButton } from "@/components/site/EditorialButton";
import john from "@/assets/john-cutout.png";
import { WHATSAPP_LINK, SITE } from "@/lib/site";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre John Andrade | Corretor de Imóveis" },
      {
        name: "description",
        content:
          "Conheça John Andrade: corretor de imóveis com experiência jurídica, atendimento personalizado e foco em segurança nas transações.",
      },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-navy px-6 pb-0 pt-14 md:px-12 md:pt-20">
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="pointer-events-none absolute right-[8%] top-24 hidden h-[78%] w-px bg-gold/35 lg:block" />

          <div className="relative min-h-[680px] w-full pb-20 lg:min-h-[clamp(760px,85vh,980px)] lg:pb-24">
            <div
              className="relative z-30 w-full text-white lg:max-w-[840px]"
              style={{ width: "calc(100vw - 3rem)", maxWidth: "840px" }}
            >
              <span className="eyebrow text-gold">Sobre mim</span>
              <h1
                className="mt-5 font-display text-[clamp(3.1rem,7vw,7.35rem)] font-light leading-[0.9] lg:-mr-60 lg:max-w-[900px]"
                style={{ maxWidth: "min(900px, calc(100vw - 3rem))" }}
              >
                Bons negócios começam com <em className="italic text-gold-light">confiança</em>
              </h1>
            </div>

            <div className="relative z-10 mx-auto -mt-10 h-[500px] w-full max-w-[min(100%,calc(100vw-3rem))] sm:h-[600px] sm:max-w-[520px] lg:pointer-events-none lg:absolute lg:bottom-0 lg:right-[clamp(1.5rem,3.5vw,4.5rem)] lg:mt-0 lg:h-[clamp(800px,78vw,980px)] lg:max-w-none lg:w-auto">
              <div className="absolute bottom-0 left-1/2 hidden h-[72%] w-px -translate-x-28 bg-gold/25 lg:block" />
              <div className="absolute bottom-[18%] left-1/2 hidden h-px w-[min(38vw,540px)] -translate-x-28 bg-gold/20 lg:block" />
              <img
                src={john}
                alt="John Andrade"
                className="absolute inset-x-0 bottom-0 mx-auto h-full w-full object-contain object-bottom lg:inset-x-auto lg:right-0 lg:w-auto lg:max-w-none"
              />
            </div>

            <div
              className="relative z-30 w-full text-white lg:mt-10 lg:max-w-[580px]"
              style={{ width: "calc(100vw - 3rem)", maxWidth: "580px" }}
            >
              <p className="text-[14px] leading-[1.75] text-white/72">
                Sou John Andrade, corretor de imóveis. Minha marca nasceu da paixão por conectar
                pessoas a bons negócios, unindo experiência jurídica e imobiliária.
              </p>
              <p className="mt-4 text-[14px] leading-[1.75] text-white/72">
                A proposta é oferecer uma experiência discreta, sofisticada e confiável, com
                segurança nas transações, tecnologia de apoio e atendimento personalizado do
                primeiro contato ao pós-negócio.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  "Atuação em PA e SC",
                  "Conhecimento jurídico aplicado à intermediação imobiliária",
                  "Curadoria para compra, venda, locação e investimento",
                  "Atendimento humanizado com discrição e clareza",
                ].map((c) => (
                  <div key={c} className="flex items-start gap-3 text-[14px] text-white/86">
                    <span className="mt-2.5 h-px w-6 flex-shrink-0 bg-gold" />
                    <span
                      className="block min-w-0 whitespace-normal break-words leading-relaxed lg:max-w-none"
                      style={{ maxWidth: "calc(100vw - 6rem)" }}
                    >
                      {c}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap">
                <EditorialButton href={WHATSAPP_LINK()} target="_blank" rel="noreferrer">
                  Falar comigo
                </EditorialButton>
                <EditorialButton to="/imoveis" tone="white">
                  Ver imóveis
                </EditorialButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missão */}
      <section className="bg-off-white px-6 py-24 md:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <SectionHeader
            tag="Missão"
            title="Conectar pessoas a"
            titleEm="bons negócios"
            align="center"
            subtitle="Cada cliente, família ou investidor tem uma necessidade única. O compromisso é ouvir, orientar e conduzir cada negociação com ética, inovação e segurança."
          />
        </div>
      </section>

      {/* Diferenciais pessoais */}
      <section className="bg-white px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader tag="O que me move" title="Princípios que guiam meu" titleEm="trabalho" />
          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Heart,
                title: "Integridade",
                text: "A orientação vem antes da venda, com transparência sobre riscos e oportunidades.",
              },
              {
                icon: Target,
                title: "Precisão",
                text: "Curadoria objetiva para apresentar imóveis alinhados ao perfil e ao momento.",
              },
              {
                icon: Compass,
                title: "Segurança",
                text: "Acompanhamento documental e jurídico para decisões mais confiáveis.",
              },
              {
                icon: Sparkles,
                title: "Excelência",
                text: "Comunicação clara, tecnologia de apoio e acompanhamento até o pós-negócio.",
              },
            ].map((d) => (
              <div
                key={d.title}
                className="premium-reflect bg-off-white p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant-md"
              >
                <d.icon className="mb-5 h-8 w-8 text-gold" />
                <h3 className="font-display text-[clamp(1.25rem,1.6vw,1.55rem)] font-normal leading-[1.15] text-navy">
                  {d.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-navy px-6 py-20 text-center md:px-12">
        <h2 className="font-display text-[clamp(2rem,3.2vw,3.25rem)] font-light leading-[1.05] text-white">
          Vamos conversar sobre o seu <em className="italic text-gold-light">próximo passo</em>?
        </h2>
        <EditorialButton
          href={WHATSAPP_LINK()}
          target="_blank"
          rel="noreferrer"
          tone="whatsapp"
          className="mt-8"
        >
          Iniciar conversa
        </EditorialButton>
      </section>
    </SiteLayout>
  );
}
