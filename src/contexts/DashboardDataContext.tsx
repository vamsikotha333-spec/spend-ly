import { createContext, useContext, useMemo, ReactNode } from "react";
import { Transaction } from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { useFilters } from "@/contexts/FilterContext";
import { computeTotals, Totals } from "@/lib/totals";

interface DashboardData {
  /** All transactions, unfiltered (for period-over-period comparisons). */
  transactions: Transaction[];
  /** Transactions scoped by the global date + advanced filters. */
  scoped: Transaction[];
  /** Totals for `scoped` — the single source of truth for every section. */
  totals: Totals;
  isLoading: boolean;
  addTransaction: ReturnType<typeof useTransactions>["addTransaction"];
  updateTransaction: ReturnType<typeof useTransactions>["updateTransaction"];
}

const Ctx = createContext<DashboardData | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const { transactions, isLoading, addTransaction, updateTransaction } = useTransactions();
  const { getFilteredTransactions } = useFilters();

  const scoped = useMemo(
    () => getFilteredTransactions(transactions),
    [transactions, getFilteredTransactions]
  );
  const totals = useMemo(() => computeTotals(scoped), [scoped]);

  const value = useMemo(
    () => ({ transactions, scoped, totals, isLoading, addTransaction, updateTransaction }),
    [transactions, scoped, totals, isLoading, addTransaction, updateTransaction]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboardData must be used within DashboardDataProvider");
  return ctx;
}
