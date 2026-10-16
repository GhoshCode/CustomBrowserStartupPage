import { useEffect, useState } from 'react';

// Current time, re-rendered on each whole second (or `stepMs`). The first tick
// is aligned to the next boundary so the clock never lags up to a second behind.
export function useNow(stepMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), stepMs);
    }, stepMs - (Date.now() % stepMs));
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [stepMs]);

  return now;
}
