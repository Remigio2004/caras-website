// Supabase Edge Function: generate-treasurer-narrative
//
// Receives a pre-computed "data digest" of the Treasurer Dashboard's stats
// and trends, sends it to TokenRouter (an OpenAI-compatible AI gateway) and
// returns an AI-authored 3-paragraph narrative draft. The TokenRouter API
// key lives only here (server-side, as a Supabase secret) and is never
// exposed to the browser bundle.
//
// Deploy: supabase functions deploy generate-treasurer-narrative
// Set secret: supabase secrets set TOKENROUTER_API_KEY=sk-xxxxx

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TOKENROUTER_URL = "https://api.tokenrouter.com/v1/chat/completions";
const MODEL = "z-ai/glm-5.3-free";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NarrativeRequestBody {
  asOfDate: string;
  stats: {
    totalFundsFormatted: string;
    grossCollectionsFormatted: string;
    expensesTotalFormatted: string;
    contributionsFormatted: string;
    contributionsPct: string;
    penaltiesFormatted: string;
    penaltiesPct: string;
    donationsFormatted: string;
    donationsPct: string;
    totalOutstandingFormatted: string;
  };
  contributionsSummary: string | null;
  penaltiesSummary: string | null;
  cashFlowSummary: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TOKENROUTER_API_KEY");
    if (!apiKey) {
      throw new Error("TOKENROUTER_API_KEY is not configured");
    }

    const body: NarrativeRequestBody = await req.json();

    // All amounts/percentages below were already computed deterministically
    // on the client (peso formatting, percentage math) so the model only
    // has to *write*, not calculate — this avoids the AI mangling numbers.
    const dataDigest = `
As-of date: ${body.asOfDate}

FINANCIAL POSITION
- Total fund balance: ${body.stats.totalFundsFormatted}
- Gross collections (contributions + penalties + donations): ${body.stats.grossCollectionsFormatted}
- Total expenses: ${body.stats.expensesTotalFormatted}
- Contributions collected: ${body.stats.contributionsFormatted} (${body.stats.contributionsPct} of gross collections)
- Penalties collected: ${body.stats.penaltiesFormatted} (${body.stats.penaltiesPct} of gross collections)
- Donations collected: ${body.stats.donationsFormatted} (${body.stats.donationsPct} of gross collections)
- Total outstanding (unpaid contributions + penalties): ${body.stats.totalOutstandingFormatted}

TRENDS
- Contributions trend: ${body.contributionsSummary ?? "No contributions data for this period."}
- Penalties trend: ${body.penaltiesSummary ?? "No penalties data for this period."}
- Cash flow trend: ${body.cashFlowSummary ?? "No cash flow data for this period."}
`.trim();

    const systemPrompt = `You are drafting the narrative section of an official Treasurer's Report for the Confraternity of Augustinian Recollect Altar Servers (CARAS), a Catholic parish organization.

Write exactly 3 paragraphs in formal, professional English:
1. Overall financial position (total funds, gross collections, expenses, breakdown by source).
2. Collection and cash flow trends for the period.
3. Outstanding balances and a brief closing statement on the Treasurer's Office's commitment to transparent fund management.

Rules:
- Use ONLY the figures given to you below. Do not invent, estimate, or recompute any numbers.
- Do not add headers, bullet points, or a title — plain paragraphs only, separated by a blank line.
- Keep the tone formal and suitable for a church organization's official record.
- This is a first draft; the treasurer will review and edit it before finalizing, so prioritize accuracy and clarity over flourish.`;

    const aiResponse = await fetch(TOKENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: dataDigest },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`TokenRouter error (${aiResponse.status}): ${errText}`);
    }

    const json = await aiResponse.json();
    const narrative: string | undefined = json?.choices?.[0]?.message?.content;

    if (!narrative || !narrative.trim()) {
      throw new Error("TokenRouter returned an empty narrative");
    }

    return new Response(JSON.stringify({ narrative: narrative.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("generate-treasurer-narrative error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
