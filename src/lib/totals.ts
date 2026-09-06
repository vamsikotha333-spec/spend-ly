import { Transaction } from "@/types/transaction";

/** Single canonical way to classify a transaction across the whole app. */
export function getTxType(t: Transaction | { transaction_type?: string | null; type?: string }) {
  return (
    (t as any).transaction_type ||
    ((t as any).type === "credit" ? "Income" : "Expense")
  ) as "Income" | "Expense" | "Savings";
}

export interface Totals {
  income: number;
  expenses: number;
  savings: number;
  remaining: number;
  netCashflow: number;
  savingsRate: number;
}

/** Single canonical totals calculation. Every dashboard section must use this. */
export function computeTotals(txns: Transaction[]): Totals {
  let income = 0;
  let expenses = 0;
  let savings = 0;
  for (const t of txns) {
    const type = getTxType(t);
    if (type === "Income") income += t.amount;
    else if (type === "Savings") savings += t.amount;
    else expenses += t.amount;
  }
  return {
    income,
    expenses,
    savings,
    remaining: income - expenses - savings,
    netCashflow: income - expenses,
    savingsRate: income > 0 ? (savings / income) * 100 : 0,
  };
}
