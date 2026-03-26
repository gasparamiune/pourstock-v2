import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": /^https:\/\/(.*\.(lovable\.app|lovableproject\.com)|www\.pourstock\.com)$/.test(origin) ? origin : "https://www.pourstock.com",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

// ========== PHASE 1 + PHASE 2 SEED HELPERS ==========
// All seed writes are best-effort and idempotent (ON CONFLICT DO NOTHING).
// Failure does NOT block hotel creation — the hotel is fully functional
// without these rows. They can be backfilled later if needed.

async function seedPhase1Tables(
  supabaseAdmin: any,
  hotelId: string,
  membershipId: string | null,
  callerId: string,
) {
  const errors: string[] = [];

  try {
    const defaultDepts = [
      { slug: "reception", display_name: "Reception", sort_order: 1 },
      { slug: "housekeeping", display_name: "Housekeeping", sort_order: 2 },
      { slug: "restaurant", display_name: "Restaurant", sort_order: 3 },
    ];
    const { error } = await supabaseAdmin.from("departments").upsert(
      defaultDepts.map((d) => ({ hotel_id: hotelId, ...d })),
      { onConflict: "hotel_id,slug" },
    );
    if (error) throw error;
  } catch (err) {
    errors.push(`departments: ${err}`);
    console.error("[Phase1Seed] departments seed failed:", err);
  }

  try {
    const defaultModules = [
      "reception", "housekeeping", "restaurant",
      "inventory", "procurement", "table_plan", "reports",
    ];
    const { error } = await supabaseAdmin.from("hotel_modules").upsert(
      defaultModules.map((m) => ({ hotel_id: hotelId, module: m, is_enabled: true })),
      { onConflict: "hotel_id,module" },
    );
    if (error) throw error;
  } catch (err) {
    errors.push(`hotel_modules: ${err}`);
    console.error("[Phase1Seed] hotel_modules seed failed:", err);
  }

  if (membershipId) {
    try {
      const { error } = await supabaseAdmin.from("membership_roles").upsert(
        { membership_id: membershipId, role: "hotel_admin", granted_by: callerId },
        { onConflict: "membership_id,role" },
      );
      if (error) throw error;
    } catch (err) {
      errors.push(`membership_roles: ${err}`);
      console.error("[Phase1Seed] membership_roles mirror failed:", err);
    }
  }

  try {
    const { data: restaurant } = await supabaseAdmin.from("restaurants").upsert(
      { hotel_id: hotelId, name: "Main Restaurant", slug: "main-restaurant", description: "Default restaurant" },
      { onConflict: "hotel_id,slug" },
    ).select("id").single();

    if (restaurant) {
      await supabaseAdmin.from("service_periods").upsert(
        { hotel_id: hotelId, restaurant_id: restaurant.id, name: "Dinner", slug: "dinner", start_time: "18:00", end_time: "22:00", sort_order: 1 },
        { onConflict: "hotel_id,slug" },
      );
    }
  } catch (err) {
    errors.push(`restaurants/service_periods: ${err}`);
    console.error("[Phase2Seed] restaurants seed failed:", err);
  }

  try {
    const roomTypes = [
      { name: "Single", slug: "single", default_capacity: 1, sort_order: 1 },
      { name: "Double", slug: "double", default_capacity: 2, sort_order: 2 },
      { name: "Twin", slug: "twin", default_capacity: 2, sort_order: 3 },
      { name: "Suite", slug: "suite", default_capacity: 4, sort_order: 4 },
      { name: "Family", slug: "family", default_capacity: 4, sort_order: 5 },
    ];
    await supabaseAdmin.from("room_types").upsert(
      roomTypes.map((rt) => ({ hotel_id: hotelId, ...rt })),
      { onConflict: "hotel_id,slug" },
    );
  } catch (err) {
    errors.push(`room_types: ${err}`);
    console.error("[Phase2Seed] room_types seed failed:", err);
  }

  try {
    const categories = [
      { name: "Wine", slug: "wine", sort_order: 1 },
      { name: "Beer", slug: "beer", sort_order: 2 },
      { name: "Spirits", slug: "spirits", sort_order: 3 },
      { name: "Coffee", slug: "coffee", sort_order: 4 },
      { name: "Soda", slug: "soda", sort_order: 5 },
      { name: "Syrup", slug: "syrup", sort_order: 6 },
    ];
    await supabaseAdmin.from("product_categories").upsert(
      categories.map((c) => ({ hotel_id: hotelId, ...c })),
      { onConflict: "hotel_id,slug" },
    );
  } catch (err) {
    errors.push(`product_categories: ${err}`);
    console.error("[Phase2Seed] product_categories seed failed:", err);
  }

  if (errors.length > 0) {
    console.warn(`[Seed] ${errors.length} seed error(s) for hotel ${hotelId}:`, errors);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  function jsonResponse(body: any, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerId = user.id;

    const body = await req.json();
    const { name, slug, country, timezone, language_default } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return jsonResponse({ error: "Hotel name must be 2-100 characters" }, 400);
    }
    if (!slug || typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
      return jsonResponse({ error: "Slug must be 3-50 lowercase letters, numbers, and hyphens" }, 400);
    }

    const { data: existing } = await supabaseAdmin
      .from("hotels")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ error: "This slug is already taken" }, 409);
    }

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
      await supabaseAdmin.from("hotels").delete().eq("id", hotel.id);
      return jsonResponse({ error: memberError.message }, 500);
    }

    await seedPhase1Tables(supabaseAdmin, hotel.id, membership?.id ?? null, callerId);

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
