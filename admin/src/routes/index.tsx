import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import {
  buildDailySeries,
  countLeadsByStatus,
  countPropertiesByStatus,
  loadDashboardData,
  type DashboardData,
  type PropertyMetric,
} from "@/lib/dashboard";
import { exportMonthlyReport, type ReportFormat, type ReportPeriod } from "@/lib/reports";
import { formatBRL } from "@/lib/properties";
import {
  ArrowUpRight,
  BarChart3,
  Download,
  FileText,
  Home,
  MessageSquare,
  Phone,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const CHART_COLORS = ["#0f172a", "#c6a15b", "#25635f", "#8b3a3a", "#5f6f8d", "#d8c18a"];
const GRID_COLOR = "#ece7dc";
const AXIS_COLOR = "#847f73";
const TOOLTIP_STYLE = {
  border: "1px solid #e8dcc4",
  borderRadius: 14,
  boxShadow: "0 18px 45px rgb(15 23 42 / 0.12)",
  color: "#0f172a",
  fontSize: 12,
} satisfies React.CSSProperties;

function Dashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [reportPeriod, setReportPeriod] = React.useState<ReportPeriod>("month");
  const [exporting, setExporting] = React.useState<ReportFormat | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setData(await loadDashboardData());
    } catch (error) {
      console.error(error);
      setErrorMessage("Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleExport = async (format: ReportFormat) => {
    setExporting(format);

    try {
      await exportMonthlyReport(reportPeriod, format);
      toast.success("Relatório gerado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setExporting(null);
    }
  };

  const stats = data?.stats;
  const propertyStatusData = data
    ? Object.entries(countPropertiesByStatus(data.properties)).map(([name, value]) => ({
        name: statusLabel(name),
        value,
      }))
    : [];
  const leadStatusData = data
    ? Object.entries(countLeadsByStatus(data.leads)).map(([name, value]) => ({
        name: leadLabel(name),
        value,
      }))
    : [];
  const trafficData = data
    ? buildDailySeries(data.events, 7, (event) => event.event_type === "view").map((item) => ({
        label: item.label,
        views: item.value,
      }))
    : [];
  const leadsTimeline = data
    ? buildDailySeries(data.leads, 30).map((item) => ({ label: item.label, leads: item.value }))
    : [];
  const funnel = data
    ? [
        { label: "Views", value: stats?.totalViews ?? 0, icon: TrendingUp },
        { label: "WhatsApp", value: stats?.whatsappClicks ?? 0, icon: MessageSquare },
        { label: "Leads", value: stats?.totalLeads ?? 0, icon: FileText },
        { label: "Visitas", value: stats?.scheduledVisits ?? 0, icon: Home },
        { label: "Vendas", value: stats?.sold ?? 0, icon: Star },
      ]
    : [];
  const recent = data?.properties.slice(0, 5) ?? [];

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Performance comercial e analytics do portfólio"
        action={
          <div className="flex items-center gap-2">
            <select
              value={reportPeriod}
              onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}
              className="h-10 px-3 bg-background border border-border text-xs text-navy outline-none focus:border-gold"
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="month">Mês atual</option>
              <option value="all">Tudo</option>
            </select>
            {(["csv", "xlsx", "pdf"] as ReportFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => handleExport(format)}
                className="h-10 px-4 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" strokeWidth={1.5} />
                {exporting === format ? "..." : format}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8 lg:space-y-8">
        {errorMessage && (
          <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
          <StatCard label="Imóveis" value={stats?.totalProperties} icon={Home} loading={loading} />
          <StatCard label="Views" value={stats?.totalViews} icon={TrendingUp} loading={loading} />
          <StatCard label="Leads" value={stats?.totalLeads} icon={FileText} loading={loading} />
          <StatCard
            label="WhatsApp"
            value={stats?.whatsappClicks}
            icon={MessageSquare}
            loading={loading}
          />
          <StatCard
            label="Conversão"
            value={stats ? `${stats.conversionRate}%` : undefined}
            icon={BarChart3}
            loading={loading}
          />
          <StatCard label="Publicados" value={stats?.published} icon={Star} loading={loading} />
          <StatCard label="Vendidos" value={stats?.sold} icon={Home} loading={loading} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard eyebrow="Portfólio" title="Status dos imóveis">
            <DonutChart data={propertyStatusData} />
          </ChartCard>

          <ChartCard eyebrow="CRM" title="Pipeline de leads">
            <DonutChart data={leadStatusData} />
          </ChartCard>

          <ChartCard eyebrow="Funil" title="Conversão comercial">
            <Funnel items={funnel} />
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard eyebrow="Analytics" title="Acessos dos últimos 7 dias">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData}>
                <CartesianGrid vertical={false} strokeDasharray="4 6" stroke={GRID_COLOR} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ stroke: "#c6a15b", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#c6a15b", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#0f172a", stroke: "#c6a15b", strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard eyebrow="CRM" title="Leads dos últimos 30 dias">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsTimeline}>
                <CartesianGrid vertical={false} strokeDasharray="4 6" stroke={GRID_COLOR} />
                <XAxis
                  dataKey="label"
                  interval={4}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: AXIS_COLOR }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgb(198 161 91 / 0.08)" }} />
                <Bar dataKey="leads" fill="#c6a15b" radius={[8, 8, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RankingCard
            title="Mais vistos"
            metricLabel="views"
            properties={rank(data?.propertyMetrics ?? [], "views")}
          />
          <RankingCard
            title="Mais clicados"
            metricLabel="cliques"
            properties={rank(data?.propertyMetrics ?? [], "whatsappClicks")}
          />
          <RankingCard
            title="Mais leads"
            metricLabel="leads"
            properties={rank(data?.propertyMetrics ?? [], "leads")}
          />
        </section>

        <section className="bg-card border border-border rounded-2xl overflow-hidden">
          <header className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <div>
              <p className="eyebrow mb-1">Portfólio</p>
              <h2 className="text-xl text-navy">Imóveis recentes</h2>
            </div>

            <Link
              to="/imoveis"
              className="text-xs uppercase tracking-[0.1em] text-navy hover:text-gold flex items-center gap-1"
            >
              Ver todos
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </header>

          {loading ? (
            <div className="p-8 text-sm text-muted-foreground">Carregando imóveis...</div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">Nenhum imóvel cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <th className="text-left font-normal px-6 py-3">Imóvel</th>
                    <th className="text-left font-normal px-6 py-3">Tipo</th>
                    <th className="text-right font-normal px-6 py-3">Preço</th>
                    <th className="text-left font-normal px-6 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recent.map((property) => (
                    <tr
                      key={property.id}
                      className="border-t border-border hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-display text-base text-navy">{property.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {property.neighborhood || "Sem bairro"}, {property.city || "Santarém"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{property.type}</td>
                      <td className="px-6 py-4 text-right font-display text-navy">
                        {formatBRL(property.price)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={property.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof Home;
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-border p-5 rounded-2xl hover:border-gold transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{label}</p>
          <p className="font-display text-3xl text-navy mt-3">{loading ? "..." : (value ?? 0)}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center text-navy">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h2 className="text-xl text-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border bg-muted/20">
        Sem dados para exibir.
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={3}
              cornerRadius={8}
              stroke="#fffaf0"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-display text-4xl leading-none text-navy">{total}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              total
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex min-w-0 items-center gap-2 text-xs text-navy">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="truncate">{entry.name}</span>
            <span className="ml-auto font-medium text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Funnel({ items }: { items: { label: string; value: number; icon: typeof Home }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="grid grid-cols-[92px_1fr_48px] gap-3 items-center">
          <span className="flex items-center gap-2 text-xs text-navy">
            <Icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
            {label}
          </span>
          <div className="h-8 overflow-hidden rounded-full bg-[oklch(0.95_0.015_85)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy via-[oklch(0.36_0.05_220)] to-gold transition-all"
              style={{ width: `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%` }}
            />
          </div>
          <strong className="font-display text-navy text-right">{value}</strong>
        </div>
      ))}
    </div>
  );
}

function RankingCard({
  title,
  metricLabel,
  properties,
}: {
  title: string;
  metricLabel: string;
  properties: PropertyMetric[];
}) {
  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden">
      <header className="p-5 border-b border-border">
        <p className="eyebrow mb-1">Ranking</p>
        <h2 className="text-lg text-navy">{title}</h2>
      </header>
      <div className="divide-y divide-border">
        {properties.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Sem dados suficientes.</p>
        ) : (
          properties.map((property, index) => (
            <div key={property.id} className="p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gold">#{index + 1}</p>
                <p className="text-sm text-navy truncate mt-1">{property.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {[property.neighborhood, property.city].filter(Boolean).join(", ") ||
                    "Localização não informada"}
                </p>
              </div>
              <strong className="font-display text-2xl text-navy whitespace-nowrap">
                {metricValue(property, metricLabel)}
              </strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    publicado: "bg-navy text-white",
    rascunho: "bg-muted text-muted-foreground border border-border",
    vendido: "bg-gold text-navy",
    alugado: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full ${
        map[status] ?? "bg-muted"
      }`}
    >
      {status}
    </span>
  );
}

function rank(properties: PropertyMetric[], key: keyof PropertyMetric) {
  return properties
    .slice()
    .sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0))
    .filter((property) => Number(property[key] ?? 0) > 0)
    .slice(0, 5);
}

function metricValue(property: PropertyMetric, metricLabel: string) {
  if (metricLabel === "cliques") return property.whatsappClicks;
  if (metricLabel === "leads") return property.leads;
  return property.views;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    rascunho: "Rascunhos",
    publicado: "Publicados",
    vendido: "Vendidos",
    alugado: "Alugados",
    indisponivel: "Indisponíveis",
  };

  return labels[status] ?? status;
}

function leadLabel(status: string) {
  const labels: Record<string, string> = {
    novo: "Novos",
    contato: "Contato",
    visita_agendada: "Visitas",
    proposta: "Propostas",
    convertido: "Convertidos",
    perdido: "Perdidos",
  };

  return labels[status] ?? status;
}
