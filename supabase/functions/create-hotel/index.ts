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

// ========== PHASE 1 SEED HELPERS ==========
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

  // Seed default departments (idempotent via UNIQUE(hotel_id, slug))
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

  // Seed default modules (idempotent via UNIQUE(hotel_id, module))
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

  // Mirror membership_roles (idempotent via UNIQUE(membership_id, role))
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

  if (errors.length > 0) {
    console.warn(`[Phase1Seed] ${errors.length} seed error(s) for hotel ${hotelId}:`, errors);
  }
}

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

    // PRIMARY: Create hotel
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

    // PRIMARY: Add caller as hotel_admin
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
      // Rollback hotel creation — this is critical path
      await supabaseAdmin.from("hotels").delete().eq("id", hotel.id);
      return jsonResponse({ error: memberError.message }, 500);
    }

    // BEST-EFFORT: Seed Phase 1 foundation tables
    // Failure here does NOT block hotel creation or return an error to the user.
    await seedPhase1Tables(supabaseAdmin, hotel.id, membership?.id ?? null, callerId);

    // PRIMARY: Audit log
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
