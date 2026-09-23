import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Target, Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/buscar");
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/buscar` },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já está dentro 🚀");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate("/buscar");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-hero">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Target className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold tracking-tight leading-none text-foreground font-display uppercase">
              DRYOS OS - Extrator
            </span>
          </div>
        </Link>

        <Card className="p-8 shadow-soft">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">{mode === "signin" ? "Bem-vindo de volta 👋" : "Crie sua conta 🚀"}</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === "signin" ? "Entre para extrair leads do Google Maps" : "Comece a extrair leads em minutos"}
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary shadow-glow hover:opacity-90 font-semibold" disabled={loading} size="lg">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-sm font-medium text-muted-foreground hover:text-foreground mt-6"
          >
            {mode === "signin" ? "Não tem conta? Criar uma agora" : "Já tem conta? Entrar"}
          </button>
        </Card>
      </div>
    </div>
  );
}
