import { memo, useEffect, useState } from 'react';
import { useStore } from '../../store';
import { QUOTES } from '../../store/seed';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

export const DateGreetWidget = memo(function DateGreetWidget() {
  const [now, setNow] = useState(() => new Date());
  const greetingName = useStore((s) => s.settings.greetingName);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  let timeGreeting = 'GOOD MORNING';
  if (hours >= 12 && hours < 17) timeGreeting = 'GOOD AFTERNOON';
  else if (hours >= 17 && hours < 22) timeGreeting = 'GOOD EVENING';
  else if (hours >= 22 || hours < 5) timeGreeting = 'GOOD NIGHT';

  const fullGreeting = greetingName
    ? `${timeGreeting}, ${greetingName.toUpperCase()}`
    : timeGreeting;

  const formattedDate = dateFormatter.format(now).toUpperCase();

  return (
    <div className="glass group relative flex h-[142px] w-full flex-col justify-between overflow-hidden rounded-2xl p-4 border border-white/10 hover:border-white/15 transition-all select-none">
      {/* Upper section: Uppercase Date */}
      <div className="flex flex-col gap-0.5">
        <p className="text-gradient font-display text-[11px] sm:text-xs tracking-[0.22em] font-bold">
          {formattedDate}
        </p>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white/95 truncate">
          {fullGreeting}
        </h2>
      </div>

      {/* Rotating dev quote */}
      <div className="mt-auto pt-2 border-t border-white/[0.04]">
        <p className="text-[11px] sm:text-xs text-white/50 italic line-clamp-2 leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
});
