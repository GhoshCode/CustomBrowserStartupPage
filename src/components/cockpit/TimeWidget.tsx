import { memo, useEffect, useState } from 'react';
import { useStore } from '../../store';
import type { ClockStyle } from '../../types';

function useCurrentTime() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

export const TimeWidget = memo(function TimeWidget() {
  const time = useCurrentTime();
  const clockStyle = useStore((s) => s.settings.clockStyle ?? 'dseg7');
  const clock24h = useStore((s) => s.settings.clock24h ?? false);
  const showSeconds = useStore((s) => s.settings.showSeconds ?? true);
  const updateSettings = useStore((s) => s.updateSettings);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const displayHours = clock24h
    ? String(hours).padStart(2, '0')
    : String(hours % 12 || 12).padStart(2, '0');
  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  const cycleStyle = () => {
    const styles: ClockStyle[] = ['dseg7', 'cyberpunk', 'macos'];
    const nextIdx = (styles.indexOf(clockStyle) + 1) % styles.length;
    updateSettings({ clockStyle: styles[nextIdx] });
  };

  return (
    <div
      data-testid="time-widget"
      onClick={cycleStyle}
      title={`Clock style: ${clockStyle.toUpperCase()} (Click to cycle)`}
      className="group relative flex cursor-pointer items-baseline select-none transition-transform hover:scale-[1.02]"
    >
      {clockStyle === 'cyberpunk' ? (
        /* Cyberpunk style — bold blocky Orbitron with stacked seconds on right flank, no cities below */
        <div className="flex items-baseline gap-1.5 font-['Orbitron',sans-serif] tracking-wider text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
          <span className="text-4xl sm:text-5xl font-black tracking-widest text-white drop-shadow-[0_0_16px_rgba(255,46,154,0.6)]">
            {displayHours}:{displayMinutes}
          </span>
          {showSeconds && (
            <span className="flex flex-col text-sm sm:text-base font-bold text-cyan-400/90 leading-tight">
              <span>:{displaySeconds}</span>
              {!clock24h && (
                <span className="text-[10px] text-pink-400/90 tracking-widest font-semibold uppercase">
                  {ampm}
                </span>
              )}
            </span>
          )}
          {!showSeconds && !clock24h && (
            <span className="ml-1 text-xs font-bold text-pink-400 uppercase tracking-widest">
              {ampm}
            </span>
          )}
        </div>
      ) : clockStyle === 'macos' ? (
        /* macOS Minimalist style — clean Apple-grade typography */
        <div className="flex items-baseline gap-1 font-sans text-white/95">
          <span className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {displayHours}:{displayMinutes}
          </span>
          {showSeconds && (
            <span className="text-sm sm:text-base font-medium text-white/50">
              :{displaySeconds}
            </span>
          )}
          {!clock24h && (
            <span className="ml-1 text-xs font-semibold text-white/40 tracking-wider uppercase">
              {ampm}
            </span>
          )}
        </div>
      ) : (
        /* DSEG7 Classic Retro 7-Segment style */
        <div className="flex items-baseline gap-1.5 font-clock text-white/90 drop-shadow-md">
          <span className="text-3xl sm:text-4xl tracking-widest">
            {displayHours}:{displayMinutes}
          </span>
          {showSeconds && (
            <span className="text-sm sm:text-base font-sans tracking-wide text-white/60">
              :{displaySeconds}
            </span>
          )}
          {!clock24h && (
            <span className="ml-1 text-xs font-sans text-white/50 uppercase tracking-wider font-semibold">
              {ampm}
            </span>
          )}
        </div>
      )}

      {/* Subtle indicator of current style on hover */}
      <span className="absolute -bottom-3.5 left-0 text-[9px] font-mono uppercase tracking-widest text-white/30 opacity-0 transition-opacity group-hover:opacity-100">
        {clockStyle}
      </span>
    </div>
  );
});
