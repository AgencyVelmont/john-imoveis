import { Bell, Search, Plus } from "lucide-react";

export function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="min-h-20 px-4 py-4 border-b border-border bg-card flex flex-wrap xl:flex-nowrap items-center justify-between gap-4 sm:px-6 lg:px-8">
      <div className="min-w-[220px] max-w-md">
        <p className="eyebrow mb-1">Painel administrativo</p>
        <h1 className="text-2xl font-display text-navy leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="ml-auto flex w-full flex-wrap justify-start items-center gap-3 sm:w-auto sm:justify-end">
        <div className="hidden md:flex items-center gap-2 px-3 h-10 border border-border bg-background rounded-sm w-72">
          <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <input
            placeholder="Buscar imóveis, leads…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground/70"
          />
        </div>
        <button
          className="w-10 h-10 border border-border bg-background flex items-center justify-center hover:border-gold transition-colors rounded-sm relative"
          aria-label="Notificações"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold" />
        </button>
        {action ?? (
          <button className="h-10 px-5 bg-navy text-white text-xs tracking-[0.1em] uppercase flex items-center gap-2 hover:bg-navy-mid transition-colors">
            <Plus className="w-4 h-4" strokeWidth={1.5} /> Novo imóvel
          </button>
        )}
      </div>
    </header>
  );
}
