import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useStore } from '../store';
import { CategoryCard } from './CategoryCard';

interface CategoryGridProps {
  onOpenSettings?: () => void;
}

export function CategoryGrid({ onOpenSettings }: CategoryGridProps) {
  const categories = useStore((s) => s.categories);
  const shouldReduceMotion = useReducedMotion();

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 26 },
    },
  };

  return (
    <main className="flex-1 px-8 sm:px-12 pb-16">
      {sortedCategories.length === 0 ? (
        <div className="glass flex h-72 flex-col items-center justify-center text-center p-8 rounded-3xl border-white/10">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/40">
            <svg className="size-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </div>
          <p className="font-display text-lg font-semibold text-white">Welcome to DevDeck</p>
          <p className="mt-1 text-sm text-white/50 max-w-sm">
            Get started by adding your first category and favorite developer sites.
          </p>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-4 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:opacity-95 transition-opacity"
            >
              Configure Library in Settings
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 min-[1100px]:grid-cols-2 min-[1600px]:grid-cols-3 gap-6 lg:gap-8"
        >
          {sortedCategories.map((category) => (
            <motion.div key={category.id} variants={cardVariants} className="h-full">
              <CategoryCard category={category} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}
