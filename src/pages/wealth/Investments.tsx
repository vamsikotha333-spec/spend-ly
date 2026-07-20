import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { MasterDataCombobox } from "@/components/common/MasterDataCombobox";
import { TagsMultiSelect } from "@/components/common/TagsMultiSelect";
import {
  useInvestments, Investment, typeEmoji,
} from "@/hooks/useInvestments";
import { calcInterest, InterestFrequency, InterestType } from "@/lib/interestCalc";
import {
  TrendingUp, Plus, Pencil, Trash2, PieChart as PieIcon, Wallet,
  Search, Filter, ArrowUpDown, Coins, Sparkles, Database,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#a855f7", "#ef4444", "#0ea5e9", "#64748b"];

/* ------------------------- Investment Dialog ------------------------- */

interface FormData {
  name: string;
  type_name: string;
  purpose: string;
  bank_name: string;
  tags: string[];
  invested_amount: string;
  current_value: string;
  invested_on: string;
  status: string;
  notes: string;
  // Interest turnover
  principal_amount: string;
  borrower_name: string;
  interest_rate: string;
  interest_type: string;
  interest_frequency: string;
  start_date: string;
  due_date: string;
  interest_received: string;
}

function emptyForm(): FormData {
  return {
    name: "", type_name: "", purpose: "", bank_name: "", tags: [],
    invested_amount: "", current_value: "",
    invested_on: new Date().toISOString().slice(0, 10),
    status: "active", notes: "",
    principal_amount: "", borrower_name: "", interest_rate: "",
    interest_type: "Simple Interest", interest_frequency: "Monthly",
    start_date: "", due_date: "", interest_received: "0",
  };
}

function fromInvestment(i: Investment): FormData {
  return {
    name: i.name,
    type_name: i.type_name || "",
    purpose: i.purpose || "",
    bank_name: i.bank_name || "",
    tags: i.tags || [],
    invested_amount: String(i.invested_amount ?? ""),
    current_value: String(i.current_value ?? ""),
    invested_on: i.invested_on,
    status: i.status || "active",
    notes: i.notes || "",
    principal_amount: i.principal_amount != null ? String(i.principal_amount) : "",
    borrower_name: i.borrower_name || "",
    interest_rate: i.interest_rate != null ? String(i.interest_rate) : "",
    interest_type: i.interest_type || "Simple Interest",
    interest_frequency: i.interest_frequency || "Monthly",
    start_date: i.start_date || "",
    due_date: i.due_date || "",
    interest_received: String(i.interest_received ?? 0),
  };
}

function InvestmentDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Investment;
  onSave: (data: Partial<Investment>) => Promise<void>;
}) {
  const [form, setForm] = useState<FormData>(() => (initial ? fromInvestment(initial) : emptyForm()));
  const [saving, setSaving] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (open) setForm(initial ? fromInvestment(initial) : emptyForm());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const isInterest = (form.type_name || "").toLowerCase().includes("interest");

  const interestPreview = useMemo(() => {
    if (!isInterest) return null;
    return calcInterest({
      principal: Number(form.principal_amount || 0),
      rate: Number(form.interest_rate || 0),
      interestType: (form.interest_type as InterestType) || "Simple Interest",
      frequency: (form.interest_frequency as InterestFrequency) || "Monthly",
      startDate: form.start_date || null,
      dueDate: form.due_date || null,
      interestReceived: Number(form.interest_received || 0),
    });
  }, [isInterest, form.principal_amount, form.interest_rate, form.interest_type, form.interest_frequency, form.start_date, form.due_date, form.interest_received]);

  const setField = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.type_name.trim()) return toast.error("Investment Type is required");

    // For interest turnover we can derive amounts from principal if missing.
    let invested = Number(form.invested_amount);
    let current = Number(form.current_value);
    if (isInterest) {
      const p = Number(form.principal_amount || 0);
      if (!isFinite(invested) || invested <= 0) invested = p;
      if (!isFinite(current) || current <= 0) {
        current = p + Number(interestPreview?.totalInterestEarned || 0);
      }
    }
    if (!isFinite(invested) || invested < 0) return toast.error("Enter a valid invested amount");
    if (!isFinite(current) || current < 0) return toast.error("Enter a valid current value");

    setSaving(true);
    try {
      const payload: Partial<Investment> = {
        name: form.name.trim(),
        type_name: form.type_name.trim(),
        purpose: form.purpose.trim() || null,
        bank_name: form.bank_name.trim() || null,
        tags: form.tags,
        invested_amount: invested,
        current_value: current,
        invested_on: form.invested_on,
        status: form.status || "active",
        notes: form.notes.trim() || null,
        principal_amount: isInterest ? Number(form.principal_amount || 0) : null,
        borrower_name: isInterest ? (form.borrower_name.trim() || null) : null,
        interest_rate: isInterest ? Number(form.interest_rate || 0) : null,
        interest_type: isInterest ? (form.interest_type as InterestType) : null,
        interest_frequency: isInterest ? (form.interest_frequency as InterestFrequency) : null,
        start_date: isInterest ? (form.start_date || null) : null,
        due_date: isInterest ? (form.due_date || null) : null,
        interest_received: isInterest ? Number(form.interest_received || 0) : 0,
      };
      await onSave(payload);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Investment" : "Add Investment"}</DialogTitle>
          <DialogDescription>Track invested amount, current value, and optional details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Investment Name *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. HDFC Flexi Cap SIP" />
            </div>
            <div>
              <Label>Investment Type *</Label>
              <MasterDataCombobox kind="investment_type" value={form.type_name} onChange={(v) => setField("type_name", v)} placeholder="Select type" />
            </div>
            <div>
              <Label>Investment Purpose</Label>
              <MasterDataCombobox kind="investment_purpose" value={form.purpose} onChange={(v) => setField("purpose", v)} placeholder="Why this investment?" />
            </div>
            <div>
              <Label>Bank / Institution</Label>
              <MasterDataCombobox kind="bank_name" value={form.bank_name} onChange={(v) => setField("bank_name", v)} placeholder="Optional" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="matured">Matured</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Tags <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <TagsMultiSelect value={form.tags} onChange={(v) => setField("tags", v)} />
            </div>
          </div>

          {!isInterest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Invested Amount (₹) *</Label>
                <Input type="number" inputMode="decimal" value={form.invested_amount} onChange={(e) => setField("invested_amount", e.target.value)} />
              </div>
              <div>
                <Label>Current Value (₹) *</Label>
                <Input type="number" inputMode="decimal" value={form.current_value} onChange={(e) => setField("current_value", e.target.value)} />
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={form.invested_on} onChange={(e) => setField("invested_on", e.target.value)} />
              </div>
            </div>
          )}

          {isInterest && (
            <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Interest Turnover Details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Principal Amount (₹) *</Label>
                  <Input type="number" inputMode="decimal" value={form.principal_amount} onChange={(e) => setField("principal_amount", e.target.value)} />
                </div>
                <div>
                  <Label>Borrower Name</Label>
                  <Input value={form.borrower_name} onChange={(e) => setField("borrower_name", e.target.value)} placeholder="Who owes this money?" />
                </div>
                <div>
                  <Label>Interest Rate (% per annum)</Label>
                  <Input type="number" inputMode="decimal" value={form.interest_rate} onChange={(e) => setField("interest_rate", e.target.value)} />
                </div>
                <div>
                  <Label>Interest Type</Label>
                  <MasterDataCombobox kind="interest_type" value={form.interest_type} onChange={(v) => setField("interest_type", v)} />
                </div>
                <div>
                  <Label>Interest Frequency</Label>
                  <Select value={form.interest_frequency} onValueChange={(v) => setField("interest_frequency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interest Received So Far (₹)</Label>
                  <Input type="number" inputMode="decimal" value={form.interest_received} onChange={(e) => setField("interest_received", e.target.value)} />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setField("due_date", e.target.value)} />
                </div>
              </div>

              {interestPreview && Number(form.principal_amount || 0) > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                  <div className="rounded-md bg-background p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Monthly</p>
                    <p className="text-sm font-bold tabular-nums">{fmt(interestPreview.monthlyInterest)}</p>
                  </div>
                  <div className="rounded-md bg-background p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Earned</p>
                    <p className="text-sm font-bold tabular-nums text-success">{fmt(interestPreview.totalInterestEarned)}</p>
                  </div>
                  <div className="rounded-md bg-background p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Pending</p>
                    <p className="text-sm font-bold tabular-nums text-warning">{fmt(interestPreview.interestPending)}</p>
                  </div>
                  <div className="rounded-md bg-background p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Maturity</p>
                    <p className="text-sm font-bold tabular-nums text-primary">{fmt(interestPreview.expectedMaturityAmount)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} placeholder="Optional details, goals, or observations…" />
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

/* ------------------------- Page ------------------------- */

type SortKey = "latest" | "oldest" | "highest_invested" | "lowest_invested" | "highest_return" | "lowest_return" | "alpha";

export default function Investments() {
  const {
    investments, totalInvested, totalCurrent, gainLoss, returnPct,
    monthlyInterestIncome, totalPassiveIncome,
    isLoading, addInvestment, updateInvestment, deleteInvestment,
  } = useInvestments();

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | undefined>();

  // Filters
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState<string>("all");
  const [fPurpose, setFPurpose] = useState<string>("all");
  const [fBank, setFBank] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fTag, setFTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("latest");

  const types = useMemo(() => Array.from(new Set(investments.map((i) => i.type_name).filter(Boolean))) as string[], [investments]);
  const purposes = useMemo(() => Array.from(new Set(investments.map((i) => i.purpose).filter(Boolean))) as string[], [investments]);
  const banks = useMemo(() => Array.from(new Set(investments.map((i) => i.bank_name).filter(Boolean))) as string[], [investments]);
  const allTags = useMemo(() => Array.from(new Set(investments.flatMap((i) => i.tags || []))), [investments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = investments.filter((i) => {
      if (fType !== "all" && i.type_name !== fType) return false;
      if (fPurpose !== "all" && i.purpose !== fPurpose) return false;
      if (fBank !== "all" && i.bank_name !== fBank) return false;
      if (fStatus !== "all" && (i.status || "active") !== fStatus) return false;
      if (fTag !== "all" && !(i.tags || []).includes(fTag)) return false;
      if (q) {
        const hay = `${i.name} ${i.notes || ""} ${i.borrower_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const returnOf = (i: Investment) => {
      const inv = Number(i.invested_amount || 0);
      return inv > 0 ? ((Number(i.current_value || 0) - inv) / inv) * 100 : 0;
    };
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "latest": return b.invested_on.localeCompare(a.invested_on);
        case "oldest": return a.invested_on.localeCompare(b.invested_on);
        case "highest_invested": return Number(b.invested_amount) - Number(a.invested_amount);
        case "lowest_invested": return Number(a.invested_amount) - Number(b.invested_amount);
        case "highest_return": return returnOf(b) - returnOf(a);
        case "lowest_return": return returnOf(a) - returnOf(b);
        case "alpha": return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [investments, search, fType, fPurpose, fBank, fStatus, fTag, sortBy]);

  const allocation = useMemo(() => {
    const map = new Map<string, number>();
    investments.forEach((i) => {
      const key = i.type_name || "Other";
      map.set(key, (map.get(key) || 0) + Number(i.current_value || 0));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [investments]);

  const gainPositive = gainLoss >= 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Investments</h1>
              <p className="text-xs text-muted-foreground">Track your portfolio's invested value, current value, returns and interest income.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/settings/master-data")}>
              <Database className="h-4 w-4 mr-1" /> Master Data
            </Button>
            <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Investment
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Invested</p>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1">{fmt(totalInvested)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{investments.length} investment{investments.length === 1 ? "" : "s"}</p>
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
            <p className={cn("text-[11px] mt-1 font-medium", gainPositive ? "text-success" : "text-destructive")}>
              {returnPct.toFixed(2)}% return
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Passive Income
            </p>
            <p className="text-xl md:text-2xl font-bold tabular-nums mt-1 text-success">{fmt(monthlyInterestIncome)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">per month • {fmt(totalPassiveIncome)} earned</p>
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

        {/* Filters + list */}
        <Card className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold">All Investments</h2>
            <span className="text-xs text-muted-foreground">({filtered.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            <div className="relative lg:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or notes…" className="pl-9" />
            </div>
            <Select value={fType} onValueChange={setFType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fPurpose} onValueChange={setFPurpose}>
              <SelectTrigger><SelectValue placeholder="Purpose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {purposes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fBank} onValueChange={setFBank}>
              <SelectTrigger><SelectValue placeholder="Bank" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                {banks.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="matured">Matured</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {allTags.length > 0 && (
              <Select value={fTag} onValueChange={setFTag}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <div className="ml-auto flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="highest_invested">Highest Investment</SelectItem>
                  <SelectItem value="lowest_invested">Lowest Investment</SelectItem>
                  <SelectItem value="highest_return">Highest Return</SelectItem>
                  <SelectItem value="lowest_return">Lowest Return</SelectItem>
                  <SelectItem value="alpha">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : investments.length === 0 ? (
            <EmptyState
              illustration="goals"
              title="No Investments Yet"
              description="Start tracking your portfolio — stocks, mutual funds, FDs, gold, interest turnover and more."
              actionLabel="Add Investment"
              onAction={() => { setEditing(undefined); setOpen(true); }}
            />
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Wallet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No investments match these filters</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b">
                      <th className="py-2 pr-2 font-semibold">Name</th>
                      <th className="py-2 pr-2 font-semibold">Type</th>
                      <th className="py-2 pr-2 font-semibold">Purpose</th>
                      <th className="py-2 pr-2 font-semibold">Tags</th>
                      <th className="py-2 pr-2 font-semibold text-right">Invested</th>
                      <th className="py-2 pr-2 font-semibold text-right">Current</th>
                      <th className="py-2 pr-2 font-semibold text-right">P/L</th>
                      <th className="py-2 pr-2 font-semibold text-right">Return</th>
                      <th className="py-2 pr-2 font-semibold">Status</th>
                      <th className="py-2 pr-2 font-semibold">Updated</th>
                      <th className="py-2 pr-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((inv) => {
                      const diff = Number(inv.current_value) - Number(inv.invested_amount);
                      const pct = Number(inv.invested_amount) > 0 ? (diff / Number(inv.invested_amount)) * 100 : 0;
                      const pos = diff >= 0;
                      return (
                        <tr key={inv.id} className="hover:bg-muted/40">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <span>{typeEmoji(inv.type_name)}</span>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{inv.name}</p>
                                {inv.bank_name && <p className="text-[10px] text-muted-foreground truncate">{inv.bank_name}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-muted-foreground">{inv.type_name || "—"}</td>
                          <td className="py-2 pr-2 text-muted-foreground">{inv.purpose || "—"}</td>
                          <td className="py-2 pr-2">
                            <div className="flex flex-wrap gap-1">
                              {(inv.tags || []).slice(0, 3).map((t) => (
                                <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5">{t}</Badge>
                              ))}
                              {(inv.tags || []).length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{inv.tags.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums">{fmt(Number(inv.invested_amount))}</td>
                          <td className="py-2 pr-2 text-right tabular-nums font-semibold">{fmt(Number(inv.current_value))}</td>
                          <td className={cn("py-2 pr-2 text-right tabular-nums font-medium", pos ? "text-success" : "text-destructive")}>
                            {pos ? "+" : ""}{fmt(diff)}
                          </td>
                          <td className={cn("py-2 pr-2 text-right tabular-nums font-medium", pos ? "text-success" : "text-destructive")}>
                            {pct.toFixed(1)}%
                          </td>
                          <td className="py-2 pr-2">
                            <Badge variant={inv.status === "active" ? "default" : "outline"} className="text-[10px]">
                              {inv.status || "active"}
                            </Badge>
                          </td>
                          <td className="py-2 pr-2 text-[11px] text-muted-foreground">
                            {new Date(inv.updated_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-0 text-right">
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {filtered.map((inv) => {
                  const diff = Number(inv.current_value) - Number(inv.invested_amount);
                  const pct = Number(inv.invested_amount) > 0 ? (diff / Number(inv.invested_amount)) * 100 : 0;
                  const pos = diff >= 0;
                  return (
                    <div key={inv.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-start gap-2">
                          <span className="text-lg">{typeEmoji(inv.type_name)}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{inv.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {inv.type_name}{inv.purpose ? ` • ${inv.purpose}` : ""}
                            </p>
                            {(inv.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {inv.tags.slice(0, 3).map((t) => (
                                  <Badge key={t} variant="secondary" className="text-[9px] py-0 px-1.5">{t}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold tabular-nums">{fmt(Number(inv.current_value))}</p>
                          <p className={cn("text-[11px] font-medium tabular-nums", pos ? "text-success" : "text-destructive")}>
                            {pos ? "+" : ""}{fmt(diff)} ({pct.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">Invested {fmt(Number(inv.invested_amount))}</p>
                        <div className="flex gap-1">
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
                    </div>
                  );
                })}
              </div>
            </>
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
            await addInvestment(data as any);
            toast.success("Investment added");
          }
        }}
      />
    </div>
  );
}
