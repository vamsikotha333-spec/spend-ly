import { getDaysInMonth, parseISO, differenceInCalendarDays } from "date-fns";
import { Wallet, TrendingDown, PiggyBank, CalendarDays, ShieldCheck, AlertTriangle, ShieldAlert, type LucideIcon } from "lucide-react";

interface Props {
  totalBudget: number;
  totalActual: number;
  selectedMonth: string;
}

export function CompactSummaryBar({ totalBudget, totalActual, selectedMonth }: Props) {
  const remaining = totalBudget - totalActual;
  const monthDate = parseISO(selectedMonth + "-01");
  const daysInMonth = getDaysInMonth(monthDate);
  const today = new Date();
  const daysPassed = Math.max(1, differenceInCalendarDays(today, monthDate) + 1);
  const daysLeft = Math.max(1, daysInMonth - daysPassed + 1);
  const dailyBudget = remaining > 0 ? Math.round(remaining / daysLeft) : 0;

  const overallPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const riskStatus = overallPct > 90 ? "risk" : overallPct > 70 ? "moderate" : "safe";
  const riskConfig = {
    safe: { Icon: ShieldCheck as LucideIcon, label: "You are in safe zone", cls: "text-success" },
    moderate: { Icon: AlertTriangle as LucideIcon, label: "Budget getting tight", cls: "text-warning" },
    risk: { Icon: ShieldAlert as LucideIcon, label: "High risk of overspending", cls: "text-destructive" },
  };
  const dailyStatus = riskConfig[riskStatus];

  const fmt = (n: number) => {
    if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Compact summary row */}
      <div className="flex items-center justify-between bg-card rounded-xl px-5 py-3.5 shadow-soft border border-border/50">
        <div className="flex items-center gap-6 md:gap-10 flex-wrap">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Budget</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{fmt(totalBudget)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Spent</p>
              <p className={`text-lg font-bold tabular-nums ${totalActual > totalBudget ? "text-destructive" : "text-foreground"}`}>
                {fmt(totalActual)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Remaining</p>
              <p className={`text-lg font-bold tabular-nums ${remaining < 0 ? "text-destructive" : "text-success"}`}>
                {fmt(remaining)}
              </p>
            </div>
          </div>
        </div>
        <div className={`text-xs font-medium ${dailyStatus.cls} hidden md:flex items-center gap-1.5`}>
          <dailyStatus.Icon className="h-3.5 w-3.5" /> {dailyStatus.label}
        </div>
      </div>

      {/* Daily budget suggestion */}
      {totalBudget > 0 && (
        <div className="flex items-center justify-between bg-card rounded-xl px-5 py-3 shadow-soft border border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              You can spend <strong className="text-foreground">{fmt(dailyBudget)}/day</strong> to stay within budget
            </span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            riskStatus === "safe" ? "bg-success/10 text-success" :
            riskStatus === "moderate" ? "bg-warning/10 text-warning" :
            "bg-destructive/10 text-destructive"
          }`}>
            {riskStatus === "safe" ? "Safe" : riskStatus === "moderate" ? "Moderate" : "Risk"}
          </span>
        </div>
      )}
    </div>
  );
}
