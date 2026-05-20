import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SpendingDonutChartProps {
  transactions: Transaction[];
}

const COLORS = [
  "hsl(0, 84%, 60%)", "hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)", "hsl(190, 80%, 45%)",
  "hsl(330, 70%, 55%)", "hsl(60, 70%, 45%)",
];

export function SpendingDonutChart({ transactions }: SpendingDonutChartProps) {
  const expenses = transactions.filter(
    (t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Expense"
  );

  const catMap: Record<string, number> = {};
  expenses.forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });

  const data = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.replace(/^[^\w]*\s/, ""), value }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="p-6 shadow-medium border-0 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Spending by Category</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-muted-foreground">No expense data available</div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                animationDuration={200}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 w-full lg:w-auto">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs animate-fade-in" style={{ animationDelay: `${400 + i * 50}ms`, animationFillMode: "both" }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate max-w-[140px]">{d.name}</span>
                <span className="ml-auto font-medium tabular-nums">{((d.value / total) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
