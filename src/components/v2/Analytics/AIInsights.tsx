import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PiggyBank,
  Target,
  Shield,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Heart,
  Calendar,
  IndianRupee,
  GitCompareArrows,
} from "lucide-react";
import { Transaction } from "@/types/transaction";
import { format, eachMonthOfInterval, isSameMonth, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear, subYears, isWithinInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { PeriodComparison } from "./PeriodComparison";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";

interface AIInsightsProps {
  transactions: Transaction[];
}

interface StructuredInsights {
  healthScore: number;
  healthLabel: string;
  healthSummary: string;
  highlights: Array<{
    icon: string;
    title: string;
    description: string;
    type: "positive" | "negative" | "warning" | "info";
  }>;
  positiveTrends?: Array<{ icon: string; title: string; description: string }>;
  warnings?: Array<{ icon: string; title: string; description: string }>;
  recommendations?: Array<{ title: string; description: string; monthlySavings: number; yearlyImpact: number }>;
  categoryTrends?: Array<{ category: string; amount: number; percentage: number; trend: "up" | "down" | "stable"; deltaPct?: number; note?: string }>;
  memberInsights?: Array<{ member: string; title: string; description: string }>;
  goalInsights?: Array<{ goal: string; title: string; description: string }>;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: "up" | "down" | "stable";
  }>;
  tips: Array<{
    title: string;
    description: string;
    savingsEstimate: number;
  }>;
  monthlyVerdict: {
    bestMonth: string;
    worstMonth: string;
    averageExpense: number;
    averageIncome: number;
    savingsRate: number;
  };
}

type PeriodType = "this-month" | "last-month" | "this-quarter" | "last-quarter" | "this-year" | "last-3-months" | "last-6-months";

const PERIOD_LABELS: Record<PeriodType, string> = {
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-quarter": "This Quarter",
  "last-quarter": "Last Quarter",
  "this-year": "This Year",
  "last-3-months": "Last 3 Months",
  "last-6-months": "Last 6 Months",
};

function getPeriodRange(period: PeriodType): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "this-month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last-month":
      return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case "this-quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "last-quarter":
      return { start: startOfQuarter(subQuarters(now, 1)), end: endOfQuarter(subQuarters(now, 1)) };
    case "this-year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "last-3-months":
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    case "last-6-months":
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
  }
}

const ICON_MAP: Record<string, React.ReactNode> = {
  "trending-up": <TrendingUp className="h-5 w-5" />,
  "trending-down": <TrendingDown className="h-5 w-5" />,
  alert: <AlertTriangle className="h-5 w-5" />,
  "piggy-bank": <PiggyBank className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
};

