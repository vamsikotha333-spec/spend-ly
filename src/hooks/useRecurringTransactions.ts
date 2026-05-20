import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RecurringTransaction {
  id: string;
  type: string;
  transaction_type: string | null;
  amount: number;
  category: string;
  description: string | null;
  added_by: string;
  applicable_to: string | null;
  frequency: string;
  next_run_date: string;
  is_active: boolean;
  created_at: string;
}

export function useRecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecurring();
    const channel = supabase
      .channel("recurring-txns")
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_transactions" }, () => {
        fetchRecurring();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRecurring = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecurring(data || []);
    } catch (error) {
      console.error("Error fetching recurring:", error);
      toast.error("Failed to load recurring transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const addRecurring = async (txn: Omit<RecurringTransaction, "id" | "created_at">) => {
    const { error } = await supabase.from("recurring_transactions").insert(txn);
    if (error) throw error;
  };

  const updateRecurring = async (id: string, updates: Partial<RecurringTransaction>) => {
    const { error } = await supabase.from("recurring_transactions").update(updates).eq("id", id);
    if (error) throw error;
  };

  const deleteRecurring = async (id: string) => {
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
    if (error) throw error;
  };

  return { recurring, isLoading, addRecurring, updateRecurring, deleteRecurring, refetch: fetchRecurring };
}
