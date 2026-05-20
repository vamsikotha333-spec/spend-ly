import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "danger";
  emoji?: string;
}

export function StatCard({ title, value, icon: Icon, trend, variant = "default", emoji }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border hover:shadow-hover transition-all duration-200">
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl transition-transform duration-200 hover:scale-110",
            variant === "success" && "bg-[hsl(var(--success-soft))]",
            variant === "danger" && "bg-[hsl(var(--destructive-soft))]",
            variant === "default" && "bg-primary/10"
          )}>
            {emoji ? (
              <span className="text-xl">{emoji}</span>
            ) : (
              <Icon className={cn(
                "h-6 w-6",
                variant === "success" && "text-success",
                variant === "danger" && "text-destructive",
                variant === "default" && "text-primary"
              )} />
            )}
          </div>
          {trend && (
            <span className={cn(
              "text-sm font-semibold px-2 py-0.5 rounded-full",
              trend.startsWith("+") ? "text-success bg-[hsl(var(--success-soft))]" : "text-destructive bg-[hsl(var(--destructive-soft))]"
            )}>
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
      </div>
    </Card>
  );
}
