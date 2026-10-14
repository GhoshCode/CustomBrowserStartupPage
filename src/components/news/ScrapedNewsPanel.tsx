import { memo, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  timeAgo: string;
  tag: string;
}

const DEFAULT_TECH_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'TypeScript 5.8 Beta: Fast Type Checks & Node 22 ESM',
    source: 'Dev.to',
    url: 'https://dev.to',
    timeAgo: '12m ago',
    tag: 'TypeScript',
  },
  {
    id: 'news-2',
    title: 'Linux 6.14 Kernel Merges Major Rust Abstractions',
    source: 'HackerNews',
    url: 'https://news.ycombinator.com',
    timeAgo: '45m ago',
    tag: 'Linux',
  },
  {
    id: 'news-3',
    title: 'React 19 Server Actions: Architectural Retrospective',
    source: 'GitHub',
    url: 'https://github.blog',
    timeAgo: '2h ago',
    tag: 'React',
  },
  {
    id: 'news-4',
    title: 'Anthropic Unveils Claude 3.7 Hybrid Reasoning Engine',
    source: 'Ars Technica',
    url: 'https://arstechnica.com',
    timeAgo: '3h ago',
    tag: 'AI',
  },
];

const DEFAULT_DEV_JOBS: NewsItem[] = [
  {
    id: 'job-1',
    title: 'Senior Distributed Systems Engineer (Rust / Go)',
    source: 'RemoteOK',
    url: 'https://remoteok.com',
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
    source: 'RemoteOK',
    url: 'https://remoteok.com',
    timeAgo: '$220k - $310k · Remote',
    tag: 'AI',
  },
  {
    id: 'job-4',
    title: 'Lead Security & Cryptography Engineer',
    source: 'GitHub Jobs',
    url: 'https://remoteok.com',
    timeAgo: '$200k - $270k · Global Remote',
    tag: 'Security',
  },
];

export const ScrapedNewsPanel = memo(function ScrapedNewsPanel() {
  const [techNews] = useState<NewsItem[]>(DEFAULT_TECH_NEWS);
  const [devJobs] = useState<NewsItem[]>(DEFAULT_DEV_JOBS);

  return (
    <div className="flex flex-col gap-3.5 flex-1 min-h-0">
      {/* Top: Tech News (items 1–4) */}
      <div className="glass flex-1 rounded-3xl border border-white/10 p-4 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-400">⚡</span>
              <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
                TECH NEWS
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300/80">Live Feed</span>
          </div>

          <div className="mt-2.5 flex flex-col gap-2">
            {techNews.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/item flex flex-col gap-0.5 rounded-xl border border-white/[0.03] bg-white/[0.02] p-2 hover:bg-white/[0.06] hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400/90">
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

        <div className="pt-2 text-[10px] text-white/30 text-center font-mono border-t border-white/[0.04]">
          HackerNews · Dev.to · ArsTechnica
        </div>
      </div>

      {/* Middle: Dev Jobs (items 5–8) */}
      <div className="glass flex-1 rounded-3xl border border-white/10 p-4 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-pink-400">💼</span>
              <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
                DEV OPPORTUNITIES
              </span>
            </div>
            <span className="rounded-full bg-pink-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-pink-300 border border-pink-500/30">
              Remote
            </span>
          </div>

          <div className="mt-2.5 flex flex-col gap-2">
            {devJobs.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/item flex flex-col gap-0.5 rounded-xl border border-white/[0.03] bg-white/[0.02] p-2 hover:bg-white/[0.06] hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-pink-400/90">
                    {item.tag}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400/90 font-medium">
                    {item.source}
                  </span>
                </div>
                <p className="text-xs font-medium text-white/85 line-clamp-1 group-hover/item:text-pink-300 transition-colors">
                  {item.title}
                </p>
                <span className="text-[9px] text-white/40">{item.timeAgo}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="pt-2 text-[10px] text-white/30 text-center font-mono border-t border-white/[0.04]">
          Curated Dev Careers
        </div>
      </div>
    </div>
  );
});
