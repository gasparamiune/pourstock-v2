import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerId = claimsData.claims.sub as string;

    const body = await req.json();
    const { name, slug, country, timezone, language_default } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return jsonResponse({ error: "Hotel name must be 2-100 characters" }, 400);
    }
    if (!slug || typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
      return jsonResponse({ error: "Slug must be 3-50 lowercase letters, numbers, and hyphens" }, 400);
    }

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from("hotels")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ error: "This slug is already taken" }, 409);
    }

    // Create hotel
    const { data: hotel, error: hotelError } = await supabaseAdmin
      .from("hotels")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        country: country || "DK",
        timezone: timezone || "Europe/Copenhagen",
        language_default: language_default || "da",
      })
      .select("id")
      .single();

    if (hotelError) {
      return jsonResponse({ error: hotelError.message }, 500);
    }

    // Add caller as hotel_admin
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("hotel_members")
      .insert({
        hotel_id: hotel.id,
        user_id: callerId,
        hotel_role: "hotel_admin",
        is_approved: true,
      })
      .select("id")
      .single();

    if (memberError) {
      // Rollback hotel creation
      await supabaseAdmin.from("hotels").delete().eq("id", hotel.id);
      return jsonResponse({ error: memberError.message }, 500);
    }

    // DUAL-WRITE: Also write to membership_roles (Phase 1 foundation)
    if (membership) {
      await supabaseAdmin.from("membership_roles").insert({
        membership_id: membership.id,
        role: "hotel_admin",
        granted_by: callerId,
      });
    }

    // Seed default departments for the new hotel
    const defaultDepts = [
      { slug: "reception", display_name: "Reception", sort_order: 1 },
      { slug: "housekeeping", display_name: "Housekeeping", sort_order: 2 },
      { slug: "restaurant", display_name: "Restaurant", sort_order: 3 },
    ];
    await supabaseAdmin.from("departments").insert(
      defaultDepts.map((d) => ({ hotel_id: hotel.id, ...d }))
    );

    // Seed default modules (all enabled for new hotels)
    const defaultModules = [
      "reception", "housekeeping", "restaurant",
      "inventory", "procurement", "table_plan", "reports",
    ];
    await supabaseAdmin.from("hotel_modules").insert(
      defaultModules.map((m) => ({ hotel_id: hotel.id, module: m, is_enabled: true }))
    );

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      hotel_id: hotel.id,
      user_id: callerId,
      action: "hotel.create",
      target_type: "hotel",
      target_id: hotel.id,
      details: { name: name.trim(), slug },
    });

    return jsonResponse({ success: true, hotelId: hotel.id });
  } catch (err) {
    console.error("create-hotel error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
