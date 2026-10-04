import type { Category } from '../types';
import { useStore } from '../store';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const sites = useStore((s) => s.sites);
  const siteCount = sites.filter((site) => site.categoryId === category.id).length;

  return (
    <article
      data-category-id={category.id}
      className="glass flex h-[550px] flex-col overflow-hidden transition-all duration-300 hover:border-white/15"
    >
      {/* Category Card Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2 rounded-full"
            style={{
              backgroundColor: category.color,
              boxShadow: `0 0 10px ${category.color}80`,
            }}
          />
          <h2
            className="font-display text-xs font-bold tracking-[0.2em] uppercase"
            style={{ color: category.color }}
          >
            {category.name}
          </h2>
        </div>
        <span className="text-xs font-medium text-white/40 tabular-nums">
          {siteCount} {siteCount === 1 ? 'site' : 'sites'}
        </span>
      </div>

      {/* Frame body container (ready for PrimaryRow, PinnedStrip, SubcategoryRail) */}
      <div className="flex flex-1 flex-col overflow-hidden p-6 text-white/50 text-sm">
        {/* Placeholder/empty state if no sites */}
        {siteCount === 0 && (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-white/40 text-xs">Nothing here yet — add a site</p>
          </div>
        )}
      </div>
    </article>
  );
}
