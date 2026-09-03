import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { Transaction } from "@/types/transaction";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CategoryIcon, categoryLabel } from "@/utils/categoryIcon";
import { Search, Download, Edit, Trash2, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TransactionFormV2 } from "@/components/v2/Transactions/TransactionFormV2";
import { TRANSACTION_TYPES } from "@/types/transaction";
import { useMemberOptions } from "@/hooks/useMembers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Transactions() {
  const { transactions, isLoading, deleteTransaction, addTransaction, updateTransaction } = useTransactions();
  const personOptions = useMemberOptions(transactions);
  const { getFilteredTransactions } = useFilters();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = getFilteredTransactions(transactions);
    if (typeFilter !== "all") {
      result = result.filter((t) => (t.transaction_type || (t.type === "credit" ? "Income" : "Expense")) === typeFilter);
    }
    if (personFilter !== "all") {
      result = result.filter((t) => t.addedBy === personFilter || t.applicable_to === personFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.addedBy.toLowerCase().includes(term)
      );
    }
    return result;
  }, [transactions, searchTerm, typeFilter, personFilter, getFilteredTransactions]);

  const handleExport = () => {
    const csv = [
      ["Date", "Type", "Category", "Description", "Amount", "Added By", "Applicable To"],
      ...filtered.map((t) => [
        format(t.date, "yyyy-MM-dd"),
        t.transaction_type || (t.type === "credit" ? "Income" : "Expense"),
        `"${t.category}"`,
        `"${t.description}"`,
        t.amount.toFixed(2),
        t.addedBy,
        t.applicable_to || "Central",
      ]),
    ].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTransaction(deletingId);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete");
    }
    setDeletingId(null);
  };

  const handleSave = async (t: Omit<Transaction, "id">) => {
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, t);
        toast.success("Updated");
        setEditingTransaction(undefined);
      } else {
        await addTransaction(t);
        toast.success("Added");
      }
    } catch {
      toast.error("Failed to save");
    }
  };

  const getIcon = (t: Transaction) => {
    const type = t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
    if (type === "Income") return <TrendingUp className="h-4 w-4 text-success" />;
    if (type === "Savings") return <PiggyBank className="h-4 w-4 text-info" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TRANSACTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={personFilter} onValueChange={setPersonFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {personOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleExport} className="h-10">
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Badge variant="secondary" className="h-10 px-3 flex items-center text-xs">
            {filtered.length} records
          </Badge>
        </div>

        {editingTransaction && (
          <TransactionFormV2
            onAddTransaction={handleSave}
            editTransaction={editingTransaction}
            onCancelEdit={() => setEditingTransaction(undefined)}
          />
        )}

        {filtered.length === 0 ? (
          <Card className="shadow-soft overflow-hidden p-12 text-center animate-fade-in">
            <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
          </Card>
        ) : (
          <Card className="shadow-soft overflow-hidden">
            <div className="divide-y">
              {filtered.map((t, i) => {
                const type = t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
                const sign = type === "Income" ? "+" : type === "Savings" ? "" : "-";
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors animate-fade-in"
                    style={{ animationDelay: `${Math.min(i, 20) * 25}ms`, animationFillMode: "both" }}
                  >
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      type === "Income" && "bg-success/10",
                      type === "Expense" && "bg-destructive/10",
                      type === "Savings" && "bg-info/10"
                    )}>
                      <CategoryIcon category={t.category} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{categoryLabel(t.category)}</span>
                        <Badge variant="outline" className="text-[10px] h-5">{t.applicable_to || "Central"}</Badge>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                      <p className="text-[10px] text-muted-foreground">{format(t.date, "MMM dd, yyyy")} • {t.addedBy}</p>
                    </div>
                    <p className={cn(
                      "font-bold text-sm flex-shrink-0 tabular-nums",
                      type === "Income" && "text-success",
                      type === "Expense" && "text-destructive",
                      type === "Savings" && "text-info"
                    )}>
                      {sign}₹{t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex gap-1 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTransaction(t)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
