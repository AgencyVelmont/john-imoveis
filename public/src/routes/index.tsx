import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  KeyRound,
  MapPin,
  Maximize,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EditorialButton } from "@/components/site/EditorialButton";
import { fetchPublishedProperties, formatPrice, type Property } from "@/data/properties";
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings, WHATSAPP_LINK } from "@/lib/site";
import johnCutout from "@/assets/john-cutout.png";
import heroBackground from "@/assets/hero-mansion.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "John Andrade | Corretor de Imóveis" },
      {
        name: "description",
        content:
          "Assessoria imobiliária com olhar jurídico, atendimento personalizado e negociações seguras com John Andrade.",
      },
    ],
  }),
  component: HomePage,
});

const methodItems: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Scale,
    title: "Análise jurídica",
    text: "Documentos, riscos e condições da negociação revisados antes do avanço.",
  },
  {
    icon: Building2,
    title: "Curadoria",
    text: "Imóveis e oportunidades filtrados conforme objetivo patrimonial.",
  },
  {
    icon: KeyRound,
    title: "Condução",
    text: "Proposta, negociação e fechamento acompanhados com comunicação clara.",
  },
];

const values: Array<{ icon: LucideIcon; label: string }> = [
  { icon: ShieldCheck, label: "Integridade" },
  { icon: Search, label: "Transparência" },
  { icon: Sparkles, label: "Confiança" },
  { icon: ArrowRight, label: "Excelência" },
];

type StateFilter = "PA" | "SC";

const stateFilters: StateFilter[] = ["PA", "SC"];

