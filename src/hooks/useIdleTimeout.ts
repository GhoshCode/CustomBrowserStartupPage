import { useEffect, useRef, type RefObject } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'focusin', 'input'] as const;

// Calls `onIdle` once `ms` pass without any interaction inside `ref` while
// `active` is true. Every pointer, key, wheel or focus event restarts the clock.
export function useIdleTimeout(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  ms: number,
  onIdle: () => void,
): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    let timer = setTimeout(() => onIdleRef.current(), ms);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), ms);
    };
    ACTIVITY_EVENTS.forEach((type) => el.addEventListener(type, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((type) => el.removeEventListener(type, reset));
    };
  }, [ref, active, ms]);
}
