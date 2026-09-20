import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAssets, Asset } from "@/hooks/useAssets";
import { useLiabilities, Liability } from "@/hooks/useLiabilities";
import { useRecordNetWorthSnapshot } from "@/hooks/useNetWorthSnapshots";
import { Scale, TrendingUp, TrendingDown, Plus, Pencil, Trash2, LineChart as LineChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AssetDialog, LiabilityDialog, assetTypeMeta, liabilityTypeMeta,
} from "@/components/wealth/AssetLiabilityDialogs";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function fmtAxis(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function NetWorth() {
  const { assets, total: assetsTotal, addAsset, updateAsset, deleteAsset, isLoading: aLoading } = useAssets();
  const { liabilities, total: liabTotal, addLiability, updateLiability, deleteLiability, isLoading: lLoading } = useLiabilities();

  const ready = !aLoading && !lLoading;
  const snapshots = useRecordNetWorthSnapshot(assetsTotal, liabTotal, ready);

  const [assetOpen, setAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [liabOpen, setLiabOpen] = useState(false);
  const [editingLiab, setEditingLiab] = useState<Liability | undefined>(undefined);

  const netWorth = assetsTotal - liabTotal;
  const positive = netWorth >= 0;
  const isEmpty = ready && assets.length === 0 && liabilities.length === 0;

  const assetBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((a) => map.set(a.type, (map.get(a.type) || 0) + Number(a.value || 0)));
    return Array.from(map.entries())
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const liabBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    liabilities.forEach((l) => map.set(l.type, (map.get(l.type) || 0) + Number(l.amount || 0)));
    return Array.from(map.entries())
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value);
  }, [liabilities]);

  const trend = useMemo(
    () =>
      snapshots.map((s) => ({
        date: new Date(s.snapshot_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        netWorth: s.net_worth,
      })),
    [snapshots],
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Net Worth</h1>
              <p className="text-xs text-muted-foreground">Assets minus liabilities, based on what you've recorded.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setEditingAsset(undefined); setAssetOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Asset
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditingLiab(undefined); setLiabOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Liability
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 border shadow-soft">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Total Assets</p>
            </div>
            <p className="text-2xl font-bold text-success tabular-nums mt-1">{fmt(assetsTotal)}</p>
          </Card>
          <Card className="p-4 border shadow-soft">
            <div className="flex items-center gap-2 text-destructive">
              <TrendingDown className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Total Liabilities</p>
            </div>
            <p className="text-2xl font-bold text-destructive tabular-nums mt-1">{fmt(liabTotal)}</p>
          </Card>
          <Card className="p-4 border shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <Scale className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Net Worth</p>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums mt-1", positive ? "text-success" : "text-destructive")}>{fmt(netWorth)}</p>
          </Card>
        </div>

        {/* Trend */}
        <Card className="p-4 md:p-5 border shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <LineChartIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-bold">Net Worth Trend</h2>
          </div>
          {trend.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              {trend.length === 0
                ? "A snapshot is saved automatically whenever your assets or liabilities change."
                : "One snapshot recorded so far — the chart appears once values change again."}
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={60} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Line type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {isEmpty && (
          <Card className="p-6 text-center border border-dashed shadow-soft">
            <p className="text-sm font-medium">Track your wealth</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your cash, bank, investments, gold, real estate and loans to see net worth.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Assets */}
          <Card className="p-4 md:p-5 border shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Assets</h2>
              <Button variant="outline" size="sm" onClick={() => { setEditingAsset(undefined); setAssetOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets recorded yet.</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {assetBreakdown.map((a) => {
                    const meta = assetTypeMeta(a.type);
                    const pct = assetsTotal > 0 ? (a.value / assetsTotal) * 100 : 0;
                    return (
                      <div key={a.type}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="inline-flex items-center gap-2"><meta.Icon className="h-3.5 w-3.5 text-muted-foreground" />{meta.label}</span>
                          <span className="tabular-nums font-medium">{fmt(a.value)} <span className="text-muted-foreground text-xs">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted mt-1">
                          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="divide-y border-t pt-1">
                  {assets.map((a) => {
                    const meta = assetTypeMeta(a.type);
                    return (
                      <div key={a.id} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                            <meta.Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{a.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {meta.label}{a.member ? ` • ${a.member}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <p className="text-sm font-bold text-success tabular-nums mr-1">{fmt(Number(a.value))}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAsset(a); setAssetOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            if (confirm(`Delete "${a.name}"?`)) {
                              try { await deleteAsset(a.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message || "Failed"); }
                            }
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* Liabilities */}
          <Card className="p-4 md:p-5 border shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Liabilities</h2>
              <Button variant="outline" size="sm" onClick={() => { setEditingLiab(undefined); setLiabOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {liabilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No liabilities recorded.</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {liabBreakdown.map((l) => {
                    const meta = liabilityTypeMeta(l.type);
                    const pct = liabTotal > 0 ? (l.value / liabTotal) * 100 : 0;
                    return (
                      <div key={l.type}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="inline-flex items-center gap-2"><meta.Icon className="h-3.5 w-3.5 text-muted-foreground" />{meta.label}</span>
                          <span className="tabular-nums font-medium">{fmt(l.value)} <span className="text-muted-foreground text-xs">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted mt-1">
                          <div className="h-full rounded-full bg-destructive" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="divide-y border-t pt-1">
                  {liabilities.map((l) => {
                    const meta = liabilityTypeMeta(l.type);
                    return (
                      <div key={l.id} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                            <meta.Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{l.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {meta.label}
                              {l.interest_rate != null ? ` • ${l.interest_rate}% p.a.` : ""}
                              {l.member ? ` • ${l.member}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <p className="text-sm font-bold text-destructive tabular-nums mr-1">{fmt(Number(l.amount))}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLiab(l); setLiabOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            if (confirm(`Delete "${l.name}"?`)) {
                              try { await deleteLiability(l.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message || "Failed"); }
                            }
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <AssetDialog
        open={assetOpen}
        onOpenChange={setAssetOpen}
        initial={editingAsset}
        onSave={async (data) => {
          if (editingAsset) { await updateAsset(editingAsset.id, data); toast.success("Asset updated"); }
          else { await addAsset(data); toast.success("Asset added"); }
        }}
      />
      <LiabilityDialog
        open={liabOpen}
        onOpenChange={setLiabOpen}
        initial={editingLiab}
        onSave={async (data) => {
          if (editingLiab) { await updateLiability(editingLiab.id, data); toast.success("Liability updated"); }
          else { await addLiability(data); toast.success("Liability added"); }
        }}
      />
    </div>
  );
}
