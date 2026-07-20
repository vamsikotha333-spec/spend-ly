import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMasterData, MasterDataKind } from "@/hooks/useMasterData";

interface Props {
  kind: MasterDataKind;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  allowCreate?: boolean;
  disabled?: boolean;
}

export function MasterDataCombobox({
  kind, value, onChange, placeholder = "Select…", className, allowCreate = true, disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { items, isLoading, addItem, isAdding } = useMasterData(kind);

  const trimmed = search.trim();
  const exact = useMemo(
    () => items.find((i) => i.name.toLowerCase() === trimmed.toLowerCase()),
    [items, trimmed],
  );

  const handleCreate = async () => {
    if (!trimmed) return;
    try {
      const created = await addItem({ kind, name: trimmed });
      onChange(created.name);
      setSearch("");
      setOpen(false);
      toast.success(`Added "${created.name}"`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to add");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50 pointer-events-auto"
        align="start"
      >
        <Command
          filter={(v, s) => (!s ? 1 : v.toLowerCase().includes(s.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput
            placeholder={allowCreate ? "Search or add…" : "Search…"}
            className="h-10"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {allowCreate && trimmed ? (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isAdding}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:bg-accent rounded-sm"
                    >
                      {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create "{trimmed}"
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Nothing found</span>
                  )}
                </CommandEmpty>
                {items.length > 0 && (
                  <CommandGroup>
                    {items.map((i) => (
                      <CommandItem
                        key={i.id}
                        value={i.name}
                        onSelect={() => {
                          onChange(i.name);
                          setSearch("");
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", value === i.name ? "opacity-100" : "opacity-0")} />
                        <span className="flex-1 truncate">{i.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {allowCreate && trimmed && !exact && items.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value={`__add__${trimmed}`}
                        onSelect={handleCreate}
                        disabled={isAdding}
                        className="text-primary font-medium"
                      >
                        {isAdding ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create "{trimmed}"
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
