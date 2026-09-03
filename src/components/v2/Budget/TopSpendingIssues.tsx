import { Card } from "@/components/ui/card";
import { Flame, AlertTriangle } from "lucide-react";

interface BudgetComparison {
  category: string;
  budget_amount: number;
  actual: number;
  pct: number;
  status: "over" | "warning" | "good";
}

export function TopSpendingIssues({ comparison }: { comparison: BudgetComparison[] }) {
  const issues = comparison
    .filter((c) => c.status === "over" || c.status === "warning")
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  if (issues.length === 0) return null;

  return (
    <Card className="p-4 shadow-soft">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5"><Flame className="h-4 w-4 text-warning" /> Top Spending Issues</h3>
      <div className="space-y-2">
        {issues.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-2">
              {item.status === "over" ? <Flame className="h-4 w-4 text-destructive" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
              <span className="font-medium text-foreground">{item.category}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              item.status === "over"
                ? "bg-destructive/10 text-destructive"
                : "bg-warning/10 text-warning"
            }`}>
              {item.pct.toFixed(0)}% — {item.status === "over" ? "Over budget" : "Near limit"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
