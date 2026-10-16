import { flushSync } from 'react-dom';

// Theme changes restyle thousands of elements in one frame. With the View
// Transitions API (Chrome 111+, i.e. every DevDeck target) the browser shows
// a snapshot of the old theme and crossfades to the new one, so that frame
// reads as a smooth fade instead of a hitch. Falls back to a plain update
// elsewhere and when the user prefers reduced motion.
export function withThemeTransition(update: () => void): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce) {
    update();
    return;
  }
  // flushSync commits React (and App's layout effect that sets data-theme)
  // inside the callback, so the "new" snapshot is the finished theme.
  doc.startViewTransition(() => flushSync(update));
}
