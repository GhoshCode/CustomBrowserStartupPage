import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useStore } from '../../store';
import { searchSites, getHostname } from '../../utils';
import { destinationFor, fetchSuggestions, googleSearchUrl, looksLikeUrl } from '../../services/search';
import { Favicon } from '../Favicon';

// Always-visible search (Zone 3, §7 Q12) with a three-tier dropdown:
//   1. your sites (the library's fuzzy ranking)
//   2. Google autocomplete
//   3. the direct action — open the URL or search Google for the raw text
// ↑/↓ move, Enter picks (Ctrl/⌘+Enter → new tab), Esc closes. "/" and Ctrl+K
// focus it (wired in App).

const SITE_LIMIT = 5;
const WEB_LIMIT = 5;
const SUGGEST_DEBOUNCE_MS = 150;

type Item =
  | { kind: 'site'; key: string; siteId: string; name: string; url: string; meta: string }
  | { kind: 'web'; key: string; text: string; url: string }
  | { kind: 'go'; key: string; text: string; url: string; isUrl: boolean }
  | { kind: 'add'; key: string; text: string; url: string };

interface SearchBarProps {
  inputRef: RefObject<HTMLInputElement | null>;
  // Opens Settings → Library with the URL prefilled.
  onAddSite: (url: string) => void;
}

export const SearchBar = memo(function SearchBar({ inputRef, onAddSite }: SearchBarProps) {
  const sites = useStore((s) => s.sites);
  const categories = useStore((s) => s.categories);
  const subcategories = useStore((s) => s.subcategories);
  const recordVisit = useStore((s) => s.recordVisit);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [web, setWeb] = useState<{ q: string; items: string[] }>({ q: '', items: [] });
  const rootRef = useRef<HTMLDivElement>(null);
  const q = query.trim();

  // Tier 2, debounced; stale responses are dropped by comparing the query.
  useEffect(() => {
    if (!q || looksLikeUrl(q)) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetchSuggestions(q, WEB_LIMIT + 1, ctrl.signal)
        .then((items) => setWeb({ q, items }))
        .catch(() => setWeb({ q, items: [] }));
    }, SUGGEST_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const items = useMemo<Item[]>(() => {
    if (!q) return [];
    const siteItems: Item[] = searchSites(q, sites, categories, subcategories)
      .slice(0, SITE_LIMIT)
      .map(({ site, category }) => ({
        kind: 'site',
        key: `s-${site.id}`,
        siteId: site.id,
        name: site.name,
        url: site.url,
        meta: `${getHostname(site.url)} · ${category.name}`,
      }));
    const webItems: Item[] =
      web.q === q
        ? web.items
            .filter((t) => t.toLowerCase() !== q.toLowerCase())
            .slice(0, WEB_LIMIT)
            .map((text) => ({ kind: 'web', key: `w-${text}`, text, url: googleSearchUrl(text) }))
        : [];
    const isUrl = looksLikeUrl(q);
    const direct: Item = { kind: 'go', key: 'go', text: q, url: destinationFor(q), isUrl };
    // A URL that isn't in the library yet can be saved straight from here.
    const known = isUrl && sites.some((s) => getHostname(s.url) === getHostname(direct.url));
    const add: Item[] = isUrl && !known ? [{ kind: 'add', key: 'add', text: q, url: direct.url }] : [];
    return [...siteItems, ...webItems, direct, ...add];
  }, [q, sites, categories, subcategories, web]);

  const go = (item: Item | undefined, newTab: boolean) => {
    if (item?.kind === 'add') {
      setOpen(false);
      setQuery('');
      onAddSite(item.url);
      return;
    }
    const url = item ? item.url : destinationFor(q);
    if (!q && !item) return;
    if (item?.kind === 'site') recordVisit(item.siteId);
    setOpen(false);
    setQuery('');
    if (newTab) window.open(url, '_blank', 'noopener');
    else window.location.assign(url);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      // -1 is "the input itself"; wrapping passes through it in both directions.
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => {
        const next = i + step;
        if (next >= items.length) return -1;
        if (next < -1) return items.length - 1;
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(active >= 0 ? items[active] : undefined, e.ctrlKey || e.metaKey);
    } else if (e.key === 'Escape') {
      if (open && q) setOpen(false);
      else {
        setQuery('');
        e.currentTarget.blur();
      }
    }
  };

  const showDropdown = open && items.length > 0;
  const firstWeb = items.findIndex((i) => i.kind === 'web');
  const goIndex = items.findIndex((i) => i.kind === 'go');

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <div className="glass-raised flex h-12 items-center gap-3 rounded-2xl pr-1.5 pl-4 transition-colors focus-within:border-white/30">
        <SearchIcon className="size-5 shrink-0 text-white/45" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search your sites or the web…"
          aria-label="Search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-activedescendant={active >= 0 ? `search-opt-${active}` : undefined}
          aria-autocomplete="list"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white placeholder-white/40 outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs text-white/40 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/45 sm:inline">
            /
          </kbd>
        )}
        <button
          type="button"
          onClick={() => (q ? go(undefined, false) : inputRef.current?.focus())}
          aria-label="Search the web"
          className="accent-gradient flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold tracking-wide text-white shadow-md transition-transform hover:scale-[1.03]"
        >
          <SearchIcon className="size-4" />
          SEARCH
        </button>
      </div>

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="glass-raised absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl bg-[var(--color-base-elevated)]/95 py-1.5"
        >
          {items.map((item, i) => (
            <div key={item.key}>
              {i === 0 && item.kind === 'site' && <TierLabel>Your sites</TierLabel>}
              {i === firstWeb && <TierLabel divider={i > 0}>Suggestions</TierLabel>}
              {i === goIndex && i > 0 && <div className="mx-3 my-1 h-px bg-white/[0.07]" />}
              <button
                id={`search-opt-${i}`}
                type="button"
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onClick={(e) => go(item, e.ctrlKey || e.metaKey)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                  active === i ? 'bg-white/12 text-white' : 'text-white/80'
                }`}
              >
                {item.kind === 'site' ? (
                  <>
                    <Favicon url={item.url} name={item.name} className="size-5 shrink-0" />
                    <span className="truncate font-semibold text-white">{item.name}</span>
                    <span className="truncate font-mono text-xs text-white/40">{item.meta}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-white/35">open ↗</span>
                  </>
                ) : item.kind === 'web' ? (
                  <>
                    <SearchIcon className="size-4 shrink-0 text-white/35" />
                    <span className="truncate">{item.text}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-white/35">Google</span>
                  </>
                ) : item.kind === 'add' ? (
                  <>
                    <span className="flex size-5 shrink-0 items-center justify-center text-emerald-300">+</span>
                    <span className="truncate">
                      Add <span className="font-semibold text-white">{getHostname(item.url)}</span> to your library
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex size-5 shrink-0 items-center justify-center text-[var(--color-accent)]">
                      {item.isUrl ? '↗' : '↵'}
                    </span>
                    <span className="truncate">
                      {item.isUrl ? 'Open ' : 'Search Google for '}
                      <span className="font-semibold text-white">“{item.text}”</span>
                    </span>
                    <kbd className="ml-auto shrink-0 font-mono text-[10px] text-white/35">Enter</kbd>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function TierLabel({ children, divider = false }: { children: string; divider?: boolean }) {
  return (
    <div
      className={`px-4 pt-1.5 pb-1 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase ${
        divider ? 'mt-1 border-t border-white/[0.07] pt-2' : ''
      }`}
    >
      {children}
    </div>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}
