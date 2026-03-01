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

IMPORTANT RULES FOR NOTES:
- Notes and comments ALWAYS belong to the reservation ABOVE or BEFORE them in the list, NEVER to the one below/after.
- When you see a note line (e.g. "1x gravid", "laktoseintolerant", "glutenfri"), assign it to the PREVIOUS reservation entry, not the next one.
- Pay careful attention to which room number or guest name the note is associated with.
- Do NOT mix up notes between different reservations. If a note appears after room 311's line and before room 313's line, it belongs to 311.
- Common notes include: allergies (laktoseintolerant, glutenfri), dietary restrictions (gravid, vegetar), included services (velkomstdrink inkl., kaffe inkl.).

KAFFE/TE + SØDT SECTION:
- After the restaurant reservation section, there may be a "Kaffe/te + sødt" or similar section.
- Extract these entries and match them to existing reservations by room number.
- If a reservation's room number appears in the kaffe/te section, set coffeeTeaSweet to true for that reservation.
- If no match is found, still note it.

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
- notes: any special notes like allergies, intolerances, dietary requirements, included services (e.g. "laktoseintolerant", "glutenfri", "velkomstdrink inkl.", "kaffe inkl."). Empty string if none.
- coffeeTeaSweet: boolean, true if this reservation has kaffe/te + sødt included

Return the data as a JSON array. Do not include any markdown formatting, just pure JSON.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all restaurant reservations (time >= 18:00) from this Køkkenliste PDF. Also check for a 'Kaffe/te + sødt' section and match entries to reservations by room number. Return ONLY the JSON array.",
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
                          coffeeTeaSweet: { type: "boolean" },
                        },
                        required: [
                          "time",
                          "guestCount",
                          "dishCount",
                          "reservationType",
                          "guestName",
                          "roomNumber",
                          "notes",
                          "coffeeTeaSweet",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["reservations"],
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
      return new Response(JSON.stringify(parsed.reservations), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return new Response(JSON.stringify(JSON.parse(cleaned)), {
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
