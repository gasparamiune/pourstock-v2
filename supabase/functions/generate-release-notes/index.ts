import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": /^https:\/\/(.*\.(lovable\.app|lovableproject\.com)|(www\.)?pourstock\.com)$/.test(origin) ? origin : "https://www.pourstock.com",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "admin_only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rawNotes: string = body.raw_release_notes || "";
    const commitMessages: string[] = body.commit_messages || [];

    const inputText = rawNotes.trim() || commitMessages.join("\n");
    if (!inputText) {
      return new Response(
        JSON.stringify({ error: "raw_release_notes or commit_messages required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      const result = filterNotesLocally(inputText);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(
      "https://api.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You convert raw deployment/release notes into user-friendly product updates for a hotel management platform called PourStock used by hotel staff in Denmark.

Rules:
- Remove ALL engineering-only changes: index creation, database migrations, refactors, type changes, dependency updates, logging, RLS policies, schema changes, config changes, documentation updates
- Keep ONLY changes that affect user workflows or UI
- Rewrite in simple, friendly product language
- Use emoji bullets where appropriate
- Maximum 6 bullet points
- Output JSON with: { "title": "...", "summary": "...", "bullet_points": ["...", "..."], "severity": "info" }
- Title should be catchy and short (max 8 words)
- Summary should be one sentence
- severity: "info" for regular, "important" for significant features, "critical" for breaking changes
- If there are NO user-facing changes, return { "title": "Behind-the-scenes improvements", "summary": "We made some improvements under the hood.", "bullet_points": ["🔧 Performance and stability improvements"], "severity": "info" }`,
            },
            {
              role: "user",
              content: `Convert these raw release notes into user-friendly notes:\n\n${inputText}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      }
    );

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      const result = filterNotesLocally(inputText);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (parsed && parsed.title && parsed.bullet_points) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = filterNotesLocally(inputText);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-release-notes error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function filterNotesLocally(raw: string): {
  title: string;
  summary: string;
  bullet_points: string[];
  severity: string;
} {
  const technicalPatterns = [
    /refactor/i, /^(added|created|updated) index/i, /migration/i,
    /rls polic/i, /schema/i, /dual.write/i, /parity view/i,
    /hook (structure|refactor)/i, /security.definer/i, /eslint|prettier|lint/i,
    /config\.toml/i, /readme|documentation/i, /types\.ts/i,
    /dependency (update|bump)/i, /^bump/i, /internal/i, /trigger/i,
    /constraint/i, /\btest\b/i, /\bci\b/i, /\bbuild\b/i, /\bchore\b/i,
  ];

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !technicalPatterns.some((p) => p.test(l)))
    .slice(0, 6);

  return {
    title: "Latest Improvements",
    summary: "Here's what's new in PourStock.",
    bullet_points:
      lines.length > 0
        ? lines
        : ["🔧 Performance and stability improvements"],
    severity: "info",
  };
}
