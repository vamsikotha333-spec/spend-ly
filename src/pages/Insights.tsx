import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { AIInsights } from "@/components/v2/Analytics/AIInsights";
import { FinancialCoach } from "@/components/v2/Insights/FinancialCoach";
import { MemberComparisonPanel } from "@/components/v2/Insights/MemberComparisonPanel";
import { BoardHeader } from "@/components/v2/Analytics/BoardHeader";
import { Sparkles } from "lucide-react";

export default function Insights() {
  const { transactions, isLoading } = useTransactions();
  const { getFilteredTransactions } = useFilters();

  const filtered = useMemo(
    () => getFilteredTransactions(transactions),
    [transactions, getFilteredTransactions]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <BoardHeader
          icon={Sparkles}
          title="AI Insights"
          subtitle="AI-powered financial analysis, recommendations, and spending intelligence — personalized to your data."
          accent="primary"
        />
        <FinancialCoach transactions={filtered} allTransactions={transactions} />
        <MemberComparisonPanel transactions={filtered} />
        <AIInsights transactions={filtered} />
      </div>
    </div>
  );
}
