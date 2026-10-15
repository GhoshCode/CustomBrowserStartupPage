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
    tag: 'TypeScript',
  },
  {
    id: 'news-2',
    title: 'Linux 6.14 Merges Major Rust Kernel Infrastructure',
    source: 'HackerNews',
    url: 'https://news.ycombinator.com',
    timeAgo: '42m ago',
    tag: 'Linux',
  },
  {
    id: 'news-3',
    title: 'React 19 Server Actions: Performance & Edge Deployment',
    source: 'GitHub Blog',
    url: 'https://github.blog',
    timeAgo: '2h ago',
    tag: 'React',
  },
  {
    id: 'news-4',
    title: 'Anthropic Unveils Claude 3.7 Hybrid Reasoning Engine',
    source: 'Ars Technica',
    url: 'https://arstechnica.com/information-technology/',
    timeAgo: '3h ago',
    tag: 'AI',
  },
];

const FALLBACK_DEV_JOBS: NewsArticle[] = [
  {
    id: 'job-1',
    title: 'Senior Distributed Systems Engineer (Rust / Go)',
    source: 'RemoteOK',
    url: 'https://remoteok.com/remote-rust-jobs',
    timeAgo: '$180k - $240k · Remote',
    tag: 'Rust',
  },
  {
    id: 'job-2',
    title: 'Staff Frontend Architect (React / Next.js / WebGL)',
    source: 'HackerNews',
    url: 'https://news.ycombinator.com/jobs',
    timeAgo: '$190k - $250k · US/EU Remote',
    tag: 'Frontend',
  },
  {
    id: 'job-3',
    title: 'Principal AI Infrastructure Lead (PyTorch, CUDA)',
    source: 'YCombinator',
    url: 'https://www.ycombinator.com/jobs',
    timeAgo: '$220k - $310k · Remote',
    tag: 'AI',
  },
  {
    id: 'job-4',
    title: 'Cloud Security & Cryptography Engineer',
    source: 'RemoteOK',
    url: 'https://remoteok.com/remote-security-jobs',
    timeAgo: '$200k - $270k · Global Remote',
    tag: 'Security',
  },
];

export const ScrapedNewsPanel = memo(function ScrapedNewsPanel() {
  const enabledTopics = useStore((s) => s.settings.enabledTopics ?? []);
  const [techNews, setTechNews] = useState<NewsArticle[]>(FALLBACK_TECH_NEWS);
  const [devJobs, setDevJobs] = useState<NewsArticle[]>(FALLBACK_DEV_JOBS);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Live fetch from Dev.to public API (no CORS restriction, high reliability)
  const fetchLiveNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('https://dev.to/api/articles?tag=programming&top=1&per_page=4');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted: NewsArticle[] = data.slice(0, 4).map((item: any, idx: number) => ({
            id: `devto-${item.id || idx}`,
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
          const topIds = jobIds.slice(0, 4);
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

  // Filter based on active topic chips if any are selected
  const filteredNews = techNews.filter((item) => {
    if (enabledTopics.length === 0) return true;
    return enabledTopics.some(
      (topicId) =>
        item.tag.toLowerCase().includes(topicId.toLowerCase()) ||
        item.title.toLowerCase().includes(topicId.toLowerCase()),
    );
  });

  const displayNews = filteredNews.length > 0 ? filteredNews : techNews;

  return (
    <div className="flex flex-col gap-3.5 flex-1 min-h-0 select-none">
      {/* Top Card: TECH NEWS (items 1–4) */}
      <div className="glass flex-1 rounded-3xl border border-white/10 p-3.5 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-cyan-400">⚡</span>
              <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
                TECH NEWS
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-cyan-300/80">Live</span>
              <button
                type="button"
                onClick={fetchLiveNews}
                title="Refresh tech news feed"
                className="size-5 flex items-center justify-center rounded text-white/40 hover:text-cyan-300 hover:bg-white/10 text-xs transition-colors"
              >
                <span className={loadingNews ? 'animate-spin inline-block' : ''}>🔄</span>
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
            {displayNews.map((item) => (
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
            ))}
          </div>
        </div>

        <div className="pt-1.5 text-[9px] text-white/30 text-center font-mono border-t border-white/[0.04]">
          Dev.to · HackerNews · GitHub Blog
        </div>
      </div>

      {/* Middle Card: DEV OPPORTUNITIES (items 5–8) */}
      <div className="glass flex-1 rounded-3xl border border-white/10 p-3.5 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
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
                <span className={loadingJobs ? 'animate-spin inline-block' : ''}>🔄</span>
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
            {devJobs.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${item.title} (Opens in new tab)`}
                className="group/item flex flex-col gap-0.5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 hover:bg-white/[0.08] hover:border-pink-400/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-pink-400/90 font-mono">
                    {item.tag}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400/90 font-medium">
                    {item.source}
                  </span>
                </div>
                <p className="text-xs font-medium text-white/85 line-clamp-1 group-hover/item:text-pink-300 transition-colors">
                  {item.title}
                </p>
                <span className="text-[9px] text-white/40 truncate">{item.timeAgo}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="pt-1.5 text-[9px] text-white/30 text-center font-mono border-t border-white/[0.04]">
          RemoteOK · HN Jobs · YCombinator
        </div>
      </div>
    </div>
  );
});
