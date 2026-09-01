import { cn } from "@/lib/utils";
import { Tone, TONE_FILL } from "@/lib/design";

interface MeterBarProps {
  /** 0-100 */
  value: number;
  tone?: Tone;
  className?: string;
  /** sm = inline rows, md = default cards */
  size?: "sm" | "md";
}

/**
 * The single horizontal progress bar: same height, radius and track colour
 * everywhere. Only the fill colour varies, and only by semantic tone.
 */
export function MeterBar({ value, tone = "neutral", className, size = "md" }: MeterBarProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", TONE_FILL[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
