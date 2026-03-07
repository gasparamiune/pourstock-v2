import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "No PDF data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
                          "time",
                          "guestCount",
                          "dishCount",
                          "reservationType",
                          "guestName",
                          "roomNumber",
                          "notes",
                          "coffeeOnly",
                          "coffeeTeaSweet",
                          "wineMenu",
                          "welcomeDrink",
                          "flagOnTable",
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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process PDF" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      // Return both reservationDate and reservations
      return new Response(JSON.stringify({
        reservationDate: parsed.reservationDate || '',
        reservations: parsed.reservations || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return new Response(JSON.stringify({ reservationDate: '', reservations: JSON.parse(cleaned) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-table-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
