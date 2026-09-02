import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCategories,
  useCategoryUsageCounts,
  categoryDisplay,
  type Category,
  type CategoryType,
} from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { normalizeName } from "@/utils/categoryNormalize";
import { CategoryIcon, categoryLabel } from "@/utils/categoryIcon";

interface CategoryComboboxProps {
  type: CategoryType;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CategoryCombobox({
  type,
  value,
  onChange,
  className,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { categories, isLoading, addCategory, isAdding, renameCategory, isRenaming } =
    useCategories(type);
  const { transactions } = useTransactions();
  const counts = useCategoryUsageCounts(categories, transactions);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const trimmedSearch = search.trim();
  const normalized = normalizeName(trimmedSearch);

  const exactMatch = useMemo(
    () =>
      categories.find(
        (c) => c.name.toLowerCase() === normalized.toLowerCase(),
      ),
    [categories, normalized],
  );

  const handleCreate = async () => {
    if (!normalized) return;
    try {
      const created = await addCategory(normalized, type);
      onChange(categoryDisplay(created));
      setSearch("");
      setOpen(false);
      toast.success(`Added category "${created.name}"`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add category");
    }
  };

  const startEdit = (e: React.MouseEvent, c: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(c.id);
    setEditDraft(c.name);
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = async (c: Category) => {
    const clean = normalizeName(editDraft);
    if (!clean) {
      toast.error("Name is required");
      return;
    }
    if (clean === c.name) {
      cancelEdit();
      return;
    }
    try {
      const oldDisplay = categoryDisplay(c);
      await renameCategory(c, clean);
      const newDisplay = c.emoji ? `${c.emoji} ${clean}` : clean;
      if (value === oldDisplay) onChange(newDisplay);
      toast.success(`Renamed to "${clean}"`);
      cancelEdit();
    } catch (err: any) {
      toast.error(err?.message || "Failed to rename");
    }
  };

  const requestDelete = (e: React.MouseEvent, c: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(c);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-12 justify-between font-normal transition-all",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {value ? (
            <span className="flex items-center gap-2 min-w-0">
              <CategoryIcon category={value} className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{categoryLabel(value)}</span>
            </span>
          ) : (
            "Select category"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50"
        align="start"
      >
        <Command
          filter={(value, search) => {
            if (!search) return 1;
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="Search or add category..."
            className="h-10"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {trimmedSearch ? (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isAdding}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:bg-accent rounded-sm transition-colors disabled:opacity-50"
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add "{normalized || trimmedSearch}"
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No category found
                    </span>
                  )}
                </CommandEmpty>

                {categories.length > 0 && (
                  <CommandGroup>
                    {categories.map((c) => {
                      const display = categoryDisplay(c);
                      const isEditing = editingId === c.id;
                      return (
                        <CommandItem
                          key={c.id}
                          value={display}
                          onSelect={() => {
                            if (isEditing) return;
                            onChange(display);
                            setSearch("");
                            setOpen(false);
                          }}
                          className="group/cat flex items-center gap-2"
                        >
                          {isEditing ? (
                            <div
                              className="flex-1 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <CategoryIcon category={display} className="h-4 w-4 text-muted-foreground shrink-0" />
                              <Input
                                autoFocus
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") saveEdit(c);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="h-7 text-sm"
                                disabled={isRenaming}
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-green-600"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  saveEdit(c);
                                }}
                                disabled={isRenaming}
                              >
                                {isRenaming ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  cancelEdit();
                                }}
                                disabled={isRenaming}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Check
                                className={cn(
                                  "mr-1 h-4 w-4 shrink-0",
                                  value === display ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="flex-1 truncate">{display}</span>
                              <span className="text-[10px] text-muted-foreground tabular-nums opacity-60 group-hover/cat:opacity-100">
                                {counts[c.id] ?? 0}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onMouseDown={(e) => startEdit(e, c)}
                                  aria-label={`Rename ${c.name}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onMouseDown={(e) => requestDelete(e, c)}
                                  aria-label={`Delete ${c.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {trimmedSearch && !exactMatch && categories.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value={`__add__${normalized}`}
                        onSelect={handleCreate}
                        disabled={isAdding}
                        className="text-primary font-medium data-[selected=true]:bg-primary/10"
                      >
                        {isAdding ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Add "{normalized}"
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>

      <DeleteCategoryDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        category={deleteTarget}
        count={deleteTarget ? counts[deleteTarget.id] ?? 0 : 0}
      />
    </Popover>
  );
}
