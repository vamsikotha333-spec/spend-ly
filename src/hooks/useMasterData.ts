import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MasterDataKind =
  | "investment_type"
  | "investment_purpose"
  | "bank_name"
  | "interest_type"
  | "asset_type"
  | "liability_type"
  | "tag";

export interface MasterDataItem {
  id: string;
  user_id: string;
  kind: MasterDataKind;
  name: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function fetchAll(): Promise<MasterDataItem[]> {
  const { data, error } = await (supabase as any)
    .from("master_data_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as MasterDataItem[];
}

/**
 * Master data hook. Pass a `kind` to filter, or omit to get all items.
 */
export function useMasterData(kind?: MasterDataKind) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["master_data_items"],
    queryFn: fetchAll,
    staleTime: 60_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`master-data-rt-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "master_data_items" },
        () => qc.invalidateQueries({ queryKey: ["master_data_items"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const items = useMemo(() => {
    const all = query.data ?? [];
    return kind ? all.filter((i) => i.kind === kind) : all;
  }, [query.data, kind]);

  const add = useMutation({
    mutationFn: async (payload: { kind: MasterDataKind; name: string }) => {
      const clean = payload.name.trim();
      if (!clean) throw new Error("Name is required");
      const { data: u } = await supabase.auth.getUser();
      const user_id = u.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("master_data_items")
        .insert({ user_id, kind: payload.kind, name: clean, is_default: false })
        .select()
        .single();
      if (error) {
        if ((error as any).code === "23505") throw new Error("Already exists");
        throw error;
      }
      return data as MasterDataItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master_data_items"] }),
  });

  const rename = useMutation({
    mutationFn: async (payload: { id: string; name: string }) => {
      const clean = payload.name.trim();
      if (!clean) throw new Error("Name is required");
      const { error } = await (supabase as any)
        .from("master_data_items")
        .update({ name: clean })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master_data_items"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("master_data_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master_data_items"] }),
  });

  return {
    items,
    all: query.data ?? [],
    isLoading: query.isLoading,
    addItem: add.mutateAsync,
    isAdding: add.isPending,
    renameItem: rename.mutateAsync,
    isRenaming: rename.isPending,
    deleteItem: remove.mutateAsync,
  };
}
