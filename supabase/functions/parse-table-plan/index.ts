import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": /^https:\/\/.*\.lovable\.app$/.test(origin) ? origin : "https://swift-stock-bar.lovable.app",
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

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub as string;

    // Verify user is approved hotel member with restaurant access
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ========== AI EXTRACTION ==========
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a data extraction assistant. You will receive a Danish restaurant reservation list (Køkkenliste) as a PDF. 

Extract ONLY reservations with time >= 18:00 (6 PM onwards). These are restaurant dinner reservations.
Ignore any events before 18:00 (like lunch, meetings, conferences, Rotary events, etc).

IMPORTANT: Also extract the reservation date from the PDF header (e.g. "Lørdag d. 8. marts 2026"). Return it as reservationDate.

IMPORTANT RULES FOR NOTES:
- Notes and comments ALWAYS belong to the reservation ABOVE or BEFORE them in the list, NEVER to the one below/after.
- When you see a note line (e.g. "1x gravid", "laktoseintolerant", "glutenfri"), assign it to the PREVIOUS reservation entry, not the next one.
- Pay careful attention to which room number or guest name the note is associated with.
- Do NOT mix up notes between different reservations. If a note appears after room 311's line and before room 313's line, it belongs to 311.
- Common notes include: allergies (laktoseintolerant, glutenfri), dietary restrictions (gravid, vegetar), included services.

ICON EXTRACTION (as booleans — do NOT put these in notes):
- wineMenu: true if "vinmenu", "vinmenuen", "vin menu" is mentioned for this reservation. Do NOT include in notes.
- welcomeDrink: true if "velkomst", "velkomstdrink", "lille overraskelse", "velkomstdrink inkl." is mentioned. Do NOT include in notes.
- flagOnTable: true if "flag", "dansk flag", "flag på bord", "flag på bordet" is mentioned. Do NOT include in notes.

KAFFE/TE + SØDT SECTION:
- After the restaurant reservation section, there may be a "Kaffe/te" section with entries like "Kaffe/te, 1 kop" or "Kaffe/te Risskov".
- Match these entries to existing reservations by room number.
- TWO FORMATS EXIST:
  1. "Kaffe/te, 1 kop" (or similar simple coffee order) = coffee ONLY. Set coffeeOnly=true, coffeeTeaSweet=false.
  2. "Kaffe/te Risskov" followed by a line "med sødt (stk. chokolade eller småkage)" = coffee WITH sweet. Set coffeeOnly=false, coffeeTeaSweet=true.
- If the entry has "med sødt" or "chokolade" or "småkage" on the NEXT line, it means coffee+sweet (coffeeTeaSweet=true).
- If no "med sødt" line follows, it's coffee only (coffeeOnly=true).

For each reservation, extract:
- time: the reservation time (e.g. "18:00")
- guestCount: number of guests (integer)
- dishCount: number of dishes/courses (integer, e.g. 2, 3, or 4)
- reservationType: one of "2-ret", "3-ret", "4-ret", "a-la-carte", or "bordreservation". Determine from context:
  - "2 retter"/"2 ret"/"2-retters" → "2-ret"
  - "3 retter"/"3 ret"/"3-retters" → "3-ret"
  - "4 retter"/"4 ret"/"4-retters" → "4-ret"
  - "a la carte"/"à la carte" → "a-la-carte"
  - "bordreservation"/"bord reservation"/"kun bord" or if no food type is mentioned → "bordreservation"
- guestName: guest name if available, otherwise empty string
- roomNumber: room number if shown (e.g. "216"), otherwise empty string
- notes: any special notes like allergies, intolerances, dietary requirements. Empty string if none. Do NOT include wine menu, welcome drink, flag, or coffee references in notes.
- coffeeOnly: boolean, true if this reservation has ONLY coffee/tea (no sødt)
- coffeeTeaSweet: boolean, true if this reservation has coffee/tea WITH sødt/chokolade/småkage
- wineMenu: boolean, true if wine menu is mentioned
- welcomeDrink: boolean, true if welcome drink / velkomst is mentioned
- flagOnTable: boolean, true if flag on table is mentioned

Return the data as a JSON array. Do not include any markdown formatting, just pure JSON.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all restaurant reservations (time >= 18:00) from this Køkkenliste PDF. Extract the date from the header as reservationDate. Also check for a 'Kaffe/te + sødt' section and match entries to reservations by room number. Extract wineMenu, welcomeDrink, flagOnTable as booleans (not notes). Return ONLY the JSON via the function call.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${pdfBase64}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_reservations",
                description:
                  "Extract restaurant reservations from the PDF for times >= 18:00",
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
          tool_choice: {
            type: "function",
            function: { name: "extract_reservations" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add credits." }, 402);
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return jsonResponse({ error: "Failed to process PDF" }, 500);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let result: { reservationDate: string; reservations: any[] };

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      result = {
        reservationDate: parsed.reservationDate || "",
        reservations: parsed.reservations || [],
      };
    } else {
      const content = data.choices?.[0]?.message?.content || "[]";
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      result = { reservationDate: "", reservations: JSON.parse(cleaned) };
    }

    // ========== AUDIT LOG ==========
    await supabaseAdmin.from("audit_logs").insert({
      hotel_id: membership.hotel_id,
      user_id: userId,
      action: "table_plan.parse_pdf",
      target_type: "table_plan",
      details: { reservation_count: result.reservations.length, date: result.reservationDate },
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
