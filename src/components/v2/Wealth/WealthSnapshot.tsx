import { Card } from "@/components/ui/card";
import { Scale, TrendingUp, TrendingDown, LineChart, Flag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

interface Props {
  netWorth: number;
  assets: number;
  liabilities: number;
  investments: number;
  goalsSaved: number;
  goalsTarget: number;
  coverage: number;
}

export function WealthSnapshot({
  netWorth, assets, liabilities, investments, goalsSaved, goalsTarget, coverage,
}: Props) {
  const goalPct = goalsTarget > 0 ? Math.round((goalsSaved / goalsTarget) * 100) : 0;
  const items = [
    { icon: Scale, label: "Net Worth", value: fmt(netWorth), tone: netWorth >= 0 ? "text-success" : "text-destructive", accent: "bg-primary/10 text-primary" },
    { icon: TrendingUp, label: "Assets", value: fmt(assets), tone: "text-success", accent: "bg-success/10 text-success" },
    { icon: TrendingDown, label: "Liabilities", value: fmt(liabilities), tone: "text-destructive", accent: "bg-destructive/10 text-destructive" },
    { icon: LineChart, label: "Investments", value: fmt(investments), tone: "text-primary", accent: "bg-primary/10 text-primary" },
    { icon: Flag, label: "Goal Progress", value: `${goalPct}%`, sub: `${fmt(goalsSaved)} / ${fmt(goalsTarget)}`, tone: "text-info", accent: "bg-info/10 text-info" },
    { icon: ShieldCheck, label: "Insurance", value: fmt(coverage), sub: "total coverage", tone: "text-foreground", accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="p-3 md:p-4 border shadow-soft hover-lift transition">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", it.accent)}>
            <it.icon className="h-4 w-4" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{it.label}</p>
          <p className={cn("text-lg font-bold tabular-nums mt-0.5", it.tone)}>{it.value}</p>
          {"sub" in it && it.sub && (
            <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5 truncate">{it.sub}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
