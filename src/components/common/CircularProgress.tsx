import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  className?: string;
  colorClass?: string; // tailwind text-* class for stroke (uses currentColor)
  trackClass?: string;
  label?: React.ReactNode;
  duration?: number;
}

export function CircularProgress({
  value,
  size = 88,
  stroke = 8,
  className,
  colorClass = "text-primary",
  trackClass = "text-muted",
  label,
  duration = 1200,
}: CircularProgressProps) {
  const [v, setV] = useState(0);
  const raf = useRef<number>();
  const target = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setV(from + (target - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className={trackClass}
          stroke="currentColor"
          fill="none"
          opacity={0.25}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className={colorClass}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke 200ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {label ?? <span className="text-sm font-semibold tabular-nums">{Math.round(v)}%</span>}
      </div>
    </div>
  );
}
