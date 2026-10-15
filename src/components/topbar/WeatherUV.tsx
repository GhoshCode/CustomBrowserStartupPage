import { memo, useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store';
import {
  UV_LABEL,
  WEATHER_TTL_MS,
  cachedWeather,
  loadWeather,
  type UvRisk,
  type WeatherData,
  type WeatherIcon,
} from '../../services/weather';

// A (Weather °C) stacked over B (UV index + risk badge), beside the TIME widget.
// Click either half to force a refresh.

const ICON: Record<WeatherIcon, string> = {
  sun: '☀️',
  moon: '🌙',
  partly: '⛅',
  cloud: '☁️',
  fog: '🌫️',
  rain: '🌧️',
  snow: '❄️',
  storm: '⛈️',
};

// Spec §3.2 colour bands.
const UV_BADGE: Record<UvRisk, string> = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  moderate: 'bg-yellow-400/20 text-yellow-200 border-yellow-300/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
  'very-high': 'bg-red-500/25 text-red-300 border-red-400/50',
  extreme: 'bg-purple-500/25 text-purple-300 border-purple-400/50',
};

type State =
  | { status: 'loading'; data: WeatherData | null }
  | { status: 'ready'; data: WeatherData }
  | { status: 'error'; data: WeatherData | null; error: string };

export const WeatherUV = memo(function WeatherUV() {
  const enabled = useStore((s) => s.settings.weatherEnabled);
  const useGeolocation = useStore((s) => s.settings.useGeolocation);
  const manualCity = useStore((s) => s.settings.manualCity);
  const [state, setState] = useState<State>(() => {
    const hit = cachedWeather({ useGeolocation, manualCity });
    return hit ? { status: 'ready', data: hit } : { status: 'loading', data: null };
  });

  const refresh = useCallback(
    (force: boolean) => {
      let cancelled = false;
      setState((s) => ({ status: 'loading', data: s.data }));
      loadWeather({ useGeolocation, manualCity }, { force })
        .then((data) => !cancelled && setState({ status: 'ready', data }))
        .catch(
          (err: unknown) =>
            !cancelled &&
            setState((s) => ({
              status: 'error',
              data: s.data,
              error: err instanceof Error ? err.message : 'Weather unavailable',
            })),
        );
      return () => {
        cancelled = true;
      };
    },
    [useGeolocation, manualCity],
  );

  // Load on mount / location change, then keep it fresh while the tab stays open.
  useEffect(() => {
    if (!enabled) return;
    const cancel = refresh(false);
    const timer = setInterval(() => refresh(false), WEATHER_TTL_MS);
    return () => {
      cancel();
      clearInterval(timer);
    };
  }, [enabled, refresh]);

  if (!enabled) return <div aria-hidden className="glass h-full opacity-40" />;

  const { data } = state;
  const error = state.status === 'error' ? state.error : null;
  const title = error
    ? `${error} — click to retry`
    : data
      ? `${data.conditionText} in ${data.place} · updated ${new Date(data.fetchedAt).toLocaleTimeString()} — click to refresh`
      : 'Loading weather…';

  return (
    <button
      type="button"
      onClick={() => refresh(true)}
      title={title}
      aria-label={data ? `Weather: ${Math.round(data.temperature)}°C, UV ${data.uvIndex.toFixed(1)} ${UV_LABEL[data.uvRisk]}` : 'Weather'}
      data-testid="weather-uv"
      className={`grid h-full grid-rows-2 gap-2 text-left ${state.status === 'loading' ? 'animate-pulse' : ''}`}
    >
      {/* A — Weather */}
      <div className="glass-inner flex flex-col justify-center rounded-2xl px-2.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.18em] text-white/40">A · WEATHER</span>
        <span className="flex items-center gap-1 text-white/95">
          <span className="text-sm leading-none">{data ? ICON[data.icon] : error ? '⚠️' : '·'}</span>
          <span className="text-[1rem] font-semibold tabular-nums">
            {data ? `${Math.round(data.temperature)}°C` : '--°C'}
          </span>
        </span>
      </div>
      {/* B — UV index */}
      <div className="glass-inner flex flex-col justify-center rounded-2xl px-2.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.18em] text-white/40">B · UV</span>
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tabular-nums text-white/95">
            {data ? data.uvIndex.toFixed(1) : '--'}
          </span>
          {data && (
            <span className={`rounded-md border px-1 text-[9px] font-bold uppercase ${UV_BADGE[data.uvRisk]}`}>
              {UV_LABEL[data.uvRisk]}
            </span>
          )}
        </span>
      </div>
    </button>
  );
});
