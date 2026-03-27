import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": /^https:\/\/(.*\.(lovable\.app|lovableproject\.com)|(www\.)?pourstock\.com)$/.test(origin) ? origin : "https://www.pourstock.com",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

// ─── Commit classification ───

const TECHNICAL_PATTERNS = [
  /\bindex\b/i, /\bmigration\b/i, /\brefactor/i, /\blint/i, /\beslint/i,
  /\bprettier/i, /\btyping/i, /\bpackage\b/i, /\bdependency/i, /\bconfig\b/i,
  /\blogging\b/i, /\binternal\b/i, /\btest\b/i, /\bci\b/i, /\bbuild\b/i,
  /\bchore\b/i, /\breadme/i, /\bdocumentation/i, /\btypes\.ts/i,
  /\bdual.write/i, /\bparity/i, /\brls polic/i, /\bschema\b/i,
  /\bsecurity.definer/i, /\bconfig\.toml/i, /\bbump\b/i, /\btrigger\b/i,
  /\bconstraint\b/i, /\bwip\b/i, /\bmerge\b/i, /\bformat/i,
];

const USER_FACING_PATTERNS = [
  /check.?in/i, /check.?out/i, /guest/i, /room/i, /table.?plan/i,
  /reservation/i, /import/i, /pdf/i, /billing/i, /folio/i, /payment/i,
  /housekeeping/i, /inventory/i, /dashboard/i, /settings/i, /approval/i,
  /notification/i, /performance/i, /\bfix\b/i, /\bissue\b/i, /\bbug\b/i,
  /\bui\b/i, /\bux\b/i, /popup/i, /modal/i, /button/i, /display/i,
  /reception/i, /order/i, /report/i, /vendor/i, /stock/i, /count/i,
  /release.?note/i, /update/i, /onboarding/i, /login/i, /signup/i,
];

type CommitClass = "user_facing" | "technical" | "mixed" | "irrelevant";

function classifyCommit(msg: string): CommitClass {
  const isTechnical = TECHNICAL_PATTERNS.some((p) => p.test(msg));
  const isUserFacing = USER_FACING_PATTERNS.some((p) => p.test(msg));
  if (isUserFacing && !isTechnical) return "user_facing";
  if (isUserFacing && isTechnical) return "mixed";
  if (isTechnical) return "technical";
  if (msg.length < 10) return "irrelevant";
  return "mixed";
}

// ─── Theme grouping ───

const THEME_GROUPS: Record<string, RegExp[]> = {
  "Reception & guest management": [/reception/i, /check.?in/i, /check.?out/i, /guest/i, /stay/i, /room/i],
  "Table plan & reservations": [/table.?plan/i, /reservation/i, /import/i, /pdf/i, /assignment/i],
  "Billing & payments": [/billing/i, /folio/i, /payment/i, /charge/i, /invoice/i],
  "Inventory & stock": [/inventory/i, /stock/i, /count/i, /product/i, /order/i, /vendor/i],
  "Housekeeping": [/housekeeping/i, /cleaning/i, /maintenance/i],
  "Reports & analytics": [/report/i, /analytics/i, /dashboard/i],
  "User experience": [/ui\b/i, /ux\b/i, /modal/i, /popup/i, /button/i, /display/i, /layout/i],
};

function groupCommitsToThemes(messages: string[]): string[] {
  const themes: Set<string> = new Set();
  for (const msg of messages) {
    for (const [theme, patterns] of Object.entries(THEME_GROUPS)) {
      if (patterns.some((p) => p.test(msg))) {
        themes.add(theme);
        break;
      }
    }
  }
  return Array.from(themes);
}

// ─── Fingerprint ───

async function computeFingerprint(version: string, messages: string[]): Promise<string> {
  const normalized = messages.map((m) => m.toLowerCase().trim()).sort().join("|");
  const input = `${version}::${normalized}`;
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = new TextDecoder().decode(hexEncode(new Uint8Array(hash)));
  return hex.substring(0, 16);
}

// ─── Local fallback for note generation ───

function generateFallbackNotes(themes: string[]): {
  title: string;
  summary: string;
  bullet_points: string[];
  severity: string;
} {
  if (themes.length === 0) {
    return {
      title: "Behind-the-scenes improvements",
      summary: "We made some improvements under the hood.",
      bullet_points: ["🔧 Performance and stability improvements"],
      severity: "info",
    };
  }

  const themeBullets: Record<string, string> = {
    "Reception & guest management": "🏨 Improved reception and guest management",
    "Table plan & reservations": "🍽️ Table plan and reservation improvements",
    "Billing & payments": "💳 Billing and payment updates",
    "Inventory & stock": "📦 Inventory and stock management improvements",
    "Housekeeping": "🧹 Housekeeping workflow updates",
    "Reports & analytics": "📊 Report and analytics improvements",
    "User experience": "✨ User interface improvements",
  };

  return {
    title: "Latest Improvements",
    summary: "Here's what's new in PourStock.",
    bullet_points: themes.map((t) => themeBullets[t] || `✅ ${t}`).slice(0, 6),
    severity: "info",
  };
}

