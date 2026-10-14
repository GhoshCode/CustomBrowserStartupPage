import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useStore } from '../store';
import { Favicon } from './Favicon';
import type { Site } from '../types';

interface QuickLinksProps {
  onOpenPalette?: () => void;
}

export const QuickLinks = memo(function QuickLinks({ onOpenPalette }: QuickLinksProps) {
  const quickLinks = useStore((s) => s.quickLinks);
  const allSites = useStore((s) => s.sites);
  const recordVisit = useStore((s) => s.recordVisit);

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  // Matching catalog sites (up to 4)
  const matchedSites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allSites
      .filter((s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
      .slice(0, 4);
  }, [allSites, query]);

  // Google / web search query suggestions
  const webSuggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return [
      q,
      `${q} documentation`,
      `${q} github`,
      `${q} tutorial`,
    ];
  }, [query]);

  const totalSuggestionsCount = matchedSites.length + webSuggestions.length;

  const handleSearchQuery = (text: string) => {
    const q = text.trim();
    if (!q) return;
    if (/^(https?:\/\/|localhost)/i.test(q)) {
      window.open(q, '_blank');
    } else if (/\.[a-z]{2,}(\/|$)/i.test(q) && !q.includes(' ')) {
      window.open(`https://${q}`, '_blank');
    } else {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
    }
    setQuery('');
    setShowSuggestions(false);
  };

  const handleSelectSite = (site: Site) => {
    recordVisit(site.id);
    window.open(site.url, '_blank');
    setQuery('');
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalSuggestionsCount > 0) {
        setSelectedSuggestionIndex((prev) => (prev + 1) % totalSuggestionsCount);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalSuggestionsCount > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev <= 0 ? totalSuggestionsCount - 1 : prev - 1,
        );
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < matchedSites.length) {
        handleSelectSite(matchedSites[selectedSuggestionIndex]);
      } else if (selectedSuggestionIndex >= matchedSites.length) {
        const webIdx = selectedSuggestionIndex - matchedSites.length;
        handleSearchQuery(webSuggestions[webIdx]);
      } else {
        handleSearchQuery(query);
      }
    }
  };

  return (
    <div className="w-full shrink-0">
      {/* Single outer thin-border container with raised glassmorphism & shadow */}
      <div
        ref={containerRef}
        className="glass-raised flex flex-wrap items-center justify-between gap-4 px-4 py-2 rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-xl"
      >
        {/* Quick Links on the left */}
        <div className="flex flex-wrap items-center gap-4">
          {quickLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              className="glass-inner flex items-center gap-2.5 px-3.5 py-2 text-sm sm:text-base font-semibold transition-all hover:scale-105 hover:bg-[var(--color-glass-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <Favicon url={link.url} name={link.name} className="size-5 sm:size-5.5" />
              <span className="text-white/95 drop-shadow-sm font-semibold tracking-tight">{link.name}</span>
            </a>
          ))}
        </div>

        {/* Search Bar + Search Button inside, with Suggestions dropdown (expanded width & height) */}
        <div className="relative flex-1 min-w-[320px] sm:min-w-[560px] max-w-4xl lg:max-w-5xl">
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 sm:py-3 h-13 sm:h-14 focus-within:border-white/30 focus-within:bg-white/10 shadow-inner transition-all">
            <svg
              className="size-5 text-white/50 shrink-0 select-none"
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
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => {
                if (query.trim()) setShowSuggestions(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search sites or web..."
              aria-label="Direct search bar"
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/45 focus:outline-none tracking-normal font-medium"
            />

            {/* Clear query button if typed */}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setShowSuggestions(false);
                }}
                className="size-6 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 text-xs transition-colors shrink-0"
                aria-label="Clear query"
              >
                ✕
              </button>
            )}

            {/* Search button for existing sites placed inside the search bar */}
            {onOpenPalette && (
              <button
                type="button"
                onClick={onOpenPalette}
                title="Search existing sites (Ctrl+K or /)"
                aria-label="Open command palette"
                className="group flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm text-white/90 hover:bg-white/20 hover:text-white transition-all shrink-0 border border-white/15 font-semibold shadow-sm"
              >
                <svg
                  className="size-4 text-white/70 group-hover:text-white transition-colors shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline font-semibold">Search</span>
                <kbd className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-mono text-white/80">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          {/* Floating Google-style Suggestions Dropdown */}
          {showSuggestions && query.trim() && (
            <div
              ref={suggestionsRef}
              className="glass-raised absolute left-0 right-0 top-full mt-2.5 z-50 overflow-hidden rounded-2xl border border-white/15 bg-[#0e0819]/95 shadow-2xl backdrop-blur-2xl py-2"
            >
              {/* Matching Bookmarked Sites */}
              {matchedSites.length > 0 && (
                <div className="px-2.5 py-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 px-2.5">
                    Your Sites
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {matchedSites.map((site, idx) => (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => handleSelectSite(site)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm sm:text-base transition-colors ${
                          selectedSuggestionIndex === idx
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-white/85 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Favicon url={site.url} name={site.name} className="size-5 shrink-0" />
                          <span className="font-semibold text-white truncate">{site.name}</span>
                          <span className="text-xs sm:text-sm text-white/45 truncate font-mono">
                            {site.url.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-white/40 shrink-0">Open ↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Web Search Suggestions */}
              <div className="px-2.5 py-1 border-t border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50 px-2.5">
                  Web Suggestions
                </span>
                <div className="mt-1 space-y-0.5">
                  {webSuggestions.map((sug, idx) => {
                    const totalIndex = matchedSites.length + idx;
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSearchQuery(sug)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm sm:text-base transition-colors ${
                          selectedSuggestionIndex === totalIndex
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-white/85 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <svg
                          className="size-4.5 text-white/40 shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate">{sug}</span>
                        <span className="ml-auto text-xs text-white/40 font-mono">Google</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
});
