import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { EditorialButton } from "@/components/site/EditorialButton";
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings } from "@/lib/site";
import { insertLead } from "@/data/properties";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato | John Andrade Corretor de Imóveis" },
      {
        name: "description",
        content:
          "Entre em contato com John Andrade para compra, venda, locação e investimento imobiliário.",
      },
    ],
  }),
  component: ContatoPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  whatsapp: z.string().trim().min(10, "Informe um WhatsApp válido").max(20),
  email: z
    .string()
    .trim()
    .max(255)
    .refine((value) => !value || z.string().email().safeParse(value).success, "E-mail inválido"),
  interest: z.string().min(1, "Selecione um interesse"),
  message: z.string().trim().min(5, "Conte um pouco mais").max(1000),
  website: z.string().max(0).optional(),
});

function ContatoPage() {
  const { data: site = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    interest: "",
    message: "",
    website: "",
  });
  const [loadedAt] = useState(() => Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.website || Date.now() - loadedAt < 1200) {
      toast.success("Contato registrado. John entrará em contato em breve.");
      return;
    }

    const res = schema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => {
        if (i.path[0]) errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});

    setSubmitting(true);

    try {
      await insertLead({
        name: form.name,
        phone: form.whatsapp,
        email: form.email,
        message: `Interesse: ${form.interest}\n\n${form.message}`,
      });
      toast.success("Contato registrado. John entrará em contato em breve.");
      setForm({ name: "", whatsapp: "", email: "", interest: "", message: "", website: "" });
    } catch (error) {
      console.error("Could not save contact lead", error);
      toast.error("Não foi possível registrar o lead no painel. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <Toaster />
      <section className="bg-gradient-navy px-6 py-20 text-white md:px-12">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow text-gold-light">Fale comigo</span>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,4rem)] font-light leading-[1.05]">
            Entre em <em className="italic text-gold-light">contato</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-[1.6] text-white/65">
            Responda em poucos campos e eu retorno rapidamente com as melhores opções para você.
          </p>
        </div>
      </section>

      <section className="bg-off-white px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.3fr_1fr]">
          {/* Form */}
          <form onSubmit={onSubmit} className="bg-white p-8 shadow-elegant-sm md:p-12">
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <h2 className="font-display text-[clamp(1.5rem,2vw,1.9rem)] leading-[1.1] text-navy">
              Envie sua mensagem
            </h2>
            <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground">
              Preencha o formulário para registrar seu contato e enviar a mensagem por e-mail.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <Field label="Nome completo" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border-b border-border bg-transparent py-2.5 text-[14px] outline-none focus:border-navy"
                  placeholder="Seu nome"
                />
              </Field>
              <Field label="WhatsApp" error={errors.whatsapp}>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full border-b border-border bg-transparent py-2.5 text-[14px] outline-none focus:border-navy"
                  placeholder="(93) 90000-0000"
                />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border-b border-border bg-transparent py-2.5 text-[14px] outline-none focus:border-navy"
                  placeholder="voce@email.com (opcional)"
                />
              </Field>
              <Field label="Tipo de interesse" error={errors.interest}>
                <select
                  value={form.interest}
                  onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  className="w-full border-b border-border bg-transparent py-2.5 text-[14px] outline-none focus:border-navy"
                >
                  <option value="">Selecione</option>
                  <option>Comprar imóvel</option>
                  <option>Alugar imóvel</option>
                  <option>Vender meu imóvel</option>
                  <option>Investimento</option>
                  <option>Outro</option>
                </select>
              </Field>
              <Field label="Mensagem" error={errors.message} full>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none border-b border-border bg-transparent py-2.5 text-[14px] outline-none focus:border-navy"
                  placeholder="Conte um pouco sobre o que procura..."
                />
              </Field>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <EditorialButton type="submit" disabled={submitting} tone="green">
                {submitting ? "Enviando..." : "Enviar mensagem"}
              </EditorialButton>
            </div>
          </form>

          {/* Info */}
          <aside className="flex flex-col gap-6">
            <div className="bg-navy p-8 text-white">
              <h3 className="font-display text-[clamp(1.35rem,1.7vw,1.65rem)] leading-[1.12]">
                Atendimento
              </h3>
              <p className="mt-2 text-sm text-white/65">Seg a Sáb · 08h às 20h</p>
              <div className="mt-6 flex flex-col gap-4 text-[14px]">
                <Info icon={Phone} label={site.phone} href={site.phoneHref} external={false} />
                <Info icon={Mail} label={site.email} href={`mailto:${site.email}`} />
                <Info icon={MapPin} label={site.address} />
                <Info icon={Instagram} label={site.instagramHandle} href={site.instagram} />
              </div>
            </div>

            <div className="border border-border bg-white p-8">
              <h3 className="font-display text-[clamp(1.35rem,1.7vw,1.65rem)] leading-[1.12] text-navy">
                Região de atendimento
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Atendo {site.region}, com foco em compra, venda, locação e investimento.
              </p>
              <EditorialButton
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`}
                target="_blank"
                rel="noreferrer"
                tone="peach"
                className="mt-4"
              >
                Ver no Google Maps
              </EditorialButton>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  children,
  error,
  full,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

function Info({
  icon: Icon,
  label,
  href,
  external = true,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <span className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-gold" /> {label}
    </span>
  );
  return href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="link-premium hover:text-gold-light"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}
