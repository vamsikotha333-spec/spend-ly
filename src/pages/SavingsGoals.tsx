import { useState } from "react";
import { useSavingsGoals, SavingsGoal } from "@/hooks/useSavingsGoals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Target, PlusCircle, Trash2, Edit2, IndianRupee, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMembers } from "@/hooks/useMembers";

export default function SavingsGoals() {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal } = useSavingsGoals();
  const { memberNames } = useMembers();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState({ name: "", target_amount: "", current_amount: "", deadline: "", person: "Central", category: "" });

  const resetForm = () => {
    setForm({ name: "", target_amount: "", current_amount: "", deadline: "", person: "Central", category: "" });
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

  const addFunds = async (goal: SavingsGoal, amount: number) => {
    try {
      await updateGoal(goal.id, { current_amount: goal.current_amount + amount });
      toast.success(`₹${amount.toLocaleString("en-IN")} added to ${goal.name}`);
    } catch {
      toast.error("Failed to update goal");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
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
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          <Card className="p-5 border-0 shadow-soft">
            <p className="text-xs text-muted-foreground mb-1">Total Goals</p>
            <p className="text-2xl font-bold">{goals.length}</p>
          </Card>
          <Card className="p-5 border-0 shadow-soft">
            <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-success tabular-nums">₹{totalSaved.toLocaleString("en-IN")}</p>
          </Card>
          <Card className="p-5 border-0 shadow-soft">
            <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
            <p className="text-2xl font-bold tabular-nums">{overallPct.toFixed(1)}%</p>
            <Progress value={overallPct} className="h-2 mt-2" />
          </Card>
        </div>

        {/* Form Dialog */}
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
                      <SelectItem value="Central">Central</SelectItem>
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

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-soft">
            <Target className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No savings goals yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Create your first goal to start tracking!</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}><PlusCircle className="h-4 w-4 mr-1" /> Create Goal</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal, i) => {
              const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const isComplete = pct >= 100;
              return (
                <Card
                  key={goal.id}
                  className={cn("p-5 border-0 shadow-soft animate-slide-up transition-all hover:shadow-medium", isComplete && "ring-2 ring-success/30")}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> {goal.person}
                        </span>
                        {goal.deadline && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {format(new Date(goal.deadline), "MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(goal)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium tabular-nums">₹{goal.current_amount.toLocaleString("en-IN")}</span>
                      <span className="text-muted-foreground tabular-nums">₹{goal.target_amount.toLocaleString("en-IN")}</span>
                    </div>
                    <Progress value={pct} className={cn("h-2.5", isComplete && "[&>div]:bg-success")} />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{pct.toFixed(1)}%</p>
                  </div>

                  {!isComplete && (
                    <div className="flex gap-2">
                      {[500, 1000, 5000].map((amt) => (
                        <Button key={amt} variant="outline" size="sm" className="flex-1 text-xs" onClick={() => addFunds(goal, amt)}>
                          +₹{amt.toLocaleString("en-IN")}
                        </Button>
                      ))}
                    </div>
                  )}
                  {isComplete && (
                    <div className="text-center py-1">
                      <span className="text-sm font-medium text-success">🎉 Goal Achieved!</span>
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
