import { memo, useMemo, useRef } from 'react';
import { useStore } from '../../store';
import { Favicon } from '../Favicon';

export const LinksStrip = memo(function LinksStrip() {
  const quickLinks = useStore((s) => s.quickLinks);
  const allSites = useStore((s) => s.sites);
  const recordVisit = useStore((s) => s.recordVisit);
  const recentLinkCount = useStore((s) => s.settings.recentLinkCount ?? 8);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // [E]: First 4 Quick Links permanently FIXED on the left
  const fixedQuickLinks = useMemo(() => quickLinks.slice(0, 4), [quickLinks]);

  // [F]: Recent Opened Links, ordered by lastVisited descending
  const recentLinks = useMemo(() => {
    const visited = allSites
      .filter((s) => s.lastVisited != null)
      .sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0));

    // If fewer than 4 visited, backfill with primary or top sites
    if (visited.length < 4) {
      const remaining = allSites
        .filter((s) => !visited.some((v) => v.id === s.id) && s.primary)
        .slice(0, recentLinkCount - visited.length);
      return [...visited, ...remaining].slice(0, recentLinkCount);
    }

    return visited.slice(0, recentLinkCount);
  }, [allSites, recentLinkCount]);

  const handleLinkClick = (url: string, siteId?: string) => {
    if (siteId) recordVisit(siteId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-white/[0.02]">
      {/* Left: [E] [E] [E] [E] - Permanent Fixed Quick Links */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/80 mr-1 hidden sm:inline">
          PINS
        </span>
        {fixedQuickLinks.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => handleLinkClick(link.url)}
            className="flex h-8 items-center gap-2 rounded-xl bg-white/[0.04] px-3 text-xs font-semibold text-white/90 hover:bg-white/[0.1] hover:text-white transition-all border border-white/10 shadow-sm shrink-0"
          >
            <Favicon url={link.url} name={link.name} className="size-4 shrink-0" />
            <span className="truncate max-w-[120px]">{link.name}</span>
          </button>
        ))}
      </div>

      {/* Divider between fixed Quick Links and scrollable Recent Links */}
      <div className="h-5 w-px bg-white/15 mx-3 shrink-0" />

      {/* Right: [F] [F] [F] ... - Horizontally scrollable Recent Links */}
      <div className="relative flex-1 min-w-0 flex items-center">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth pr-6"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 mr-1 shrink-0">
            RECENT
          </span>
          {recentLinks.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => handleLinkClick(site.url, site.id)}
              className="flex h-8 items-center gap-2 rounded-xl bg-white/[0.04] px-3 text-xs font-semibold text-white/80 hover:bg-white/[0.1] hover:text-white transition-all border border-white/10 shadow-sm shrink-0"
            >
              <Favicon url={site.url} name={site.name} className="size-4 shrink-0" />
              <span className="truncate max-w-[120px]">{site.name}</span>
            </button>
          ))}
        </div>

        {/* Scroll arrow right */}
        {recentLinks.length > 5 && (
          <button
            type="button"
            onClick={() => scroll('right')}
            title="Scroll links right"
            className="absolute right-0 flex size-6 items-center justify-center rounded-lg bg-black/60 text-white/50 hover:bg-white/10 hover:text-white text-xs backdrop-blur-md"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
});
