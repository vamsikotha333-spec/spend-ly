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
import { PlusCircle, BarChart3, LayoutGrid, List, Filter, ArrowUpDown, X, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { useCategories, categoryDisplay } from "@/hooks/useCategories";
import { BudgetAIInsights } from "@/components/v2/Budget/BudgetAIInsights";
import { CompactSummaryBar } from "@/components/v2/Budget/CompactSummaryBar";
import { TopSpendingIssues } from "@/components/v2/Budget/TopSpendingIssues";
import { BudgetCategoryCard } from "@/components/v2/Budget/BudgetCategoryCard";

type SectionKind = "expense" | "savings";

function getType(t: any) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function trimCat(c: string) {
  return c.trim();
}

export default function BudgetVsActual() {
  const { transactions } = useTransactions();
  const { allCategories } = useCategories();
  const { budgets, isLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { filters } = useFilters();

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
  const [form, setForm] = useState<{ category: string; budget_amount: string; person: string; type: SectionKind }>(
    { category: "", budget_amount: "", person: "Central", type: "expense" },
  );
  const [viewMode, setViewMode] = useState<string>("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("pct-desc");
  const [sectionFilter, setSectionFilter] = useState<"all" | SectionKind>("all");

  const monthBudgets = budgets.filter((b) => isSameMonth(parseISO(b.month), monthDate));

  // Budget-tracked categories (filtered by type)
  const expenseBudgetCats = useMemo(
    () => allCategories.filter((c) => c.type === "Expense" && c.budget_tracking),
    [allCategories],
  );
  const savingsBudgetCats = useMemo(
    () => allCategories.filter((c) => c.type === "Savings" && c.budget_tracking),
    [allCategories],
  );

  // Build a lookup: display name -> category type (Expense | Savings)
  const categoryTypeMap = useMemo(() => {
    const m = new Map<string, "Expense" | "Savings" | "Income">();
    for (const c of allCategories) {
      m.set(categoryDisplay(c).trim(), c.type);
      m.set(c.name.trim(), c.type);
    }
    return m;
  }, [allCategories]);

  // Actuals per category, split by Expense and Savings transactions
  const actualByCategory = useMemo(() => {
    const expense: Record<string, number> = {};
    const savings: Record<string, number> = {};
    transactions.forEach((t) => {
      if (!isSameMonth(t.date, monthDate)) return;
      const cat = trimCat(t.category);
      const ttype = getType(t);
      if (ttype === "Expense") expense[cat] = (expense[cat] || 0) + t.amount;
      else if (ttype === "Savings") savings[cat] = (savings[cat] || 0) + t.amount;
    });
    return { expense, savings };
  }, [transactions, monthDate]);

  // Build a comparison list for a given section
  const buildComparison = (kind: SectionKind) => {
    const isSavings = kind === "savings";
    const actualMap = isSavings ? actualByCategory.savings : actualByCategory.expense;
    const sectionType = isSavings ? "Savings" : "Expense";

    // Budgets for this section: infer via categoryTypeMap; default unknowns to expense
    const sectionBudgets = monthBudgets.filter((b) => {
      const t = categoryTypeMap.get(trimCat(b.category));
      if (!t) return !isSavings; // unknown -> expense bucket
      return t === sectionType;
    });

    const budgetedCats = new Set(sectionBudgets.map((b) => trimCat(b.category)));

    const items = sectionBudgets.map((b) => {
      const cat = trimCat(b.category);
      const actual = actualMap[cat] || 0;
      const pct = b.budget_amount > 0 ? (actual / b.budget_amount) * 100 : 0;
      const status: "over" | "warning" | "good" = pct > 100 ? "over" : pct > 80 ? "warning" : "good";
      return { ...b, category: cat, actual, pct, status, hasBudget: true };
    });

    Object.entries(actualMap).forEach(([cat, actual]) => {
      if (!budgetedCats.has(cat)) {
        items.push({
          id: `unbudgeted-${kind}-${cat}`,
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
  };

  const expenseComparison = useMemo(() => buildComparison("expense"), [monthBudgets, actualByCategory, categoryTypeMap, selectedMonth]);
  const savingsComparison = useMemo(() => buildComparison("savings"), [monthBudgets, actualByCategory, categoryTypeMap, selectedMonth]);

  const totalExpenseBudget = expenseComparison.reduce((s, c) => s + c.budget_amount, 0);
  const totalExpenseActual = expenseComparison.reduce((s, c) => s + c.actual, 0);

  const applyFilters = (list: typeof expenseComparison) => {
    let out = list;
    if (statusFilter !== "all") {
      out = out.filter((c) => {
        if (!c.hasBudget) return statusFilter === "over";
        if (statusFilter === "over") return c.pct > 100;
        if (statusFilter === "near") return c.pct >= 70 && c.pct <= 100;
        if (statusFilter === "under") return c.pct < 70;
        return true;
      });
    }
    const sorted = [...out];
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
  };

  const displayedExpense = useMemo(() => applyFilters(expenseComparison), [expenseComparison, statusFilter, sortBy]);
  const displayedSavings = useMemo(() => applyFilters(savingsComparison), [savingsComparison, statusFilter, sortBy]);

  const isFilterActive = statusFilter !== "all" || sortBy !== "pct-desc";

  const openAddForm = (type: SectionKind = "expense") => {
    setEditingBudget(null);
    setForm({ category: "", budget_amount: "", person: "Central", type });
    setShowForm(true);
  };

  const openEditForm = (budget: Budget) => {
    const t = categoryTypeMap.get(trimCat(budget.category));
    setEditingBudget(budget);
    setForm({
      category: budget.category,
      budget_amount: String(budget.budget_amount),
      person: budget.person,
      type: t === "Savings" ? "savings" : "expense",
    });
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
        toast.success("Saved");
      } else {
        await addBudget({ category: form.category, budget_amount: Number(form.budget_amount), month: selectedMonth + "-01", person: form.person });
        toast.success(form.type === "savings" ? "Savings target added" : "Budget added");
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

  const formCategoryOptions = form.type === "savings" ? savingsBudgetCats : expenseBudgetCats;

  const showExpense = sectionFilter === "all" || sectionFilter === "expense";
  const showSavings = sectionFilter === "all" || sectionFilter === "savings";

  const renderSection = (kind: SectionKind, displayed: typeof expenseComparison) => {
    const isSavings = kind === "savings";
    const accent = isSavings
      ? "from-success/10 via-primary/5 to-transparent border-success/20"
      : "from-destructive/10 via-warning/5 to-transparent border-destructive/20";
    const Icon = isSavings ? TrendingUp : TrendingDown;
    const title = isSavings ? "Savings Targets" : "Expense Budgets";
    const description = isSavings
      ? "Track how close you are to each savings target this month."
      : "Compare planned spend vs actual spend per category.";
    const empty = isSavings
      ? "No savings activity or targets this month."
      : "No expense activity or budgets this month.";

    return (
      <section className={`rounded-xl border bg-gradient-to-br ${accent} p-4 md:p-5 space-y-4`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isSavings ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                {title}
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {displayed.length}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => openAddForm(kind)}>
            <PlusCircle className="h-4 w-4 mr-1" /> {isSavings ? "Set Target" : "Set Budget"}
          </Button>
        </div>

        {displayed.length === 0 ? (
          <Card className="p-8 text-center border-dashed bg-background/40">
            <p className="text-sm text-muted-foreground">{empty}</p>
          </Card>
        ) : (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
          }>
            {displayed.map((item, i) => (
              <BudgetCategoryCard
                key={item.id}
                item={item}
                index={i}
                variant={kind}
                onEdit={openEditForm}
                onDelete={deleteBudget}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  const hasAnything = expenseComparison.length > 0 || savingsComparison.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Showing budgets for <span className="font-semibold text-foreground">{format(monthDate, "MMMM yyyy")}</span></span>
          </div>
          <Button size="sm" onClick={() => openAddForm("expense")}>
            <PlusCircle className="h-4 w-4 mr-1" /> Set Budget
          </Button>
        </div>

        <BudgetAIInsights comparison={expenseComparison} />
        <CompactSummaryBar totalBudget={totalExpenseBudget} totalActual={totalExpenseActual} selectedMonth={selectedMonth} />
        <TopSpendingIssues comparison={expenseComparison} />

        {hasAnything && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v as any)}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="expense">Expense Categories</SelectItem>
                  <SelectItem value="savings">Savings Categories</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="over">Over / Reached 🔴</SelectItem>
                  <SelectItem value="near">Near Limit ⚠️</SelectItem>
                  <SelectItem value="under">Under / Early 🟢</SelectItem>
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
                  <SelectItem value="spend-desc">Highest Amount</SelectItem>
                  <SelectItem value="remaining-asc">Lowest Remaining</SelectItem>
                  <SelectItem value="alpha">Alphabetical (A–Z)</SelectItem>
                </SelectContent>
              </Select>
              {isFilterActive && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setStatusFilter("all"); setSortBy("pct-desc"); }}>
                  <X className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)} size="sm">
              <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {!hasAnything ? (
          <Card className="p-12 text-center shadow-soft">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">
              No budgets or targets for {format(monthDate, "MMMM yyyy")}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button onClick={() => openAddForm("expense")}>
                <PlusCircle className="h-4 w-4 mr-1" /> Set Budget
              </Button>
              <Button variant="outline" onClick={() => openAddForm("savings")}>
                <PlusCircle className="h-4 w-4 mr-1" /> Set Savings Target
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-5">
            {showExpense && renderSection("expense", displayedExpense)}
            {showSavings && renderSection("savings", displayedSavings)}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingBudget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget
                ? "Edit Budget"
                : form.type === "savings"
                  ? "Set Savings Target"
                  : "Set Category Budget"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingBudget && (
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as SectionKind, category: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense Budget</SelectItem>
                    <SelectItem value="savings">Savings Target</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {formCategoryOptions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No budget-tracked {form.type} categories. Enable Budget tracking on a category first.
                    </div>
                  ) : (
                    formCategoryOptions.map((c) => {
                      const d = categoryDisplay(c);
                      return <SelectItem key={c.id} value={d}>{d}</SelectItem>;
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.type === "savings" ? "Target Amount (₹)" : "Budget Amount (₹)"}</Label>
              <Input type="number" value={form.budget_amount} onChange={(e) => setForm({ ...form, budget_amount: e.target.value })} />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editingBudget
                ? "Update"
                : form.type === "savings"
                  ? "Set Target"
                  : "Set Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
