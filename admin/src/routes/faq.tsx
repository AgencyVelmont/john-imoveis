import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
});

const questions = [
  {
    title: "Como funciona a seleção de imóveis?",
    answer: "A curadoria parte do perfil desejado, localização, orçamento e momento de compra.",
  },
  {
    title: "Posso agendar uma visita?",
    answer: "Sim. O atendimento organiza disponibilidade, rota e informações do imóvel.",
  },
  {
    title: "Os imóveis são atualizados?",
    answer: "A disponibilidade depende do cadastro no Supabase e pode ser atualizada pelo painel.",
  },
];

function FaqPage() {
  return (
    <PublicLayout
      eyebrow="FAQ"
      title="Perguntas frequentes"
      description="Respostas rápidas para iniciar sua busca com mais clareza e segurança."
    >
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mt-10 divide-y divide-border border-y border-border">
          {questions.map((question) => (
            <article key={question.title} className="py-6">
              <h2 className="text-2xl font-display text-navy">{question.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{question.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