// ─── Main handler ───

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
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

    // Verify caller is authenticated
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

    const body = await req.json();
    const version: string = body.version;
    if (!version) {
      return new Response(JSON.stringify({ error: "version_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB operations (auto-creation is privileged)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check if release already exists for this version
    const { data: existing } = await adminClient
      .from("release_announcements")
      .select("id")
      .eq("version", version)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "exists", release_id: existing.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch GitHub commits
    let commits: { sha: string; message: string; authored_at: string | null }[] = [];
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const repoOwner = Deno.env.get("GITHUB_REPO_OWNER");
    const repoName = Deno.env.get("GITHUB_REPO_NAME");

    if (githubToken && repoOwner && repoName) {
      try {
        const { data: lastRelease } = await adminClient
          .from("release_announcements")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let ghUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=20&sha=main`;
        if (lastRelease?.created_at) {
          ghUrl += `&since=${lastRelease.created_at}`;
        }

        const ghRes = await fetch(ghUrl, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          commits = (ghData || []).map((c: any) => ({
            sha: c.sha?.substring(0, 8) || "",
            message: c.commit?.message?.split("\n")[0] || "",
            authored_at: c.commit?.author?.date || null,
          }));
        } else {
          console.warn("GitHub fetch failed:", ghRes.status);
        }
      } catch (err) {
        console.warn("GitHub fetch error:", err);
      }
    }

    // 3. Classify and filter commits
    const allMessages = commits.map((c) => c.message);
    const classified = allMessages.map((msg) => ({
      message: msg,
      classification: classifyCommit(msg),
    }));

    const userFacing = classified.filter(
      (c) => c.classification === "user_facing" || c.classification === "mixed"
    );
    const filteredMessages = userFacing.map((c) => c.message);

    // 4. Group into themes
    const themes = groupCommitsToThemes(filteredMessages);

    // 5. Compute fingerprint
    const fingerprint = await computeFingerprint(version, allMessages);

    const { data: fpExists } = await adminClient
      .from("release_announcements")
      .select("id")
      .eq("release_fingerprint", fingerprint)
      .maybeSingle();

    if (fpExists) {
      return new Response(
        JSON.stringify({ status: "duplicate_fingerprint", release_id: fpExists.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Decide: AI or fallback
    let releaseData: {
      title: string;
      summary: string;
      bullet_points: string[];
      severity: string;
    };
    let generationStatus = "generated";
    let aiModel: string | null = null;
    let isSilent = false;

    if (filteredMessages.length === 0) {
      releaseData = generateFallbackNotes([]);
      generationStatus = "fallback";
      isSilent = true;
    } else if (filteredMessages.length <= 2 && themes.length <= 1) {
      releaseData = generateFallbackNotes(themes);
      generationStatus = "fallback";
    } else {
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableApiKey) {
        try {
          const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
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
                  content: `You convert raw deployment commit messages into user-friendly product updates for a hotel management platform called PourStock used by hotel staff in Denmark.

Rules:
- Remove ALL engineering-only changes: index creation, database migrations, refactors, type changes, dependency updates, logging, RLS policies, schema changes, config changes, documentation updates, tests, CI/CD
- Keep ONLY changes that affect user workflows or UI
- Rewrite in simple, friendly product language suitable for hotel staff
- Use emoji bullets where appropriate
- Maximum 6 bullet points
- Output JSON: { "title": "...", "summary": "...", "bullet_points": ["...", "..."], "severity": "info" }
- Title: catchy, max 8 words
- Summary: one sentence
- severity: "info" for normal updates, "important" for significant features, "critical" only for breaking changes
- If changes are minor, keep notes brief (1-2 bullets)
- If NO user-facing changes, return: { "title": "Behind-the-scenes improvements", "summary": "We made some improvements under the hood.", "bullet_points": ["🔧 Performance and stability improvements"], "severity": "info" }

Detected themes: ${themes.join(", ")}`,
                },
                {
                  role: "user",
                  content: `Convert these commit messages into user-friendly release notes:\n\n${filteredMessages.join("\n")}`,
                },
              ],
              temperature: 0.3,
              max_tokens: 500,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.title && parsed.bullet_points) {
                releaseData = parsed;
                aiModel = "google/gemini-2.5-flash";
              } else {
                throw new Error("Invalid AI output structure");
              }
            } else {
              throw new Error("No JSON in AI response");
            }
          } else {
            throw new Error(`AI API error: ${aiRes.status}`);
          }
        } catch (aiErr) {
          console.warn("AI generation failed, using fallback:", aiErr);
          releaseData = generateFallbackNotes(themes);
          generationStatus = "fallback";
        }
      } else {
        releaseData = generateFallbackNotes(themes);
        generationStatus = "fallback";
      }
    }

    releaseData = releaseData!;

    // 7. Insert release
    const { data: inserted, error: insertErr } = await adminClient
      .from("release_announcements")
      .insert({
        version,
        title: releaseData.title,
        summary: releaseData.summary || null,
        content: releaseData.bullet_points,
        severity: releaseData.severity || "info",
        is_mandatory: false,
        is_silent: isSilent,
        is_published: false,
        published_at: null,
        source: "auto",
        audience_type: "all",
        commit_messages: allMessages.length > 0 ? allMessages : null,
        filtered_commit_messages: filteredMessages.length > 0 ? filteredMessages : null,
        release_fingerprint: fingerprint,
        ai_model: aiModel,
        generation_status: generationStatus,
        created_by: null,
      })
      .select("id")
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return new Response(
          JSON.stringify({ status: "duplicate", message: "Release already exists" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertErr;
    }

    // 8. Create metrics row
    if (inserted) {
      await adminClient
        .from("release_metrics")
        .insert({ release_id: inserted.id })
        .single();
    }

    return new Response(
      JSON.stringify({
        status: "created",
        release_id: inserted?.id,
        generation_status: generationStatus,
        ai_model: aiModel,
        themes,
        user_facing_commits: filteredMessages.length,
        total_commits: allMessages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-autonomous-release error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
