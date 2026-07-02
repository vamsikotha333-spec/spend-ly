import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Heart, Lightbulb } from "lucide-react";
import { isSameDay, isSameMonth, subDays, subMonths } from "date-fns";
import { Transaction } from "@/types/transaction";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";

interface Props {
  transactions: Transaction[];
  income: number;
  expenses: number;
  savings: number;
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

interface Factor {
  name: string;
  score: number;   // 0..max
  max: number;
  tip: string;
}

export function HealthScore({ transactions, income, expenses, savings }: Props) {
  const { assets, total: assetsTotal } = useAssets();
  const { total: liabilitiesTotal } = useLiabilities();
  const { recurring } = useRecurringTransactions();

  const { score, label, color, ring, factors, recommendations } = useMemo(() => {
    const factors: Factor[] = [];

    // 1) Savings Rate (25)
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const f1 = Math.min(25, (savingsRate / 30) * 25);
    factors.push({
      name: "Savings Rate",
      score: f1, max: 25,
      tip: savingsRate >= 30
        ? `Great — saving ${savingsRate.toFixed(0)}% of income.`
        : `Aim for 20–30%. You're at ${savingsRate.toFixed(0)}%.`,
    });

    // 2) Spending Discipline (20) — expenses <= 70% income
    const expRatio = income > 0 ? expenses / income : 1;
    const f2 = income === 0 ? 0 : Math.max(0, Math.min(20, (1 - Math.max(0, expRatio - 0.7) / 0.3) * 20));
    factors.push({
      name: "Spending Discipline",
      score: f2, max: 20,
      tip: expRatio <= 0.7
        ? `Expenses at ${(expRatio * 100).toFixed(0)}% of income — healthy.`
        : `Trim expenses; currently ${(expRatio * 100).toFixed(0)}% of income.`,
    });

    // 3) Emergency Fund (15) — cash + bank vs 6× monthly expenses
    const liquid = assets.filter((a) => a.type === "cash" || a.type === "bank").reduce((s, a) => s + Number(a.value || 0), 0);
    const monthlyExp = expenses > 0 ? expenses : 1;
    const emergencyMonths = liquid / monthlyExp;
    const f3 = Math.min(15, (emergencyMonths / 6) * 15);
    factors.push({
      name: "Emergency Fund",
      score: f3, max: 15,
      tip: emergencyMonths >= 6
        ? `Solid — ${emergencyMonths.toFixed(1)} months covered.`
        : `Build to 6 months of expenses (${emergencyMonths.toFixed(1)} now).`,
    });

    // 4) Debt Ratio (15) — liabilities vs assets
    const debtRatio = assetsTotal > 0 ? liabilitiesTotal / assetsTotal : (liabilitiesTotal > 0 ? 1 : 0);
    // 0 debt = full 15, ratio >= 0.5 = 0
    const f4 = Math.max(0, Math.min(15, (1 - Math.min(1, debtRatio / 0.5)) * 15));
    factors.push({
      name: "Debt Level",
      score: f4, max: 15,
      tip: debtRatio === 0 && liabilitiesTotal === 0
        ? `Debt-free.`
        : debtRatio <= 0.3
          ? `Debt ratio ${(debtRatio * 100).toFixed(0)}% — comfortable.`
          : `High debt ratio (${(debtRatio * 100).toFixed(0)}%). Prioritise repayment.`,
    });

    // 5) Investments (15) — investment assets share
    const investAssets = assets.filter((a) => a.type === "investment" || a.type === "gold").reduce((s, a) => s + Number(a.value || 0), 0);
    const investShare = assetsTotal > 0 ? investAssets / assetsTotal : 0;
    const f5 = Math.min(15, (investShare / 0.4) * 15);
    factors.push({
      name: "Investments",
      score: f5, max: 15,
      tip: investShare >= 0.4
        ? `${(investShare * 100).toFixed(0)}% of assets invested — strong.`
        : `Grow investments — only ${(investShare * 100).toFixed(0)}% of assets.`,
    });

    // 6) Income Stability (10) — recurring income + last 3 months had income
    const today = new Date();
    let monthsWithIncome = 0;
    for (let i = 0; i < 3; i++) {
      const m = subMonths(today, i);
      if (transactions.some((t) => getType(t) === "Income" && isSameMonth(t.date, m))) monthsWithIncome++;
    }
    const hasRecurringIncome = recurring.some((r) => r.is_active && (r.transaction_type === "Income" || r.type === "credit"));
    const stabilityBase = (monthsWithIncome / 3) * 7;
    const stabilityBonus = hasRecurringIncome ? 3 : 0;
    const f6 = Math.min(10, stabilityBase + stabilityBonus);
    factors.push({
      name: "Income Stability",
      score: f6, max: 10,
      tip: monthsWithIncome === 3
        ? `Consistent income across last 3 months.`
        : `Income logged in ${monthsWithIncome}/3 recent months.`,
    });

    const total = Math.round(factors.reduce((s, f) => s + f.score, 0));
    const label =
      total >= 80 ? "Excellent" :
      total >= 65 ? "Healthy" :
      total >= 45 ? "Fair" :
      total >= 25 ? "Needs Work" : "Critical";
    const color =
      total >= 80 ? "text-success" :
      total >= 65 ? "text-info" :
      total >= 45 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
    const ring =
      total >= 80 ? "hsl(var(--success))" :
      total >= 65 ? "hsl(var(--info))" :
      total >= 45 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";

    // Top 2 weakest factors → recommendations
    const recommendations = [...factors]
      .sort((a, b) => (a.score / a.max) - (b.score / b.max))
      .slice(0, 2)
      .map((f) => f.tip);

    return { score: total, label, color, ring, factors, recommendations };
  }, [transactions, income, expenses, savings, assets, assetsTotal, liabilitiesTotal, recurring]);

  const circumference = 2 * Math.PI * 36;
  const dash = (score / 100) * circumference;

  return (
    <Card className="p-4 border shadow-medium hover-lift">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Heart className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Financial Health 2.0</p>
          <p className="text-sm font-bold text-foreground">Score <span className={color}>{label}</span></p>
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="36" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
            <circle
              cx="40" cy="40" r="36" stroke={ring} strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 800ms ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold tabular-nums ${color}`}>{score}</span>
            <span className="text-[9px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {factors.map((f) => (
            <div key={f.name}>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                <span className="truncate">{f.name}</span>
                <span className="tabular-nums font-semibold text-foreground">{Math.round(f.score)}/{f.max}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(f.score / f.max) * 100}%`, background: ring }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1 min-w-0">
              {recommendations.map((r, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-snug">{r}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
