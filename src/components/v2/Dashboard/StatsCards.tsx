import { DollarSign, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { cn } from "@/lib/utils";
import { isSameMonth, subMonths } from "date-fns";

interface StatsCardsProps {
  transactions: Transaction[];
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function calcTotals(txns: Transaction[]) {
  const income = txns.filter((t) => getType(t) === "Income").reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter((t) => getType(t) === "Expense").reduce((s, t) => s + t.amount, 0);
  const savings = txns.filter((t) => getType(t) === "Savings").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, savings, balance: income - expenses - savings };
}

function pctChange(current: number, previous: number): { value: string; positive: boolean } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { value: "+100%", positive: true };
  const pct = ((current - previous) / previous) * 100;
  return { value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

export function StatsCards({ transactions }: StatsCardsProps) {
  const now = new Date();
  const lastMonth = subMonths(now, 1);
  const thisMonthTxns = transactions.filter((t) => isSameMonth(t.date, now));
  const lastMonthTxns = transactions.filter((t) => isSameMonth(t.date, lastMonth));

  const current = calcTotals(transactions);
  const cm = calcTotals(thisMonthTxns);
  const lm = calcTotals(lastMonthTxns);

  const cards = [
    { title: "Total Balance", value: current.balance, icon: DollarSign, change: pctChange(cm.balance, lm.balance), variant: "primary" as const },
    { title: "Total Income", value: current.income, icon: TrendingUp, change: pctChange(cm.income, lm.income), variant: "success" as const },
    { title: "Total Expenses", value: current.expenses, icon: TrendingDown, change: pctChange(cm.expenses, lm.expenses), variant: "danger" as const },
    { title: "Total Savings", value: current.savings, icon: PiggyBank, change: pctChange(cm.savings, lm.savings), variant: "info" as const },
  ];

  const variantStyles = {
    primary: { bg: "from-primary/15 to-primary/5", icon: "bg-primary/10 text-primary" },
    success: { bg: "from-success/15 to-success/5", icon: "bg-success/10 text-success" },
    danger: { bg: "from-destructive/15 to-destructive/5", icon: "bg-destructive/10 text-destructive" },
    info: { bg: "from-info/15 to-info/5", icon: "bg-info/10 text-info" },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const style = variantStyles[card.variant];
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="relative overflow-hidden shadow-soft hover:shadow-soft transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-500", style.bg)} />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2.5 rounded-xl transition-transform duration-300 hover:scale-110", style.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
                {card.change && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300",
                    card.title === "Total Expenses"
                      ? (card.change.positive ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success")
                      : (card.change.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")
                  )}>
                    {card.change.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.change.value}
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{card.title}</p>
              <p className="text-2xl font-bold tabular-nums transition-all duration-500">
                ₹{card.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">vs last month</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
