import React from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import { PublicLayout } from "@/components/public/PublicLayout";
import { supabase } from "@/lib/supabase";
import { buildPropertyMetrics, type PropertyEvent } from "@/lib/dashboard";
import type { Lead } from "@/lib/leads";
import { deletePropertyImages, loadPropertyImages } from "@/lib/property-images";
import { Edit2, Home, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/imoveis")({
  component: ImoveisPage,
});

type PropertyStatus = "rascunho" | "publicado" | "vendido" | "alugado" | "indisponivel";

type Property = {
  id: string;
  title: string;
  purpose: "venda" | "locacao";
  type: string;
  price: number | null;
  neighborhood: string | null;
  city: string | null;
  total_area: number | null;
  bedrooms: number | null;
  status: PropertyStatus;
  featured: boolean | null;
  created_at: string | null;
  views: number;
  whatsappClicks: number;
  leads: number;
};

const tabs = ["Todos", "Publicados", "Rascunhos", "Vendidos"] as const;
const propertyStatuses: PropertyStatus[] = [
  "rascunho",
  "publicado",
  "vendido",
  "alugado",
  "indisponivel",
];

function formatBRL(value: number | null) {
  if (!value) return "Preço sob consulta";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusLabel(status: PropertyStatus) {
  const labels: Record<PropertyStatus, string> = {
    rascunho: "Rascunho",
    publicado: "Publicado",
    vendido: "Vendido",
    alugado: "Alugado",
    indisponivel: "Indisponível",
  };

  return labels[status] ?? status;
}

function purposeLabel(purpose: Property["purpose"]) {
  return purpose === "locacao" ? "Locação" : "Venda";
}

function statusSelectClass(status: PropertyStatus) {
  const map: Record<PropertyStatus, string> = {
    rascunho: "border-border bg-muted text-muted-foreground",
    publicado: "border-navy/20 bg-navy text-white",
    vendido: "border-gold/50 bg-gold text-navy",
    alugado: "border-emerald-200 bg-emerald-50 text-emerald-800",
    indisponivel: "border-red-200 bg-red-50 text-red-800",
  };

  return map[status];
}

function propertyLocation(property: Pick<Property, "neighborhood" | "city">) {
  const parts = [property.neighborhood, property.city].filter(Boolean);
  return parts.length ? parts.join(", ") : "Localização não informada";
}

function ImoveisPage() {
  const { pathname } = useLocation();
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, []);

  if (hasSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (pathname !== "/imoveis") {
    return <Outlet />;
  }

  return hasSession ? <ImoveisList /> : <PublicImoveisList />;
}

type PublicProperty = Omit<Property, "views" | "whatsappClicks" | "leads"> & {
  short_description: string | null;
  coverUrl: string | null;
};

function PublicImoveisList() {
  const [properties, setProperties] = React.useState<PublicProperty[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    const loadPublicProperties = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const { data, error } = await supabase
          .from("properties")
          .select(
            "id,title,short_description,purpose,type,price,neighborhood,city,total_area,bedrooms,status,featured,created_at",
          )
          .eq("status", "publicado")
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;

        const propertiesWithImages = await Promise.all(
          ((data ?? []) as Omit<PublicProperty, "coverUrl">[]).map(async (property) => {
            const images = await loadPropertyImages(property.id);
            const cover = images.find((image) => image.is_cover) ?? images[0] ?? null;

            return { ...property, coverUrl: cover?.url ?? null };
          }),
        );

        setProperties(propertiesWithImages);
      } catch (error) {
        console.error(error);
        setErrorMessage("Não foi possível carregar os imóveis publicados.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicProperties();
  }, []);

  return (
    <PublicLayout
      eyebrow="Imóveis"
      title="Portfólio selecionado"
      description="Imóveis publicados pelo painel aparecem automaticamente aqui para o site público."
    >
      <section className="mx-auto max-w-6xl px-6 py-16">
        {errorMessage && (
          <div className="mb-6 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando imóveis...</p>
        ) : properties.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum imóvel publicado no momento. Publique imóveis no painel para exibi-los aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <article key={property.id} className="premium-panel border border-border bg-card">
                <Link to="/imoveis/$propertyId" params={{ propertyId: property.id }}>
                  <div className="aspect-[4/3] bg-muted">
                    {property.coverUrl ? (
                      <img
                        src={property.coverUrl}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Home className="h-8 w-8" strokeWidth={1.4} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="eyebrow mb-2">{purposeLabel(property.purpose)}</p>
                    <h2 className="text-3xl font-display text-navy">{property.title}</h2>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {propertyLocation(property)}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <strong className="text-sm font-medium text-navy">
                        {formatBRL(property.price)}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        {property.bedrooms ? `${property.bedrooms} quartos` : property.type}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

function ImoveisList() {
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("Todos");
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = React.useState<string | null>(null);
  const [savingFeaturedId, setSavingFeaturedId] = React.useState<string | null>(null);

  const loadProperties = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const [{ data, error }, eventsResult, leadsResult] = await Promise.all([
      supabase
        .from("properties")
        .select(
          "id,title,purpose,type,price,neighborhood,city,total_area,bedrooms,status,featured,created_at",
        )
        .order("created_at", { ascending: false }),
      loadPropertyEvents(),
      loadPropertyLeads(),
    ]);

    setIsLoading(false);

    if (error) {
      console.error(error);
      setErrorMessage("Não foi possível carregar os imóveis.");
      return;
    }

    const metrics = buildPropertyMetrics(
      (data ?? []) as Parameters<typeof buildPropertyMetrics>[0],
      eventsResult,
      leadsResult,
    );

    setProperties(
      metrics.map((property) => ({
        ...property,
        views: property.views,
        whatsappClicks: property.whatsappClicks,
        leads: property.leads,
      })) as Property[],
    );
  }, []);

  React.useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const filteredProperties = React.useMemo(() => {
    if (tab === "Publicados") {
      return properties.filter((property) => property.status === "publicado");
    }

    if (tab === "Rascunhos") {
      return properties.filter((property) => property.status === "rascunho");
    }

    if (tab === "Vendidos") {
      return properties.filter((property) => property.status === "vendido");
    }

    return properties;
  }, [properties, tab]);

  const handleDelete = async (property: Property) => {
    const confirmed = window.confirm(
      `Deseja excluir o imóvel "${property.title}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    setDeletingId(property.id);

    try {
      const images = await loadPropertyImages(property.id);

      if (images.length > 0) {
        await deletePropertyImages(images);
      }

      const { error } = await supabase.from("properties").delete().eq("id", property.id);

      if (error) throw error;

      setProperties((current) => current.filter((item) => item.id !== property.id));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir imóvel.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (property: Property, nextStatus: PropertyStatus) => {
    if (property.status === nextStatus || savingStatusId) return;

    const previousStatus = property.status;
    const now = new Date().toISOString();

    setSavingStatusId(property.id);
    setProperties((current) =>
      current.map((item) => (item.id === property.id ? { ...item, status: nextStatus } : item)),
    );

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          status: nextStatus,
          updated_at: now,
          ...(nextStatus === "publicado" ? { published_at: now } : {}),
        })
        .eq("id", property.id);

      if (error) throw error;

      toast.success(`Status alterado para ${statusLabel(nextStatus)}.`);
    } catch (error) {
      console.error(error);
      setProperties((current) =>
        current.map((item) =>
          item.id === property.id ? { ...item, status: previousStatus } : item,
        ),
      );
      toast.error("Não foi possível alterar o status do imóvel.");
    } finally {
      setSavingStatusId(null);
    }
  };

  const handleFeaturedToggle = async (property: Property) => {
    if (savingFeaturedId) return;

    const nextFeatured = !property.featured;
    const previousFeatured = property.featured;

    setSavingFeaturedId(property.id);
    setProperties((current) =>
      current.map((item) => (item.id === property.id ? { ...item, featured: nextFeatured } : item)),
    );

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          featured: nextFeatured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id);

      if (error) throw error;

      toast.success(nextFeatured ? "Imóvel favoritado." : "Imóvel removido dos favoritos.");
    } catch (error) {
      console.error(error);
      setProperties((current) =>
        current.map((item) =>
          item.id === property.id ? { ...item, featured: previousFeatured } : item,
        ),
      );
      toast.error("Não foi possível alterar o favorito do imóvel.");
    } finally {
      setSavingFeaturedId(null);
    }
  };

  return (
    <>
      <Topbar
        title="Imóveis"
        subtitle="Gerencie o portfólio de imóveis"
        action={
          <Link
            to="/imoveis/novo"
            className="h-10 px-5 bg-navy text-white text-xs tracking-[0.1em] uppercase flex items-center gap-2 hover:bg-navy-mid transition-colors rounded-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} /> Novo imóvel
          </Link>
        }
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`h-9 px-4 border text-xs tracking-[0.1em] uppercase transition-colors ${
                tab === item
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-muted-foreground hover:border-gold hover:text-navy"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <section className="overflow-x-auto border border-border bg-card">
          <div className="grid min-w-[1060px] grid-cols-[1.45fr_0.85fr_0.7fr_0.95fr_0.75fr_0.65fr_120px] gap-4 px-5 py-3 border-b border-border text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>Imóvel</span>
            <span>Localização</span>
            <span>Valor</span>
            <span>Status</span>
            <span>Métricas</span>
            <span>Destaque</span>
            <span className="text-right">Ações</span>
          </div>

          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Carregando imóveis...
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-navy">Nenhum imóvel encontrado.</p>
              <Link
                to="/imoveis/novo"
                className="mt-4 inline-flex h-10 px-5 bg-gold text-navy text-xs tracking-[0.1em] uppercase items-center gap-2 hover:bg-gold-light transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} /> Cadastrar imóvel
              </Link>
            </div>
          ) : (
            <div className="min-w-[1060px] divide-y divide-border">
              {filteredProperties.map((property) => (
                <article
                  key={property.id}
                  className="grid grid-cols-[1.45fr_0.85fr_0.7fr_0.95fr_0.75fr_0.65fr_120px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <h2 className="text-sm text-navy font-medium truncate">{property.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {property.type} para {purposeLabel(property.purpose)}
                      {property.bedrooms ? ` • ${property.bedrooms} quartos` : ""}
                      {property.total_area ? ` • ${property.total_area} m²` : ""}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground truncate">
                    {propertyLocation(property)}
                  </p>

                  <p className="text-sm text-navy">{formatBRL(property.price)}</p>

                  <div className="relative">
                    <select
                      value={property.status}
                      onChange={(event) =>
                        handleStatusChange(property, event.target.value as PropertyStatus)
                      }
                      disabled={savingStatusId === property.id}
                      className={`h-9 w-full border px-3 pr-8 text-[11px] uppercase tracking-[0.08em] outline-none transition-colors disabled:cursor-wait disabled:opacity-70 ${statusSelectClass(
                        property.status,
                      )}`}
                    >
                      {propertyStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                    {savingStatusId === property.id && (
                      <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-navy" />
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground leading-5">
                    <p>{property.views} views</p>
                    <p>{property.whatsappClicks} WhatsApp</p>
                    <p>{property.leads} leads</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFeaturedToggle(property)}
                    disabled={savingFeaturedId === property.id}
                    className={`inline-flex h-9 w-fit items-center gap-1.5 border px-3 text-xs transition-colors disabled:cursor-wait disabled:opacity-60 ${
                      property.featured
                        ? "border-gold/60 bg-gold/15 text-navy"
                        : "border-border bg-background text-muted-foreground hover:border-gold hover:text-navy"
                    }`}
                    aria-label={
                      property.featured
                        ? `Remover ${property.title} dos favoritos`
                        : `Favoritar ${property.title}`
                    }
                    title={property.featured ? "Remover dos favoritos" : "Favoritar imóvel"}
                  >
                    {savingFeaturedId === property.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Star
                        className={`h-4 w-4 ${property.featured ? "fill-gold text-gold" : ""}`}
                        strokeWidth={1.5}
                      />
                    )}
                    {property.featured ? "Favorito" : "Favoritar"}
                  </button>

                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to="/imoveis/$propertyId"
                      params={{ propertyId: property.id }}
                      className="w-9 h-9 border border-border bg-background flex items-center justify-center hover:border-gold transition-colors"
                      aria-label={`Editar ${property.title}`}
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(property)}
                      disabled={deletingId === property.id}
                      className="w-9 h-9 border border-border bg-background flex items-center justify-center text-destructive hover:border-destructive transition-colors disabled:opacity-50"
                      aria-label={`Excluir ${property.title}`}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

async function loadPropertyEvents() {
  const { data, error } = await supabase
    .from("property_events")
    .select("id,property_id,event_type,source,created_at");

  if (error) {
    const code = String((error as { code?: string }).code ?? "");
    const message = String((error as { message?: string }).message ?? "").toLowerCase();

    if (code === "42P01" || code === "PGRST205" || message.includes("could not find the table")) {
      return [];
    }

    throw error;
  }

  return (data ?? []) as PropertyEvent[];
}

async function loadPropertyLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("id,property_id,name,email,phone,message,source,status,notes,created_at,updated_at");

  if (error) {
    const code = String((error as { code?: string }).code ?? "");
    const message = String((error as { message?: string }).message ?? "").toLowerCase();

    if (code === "42P01" || code === "PGRST205" || message.includes("could not find the table")) {
      return [];
    }

    throw error;
  }

  return (data ?? []) as Lead[];
}
