import { memo, useState } from 'react';
import { Favicon } from '../Favicon';
import { PrimeDateTimePicker } from '../common/PrimeDateTimePicker';

interface WorkingSite {
  id: string;
  name: string;
  url: string;
  section: string;
  status: 'active' | 'idle' | 'ready';
  portOrDesc?: string;
  scheduledTime?: string;
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
  // Custom user-managed sections
  const [sections, setSections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('devdeck_working_sections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WORKING_SECTIONS;
  });

  const [sites, setSites] = useState<WorkingSite[]>(() => {
    try {
      const saved = localStorage.getItem('devdeck_working_sites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WORKING_SITES;
  });

  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Add site form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSection, setNewSection] = useState(sections[0] || 'Local Dev');
  const [newPort, setNewPort] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Add new section state
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const saveSections = (next: string[]) => {
    setSections(next);
    try {
      localStorage.setItem('devdeck_working_sections', JSON.stringify(next));
    } catch {}
  };

  const saveSites = (next: WorkingSite[]) => {
    setSites(next);
    try {
      localStorage.setItem('devdeck_working_sites', JSON.stringify(next));
    } catch {}
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSectionTitle.trim();
    if (!trimmed || sections.includes(trimmed)) return;
    const next = [...sections, trimmed];
    saveSections(next);
    setNewSection(trimmed);
    setNewSectionTitle('');
    setShowAddSection(false);
  };

  const handleDeleteSection = (secName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sections.length <= 1) return;
    const nextSecs = sections.filter((s) => s !== secName);
    saveSections(nextSecs);
    // Reassign orphan sites to first available section
    const fallback = nextSecs[0];
    const nextSites = sites.map((s) => (s.section === secName ? { ...s, section: fallback } : s));
    saveSites(nextSites);
    if (activeFilter === secName) setActiveFilter('All');
  };

