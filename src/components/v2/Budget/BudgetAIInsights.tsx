import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";

interface BudgetComparison {
  category: string;
  budget_amount: number;
  actual: number;
  pct: number;
  status: "over" | "warning" | "good";
}

export function BudgetAIInsights({ comparison }: { comparison: BudgetComparison[] }) {
  const insights = useMemo(() => {
    const result: { emoji: string; text: string; type: "danger" | "warning" | "success" }[] = [];

    // Over budget
    comparison
      .filter((c) => c.status === "over")
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 2)
      .forEach((c) => {
        const exceeded = c.actual - c.budget_amount;
        result.push({
          emoji: "⚠️",
          text: `${c.category} exceeded by ₹${exceeded.toLocaleString("en-IN")} (${c.pct.toFixed(0)}%)`,
          type: "danger",
        });
      });

    // Near limit
    comparison
      .filter((c) => c.status === "warning")
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 2)
      .forEach((c) => {
        result.push({
          emoji: "📉",
          text: `${c.category} is close to limit (${c.pct.toFixed(0)}%)`,
          type: "warning",
        });
      });

    // Untouched budgets
    comparison
      .filter((c) => c.actual === 0 && c.budget_amount > 0)
      .slice(0, 1)
      .forEach((c) => {
        result.push({
          emoji: "💡",
          text: `${c.category} budget untouched`,
          type: "success",
        });
      });

    // Savings suggestion
    const diningLike = comparison.find((c) => c.category.toLowerCase().includes("dining") && c.pct > 50);
    if (diningLike) {
      const saveable = Math.round(diningLike.actual * 0.3);
      result.push({
        emoji: "🎯",
        text: `You can save ₹${saveable.toLocaleString("en-IN")} by reducing ${diningLike.category}`,
        type: "success",
      });
    }

    // Safe zone
    const safeCount = comparison.filter((c) => c.pct < 70).length;
    if (safeCount > 0 && result.length < 4) {
      result.push({
        emoji: "✅",
        text: `${safeCount} categor${safeCount > 1 ? "ies" : "y"} on track — great job!`,
        type: "success",
      });
    }

    return result.slice(0, 4);
  }, [comparison]);

  if (comparison.length === 0) return null;

  const borderColors = {
    danger: "border-l-destructive",
    warning: "border-l-warning",
    success: "border-l-success",
  };

  return (
    <Card className="p-5 shadow-soft bg-[var(--gradient-insight)] overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">🤖 AI Budget Insights</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`border-l-4 ${borderColors[insight.type]} bg-card/80 backdrop-blur-sm rounded-lg px-4 py-3 text-sm animate-fade-in`}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <span className="mr-2">{insight.emoji}</span>
            <span className="text-foreground/90">{insight.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
