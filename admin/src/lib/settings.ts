import { supabase } from "@/lib/supabase";
import { siteInfo } from "@/lib/site-info";

export type SiteSettings = {
  id: string;
  name: string;
  creci: string;
  email: string;
  phone: string;
  instagram_url: string;
  site_url: string;
  bio: string;
  whatsapp_message: string;
  address: string;
  city: string;
  state: string;
  experience_years: number;
  properties_count: number;
  clients_count: number;
  neighborhoods_count: number;
  color_primary: string;
  color_secondary: string;
  color_button: string;
  color_accent: string;
  color_text: string;
  color_background: string;
  color_surface: string;
  created_at: string | null;
  updated_at: string | null;
};

export type SiteSettingsInput = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

export const defaultSiteSettings: SiteSettingsInput = {
  name: siteInfo.name,
  creci: "",
  email: siteInfo.email,
  phone: siteInfo.phoneDisplay,
  instagram_url: siteInfo.instagramUrl,
  site_url: siteInfo.url,
  bio: "Assessoria imobiliária com olhar jurídico, atendimento personalizado e foco em segurança nas transações.",
  whatsapp_message: siteInfo.whatsappMessage,
  address: "Endereço a informar",
  city: siteInfo.city,
  state: siteInfo.region,
  experience_years: 0,
  properties_count: 0,
  clients_count: 0,
  neighborhoods_count: 0,
  color_primary: "#014340",
  color_secondary: "#8b8a78",
  color_button: "#014340",
  color_accent: "#f7bb7f",
  color_text: "#014340",
  color_background: "#f2f2f2",
  color_surface: "#fffaf7",
};

export async function loadSiteSettings(): Promise<SiteSettingsInput> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "name,creci,email,phone,instagram_url,site_url,bio,whatsapp_message,address,city,state,experience_years,properties_count,clients_count,neighborhoods_count,color_primary,color_secondary,color_button,color_accent,color_text,color_background,color_surface",
    )
    .eq("id", "main")
    .single();

  if (error) {
    if (isMissingSettingsTable(error)) {
      return defaultSiteSettings;
    }

    if (isMissingSettingsColumn(error)) {
      return loadSiteSettingsWithoutTheme();
    }

    throw error;
  }

  return { ...defaultSiteSettings, ...(data ?? {}) };
}

async function loadSiteSettingsWithoutTheme(): Promise<SiteSettingsInput> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "name,creci,email,phone,instagram_url,site_url,bio,whatsapp_message,address,city,state,experience_years,properties_count,clients_count,neighborhoods_count",
    )
    .eq("id", "main")
    .single();

  if (error) throw error;

  return { ...defaultSiteSettings, ...(data ?? {}) };
}

export async function saveSiteSettings(values: SiteSettingsInput) {
  const { data, error } = await supabase
    .from("site_settings")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "main")
    .select("id")
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error("As configurações não foram atualizadas.");
  }
}

function isMissingSettingsTable(error: unknown) {
  const fields = error as { code?: string; message?: string };
  const message = String(fields.message ?? "").toLowerCase();

  return fields.code === "42P01" || fields.code === "PGRST205" || message.includes("site_settings");
}

function isMissingSettingsColumn(error: unknown) {
  const fields = error as { code?: string; message?: string };
  const message = String(fields.message ?? "").toLowerCase();

  return (
    fields.code === "PGRST204" || message.includes("color_") || message.includes("schema cache")
  );
}
