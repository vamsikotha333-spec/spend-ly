import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AssetType = "cash" | "bank" | "investment" | "gold" | "real_estate" | "other";

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  value: number;
  notes: string | null;
  member: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await (supabase as any)
    .from("assets")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Asset[];
}

export function useAssets() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["assets"], queryFn: fetchAssets, staleTime: 60_000 });

  useEffect(() => {
    const ch = supabase
      .channel(`assets-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () =>
        qc.invalidateQueries({ queryKey: ["assets"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<Asset, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("assets").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Asset> }) => {
      const { error } = await (supabase as any).from("assets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });

  const assets = query.data ?? [];
  const total = assets.reduce((s, a) => s + Number(a.value || 0), 0);

  return {
    assets,
    total,
    isLoading: query.isLoading,
    addAsset: addMutation.mutateAsync,
    updateAsset: (id: string, updates: Partial<Asset>) => updateMutation.mutateAsync({ id, updates }),
    deleteAsset: deleteMutation.mutateAsync,
  };
}
