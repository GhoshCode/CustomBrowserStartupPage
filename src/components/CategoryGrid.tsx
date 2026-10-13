import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useStore } from '../store';
import { CategoryCard } from './CategoryCard';

interface CategoryGridProps {
  onOpenSettings?: () => void;
}

export function CategoryGrid({ onOpenSettings }: CategoryGridProps) {
  const categories = useStore((s) => s.categories);
  const shouldReduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  const updateScrollIndicators = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollIndicators();
    const raf = requestAnimationFrame(updateScrollIndicators);
    const timer = setTimeout(updateScrollIndicators, 150);

    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);

    // Mouse wheel horizontal translation inside this container
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [sortedCategories.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = 400; // Approximately one card width + gap
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

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

  const isContainerized = sortedCategories.length > 3;

  return (
    <main className="flex flex-1 min-h-0 w-full px-6 sm:px-10 pb-5 overflow-hidden">
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
      ) : !isContainerized ? (
        /* Independent cards when categories count <= 3 per user request */
        <div className="flex flex-1 min-h-0 w-full flex-col overflow-hidden">
          <motion.div
            ref={scrollRef}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-1 min-h-0 w-full flex-row gap-5 lg:gap-6 items-stretch justify-start overflow-x-auto overflow-y-hidden scrollbar-none"
          >
            {sortedCategories.map((category) => (
              <motion.div
                key={category.id}
                variants={cardVariants}
                className="w-[330px] sm:w-[370px] lg:w-[400px] shrink-0 h-full flex flex-col min-h-0"
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
          {/* Thin space below the cards where scrolling scrolls the cards */}
          <div
            data-testid="thin-cards-scroll-space"
            onWheel={(e) => {
              const el = scrollRef.current;
              if (el) {
                e.preventDefault();
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                el.scrollLeft += delta;
              }
            }}
            className="w-full py-1.5 px-2 flex items-center justify-center shrink-0 select-none cursor-ew-resize group"
            title="Scroll cards horizontally"
          >
            <div className="h-1 w-24 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
          </div>
        </div>
      ) : (
        /* Containerized when cards cross the limit (> 3 categories) */
        <section
          aria-label="Categories container"
          data-categories-container
          className="glass-raised relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-3xl border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-3 sm:p-4"
        >
          {/* Horizontal scroll track with ultra-thin horizontal scroll option below */}
          <motion.div
            ref={scrollRef}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            tabIndex={0}
            role="region"
            aria-label="Scrollable category cards"
            className="flex flex-1 min-h-0 flex-row gap-5 overflow-x-auto overflow-y-hidden items-stretch py-1 px-1 scroll-smooth ultra-thin-scrollbar focus-visible:outline-none"
          >
            {sortedCategories.map((category) => (
              <motion.div
                key={category.id}
                variants={cardVariants}
                className="w-[330px] sm:w-[370px] lg:w-[400px] shrink-0 h-full flex flex-col min-h-0"
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>

          {/* Thin space below the cards where scrolling scrolls the cards horizontally */}
          <div
            data-testid="thin-cards-scroll-space"
            onWheel={(e) => {
              const el = scrollRef.current;
              if (el) {
                e.preventDefault();
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                el.scrollLeft += delta;
              }
            }}
            className="w-full py-1.5 px-2 flex items-center justify-center shrink-0 select-none cursor-ew-resize group"
            title="Scroll horizontally across cards"
          >
            <div className="h-1 w-24 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
          </div>
        </section>
      )}
    </main>
  );
}
