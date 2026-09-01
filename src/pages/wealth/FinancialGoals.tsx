import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Flag, Plus, Pencil, Trash2, Target, PiggyBank, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFinancialGoals, FinancialGoal, GoalCategory, GOAL_CATEGORIES } from "@/hooks/useFinancialGoals";

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function GoalDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: FinancialGoal;
  onSave: (data: {
    name: string; category: GoalCategory; target_amount: number;
    current_amount: number; target_date: string | null; notes: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState<GoalCategory>(initial?.category || "other");
  const [target, setTarget] = useState<string>(initial ? String(initial.target_amount) : "");
  const [current, setCurrent] = useState<string>(initial ? String(initial.current_amount) : "0");
  const [date, setDate] = useState<string>(initial?.target_date || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const t = Number(target); const c = Number(current);
    if (!isFinite(t) || t < 0) { toast.error("Enter a valid target amount"); return; }
    if (!isFinite(c) || c < 0) { toast.error("Enter a valid saved amount"); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), category, target_amount: t, current_amount: c,
        target_date: date || null, notes: notes.trim() || null,
      });
      onOpenChange(false);
    } catch (e: any) { toast.error(e?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit Goal" : "Add Goal"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Goal Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund" /></div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOAL_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Target Amount (₹)</Label><Input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
            <div><Label>Saved So Far (₹)</Label><Input type="number" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          </div>
          <div><Label>Target Date (optional)</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FinancialGoals() {
  const { goals, totalTarget, totalSaved, remaining, overallPct, isLoading, addGoal, updateGoal, deleteGoal } = useFinancialGoals();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialGoal | undefined>(undefined);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Financial Goals</h1>
              <p className="text-xs text-muted-foreground">Plan and track long-term financial goals.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Goal
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Total Target</p>
            </div>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1">{fmt(totalTarget)}</p>
          </Card>
          <Card className="p-4 border shadow-soft">
            <div className="flex items-center gap-2 text-success">
              <PiggyBank className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Total Saved</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-success tabular-nums mt-1">{fmt(totalSaved)}</p>
          </Card>
          <Card className="p-4 border shadow-soft">
            <div className="flex items-center gap-2 text-destructive">
              <TrendingUp className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Remaining</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-destructive tabular-nums mt-1">{fmt(remaining)}</p>
          </Card>
          <Card className="p-4 border shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <Flag className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Overall Progress</p>
            </div>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1">{overallPct.toFixed(0)}%</p>
            <Progress value={overallPct} className="h-1.5 mt-2" />
          </Card>
        </div>

        <Card className="p-4 md:p-5 border shadow-soft">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : goals.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Flag className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold">No goals yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Set your first financial goal to start tracking progress.</p>
              <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const target = Number(g.target_amount || 0);
                const saved = Number(g.current_amount || 0);
                const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
                const rem = Math.max(0, target - saved);
                const meta = GOAL_CATEGORIES.find((c) => c.value === g.category) || GOAL_CATEGORIES[6];
                const daysLeft = g.target_date
                  ? Math.ceil((new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <div key={g.id} className="rounded-lg border p-3 md:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex items-start gap-3">
                        <span className="text-2xl">{meta.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{g.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {meta.label}
                            {g.target_date ? ` • by ${new Date(g.target_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                            {daysLeft != null ? ` • ${daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}` : ""}
                          </p>
                          {g.notes && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{g.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(g); setOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                          if (confirm(`Delete "${g.name}"?`)) {
                            try { await deleteGoal(g.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message || "Failed"); }
                          }
                        }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="tabular-nums font-medium text-success">{fmt(saved)}</span>
                        <span className={cn("tabular-nums font-medium", pct >= 100 ? "text-success" : "text-muted-foreground")}>{pct.toFixed(0)}%</span>
                        <span className="tabular-nums font-medium text-muted-foreground">{fmt(target)}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <p className="text-[11px] text-muted-foreground mt-1 text-right">
                        {rem > 0 ? `${fmt(rem)} remaining` : "Goal achieved 🎉"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <GoalDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={async (data) => {
          if (editing) { await updateGoal(editing.id, data); toast.success("Goal updated"); }
          else { await addGoal(data); toast.success("Goal added"); }
        }}
      />
    </div>
  );
}
