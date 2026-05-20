import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets, Budget } from "@/hooks/useBudgets";
import { useFilters } from "@/contexts/FilterContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlusCircle, BarChart3, LayoutGrid, List, Filter, ArrowUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { useCategories, categoryDisplay } from "@/hooks/useCategories";
import { BudgetAIInsights } from "@/components/v2/Budget/BudgetAIInsights";
import { CompactSummaryBar } from "@/components/v2/Budget/CompactSummaryBar";
import { TopSpendingIssues } from "@/components/v2/Budget/TopSpendingIssues";
import { BudgetCategoryCard } from "@/components/v2/Budget/BudgetCategoryCard";

function getType(t: any) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function trimCat(c: string) {
  return c.trim();
}

export default function BudgetVsActual() {
  const { transactions } = useTransactions();
  const { categories: expenseCategories } = useCategories("Expense");
  const { budgets, isLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { filters } = useFilters();

  // Budgets are inherently month-based. Use global selected month when available;
  // otherwise default to the current month.
  const monthDate = useMemo(() => {
    if (filters.mode === "month" && filters.selectedMonth) {
      return startOfMonth(filters.selectedMonth);
    }
    if (filters.mode === "range" && filters.range.from) {
      return startOfMonth(filters.range.from);
    }
    return startOfMonth(new Date());
  }, [filters.mode, filters.selectedMonth, filters.range.from]);

  const selectedMonth = format(monthDate, "yyyy-MM");

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form, setForm] = useState({ category: "", budget_amount: "", person: "Central" });
  const [viewMode, setViewMode] = useState<string>("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("pct-desc");

  const monthBudgets = budgets.filter((b) => isSameMonth(parseISO(b.month), monthDate));

  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => getType(t) === "Expense" && isSameMonth(t.date, monthDate))
      .forEach((t) => {
        const cat = trimCat(t.category);
        map[cat] = (map[cat] || 0) + t.amount;
      });
    return map;
  }, [transactions, monthDate]);

  const comparison = useMemo(() => {
    const budgetedCats = new Set(monthBudgets.map(b => trimCat(b.category)));

    const items = monthBudgets.map((b) => {
      const cat = trimCat(b.category);
      const actual = actualByCategory[cat] || 0;
      const pct = b.budget_amount > 0 ? (actual / b.budget_amount) * 100 : 0;
      const status: "over" | "warning" | "good" = pct > 100 ? "over" : pct > 80 ? "warning" : "good";
      return { ...b, category: cat, actual, pct, status, hasBudget: true };
    });

    Object.entries(actualByCategory).forEach(([cat, actual]) => {
      if (!budgetedCats.has(cat)) {
        items.push({
          id: `unbudgeted-${cat}`,
          category: cat,
          budget_amount: 0,
          month: selectedMonth + "-01",
          person: "Central",
          created_at: "",
          actual,
          pct: 100,
          status: "over" as const,
          hasBudget: false,
        });
      }
    });

    return items;
  }, [monthBudgets, actualByCategory, selectedMonth]);

  const totalBudget = comparison.reduce((s, c) => s + c.budget_amount, 0);
  const totalActual = comparison.reduce((s, c) => s + c.actual, 0);

  const displayed = useMemo(() => {
    let list = comparison;
    if (statusFilter !== "all") {
      list = list.filter((c) => {
        if (!c.hasBudget) return statusFilter === "over";
        if (statusFilter === "over") return c.pct > 100;
        if (statusFilter === "near") return c.pct >= 70 && c.pct <= 100;
        if (statusFilter === "under") return c.pct < 70;
        return true;
      });
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "pct-desc": return b.pct - a.pct;
        case "pct-asc": return a.pct - b.pct;
        case "spend-desc": return b.actual - a.actual;
        case "remaining-asc": return (a.budget_amount - a.actual) - (b.budget_amount - b.actual);
        case "alpha": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
    return sorted;
  }, [comparison, statusFilter, sortBy]);

  const filterLabel: Record<string, string> = {
    all: "All", over: "Over Budget 🔴", near: "Near Limit ⚠️", under: "Under Budget 🟢",
  };
  const sortLabel: Record<string, string> = {
    "pct-desc": "Highest % Used",
    "pct-asc": "Lowest % Used",
    "spend-desc": "Highest Spending",
    "remaining-asc": "Lowest Remaining",
    "alpha": "Alphabetical (A–Z)",
  };
  const isFilterActive = statusFilter !== "all" || sortBy !== "pct-desc";

  const openAddForm = () => {
    setEditingBudget(null);
    setForm({ category: "", budget_amount: "", person: "Central" });
    setShowForm(true);
  };

  const openEditForm = (budget: Budget) => {
    setEditingBudget(budget);
    setForm({ category: budget.category, budget_amount: String(budget.budget_amount), person: budget.person });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.category || !form.budget_amount) {
      toast.error("Category and amount required");
      return;
    }
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, { category: form.category, budget_amount: Number(form.budget_amount) });
        toast.success("Budget updated");
      } else {
        await addBudget({ category: form.category, budget_amount: Number(form.budget_amount), month: selectedMonth + "-01", person: form.person });
        toast.success("Budget added");
      }
      setShowForm(false);
      setEditingBudget(null);
    } catch {
      toast.error(editingBudget ? "Failed to update" : "Failed to add");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Page Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Showing budgets for <span className="font-semibold text-foreground">{format(monthDate, "MMMM yyyy")}</span></span>
          </div>
          <Button size="sm" onClick={openAddForm}>
            <PlusCircle className="h-4 w-4 mr-1" /> Set Budget
          </Button>
        </div>

        <BudgetAIInsights comparison={comparison} />

        <CompactSummaryBar totalBudget={totalBudget} totalActual={totalActual} selectedMonth={selectedMonth} />

        <TopSpendingIssues comparison={comparison} />

        {comparison.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-soft">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No budgets set for {format(monthDate, "MMMM yyyy")}</p>
            <Button className="mt-4" onClick={openAddForm}><PlusCircle className="h-4 w-4 mr-1" /> Set Budget</Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">📊 Category Breakdown</h3>
                <Badge variant="secondary" className="text-xs">Showing {displayed.length} {displayed.length === 1 ? "category" : "categories"}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="over">Over Budget 🔴</SelectItem>
                    <SelectItem value="near">Near Limit ⚠️</SelectItem>
                    <SelectItem value="under">Under Budget 🟢</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pct-desc">Highest % Used</SelectItem>
                    <SelectItem value="pct-asc">Lowest % Used</SelectItem>
                    <SelectItem value="spend-desc">Highest Spending</SelectItem>
                    <SelectItem value="remaining-asc">Lowest Remaining</SelectItem>
                    <SelectItem value="alpha">Alphabetical (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
                {isFilterActive && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setStatusFilter("all"); setSortBy("pct-desc"); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Reset
                  </Button>
                )}
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)} size="sm">
                  <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {displayed.length === 0 ? (
              <Card className="p-10 text-center border-0 shadow-soft">
                <p className="text-sm text-muted-foreground">No categories match this filter</p>
              </Card>
            ) : (
              <div className={viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
              }>
                {displayed.map((item, i) => (
                  <BudgetCategoryCard key={item.id} item={item} index={i} onEdit={openEditForm} onDelete={deleteBudget} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingBudget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Set Category Budget"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => {
                    const d = categoryDisplay(c);
                    return <SelectItem key={c.id} value={d}>{d}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget Amount (₹)</Label>
              <Input type="number" value={form.budget_amount} onChange={(e) => setForm({ ...form, budget_amount: e.target.value })} />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editingBudget ? "Update Budget" : "Set Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
