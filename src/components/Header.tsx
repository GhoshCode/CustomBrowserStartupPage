import { memo, useEffect, useState } from 'react';
import { useStore } from '../store';
import { QUOTES } from '../store/seed';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function useTime() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

export const Header = memo(function Header() {
  const time = useTime();
  const { clock24h, greetingName } = useStore((s) => s.settings);
  
  // Stable random quote per session
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const hour = time.getHours();
  let greeting = 'Hello';
  if (hour >= 23 || hour < 4) greeting = 'Late night hacking?';
  else if (hour < 12) greeting = greetingName ? `Morning, ${greetingName}.` : 'Good morning.';
  else if (hour < 17) greeting = greetingName ? `Afternoon, ${greetingName}.` : 'Good afternoon.';
  else greeting = greetingName ? `Evening, ${greetingName}.` : 'Good evening.';

  const formattedDate = dateFormatter.format(time).toUpperCase();

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !clock24h,
  });

  return (
    <header className="flex w-full items-center justify-between px-6 pt-5 pb-2 sm:px-10 sm:pt-6 sm:pb-2 shrink-0">
      <div className="flex flex-col gap-1.5 min-w-0 pr-4">
        <p className="text-gradient font-display text-xs sm:text-sm tracking-[0.2em] font-semibold">
          {formattedDate}
        </p>
        <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white/95 truncate">
          {greeting}
        </h1>
        <p className="mt-0.5 max-w-xl text-sm sm:text-base text-white/80 line-clamp-1">
          {quote}
        </p>
      </div>
      
      <div
        role="timer"
        aria-label="Digital clock"
        className="font-clock text-3xl sm:text-5xl text-white/90 drop-shadow-md select-none shrink-0"
      >
        {formattedTime.replace(/AM|PM/, '').trim()}
        {!clock24h && (
          <span className="ml-2 text-xl font-sans text-white/50 uppercase tracking-widest">
            {time.getHours() >= 12 ? 'PM' : 'AM'}
          </span>
        )}
      </div>
    </header>
  );
});
