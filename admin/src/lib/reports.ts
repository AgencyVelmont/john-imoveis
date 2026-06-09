import { loadDashboardData, type DashboardData, type PropertyMetric } from "@/lib/dashboard";
import { leadStatusLabels } from "@/lib/leads";

export type ReportPeriod = "7d" | "30d" | "month" | "all";
export type ReportFormat = "csv" | "xlsx" | "pdf";

export async function exportMonthlyReport(period: ReportPeriod, format: ReportFormat) {
  const baseName = `relatorio-imobiliario-${period}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "pdf") {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      throw new Error("O navegador bloqueou a janela do PDF. Libere pop-ups para este site.");
    }

    writeReportLoading(reportWindow);

    try {
      const data = filterDashboardData(await loadDashboardData(), period);
      openPrintableReport(reportWindow, data, period);
    } catch (error) {
      writeReportError(reportWindow, error);
      throw error;
    }

    return;
  }

  const data = filterDashboardData(await loadDashboardData(), period);

  if (format === "csv") {
    downloadFile(`${baseName}.csv`, "text/csv;charset=utf-8", buildCsv(data));
    return;
  }

  if (format === "xlsx") {
    downloadFile(
      `${baseName}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buildXlsxWorkbook(data),
    );
    return;
  }
}

export function filterDashboardData(data: DashboardData, period: ReportPeriod): DashboardData {
  const startDate = getPeriodStart(period);
  if (!startDate) return data;

  const events = data.events.filter((event) => new Date(event.created_at) >= startDate);
  const leads = data.leads.filter((lead) => new Date(lead.created_at) >= startDate);

  const propertyMetrics = data.propertyMetrics.map((property) => {
    const propertyEvents = events.filter((event) => event.property_id === property.id);
    const propertyLeads = leads.filter((lead) => lead.property_id === property.id);

    return {
      ...property,
      views: propertyEvents.filter((event) => event.event_type === "view").length,
      whatsappClicks: propertyEvents.filter((event) => event.event_type === "whatsapp_click")
        .length,
      phoneClicks: propertyEvents.filter((event) => event.event_type === "phone_click").length,
      favorites: propertyEvents.filter((event) => event.event_type === "favorite").length,
      shares: propertyEvents.filter((event) => event.event_type === "share").length,
      leads:
        propertyLeads.length +
        propertyEvents.filter((event) => event.event_type === "lead_form").length,
      visits:
        propertyLeads.filter((lead) => lead.status === "visita_agendada").length +
        propertyEvents.filter((event) => event.event_type === "visit_schedule").length,
    };
  });

  const totalViews = events.filter((event) => event.event_type === "view").length;
  const totalLeads = leads.length;

  return {
    ...data,
    events,
    leads,
    propertyMetrics,
    stats: {
      ...data.stats,
      totalViews,
      whatsappClicks: events.filter((event) => event.event_type === "whatsapp_click").length,
      phoneClicks: events.filter((event) => event.event_type === "phone_click").length,
      totalLeads,
      scheduledVisits:
        events.filter((event) => event.event_type === "visit_schedule").length +
        leads.filter((lead) => lead.status === "visita_agendada").length,
      conversionRate: totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0,
    },
  };
}

function buildCsv(data: DashboardData) {
  const rows = [
    ["Resumo"],
    ["Métrica", "Valor"],
    ["Imóveis", data.stats.totalProperties],
    ["Publicados", data.stats.published],
    ["Vendidos", data.stats.sold],
    ["Views", data.stats.totalViews],
    ["WhatsApp", data.stats.whatsappClicks],
    ["Leads", data.stats.totalLeads],
    ["Conversão", `${data.stats.conversionRate}%`],
    [],
    ["Imóveis"],
    ["Título", "Status", "Views", "WhatsApp", "Leads", "Visitas"],
    ...data.propertyMetrics.map((property) => propertyMetricRow(property)),
    [],
    ["Leads"],
    ["Nome", "Contato", "Origem", "Status", "Imóvel", "Criado em"],
    ...data.leads.map((lead) => [
      lead.name || "Sem nome",
      lead.phone ?? lead.email ?? "Sem telefone",
      lead.source || "Website",
      leadStatusLabels[lead.status],
      lead.property?.title ?? "",
      formatDate(lead.created_at),
    ]),
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function buildXlsxWorkbook(data: DashboardData) {
  const sheets = [
    {
      name: "Resumo",
      rows: [
        ["Métrica", "Valor"],
        ["Imóveis", data.stats.totalProperties],
        ["Publicados", data.stats.published],
        ["Vendidos", data.stats.sold],
        ["Views", data.stats.totalViews],
        ["WhatsApp", data.stats.whatsappClicks],
        ["Leads", data.stats.totalLeads],
        ["Conversão", `${data.stats.conversionRate}%`],
      ],
    },
    {
      name: "Imóveis",
      rows: [
        ["Título", "Status", "Views", "WhatsApp", "Leads", "Visitas"],
        ...data.propertyMetrics.map((property) => propertyMetricRow(property)),
      ],
    },
    {
      name: "Leads",
      rows: [
        ["Nome", "Contato", "Origem", "Status", "Imóvel", "Criado em"],
        ...data.leads.map((lead) => [
          lead.name || "Sem nome",
          lead.phone ?? lead.email ?? "Sem telefone",
          lead.source || "Website",
          leadStatusLabels[lead.status],
          lead.property?.title ?? "",
          formatDate(lead.created_at),
        ]),
      ],
    },
  ];

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets
      .map(
        (sheet, index) =>
          `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
      )
      .join("")}
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets
    .map(
      (_sheet, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
          index + 1
        }.xml"/>`,
    )
    .join("")}
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets
    .map(
      (_sheet, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("")}
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  return zipStore([
    { path: "[Content_Types].xml", content: contentTypes },
    { path: "_rels/.rels", content: rootRels },
    { path: "xl/workbook.xml", content: workbookXml },
    { path: "xl/_rels/workbook.xml.rels", content: workbookRels },
    ...sheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      content: worksheetXml(sheet.rows),
    })),
  ]);
}

