import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CategoryCombobox } from "./CategoryCombobox";
import {
  useCategories,
  categoryDisplay,
  type Category,
} from "@/hooks/useCategories";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  count: number;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  count,
}: DeleteCategoryDialogProps) {
  const { deleteCategory, isDeleting } = useCategories();
  const [mode, setMode] = useState<"choose" | "reassign">("choose");
  const [reassignTo, setReassignTo] = useState("");

  useEffect(() => {
    if (open) {
      setMode("choose");
      setReassignTo("");
    }
  }, [open]);

  if (!category) return null;

  const hasTransactions = count > 0;

  const handleSimpleDelete = async () => {
    try {
      await deleteCategory(category, "empty");
      toast.success(`Deleted "${category.name}"`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handleReassign = async () => {
    if (!reassignTo) {
      toast.error("Pick a target category");
      return;
    }
    try {
      await deleteCategory(category, "reassign", reassignTo);
      toast.success(
        `Moved ${count} transaction${count === 1 ? "" : "s"} to "${reassignTo}"`,
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reassign");
    }
  };

  const handleUncategorize = async () => {
    try {
      await deleteCategory(category, "uncategorized");
      toast.success(
        `Marked ${count} transaction${count === 1 ? "" : "s"} as Uncategorized`,
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasTransactions && (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            Delete "{categoryDisplay(category)}"?
          </DialogTitle>
          <DialogDescription>
            {hasTransactions
              ? `This category has ${count} transaction${count === 1 ? "" : "s"}. What would you like to do?`
              : "This category is not used by any transaction."}
          </DialogDescription>
        </DialogHeader>

        {!hasTransactions ? (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSimpleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        ) : mode === "choose" ? (
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => setMode("reassign")}
              disabled={isDeleting}
            >
              <div className="text-left">
                <div className="font-medium">Reassign transactions</div>
                <div className="text-xs text-muted-foreground">
                  Move them to another category, then delete this one
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 hover:bg-destructive/5 hover:border-destructive/50"
              onClick={handleUncategorize}
              disabled={isDeleting}
            >
              <div className="text-left">
                <div className="font-medium text-destructive">
                  Delete anyway
                </div>
                <div className="text-xs text-muted-foreground">
                  Mark transactions as "Uncategorized"
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Move transactions to</Label>
              <CategoryCombobox
                type={category.type}
                value={reassignTo}
                onChange={setReassignTo}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMode("choose")}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                onClick={handleReassign}
                disabled={isDeleting || !reassignTo}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reassign & Delete
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
