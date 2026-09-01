import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { format, isSameDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/transaction";

interface Props {
  transactions: Transaction[];
}

export function LoggingStreak({ transactions }: Props) {
  const { days, streak, loggedCount } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      const logged = transactions.some((t) => isSameDay(t.date, d));
      return { date: d, logged };
    });
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].logged) streak++;
      else break;
    }
    const loggedCount = days.filter((d) => d.logged).length;
    return { days, streak, loggedCount };
  }, [transactions]);

  return (
    <Card className="p-4 border shadow-soft hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Logging Streak</p>
            <p className="text-sm font-bold text-foreground">
              {streak} {streak === 1 ? "day" : "days"} <span className="text-muted-foreground font-normal">• {loggedCount}/7 logged</span>
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-full h-8 rounded-md transition-all duration-300",
                d.logged
                  ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-sm"
                  : "bg-muted/60 border border-dashed border-border"
              )}
              title={`${format(d.date, "EEE, MMM d")}: ${d.logged ? "Logged" : "No entry"}`}
            />
            <span className="text-[9px] font-medium text-muted-foreground">{format(d.date, "EEEEE")}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
