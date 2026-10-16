import { describe, expect, test } from 'vitest';
import { describeWeather, fetchWeather, geocodeCity, placeFromTimezone, uvRisk } from './weather';

const jsonFetch = (body: unknown, ok = true) =>
  (async () => ({ ok, status: ok ? 200 : 500, json: async () => body })) as unknown as typeof fetch;

describe('uvRisk', () => {
  test.each([
    [0, 'low'],
    [2.4, 'low'],
    [3, 'moderate'],
    [5.4, 'moderate'],
    [6, 'high'],
    [8, 'very-high'],
    [10.4, 'very-high'],
    [11, 'extreme'],
  ])('%f → %s', (uv, risk) => {
    expect(uvRisk(uv)).toBe(risk);
  });
});

test('describeWeather maps WMO codes and day/night', () => {
  expect(describeWeather(0, true).icon).toBe('sun');
  expect(describeWeather(0, false).icon).toBe('moon');
  expect(describeWeather(63).icon).toBe('rain');
  expect(describeWeather(75).icon).toBe('snow');
  expect(describeWeather(96).icon).toBe('storm');
});

test('placeFromTimezone keeps the last segment, spaced', () => {
  expect(placeFromTimezone('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
});

describe('fetchWeather', () => {
  test('normalises the Open-Meteo current block', async () => {
    const data = await fetchWeather(
      { lat: 22.57, lon: 88.36, label: null },
      jsonFetch({
        timezone: 'Asia/Kolkata',
        current: { temperature_2m: 26.6, weather_code: 51, uv_index: 6.2, is_day: 1 },
      }),
      1234,
    );
    expect(data).toEqual({
      temperature: 26.6,
      conditionCode: 51,
      conditionText: 'Drizzle',
      icon: 'rain',
      place: 'Kolkata',
      uvIndex: 6.2,
      uvRisk: 'high',
      fetchedAt: 1234,
    });
  });

  test('rejects on HTTP errors', async () => {
    await expect(fetchWeather({ lat: 0, lon: 0, label: 'X' }, jsonFetch({}, false))).rejects.toThrow(
      'Weather request failed',
    );
  });
});

test('geocodeCity reports unknown cities', async () => {
  await expect(geocodeCity('Nowhere', jsonFetch({}))).rejects.toThrow('City "Nowhere" not found');
  await expect(
    geocodeCity('Kolkata', jsonFetch({ results: [{ latitude: 1, longitude: 2, name: 'Kolkata' }] })),
  ).resolves.toEqual({ lat: 1, lon: 2, label: 'Kolkata' });
});
