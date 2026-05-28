import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { format, eachMonthOfInterval, isSameMonth, getYear } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemberOptions } from "@/hooks/useMembers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MonthlySummaryV2Props {
  transactions: Transaction[];
}

export function MonthlySummaryV2({ transactions }: MonthlySummaryV2Props) {
  const [paidByFilter, setPaidByFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const memberOptions = useMemberOptions(transactions);

  const startDate = new Date(2025, 9, 1);
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

  const monthlyData = visibleMonths.map((month) => {
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

    return {
      month: format(month, "MMM yyyy"),
      Income: income,
      Expenses: expenses,
      Savings: savings,
      "Profit/Loss": profit,
    };
  });

  const totals = monthlyData.reduce(
    (acc, row) => ({
      Income: acc.Income + row.Income,
      Expenses: acc.Expenses + row.Expenses,
      Savings: acc.Savings + row.Savings,
      "Profit/Loss": acc["Profit/Loss"] + row["Profit/Loss"],
    }),
    { Income: 0, Expenses: 0, Savings: 0, "Profit/Loss": 0 }
  );

  const handleExport = () => {
    const csv = [
      ["Month", "Income", "Expenses", "Savings", "Profit/Loss"],
      ...monthlyData.map((row) => [
        row.month,
        row.Income.toFixed(2),
        row.Expenses.toFixed(2),
        row.Savings.toFixed(2),
        row["Profit/Loss"].toFixed(2),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintracker-summary-${paidByFilter}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paidByFilter} onValueChange={setPaidByFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {memberOptions.map((person) => (
                <SelectItem key={person} value={person}>
                  {person}
                </SelectItem>
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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `₹${value.toFixed(2)}`}
            contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
          />
          <Legend />
          <Bar dataKey="Income" fill="#16a34a" />
          <Bar dataKey="Expenses" fill="#dc2626" />
          <Bar dataKey="Savings" fill="#2563eb" />
          <Bar dataKey="Profit/Loss" fill="#f59e0b" />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell className="text-right text-green-600">₹{row.Income.toFixed(2)}</TableCell>
                <TableCell className="text-right text-red-600">₹{row.Expenses.toFixed(2)}</TableCell>
                <TableCell className="text-right text-blue-600">₹{row.Savings.toFixed(2)}</TableCell>
                <TableCell className={`text-right font-semibold ${row["Profit/Loss"] >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{row["Profit/Loss"].toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 font-bold bg-muted/50">
              <TableCell>Total</TableCell>
              <TableCell className="text-right text-green-600">₹{totals.Income.toFixed(2)}</TableCell>
              <TableCell className="text-right text-red-600">₹{totals.Expenses.toFixed(2)}</TableCell>
              <TableCell className="text-right text-blue-600">₹{totals.Savings.toFixed(2)}</TableCell>
              <TableCell className={`text-right ${totals["Profit/Loss"] >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{totals["Profit/Loss"].toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
