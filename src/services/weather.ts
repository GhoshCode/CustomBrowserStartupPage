// A (Weather) + B (UV index) data — spec §3.2. Open-Meteo needs no key and
// sends CORS headers, so this works identically on the web and in the extension.

import { readCache, writeCache } from '../lib/cache';

export type UvRisk = 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
export type WeatherIcon = 'sun' | 'moon' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

export interface WeatherData {
  temperature: number; // °C
  conditionCode: number; // WMO code
  conditionText: string;
  icon: WeatherIcon;
  place: string; // city or timezone-derived label
  uvIndex: number;
  uvRisk: UvRisk;
  fetchedAt: number;
}

export const WEATHER_TTL_MS = 45 * 60 * 1000; // spec §3.2 network strategy
const CACHE_NAME = 'weather';

// WHO bands: 0–2 Low, 3–5 Moderate, 6–7 High, 8–10 Very High, 11+ Extreme.
export function uvRisk(uv: number): UvRisk {
  const v = Math.round(uv);
  if (v <= 2) return 'low';
  if (v <= 5) return 'moderate';
  if (v <= 7) return 'high';
  if (v <= 10) return 'very-high';
  return 'extreme';
}

export const UV_LABEL: Record<UvRisk, string> = {
  low: 'Low',
  moderate: 'Mod',
  high: 'High',
  'very-high': 'V.High',
  extreme: 'Extreme',
};

// WMO weather interpretation codes → short label + icon.
export function describeWeather(code: number, isDay = true): { text: string; icon: WeatherIcon } {
  if (code === 0) return { text: 'Clear', icon: isDay ? 'sun' : 'moon' };
  if (code <= 2) return { text: 'Partly cloudy', icon: isDay ? 'partly' : 'cloud' };
  if (code === 3) return { text: 'Overcast', icon: 'cloud' };
  if (code === 45 || code === 48) return { text: 'Fog', icon: 'fog' };
  if (code >= 51 && code <= 57) return { text: 'Drizzle', icon: 'rain' };
  if (code >= 61 && code <= 67) return { text: 'Rain', icon: 'rain' };
  if (code >= 71 && code <= 77) return { text: 'Snow', icon: 'snow' };
  if (code >= 80 && code <= 82) return { text: 'Showers', icon: 'rain' };
  if (code === 85 || code === 86) return { text: 'Snow showers', icon: 'snow' };
  if (code >= 95) return { text: 'Thunderstorm', icon: 'storm' };
  return { text: 'Unknown', icon: 'cloud' };
}

export interface Place {
  lat: number;
  lon: number;
  label: string | null; // null → derive from the forecast's timezone
}

type Fetch = typeof fetch;

export async function geocodeCity(name: string, fetcher: Fetch = fetch): Promise<Place> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(name)}`;
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const json = (await res.json()) as { results?: Array<{ latitude: number; longitude: number; name: string }> };
  const hit = json.results?.[0];
  if (!hit) throw new Error(`City "${name}" not found`);
  return { lat: hit.latitude, lon: hit.longitude, label: hit.name };
}

export function browserPosition(timeoutMs = 8000): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    // The API's own timeout only starts once permission is granted; an
    // unanswered prompt would otherwise leave the widget loading forever.
    setTimeout(() => reject(new Error('Location request timed out')), timeoutMs + 2000);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: null }),
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED ? 'Location permission denied' : 'Location unavailable')),
      { timeout: timeoutMs, maximumAge: WEATHER_TTL_MS },
    );
  });
}

// "Asia/Kolkata" → "Kolkata", "America/Argentina/Buenos_Aires" → "Buenos Aires".
export const placeFromTimezone = (tz: string): string =>
  (tz.split('/').pop() ?? tz).replace(/_/g, ' ');

export async function fetchWeather(place: Place, fetcher: Fetch = fetch, now = Date.now()): Promise<WeatherData> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${place.lat.toFixed(3)}&longitude=${place.lon.toFixed(3)}` +
    '&current=temperature_2m,weather_code,uv_index,is_day&timezone=auto';
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const json = (await res.json()) as {
    timezone?: string;
    current?: { temperature_2m: number; weather_code: number; uv_index?: number; is_day?: number };
  };
  const cur = json.current;
  if (!cur) throw new Error('Weather response had no current conditions');
  const uv = cur.uv_index ?? 0;
  const { text, icon } = describeWeather(cur.weather_code, cur.is_day !== 0);
  return {
    temperature: cur.temperature_2m,
    conditionCode: cur.weather_code,
    conditionText: text,
    icon,
    place: place.label ?? placeFromTimezone(json.timezone ?? ''),
    uvIndex: uv,
    uvRisk: uvRisk(uv),
    fetchedAt: now,
  };
}

export interface WeatherPrefs {
  useGeolocation: boolean;
  manualCity: string;
}

// Cache key: which location *source* the reading is for, so changing the
// manual city or toggling geolocation invalidates the cached reading.
const cacheKey = (p: WeatherPrefs) =>
  p.useGeolocation ? 'geo' : `city:${p.manualCity.trim().toLowerCase()}`;

export function cachedWeather(prefs: WeatherPrefs): WeatherData | null {
  return readCache<WeatherData>(CACHE_NAME, cacheKey(prefs), WEATHER_TTL_MS);
}

// Geolocation first (if enabled), falling back to the manual city.
export async function loadWeather(prefs: WeatherPrefs, opts: { force?: boolean } = {}): Promise<WeatherData> {
  if (!opts.force) {
    const hit = cachedWeather(prefs);
    if (hit) return hit;
  }
  const city = prefs.manualCity.trim();
  let place: Place;
  if (prefs.useGeolocation) {
    try {
      place = await browserPosition();
    } catch (err) {
      if (!city) throw err;
      place = await geocodeCity(city);
    }
  } else if (city) {
    place = await geocodeCity(city);
  } else {
    throw new Error('Set a city in Settings → Profile');
  }
  const data = await fetchWeather(place);
  writeCache(CACHE_NAME, cacheKey(prefs), data);
  return data;
}
