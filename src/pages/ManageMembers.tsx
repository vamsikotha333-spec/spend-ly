import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Loader2, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useMembers, type Member } from "@/hooks/useMembers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageMembers() {
  const { members, isLoading, addMember, renameMember, deleteMember, isMutating } =
    useMembers();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const handleAdd = async () => {
    const v = newName.trim();
    if (!v) return;
    try {
      await addMember(v);
      setNewName("");
      toast.success("Member added");
    } catch (e: any) {
      toast.error(e?.message?.includes("duplicate") ? "Member already exists" : "Failed to add member");
    }
  };

  const startEdit = (m: Member) => {
    setEditingId(m.id);
    setEditValue(m.name);
  };

  const saveEdit = async (m: Member) => {
    const v = editValue.trim();
    if (!v || v === m.name) {
      setEditingId(null);
      return;
    }
    try {
      await renameMember(m, v);
      setEditingId(null);
      toast.success("Member renamed");
    } catch (e: any) {
      toast.error(e?.message?.includes("duplicate") ? "Name already in use" : "Failed to rename");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMember(deleteTarget);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage the people/entities used in Added By and Applicable To.
          </p>
        </div>
      </div>

      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a member (e.g. Mom, John, Office)…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="h-10"
          />
          <Button onClick={handleAdd} disabled={!newName.trim() || isMutating} className="h-10">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            No members yet — add your first one above. They'll appear in Added By and
            Applicable To dropdowns across the app.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const isEditing = editingId === m.id;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border bg-card"
                >
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(m);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                    />
                  ) : (
                    <span className="font-medium">{m.name}</span>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(m)} className="h-8 w-8">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(m)} className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(m)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Removing a member won't affect existing transactions — historical records keep
          the original name and continue to show in reports.
        </p>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This member will no longer appear in dropdowns for new entries. Existing
              transactions and analytics that reference this name remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
