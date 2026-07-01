import { createFileRoute } from "@tanstack/react-router";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PropertyCard } from "@/components/site/PropertyCard";
import { fetchPublishedProperties, PropertyType, Operation } from "@/data/properties";

export const Route = createFileRoute("/imoveis")({
  head: () => ({
    meta: [
      { title: "Imóveis | John Andrade" },
      {
        name: "description",
        content:
          "Casas, apartamentos, imóveis comerciais e oportunidades de investimento com curadoria de John Andrade.",
      },
    ],
  }),
  component: ImoveisPage,
});

const opOptions: ("Todos" | Operation)[] = ["Todos", "Venda", "Aluguel"];
const stateOptions = ["Todos", "PA", "SC"] as const;
const typeOptions: ("Todos" | PropertyType)[] = [
  "Todos",
  "Casa",
  "Apartamento",
  "Cobertura",
  "Comercial",
];

function ImoveisPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [op, setOp] = useState<(typeof opOptions)[number]>("Todos");
  const [state, setState] = useState<(typeof stateOptions)[number]>("Todos");
  const [type, setType] = useState<(typeof typeOptions)[number]>("Todos");
  const [neighborhood, setNeighborhood] = useState("Todos");
  const {
    data: properties = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["published-properties"],
    queryFn: fetchPublishedProperties,
  });

  const neighborhoods = useMemo(
    () => ["Todos", ...Array.from(new Set(properties.map((p) => p.neighborhood)))],
    [properties],
  );

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) =>
          (op === "Todos" || p.operation === op) &&
          (state === "Todos" || p.state === state) &&
          (type === "Todos" || p.type === type) &&
          (neighborhood === "Todos" || p.neighborhood === neighborhood),
      ),
    [op, state, type, neighborhood, properties],
  );

  if (pathname !== "/imoveis") {
    return <Outlet />;
  }

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-deep-green px-5 py-16 text-white md:px-10 md:py-20">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="john-mark absolute -bottom-12 left-6">JA</div>
        </div>
        <div className="relative mx-auto grid max-w-[1480px] gap-8 border-b border-white/14 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <span className="eyebrow text-peach">Portfólio</span>
            <h1 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] leading-[0.95]">
              Curadoria de imóveis.
            </h1>
          </div>
          <p className="max-w-2xl text-[clamp(0.95rem,1vw,1.08rem)] leading-[1.6] text-white/64">
            Filtros objetivos para encontrar oportunidades alinhadas ao seu momento: morar,
            investir, vender ou reposicionar patrimônio.
          </p>
        </div>
      </section>

      <section className="bg-warm-gray px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-3 border border-deep-green/12 bg-off-white p-4">
          <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sage">
            Operação
          </span>
          {opOptions.map((o) => (
            <Chip key={o} active={op === o} onClick={() => setOp(o)}>
              {o}
            </Chip>
          ))}
          <span className="ml-4 mr-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sage">
            UF
          </span>
          {stateOptions.map((option) => (
            <Chip key={option} active={state === option} onClick={() => setState(option)}>
              {option}
            </Chip>
          ))}
          <span className="ml-4 mr-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sage">
            Tipo
          </span>
          {typeOptions.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>
              {t}
            </Chip>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-sage">
              Bairro
            </span>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="border border-deep-green/15 bg-white px-4 py-3 text-[13px] text-deep-green outline-none focus:border-peach"
            >
              {neighborhoods.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-off-white px-5 py-16 md:px-10">
        <div className="mx-auto max-w-[1480px]">
          <p className="mb-8 text-[12px] font-bold uppercase tracking-[0.16em] text-sage">
            {isLoading
              ? "Carregando imóveis"
              : `${filtered.length} ${filtered.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}`}
          </p>
          {isError ? (
            <div className="border border-dashed border-deep-green/20 bg-white/70 p-16 text-center">
              <p className="text-[clamp(1.35rem,1.7vw,1.65rem)] leading-[1.12] text-deep-green">
                Não foi possível carregar os imóveis
              </p>
              <p className="mt-2 text-muted-foreground">Tente novamente em alguns instantes.</p>
            </div>
          ) : isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[520px] animate-pulse bg-white/70" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-deep-green/20 bg-white/70 p-16 text-center">
              <p className="text-[clamp(1.35rem,1.7vw,1.65rem)] leading-[1.12] text-deep-green">
                Nenhum imóvel encontrado
              </p>
              <p className="mt-2 text-muted-foreground">
                Tente ajustar os filtros para ver mais opções.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-2.5 text-[clamp(0.75rem,0.85vw,0.86rem)] font-semibold transition-colors ${
        active
          ? "border-deep-green bg-deep-green text-white"
          : "border-deep-green/15 bg-white text-sage hover:border-peach hover:text-deep-green"
      }`}
    >
      {children}
    </button>
  );
}
