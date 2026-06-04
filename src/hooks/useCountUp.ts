import { useEffect, useState } from "react";

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Animates a numeric value from 0 to `target` using requestAnimationFrame.
 * Restarts whenever `target` changes. A small initial delay lets the DOM settle.
 */
export function useCountUp(target: number, duration = 1500, startDelay = 100) {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setValue(0);
    setDone(false);
    let raf = 0;
    let startTs = 0;
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const t = Math.min(1, (now - startTs) / duration);
      const eased = easeOutQuart(t);
      setValue(target * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
        setDone(true);
      }
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, startDelay);
    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration, startDelay]);

  return { value, done };
}
