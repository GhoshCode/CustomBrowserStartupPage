import { expect, test } from 'vitest';
import { orderWithPin } from './categories';

const cats = [
  { id: 'c', name: 'C', color: '#fff', order: 2 },
  { id: 'a', name: 'A', color: '#fff', order: 0 },
  { id: 'b', name: 'B', color: '#fff', order: 1 },
];

test('no pin keeps stored order', () => {
  expect(orderWithPin(cats, null).map((c) => c.id)).toEqual(['a', 'b', 'c']);
});

test('the pinned card moves to the front; unpinning restores the original sequence', () => {
  expect(orderWithPin(cats, 'c').map((c) => c.id)).toEqual(['c', 'a', 'b']);
  expect(orderWithPin(cats, 'b').map((c) => c.id)).toEqual(['b', 'a', 'c']);
  expect(orderWithPin(cats, null).map((c) => c.id)).toEqual(['a', 'b', 'c']);
});

test('an unknown pin id is ignored', () => {
  expect(orderWithPin(cats, 'ghost').map((c) => c.id)).toEqual(['a', 'b', 'c']);
});
