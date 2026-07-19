import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, ShieldCheck, LineChart, Flag, PiggyBank, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSameMonth, subMonths } from "date-fns";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { useInvestments } from "@/hooks/useInvestments";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { Transaction } from "@/types/transaction";
import { canonicalDisplay } from "@/utils/categoryNormalize";

type Tone = "good" | "warn" | "info" | "danger";

interface Insight {
  icon: React.ElementType;
  tone: Tone;
  title: string;
  body: string;
}

const TONE: Record<Tone, { bg: string; text: string; icon: string }> = {
  good: { bg: "bg-success/10 border-success/20", text: "text-foreground", icon: "text-success bg-success/15" },
  warn: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-foreground", icon: "text-amber-600 dark:text-amber-400 bg-amber-500/15" },
  info: { bg: "bg-info/10 border-info/20", text: "text-foreground", icon: "text-info bg-info/15" },
  danger: { bg: "bg-destructive/10 border-destructive/20", text: "text-foreground", icon: "text-destructive bg-destructive/15" },
};

function fmt(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

export function SmartWealthInsights() {
  const { total: assetsTotal } = useAssets();
  const { total: liabilitiesTotal } = useLiabilities();
  const { investments, totalInvested, totalCurrent, gainLoss, returnPct } = useInvestments();
  const { policies, totalCoverage } = useInsurancePolicies();
  const { goals } = useFinancialGoals();
  const { transactions } = useTransactions();

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const today = new Date();
    const netWorth = assetsTotal - liabilitiesTotal;

    // Net worth
    if (assetsTotal > 0 || liabilitiesTotal > 0) {
      out.push({
        icon: netWorth >= 0 ? TrendingUp : TrendingDown,
        tone: netWorth >= 0 ? "good" : "danger",
        title: `Net Worth ${fmt(netWorth)}`,
        body: netWorth >= 0
          ? `Assets exceed liabilities by ${fmt(netWorth)} — a healthy position.`
          : `Liabilities exceed assets by ${fmt(-netWorth)}. Focus on debt reduction.`,
      });
    }

    // Investment MoM comparison
    const thisM = investments.filter((i) => isSameMonth(new Date(i.created_at), today))
      .reduce((s, i) => s + Number(i.invested_amount), 0);
    const lastM = investments.filter((i) => isSameMonth(new Date(i.created_at), subMonths(today, 1)))
      .reduce((s, i) => s + Number(i.invested_amount), 0);
    if (thisM > 0 || lastM > 0) {
      const delta = lastM > 0 ? ((thisM - lastM) / lastM) * 100 : (thisM > 0 ? 100 : 0);
      out.push({
        icon: thisM >= lastM ? TrendingUp : TrendingDown,
        tone: thisM >= lastM ? "good" : "warn",
        title: thisM >= lastM ? "Investments up this month" : "Investments down this month",
        body: `Added ${fmt(thisM)} this month vs ${fmt(lastM)} last month (${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%).`,
      });
    }

    // Portfolio gain/loss
    if (totalInvested > 0) {
      out.push({
        icon: gainLoss >= 0 ? TrendingUp : TrendingDown,
        tone: gainLoss >= 0 ? "good" : "warn",
        title: `Portfolio ${gainLoss >= 0 ? "gain" : "loss"} ${returnPct.toFixed(1)}%`,
        body: `Invested ${fmt(totalInvested)}, current value ${fmt(totalCurrent)} (${gainLoss >= 0 ? "+" : ""}${fmt(gainLoss)}).`,
      });
    }

    // Concentration
    if (investments.length > 0 && totalCurrent > 0) {
      const byCat: Record<string, number> = {};
      for (const i of investments) byCat[i.category] = (byCat[i.category] || 0) + Number(i.current_value);
      const [topCat, topAmt] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
      const share = (topAmt / totalCurrent) * 100;
      if (share > 60) {
        out.push({
          icon: AlertTriangle,
          tone: "warn",
          title: "Portfolio concentrated",
          body: `${share.toFixed(0)}% of your portfolio is in ${topCat.replace(/_/g, " ")}. Diversify to reduce risk.`,
        });
      }
    }

    // Emergency fund via transactions
    const cutoff = subMonths(today, 3);
    const monthlyExpense = transactions.filter((t) => getType(t) === "Expense" && t.date >= cutoff)
      .reduce((s, t) => s + t.amount, 0) / 3;
    if (monthlyExpense > 0) {
      const liquid = assetsTotal; // approximate; assets total
      const months = liquid / monthlyExpense;
      if (months < 3) {
        out.push({
          icon: PiggyBank, tone: "warn",
          title: `Emergency fund covers only ${months.toFixed(1)} months`,
          body: `Build reserves to cover at least 6 months of expenses (${fmt(monthlyExpense * 6)}).`,
        });
      }
    }

    // Insurance coverage
    const annualIncome = transactions.filter((t) => getType(t) === "Income" && t.date >= cutoff)
      .reduce((s, t) => s + t.amount, 0) * 4; // 3-month × 4 ≈ annual
    if (policies.length === 0) {
      out.push({
        icon: ShieldCheck, tone: "warn",
        title: "No insurance coverage",
        body: "Add health and term life policies to protect against unexpected shocks.",
      });
    } else if (annualIncome > 0 && totalCoverage < annualIncome * 5) {
      out.push({
        icon: ShieldCheck, tone: "warn",
        title: "Insurance below recommended",
        body: `Coverage ${fmt(totalCoverage)} — aim for 10× income (${fmt(annualIncome * 10)}).`,
      });
    }

    // Goal timelines
    for (const g of goals) {
      const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
      const monthlySavings = transactions
        .filter((t) => getType(t) === "Savings" && t.date >= cutoff)
        .reduce((s, t) => s + t.amount, 0) / 3;
      if (remaining > 0 && monthlySavings > 0) {
        const months = Math.ceil(remaining / monthlySavings);
        out.push({
          icon: Flag, tone: "info",
          title: `Goal "${g.name}" ≈ ${months} months away`,
          body: `Need ${fmt(remaining)} at current savings pace of ${fmt(monthlySavings)}/mo.`,
        });
        break; // one goal projection is enough
      }
    }

    // Top expense category share (personalization from FinTracker data)
    const expByCat: Record<string, number> = {};
    let totalExp = 0;
    for (const t of transactions.filter((t) => getType(t) === "Expense" && t.date >= cutoff)) {
      const k = canonicalDisplay(t.category);
      expByCat[k] = (expByCat[k] || 0) + t.amount;
      totalExp += t.amount;
    }
    if (totalExp > 0) {
      const top = Object.entries(expByCat).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const share = (top[1] / totalExp) * 100;
        out.push({
          icon: share > 40 ? AlertTriangle : LineChart,
          tone: share > 40 ? "warn" : "info",
          title: `You spent ${share.toFixed(0)}% on ${top[0]}`,
          body: `${fmt(top[1])} in the last 3 months — biggest expense category.`,
        });
      }
    }

    return out.slice(0, 6);
  }, [assetsTotal, liabilitiesTotal, investments, totalInvested, totalCurrent, gainLoss, returnPct, policies, totalCoverage, goals, transactions]);

  return (
    <Card className="p-4 md:p-5 border shadow-medium">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">Smart Wealth Insights</h2>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add assets, investments, or goals to unlock personalised insights.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {insights.map((ins, i) => {
            const s = TONE[ins.tone];
            const Icon = ins.icon;
            return (
              <div key={i} className={cn("p-3 rounded-xl border flex items-start gap-2.5", s.bg)}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", s.icon)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold", s.text)}>{ins.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{ins.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
