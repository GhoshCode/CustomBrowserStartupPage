import { memo, useEffect, useRef, useState } from 'react';

export interface PrimeDateTimePickerProps {
  /** YYYY-MM-DD string */
  valueDate?: string;
  /** HH:mm string (24h) */
  valueTime?: string;
  onChange: (date: string, time: string) => void;
  onClose?: () => void;
  showTime?: boolean;
  showPresets?: boolean;
  clock24h?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const PrimeDateTimePicker = memo(function PrimeDateTimePicker({
  valueDate = '',
  valueTime = '',
  onChange,
  onClose,
  showTime = true,
  showPresets = true,
  clock24h = true,
  className = '',
}: PrimeDateTimePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to today
  const initialDateObj = valueDate ? new Date(`${valueDate}T00:00:00`) : new Date();
  const [currentYear, setCurrentYear] = useState(() => initialDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => initialDateObj.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => valueDate);

  // Time state: parse HH:mm or default to current / 12:00
  const [hour, setHour] = useState<number>(() => {
    if (valueTime) {
      const h = parseInt(valueTime.split(':')[0], 10);
      return isNaN(h) ? 12 : h;
    }
    return new Date().getHours();
  });

  const [minute, setMinute] = useState<number>(() => {
    if (valueTime) {
      const m = parseInt(valueTime.split(':')[1], 10);
      return isNaN(m) ? 0 : m;
    }
    return new Date().getMinutes();
  });

  // Keep internal state updated when props change
  useEffect(() => {
    if (valueDate) {
      setSelectedDate(valueDate);
      const d = new Date(`${valueDate}T00:00:00`);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [valueDate]);

  useEffect(() => {
    if (valueTime) {
      const [h, m] = valueTime.split(':').map((x) => parseInt(x, 10));
      if (!isNaN(h)) setHour(h);
      if (!isNaN(m)) setMinute(m);
    }
  }, [valueTime]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);

  // Navigation: previous / next month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Day calculations for PrimeNG 7-column grid
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Trailing days from previous month
  const prevMonthDays: { day: number; year: number; month: number }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    prevMonthDays.push({
      day: daysInPrevMonth - i,
      year: prevYear,
      month: prevMonth,
    });
  }

  // Current month days
  const currentMonthDays: { day: number; year: number; month: number }[] = [];
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    currentMonthDays.push({
      day: d,
      year: currentYear,
      month: currentMonth,
    });
  }

  // Leading days from next month to complete the grid (total 35 or 42 cells)
  const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
  const targetTotal = totalCellsSoFar > 35 ? 42 : 35;
  const nextMonthDaysCount = targetTotal - totalCellsSoFar;
  const nextMonthDays: { day: number; year: number; month: number }[] = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    nextMonthDays.push({
      day: d,
      year: nextYear,
      month: nextMonth,
    });
  }

  const formatLocalDate = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handleSelectDay = (y: number, m: number, d: number) => {
    const formattedDate = formatLocalDate(y, m, d);
    setSelectedDate(formattedDate);
    setCurrentYear(y);
    setCurrentMonth(m);
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(formattedDate, formattedTime);
  };

  // Time adjustments with PrimeNG spinners
  const incrementHour = () => {
    const next = (hour + 1) % 24;
    setHour(next);
    const formattedTime = `${String(next).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(selectedDate, formattedTime);
  };

  const decrementHour = () => {
    const next = (hour - 1 + 24) % 24;
    setHour(next);
    const formattedTime = `${String(next).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(selectedDate, formattedTime);
  };

  const incrementMinute = (step = 1) => {
    const next = (minute + step) % 60;
    setMinute(next);
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(next).padStart(2, '0')}`;
    onChange(selectedDate, formattedTime);
  };

  const decrementMinute = (step = 1) => {
    const next = (minute - step + 60) % 60;
    setMinute(next);
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(next).padStart(2, '0')}`;
    onChange(selectedDate, formattedTime);
  };

  // Presets
  const applyPreset = (offsetDays: number, presetTime?: string) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const dateStr = formatLocalDate(y, m, day);
    setSelectedDate(dateStr);
    setCurrentYear(y);
    setCurrentMonth(m);

    let finalTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (presetTime) {
      finalTime = presetTime;
      const [h, min] = presetTime.split(':').map((x) => parseInt(x, 10));
      setHour(h);
      setMinute(min);
    }
    onChange(dateStr, finalTime);
  };

  const todayStr = (() => {
    const d = new Date();
    return formatLocalDate(d.getFullYear(), d.getMonth(), d.getDate());
  })();

  const isPM = hour >= 12;
  const displayHour = clock24h ? hour : hour % 12 === 0 ? 12 : hour % 12;

