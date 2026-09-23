import { useEffect, useState } from "react";
import { AppHeader } from "@/components/leadhunter/AppHeader";
import { ApifyKeyDialog } from "@/components/leadhunter/ApifyKeyDialog";
import { LeadCard, Lead } from "@/components/leadhunter/LeadCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Rocket, ChevronDown, SlidersHorizontal, Download, Loader2, Sparkles, MapPin, Search as SearchIcon, KeyRound } from "lucide-react";
import { leadsToCSV, downloadCSV, downloadXLSX } from "@/lib/csv";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [keyDialog, setKeyDialog] = useState(false);

  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [advanced, setAdvanced] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [excludeWithWebsite, setExcludeWithWebsite] = useState(false);

  const [running, setRunning] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("apify_token")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const has = !!data?.apify_token;
        setHasKey(has);
        if (!has) setKeyDialog(true);
      });
  }, [user]);

  // Load existing search if ?id=
  useEffect(() => {
    const id = params.get("id");
    if (!id || !user) return;
    setSearchId(id);
    supabase.from("searches").select("*").eq("id", id).maybeSingle().then(({ data: s }) => {
      if (s) {
        setNiche(s.niche);
        setLocation(s.location);
        setMaxResults(s.max_results);
      }
    });
    supabase.from("leads").select("*").eq("search_id", id).then(({ data }) => {
      if (data) setLeads(data as Lead[]);
    });
  }, [params, user]);

  const estimatedCredits = Math.ceil(maxResults * 0.6);

  const runSearch = async () => {
    if (!niche.trim() || !location.trim()) return toast.error("Preencha nicho e localização");
    if (!hasKey) return setKeyDialog(true);

    setRunning(true);
    setLeads([]);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("run-apify-search", {
        body: {
          niche: niche.trim(),
          location: location.trim(),
          maxResults,
          filters: {
            minRating: minRating || undefined,
            minReviews: minReviews || undefined,
            requirePhone,
            requireWebsite,
            excludeWithWebsite,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSearchId(data.searchId);
      toast.success("Busca iniciada! Aguardando Apify… 🚀");
      pollStatus(data.searchId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
      setRunning(false);
    }
  };

  const pollStatus = async (id: string) => {
    const maxAttempts = 120; // ~10 min
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const { data } = await supabase.functions.invoke("check-search-status", {
          body: { searchId: id },
        });
        if (data?.status === "completed") {
          const { data: rows } = await supabase.from("leads").select("*").eq("search_id", id);
          setLeads((rows as Lead[]) || []);
          setRunning(false);
          toast.success(`✅ ${data.results_count} leads encontrados!`);
          if (data.duplicates_skipped > 0) {
            toast.info(`${data.duplicates_skipped} leads já existiam em buscas anteriores e foram ignorados.`);
          }
          return;
        }
        if (data?.status === "failed") {
          setRunning(false);
          toast.error("Busca falhou");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setRunning(false);
    toast.error("Tempo esgotado. Verifique no histórico.");
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((l) => l.id)));
  };

  const exportCSV = () => {
    const rows = selected.size > 0 ? leads.filter((l) => selected.has(l.id)) : leads;
    if (rows.length === 0) return toast.error("Nada para exportar");
    const csv = leadsToCSV(rows as unknown as Array<Record<string, unknown>>);
    downloadCSV(`leads-${niche || "export"}-${Date.now()}.csv`, csv);
    toast.success(`${rows.length} leads exportados 📥`);
  };

  const exportXLSX = async () => {
    const rows = selected.size > 0 ? leads.filter((l) => selected.has(l.id)) : leads;
    if (rows.length === 0) return toast.error("Nada para exportar");
    await downloadXLSX(`leads-${niche || "export"}-${Date.now()}.xlsx`, rows as unknown as Array<Record<string, unknown>>);
    toast.success(`${rows.length} leads exportados 📥`);
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <ApifyKeyDialog open={keyDialog} onOpenChange={setKeyDialog} onSaved={() => setHasKey(true)} />

      <main className="container py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Buscar leads 🎯</h1>
          <p className="text-muted-foreground mt-1">Configure sua busca e extraia leads do Google Maps em segundos.</p>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          {/* Filters */}
          <Card className="p-5 h-fit lg:sticky lg:top-20 shadow-soft">
            <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filtros
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="niche">Nicho / categoria</Label>
                <Input
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ex: dentistas, restaurantes, advogados"
                />
              </div>

              <div>
                <Label htmlFor="loc">Localização</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Curitiba, PR"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Quantidade de resultados</Label>
                  <span className="text-sm font-bold tabular-nums text-primary">{maxResults}</span>
                </div>
                <Slider
                  min={10}
                  max={500}
                  step={10}
                  value={[maxResults]}
                  onValueChange={(v) => setMaxResults(v[0])}
                />
              </div>

              <Collapsible open={advanced} onOpenChange={setAdvanced}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider py-2 hover:text-primary transition-colors">
                    Filtros avançados
                    <ChevronDown className={`h-4 w-4 transition-transform ${advanced ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs">Avaliação mínima ⭐</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Mínimo de avaliações</Label>
                    <Input
                      type="number"
                      min={0}
                      value={minReviews}
                      onChange={(e) => setMinReviews(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rp" className="text-sm cursor-pointer">📞 Só com telefone</Label>
                    <Switch id="rp" checked={requirePhone} onCheckedChange={setRequirePhone} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rw" className="text-sm cursor-pointer">🌐 Só com site</Label>
                    <Switch id="rw" checked={requireWebsite} onCheckedChange={(v) => { setRequireWebsite(v); if (v) setExcludeWithWebsite(false); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ew" className="text-sm cursor-pointer">🚫 Só SEM site</Label>
                    <Switch id="ew" checked={excludeWithWebsite} onCheckedChange={(v) => { setExcludeWithWebsite(v); if (v) setRequireWebsite(false); }} />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="rounded-lg bg-secondary/60 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Estimativa: <strong className="text-foreground">~{estimatedCredits} créditos</strong> Apify
                </div>
              </div>

              <Button
                onClick={runSearch}
                disabled={running}
                className="w-full bg-gradient-accent shadow-accent-glow text-primary-foreground hover:opacity-90 font-semibold"
                size="lg"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {running ? "Buscando…" : "Buscar leads"}
              </Button>

              {!hasKey && (
                <Button variant="outline" className="w-full font-medium" onClick={() => setKeyDialog(true)}>
                  <KeyRound className="h-4 w-4" /> Configurar Apify
                </Button>
              )}
            </div>
          </Card>

          {/* Results */}
          <div>
            {running && leads.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow animate-pulse-glow mb-4">
                  <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                </div>
                <h3 className="text-xl font-semibold">Caçando leads… 🎯</h3>
                <p className="text-muted-foreground mt-1">A Apify está rodando o scraper. Pode levar alguns minutos.</p>
              </Card>
            ) : leads.length === 0 ? (
              <Card className="p-12 text-center bg-gradient-hero">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
                  <SearchIcon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Faça sua primeira busca! 🚀</h3>
                <p className="text-muted-foreground mt-1">Preencha os filtros à esquerda e clique em "Buscar leads".</p>
              </Card>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight tabular-nums">{leads.length} leads encontrados</h2>
                    <p className="text-sm text-muted-foreground">
                      {selected.size > 0 ? `${selected.size} selecionados` : "Selecione para exportar parcial"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={toggleAll} size="sm">
                      {selected.size === leads.length ? "Limpar" : "Selecionar todos"}
                    </Button>
                    <Button onClick={exportCSV} className="bg-success hover:bg-success/90 text-success-foreground" size="sm">
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                    <Button onClick={exportXLSX} className="bg-success hover:bg-success/90 text-success-foreground" size="sm">
                      <Download className="h-4 w-4" /> Exportar XLS
                    </Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 animate-fade-in">
                  {leads.map((l) => (
                    <LeadCard key={l.id} lead={l} selected={selected.has(l.id)} onToggle={() => toggle(l.id)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
