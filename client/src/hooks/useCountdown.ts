import { useEffect, useState } from "react";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function computeParts(target: Date): CountdownParts {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

export function useCountdown(target: Date | string | null | undefined): CountdownParts | null {
  const targetDate = target ? new Date(target) : null;
  const [parts, setParts] = useState<CountdownParts | null>(targetDate ? computeParts(targetDate) : null);

  useEffect(() => {
    if (!targetDate) return;
    setParts(computeParts(targetDate));
    const interval = setInterval(() => setParts(computeParts(targetDate)), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return parts;
}
