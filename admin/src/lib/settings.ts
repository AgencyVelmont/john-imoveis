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
  bio: "Corretor de imóveis em Santarém-PA, com atuação em casas de alto padrão, apartamentos, terrenos e imóveis comerciais.",
  whatsapp_message: siteInfo.whatsappMessage,
  address: "Centro — Santarém, PA",
  city: siteInfo.city,
  state: siteInfo.region,
  experience_years: 8,
  properties_count: 200,
  clients_count: 0,
  neighborhoods_count: 0,
};

export async function loadSiteSettings(): Promise<SiteSettingsInput> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "name,creci,email,phone,instagram_url,site_url,bio,whatsapp_message,address,city,state,experience_years,properties_count,clients_count,neighborhoods_count",
    )
    .eq("id", "main")
    .maybeSingle();

  if (error) {
    if (isMissingSettingsTable(error)) {
      return defaultSiteSettings;
    }

    throw error;
  }

  return { ...defaultSiteSettings, ...(data ?? {}) };
}

export async function saveSiteSettings(values: SiteSettingsInput) {
  const { error } = await supabase.from("site_settings").upsert({
    id: "main",
    ...values,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

function isMissingSettingsTable(error: unknown) {
  const fields = error as { code?: string; message?: string };
  const message = String(fields.message ?? "").toLowerCase();

  return fields.code === "42P01" || fields.code === "PGRST205" || message.includes("site_settings");
}
