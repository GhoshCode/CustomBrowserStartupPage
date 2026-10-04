import { useStore } from '../store';

export function QuickLinks() {
  const quickLinks = useStore((s) => s.quickLinks);

  return (
    <div className="flex flex-wrap items-center gap-4 px-8 sm:px-12 pb-8">
      {quickLinks.map((link) => {
        try {
          const url = new URL(link.url);
          const domain = url.hostname;
          return (
            <a
              key={link.id}
              href={link.url}
              className="glass-inner flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all hover:scale-105 hover:bg-[var(--color-glass-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt=""
                className="size-5 rounded-sm"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-white/90 drop-shadow-sm">{link.name}</span>
            </a>
          );
        } catch {
          return null;
        }
      })}
    </div>
  );
}
