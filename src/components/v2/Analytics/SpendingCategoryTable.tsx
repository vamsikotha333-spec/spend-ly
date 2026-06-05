import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types/transaction";
import { format, eachMonthOfInterval, isSameMonth, getYear } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories, categoryDisplay } from "@/hooks/useCategories";
import { Sparkline } from "@/components/common/Sparkline";
import { Download, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type TxnType = "Expense" | "Savings" | "Income";

const normalizeCategory = (raw: string): string => {
  if (!raw) return "";
  const stripped = raw.replace(/^[^\p{L}\p{N}]+/u, "").trim().toLowerCase();
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

const getTxnType = (t: Transaction): TxnType =>
  (t.transaction_type as TxnType) || (t.type === "credit" ? "Income" : "Expense");

const TAB_META: Record<TxnType, { label: string; heading: string; sortLabels: { desc: string; asc: string } }> = {
  Expense: { label: "Expenses", heading: "Spending by Category", sortLabels: { desc: "Highest Spending", asc: "Lowest Spending" } },
  Savings: { label: "Savings", heading: "Savings by Category", sortLabels: { desc: "Highest Savings", asc: "Lowest Savings" } },
  Income: { label: "Income", heading: "Income by Category", sortLabels: { desc: "Highest Income", asc: "Lowest Income" } },
};

export function SpendingCategoryTable({ transactions }: SpendingCategoryTableProps) {
  const [activeType, setActiveType] = useState<TxnType>("Expense");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("spend-desc");
  const { categories: dbCategories } = useCategories(activeType);

  const firstDate = useMemo(() => {
    if (transactions.length === 0) return new Date();
    return transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date);
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

  const yearFilteredMonths = useMemo(
    () => (selectedYear === "all" ? allMonths : allMonths.filter((m) => getYear(m) === Number(selectedYear))),
    [allMonths, selectedYear]
  );

  // Hide months that have no activity for the active type
  const months = useMemo(
    () =>
      yearFilteredMonths.filter((m) =>
        transactions.some(
          (t) => getTxnType(t) === activeType && isSameMonth(t.date, m)
        )
      ),
    [yearFilteredMonths, transactions, activeType]
  );

  const scoped = useMemo(
    () => transactions.filter((t) => getTxnType(t) === activeType),
    [transactions, activeType]
  );

  const categoryList = useMemo(() => {
    const fromDb = dbCategories.map((c) => categoryDisplay(c));
    const seen = new Set(fromDb.map((c) => normalizeCategory(c)));
    const fromTx: string[] = [];
    for (const t of scoped) {
      const raw = (t.category || "").trim();
      if (!raw) continue;
      const key = normalizeCategory(raw);
      if (!seen.has(key)) {
        seen.add(key);
        fromTx.push(raw);
      }
    }
    return [...fromDb, ...fromTx].sort((a, b) => a.localeCompare(b));
  }, [dbCategories, scoped]);

  const data = useMemo(() => {
    const rows = categoryList.map((category) => {
      const normalizedTarget = normalizeCategory(category);
      const monthTotals: Record<string, number> = {};
      months.forEach((month) => {
        const monthKey = month.toISOString();
        const total = scoped
          .filter((t) => normalizeCategory(t.category) === normalizedTarget && isSameMonth(t.date, month))
          .reduce((sum, t) => sum + t.amount, 0);
        monthTotals[monthKey] = total;
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
  }, [categoryList, months, scoped, sortBy]);

  const columnTotals: Record<string, number> = {};
  months.forEach((month) => {
    const monthKey = month.toISOString();
    columnTotals[monthKey] = data.reduce((sum, row) => sum + row.months[monthKey], 0);
  });

  const grandTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);
  const meta = TAB_META[activeType];

  const trendColor =
    activeType === "Expense" ? "hsl(0, 84%, 60%)" :
    activeType === "Savings" ? "hsl(217, 91%, 60%)" :
    "hsl(142, 71%, 45%)";

  const topThree = new Set(data.slice(0, 3).filter((r) => r.total > 0).map((r) => r.category));

  const handleExport = () => {
    const header = ["Category", ...months.map((m) => format(m, "MMM yyyy")), "Total"];
    const rows = data.map((r) => [
      r.category,
      ...months.map((m) => r.months[m.toISOString()].toFixed(2)),
      r.total.toFixed(2),
    ]);
    const totalsRow = [
      "Total",
      ...months.map((m) => columnTotals[m.toISOString()].toFixed(2)),
      grandTotal.toFixed(2),
    ];
    const csv = [header, ...rows, totalsRow]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintracker-${activeType.toLowerCase()}-by-category-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-3 md:p-5 shadow-medium">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-base md:text-lg font-bold">{meta.heading}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spend-desc">{meta.sortLabels.desc}</SelectItem>
              <SelectItem value="spend-asc">{meta.sortLabels.asc}</SelectItem>
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
          <Button onClick={handleExport} variant="outline" size="sm" className="h-8 text-xs" disabled={data.length === 0 || months.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as TxnType)} className="mb-3">
        <TabsList>
          <TabsTrigger value="Expense">Expenses</TabsTrigger>
          <TabsTrigger value="Savings">Savings</TabsTrigger>
          <TabsTrigger value="Income">Income</TabsTrigger>
        </TabsList>
      </Tabs>

      {allMonths.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No transactions yet. Add your first transaction to see analytics.</p>
      ) : scoped.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No {meta.label.toLowerCase()} recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold sticky left-0 bg-background z-10 min-w-[180px] text-xs py-2">
                  Category
                </TableHead>
                <TableHead className="font-bold min-w-[80px] text-xs py-2 px-2">Trend</TableHead>
                {months.map((month) => (
                  <TableHead key={month.toISOString()} className="text-right font-bold min-w-[80px] text-xs py-2 px-2">
                    {format(month, "MMM ''yy")}
                  </TableHead>
                ))}
                <TableHead className="text-right font-bold bg-muted/50 min-w-[90px] text-xs py-2 px-2">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const trend = months.map((m) => row.months[m.toISOString()] || 0);
                const isTop = topThree.has(row.category);
                return (
                  <TableRow key={row.category} className={cn("transition-colors hover:bg-muted/40", index % 2 === 0 ? "bg-muted/30" : "", isTop && "bg-warning/5")}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">
                      <div className="flex items-center gap-1.5">
                        {isTop && <Flame className="h-3 w-3 text-warning flex-shrink-0" />}
                        <span className="truncate">{row.category}</span>
                        {isTop && (
                          <Badge variant="secondary" className="h-4 px-1 text-[9px] font-semibold">
                            Top {[...topThree].indexOf(row.category) + 1}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 w-20">
                      <div style={{ color: trendColor }}>
                        <Sparkline data={trend} height={22} />
                      </div>
                    </TableCell>
                    {months.map((month) => {
                      const amount = row.months[month.toISOString()];
                      return (
                        <TableCell key={month.toISOString()} className="text-right tabular-nums">
                          {amount > 0 ? `₹${amount.toFixed(2)}` : "-"}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-bold bg-muted/30 tabular-nums">
                      {row.total > 0 ? `₹${row.total.toFixed(2)}` : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted font-bold border-t-2">
                <TableCell className="sticky left-0 bg-muted z-10">Total</TableCell>
                <TableCell />
                {months.map((month) => {
                  const monthKey = month.toISOString();
                  return (
                    <TableCell key={monthKey} className="text-right tabular-nums">
                      ₹{columnTotals[monthKey].toFixed(2)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right bg-muted tabular-nums">
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
