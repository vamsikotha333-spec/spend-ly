import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  PiggyBank,
  Wallet,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/transaction";
import { categoryKey } from "@/utils/categoryNormalize";

interface PeriodComparisonProps {
  txnsA: Transaction[];
  txnsB: Transaction[];
  labelA: string;
  labelB: string;
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

interface PeriodTotals {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  score: number;
  byCategory: Record<string, number>;
}

function computeTotals(txns: Transaction[]): PeriodTotals {
  let income = 0,
    expenses = 0,
    savings = 0;
  const byCategory: Record<string, number> = {};
  for (const t of txns) {
    const ttype = getType(t);
    if (ttype === "Income") income += t.amount;
    else if (ttype === "Expense") {
      expenses += t.amount;
      const key = categoryKey(t.category);
      byCategory[key] = (byCategory[key] || 0) + t.amount;
    } else if (ttype === "Savings") savings += t.amount;
  }
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  // Simple health score: weighted by savings rate + expense ratio
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 100;
  let score = 50;
  if (savingsRate >= 50) score = 90;
  else if (savingsRate >= 30) score = 75;
  else if (savingsRate >= 15) score = 60;
  else if (savingsRate >= 0) score = 45;
  else score = 25;
  if (expenseRatio > 90) score -= 10;
  score = Math.max(0, Math.min(100, score));
  return { income, expenses, savings, savingsRate, score, byCategory };
}

function pct(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

function fmtINR(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function ChangeBadge({ change, invert }: { change: number; invert?: boolean }) {
  // invert=true means "up is good" (e.g. income, savings)
  // invert=false means "up is bad" (e.g. expenses)
  const isZero = Math.abs(change) < 0.5;
  const isUp = change > 0;
  const isGood = invert ? isUp : !isUp;
  const color = isZero
    ? "text-muted-foreground bg-muted"
    : isGood
    ? "text-success bg-success/10"
    : "text-destructive bg-destructive/10";
  const Icon = isZero ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums",
        color,
      )}
    >
      <Icon className="h-3 w-3" />
      {isUp ? "+" : ""}
      {change.toFixed(1)}%
    </span>
  );
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  valueA: number;
  valueB: number;
  invert?: boolean; // true = up is good
  unit?: string;
  formatFn?: (v: number) => string;
  verdict?: string;
}

function MetricRow({ icon, label, valueA, valueB, invert, unit, formatFn, verdict }: MetricRowProps) {
  const fmt = formatFn || fmtINR;
  const change = pct(valueA, valueB);
  return (
    <div className="p-4 rounded-xl border bg-card hover:shadow-soft transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <p className="text-sm font-semibold">{label}</p>
        <div className="ml-auto">
          <ChangeBadge change={change} invert={invert} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="text-center p-2 rounded-lg bg-muted/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This</p>
          <p className="font-bold text-base tabular-nums">
            {fmt(valueA)}
            {unit}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Previous</p>
          <p className="font-bold text-base tabular-nums text-muted-foreground">
            {fmt(valueB)}
            {unit}
          </p>
        </div>
      </div>
      {verdict && <p className="text-[11px] text-muted-foreground mt-2 italic">{verdict}</p>}
    </div>
  );
}

interface CategoryDiff {
  category: string;
  amountA: number;
  amountB: number;
  diff: number;
  pctChange: number;
}

function buildCategoryDiffs(a: Record<string, number>, b: Record<string, number>): CategoryDiff[] {
  const allCats = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs: CategoryDiff[] = [];
  for (const cat of allCats) {
    const amountA = a[cat] || 0;
    const amountB = b[cat] || 0;
    if (amountA === 0 && amountB === 0) continue;
    diffs.push({
      category: cat,
      amountA,
      amountB,
      diff: amountA - amountB,
      pctChange: pct(amountA, amountB),
    });
  }
  return diffs;
}

