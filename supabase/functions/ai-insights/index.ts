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

    const systemPrompt = `You are a sharp, personal financial coach analyzing an Indian household's spending data. You speak directly to the user using "you" — never refer to specific people by name unless their name appears in the data provided.

Be specific, data-driven, and personal. Every insight must cite a real number, percentage, or category from the provided data. Avoid generic advice like "spend less" or "save more". Instead use month-over-month comparisons, category trends, savings rate shifts, and behavior patterns.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "healthScore": 75,
  "healthLabel": "Good",
  "healthSummary": "1-line personalized assessment citing your actual savings rate or expense ratio",
  "highlights": [
    { "icon": "trending-up|trending-down|alert|piggy-bank|target|shield", "title": "Short specific title", "description": "1-2 sentences with real numbers and category names from the data. Example: 'Food expenses rose 32% from ₹8,400 in March to ₹11,100 in April, driven mostly by weekend dining.'", "type": "positive|negative|warning|info" }
  ],
  "topCategories": [
    { "category": "Category name", "amount": 5000, "percentage": 25, "trend": "up|down|stable" }
  ],
  "tips": [
    { "title": "Concrete action tied to a real category", "description": "Specific suggestion referencing actual spending. Example: 'Capping weekend dining at ₹2,000/week could free up ₹3,200/month based on your last 60 days.'", "savingsEstimate": 2000 }
  ],
  "monthlyVerdict": {
    "bestMonth": "Mar 2026",
    "worstMonth": "Jan 2026",
    "averageExpense": 15000,
    "averageIncome": 30000,
    "savingsRate": 20
  }
}

Strict rules:
- healthScore: 0-100 based on savings rate, expense ratio, and spending stability
- highlights: 4-6 items. MUST include at least one month-over-month comparison and one category-trend insight
- Every "description" cites at least one ₹ amount, % change, category name, or month from the data
- NO generic statements ("you should save more", "consider budgeting")
- NO mentioning hypothetical people; if the data has no named member, do not invent one
- Currency in ₹, Indian number format
- Each description ≤ 2 sentences, but rich in specifics`;

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
