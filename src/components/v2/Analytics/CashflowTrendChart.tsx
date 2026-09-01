import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { eachMonthOfInterval, isSameMonth, format, startOfMonth, endOfMonth } from "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { LineChart as LineIcon } from "lucide-react";

interface Props {
  transactions: Transaction[];
}

const getType = (t: Transaction) =>
  t.transaction_type || (t.type === "credit" ? "Income" : "Expense");

export function CashflowTrendChart({ transactions }: Props) {
  const data = useMemo(() => {
    if (transactions.length === 0) return [];
    const min = transactions.reduce((m, t) => (t.date < m ? t.date : m), transactions[0].date);
    const max = transactions.reduce((m, t) => (t.date > m ? t.date : m), transactions[0].date);
    const months = eachMonthOfInterval({ start: startOfMonth(min), end: endOfMonth(max) });
    return months
      .map((month) => {
        const mt = transactions.filter((t) => isSameMonth(t.date, month));
        const income = mt.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
        const expenses = mt.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
        const savings = mt.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);
        const net = income - expenses - savings;
        const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
        return {
          month: format(month, "MMM ''yy"),
          Income: income,
          Expenses: expenses,
          Savings: savings,
          Net: net,
          SavingsRate: savingsRate,
        };
      })
      .filter((m) => m.Income > 0 || m.Expenses > 0 || m.Savings > 0);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <Card className="p-6 shadow-soft text-center">
        <LineIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No cashflow data yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <LineIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Cashflow Trend</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">Income vs Expenses vs Savings · Net cashflow line</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Savings" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="Net"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
