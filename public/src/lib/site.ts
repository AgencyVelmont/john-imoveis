import { supabase } from "@/lib/supabase";

export const WHATSAPP_NUMBER = import.meta.env.VITE_BRAND_WHATSAPP_NUMBER || "5500000000000";
export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá John, vim pelo site e gostaria de mais informações sobre um imóvel.";
export const WHATSAPP_LINK = (msg = WHATSAPP_DEFAULT_MESSAGE, phone = WHATSAPP_NUMBER) =>
  `https://wa.me/${phoneToDigits(phone)}?text=${encodeURIComponent(msg)}`;

export const EMAIL_LINK = (subject: string, body: string) =>
  `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const SITE = {
  name: "John Andrade",
  brandName: "John Andrade Corretor de Imóveis",
  role: "Corretor de Imóveis",
  slogan: "Conectando pessoas a bons negócios",
  creci: import.meta.env.VITE_BRAND_CRECI || "CRECI a informar",
  email: import.meta.env.VITE_BRAND_EMAIL || "contato@johnandrade.com.br",
  phone: import.meta.env.VITE_BRAND_PHONE_DISPLAY || "+55 00 00000-0000",
  phoneHref: `tel:+${WHATSAPP_NUMBER}`,
  region: "PA e SC",
  address: import.meta.env.VITE_BRAND_ADDRESS || "Endereço a informar",
  instagram: import.meta.env.VITE_BRAND_INSTAGRAM_URL || "https://instagram.com/johnandrade",
  instagramHandle: import.meta.env.VITE_BRAND_INSTAGRAM_HANDLE || "@johnandrade",
  developerName: "Velmont®",
  developerUrl: "https://www.instagram.com/souvelmont",
  developerWhatsApp: "5593984193005",
  mapsQuery: "Pará e Santa Catarina",
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  siteUrl:
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    "https://johnandradecorretor.com.br",
  whatsappMessage: WHATSAPP_DEFAULT_MESSAGE,
  positioning:
    "Assessoria imobiliária com olhar jurídico, atendimento personalizado e uso de tecnologia para negociações mais seguras.",
  values: ["Integridade", "Transparência", "Confiança", "Excelência"],
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
  theme: SiteTheme;
};

export type SiteTheme = {
  primary: string;
  secondary: string;
  button: string;
  accent: string;
  text: string;
  background: string;
  surface: string;
};

export const DEFAULT_SITE_THEME: SiteTheme = {
  primary: "#014340",
  secondary: "#8b8a78",
  button: "#014340",
  accent: "#f7bb7f",
  text: "#014340",
  background: "#f2f2f2",
  surface: "#fffaf7",
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
  bio: `Corretor de imóveis com atuação em PA e SC. Atendimento personalizado para quem busca o imóvel ideal, com transparência, agilidade e visão de mercado.`,
  whatsappMessage: SITE.whatsappMessage,
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappUrl: SITE.whatsappUrl,
  address: SITE.address,
  city: "Santarém",
  state: "PA",
  region: SITE.region,
  mapsQuery: SITE.mapsQuery,
  experienceYears: 0,
  propertiesCount: 0,
  clientsCount: 0,
  neighborhoodsCount: 0,
  theme: DEFAULT_SITE_THEME,
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
  color_primary?: string | null;
  color_secondary?: string | null;
  color_button?: string | null;
  color_accent?: string | null;
  color_text?: string | null;
  color_background?: string | null;
  color_surface?: string | null;
};

export async function fetchSiteSettings(): Promise<PublicSiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "name,creci,email,phone,instagram_url,site_url,bio,whatsapp_message,address,city,state,experience_years,properties_count,clients_count,neighborhoods_count,color_primary,color_secondary,color_button,color_accent,color_text,color_background,color_surface",
    )
    .eq("id", "main")
    .single();

  if (error || !data) {
    if (error && isMissingThemeColumn(error)) {
      return fetchSiteSettingsWithoutTheme();
    }

    return DEFAULT_SITE_SETTINGS;
  }

  return normalizeSiteSettings(data as SiteSettingsRow);
}

async function fetchSiteSettingsWithoutTheme(): Promise<PublicSiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "name,creci,email,phone,instagram_url,site_url,bio,whatsapp_message,address,city,state,experience_years,properties_count,clients_count,neighborhoods_count",
    )
    .eq("id", "main")
    .single();

  if (error || !data) return DEFAULT_SITE_SETTINGS;

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
    region: DEFAULT_SITE_SETTINGS.region,
    mapsQuery: DEFAULT_SITE_SETTINGS.mapsQuery,
    experienceYears: asCount(row.experience_years, DEFAULT_SITE_SETTINGS.experienceYears),
    propertiesCount: asCount(row.properties_count, DEFAULT_SITE_SETTINGS.propertiesCount),
    clientsCount: asCount(row.clients_count, DEFAULT_SITE_SETTINGS.clientsCount),
    neighborhoodsCount: asCount(row.neighborhoods_count, DEFAULT_SITE_SETTINGS.neighborhoodsCount),
    theme: {
      primary: normalizeHex(row.color_primary, DEFAULT_SITE_THEME.primary),
      secondary: normalizeHex(row.color_secondary, DEFAULT_SITE_THEME.secondary),
      button: normalizeHex(row.color_button, DEFAULT_SITE_THEME.button),
      accent: normalizeHex(row.color_accent, DEFAULT_SITE_THEME.accent),
      text: normalizeHex(row.color_text, DEFAULT_SITE_THEME.text),
      background: normalizeHex(row.color_background, DEFAULT_SITE_THEME.background),
      surface: normalizeHex(row.color_surface, DEFAULT_SITE_THEME.surface),
    },
  };
}

export function applySiteTheme(theme: SiteTheme = DEFAULT_SITE_THEME) {
  const root = document.documentElement;
  const primaryHover = shadeHex(theme.primary, -10);
  const buttonHover = shadeHex(theme.button, -10);
  const onPrimary = readableTextColor(theme.primary);
  const onButton = readableTextColor(theme.button);

  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-button", theme.button);
  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty("--color-text", theme.text);
  root.style.setProperty("--color-background", theme.background);
  root.style.setProperty("--color-surface", theme.surface);
  root.style.setProperty("--color-on-primary", onPrimary);
  root.style.setProperty("--color-on-button", onButton);
  root.style.setProperty("--color-primary-hover", primaryHover);
  root.style.setProperty("--color-button-hover", buttonHover);

  root.style.setProperty("--deep-green", theme.primary);
  root.style.setProperty("--sage", theme.secondary);
  root.style.setProperty("--peach", theme.accent);
  root.style.setProperty("--peach-light", shadeHex(theme.accent, 14));
  root.style.setProperty("--off-white", theme.background);
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--foreground", theme.text);
  root.style.setProperty("--card", theme.surface);
  root.style.setProperty("--card-foreground", theme.text);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", onPrimary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-foreground", readableTextColor(theme.accent));
  root.style.setProperty(
    "--gradient-navy",
    `linear-gradient(135deg, ${theme.primary}, ${primaryHover})`,
  );
  root.style.setProperty(
    "--gradient-gold",
    `linear-gradient(135deg, ${theme.accent}, ${shadeHex(theme.accent, 14)})`,
  );
}

function asCount(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

function phoneToDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function isMissingThemeColumn(error: unknown) {
  const fields = error as { code?: string; message?: string };
  const message = String(fields.message ?? "").toLowerCase();
  return (
    fields.code === "PGRST204" || message.includes("color_") || message.includes("schema cache")
  );
}

function normalizeHex(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function readableTextColor(hex: string) {
  return relativeLuminance(hex) > 0.52 ? "#014340" : "#ffffff";
}

function relativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function shadeHex(hex: string, percent: number) {
  const [r, g, b] = hexToRgb(hex);
  const next = [r, g, b].map((channel) =>
    Math.max(0, Math.min(255, Math.round(channel + (percent / 100) * 255))),
  );

  return `#${next.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex, DEFAULT_SITE_THEME.primary).slice(1);
  return [0, 2, 4].map((start) => Number.parseInt(normalized.slice(start, start + 2), 16));
}
