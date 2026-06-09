import { supabase } from "@/lib/supabase";

export const WHATSAPP_NUMBER = "559392177692";
export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá Felipe, vim pelo site e gostaria de mais informações sobre um imóvel.";
export const WHATSAPP_LINK = (msg = WHATSAPP_DEFAULT_MESSAGE, phone = WHATSAPP_NUMBER) =>
  `https://wa.me/${phoneToDigits(phone)}?text=${encodeURIComponent(msg)}`;

export const EMAIL_LINK = (subject: string, body: string) =>
  `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const SITE = {
  name: "Felipe Vasconcelos",
  role: "Corretor de Imóveis",
  creci: "CRECI 12.235",
  email: "contato@felipecorretor.com.br",
  phone: "+55 93 9217-7692",
  phoneHref: "tel:+559392177692",
  region: "Santarém e região — Pará",
  address: "Centro — Santarém, PA",
  instagram: "https://instagram.com/felipee.vasconcelos_",
  instagramHandle: "@felipee.vasconcelos_",
  developerName: "Velmont®",
  developerUrl: "https://www.instagram.com/souvelmont",
  developerWhatsApp: "5593984193005",
  mapsQuery: "Santarém, PA",
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  siteUrl: "https://felipecorretor.com.br",
  whatsappMessage: WHATSAPP_DEFAULT_MESSAGE,
};

export type PublicSiteSettings = {
  name: string;
  creci: string;
  email: string;
  phone: string;
  phoneHref: string;
  instagram: string;
  instagramHandle: string;
  siteUrl: string;
  bio: string;
  whatsappMessage: string;
  whatsappNumber: string;
  whatsappUrl: string;
  address: string;
  city: string;
  state: string;
  region: string;
  mapsQuery: string;
  experienceYears: number;
  propertiesCount: number;
  clientsCount: number;
  neighborhoodsCount: number;
};

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  name: SITE.name,
  creci: SITE.creci,
  email: SITE.email,
  phone: SITE.phone,
  phoneHref: SITE.phoneHref,
  instagram: SITE.instagram,
  instagramHandle: SITE.instagramHandle,
  siteUrl: SITE.siteUrl,
  bio: `Corretor de imóveis em ${SITE.region}. Atendimento personalizado para quem busca o imóvel ideal — com transparência, agilidade e visão de mercado.`,
  whatsappMessage: SITE.whatsappMessage,
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappUrl: SITE.whatsappUrl,
  address: SITE.address,
  city: "Santarém",
  state: "PA",
  region: SITE.region,
  mapsQuery: SITE.mapsQuery,
  experienceYears: 8,
  propertiesCount: 200,
  clientsCount: 0,
  neighborhoodsCount: 0,
};

type SiteSettingsRow = {
  name?: string | null;
  creci?: string | null;
  email?: string | null;
  phone?: string | null;
  instagram_url?: string | null;
  site_url?: string | null;
  bio?: string | null;
  whatsapp_message?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  experience_years?: number | null;
  properties_count?: number | null;
  clients_count?: number | null;
  neighborhoods_count?: number | null;
};

export async function fetchSiteSettings(): Promise<PublicSiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "name,creci,email,phone,instagram_url,site_url,bio,whatsapp_message,address,city,state,experience_years,properties_count,clients_count,neighborhoods_count",
    )
    .eq("id", "main")
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_SITE_SETTINGS;
  }

  return normalizeSiteSettings(data as SiteSettingsRow);
}

function normalizeSiteSettings(row: SiteSettingsRow): PublicSiteSettings {
  const phone = row.phone?.trim() || DEFAULT_SITE_SETTINGS.phone;
  const whatsappNumber = phoneToDigits(phone);
  const instagram = row.instagram_url?.trim() || DEFAULT_SITE_SETTINGS.instagram;
  const instagramHandle = instagram
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")
    .replace(/\/$/, "");
  const city = row.city?.trim() || DEFAULT_SITE_SETTINGS.city;
  const state = row.state?.trim() || DEFAULT_SITE_SETTINGS.state;
  const whatsappMessage = row.whatsapp_message?.trim() || DEFAULT_SITE_SETTINGS.whatsappMessage;

  return {
    name: row.name?.trim() || DEFAULT_SITE_SETTINGS.name,
    creci: row.creci?.trim() || DEFAULT_SITE_SETTINGS.creci,
    email: row.email?.trim() || DEFAULT_SITE_SETTINGS.email,
    phone,
    phoneHref: `tel:+${whatsappNumber}`,
    instagram,
    instagramHandle,
    siteUrl: row.site_url?.trim() || DEFAULT_SITE_SETTINGS.siteUrl,
    bio: row.bio?.trim() || DEFAULT_SITE_SETTINGS.bio,
    whatsappMessage,
    whatsappNumber,
    whatsappUrl: WHATSAPP_LINK(whatsappMessage, whatsappNumber),
    address: row.address?.trim() || DEFAULT_SITE_SETTINGS.address,
    city,
    state,
    region: `${city} e região — ${state}`,
    mapsQuery: `${city}, ${state}`,
    experienceYears: asCount(row.experience_years, DEFAULT_SITE_SETTINGS.experienceYears),
    propertiesCount: asCount(row.properties_count, DEFAULT_SITE_SETTINGS.propertiesCount),
    clientsCount: asCount(row.clients_count, DEFAULT_SITE_SETTINGS.clientsCount),
    neighborhoodsCount: asCount(row.neighborhoods_count, DEFAULT_SITE_SETTINGS.neighborhoodsCount),
  };
}

function asCount(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

function phoneToDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}
