import fallbackImage from "@/assets/property-1.jpg";
import { supabase } from "@/lib/supabase";

export type PropertyType = string;
export type Operation = "Venda" | "Aluguel" | string;

type PropertyImageRow = {
  id?: string;
  property_id?: string;
  url?: string | null;
  image_url?: string | null;
  public_url?: string | null;
  path?: string | null;
  storage_path?: string | null;
  file_path?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
  order_index?: number | null;
  position?: number | null;
  created_at?: string | null;
};

type PropertyRow = {
  id: string;
  title: string;
  reference_code?: string | null;
  code?: string | null;
  codigo?: string | null;
  ref?: string | null;
  description?: string | null;
  short_description?: string | null;
  full_description?: string | null;
  price?: number | string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  location_text?: string | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  total_area?: number | string | null;
  built_area?: number | string | null;
  purpose?: string | null;
  type?: string | null;
  status?: string | null;
  slug?: string | null;
  featured?: boolean | null;
  characteristics?: unknown;
  features?: unknown;
  amenities?: unknown;
  infrastructure?: unknown;
  condominium_features?: unknown;
  condo_features?: unknown;
  property_images?: PropertyImageRow[] | null;
};

export interface PropertyImage {
  id: string;
  url: string;
  isCover: boolean;
}

export interface Property {
  id: string;
  slug?: string;
  reference: string;
  title: string;
  description: string;
  shortDescription: string;
  locationText: string;
  neighborhood: string;
  city: string;
  state: string;
  price: number;
  type: PropertyType;
  purpose: Operation;
  operation: Operation;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking_spaces: number;
  parking: number;
  total_area: number;
  built_area: number;
  area: number;
  image: string;
  images: PropertyImage[];
  characteristics: string[];
  infrastructure: string[];
  featured?: boolean;
}

const propertySelect = `
  *,
  property_images (*)
`;

const asNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
};

const normalizePurpose = (purpose?: string | null): Operation => {
  const value = purpose || "Venda";
  if (
    value.toLowerCase() === "aluguel" ||
    value.toLowerCase() === "locacao" ||
    value.toLowerCase() === "locação"
  ) {
    return "Aluguel";
  }
  if (value.toLowerCase() === "venda") return "Venda";
  return value;
};

const normalizeList = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeList(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => Boolean(item))
      .map(([key, item]) => (typeof item === "string" ? item : key))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .split(/\n|,|;|•/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatReference = (row: PropertyRow) =>
  row.reference_code || row.code || row.codigo || row.ref || row.id.slice(0, 8).toUpperCase();

const imageOrder = (image: PropertyImageRow) =>
  image.sort_order ?? image.order_index ?? image.position ?? 0;

const resolveImageUrl = (image: PropertyImageRow) => {
  const directUrl = image.public_url || image.image_url || image.url;
  if (directUrl) return directUrl;

  const path = (image.storage_path || image.file_path || image.path)?.replace(
    /^property-images\//,
    "",
  );
  if (!path) return fallbackImage;

  const { data } = supabase.storage.from("property-images").getPublicUrl(path);
  return data.publicUrl;
};

const normalizeImages = (images: PropertyImageRow[] | null | undefined): PropertyImage[] => {
  const sorted = [...(images || [])].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return imageOrder(a) - imageOrder(b);
  });

  return sorted.map((image, index) => ({
    id: image.id || `${image.property_id || "image"}-${index}`,
    url: resolveImageUrl(image),
    isCover: Boolean(image.is_cover),
  }));
};

const normalizeProperty = (row: PropertyRow): Property => {
  const images = normalizeImages(row.property_images);
  const purpose = normalizePurpose(row.purpose);
  const area = asNumber(row.total_area);
  const builtArea = asNumber(row.built_area);
  const shortDescription = row.short_description || "";
  const description = row.description || row.full_description || shortDescription || "";

  return {
    id: row.id,
    slug: row.slug || undefined,
    reference: formatReference(row),
    title: row.title,
    description,
    shortDescription,
    locationText: row.location_text || "",
    neighborhood: row.neighborhood || "Santarém",
    city: row.city || "Santarém",
    state: row.state || "PA",
    price: asNumber(row.price),
    type: row.type || "Imóvel",
    purpose,
    operation: purpose,
    bedrooms: row.bedrooms || 0,
    suites: row.suites || 0,
    bathrooms: row.bathrooms || 0,
    parking_spaces: row.parking_spaces || 0,
    parking: row.parking_spaces || 0,
    total_area: area,
    built_area: builtArea,
    area,
    image: images[0]?.url || fallbackImage,
    images,
    characteristics: normalizeList(row.characteristics || row.features || row.amenities),
    infrastructure: normalizeList(
      row.infrastructure || row.condominium_features || row.condo_features,
    ),
    featured: Boolean(row.featured),
  };
};

