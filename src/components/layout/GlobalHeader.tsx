import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon, X, ChevronDown, Plus } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useFilters } from "@/contexts/FilterContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { useAppMode } from "@/contexts/AppModeContext";

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/add": "Add Transaction",
  "/spending": "Category Analytics",
  "/summary": "Monthly Summary",
  "/budget": "Budget vs Actual",
  "/goals": "Savings Goals",
  "/recurring": "Recurring",
  "/insights": "AI Insights",
};

function buildMonthOptions() {
  const list: Date[] = [];
  for (let y = 2025; y <= 2026; y++) {
    const startM = y === 2025 ? 9 : 0;
    const endM = 11;
    for (let m = startM; m <= endM; m++) list.push(new Date(y, m, 1));
  }
  return list;
}

export function GlobalHeader() {
  const location = useLocation();
  const { mode } = useAppMode();
  const {
    filters,
    setDateMode,
    setSelectedMonth,
    setRange,
    clearDateFilter,
    dateFilterLabel,
  } = useFilters();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    filters.range.from && filters.range.to
      ? { from: filters.range.from, to: filters.range.to }
      : undefined
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setPendingRange(
      filters.range.from && filters.range.to
        ? { from: filters.range.from, to: filters.range.to }
        : undefined
    );
  }, [filters.range.from, filters.range.to]);

  const months = useMemo(() => buildMonthOptions(), []);
  const title = PAGE_TITLES[location.pathname] ?? "FinTracker";

  const isActive = filters.mode !== "all";

  const handleApplyRange = () => {
    if (pendingRange?.from && pendingRange?.to) {
      setRange({ from: pendingRange.from, to: pendingRange.to });
      setOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md transition-shadow duration-200",
        scrolled ? "shadow-medium" : "shadow-soft"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2 md:gap-3 px-4 py-3">
        <SidebarTrigger />
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-lg font-bold text-foreground truncate">{title}</h1>
        </div>

        {/* Inline filter mode toggle for fast switching */}
        <ToggleGroup
          type="single"
          value={filters.mode === "all" ? "month" : filters.mode}
          onValueChange={(v) => v && setDateMode(v as "month" | "range")}
          size="sm"
          className="hidden md:flex h-9 rounded-lg bg-secondary p-0.5"
        >
          <ToggleGroupItem
            value="month"
            className="h-8 px-3 text-xs font-medium data-[state=on]:bg-card data-[state=on]:shadow-soft data-[state=on]:text-foreground"
          >
            Month
          </ToggleGroupItem>
          <ToggleGroupItem
            value="range"
            className="h-8 px-3 text-xs font-medium data-[state=on]:bg-card data-[state=on]:shadow-soft data-[state=on]:text-foreground"
          >
            Range
          </ToggleGroupItem>
        </ToggleGroup>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-2 rounded-lg text-xs md:text-sm font-medium transition-all",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                  : "hover:bg-secondary"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="truncate max-w-[180px]">{dateFilterLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[320px] p-0 rounded-xl shadow-large">
            <div className="p-3 border-b border-border">
              <ToggleGroup
                type="single"
                value={filters.mode === "all" ? "month" : filters.mode}
                onValueChange={(v) => v && setDateMode(v as "month" | "range")}
                size="sm"
                className="w-full justify-stretch grid grid-cols-2 gap-1"
              >
                <ToggleGroupItem value="month" className="text-xs">Month</ToggleGroupItem>
                <ToggleGroupItem value="range" className="text-xs">Date Range</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {(filters.mode === "month" || filters.mode === "all") && (
              <div className="p-2">
                <ScrollArea className="h-[260px]">
                  <div className="grid grid-cols-2 gap-1.5 p-1">
                    {months.map((m) => {
                      const selected =
                        filters.mode === "month" &&
                        filters.selectedMonth &&
                        m.getTime() === startOfMonth(filters.selectedMonth).getTime();
                      return (
                        <button
                          key={m.toISOString()}
                          onClick={() => {
                            setSelectedMonth(m);
                            setOpen(false);
                          }}
                          className={cn(
                            "text-xs font-medium px-2.5 py-2 rounded-md text-left transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground shadow-soft"
                              : "hover:bg-secondary text-foreground"
                          )}
                        >
                          {format(m, "MMM yyyy")}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="flex items-center justify-between gap-2 px-2 py-2 border-t border-border mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      clearDateFilter();
                      setOpen(false);
                    }}
                  >
                    All Time
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSelectedMonth(startOfMonth(new Date()));
                      setOpen(false);
                    }}
                  >
                    This Month
                  </Button>
                </div>
              </div>
            )}

            {filters.mode === "range" && (
              <div className="p-2">
                <Calendar
                  mode="range"
                  selected={pendingRange}
                  onSelect={setPendingRange}
                  numberOfMonths={1}
                  className={cn("p-2 pointer-events-auto")}
                  initialFocus
                />
                <div className="flex items-center justify-between gap-2 px-2 py-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setPendingRange(undefined);
                      clearDateFilter();
                      setOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={!pendingRange?.from || !pendingRange?.to}
                    onClick={handleApplyRange}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={clearDateFilter}
            title="Clear date filter"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {mode !== "wealth" && (
          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-lg hidden sm:inline-flex bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-hover hover:opacity-95"
          >
            <Link to="/add" aria-label="Quick add transaction">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline text-xs font-semibold">Add</span>
            </Link>
          </Button>
        )}
        <NotificationsBell />
        <ThemeToggle />
      </div>

      {isActive && (
        <div className="max-w-7xl mx-auto px-4 pb-2 -mt-1">
          <Badge variant="secondary" className="text-[10px] font-medium gap-1">
            <CalendarIcon className="h-3 w-3" />
            Showing: {dateFilterLabel}
          </Badge>
        </div>
      )}
    </header>
  );
}
