import { Card } from "@/components/ui/card";
import { Heart, Lightbulb, Info } from "lucide-react";
import { useWealthHealth } from "@/hooks/useWealthHealth";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function WealthHealthScore() {
  const { score, label, color, ring, factors, suggestions } = useWealthHealth();
  const circumference = 2 * Math.PI * 42;
  const dash = (score / 100) * circumference;

  return (
    <Card className="p-4 md:p-5 border shadow-medium">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Heart className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Financial Health</p>
          <h2 className="text-base font-bold text-foreground">
            Wealth Score — <span className={color}>{label}</span>
          </h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-5">
        <div className="relative w-28 h-28 shrink-0 mx-auto md:mx-0">
          <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
            <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="42" stroke={ring} strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 900ms ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold tabular-nums", color)}>{score}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2 min-w-0">
          <TooltipProvider delayDuration={100}>
            {factors.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {f.name}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs">
                        {f.explanation}
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {Math.round(f.score)}/{f.max}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(f.score / f.max) * 100}%`, background: ring }}
                  />
                </div>
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              How to improve
            </p>
          </div>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="text-xs text-foreground/85 leading-snug flex gap-2">
                <span className="text-primary shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
