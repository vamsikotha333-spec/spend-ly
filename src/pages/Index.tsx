import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types/transaction";
import { DashboardHeader } from "@/components/v2/Dashboard/DashboardHeader";
import { StatsCards } from "@/components/v2/Dashboard/StatsCards";
import { TransactionFormV2 } from "@/components/v2/Transactions/TransactionFormV2";
import { RecentTransactions } from "@/components/v2/Transactions/RecentTransactions";
import { TransactionDialog } from "@/components/v2/Transactions/TransactionDialog";
import { SpendingCategoryTable } from "@/components/v2/Analytics/SpendingCategoryTable";
import { MonthlySummaryV2 } from "@/components/v2/Analytics/MonthlySummaryV2";
import { eachMonthOfInterval, isSameMonth } from "date-fns";

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const { toast } = useToast();

  // Available months (Oct 2025 - Feb 2026)
  const availableMonths = eachMonthOfInterval({
    start: new Date(2025, 9, 1),
    end: new Date(2026, 1, 28),
  });

  // Fetch transactions from database
  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive",
        });
      } else if (data) {
        const formattedTransactions: Transaction[] = data.map((t: any) => ({
          id: t.id,
          type: t.type,
          transaction_type: t.transaction_type,
          amount: parseFloat(t.amount),
          category: t.category,
          description: t.description,
          date: new Date(t.date),
          addedBy: t.added_by,
          applicable_to: t.applicable_to,
        }));
        setTransactions(formattedTransactions);
      }
      setIsLoading(false);
    };

    fetchTransactions();
  }, [toast]);

  // Real-time subscription for transactions
  useEffect(() => {
    const channel = supabase
      .channel(`transactions-changes-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          const newTransaction: Transaction = {
            id: payload.new.id,
            type: payload.new.type,
            transaction_type: payload.new.transaction_type,
            amount: parseFloat(payload.new.amount),
            category: payload.new.category,
            description: payload.new.description,
            date: new Date(payload.new.date),
            addedBy: payload.new.added_by,
            applicable_to: payload.new.applicable_to,
          };
          setTransactions((prev) => [newTransaction, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          const updatedTransaction: Transaction = {
            id: payload.new.id,
            type: payload.new.type,
            transaction_type: payload.new.transaction_type,
            amount: parseFloat(payload.new.amount),
            category: payload.new.category,
            description: payload.new.description,
            date: new Date(payload.new.date),
            addedBy: payload.new.added_by,
            applicable_to: payload.new.applicable_to,
          };
          setTransactions((prev) =>
            prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (editingTransaction) {
      // Update existing transaction
      const { error } = await supabase
        .from("transactions")
        .update({
          type: transaction.type,
          transaction_type: transaction.transaction_type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date.toISOString(),
          added_by: transaction.addedBy,
          applicable_to: transaction.applicable_to,
        })
        .eq("id", editingTransaction.id);

      if (error) {
        console.error("Error updating transaction:", error);
        toast({
          title: "Error",
          description: "Failed to update transaction",
          variant: "destructive",
        });
      }
      setEditingTransaction(undefined);
    } else {
      // Insert new transaction
      const { error } = await supabase.from("transactions").insert({
        type: transaction.type,
        transaction_type: transaction.transaction_type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date.toISOString(),
        added_by: transaction.addedBy,
        applicable_to: transaction.applicable_to,
      });

      if (error) {
        console.error("Error adding transaction:", error);
        toast({
          title: "Error",
          description: "Failed to add transaction",
          variant: "destructive",
        });
      }
    }
  };

  // Filtered transactions based on month and search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const monthMatch = !selectedMonth || isSameMonth(t.date, selectedMonth);
      const searchMatch =
        !searchTerm ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.addedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.applicable_to && t.applicable_to.toLowerCase().includes(searchTerm.toLowerCase()));
      return monthMatch && searchMatch;
    });
  }, [transactions, selectedMonth, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        availableMonths={availableMonths}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <StatsCards transactions={filteredTransactions} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TransactionFormV2
              onAddTransaction={handleAddTransaction}
              editTransaction={editingTransaction}
              onCancelEdit={() => setEditingTransaction(undefined)}
            />
          </div>
          <div className="lg:col-span-2">
            <RecentTransactions
              transactions={filteredTransactions}
              onViewAll={() => setShowAllTransactions(true)}
              onEdit={setEditingTransaction}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <SpendingCategoryTable transactions={filteredTransactions} />
        </div>

        <MonthlySummaryV2 transactions={filteredTransactions} />
      </main>

      <TransactionDialog
        open={showAllTransactions}
        onOpenChange={setShowAllTransactions}
        transactions={filteredTransactions}
        onEdit={setEditingTransaction}
      />
    </div>
  );
};

export default Index;
