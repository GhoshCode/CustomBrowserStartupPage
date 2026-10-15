import { expect, test } from 'vitest';
import type { Schedule } from '../types';
import { nextDue, type ReminderItem } from './reminders-shared';

const daily = (time: string): Schedule => ({
  enabled: true,
  frequency: 'daily',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  timeOfDay: time,
  from: '2026-01',
  to: '2026-12',
});
const item = (id: string, s: Schedule): ReminderItem => ({ id, name: id, url: `https://${id}.dev`, schedule: s });

test('nextDue picks the soonest reminder and groups ties', () => {
  const now = new Date(2026, 9, 15, 8, 0);
  const due = nextDue([item('a', daily('10:00')), item('b', daily('09:00')), item('c', daily('09:00'))], now);
  expect(due!.at).toBe(new Date(2026, 9, 15, 9, 0).getTime());
  expect(due!.items.map((i) => i.id)).toEqual(['b', 'c']);
});

test('nextDue is null when nothing is scheduled', () => {
  expect(nextDue([item('a', { ...daily('09:00'), enabled: false })], new Date())).toBeNull();
});
