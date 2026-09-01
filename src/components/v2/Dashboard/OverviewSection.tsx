import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTransactions } from "@/hooks/useTransactions";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { useBudgets } from "@/hooks/useBudgets";
import { useFilters } from "@/contexts/FilterContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, PiggyBank, ArrowRight, BarChart3,
  Sparkles, Calendar, ArrowUp, ArrowDown, Wallet, AlertCircle,
} from "lucide-react";
import {
  format, isSameMonth, isSameDay, startOfWeek, endOfWeek, isWithinInterval,
  subDays, subWeeks, subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { canonicalDisplay } from "@/utils/categoryNormalize";
import { SmartInsightsRail } from "@/components/v2/Insights/SmartInsightsRail";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { Sparkline } from "@/components/common/Sparkline";
import { RecentActivityTimeline } from "@/components/v2/Home/RecentActivityTimeline";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Rent": "🏠", "Groceries": "🛒", "Vegetables": "🥬", "Dining": "🍽️", "Transport": "🚗",
  "Health": "🏥", "Shopping": "🛍️", "Utilities": "💡", "Education": "📚", "Entertainment": "🎬",
  "Fuel": "⛽", "Insurance": "🛡️", "EMI": "🏦", "Subscriptions": "📱", "Clothing": "👕",
  "Personal Care": "💇", "Gifts": "🎁", "Travel": "✈️", "Home Maintenance": "🔧",
  "Phone": "📞", "Internet": "🌐", "Salary": "💼", "Freelance": "💻", "Investment": "📈",
  "Other": "📦",
};

function getCategoryEmoji(cat: string) {
  // If category already starts with an emoji (canonical), return empty since we'll show name as-is
  if (cat && /\p{Extended_Pictographic}/u.test(cat.charAt(0))) return "";
  return CATEGORY_EMOJIS[cat] || "📦";
}

