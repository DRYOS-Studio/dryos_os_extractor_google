import { useEffect, useState } from "react";
import { AppHeader } from "@/components/leadhunter/AppHeader";
import { ApifyKeyDialog } from "@/components/leadhunter/ApifyKeyDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { KeyRound, CheckCircle2, AlertCircle, Settings as SettingsIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_settings")
      .select("apify_token,apify_validated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setHasKey(!!data?.apify_token);
    setValidatedAt(data?.apify_validated_at ?? null);
  };

  useEffect(() => { load(); }, [user]);

  const removeKey = async () => {
    if (!confirm("Remover sua API token da Apify?")) return;
    const { error } = await supabase.from("user_settings").update({ apify_token: null }).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Token removido");
    load();
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <ApifyKeyDialog open={dialog} onOpenChange={setDialog} onSaved={load} />

      <main className="container py-8 max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <SettingsIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">Conta e integrações</p>
          </div>
        </div>

        <Card className="p-6 shadow-soft mb-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold tracking-tight">Apify</h2>
                {hasKey ? (
                  <Badge className="bg-success/15 text-success border-success/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <AlertCircle className="h-3 w-3 mr-1" /> Não conectado
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Sua API token da Apify é usada para extrair leads do Google Maps.
                {validatedAt && <> Validada em {new Date(validatedAt).toLocaleString("pt-BR")}.</>}
              </p>
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-3 text-sm mb-3">
                🎁 Ao criar a conta na Apify, você ganha <strong>US$ 5 grátis</strong> para testes — com cerca de <strong>US$ 4</strong> dá pra gerar até <strong>~1.000 leads</strong> sem pagar nada.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setDialog(true)} variant="default" size="sm" className="font-semibold">
                  {hasKey ? "Atualizar token" : "Conectar Apify"}
                </Button>
                {hasKey && (
                  <Button onClick={removeKey} variant="outline" size="sm">Remover</Button>
                )}
                <Button asChild variant="ghost" size="sm">
                  <a href="https://console.apify.com/settings/integrations" target="_blank" rel="noopener noreferrer">
                    Abrir Apify <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <h2 className="text-lg font-semibold tracking-tight mb-1">Conta</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </Card>
      </main>
    </div>
  );
}
