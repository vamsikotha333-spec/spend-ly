import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { computeTotals, getTxType } from "@/lib/totals";
import { CalendarDays, TrendingUp, Tag } from "lucide-react";

interface MonthlySnapshotProps {
  transactions: Transaction[];
}

export function MonthlySnapshot({ transactions }: MonthlySnapshotProps) {
  // Already scoped to the selected period by the dashboard — never re-filter here.
  const scoped = transactions;
  const { expenses, savingsRate: rate } = computeTotals(scoped);
  const savingsRate = rate.toFixed(1);

  const catMap: Record<string, number> = {};
  scoped.filter((t) => getTxType(t) === "Expense")
    .forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const topCategory = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0];

  const items = [
    { label: "Spent", value: `₹${expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: CalendarDays, color: "bg-destructive/10 text-destructive" },
    { label: "Savings Rate", value: `${savingsRate}%`, icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: "Top Category", value: topCategory ? topCategory[0] : "N/A", icon: Tag, color: "bg-warning/10 text-warning", isSmall: true },
  ];

  return (
    <Card className="p-6 shadow-soft animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Snapshot</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 animate-scale-in" style={{ animationDelay: `${150 + i * 80}ms`, animationFillMode: "both" }}>
              <div className={`p-2.5 rounded-xl transition-transform duration-300 hover:scale-110 ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`font-bold tabular-nums transition-all duration-500 ${item.isSmall ? "text-sm truncate max-w-[150px]" : "text-lg"}`}>
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
