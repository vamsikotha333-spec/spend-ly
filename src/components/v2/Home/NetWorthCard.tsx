import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Wallet, ArrowRight, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { useRecordNetWorthSnapshot } from "@/hooks/useNetWorthSnapshots";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { Sparkline } from "@/components/common/Sparkline";
import { Button } from "@/components/ui/button";
import { AssetDialog, LiabilityDialog, assetTypeMeta } from "@/components/wealth/AssetLiabilityDialogs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatCompactINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const TYPE_FILL: Record<string, string> = {
  cash: "bg-success",
  bank: "bg-info",
  investment: "bg-primary",
  gold: "bg-warning",
  real_estate: "bg-muted-foreground",
  other: "bg-muted-foreground/60",
};

export function NetWorthCard() {
  const { assets, total: assetsTotal, addAsset, isLoading: aLoading } = useAssets();
  const { liabilities, total: liabilitiesTotal, addLiability, isLoading: lLoading } = useLiabilities();
  const ready = !aLoading && !lLoading;
  const snapshots = useRecordNetWorthSnapshot(assetsTotal, liabilitiesTotal, ready);

  const [assetOpen, setAssetOpen] = useState(false);
  const [liabOpen, setLiabOpen] = useState(false);

  const netWorth = assetsTotal - liabilitiesTotal;
  const positive = netWorth >= 0;

  const grouped: Record<string, number> = {};
  for (const a of assets) grouped[a.type] = (grouped[a.type] || 0) + Number(a.value || 0);
  const totalForBreakdown = Object.values(grouped).reduce((s, v) => s + v, 0);
  const breakdown = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

  const isEmpty = ready && assets.length === 0 && liabilities.length === 0;
  const trendValues = snapshots.map((s) => s.net_worth);

  return (
    <Card className="p-4 md:p-5 border shadow-soft hover-lift">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Net Worth</p>
            <p className={cn("text-xl md:text-2xl font-bold tabular-nums tracking-tight", positive ? "text-success" : "text-destructive")}>
              {netWorth < 0 ? "-" : ""}
              <AnimatedCounter value={Math.abs(netWorth)} prefix="₹" />
            </p>
          </div>
        </div>
        <Link
          to="/wealth/net-worth"
          className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-foreground font-medium">Track your wealth</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your cash, bank, investments, gold, and loans to see net worth.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button size="sm" onClick={() => setAssetOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add asset
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLiabOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add liability
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-success/10 p-2.5 border border-success/20">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-success/80 uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" /> Assets
              </div>
              <p className="text-sm font-bold text-success tabular-nums mt-0.5">{formatCompactINR(assetsTotal)}</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-2.5 border border-destructive/20">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-destructive/80 uppercase tracking-wider">
                <TrendingDown className="h-3 w-3" /> Liabilities
              </div>
              <p className="text-sm font-bold text-destructive tabular-nums mt-0.5">{formatCompactINR(liabilitiesTotal)}</p>
            </div>
          </div>

          {trendValues.length > 1 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Trend</p>
              <Sparkline data={trendValues} className={positive ? "text-success" : "text-destructive"} />
            </div>
          )}

          {totalForBreakdown > 0 && (
            <>
              <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
                {breakdown.map(([type, val]) => (
                  <div
                    key={type}
                    className={cn("h-full", TYPE_FILL[type] || TYPE_FILL.other)}
                    style={{ width: `${(val / totalForBreakdown) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 space-y-1">
                {breakdown.map(([type, val]) => {
                  const meta = assetTypeMeta(type);
                  const pct = (val / totalForBreakdown) * 100;
                  return (
                    <div key={type} className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span className={cn("w-2 h-2 rounded-full", TYPE_FILL[type] || TYPE_FILL.other)} />
                        <meta.Icon className="h-3 w-3" />
                        <span className="font-medium text-foreground">{meta.label}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCompactINR(val)} <span className="text-foreground font-medium">{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <AssetDialog
        open={assetOpen}
        onOpenChange={setAssetOpen}
        onSave={async (data) => { await addAsset(data); toast.success("Asset added"); }}
      />
      <LiabilityDialog
        open={liabOpen}
        onOpenChange={setLiabOpen}
        onSave={async (data) => { await addLiability(data); toast.success("Liability added"); }}
      />
    </Card>
  );
}
