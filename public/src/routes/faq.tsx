import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { EditorialButton } from "@/components/site/EditorialButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WHATSAPP_LINK, SITE } from "@/lib/site";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ e Atendimento | John Andrade" },
      {
        name: "description",
        content:
          "Perguntas frequentes sobre compra, venda, aluguel, documentação, segurança jurídica e financiamento de imóveis.",
      },
    ],
  }),
  component: FAQPage,
});

const faqs = [
  {
    q: "Como funciona uma visita a um imóvel?",
    a: "Basta entrar em contato pelo WhatsApp ou formulário, escolher um horário e eu organizo tudo. Você recebe o endereço, condições e, se quiser, faço a visita junto com você.",
  },
  {
    q: "Vocês atuam com compra e venda?",
    a: "Sim. Atendo tanto quem quer comprar quanto quem deseja vender, com avaliação de mercado, divulgação profissional e acompanhamento até a assinatura.",
  },
  {
    q: "Trabalha com aluguel também?",
    a: "Sim, com imóveis residenciais e comerciais para locação, intermediando contrato, vistoria e documentação.",
  },
  {
    q: "Quais documentos preciso para comprar um imóvel?",
    a: "Em geral: RG, CPF, comprovante de renda, comprovante de residência e estado civil. Para financiamento, o banco solicita documentos adicionais — te ajudo nessa etapa.",
  },
  {
    q: "Posso financiar pelo banco?",
    a: "Sim. Posso te orientar sobre as melhores opções de financiamento, simulações e indicar correspondentes bancários de confiança.",
  },
  {
    q: "Quais bairros e cidades vocês atendem?",
    a: `${SITE.region}. Caso o imóvel esteja em outra região, conversamos sobre a melhor forma de ajudar.`,
  },
  {
    q: "Como é feita a avaliação do meu imóvel?",
    a: "Faço uma análise técnica considerando localização, metragem, padrão construtivo, estado de conservação e comparativo com imóveis similares vendidos recentemente.",
  },
  {
    q: "Qual a forma de contato mais rápida?",
    a: "WhatsApp é o canal mais ágil — costumo responder no mesmo dia útil.",
  },
];

function FAQPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-navy px-6 py-20 text-white md:px-12">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow text-gold-light">Tire suas dúvidas</span>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,4rem)] font-light leading-[1.05]">
            Perguntas <em className="italic text-gold-light">frequentes</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-[1.6] text-white/65">
            Reuni aqui as dúvidas mais comuns sobre compra, venda, aluguel, documentação e
            atendimento.
          </p>
        </div>
      </section>

      <section className="bg-off-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border bg-white px-6"
              >
                <AccordionTrigger className="py-5 text-left font-display text-lg font-normal text-navy hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[14px] leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* LOCALIZAÇÃO */}
      <section className="bg-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            tag="Onde estou"
            title="Localização &"
            titleEm="atendimento"
            subtitle={`Atendo presencialmente e remotamente em ${SITE.region}. Marque uma visita e venha conhecer.`}
          />

          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="aspect-[16/10] overflow-hidden border border-border bg-secondary">
              <iframe
                title="Mapa de atendimento"
                src={`https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&output=embed`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-navy p-8 text-white">
                <h3 className="font-display text-[clamp(1.35rem,1.7vw,1.65rem)] leading-[1.12]">
                  {SITE.name}
                </h3>
                <p className="mt-1 text-sm text-gold">{SITE.role}</p>
                <div className="mt-6 flex flex-col gap-3 text-[14px]">
                  <p className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gold" /> {SITE.address}
                  </p>
                  <p className="text-white/70">{SITE.region}</p>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <EditorialButton
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    tone="peach"
                  >
                    Abrir no Maps
                  </EditorialButton>
                  <EditorialButton
                    href={WHATSAPP_LINK()}
                    target="_blank"
                    rel="noreferrer"
                    tone="whatsapp"
                  >
                    Falar no WhatsApp
                  </EditorialButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
