import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingDown, PiggyBank, Crown } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
}

function fmtINR(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function memberKey(t: Transaction): string {
  return (t.applicable_to && t.applicable_to.trim()) || t.addedBy || "Unassigned";
}

const PALETTE = ["bg-primary", "bg-info", "bg-success", "bg-amber-500", "bg-destructive", "bg-purple-500", "bg-pink-500"];
function colorFor(name: string, i: number) {
  return PALETTE[i % PALETTE.length];
}

export function MemberComparisonPanel({ transactions }: Props) {
  const data = useMemo(() => {
    const map: Record<string, { name: string; expense: number; savings: number; income: number; count: number }> = {};
    for (const t of transactions) {
      const m = memberKey(t);
      if (!map[m]) map[m] = { name: m, expense: 0, savings: 0, income: 0, count: 0 };
      const type = getType(t);
      if (type === "Expense") map[m].expense += t.amount;
      else if (type === "Savings") map[m].savings += t.amount;
      else if (type === "Income") map[m].income += t.amount;
      map[m].count += 1;
    }
    const totalExp = Object.values(map).reduce((s, m) => s + m.expense, 0);
    const totalSav = Object.values(map).reduce((s, m) => s + m.savings, 0);
    const rows = Object.values(map).map((m) => ({
      ...m,
      expensePct: totalExp > 0 ? (m.expense / totalExp) * 100 : 0,
      savingsPct: totalSav > 0 ? (m.savings / totalSav) * 100 : 0,
    }));
    rows.sort((a, b) => b.expense + b.savings - (a.expense + a.savings));
    return { rows, totalExp, totalSav };
  }, [transactions]);

  if (data.rows.length === 0) return null;

  const topSpender = [...data.rows].sort((a, b) => b.expense - a.expense)[0];
  const topSaver = [...data.rows].sort((a, b) => b.savings - a.savings)[0];

  return (
    <Card className="p-5 shadow-medium border-0 animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Member-wise Comparison</h2>
            <p className="text-xs text-muted-foreground">Expense and savings contribution per household member</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {topSpender && topSpender.expense > 0 && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Crown className="h-3 w-3 text-amber-500" /> Top spender: {topSpender.name}
            </Badge>
          )}
          {topSaver && topSaver.savings > 0 && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <PiggyBank className="h-3 w-3 text-info" /> Top saver: {topSaver.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Expense share */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expense Share</h3>
            <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{fmtINR(data.totalExp)}</span>
          </div>
          <div className="space-y-2.5">
            {data.rows.map((m, i) => (
              <div key={`exp-${m.name}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate max-w-[140px]">{m.name}</span>
                  <span className="text-xs font-bold tabular-nums">
                    {fmtINR(m.expense)} <span className="text-[10px] text-muted-foreground">({m.expensePct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", colorFor(m.name, i))} style={{ width: `${m.expensePct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings share */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <PiggyBank className="h-3.5 w-3.5 text-info" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Savings Share</h3>
            <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{fmtINR(data.totalSav)}</span>
          </div>
          {data.totalSav === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No savings recorded for this period.</p>
          ) : (
            <div className="space-y-2.5">
              {data.rows.map((m, i) => (
                <div key={`sav-${m.name}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate max-w-[140px]">{m.name}</span>
                    <span className="text-xs font-bold tabular-nums">
                      {fmtINR(m.savings)} <span className="text-[10px] text-muted-foreground">({m.savingsPct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", colorFor(m.name, i))} style={{ width: `${m.savingsPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
