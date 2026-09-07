import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LiabilityType = "loan" | "credit_card" | "mortgage" | "other";

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityType;
  amount: number;
  interest_rate: number | null;
  notes: string | null;
  member: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchLiabilities(): Promise<Liability[]> {
  const { data, error } = await (supabase as any)
    .from("liabilities")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Liability[];
}

export function useLiabilities() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["liabilities"], queryFn: fetchLiabilities, staleTime: 60_000 });

  useEffect(() => {
    const ch = supabase
      .channel(`liabilities-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "liabilities" }, () =>
        qc.invalidateQueries({ queryKey: ["liabilities"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<Liability, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("liabilities").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liabilities"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Liability> }) => {
      const { error } = await (supabase as any).from("liabilities").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liabilities"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("liabilities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liabilities"] }),
  });

  const liabilities = query.data ?? [];
  const total = liabilities.reduce((s, l) => s + Number(l.amount || 0), 0);

  return {
    liabilities,
    total,
    isLoading: query.isLoading,
    addLiability: addMutation.mutateAsync,
    updateLiability: (id: string, updates: Partial<Liability>) => updateMutation.mutateAsync({ id, updates }),
    deleteLiability: deleteMutation.mutateAsync,
  };
}
