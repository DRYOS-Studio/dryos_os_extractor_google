import { useEffect, useState } from "react";
import { AppHeader } from "@/components/leadhunter/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { History as HistoryIcon, MapPin, Tag, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SearchRow {
  id: string;
  niche: string;
  location: string;
  status: string;
  results_count: number;
  cost_credits: number | null;
  created_at: string;
}

export default function History() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("searches")
      .select("id,niche,location,status,results_count,cost_credits,created_at")
      .order("created_at", { ascending: false });
    setRows((data as SearchRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta busca e todos os seus leads?")) return;
    const { error } = await supabase.from("searches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Busca excluída");
    load();
  };

  const statusBadge = (s: string) => {
    if (s === "completed") return <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">✅ Completa</Badge>;
    if (s === "failed") return <Badge variant="destructive">Falhou</Badge>;
    if (s === "running") return <Badge className="bg-primary/15 text-primary border-primary/30">⏳ Em andamento</Badge>;
    return <Badge variant="secondary">{s}</Badge>;
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <HistoryIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Histórico</h1>
            <p className="text-muted-foreground">Suas buscas anteriores</p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-hero">
            <h3 className="text-xl font-semibold">Nenhuma busca ainda 🌱</h3>
            <p className="text-muted-foreground mt-1 mb-4">Faça sua primeira busca para começar.</p>
            <Button asChild className="bg-gradient-primary shadow-glow">
              <Link to="/buscar">Criar busca</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <Card key={r.id} className="p-4 hover:shadow-hover transition-all">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{r.niche}</span>
                      {statusBadge(r.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.location}</span>
                      <span>📊 {r.results_count} leads</span>
                      <span>{new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/buscar?id=${r.id}`}>Abrir <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
