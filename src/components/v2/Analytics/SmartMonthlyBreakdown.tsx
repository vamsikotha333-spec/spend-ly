import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/transaction";
import { format, isSameMonth, subMonths, eachMonthOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, PiggyBank, Flame, ArrowDown,
  Lightbulb, BarChart3, ArrowUpRight, ArrowDownRight, ToggleLeft,
} from "lucide-react";

interface SmartMonthlyBreakdownProps {
  transactions: Transaction[];
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function getBarColor(pct: number): string {
  if (pct >= 40) return "bg-destructive";
  if (pct >= 15) return "bg-warning";
  return "bg-success";
}

function getBarBg(pct: number): string {
  if (pct >= 40) return "bg-destructive/15";
  if (pct >= 15) return "bg-warning/15";
  return "bg-success/15";
}

export function SmartMonthlyBreakdown({ transactions }: SmartMonthlyBreakdownProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(now, "yyyy-MM"));
  const [showPct, setShowPct] = useState(false);

  const months = useMemo(() => {
    const start = new Date(2025, 9, 1);
    const end = new Date(2026, 11, 31);
    return eachMonthOfInterval({ start, end }).reverse().map((d) => ({
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy"),
      date: d,
    }));
  }, []);

  const selectedDate = new Date(selectedMonth + "-01");
  const prevDate = subMonths(selectedDate, 1);

  const monthTxns = useMemo(
    () => transactions.filter((t) => isSameMonth(t.date, selectedDate)),
    [transactions, selectedMonth]
  );
  const prevTxns = useMemo(
    () => transactions.filter((t) => isSameMonth(t.date, prevDate)),
    [transactions, selectedMonth]
  );

  const income = monthTxns.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
  const savings = monthTxns.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0";

  const prevExpenses: Record<string, number> = {};
  prevTxns.filter((t) => getType(t) === "Expense").forEach((t) => {
    prevExpenses[t.category] = (prevExpenses[t.category] || 0) + t.amount;
  });

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.filter((t) => getType(t) === "Expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => {
        const pct = expenses > 0 ? (amount / expenses) * 100 : 0;
        const prevAmt = prevExpenses[category] || 0;
        const change = prevAmt > 0 ? ((amount - prevAmt) / prevAmt) * 100 : null;
        return { category, amount, pct, change };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxns, expenses]);

  const highest = categoryBreakdown[0];
  const lowest = categoryBreakdown[categoryBreakdown.length - 1];

  const fmtAmt = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Smart Monthly Breakdown
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPct(!showPct)}
            className="text-xs"
          >
            <ToggleLeft className="h-3.5 w-3.5 mr-1" />
            {showPct ? "Show ₹" : "Show %"}
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {monthTxns.length === 0 ? (
        <Card className="p-12 text-center shadow-soft">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No data available</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            No transactions found for {format(selectedDate, "MMMM yyyy")}
          </p>
        </Card>
      ) : (
        <>
          {/* Total Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationFillMode: "both" }}>
            {[
              { label: "Total Income", value: income, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
              { label: "Total Expenses", value: expenses, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
              { label: "Total Savings", value: savings, icon: PiggyBank, color: "text-info", bg: "bg-info/10" },
              { label: "Savings Rate", value: savingsRate, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", suffix: "%" },
            ].map((item, i) => (
              <Card
                key={item.label}
                className="p-4 shadow-soft animate-slide-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-2 rounded-lg", item.bg)}>
                    <item.icon className={cn("h-4 w-4", item.color)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn("text-xl font-bold tabular-nums", item.color)}>
                  {item.suffix ? `${item.value}%` : fmtAmt(item.value as number)}
                </p>
              </Card>
            ))}
          </div>

          {/* Category Breakdown */}
          <Card className="p-5 shadow-soft animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Category Breakdown
            </h3>
            <div className="space-y-4">
              {categoryBreakdown.map((item, i) => (
                <div
                  key={item.category}
                  className="animate-slide-up"
                  style={{ animationDelay: `${300 + i * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="flex items-center gap-2">
                      {item.change !== null && (
                        <span className={cn(
                          "text-xs font-medium flex items-center gap-0.5",
                          item.change > 0 ? "text-destructive" : "text-success"
                        )}>
                          {item.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(item.change).toFixed(0)}%
                        </span>
                      )}
                      <span className="text-sm font-semibold tabular-nums">
                        {showPct ? `${item.pct.toFixed(1)}%` : fmtAmt(item.amount)}
                      </span>
                    </div>
                  </div>
                  <div className={cn("h-3 rounded-full overflow-hidden", getBarBg(item.pct))}>
                    <div
                      className={cn("h-full rounded-full transition-all duration-700 ease-out", getBarColor(item.pct))}
                      style={{ width: `${Math.max(item.pct, 2)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                    {item.pct.toFixed(1)}% of expenses
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
            {highest && (
              <Card className="p-4 shadow-soft border-l-4 border-l-destructive">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Highest Spending</span>
                </div>
                <p className="font-semibold text-sm">{highest.category}</p>
                <p className="text-lg font-bold tabular-nums text-destructive">
                  {fmtAmt(highest.amount)} <span className="text-xs font-normal text-muted-foreground">({highest.pct.toFixed(0)}%)</span>
                </p>
              </Card>
            )}
            {lowest && categoryBreakdown.length > 1 && (
              <Card className="p-4 shadow-soft border-l-4 border-l-success">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown className="h-4 w-4 text-success" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Lowest Spending</span>
                </div>
                <p className="font-semibold text-sm">{lowest.category}</p>
                <p className="text-lg font-bold tabular-nums text-success">
                  {fmtAmt(lowest.amount)} <span className="text-xs font-normal text-muted-foreground">({lowest.pct.toFixed(0)}%)</span>
                </p>
              </Card>
            )}
            {highest && (
              <Card className="p-4 shadow-soft border-l-4 border-l-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Insight</span>
                </div>
                <p className="text-sm leading-relaxed">
                  {highest.category} takes <strong>{highest.pct.toFixed(0)}%</strong> of your expenses
                  {highest.pct > 50
                    ? " – consider optimizing if possible"
                    : highest.pct > 30
                    ? " – this is a significant portion"
                    : " – spending looks balanced"}
                </p>
              </Card>
            )}
          </div>

          {/* Month-over-month comparison */}
          {categoryBreakdown.some((c) => c.change !== null) && (
            <Card className="p-5 shadow-soft animate-slide-up" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                vs {format(prevDate, "MMMM yyyy")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryBreakdown
                  .filter((c) => c.change !== null && Math.abs(c.change!) > 5)
                  .slice(0, 6)
                  .map((item) => (
                    <div key={item.category} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={cn(
                        "p-1.5 rounded-md",
                        item.change! > 0 ? "bg-destructive/10" : "bg-success/10"
                      )}>
                        {item.change! > 0
                          ? <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                          : <ArrowDownRight className="h-3.5 w-3.5 text-success" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.category}</p>
                        <p className={cn(
                          "text-xs font-semibold",
                          item.change! > 0 ? "text-destructive" : "text-success"
                        )}>
                          {item.change! > 0 ? "Increased" : "Decreased"} by {Math.abs(item.change!).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
