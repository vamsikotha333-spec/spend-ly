import { useState } from "react";
import { useSavingsGoals, SavingsGoal } from "@/hooks/useSavingsGoals";
import { useSavingsContributions, SavingsContribution } from "@/hooks/useSavingsContributions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Target, PlusCircle, Trash2, Edit2, Calendar, User, History, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMembers } from "@/hooks/useMembers";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { CircularProgress } from "@/components/common/CircularProgress";
import { differenceInDays } from "date-fns";
function ContributionsDialog({ goal, onClose }: { goal: SavingsGoal; onClose: () => void }) {
  const { contributions, addContribution, updateContribution, deleteContribution } = useSavingsContributions(goal.id);
  const { updateGoal } = useSavingsGoals();
  const [newAmt, setNewAmt] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editing, setEditing] = useState<SavingsContribution | null>(null);
  const [editAmt, setEditAmt] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");

  const handleAdd = async () => {
    const amt = Number(newAmt);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    try {
      await addContribution({
        goal_id: goal.id,
        amount: amt,
        note: newNote,
        contributed_at: new Date(newDate).toISOString(),
      });
      await updateGoal(goal.id, { current_amount: goal.current_amount + amt });
      setNewAmt(""); setNewNote("");
      toast.success("Contribution added");
    } catch {
      toast.error("Failed to add contribution");
    }
  };

  const startEdit = (c: SavingsContribution) => {
    setEditing(c);
    setEditAmt(String(c.amount));
    setEditNote(c.note || "");
    setEditDate(format(new Date(c.contributed_at), "yyyy-MM-dd"));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const newAmount = Number(editAmt);
    if (!newAmount || newAmount <= 0) return toast.error("Enter a valid amount");
    try {
      const diff = newAmount - editing.amount;
      await updateContribution(editing.id, {
        amount: newAmount,
        note: editNote || null,
        contributed_at: new Date(editDate).toISOString(),
      });
      if (diff !== 0) {
        await updateGoal(goal.id, { current_amount: goal.current_amount + diff });
      }
      setEditing(null);
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (c: SavingsContribution) => {
    try {
      await deleteContribution(c.id);
      await updateGoal(goal.id, { current_amount: Math.max(0, goal.current_amount - c.amount) });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contributions — {goal.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="p-3 border bg-muted/30">
            <p className="text-xs font-medium mb-2">Add contribution</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input type="number" placeholder="Amount" value={newAmt} onChange={(e) => setNewAmt(e.target.value)} />
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <Input placeholder="Note (optional)" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="mb-2" />
            <Button size="sm" className="w-full" onClick={handleAdd}>
              <PlusCircle className="h-3 w-3 mr-1" /> Add
            </Button>
          </Card>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">History ({contributions.length})</p>
            {contributions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No contributions logged yet.</p>
            ) : (
              <div className="space-y-2">
                {contributions.map((c) => (
                  <Card key={c.id} className="p-3 border">
                    {editing?.id === c.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" value={editAmt} onChange={(e) => setEditAmt(e.target.value)} />
                          <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                        </div>
                        <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit} className="flex-1">
                            <Check className="h-3 w-3 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold tabular-nums">₹{c.amount.toLocaleString("en-IN")}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(c.contributed_at), "dd MMM yyyy")}
                            {c.note ? ` · ${c.note}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SavingsGoals() {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal } = useSavingsGoals();
  const { memberNames } = useMembers();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState({ name: "", target_amount: "", current_amount: "", deadline: "", person: "Combined", category: "" });

  const resetForm = () => {
    setForm({ name: "", target_amount: "", current_amount: "", deadline: "", person: "Combined", category: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.target_amount) {
      toast.error("Name and target amount are required");
      return;
    }
    try {
      const payload = {
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount) || 0,
        deadline: form.deadline || null,
        person: form.person,
        category: form.category || null,
      };
      if (editing) {
        await updateGoal(editing.id, payload);
        toast.success("Goal updated");
      } else {
        await addGoal(payload);
        toast.success("Goal created");
      }
      resetForm();
    } catch {
      toast.error("Failed to save goal");
    }
  };

  const handleEdit = (goal: SavingsGoal) => {
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      deadline: goal.deadline || "",
      person: goal.person,
      category: goal.category || "",
    });
    setEditing(goal);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  if (isLoading) {
    return <PageSkeleton rows={4} />;
  }

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="font-semibold text-foreground">Savings Goals</span>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle className="h-4 w-4 mr-1" /> New Goal
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          <Card className="p-5 shadow-soft">
            <p className="text-xs text-muted-foreground mb-1">Total Goals</p>
            <p className="text-2xl font-bold">{goals.length}</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-success tabular-nums">₹{totalSaved.toLocaleString("en-IN")}</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
            <p className="text-2xl font-bold tabular-nums">{overallPct.toFixed(1)}%</p>
            <Progress value={overallPct} className="h-2 mt-2" />
          </Card>
        </div>

        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); else setShowForm(true); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Goal" : "Create Savings Goal"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Goal Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Emergency Fund" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Target Amount (₹)</Label>
                  <Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
                </div>
                <div>
                  <Label>Current Amount (₹)</Label>
                  <Input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div>
                  <Label>Person</Label>
                  <Select value={form.person} onValueChange={(v) => setForm({ ...form, person: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Combined">Combined</SelectItem>
                      {memberNames.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">{editing ? "Update Goal" : "Create Goal"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {historyGoal && (
          <ContributionsDialog goal={historyGoal} onClose={() => setHistoryGoal(null)} />
        )}

        {goals.length === 0 ? (
          <EmptyState
            illustration="goals"
            title="No savings goals yet"
            description="Create your first goal to start tracking progress toward what matters most."
            actionLabel="Create your first goal"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal, i) => {
              const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const isComplete = pct >= 100;
              const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
              const remaining = Math.max(0, goal.target_amount - goal.current_amount);
              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "p-5 shadow-soft animate-slide-up hover-lift",
                    isComplete && "ring-2 ring-success/40"
                  )}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{goal.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> {goal.person}
                        </span>
                        {goal.deadline && (
                          <span className={cn(
                            "text-xs flex items-center gap-1",
                            daysLeft !== null && daysLeft < 30 && !isComplete ? "text-destructive" : "text-muted-foreground"
                          )}>
                            <Calendar className="h-3 w-3" />
                            {daysLeft !== null && daysLeft >= 0
                              ? `${daysLeft}d left`
                              : format(new Date(goal.deadline), "MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="History" onClick={() => setHistoryGoal(goal)}>
                        <History className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(goal)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <CircularProgress
                      value={pct}
                      size={84}
                      stroke={8}
                      colorClass={isComplete ? "text-success" : "text-primary"}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">Saved</p>
                      <p className="text-lg font-bold tabular-nums text-success leading-none">
                        ₹{goal.current_amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        of ₹{goal.target_amount.toLocaleString("en-IN")}
                      </p>
                      {!isComplete && (
                        <p className="text-[11px] text-muted-foreground">
                          ₹{remaining.toLocaleString("en-IN")} to go
                        </p>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full text-xs press" onClick={() => setHistoryGoal(goal)}>
                    <PlusCircle className="h-3 w-3 mr-1" /> Add / Manage Contributions
                  </Button>
                  {isComplete && (
                    <div className="text-center py-1 mt-2 animate-fade-in">
                      <span className="text-sm font-medium text-success">Goal Achieved!</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
