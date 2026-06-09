import { supabase } from "./supabase";

export type PropertyEventType =
  | "view"
  | "whatsapp_click"
  | "phone_click"
  | "favorite"
  | "share"
  | "lead_form"
  | "visit_schedule";

export async function trackPropertyEvent({
  propertyId,
  eventType,
  source,
  metadata = {},
}: {
  propertyId?: string;
  eventType: PropertyEventType;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.from("property_events").insert({
      property_id: propertyId ?? null,
      event_type: eventType,
      source: source ?? "website",
      metadata,
      visitor_id: getVisitorId(),
    });
  } catch (error) {
    console.error("Analytics error:", error);
  }
}

export function trackView(propertyId: string, source?: string) {
  return trackPropertyEvent({ propertyId, eventType: "view", source });
}

export function trackWhatsappClick(propertyId: string, source?: string) {
  return trackPropertyEvent({ propertyId, eventType: "whatsapp_click", source });
}

export function trackLead(propertyId: string, source?: string) {
  return trackPropertyEvent({ propertyId, eventType: "lead_form", source });
}

export function trackFavorite(propertyId: string, source?: string) {
  return trackPropertyEvent({ propertyId, eventType: "favorite", source });
}

export function trackShare(propertyId: string, source?: string) {
  return trackPropertyEvent({ propertyId, eventType: "share", source });
}

function getVisitorId() {
  const key = "visitor_id";

  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}
