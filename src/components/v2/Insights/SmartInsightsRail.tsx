import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PiggyBank,
  Target,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { Transaction } from "@/types/transaction";
import { Budget } from "@/hooks/useBudgets";
import { useFilters } from "@/contexts/FilterContext";
import { canonicalDisplay } from "@/utils/categoryNormalize";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameMonth,
  isWithinInterval,
  format,
  getDaysInMonth,
  differenceInCalendarDays,
} from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[]; // raw, unfiltered
  filtered: Transaction[];     // already scoped by global filter
  budgets: Budget[];
}

type InsightTone = "good" | "warn" | "danger" | "info";

interface Insight {
  icon: React.ReactNode;
  tone: InsightTone;
  title: string;
  body: string;
  action?: { label: string; to: string };
}

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

const TONE_STYLES: Record<InsightTone, { bg: string; ring: string; icon: string; chip: string; chipText: string }> = {
  good: {
    bg: "bg-[hsl(var(--success-soft))]/60",
    ring: "ring-success/20",
    icon: "bg-success/15 text-success",
    chip: "bg-success/15",
    chipText: "text-success",
  },
  warn: {
    bg: "bg-[hsl(var(--accent-soft))]/70",
    ring: "ring-warning/20",
    icon: "bg-warning/15 text-warning",
    chip: "bg-warning/15",
    chipText: "text-warning",
  },
  danger: {
    bg: "bg-[hsl(var(--destructive-soft))]/60",
    ring: "ring-destructive/20",
    icon: "bg-destructive/15 text-destructive",
    chip: "bg-destructive/15",
    chipText: "text-destructive",
  },
  info: {
    bg: "bg-primary/5",
    ring: "ring-primary/15",
    icon: "bg-primary/10 text-primary",
    chip: "bg-primary/10",
    chipText: "text-primary",
  },
};

