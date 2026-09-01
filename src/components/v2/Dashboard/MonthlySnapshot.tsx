import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { isSameMonth } from "date-fns";
import { CalendarDays, TrendingUp, Tag } from "lucide-react";

interface MonthlySnapshotProps {
  transactions: Transaction[];
}

export function MonthlySnapshot({ transactions }: MonthlySnapshotProps) {
  const now = new Date();
  const thisMonth = transactions.filter((t) => isSameMonth(t.date, now));

  const income = thisMonth.filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Income").reduce((s, t) => s + t.amount, 0);
  const expenses = thisMonth.filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Expense").reduce((s, t) => s + t.amount, 0);
  const savings = thisMonth.filter((t) => t.transaction_type === "Savings").reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0.0";

  const catMap: Record<string, number> = {};
  thisMonth.filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Expense")
    .forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const topCategory = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0];

  const items = [
    { label: "Spent", value: `₹${expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: CalendarDays, color: "bg-destructive/10 text-destructive" },
    { label: "Savings Rate", value: `${savingsRate}%`, icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: "Top Category", value: topCategory ? topCategory[0] : "N/A", icon: Tag, color: "bg-warning/10 text-warning", isSmall: true },
  ];

  return (
    <Card className="p-6 shadow-soft animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">This Month's Snapshot</h3>
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
