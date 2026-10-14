import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useIdleTimeout } from './useIdleTimeout';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

function Probe({ active, onIdle }: { active: boolean; onIdle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useIdleTimeout(ref, active, 30_000, onIdle);
  return createElement('div', { ref, 'data-testid': 'panel' });
}

test('fires after 30s of inactivity and activity inside the panel resets it', () => {
  const onIdle = vi.fn();
  act(() => root.render(createElement(Probe, { active: true, onIdle })));
  const panel = host.querySelector('[data-testid=panel]')!;

  act(() => vi.advanceTimersByTime(29_000));
  panel.dispatchEvent(new Event('keydown'));
  act(() => vi.advanceTimersByTime(29_000));
  expect(onIdle).not.toHaveBeenCalled();

  act(() => vi.advanceTimersByTime(1_000));
  expect(onIdle).toHaveBeenCalledTimes(1);
});

test('does nothing while inactive', () => {
  const onIdle = vi.fn();
  act(() => root.render(createElement(Probe, { active: false, onIdle })));
  act(() => vi.advanceTimersByTime(60_000));
  expect(onIdle).not.toHaveBeenCalled();
});
