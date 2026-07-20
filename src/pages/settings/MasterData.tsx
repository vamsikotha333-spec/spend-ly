import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useMasterData, MasterDataKind } from "@/hooks/useMasterData";
import { Pencil, Trash2, Plus, Loader2, Search, Database, ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const KINDS: { value: MasterDataKind; label: string; description: string }[] = [
  { value: "investment_type", label: "Investment Types", description: "Types like Stocks, Mutual Fund, Gold, FD…" },
  { value: "investment_purpose", label: "Investment Purposes", description: "Why you invested — Retirement, Emergency, House…" },
  { value: "tag", label: "Tags", description: "Optional labels for investments and more" },
  { value: "bank_name", label: "Bank Names", description: "Institutions where investments/accounts are held" },
  { value: "interest_type", label: "Interest Types", description: "Simple / Compound (used in Interest Turnover)" },
  { value: "asset_type", label: "Asset Types", description: "Categories for physical/financial assets" },
  { value: "liability_type", label: "Liability Types", description: "Categories for loans and debts" },
];

function KindPanel({ kind }: { kind: MasterDataKind }) {
  const { items, isLoading, addItem, isAdding, renameItem, isRenaming, deleteItem } = useMasterData(kind);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase())),
    [items, search],
  );

  const handleAdd = async () => {
    const clean = newName.trim();
    if (!clean) return;
    try {
      await addItem({ kind, name: clean });
      toast.success(`Added "${clean}"`);
      setNewName("");
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  const handleRename = async (id: string) => {
    const clean = draft.trim();
    if (!clean) return toast.error("Name required");
    try {
      await renameItem({ id, name: clean });
      toast.success("Renamed");
      setEditingId(null);
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This won't affect records that already use this value.`)) return;
    try {
      await deleteItem(id);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Add new…"
            className="md:w-64"
          />
          <Button onClick={handleAdd} disabled={isAdding || !newName.trim()}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No entries.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {filtered.map((i) => {
            const editing = editingId === i.id;
            return (
              <div key={i.id} className="flex items-center gap-2 px-3 py-2">
                {editing ? (
                  <>
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(i.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 flex-1"
                      disabled={isRenaming}
                    />
                    <Button size="sm" onClick={() => handleRename(i.id)} disabled={isRenaming}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm truncate">{i.name}</span>
                    {i.is_default && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Star className="h-3 w-3" /> Default
                      </Badge>
                    )}
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => { setEditingId(i.id); setDraft(i.name); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(i.id, i.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Deleting a value does not affect existing records that already reference it.
      </p>
    </div>
  );
}

export default function MasterData() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Master Data</h1>
            <p className="text-xs text-muted-foreground">
              Manage the reusable dropdown values used across the app.
            </p>
          </div>
        </div>

        <Card className="p-4 md:p-6">
          <Tabs defaultValue={KINDS[0].value}>
            <TabsList className="flex flex-wrap h-auto">
              {KINDS.map((k) => (
                <TabsTrigger key={k.value} value={k.value} className="text-xs md:text-sm">
                  {k.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {KINDS.map((k) => (
              <TabsContent key={k.value} value={k.value} className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">{k.description}</p>
                <KindPanel kind={k.value} />
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
