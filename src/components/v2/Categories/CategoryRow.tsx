import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCategories,
  categoryDisplay,
  type Category,
} from "@/hooks/useCategories";
import { normalizeName } from "@/utils/categoryNormalize";
import { CategoryIcon, categoryLabel } from "@/utils/categoryIcon";

interface CategoryRowProps {
  category: Category;
  count: number;
  onRequestDelete: (category: Category, count: number) => void;
}

export function CategoryRow({ category, count, onRequestDelete }: CategoryRowProps) {
  const { updateCategory, isUpdating } = useCategories();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(category.name);
      setError(null);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, category.name]);

  const handleSave = async () => {
    setError(null);
    const clean = normalizeName(draft);
    if (!clean) {
      setError("Name is required");
      return;
    }
    if (clean === category.name) {
      setEditing(false);
      return;
    }
    try {
      await updateCategory(category, { name: clean });
      toast.success(`Renamed to "${clean}"`);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || "Failed to rename");
    }
  };

  const handleToggleBudget = async (checked: boolean) => {
    try {
      await updateCategory(category, { budget_tracking: checked });
      toast.success(
        checked ? "Budget tracking enabled" : "Budget tracking disabled",
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg border bg-card transition-all",
        "hover:shadow-sm hover:border-primary/30",
      )}
    >
      {editing ? (
        <>
          <div className="flex-1 flex items-center gap-2">
            <CategoryIcon category={categoryDisplay(category)} className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditing(false);
                }}
                className={cn("h-9", error && "border-destructive")}
                disabled={isUpdating}
              />
              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setEditing(false)}
            disabled={isUpdating}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <CategoryIcon category={categoryDisplay(category)} className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">
              {categoryLabel(categoryDisplay(category))}
            </span>
            {category.is_default && (
              <Badge
                variant="outline"
                className="shrink-0 font-normal text-[10px] px-1.5 py-0 h-4"
              >
                Default
              </Badge>
            )}
            <Badge variant="secondary" className="shrink-0 font-normal">
              {count} {count === 1 ? "txn" : "txns"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <span className="hidden sm:inline">Budget</span>
              <Switch
                checked={category.budget_tracking}
                onCheckedChange={handleToggleBudget}
                disabled={isUpdating}
                aria-label="Toggle budget tracking"
              />
            </label>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setEditing(true)}
                aria-label="Rename category"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRequestDelete(category, count)}
                aria-label="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
