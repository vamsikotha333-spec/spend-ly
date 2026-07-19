import { useMemo } from "react";
import { useAssets } from "./useAssets";
import { useLiabilities } from "./useLiabilities";
import { useInvestments } from "./useInvestments";
import { useFinancialGoals } from "./useFinancialGoals";
import { useInsurancePolicies } from "./useInsurancePolicies";
import { useTransactions } from "./useTransactions";
import { subMonths, isAfter } from "date-fns";
import { Transaction } from "@/types/transaction";

export interface HealthFactor {
  key: string;
  name: string;
  score: number; // 0..max
  max: number;
  explanation: string;
  suggestion?: string;
}

export interface WealthHealth {
  score: number;
  label: "Excellent" | "Good" | "Average" | "Needs Attention";
  color: string; // tailwind text class
  ring: string; // hsl color for ring
  factors: HealthFactor[];
  suggestions: string[];
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

export function useWealthHealth(): WealthHealth {
  const { assets, total: assetsTotal } = useAssets();
  const { total: liabilitiesTotal } = useLiabilities();
  const { investments, totalCurrent: investCurrent } = useInvestments();
  const { goals, overallPct: goalsPct } = useFinancialGoals();
  const { policies, totalCoverage } = useInsurancePolicies();
  const { transactions } = useTransactions();

  return useMemo<WealthHealth>(() => {
    const factors: HealthFactor[] = [];

    // Recent 3 months window
    const cutoff = subMonths(new Date(), 3);
    const recent = transactions.filter((t) => isAfter(t.date, cutoff));
    const monthlyIncome =
      recent.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0) / 3;
    const monthlyExpense =
      recent.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0) / 3;
    const monthlySavings =
      recent.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0) / 3;

    // 1) Savings rate (20)
    const savingsRate =
      monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    const f1 = Math.max(0, Math.min(20, (savingsRate / 25) * 20));
    factors.push({
      key: "savings",
      name: "Savings Rate",
      score: f1,
      max: 20,
      explanation:
        monthlyIncome > 0
          ? `Saving ${savingsRate.toFixed(0)}% of income (target 25%).`
          : `No recent income logged.`,
      suggestion:
        savingsRate < 20
          ? "Increase monthly savings to at least 20% of income."
          : undefined,
    });

    // 2) Emergency fund (15) — liquid vs 6× monthly expenses
    const liquid = assets
      .filter((a) => a.type === "cash" || a.type === "bank")
      .reduce((s, a) => s + Number(a.value || 0), 0);
    const monthsCovered = monthlyExpense > 0 ? liquid / monthlyExpense : liquid > 0 ? 6 : 0;
    const f2 = Math.max(0, Math.min(15, (monthsCovered / 6) * 15));
    factors.push({
      key: "emergency",
      name: "Emergency Fund",
      score: f2,
      max: 15,
      explanation:
        monthlyExpense > 0
          ? `Covers ${monthsCovered.toFixed(1)} months of expenses (target 6).`
          : `Add cash/bank assets to build emergency reserves.`,
      suggestion:
        monthsCovered < 6
          ? "Build emergency fund to 6 months of expenses."
          : undefined,
    });

    // 3) Debt ratio (15) — liabilities/assets
    const debtRatio =
      assetsTotal > 0 ? liabilitiesTotal / assetsTotal : liabilitiesTotal > 0 ? 1 : 0;
    const f3 = Math.max(0, Math.min(15, (1 - Math.min(1, debtRatio / 0.5)) * 15));
    factors.push({
      key: "debt",
      name: "Debt Level",
      score: f3,
      max: 15,
      explanation:
        liabilitiesTotal === 0
          ? "Debt-free — great position."
          : `Debt is ${(debtRatio * 100).toFixed(0)}% of assets.`,
      suggestion:
        debtRatio > 0.3 ? "Prioritise high-interest debt repayment." : undefined,
    });

