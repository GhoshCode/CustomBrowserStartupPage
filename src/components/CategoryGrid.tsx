import { useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useStore } from '../store';
import { CategoryCard } from './CategoryCard';
import { LinksStrip } from './links/LinksStrip';

interface CategoryGridProps {
  onOpenSettings?: () => void;
}

export function CategoryGrid({ onOpenSettings }: CategoryGridProps) {
  const categories = useStore((s) => s.categories);
  const shouldReduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Guarantee pinned card is placed at index 0
  const sortedCategories = useMemo(() => {
    const list = [...categories];
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.order - b.order;
    });
  }, [categories]);

  const handleBottomCardsWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += delta * 1.5;
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Mouse wheel horizontal translation inside this container
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      // If cursor is inside any category card, let the card handle its internal scrolling
      if (target.closest('[data-category-id]')) {
        return;
      }
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [sortedCategories.length]);

  // Pointer drag-to-scroll on main container
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking inside links, buttons, inputs, or site rows
    if (target.closest('a, button, input, [data-site-id]')) return;
    if (e.button !== 0) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.clientX;
    scrollStartRef.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handleContainerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (!isDraggingRef.current && Math.abs(dx) > 6) {
      isDraggingRef.current = true;
      try {
        scrollRef.current?.setPointerCapture(e.pointerId);
      } catch {}
    }
    if (isDraggingRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollStartRef.current - dx;
    }
  };

  const handleContainerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      try {
        scrollRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
    }
    isPointerDownRef.current = false;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // Guarantee cards start from the first card on mount and on pinned category change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [sortedCategories[0]?.id]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
      },
    },
  };

  const cardVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
    },
  };

  return (
    <main className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden h-full">
      {sortedCategories.length === 0 ? (
        <div className="glass flex flex-1 items-center justify-center text-center p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center max-w-sm">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/40">
              <svg className="size-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </div>
            <p className="font-display text-lg font-semibold text-white">Welcome to DevDeck</p>
            <p className="mt-1 text-sm text-white/50">
              Get started by adding your first category and favorite developer sites.
            </p>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="mt-4 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:opacity-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Configure Library in Settings
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Unified Center Cockpit Container with LinksStrip on Top */
        <section
          aria-label="Categories container"
          data-categories-container
          className="glass-raised relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-3xl border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          {/* Header Strip: [E] 4 Fixed Quick Links | [F] Horizontally Scrollable Recent Links */}
          <LinksStrip />

          {/* Horizontal scroll track with category card columns */}
          <div className="flex flex-1 min-h-0 flex-col p-4 sm:p-5 overflow-hidden relative">
            <motion.div
              ref={scrollRef}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              onPointerDown={handleContainerPointerDown}
              onPointerMove={handleContainerPointerMove}
              onPointerUp={handleContainerPointerUp}
              onPointerCancel={handleContainerPointerUp}
              tabIndex={0}
              role="region"
              aria-label="Scrollable category cards"
              className="flex flex-1 min-h-0 flex-row gap-5 overflow-x-auto overflow-y-hidden items-stretch py-1 px-0 scroll-pl-0 scroll-smooth snap-x snap-mandatory scrollbar-none no-scrollbar focus-visible:outline-none select-none cursor-grab active:cursor-grabbing"
            >
              {sortedCategories.map((category) => (
                <motion.div
                  key={category.id}
                  variants={cardVariants}
                  className="w-[330px] sm:w-[370px] lg:w-[400px] shrink-0 h-full flex flex-col min-h-0 snap-start"
                >
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </motion.div>

            {/* Interactive scroll track below cards — guaranteed horizontal card scroll on wheel */}
            <div
              data-testid="thin-cards-scroll-space"
              onWheel={handleBottomCardsWheel}
              className="w-full h-3.5 shrink-0 flex items-center justify-center select-none cursor-ew-resize mt-1 group"
              title="Scroll cards horizontally (Wheel / Drag)"
            >
              <div className="h-1 w-28 rounded-full bg-white/10 group-hover:bg-cyan-400/50 transition-colors" />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
