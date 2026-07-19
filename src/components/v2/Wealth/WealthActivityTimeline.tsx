import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Flag, ShieldCheck, Wallet, Activity } from "lucide-react";
import { format } from "date-fns";
import { useInvestments } from "@/hooks/useInvestments";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { useAssets } from "@/hooks/useAssets";

type ActivityItem = {
  id: string;
  type: "investment" | "goal" | "insurance" | "asset";
  title: string;
  subtitle: string;
  date: Date;
};

const META: Record<ActivityItem["type"], { icon: React.ElementType; bg: string; label: string }> = {
  investment: { icon: LineChart, bg: "bg-primary/10 text-primary", label: "Investment" },
  goal: { icon: Flag, bg: "bg-info/10 text-info", label: "Goal" },
  insurance: { icon: ShieldCheck, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Insurance" },
  asset: { icon: Wallet, bg: "bg-success/10 text-success", label: "Asset" },
};

export function WealthActivityTimeline() {
  const { investments } = useInvestments();
  const { goals } = useFinancialGoals();
  const { policies } = useInsurancePolicies();
  const { assets } = useAssets();

  const items = useMemo<ActivityItem[]>(() => {
    const out: ActivityItem[] = [];
    for (const inv of investments) out.push({
      id: `inv-${inv.id}`, type: "investment", title: inv.name,
      subtitle: `Invested ₹${Number(inv.invested_amount).toLocaleString("en-IN")}`,
      date: new Date(inv.created_at),
    });
    for (const g of goals) out.push({
      id: `goal-${g.id}`, type: "goal", title: g.name,
      subtitle: `Target ₹${Number(g.target_amount).toLocaleString("en-IN")}`,
      date: new Date(g.created_at),
    });
    for (const p of policies) out.push({
      id: `ins-${p.id}`, type: "insurance", title: p.name,
      subtitle: `${p.type.replace(/_/g, " ")} • ₹${Number(p.coverage_amount).toLocaleString("en-IN")} cover`,
      date: new Date(p.created_at),
    });
    for (const a of assets) out.push({
      id: `asset-${a.id}`, type: "asset", title: a.name,
      subtitle: `${a.type} • ₹${Number(a.value).toLocaleString("en-IN")}`,
      date: new Date(a.created_at),
    });
    return out.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [investments, goals, policies, assets]);

  return (
    <Card className="p-4 md:p-5 border shadow-medium">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">Recent Activity</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet — add an asset, investment, goal, or policy to see activity here.</p>
      ) : (
        <ol className="relative border-l border-border/60 ml-2 space-y-3">
          {items.map((it) => {
            const meta = META[it.type];
            const Icon = meta.icon;
            return (
              <li key={it.id} className="pl-4 relative">
                <span className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center ${meta.bg} ring-2 ring-background`}>
                  <Icon className="h-2.5 w-2.5" />
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{it.title}</p>
                    <p className="text-[11px] text-muted-foreground">{meta.label} • {it.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                    {format(it.date, "d MMM")}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
