import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
});

function SobrePage() {
  return (
    <PublicLayout
      eyebrow="Sobre"
      title="Felipe Vasconcelos"
      description="Atendimento imobiliário com curadoria, estratégia comercial e acompanhamento próximo em cada etapa da negociação."
    >
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {["Curadoria precisa", "Negociação assistida", "Presença digital"].map((item) => (
            <article key={item} className="premium-panel border border-border bg-card p-6">
              <p className="eyebrow mb-3">Alto padrão</p>
              <h2 className="text-3xl font-display text-navy">{item}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Um processo discreto, claro e orientado ao melhor encaixe entre imóvel, momento e
                investimento.
              </p>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
