import { supabase } from "@/lib/supabase";
import { normalizeLeads, type Lead, type LeadStatus } from "@/lib/leads";
import type { Property, PropertyStatus } from "@/lib/properties";
import type { PropertyEventType } from "@/lib/analytics";

export type DashboardProperty = Pick<
  Property,
  | "id"
  | "title"
  | "type"
  | "purpose"
  | "price"
  | "total_area"
  | "bedrooms"
  | "neighborhood"
  | "city"
  | "state"
  | "status"
  | "featured"
  | "investment_opportunity"
  | "created_at"
>;

export type PropertyEvent = {
  id: string;
  property_id: string | null;
  event_type: PropertyEventType;
  source: string | null;
  created_at: string;
};

export type PropertyMetric = DashboardProperty & {
  views: number;
  whatsappClicks: number;
  phoneClicks: number;
  favorites: number;
  shares: number;
  leads: number;
  visits: number;
};

export type DashboardData = {
  properties: DashboardProperty[];
  events: PropertyEvent[];
  leads: Lead[];
  propertyMetrics: PropertyMetric[];
  stats: {
    totalProperties: number;
    published: number;
    sold: number;
    totalViews: number;
    whatsappClicks: number;
    phoneClicks: number;
    totalLeads: number;
    scheduledVisits: number;
    conversionRate: number;
  };
};

export async function loadDashboardData(): Promise<DashboardData> {
  const [{ data: propertiesData, error: propertiesError }, eventsResult, leadsResult] =
    await Promise.all([
      supabase
        .from("properties")
        .select(
          "id,title,type,purpose,price,total_area,bedrooms,neighborhood,city,status,featured,investment_opportunity,created_at",
        )
        .order("created_at", { ascending: false }),
      loadDashboardEvents(),
      loadDashboardLeads(),
    ]);

  if (propertiesError) throw propertiesError;

  const properties = (propertiesData ?? []) as DashboardProperty[];
  const events = eventsResult;
  const leads = leadsResult;
  const propertyMetrics = buildPropertyMetrics(properties, events, leads);

  const totalViews = countEvents(events, "view");
  const totalLeads = leads.length;

  return {
    properties,
    events,
    leads,
    propertyMetrics,
    stats: {
      totalProperties: properties.length,
      published: properties.filter((property) => property.status === "publicado").length,
      sold: properties.filter((property) => property.status === "vendido").length,
      totalViews,
      whatsappClicks: countEvents(events, "whatsapp_click"),
      phoneClicks: countEvents(events, "phone_click"),
      totalLeads,
      scheduledVisits:
        countEvents(events, "visit_schedule") +
        leads.filter((lead) => lead.status === "visita_agendada").length,
      conversionRate: totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0,
    },
  };
}

async function loadDashboardEvents() {
  const { data, error } = await supabase
    .from("property_events")
    .select("id,property_id,event_type,source,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingOptionalDataError(error)) {
      console.warn(
        "Tabela property_events ainda não disponível. Dashboard carregado sem analytics.",
      );
      return [];
    }

    throw error;
  }

  return (data ?? []) as PropertyEvent[];
}

async function loadDashboardLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*,property:properties(id,title,status,neighborhood,city)")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingOptionalDataError(error)) {
      console.warn("Tabela leads ainda não disponível. Dashboard carregado sem métricas de CRM.");
      return [];
    }

    throw error;
  }

  return normalizeLeads(data as Parameters<typeof normalizeLeads>[0]);
}

function isMissingOptionalDataError(error: unknown) {
  const message = String(
    (error as { message?: string; code?: string; details?: string }).message ?? "",
  ).toLowerCase();
  const details = String(
    (error as { message?: string; code?: string; details?: string }).details ?? "",
  ).toLowerCase();
  const code = String((error as { message?: string; code?: string }).code ?? "");

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    code === "PGRST200" ||
    message.includes("could not find the table") ||
    message.includes("relation") ||
    details.includes("leads") ||
    details.includes("property_events")
  );
}

export function buildPropertyMetrics(
  properties: DashboardProperty[],
  events: PropertyEvent[],
  leads: Lead[],
) {
  return properties.map((property) => {
    const propertyEvents = events.filter((event) => event.property_id === property.id);
    const propertyLeads = leads.filter((lead) => lead.property_id === property.id);

    return {
      ...property,
      views: countEvents(propertyEvents, "view"),
      whatsappClicks: countEvents(propertyEvents, "whatsapp_click"),
      phoneClicks: countEvents(propertyEvents, "phone_click"),
      favorites: countEvents(propertyEvents, "favorite"),
      shares: countEvents(propertyEvents, "share"),
      leads: propertyLeads.length + countEvents(propertyEvents, "lead_form"),
      visits:
        countEvents(propertyEvents, "visit_schedule") +
        propertyLeads.filter((lead) => lead.status === "visita_agendada").length,
    };
  });
}

export function countEvents(events: PropertyEvent[], eventType: PropertyEventType) {
  return events.filter((event) => event.event_type === eventType).length;
}

export function countLeadsByStatus(leads: Lead[]) {
  return leads.reduce(
    (acc, lead) => {
      acc[lead.status] += 1;
      return acc;
    },
    {
      novo: 0,
      contato: 0,
      visita_agendada: 0,
      proposta: 0,
      convertido: 0,
      perdido: 0,
    } satisfies Record<LeadStatus, number>,
  );
}

export function countPropertiesByStatus(properties: DashboardProperty[]) {
  return properties.reduce<Record<PropertyStatus, number>>(
    (acc, property) => {
      acc[property.status as PropertyStatus] += 1;
      return acc;
    },
    {
      rascunho: 0,
      publicado: 0,
      vendido: 0,
      alugado: 0,
      indisponivel: 0,
    },
  );
}

export function buildDailySeries<T extends { created_at: string }>(
  items: T[],
  days: number,
  countItem?: (item: T) => boolean,
) {
  const today = startOfDay(new Date());
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));

    return {
      date,
      key: toDateKey(date),
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: 0,
    };
  });

  const pointByKey = new Map(points.map((point) => [point.key, point]));

  items.forEach((item) => {
    if (countItem && !countItem(item)) return;

    const point = pointByKey.get(toDateKey(new Date(item.created_at)));
    if (point) point.value += 1;
  });

  return points.map(({ label, value }) => ({ label, value }));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
