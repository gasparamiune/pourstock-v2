import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": /^https:\/\/.*\.(lovable\.app|lovableproject\.com)$/.test(origin) ? origin : "https://swift-stock-bar.lovable.app",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  function jsonResponse(body: any, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTH CHECK ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = user.id;

    // Verify user is approved hotel member with restaurant access

    const { data: membership } = await supabaseAdmin
      .from("hotel_members")
      .select("hotel_id, hotel_role, is_approved")
      .eq("user_id", userId)
      .eq("is_approved", true)
      .limit(1)
      .single();

    if (!membership) {
      return jsonResponse({ error: "Not an approved hotel member" }, 403);
    }

    // Check restaurant department or admin role
    const isAdmin = membership.hotel_role === "hotel_admin";
    if (!isAdmin) {
      const { data: dept } = await supabaseAdmin
        .from("user_departments")
        .select("department")
        .eq("user_id", userId)
        .eq("department", "restaurant")
        .limit(1);
      if (!dept || dept.length === 0) {
        return jsonResponse({ error: "Restaurant access required" }, 403);
      }
    }

    // ========== INPUT VALIDATION ==========
    const body = await req.json();
    const { pdfBase64 } = body;
    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return jsonResponse({ error: "No PDF data provided" }, 400);
    }

    if (pdfBase64.length > 14_000_000) {
      return jsonResponse({ error: "PDF too large (max 10MB)" }, 400);
    }

    // ========== CACHE CHECK (SHA-256) ==========
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(pdfBase64));
    const contentHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: cached } = await supabaseAdmin
      .from("ai_cache")
      .select("id, result")
      .eq("hotel_id", membership.hotel_id)
      .eq("content_hash", contentHash)
      .eq("job_type", "parse_table_plan")
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (cached) {
      // Increment hit count (best-effort)
      supabaseAdmin
        .from("ai_cache")
        .update({ hit_count: undefined }) // we use raw SQL via rpc instead
        .eq("id", cached.id);
      // Actually just bump via raw update
      await supabaseAdmin.rpc("increment_cache_hit" as any, { cache_id: cached.id }).catch(() => {
        // If rpc doesn't exist, do a simple update
        supabaseAdmin.from("ai_cache").update({ hit_count: 1 } as any).eq("id", cached.id);
      });

      console.log(`Cache HIT for hash ${contentHash.substring(0, 12)}…`);

      // Still log the audit
      await supabaseAdmin.from("audit_logs").insert({
        hotel_id: membership.hotel_id,
        user_id: userId,
        action: "table_plan.parse_pdf_cached",
        target_type: "table_plan",
        details: { cache_hit: true, content_hash: contentHash.substring(0, 12) },
      });

      return jsonResponse(cached.result);
    }

    console.log(`Cache MISS for hash ${contentHash.substring(0, 12)}… — calling AI`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured.");
    }
    console.log("Using Lovable AI Gateway for PDF parsing");

    const SYSTEM_PROMPT = `You are a data extraction assistant. You will receive a Danish restaurant reservation list (Køkkenliste) as a PDF.

Extract ONLY reservations with time >= 18:00 (6 PM onwards). These are restaurant dinner reservations.
Ignore any events before 18:00 (like lunch, meetings, conferences, Rotary events, etc).

IMPORTANT: Also extract the reservation date from the PDF header (e.g. "Lørdag d. 8. marts 2026"). Return it as reservationDate.

IMPORTANT RULES FOR NOTES:
- Notes and comments ALWAYS belong to the reservation ABOVE or BEFORE them in the list, NEVER to the one below/after.
- When you see a note line (e.g. "1x gravid", "laktoseintolerant", "glutenfri"), assign it to the PREVIOUS reservation entry, not the next one.
- Do NOT mix up notes between different reservations. If a note appears after room 311's line and before room 313's line, it belongs to 311.
- Common notes include: allergies (laktoseintolerant, glutenfri), dietary restrictions (gravid, vegetar), included services.

ICON EXTRACTION (as booleans — do NOT put these in notes):
- wineMenu: true if "vinmenu", "vinmenuen", "vin menu" is mentioned. Do NOT include in notes.
- welcomeDrink: true if "velkomst", "velkomstdrink", "lille overraskelse", "velkomstdrink inkl." is mentioned. Do NOT include in notes.
- flagOnTable: true if "flag", "dansk flag", "flag på bord", "flag på bordet" is mentioned. Do NOT include in notes.

KAFFE/TE + SØDT SECTION:
- After the restaurant reservation section there may be a "Kaffe/te" section. Match entries to reservations by room number.
- "Kaffe/te, 1 kop" (simple) = coffeeOnly=true, coffeeTeaSweet=false.
- "Kaffe/te Risskov" followed by "med sødt" = coffeeOnly=false, coffeeTeaSweet=true.

For each reservation extract:
- time: reservation time (e.g. "18:00")
- guestCount: number of guests (integer)
- dishCount: number of courses (integer)
- reservationType: "2-ret", "3-ret", "4-ret", "a-la-carte", or "bordreservation"
- guestName: guest name or empty string
- roomNumber: room number or empty string
- notes: allergies/dietary notes only. Empty string if none.
- coffeeOnly: boolean
- coffeeTeaSweet: boolean
- wineMenu: boolean
- welcomeDrink: boolean
- flagOnTable: boolean`;

    // ========== AI EXTRACTION (Lovable AI Gateway — OpenAI-compatible) ==========
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${pdfBase64}` },
              },
              {
                type: "text",
                text: "Extract all restaurant reservations (time >= 18:00) from this Køkkenliste PDF. Extract the date from the header as reservationDate. Check for a 'Kaffe/te + sødt' section and match entries to reservations by room number. Extract wineMenu, welcomeDrink, flagOnTable as booleans (not in notes).",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_reservations",
              description: "Extract restaurant reservations from the PDF for times >= 18:00",
              parameters: {
                type: "object",
                properties: {
                  reservationDate: {
                    type: "string",
                    description: "The date from the PDF header, e.g. 'Lørdag d. 8. marts 2026'",
                  },
                  reservations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "string" },
                        guestCount: { type: "number" },
                        dishCount: { type: "number" },
                        reservationType: { type: "string", enum: ["2-ret", "3-ret", "4-ret", "a-la-carte", "bordreservation"] },
                        guestName: { type: "string" },
                        roomNumber: { type: "string" },
                        notes: { type: "string" },
                        coffeeOnly: { type: "boolean" },
                        coffeeTeaSweet: { type: "boolean" },
                        wineMenu: { type: "boolean" },
                        welcomeDrink: { type: "boolean" },
                        flagOnTable: { type: "boolean" },
                      },
                      required: [
                        "time", "guestCount", "dishCount", "reservationType",
                        "guestName", "roomNumber", "notes",
                        "coffeeOnly", "coffeeTeaSweet", "wineMenu", "welcomeDrink", "flagOnTable",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["reservationDate", "reservations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_reservations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please top up your Lovable workspace." }, 402);
      }
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      return jsonResponse({ error: `AI gateway error ${response.status}: ${errorText.substring(0, 200)}` }, 500);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let result: { reservationDate: string; reservations: any[] };

    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        result = {
          reservationDate: args.reservationDate || "",
          reservations: args.reservations || [],
        };
      } catch (parseErr) {
        console.error("Failed to parse tool call arguments:", parseErr);
        result = { reservationDate: "", reservations: [] };
      }
    } else {
      console.error("No tool_call in AI response:", JSON.stringify(data).substring(0, 300));
      result = { reservationDate: "", reservations: [] };
    }

    // ========== TOKEN TRACKING ==========
    const usage = data.usageMetadata;
    const tokensUsed = usage ? (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0) : null;
    const estimatedCost = tokensUsed ? tokensUsed * 0.00001 : null; // rough estimate

    // ========== CACHE STORE ==========
    try {
      await supabaseAdmin.from("ai_cache").upsert({
        hotel_id: membership.hotel_id,
        content_hash: contentHash,
        job_type: "parse_table_plan",
        result: result,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        hit_count: 0,
      }, { onConflict: "hotel_id,content_hash,job_type" });
      console.log(`Cached result for hash ${contentHash.substring(0, 12)}…`);
    } catch (cacheErr) {
      console.warn("Cache store failed:", cacheErr);
    }

    // ========== AI JOB LOG ==========
    try {
      await supabaseAdmin.from("ai_jobs").insert({
        hotel_id: membership.hotel_id,
        job_type: "parse_table_plan",
        created_by: userId,
        status: "completed",
        model: "google/gemini-2.5-flash",
        input: { content_hash: contentHash, pdf_size_bytes: pdfBase64.length },
        output: { reservation_count: result.reservations.length, date: result.reservationDate },
        completed_at: new Date().toISOString(),
        tokens_used: tokensUsed,
        estimated_cost: estimatedCost,
      });
    } catch (jobErr) {
      console.warn("AI job log failed:", jobErr);
    }

    // ========== AUDIT LOG ==========
    await supabaseAdmin.from("audit_logs").insert({
      hotel_id: membership.hotel_id,
      user_id: userId,
      action: "table_plan.parse_pdf",
      target_type: "table_plan",
      details: { reservation_count: result.reservations.length, date: result.reservationDate, tokens_used: tokensUsed },
    });

    // ========== PHASE 7: Best-effort relational mirror write ==========
    try {
      let planDate = new Date().toISOString().split("T")[0];
      if (result.reservationDate) {
        const dateMatch = result.reservationDate.match(/(\d{1,2})\.\s*(\w+)\.?\s*(\d{4})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, "0");
          const monthStr = dateMatch[2].toLowerCase();
          const year = dateMatch[3];
          const monthMap: Record<string, string> = {
            jan: "01", feb: "02", mar: "03", apr: "04",
            maj: "05", jun: "06", jul: "07", aug: "08",
            sep: "09", okt: "10", nov: "11", dec: "12",
          };
          const month = monthMap[monthStr] || monthMap[monthStr.substring(0, 3)];
          if (month) planDate = `${year}-${month}-${day}`;
        }
      }

      await supabaseAdmin
        .from("restaurant_reservations")
        .delete()
        .eq("hotel_id", membership.hotel_id)
        .eq("plan_date", planDate);

      if (result.reservations.length > 0) {
        const rows = result.reservations.map((r: any) => ({
          hotel_id: membership.hotel_id,
          guest_name: r.guestName || "",
          party_size: r.guestCount || 1,
          room_number: r.roomNumber || "",
          course: r.reservationType || `${r.dishCount}-ret`,
          notes: r.notes || "",
          plan_date: planDate,
          source: "pdf_import",
        }));
        await supabaseAdmin.from("restaurant_reservations").insert(rows);
      }
    } catch (mirrorErr) {
      console.warn("Phase 7 mirror write failed:", mirrorErr);
    }

    return jsonResponse(result);
  } catch (e) {
    console.error("parse-table-plan error:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500
    );
  }
});
