import { supabase } from "@/lib/supabase";

export type LeadStatus =
  | "novo"
  | "contato"
  | "visita_agendada"
  | "proposta"
  | "convertido"
  | "perdido";

export type Lead = {
  id: string;
  property_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  property?: {
    id: string;
    title: string;
    status: string;
    neighborhood: string | null;
    city: string | null;
  } | null;
};

export type LeadInput = {
  propertyId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  source?: string | null;
  notes?: string | null;
};

export const leadStatuses: LeadStatus[] = [
  "novo",
  "contato",
  "visita_agendada",
  "proposta",
  "convertido",
  "perdido",
];

export const leadStatusLabels: Record<LeadStatus, string> = {
  novo: "Novo",
  contato: "Contato",
  visita_agendada: "Visita agendada",
  proposta: "Proposta",
  convertido: "Convertido",
  perdido: "Perdido",
};

type LeadRow = Omit<Lead, "property"> & {
  nome?: string | null;
  telefone?: string | null;
  mensagem?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  property?: Lead["property"] | Lead["property"][];
};

export function normalizeLeads(data: LeadRow[] | null | undefined): Lead[] {
  return (data ?? []).map((lead) => {
    const property = Array.isArray(lead.property)
      ? (lead.property[0] ?? null)
      : (lead.property ?? null);
    const status = leadStatuses.includes(lead.status) ? lead.status : "novo";

    return {
      ...lead,
      property_id: lead.property_id ?? null,
      name: textOrFallback(lead.name ?? lead.nome, "Sem nome"),
      email: nullableText(lead.email),
      phone: nullableText(lead.phone ?? lead.telefone),
      message: nullableText(lead.message ?? lead.mensagem),
      source: textOrFallback(lead.source ?? lead.origem, "Website"),
      status,
      notes: nullableText(lead.notes ?? lead.observacoes),
      created_at: lead.created_at ?? new Date(0).toISOString(),
      updated_at: lead.updated_at ?? null,
      property,
    };
  });
}

export async function loadLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*,property:properties(id,title,status,neighborhood,city)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return normalizeLeads(data as LeadRow[] | null);
}

export async function createLead(values: LeadInput) {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      property_id: values.propertyId ?? null,
      nome: values.name,
      email: values.email ?? null,
      telefone: values.phone ?? null,
      mensagem: values.message ?? null,
      origem: values.source ?? "site",
      observacoes: values.notes ?? null,
      status: "novo",
    })
    .select("id")
    .single();

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from("leads")
      .insert({
        property_id: values.propertyId ?? null,
        name: values.name,
        email: values.email ?? null,
        phone: values.phone ?? null,
        message: values.message ?? null,
        source: values.source ?? "site",
        notes: values.notes ?? null,
      })
      .select("id")
      .single();

    if (fallback.error) throw fallback.error;
    return fallback.data;
  }

  if (error) throw error;

  return data;
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw error;
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const { error } = await supabase
    .from("leads")
    .update({ notes: notes || null, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from("leads")
      .update({ observacoes: notes || null, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (fallback.error) throw fallback.error;
    return;
  }

  if (error) throw error;
}

export async function deleteLead(leadId: string) {
  const id = String(leadId ?? "").trim();

  if (!id) {
    throw new Error("Lead inválido para exclusão.");
  }

  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) {
    throw new Error("Não foi possível excluir o lead. Confira suas permissões no Supabase.");
  }
}

export function leadInitials(name: unknown) {
  return (
    String(name ?? "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SN"
  );
}

function textOrFallback(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function nullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
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
