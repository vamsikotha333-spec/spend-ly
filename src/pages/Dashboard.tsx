import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { OverviewSection } from "@/components/v2/Dashboard/OverviewSection";
import { MonthlySnapshot } from "@/components/v2/Dashboard/MonthlySnapshot";
import { IncomeExpenseChart } from "@/components/v2/Dashboard/IncomeExpenseChart";
import { SpendingDonutChart } from "@/components/v2/Dashboard/SpendingDonutChart";
import { SpendingByPerson } from "@/components/v2/Dashboard/SpendingByPerson";
import { RecentTransactions } from "@/components/v2/Transactions/RecentTransactions";
import { NetWorthCard } from "@/components/v2/Home/NetWorthCard";
import { CashFlowForecast } from "@/components/v2/Home/CashFlowForecast";
import { LoggingStreak } from "@/components/v2/Home/LoggingStreak";
import { TransactionFormV2 } from "@/components/v2/Transactions/TransactionFormV2";
import { TransactionDialog } from "@/components/v2/Transactions/TransactionDialog";
import { AdvancedFilter } from "@/components/v2/Dashboard/AdvancedFilter";
import { Transaction } from "@/types/transaction";
import { toast } from "sonner";
import { Search, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { transactions, isLoading, addTransaction, updateTransaction } = useTransactions();
  const { getFilteredTransactions } = useFilters();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const filteredTransactions = useMemo(() => {
    let result = getFilteredTransactions(transactions);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // People search uses "Applicable To" only — "Added By" stays audit-only data.
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          (t.applicable_to || "").toLowerCase().includes(term)
      );
    }
    return result;
  }, [transactions, searchTerm, getFilteredTransactions]);

  const handleAddTransaction = async (transaction: Omit<Transaction, "id">) => {
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transaction);
        toast.success("Transaction updated");
        setEditingTransaction(undefined);
      } else {
        await addTransaction(transaction);
        toast.success("Transaction added");
        setShowQuickAdd(false);
      }
    } catch {
      toast.error("Failed to save transaction");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 space-y-8">
        {/* Page Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <AdvancedFilter />
            <Button size="sm" variant="outline" onClick={() => setShowQuickAdd(!showQuickAdd)}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Quick Add
            </Button>
            <Button size="sm" asChild>
              <Link to="/add">Add Transaction</Link>
            </Button>
          </div>
        </div>

        {/* Quick Add */}
        {showQuickAdd && (
          <TransactionFormV2
            onAddTransaction={handleAddTransaction}
            editTransaction={editingTransaction}
            onCancelEdit={() => { setEditingTransaction(undefined); setShowQuickAdd(false); }}
          />
        )}

        {/* 1 — Greeting, KPIs, Net Cashflow, Savings Rate & Smart Insights (merged from Home) */}
        <OverviewSection />

        {/* 2 — Monthly Snapshot */}
        <section className="space-y-3">
          <SectionTitle title="Monthly Snapshot" hint="Spend, savings rate and top category" />
          <MonthlySnapshot transactions={filteredTransactions} />
        </section>

        {/* 3 — Financial Performance */}
        <section className="space-y-3">
          <SectionTitle title="Financial Performance" hint="Income vs Expenses vs Savings" />
          <IncomeExpenseChart transactions={filteredTransactions} />
        </section>

        {/* 4 — Spending Analysis + Applicable To Analysis */}
        <section className="space-y-3">
          <SectionTitle title="Spending Analysis" hint="Where the money goes, and who it applies to" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 items-start">
            <SpendingDonutChart transactions={filteredTransactions} />
            <SpendingByPerson transactions={filteredTransactions} />
          </div>
        </section>

        {/* 5 — Position & Planning */}
        <section className="space-y-3">
          <SectionTitle title="Position & Planning" hint="Net worth and projected cash flow" />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 items-start">
            <NetWorthCard />
            <CashFlowForecast />
            <LoggingStreak transactions={transactions} />
          </div>
        </section>

        {/* 6 — Recent Transactions */}
        <section className="space-y-3">
          <SectionTitle title="Recent Transactions" hint="Latest activity for this period" />
          <RecentTransactions
            transactions={filteredTransactions}
            onViewAll={() => setShowAllTransactions(true)}
            onEdit={(t) => { setEditingTransaction(t); setShowQuickAdd(true); }}
          />
        </section>

        <TransactionDialog
          open={showAllTransactions}
          onOpenChange={setShowAllTransactions}
          transactions={filteredTransactions}
          onEdit={(t) => { setEditingTransaction(t); setShowQuickAdd(true); }}
        />
      </div>
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b pb-2">
      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h2>
      {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
    </div>
  );
}
