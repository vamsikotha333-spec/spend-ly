import { useCountUp } from "@/hooks/useCountUp";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
  onComplete?: () => void;
}

const defaultFormat = (n: number) =>
  Math.round(n).toLocaleString("en-IN");

export function AnimatedCounter({
  value,
  duration = 1500,
  format = defaultFormat,
  className,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const { value: display } = useCountUp(value, duration);
  return (
    <span className={className}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
}