export function PeriodComparison({ txnsA, txnsB, labelA, labelB }: PeriodComparisonProps) {
  const totalsA = useMemo(() => computeTotals(txnsA), [txnsA]);
  const totalsB = useMemo(() => computeTotals(txnsB), [txnsB]);

  const categoryDiffs = useMemo(
    () => buildCategoryDiffs(totalsA.byCategory, totalsB.byCategory),
    [totalsA, totalsB],
  );

  const topIncreases = useMemo(
    () =>
      [...categoryDiffs]
        .filter((c) => c.diff > 0)
        .sort((x, y) => y.diff - x.diff)
        .slice(0, 3),
    [categoryDiffs],
  );

  const topImprovements = useMemo(
    () =>
      [...categoryDiffs]
        .filter((c) => c.diff < 0)
        .sort((x, y) => x.diff - y.diff)
        .slice(0, 3),
    [categoryDiffs],
  );

  const allDiffsSorted = useMemo(
    () => [...categoryDiffs].sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff)),
    [categoryDiffs],
  );

  // Auto insights
  const insights = useMemo(() => {
    const out: Array<{ type: "good" | "bad" | "warn" | "info"; title: string; what: string; why: string; action: string }> = [];

    const expenseChange = pct(totalsA.expenses, totalsB.expenses);
    if (Math.abs(expenseChange) >= 5) {
      const isUp = expenseChange > 0;
      const driver = isUp ? topIncreases[0] : topImprovements[0];
      out.push({
        type: isUp ? "bad" : "good",
        title: isUp ? "Spending Increased" : "Spending Reduced",
        what: `Expenses ${isUp ? "rose" : "dropped"} by ${Math.abs(expenseChange).toFixed(1)}% (${fmtINR(Math.abs(totalsA.expenses - totalsB.expenses))}).`,
        why: driver
          ? `Main ${isUp ? "driver" : "saver"}: ${driver.category} (${driver.pctChange > 0 ? "+" : ""}${driver.pctChange.toFixed(0)}%)`
          : "Across multiple categories.",
        action: isUp
          ? `Set a cap on ${driver?.category || "top categories"} for next period.`
          : `Keep this discipline — channel the savings into goals.`,
      });
    }

    // Savings rate
    if (totalsA.savingsRate >= 50) {
      out.push({
        type: "good",
        title: "Strong Savings Rate",
        what: `You're saving ${totalsA.savingsRate.toFixed(0)}% of income.`,
        why: "This builds long-term wealth and resilience.",
        action: "Consider investing the surplus instead of leaving it idle.",
      });
    } else if (totalsA.savingsRate < 20 && totalsA.income > 0) {
      out.push({
        type: "warn",
        title: "Low Savings Rate",
        what: `Only ${totalsA.savingsRate.toFixed(0)}% of income is being saved.`,
        why: "Below the recommended 20–30% threshold.",
        action: "Identify 1–2 expense categories to trim by 10% this month.",
      });
    }

    // Top category dependency
    const totalExpA = totalsA.expenses;
    if (totalExpA > 0 && allDiffsSorted.length > 0) {
      const topCat = Object.entries(totalsA.byCategory).sort(([, x], [, y]) => y - x)[0];
      if (topCat) {
        const [topName, topAmt] = topCat;
        const share = (topAmt / totalExpA) * 100;
        if (share >= 35) {
          out.push({
            type: "warn",
            title: "High Category Dependency",
            what: `${topName} is ${share.toFixed(0)}% of your expenses.`,
            why: "High concentration reduces flexibility when income drops.",
            action: `Try to keep ${topName} below 35% — explore alternatives or boost income.`,
          });
        }
      }
    }

    // Income change
    const incomeChange = pct(totalsA.income, totalsB.income);
    if (incomeChange <= -10) {
      out.push({
        type: "bad",
        title: "Income Dropped",
        what: `Income fell ${Math.abs(incomeChange).toFixed(1)}% vs ${labelB}.`,
        why: "Lower income with same expenses erodes savings fast.",
        action: "Review fixed costs and pause non-essential spending.",
      });
    } else if (incomeChange >= 10) {
      out.push({
        type: "good",
        title: "Income Grew",
        what: `Income rose ${incomeChange.toFixed(1)}% vs ${labelB}.`,
        why: "More room to save and invest.",
        action: "Avoid lifestyle creep — direct the extra to savings goals.",
      });
    }

    return out;
  }, [totalsA, totalsB, topIncreases, topImprovements, allDiffsSorted, labelB]);

  // Smart summary
  const smartSummary = useMemo(() => {
    const expChange = pct(totalsA.expenses, totalsB.expenses);
    const direction = expChange > 0 ? "spent more" : expChange < 0 ? "spent less" : "spent about the same";
    const driverText =
      expChange > 0 && topIncreases.length > 0
        ? `, mainly due to higher ${topIncreases.slice(0, 2).map((c) => c.category).join(" and ")}`
        : expChange < 0 && topImprovements.length > 0
        ? `, helped by lower ${topImprovements.slice(0, 2).map((c) => c.category).join(" and ")}`
        : "";
    const savingsText =
      totalsA.savingsRate >= 30
        ? ` You maintained a strong savings rate of ${totalsA.savingsRate.toFixed(0)}%.`
        : totalsA.savingsRate > 0
        ? ` Savings rate is ${totalsA.savingsRate.toFixed(0)}% — there's room to improve.`
        : ` Savings rate is below zero — expenses exceeded income.`;

    return `In ${labelA}, you ${direction}${
      Math.abs(expChange) >= 1 ? ` (${expChange > 0 ? "+" : ""}${expChange.toFixed(1)}%)` : ""
    } compared to ${labelB}${driverText}.${savingsText}`;
  }, [totalsA, totalsB, topIncreases, topImprovements, labelA, labelB]);

  // Suggestions
  const suggestions = useMemo(() => {
    const list: string[] = [];
    topIncreases.slice(0, 2).forEach((c) => {
      list.push(`Reduce ${c.category} — up ${c.pctChange.toFixed(0)}% (${fmtINR(c.diff)}). Set a cap of ${fmtINR(c.amountB)} next period.`);
    });
    topImprovements.slice(0, 2).forEach((c) => {
      list.push(`Keep ${c.category} controlled — you saved ${fmtINR(Math.abs(c.diff))} vs ${labelB}. Hold the line.`);
    });
    if (totalsA.savingsRate < 30) {
      list.push(`Aim to push savings rate above 30% — currently ${totalsA.savingsRate.toFixed(0)}%.`);
    } else {
      list.push(`Maintain savings rate above ${Math.floor(totalsA.savingsRate / 10) * 10}%.`);
    }
    const totalExpA = totalsA.expenses;
    const topCatEntry = Object.entries(totalsA.byCategory).sort(([, x], [, y]) => y - x)[0];
    if (topCatEntry && totalExpA > 0) {
      const share = (topCatEntry[1] / totalExpA) * 100;
      if (share >= 35) {
        list.push(`Diversify spending — ${topCatEntry[0]} is ${share.toFixed(0)}% of expenses.`);
      }
    }
    return list.slice(0, 5);
  }, [topIncreases, topImprovements, totalsA, labelB]);

  const insightStyles = {
    good: { bg: "bg-success/10", border: "border-success/20", icon: <CheckCircle2 className="h-5 w-5 text-success" /> },
    bad: { bg: "bg-destructive/10", border: "border-destructive/20", icon: <AlertTriangle className="h-5 w-5 text-destructive" /> },
    warn: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> },
    info: { bg: "bg-info/10", border: "border-info/20", icon: <Sparkles className="h-5 w-5 text-info" /> },
  };

  return (
    <div className="space-y-6">
      {/* Smart Summary */}
      <Card className="p-5 shadow-medium border-0 bg-gradient-to-br from-primary/5 to-info/5 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-1.5">
              Smart Summary
            </h3>
            <p className="text-sm leading-relaxed">{smartSummary}</p>
          </div>
        </div>
      </Card>

      {/* Headline Metrics */}
      <Card className="p-5 shadow-medium border-0 animate-fade-in">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Key Metrics — {labelA} vs {labelB}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MetricRow
            icon={<TrendingUp className="h-4 w-4" />}
            label="Total Income"
            valueA={totalsA.income}
            valueB={totalsB.income}
            invert
          />
          <MetricRow
            icon={<TrendingDown className="h-4 w-4" />}
            label="Total Expenses"
            valueA={totalsA.expenses}
            valueB={totalsB.expenses}
          />
          <MetricRow
            icon={<PiggyBank className="h-4 w-4" />}
            label="Total Savings"
            valueA={totalsA.savings}
            valueB={totalsB.savings}
            invert
          />
          <MetricRow
            icon={<Wallet className="h-4 w-4" />}
            label="Savings Rate"
            valueA={totalsA.savingsRate}
            valueB={totalsB.savingsRate}
            invert
            unit="%"
            formatFn={(v) => v.toFixed(1)}
            verdict={
              totalsA.savingsRate >= 30
                ? "Healthy — keep it up."
                : totalsA.savingsRate >= 15
                ? "Acceptable, aim higher."
                : "Below target — needs attention."
            }
          />
        </div>
      </Card>

      {/* Top 3 Increases & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 shadow-medium border-0 animate-fade-in">
          <h3 className="font-bold text-sm uppercase tracking-wider text-destructive mb-3 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" /> Top Increases
          </h3>
          {topIncreases.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No category increased — great control!</p>
          ) : (
            <div className="space-y-3">
              {topIncreases.map((c) => (
                <div key={c.category} className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{c.category}</p>
                    <ChangeBadge change={c.pctChange} />
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {fmtINR(c.amountA)} <span className="text-muted-foreground/60">vs</span> {fmtINR(c.amountB)}
                    <span className="ml-2 font-semibold text-destructive">+{fmtINR(c.diff)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 shadow-medium border-0 animate-fade-in">
          <h3 className="font-bold text-sm uppercase tracking-wider text-success mb-3 flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4" /> Top Improvements
          </h3>
          {topImprovements.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No category reduced this period.</p>
          ) : (
            <div className="space-y-3">
              {topImprovements.map((c) => (
                <div key={c.category} className="p-3 rounded-lg bg-success/5 border border-success/15">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{c.category}</p>
                    <ChangeBadge change={c.pctChange} invert />
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {fmtINR(c.amountA)} <span className="text-muted-foreground/60">vs</span> {fmtINR(c.amountB)}
                    <span className="ml-2 font-semibold text-success">{fmtINR(c.diff)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Full category-wise change list */}
      {allDiffsSorted.length > 0 && (
        <Card className="p-5 shadow-medium border-0 animate-fade-in">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Category-wise Spending Changes
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
            {allDiffsSorted.map((c) => {
              const maxAmount = Math.max(c.amountA, c.amountB, 1);
              return (
                <div key={c.category} className="p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium truncate">{c.category}</p>
                    <ChangeBadge change={c.pctChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>{labelA}</span>
                        <span className="tabular-nums font-semibold text-foreground">{fmtINR(c.amountA)}</span>
                      </div>
                      <Progress value={(c.amountA / maxAmount) * 100} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>{labelB}</span>
                        <span className="tabular-nums font-semibold text-foreground">{fmtINR(c.amountB)}</span>
                      </div>
                      <Progress value={(c.amountB / maxAmount) * 100} className="h-1.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Auto Insights cards */}
      {insights.length > 0 && (
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" /> Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, i) => {
              const style = insightStyles[ins.type];
              return (
                <div
                  key={i}
                  className={cn("p-4 rounded-xl border animate-slide-up", style.bg, style.border)}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                    <div className="flex-1 space-y-1.5">
                      <p className="font-semibold text-sm">{ins.title}</p>
                      <p className="text-xs">
                        <span className="font-medium text-muted-foreground">What: </span>
                        {ins.what}
                      </p>
                      <p className="text-xs">
                        <span className="font-medium text-muted-foreground">Why it matters: </span>
                        {ins.why}
                      </p>
                      <p className="text-xs">
                        <span className="font-medium text-primary">→ </span>
                        {ins.action}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action plan */}
      {suggestions.length > 0 && (
        <Card className="p-5 shadow-medium border-0 bg-gradient-to-br from-amber-500/5 to-primary/5 animate-fade-in">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" /> What You Should Do Next Period
          </h3>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge
                  variant="outline"
                  className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                >
                  {i + 1}
                </Badge>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
