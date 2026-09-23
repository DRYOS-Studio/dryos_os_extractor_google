import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search, History, Settings, LogOut, Target, Users } from "lucide-react";

const CRM_URL = "https://crm-21.vercel.app";

export const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground font-medium hover:text-foreground hover:bg-secondary"
    }`;

  const openCRM = () => {
    // Open synchronously so the tab isn't blocked as a popup while we await the session.
    const win = window.open("", "_blank");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!win) return;
      if (!session) {
        win.location.href = CRM_URL;
        return;
      }
      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      win.location.href = `${CRM_URL}/sso#${params.toString()}`;
    });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to={user ? "/buscar" : "/"} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Target className="h-[22px] w-[22px] text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">DRYOS OS - Extrator</span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/buscar" className={linkCls}>
              <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" />Buscar</span>
            </NavLink>
            <NavLink to="/historico" className={linkCls}>
              <span className="inline-flex items-center gap-2"><History className="h-4 w-4" />Histórico</span>
            </NavLink>
            <button type="button" onClick={openCRM} className={linkCls({ isActive: false })}>
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />Prospectar</span>
            </button>
            <NavLink to="/configuracoes" className={linkCls}>
              <span className="inline-flex items-center gap-2"><Settings className="h-4 w-4" />Configurações</span>
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[160px]">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/")} size="sm">Entrar</Button>
          )}
        </div>
      </div>
    </header>
  );
};
