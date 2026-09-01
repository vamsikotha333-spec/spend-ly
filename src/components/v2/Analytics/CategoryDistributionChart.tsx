import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction } from "@/types/transaction";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

type TxnType = "Expense" | "Savings" | "Income";

interface Props {
  transactions: Transaction[];
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(0, 84%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(190, 80%, 45%)",
  "hsl(330, 70%, 55%)",
  "hsl(60, 70%, 45%)",
];

const getType = (t: Transaction): TxnType =>
  (t.transaction_type as TxnType) || (t.type === "credit" ? "Income" : "Expense");

const META: Record<TxnType, { label: string; title: string }> = {
  Expense: { label: "Expenses", title: "Expense Distribution" },
  Savings: { label: "Savings", title: "Savings Distribution" },
  Income: { label: "Income", title: "Income Sources" },
};

export function CategoryDistributionChart({ transactions }: Props) {
  const [type, setType] = useState<TxnType>("Expense");

  const data = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => getType(t) === type)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [transactions, type]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="p-4 md:p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">{META[type].title}</h3>
        </div>
        <Tabs value={type} onValueChange={(v) => setType(v as TxnType)}>
          <TabsList className="h-8">
            <TabsTrigger value="Expense" className="text-xs h-6 px-2.5">Expenses</TabsTrigger>
            <TabsTrigger value="Savings" className="text-xs h-6 px-2.5">Savings</TabsTrigger>
            <TabsTrigger value="Income" className="text-xs h-6 px-2.5">Income</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {data.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-10">
          No {META[type].label.toLowerCase()} recorded in the selected period.
        </p>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                animationDuration={600}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 gap-1.5 w-full lg:max-w-xs">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate flex-1">{d.name}</span>
                <span className="font-semibold tabular-nums">
                  ₹{Math.round(d.value).toLocaleString("en-IN")}
                </span>
                <span className="text-muted-foreground tabular-nums w-9 text-right">
                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
