import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { eachMonthOfInterval, isSameMonth, format, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const now = new Date();
  const start = subMonths(now, 5);
  const months = eachMonthOfInterval({ start, end: now });

  const data = months.map((month) => {
    const mt = transactions.filter((t) => isSameMonth(t.date, month));
    return {
      month: format(month, "MMM"),
      Income: mt.filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Income").reduce((s, t) => s + t.amount, 0),
      Expenses: mt.filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Expense").reduce((s, t) => s + t.amount, 0),
      Savings: mt.filter((t) => t.transaction_type === "Savings").reduce((s, t) => s + t.amount, 0),
    };
  });

  const hasData = data.some(d => d.Income > 0 || d.Expenses > 0 || d.Savings > 0);

  return (
    <Card className="p-6 shadow-soft animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Income vs Expenses vs Savings</h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data available for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              formatter={(value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              animationDuration={300}
            />
            <Legend />
            <Bar dataKey="Income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" />
            <Bar dataKey="Expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" animationBegin={100} />
            <Bar dataKey="Savings" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
