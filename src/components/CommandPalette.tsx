import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { searchSites, type ScoredSite } from '../utils/fuzzySearch';
import { Favicon } from './Favicon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSite: (prefill: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onAddSite,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sites = useStore((s) => s.sites);
  const categories = useStore((s) => s.categories);
  const subcategories = useStore((s) => s.subcategories);
  const recordVisit = useStore((s) => s.recordVisit);

  const results = useMemo<ScoredSite[]>(
    () => searchSites(query, sites, categories, subcategories),
    [query, sites, categories, subcategories],
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keep selected index in bounds when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector<HTMLElement>(
      `[data-result-index="${selectedIndex}"]`,
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = (scored: ScoredSite) => {
    recordVisit(scored.site.id);
    window.location.href = scored.site.url;
    onClose();
  };

  const handleTriggerAddSite = () => {
    onClose();
    onAddSite(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
      e.preventDefault();
      return;
    }

    if (results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleTriggerAddSite();
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev + 1) % results.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const selected = results[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
      e.preventDefault();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 px-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Centered Palette Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#120b20]/90 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <svg
                className="size-5 shrink-0 text-white/40"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search sites or type URL..."
                className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
              />
              <kbd className="hidden sm:inline-block rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/40">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="max-h-80 overflow-y-auto p-2 scrollbar-none space-y-1"
            >
              {results.length > 0 ? (
                results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.site.id}
                      data-result-index={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Favicon
                          url={item.site.url}
                          name={item.site.name}
                          categoryColor={item.category.color}
                          className="size-6"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">
                            {item.site.name}
                          </p>
                          <p className="truncate text-[11px] text-white/40">
                            {item.site.url.replace(/^https?:\/\//, '')}
                          </p>
                        </div>
                      </div>

                      {/* Breadcrumbs Path: Category → Subcategory */}
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 shrink-0">
                        <span
                          className="font-medium"
                          style={{ color: item.category.color }}
                        >
                          {item.category.name}
                        </span>
                        {item.subcategory && (
                          <>
                            <span>→</span>
                            <span className="text-white/60">
                              {item.subcategory.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : query.trim() ? (
                /* Empty match fallback action */
                <button
                  type="button"
                  onClick={handleTriggerAddSite}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-3 text-left text-xs text-white/90 hover:bg-white/10 transition-colors"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                    <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  </span>
                  <span>
                    Add <strong className="text-white font-semibold">"{query.trim()}"</strong> as a new site…
                  </span>
                </button>
              ) : (
                <div className="py-6 text-center text-xs text-white/40">
                  Type to search your curated sites...
                </div>
              )}
            </div>

            {/* Footer Shortcut Hints */}
            <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-2 text-[10px] text-white/40">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
              </div>
              <span>DevDeck Fast Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
