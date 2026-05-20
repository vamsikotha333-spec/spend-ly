import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { monthlyData, categoryData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a personal financial advisor analyzing household expense data for an Indian family.
Analyze the provided monthly and category-wise spending data and return a JSON response.

IMPORTANT: Return ONLY valid JSON, no markdown, no code fences. Use this exact structure:

{
  "healthScore": 75,
  "healthLabel": "Good",
  "healthSummary": "Brief 1-line assessment",
  "highlights": [
    { "icon": "trending-up|trending-down|alert|piggy-bank|target|shield", "title": "Short title", "description": "1-2 sentence insight", "type": "positive|negative|warning|info" }
  ],
  "topCategories": [
    { "category": "Category name", "amount": 5000, "percentage": 25, "trend": "up|down|stable" }
  ],
  "tips": [
    { "title": "Tip title", "description": "Actionable suggestion", "savingsEstimate": 2000 }
  ],
  "monthlyVerdict": {
    "bestMonth": "Mar 2026",
    "worstMonth": "Jan 2026",
    "averageExpense": 15000,
    "averageIncome": 30000,
    "savingsRate": 20
  }
}

Rules:
- healthScore: 0-100 (0=critical, 100=excellent)
- highlights: exactly 4-6 items covering trends, anomalies, positives, and warnings
- topCategories: top 5 expense categories with percentage of total expenses
- tips: 3-4 actionable money-saving tips with estimated monthly savings in ₹
- Use ₹ for currency in descriptions
- Be specific with real numbers from the data
- Keep descriptions concise (max 2 sentences each)`;

    const userPrompt = `Monthly financial summary:\n${JSON.stringify(monthlyData, null, 2)}\n\nCategory-wise breakdown:\n${JSON.stringify(categoryData, null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a minute." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      // Fallback: return as legacy markdown
      return new Response(JSON.stringify({ insights: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ insights, structured: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
