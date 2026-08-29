import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Tag, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCategories,
  useCategoryUsageCounts,
  type Category,
  type CategoryType,
} from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { CategoryRow } from "@/components/v2/Categories/CategoryRow";
import { DeleteCategoryDialog } from "@/components/v2/Categories/DeleteCategoryDialog";
import { CategoryCombobox } from "@/components/v2/Categories/CategoryCombobox";

const TYPES: CategoryType[] = ["Expense", "Income", "Savings"];

export default function ManageCategories() {
  const { allCategories, isLoading, addCategory, isAdding } = useCategories();
  const { transactions } = useTransactions();
  const counts = useCategoryUsageCounts(allCategories, transactions);

  const [activeType, setActiveType] = useState<CategoryType>("Expense");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  // controlled placeholder to drive CategoryCombobox quick-add — clears after add
  const [quickAdd, setQuickAdd] = useState("");

  // "+ Add Category" dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CategoryType>("Expense");
  const [newBudget, setNewBudget] = useState(true);

  const openAdd = () => {
    setNewName("");
    setNewType(activeType);
    setNewBudget(true);
    setAddOpen(true);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      toast.error("Enter a category name (at least 2 characters).");
      return;
    }
    const dup = allCategories.some(
      (c) => c.type === newType && c.name.toLowerCase() === name.toLowerCase(),
    );
    if (dup) {
      toast.error(`"${name}" already exists in ${newType} categories.`);
      return;
    }
    try {
      const created = await addCategory(name, newType, newBudget);
      toast.success(`Category "${created.name}" saved.`);
      setActiveType(newType);
      setAddOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save category");
    }
  };

  const filteredByType = useMemo(
    () => allCategories.filter((c) => c.type === activeType),
    [allCategories, activeType],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByType;
    return filteredByType.filter((c) => c.name.toLowerCase().includes(q));
  }, [filteredByType, search]);

  const handleQuickAddChange = (val: string) => {
    // Combobox emits the chosen display string. Reset immediately —
    // selection here just confirms the category exists in the list.
    setQuickAdd("");
  };


  return (
    <div className="container max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Tag className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage categories used across transactions, budgets, and reports.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>


      <Card className="p-4 md:p-6 space-y-4">
        <Tabs
          value={activeType}
          onValueChange={(v) => setActiveType(v as CategoryType)}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="Expense">Expense</TabsTrigger>
            <TabsTrigger value="Income">Income</TabsTrigger>
            <TabsTrigger value="Savings">Savings</TabsTrigger>
          </TabsList>

          {TYPES.map((t) => (
            <TabsContent key={t} value={t} className="space-y-3 mt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${t.toLowerCase()} categories…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                <div className="sm:w-64">
                  <CategoryCombobox
                    type={t}
                    value={quickAdd}
                    onChange={handleQuickAddChange}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading…
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  {filteredByType.length === 0
                    ? `No ${t.toLowerCase()} categories yet — add one above or from the transaction form.`
                    : "No categories match your search."}
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const defaults = visible.filter((c) => c.is_default);
                    const custom = visible.filter((c) => !c.is_default);
                    return (
                      <>
                        {defaults.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                🌍 Default Categories
                              </h3>
                              <Badge variant="outline" className="h-5 text-[10px]">
                                {defaults.length}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {defaults.map((c) => (
                                <CategoryRow
                                  key={c.id}
                                  category={c}
                                  count={counts[c.id] ?? 0}
                                  onRequestDelete={(cat, cnt) => {
                                    setDeleteTarget(cat);
                                    setDeleteCount(cnt);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {custom.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                👤 My Categories
                              </h3>
                              <Badge variant="outline" className="h-5 text-[10px]">
                                {custom.length}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {custom.map((c) => (
                                <CategoryRow
                                  key={c.id}
                                  category={c}
                                  count={counts[c.id] ?? 0}
                                  onRequestDelete={(cat, cnt) => {
                                    setDeleteTarget(cat);
                                    setDeleteCount(cnt);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <DeleteCategoryDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        category={deleteTarget}
        count={deleteCount}
      />
    </div>
  );
}
