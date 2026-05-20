import { useState } from "react";
import { useRecurringTransactions, RecurringTransaction } from "@/hooks/useRecurringTransactions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Repeat, PlusCircle, Trash2, Edit2, Calendar, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TRANSACTION_TYPES } from "@/types/transaction";
import { useMembers } from "@/hooks/useMembers";
import { useCategories, categoryDisplay, type CategoryType } from "@/hooks/useCategories";

export default function RecurringTransactionsPage() {
  const { recurring, isLoading, addRecurring, updateRecurring, deleteRecurring } = useRecurringTransactions();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [form, setForm] = useState({
    transaction_type: "Expense",
    amount: "",
    category: "",
    description: "",
    added_by: "Vamsi",
    applicable_to: "",
    frequency: "monthly",
    next_run_date: "",
  });

  const resetForm = () => {
    setForm({ transaction_type: "Expense", amount: "", category: "", description: "", added_by: "Vamsi", applicable_to: "", frequency: "monthly", next_run_date: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.category || !form.amount || !form.next_run_date) {
      toast.error("Fill required fields");
      return;
    }
    try {
      const payload = {
        type: form.transaction_type === "Income" ? "credit" : "debit",
        transaction_type: form.transaction_type,
        amount: Number(form.amount),
        category: form.category,
        description: form.description || null,
        added_by: form.added_by,
        applicable_to: form.applicable_to || null,
        frequency: form.frequency,
        next_run_date: form.next_run_date,
        is_active: true,
      };
      if (editing) {
        await updateRecurring(editing.id, payload);
        toast.success("Updated");
      } else {
        await addRecurring(payload);
        toast.success("Recurring transaction added");
      }
      resetForm();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleEdit = (r: RecurringTransaction) => {
    setForm({
      transaction_type: r.transaction_type || "Expense",
      amount: String(r.amount),
      category: r.category,
      description: r.description || "",
      added_by: r.added_by,
      applicable_to: r.applicable_to || "",
      frequency: r.frequency,
      next_run_date: r.next_run_date,
    });
    setEditing(r);
    setShowForm(true);
  };

  const toggleActive = async (r: RecurringTransaction) => {
    await updateRecurring(r.id, { is_active: !r.is_active });
  };

  const { categories: dynamicCats } = useCategories(form.transaction_type as CategoryType);
  const categories = dynamicCats.map((c) => categoryDisplay(c));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Repeat className="h-4 w-4" />
            <span className="font-semibold text-foreground">Recurring Transactions</span>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); else setShowForm(true); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Recurring Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.transaction_type} onValueChange={(v) => setForm({ ...form, transaction_type: v, category: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Next Run Date</Label>
                  <Input type="date" value={form.next_run_date} onChange={(e) => setForm({ ...form, next_run_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Added By</Label>
                  <Select value={form.added_by} onValueChange={(v) => setForm({ ...form, added_by: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {memberNames.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Applicable To</Label>
                  <Select value={form.applicable_to} onValueChange={(v) => setForm({ ...form, applicable_to: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {memberNames.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </div>
              <Button onClick={handleSubmit} className="w-full">{editing ? "Update" : "Add Recurring"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* List */}
        {recurring.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-soft">
            <Repeat className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No recurring transactions</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}><PlusCircle className="h-4 w-4 mr-1" /> Add One</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {recurring.map((r, i) => {
              const isExpense = r.transaction_type === "Expense" || r.type === "debit";
              const isIncome = r.transaction_type === "Income" || r.type === "credit";
              return (
                <Card
                  key={r.id}
                  className={cn("p-4 border-0 shadow-soft animate-slide-up", !r.is_active && "opacity-50")}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isIncome ? "bg-success/10" : isExpense ? "bg-destructive/10" : "bg-info/10"
                      )}>
                        <Repeat className={cn("h-4 w-4", isIncome ? "text-success" : isExpense ? "text-destructive" : "text-info")} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.category}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{r.frequency}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Next: {format(new Date(r.next_run_date), "MMM d, yyyy")}
                          </span>
                          <span>•</span>
                          <span>{r.added_by}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "font-semibold tabular-nums",
                        isIncome ? "text-success" : isExpense ? "text-destructive" : "text-info"
                      )}>
                        ₹{r.amount.toLocaleString("en-IN")}
                      </span>
                      <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRecurring(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
