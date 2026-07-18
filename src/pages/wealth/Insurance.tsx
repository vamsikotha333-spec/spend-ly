import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Plus, Pencil, Trash2, Shield, IndianRupee, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  useInsurancePolicies, InsurancePolicy, InsuranceType, PremiumFrequency,
  INSURANCE_TYPES, PREMIUM_FREQUENCIES, annualPremium,
} from "@/hooks/useInsurancePolicies";

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function PolicyDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: InsurancePolicy;
  onSave: (data: Omit<InsurancePolicy, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<InsuranceType>(initial?.type || "health");
  const [provider, setProvider] = useState(initial?.provider || "");
  const [policyNumber, setPolicyNumber] = useState(initial?.policy_number || "");
  const [coverage, setCoverage] = useState<string>(initial ? String(initial.coverage_amount) : "");
  const [premium, setPremium] = useState<string>(initial ? String(initial.premium_amount) : "");
  const [freq, setFreq] = useState<PremiumFrequency>(initial?.premium_frequency || "yearly");
  const [startDate, setStartDate] = useState(initial?.start_date || "");
  const [renewalDate, setRenewalDate] = useState(initial?.renewal_date || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Policy name is required"); return; }
    const c = Number(coverage); const p = Number(premium);
    if (!isFinite(c) || c < 0) { toast.error("Enter a valid coverage amount"); return; }
    if (!isFinite(p) || p < 0) { toast.error("Enter a valid premium amount"); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), type,
        provider: provider.trim() || null,
        policy_number: policyNumber.trim() || null,
        coverage_amount: c, premium_amount: p, premium_frequency: freq,
        start_date: startDate || null, renewal_date: renewalDate || null,
        notes: notes.trim() || null,
      });
      onOpenChange(false);
    } catch (e: any) { toast.error(e?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit Policy" : "Add Policy"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Policy Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Family Health Cover" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as InsuranceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSURANCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. HDFC Ergo" /></div>
          </div>
          <div><Label>Policy Number (optional)</Label><Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Coverage / Sum Assured (₹)</Label><Input type="number" inputMode="decimal" value={coverage} onChange={(e) => setCoverage(e.target.value)} /></div>
            <div><Label>Premium (₹)</Label><Input type="number" inputMode="decimal" value={premium} onChange={(e) => setPremium(e.target.value)} /></div>
          </div>
          <div>
            <Label>Premium Frequency</Label>
            <Select value={freq} onValueChange={(v) => setFreq(v as PremiumFrequency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PREMIUM_FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>Renewal / Expiry</Label><Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} /></div>
          </div>
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

export default function Insurance() {
  const {
    policies, totalPolicies, totalCoverage, annualPremiumTotal, upcomingRenewals,
    isLoading, addPolicy, updatePolicy, deletePolicy,
  } = useInsurancePolicies();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InsurancePolicy | undefined>(undefined);

  const now = new Date();
  const soon = new Date(); soon.setDate(now.getDate() + 30);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Insurance & Protection</h1>
              <p className="text-xs text-muted-foreground">Track policies, coverage, and premium commitments.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Policy
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border shadow-medium">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Total Policies</p>
            </div>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1">{totalPolicies}</p>
          </Card>
          <Card className="p-4 border shadow-medium">
            <div className="flex items-center gap-2 text-success">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Total Coverage</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-success tabular-nums mt-1">{fmt(totalCoverage)}</p>
          </Card>
          <Card className="p-4 border shadow-medium">
            <div className="flex items-center gap-2 text-destructive">
              <IndianRupee className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Annual Premium</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-destructive tabular-nums mt-1">{fmt(annualPremiumTotal)}</p>
          </Card>
          <Card className="p-4 border shadow-medium">
            <div className="flex items-center gap-2 text-primary">
              <CalendarClock className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Renewals (30d)</p>
            </div>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1">{upcomingRenewals.length}</p>
          </Card>
        </div>

        <Card className="p-4 md:p-5 border shadow-medium">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : policies.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold">No policies yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Add your first insurance policy to track coverage and premiums.</p>
              <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Policy
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {policies.map((p) => {
                const meta = INSURANCE_TYPES.find((t) => t.value === p.type) || INSURANCE_TYPES[5];
                const freqMeta = PREMIUM_FREQUENCIES.find((f) => f.value === p.premium_frequency)!;
                const renewSoon = p.renewal_date ? (new Date(p.renewal_date) >= now && new Date(p.renewal_date) <= soon) : false;
                const expired = p.renewal_date ? new Date(p.renewal_date) < now : false;
                return (
                  <div key={p.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          {renewSoon && <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">Renews soon</Badge>}
                          {expired && <Badge variant="outline" className="text-[10px] border-destructive text-destructive">Expired</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {meta.label}{p.provider ? ` • ${p.provider}` : ""}
                        </p>
                        <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>Coverage: <span className="font-medium text-foreground tabular-nums">{fmt(Number(p.coverage_amount))}</span></span>
                          <span>Premium: <span className="font-medium text-foreground tabular-nums">{fmt(Number(p.premium_amount))}</span> / {freqMeta.label.toLowerCase()}</span>
                          <span>Annual: <span className="font-medium text-foreground tabular-nums">{fmt(annualPremium(p))}</span></span>
                          {p.renewal_date && <span>Renewal: <span className="font-medium text-foreground">{new Date(p.renewal_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                        if (confirm(`Delete "${p.name}"?`)) {
                          try { await deletePolicy(p.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message || "Failed"); }
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

      <PolicyDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={async (data) => {
          if (editing) { await updatePolicy(editing.id, data); toast.success("Policy updated"); }
          else { await addPolicy(data); toast.success("Policy added"); }
        }}
      />
    </div>
  );
}
