import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/public/PublicLayout";
import { createLead } from "@/lib/leads";
import { buildWhatsappUrl, siteInfo } from "@/lib/site-info";

export const Route = createFileRoute("/contato")({
  component: ContatoPage,
});

function ContatoPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const interest = String(formData.get("interest") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    try {
      await createLead({
        name,
        phone,
        email,
        message: `${interest ? `Interesse: ${interest}\n\n` : ""}${message}`,
        source: "site",
      });

      event.currentTarget.reset();
      setSuccessMessage("Mensagem enviada. Felipe entrará em contato em breve.");
      toast.success("Lead enviado para o CRM.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Não foi possível enviar sua mensagem. Tente pelo WhatsApp.");
      toast.error("Erro ao enviar lead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout
      eyebrow="Contato"
      title="Vamos conversar"
      description="Envie uma mensagem para receber uma seleção personalizada de imóveis e orientação sobre compra, venda ou locação."
    >
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-16 md:grid-cols-3">
        <a
          href={siteInfo.phoneHref}
          className="premium-panel group border border-border bg-card p-6"
        >
          <Phone className="h-5 w-5 text-gold transition-transform group-hover:-translate-y-0.5" />
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Telefone</p>
          <p className="mt-2 text-2xl font-display text-navy">{siteInfo.phoneDisplay}</p>
        </a>
        <a
          href={buildWhatsappUrl()}
          target="_blank"
          rel="noreferrer"
          className="premium-panel group border border-border bg-card p-6"
        >
          <MessageCircle className="h-5 w-5 text-gold transition-transform group-hover:-translate-y-0.5" />
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">WhatsApp</p>
          <p className="mt-2 text-2xl font-display text-navy">Atendimento direto</p>
        </a>
        <a
          href={siteInfo.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="premium-panel group border border-border bg-card p-6"
        >
          <Instagram className="h-5 w-5 text-gold transition-transform group-hover:-translate-y-0.5" />
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Instagram
          </p>
          <p className="mt-2 text-2xl font-display text-navy">{siteInfo.instagramHandle}</p>
        </a>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <form onSubmit={handleSubmit} className="premium-panel border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={labelCls}>Nome</span>
              <input name="name" className={inputCls} placeholder="Seu nome" required />
            </label>
            <label>
              <span className={labelCls}>Telefone</span>
              <input
                name="phone"
                className={inputCls}
                placeholder={siteInfo.phoneDisplay}
                required
              />
            </label>
            <label>
              <span className={labelCls}>E-mail</span>
              <input name="email" type="email" className={inputCls} placeholder="seu@email.com" />
            </label>
            <label>
              <span className={labelCls}>Interesse</span>
              <select name="interest" className={inputCls} defaultValue="imovel">
                <option value="imovel">Comprar ou alugar imóvel</option>
                <option value="vender">Vender um imóvel</option>
                <option value="avaliar">Avaliação imobiliária</option>
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className={labelCls}>Mensagem</span>
            <textarea
              name="message"
              rows={5}
              className={textareaCls}
              placeholder="Conte rapidamente o que procura."
              required
            />
          </label>

          {successMessage && (
            <div className="mt-4 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-navy">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mt-4 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="premium-button mt-5 inline-flex h-11 items-center justify-center bg-navy px-6 text-xs uppercase tracking-[0.14em] text-white disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Enviar para o CRM"}
          </button>
        </form>
      </section>
    </PublicLayout>
  );
}

const labelCls = "block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2";
const inputCls =
  "w-full h-11 px-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans";
const textareaCls =
  "w-full px-3 py-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans resize-none";
