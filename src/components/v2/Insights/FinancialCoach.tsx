import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction } from "@/types/transaction";
import {
  AlertTriangle,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Heart,
  Sparkles,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users, Lightbulb as LightbulbIcon,
} from "lucide-react";
import { canonicalDisplay } from "@/utils/categoryNormalize";
import { CategoryIcon, categoryLabel } from "@/utils/categoryIcon";
import { isSameMonth, subMonths, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemberOptions } from "@/hooks/useMembers";

type Person = string; // "Combined" or any dynamic member name

const LEAK_CATEGORIES = [
  "Dining",
  "Entertainment",
  "Shopping",
  "Subscriptions",
  "Personal Care",
  "Dry Fruits",
];

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function fmtINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function isLeakCategory(cat: string) {
  const display = canonicalDisplay(cat);
  return LEAK_CATEGORIES.some((leak) => display.toLowerCase().includes(leak.toLowerCase()));
}

interface Props {
  transactions: Transaction[]; // already date-scoped by global filter
  allTransactions: Transaction[]; // unscoped, for prior-period comparison
}

export function FinancialCoach({ transactions, allTransactions }: Props) {
  const [person, setPerson] = useState<Person>("Combined");
  const memberOptions = useMemberOptions(allTransactions);

  const filterByPerson = (txns: Transaction[]) => {
    if (person === "Combined") return txns;
    return txns.filter((t) => (t.applicable_to || "") === person);
  };

  const scoped = useMemo(() => filterByPerson(transactions), [transactions, person]);

  // Prior month comparison (use first txn date in scope to find current month)
  const referenceDate = scoped[0]?.date || new Date();
  const prevMonthDate = subMonths(referenceDate, 1);
  const prevScoped = useMemo(() => {
    return filterByPerson(allTransactions).filter((t) => isSameMonth(t.date, prevMonthDate));
  }, [allTransactions, person, prevMonthDate]);

  const data = useMemo(() => {
    const income = scoped.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
    const expenses = scoped.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
    const savings = scoped.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);
    const remaining = income - expenses - savings;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Category map (current)
    const catMap: Record<string, number> = {};
    scoped
      .filter((t) => getType(t) === "Expense")
      .forEach((t) => {
        const k = canonicalDisplay(t.category);
        catMap[k] = (catMap[k] || 0) + t.amount;
      });
    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    // Category map (previous)
    const prevCatMap: Record<string, number> = {};
    prevScoped
      .filter((t) => getType(t) === "Expense")
      .forEach((t) => {
        const k = canonicalDisplay(t.category);
        prevCatMap[k] = (prevCatMap[k] || 0) + t.amount;
      });

    const prevExpenses = prevScoped.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
    const prevSavings = prevScoped.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);

    // Money leaks: leak categories with significant increase or large share
    const leaks = sortedCats
      .filter(([cat]) => isLeakCategory(cat))
      .map(([cat, amt]) => {
        const prev = prevCatMap[cat] || 0;
        const delta = prev > 0 ? ((amt - prev) / prev) * 100 : amt > 0 ? 100 : 0;
        const share = expenses > 0 ? (amt / expenses) * 100 : 0;
        return { cat, amt, prev, delta, share };
      })
      .filter((l) => l.amt > 0 && (l.delta > 15 || l.share > 12));

    const avoidableTotal = leaks.reduce((s, l) => {
      // Estimate avoidable as 30% of leak spend, OR the increase over previous
      const increase = Math.max(0, l.amt - l.prev);
      return s + Math.max(increase, l.amt * 0.3);
    }, 0);

    // Period delta
    const expDelta = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
    const savDelta = prevSavings > 0 ? ((savings - prevSavings) / prevSavings) * 100 : 0;

    // Health score (0-100)
    let score = 50;
    if (savingsRate >= 30) score += 25;
    else if (savingsRate >= 20) score += 18;
    else if (savingsRate >= 10) score += 8;
    else score -= 5;
    if (remaining >= 0) score += 10;
    else score -= 15;
    const expRatio = income > 0 ? expenses / income : 1;
    if (expRatio < 0.5) score += 15;
    else if (expRatio < 0.7) score += 8;
    else if (expRatio > 0.9) score -= 10;
    if (avoidableTotal > 0 && expenses > 0) {
      const leakRatio = avoidableTotal / expenses;
      if (leakRatio > 0.2) score -= 10;
      else if (leakRatio > 0.1) score -= 5;
    }
    score = Math.max(0, Math.min(100, Math.round(score)));

    const healthLabel =
      score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 55 ? "Fair" : score >= 40 ? "Needs Work" : "Critical";

    return {
      income,
      expenses,
      savings,
      remaining,
      savingsRate,
      sortedCats,
      leaks,
      avoidableTotal,
      expDelta,
      savDelta,
      score,
      healthLabel,
    };
  }, [scoped, prevScoped]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const yearlyAvoidable = data.avoidableTotal * 12;
  const sipProjection5y = (() => {
    // monthly contribution, 12% annual return, 5 years, monthly compounding
    const r = 0.12 / 12;
    const n = 60;
    const m = data.avoidableTotal;
    if (m <= 0) return 0;
    return m * ((Math.pow(1 + r, n) - 1) / r);
  })();

  const healthColor =
    data.score >= 85 ? "text-success" :
    data.score >= 70 ? "text-success" :
    data.score >= 55 ? "text-amber-500" :
    data.score >= 40 ? "text-orange-500" : "text-destructive";

  return (
    <div className="space-y-4">
      {/* Header with person filter */}
      <Card className="p-4 md:p-5 shadow-soft" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-widest mb-1">
              AI Financial Coach
            </p>
            <h2 className="text-base md:text-lg font-bold text-primary-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> {greeting} 👋
            </h2>
            <p className="text-xs text-primary-foreground/85 mt-1 max-w-xl leading-relaxed">
              Personalized analysis of spending behavior, money leaks, and savings opportunities — updated live with your data.
            </p>
          </div>
          <Tabs value={person} onValueChange={(v) => setPerson(v)}>
            <TabsList className="bg-white/15 border border-white/20 flex-wrap h-auto">
              <TabsTrigger value="Combined" className="text-xs data-[state=active]:bg-white data-[state=active]:text-primary">
                <Users className="h-3.5 w-3.5 mr-1" /> Combined
              </TabsTrigger>
              {memberOptions.map((name) => (
                <TabsTrigger
                  key={name}
                  value={name}
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-primary"
                >
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Health Score + Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-5 border shadow-soft md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Heart className={cn("h-4 w-4", healthColor)} />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Financial Health
            </p>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className={cn("text-4xl font-bold tabular-nums", healthColor)}>{data.score}</span>
            <span className="text-sm text-muted-foreground mb-1">/100</span>
          </div>
          <Badge variant="secondary" className="mb-3">{data.healthLabel}</Badge>
          <Progress value={data.score} className="h-2" />
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Based on savings rate, budget adherence, and unnecessary spending ratio.
          </p>
        </Card>

        <Card className="p-5 border shadow-soft md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Snapshot — {person}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Income</p>
              <p className="text-base font-bold text-success tabular-nums">{fmtINR(data.income)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Expenses</p>
              <p className="text-base font-bold text-destructive tabular-nums">{fmtINR(data.expenses)}</p>
              {data.expDelta !== 0 && (
                <p className={cn("text-[10px] tabular-nums flex items-center gap-0.5", data.expDelta > 0 ? "text-destructive" : "text-success")}>
                  {data.expDelta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(data.expDelta).toFixed(0)}% vs prev
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Savings</p>
              <p className="text-base font-bold text-info tabular-nums">{fmtINR(data.savings)}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">{data.savingsRate.toFixed(0)}% rate</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
              <p className={cn("text-base font-bold tabular-nums", data.remaining > 0 ? "text-success" : data.remaining < 0 ? "text-destructive" : "text-foreground")}>
                {data.remaining < 0 ? "-" : ""}{fmtINR(Math.abs(data.remaining))}
              </p>
            </div>
          </div>
          {data.remaining > 0 && data.income > 0 && data.remaining / data.income > 0.15 && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-foreground">
              <Lightbulb className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-amber-500" /><strong>{fmtINR(data.remaining)}</strong> is untracked — log missing expenses, or redirect into investments.
            </div>
          )}
        </Card>
      </div>

      {/* Money Leak Detection */}
      <Card className="p-5 border shadow-soft">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold">Money Leak Detection</h3>
          </div>
          {data.avoidableTotal > 0 && (
            <Badge variant="outline" className="text-[11px] bg-amber-500/10 border-amber-500/30 text-amber-700">
              Potential avoidable: {fmtINR(data.avoidableTotal)}/mo
            </Badge>
          )}
        </div>
        {data.leaks.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No major leaks detected. Discretionary spending looks controlled.
          </div>
        ) : (
          <div className="space-y-2">
            {data.leaks.map((l) => (
              <div key={l.cat} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                    <CategoryIcon category={l.cat} className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {categoryLabel(l.cat)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtINR(l.amt)} · {l.share.toFixed(0)}% of expenses
                    {l.prev > 0 && (
                      <span className={cn("ml-2", l.delta > 0 ? "text-destructive" : "text-success")}>
                        {l.delta > 0 ? "↑" : "↓"} {Math.abs(l.delta).toFixed(0)}% vs prev month
                      </span>
                    )}
                  </p>
                </div>
                {l.delta > 25 && (
                  <Badge variant="destructive" className="text-[10px]">High</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Smart Savings + Investment Redirection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-5 border shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold">Smart Savings Insights</h3>
          </div>
          {data.leaks.length > 0 ? (
            <div className="space-y-2.5">
              {data.leaks.slice(0, 3).map((l) => {
                const monthlyCut = Math.round(Math.max(l.amt - l.prev, l.amt * 0.3));
                const yearly = monthlyCut * 12;
                return (
                  <div key={l.cat} className="p-3 rounded-lg bg-success/5 border border-success/20 text-[11px] leading-relaxed">
                    Reducing <strong>{categoryLabel(l.cat)}</strong> by <strong className="text-success">{fmtINR(monthlyCut)}/mo</strong> could increase yearly savings by <strong className="text-success">{fmtINR(yearly)}</strong>.
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Your spending pattern is balanced. Focus on increasing income streams or boosting SIP contributions.
            </p>
          )}
        </Card>

        <Card className="p-5 border shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-info" />
            <h3 className="text-sm font-bold">Investment Redirection Engine</h3>
          </div>
          {data.avoidableTotal > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly avoidable</p>
                  <p className="text-base font-bold text-info tabular-nums">{fmtINR(data.avoidableTotal)}</p>
                </div>
                <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Yearly potential</p>
                  <p className="text-base font-bold text-info tabular-nums">{fmtINR(yearlyAvoidable)}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-info/10 border border-primary/20">
                <p className="text-[11px] text-muted-foreground mb-1">SIP projection · 5 yrs @ 12%</p>
                <p className="text-xl font-bold text-primary tabular-nums">{fmtINR(sipProjection5y)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Redirecting {fmtINR(data.avoidableTotal)}/month into a SIP could grow to this amount in 5 years.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No avoidable spending detected right now. Consider increasing your SIP contribution from current savings.
            </p>
          )}
        </Card>
      </div>

      {/* Top Categories */}
      <Card className="p-5 border shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Top Spending Categories</h3>
        </div>
        {data.sortedCats.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No expenses recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {data.sortedCats.slice(0, 6).map(([cat, amt]) => {
              const pct = data.expenses > 0 ? (amt / data.expenses) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate max-w-[60%]">{cat}</span>
                    <span className="text-xs tabular-nums">
                      <strong>{fmtINR(amt)}</strong>
                      <span className="text-muted-foreground ml-1.5">{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
