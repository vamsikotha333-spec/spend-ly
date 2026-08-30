import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { AIInsights } from "@/components/v2/Analytics/AIInsights";
import { FinancialCoach } from "@/components/v2/Insights/FinancialCoach";
import { MemberComparisonPanel } from "@/components/v2/Insights/MemberComparisonPanel";
import { BoardHeader } from "@/components/v2/Analytics/BoardHeader";
import { HealthScore } from "@/components/v2/Home/HealthScore";
import { Sparkles } from "lucide-react";
import { PageSkeleton } from "@/components/common/PageSkeleton";

function getType(t: any) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

export default function Insights() {
  const { transactions, isLoading } = useTransactions();
  const { getFilteredTransactions } = useFilters();

  const filtered = useMemo(
    () => getFilteredTransactions(transactions),
    [transactions, getFilteredTransactions]
  );

  const totals = useMemo(() => {
    const sum = (type: string) =>
      filtered.filter((t) => getType(t) === type).reduce((s, t) => s + t.amount, 0);
    return { income: sum("Income"), expenses: sum("Expense"), savings: sum("Savings") };
  }, [filtered]);

  if (isLoading) return <PageSkeleton rows={4} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 space-y-6">
        <div className="animate-fade-in">
          <BoardHeader
            icon={Sparkles}
            title="AI Insights"
            subtitle="Why your money is moving the way it is — and what to do next, based on your actual data."
            accent="primary"
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
          <HealthScore
            transactions={transactions}
            income={totals.income}
            expenses={totals.expenses}
            savings={totals.savings}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
          <FinancialCoach transactions={filtered} allTransactions={transactions} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
          <MemberComparisonPanel transactions={filtered} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
          <AIInsights transactions={filtered} />
        </div>
      </div>
    </div>
  );
}
