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
  const [isListening, setIsListening] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Instant local suggestions on every keystroke + fast background Google queries
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setGoogleSuggestions([]);
      return;
    }

    // Instant initial developer keyword predictions
    const devKeywords = [
      'docs',
      'github',
      'npm',
      'api reference',
      'tutorial',
      'cheat sheet',
      'stackoverflow',
      'examples',
    ];
    const initialPredictions = devKeywords
      .map((k) => `${q} ${k}`)
      .slice(0, 4);

    setGoogleSuggestions([q, ...initialPredictions]);

    // Fast Google autocomplete fetch without slow proxy
    const controller = new AbortController();
    const fetchTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[1]) && data[1].length > 0) {
            setGoogleSuggestions(data[1].slice(0, 5));
          }
        }
      } catch {
        // Fallback already populated with instant predictions
      }
    }, 50);

    return () => {
      clearTimeout(fetchTimer);
      controller.abort();
    };
  }, [query]);

  // Matching catalog sites (instant, zero delay)
  const matchedSites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allSites
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          (s.subcategoryId && s.subcategoryId.toLowerCase().includes(q)),
      )
      .slice(0, 4);
  }, [allSites, query]);

  const totalSuggestions = matchedSites.length + googleSuggestions.length;

  const executeSearch = (searchText: string) => {
    const target = searchText.trim();
    if (!target) {
      onOpenPalette?.();
      return;
    }

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

  const openGemini = () => {
    const target = query.trim();
    const url = target
      ? `https://gemini.google.com/app?q=${encodeURIComponent(target)}`
      : 'https://gemini.google.com/app';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openChatGPT = () => {
    const target = query.trim();
    const url = target
      ? `https://chatgpt.com/?q=${encodeURIComponent(target)}`
      : 'https://chatgpt.com';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          setShowSuggestions(true);
          inputRef.current?.focus();
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
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
      <div className="w-full px-6 py-1 shrink-0">
        <div className="flex items-center justify-center gap-3 max-w-5xl mx-auto">
          {/* Main Search Bar [G] - Elevated height & padding */}
          <div ref={containerRef} className="relative flex-1">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.05] px-5 focus-within:border-cyan-400/60 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_24px_rgba(34,211,238,0.25)] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all">
              {/* Magnifying glass */}
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

              {/* Text Input - Guaranteed White Text Color */}
              <input
                ref={inputRef}
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
                style={{ color: '#ffffff' }}
                className="w-full min-w-0 bg-transparent text-base !text-white placeholder-white/40 caret-cyan-400 focus:outline-none font-medium selection:bg-purple-500/40"
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="size-6 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 text-xs transition-colors shrink-0"
                  title="Clear text"
                >
                  ✕
                </button>
              )}

              {/* Voice Input Icon Toggle */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? 'Listening... click to stop' : 'Voice search (Click to speak)'}
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                    : 'text-white/45 hover:bg-white/10 hover:text-white'
                }`}
              >
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Gemini AI toggle icon */}
              <button
                type="button"
                onClick={openGemini}
                title="Search with Google Gemini"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white/50 hover:bg-gradient-to-r hover:from-blue-500/30 hover:to-indigo-500/30 hover:text-cyan-300 transition-all border border-transparent hover:border-blue-400/30"
              >
                <span className="text-base select-none" role="img" aria-label="Gemini">
                  ✨
                </span>
              </button>

              {/* ChatGPT AI toggle icon */}
              <button
                type="button"
                onClick={openChatGPT}
                title="Search with ChatGPT"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white/50 hover:bg-gradient-to-r hover:from-emerald-500/30 hover:to-teal-500/30 hover:text-emerald-300 transition-all border border-transparent hover:border-emerald-400/30"
              >
                <span className="text-base select-none" role="img" aria-label="ChatGPT">
                  🤖
                </span>
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && query.trim() && (
              <div className="glass-raised absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-white/20 bg-[#0d0718]/98 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl py-2">
                {/* Matching Sites in Deck */}
                {matchedSites.length > 0 && (
                  <div className="px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 px-2.5">
                      Your Bookmarks
                    </span>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {matchedSites.map((site, i) => (
                        <div
                          key={site.id}
                          onClick={() => handleSelectSite(site)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                            selectedIdx === i ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Favicon url={site.url} name={site.name} className="size-4" />
                            <span className="font-semibold text-white truncate">{site.name}</span>
                          </div>
                          <span className="text-[10px] text-white/40 truncate max-w-[160px] ml-2 font-mono">
                            {site.url.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instant Suggestions */}
                {googleSuggestions.length > 0 && (
                  <div className="px-2 py-1 border-t border-white/[0.08] mt-1">
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
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              selectedIdx === globalIdx ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10'
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

          {/* Outside of Search Bar: Merged Search & Command Palette Button */}
          <button
            type="button"
            onClick={() => executeSearch(query)}
            title="Search or trigger Command Palette (Ctrl+K or Enter)"
            className="flex h-14 shrink-0 items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.06] px-4 text-xs font-semibold text-white shadow-lg backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-white/[0.12] hover:border-cyan-400/50"
          >
            <span>Search</span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
              ⌘K
            </kbd>
          </button>

          {/* Outside of Search Bar: Lengthier Bookmark Site Map Button */}
          <button
            type="button"
            onClick={() => setIsSiteMapOpen(true)}
            title="Browse all categorized bookmarks in hierarchical site map (G₁)"
            aria-label="Bookmark Site Map"
            className="flex h-14 shrink-0 items-center gap-2.5 rounded-2xl border border-white/20 bg-white/[0.06] px-4 text-xs font-semibold text-white/90 shadow-lg backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-white/[0.12] hover:text-white hover:border-cyan-400/50"
          >
            <span className="text-lg">🗺️</span>
            <span>Site Map</span>
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