function writeReportLoading(reportWindow: Window) {
  reportWindow.document.open();
  reportWindow.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Gerando relatório</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #fffaf0;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    div {
      border: 1px solid #e7dcc7;
      background: #fff;
      padding: 28px;
      min-width: 320px;
      box-shadow: 0 18px 45px rgb(15 23 42 / 0.10);
    }
    p {
      margin: 0;
      color: #7f7667;
      font-size: 12px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    strong {
      display: block;
      margin-top: 10px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div>
    <p>Felipe Corretor</p>
    <strong>Gerando relatório...</strong>
  </div>
</body>
</html>`);
  reportWindow.document.close();
}

function writeReportError(reportWindow: Window, error: unknown) {
  reportWindow.document.open();
  reportWindow.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Erro no relatório</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #fffaf0;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    div {
      max-width: 520px;
      border: 1px solid #e7dcc7;
      background: #fff;
      padding: 28px;
      box-shadow: 0 18px 45px rgb(15 23 42 / 0.10);
    }
    h1 {
      margin: 0 0 10px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 400;
    }
    p { margin: 0; color: #7f7667; line-height: 1.6; }
  </style>
</head>
<body>
  <div>
    <h1>Não foi possível gerar o PDF</h1>
    <p>${escapeXml(String((error as { message?: string }).message || "Tente novamente."))}</p>
  </div>
</body>
</html>`);
  reportWindow.document.close();
}

