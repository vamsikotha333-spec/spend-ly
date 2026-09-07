import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  assets_total: number;
  liabilities_total: number;
  net_worth: number;
}

async function fetchSnapshots(): Promise<NetWorthSnapshot[]> {
  const { data, error } = await (supabase as any)
    .from("net_worth_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: true });
  if (error) throw error;
  return (data || []) as NetWorthSnapshot[];
}

export function useNetWorthSnapshots() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["net_worth_snapshots"], queryFn: fetchSnapshots, staleTime: 60_000 });

  const record = async (assetsTotal: number, liabilitiesTotal: number) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) return;
    const snapshot_date = new Date().toISOString().slice(0, 10);
    const { error } = await (supabase as any)
      .from("net_worth_snapshots")
      .upsert(
        {
          user_id,
          snapshot_date,
          assets_total: assetsTotal,
          liabilities_total: liabilitiesTotal,
          net_worth: assetsTotal - liabilitiesTotal,
        },
        { onConflict: "user_id,snapshot_date" },
      );
    if (!error) qc.invalidateQueries({ queryKey: ["net_worth_snapshots"] });
  };

  const snapshots = (query.data ?? []).map((s) => ({
    ...s,
    assets_total: Number(s.assets_total || 0),
    liabilities_total: Number(s.liabilities_total || 0),
    net_worth: Number(s.net_worth || 0),
  }));

  return { snapshots, isLoading: query.isLoading, recordSnapshot: record };
}

/**
 * Records a snapshot for today whenever the current totals differ from the
 * latest stored snapshot. Safe to mount on any page that knows the totals.
 */
export function useRecordNetWorthSnapshot(
  assetsTotal: number,
  liabilitiesTotal: number,
  ready: boolean,
) {
  const { snapshots, isLoading, recordSnapshot } = useNetWorthSnapshots();
  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || isLoading) return;
    if (assetsTotal === 0 && liabilitiesTotal === 0) return;
    const key = `${assetsTotal}|${liabilitiesTotal}`;
    if (lastWritten.current === key) return;
    const latest = snapshots[snapshots.length - 1];
    const today = new Date().toISOString().slice(0, 10);
    const unchanged =
      latest &&
      latest.assets_total === assetsTotal &&
      latest.liabilities_total === liabilitiesTotal &&
      latest.snapshot_date === today;
    if (unchanged) return;
    lastWritten.current = key;
    void recordSnapshot(assetsTotal, liabilitiesTotal);
  }, [ready, isLoading, assetsTotal, liabilitiesTotal, snapshots, recordSnapshot]);

  return snapshots;
}
