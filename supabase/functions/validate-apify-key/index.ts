import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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

    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 10) {
      return json({ valid: false, error: "Token inválido" }, 400);
    }

    const r = await fetch("https://api.apify.com/v2/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return json({ valid: false, error: "Token rejeitado pela Apify" }, 200);
    const data = await r.json();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await admin.from("user_settings").upsert({
      user_id: user.id,
      apify_token: token,
      apify_validated_at: new Date().toISOString(),
    });

    return json({ valid: true, username: data?.data?.username ?? null });
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
