const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const payload = await req.json();
    const { monthlyData, categoryData, memberData, goalData, recurringData, trendData } = payload || {};
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    if (!AI_API_KEY) throw new Error("AI_API_KEY is not configured");
    const AI_BASE_URL = Deno.env.get("AI_BASE_URL") || "https://api.openai.com/v1";
    const AI_MODEL = Deno.env.get("AI_MODEL") || "gpt-4o-mini";

    const systemPrompt = `You are a sharp, candid personal financial advisor analyzing an Indian household's real financial data. You speak directly to the user using "you" and "your". You refer to household members by the exact names provided in the data — never invent names, never use placeholders like "Member A".

Your job is to act like a true intelligent advisor: surface BOTH good habits and bad habits, detect trends and patterns, and give realistic recommendations with concrete rupee impact. Every insight must cite at least one real number, percentage, category, member name or month from the supplied data. Never produce generic, template-style advice such as "spend less" or "try to save more". If the data does not support an insight, omit it — do not fabricate.

Return ONLY valid JSON (no markdown fences) matching this exact schema:

{
  "healthScore": 0-100,
  "healthLabel": "Excellent | Good | Fair | Needs Attention",
  "healthSummary": "1 sentence personalized to the user's actual savings rate and expense ratio",
  "positiveTrends": [
    { "icon": "trending-up|trending-down|piggy-bank|shield|target", "title": "Short positive habit", "description": "1-2 sentences citing real numbers, %, categories or member names" }
  ],
  "warnings": [
    { "icon": "alert|trending-up|trending-down", "title": "Short bad habit / warning", "description": "1-2 sentences with real numbers, %, categories or member names. Severity is implied by language." }
  ],
  "recommendations": [
    { "title": "Concrete action tied to a real category or pattern", "description": "Specific suggestion referencing actual spending. Mention monthly impact and 1-year projection where useful.", "monthlySavings": 0, "yearlyImpact": 0 }
  ],
  "categoryTrends": [
    { "category": "Category name as in data", "amount": 0, "percentage": 0, "trend": "up|down|stable", "deltaPct": 0, "note": "Optional 1-line context" }
  ],
  "memberInsights": [
    { "member": "Exact member name from data", "title": "Short comparison statement", "description": "1 sentence using their actual share/contribution numbers" }
  ],
  "goalInsights": [
    { "goal": "Goal name from data", "title": "Short status", "description": "1 sentence about pacing toward target_amount with the current_amount" }
  ],
  "monthlyVerdict": {
    "bestMonth": "MMM yyyy",
    "worstMonth": "MMM yyyy",
    "averageExpense": 0,
    "averageIncome": 0,
    "savingsRate": 0
  },
  "highlights": [
    { "icon": "trending-up|trending-down|alert|piggy-bank|target|shield", "title": "...", "description": "...", "type": "positive|negative|warning|info" }
  ],
  "topCategories": [
    { "category": "...", "amount": 0, "percentage": 0, "trend": "up|down|stable" }
  ],
  "tips": [
    { "title": "...", "description": "...", "savingsEstimate": 0 }
  ]
}

Strict rules:
- positiveTrends: 2-4 items celebrating real improvements (MoM decreases in spending, growing savings, stable essential categories, balanced behaviour). If genuinely none exist, return [].
- warnings: 2-4 items pointing out real overspending, category spikes, recurring leaks, declining savings. Avoid duplicates with positiveTrends.
- recommendations: 3-5 items, each ACTIONABLE and quantified. monthlySavings and yearlyImpact must be realistic numbers grounded in the user's averages, not invented.
- categoryTrends: top 5 by amount. deltaPct compares latest month vs previous month for that category (0 if no prior data).
- memberInsights: only if memberData has entries — produce 2-4 comparison statements using their actual expense% / savings% / top category.
- goalInsights: only if goalData has entries.
- highlights, topCategories, tips: keep these populated as a backward-compatible mirror of positiveTrends+warnings, categoryTrends and recommendations so older UI still works.
- Currency in ₹ Indian format. Every description ≤ 2 sentences. No mention of names not in the data.`;

    const userPrompt = `Monthly summary (income/expense/savings per month):\n${JSON.stringify(monthlyData ?? [], null, 2)}\n\nCategory breakdown (expenses):\n${JSON.stringify(categoryData ?? [], null, 2)}\n\nMember-wise contribution (real names, expense and savings share):\n${JSON.stringify(memberData ?? [], null, 2)}\n\nSavings goals (progress vs target):\n${JSON.stringify(goalData ?? [], null, 2)}\n\nRecurring/recent recurring patterns:\n${JSON.stringify(recurringData ?? [], null, 2)}\n\nCategory MoM trend deltas:\n${JSON.stringify(trendData ?? [], null, 2)}`;

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
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
      const t = await response.text();
      console.error("AI API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ insights: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Backward-compat: derive highlights from positiveTrends + warnings if the model omits them.
    if (!insights.highlights || !Array.isArray(insights.highlights) || insights.highlights.length === 0) {
      const pos = (insights.positiveTrends || []).map((p: any) => ({
        icon: p.icon || "trending-down",
        title: p.title,
        description: p.description,
        type: "positive",
      }));
      const warn = (insights.warnings || []).map((w: any) => ({
        icon: w.icon || "alert",
        title: w.title,
        description: w.description,
        type: "warning",
      }));
      insights.highlights = [...pos, ...warn].slice(0, 6);
    }
    if (!insights.topCategories || insights.topCategories.length === 0) {
      insights.topCategories = (insights.categoryTrends || []).slice(0, 5);
    }
    if (!insights.tips || insights.tips.length === 0) {
      insights.tips = (insights.recommendations || []).map((r: any) => ({
        title: r.title,
        description: r.description,
        savingsEstimate: r.monthlySavings || 0,
      }));
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
