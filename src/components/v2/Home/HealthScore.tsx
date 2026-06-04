import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { isSameDay, subDays } from "date-fns";
import { Transaction } from "@/types/transaction";

interface Props {
  transactions: Transaction[];
  income: number;
  expenses: number;
  savings: number;
}

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

export function HealthScore({ transactions, income, expenses, savings }: Props) {
  const { score, label, color, breakdown } = useMemo(() => {
    // Savings rate contribution (max 40)
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const savingsScore = Math.min(40, (savingsRate / 30) * 40);

    // Spending discipline (max 30): expenses <= 70% of income = full
    const expenseRatio = income > 0 ? expenses / income : 1;
    const disciplineScore = income === 0 ? 0 : Math.max(0, Math.min(30, (1 - Math.max(0, expenseRatio - 0.7) / 0.3) * 30));

    // Logging consistency (max 30): days logged in last 7
    const today = new Date();
    let loggedDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = subDays(today, i);
      if (transactions.some((t) => isSameDay(t.date, d))) loggedDays++;
    }
    const consistencyScore = (loggedDays / 7) * 30;

    const total = Math.round(savingsScore + disciplineScore + consistencyScore);
    const label = total >= 80 ? "Excellent" : total >= 60 ? "Healthy" : total >= 40 ? "Fair" : total >= 20 ? "Needs Work" : "Critical";
    const color = total >= 80 ? "text-success" : total >= 60 ? "text-info" : total >= 40 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
    const ring = total >= 80 ? "hsl(var(--success))" : total >= 60 ? "hsl(var(--info))" : total >= 40 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";

    return {
      score: total,
      label,
      color,
      breakdown: [
        { name: "Savings Rate", value: Math.round(savingsScore), max: 40, ring },
        { name: "Spending Discipline", value: Math.round(disciplineScore), max: 30, ring },
        { name: "Logging Consistency", value: Math.round(consistencyScore), max: 30, ring },
      ],
    };
  }, [transactions, income, expenses, savings]);

  const ringColor =
    score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--info))" : score >= 40 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
  const circumference = 2 * Math.PI * 36;
  const dash = (score / 100) * circumference;

  return (
    <Card className="p-4 border shadow-medium hover-lift">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Heart className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Financial Health</p>
          <p className="text-sm font-bold text-foreground">Score <span className={color}>{label}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="36" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke={ringColor}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 800ms ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold tabular-nums ${color}`}>{score}</span>
            <span className="text-[9px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {breakdown.map((b) => (
            <div key={b.name}>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                <span className="truncate">{b.name}</span>
                <span className="tabular-nums font-semibold text-foreground">{b.value}/{b.max}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(b.value / b.max) * 100}%`, background: b.ring }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
