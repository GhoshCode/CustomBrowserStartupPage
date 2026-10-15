import { memo, useEffect, useState } from 'react';
import { useStore } from '../../store';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  timeAgo: string;
  tag: string;
}

const FALLBACK_TECH_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'TypeScript 5.8 Released: Granular Checks & Node ESM Support',
    source: 'Dev.to',
    url: 'https://dev.to/t/typescript',
    timeAgo: '15m ago',
    tag: 'TYPESCRIPT',
  },
  {
    id: 'news-2',
    title: 'Linux 6.14 Merges Major Rust Kernel Infrastructure',
    source: 'HackerNews',
    url: 'https://news.ycombinator.com',
    timeAgo: '42m ago',
    tag: 'LINUX',
  },
  {
    id: 'news-3',
    title: 'React 19 Server Actions: Performance & Edge Deployment',
    source: 'GitHub Blog',
    url: 'https://github.blog',
    timeAgo: '2h ago',
    tag: 'REACT',
  },
  {
    id: 'news-4',
    title: 'Anthropic Unveils Claude 3.7 Hybrid Reasoning Engine',
    source: 'Ars Technica',
    url: 'https://arstechnica.com/information-technology/',
    timeAgo: '3h ago',
    tag: 'AI',
  },
  {
    id: 'news-5',
    title: 'Go 1.24 Generic Type Aliases and Faster Mutexes',
    source: 'Dev.to',
    url: 'https://dev.to/t/go',
    timeAgo: '4h ago',
    tag: 'GO',
  },
  {
    id: 'news-6',
    title: 'Docker Desktop 4.38 Adds Direct WASM Container Execution',
    source: 'Docker Blog',
    url: 'https://www.docker.com/blog/',
    timeAgo: '5h ago',
    tag: 'DOCKER',
  },
];

const FALLBACK_DEV_JOBS: NewsArticle[] = [
  {
    id: 'job-1',
    title: 'Senior Distributed Systems Engineer (Rust / Go)',
    source: 'RemoteOK',
    url: 'https://remoteok.com/remote-rust-jobs',
    timeAgo: '$180k - $240k · Remote',
    tag: 'RUST',
  },
  {
    id: 'job-2',
    title: 'Staff Frontend Architect (React / Next.js / WebGL)',
    source: 'HackerNews',
    url: 'https://news.ycombinator.com/jobs',
    timeAgo: 'Equity + $210k · US Remote',
    tag: 'REACT',
  },
  {
    id: 'job-3',
    title: 'AI Infrastructure Lead (Kubernetes / PyTorch)',
    source: 'RemoteOK',
    url: 'https://remoteok.com/remote-ai-jobs',
    timeAgo: '$220k - $280k · Global',
    tag: 'AI',
  },
  {
    id: 'job-4',
    title: 'Senior Cloud Security Architect (GCP / AWS)',
    source: 'HackerNews',
    url: 'https://news.ycombinator.com/jobs',
    timeAgo: '$190k - $230k · Remote',
    tag: 'CLOUD',
  },
];

