import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InsuranceType =
  | "term_life" | "health" | "vehicle" | "personal_accident" | "home" | "other";

export type PremiumFrequency = "monthly" | "quarterly" | "half_yearly" | "yearly" | "one_time";

export interface InsurancePolicy {
  id: string;
  user_id: string;
  name: string;
  type: InsuranceType;
  provider: string | null;
  policy_number: string | null;
  coverage_amount: number;
  premium_amount: number;
  premium_frequency: PremiumFrequency;
  start_date: string | null;
  renewal_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const INSURANCE_TYPES: { value: InsuranceType; label: string; emoji: string }[] = [
  { value: "term_life", label: "Term Life", emoji: "🧬" },
  { value: "health", label: "Health", emoji: "🩺" },
  { value: "vehicle", label: "Vehicle", emoji: "🚙" },
  { value: "personal_accident", label: "Personal Accident", emoji: "🦺" },
  { value: "home", label: "Home", emoji: "🏡" },
  { value: "other", label: "Other", emoji: "📄" },
];

export const PREMIUM_FREQUENCIES: { value: PremiumFrequency; label: string; perYear: number }[] = [
  { value: "monthly", label: "Monthly", perYear: 12 },
  { value: "quarterly", label: "Quarterly", perYear: 4 },
  { value: "half_yearly", label: "Half-Yearly", perYear: 2 },
  { value: "yearly", label: "Yearly", perYear: 1 },
  { value: "one_time", label: "One-Time", perYear: 0 },
];

export function annualPremium(p: Pick<InsurancePolicy, "premium_amount" | "premium_frequency">) {
  const meta = PREMIUM_FREQUENCIES.find((f) => f.value === p.premium_frequency);
  return Number(p.premium_amount || 0) * (meta?.perYear ?? 0);
}

async function fetchPolicies(): Promise<InsurancePolicy[]> {
  const { data, error } = await (supabase as any)
    .from("insurance_policies").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as InsurancePolicy[];
}

export function useInsurancePolicies() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["insurance_policies"], queryFn: fetchPolicies, staleTime: 60_000 });

  useEffect(() => {
    const ch = supabase
      .channel(`insurance-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "insurance_policies" }, () =>
        qc.invalidateQueries({ queryKey: ["insurance_policies"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<InsurancePolicy, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("insurance_policies").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance_policies"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsurancePolicy> }) => {
      const { error } = await (supabase as any).from("insurance_policies").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance_policies"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("insurance_policies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance_policies"] }),
  });

  const policies = query.data ?? [];
  const totalPolicies = policies.length;
  const totalCoverage = policies.reduce((s, p) => s + Number(p.coverage_amount || 0), 0);
  const annualPremiumTotal = policies.reduce((s, p) => s + annualPremium(p), 0);
  const now = new Date();
  const soon = new Date(); soon.setDate(now.getDate() + 30);
  const upcomingRenewals = policies.filter((p) => {
    if (!p.renewal_date) return false;
    const d = new Date(p.renewal_date);
    return d >= now && d <= soon;
  });

  return {
    policies, totalPolicies, totalCoverage, annualPremiumTotal, upcomingRenewals,
    isLoading: query.isLoading,
    addPolicy: addMutation.mutateAsync,
    updatePolicy: (id: string, updates: Partial<InsurancePolicy>) => updateMutation.mutateAsync({ id, updates }),
    deletePolicy: deleteMutation.mutateAsync,
  };
}
