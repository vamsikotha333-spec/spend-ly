import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tone, TONE_SOFT } from "@/lib/design";

interface StatusBadgeProps {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

/** The single badge/pill style: same height, radius and type scale everywhere. */
export function StatusBadge({ tone = "neutral", icon: Icon, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap",
        TONE_SOFT[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
