import { memo } from 'react';
import { useStore } from '../../store';
import { useNow } from '../../hooks/useNow';
import { formatDateLine, greetingFor } from '../../lib/time';

// DATE & GREET (far right of the top bar): uppercase date line plus a clean
// time-of-day greeting — no quote line (§7 Q5).
export const DateGreet = memo(function DateGreet() {
  // Minute resolution is plenty for a date and a greeting.
  const now = useNow(60_000);
  const name = useStore((s) => s.settings.greetingName);

  return (
    <div className="flex h-full min-w-0 flex-col items-end justify-center gap-1.5 text-right">
      <p className="text-gradient font-display text-xs font-semibold tracking-[0.22em]">
        {formatDateLine(now)}
      </p>
      <h1 className="font-display text-2xl leading-tight font-bold tracking-tight text-white/95 xl:text-3xl">
        {greetingFor(now, name)}
      </h1>
    </div>
  );
});