export function SmartInsightsRail({ transactions, filtered, budgets }: Props) {
  const { filters, dateFilterLabel } = useFilters();

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];

    const expense = (arr: Transaction[]) =>
      arr.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
    const income = (arr: Transaction[]) =>
      arr.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
    const savings = (arr: Transaction[]) =>
      arr.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);

    const curExp = expense(filtered);
    const curInc = income(filtered);
    const curSav = savings(filtered);

    // ---------- Insight 1: Budget risk / daily spend (only meaningful for month mode) ----------
    if (filters.mode === "month" && filters.selectedMonth) {
      const m = filters.selectedMonth;
      const monthKey = format(startOfMonth(m), "yyyy-MM-dd");
      const monthBudgets = budgets.filter((b) => b.month === monthKey);
      const totalBudget = monthBudgets.reduce((s, b) => s + Number(b.budget_amount), 0);

      const totalDays = getDaysInMonth(m);
      const today = new Date();
      const isCurrentMonth = isSameMonth(today, m);
      const dayOfMonth = isCurrentMonth ? today.getDate() : totalDays;
      const daysLeft = Math.max(0, totalDays - dayOfMonth);

      if (totalBudget > 0) {
        const pct = (curExp / totalBudget) * 100;
        const remaining = totalBudget - curExp;
        const expectedPct = (dayOfMonth / totalDays) * 100;
        const overPace = pct - expectedPct;

        let tone: InsightTone = "good";
        let label = "Safe";
        if (pct >= 100) {
          tone = "danger";
          label = "Over budget";
        } else if (pct >= 85 || overPace > 15) {
          tone = "warn";
          label = "At risk";
        } else if (pct >= 60) {
          tone = "info";
          label = "Moderate";
        }

        const dailySafe = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0;

        out.push({
          icon: <Wallet className="h-[18px] w-[18px]" />,
          tone,
          title: `Budget status — ${label}`,
          body:
            pct >= 100
              ? `Spent <strong>${fmtINR(curExp)}</strong> of <strong>${fmtINR(totalBudget)}</strong> — over by <strong>${fmtINR(curExp - totalBudget)}</strong>.`
              : daysLeft > 0 && isCurrentMonth
                ? `<strong>${fmtINR(remaining)}</strong> left for ${daysLeft} day${daysLeft === 1 ? "" : "s"} — safe to spend <strong>${fmtINR(dailySafe)}</strong>/day.`
                : `Spent <strong>${fmtINR(curExp)}</strong> of <strong>${fmtINR(totalBudget)}</strong> (${pct.toFixed(0)}%).`,
          action: { label: "View Budget", to: "/budget" },
        });
      } else {
        out.push({
          icon: <Target className="h-[18px] w-[18px]" />,
          tone: "info",
          title: "Set a monthly budget",
          body: `No budget set for <strong>${format(m, "MMMM yyyy")}</strong>. Set one to unlock daily spend guidance.`,
          action: { label: "Set Budget", to: "/budget" },
        });
      }
    }

    // ---------- Insight 2: Period-over-period spending change ----------
    if (filters.mode === "month" && filters.selectedMonth) {
      const prevMonth = subMonths(filters.selectedMonth, 1);
      const prevTxns = transactions.filter((t) => isSameMonth(t.date, prevMonth));
      const prevExp = expense(prevTxns);

      if (prevExp > 0 && curExp > 0) {
        const delta = ((curExp - prevExp) / prevExp) * 100;
        const tone: InsightTone = delta > 15 ? "warn" : delta < -10 ? "good" : "info";
        const verb = delta >= 0 ? "increased" : "decreased";
        out.push({
          icon: delta >= 0 ? <TrendingUp className="h-[18px] w-[18px]" /> : <TrendingDown className="h-[18px] w-[18px]" />,
          tone,
          title: `Spending ${verb} ${Math.abs(delta).toFixed(0)}%`,
          body: `<strong>${fmtINR(curExp)}</strong> this month vs <strong>${fmtINR(prevExp)}</strong> in ${format(prevMonth, "MMM")}.`,
          action: { label: "View Details", to: "/spending" },
        });
      }
    } else if (filters.mode === "range" && filters.range.from && filters.range.to) {
      const days = Math.max(1, differenceInCalendarDays(filters.range.to, filters.range.from) + 1);
      const prevEnd = new Date(filters.range.from);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - days + 1);
      const prevTxns = transactions.filter((t) =>
        isWithinInterval(t.date, { start: prevStart, end: prevEnd })
      );
      const prevExp = expense(prevTxns);
      if (prevExp > 0 && curExp > 0) {
        const delta = ((curExp - prevExp) / prevExp) * 100;
        const tone: InsightTone = delta > 15 ? "warn" : delta < -10 ? "good" : "info";
        const verb = delta >= 0 ? "increased" : "decreased";
        out.push({
          icon: delta >= 0 ? <TrendingUp className="h-[18px] w-[18px]" /> : <TrendingDown className="h-[18px] w-[18px]" />,
          tone,
          title: `Spending ${verb} ${Math.abs(delta).toFixed(0)}%`,
          body: `<strong>${fmtINR(curExp)}</strong> vs <strong>${fmtINR(prevExp)}</strong> in the previous ${days}-day window.`,
          action: { label: "View Details", to: "/spending" },
        });
      }
    }

    // ---------- Insight 3: Top spending category jump ----------
    {
      const curMap: Record<string, number> = {};
      filtered
        .filter((t) => getType(t) === "Expense")
        .forEach((t) => {
          const k = canonicalDisplay(t.category);
          curMap[k] = (curMap[k] || 0) + t.amount;
        });
      const top = Object.entries(curMap).sort((a, b) => b[1] - a[1])[0];

      if (top && curExp > 0) {
        const [topCat, topAmt] = top;
        const share = (topAmt / curExp) * 100;

        // Compare with prev month if month mode
        let comparison = "";
        let tone: InsightTone = share > 40 ? "warn" : "info";
        if (filters.mode === "month" && filters.selectedMonth) {
          const prevMonth = subMonths(filters.selectedMonth, 1);
          const prevAmt = transactions
            .filter((t) => isSameMonth(t.date, prevMonth) && getType(t) === "Expense" && canonicalDisplay(t.category) === topCat)
            .reduce((s, t) => s + t.amount, 0);
          if (prevAmt > 0) {
            const d = ((topAmt - prevAmt) / prevAmt) * 100;
            comparison = ` — ${d >= 0 ? "up" : "down"} <strong>${Math.abs(d).toFixed(0)}%</strong> vs ${format(prevMonth, "MMM")}`;
            if (d > 25) tone = "warn";
          }
        }

        out.push({
          icon: <AlertTriangle className="h-[18px] w-[18px]" />,
          tone,
          title: `Top category: ${topCat}`,
          body: `<strong>${fmtINR(topAmt)}</strong> — <strong>${share.toFixed(0)}%</strong> of total spending${comparison}.`,
          action: { label: "Reduce Spending", to: "/spending" },
        });
      }
    }

    // ---------- Insight 4: Savings rate (fallback) ----------
    if (out.length < 3 && curInc > 0) {
      const rate = (curSav / curInc) * 100;
      const tone: InsightTone = rate >= 30 ? "good" : rate >= 15 ? "info" : "warn";
      out.push({
        icon: <PiggyBank className="h-[18px] w-[18px]" />,
        tone,
        title: `Savings rate ${rate.toFixed(0)}%`,
        body:
          rate >= 30
            ? `Saved <strong>${fmtINR(curSav)}</strong> — well above the 20% benchmark.`
            : `Saved <strong>${fmtINR(curSav)}</strong>. Aim for 20%+ — that's <strong>${fmtINR(curInc * 0.2)}</strong>.`,
        action: { label: "Set Savings Goal", to: "/goals" },
      });
    }

    return out.slice(0, 3);
  }, [filtered, transactions, budgets, filters]);

  if (insights.length === 0) return null;

  return (
    <section className="animate-slide-up" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-muted-foreground" /> Smart Insights
          <span className="text-[10px] font-medium text-muted-foreground ml-1">· {dateFilterLabel}</span>
        </h2>
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <Link to="/insights">
            Full Analysis <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((ins, i) => {
          const s = TONE_STYLES[ins.tone];
          return (
            <Card
              key={i}
              className={cn(
                "p-4 border ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover",
                s.bg,
                s.ring
              )}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.icon)}>
                  {ins.icon}
                </div>
                <h3 className="text-sm font-bold leading-tight text-foreground pt-1.5">{ins.title}</h3>
              </div>
              <p
                className="text-xs text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: ins.body.replace(/<strong>/g, '<strong class="text-foreground font-bold tabular-nums">'),
                }}
              />
              {ins.action && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="mt-3 h-8 text-xs w-full bg-card/70 hover:bg-card"
                >
                  <Link to={ins.action.to}>
                    {ins.action.label} <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
