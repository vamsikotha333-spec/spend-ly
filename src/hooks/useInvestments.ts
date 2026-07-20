import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcInterest, InterestFrequency, InterestType } from "@/lib/interestCalc";

/** Kept for backward compatibility with old dropdowns. */
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
  category: InvestmentCategory; // legacy column, kept for compat
  type_name: string | null; // new: free-form type name
  purpose: string | null;
  tags: string[];
  bank_name: string | null;
  status: string; // 'active' | 'closed' | 'matured'
  invested_amount: number;
  current_value: number;
  invested_on: string;
  notes: string | null;
  // Interest Turnover fields
  principal_amount: number | null;
  borrower_name: string | null;
  interest_rate: number | null;
  interest_type: InterestType | null;
  interest_frequency: InterestFrequency | null;
  start_date: string | null;
  due_date: string | null;
  interest_received: number;
  created_at: string;
  updated_at: string;
}

// Legacy list kept for compatibility with other screens that still import it.
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

/** Map free-form type name → legacy category enum for the DB. */
export function mapTypeNameToCategory(name: string | null | undefined): InvestmentCategory {
  const n = (name || "").toLowerCase();
  if (n.includes("stock")) return "stocks";
  if (n.includes("mutual")) return "mutual_funds";
  if (n.includes("fixed") || n.includes("fd")) return "fixed_deposits";
  if (n.includes("gold")) return "gold";
  if (n === "ppf") return "ppf";
  if (n === "epf") return "epf";
  if (n.includes("bond")) return "bonds";
  if (n.includes("real")) return "real_estate";
  return "other";
}

/** Emoji for a type name (falls back sensibly). */
export function typeEmoji(name: string | null | undefined): string {
  const n = (name || "").toLowerCase();
  if (n.includes("stock")) return "📈";
  if (n.includes("mutual")) return "📊";
  if (n.includes("fixed") || n === "fd") return "🏦";
  if (n.includes("bank saving")) return "🏦";
  if (n.includes("gold")) return "🪙";
  if (n === "ppf") return "🛡️";
  if (n === "epf") return "💼";
  if (n.includes("bond")) return "📜";
  if (n.includes("real")) return "🏠";
  if (n.includes("crypto")) return "₿";
  if (n.includes("chit")) return "🎫";
  if (n.includes("interest")) return "💸";
  return "📦";
}

async function fetchInvestments(): Promise<Investment[]> {
  const { data, error } = await (supabase as any)
    .from("investments")
    .select("*")
    .order("invested_on", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    ...r,
    tags: Array.isArray(r.tags) ? r.tags : [],
    interest_received: Number(r.interest_received || 0),
  })) as Investment[];
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
    mutationFn: async (payload: Partial<Investment> & { name: string; invested_on: string; invested_amount: number; current_value: number }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const category = payload.category || mapTypeNameToCategory(payload.type_name);
      const { error } = await (supabase as any).from("investments").insert({
        ...payload, user_id, category, tags: payload.tags ?? [],
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Investment> }) => {
      const patch: any = { ...updates };
      if (updates.type_name !== undefined && !updates.category) {
        patch.category = mapTypeNameToCategory(updates.type_name);
      }
      const { error } = await (supabase as any).from("investments").update(patch).eq("id", id);
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

  // Monthly interest income from Interest Turnover investments
  let monthlyInterestIncome = 0;
  let totalPassiveIncome = 0;
  for (const inv of investments) {
    const isInterest = (inv.type_name || "").toLowerCase().includes("interest") ||
      (inv.principal_amount && inv.interest_rate);
    if (!isInterest) continue;
    const r = calcInterest({
      principal: Number(inv.principal_amount || 0),
      rate: Number(inv.interest_rate || 0),
      interestType: (inv.interest_type as InterestType) || "Simple Interest",
      frequency: (inv.interest_frequency as InterestFrequency) || "Monthly",
      startDate: inv.start_date,
      dueDate: inv.due_date,
      interestReceived: inv.interest_received,
    });
    monthlyInterestIncome += r.monthlyInterest;
    totalPassiveIncome += r.totalInterestEarned;
  }

  return {
    investments,
    totalInvested,
    totalCurrent,
    gainLoss,
    returnPct,
    monthlyInterestIncome,
    totalPassiveIncome,
    isLoading: query.isLoading,
    addInvestment: addMutation.mutateAsync,
    updateInvestment: (id: string, updates: Partial<Investment>) => updateMutation.mutateAsync({ id, updates }),
    deleteInvestment: deleteMutation.mutateAsync,
  };
}
