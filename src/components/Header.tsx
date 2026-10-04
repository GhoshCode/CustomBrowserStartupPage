import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { QUOTES } from '../store/seed';

function useTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

export function Header() {
  const time = useTime();
  const { clock24h, greetingName } = useStore((s) => s.settings);
  
  // Use useMemo or state for a stable random quote to avoid hydration mismatch
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const hour = time.getHours();
  let greeting = 'Hello';
  if (hour >= 23 || hour < 4) greeting = 'Late night hacking?';
  else if (hour < 12) greeting = greetingName ? `Morning, ${greetingName}.` : 'Good morning.';
  else if (hour < 17) greeting = greetingName ? `Afternoon, ${greetingName}.` : 'Good afternoon.';
  else greeting = greetingName ? `Evening, ${greetingName}.` : 'Good evening.';

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(time).toUpperCase();

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !clock24h,
  });

  return (
    <header className="flex w-full items-start justify-between p-8 sm:p-12">
      <div className="flex flex-col gap-2">
        <p className="text-gradient font-display text-xs tracking-[0.2em] font-semibold">
          {formattedDate}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white/90">
          {greeting}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/50 opacity-80 mix-blend-screen">
          {quote}
        </p>
      </div>
      
      <div className="font-clock text-4xl sm:text-6xl text-white/90 drop-shadow-md">
        {formattedTime.replace(/AM|PM/, '').trim()}
        {!clock24h && (
          <span className="ml-2 text-xl font-sans text-white/50 uppercase tracking-widest">
            {time.getHours() >= 12 ? 'PM' : 'AM'}
          </span>
        )}
      </div>
    </header>
  );
}
