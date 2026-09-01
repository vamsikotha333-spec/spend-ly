/**
 * Unified visual system.
 *
 * Color is reserved for MEANING, never decoration. There are exactly four
 * semantic tones in the app — every page must pull from this map only and
 * must never introduce a new accent colour for a single feature.
 *
 *   positive  → income / gains / on-track          (success)
 *   negative  → expense / overspend / liabilities  (destructive)
 *   savings   → savings, goals, investments        (info)
 *   neutral   → structural UI, counts, metadata    (muted / foreground)
 *
 * `warning` is the single allowed intermediate state (near-limit / at-risk).
 */
export type Tone = "positive" | "negative" | "savings" | "neutral" | "warning";

export const TONE_TEXT: Record<Tone, string> = {
  positive: "text-success",
  negative: "text-destructive",
  savings: "text-info",
  neutral: "text-foreground",
  warning: "text-warning",
};

/** Soft tinted chip used behind icons and inside badges. */
export const TONE_SOFT: Record<Tone, string> = {
  positive: "bg-success/10 text-success",
  negative: "bg-destructive/10 text-destructive",
  savings: "bg-info/10 text-info",
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning/10 text-warning",
};

/** Solid fill used for bars, rings and chart series. */
export const TONE_FILL: Record<Tone, string> = {
  positive: "bg-success",
  negative: "bg-destructive",
  savings: "bg-info",
  neutral: "bg-muted-foreground",
  warning: "bg-warning",
};

/** Stroke colour class (currentColor consumers: rings, sparklines). */
export const TONE_STROKE: Record<Tone, string> = {
  positive: "text-success",
  negative: "text-destructive",
  savings: "text-info",
  neutral: "text-muted-foreground",
  warning: "text-warning",
};

/** Raw HSL values for chart libraries that cannot take classes. */
export const TONE_HSL: Record<Tone, string> = {
  positive: "hsl(var(--success))",
  negative: "hsl(var(--destructive))",
  savings: "hsl(var(--info))",
  neutral: "hsl(var(--muted-foreground))",
  warning: "hsl(var(--warning))",
};

/** Ordered palette for categorical charts (still only semantic hues). */
export const CHART_SERIES = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

/** Map a transaction type to its tone. */
export function toneForType(type?: string | null): Tone {
  if (type === "Income") return "positive";
  if (type === "Savings") return "savings";
  if (type === "Expense") return "negative";
  return "neutral";
}

/** One card style for the whole app. */
export const CARD = "rounded-xl border bg-card p-5 shadow-soft";
