import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Budget } from "@/hooks/useBudgets";

interface Props {
  item: Budget & { actual: number; pct: number; status: "over" | "warning" | "good"; hasBudget?: boolean };
  index: number;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
  variant?: "expense" | "savings";
}

export function BudgetCategoryCard({ item, index, onEdit, onDelete, variant = "expense" }: Props) {
  const [expanded, setExpanded] = useState(false);

  const isSavings = variant === "savings";
  const remaining = item.budget_amount - item.actual;
  const noBudget = item.hasBudget === false;
  const spentLabel = isSavings ? "Saved" : "Spent";
  const remainingLabel = isSavings ? "to go" : "remaining";
  const exceededLabel = isSavings ? "Reached, +" : "Exceeded by ";
  // Status semantics flip for savings: high % = good (closer to target)
  const statusConfig = isSavings
    ? {
        over: { emoji: "🏆", label: noBudget ? "No Target Set" : "Target Reached", cls: "text-success", progressCls: "[&>div]:bg-success" },
        warning: { emoji: "📈", label: "Almost There", cls: "text-success", progressCls: "[&>div]:bg-success" },
        good: { emoji: "💰", label: "In Progress", cls: "text-primary", progressCls: "[&>div]:bg-primary" },
      }
    : {
        over: { emoji: "🔴", label: noBudget ? "No Budget Set" : "Over Budget", cls: "text-destructive", progressCls: "[&>div]:bg-destructive" },
        warning: { emoji: "⚠️", label: "Near Limit", cls: "text-warning", progressCls: "[&>div]:bg-warning" },
        good: { emoji: "✅", label: "On Track", cls: "text-success", progressCls: "[&>div]:bg-success" },
      };
  const cfg = statusConfig[item.status];

  return (
    <Card
      className="border border-border/50 shadow-soft hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">{cfg.emoji}</span>
            <span className="font-semibold text-sm text-foreground truncate">{item.category}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-semibold ${cfg.cls}`}>{noBudget ? "—" : `${item.pct.toFixed(0)}%`}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="tabular-nums">₹{item.actual.toLocaleString("en-IN")}</span>
          <span>/</span>
          <span className="tabular-nums">{noBudget ? "No Budget Set" : `₹${item.budget_amount.toLocaleString("en-IN")}`}</span>
        </div>

        {!noBudget && (
          <Progress
            value={Math.min(item.pct, 100)}
            className={cn("h-2 rounded-full", cfg.progressCls)}
          />
        )}

        <div className="flex items-center justify-between mt-2">
          <span className={`text-[11px] font-medium ${cfg.cls}`}>{cfg.label}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {noBudget
              ? `₹${item.actual.toLocaleString("en-IN")} ${spentLabel.toLowerCase()}`
              : remaining >= 0
                ? `₹${remaining.toLocaleString("en-IN")} ${remainingLabel}`
                : `${exceededLabel}₹${Math.abs(remaining).toLocaleString("en-IN")}`}
          </span>
        </div>
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-4 pb-4 pt-1 border-t border-border/30 space-y-2">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">{isSavings ? "Target" : "Budget"}</p>
              <p className="text-sm font-bold tabular-nums">{noBudget ? "—" : `₹${item.budget_amount.toLocaleString("en-IN")}`}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">{spentLabel}</p>
              <p className={`text-sm font-bold tabular-nums ${isSavings ? "text-success" : "text-destructive"}`}>₹{item.actual.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">{isSavings ? "To Go" : "Left"}</p>
              <p className={`text-sm font-bold tabular-nums ${noBudget ? "text-muted-foreground" : remaining < 0 ? (isSavings ? "text-success" : "text-destructive") : "text-success"}`}>
                {noBudget ? "—" : `₹${Math.max(remaining, 0).toLocaleString("en-IN")}`}
              </p>
            </div>
          </div>
          {!noBudget && (
            <div className="flex gap-2 justify-end pt-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onEdit(item)}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