const TYPE_STYLES = {
  positive: { bg: "bg-success/10", border: "border-success/20", text: "text-success", icon: "text-success" },
  negative: { bg: "bg-destructive/10", border: "border-destructive/20", text: "text-destructive", icon: "text-destructive" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600", icon: "text-amber-500" },
  info: { bg: "bg-info/10", border: "border-info/20", text: "text-info", icon: "text-info" },
};

function HealthGauge({ score, label, summary, compact }: { score: number; label: string; summary: string; compact?: boolean }) {
  const getColor = (s: number) => s >= 80 ? "text-success" : s >= 60 ? "text-amber-500" : s >= 40 ? "text-orange-500" : "text-destructive";
  const getTrackColor = (s: number) => s >= 80 ? "bg-success" : s >= 60 ? "bg-amber-500" : s >= 40 ? "bg-orange-500" : "bg-destructive";

  return (
    <Card className={cn("shadow-medium border-0 animate-scale-in text-center", compact ? "p-4" : "p-6")}>
      <div className="flex flex-col items-center gap-2">
        <Heart className={cn(compact ? "h-6 w-6" : "h-8 w-8", getColor(score))} />
        <div className="relative w-full max-w-[180px]">
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", getTrackColor(score))} style={{ width: `${score}%` }} />
          </div>
        </div>
        <div>
          <span className={cn(compact ? "text-3xl" : "text-4xl", "font-bold tabular-nums", getColor(score))}>{score}</span>
          <span className="text-base text-muted-foreground">/100</span>
        </div>
        <Badge variant="secondary" className="text-xs px-2 py-0.5">{label}</Badge>
        <p className={cn("text-muted-foreground max-w-xs", compact ? "text-[11px]" : "text-sm")}>{summary}</p>
      </div>
    </Card>
  );
}

function HighlightCard({ highlight, index }: { highlight: StructuredInsights["highlights"][0]; index: number }) {
  const style = TYPE_STYLES[highlight.type] || TYPE_STYLES.info;
  return (
    <div className={cn("p-3 rounded-xl border animate-slide-up", style.bg, style.border)} style={{ animationDelay: `${200 + index * 80}ms`, animationFillMode: "both" }}>
      <div className="flex items-start gap-2.5">
        <div className={cn("mt-0.5 flex-shrink-0", style.icon)}>{ICON_MAP[highlight.icon] || <Sparkles className="h-5 w-5" />}</div>
        <div>
          <p className="font-semibold text-xs mb-0.5">{highlight.title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{highlight.description}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryBar({ cat, index, maxAmount }: { cat: StructuredInsights["topCategories"][0]; index: number; maxAmount: number }) {
  const barPercent = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
  return (
    <div className="animate-slide-up" style={{ animationDelay: `${300 + index * 60}ms`, animationFillMode: "both" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate max-w-[140px]">{cat.category}</span>
          {cat.trend === "up" && <ArrowUpRight className="h-3 w-3 text-destructive" />}
          {cat.trend === "down" && <ArrowDownRight className="h-3 w-3 text-success" />}
          {cat.trend === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold tabular-nums">₹{cat.amount.toLocaleString("en-IN")}</span>
          <Badge variant="outline" className="text-[9px] h-4 tabular-nums">{cat.percentage}%</Badge>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary/70 transition-all duration-700 ease-out" style={{ width: `${barPercent}%` }} />
      </div>
    </div>
  );
}

function TipCard({ tip, index }: { tip: StructuredInsights["tips"][0]; index: number }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 animate-slide-up" style={{ animationDelay: `${400 + index * 80}ms`, animationFillMode: "both" }}>
      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-xs mb-0.5">{tip.title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.description}</p>
        {tip.savingsEstimate > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <IndianRupee className="h-3 w-3 text-success" />
            <span className="text-[11px] font-semibold text-success tabular-nums">Save ~₹{tip.savingsEstimate.toLocaleString("en-IN")}/month</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthlyVerdictCard({ verdict }: { verdict: StructuredInsights["monthlyVerdict"] }) {
  return (
    <Card className="p-5 shadow-medium border-0 animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Monthly Verdict</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-2.5 rounded-lg bg-success/10">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Best Month</p>
          <p className="font-bold text-xs text-success">{verdict.bestMonth}</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-destructive/10">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Worst Month</p>
          <p className="font-bold text-xs text-destructive">{verdict.worstMonth}</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-info/10">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Avg. Expense</p>
          <p className="font-bold text-xs text-info tabular-nums">₹{verdict.averageExpense.toLocaleString("en-IN")}</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-primary/10">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Savings Rate</p>
          <p className="font-bold text-xs text-primary tabular-nums">{verdict.savingsRate}%</p>
        </div>
      </div>
    </Card>
  );
}

function ComparisonMetric({ labelA, labelB, valueA, valueB, formatFn, unit }: {
  labelA: string; labelB: string; valueA: number; valueB: number;
  formatFn?: (v: number) => string; unit?: string;
}) {
  const fmt = formatFn || ((v: number) => `₹${v.toLocaleString("en-IN")}`);
  const diff = valueB > 0 ? ((valueA - valueB) / valueB) * 100 : 0;
  const isPositive = diff > 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="text-center flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{labelA}</p>
        <p className="font-bold text-sm tabular-nums">{fmt(valueA)}{unit}</p>
      </div>
      <div className="px-3">
        <Badge variant={Math.abs(diff) < 5 ? "secondary" : isPositive ? "destructive" : "default"} className="text-[10px] tabular-nums">
          {isPositive ? "+" : ""}{diff.toFixed(1)}%
        </Badge>
      </div>
      <div className="text-center flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{labelB}</p>
        <p className="font-bold text-sm tabular-nums">{fmt(valueB)}{unit}</p>
      </div>
    </div>
  );
}

function InsightsPanel({ insights, label, compact }: { insights: StructuredInsights; label?: string; compact?: boolean }) {
  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs font-semibold">{label}</Badge>
        </div>
      )}
      <HealthGauge score={insights.healthScore} label={insights.healthLabel} summary={insights.healthSummary} compact={compact} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {insights.highlights.map((h, i) => <HighlightCard key={i} highlight={h} index={i} />)}
      </div>
      <Card className="p-4 shadow-medium border-0">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-primary" /> Top Categories
        </h3>
        <div className="space-y-3">
          {insights.topCategories.map((cat, i) => (
            <CategoryBar key={i} cat={cat} index={i} maxAmount={insights.topCategories[0]?.amount || 1} />
          ))}
        </div>
      </Card>
      <Card className="p-4 shadow-medium border-0">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Tips
        </h3>
        <div className="space-y-2">
          {insights.tips.map((tip, i) => <TipCard key={i} tip={tip} index={i} />)}
        </div>
      </Card>
      <MonthlyVerdictCard verdict={insights.monthlyVerdict} />
    </div>
  );
}

export function AIInsights({ transactions }: AIInsightsProps) {
  const [structuredInsights, setStructuredInsights] = useState<StructuredInsights | null>(null);
  const [compareInsights, setCompareInsights] = useState<StructuredInsights | null>(null);
  const [legacyInsights, setLegacyInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [periodA, setPeriodA] = useState<PeriodType>("this-month");
  const [periodB, setPeriodB] = useState<PeriodType>("last-month");
  const { goals } = useSavingsGoals();

  const goalData = useMemo(
    () => goals.map((g) => ({
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      progressPct: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
      deadline: g.deadline,
      person: g.person,
    })),
    [goals]
  );


  const buildAggregatedData = useCallback((txns: Transaction[]) => {
    const getT = (t: Transaction) => t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
    const memberOf = (t: Transaction) => (t.applicable_to && t.applicable_to.trim()) || t.addedBy || "Unassigned";

    // Month range derived from actual data
    let startDate = new Date();
    let endDate = new Date();
    if (txns.length > 0) {
      startDate = txns.reduce((min, t) => (t.date < min ? t.date : min), txns[0].date);
      endDate = txns.reduce((max, t) => (t.date > max ? t.date : max), txns[0].date);
    }
    const months = txns.length > 0 ? eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(endDate) }) : [];

    const monthlyData = months
      .map((month) => {
        const mt = txns.filter((t) => isSameMonth(t.date, month));
        return {
          month: format(month, "MMM yyyy"),
          income: mt.filter((t) => getT(t) === "Income").reduce((s, t) => s + t.amount, 0),
          expenses: mt.filter((t) => getT(t) === "Expense").reduce((s, t) => s + t.amount, 0),
          savings: mt.filter((t) => getT(t) === "Savings").reduce((s, t) => s + t.amount, 0),
        };
      })
      .filter((m) => m.income > 0 || m.expenses > 0 || m.savings > 0);

    const categoryMap: Record<string, number> = {};
    txns.filter((t) => getT(t) === "Expense").forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const categoryData = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({ category, amount }));

    // Member-wise contribution (dynamic — no hardcoded names)
    const memberAgg: Record<string, { name: string; expense: number; savings: number; income: number; topCategory?: string; topCategoryAmount: number }> = {};
    for (const t of txns) {
      const m = memberOf(t);
      if (!memberAgg[m]) memberAgg[m] = { name: m, expense: 0, savings: 0, income: 0, topCategoryAmount: 0 };
      const ty = getT(t);
      if (ty === "Expense") memberAgg[m].expense += t.amount;
      else if (ty === "Savings") memberAgg[m].savings += t.amount;
      else if (ty === "Income") memberAgg[m].income += t.amount;
    }
    // Compute top category per member
    for (const m of Object.keys(memberAgg)) {
      const catMap: Record<string, number> = {};
      txns.filter((t) => memberOf(t) === m && getT(t) === "Expense").forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
      const top = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0];
      if (top) {
        memberAgg[m].topCategory = top[0];
        memberAgg[m].topCategoryAmount = top[1];
      }
    }
    const totalExp = Object.values(memberAgg).reduce((s, x) => s + x.expense, 0);
    const totalSav = Object.values(memberAgg).reduce((s, x) => s + x.savings, 0);
    const memberData = Object.values(memberAgg).map((x) => ({
      member: x.name,
      expense: x.expense,
      savings: x.savings,
      income: x.income,
      expensePct: totalExp > 0 ? Math.round((x.expense / totalExp) * 100) : 0,
      savingsPct: totalSav > 0 ? Math.round((x.savings / totalSav) * 100) : 0,
      topCategory: x.topCategory,
      topCategoryAmount: x.topCategoryAmount,
    }));

    // Category MoM trend deltas (latest vs previous month)
    const trendData: Array<{ category: string; latest: number; previous: number; deltaPct: number }> = [];
    if (months.length >= 2) {
      const lastM = months[months.length - 1];
      const prevM = months[months.length - 2];
      const catSet = new Set(categoryData.slice(0, 8).map((c) => c.category));
      for (const cat of catSet) {
        const latest = txns.filter((t) => getT(t) === "Expense" && t.category === cat && isSameMonth(t.date, lastM)).reduce((s, t) => s + t.amount, 0);
        const previous = txns.filter((t) => getT(t) === "Expense" && t.category === cat && isSameMonth(t.date, prevM)).reduce((s, t) => s + t.amount, 0);
        const deltaPct = previous > 0 ? Math.round(((latest - previous) / previous) * 100) : 0;
        trendData.push({ category: cat, latest, previous, deltaPct });
      }
    }

    return { monthlyData, categoryData, memberData, trendData };
  }, []);

  const filterByPeriod = useCallback((txns: Transaction[], period: PeriodType) => {
    const { start, end } = getPeriodRange(period);
    return txns.filter((t) => isWithinInterval(t.date, { start, end }));
  }, []);

  const aggregatedData = useMemo(() => buildAggregatedData(transactions), [transactions, buildAggregatedData]);

  const callInsightsAPI = async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.functions.invoke("ai-insights", { body: data });
    if (error) throw error;
    if (result?.error) throw new Error(result.error);
    return result;
  };

  const fetchInsights = async () => {
    setIsLoading(true);
    setStructuredInsights(null);
    setCompareInsights(null);
    setLegacyInsights("");
    try {
      if (compareMode) {
        const txnsA = filterByPeriod(transactions, periodA);
        const txnsB = filterByPeriod(transactions, periodB);
        const dataA = buildAggregatedData(txnsA);
        const dataB = buildAggregatedData(txnsB);

        const [resultA, resultB] = await Promise.all([
          callInsightsAPI({ ...dataA, goalData }),
          callInsightsAPI({ ...dataB, goalData }),
        ]);

        if (resultA?.structured) setStructuredInsights(resultA.insights);
        else if (resultA?.insights) setLegacyInsights(resultA.insights);

        if (resultB?.structured) setCompareInsights(resultB.insights);
      } else {
        const result = await callInsightsAPI({ ...aggregatedData, goalData });
        if (result?.structured) setStructuredInsights(result.insights);
        else if (result?.insights) setLegacyInsights(result.insights);
      }
    } catch (error: any) {
      console.error("Error fetching AI insights:", error);
      toast.error(error?.message || "Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasInsights = structuredInsights || legacyInsights;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 shadow-medium border-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Financial Insights</h2>
                <p className="text-xs text-muted-foreground">Powered by AI analysis of your transactions</p>
              </div>
            </div>
            <Button onClick={fetchInsights} disabled={isLoading} size="sm" className="bg-gradient-primary hover:opacity-90">
              {isLoading ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
              ) : hasInsights ? (
                <><RefreshCw className="mr-2 h-4 w-4" /> Refresh</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate Insights</>
              )}
            </Button>
          </div>

          {/* Compare toggle + period selectors */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Switch id="compare-mode" checked={compareMode} onCheckedChange={setCompareMode} />
              <Label htmlFor="compare-mode" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
                Compare Periods
              </Label>
            </div>
            {compareMode && (
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={periodA} onValueChange={(v) => setPeriodA(v as PeriodType)}>
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} disabled={k === periodB}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground font-medium">vs</span>
                <Select value={periodB} onValueChange={(v) => setPeriodB(v as PeriodType)}>
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} disabled={k === periodA}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Empty state — only show when NOT in compare mode (compare mode renders its own data view) */}
      {!compareMode && !hasInsights && !isLoading && (
        <Card className="p-12 shadow-medium border-0 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-amber-500/40" />
            </div>
            <p className="text-lg font-semibold mb-2">Your AI Advisor is Ready</p>
            <p className="text-sm text-muted-foreground mb-6">
              Get a visual breakdown of your financial health, spending patterns, and personalized saving tips.
            </p>
            <Button onClick={fetchInsights} className="bg-gradient-primary hover:opacity-90">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Insights
            </Button>
          </div>
        </Card>
      )}

      {/* Compare mode call-to-action for optional AI deep dive */}
      {compareMode && !structuredInsights && !isLoading && (
        <Card className="p-5 shadow-medium border-0 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">
            Want a deeper AI-powered breakdown of each period?
          </p>
          <Button onClick={fetchInsights} size="sm" className="bg-gradient-primary hover:opacity-90">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI Deep Dive
          </Button>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(compareMode ? 6 : 4)].map((_, i) => (
            <Card key={i} className="p-6 shadow-medium border-0 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-4" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {/* Compare mode: data-driven decision view (always shown when in compare mode) */}
      {compareMode && !isLoading && (
        <PeriodComparison
          txnsA={filterByPeriod(transactions, periodA)}
          txnsB={filterByPeriod(transactions, periodB)}
          labelA={PERIOD_LABELS[periodA]}
          labelB={PERIOD_LABELS[periodB]}
        />
      )}

      {/* Compare mode: optional AI side-by-side panels (only after Generate clicked) */}
      {compareMode && structuredInsights && compareInsights && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InsightsPanel insights={structuredInsights} label={`${PERIOD_LABELS[periodA]} — AI Deep Dive`} compact />
          <InsightsPanel insights={compareInsights} label={`${PERIOD_LABELS[periodB]} — AI Deep Dive`} compact />
        </div>
      )}

      {/* Single mode: full layout */}
      {!compareMode && structuredInsights && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HealthGauge score={structuredInsights.healthScore} label={structuredInsights.healthLabel} summary={structuredInsights.healthSummary} />
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {structuredInsights.highlights.map((h, i) => <HighlightCard key={i} highlight={h} index={i} />)}
            </div>
          </div>

          {/* Positive trends + warnings */}
          {(structuredInsights.positiveTrends?.length || structuredInsights.warnings?.length) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {structuredInsights.positiveTrends && structuredInsights.positiveTrends.length > 0 && (
                <Card className="p-5 shadow-medium border-0">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-success" /> Positive Trends
                  </h3>
                  <div className="space-y-2.5">
                    {structuredInsights.positiveTrends.map((p, i) => (
                      <div key={i} className="p-3 rounded-xl border bg-success/5 border-success/15">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 text-success flex-shrink-0">{ICON_MAP[p.icon] || <Shield className="h-5 w-5" />}</div>
                          <div>
                            <p className="font-semibold text-xs mb-0.5">{p.title}</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{p.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {structuredInsights.warnings && structuredInsights.warnings.length > 0 && (
                <Card className="p-5 shadow-medium border-0">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Warnings & Overspending
                  </h3>
                  <div className="space-y-2.5">
                    {structuredInsights.warnings.map((w, i) => (
                      <div key={i} className="p-3 rounded-xl border bg-destructive/5 border-destructive/15">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 text-destructive flex-shrink-0">{ICON_MAP[w.icon] || <AlertTriangle className="h-5 w-5" />}</div>
                          <div>
                            <p className="font-semibold text-xs mb-0.5">{w.title}</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{w.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 shadow-medium border-0 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Top Spending Categories
              </h3>
              <div className="space-y-4">
                {structuredInsights.topCategories.map((cat, i) => (
                  <CategoryBar key={i} cat={cat} index={i} maxAmount={structuredInsights.topCategories[0]?.amount || 1} />
                ))}
              </div>
            </Card>
            <Card className="p-6 shadow-medium border-0 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Smart Recommendations
              </h3>
              <div className="space-y-3">
                {(structuredInsights.recommendations && structuredInsights.recommendations.length > 0
                  ? structuredInsights.recommendations.map((r) => ({ title: r.title, description: r.description, savingsEstimate: r.monthlySavings || 0 }))
                  : structuredInsights.tips
                ).map((tip, i) => <TipCard key={i} tip={tip} index={i} />)}
              </div>
            </Card>
          </div>

          {/* Member-wise insights */}
          {structuredInsights.memberInsights && structuredInsights.memberInsights.length > 0 && (
            <Card className="p-5 shadow-medium border-0">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Member-wise Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {structuredInsights.memberInsights.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl border bg-primary/5 border-primary/15">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{m.member}</Badge>
                      <p className="font-semibold text-xs">{m.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{m.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Goal insights */}
          {structuredInsights.goalInsights && structuredInsights.goalInsights.length > 0 && (
            <Card className="p-5 shadow-medium border-0">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-info" /> Goal Tracking Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {structuredInsights.goalInsights.map((g, i) => (
                  <div key={i} className="p-3 rounded-xl border bg-info/5 border-info/15">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{g.goal}</Badge>
                      <p className="font-semibold text-xs">{g.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{g.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <MonthlyVerdictCard verdict={structuredInsights.monthlyVerdict} />
        </>
      )}

      {/* Legacy markdown fallback */}
      {legacyInsights && !isLoading && (
        <Card className="p-6 shadow-medium border-0">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{legacyInsights}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
