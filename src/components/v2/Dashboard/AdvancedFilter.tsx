import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/contexts/FilterContext";
import { TRANSACTION_TYPES } from "@/types/transaction";
import { useMemberOptions } from "@/hooks/useMembers";
import { useTransactions } from "@/hooks/useTransactions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories, categoryDisplay } from "@/hooks/useCategories";
import { useMemo } from "react";

export function AdvancedFilter() {
  const { filters, updateFilters, clearFilters, activeFilterCount } = useFilters();
  const [open, setOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const { allCategories } = useCategories();
  const { transactions } = useTransactions();
  const memberOptions = useMemberOptions(transactions);

  const allCategoryDisplays = useMemo(
    () => Array.from(new Set(allCategories.map((c) => categoryDisplay(c)))).sort(),
    [allCategories],
  );

  const filteredCategories = allCategoryDisplays.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const toggleCategory = (cat: string) => {
    updateFilters({ categories: filters.categories.includes(cat) ? filters.categories.filter(c => c !== cat) : [...filters.categories, cat] });
  };
  const toggleAddedBy = (p: string) => {
    updateFilters({ addedBy: filters.addedBy.includes(p) ? filters.addedBy.filter(x => x !== p) : [...filters.addedBy, p] });
  };
  const toggleApplicableTo = (e: string) => {
    updateFilters({ applicableTo: filters.applicableTo.includes(e) ? filters.applicableTo.filter(x => x !== e) : [...filters.applicableTo, e] });
  };
  const toggleType = (t: string) => {
    updateFilters({ transactionTypes: filters.transactionTypes.includes(t) ? filters.transactionTypes.filter(x => x !== t) : [...filters.transactionTypes, t] });
  };

  const removeFilter = (type: "categories" | "addedBy" | "applicableTo" | "transactionTypes", value: string) => {
    updateFilters({ [type]: (filters[type] as string[]).filter((v) => v !== value) } as never);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
              <Accordion type="multiple" className="w-full mt-6" defaultValue={["types", "categories", "addedBy", "applicableTo"]}>
                <AccordionItem value="types">
                  <AccordionTrigger>Type ({filters.transactionTypes.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {TRANSACTION_TYPES.map((t) => (
                        <div key={t} className="flex items-center space-x-2">
                          <Checkbox id={`type-${t}`} checked={filters.transactionTypes.includes(t)} onCheckedChange={() => toggleType(t)} />
                          <Label htmlFor={`type-${t}`} className="cursor-pointer">{t}</Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="categories">
                  <AccordionTrigger>Categories ({filters.categories.length})</AccordionTrigger>
                  <AccordionContent>
                    <Input placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="mb-3" />
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {filteredCategories.map((cat) => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox id={`cat-${cat}`} checked={filters.categories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                            <Label htmlFor={`cat-${cat}`} className="cursor-pointer text-sm">{cat}</Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="addedBy">
                  <AccordionTrigger>Added By ({filters.addedBy.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {memberOptions.map((p) => (
                        <div key={p} className="flex items-center space-x-2">
                          <Checkbox id={`person-${p}`} checked={filters.addedBy.includes(p)} onCheckedChange={() => toggleAddedBy(p)} />
                          <Label htmlFor={`person-${p}`} className="cursor-pointer">{p}</Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="applicableTo">
                  <AccordionTrigger>Applicable To ({filters.applicableTo.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {memberOptions.map((e) => (
                        <div key={e} className="flex items-center space-x-2">
                          <Checkbox id={`entity-${e}`} checked={filters.applicableTo.includes(e)} onCheckedChange={() => toggleApplicableTo(e)} />
                          <Label htmlFor={`entity-${e}`} className="cursor-pointer">{e}</Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>

            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" onClick={clearFilters} className="w-full">Clear All Filters</Button>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3 mr-1" /> Clear all
          </Button>
        )}
      </div>

      {(filters.transactionTypes.length + filters.categories.length + filters.addedBy.length + filters.applicableTo.length) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.transactionTypes.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 text-xs">
              {t}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("transactionTypes", t)} />
            </Badge>
          ))}
          {filters.categories.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1 text-xs">
              {c}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("categories", c)} />
            </Badge>
          ))}
          {filters.addedBy.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1 text-xs">
              By: {p}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("addedBy", p)} />
            </Badge>
          ))}
          {filters.applicableTo.map((e) => (
            <Badge key={e} variant="secondary" className="gap-1 text-xs">
              To: {e}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("applicableTo", e)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
