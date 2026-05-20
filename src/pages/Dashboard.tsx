import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { StatsCards } from "@/components/v2/Dashboard/StatsCards";
import { MonthlySnapshot } from "@/components/v2/Dashboard/MonthlySnapshot";
import { IncomeExpenseChart } from "@/components/v2/Dashboard/IncomeExpenseChart";
import { SpendingDonutChart } from "@/components/v2/Dashboard/SpendingDonutChart";
import { SpendingByPerson } from "@/components/v2/Dashboard/SpendingByPerson";
import { RecentTransactions } from "@/components/v2/Transactions/RecentTransactions";
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
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.addedBy.toLowerCase().includes(term)
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
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
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

        {/* Stats */}
        <StatsCards transactions={filteredTransactions} />

        {/* Monthly Snapshot */}
        <MonthlySnapshot transactions={filteredTransactions} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeExpenseChart transactions={filteredTransactions} />
          <SpendingDonutChart transactions={filteredTransactions} />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTransactions
              transactions={filteredTransactions}
              onViewAll={() => setShowAllTransactions(true)}
              onEdit={(t) => { setEditingTransaction(t); setShowQuickAdd(true); }}
            />
          </div>
          <SpendingByPerson transactions={filteredTransactions} />
        </div>

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
