import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Budget {
  id: string;
  category: string;
  budget_amount: number;
  month: string;
  person: string;
  created_at: string;
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
    const channel = supabase
      .channel(`budgets-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => {
        fetchBudgets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("month", { ascending: false });
      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, "id" | "created_at">) => {
    const { error } = await supabase.from("budgets").insert(budget);
    if (error) throw error;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const { error } = await supabase.from("budgets").update(updates).eq("id", id);
    if (error) throw error;
  };

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw error;
  };

  return { budgets, isLoading, addBudget, updateBudget, deleteBudget, refetch: fetchBudgets };
}
