import { useCallback, useEffect, useRef } from 'react';
import type { Site } from '../types';
import { SubcategoryCard } from './SubcategoryCard';

export interface RailGroup {
  id: string;
  name: string;
  sites: Site[];
}

interface SubcategoryRailProps {
  groups: RailGroup[];
  categoryColor: string;
  activeId: string;
  onActiveChange: (id: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function SubcategoryRail({
  groups,
  categoryColor,
  activeId: _activeId,
  onActiveChange,
  scrollRef,
}: SubcategoryRailProps) {
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Drag-to-pan state
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const isDraggingRef = useRef(false);

  // IntersectionObserver to sync the active pill with the currently snapped card
  useEffect(() => {
    const rootEl = scrollRef.current;
    if (!rootEl || groups.length <= 1) return;

    const cards = rootEl.querySelectorAll<HTMLDivElement>('[data-subcategory-card-id]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let bestId = '';

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const id = entry.target.getAttribute('data-subcategory-card-id');
            if (id) bestId = id;
          }
        }

        if (bestId && maxRatio >= 0.45) {
          onActiveChange(bestId);
        }
      },
      {
        root: rootEl,
        threshold: [0.3, 0.5, 0.7, 0.9],
      },
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [groups, onActiveChange, scrollRef]);

  // Keyboard navigation on ← / →
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      const rootEl = scrollRef.current;
      if (!rootEl) return;

      const cardWidth = rootEl.clientWidth * 0.85;
      const direction = e.key === 'ArrowRight' ? 1 : -1;

      rootEl.scrollBy({
        left: direction * (cardWidth + 16),
        behavior: 'smooth',
      });
      e.preventDefault();
    },
    [scrollRef],
  );

  // Shift + wheel horizontal scroll handler on the rail
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.shiftKey) {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag when clicking the rail container or subcategory card header area, not inside links/buttons
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, [data-site-id]')) return;
    if (e.button !== 0) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.clientX;
    scrollStartRef.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (!isDraggingRef.current && Math.abs(dx) > 6) {
      isDraggingRef.current = true;
      scrollRef.current?.setPointerCapture(e.pointerId);
    }
    if (isDraggingRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollStartRef.current - dx;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      try {
        scrollRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
    isPointerDownRef.current = false;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handleScroll = () => {
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  };

  return (
    <div
      ref={scrollRef}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onScroll={handleScroll}
      tabIndex={0}
      role="region"
      aria-label="Subcategory rail"
      className="flex-1 flex gap-4 overflow-x-auto snap-x snap-mandatory p-5 min-h-0 scrollbar-none focus-visible:outline-none"
    >
      {groups.map((group) => (
        <SubcategoryCard
          key={group.id}
          id={group.id}
          name={group.name}
          sites={group.sites}
          categoryColor={categoryColor}
        />
      ))}
    </div>
  );
}
