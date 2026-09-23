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

    const { searchId } = await req.json();
    if (!searchId) return json({ error: "searchId obrigatório" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: search } = await admin
      .from("searches")
      .select("*")
      .eq("id", searchId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!search) return json({ error: "Busca não encontrada" }, 404);

    if (search.status === "completed" || search.status === "failed") {
      return json({ status: search.status, results_count: search.results_count });
    }
    if (!search.apify_run_id) return json({ status: search.status, results_count: 0 });

    const { data: settings } = await admin
      .from("user_settings")
      .select("apify_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!settings?.apify_token) return json({ error: "Sem token" }, 400);

    const runRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${search.apify_run_id}?token=${encodeURIComponent(settings.apify_token)}`
    );
    const runData = await runRes.json();
    const runStatus = runData?.data?.status;
    const datasetId = runData?.data?.defaultDatasetId;
    const stats = runData?.data?.stats;

    if (runStatus === "SUCCEEDED" && datasetId) {
      // Fetch items
      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${encodeURIComponent(settings.apify_token)}&clean=true`
      );
      const items = await itemsRes.json();
      const filters = (search.filters as Record<string, unknown>) || {};

      const normalizePhone = (p: unknown): string | null => {
        if (!p) return null;
        const digits = String(p).replace(/\D/g, "");
        return digits.length > 0 ? digits : null;
      };

      // Carrega telefones já capturados pelo usuário (qualquer busca anterior)
      const existingPhones = new Set<string>();
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data: prior } = await admin
          .from("leads")
          .select("phone_normalized")
          .eq("user_id", user.id)
          .not("phone_normalized", "is", null)
          .range(from, from + pageSize - 1);
        if (!prior || prior.length === 0) break;
        for (const r of prior) {
          if (r.phone_normalized) existingPhones.add(r.phone_normalized);
        }
        if (prior.length < pageSize) break;
        from += pageSize;
      }

      const seenInBatch = new Set<string>();
      let duplicatesSkipped = 0;

      const passesFilters = (it: Record<string, unknown>) => {
        const rating = Number(it.totalScore ?? 0);
        const reviews = Number(it.reviewsCount ?? 0);
        const phone = it.phone as string | undefined;
        const website = it.website as string | undefined;
        if (filters.minRating && rating < Number(filters.minRating)) return false;
        if (filters.minReviews && reviews < Number(filters.minReviews)) return false;
        if (filters.requirePhone && !phone) return false;
        if (filters.requireWebsite && !website) return false;
        if (filters.excludeWithWebsite && website) return false;
        return true;
      };

      const targetCount = Number(search.max_results) || 50;
      const filtered: Record<string, unknown>[] = [];
      for (const it of (Array.isArray(items) ? items : [])) {
        if (!passesFilters(it)) continue;
        const norm = normalizePhone(it.phone);
        if (norm) {
          if (existingPhones.has(norm) || seenInBatch.has(norm)) {
            duplicatesSkipped++;
            continue;
          }
          seenInBatch.add(norm);
        }
        filtered.push(it);
        if (filtered.length >= targetCount) break;
      }

      const rows = filtered.map((it: Record<string, unknown>) => ({
        search_id: search.id,
        user_id: user.id,
        name: (it.title as string) ?? null,
        category: (it.categoryName as string) ?? null,
        address: (it.address as string) ?? null,
        city: (it.city as string) ?? null,
        state: (it.state as string) ?? null,
        country: (it.countryCode as string) ?? null,
        phone: (it.phone as string) ?? null,
        phone_normalized: normalizePhone(it.phone),
        website: (it.website as string) ?? null,
        email: Array.isArray(it.emails) ? (it.emails as string[])[0] : null,
        rating: it.totalScore != null ? Number(it.totalScore) : null,
        reviews_count: it.reviewsCount != null ? Number(it.reviewsCount) : null,
        latitude: (it.location as Record<string, number> | undefined)?.lat ?? null,
        longitude: (it.location as Record<string, number> | undefined)?.lng ?? null,
        google_url: (it.url as string) ?? null,
        raw: it,
      }));

      if (rows.length > 0) {
        // Insert in chunks
        for (let i = 0; i < rows.length; i += 200) {
          await admin.from("leads").insert(rows.slice(i, i + 200));
        }
      }

      const cost = stats?.computeUnits ?? null;
      await admin
        .from("searches")
        .update({
          status: "completed",
          results_count: rows.length,
          duplicates_skipped: duplicatesSkipped,
          cost_credits: cost,
        })
        .eq("id", search.id);

      return json({ status: "completed", results_count: rows.length, duplicates_skipped: duplicatesSkipped });
    }

    if (runStatus === "FAILED" || runStatus === "ABORTED" || runStatus === "TIMED-OUT") {
      await admin
        .from("searches")
        .update({ status: "failed", error_message: `Apify run ${runStatus}` })
        .eq("id", search.id);
      return json({ status: "failed" });
    }

    return json({ status: "running", apify_status: runStatus });
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
