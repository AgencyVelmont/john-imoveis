import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import {
  deleteLead,
  leadInitials,
  leadStatusLabels,
  leadStatuses,
  loadLeads,
  updateLeadNotes,
  updateLeadStatus,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";
import { exportMonthlyReport } from "@/lib/reports";
import { buildWhatsappUrlForPhone } from "@/lib/site-info";
import {
  Building2,
  Download,
  Mail,
  MessageCircle,
  Phone,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({ component: LeadsPage });

const sourceOptions = [
  "todos",
  "website",
  "site",
  "whatsapp",
  "formulario",
  "telefone",
  "instagram",
] as const;

function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [source, setSource] = React.useState<(typeof sourceOptions)[number]>("todos");
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const fetchLeads = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setLeads(await loadLeads());
    } catch (error) {
      console.error(error);
      setErrorMessage("Não foi possível carregar os leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = React.useMemo(() => {
    const normalizedQuery = normalize(query);

    return leads.filter((lead) => {
      const matchesSource = source === "todos" || normalize(lead.source) === source;
      const haystack = normalize(
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.message,
          lead.notes,
          lead.source,
          lead.property?.title,
          lead.property?.neighborhood,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return matchesSource && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [leads, query, source]);

  const handleStatusChange = async (lead: Lead, status: LeadStatus) => {
    const previousLeads = leads;
    setSavingId(lead.id);
    setLeads((current) =>
      current.map((item) => (item.id === lead.id ? { ...item, status } : item)),
    );

    if (selectedLead?.id === lead.id) {
      setSelectedLead({ ...selectedLead, status });
    }

    try {
      await updateLeadStatus(lead.id, status);
      toast.success("Status do lead atualizado.");
    } catch (error) {
      console.error(error);
      setLeads(previousLeads);
      toast.error("Erro ao atualizar status.");
    } finally {
      setSavingId(null);
    }
  };

  const handleNotesSave = async (lead: Lead, notes: string) => {
    setSavingId(lead.id);

    try {
      await updateLeadNotes(lead.id, notes);
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? { ...item, notes } : item)),
      );
      setSelectedLead((current) => (current?.id === lead.id ? { ...current, notes } : current));
      toast.success("Observação salva.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar observação.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    const confirmed = window.confirm(
      `Excluir o lead ${lead.name || "Sem nome"}?\n\nEssa ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    setSavingId(lead.id);

    try {
      await deleteLead(lead.id);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setSelectedLead((current) => (current?.id === lead.id ? null : current));
      toast.success("Lead excluído do CRM.");
    } catch (error) {
      console.error(error);
      toast.error(
        String((error as { message?: string }).message || "Não foi possível excluir o lead."),
      );
    } finally {
      setSavingId(null);
    }
  };

  const statusCounts = React.useMemo(
    () =>
      leadStatuses.map((status) => ({
        status,
        total: filteredLeads.filter((lead) => lead.status === status).length,
      })),
    [filteredLeads],
  );

  return (
    <>
      <Topbar
        title="Leads"
        subtitle={`${filteredLeads.length} contatos no pipeline`}
        action={
          <button
            type="button"
            onClick={() => exportMonthlyReport("month", "csv")}
            className="h-10 px-5 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors flex items-center gap-2 rounded-sm"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Exportar CSV
          </button>
        }
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {statusCounts.map(({ status, total }) => (
            <div key={status} className="bg-card border border-border p-4">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {leadStatusLabels[status]}
              </span>
              <strong className="block text-2xl font-display text-navy mt-2">{total}</strong>
            </div>
          ))}
        </section>

        <section className="bg-card border border-border p-4 flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <div className="flex-1 min-w-0 flex items-center gap-2 h-11 px-3 border border-border bg-background">
            <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, contato, imóvel, mensagem ou observação"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground/70"
            />
          </div>

          <select
            value={source}
            onChange={(event) => setSource(event.target.value as typeof source)}
            className="h-11 px-3 bg-background border border-border text-sm text-navy outline-none focus:border-gold transition-colors"
          >
            {sourceOptions.map((item) => (
              <option key={item} value={item}>
                Origem: {item === "todos" ? "todas" : item}
              </option>
            ))}
          </select>
        </section>

        {errorMessage && (
          <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {leadStatuses.map((status) => {
              const items = filteredLeads.filter((lead) => lead.status === status);

              return (
                <PipelineColumn
                  key={status}
                  status={status}
                  leads={items}
                  loading={loading}
                  selectedLeadId={selectedLead?.id ?? null}
                  savingId={savingId}
                  onSelectLead={setSelectedLead}
                  onStatusChange={handleStatusChange}
                  onDeleteLead={handleDeleteLead}
                />
              );
            })}
          </div>

          <LeadDetails
            lead={selectedLead}
            saving={selectedLead ? savingId === selectedLead.id : false}
            onStatusChange={handleStatusChange}
            onNotesSave={handleNotesSave}
            onDelete={handleDeleteLead}
          />
        </section>
      </div>
    </>
  );
}

function PipelineColumn({
  status,
  leads,
  loading,
  selectedLeadId,
  savingId,
  onSelectLead,
  onStatusChange,
  onDeleteLead,
}: {
  status: LeadStatus;
  leads: Lead[];
  loading: boolean;
  selectedLeadId: string | null;
  savingId: string | null;
  onSelectLead: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
  onDeleteLead: (lead: Lead) => void;
}) {
  return (
    <div className="bg-muted/35 border border-border min-h-[420px]">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-card">
        <p className="text-[11px] uppercase tracking-[0.12em] text-navy">
          {leadStatusLabels[status]}
        </p>
        <span className="text-[10px] text-muted-foreground">{leads.length}</span>
      </div>

      <div className="p-3 space-y-3">
        {loading ? (
          <>
            <LeadSkeleton />
            <LeadSkeleton />
          </>
        ) : leads.length === 0 ? (
          <div className="border border-dashed border-border bg-background/50 p-6 text-center">
            <p className="text-xs text-muted-foreground">Nenhum lead nesta etapa.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              active={selectedLeadId === lead.id}
              saving={savingId === lead.id}
              onSelect={() => onSelectLead(lead)}
              onStatusChange={(nextStatus) => onStatusChange(lead, nextStatus)}
              onDelete={() => onDeleteLead(lead)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  active,
  saving,
  onSelect,
  onStatusChange,
  onDelete,
}: {
  lead: Lead;
  active: boolean;
  saving: boolean;
  onSelect: () => void;
  onStatusChange: (status: LeadStatus) => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`bg-card border p-4 transition-colors cursor-pointer ${
        active ? "border-gold shadow-sm" : "border-border hover:border-gold"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-display shrink-0">
          {leadInitials(lead.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm text-navy truncate">{lead.name || "Sem nome"}</p>
            <span className="text-[9px] uppercase tracking-[0.1em] text-gold whitespace-nowrap">
              {lead.source || "Website"}
            </span>
          </div>

          {lead.property?.title && (
            <p className="text-[11px] text-muted-foreground italic mt-1 truncate font-display">
              {lead.property.title}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-foreground/80 line-clamp-2 mt-3">
        {lead.message ?? "Sem mensagem"}
      </p>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2 items-center">
        <select
          value={lead.status}
          disabled={saving}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onStatusChange(event.target.value as LeadStatus)}
          className="h-8 px-2 bg-background border border-border text-[11px] text-navy outline-none focus:border-gold"
        >
          {leadStatuses.map((status) => (
            <option key={status} value={status}>
              {leadStatusLabels[status]}
            </option>
          ))}
        </select>

        <span className="text-[10px] text-muted-foreground">
          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="w-7 h-7 flex items-center justify-center bg-muted hover:bg-navy hover:text-white transition-colors"
            aria-label="Ligar"
            onClick={(event) => event.stopPropagation()}
          >
            <Phone className="w-3 h-3" strokeWidth={1.5} />
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="w-7 h-7 flex items-center justify-center bg-muted hover:bg-navy hover:text-white transition-colors"
            aria-label="E-mail"
            onClick={(event) => event.stopPropagation()}
          >
            <Mail className="w-3 h-3" strokeWidth={1.5} />
          </a>
        )}
        {lead.phone && (
          <a
            href={buildWhatsappUrlForPhone(lead.phone)}
            target="_blank"
            rel="noreferrer"
            className="w-7 h-7 flex items-center justify-center bg-muted hover:bg-[#25D366] hover:text-white transition-colors"
            aria-label="WhatsApp"
            onClick={(event) => event.stopPropagation()}
          >
            <MessageCircle className="w-3 h-3" strokeWidth={1.5} />
          </a>
        )}
        <div className="ml-auto flex items-center gap-2">
          {lead.notes && (
            <span className="text-gold" title="Com observações internas">
              <StickyNote className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="w-7 h-7 flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Excluir lead ${lead.name || "Sem nome"}`}
            title="Excluir lead"
          >
            <Trash2 className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
}

function LeadDetails({
  lead,
  saving,
  onStatusChange,
  onNotesSave,
  onDelete,
}: {
  lead: Lead | null;
  saving: boolean;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
  onNotesSave: (lead: Lead, notes: string) => void;
  onDelete: (lead: Lead) => void;
}) {
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    setNotes(lead?.notes ?? "");
  }, [lead]);

  if (!lead) {
    return (
      <aside className="bg-card border border-border p-6 sticky top-6">
        <p className="eyebrow mb-1">Detalhes</p>
        <h2 className="text-xl text-navy">Selecione um lead</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Abra um card do pipeline para ver contato, imóvel relacionado e observações internas.
        </p>
      </aside>
    );
  }

  return (
    <aside className="bg-card border border-border sticky top-6">
      <header className="p-6 border-b border-border">
        <p className="eyebrow mb-1">Lead</p>
        <h2 className="text-xl text-navy">{lead.name || "Sem nome"}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Criado em {new Date(lead.created_at).toLocaleDateString("pt-BR")}
        </p>
      </header>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Info label="Origem" value={lead.source || "Website"} />
          <label>
            <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Status
            </span>
            <select
              value={lead.status}
              disabled={saving}
              onChange={(event) => onStatusChange(lead, event.target.value as LeadStatus)}
              className="h-10 w-full px-3 bg-background border border-border text-sm text-navy outline-none focus:border-gold"
            >
              {leadStatuses.map((status) => (
                <option key={status} value={status}>
                  {leadStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          {lead.phone ? (
            <ContactRow icon={Phone} value={lead.phone} href={`tel:${lead.phone}`} />
          ) : (
            <ContactFallback icon={Phone} value="Sem telefone" />
          )}
          {lead.email && (
            <ContactRow icon={Mail} value={lead.email} href={`mailto:${lead.email}`} />
          )}
          {lead.property && (
            <div className="flex gap-3 text-sm text-navy">
              <Building2 className="w-4 h-4 mt-0.5 text-gold" strokeWidth={1.5} />
              <div>
                <p>{lead.property.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[lead.property.neighborhood, lead.property.city].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted/40 border border-border p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Mensagem
          </p>
          <p className="text-sm text-foreground/85">{lead.message ?? "Sem mensagem"}</p>
        </div>

        <label className="block">
          <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Observações internas
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={6}
            className="w-full px-3 py-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans resize-none"
            placeholder="Registre histórico de contato, preferências, objeções e próximos passos."
          />
        </label>

        <button
          type="button"
          disabled={saving}
          onClick={() => onNotesSave(lead, notes)}
          className="w-full h-10 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar observação"}
        </button>

        <div className="border-t border-border pt-5">
          <p className="text-xs leading-5 text-muted-foreground">
            Exclua apenas leads rejeitados ou registros duplicados. Essa ação não pode ser desfeita.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => onDelete(lead)}
            className="mt-3 inline-flex h-9 items-center gap-2 border border-destructive/30 px-3 text-xs uppercase tracking-[0.1em] text-destructive transition-colors hover:border-destructive hover:bg-destructive/5 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            {saving ? "Processando..." : "Excluir lead"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        {label}
      </span>
      <p className="h-10 px-3 bg-muted/40 border border-border text-sm text-navy flex items-center">
        {value}
      </p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof Phone;
  value: string;
  href: string;
}) {
  return (
    <a href={href} className="flex items-center gap-3 text-sm text-navy hover:text-gold">
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      {value}
    </a>
  );
}

function ContactFallback({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      {value}
    </div>
  );
}

function LeadSkeleton() {
  return (
    <div className="bg-card border border-border p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted w-2/3" />
          <div className="h-2 bg-muted w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-muted w-full mt-4" />
      <div className="h-3 bg-muted w-3/4 mt-2" />
    </div>
  );
}

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
