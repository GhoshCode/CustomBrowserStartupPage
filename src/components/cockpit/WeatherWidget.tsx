import { memo, useEffect, useState } from 'react';
import { useStore } from '../../store';
import type { WeatherData } from '../../types';

const WEATHER_CACHE_KEY = 'devdeck_weather_cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// WMO Weather interpretation codes (WW)
function interpretWeatherCode(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear Sky', icon: '☀️' };
  if (code === 1 || code === 2) return { text: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { text: 'Overcast', icon: '☁️' };
  if (code >= 45 && code <= 48) return { text: 'Foggy', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { text: 'Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { text: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { text: 'Snow', icon: '🌨️' };
  if (code >= 80 && code <= 82) return { text: 'Showers', icon: '🌧️' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', icon: '⛈️' };
  return { text: 'Fair', icon: '🌤️' };
}

function getUvRisk(uv: number): WeatherData['uvRisk'] {
  if (uv < 3) return 'low';
  if (uv < 6) return 'moderate';
  if (uv < 8) return 'high';
  if (uv < 11) return 'very-high';
  return 'extreme';
}

function getUvColorClass(risk: WeatherData['uvRisk']): string {
  switch (risk) {
    case 'low':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'moderate':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'very-high':
    case 'extreme':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    default:
      return 'bg-white/10 text-white/70 border-white/20';
  }
}

export const WeatherWidget = memo(function WeatherWidget() {
  const weatherEnabled = useStore((s) => s.settings.weatherEnabled ?? true);
  const useGeolocation = useStore((s) => s.settings.useGeolocation ?? true);
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as WeatherData;
        if (Date.now() - parsed.lastUpdated < CACHE_TTL_MS) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!weatherEnabled) return;

    // Check if cache is still fresh
    if (weather && Date.now() - weather.lastUpdated < CACHE_TTL_MS) {
      return;
    }

    const fetchWeather = async (lat: number, lon: number, defaultCity = 'Local', defaultPostcode?: string) => {
      setLoading(true);
      try {
        // Reverse geocoding for place name & pin code
        let cityName = defaultCity;
        let postalCode = defaultPostcode;

        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            cityName = geoData.city || geoData.locality || geoData.principalSubdivision || cityName;
            postalCode = geoData.postcode || postalCode;
          }
        } catch {
          // ignore geocode failure, fallback to defaults
        }

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,uv_index`,
        );
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        const current = data.current ?? {};
        const code = current.weather_code ?? 0;
        const uv = current.uv_index ?? 0;
        const { text } = interpretWeatherCode(code);
        const nextWeather: WeatherData = {
          temperature: Math.round(current.temperature_2m ?? 28),
          conditionCode: code,
          conditionText: text,
          city: cityName,
          postalCode,
          uvIndex: Math.round(uv * 10) / 10,
          uvRisk: getUvRisk(uv),
          lastUpdated: Date.now(),
        };
        setWeather(nextWeather);
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(nextWeather));
      } catch {
        // Fallback synthetic data if offline/blocked
        if (!weather) {
          setWeather({
            temperature: 28,
            conditionCode: 1,
            conditionText: 'Fair',
            city: 'San Francisco',
            postalCode: '94107',
            uvIndex: 4.2,
            uvRisk: 'moderate',
            lastUpdated: Date.now(),
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (useGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Nearby');
        },
        () => {
          // Default coordinates if geolocation is denied
          fetchWeather(22.5726, 88.3639, 'Kolkata', '700001');
        },
        { timeout: 5000 },
      );
    } else {
      fetchWeather(22.5726, 88.3639, 'Kolkata', '700001');
    }
  }, [weatherEnabled, useGeolocation, weather]);

  if (!weatherEnabled) return null;

  const current = weather ?? {
    temperature: 28,
    conditionCode: 0,
    conditionText: 'Clear',
    city: 'Kolkata',
    postalCode: '700001',
    uvIndex: 4.2,
    uvRisk: 'moderate' as const,
    lastUpdated: Date.now(),
  };

  const { icon } = interpretWeatherCode(current.conditionCode);
  const uvClass = getUvColorClass(current.uvRisk);

  return (
    <div
      title={`Weather: ${current.conditionText}, ${current.temperature}°C, UV Index: ${current.uvIndex} (${current.uvRisk}) - ${current.city}${current.postalCode ? ` ${current.postalCode}` : ''}`}
      className="flex flex-col items-end justify-center select-none pl-3 border-l border-white/[0.08]"
    >
      {/* Location line: Place and PIN Code */}
      <div className="flex items-center gap-1 text-[11px] font-medium text-white/70">
        <span className="text-[10px] text-cyan-400">📍</span>
        <span className="truncate max-w-[120px] font-display text-white/80">{current.city}</span>
        {current.postalCode && (
          <span className="font-mono text-[10px] text-white/40">· {current.postalCode}</span>
        )}
      </div>

      {/* Temperature & Weather condition icon */}
      <div className="flex items-center gap-1.5 my-0.5">
        <span className="text-xl sm:text-2xl leading-none">{icon}</span>
        <span className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight leading-none">
          {current.temperature}°C
        </span>
      </div>

      {/* UV Index Box placed neatly BELOW temperature */}
      <div className="flex items-center gap-1 mt-0.5">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border shadow-sm ${uvClass}`}
        >
          UV {current.uvIndex} · {current.uvRisk}
        </span>
        {loading && (
          <span className="inline-block size-1.5 animate-ping rounded-full bg-cyan-400" />
        )}
      </div>
    </div>
  );
});
