import { useMemo } from 'react';
import { useStore } from '../store';
import { CategoryCard } from './CategoryCard';

export function CategoryGrid() {
  const categories = useStore((s) => s.categories);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  return (
    <main className="flex-1 px-8 sm:px-12 pb-16">
      {sortedCategories.length === 0 ? (
        <div className="glass flex h-64 flex-col items-center justify-center text-center p-8">
          <p className="font-display text-lg text-white/70">Nothing here yet</p>
          <p className="mt-1 text-sm text-white/40">
            Open Settings to add categories and sites to your DevDeck.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 min-[1600px]:grid-cols-3 gap-6 lg:gap-8">
          {sortedCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </main>
  );
}
