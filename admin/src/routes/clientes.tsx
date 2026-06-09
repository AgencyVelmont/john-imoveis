import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import { leadInitials, loadLeads, type Lead } from "@/lib/leads";

export const Route = createFileRoute("/clientes")({ component: ClientesPage });

function ClientesPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        setLeads(await loadLeads());
      } catch (error) {
        console.error(error);
        setErrorMessage("Não foi possível carregar os clientes.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  return (
    <>
      <Topbar title="Clientes" subtitle="Base de contatos gerada pelos leads reais" />
      <div className="p-8 space-y-4">
        {errorMessage && (
          <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="bg-card border border-border">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground bg-muted/40">
                <th className="text-left font-normal px-6 py-3">Nome</th>
                <th className="text-left font-normal px-6 py-3">Contato</th>
                <th className="text-left font-normal px-6 py-3">Último interesse</th>
                <th className="text-left font-normal px-6 py-3">Origem</th>
                <th className="text-left font-normal px-6 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Carregando clientes...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Nenhum cliente cadastrado a partir dos leads.
                  </td>
                </tr>
              ) : (
                leads.map((lead, index) => {
                  const leadId = String(lead.id ?? "");
                  const leadName = textOrFallback(lead.name, "Sem nome");
                  const leadPhone = textOrFallback(lead.phone, "Sem telefone");
                  const leadEmail = textOrFallback(lead.email, "Sem e-mail");
                  const leadSource = textOrFallback(lead.source, "Website");
                  const propertyTitle = textOrFallback(
                    lead.property?.title,
                    "Sem imóvel vinculado",
                  );
                  const createdAt = formatDate(lead.created_at);

                  return (
                    <tr
                      key={leadId || `lead-${index}`}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-display">
                            {leadInitials(leadName)}
                          </div>
                          <div>
                            <p className="font-display text-navy">{leadName}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {leadId.slice(0, 8) || "sem-id"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="text-navy">{leadPhone}</p>
                        <p className="text-[11px] text-muted-foreground">{leadEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground italic font-display">
                        {propertyTitle}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase tracking-[0.12em] text-gold">
                          {leadSource}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{createdAt}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function textOrFallback(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? "Sem data" : date.toLocaleDateString("pt-BR");
}
