import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { useMembers } from "@/hooks/useMembers";
import type { Asset, AssetType } from "@/hooks/useAssets";
import type { Liability, LiabilityType } from "@/hooks/useLiabilities";
import {
  Banknote, Landmark, TrendingUp, Coins, Home, Package, CreditCard, HandCoins, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const NO_MEMBER = "__none__";

export const ASSET_TYPES: { value: AssetType; label: string; Icon: LucideIcon }[] = [
  { value: "cash", label: "Cash", Icon: Banknote },
  { value: "bank", label: "Bank Account", Icon: Landmark },
  { value: "investment", label: "Investments", Icon: TrendingUp },
  { value: "gold", label: "Gold", Icon: Coins },
  { value: "real_estate", label: "Real Estate", Icon: Home },
  { value: "other", label: "Other", Icon: Package },
];

export const LIABILITY_TYPES: { value: LiabilityType; label: string; Icon: LucideIcon }[] = [
  { value: "loan", label: "Loan", Icon: HandCoins },
  { value: "credit_card", label: "Credit Card", Icon: CreditCard },
  { value: "mortgage", label: "Mortgage", Icon: Home },
  { value: "other", label: "Other", Icon: FileText },
];

export function assetTypeMeta(type: string) {
  return ASSET_TYPES.find((t) => t.value === type) || ASSET_TYPES[ASSET_TYPES.length - 1];
}
export function liabilityTypeMeta(type: string) {
  return LIABILITY_TYPES.find((t) => t.value === type) || LIABILITY_TYPES[LIABILITY_TYPES.length - 1];
}

function MemberField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { members } = useMembers();
  return (
    <div>
      <Label>Belongs to (optional)</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Not assigned" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_MEMBER}>Not assigned</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface AssetPayload {
  name: string; type: AssetType; value: number; notes: string | null; member: string | null;
}

export function AssetDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Asset;
  onSave: (data: AssetPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("bank");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [member, setMember] = useState(NO_MEMBER);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setType((initial?.type as AssetType) || "bank");
    setValue(initial ? String(initial.value) : "");
    setNotes(initial?.notes || "");
    setMember(initial?.member || NO_MEMBER);
  }, [open, initial]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const v = Number(value);
    if (!isFinite(v) || v < 0) { toast.error("Enter a valid value"); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), type, value: v,
        notes: notes.trim() || null,
        member: member === NO_MEMBER ? null : member,
      });
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
                {ASSET_TYPES.map(({ value: v, label, Icon }) => (
                  <SelectItem key={v} value={v}>
                    <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Current value (₹)</Label>
            <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </div>
          <MemberField value={member} onChange={setMember} />
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

export interface LiabilityPayload {
  name: string; type: LiabilityType; amount: number; interest_rate: number | null;
  notes: string | null; member: string | null;
}

export function LiabilityDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Liability;
  onSave: (data: LiabilityPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<LiabilityType>("loan");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");
  const [member, setMember] = useState(NO_MEMBER);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setType((initial?.type as LiabilityType) || "loan");
    setAmount(initial ? String(initial.amount) : "");
    setRate(initial?.interest_rate != null ? String(initial.interest_rate) : "");
    setNotes(initial?.notes || "");
    setMember(initial?.member || NO_MEMBER);
  }, [open, initial]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const a = Number(amount);
    if (!isFinite(a) || a < 0) { toast.error("Enter a valid amount"); return; }
    const r = rate ? Number(rate) : null;
    if (r != null && (!isFinite(r) || r < 0)) { toast.error("Enter a valid interest rate"); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), type, amount: a, interest_rate: r,
        notes: notes.trim() || null,
        member: member === NO_MEMBER ? null : member,
      });
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
                {LIABILITY_TYPES.map(({ value: v, label, Icon }) => (
                  <SelectItem key={v} value={v}>
                    <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Outstanding (₹)</Label>
              <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Interest % (optional)</Label>
              <Input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
          </div>
          <MemberField value={member} onChange={setMember} />
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