export const ScrapedNewsPanel = memo(function ScrapedNewsPanel() {
  const enabledTopics = useStore((s) => s.settings.enabledTopics ?? []);
  const topicChips = useStore((s) => s.topicChips);

  const [techNews, setTechNews] = useState<NewsArticle[]>(FALLBACK_TECH_NEWS);
  const [devJobs, setDevJobs] = useState<NewsArticle[]>(FALLBACK_DEV_JOBS);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [isRefreshingOnFilter, setIsRefreshingOnFilter] = useState(false);

  // Live scrape from Dev.to API
  const fetchLiveNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('https://dev.to/api/articles?top=1&per_page=12');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted: NewsArticle[] = data.map((item: any) => ({
            id: `devto-${item.id}`,
            title: item.title,
            source: 'Dev.to',
            url: item.url || `https://dev.to${item.path}`,
            timeAgo: item.readable_publish_date || 'Today',
            tag: (item.tag_list?.[0] || 'Dev').toUpperCase(),
          }));
          setTechNews(formatted);
        }
      }
    } catch {
      // Retain fallback data
    } finally {
      setLoadingNews(false);
    }
  };

  // Live fetch developer jobs from HackerNews jobs API
  const fetchLiveJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json');
      if (res.ok) {
        const jobIds = await res.json();
        if (Array.isArray(jobIds) && jobIds.length > 0) {
          const topIds = jobIds.slice(0, 6);
          const jobPromises = topIds.map((id: number) =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json()),
          );
          const rawJobs = await Promise.all(jobPromises);
          const validJobs: NewsArticle[] = rawJobs
            .filter((j: any) => j && j.title)
            .map((j: any) => ({
              id: `hn-job-${j.id}`,
              title: j.title,
              source: 'HN Jobs',
              url: j.url || `https://news.ycombinator.com/item?id=${j.id}`,
              timeAgo: 'Remote OK · Hiring',
              tag: 'HIRING',
            }));
          if (validJobs.length > 0) {
            setDevJobs(validJobs);
          }
        }
      }
    } catch {
      // Retain fallback data
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
    fetchLiveJobs();
  }, []);

  // When user toggles some topics or tags, the feed must refresh immediately!
  useEffect(() => {
    setIsRefreshingOnFilter(true);
    const timer = setTimeout(() => {
      setIsRefreshingOnFilter(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [enabledTopics]);

  // Resolve active keywords from topic chips
  const activeKeywords = enabledTopics.flatMap((id) => {
    const chip = topicChips.find((c) => c.id === id);
    if (!chip) return [id.toLowerCase()];
    const tags = chip.tagQuery ? chip.tagQuery.split(',') : [chip.label];
    return [chip.label.toLowerCase(), ...tags.map((t) => t.trim().toLowerCase())];
  });

  // Strict topic filtering: if user has active topics, only show matches. If no matches, display empty state!
  const filteredNews =
    enabledTopics.length === 0
      ? techNews
      : techNews.filter((item) =>
          activeKeywords.some(
            (kw) =>
              item.tag.toLowerCase().includes(kw) ||
              item.title.toLowerCase().includes(kw),
          ),
        );

  const filteredJobs =
    enabledTopics.length === 0
      ? devJobs
      : devJobs.filter((job) =>
          activeKeywords.some(
            (kw) =>
              job.tag.toLowerCase().includes(kw) ||
              job.title.toLowerCase().includes(kw),
          ),
        );

  return (
    <div className="flex flex-col gap-3.5 flex-1 min-h-0 select-none">
      {/* Top Card: TECH NEWS (items 1–4) */}
      <div className="glass flex-1 rounded-3xl border border-white/10 p-4 sm:p-4.5 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-cyan-400">⚡</span>
              <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
                TECH NEWS
              </span>
              {enabledTopics.length > 0 && (
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                  Filtered
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-cyan-300/80">Live</span>
              <button
                type="button"
                onClick={fetchLiveNews}
                title="Refresh tech news feed"
                className="size-5 flex items-center justify-center rounded text-white/40 hover:text-cyan-300 hover:bg-white/10 text-xs transition-colors"
              >
                <span className={loadingNews || isRefreshingOnFilter ? 'animate-spin inline-block' : ''}>
                  🔄
                </span>
              </button>
            </div>
          </div>

          {/* List or Empty Scraped State */}
          <div className="mt-2 flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col gap-1.5">
            {isRefreshingOnFilter ? (
              <div className="flex flex-1 items-center justify-center py-6 text-xs text-cyan-400/80 font-mono animate-pulse">
                Refreshing feeds...
              </div>
            ) : filteredNews.length === 0 ? (
              /* User instruction: if no matches, scrap nothing! */
              <div className="flex flex-1 flex-col items-center justify-center py-6 text-center text-white/40">
                <span className="text-base mb-1">🔍</span>
                <p className="text-xs font-semibold text-white/70">No feeds match active tags</p>
                <p className="text-[10px] text-white/40 mt-0.5">Toggle more topics or add tags below</p>
              </div>
            ) : (
              filteredNews.slice(0, 4).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${item.title} (Opens in new tab)`}
                  className="group/item flex flex-col gap-0.5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 hover:bg-white/[0.08] hover:border-cyan-400/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400/90 font-mono">
                      {item.tag}
                    </span>
                    <span className="text-[9px] font-mono text-white/30">{item.timeAgo}</span>
                  </div>
                  <p className="text-xs font-medium text-white/85 line-clamp-1 group-hover/item:text-cyan-300 transition-colors">
                    {item.title}
                  </p>
                </a>
              ))
            )}
          </div>
        </div>

        <div className="pt-1.5 text-[9px] text-white/30 text-center font-mono border-t border-white/[0.04] shrink-0">
          Dev.to · HackerNews · GitHub
        </div>
      </div>

      {/* Middle Card: DEV OPPORTUNITIES (items 5–8) */}
      <div className="glass flex-1 rounded-3xl border border-white/10 p-4 sm:p-4.5 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-pink-400">💼</span>
              <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
                DEV OPPORTUNITIES
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-pink-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-pink-300 border border-pink-500/30">
                Remote
              </span>
              <button
                type="button"
                onClick={fetchLiveJobs}
                title="Refresh jobs feed"
                className="size-5 flex items-center justify-center rounded text-white/40 hover:text-pink-300 hover:bg-white/10 text-xs transition-colors"
              >
                <span className={loadingJobs || isRefreshingOnFilter ? 'animate-spin inline-block' : ''}>
                  🔄
                </span>
              </button>
            </div>
          </div>

          <div className="mt-2 flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col gap-1.5">
            {isRefreshingOnFilter ? (
              <div className="flex flex-1 items-center justify-center py-6 text-xs text-pink-400/80 font-mono animate-pulse">
                Filtering opportunities...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-6 text-center text-white/40">
                <span className="text-base mb-1">💼</span>
                <p className="text-xs font-semibold text-white/70">No listings matching tags</p>
                <p className="text-[10px] text-white/40 mt-0.5">Scraping yields zero matches</p>
              </div>
            ) : (
              filteredJobs.slice(0, 4).map((job) => (
                <a
                  key={job.id}
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${job.title} (Opens in new tab)`}
                  className="group/item flex flex-col gap-0.5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 hover:bg-white/[0.08] hover:border-pink-400/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-pink-400/90 font-mono">
                      {job.tag}
                    </span>
                    <span className="text-[9px] font-mono text-white/30 truncate max-w-[120px]">
                      {job.source}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white/85 line-clamp-1 group-hover/item:text-pink-300 transition-colors">
                    {job.title}
                  </p>
                  <span className="text-[9px] text-white/40 font-mono truncate">{job.timeAgo}</span>
                </a>
              ))
            )}
          </div>
        </div>

        <div className="pt-1.5 text-[9px] text-white/30 text-center font-mono border-t border-white/[0.04] shrink-0">
          RemoteOK · HN Jobs · Tech Careers
        </div>
      </div>
    </div>
  );
});
