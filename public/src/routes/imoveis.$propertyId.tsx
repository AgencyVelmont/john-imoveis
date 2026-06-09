import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  CheckCircle2,
  Check,
  Home,
  Images,
  Loader2,
  Mail,
  MapPin,
  Maximize,
  MessageCircle,
  Ruler,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PropertyCard } from "@/components/site/PropertyCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchPublishedProperties,
  fetchPublishedPropertyById,
  formatPrice,
  insertLead,
  insertPropertyEvent,
} from "@/data/properties";
import { WHATSAPP_LINK } from "@/lib/site";

export const Route = createFileRoute("/imoveis/$propertyId")({
  head: () => ({
    meta: [
      { title: "Detalhes do imóvel | Felipe Vasconcelos" },
      {
        name: "description",
        content: "Veja fotos, detalhes e fale com Felipe Vasconcelos sobre este imóvel.",
      },
    ],
  }),
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { propertyId } = Route.useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    data: property,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["published-property", propertyId],
    queryFn: () => fetchPublishedPropertyById(propertyId),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["published-properties"],
    queryFn: fetchPublishedProperties,
  });

  const images = useMemo(
    () =>
      property?.images.length
        ? property.images
        : property
          ? [{ id: property.id, url: property.image, isCover: true }]
          : [],
    [property],
  );

  const similarProperties = useMemo(() => {
    if (!property) return [];

    return properties
      .filter((item) => item.id !== property.id)
      .sort((a, b) => {
        const aScore =
          Number(a.neighborhood === property.neighborhood) * 3 +
          Number(a.type === property.type) * 2 +
          Number(a.purpose === property.purpose);
        const bScore =
          Number(b.neighborhood === property.neighborhood) * 3 +
          Number(b.type === property.type) * 2 +
          Number(b.purpose === property.purpose);

        return bScore - aScore;
      })
      .slice(0, 3);
  }, [properties, property]);

  const derivedCharacteristics = useMemo(() => {
    if (!property) return [];

    const items = [
      property.type,
      property.purpose === "Aluguel" ? "Locação" : "Venda",
      property.bedrooms > 0
        ? `${property.bedrooms} quarto${property.bedrooms === 1 ? "" : "s"}`
        : "",
      property.suites > 0 ? `${property.suites} suíte${property.suites === 1 ? "" : "s"}` : "",
      property.bathrooms > 0
        ? `${property.bathrooms} banheiro${property.bathrooms === 1 ? "" : "s"}`
        : "",
      property.parking_spaces > 0
        ? `${property.parking_spaces} vaga${property.parking_spaces === 1 ? "" : "s"}`
        : "",
      property.total_area > 0 ? `${formatArea(property.total_area)} de área total` : "",
      property.built_area > 0 ? `${formatArea(property.built_area)} de área construída` : "",
    ].filter(Boolean);

    return Array.from(new Set([...property.characteristics, ...items]));
  }, [property]);

  const whatsappMessage = useMemo(() => {
    if (!property)
      return "Olá Felipe, vim pelo site e gostaria de mais informações sobre um imóvel.";
    return `Olá Felipe, tenho interesse no imóvel "${property.title}" (ref. ${property.reference}) em ${property.neighborhood}, ${property.city}. Pode me passar mais informações?`;
  }, [property]);

  useEffect(() => {
    if (property?.id) {
      void insertPropertyEvent(property.id, "view");
    }
  }, [property?.id]);

  useEffect(() => {
    if (!property) return;

    document.title = `${property.title} | Felipe Vasconcelos`;
  }, [property]);

  useEffect(() => {
    setActiveImage(0);
  }, [propertyId]);

  const handleWhatsAppClick = () => {
    if (property?.id) {
      void insertPropertyEvent(property.id, "whatsapp_click");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!property) return;

    setSubmitting(true);
    setFormError("");

    try {
      await insertLead({
        name,
        phone,
        email,
        message: `Interesse no imóvel: ${property.title} (ref. ${property.reference})\n\n${
          message || whatsappMessage
        }`,
        propertyId: property.id,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Could not save property lead", error);
      setFormError("Não foi possível registrar seu interesse no painel agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-navy px-6 pb-12 pt-16 text-white md:px-12 md:pb-16 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/imoveis"
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] text-white/65 transition-colors hover:text-gold-light"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar aos imóveis
          </Link>

          {property && (
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 border border-gold/35 bg-gold/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-gold-light">
                    <Tag className="h-3.5 w-3.5" /> Ref. {property.reference}
                  </span>
                  <span className="border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/75">
                    {property.type}
                  </span>
                  <span className="border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/75">
                    {property.purpose === "Aluguel" ? "Locação" : "Venda"}
                  </span>
                </div>

                <h1 className="mt-5 max-w-5xl font-display text-[clamp(34px,5vw,64px)] font-light leading-tight">
                  {property.title}
                </h1>

                <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-white/68">
                  <MapPin className="h-4 w-4 text-gold-light" />
                  {property.neighborhood}, {property.city}
                  {property.state ? ` - ${property.state}` : ""}
                </p>
              </div>

              <div className="border border-gold/25 bg-white/[0.07] p-6 shadow-elegant-sm backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.15em] text-gold-light">
                  Valor do imóvel
                </p>
                <p className="mt-2 font-display text-[36px] font-medium leading-none text-white">
                  {formatPrice(property.price, property.purpose)}
                </p>
                <a
                  href={WHATSAPP_LINK(whatsappMessage)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleWhatsAppClick}
                  className="premium-cta mt-6 inline-flex w-full items-center justify-center gap-2 bg-whatsapp px-6 py-4 text-[13px] font-medium uppercase tracking-[0.08em] text-white hover:bg-[oklch(0.6_0.18_145)]"
                >
                  <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
                </a>
              </div>
            </div>
          )}
          {!property && (
            <>
              <span className="mt-8 block text-[11px] uppercase tracking-[0.15em] text-gold-light">
                Detalhes do imóvel
              </span>
              <h1 className="mt-3 max-w-4xl font-display text-[clamp(36px,5vw,64px)] font-light leading-tight">
                Imóvel em Santarém-PA
              </h1>
            </>
          )}
        </div>
      </section>

      <section className="bg-off-white px-6 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="h-[560px] animate-pulse bg-white" />
              <div className="h-[560px] animate-pulse bg-white" />
            </div>
          ) : isError || !property ? (
            <div className="border border-dashed border-border bg-white p-16 text-center">
              <p className="font-display text-2xl text-navy">Imóvel não encontrado</p>
              <p className="mt-2 text-muted-foreground">
                O imóvel pode ter sido removido ou ainda não está publicado.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.32fr)_minmax(340px,0.68fr)]">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary shadow-elegant-sm">
                    <img
                      src={images[activeImage]?.url || property.image}
                      alt={property.title}
                      decoding="async"
                      fetchPriority="high"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-navy/85 px-4 py-2 text-[12px] uppercase tracking-[0.1em] text-white backdrop-blur">
                      <Images className="h-4 w-4 text-gold-light" />
                      {activeImage + 1} de {images.length} fotos
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`aspect-[4/3] overflow-hidden border bg-secondary transition-colors ${
                          activeImage === index ? "border-gold" : "border-transparent"
                        }`}
                        aria-label={`Ver foto ${index + 1}`}
                      >
                        <img
                          src={image.url}
                          alt={`${property.title} - foto ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  <section className="mt-10 bg-white p-6 shadow-elegant-sm md:p-8">
                    <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                      <Info icon={BedDouble} label="Quartos" value={property.bedrooms || "-"} />
                      <Info icon={Home} label="Suítes" value={property.suites || "-"} />
                      <Info icon={Bath} label="Banheiros" value={property.bathrooms || "-"} />
                      <Info icon={Car} label="Vagas" value={property.parking_spaces || "-"} />
                      <Info
                        icon={Maximize}
                        label="Área total"
                        value={property.total_area ? formatArea(property.total_area) : "-"}
                      />
                      <Info
                        icon={Ruler}
                        label="Área construída"
                        value={property.built_area ? formatArea(property.built_area) : "-"}
                      />
                    </div>
                  </section>

                  <section className="mt-10 bg-white p-8 shadow-elegant-sm">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-gold">
                      Descrição completa
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-normal text-navy">
                      {property.title}
                    </h2>
                    {property.locationText && (
                      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-light" />
                        {property.locationText}
                      </p>
                    )}
                    <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                      {property.description ||
                        "Entre em contato para receber mais informações sobre este imóvel."}
                    </p>
                  </section>

                  {derivedCharacteristics.length > 0 && (
                    <FeatureSection
                      title="Características do imóvel"
                      items={derivedCharacteristics}
                      icon={Check}
                    />
                  )}

                  {property.infrastructure.length > 0 && (
                    <FeatureSection
                      title="Infraestrutura e condomínio"
                      items={property.infrastructure}
                      icon={Building2}
                    />
                  )}
                </div>

                <aside className="h-fit bg-white p-8 shadow-elegant-sm lg:sticky lg:top-24">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    Ref. {property.reference}
                  </p>
                  <p className="mt-2 font-display text-[34px] font-medium leading-none text-navy">
                    {formatPrice(property.price, property.purpose)}
                  </p>
                  <div className="mt-5 space-y-3 border-y border-border py-5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-navy-light" />
                      {property.neighborhood}, {property.city}
                    </p>
                    <p className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-navy-light" />
                      {property.purpose === "Aluguel" ? "Locação" : "Venda"} · {property.type}
                    </p>
                  </div>

                  <a
                    href={WHATSAPP_LINK(whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleWhatsAppClick}
                    className="premium-cta mt-7 inline-flex w-full items-center justify-center gap-2 bg-whatsapp px-6 py-4 text-[13px] font-medium uppercase tracking-[0.08em] text-white hover:bg-[oklch(0.6_0.18_145)]"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp personalizado
                  </a>

                  <form onSubmit={handleSubmit} className="mt-8 border-t border-border pt-8">
                    <h2 className="font-display text-2xl font-normal text-navy">Tenho interesse</h2>
                    <div className="mt-5 space-y-4">
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        placeholder="Nome"
                        className="h-11 rounded-none bg-off-white"
                      />
                      <Input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        required
                        placeholder="WhatsApp"
                        className="h-11 rounded-none bg-off-white"
                      />
                      <Input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        placeholder="Email"
                        className="h-11 rounded-none bg-off-white"
                      />
                      <Textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Mensagem"
                        className="min-h-28 rounded-none bg-off-white"
                      />
                    </div>

                    {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}
                    {submitted && (
                      <p className="mt-4 flex items-center gap-2 text-sm text-[oklch(0.45_0.15_145)]">
                        <CheckCircle2 className="h-4 w-4" /> Interesse enviado.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="premium-cta mt-5 inline-flex w-full items-center justify-center gap-2 bg-navy px-6 py-4 text-[13px] font-medium uppercase tracking-[0.08em] text-white hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Enviar interesse
                    </button>
                  </form>
                </aside>
              </div>

              {similarProperties.length > 0 && (
                <section className="mt-20">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-gold">
                    Imóveis semelhantes
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-normal text-navy">
                    Outras opções com o mesmo perfil
                  </h2>
                  <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {similarProperties.map((item) => (
                      <PropertyCard key={item.id} property={item} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white p-5">
      <Icon className="mb-3 h-5 w-5 text-gold" />
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl text-navy">{value}</p>
    </div>
  );
}

function FeatureSection({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
}) {
  return (
    <section className="mt-10 bg-white p-8 shadow-elegant-sm">
      <p className="text-[11px] uppercase tracking-[0.15em] text-gold">{title}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 border border-border bg-off-white p-4">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span className="text-sm leading-relaxed text-navy">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatArea(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value)} m²`;
}
