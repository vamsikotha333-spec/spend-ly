import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { useInvestments } from "@/hooks/useInvestments";
import { Scale, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const ASSET_LABELS: Record<string, string> = {
  cash: "Cash", bank: "Bank", investment: "Investment", gold: "Gold", other: "Other",
};
const LIAB_LABELS: Record<string, string> = {
  loan: "Loan", credit_card: "Credit Card", mortgage: "Mortgage", other: "Other",
};

export default function NetWorth() {
  const { assets, total: assetsTotal } = useAssets();
  const { liabilities, total: liabTotal } = useLiabilities();
  const { totalCurrent: investmentsCurrent } = useInvestments();

  const netWorth = assetsTotal - liabTotal;
  const positive = netWorth >= 0;

  const assetBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((a) => map.set(a.type, (map.get(a.type) || 0) + Number(a.value || 0)));
    return Array.from(map.entries()).map(([type, value]) => ({ type, value }));
  }, [assets]);

  const liabBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    liabilities.forEach((l) => map.set(l.type, (map.get(l.type) || 0) + Number(l.amount || 0)));
    return Array.from(map.entries()).map(([type, value]) => ({ type, value }));
  }, [liabilities]);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Net Worth</h1>
            <p className="text-xs text-muted-foreground">Assets minus liabilities, based on what you've recorded.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Total Assets</p>
            </div>
            <p className="text-2xl font-bold text-success tabular-nums mt-1">{fmt(assetsTotal)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <TrendingDown className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Total Liabilities</p>
            </div>
            <p className="text-2xl font-bold text-destructive tabular-nums mt-1">{fmt(liabTotal)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-primary">
              <Scale className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Net Worth</p>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums mt-1", positive ? "text-success" : "text-destructive")}>{fmt(netWorth)}</p>
          </Card>
        </div>

        <Card className="p-4 md:p-5">
          <p className="text-xs text-muted-foreground">
            Net Worth uses your recorded Assets and Liabilities. Investments are tracked separately —
            include them here by adding an Asset of type <span className="font-medium">Investment</span> with the
            current portfolio value. Currently your investments total <span className="font-medium">{fmt(investmentsCurrent)}</span>.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Assets Breakdown</h2>
              <Link to="/wealth"><Button variant="outline" size="sm">Manage</Button></Link>
            </div>
            {assetBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {assetBreakdown.map((a) => {
                  const pct = assetsTotal > 0 ? (a.value / assetsTotal) * 100 : 0;
                  return (
                    <div key={a.type}>
                      <div className="flex items-center justify-between text-sm">
                        <span>{ASSET_LABELS[a.type] || a.type}</span>
                        <span className="tabular-nums font-medium">{fmt(a.value)} <span className="text-muted-foreground text-xs">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted mt-1">
                        <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Liabilities Breakdown</h2>
              <Link to="/wealth"><Button variant="outline" size="sm">Manage</Button></Link>
            </div>
            {liabBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No liabilities recorded.</p>
            ) : (
              <div className="space-y-2">
                {liabBreakdown.map((l) => {
                  const pct = liabTotal > 0 ? (l.value / liabTotal) * 100 : 0;
                  return (
                    <div key={l.type}>
                      <div className="flex items-center justify-between text-sm">
                        <span>{LIAB_LABELS[l.type] || l.type}</span>
                        <span className="tabular-nums font-medium">{fmt(l.value)} <span className="text-muted-foreground text-xs">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted mt-1">
                        <div className="h-full rounded-full bg-destructive" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
