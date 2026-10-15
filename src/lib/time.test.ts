import { describe, expect, test } from 'vitest';
import { clockParts, formatDateLine, greetingFor, localDateKey } from './time';

const at = (h: number, m = 0, s = 0) => new Date(2026, 9, 15, h, m, s);

describe('clockParts', () => {
  test('12h mode maps midnight and noon to 12 with a meridiem', () => {
    expect(clockParts(at(0, 5, 9), false)).toEqual({ hours: '12', minutes: '05', seconds: '09', meridiem: 'AM' });
    expect(clockParts(at(12), false).hours).toBe('12');
    expect(clockParts(at(21, 30), false)).toMatchObject({ hours: '09', meridiem: 'PM' });
  });

  test('24h mode zero-pads and has no meridiem', () => {
    expect(clockParts(at(7, 4), true)).toMatchObject({ hours: '07', minutes: '04', meridiem: null });
  });
});

describe('greetingFor', () => {
  test.each([
    [6, 'GOOD MORNING'],
    [13, 'GOOD AFTERNOON'],
    [19, 'GOOD EVENING'],
    [23, 'GOOD NIGHT'],
    [3, 'GOOD NIGHT'],
  ])('%i:00 → %s', (h, expected) => {
    expect(greetingFor(at(h))).toBe(expected);
  });

  test('appends the uppercased name', () => {
    expect(greetingFor(at(19), ' ada ')).toBe('GOOD EVENING, ADA');
  });
});

test('date helpers', () => {
  expect(formatDateLine(at(10))).toBe('THURSDAY, OCTOBER 15, 2026');
  expect(localDateKey(at(23, 59))).toBe('2026-10-15');
});
