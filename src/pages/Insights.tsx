import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { AIInsights } from "@/components/v2/Analytics/AIInsights";
import { FinancialCoach } from "@/components/v2/Insights/FinancialCoach";
import { MemberComparisonPanel } from "@/components/v2/Insights/MemberComparisonPanel";
import { BoardHeader } from "@/components/v2/Analytics/BoardHeader";
import { Sparkles } from "lucide-react";
import { PageSkeleton } from "@/components/common/PageSkeleton";

export default function Insights() {
  const { transactions, isLoading } = useTransactions();
  const { getFilteredTransactions } = useFilters();

  const filtered = useMemo(
    () => getFilteredTransactions(transactions),
    [transactions, getFilteredTransactions]
  );

  if (isLoading) return <PageSkeleton rows={4} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="animate-fade-in">
          <BoardHeader
            icon={Sparkles}
            title="AI Insights"
            subtitle="AI-powered financial analysis, recommendations, and spending intelligence — personalized to your data."
            accent="primary"
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <FinancialCoach transactions={filtered} allTransactions={transactions} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <MemberComparisonPanel transactions={filtered} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
          <AIInsights transactions={filtered} />
        </div>
      </div>
    </div>
  );
}
