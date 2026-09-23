import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTOR_ID = "compass~crawler-google-places";

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

    const body = await req.json();
    const { niche, location, maxResults = 50, filters = {} } = body;

    if (!niche || !location) return json({ error: "niche e location obrigatórios" }, 400);
    if (typeof niche !== "string" || niche.length > 200) return json({ error: "niche inválido" }, 400);
    if (typeof location !== "string" || location.length > 200) return json({ error: "location inválido" }, 400);
    const max = Math.min(Math.max(Number(maxResults) || 50, 1), 500);
    // Overfetch para compensar duplicados (filtragem por telefone na conclusão)
    const overfetch = Math.min(max * 3, 500);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: settings } = await admin
      .from("user_settings")
      .select("apify_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!settings?.apify_token) return json({ error: "Configure sua API key da Apify primeiro" }, 400);

    // Create search row
    const { data: search, error: searchErr } = await admin
      .from("searches")
      .insert({
        user_id: user.id,
        niche,
        location,
        max_results: max,
        filters,
        status: "running",
      })
      .select()
      .single();
    if (searchErr || !search) throw searchErr;

    // Build Apify input
    const input: Record<string, unknown> = {
      searchStringsArray: [niche],
      locationQuery: location,
      maxCrawledPlacesPerSearch: overfetch,
      language: "pt-BR",
      skipClosedPlaces: true,
    };

    // Filters
    if (filters.minRating) input.minimumStars = String(filters.minRating);
    if (filters.categoryExact) input.placeMinimumStars = filters.categoryExact;

    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${encodeURIComponent(settings.apify_token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );
    if (!startRes.ok) {
      const txt = await startRes.text();
      await admin.from("searches").update({ status: "failed", error_message: txt.slice(0, 500) }).eq("id", search.id);
      return json({ error: "Falha ao iniciar Apify run", details: txt }, 502);
    }
    const runData = await startRes.json();
    const runId = runData?.data?.id;
    await admin.from("searches").update({ apify_run_id: runId }).eq("id", search.id);

    return json({ searchId: search.id, runId });
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
