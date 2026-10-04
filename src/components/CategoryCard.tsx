import { useMemo } from 'react';
import type { Category } from '../types';
import { useStore } from '../store';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const allSites = useStore((s) => s.sites);
  const allSubcategories = useStore((s) => s.subcategories);

  const categorySites = useMemo(
    () =>
      allSites
        .filter((s) => s.categoryId === category.id)
        .sort((a, b) => a.order - b.order),
    [allSites, category.id],
  );

  const subcategories = useMemo(
    () =>
      allSubcategories
        .filter((sub) => sub.categoryId === category.id)
        .sort((a, b) => a.order - b.order),
    [allSubcategories, category.id],
  );

  const primarySites = useMemo(
    () => categorySites.filter((s) => s.primary),
    [categorySites],
  );

  const totalSites = categorySites.length;

  return (
    <article
      data-category-id={category.id}
      className="glass flex h-[550px] flex-col overflow-hidden transition-all duration-300 hover:border-white/15"
    >
      {/* 1. Header Region: colored label + site count */}
      <header className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] select-none">
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
          {totalSites} {totalSites === 1 ? 'site' : 'sites'}
        </span>
      </header>

      {totalSites === 0 ? (
        /* Empty category state per SPEC §4 */
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-medium text-white/60">Nothing here yet</p>
          <p className="mt-1 text-xs text-white/40">Add a site to this category</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 2. Primary Row Region: reserved for horizontal primary tiles */}
          {primarySites.length > 0 && (
            <section
              aria-label={`${category.name} primary sites`}
              className="primary-row-region shrink-0 px-6 py-4 border-b border-white/[0.04]"
            >
              <div className="text-xs font-medium text-white/30 uppercase tracking-wider mb-2">
                Primary ({primarySites.length})
              </div>
              <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                {primarySites.map((site) => (
                  <a
                    key={site.id}
                    href={site.url}
                    className="glass-inner flex flex-col items-center justify-center size-20 p-2 text-center transition-transform hover:scale-105"
                  >
                    <span className="text-xs font-medium text-white/90 truncate w-full">
                      {site.name}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 3. Pinned Subcategory Strip Region */}
          <nav
            aria-label={`${category.name} subcategories`}
            className="pinned-strip-region shrink-0 flex items-center gap-2 px-6 py-3 border-b border-white/[0.04] overflow-x-auto scrollbar-none text-xs"
          >
            <span className="text-white/40 uppercase tracking-wider text-[10px] font-semibold mr-1">
              Groups:
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-white/90">
              General
            </span>
            {subcategories.map((sub) => (
              <span
                key={sub.id}
                className="rounded-full bg-white/[0.04] px-3 py-1 text-white/50"
              >
                {sub.name}
              </span>
            ))}
          </nav>

          {/* 4. Subcategory Rail Region */}
          <div className="subcategory-rail-region flex-1 min-h-0 overflow-hidden p-6">
            <p className="text-xs text-white/30 italic">Subcategory rail container</p>
          </div>
        </div>
      )}
    </article>
  );
}
