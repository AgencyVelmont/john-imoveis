export type PropertyPurpose = "venda" | "locacao";

export type PropertyStatus = "rascunho" | "publicado" | "vendido" | "alugado" | "indisponivel";

export type Property = {
  id: string;
  title: string;
  slug: string | null;
  short_description: string | null;
  full_description: string | null;
  purpose: PropertyPurpose;
  type: string;
  price: number | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  location_text: string | null;
  total_area: number | null;
  built_area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  status: PropertyStatus;
  featured: boolean | null;
  internal_notes: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PropertyFormValues = {
  title: string;
  type: string;
  purpose: PropertyPurpose | "";
  fullDescription: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parkingSpaces: number;
  totalArea: number;
  builtArea: number;
  price: number;
  locationText: string | null;
  neighborhood: string;
  city: string;
  state: string;
  status: PropertyStatus;
  featured: boolean;
  internalNotes: string | null;
};

export function readPropertyForm(
  formData: FormData,
  fallbackStatus: PropertyStatus,
): PropertyFormValues {
  return {
    title: toText(formData.get("title")) ?? "",
    type: toText(formData.get("type")) ?? "",
    purpose: (toText(formData.get("purpose")) ?? "") as PropertyPurpose | "",
    fullDescription: toText(formData.get("full_description")) ?? "",
    bedrooms: toInteger(formData.get("bedrooms")),
    suites: toInteger(formData.get("suites")),
    bathrooms: toInteger(formData.get("bathrooms")),
    parkingSpaces: toInteger(formData.get("parking_spaces")),
    totalArea: toDecimalNumber(formData.get("total_area")),
    builtArea: toDecimalNumber(formData.get("built_area")),
    price: toDecimalNumber(formData.get("price")),
    locationText: toText(formData.get("location_text")),
    neighborhood: toText(formData.get("neighborhood")) ?? "",
    city: toText(formData.get("city")) ?? "",
    state: toText(formData.get("state")) ?? "PA",
    status: (toText(formData.get("status")) ?? fallbackStatus) as PropertyStatus,
    featured: formData.get("featured") === "on",
    internalNotes: toText(formData.get("internal_notes")),
  };
}

export function validatePropertyForm(values: PropertyFormValues) {
  if (!values.title) return "Informe o título do imóvel.";
  if (!values.type) return "Informe o tipo do imóvel.";
  if (!values.purpose) return "Informe a finalidade do imóvel.";
  if (!values.price || values.price <= 0) return "Informe o preço do imóvel.";
  if (!values.neighborhood) return "Informe o bairro do imóvel.";
  if (!values.city) return "Informe a cidade do imóvel.";

  return "";
}

export function buildPropertyPayload(values: PropertyFormValues, status: PropertyStatus) {
  const now = new Date().toISOString();

  return {
    title: values.title,
    type: values.type,
    purpose: values.purpose,
    full_description: values.fullDescription,
    short_description: values.fullDescription.slice(0, 160),
    bedrooms: values.bedrooms,
    suites: values.suites,
    bathrooms: values.bathrooms,
    parking_spaces: values.parkingSpaces,
    total_area: values.totalArea,
    built_area: values.builtArea,
    price: values.price,
    location_text: values.locationText,
    neighborhood: values.neighborhood,
    city: values.city || "Santarém",
    state: values.state || "PA",
    status,
    featured: values.featured,
    internal_notes: values.internalNotes,
    updated_at: now,
  };
}

export function createPropertySlug(title: string) {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "imovel"}-${Date.now()}`;
}

export function formatBRL(value: number | null) {
  if (!value) return "Preço sob consulta";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function toInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function toDecimalNumber(value: FormDataEntryValue | null) {
  const normalized = normalizeDecimalText(value);
  const parsed = Number(normalized || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDecimalText(value: FormDataEntryValue | null) {
  const text = String(value || "")
    .trim()
    .replace(/\s/g, "");

  if (!text) return "";

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";

    return text.replaceAll(thousandSeparator, "").replace(decimalSeparator, ".");
  }

  if (lastComma >= 0) {
    return text.replaceAll(".", "").replace(",", ".");
  }

  const dotCount = (text.match(/\./g) || []).length;
  if (dotCount > 1) return text.replaceAll(".", "");

  return text;
}

function toText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}
