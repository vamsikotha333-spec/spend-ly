import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useAssets } from "@/hooks/useAssets";
import { useInvestments, INVESTMENT_CATEGORIES } from "@/hooks/useInvestments";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#a855f7", "#ef4444", "#0ea5e9", "#64748b"];

const ASSET_LABELS: Record<string, string> = {
  cash: "Cash", bank: "Bank", investment: "Investment", gold: "Gold", other: "Other",
};

export default function AssetAllocation() {
  const { assets, total: assetsTotal } = useAssets();
  const { investments, totalCurrent } = useInvestments();

  const byAssetType = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((a) => map.set(a.type, (map.get(a.type) || 0) + Number(a.value || 0)));
    return Array.from(map.entries()).map(([type, value]) => ({
      name: ASSET_LABELS[type] || type, value,
    })).filter((d) => d.value > 0);
  }, [assets]);

  const byInvestmentCategory = useMemo(() => {
    const map = new Map<string, number>();
    investments.forEach((i) => map.set(i.category, (map.get(i.category) || 0) + Number(i.current_value || 0)));
    return Array.from(map.entries()).map(([cat, value]) => ({
      name: INVESTMENT_CATEGORIES.find((c) => c.value === cat)?.label || cat, value,
    })).filter((d) => d.value > 0);
  }, [investments]);

  const empty = byAssetType.length === 0 && byInvestmentCategory.length === 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Asset Allocation</h1>
            <p className="text-xs text-muted-foreground">See how your wealth is distributed across asset types and investments.</p>
          </div>
        </div>

        {empty ? (
          <Card className="p-10 text-center">
            <PieIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Not enough data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add assets or investments to see your allocation.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 md:p-5">
              <h2 className="text-base font-bold mb-2">By Asset Type</h2>
              <p className="text-xs text-muted-foreground mb-3">Total: {fmt(assetsTotal)}</p>
              {byAssetType.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets recorded.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byAssetType} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={2}>
                        {byAssetType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-4 md:p-5">
              <h2 className="text-base font-bold mb-2">By Investment Category</h2>
              <p className="text-xs text-muted-foreground mb-3">Total: {fmt(totalCurrent)}</p>
              {byInvestmentCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No investments recorded.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byInvestmentCategory} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={2}>
                        {byInvestmentCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
