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
import { Wallet, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Scale, LineChart, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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

  const [assetOpen, setAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [liabOpen, setLiabOpen] = useState(false);
  const [editingLiab, setEditingLiab] = useState<Liability | undefined>(undefined);

  const netWorth = assetsTotal - liabilitiesTotal;
  const positive = netWorth >= 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Wealth</h1>
            <p className="text-xs text-muted-foreground">Track assets and liabilities to see your true net worth.</p>
          </div>
        </div>

        {/* Net worth summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 border shadow-medium">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Total Assets</p>
            </div>
            <p className="text-2xl font-bold text-success tabular-nums mt-1">{fmt(assetsTotal)}</p>
          </Card>
          <Card className="p-4 border shadow-medium">
            <div className="flex items-center gap-2 text-destructive">
              <TrendingDown className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Total Liabilities</p>
            </div>
            <p className="text-2xl font-bold text-destructive tabular-nums mt-1">{fmt(liabilitiesTotal)}</p>
          </Card>
          <Card className="p-4 border shadow-medium">
            <div className="flex items-center gap-2 text-primary">
              <Scale className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Net Worth</p>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums mt-1", positive ? "text-success" : "text-destructive")}>{fmt(netWorth)}</p>
          </Card>
        </div>

        {/* Assets */}
        <Card className="p-4 md:p-5 border shadow-medium">
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
        <Card className="p-4 md:p-5 border shadow-medium">
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
