import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  person: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
    const channel = supabase
      .channel("savings-goals")
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_goals" }, () => {
        fetchGoals();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load savings goals");
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = async (goal: Omit<SavingsGoal, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("savings_goals").insert(goal);
    if (error) throw error;
  };

  const updateGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    const { error } = await supabase.from("savings_goals").update(updates).eq("id", id);
    if (error) throw error;
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", id);
    if (error) throw error;
  };

  return { goals, isLoading, addGoal, updateGoal, deleteGoal, refetch: fetchGoals };
}
