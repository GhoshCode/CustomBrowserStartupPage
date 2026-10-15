import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../store';
import type { ProcessingItem } from '../../types';
import { useNow } from '../../hooks/useNow';
import { isExtension } from '../../lib/env';
import { describeSchedule, nextFireTime } from '../../lib/schedule';
import { relativeAge } from '../../services/search';
import { Favicon } from '../Favicon';
import { DEFAULT_SECTIONS, ProcessingEditor } from './ProcessingEditor';

// D — Currently Processing (left column). Two stacked cards: the top card is
// the first section ("Focus" by default), the lower card holds every other
// section, each collapsible. The mini settings cog sits in the lower card's
// bottom-right corner and opens the editor.

export const ProcessingPanel = memo(function ProcessingPanel() {
  const processing = useStore((s) => s.processing);
  const [managerOpen, setManagerOpen] = useState(false);
  const now = useNow(60_000);

  const groups = useMemo(() => {
    const items = [...processing].sort((a, b) => a.order - b.order);
    const names = [...new Set([...DEFAULT_SECTIONS.slice(0, 1), ...items.map((i) => i.section)])];
    return names.map((name) => ({ name, items: items.filter((i) => i.section === name) }));
  }, [processing]);
  const [top, ...rest] = groups;

  return (
    <>
      <section aria-label={`Processing: ${top.name}`} className="glass flex min-h-0 flex-1 flex-col gap-2 p-3">
        <PanelHeader index={1} title={top.name} count={top.items.length} />
        <ItemList items={top.items} now={now} empty={<EmptyState onAdd={() => setManagerOpen(true)} />} />
      </section>

      <section aria-label="Processing: other sections" className="glass relative flex min-h-0 flex-1 flex-col gap-2 p-3 pb-10">
        <PanelHeader index={2} title={rest.length === 1 ? rest[0].name : 'Queue'} count={rest.reduce((n, g) => n + g.items.length, 0)} />
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
          {rest.length === 0 && <p className="px-1 text-[11px] text-white/35">Group more sites with sections in the editor.</p>}
          {rest.map((g) =>
            rest.length === 1 ? (
              <ItemList key={g.name} items={g.items} now={now} empty={<p className="px-1 text-[11px] text-white/35">Empty.</p>} />
            ) : (
              <CollapsibleSection key={g.name} name={g.name} items={g.items} now={now} />
            ),
          )}
        </div>
        <NotificationPrompt items={processing} />
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          aria-label="Manage currently processing"
          title="Add/remove sites and set reminders"
          className="group absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"
        >
          <svg className="size-4 transition-transform duration-500 group-hover:rotate-90" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </section>

      <AnimatePresence>{managerOpen && <ProcessingManager onClose={() => setManagerOpen(false)} />}</AnimatePresence>
    </>
  );
});

function PanelHeader({ index, title, count }: { index: number; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/55">D{index}</span>
      <h2 className="truncate font-display text-[11px] font-semibold tracking-[0.18em] text-white/65 uppercase">{title}</h2>
      <span className="ml-auto font-mono text-[10px] text-white/35">{count}</span>
    </div>
  );
}

function ItemList({ items, now, empty }: { items: ProcessingItem[]; now: Date; empty: ReactNode }) {
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} now={now} />
      ))}
    </ul>
  );
}

function ItemRow({ item, now }: { item: ProcessingItem; now: Date }) {
  const recordVisit = useStore((s) => s.recordVisit);
  const next = nextFireTime(item.schedule, now);
  return (
    <li data-processing-item={item.id}>
      <a
        href={item.url}
        onClick={() => item.siteId && recordVisit(item.siteId)}
        title={`${item.url}\n${describeSchedule(item.schedule)}`}
        className="group/proc flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.07]"
      >
        <Favicon url={item.url} name={item.name} className="size-[18px] shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-white/90">{item.name}</span>
          <span className="block truncate text-[10px] text-white/40">
            {item.schedule.enabled ? `⏰ ${describeSchedule(item.schedule)}` : 'No reminders'}
          </span>
        </span>
        {next && (
          <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 font-mono text-[9px] text-white/45" title={next.toLocaleString()}>
            in {relativeAge(now.getTime(), next.getTime()).replace('now', '<1m')}
          </span>
        )}
      </a>
    </li>
  );
}

function CollapsibleSection({ name, items, now }: { name: string; items: ProcessingItem[]; now: Date }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-1 text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase hover:text-white/75"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
        {name}
        <span className="ml-auto font-mono font-normal">{items.length}</span>
      </button>
      {open && <ItemList items={items} now={now} empty={null} />}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p className="text-[11px] text-white/40">What are you working on right now?</p>
      <button type="button" onClick={onAdd} className="rounded-lg bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/15">
        + Add a site
      </button>
    </div>
  );
}

// Web mode only: browser notifications need an explicit grant.
function NotificationPrompt({ items }: { items: ProcessingItem[] }) {
  const [permission, setPermission] = useState(() =>
    typeof Notification === 'undefined' ? 'denied' : Notification.permission,
  );
  const wantsReminders = items.some((i) => i.schedule.enabled);
  if (isExtension() || permission !== 'default' || !wantsReminders) return null;
  return (
    <button
      type="button"
      onClick={() => void Notification.requestPermission().then(setPermission)}
      className="absolute bottom-2 left-3 text-[10px] font-semibold text-[var(--color-accent)] hover:underline"
    >
      Enable reminder notifications
    </button>
  );
}

function ProcessingManager({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <motion.div
        role="dialog"
        aria-label="Manage currently processing"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="glass-raised fixed top-4 bottom-4 left-4 z-50 flex w-[min(400px,calc(100vw-2rem))] flex-col rounded-[var(--radius-card)] bg-[var(--color-base-elevated)]/95"
      >
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-5 pt-4 pb-3">
          <div className="flex-1">
            <h2 className="font-display text-sm font-semibold tracking-[0.18em] text-white">CURRENTLY PROCESSING</h2>
            <p className="text-[11px] text-white/40">Sites you're actively working on, with reminders.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ProcessingEditor />
        </div>
      </motion.div>
    </>
  );
}
