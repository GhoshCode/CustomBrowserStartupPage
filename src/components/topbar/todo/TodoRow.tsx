import { memo, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Todo } from '../../../types';
import { useStore } from '../../../store';
import { formatDue, isDueToday, isOverdue } from '../../../lib/todos';

interface TodoRowProps {
  todo: Todo;
  now: number;
  expanded: boolean; // full controls (edit, due editor, delete, drag) only when expanded
}

// One active to-do. The leading bullet completes + archives it (spec §3.4).
// Overdue rows sit in the Red Danger Zone and are not draggable — their
// position is decided by how overdue they are.
export const TodoRow = memo(function TodoRow({ todo, now, expanded }: TodoRowProps) {
  const completeTodo = useStore((s) => s.completeTodo);
  const updateTodo = useStore((s) => s.updateTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [dueOpen, setDueOpen] = useState(false);

  const overdue = isOverdue(todo, now);
  const today = isDueToday(todo, now);
  const due = formatDue(todo, now);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: !expanded || overdue || editing,
  });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  const commitText = () => {
    const text = draft.trim();
    if (text && text !== todo.text) updateTodo(todo.id, { text });
    else setDraft(todo.text);
    setEditing(false);
  };

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 48, transition: { duration: 0.22 } }}
      data-todo-id={todo.id}
      data-overdue={overdue || undefined}
      className={`group/todo rounded-lg ${overdue ? 'todo-danger' : ''} ${isDragging ? 'opacity-60' : ''}`}
    >
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 px-1.5 py-[3px]">
        <button
          type="button"
          onClick={() => completeTodo(todo.id)}
          aria-label={`Complete "${todo.text}"`}
          title="Mark complete (archives it)"
          className={`flex size-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
            overdue
              ? 'border-red-400 hover:bg-red-400/40'
              : 'border-white/40 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/30'
          }`}
        />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText();
              if (e.key === 'Escape') {
                setDraft(todo.text);
                setEditing(false);
              }
            }}
            aria-label="Edit task"
            className="min-w-0 flex-1 rounded bg-white/10 px-1 text-[13px] text-white outline-none"
          />
        ) : (
          <span
            {...(expanded ? { ...attributes, ...listeners } : {})}
            onDoubleClick={() => expanded && setEditing(true)}
            title={expanded ? 'Double-click to edit · drag to reorder' : todo.text}
            className={`min-w-0 flex-1 truncate text-[13px] ${overdue ? 'font-medium text-red-100' : 'text-white/85'} ${
              expanded && !overdue ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {todo.text}
          </span>
        )}
        {(due || expanded) && (
          <button
            type="button"
            disabled={!expanded}
            onClick={() => setDueOpen((o) => !o)}
            aria-label={due ? `Due ${due} — change` : 'Add due date'}
            className={`shrink-0 rounded-md px-1.5 py-px font-mono text-[10px] tabular-nums transition-colors ${
              overdue
                ? 'bg-red-500/30 font-bold text-red-200'
                : today
                  ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                  : due
                    ? 'bg-white/10 text-white/55'
                    : 'text-white/25 opacity-0 group-hover/todo:opacity-100 hover:text-white/60'
            }`}
          >
            {due ?? '+ due'}
          </button>
        )}
        {expanded && (
          <button
            type="button"
            onClick={() => deleteTodo(todo.id)}
            aria-label={`Delete "${todo.text}"`}
            className="shrink-0 text-xs text-white/30 opacity-0 group-hover/todo:opacity-100 hover:text-red-300"
          >
            ✕
          </button>
        )}
      </div>
      {expanded && dueOpen && (
        <DueEditor
          todo={todo}
          onChange={(dueDate, dueTime) => updateTodo(todo.id, { dueDate, dueTime })}
          onDone={() => setDueOpen(false)}
        />
      )}
    </motion.li>
  );
});

// Single date/time attachment: a date, optionally with a time.
export function DueEditor({
  todo,
  onChange,
  onDone,
}: {
  todo: Pick<Todo, 'dueDate' | 'dueTime'>;
  onChange: (dueDate: string | null, dueTime: string | null) => void;
  onDone?: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-7 pb-1.5 font-mono text-[11px]">
      <input
        type="date"
        value={todo.dueDate ?? ''}
        onChange={(e) => onChange(e.target.value || null, e.target.value ? todo.dueTime : null)}
        aria-label="Due date"
        className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/85 [color-scheme:dark] outline-none"
      />
      <input
        type="time"
        value={todo.dueTime ?? ''}
        disabled={!todo.dueDate}
        onChange={(e) => onChange(todo.dueDate, e.target.value || null)}
        aria-label="Due time"
        className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/85 [color-scheme:dark] outline-none disabled:opacity-40"
      />
      {todo.dueDate && (
        <button type="button" onClick={() => onChange(null, null)} className="text-white/40 hover:text-white/80">
          clear
        </button>
      )}
      {onDone && (
        <button type="button" onClick={onDone} className="ml-auto text-[var(--color-accent)]">
          done
        </button>
      )}
    </div>
  );
}
