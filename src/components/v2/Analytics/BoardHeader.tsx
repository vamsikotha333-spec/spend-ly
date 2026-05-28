import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent?: "primary" | "info" | "success" | "warning";
  className?: string;
}

const ACCENT: Record<NonNullable<BoardHeaderProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-amber-500/10 text-amber-600",
};

export function BoardHeader({ icon: Icon, title, subtitle, accent = "primary", className }: BoardHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className={cn("p-2.5 rounded-xl", ACCENT[accent])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">{title}</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 max-w-2xl">{subtitle}</p>
      </div>
    </div>
  );
}
