import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Wallet, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { cn } from "@/lib/utils";

function formatCompactINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  cash: { label: "Cash", emoji: "💵", color: "bg-emerald-500" },
  bank: { label: "Bank", emoji: "🏦", color: "bg-blue-500" },
  investment: { label: "Investments", emoji: "📈", color: "bg-violet-500" },
  gold: { label: "Gold", emoji: "🪙", color: "bg-amber-500" },
  other: { label: "Other", emoji: "📦", color: "bg-slate-500" },
};

export function NetWorthCard() {
  const { assets, total: assetsTotal, isLoading: aLoading } = useAssets();
  const { total: liabilitiesTotal, isLoading: lLoading } = useLiabilities();

  const netWorth = assetsTotal - liabilitiesTotal;
  const positive = netWorth >= 0;

  // Breakdown by asset type
  const grouped: Record<string, number> = {};
  for (const a of assets) grouped[a.type] = (grouped[a.type] || 0) + Number(a.value || 0);
  const totalForBreakdown = Object.values(grouped).reduce((s, v) => s + v, 0);

  const isEmpty = !aLoading && !lLoading && assets.length === 0 && liabilitiesTotal === 0;

  return (
    <Card className="p-4 md:p-5 border shadow-medium hover-lift">
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
          to="/wealth"
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
          <Link
            to="/wealth"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Add assets & liabilities <ArrowRight className="h-3 w-3" />
          </Link>
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

          {totalForBreakdown > 0 && (
            <>
              <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
                {Object.entries(grouped).map(([type, val]) => {
                  const pct = (val / totalForBreakdown) * 100;
                  const meta = TYPE_META[type] || TYPE_META.other;
                  return <div key={type} className={cn("h-full", meta.color)} style={{ width: `${pct}%` }} />;
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(grouped).map(([type, val]) => {
                  const meta = TYPE_META[type] || TYPE_META.other;
                  const pct = (val / totalForBreakdown) * 100;
                  return (
                    <div key={type} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className={cn("w-2 h-2 rounded-full", meta.color)} />
                      <span className="font-medium text-foreground">{meta.emoji} {meta.label}</span>
                      <span className="tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