function HomePage() {
  const [activeFilter, setActiveFilter] = useState<StateFilter>("PA");
  const {
    data: properties = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["published-properties"],
    queryFn: fetchPublishedProperties,
  });
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  const filteredProperties = useMemo(() => {
    const list = properties.filter((property) => property.state === activeFilter);

    return list.slice(0, 6);
  }, [activeFilter, properties]);

  return (
    <SiteLayout>
      <section className="relative min-h-[100svh] overflow-hidden bg-deep-green text-white">
        <img
          src={heroBackground}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="image-veil" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-[1480px] flex-col justify-end px-5 pb-12 pt-32 md:px-10 md:pb-16">
          <div className="max-w-[720px]">
            <p className="eyebrow text-peach">John Andrade · Corretor de Imóveis</p>
            <h1 className="mt-6 max-w-[11ch] text-[clamp(2.7rem,5vw,5.5rem)] leading-[0.96] text-white">
              Imóveis com leitura estratégica e negociação segura.
            </h1>
            <p className="mt-6 max-w-md text-[clamp(0.92rem,1vw,1.05rem)] leading-[1.55] text-white/70">
              Assessoria imobiliária com olhar jurídico e curadoria personalizada.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <EditorialButton to="/imoveis">Ver portfólio</EditorialButton>
              <EditorialButton
                href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                tone="white"
              >
                Atendimento direto
              </EditorialButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-warm-gray px-5 py-20 md:px-10">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col gap-7 border-b border-deep-green/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Encontre o seu</p>
              <h2 className="mt-4 text-[clamp(2rem,3.5vw,4rem)] leading-[1] text-deep-green">
                Curadoria em formato de catálogo.
              </h2>
              <div className="mt-6 space-y-3 text-sm leading-[1.45] text-deep-green/68">
                <p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage">
                    Atuação
                  </span>
                  <br />
                  {site.region}
                </p>
                <p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage">
                    Especialidade
                  </span>
                  <br />
                  Compra, venda, locação e investimento
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
              {stateFilters.map((state) => {
                const active = activeFilter === state;

                return (
                  <button
                    key={state}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveFilter(state)}
                    className={`editorial-button inline-flex h-11 min-w-24 items-center justify-center px-6 text-[12px] font-bold uppercase tracking-[0.18em] transition md:h-12 md:min-w-28 ${
                      active
                        ? "bg-deep-green text-white shadow-elegant-sm"
                        : "border border-deep-green/18 bg-off-white text-deep-green hover:border-peach hover:text-sage"
                    }`}
                  >
                    {state}
                  </button>
                );
              })}
              <EditorialButton to="/imoveis" tone="green" className="h-11 px-6 py-0 md:h-12">
                Buscar imóvel
              </EditorialButton>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sage">
              {isLoading
                ? "Carregando curadoria"
                : `${filteredProperties.length} ${
                    filteredProperties.length === 1 ? "resultado" : "resultados"
                  } em ${activeFilter}`}
            </p>
          </div>

          {isError && (
            <div className="mt-8 border border-deep-green/14 bg-off-white px-5 py-4 text-sm text-deep-green">
              Não foi possível carregar os imóveis em destaque.
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[480px] animate-pulse bg-off-white/70" />
              ))
            ) : filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <FeaturedPropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="border border-deep-green/14 bg-off-white px-6 py-12 text-sm text-deep-green/68 md:col-span-2 xl:col-span-3">
                Nenhum imóvel encontrado em {activeFilter} no momento.
              </div>
            )}
          </div>

          <EditorialButton to="/imoveis" tone="green" className="mt-10">
            Veja mais imóveis
          </EditorialButton>
        </div>
      </section>

      <section className="relative z-20 -mt-px overflow-visible bg-deep-green px-5 py-24 text-white md:px-10">
        <div className="pointer-events-none absolute bottom-0 right-8 z-10 hidden h-[calc(100%+28px)] w-[30%] opacity-95 md:h-[calc(100%+18px)] lg:block xl:right-12 xl:h-[calc(100%+44px)]">
          <img
            src={johnCutout}
            alt=""
            className="h-full w-full origin-bottom scale-[1.08] object-contain object-bottom"
          />
        </div>
        <div className="relative z-20 mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.65fr_0.35fr]">
          <div>
            <p className="eyebrow text-peach">Método</p>
            <h2 className="mt-5 max-w-5xl text-[clamp(2rem,3.5vw,4rem)] leading-[1]">
              Discrição visual. Precisão na negociação.
            </h2>
            <div className="mt-12 grid gap-px bg-white/12 md:grid-cols-3">
              {methodItems.map((item) => (
                <div key={item.title} className="bg-deep-green p-7">
                  <item.icon className="h-7 w-7 text-peach" />
                  <h3 className="mt-7 text-[clamp(1.35rem,1.8vw,1.75rem)] leading-[1.12] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[clamp(0.9rem,0.95vw,1rem)] leading-[1.6] text-white/62">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-end gap-3 lg:-translate-x-20 lg:pb-8 xl:-translate-x-24">
            {values.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 border-b border-white/12 py-5"
              >
                <item.icon className="h-5 w-5 text-peach" />
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/82">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-peach px-5 py-20 text-deep-green md:px-10">
        <div className="mx-auto flex max-w-[1480px] flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-deep-green/70">Próximo passo</p>
            <h2 className="mt-4 max-w-5xl text-[clamp(2rem,3.5vw,4rem)] leading-[1]">
              Vamos avaliar o melhor caminho para o seu imóvel?
            </h2>
          </div>
          <EditorialButton
            href={WHATSAPP_LINK(site.whatsappMessage, site.whatsappNumber)}
            target="_blank"
            rel="noreferrer"
            tone="green"
            className="shrink-0"
          >
            Conversar agora
          </EditorialButton>
        </div>
      </section>
    </SiteLayout>
  );
}

function FeaturedPropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to="/imoveis/$propertyId"
      params={{ propertyId: property.id }}
      className="group relative min-h-[480px] overflow-hidden bg-deep-green text-white md:min-h-[560px]"
    >
      <img
        src={property.image}
        alt={property.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
      />
      <div className="image-veil" />
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-peach">
          {property.type} · {property.purpose}
        </p>
        <h3 className="mt-3 text-[clamp(1.45rem,2.4vw,2.35rem)] leading-[1.02]">
          {property.title}
        </h3>
        <p className="mt-4 flex items-center gap-2 text-sm text-white/74">
          <MapPin className="h-4 w-4 text-peach" />
          {property.city}
          {property.state ? `, ${property.state}` : ""}
        </p>

        <div className="mt-6 grid gap-3 border-t border-white/16 pt-5 text-xs text-white/78 sm:grid-cols-2">
          <span className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-peach" /> {property.bedrooms} quartos
          </span>
          <span className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-peach" /> {property.bathrooms} banheiros
          </span>
          <span className="flex items-center gap-2">
            <Maximize className="h-4 w-4 text-peach" /> Terreno {property.total_area} m²
          </span>
          <span className="font-semibold text-white">
            {formatPrice(property.price, property.purpose)}
          </span>
        </div>

        <span className="mt-6 inline-flex border border-peach px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-peach transition group-hover:bg-peach group-hover:text-deep-green">
          Ver imóvel
        </span>
      </div>
    </Link>
  );
}
