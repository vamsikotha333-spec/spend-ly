import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SavingsContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  contributed_at: string;
  created_at: string;
}

export function useSavingsContributions(goalId?: string) {
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    let q = (supabase as any)
      .from("savings_contributions")
      .select("*")
      .order("contributed_at", { ascending: false });
    if (goalId) q = q.eq("goal_id", goalId);
    const { data, error } = await q;
    if (!error) setContributions((data as SavingsContribution[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel(`sav-contrib-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "savings_contributions" },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  const add = async (input: { goal_id: string; amount: number; note?: string; contributed_at?: string }) => {
    const { error } = await (supabase as any)
      .from("savings_contributions")
      .insert({
        goal_id: input.goal_id,
        amount: input.amount,
        note: input.note || null,
        contributed_at: input.contributed_at || new Date().toISOString(),
      });
    if (error) throw error;
  };

  const update = async (id: string, patch: Partial<Pick<SavingsContribution, "amount" | "note" | "contributed_at">>) => {
    const { error } = await (supabase as any).from("savings_contributions").update(patch).eq("id", id);
    if (error) throw error;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("savings_contributions").delete().eq("id", id);
    if (error) throw error;
  };

  return { contributions, isLoading, addContribution: add, updateContribution: update, deleteContribution: remove };
}
