import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InvestmentCategory =
  | "stocks"
  | "mutual_funds"
  | "fixed_deposits"
  | "gold"
  | "ppf"
  | "epf"
  | "bonds"
  | "real_estate"
  | "other";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  category: InvestmentCategory;
  invested_amount: number;
  current_value: number;
  invested_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const INVESTMENT_CATEGORIES: { value: InvestmentCategory; label: string; emoji: string }[] = [
  { value: "stocks", label: "Stocks", emoji: "📈" },
  { value: "mutual_funds", label: "Mutual Funds", emoji: "📊" },
  { value: "fixed_deposits", label: "Fixed Deposits", emoji: "🏦" },
  { value: "gold", label: "Gold", emoji: "🪙" },
  { value: "ppf", label: "PPF", emoji: "🛡️" },
  { value: "epf", label: "EPF", emoji: "💼" },
  { value: "bonds", label: "Bonds", emoji: "📜" },
  { value: "real_estate", label: "Real Estate", emoji: "🏠" },
  { value: "other", label: "Other", emoji: "📦" },
];

async function fetchInvestments(): Promise<Investment[]> {
  const { data, error } = await (supabase as any)
    .from("investments")
    .select("*")
    .order("invested_on", { ascending: false });
  if (error) throw error;
  return (data || []) as Investment[];
}

export function useInvestments() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["investments"], queryFn: fetchInvestments, staleTime: 60_000 });

  useEffect(() => {
    const ch = supabase
      .channel(`investments-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "investments" }, () =>
        qc.invalidateQueries({ queryKey: ["investments"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("investments").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Investment> }) => {
      const { error } = await (supabase as any).from("investments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });

  const investments = query.data ?? [];
  const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount || 0), 0);
  const totalCurrent = investments.reduce((s, i) => s + Number(i.current_value || 0), 0);
  const gainLoss = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

  return {
    investments,
    totalInvested,
    totalCurrent,
    gainLoss,
    returnPct,
    isLoading: query.isLoading,
    addInvestment: addMutation.mutateAsync,
    updateInvestment: (id: string, updates: Partial<Investment>) => updateMutation.mutateAsync({ id, updates }),
    deleteInvestment: deleteMutation.mutateAsync,
  };
}
