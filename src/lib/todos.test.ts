import { describe, expect, test } from 'vitest';
import type { Todo } from '../types';
import { dueTimestamp, formatDue, isDueToday, isOverdue, sortActive, sortArchived } from './todos';

const NOW = new Date(2026, 9, 15, 14, 0).getTime(); // Thu Oct 15 2026, 14:00

const todo = (over: Partial<Todo> & Pick<Todo, 'id'>): Todo => ({
  text: over.id,
  dueDate: null,
  dueTime: null,
  createdAt: 0,
  order: 0,
  archivedAt: null,
  ...over,
});

describe('dueTimestamp / isOverdue', () => {
  test('date-only items are due at the end of the day', () => {
    const t = todo({ id: 'a', dueDate: '2026-10-15' });
    expect(dueTimestamp(t)).toBe(new Date(2026, 9, 15, 23, 59, 59, 999).getTime());
    expect(isOverdue(t, NOW)).toBe(false);
    expect(isDueToday(t, NOW)).toBe(true);
  });

  test('a past time today is overdue', () => {
    const t = todo({ id: 'a', dueDate: '2026-10-15', dueTime: '13:30' });
    expect(isOverdue(t, NOW)).toBe(true);
    expect(isDueToday(t, NOW)).toBe(false);
  });

  test('no date means never overdue', () => {
    expect(dueTimestamp(todo({ id: 'a' }))).toBeNull();
    expect(isOverdue(todo({ id: 'a' }), NOW)).toBe(false);
  });
});

test('sortActive pins overdue items first (most overdue on top), then manual order', () => {
  const list = [
    todo({ id: 'plain-2', order: 2 }),
    todo({ id: 'late-1h', order: 0, dueDate: '2026-10-15', dueTime: '13:00' }),
    todo({ id: 'plain-1', order: 1 }),
    todo({ id: 'late-2d', order: 3, dueDate: '2026-10-13' }),
    todo({ id: 'done', order: 4, archivedAt: 5 }),
  ];
  expect(sortActive(list, NOW).map((t) => t.id)).toEqual(['late-2d', 'late-1h', 'plain-1', 'plain-2']);
});

test('sortArchived lists most recently archived first', () => {
  const list = [todo({ id: 'a', archivedAt: 1 }), todo({ id: 'b', archivedAt: 9 }), todo({ id: 'c' })];
  expect(sortArchived(list).map((t) => t.id)).toEqual(['b', 'a']);
});

describe('formatDue', () => {
  test.each([
    [{ dueDate: '2026-10-15', dueTime: '18:00' }, 'Today 18:00'],
    [{ dueDate: '2026-10-16' }, 'Tomorrow'],
    [{ dueDate: '2026-10-20', dueTime: '09:30' }, 'Oct 20 09:30'],
    [{ dueDate: '2026-10-15', dueTime: '13:15' }, '45m overdue'],
    [{ dueDate: '2026-10-15', dueTime: '10:00' }, '4h overdue'],
    [{ dueDate: '2026-10-12' }, '2d overdue'],
    [{}, null],
  ])('%o → %s', (due, label) => {
    expect(formatDue(todo({ id: 'x', ...due }), NOW)).toBe(label);
  });
});
