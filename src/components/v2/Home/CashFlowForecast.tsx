import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { CalendarClock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { addDays, addWeeks, addMonths, differenceInCalendarDays, endOfMonth, isBefore, format, parseISO } from "date-fns";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { useAssets } from "@/hooks/useAssets";
import { cn } from "@/lib/utils";

function formatCompactINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function getType(r: { transaction_type: string | null; type: string }) {
  return r.transaction_type || (r.type === "credit" ? "Income" : "Expense");
}

// Enumerate all occurrences of a recurring txn between two dates (inclusive of start range)
function enumerateOccurrences(startISO: string, frequency: string, until: Date): Date[] {
  const out: Date[] = [];
  let cur = parseISO(startISO);
  const guard = 200;
  let i = 0;
  while (isBefore(cur, until) || cur.getTime() === until.getTime()) {
    if (i++ > guard) break;
    out.push(cur);
    switch ((frequency || "monthly").toLowerCase()) {
      case "daily": cur = addDays(cur, 1); break;
      case "weekly": cur = addWeeks(cur, 1); break;
      case "biweekly": cur = addWeeks(cur, 2); break;
      case "quarterly": cur = addMonths(cur, 3); break;
      case "yearly": cur = addMonths(cur, 12); break;
      case "monthly":
      default: cur = addMonths(cur, 1); break;
    }
  }
  return out;
}

export function CashFlowForecast() {
  const { recurring, isLoading } = useRecurringTransactions();
  const { assets, total: assetsTotal } = useAssets();

  const forecast = useMemo(() => {
    const today = new Date();
    const monthEnd = endOfMonth(today);
    // Consider only bank + cash + investment as "liquid balance"
    const liquid = assets
      .filter((a) => a.type === "cash" || a.type === "bank")
      .reduce((s, a) => s + Number(a.value || 0), 0);

    let expectedIncome = 0;
    let upcomingBills = 0;
    const items: { name: string; date: Date; amount: number; kind: "Income" | "Expense"; daysAway: number }[] = [];

    for (const r of recurring) {
      if (!r.is_active) continue;
      const occs = enumerateOccurrences(r.next_run_date, r.frequency, monthEnd);
      const kind = getType(r) as "Income" | "Expense" | "Savings";
      for (const d of occs) {
        if (isBefore(d, today)) continue;
        const days = differenceInCalendarDays(d, today);
        if (kind === "Income") {
          expectedIncome += Number(r.amount);
          items.push({ name: r.description || r.category, date: d, amount: Number(r.amount), kind: "Income", daysAway: days });
        } else if (kind === "Expense") {
          upcomingBills += Number(r.amount);
          items.push({ name: r.description || r.category, date: d, amount: Number(r.amount), kind: "Expense", daysAway: days });
        }
      }
    }

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    const projected = liquid + expectedIncome - upcomingBills;

    return { liquid, expectedIncome, upcomingBills, projected, items: items.slice(0, 4), monthEnd };
  }, [recurring, assets]);

  const positive = forecast.projected >= 0;
  const hasData = !isLoading && (forecast.expectedIncome > 0 || forecast.upcomingBills > 0 || assetsTotal > 0);

  return (
    <Card className="p-4 md:p-5 border shadow-soft hover-lift">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cash Flow Forecast</p>
            <p className="text-sm font-bold text-foreground">By {format(forecast.monthEnd, "MMM d")}</p>
          </div>
        </div>
        <Link to="/recurring" className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 shrink-0">
          Recurring <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-foreground font-medium">Forecast your month</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add recurring income & bills and set your bank balance to project month-end cash.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current</p>
              <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">{formatCompactINR(forecast.liquid)}</p>
            </div>
            <div className="rounded-lg bg-success/10 p-2">
              <p className="text-[10px] text-success/80 uppercase tracking-wider font-semibold">+ Income</p>
              <p className="text-sm font-bold text-success tabular-nums mt-0.5">{formatCompactINR(forecast.expectedIncome)}</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-2">
              <p className="text-[10px] text-destructive/80 uppercase tracking-wider font-semibold">− Bills</p>
              <p className="text-sm font-bold text-destructive tabular-nums mt-0.5">{formatCompactINR(forecast.upcomingBills)}</p>
            </div>
          </div>

          <div className={cn("rounded-lg p-3 border", positive ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20")}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Projected month-end</p>
              <p className={cn("text-lg font-bold tabular-nums", positive ? "text-success" : "text-destructive")}>
                {forecast.projected < 0 ? "-" : ""}{formatCompactINR(Math.abs(forecast.projected))}
              </p>
            </div>
          </div>

          {forecast.items.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</p>
              {forecast.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", it.kind === "Income" ? "bg-success" : "bg-destructive")} />
                    <span className="truncate font-medium text-foreground">{it.name}</span>
                    <span className="text-muted-foreground text-[10px] shrink-0">
                      {it.daysAway === 0 ? "today" : `in ${it.daysAway}d`}
                    </span>
                  </div>
                  <span className={cn("tabular-nums font-semibold shrink-0", it.kind === "Income" ? "text-success" : "text-destructive")}>
                    {it.kind === "Income" ? "+" : "−"}{formatCompactINR(it.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
