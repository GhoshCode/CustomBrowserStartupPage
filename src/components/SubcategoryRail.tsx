import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Site } from '../types';
import { SiteRow } from './SiteRow';

export interface RailGroup {
  id: string;
  name: string;
  sites: Site[];
}

interface SubcategoryCardProps {
  id: string;
  name: string;
  sites: Site[];
  categoryColor: string;
}

const SubcategoryCard = memo(function SubcategoryCard({
  id,
  name,
  sites,
  categoryColor,
}: SubcategoryCardProps) {
  const siteIds = useMemo(() => sites.map((s) => s.id), [sites]);

  return (
    <div
      data-subcategory-card-id={id}
      className="glass-inner flex h-full w-[85%] min-w-[85%] max-w-[85%] shrink-0 flex-col overflow-hidden p-3.5"
    >
      {/* Subcategory Card Header */}
      <div className="mb-2 flex items-center justify-between border-b border-white/[0.04] pb-2 px-1 select-none">
        <h3 className="text-xs font-semibold text-white/90 truncate">
          {name}
        </h3>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/40 tabular-nums">
          {sites.length}
        </span>
      </div>

      {/* Vertically Scrolling Site List with SortableContext */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {sites.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <p className="text-xs font-medium text-white/40">No sites yet</p>
            <p className="mt-0.5 text-[10px] text-white/25">Add sites to {name}</p>
          </div>
        ) : (
          <SortableContext items={siteIds} strategy={verticalListSortingStrategy}>
            {sites.map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                categoryColor={categoryColor}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
});

interface SubcategoryRailProps {
  groups: RailGroup[];
  categoryColor: string;
  activeId: string;
  onActiveChange: (id: string) => void;
  onSelectGroup?: (id: string) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  isProgrammaticScrollRef?: React.RefObject<boolean>;
}

export function SubcategoryRail({
  groups,
  categoryColor,
  activeId,
  onActiveChange,
  onSelectGroup,
  scrollRef,
  isProgrammaticScrollRef,
}: SubcategoryRailProps) {

  // Drag-to-pan state
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastSwitchTimeRef = useRef(0);

  // IntersectionObserver to sync the active pill with the currently snapped card
  useEffect(() => {
    const rootEl = scrollRef.current;
    if (!rootEl || groups.length <= 1) return;

    const cards = rootEl.querySelectorAll<HTMLDivElement>('[data-subcategory-card-id]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Skip updating active pill if programmatic scrolling is active
        if (isProgrammaticScrollRef?.current) return;

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
  }, [groups.length, onActiveChange, scrollRef, isProgrammaticScrollRef]);

  // Keyboard navigation on ← / →
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
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

  // Wheel scroll handler: scrolling in the subcategory area switches the subcategory
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (groups.length <= 1) return;

    const target = e.target as HTMLElement;
    const siteListEl = target.closest('.overflow-y-auto') as HTMLElement | null;

    let shouldSwitch = false;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    if (Math.abs(delta) < 18) return;

    if (!siteListEl) {
      shouldSwitch = true;
    } else {
      // If inside site list: switch if horizontal wheel, or if scrolled to edge
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        shouldSwitch = true;
      } else if (e.deltaY > 0 && siteListEl.scrollTop + siteListEl.clientHeight >= siteListEl.scrollHeight - 2) {
        shouldSwitch = true;
      } else if (e.deltaY < 0 && siteListEl.scrollTop <= 2) {
        shouldSwitch = true;
      }
    }

    if (shouldSwitch) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastSwitchTimeRef.current < 320) return;

      const currentIndex = groups.findIndex((g) => g.id === activeId);
      if (delta > 0 && currentIndex < groups.length - 1) {
        lastSwitchTimeRef.current = now;
        const nextId = groups[currentIndex + 1].id;
        if (onSelectGroup) onSelectGroup(nextId);
        else onActiveChange(nextId);
      } else if (delta < 0 && currentIndex > 0) {
        lastSwitchTimeRef.current = now;
        const prevId = groups[currentIndex - 1].id;
        if (onSelectGroup) onSelectGroup(prevId);
        else onActiveChange(prevId);
      }
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Only drag when clicking the rail container or subcategory card header area, not inside links/buttons
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, [data-site-id]')) return;
    if (e.button !== 0) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.clientX;
    scrollStartRef.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
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

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
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

  return (
    <div
      ref={scrollRef}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      tabIndex={0}
      role="region"
      aria-label="Subcategory rail"
      className="flex-1 flex gap-4 overflow-x-auto p-4 pb-2 min-h-0 scrollbar-none focus-visible:outline-none"
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