    // 4) Investment diversification (20)
    const invByCat: Record<string, number> = {};
    for (const inv of investments) {
      invByCat[inv.category] = (invByCat[inv.category] || 0) + Number(inv.current_value || 0);
    }
    const catCount = Object.keys(invByCat).length;
    const totalInv = investCurrent;
    let concentration = 0;
    if (totalInv > 0) {
      concentration = Math.max(...Object.values(invByCat)) / totalInv;
    }
    let f4 = 0;
    if (totalInv > 0) {
      const diversityScore = Math.min(1, catCount / 4); // 4+ categories = full
      const balanceScore = 1 - Math.max(0, (concentration - 0.5) / 0.5); // penalise >50% concentration
      f4 = Math.min(20, ((diversityScore * 0.6 + balanceScore * 0.4)) * 20);
    }
    factors.push({
      key: "invest",
      name: "Investments",
      score: f4,
      max: 20,
      explanation:
        totalInv > 0
          ? `${catCount} categor${catCount === 1 ? "y" : "ies"} tracked; top holding is ${(concentration * 100).toFixed(0)}% of portfolio.`
          : `No investments tracked yet.`,
      suggestion:
        totalInv === 0
          ? "Start investing to grow wealth."
          : catCount < 3
            ? "Diversify across more asset categories."
            : concentration > 0.6
              ? "Reduce concentration in your top holding."
              : undefined,
    });

    // 5) Insurance coverage (15) — target 10× annual income
    const targetCoverage = monthlyIncome * 12 * 10;
    let f5 = 0;
    if (policies.length === 0) f5 = 0;
    else if (targetCoverage <= 0) f5 = 8; // has policies but no income baseline
    else f5 = Math.max(0, Math.min(15, (totalCoverage / targetCoverage) * 15));
    factors.push({
      key: "insurance",
      name: "Insurance Coverage",
      score: f5,
      max: 15,
      explanation:
        policies.length === 0
          ? "No insurance policies added."
          : targetCoverage > 0
            ? `Coverage is ${((totalCoverage / targetCoverage) * 100).toFixed(0)}% of the 10× income benchmark.`
            : `${policies.length} polic${policies.length === 1 ? "y" : "ies"} tracked.`,
      suggestion:
        policies.length === 0
          ? "Add health & term life insurance."
          : targetCoverage > 0 && totalCoverage < targetCoverage * 0.7
            ? "Increase coverage — aim for 10× annual income."
            : undefined,
    });

    // 6) Goal progress (15)
    let f6 = 0;
    if (goals.length === 0) f6 = 0;
    else f6 = Math.max(0, Math.min(15, (goalsPct / 100) * 15));
    factors.push({
      key: "goals",
      name: "Goal Progress",
      score: f6,
      max: 15,
      explanation:
        goals.length === 0
          ? "No financial goals set."
          : `Overall goal progress is ${goalsPct.toFixed(0)}%.`,
      suggestion:
        goals.length === 0
          ? "Set at least one financial goal."
          : goalsPct < 25
            ? "Increase monthly contributions to your goals."
            : undefined,
    });

    const total = Math.round(factors.reduce((s, f) => s + f.score, 0));
    const label: WealthHealth["label"] =
      total >= 80 ? "Excellent" : total >= 60 ? "Good" : total >= 40 ? "Average" : "Needs Attention";
    const color =
      total >= 80 ? "text-success"
      : total >= 60 ? "text-info"
      : total >= 40 ? "text-amber-600 dark:text-amber-400"
      : "text-destructive";
    const ring =
      total >= 80 ? "hsl(var(--success))"
      : total >= 60 ? "hsl(var(--info))"
      : total >= 40 ? "hsl(38 92% 50%)"
      : "hsl(var(--destructive))";

    const suggestions = factors
      .filter((f) => f.suggestion)
      .sort((a, b) => a.score / a.max - b.score / b.max)
      .slice(0, 3)
      .map((f) => f.suggestion!) as string[];

    return { score: total, label, color, ring, factors, suggestions };
  }, [
    assets, assetsTotal, liabilitiesTotal, investments, investCurrent,
    goals, goalsPct, policies, totalCoverage, transactions,
  ]);
}
