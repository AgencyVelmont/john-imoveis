import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Home, MessageSquare, Users, Settings, LogOut } from "lucide-react";
import logo from "@/assets/logo-branca.png";
import { supabase } from "@/lib/supabase";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/imoveis", label: "Imóveis", icon: Home },
  { to: "/leads", label: "Leads", icon: MessageSquare },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setUserEmail(session?.user.email ?? null);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  const initials = userEmail?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="h-20 flex items-center px-7 border-b border-sidebar-border">
          <img src={logo} alt="Felipe Vasconcelos" className="h-9 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <p className="px-3 mb-3 text-[10px] tracking-[0.2em] uppercase text-white/40">Painel</p>
          {nav.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] tracking-wide rounded-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-white border-l-2 border-gold -ml-[2px] pl-[14px]"
                    : "text-white/70 hover:text-white hover:bg-sidebar-accent/60"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-5 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-xs font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">Usuário logado</p>
              <p className="text-[11px] text-white/50 truncate">
                {userEmail ?? "Sessão não encontrada"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-white/50 hover:text-gold transition-colors"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-sidebar-border bg-sidebar px-2 py-2 text-sidebar-foreground shadow-[0_-14px_40px_oklch(0.22_0.04_255/0.22)] lg:hidden">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-sm px-1 py-2 text-[10px] transition-colors ${
                active ? "bg-sidebar-accent text-gold" : "text-white/65 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
