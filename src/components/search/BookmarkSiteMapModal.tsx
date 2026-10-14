import { memo, useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store';
import { Favicon } from '../Favicon';

interface BookmarkSiteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarkSiteMapModal = memo(function BookmarkSiteMapModal({
  isOpen,
  onClose,
}: BookmarkSiteMapModalProps) {
  const categories = useStore((s) => s.categories);
  const subcategories = useStore((s) => s.subcategories);
  const sites = useStore((s) => s.sites);
  const recordVisit = useStore((s) => s.recordVisit);

  const [filter, setFilter] = useState('');

  const filteredCategories = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return categories;

    // Filter categories that have matching name or matching sites
    return categories.filter((cat) => {
      if (cat.name.toLowerCase().includes(q)) return true;
      const catSites = sites.filter((s) => s.categoryId === cat.id);
      return catSites.some(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q),
      );
    });
  }, [categories, sites, filter]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bookmark Site Map"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/70 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-raised flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-[#0c0717]/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 text-lg border border-cyan-500/30">
              🗺️
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-white tracking-tight">
                Bookmark Site Map & Hierarchy
              </h2>
              <p className="text-xs text-white/50">
                Visual tree map of all categories, groups, and bookmarks
              </p>
            </div>
          </div>

          {/* Search Filter input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter site map..."
              className="w-48 sm:w-64 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content: Visual tree grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => {
              const catSubs = subcategories
                .filter((sc) => sc.categoryId === cat.id)
                .sort((a, b) => a.order - b.order);
              const catGeneralSites = sites
                .filter((s) => s.categoryId === cat.id && s.subcategoryId === null)
                .sort((a, b) => a.order - b.order);

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 backdrop-blur-md"
                >
                  {/* Category Title Pill */}
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="font-display text-sm font-bold text-white tracking-wide truncate">
                      {cat.name}
                    </h3>
                  </div>

                  {/* General Sites */}
                  {catGeneralSites.length > 0 && (
                    <div className="flex flex-col gap-1 pl-2 border-l border-white/10">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                        General
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {catGeneralSites.map((site) => (
                          <a
                            key={site.id}
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordVisit(site.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/15 hover:text-white transition-colors border border-white/5"
                          >
                            <Favicon url={site.url} name={site.name} className="size-3.5" />
                            <span className="truncate max-w-[120px]">{site.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subcategories */}
                  {catSubs.map((sub) => {
                    const subSites = sites
                      .filter((s) => s.subcategoryId === sub.id)
                      .sort((a, b) => a.order - b.order);

                    return (
                      <div key={sub.id} className="flex flex-col gap-1 pl-2 border-l border-white/10">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                          {sub.name}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {subSites.map((site) => (
                            <a
                              key={site.id}
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => recordVisit(site.id)}
                              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/15 hover:text-white transition-colors border border-white/5"
                            >
                              <Favicon url={site.url} name={site.name} className="size-3.5" />
                              <span className="truncate max-w-[120px]">{site.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
