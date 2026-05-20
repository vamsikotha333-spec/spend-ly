import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { Transaction } from "@/types/transaction";
import {
  isSameMonth,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";

export type DateFilterMode = "month" | "range" | "all";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface FilterState {
  // Global date filter (top header)
  mode: DateFilterMode;
  selectedMonth: Date | null;
  range: DateRange;

  // Other filters (still used by AdvancedFilter sheet on Dashboard if desired)
  categories: string[];
  addedBy: string[];
  applicableTo: string[];
  transactionTypes: string[];
}

interface FilterContextType {
  filters: FilterState;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  setDateMode: (mode: DateFilterMode) => void;
  setSelectedMonth: (m: Date | null) => void;
  setRange: (r: DateRange) => void;
  clearDateFilter: () => void;
  clearFilters: () => void;
  getFilteredTransactions: (transactions: Transaction[]) => Transaction[];
  activeFilterCount: number;
  dateFilterLabel: string;
  // legacy: months[] kept as derived no-op for backward compat (unused after refactor)
  months: Date[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEY = "fintracker.globalFilter.v1";

function loadInitialState(): FilterState {
  const defaults: FilterState = {
    mode: "month",
    selectedMonth: startOfMonth(new Date()),
    range: { from: null, to: null },
    categories: [],
    addedBy: [],
    applicableTo: [],
    transactionTypes: [],
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode ?? "month",
      selectedMonth: parsed.selectedMonth ? parseISO(parsed.selectedMonth) : startOfMonth(new Date()),
      range: {
        from: parsed.range?.from ? parseISO(parsed.range.from) : null,
        to: parsed.range?.to ? parseISO(parsed.range.to) : null,
      },
      categories: parsed.categories ?? [],
      addedBy: parsed.addedBy ?? [],
      applicableTo: parsed.applicableTo ?? [],
      transactionTypes: parsed.transactionTypes ?? [],
    };
  } catch {
    return defaults;
  }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(loadInitialState);

  // Persist to localStorage
  useEffect(() => {
    try {
      const serialized = {
        mode: filters.mode,
        selectedMonth: filters.selectedMonth ? filters.selectedMonth.toISOString() : null,
        range: {
          from: filters.range.from ? filters.range.from.toISOString() : null,
          to: filters.range.to ? filters.range.to.toISOString() : null,
        },
        categories: filters.categories,
        addedBy: filters.addedBy,
        applicableTo: filters.applicableTo,
        transactionTypes: filters.transactionTypes,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch {
      /* ignore */
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const setDateMode = useCallback((mode: DateFilterMode) => {
    setFilters((prev) => ({ ...prev, mode }));
  }, []);

  const setSelectedMonth = useCallback((m: Date | null) => {
    setFilters((prev) => ({ ...prev, selectedMonth: m, mode: m ? "month" : "all" }));
  }, []);

  const setRange = useCallback((r: DateRange) => {
    setFilters((prev) => ({ ...prev, range: r, mode: "range" }));
  }, []);

  const clearDateFilter = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      mode: "all",
      selectedMonth: null,
      range: { from: null, to: null },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      mode: "all",
      selectedMonth: null,
      range: { from: null, to: null },
      categories: [],
      addedBy: [],
      applicableTo: [],
      transactionTypes: [],
    });
  }, []);

  const getFilteredTransactions = useCallback(
    (transactions: Transaction[]) => {
      return transactions.filter((t) => {
        // Date filter
        let dateMatch = true;
        if (filters.mode === "month" && filters.selectedMonth) {
          dateMatch = isSameMonth(t.date, filters.selectedMonth);
        } else if (filters.mode === "range" && filters.range.from && filters.range.to) {
          dateMatch = isWithinInterval(t.date, {
            start: startOfDay(filters.range.from),
            end: endOfDay(filters.range.to),
          });
        }

        const categoryMatch =
          filters.categories.length === 0 || filters.categories.includes(t.category);
        const addedByMatch =
          filters.addedBy.length === 0 || filters.addedBy.includes(t.addedBy);
        const applicableToMatch =
          filters.applicableTo.length === 0 ||
          (t.applicable_to && filters.applicableTo.includes(t.applicable_to));
        const type = t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
        const typeMatch =
          filters.transactionTypes.length === 0 || filters.transactionTypes.includes(type);

        return dateMatch && categoryMatch && addedByMatch && applicableToMatch && typeMatch;
      });
    },
    [filters]
  );

  const activeFilterCount =
    filters.categories.length +
    filters.addedBy.length +
    filters.applicableTo.length +
    filters.transactionTypes.length +
    (filters.mode === "month" && filters.selectedMonth ? 1 : 0) +
    (filters.mode === "range" && filters.range.from && filters.range.to ? 1 : 0);

  const dateFilterLabel = (() => {
    if (filters.mode === "month" && filters.selectedMonth) {
      return format(filters.selectedMonth, "MMMM yyyy");
    }
    if (filters.mode === "range" && filters.range.from && filters.range.to) {
      return `${format(filters.range.from, "dd MMM")} – ${format(filters.range.to, "dd MMM yyyy")}`;
    }
    return "All Time";
  })();

  // Backward-compat: expose `months` as a single-element array for old AdvancedFilter usages
  const months: Date[] =
    filters.mode === "month" && filters.selectedMonth ? [filters.selectedMonth] : [];

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilters,
        setDateMode,
        setSelectedMonth,
        setRange,
        clearDateFilter,
        clearFilters,
        getFilteredTransactions,
        activeFilterCount,
        dateFilterLabel,
        months,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within FilterProvider");
  return context;
}
