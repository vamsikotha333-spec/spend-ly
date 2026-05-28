import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { SpendingCategoryTable } from "@/components/v2/Analytics/SpendingCategoryTable";
import { CategoryDistributionChart } from "@/components/v2/Analytics/CategoryDistributionChart";
import { BoardHeader } from "@/components/v2/Analytics/BoardHeader";
import { Table2 } from "lucide-react";

export default function SpendingByCategory() {
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
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <BoardHeader
          icon={Table2}
          title="Category Analytics"
          subtitle="Detailed breakdown of expenses, savings, and income categories — switch tabs to analyze each type."
          accent="success"
        />
        <CategoryDistributionChart transactions={filtered} />
        <SpendingCategoryTable transactions={filtered} />
      </div>
    </div>
  );
}
