import type { Category } from '../types';

// Display order for the card row (§7 Q6): the single pinned card goes first,
// everything else keeps its stored order. Because `order` itself is never
// rewritten, unpinning drops the card straight back into its usual slot.
export function orderWithPin(categories: readonly Category[], pinnedId: string | null): Category[] {
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const pinned = pinnedId ? sorted.find((c) => c.id === pinnedId) : undefined;
  return pinned ? [pinned, ...sorted.filter((c) => c !== pinned)] : sorted;
}
