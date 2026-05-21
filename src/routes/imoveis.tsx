import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties, PropertyType, Operation } from "@/data/properties";

export const Route = createFileRoute("/imoveis")({
  head: () => ({
    meta: [
      { title: "Imóveis em Santarém-PA | Felipe Vasconcelos" },
      { name: "description", content: "Casas, apartamentos, coberturas e imóveis comerciais para venda e locação em Santarém-PA." },
    ],
  }),
  component: ImoveisPage,
});

const opOptions: ("Todos" | Operation)[] = ["Todos", "Venda", "Aluguel"];
const typeOptions: ("Todos" | PropertyType)[] = ["Todos", "Casa", "Apartamento", "Cobertura", "Comercial"];

function ImoveisPage() {
  const [op, setOp] = useState<(typeof opOptions)[number]>("Todos");
  const [type, setType] = useState<(typeof typeOptions)[number]>("Todos");
  const [neighborhood, setNeighborhood] = useState("Todos");

  const neighborhoods = useMemo(
    () => ["Todos", ...Array.from(new Set(properties.map((p) => p.neighborhood)))],
    []
  );

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) =>
          (op === "Todos" || p.operation === op) &&
          (type === "Todos" || p.type === type) &&
          (neighborhood === "Todos" || p.neighborhood === neighborhood)
      ),
    [op, type, neighborhood]
  );

  return (
    <SiteLayout>
      <section className="bg-gradient-navy px-6 py-20 text-white md:px-12">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow text-gold-light">Portfólio</span>
          <h1 className="mt-3 font-display text-[clamp(38px,5vw,64px)] font-light leading-tight">
            Imóveis em <em className="italic text-gold-light">Santarém-PA</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] text-white/65">
            Use os filtros abaixo para encontrar o imóvel que combina com você. Atualizado regularmente.
          </p>
        </div>
      </section>

      {/* FILTROS */}
      <section className="border-b border-border bg-secondary px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <span className="mr-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Operação</span>
          {opOptions.map((o) => (
            <Chip key={o} active={op === o} onClick={() => setOp(o)}>{o}</Chip>
          ))}
          <span className="ml-4 mr-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Tipo</span>
          {typeOptions.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Bairro</span>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="border border-border bg-white px-3 py-2 text-[13px] text-navy outline-none focus:border-navy"
            >
              {neighborhoods.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-off-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 text-[13px] uppercase tracking-[0.1em] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </p>
          {filtered.length === 0 ? (
            <div className="border border-dashed border-border bg-white p-16 text-center">
              <p className="font-display text-2xl text-navy">Nenhum imóvel encontrado</p>
              <p className="mt-2 text-muted-foreground">Tente ajustar os filtros para ver mais opções.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-2 text-[12px] transition-colors ${
        active
          ? "border-navy bg-navy text-white"
          : "border-border bg-white text-muted-foreground hover:border-navy hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}