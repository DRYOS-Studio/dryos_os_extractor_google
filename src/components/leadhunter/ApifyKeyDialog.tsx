import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ExternalLink, KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

export const ApifyKeyDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!token.trim()) return toast.error("Cole sua API token");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-apify-key", {
        body: { token: token.trim() },
      });
      if (error) throw error;
      if (!data?.valid) throw new Error(data?.error || "Token inválido");
      toast.success(`Conectado à Apify ${data.username ? `como ${data.username}` : ""} ✅`);
      setToken("");
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao validar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-3">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-semibold tracking-tight">Conecte sua conta Apify 🔑</DialogTitle>
          <DialogDescription className="text-base pt-2">
            O DRYOS OS - Extrator usa a <strong>Apify</strong> para extrair leads do Google Maps. Você precisa apenas colar sua API token uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-secondary/60 p-4 text-sm space-y-2">
            <p className="font-semibold">Como obter:</p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Crie uma conta gratuita na Apify</li>
              <li>Vá em <strong>Settings → API & Integrations</strong></li>
              <li>Copie sua <strong>Personal API token</strong></li>
            </ol>
            <a
              href="https://console.apify.com/settings/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              Abrir Apify <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-sm">
            🎁 Ao criar a conta, a Apify libera <strong>US$ 5 grátis</strong> para testes. Com cerca de <strong>US$ 4</strong> você gera até <strong>~1.000 leads</strong> sem pagar nada.
          </div>

          <div>
            <Label htmlFor="token">API Token da Apify</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="apify_api_..."
              autoComplete="off"
            />
          </div>

          <Button onClick={save} disabled={loading} className="w-full bg-gradient-primary shadow-glow font-semibold" size="lg">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Validar e salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
