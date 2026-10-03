import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useInvestments } from "@/hooks/useInvestments";

export const isMutualFundCategory = (c: string) => /mutual\s*fund/i.test(c || "");
export const isMutualFundType = (t: string | null | undefined) => /mutual\s*fund/i.test(t || "");

export function MutualFundSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { investments } = useInvestments();
  const qc = useQueryClient();
  const funds = useMemo(
    () => investments.filter((i) => isMutualFundType(i.type_name) || i.category === "mutual_funds"),
    [investments],
  );
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const addFund = async () => {
    const n = name.trim().replace(/\s+/g, " ");
    if (!n) return;
    const existing = funds.find((f) => f.name.trim().toLowerCase() === n.toLowerCase());
    if (existing) {
      onChange(existing.id);
      setAdding(false); setName("");
      toast.info("Fund already exists — selected it");
      return;
    }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any).from("investments").insert({
        user_id: u.user.id, name: n, type_name: "Mutual Fund", category: "mutual_funds",
        invested_amount: 0, current_value: 0, tags: [],
      }).select("id").single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["investments"] });
      onChange(data.id);
      setAdding(false); setName("");
      toast.success("Mutual fund added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add fund");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-2">
      <Label>Mutual Fund *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12">
          <SelectValue placeholder={funds.length ? "Select fund" : "No funds yet — add one"} />
        </SelectTrigger>
        <SelectContent>
          {funds.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {adding ? (
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fund name" className="h-10"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFund(); } }} />
          <Button type="button" onClick={addFund} disabled={saving} className="h-10">Add</Button>
          <Button type="button" variant="ghost" onClick={() => setAdding(false)} className="h-10">Cancel</Button>
        </div>
      ) : (
        <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3 mr-1" /> Add new mutual fund
        </Button>
      )}
    </div>
  );
}