  const toggleAMPM = () => {
    const nextHour = isPM ? hour - 12 : hour + 12;
    setHour(nextHour);
    const formattedTime = `${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(selectedDate, formattedTime);
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Prime Date and Time Picker"
      data-testid="prime-date-time-picker"
      className={`relative z-50 flex w-[280px] sm:w-[295px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#14121a]/95 p-3 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-200 select-none ${className}`}
    >
      {/* 1. Header: < Month Year > */}
      <div className="flex items-center justify-between pb-2.5">
        <button
          type="button"
          onClick={handlePrevMonth}
          title="Previous Month"
          aria-label="Previous Month"
          className="flex size-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-white/95">
          <span>{MONTH_NAMES[currentMonth]}</span>
          <span className="text-white/80">{currentYear}</span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          title="Next Month"
          aria-label="Next Month"
          className="flex size-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="border-b border-white/[0.08] mb-2.5" />

      {/* 2. Weekdays Header: Su Mo Tu We Th Fr Sa */}
      <div className="grid grid-cols-7 text-center font-display text-[11px] font-semibold tracking-wider text-white/90 pb-1.5">
        {WEEK_DAYS.map((wd) => (
          <div key={wd} className="py-0.5">
            {wd}
          </div>
        ))}
      </div>

      {/* 3. Calendar Grid (7 columns) */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {/* Previous Month trailing days */}
        {prevMonthDays.map((item) => {
          const formatted = formatLocalDate(item.year, item.month, item.day);
          const isSelected = selectedDate === formatted;
          return (
            <button
              key={`prev-${item.day}`}
              type="button"
              onClick={() => handleSelectDay(item.year, item.month, item.day)}
              className={`group relative mx-auto flex size-7 items-center justify-center rounded-full text-white/30 hover:bg-white/10 hover:text-white/70 transition-colors ${
                isSelected ? 'bg-white font-bold text-black shadow-md !text-black' : ''
              }`}
            >
              {item.day}
            </button>
          );
        })}

        {/* Current Month days */}
        {currentMonthDays.map((item) => {
          const formatted = formatLocalDate(item.year, item.month, item.day);
          const isSelected = selectedDate === formatted;
          const isToday = formatted === todayStr;

          return (
            <button
              key={`curr-${item.day}`}
              type="button"
              onClick={() => handleSelectDay(item.year, item.month, item.day)}
              className={`group relative mx-auto flex size-7 items-center justify-center rounded-full font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-white font-bold text-black shadow-md scale-105'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              } ${isToday && !isSelected ? 'border border-rose-400/60 font-semibold text-rose-300' : ''}`}
            >
              {item.day}
            </button>
          );
        })}

        {/* Next Month leading days */}
        {nextMonthDays.map((item) => {
          const formatted = formatLocalDate(item.year, item.month, item.day);
          const isSelected = selectedDate === formatted;
          return (
            <button
              key={`next-${item.day}`}
              type="button"
              onClick={() => handleSelectDay(item.year, item.month, item.day)}
              className={`group relative mx-auto flex size-7 items-center justify-center rounded-full text-white/30 hover:bg-white/10 hover:text-white/70 transition-colors ${
                isSelected ? 'bg-white font-bold text-black shadow-md !text-black' : ''
              }`}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      {/* 4. Time Picker Section with PrimeNG Spinners */}
      {showTime && (
        <div className="mt-3 border-t border-white/[0.08] pt-2.5">
          <div className="flex items-center justify-center gap-4 text-center">
            {/* Hours spinner */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementHour}
                title="Increment Hour"
                aria-label="Increment Hour"
                className="flex size-6 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 15l7-7 7-7" />
                </svg>
              </button>

              <span className="font-mono text-base font-bold tracking-wider text-white px-2 py-0.5">
                {String(displayHour).padStart(2, '0')}
              </span>

              <button
                type="button"
                onClick={decrementHour}
                title="Decrement Hour"
                aria-label="Decrement Hour"
                className="flex size-6 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Separator colon */}
            <span className="font-mono text-base font-bold text-white/50 -mt-0.5">:</span>

            {/* Minutes spinner */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => incrementMinute(5)}
                title="Increment Minute"
                aria-label="Increment Minute"
                className="flex size-6 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 15l7-7 7-7" />
                </svg>
              </button>

              <span className="font-mono text-base font-bold tracking-wider text-white px-2 py-0.5">
                {String(minute).padStart(2, '0')}
              </span>

              <button
                type="button"
                onClick={() => decrementMinute(5)}
                title="Decrement Minute"
                aria-label="Decrement Minute"
                className="flex size-6 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 12h AM/PM Toggle */}
            {!clock24h && (
              <button
                type="button"
                onClick={toggleAMPM}
                title="Toggle AM / PM"
                className="ml-1 rounded px-1.5 py-0.5 text-xs font-bold font-mono bg-white/10 hover:bg-white/20 text-rose-300 transition-colors"
              >
                {isPM ? 'PM' : 'AM'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Quick Presets Footer */}
      {showPresets && (
        <div className="mt-2.5 border-t border-white/[0.08] pt-2 flex flex-wrap items-center justify-between gap-1 text-[10px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyPreset(0)}
              className="rounded-md bg-white/5 px-2 py-0.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => applyPreset(1)}
              className="rounded-md bg-white/5 px-2 py-0.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => applyPreset(3)}
              className="rounded-md bg-white/5 px-2 py-0.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              +3d
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setHour(9);
                setMinute(0);
                onChange(selectedDate, '09:00');
              }}
              className="rounded-md bg-white/5 px-1.5 py-0.5 text-rose-300 hover:bg-white/10 transition-colors"
            >
              09:00
            </button>
            <button
              type="button"
              onClick={() => {
                setHour(18);
                setMinute(0);
                onChange(selectedDate, '18:00');
              }}
              className="rounded-md bg-white/5 px-1.5 py-0.5 text-rose-300 hover:bg-white/10 transition-colors"
            >
              18:00
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-1 rounded-md bg-rose-500/20 text-rose-200 border border-rose-500/40 px-2 py-0.5 font-semibold hover:bg-rose-500/30 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
