import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const repoOwner = Deno.env.get("GITHUB_REPO_OWNER");
    const repoName = Deno.env.get("GITHUB_REPO_NAME");

    if (!githubToken || !repoOwner || !repoName) {
      return new Response(
        JSON.stringify({
          error: "github_not_configured",
          commits: [],
          message: "GitHub integration not configured. Using fallback mode.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const perPage = Math.min(body.per_page || 15, 30);
    const since = body.since || null; // ISO date string cutoff

    let url = `https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=${perPage}&sha=main`;
    if (since) {
      url += `&since=${since}`;
    }

    const ghResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!ghResponse.ok) {
      const errText = await ghResponse.text();
      console.error("GitHub API error:", ghResponse.status, errText);
      return new Response(
        JSON.stringify({
          error: "github_api_error",
          status: ghResponse.status,
          commits: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ghData = await ghResponse.json();
    const commits = (ghData || []).map((c: any) => ({
      sha: c.sha?.substring(0, 8) || "",
      message: c.commit?.message?.split("\n")[0] || "",
      authored_at: c.commit?.author?.date || null,
    }));

    return new Response(JSON.stringify({ commits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-deployment-commits error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", commits: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
