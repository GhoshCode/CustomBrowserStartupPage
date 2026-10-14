import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useStore } from '../../store';
import { Favicon } from '../Favicon';
import { BookmarkSiteMapModal } from './BookmarkSiteMapModal';
import type { Site } from '../../types';

interface SearchBarProps {
  onOpenPalette?: () => void;
}

export const SearchBar = memo(function SearchBar({ onOpenPalette }: SearchBarProps) {
  const allSites = useStore((s) => s.sites);
  const recordVisit = useStore((s) => s.recordVisit);
  const searchEngine = useStore((s) => s.settings.searchEngine ?? 'google');

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
  const [isSiteMapOpen, setIsSiteMapOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live autocomplete suggestions
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setGoogleSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      // Fetch suggestions or fallback to predictive terms
      fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${q}`)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && Array.isArray(data[1])) {
            setGoogleSuggestions(data[1].slice(0, 5));
          }
        })
        .catch(() => {
          // Fallback predictive search terms
          setGoogleSuggestions([
            q,
            `${q} docs`,
            `${q} github`,
            `${q} tutorial`,
            `${q} npm`,
          ]);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Matching catalog sites
  const matchedSites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allSites
      .filter((s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
      .slice(0, 4);
  }, [allSites, query]);

  const totalSuggestions = matchedSites.length + googleSuggestions.length;

  const executeSearch = (searchText: string) => {
    const target = searchText.trim();
    if (!target) return;

    if (/^(https?:\/\/)/i.test(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
    } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(target) && !target.includes(' ')) {
      window.open(`https://${target}`, '_blank', 'noopener,noreferrer');
    } else {
      let searchBase = 'https://www.google.com/search?q=';
      if (searchEngine === 'duckduckgo') searchBase = 'https://duckduckgo.com/?q=';
      else if (searchEngine === 'github') searchBase = 'https://github.com/search?q=';
      else if (searchEngine === 'perplexity') searchBase = 'https://www.perplexity.ai/search?q=';
      window.open(`${searchBase}${encodeURIComponent(target)}`, '_blank', 'noopener,noreferrer');
    }

    setQuery('');
    setShowSuggestions(false);
  };

  const handleSelectSite = (site: Site) => {
    recordVisit(site.id);
    window.open(site.url, '_blank', 'noopener,noreferrer');
    setQuery('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalSuggestions > 0) {
        setSelectedIdx((prev) => (prev + 1) % totalSuggestions);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalSuggestions > 0) {
        setSelectedIdx((prev) => (prev <= 0 ? totalSuggestions - 1 : prev - 1));
      }
      return;
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && selectedIdx < matchedSites.length) {
        handleSelectSite(matchedSites[selectedIdx]);
      } else if (selectedIdx >= matchedSites.length) {
        const gIdx = selectedIdx - matchedSites.length;
        executeSearch(googleSuggestions[gIdx]);
      } else {
        executeSearch(query);
      }
    }
  };

  return (
    <>
      <div className="w-full px-6 py-2 shrink-0">
        <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
          {/* Main Search Bar [G] */}
          <div ref={containerRef} className="relative flex-1">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 h-12 focus-within:border-white/30 focus-within:bg-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all">
              {/* Magnifying glass */}
              <svg
                className="size-4.5 text-white/40 shrink-0 select-none"
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
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  setSelectedIdx(-1);
                }}
                onFocus={() => {
                  if (query.trim()) setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search web or deck (type anything for suggestions)..."
                aria-label="Search"
                className="w-full min-w-0 bg-transparent text-sm sm:text-base text-white placeholder-white/40 focus:outline-none font-medium"
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setShowSuggestions(false);
                  }}
                  className="size-5 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 text-xs transition-colors shrink-0"
                >
                  ✕
                </button>
              )}

              {/* Search button inside the search bar */}
              <button
                type="button"
                onClick={() => executeSearch(query)}
                title="Search (Enter)"
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 hover:bg-white/20 hover:text-white transition-all shrink-0 border border-white/10 shadow-sm"
              >
                <span>Search</span>
                <span className="hidden sm:inline text-[10px] text-white/40">↵</span>
              </button>

              {/* Command Palette trigger */}
              {onOpenPalette && (
                <button
                  type="button"
                  onClick={onOpenPalette}
                  title="Open Command Palette (Ctrl+K or /)"
                  aria-label="Command Palette"
                  className="hidden sm:flex items-center rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50 hover:bg-white/15 hover:text-white transition-all shrink-0 border border-white/5"
                >
                  <kbd className="font-mono text-[10px]">⌘K</kbd>
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && query.trim() && (
              <div className="glass-raised absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-white/15 bg-[#0d0718]/95 shadow-2xl backdrop-blur-2xl py-2">
                {/* Matching Sites in Deck */}
                {matchedSites.length > 0 && (
                  <div className="px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2.5">
                      Your Bookmarks
                    </span>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {matchedSites.map((site, i) => (
                        <div
                          key={site.id}
                          onClick={() => handleSelectSite(site)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-colors ${
                            selectedIdx === i ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Favicon url={site.url} name={site.name} className="size-4" />
                            <span className="font-semibold text-white truncate">{site.name}</span>
                          </div>
                          <span className="text-[10px] text-white/40 truncate max-w-[140px] ml-2">
                            {site.url.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Autocomplete Suggestions */}
                {googleSuggestions.length > 0 && (
                  <div className="px-2 py-1 border-t border-white/[0.06] mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2.5">
                      Search Suggestions
                    </span>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {googleSuggestions.map((sug, i) => {
                        const globalIdx = matchedSites.length + i;
                        return (
                          <div
                            key={sug}
                            onClick={() => executeSearch(sug)}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-colors ${
                              selectedIdx === globalIdx ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10'
                            }`}
                          >
                            <svg className="size-3.5 text-white/40 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="truncate">{sug}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outside of Search Bar: [G₁] Bookmark Site Map Icon Button */}
          <button
            type="button"
            onClick={() => setIsSiteMapOpen(true)}
            title="Bookmark Site Map & Hierarchy (G₁)"
            aria-label="Bookmark Site Map"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-white/70 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/[0.1] hover:text-white hover:border-cyan-400/40"
          >
            <span className="text-xl">🗺️</span>
          </button>
        </div>
      </div>

      {/* Bookmark Site Map Modal */}
      <BookmarkSiteMapModal
        isOpen={isSiteMapOpen}
        onClose={() => setIsSiteMapOpen(false)}
      />
    </>
  );
});
