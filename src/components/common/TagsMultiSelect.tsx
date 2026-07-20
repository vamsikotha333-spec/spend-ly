import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMasterData } from "@/hooks/useMasterData";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagsMultiSelect({ value, onChange, placeholder = "Select tags…", className }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { items, isLoading, addItem, isAdding } = useMasterData("tag");
  const trimmed = search.trim();

  const exact = useMemo(
    () => items.find((i) => i.name.toLowerCase() === trimmed.toLowerCase()),
    [items, trimmed],
  );

  const toggle = (name: string) => {
    if (value.includes(name)) onChange(value.filter((v) => v !== name));
    else onChange([...value, name]);
  };

  const handleCreate = async () => {
    if (!trimmed) return;
    try {
      const created = await addItem({ kind: "tag", name: trimmed });
      onChange([...value, created.name]);
      setSearch("");
      toast.success(`Added "${created.name}"`);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={cn("w-full justify-between font-normal min-h-10 h-auto py-2", !value.length && "text-muted-foreground")}
          >
            <div className="flex flex-wrap gap-1 items-center flex-1 text-left">
              {value.length === 0 ? (
                <span>{placeholder}</span>
              ) : (
                value.map((v) => (
                  <Badge key={v} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
                    {v}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(v);
                      }}
                      className="rounded hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50 pointer-events-auto" align="start">
          <Command filter={(v, s) => (!s ? 1 : v.toLowerCase().includes(s.toLowerCase()) ? 1 : 0)}>
            <CommandInput placeholder="Search or add tag…" value={search} onValueChange={setSearch} className="h-10" />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {trimmed ? (
                      <button
                        type="button"
                        onClick={handleCreate}
                        disabled={isAdding}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:bg-accent"
                      >
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create "{trimmed}"
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">No tags</span>
                    )}
                  </CommandEmpty>
                  {items.length > 0 && (
                    <CommandGroup>
                      {items.map((i) => {
                        const selected = value.includes(i.name);
                        return (
                          <CommandItem key={i.id} value={i.name} onSelect={() => toggle(i.name)}>
                            <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                            <span className="flex-1 truncate">{i.name}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                  {trimmed && !exact && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          value={`__add__${trimmed}`}
                          onSelect={handleCreate}
                          disabled={isAdding}
                          className="text-primary font-medium"
                        >
                          {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
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
    </div>
  );
}