export async function fetchPublishedProperties() {
  const { data, error } = await supabase
    .from("properties")
    .select(propertySelect)
    .eq("status", "publicado")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => normalizeProperty(row as PropertyRow));
}

export async function fetchPublishedPropertyById(propertyId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select(propertySelect)
    .eq("id", propertyId)
    .eq("status", "publicado")
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeProperty(data as PropertyRow) : null;
}

export async function insertPropertyEvent(
  propertyId: string,
  eventType: "view" | "whatsapp_click",
) {
  const { error } = await supabase.from("property_events").insert({
    property_id: propertyId,
    event_type: eventType,
    source: "website",
  });

  if (error) {
    console.error("Could not save property event", error);
  }
}

export async function insertLead(input: {
  name: string;
  phone: string;
  email?: string;
  message: string;
  propertyId?: string;
}) {
  const portuguesePayload: Record<string, string> = {
    nome: input.name,
    telefone: input.phone,
    email: input.email || "",
    mensagem: input.message,
    origem: "website",
    status: "novo",
  };

  const englishPayload: Record<string, string> = {
    name: input.name,
    phone: input.phone,
    email: input.email || "",
    message: input.message,
    source: "website",
    status: "novo",
  };

  if (input.propertyId) {
    portuguesePayload.property_id = input.propertyId;
    englishPayload.property_id = input.propertyId;
  }

  const { error } = await supabase.from("leads").insert(portuguesePayload);

  if (!error) {
    await notifyLeadCreated({
      ...input,
      source: "website",
    });
    return;
  }

  if (input.propertyId && isInvalidPropertyIdError(error)) {
    const retryPayload = withoutPropertyId(portuguesePayload);
    const retry = await supabase.from("leads").insert(retryPayload);

    if (!retry.error) {
      await notifyLeadCreated({
        ...input,
        propertyId: undefined,
        source: "website",
      });
      return;
    }
  }

  if (!isMissingColumnError(error)) {
    throw error;
  }

  const fallback = await supabase.from("leads").insert(englishPayload);

  if (fallback.error && input.propertyId && isInvalidPropertyIdError(fallback.error)) {
    const retryPayload = withoutPropertyId(englishPayload);
    const retry = await supabase.from("leads").insert(retryPayload);

    if (retry.error) throw retry.error;

    await notifyLeadCreated({
      ...input,
      propertyId: undefined,
      source: "website",
    });
    return;
  }

  if (fallback.error) throw fallback.error;

  await notifyLeadCreated({
    ...input,
    source: "website",
  });
}

export async function notifyLeadCreated(input: {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  propertyId?: string;
  source?: string;
}) {
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: {
        title: "Novo lead recebido",
        body: `${input.name} enviou uma mensagem pelo site`,
        lead: {
          id: input.id,
          name: input.name,
          nome: input.name,
          phone: input.phone,
          telefone: input.phone,
          email: input.email || "",
          message: input.message,
          mensagem: input.message,
          source: input.source || "website",
          origem: input.source || "website",
          property_id: input.propertyId || null,
        },
      },
    });
  } catch (error) {
    console.warn("Could not send push notification for new lead", error);
  }
}

function isMissingColumnError(error: unknown) {
  const fields = error as { code?: string; message?: string };
  const message = String(fields.message ?? "").toLowerCase();

  return (
    fields.code === "PGRST204" ||
    fields.code === "42703" ||
    message.includes("could not find") ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

function isInvalidPropertyIdError(error: unknown) {
  const message = String((error as { message?: string }).message ?? "").toLowerCase();

  return (
    message.includes("property_id") ||
    (message.includes("invalid input syntax") && message.includes("bigint"))
  );
}

function withoutPropertyId(payload: Record<string, string>) {
  const nextPayload = { ...payload };
  delete nextPayload.property_id;
  return nextPayload;
}

export const formatPrice = (price: number, op: Operation) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price) + (op === "Aluguel" ? "/mês" : "");
