import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction } from "@/types/transaction";

export interface Member {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await (supabase as any)
    .from("members")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as Member[];
}

export function useMembers() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    staleTime: 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("members-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        () => qc.invalidateQueries({ queryKey: ["members"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const members = query.data ?? [];
  const memberNames = useMemo(() => members.map((m) => m.name), [members]);

  const addMutation = useMutation({
    mutationFn: async (name: string): Promise<Member> => {
      const clean = name.trim();
      if (!clean) throw new Error("Name is required");
      const { data, error } = await (supabase as any)
        .from("members")
        .insert({ name: clean })
        .select()
        .single();
      if (error) throw error;
      return data as Member;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ member, newName }: { member: Member; newName: string }) => {
      const clean = newName.trim();
      if (!clean) throw new Error("Name is required");
      const { error } = await (supabase as any)
        .from("members")
        .update({ name: clean })
        .eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (member: Member) => {
      const { error } = await (supabase as any)
        .from("members")
        .delete()
        .eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  return {
    members,
    memberNames,
    isLoading: query.isLoading,
    addMember: (name: string) => addMutation.mutateAsync(name),
    renameMember: (member: Member, newName: string) =>
      renameMutation.mutateAsync({ member, newName }),
    deleteMember: (member: Member) => deleteMutation.mutateAsync(member),
    isMutating:
      addMutation.isPending || renameMutation.isPending || deleteMutation.isPending,
  };
}

/**
 * Union current members with any historical names appearing on the user's
 * own transactions (added_by + applicable_to). Keeps analytics/filters
 * complete even after a member was renamed/deleted.
 */
export function useMemberOptions(transactions?: Transaction[]): string[] {
  const { memberNames } = useMembers();
  return useMemo(() => {
    const set = new Set<string>(memberNames);
    if (transactions) {
      for (const t of transactions) {
        if (t.addedBy) set.add(t.addedBy);
        if (t.applicable_to) set.add(t.applicable_to);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [memberNames, transactions]);
}
