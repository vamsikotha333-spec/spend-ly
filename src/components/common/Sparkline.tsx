import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  fillOpacity?: number;
}

/**
 * Lightweight inline-SVG sparkline. Uses currentColor by default so the
 * stroke inherits semantic tokens (text-success, text-destructive, etc).
 */
export function Sparkline({
  data,
  color = "currentColor",
  height = 28,
  className,
  fillOpacity = 0.15,
}: SparklineProps) {
  const { path, area, width } = useMemo(() => {
    const w = 100;
    const h = height;
    if (!data.length) return { path: "", area: "", width: w };
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const step = data.length > 1 ? w / (data.length - 1) : 0;
    const points = data.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return [x, y] as const;
    });
    const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const a = `${d} L${w},${h} L0,${h} Z`;
    return { path: d, area: a, width: w };
  }, [data, height]);

  if (!data.length) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
      aria-hidden="true"
    >
      <path d={area} fill={color} opacity={fillOpacity} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