  const toggleCollapse = (secName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secName]: !prev[secName],
    }));
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
      scheduledTime: newScheduledTime || undefined,
    };

    saveSites([...sites, newItem]);
    setNewName('');
    setNewUrl('');
    setNewPort('');
    setNewScheduledTime('');
    setShowTimePicker(false);
    setShowAddForm(false);
  };

  const handleDeleteSite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveSites(sites.filter((s) => s.id !== id));
  };

  const handleMoveSiteSection = (id: string, targetSection: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    saveSites(sites.map((s) => (s.id === id ? { ...s, section: targetSection } : s)));
  };

  const handleOpenSite = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const visibleSections = activeFilter === 'All' ? sections : sections.filter((s) => s === activeFilter);

  return (
    <aside className="flex flex-col w-64 lg:w-72 shrink-0 h-full pb-14 min-h-0 select-none">
      {/* Tall Single Card: CURRENTLY WORKING SITES */}
      <div className="glass-raised flex flex-1 min-h-0 flex-col rounded-3xl border border-white/15 p-4 sm:p-5 shadow-xl backdrop-blur-2xl overflow-hidden justify-between">
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
              <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300">
                {sites.length}
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

          {/* Section Partition Filter Pills */}
          <div className="mt-2.5 flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none pb-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter('All')}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold tracking-tight transition-all shrink-0 ${
                activeFilter === 'All'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white/80 border border-white/[0.04]'
              }`}
            >
              All Partitions
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveFilter(sec)}
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold tracking-tight transition-all shrink-0 ${
                  activeFilter === sec
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white/80 border border-white/[0.04]'
                }`}
              >
                {sec}
              </button>
            ))}

            {/* + Add New Section Button */}
            <button
              type="button"
              onClick={() => setShowAddSection((prev) => !prev)}
              title="Create new section partition"
              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all border border-cyan-500/25 shrink-0 flex items-center gap-0.5"
            >
              <span>+</span>
              <span>Section</span>
            </button>
          </div>

          {/* New Section Inline Creator */}
          {showAddSection && (
            <form onSubmit={handleCreateSection} className="mt-1.5 flex items-center gap-1 p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 shrink-0">
              <input
                type="text"
                placeholder="New partition name..."
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="flex-1 rounded-lg bg-black/40 px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none border border-white/10"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-500/30 px-2.5 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/40 border border-cyan-500/40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddSection(false)}
                className="rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50 hover:bg-white/10"
              >
                ✕
              </button>
            </form>
          )}

          {/* Quick Add Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleAddSite} className="mt-2 flex flex-col gap-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
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
                  {sections.map((s) => (
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

              {/* Optional Schedule Run Time with PrimeNG DateTimePicker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimePicker((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] border transition-colors ${
                    newScheduledTime
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                      : 'bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🕒</span>
                    <span>{newScheduledTime ? `Schedule: ${newScheduledTime}` : 'Add Schedule Time'}</span>
                  </span>
                  {newScheduledTime && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewScheduledTime('');
                      }}
                      className="text-white/40 hover:text-white text-xs"
                    >
                      ✕
                    </span>
                  )}
                </button>

                {showTimePicker && (
                  <div className="absolute right-0 top-8 z-50 shadow-2xl">
                    <PrimeDateTimePicker
                      valueTime={newScheduledTime}
                      showTime={true}
                      showPresets={true}
                      onChange={(_d, t) => {
                        setNewScheduledTime(t);
                      }}
                      onClose={() => setShowTimePicker(false)}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="mt-0.5 rounded-lg bg-cyan-500/25 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/35 border border-cyan-500/40"
              >
                Save Site
              </button>
            </form>
          )}

          {/* Scrollable Section-wise Partitioned Sites Track */}
          <div className="mt-2 flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3">
            {visibleSections.map((sectionName) => {
              const sectionSites = sites.filter((s) => s.section === sectionName);
              const isCollapsed = Boolean(collapsedSections[sectionName]);

              return (
                <div
                  key={sectionName}
                  className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2 transition-all"
                >
                  {/* Partition Header */}
                  <div
                    onClick={() => toggleCollapse(sectionName)}
                    className="flex items-center justify-between pb-1.5 px-1 cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-cyan-400/80 transition-transform duration-200">
                        {isCollapsed ? '▸' : '▾'}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 truncate">
                        {sectionName}
                      </span>
                      <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-white/60">
                        {sectionSites.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Add directly to this section */}
                      <button
                        type="button"
                        onClick={() => {
                          setNewSection(sectionName);
                          setShowAddForm(true);
                        }}
                        title={`Add site to ${sectionName}`}
                        className="size-5 rounded flex items-center justify-center text-white/40 hover:text-cyan-300 hover:bg-white/10 text-xs"
                      >
                        +
                      </button>

                      {/* Delete custom section */}
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSection(sectionName, e)}
                          title={`Delete ${sectionName} partition`}
                          className="size-5 rounded flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Partition Sites Body */}
                  {!isCollapsed && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      {sectionSites.length === 0 ? (
                        <p className="text-[10px] text-white/30 italic py-1 px-2 text-center">
                          No sites in this partition
                        </p>
                      ) : (
                        sectionSites.map((site) => (
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
                                <span className="text-[9px] font-mono text-white/40 truncate max-w-[125px]">
                                  {site.url.replace(/^https?:\/\//, '')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {site.portOrDesc && (
                                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300 font-semibold border border-cyan-500/25">
                                  {site.portOrDesc}
                                </span>
                              )}

                              {site.scheduledTime && (
                                <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] text-violet-300 font-semibold border border-violet-500/25 flex items-center gap-0.5">
                                  <span>🕒</span>
                                  <span>{site.scheduledTime}</span>
                                </span>
                              )}

                              {/* Section Switcher dropdown */}
                              <select
                                value={site.section}
                                onChange={(e) => handleMoveSiteSection(site.id, e.target.value, e)}
                                title="Move to another section"
                                className="bg-[#120a1c] text-[9px] font-mono text-white/50 border border-white/10 rounded px-1 py-0.5 focus:outline-none"
                              >
                                {sections.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteSite(site.id, e)}
                                title="Remove from working sites"
                                className="size-4 flex items-center justify-center rounded text-white/30 hover:bg-rose-500/20 hover:text-rose-400 text-[10px] transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-[9px] text-white/30 text-center font-mono border-t border-white/[0.04] shrink-0">
          Click any site to launch · Switch partitions
        </div>
      </div>
    </aside>
  );
});
