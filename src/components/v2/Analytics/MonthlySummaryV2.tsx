import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { format, eachMonthOfInterval, isSameMonth, getYear } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemberOptions } from "@/hooks/useMembers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface MonthlySummaryV2Props {
  transactions: Transaction[];
}

export function MonthlySummaryV2({ transactions }: MonthlySummaryV2Props) {
  const [paidByFilter, setPaidByFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const memberOptions = useMemberOptions(transactions);

  const allMonths = useMemo(() => {
    if (transactions.length === 0) return [];
    const min = transactions.reduce((m, t) => (t.date < m ? t.date : m), transactions[0].date);
    const max = transactions.reduce((m, t) => (t.date > m ? t.date : m), transactions[0].date);
    return eachMonthOfInterval({ start: new Date(min.getFullYear(), min.getMonth(), 1), end: max });
  }, [transactions]);

  const availableYears = useMemo(
    () => Array.from(new Set(allMonths.map((m) => getYear(m)))).sort(),
    [allMonths]
  );

  const visibleMonths = selectedYear === "all"
    ? allMonths
    : allMonths.filter((m) => getYear(m) === Number(selectedYear));
  const filteredTransactions = paidByFilter === "all"
    ? transactions
    : transactions.filter(t => (t.applicable_to || "Central") === paidByFilter);

  const monthlyData = useMemo(() => visibleMonths
    .map((month) => {
      const monthTransactions = filteredTransactions.filter((t) => isSameMonth(t.date, month));
      const income = monthTransactions
        .filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const savings = monthTransactions
        .filter((t) => t.transaction_type === "Savings")
        .reduce((sum, t) => sum + t.amount, 0);
      const profit = income - expenses;
      const savingsRate = income > 0 ? (savings / income) * 100 : 0;
      return {
        month: format(month, "MMM yyyy"),
        Income: income,
        Expenses: expenses,
        Savings: savings,
        "Profit/Loss": profit,
        SavingsRate: savingsRate,
      };
    })
    .filter((row) => row.Income > 0 || row.Expenses > 0 || row.Savings > 0),
    [visibleMonths, filteredTransactions]
  );

  const totals = monthlyData.reduce(
    (acc, row) => ({
      Income: acc.Income + row.Income,
      Expenses: acc.Expenses + row.Expenses,
      Savings: acc.Savings + row.Savings,
      "Profit/Loss": acc["Profit/Loss"] + row["Profit/Loss"],
    }),
    { Income: 0, Expenses: 0, Savings: 0, "Profit/Loss": 0 }
  );
  const totalSavingsRate = totals.Income > 0 ? (totals.Savings / totals.Income) * 100 : 0;

  const pctChange = (cur: number, prev: number): number | null => {
    if (prev === 0) return cur === 0 ? 0 : null;
    return ((cur - prev) / Math.abs(prev)) * 100;
  };

  const handleExport = () => {
    const csv = [
      ["Month", "Income", "Expenses", "Savings", "Profit/Loss", "Savings Rate %"],
      ...monthlyData.map((row) => [
        row.month,
        row.Income.toFixed(2),
        row.Expenses.toFixed(2),
        row.Savings.toFixed(2),
        row["Profit/Loss"].toFixed(2),
        row.SavingsRate.toFixed(1),
      ]),
    ].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintracker-summary-${paidByFilter}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const ChangeBadge = ({ change, invert = false }: { change: number | null; invert?: boolean }) => {
    if (change === null) return <span className="text-[10px] text-muted-foreground">New</span>;
    if (Math.abs(change) < 0.5) return <Minus className="h-3 w-3 text-muted-foreground inline" />;
    const isUp = change > 0;
    const isGood = invert ? !isUp : isUp;
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums",
        isGood ? "text-success" : "text-destructive"
      )}>
        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(change).toFixed(0)}%
      </span>
    );
  };

  return (
    <Card className="p-6 shadow-medium">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold">Monthly Summary</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paidByFilter} onValueChange={setPaidByFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {memberOptions.map((person) => (
                <SelectItem key={person} value={person}>{person}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Savings" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Profit/Loss" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Savings</TableHead>
              <TableHead className="text-right">Profit/Loss</TableHead>
              <TableHead className="text-right">Savings Rate</TableHead>
              <TableHead className="text-right">vs Prev</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.map((row, i) => {
              const prev = monthlyData[i - 1];
              const profitChange = prev ? pctChange(row["Profit/Loss"], prev["Profit/Loss"]) : null;
              return (
                <TableRow
                  key={row.month}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    row["Profit/Loss"] < 0 && "bg-destructive/5"
                  )}
                >
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right text-success tabular-nums">₹{row.Income.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-destructive tabular-nums">₹{row.Expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-info tabular-nums">₹{row.Savings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className={cn("text-right font-semibold tabular-nums", row["Profit/Loss"] >= 0 ? "text-success" : "text-destructive")}>
                    ₹{row["Profit/Loss"].toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{row.SavingsRate.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    {i === 0 ? <span className="text-[10px] text-muted-foreground">—</span> : <ChangeBadge change={profitChange} />}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="border-t-2 font-bold bg-muted/50">
              <TableCell>Total</TableCell>
              <TableCell className="text-right text-success tabular-nums">₹{totals.Income.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right text-destructive tabular-nums">₹{totals.Expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right text-info tabular-nums">₹{totals.Savings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
              <TableCell className={cn("text-right tabular-nums", totals["Profit/Loss"] >= 0 ? "text-success" : "text-destructive")}>
                ₹{totals["Profit/Loss"].toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right tabular-nums">{totalSavingsRate.toFixed(1)}%</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
