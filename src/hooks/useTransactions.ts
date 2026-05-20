import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/transaction";
import { toast } from "sonner";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapRow = (t: any): Transaction => ({
    id: t.id,
    type: t.type as "credit" | "debit",
    transaction_type: t.transaction_type as "Income" | "Expense" | "Savings" | undefined,
    amount: t.amount,
    category: t.category,
    description: t.description || "",
    date: new Date(t.date),
    addedBy: t.added_by,
    applicable_to: t.applicable_to,
  });

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel("transactions-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTransactions((prev) => [mapRow(payload.new), ...prev]);
        } else if (payload.eventType === "UPDATE") {
          const updated = mapRow(payload.new);
          setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        } else if (payload.eventType === "DELETE") {
          setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      setTransactions(data.map(mapRow));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
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
    if (error) throw error;
  };

  const updateTransaction = async (id: string, transaction: Omit<Transaction, "id">) => {
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
      .eq("id", id);
    if (error) throw error;
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  };

  return { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions };
}
