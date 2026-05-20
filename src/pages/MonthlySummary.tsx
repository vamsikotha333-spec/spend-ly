import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { MonthlySummaryV2 } from "@/components/v2/Analytics/MonthlySummaryV2";
import { SmartMonthlyBreakdown } from "@/components/v2/Analytics/SmartMonthlyBreakdown";

export default function MonthlySummary() {
  const { transactions, isLoading } = useTransactions();
  const { getFilteredTransactions } = useFilters();

  const filtered = useMemo(() => getFilteredTransactions(transactions), [transactions, getFilteredTransactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <SmartMonthlyBreakdown transactions={filtered} />
        <MonthlySummaryV2 transactions={filtered} />
      </div>
    </div>
  );
}
