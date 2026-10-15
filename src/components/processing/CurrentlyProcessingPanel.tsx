import { memo, useState } from 'react';
import { Favicon } from '../Favicon';

interface WorkingSite {
  id: string;
  name: string;
  url: string;
  section: string;
  status: 'active' | 'idle' | 'ready';
  portOrDesc?: string;
}

const DEFAULT_WORKING_SECTIONS = [
  'Local Dev',
  'Active Sprints',
  'Docs & API',
  'Cloud & Tools',
];

const INITIAL_WORKING_SITES: WorkingSite[] = [
  {
    id: 'ws-1',
    name: 'Vite Frontend Dev',
    url: 'http://localhost:5173',
    section: 'Local Dev',
    status: 'active',
    portOrDesc: ':5173',
  },
  {
    id: 'ws-2',
    name: 'Express Backend API',
    url: 'http://localhost:3000/api',
    section: 'Local Dev',
    status: 'active',
    portOrDesc: ':3000',
  },
  {
    id: 'ws-3',
    name: 'GitHub Pull Requests',
    url: 'https://github.com/pulls',
    section: 'Active Sprints',
    status: 'ready',
    portOrDesc: '3 PRs review',
  },
  {
    id: 'ws-4',
    name: 'Jira Active Sprint',
    url: 'https://atlassian.net',
    section: 'Active Sprints',
    status: 'ready',
    portOrDesc: 'In Progress',
  },
  {
    id: 'ws-5',
    name: 'Tailwind CSS Docs',
    url: 'https://tailwindcss.com/docs',
    section: 'Docs & API',
    status: 'idle',
    portOrDesc: 'Reference',
  },
  {
    id: 'ws-6',
    name: 'Supabase Dashboard',
    url: 'https://supabase.com/dashboard',
    section: 'Cloud & Tools',
    status: 'ready',
    portOrDesc: 'PostgreSQL',
  },
];

interface CurrentlyProcessingPanelProps {
  onOpenSettings?: (tab: 'general' | 'library' | 'appearance' | 'shortcuts' | 'about') => void;
}

export const CurrentlyProcessingPanel = memo(function CurrentlyProcessingPanel({
  onOpenSettings,
}: CurrentlyProcessingPanelProps) {
  const [sites, setSites] = useState<WorkingSite[]>(() => {
    try {
      const saved = localStorage.getItem('devdeck_working_sites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WORKING_SITES;
  });

  const [activeSection, setActiveSection] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSection, setNewSection] = useState('Local Dev');
  const [newPort, setNewPort] = useState('');

  const saveSites = (next: WorkingSite[]) => {
    setSites(next);
    try {
      localStorage.setItem('devdeck_working_sites', JSON.stringify(next));
    } catch {}
  };

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newItem: WorkingSite = {
      id: `ws-${Date.now()}`,
      name: newName.trim(),
      url: formattedUrl,
      section: newSection,
      status: 'active',
      portOrDesc: newPort.trim() || undefined,
    };

    saveSites([...sites, newItem]);
    setNewName('');
    setNewUrl('');
    setNewPort('');
    setShowAddForm(false);
  };

  const handleDeleteSite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveSites(sites.filter((s) => s.id !== id));
  };

  const handleOpenSite = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredSites =
    activeSection === 'All'
      ? sites
      : sites.filter((s) => s.section === activeSection);

  // Group sites by section when in "All" view
  const sectionsToRender =
    activeSection === 'All'
      ? DEFAULT_WORKING_SECTIONS
      : [activeSection];

  return (
    <aside className="flex flex-col w-64 lg:w-72 shrink-0 h-full pb-14 min-h-0 select-none">
      {/* Tall Single Card: CURRENTLY WORKING SITES */}
      <div className="glass-raised flex flex-1 min-h-0 flex-col rounded-3xl border border-white/15 p-4 shadow-xl backdrop-blur-2xl overflow-hidden justify-between">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-cyan-400" />
              </span>
              <span className="font-display text-xs font-bold tracking-wider text-white/95 uppercase">
                WORKING SITES
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                title="Add working site"
                className="flex size-6 items-center justify-center rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white text-xs font-bold transition-all border border-white/10"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => onOpenSettings?.('library')}
                title="Manage Library"
                className="flex size-6 items-center justify-center rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.1] hover:text-white text-xs transition-all"
              >
                ⚙
              </button>
            </div>
          </div>

          {/* Section Partition Filters */}
          <div className="mt-2.5 flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none pb-1 shrink-0">
            {['All', ...DEFAULT_WORKING_SECTIONS].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold tracking-tight transition-all shrink-0 ${
                  activeSection === sec
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white/80 border border-white/[0.04]'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Quick Add Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleAddSite} className="mt-2 flex flex-col gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
              <input
                type="text"
                placeholder="Site name (e.g. Next.js App)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg bg-white/[0.05] px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none border border-white/10"
              />
              <input
                type="text"
                placeholder="URL (e.g. http://localhost:3000)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full rounded-lg bg-white/[0.05] px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none border border-white/10"
              />
              <div className="flex gap-1.5">
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="flex-1 rounded-lg bg-[#181126] px-1.5 py-1 text-[11px] text-white/80 border border-white/10 focus:outline-none"
                >
                  {DEFAULT_WORKING_SECTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Port/Note"
                  value={newPort}
                  onChange={(e) => setNewPort(e.target.value)}
                  className="w-20 rounded-lg bg-white/[0.05] px-2 py-1 text-[11px] text-white placeholder-white/30 focus:outline-none border border-white/10"
                />
              </div>
              <button
                type="submit"
                className="mt-0.5 rounded-lg bg-cyan-500/25 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/35 border border-cyan-500/40"
              >
                Save Site
              </button>
            </form>
          )}

          {/* Scrollable Partitioned Sites List */}
          <div className="mt-2 flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3">
            {sectionsToRender.map((sectionName) => {
              const sectionSites = filteredSites.filter((s) => s.section === sectionName);
              if (sectionSites.length === 0 && activeSection === 'All') return null;

              return (
                <div key={sectionName} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-1">
                    {sectionName}
                  </span>
                  {sectionSites.map((site) => (
                    <div
                      key={site.id}
                      onClick={() => handleOpenSite(site.url)}
                      className="group/item flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 hover:bg-white/[0.08] hover:border-cyan-400/30 transition-all cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Favicon url={site.url} name={site.name} className="size-4 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white/90 truncate group-hover/item:text-cyan-300 transition-colors">
                            {site.name}
                          </span>
                          <span className="text-[9px] font-mono text-white/40 truncate max-w-[130px]">
                            {site.url.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {site.portOrDesc && (
                          <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300 font-semibold border border-cyan-500/25">
                            {site.portOrDesc}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSite(site.id, e)}
                          title="Remove from working sites"
                          className="opacity-0 group-hover/item:opacity-100 size-4 flex items-center justify-center text-white/30 hover:text-rose-400 text-[10px] transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {filteredSites.length === 0 && (
              <p className="py-6 text-center text-xs text-white/40">
                No sites in this section. Click + to add one.
              </p>
            )}
          </div>
        </div>

        {/* Bottom stats / summary */}
        <div className="pt-2 text-[10px] text-white/40 font-mono flex items-center justify-between border-t border-white/[0.06] shrink-0">
          <span>{sites.length} Active Sites</span>
          <span className="text-emerald-400/80">● Ready to launch</span>
        </div>
      </div>
    </aside>
  );
});
