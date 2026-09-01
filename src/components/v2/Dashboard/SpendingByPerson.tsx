import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { eachMonthOfInterval, isSameMonth, format, subMonths } from "date-fns";


interface SpendingByPersonProps {
  transactions: Transaction[];
}

const PALETTE = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(190, 80%, 45%)",
  "hsl(330, 70%, 55%)",
  "hsl(60, 70%, 45%)",
  "hsl(0, 70%, 55%)",
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

export function SpendingByPerson({ transactions }: SpendingByPersonProps) {
  const [tab, setTab] = useState("overview");

  const expenses = transactions.filter((t) => getType(t) === "Expense");

  // Overview data
  const personMap: Record<string, number> = {};
  expenses.forEach((t) => {
    const key = t.applicable_to || "Central";
    personMap[key] = (personMap[key] || 0) + t.amount;
  });
  const total = Object.values(personMap).reduce((s, v) => s + v, 0);
  const pieData = Object.entries(personMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Monthly trend data
  const now = new Date();
  const start = subMonths(now, 5);
  const months = eachMonthOfInterval({ start, end: now });

  // Ranked by actual spend (highest first) — rankings are always derived, never hardcoded.
  const activePeople = pieData.map((d) => d.name);
  const monthlyData = months.map((month) => {
    const mt = expenses.filter((t) => isSameMonth(t.date, month));
    const row: Record<string, any> = { month: format(month, "MMM") };
    activePeople.forEach((p) => {
      row[p] = mt.filter((t) => (t.applicable_to || "Central") === p).reduce((s, t) => s + t.amount, 0);
    });
    return row;
  });

  // Top categories per person
  const personCategories: Record<string, { category: string; amount: number }[]> = {};
  activePeople.forEach((person) => {
    const catMap: Record<string, number> = {};
    expenses
      .filter((t) => (t.applicable_to || "Central") === person)
      .forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    personCategories[person] = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
  });

  // Highest spender
  const highest = pieData[0];

  return (
    <Card className="p-6 shadow-soft animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Spending by Applicable To
      </h3>

      {pieData.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No expense data available</p>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="trend" className="text-xs">Monthly Trend</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
          </TabsList>

          {/* Overview - Donut chart + breakdown */}
          <TabsContent value="overview" className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" animationDuration={800}>
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={colorFor(d.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map(({ name, value }, i) => {
                const pct = total > 0 ? (value / total) * 100 : 0;
                return (
                  <div key={name} className="space-y-1 animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                    <div className="flex items-center justify-between text-sm gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold tabular-nums text-muted-foreground shrink-0">#{i + 1}</span>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorFor(name) }} />
                        <span className="font-medium truncate">{name}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: colorFor(name) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Monthly Trend - Stacked bar chart */}
          <TabsContent value="trend">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, name]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {activePeople.map((person, i) => (
                  <Bar
                    key={person}
                    dataKey={person}
                    stackId="a"
                    fill={colorFor(person)}
                    animationDuration={800}
                    animationBegin={i * 100}
                    radius={i === activePeople.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="space-y-4">
            {/* Highest spender callout */}
            {highest && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 animate-scale-in">
                <p className="text-sm font-semibold text-foreground">
                  🏆 Highest Spender: <span className="text-warning">{highest.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ₹{highest.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({total > 0 ? ((highest.value / total) * 100).toFixed(0) : 0}% of total expenses)
                </p>
              </div>
            )}

            {/* Top categories per person */}
            {activePeople.map((person, pi) => (
              <div
                key={person}
                className="animate-slide-up"
                style={{ animationDelay: `${pi * 80}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorFor(person) }} />
                  <p className="text-sm font-semibold">{person}</p>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    Total: ₹{(personMap[person] || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-1.5 pl-5">
                  {(personCategories[person] || []).map((cat, ci) => {
                    const catPct = personMap[person] > 0 ? (cat.amount / personMap[person]) * 100 : 0;
                    return (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[180px] text-muted-foreground">{ci + 1}. {cat.category}</span>
                        <span className="tabular-nums font-medium">₹{cat.amount.toLocaleString("en-IN")} <span className="text-muted-foreground">({catPct.toFixed(0)}%)</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
