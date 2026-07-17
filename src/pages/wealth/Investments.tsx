import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useInvestments, Investment, InvestmentCategory, INVESTMENT_CATEGORIES,
} from "@/hooks/useInvestments";
import { TrendingUp, TrendingDown, Plus, Pencil, Trash2, PieChart as PieIcon, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#a855f7", "#ef4444", "#0ea5e9", "#64748b"];

function InvestmentDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Investment;
  onSave: (data: {
    name: string; category: InvestmentCategory; invested_amount: number;
    current_value: number; invested_on: string; notes: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState<InvestmentCategory>(initial?.category || "stocks");
  const [invested, setInvested] = useState<string>(initial ? String(initial.invested_amount) : "");
  const [current, setCurrent] = useState<string>(initial ? String(initial.current_value) : "");
  const [date, setDate] = useState<string>(initial?.invested_on || new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name is required");
    const inv = Number(invested);
    const cur = Number(current);
    if (!isFinite(inv) || inv < 0) return toast.error("Enter a valid invested amount");
    if (!isFinite(cur) || cur < 0) return toast.error("Enter a valid current value");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), category, invested_amount: inv, current_value: cur,
        invested_on: date, notes: notes.trim() || null,
      });
      onOpenChange(false);
    } catch (e: any) { toast.error(e?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Investment" : "Add Investment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Flexi Cap" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as InvestmentCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVESTMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Invested (₹)</Label>
              <Input type="number" inputMode="decimal" value={invested} onChange={(e) => setInvested(e.target.value)} />
            </div>
            <div>
              <Label>Current Value (₹)</Label>
              <Input type="number" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Invested On</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Investments() {
  const {
    investments, totalInvested, totalCurrent, gainLoss, returnPct,
    isLoading, addInvestment, updateInvestment, deleteInvestment,
  } = useInvestments();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | undefined>();
  const [filter, setFilter] = useState<"all" | InvestmentCategory>("all");

  const filtered = useMemo(
    () => filter === "all" ? investments : investments.filter((i) => i.category === filter),
    [investments, filter]
  );

  const allocation = useMemo(() => {
    const map = new Map<InvestmentCategory, number>();
    investments.forEach((i) => {
      map.set(i.category, (map.get(i.category) || 0) + Number(i.current_value || 0));
    });
    return Array.from(map.entries()).map(([category, value]) => {
      const meta = INVESTMENT_CATEGORIES.find((c) => c.value === category)!;
      return { name: meta.label, value, category };
    }).filter((d) => d.value > 0);
  }, [investments]);

  const gainPositive = gainLoss >= 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Investments</h1>
              <p className="text-xs text-muted-foreground">Track your portfolio's invested value, current value and returns.</p>
            </div>
          </div>
          <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Investment
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Invested</p>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1">{fmt(totalInvested)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Current Value</p>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1 text-primary">{fmt(totalCurrent)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Gain / Loss</p>
            <p className={cn("text-xl md:text-2xl font-bold tabular-nums mt-1", gainPositive ? "text-success" : "text-destructive")}>
              {fmt(gainLoss)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Return</p>
            <p className={cn("text-xl md:text-2xl font-bold tabular-nums mt-1", gainPositive ? "text-success" : "text-destructive")}>
              {returnPct.toFixed(2)}%
            </p>
          </Card>
        </div>

        {/* Allocation */}
        {allocation.length > 0 && (
          <Card className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <PieIcon className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">Portfolio Allocation</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Filter + list */}
        <Card className="p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h2 className="text-base font-bold">All Investments</h2>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {INVESTMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Wallet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No investments yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Add stocks, mutual funds, FDs, gold and more to track your portfolio.</p>
              <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Investment
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((inv) => {
                const meta = INVESTMENT_CATEGORIES.find((c) => c.value === inv.category)!;
                const diff = Number(inv.current_value) - Number(inv.invested_amount);
                const pct = Number(inv.invested_amount) > 0 ? (diff / Number(inv.invested_amount)) * 100 : 0;
                const pos = diff >= 0;
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="text-xl">{meta.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{inv.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {meta.label} • Invested {fmt(Number(inv.invested_amount))} on {new Date(inv.invested_on).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums">{fmt(Number(inv.current_value))}</p>
                        <p className={cn("text-[11px] font-medium tabular-nums", pos ? "text-success" : "text-destructive")}>
                          {pos ? "+" : ""}{fmt(diff)} ({pct.toFixed(1)}%)
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(inv); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                        if (confirm(`Delete "${inv.name}"?`)) {
                          try { await deleteInvestment(inv.id); toast.success("Deleted"); }
                          catch (e: any) { toast.error(e?.message || "Failed"); }
                        }
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <InvestmentDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={async (data) => {
          if (editing) {
            await updateInvestment(editing.id, data);
            toast.success("Investment updated");
          } else {
            await addInvestment(data);
            toast.success("Investment added");
          }
        }}
      />
    </div>
  );
}