function getType(t: any) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function formatCompactINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function OverviewSection() {
  const { transactions, isLoading } = useTransactions();
  const { goals } = useSavingsGoals();
  const { budgets } = useBudgets();
  const { filters, getFilteredTransactions, dateFilterLabel } = useFilters();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Display name from Supabase auth — falls back to email handle, then "there".
  const [displayName, setDisplayName] = useState<string>("");
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const u = data.user;
      const meta = (u?.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (meta.full_name as string) ||
        (meta.name as string) ||
        (meta.first_name as string) ||
        (u?.email ? u.email.split("@")[0] : "");
      setDisplayName(name || "");
    });
    return () => { active = false; };
  }, []);

  // Use global date filter (month/range/all)
  const scopedTransactions = useMemo(
    () => getFilteredTransactions(transactions),
    [transactions, getFilteredTransactions]
  );
  const selectedDate = filters.mode === "month" ? filters.selectedMonth : null;

  const stats = useMemo(() => {
    const scoped = scopedTransactions;
    const income = scoped.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
    const expenses = scoped.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
    const savings = scoped.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((savings / income) * 100) : 0;

    // Today vs Yesterday
    const yesterday = subDays(now, 1);
    const today = transactions.filter((t) => isSameDay(t.date, now) && getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
    const yest = transactions.filter((t) => isSameDay(t.date, yesterday) && getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
    const todayDelta = yest > 0 ? ((today - yest) / yest) * 100 : (today > 0 ? 100 : 0);

    // This Week vs Last Week
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const thisWeek = transactions
      .filter((t) => getType(t) === "Expense" && isWithinInterval(t.date, { start: weekStart, end: weekEnd }))
      .reduce((s, t) => s + t.amount, 0);
    const lastWeek = transactions
      .filter((t) => getType(t) === "Expense" && isWithinInterval(t.date, { start: lastWeekStart, end: lastWeekEnd }))
      .reduce((s, t) => s + t.amount, 0);
    const weekDelta = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : (thisWeek > 0 ? 100 : 0);

    // Top category (normalized)
    const catMap: Record<string, number> = {};
    scoped.filter((t) => getType(t) === "Expense").forEach((t) => {
      const key = canonicalDisplay(t.category);
      catMap[key] = (catMap[key] || 0) + t.amount;
    });
    const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const topCatPct = expenses > 0 && topCategory ? (topCategory[1] / expenses) * 100 : 0;

    // Last income & expense for context
    const lastIncome = transactions.find((t) => getType(t) === "Income")?.amount || 0;
    const lastExpense = transactions.find((t) => getType(t) === "Expense")?.amount || 0;
    const lastSavings = transactions.find((t) => getType(t) === "Savings")?.amount || 0;

    // Insights with action
    const insights: { emoji: string; title: string; body: string; type: "good" | "warn" | "info"; action?: { label: string; to: string } }[] = [];
    if (income > 0 && expenses < income * 0.6) {
      insights.push({
        emoji: "🏆",
        title: "Strong spending discipline",
        body: `Spending is **${((expenses / income) * 100).toFixed(0)}%** of income — well below 60%.`,
        type: "good",
      });
    }
    if (topCategory) {
      insights.push({
        emoji: "📊",
        title: `Top category: ${topCategory[0]}`,
        body: `**${formatCompactINR(topCategory[1])}** spent — that's **${topCatPct.toFixed(0)}%** of monthly expenses.`,
        type: topCatPct > 40 ? "warn" : "info",
        action: { label: "Set Budget", to: "/budget" },
      });
    }
    if (savingsRate >= 30) {
      insights.push({
        emoji: "💪",
        title: `Savings rate ${savingsRate.toFixed(0)}%`,
        body: `Saving **${formatCompactINR(savings)}** this month — keep it up!`,
        type: "good",
      });
    } else if (savingsRate > 0 && savingsRate < 15 && income > 0) {
      insights.push({
        emoji: "📉",
        title: `Low savings rate (${savingsRate.toFixed(0)}%)`,
        body: `Aim for at least 20%. Try to save **${formatCompactINR(income * 0.2 - savings)}** more.`,
        type: "warn",
        action: { label: "Reduce Spending", to: "/spending-by-category" },
      });
    }
    if (insights.length === 0) {
      insights.push({ emoji: "📈", title: "Keep tracking", body: "Add a few transactions to unlock smart insights.", type: "info" });
    }

    // 7-day daily series for sparklines
    const series7 = Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(now, 6 - i);
      const dayTx = transactions.filter((t) => isSameDay(t.date, day));
      const inc = dayTx.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
      const exp = dayTx.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
      const sav = dayTx.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);
      return { income: inc, expenses: exp, savings: sav, remaining: inc - exp - sav };
    });
    const sparkIncome = series7.map((d) => d.income);
    const sparkExpenses = series7.map((d) => d.expenses);
    const sparkSavings = series7.map((d) => d.savings);
    const sparkRemaining = series7.map((d) => d.remaining);

    // Month-over-month %
    const lastMonthDate = subMonths(now, 1);
    const lmTx = transactions.filter((t) => isSameMonth(t.date, lastMonthDate));
    const lmIncome = lmTx.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
    const lmExpenses = lmTx.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
    const lmSavings = lmTx.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);
    const lmRemaining = lmIncome - lmExpenses - lmSavings;
    const remaining = income - expenses - savings;
    // Returns null when there is no previous-month data to compare against.
    // The UI renders a "New" badge in that case instead of a misleading %.
    const pct = (cur: number, prev: number) => {
      if (prev === 0) return null;
      return ((cur - prev) / Math.abs(prev)) * 100;
    };
    const deltas = {
      income: pct(income, lmIncome),
      expenses: pct(expenses, lmExpenses),
      savings: pct(savings, lmSavings),
      remaining: pct(remaining, lmRemaining),
    };

    return {
      income, expenses, savings, savingsRate,
      today, todayDelta, thisWeek, weekDelta,
      topCategory, topCatPct,
      lastIncome, lastExpense, lastSavings,
      insights: insights.slice(0, 3),
      sparkIncome, sparkExpenses, sparkSavings, sparkRemaining,
      deltas,
    };
  }, [transactions, scopedTransactions]);

  const recentTxns = transactions.slice(0, 5);
  const topGoals = goals.slice(0, 3);

  if (isLoading) return null;

  const quickActions = [
    { label: "Add Expense", emoji: "💸", color: "bg-[hsl(var(--destructive-soft))] text-destructive ring-1 ring-destructive/10", path: "/add?type=Expense", context: stats.lastExpense > 0 ? `Last: ${formatCompactINR(stats.lastExpense)}` : "Tap to add" },
    { label: "Add Income", emoji: "💰", color: "bg-[hsl(var(--success-soft))] text-success ring-1 ring-success/10", path: "/add?type=Income", context: stats.lastIncome > 0 ? `Last: ${formatCompactINR(stats.lastIncome)}` : "Tap to add" },
    { label: "Add Savings", emoji: "🏦", color: "bg-[hsl(var(--info-soft))] text-info ring-1 ring-info/10", path: "/add?type=Savings", context: stats.lastSavings > 0 ? `Last: ${formatCompactINR(stats.lastSavings)}` : "Tap to add" },
    { label: "Transactions", emoji: "📄", color: "bg-secondary text-foreground ring-1 ring-border", path: "/transactions", context: `${transactions.length} total` },
    { label: "Reports", emoji: "📊", color: "bg-[hsl(var(--accent-soft))] text-accent ring-1 ring-accent/10", path: "/summary", context: "Monthly breakdown" },
    { label: "AI Insights", emoji: "🤖", color: "bg-primary/10 text-primary ring-1 ring-primary/10", path: "/insights", context: "Smart analysis" },
  ];

  const goalEmojis: Record<string, string> = { "Home": "🏡", "Baby": "👶", "Business": "💼", "Emergency": "🛟", "Car": "🚗", "Wedding": "💍", "Travel": "✈️" };
  const getGoalEmoji = (name: string) =>
    Object.entries(goalEmojis).find(([k]) => name.toLowerCase().includes(k.toLowerCase()))?.[1] || "🎯";

  // Net Cashflow ratios — expressed as % of income (mathematically meaningful).
  // Income is shown as the base amount (not a percentage).
  const expenseRatio = stats.income > 0 ? (stats.expenses / stats.income) * 100 : 0;
  const savingsRatio = stats.income > 0 ? (stats.savings / stats.income) * 100 : 0;
  const remainingRatio = Math.max(0, 100 - expenseRatio - savingsRatio);
  const netCashflow = stats.income - stats.expenses;

  return (
    <>
      <div className="space-y-6 md:space-y-8">
        {/* Greeting Banner */}
        <div className="flex items-center justify-between flex-wrap gap-2 -mb-2">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-foreground truncate">
              {greeting}{displayName ? `, ${displayName}` : ""} 👋
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {format(now, "EEE, MMM d, yyyy")} • Viewing <span className="font-semibold text-foreground">{dateFilterLabel}</span>
            </p>
          </div>
        </div>
        {/* 1. Premium Summary Cards */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {(() => {
              const remaining = stats.income - stats.expenses - stats.savings;
              const cards = [
                {
                  key: "income", label: "Income", emoji: "💰", value: stats.income, Icon: TrendingUp,
                  tone: { ring: "ring-success/30", icon: "bg-success/20 text-success", text: "text-success", label: "text-success/80", glow: "bg-success/10", sheen: "card-sheen-success", spark: "text-success" },
                  delta: stats.deltas.income, inverse: false, spark: stats.sparkIncome,
                },
                {
                  key: "expenses", label: "Expenses", emoji: "💸", value: stats.expenses, Icon: TrendingDown,
                  tone: { ring: "ring-destructive/30", icon: "bg-destructive/20 text-destructive", text: "text-destructive", label: "text-destructive/80", glow: "bg-destructive/10", sheen: "card-sheen-danger", spark: "text-destructive" },
                  delta: stats.deltas.expenses, inverse: true, spark: stats.sparkExpenses,
                },
                {
                  key: "savings", label: "Savings", emoji: "🏦", value: stats.savings, Icon: PiggyBank,
                  tone: { ring: "ring-info/30", icon: "bg-info/20 text-info", text: "text-info", label: "text-info/80", glow: "bg-info/10", sheen: "card-sheen-info", spark: "text-info" },
                  delta: stats.deltas.savings, inverse: false, spark: stats.sparkSavings,
                },
                {
                  key: "remaining", label: "Remaining", emoji: remaining > 0 ? "🟢" : remaining < 0 ? "🔴" : "⚪", value: remaining, Icon: Wallet,
                  tone: remaining >= 0
                    ? { ring: "ring-success/30", icon: "bg-success/20 text-success", text: "text-success", label: "text-success/80", glow: "bg-success/10", sheen: "", spark: "text-success" }
                    : { ring: "ring-destructive/30", icon: "bg-destructive/20 text-destructive", text: "text-destructive", label: "text-destructive/80", glow: "bg-destructive/10", sheen: "", spark: "text-destructive" },
                  delta: stats.deltas.remaining, inverse: false, spark: stats.sparkRemaining,
                },
              ];
              return cards.map((c) => {
                const d = c.delta;
                const positive = d !== null && d >= 0;
                const goodDirection = d !== null && (c.inverse ? !positive : positive);
                return (
                  <Card key={c.key} className={cn("relative overflow-hidden p-5 border shadow-soft hover-lift transition-all duration-200", c.tone.sheen)}>
                    <div className={cn("absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl", c.tone.glow)} />
                    <div className="relative flex items-center justify-between mb-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center ring-1 shadow-sm", c.tone.icon, c.tone.ring)}>
                        <c.Icon className="h-[18px] w-[18px]" />
                      </div>
                      <span className="text-lg">{c.emoji}</span>
                    </div>
                    <p className={cn("relative text-[11px] font-semibold uppercase tracking-wider mb-1", c.tone.label)}>{c.label}</p>
                    <p className={cn("relative text-2xl md:text-3xl font-bold tabular-nums tracking-tight", c.tone.text)}>
                      {c.value < 0 ? "-" : ""}
                      <AnimatedCounter value={Math.abs(c.value)} prefix="₹" />
                    </p>
                    <div className="relative mt-2 flex items-center justify-between gap-2">
                      {d !== null ? (
                        <span className={cn(
                          "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          goodDirection ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        )}>
                          {positive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                          {Math.abs(d).toFixed(0)}% <span className="font-normal opacity-70 ml-0.5">vs last mo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          New
                        </span>
                      )}
                      <div
                        className={cn("w-16 shrink-0 opacity-0 animate-fade-in", c.tone.spark)}
                        style={{ animationDelay: "1600ms", animationFillMode: "forwards" }}
                      >
                        <Sparkline data={c.spark} height={22} />
                      </div>
                    </div>
                  </Card>
                );
              });
            })()}
          </div>

          {/* Remaining balance alert */}
          {(() => {
            const remaining = stats.income - stats.expenses - stats.savings;
            if (stats.income === 0) return null;
            const pctOfIncome = (remaining / stats.income) * 100;
            if (remaining > 0 && pctOfIncome > 15) {
              return (
                <Card className="mt-3 p-3 border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {formatCompactINR(remaining)} is still untracked this {filters.mode === "month" ? "month" : "period"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      You may have forgotten to log some expenses, or have money available to invest or save.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild className="h-7 text-[11px] shrink-0">
                    <Link to="/insights">View Insights</Link>
                  </Button>
                </Card>
              );
            }
            if (remaining < 0) {
              return (
                <Card className="mt-3 p-3 border border-destructive/20 bg-destructive/5 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-destructive">
                      Overspent by {formatCompactINR(Math.abs(remaining))}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Expenses + savings exceed income for this period. Review categories to spot the leak.
                    </p>
                  </div>
                </Card>
              );
            }
            return null;
          })()}
        </section>

        {/* Net Cashflow / Savings Rate — the "how am I doing right now" band */}
        <section className="animate-fade-in" style={{ animationDelay: "40ms", animationFillMode: "both" }}>

          <Card className="relative overflow-hidden shadow-soft p-4 md:p-5" style={{ background: "var(--gradient-primary)" }}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-widest mb-0.5">
                    {dateFilterLabel} Overview
                  </p>
                  <h2 className="text-sm md:text-base font-bold text-primary-foreground flex items-center gap-2">
                    Net Cashflow
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 text-primary-foreground uppercase tracking-wider">
                      {netCashflow >= 0 ? "Positive" : "Negative"}
                    </span>
                  </h2>
                  <p className="text-xl md:text-2xl font-bold text-primary-foreground tabular-nums tracking-tight mt-0.5">
                    {netCashflow >= 0 ? "+" : "-"}{formatCompactINR(Math.abs(netCashflow))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-widest mb-0.5">Savings Rate</p>
                  <p className="text-xl md:text-2xl font-bold text-primary-foreground tabular-nums">{stats.savingsRate.toFixed(0)}%</p>
                </div>
              </div>

              {stats.income > 0 ? (
                <>
                  {/* Bar represents 100% of income, split into expense / savings / remaining */}
                  <div className="h-2 w-full rounded-full overflow-hidden flex bg-white/15 ring-1 ring-white/20 shadow-inner">
                    <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${Math.min(100, expenseRatio)}%` }} />
                    <div className="h-full bg-info transition-all duration-500" style={{ width: `${Math.min(100, savingsRatio)}%` }} />
                    <div className="h-full bg-success/60 transition-all duration-500" style={{ width: `${remainingRatio}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-success ring-2 ring-white/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-primary-foreground/70 font-medium uppercase tracking-wider">Income</p>
                        <p className="text-sm font-bold text-primary-foreground tabular-nums">{formatCompactINR(stats.income)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-white/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-primary-foreground/70 font-medium uppercase tracking-wider">Expense Ratio</p>
                        <p className="text-sm font-bold text-primary-foreground tabular-nums">{expenseRatio.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-info ring-2 ring-white/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-primary-foreground/70 font-medium uppercase tracking-wider">Savings Rate</p>
                        <p className="text-sm font-bold text-primary-foreground tabular-nums">{savingsRatio.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-primary-foreground/80">Add transactions to see your monthly overview.</p>
              )}
            </div>
          </Card>
        </section>

        {/* 2. Smart Insights — budget + period-aware, driven by global filter */}
        <SmartInsightsRail
          transactions={transactions}
          filtered={scopedTransactions}
          budgets={budgets}
        />
      </div>
    </>
  );
}
