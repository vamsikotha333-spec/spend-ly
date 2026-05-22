import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { format, eachMonthOfInterval, isSameMonth, getYear } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, categoryDisplay } from "@/hooks/useCategories";

// Strip leading emoji/symbols + whitespace, lowercase for matching old & new entries
const normalizeCategory = (raw: string): string => {
  if (!raw) return "";
  const stripped = raw.replace(/^[^\p{L}\p{N}]+/u, "").trim().toLowerCase();
  // Map old/legacy category names to current canonical names
  const aliasMap: Record<string, string> = {
    "dry fruits": "dry fruits & nuts",
    "food & dining": "dining (breakfast, lunch, dinner, snacks)",
    "transportation": "transportation (bike, auto etc.)",
    "shopping": "shopping (clothes, shoes etc.)",
    "entertainment": "entertainment (movies, trip etc.)",
    "healthcare": "health & medical bills",
    "bills & utilities": "miscellaneous",
    "other": "miscellaneous",
  };
  return aliasMap[stripped] ?? stripped;
};

interface SpendingCategoryTableProps {
  transactions: Transaction[];
}

export function SpendingCategoryTable({ transactions }: SpendingCategoryTableProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("spend-desc");
  const { categories: expenseCategories } = useCategories("Expense");

  // Dynamic month range: from user's first transaction to current month
  const expensesAll = transactions.filter(
    (t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Expense"
  );
  const firstDate = useMemo(() => {
    if (transactions.length === 0) return new Date();
    return transactions.reduce(
      (min, t) => (t.date < min ? t.date : min),
      transactions[0].date
    );
  }, [transactions]);
  const startDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  const endDate = new Date();
  const allMonths = useMemo(
    () => (transactions.length === 0 ? [] : eachMonthOfInterval({ start: startDate, end: endDate })),
    [startDate.getTime(), endDate.getTime(), transactions.length]
  );

  const availableYears = useMemo(
    () => Array.from(new Set(allMonths.map((m) => getYear(m)))).sort(),
    [allMonths]
  );

  const months = selectedYear === "all"
    ? allMonths
    : allMonths.filter(m => getYear(m) === Number(selectedYear));

  // Get all expense transactions
  const expenses = transactions.filter(
    (t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === "Expense"
  );

  // Build dynamic category list: DB categories + any legacy categories present in transactions
  const categoryList = useMemo(() => {
    const fromDb = expenseCategories.map((c) => categoryDisplay(c));
    const seen = new Set(fromDb.map((c) => normalizeCategory(c)));
    const fromTx: string[] = [];
    for (const t of expenses) {
      const raw = (t.category || "").trim();
      if (!raw) continue;
      const key = normalizeCategory(raw);
      if (!seen.has(key)) {
        seen.add(key);
        fromTx.push(raw);
      }
    }
    return [...fromDb, ...fromTx].sort((a, b) => a.localeCompare(b));
  }, [expenseCategories, expenses]);

  // Calculate spending per category per month (categories as rows)
  const data = useMemo(() => {
    const rows = categoryList.map((category) => {
      const normalizedTarget = normalizeCategory(category);
      const monthTotals: Record<string, number> = {};
      months.forEach((month) => {
        const monthKey = month.toISOString();
        const spending = expenses
          .filter((t) => normalizeCategory(t.category) === normalizedTarget && isSameMonth(t.date, month))
          .reduce((sum, t) => sum + t.amount, 0);
        monthTotals[monthKey] = spending;
      });
      const rowTotal = Object.values(monthTotals).reduce((sum, val) => sum + val, 0);
      return { category, months: monthTotals, total: rowTotal };
    });
    rows.sort((a, b) => {
      switch (sortBy) {
        case "spend-desc": return b.total - a.total;
        case "spend-asc": return a.total - b.total;
        case "alpha": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
    return rows;
  }, [categoryList, months, expenses, sortBy]);

  // Calculate column totals (sum per month across all categories)
  const columnTotals: Record<string, number> = {};
  months.forEach((month) => {
    const monthKey = month.toISOString();
    columnTotals[monthKey] = data.reduce((sum, row) => sum + row.months[monthKey], 0);
  });
  
  const grandTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);

  return (
    <Card className="p-3 md:p-5 shadow-medium">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-base md:text-lg font-bold">Spending by Category</h2>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spend-desc">Highest Spending</SelectItem>
              <SelectItem value="spend-asc">Lowest Spending</SelectItem>
              <SelectItem value="alpha">Alphabetical (A–Z)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {allMonths.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No transactions yet. Add your first transaction to see analytics.</p>
      ) : (
      <div className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold sticky left-0 bg-background z-10 min-w-[160px] text-xs py-2">
                Category
              </TableHead>
              {months.map((month) => (
                <TableHead key={month.toISOString()} className="text-right font-bold min-w-[80px] text-xs py-2 px-2">
                  {format(month, "MMM ''yy")}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold bg-muted/50 min-w-[90px] text-xs py-2 px-2">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.category} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  {row.category}
                </TableCell>
                {months.map((month) => {
                  const monthKey = month.toISOString();
                  const amount = row.months[monthKey];
                  return (
                    <TableCell key={monthKey} className="text-right">
                      {amount > 0 ? `₹${amount.toFixed(2)}` : "-"}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-bold bg-muted/30">
                  {row.total > 0 ? `₹${row.total.toFixed(2)}` : "-"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted font-bold border-t-2">
              <TableCell className="sticky left-0 bg-muted z-10">Total</TableCell>
              {months.map((month) => {
                const monthKey = month.toISOString();
                return (
                  <TableCell key={monthKey} className="text-right">
                    ₹{columnTotals[monthKey].toFixed(2)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right bg-muted">
                ₹{grandTotal.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      )}
    </Card>
  );
}
