import { memo, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../../../store';
import { useNow } from '../../../hooks/useNow';
import { useIdleTimeout } from '../../../hooks/useIdleTimeout';
import { isOverdue, sortActive, sortArchived } from '../../../lib/todos';
import { DueEditor, TodoRow } from './TodoRow';

// TO DO widget (spec §3.4).
//   collapsed  — first 3 items in the top-bar slot
//   expanded   — full list as an overlay over the content below; shrinks back
//                after 30 s without interaction
//   archive    — completed items: restore, delete, purge
// Archive (📦) sits directly left of the expand (▾) button, bottom-right.

const PREVIEW_COUNT = 3;
export const TODO_IDLE_MS = 30_000;

type Mode = 'collapsed' | 'expanded' | 'archive';

export const TodoWidget = memo(function TodoWidget() {
  const todos = useStore((s) => s.todos);
  const reorder = useStore((s) => s.reorder);
  // Re-evaluate overdue state every 15 s so items turn red on time.
  const now = useNow(15_000).getTime();
  const [mode, setMode] = useState<Mode>('collapsed');
  const panelRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => sortActive(todos, now), [todos, now]);
  const archived = useMemo(() => sortArchived(todos), [todos]);
  const overdueCount = active.filter((t) => isOverdue(t, now)).length;
  const open = mode !== 'collapsed';

  useIdleTimeout(panelRef, open, TODO_IDLE_MS, () => setMode('collapsed'));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMode('collapsed');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const sortableIds = active.filter((t) => !isOverdue(t, now)).map((t) => t.id);
  const onDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    if (!over || dragged.id === over.id) return;
    const from = sortableIds.indexOf(String(dragged.id));
    const to = sortableIds.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    reorder('todo', arrayMove(sortableIds, from, to));
  };

  const footer = (
    <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
      <IconButton
        label={mode === 'archive' ? 'Back to tasks' : `Archive (${archived.length})`}
        active={mode === 'archive'}
        onClick={() => setMode(mode === 'archive' ? 'expanded' : 'archive')}
      >
        <ArchiveIcon />
      </IconButton>
      <IconButton
        label={open ? 'Collapse' : 'Expand'}
        active={false}
        onClick={() => setMode(open ? 'collapsed' : 'expanded')}
      >
        <svg className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconButton>
    </div>
  );

  const header = (
    <div className="flex items-center gap-2 px-1">
      <h2 className="font-display text-[11px] font-semibold tracking-[0.2em] text-white/60">
        {mode === 'archive' ? 'ARCHIVE' : 'TO DO'}
      </h2>
      <span className="font-mono text-[10px] text-white/35">
        {mode === 'archive' ? archived.length : active.length}
      </span>
      {overdueCount > 0 && mode !== 'archive' && (
        <span className="rounded-md bg-red-500/30 px-1.5 font-mono text-[10px] font-bold text-red-200">
          {overdueCount} overdue
        </span>
      )}
      {mode === 'collapsed' && (
        <button
          type="button"
          onClick={() => setMode('expanded')}
          aria-label="Add a task"
          title="Add a task"
          className="ml-auto flex size-5 items-center justify-center rounded-md text-sm leading-none text-white/45 hover:bg-white/10 hover:text-white"
        >
          +
        </button>
      )}
    </div>
  );

  return (
    <div data-testid="todo-widget" className="h-full">
      {/* Collapsed card — always rendered so the top bar keeps its shape. */}
      <div className={`glass relative flex h-full flex-col gap-1.5 px-2.5 pt-2.5 pb-8 ${open ? 'invisible' : ''}`}>
        {header}
        <ul className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            {active.slice(0, PREVIEW_COUNT).map((t) => (
              <TodoRow key={t.id} todo={t} now={now} expanded={false} />
            ))}
          </AnimatePresence>
          {active.length === 0 && <li className="px-1.5 pt-1 text-xs text-white/30">Nothing to do. Nice.</li>}
        </ul>
        {active.length > PREVIEW_COUNT && (
          <span className="absolute bottom-2 left-3 font-mono text-[10px] text-white/35">
            +{active.length - PREVIEW_COUNT} more
          </span>
        )}
        {!open && footer}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={mode === 'archive' ? 'Archived tasks' : 'All tasks'}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="glass-raised absolute top-0 right-0 left-0 z-40 flex max-h-[min(70vh,560px)] flex-col gap-2 rounded-[var(--radius-card)] bg-[var(--color-base-elevated)]/95 px-2.5 pt-2.5 pb-9"
          >
            {header}
            {mode === 'expanded' ? (
              <>
                <Composer />
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {active.map((t) => (
                          <TodoRow key={t.id} todo={t} now={now} expanded />
                        ))}
                      </AnimatePresence>
                      {active.length === 0 && <li className="px-1.5 py-2 text-xs text-white/30">Nothing to do. Nice.</li>}
                    </ul>
                  </SortableContext>
                </DndContext>
              </>
            ) : (
              <ArchiveList />
            )}
            {footer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Add form with the optional single date/time attachment. Focused on open so
// the collapsed card's "+" lands straight in it.
function Composer() {
  const addTodo = useStore((s) => s.addTodo);
  const [text, setText] = useState('');
  const [due, setDue] = useState<{ dueDate: string | null; dueTime: string | null }>({ dueDate: null, dueTime: null });
  const [showDue, setShowDue] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    addTodo({ text: value, ...due });
    setText('');
    setDue({ dueDate: null, dueTime: null });
    setShowDue(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1">
        <span className="text-xs text-white/35">+</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          autoFocus
          aria-label="New task"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={() => setShowDue((s) => !s)}
          aria-label="Attach due date"
          aria-pressed={showDue}
          className={`text-xs ${showDue || due.dueDate ? 'text-[var(--color-accent)]' : 'text-white/35 hover:text-white/70'}`}
        >
          ⏰
        </button>
      </div>
      {showDue && (
        <DueEditor todo={due} onChange={(dueDate, dueTime) => setDue({ dueDate, dueTime })} />
      )}
    </form>
  );
}

function ArchiveList() {
  const todos = useStore((s) => s.todos);
  const restoreTodo = useStore((s) => s.restoreTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const purge = useStore((s) => s.purgeArchivedTodos);
  const archived = useMemo(() => sortArchived(todos), [todos]);

  return (
    <>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {archived.map((t) => (
          <li key={t.id} className="group/arch flex items-center gap-2 rounded-lg px-1.5 py-[3px] hover:bg-white/5">
            <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-[8px] text-emerald-200">
              ✓
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-white/45 line-through">{t.text}</span>
            <button type="button" onClick={() => restoreTodo(t.id)} aria-label={`Restore "${t.text}"`} className="text-xs text-white/40 hover:text-white">
              ↺
            </button>
            <button type="button" onClick={() => deleteTodo(t.id)} aria-label={`Delete "${t.text}"`} className="text-xs text-white/30 hover:text-red-300">
              ✕
            </button>
          </li>
        ))}
        {archived.length === 0 && <li className="px-1.5 py-2 text-xs text-white/30">No archived tasks.</li>}
      </ul>
      {archived.length > 0 && (
        <button type="button" onClick={purge} className="absolute bottom-2 left-3 font-mono text-[10px] text-red-300/70 hover:text-red-300">
          purge all
        </button>
      )}
    </>
  );
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-6 items-center justify-center rounded-md transition-colors ${
        active ? 'bg-white/15 text-white' : 'text-white/45 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ArchiveIcon() {
  return (
    <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
      <rect x="1.8" y="2.5" width="12.4" height="3.2" rx="0.8" />
      <path d="M3 5.7v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7M6.3 8.6h3.4" strokeLinecap="round" />
    </svg>
  );
}
