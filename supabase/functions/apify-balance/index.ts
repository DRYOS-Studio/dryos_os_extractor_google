import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: settings } = await admin
      .from("user_settings")
      .select("apify_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!settings?.apify_token) return json({ error: "Sem token da Apify" }, 400);

    const r = await fetch("https://api.apify.com/v2/users/me/limits", {
      headers: { Authorization: `Bearer ${settings.apify_token}` },
    });
    if (!r.ok) {
      const txt = await r.text();
      return json({ error: "Falha ao consultar limites da Apify", details: txt.slice(0, 300) }, 502);
    }
    const data = await r.json();
    const usageUsd = data?.data?.current?.monthlyUsageUsd ?? null;
    const limitUsd = data?.data?.limits?.maxMonthlyUsageUsd ?? null;
    const cycleEndsAt = data?.data?.monthlyUsageCycle?.endAt ?? null;
    const remainingUsd = usageUsd != null && limitUsd != null ? Math.max(limitUsd - usageUsd, 0) : null;

    return json({ usageUsd, limitUsd, remainingUsd, cycleEndsAt });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
