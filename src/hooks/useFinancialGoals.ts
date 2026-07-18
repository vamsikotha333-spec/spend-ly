import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GoalCategory =
  | "emergency" | "house" | "car" | "education" | "retirement" | "travel" | "other";

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  category: GoalCategory;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const GOAL_CATEGORIES: { value: GoalCategory; label: string; emoji: string }[] = [
  { value: "emergency", label: "Emergency Fund", emoji: "🛟" },
  { value: "house", label: "House", emoji: "🏠" },
  { value: "car", label: "Car", emoji: "🚗" },
  { value: "education", label: "Education", emoji: "🎓" },
  { value: "retirement", label: "Retirement", emoji: "🌴" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "other", label: "Other", emoji: "🎯" },
];

async function fetchGoals(): Promise<FinancialGoal[]> {
  const { data, error } = await (supabase as any)
    .from("financial_goals").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as FinancialGoal[];
}

export function useFinancialGoals() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["financial_goals"], queryFn: fetchGoals, staleTime: 60_000 });

  useEffect(() => {
    const ch = supabase
      .channel(`fin-goals-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "financial_goals" }, () =>
        qc.invalidateQueries({ queryKey: ["financial_goals"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<FinancialGoal, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("financial_goals").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_goals"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FinancialGoal> }) => {
      const { error } = await (supabase as any).from("financial_goals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_goals"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("financial_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_goals"] }),
  });

  const goals = query.data ?? [];
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount || 0), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount || 0), 0);
  const remaining = Math.max(0, totalTarget - totalSaved);
  const overallPct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  return {
    goals, totalTarget, totalSaved, remaining, overallPct,
    isLoading: query.isLoading,
    addGoal: addMutation.mutateAsync,
    updateGoal: (id: string, updates: Partial<FinancialGoal>) => updateMutation.mutateAsync({ id, updates }),
    deleteGoal: deleteMutation.mutateAsync,
  };
}
