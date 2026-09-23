import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Star, Phone, Globe, MapPin, ExternalLink, Mail } from "lucide-react";

export interface Lead {
  id: string;
  name: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
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

export const LeadCard = ({ lead, selected, onToggle }: Props) => {
  return (
    <Card className={`p-4 transition-all hover:shadow-hover ${selected ? "ring-2 ring-primary shadow-glow" : ""}`}>
      <div className="flex gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold truncate">{lead.name || "Sem nome"}</h3>
            {lead.rating != null && (
              <Badge variant="secondary" className="bg-warning/15 text-warning-foreground border-warning/30 shrink-0">
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

          {lead.google_url && (
            <a
              href={lead.google_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Ver no Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};
