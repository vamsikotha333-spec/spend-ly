import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { format, isSameDay, isYesterday, startOfWeek, isWithinInterval, isSameMonth, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { canonicalDisplay } from "@/utils/categoryNormalize";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Rent": "🏠", "Groceries": "🛒", "Vegetables": "🥬", "Dining": "🍽️", "Transport": "🚗",
  "Health": "🏥", "Shopping": "🛍️", "Utilities": "💡", "Education": "📚", "Entertainment": "🎬",
  "Fuel": "⛽", "Insurance": "🛡️", "EMI": "🏦", "Subscriptions": "📱", "Clothing": "👕",
  "Personal Care": "💇", "Gifts": "🎁", "Travel": "✈️", "Home Maintenance": "🔧",
  "Phone": "📞", "Internet": "🌐", "Salary": "💼", "Freelance": "💻", "Investment": "📈",
  "Other": "📦",
};

function getCategoryEmoji(cat: string) {
  if (cat && /\p{Extended_Pictographic}/u.test(cat.charAt(0))) return "";
  return CATEGORY_EMOJIS[cat] || "📦";
}

function getType(t: any) {
  return t.transaction_type || (t.type === "credit" ? "Income" : "Expense");
}

function formatCompactINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

type Group = { label: string; items: any[] };

export function RecentActivityTimeline({ transactions }: { transactions: any[] }) {
  const groups = useMemo<Group[]>(() => {
    const now = new Date();
    const yesterday = subDays(now, 1);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const buckets: Record<string, any[]> = { Today: [], Yesterday: [], "This Week": [], "This Month": [] };
    // Sort newest first, take recent 25
    const sorted = [...transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 25);
    for (const t of sorted) {
      const d = new Date(t.date);
      if (isSameDay(d, now)) buckets.Today.push(t);
      else if (isYesterday(d) || isSameDay(d, yesterday)) buckets.Yesterday.push(t);
      else if (isWithinInterval(d, { start: weekStart, end: now })) buckets["This Week"].push(t);
      else if (isSameMonth(d, now)) buckets["This Month"].push(t);
    }
    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, items }));
  }, [transactions]);

  return (
    <section className="animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">🕐 Recent Activity</h2>
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <Link to="/transactions">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
        </Button>
      </div>
      {groups.length === 0 ? (
        <Card className="border p-8 text-center">
          <span className="text-4xl block mb-2">📄</span>
          <p className="text-sm font-semibold text-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tap the + button to add your first one.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const total = g.items
              .filter((t) => getType(t) === "Expense")
              .reduce((s, t) => s + t.amount, 0);
            return (
              <div key={g.label}>
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {g.label}
                  </span>
                  {total > 0 && (
                    <span className="text-[11px] font-semibold text-destructive tabular-nums">
                      -{formatCompactINR(total)}
                    </span>
                  )}
                </div>
                <Card className="border divide-y divide-border overflow-hidden">
                  {g.items.map((t) => {
                    const type = getType(t);
                    const isIncome = type === "Income";
                    const isSavings = type === "Savings";
                    const display = canonicalDisplay(t.category);
                    const emoji = getCategoryEmoji(display);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 md:p-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-1",
                            isIncome ? "bg-[hsl(var(--success-soft))] ring-success/15" :
                            isSavings ? "bg-[hsl(var(--info-soft))] ring-info/15" :
                            "bg-[hsl(var(--destructive-soft))] ring-destructive/15"
                          )}>
                            <span className="text-sm leading-none">{emoji || (isIncome ? "💰" : isSavings ? "🏦" : "💸")}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate text-foreground">{display}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {format(new Date(t.date), "EEE, MMM d")}
                              {t.addedBy ? ` • ${t.addedBy}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "font-bold tabular-nums text-sm shrink-0 ml-2",
                          isIncome ? "text-success" : isSavings ? "text-info" : "text-destructive"
                        )}>
                          {isIncome ? "+" : isSavings ? "" : "-"}{formatCompactINR(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
