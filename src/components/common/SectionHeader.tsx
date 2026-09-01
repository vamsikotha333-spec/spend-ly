import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tone, TONE_SOFT } from "@/lib/design";

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: Tone;
  /** page = top of a route, section = inside a card */
  size?: "page" | "section";
  action?: React.ReactNode;
  className?: string;
}

/**
 * The single section-header primitive. Every page/card heading in the app uses
 * this so icon size, title size/weight and subtitle spacing never drift.
 */
export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  tone = "neutral",
  size = "section",
  action,
  className,
}: SectionHeaderProps) {
  const isPage = size === "page";
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg shrink-0",
              TONE_SOFT[tone],
              isPage ? "h-10 w-10" : "h-8 w-8",
            )}
          >
            <Icon className={isPage ? "h-5 w-5" : "h-4 w-4"} />
          </div>
        )}
        <div className="min-w-0">
          <h2
            className={cn(
              "font-semibold tracking-tight text-foreground leading-tight",
              isPage ? "text-xl md:text-2xl" : "text-base",
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
