import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Bell, CalendarClock, Flag, LineChart, PiggyBank, AlertTriangle } from "lucide-react";
import { differenceInCalendarDays, isAfter, isSameMonth, subMonths } from "date-fns";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/transaction";

type Tone = "warn" | "info" | "danger" | "good";

interface Reminder {
  icon: React.ElementType;
  tone: Tone;
  title: string;
  body: string;
  to?: string;
}

const TONE: Record<Tone, string> = {
  warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  info: "bg-info/10 text-info border-info/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  good: "bg-success/10 text-success border-success/20",
};

function getType(t: Transaction) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

export function WealthReminders() {
  const { policies } = useInsurancePolicies();
  const { goals } = useFinancialGoals();
  const { investments } = useInvestments();
  const { transactions } = useTransactions();

  const reminders = useMemo<Reminder[]>(() => {
    const out: Reminder[] = [];
    const today = new Date();

    // Insurance renewals within 30 days
    for (const p of policies) {
      if (!p.renewal_date) continue;
      const days = differenceInCalendarDays(new Date(p.renewal_date), today);
      if (days >= 0 && days <= 30) {
        out.push({
          icon: CalendarClock,
          tone: days <= 7 ? "danger" : "warn",
          title: `${p.name} renewal in ${days} day${days === 1 ? "" : "s"}`,
          body: `Coverage ₹${Number(p.coverage_amount).toLocaleString("en-IN")} — review before renewing.`,
          to: "/wealth/insurance",
        });
      }
    }

    // Goal deadlines within 60 days & not complete
    for (const g of goals) {
      if (!g.target_date) continue;
      const days = differenceInCalendarDays(new Date(g.target_date), today);
      const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      if (days >= 0 && days <= 60 && pct < 100) {
        out.push({
          icon: Flag,
          tone: pct < 50 ? "warn" : "info",
          title: `Goal "${g.name}" — ${days} day${days === 1 ? "" : "s"} left`,
          body: `You're at ${pct.toFixed(0)}% of ₹${Number(g.target_amount).toLocaleString("en-IN")}.`,
          to: "/wealth/goals",
        });
      }
    }

    // No investments added this month
    const thisMonthInv = investments.filter((i) => isSameMonth(new Date(i.created_at), today));
    if (investments.length > 0 && thisMonthInv.length === 0) {
      out.push({
        icon: LineChart,
        tone: "info",
        title: "No new investments this month",
        body: "Consider a monthly SIP or contribution to keep momentum.",
        to: "/wealth/investments",
      });
    }

    // Savings vs last month
    const thisMonthSav = transactions
      .filter((t) => getType(t) === "Savings" && isSameMonth(t.date, today))
      .reduce((s, t) => s + t.amount, 0);
    const lastMonthSav = transactions
      .filter((t) => getType(t) === "Savings" && isSameMonth(t.date, subMonths(today, 1)))
      .reduce((s, t) => s + t.amount, 0);
    if (lastMonthSav > 0 && thisMonthSav < lastMonthSav * 0.7) {
      out.push({
        icon: PiggyBank,
        tone: "warn",
        title: "Savings dropped this month",
        body: `Saved ₹${Math.round(thisMonthSav).toLocaleString("en-IN")} vs ₹${Math.round(lastMonthSav).toLocaleString("en-IN")} last month.`,
      });
    } else if (thisMonthSav > lastMonthSav && lastMonthSav > 0) {
      out.push({
        icon: PiggyBank,
        tone: "good",
        title: "Savings up this month",
        body: `Great — ₹${Math.round(thisMonthSav).toLocaleString("en-IN")} saved so far.`,
      });
    }

    // No goals or no insurance nudge
    if (goals.length === 0) {
      out.push({
        icon: Flag, tone: "info",
        title: "No financial goals set",
        body: "Set a goal to focus your savings and investments.",
        to: "/wealth/goals",
      });
    }
    if (policies.length === 0) {
      out.push({
        icon: AlertTriangle, tone: "warn",
        title: "No insurance tracked",
        body: "Add health & term life policies to protect your wealth.",
        to: "/wealth/insurance",
      });
    }

    return out.slice(0, 4);
  }, [policies, goals, investments, transactions]);

  if (reminders.length === 0) return null;

  return (
    <Card className="p-4 md:p-5 border shadow-medium">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">Reminders</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {reminders.map((r, i) => {
          const Icon = r.icon;
          const inner = (
            <div className={cn("p-3 rounded-xl border flex items-start gap-2.5 h-full transition hover:-translate-y-0.5", TONE[r.tone])}>
              <div className="mt-0.5 shrink-0"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{r.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{r.body}</p>
              </div>
            </div>
          );
          return r.to ? <Link key={i} to={r.to}>{inner}</Link> : <div key={i}>{inner}</div>;
        })}
      </div>
    </Card>
  );
}