function openPrintableReport(reportWindow: Window, data: DashboardData, period: ReportPeriod) {
  const topProperties = data.propertyMetrics
    .slice()
    .sort(
      (a, b) =>
        b.views +
        b.whatsappClicks * 2 +
        b.leads * 3 +
        b.visits * 4 -
        (a.views + a.whatsappClicks * 2 + a.leads * 3 + a.visits * 4),
    )
    .slice(0, 12);
  const leadRows = data.leads.slice(0, 30);
  const conversion = data.stats.conversionRate;
  const statusSummary = data.properties.reduce<Record<string, number>>((acc, property) => {
    acc[property.status] = (acc[property.status] ?? 0) + 1;
    return acc;
  }, {});

  reportWindow.document.open();
  reportWindow.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório imobiliário</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8f5ee;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.5;
    }
    .page {
      width: min(100%, 210mm);
      margin: 0 auto;
      background: #fffaf0;
      padding: 12mm;
    }
    .cover {
      border: 1px solid #e7dcc7;
      background: #0f172a;
      color: #fffaf0;
      padding: 30px;
    }
    .eyebrow {
      margin: 0 0 8px;
      color: #c6a15b;
      font-size: 10px;
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 {
      max-width: 680px;
      margin-bottom: 16px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 36px;
      font-weight: 400;
      line-height: 1.05;
    }
    h2 {
      margin-bottom: 12px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: 400;
    }
    h3 {
      margin-bottom: 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .12em;
    }
    section { margin-top: 28px; }
    .meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 26px;
    }
    .meta div, .card {
      border: 1px solid #e7dcc7;
      background: #fff;
      padding: 14px;
    }
    .meta span, .card span {
      display: block;
      color: #7f7667;
      font-size: 10px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .meta strong, .card strong {
      display: block;
      margin-top: 4px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: 400;
      color: #0f172a;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    .insights {
      display: grid;
      grid-template-columns: 1.15fr .85fr;
      gap: 16px;
    }
    .panel {
      border: 1px solid #e7dcc7;
      background: #fff;
      padding: 18px;
    }
    .bar {
      height: 8px;
      overflow: hidden;
      background: #eee7da;
      border-radius: 99px;
    }
    .bar > span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #0f172a, #c6a15b);
      border-radius: 99px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      background: #fff;
      border: 1px solid #e7dcc7;
    }
    th, td {
      border-bottom: 1px solid #eee7da;
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f5efe3;
      color: #6f6658;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    td.numeric, th.numeric { text-align: right; }
    .badge {
      display: inline-block;
      border: 1px solid #e7dcc7;
      background: #f8f5ee;
      padding: 3px 7px;
      color: #0f172a;
      font-size: 9px;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .muted { color: #7f7667; }
    .footer {
      margin-top: 34px;
      border-top: 1px solid #e7dcc7;
      padding-top: 14px;
      color: #7f7667;
      font-size: 10px;
    }
    @media print {
      html, body {
        width: 210mm;
        margin: 0;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body {
        font-size: 10.5px;
        line-height: 1.42;
      }
      .page {
        width: auto;
        max-width: none;
        margin: 0;
        padding: 0;
        background: #fffaf0;
      }
      .cover {
        padding: 18px 22px;
      }
      h1 {
        max-width: 150mm;
        font-size: 28px;
      }
      h2 {
        font-size: 18px;
      }
      section {
        margin-top: 16px;
      }
      .summary {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 6px;
      }
      .insights {
        grid-template-columns: 1fr 0.82fr;
        gap: 10px;
      }
      .meta {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        margin-top: 14px;
      }
      .card,
      .meta div,
      .panel {
        padding: 9px;
      }
      .meta strong,
      .card strong {
        font-size: 17px;
      }
      th, td {
        padding: 5px 6px;
      }
      .no-break { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main class="page">
  <header class="cover no-break">
    <p class="eyebrow">Felipe Corretor · Relatório comercial</p>
    <h1>Visão organizada do portfólio, atendimento e conversão</h1>
    <p class="muted" style="color:#d8d0c2">Período: ${periodLabel(period)} · Gerado em ${formatDateTime(
      new Date().toISOString(),
    )}</p>
  </header>

  <section class="no-break">
    <div class="summary">
      <div class="card"><span>Imóveis</span><strong>${data.stats.totalProperties}</strong></div>
      <div class="card"><span>Views</span><strong>${data.stats.totalViews}</strong></div>
      <div class="card"><span>WhatsApp</span><strong>${data.stats.whatsappClicks}</strong></div>
      <div class="card"><span>Leads</span><strong>${data.stats.totalLeads}</strong></div>
      <div class="card"><span>Conversão</span><strong>${conversion}%</strong></div>
    </div>
  </section>

  <section class="insights no-break">
    <div class="panel">
      <p class="eyebrow">Leitura rápida</p>
      <h2>Resumo executivo</h2>
      <p>O relatório consolida acessos, cliques de WhatsApp, leads e visitas para apoiar decisões comerciais sem precisar cruzar planilhas.</p>
      <div class="meta">
        <div><span>Publicados</span><strong>${data.stats.published}</strong></div>
        <div><span>Vendidos</span><strong>${data.stats.sold}</strong></div>
        <div><span>Visitas</span><strong>${data.stats.scheduledVisits}</strong></div>
      </div>
    </div>
    <div class="panel">
      <p class="eyebrow">Portfólio</p>
      <h2>Status dos imóveis</h2>
      ${Object.entries(statusSummary)
        .map(([status, value]) => {
          const width = data.stats.totalProperties
            ? Math.round((value / data.stats.totalProperties) * 100)
            : 0;
          return `<div style="margin-top:10px">
            <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:5px">
              <span class="badge">${escapeXml(statusLabel(status))}</span>
              <strong>${value}</strong>
            </div>
            <div class="bar"><span style="width:${width}%"></span></div>
          </div>`;
        })
        .join("")}
    </div>
  </section>

  <section>
    <h2>Resumo</h2>
    <table>
      <tbody>
        <tr><td>Imóveis</td><td>${data.stats.totalProperties}</td></tr>
        <tr><td>Publicados</td><td>${data.stats.published}</td></tr>
        <tr><td>Vendidos</td><td>${data.stats.sold}</td></tr>
        <tr><td>Views</td><td>${data.stats.totalViews}</td></tr>
        <tr><td>WhatsApp</td><td>${data.stats.whatsappClicks}</td></tr>
        <tr><td>Leads</td><td>${data.stats.totalLeads}</td></tr>
        <tr><td>Visitas</td><td>${data.stats.scheduledVisits}</td></tr>
        <tr><td>Conversão</td><td>${data.stats.conversionRate}%</td></tr>
      </tbody>
    </table>
  </section>
  <section>
    <h2>Imóveis com maior performance</h2>
    <table>
      <thead>
        <tr>
          <th>Imóvel</th>
          <th>Status</th>
          <th class="numeric">Views</th>
          <th class="numeric">WhatsApp</th>
          <th class="numeric">Leads</th>
          <th class="numeric">Visitas</th>
        </tr>
      </thead>
      <tbody>
        ${topProperties
          .map(
            (property) =>
              `<tr>
                <td><strong>${escapeXml(property.title)}</strong><br><span class="muted">${escapeXml(
                  [property.neighborhood, property.city].filter(Boolean).join(", ") ||
                    "Localização não informada",
                )}</span></td>
                <td><span class="badge">${escapeXml(statusLabel(property.status))}</span></td>
                <td class="numeric">${property.views}</td>
                <td class="numeric">${property.whatsappClicks}</td>
                <td class="numeric">${property.leads}</td>
                <td class="numeric">${property.visits}</td>
              </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </section>
  <section>
    <h2>Leads recentes</h2>
    <table>
      <thead>
        <tr><th>Cliente</th><th>Contato</th><th>Status</th><th>Imóvel</th><th>Criado em</th></tr>
      </thead>
      <tbody>
        ${
          leadRows.length
            ? leadRows
                .map(
                  (lead) =>
                    `<tr>
                      <td>${escapeXml(lead.name || "Sem nome")}</td>
                      <td>${escapeXml(lead.phone ?? lead.email ?? "Sem contato")}</td>
                      <td><span class="badge">${escapeXml(leadStatusLabels[lead.status])}</span></td>
                      <td>${escapeXml(lead.property?.title ?? "-")}</td>
                      <td>${formatDate(lead.created_at)}</td>
                    </tr>`,
                )
                .join("")
            : `<tr><td colspan="5" class="muted">Nenhum lead no período selecionado.</td></tr>`
        }
      </tbody>
    </table>
  </section>
  <p class="footer">Documento gerado pelo painel Felipe Corretor. Use os indicadores como apoio para priorizar atendimento, anúncios e atualização do portfólio.</p>
  </main>
</body>
</html>`);
  reportWindow.document.close();
  reportWindow.onload = () => {
    reportWindow.focus();
    window.setTimeout(() => reportWindow.print(), 250);
  };
}

function propertyMetricRow(property: PropertyMetric) {
  return [
    property.title,
    property.status,
    property.views,
    property.whatsappClicks,
    property.leads,
    property.visits,
  ];
}

function worksheetXml(rows: (string | number)[][]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rows
      .map(
        (row, rowIndex) =>
          `<row r="${rowIndex + 1}">${row
            .map((cell, cellIndex) => {
              const ref = `${columnName(cellIndex)}${rowIndex + 1}`;
              if (typeof cell === "number") {
                return `<c r="${ref}"><v>${cell}</v></c>`;
              }

              return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
            })
            .join("")}</row>`,
      )
      .join("")}
  </sheetData>
</worksheet>`;
}

function downloadFile(fileName: string, type: string, content: BlobPart) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getPeriodStart(period: ReportPeriod) {
  const now = new Date();

  if (period === "all") return null;

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const days = period === "7d" ? 7 : 30;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  return startDate;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function periodLabel(period: ReportPeriod) {
  const labels: Record<ReportPeriod, string> = {
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    month: "Mês atual",
    all: "Todo o histórico",
  };

  return labels[period];
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    rascunho: "Rascunho",
    publicado: "Publicado",
    vendido: "Vendido",
    alugado: "Alugado",
    indisponivel: "Indisponível",
  };

  return labels[status] ?? status;
}

function escapeCsv(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index: number) {
  let name = "";
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function zipStore(files: { path: string; content: string }[]) {
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = encodeText(file.path);
    const content = encodeText(file.content);
    const crc = crc32(content);
    const localHeader = concatBytes(
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(content.length),
      uint32(content.length),
      uint16(name.length),
      uint16(0),
      name,
    );

    chunks.push(localHeader, content);

    centralDirectory.push(
      concatBytes(
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(crc),
        uint32(content.length),
        uint32(content.length),
        uint16(name.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        name,
      ),
    );

    offset += localHeader.length + content.length;
  });

  const centralStart = offset;
  const centralBytes = concatBytes(...centralDirectory);
  const endRecord = concatBytes(
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralBytes.length),
    uint32(centralStart),
    uint16(0),
  );

  return concatBytes(...chunks, centralBytes, endRecord);
}

function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

function uint16(value: number) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}

function concatBytes(...parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;

  parts.forEach((part) => {
    bytes.set(part, offset);
    offset += part.length;
  });

  return bytes;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
