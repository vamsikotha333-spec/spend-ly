import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAssets, Asset, AssetType } from "@/hooks/useAssets";
import { useLiabilities, Liability, LiabilityType } from "@/hooks/useLiabilities";
import { useInvestments, INVESTMENT_CATEGORIES } from "@/hooks/useInvestments";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { Progress } from "@/components/ui/progress";
import { Wallet, Plus, Pencil, Trash2, ArrowRight, Flag, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { WealthHealthScore } from "@/components/v2/Wealth/WealthHealthScore";
import { WealthSnapshot } from "@/components/v2/Wealth/WealthSnapshot";
import { WealthActivityTimeline } from "@/components/v2/Wealth/WealthActivityTimeline";
import { WealthReminders } from "@/components/v2/Wealth/WealthReminders";
import { WealthQuickActions } from "@/components/v2/Wealth/WealthQuickActions";
import { SmartWealthInsights } from "@/components/v2/Wealth/SmartWealthInsights";

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const ASSET_TYPES: { value: AssetType; label: string; emoji: string }[] = [
  { value: "cash", label: "Cash", emoji: "💵" },
  { value: "bank", label: "Bank Account", emoji: "🏦" },
  { value: "investment", label: "Investment", emoji: "📈" },
  { value: "gold", label: "Gold", emoji: "🪙" },
  { value: "other", label: "Other", emoji: "📦" },
];

const LIABILITY_TYPES: { value: LiabilityType; label: string; emoji: string }[] = [
  { value: "loan", label: "Loan", emoji: "💳" },
  { value: "credit_card", label: "Credit Card", emoji: "💳" },
  { value: "mortgage", label: "Mortgage", emoji: "🏠" },
  { value: "other", label: "Other", emoji: "📄" },
];

function AssetDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Asset;
  onSave: (data: { name: string; type: AssetType; value: number; notes: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<AssetType>(initial?.type || "bank");
  const [value, setValue] = useState<string>(initial ? String(initial.value) : "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const v = Number(value);
    if (!isFinite(v) || v < 0) { toast.error("Enter a valid value"); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), type, value: v, notes: notes.trim() || null });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Asset" : "Add Asset"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Savings" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value (₹)</Label>
            <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
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

function LiabilityDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Liability;
  onSave: (data: { name: string; type: LiabilityType; amount: number; interest_rate: number | null; notes: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<LiabilityType>(initial?.type || "loan");
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : "");
  const [rate, setRate] = useState<string>(initial?.interest_rate != null ? String(initial.interest_rate) : "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const a = Number(amount);
    if (!isFinite(a) || a < 0) { toast.error("Enter a valid amount"); return; }
    const r = rate ? Number(rate) : null;
    if (r != null && (!isFinite(r) || r < 0)) { toast.error("Enter a valid interest rate"); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), type, amount: a, interest_rate: r, notes: notes.trim() || null });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Liability" : "Add Liability"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home Loan" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as LiabilityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIABILITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Interest % (optional)</Label>
              <Input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
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

export default function Wealth() {
  const { assets, total: assetsTotal, addAsset, updateAsset, deleteAsset, isLoading: aLoading } = useAssets();
  const { liabilities, total: liabilitiesTotal, addLiability, updateLiability, deleteLiability, isLoading: lLoading } = useLiabilities();
  const { investments, totalCurrent: investmentsCurrent, gainLoss: invGainLoss } = useInvestments();
  const { goals, totalTarget: goalsTarget, totalSaved: goalsSaved, overallPct: goalsPct } = useFinancialGoals();
  const { totalPolicies, totalCoverage, annualPremiumTotal, upcomingRenewals } = useInsurancePolicies();

  const [assetOpen, setAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [liabOpen, setLiabOpen] = useState(false);
  const [editingLiab, setEditingLiab] = useState<Liability | undefined>(undefined);

  const netWorth = assetsTotal - liabilitiesTotal;
  const recentInvestments = investments.slice(0, 5);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Wealth Dashboard</h1>
            <p className="text-xs text-muted-foreground">Today's snapshot of your net worth, investments, goals & protection.</p>
          </div>
        </div>

        {/* Today's Snapshot */}
        <WealthSnapshot
          netWorth={netWorth}
          assets={assetsTotal}
          liabilities={liabilitiesTotal}
          investments={investmentsCurrent}
          goalsSaved={goalsSaved}
          goalsTarget={goalsTarget}
          coverage={totalCoverage}
        />

        {/* Quick Actions */}
        <WealthQuickActions
          onAddAsset={() => { setEditingAsset(undefined); setAssetOpen(true); }}
          onAddLiability={() => { setEditingLiab(undefined); setLiabOpen(true); }}
        />

        {/* Health Score + Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <WealthHealthScore />
          </div>
          <div>
            <WealthReminders />
          </div>
        </div>

        {/* Smart Insights */}
        <SmartWealthInsights />

        {/* Recent Activity Timeline */}
        <WealthActivityTimeline />

        {/* Assets vs Liabilities visual */}
        <Card className="p-4 md:p-5 border shadow-soft">
          <h2 className="text-base font-bold mb-3">Assets vs Liabilities</h2>
          {(assetsTotal + liabilitiesTotal) === 0 ? (
            <p className="text-sm text-muted-foreground">Add assets or liabilities to see the balance.</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                <div className="bg-success" style={{ width: `${(assetsTotal / (assetsTotal + liabilitiesTotal)) * 100}%` }} />
                <div className="bg-destructive" style={{ width: `${(liabilitiesTotal / (assetsTotal + liabilitiesTotal)) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-success font-medium">Assets {fmt(assetsTotal)}</span>
                <span className="text-destructive font-medium">Liabilities {fmt(liabilitiesTotal)}</span>
              </div>
            </>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            Note: Investments are tracked separately in the Investments page. To include them in Net Worth,
            add an Asset of type <span className="font-medium">Investment</span> with the current portfolio value.
          </p>
        </Card>

        {/* Recent investments */}
        <Card className="p-4 md:p-5 border shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Recent Investments</h2>
            <Link to="/wealth/investments">
              <Button variant="outline" size="sm">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
            </Link>
          </div>
          {recentInvestments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm font-medium">No investments tracked yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Track your portfolio's performance over time.</p>
              <Link to="/wealth/investments"><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Investment</Button></Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentInvestments.map((inv) => {
                const meta = INVESTMENT_CATEGORIES.find((c) => c.value === inv.category)!;
                const diff = Number(inv.current_value) - Number(inv.invested_amount);
                const pos = diff >= 0;
                return (
                  <div key={inv.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{meta.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{inv.name}</p>
                        <p className="text-[11px] text-muted-foreground">{meta.label}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">{fmt(Number(inv.current_value))}</p>
                      <p className={cn("text-[11px] tabular-nums font-medium", pos ? "text-success" : "text-destructive")}>
                        {pos ? "+" : ""}{fmt(diff)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Goals & Insurance summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-4 md:p-5 border shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold">Financial Goals</h2>
              </div>
              <Link to="/wealth/goals"><Button variant="outline" size="sm">View <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button></Link>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals yet. Set one to start tracking progress.</p>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-success tabular-nums font-medium">{fmt(goalsSaved)}</span>
                  <span className="text-muted-foreground tabular-nums">{goalsPct.toFixed(0)}% of {fmt(goalsTarget)}</span>
                </div>
                <Progress value={goalsPct} className="h-2" />
                <p className="text-[11px] text-muted-foreground mt-2">{goals.length} goal{goals.length === 1 ? "" : "s"} tracked</p>
              </>
            )}
          </Card>

          <Card className="p-4 md:p-5 border shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold">Insurance</h2>
              </div>
              <Link to="/wealth/insurance"><Button variant="outline" size="sm">View <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button></Link>
            </div>
            {totalPolicies === 0 ? (
              <p className="text-sm text-muted-foreground">No policies yet. Add one to track coverage.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Policies</p>
                  <p className="text-lg font-bold tabular-nums">{totalPolicies}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Coverage</p>
                  <p className="text-lg font-bold tabular-nums text-success">{fmt(totalCoverage)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Annual</p>
                  <p className="text-lg font-bold tabular-nums">{fmt(annualPremiumTotal)}</p>
                </div>
                {upcomingRenewals.length > 0 && (
                  <p className="col-span-3 text-[11px] text-amber-600 font-medium mt-1">
                    {upcomingRenewals.length} renewal{upcomingRenewals.length === 1 ? "" : "s"} in next 30 days
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>




        {/* Assets */}
        <Card className="p-4 md:p-5 border shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Assets</h2>
            <Button size="sm" onClick={() => { setEditingAsset(undefined); setAssetOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Asset
            </Button>
          </div>
          {aLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : assets.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-foreground font-medium">No assets yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add cash, bank balances, investments, or gold.</p>
            </div>
          ) : (
            <div className="divide-y">
              {assets.map((a) => {
                const meta = ASSET_TYPES.find((t) => t.value === a.type) || ASSET_TYPES[4];
                return (
                  <div key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="text-xl">{meta.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                        <p className="text-[11px] text-muted-foreground">{meta.label}{a.notes ? ` • ${a.notes}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold text-success tabular-nums">{fmt(Number(a.value))}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAsset(a); setAssetOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                        if (confirm(`Delete "${a.name}"?`)) {
                          try { await deleteAsset(a.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message || "Failed"); }
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

        {/* Liabilities */}
        <Card className="p-4 md:p-5 border shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Liabilities</h2>
            <Button size="sm" onClick={() => { setEditingLiab(undefined); setLiabOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Liability
            </Button>
          </div>
          {lLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : liabilities.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-foreground font-medium">No liabilities</p>
              <p className="text-xs text-muted-foreground mt-1">Add loans, credit card dues, or mortgage.</p>
            </div>
          ) : (
            <div className="divide-y">
              {liabilities.map((l) => {
                const meta = LIABILITY_TYPES.find((t) => t.value === l.type) || LIABILITY_TYPES[3];
                return (
                  <div key={l.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="text-xl">{meta.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{l.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {meta.label}
                          {l.interest_rate != null ? ` • ${l.interest_rate}% p.a.` : ""}
                          {l.notes ? ` • ${l.notes}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold text-destructive tabular-nums">{fmt(Number(l.amount))}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLiab(l); setLiabOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                        if (confirm(`Delete "${l.name}"?`)) {
                          try { await deleteLiability(l.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message || "Failed"); }
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

      <AssetDialog
        open={assetOpen}
        onOpenChange={setAssetOpen}
        initial={editingAsset}
        onSave={async (data) => {
          if (editingAsset) {
            await updateAsset(editingAsset.id, data);
            toast.success("Asset updated");
          } else {
            await addAsset(data);
            toast.success("Asset added");
          }
        }}
      />
      <LiabilityDialog
        open={liabOpen}
        onOpenChange={setLiabOpen}
        initial={editingLiab}
        onSave={async (data) => {
          if (editingLiab) {
            await updateLiability(editingLiab.id, data);
            toast.success("Liability updated");
          } else {
            await addLiability(data);
            toast.success("Liability added");
          }
        }}
      />
    </div>
  );
}
