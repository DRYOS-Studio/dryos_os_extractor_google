import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Phone, Globe, MapPin, ExternalLink, Mail, Send, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Lead {
  id: string;
  name: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  phone_normalized: string | null;
  website: string | null;
  email: string | null;
  rating: number | null;
  reviews_count: number | null;
  google_url: string | null;
}

interface Props {
  lead: Lead;
  selected: boolean;
  onToggle: () => void;
}

// O CRM guarda o telefone no formato do WhatsApp (com DDI). O Google Maps não
// inclui o 55 do Brasil, então completamos quando o número parece um DDD+número BR.
function toCrmPhone(normalized: string | null): string | null {
  if (!normalized) return null;
  if (normalized.length === 10 || normalized.length === 11) return `55${normalized}`;
  return normalized;
}

export const LeadCard = ({ lead, selected, onToggle }: Props) => {
  const { user } = useAuth();
  const [crmState, setCrmState] = useState<"idle" | "sending" | "sent" | "exists">("idle");

  const sendToCrm = async () => {
    if (!user) return;
    const phone = toCrmPhone(lead.phone_normalized);
    const email = lead.email;
    if (!phone && !email) return toast.error("Lead sem telefone nem email — não dá pra enviar pro CRM");

    setCrmState("sending");
    if (phone) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("contact_phone", phone)
        .maybeSingle();
      if (existing) {
        setCrmState("exists");
        toast.info("Esse contato já está no CRM");
        return;
      }
    }

    const { data: stage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("user_id", user.id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!stage) {
      setCrmState("idle");
      return toast.error("Nenhum funil encontrado no CRM");
    }

    const { error } = await supabase.from("conversations").insert({
      user_id: user.id,
      contact_phone: phone,
      contact_email: email,
      contact_name: lead.name,
      stage_id: stage.id,
    });
    if (error) {
      const blob = `${error.code ?? ""} ${error.message ?? ""}`;
      if (error.code === "23505" && blob.includes("conversations_user_phone_uidx")) {
        setCrmState("exists");
        toast.info("Esse contato já está no CRM");
        return;
      }
      if (error.code === "23505" && blob.includes("conversations_user_email_uidx")) {
        setCrmState("idle");
        return toast.error("email já cadastrado em outro contato");
      }
      setCrmState("idle");
      return toast.error(error.message);
    }
    setCrmState("sent");
    toast.success("Lead enviado para o CRM 🚀");
  };

  return (
    <Card
      data-lead-name={lead.name ?? ""}
      className={`p-4 transition-all hover:shadow-hover ${selected ? "ring-2 ring-primary shadow-glow" : ""}`}
    >
      <div className="flex gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold truncate">{lead.name || "Sem nome"}</h3>
            {lead.rating != null && (
              <Badge variant="secondary" className="bg-warning/15 text-warning border-warning/30 shrink-0">
                <Star className="h-3 w-3 fill-warning text-warning mr-1" />
                {lead.rating.toFixed(1)} {lead.reviews_count ? `(${lead.reviews_count})` : ""}
              </Badge>
            )}
          </div>

          {lead.category && (
            <Badge variant="outline" className="mb-2 text-[10px] font-semibold uppercase tracking-wider">{lead.category}</Badge>
          )}

          <div className="space-y-1 text-sm text-muted-foreground">
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-success shrink-0" />
                <a href={`tel:${lead.phone}`} className="hover:text-foreground truncate">{lead.phone}</a>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground truncate">
                  {lead.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-accent shrink-0" />
                <a href={`mailto:${lead.email}`} className="hover:text-foreground truncate">{lead.email}</a>
              </div>
            )}
            {(lead.address || lead.city) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="truncate">{[lead.address, lead.city, lead.state].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            {lead.google_url ? (
              <a
                href={lead.google_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver no Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            ) : <span />}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={sendToCrm}
              disabled={crmState !== "idle" || (!lead.phone_normalized && !lead.email)}
            >
              {crmState === "sending" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : crmState === "sent" || crmState === "exists" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              {crmState === "sent" ? "Enviado" : crmState === "exists" ? "Já no CRM" : "Enviar para CRM"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
