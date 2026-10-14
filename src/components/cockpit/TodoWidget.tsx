import { memo, useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import type { TodoItem } from '../../types';

export const TodoWidget = memo(function TodoWidget() {
  const todos = useStore((s) => s.todos);
  const addTodo = useStore((s) => s.addTodo);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const archiveTodo = useStore((s) => s.archiveTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const clearArchivedTodos = useStore((s) => s.clearArchivedTodos);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showDateInputs, setShowDateInputs] = useState(false);

  // 30-second inactivity timer for auto-shrink when expanded
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isExpanded) {
      timerRef.current = setTimeout(() => {
        setIsExpanded(false);
        setShowArchive(false);
      }, 30000); // 30 seconds
    }
  };

  useEffect(() => {
    if (isExpanded) {
      resetInactivityTimer();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isExpanded]);

  // Handle adding new task
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    addTodo({
      text: newText.trim(),
      dueDate: newDate || undefined,
      dueTime: newTime || undefined,
    });

    setNewText('');
    setNewDate('');
    setNewTime('');
    setShowDateInputs(false);
    resetInactivityTimer();
  };

  // Active unarchived tasks
  const activeTodos = todos.filter((t) => !t.archived && !t.completed);
  const archivedTodos = todos.filter((t) => t.archived || t.completed);

  // Overdue calculation (Date.now() > dueTimestamp)
  const now = Date.now();
  const overdueTodos = activeTodos.filter(
    (t) => t.dueTimestamp && now > t.dueTimestamp,
  );
  const normalTodos = activeTodos.filter(
    (t) => !t.dueTimestamp || now <= t.dueTimestamp,
  );

  // Complete & Archive immediately upon clicking circle bullet
  const handleCompleteAndArchive = (todo: TodoItem) => {
    toggleTodo(todo.id);
    archiveTodo(todo.id);
    resetInactivityTimer();
  };

  const visibleList = isExpanded
    ? [...overdueTodos, ...normalTodos]
    : [...overdueTodos, ...normalTodos].slice(0, 3);

  return (
    <div
      onMouseMove={resetInactivityTimer}
      onKeyDown={resetInactivityTimer}
      className={`glass group relative flex flex-col justify-between overflow-hidden p-3.5 transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-x-6 top-16 z-50 max-h-[85vh] bg-[#0f091f]/95 shadow-2xl backdrop-blur-2xl border-white/20 sm:inset-x-auto sm:left-1/2 sm:w-[540px] sm:-translate-x-1/2 rounded-2xl'
          : 'h-[142px] w-full rounded-2xl border-white/10 hover:border-white/15'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-rose-400">✓</span>
          <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
            {showArchive ? 'ARCHIVED TASKS' : 'TASKS / TO-DO'}
          </span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-semibold text-white/70">
            {showArchive ? archivedTodos.length : activeTodos.length}
          </span>
        </div>

        {/* Date / Time attach toggle in normal view */}
        <button
          type="button"
          onClick={() => setShowDateInputs((prev) => !prev)}
          title="Attach Date/Time to new task"
          className={`flex size-5 items-center justify-center rounded-md text-[11px] transition-colors ${
            showDateInputs
              ? 'bg-rose-500/30 text-rose-300'
              : 'text-white/40 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          🕒
        </button>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleAdd} className="mt-1.5 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newText}
            onChange={(e) => {
              setNewText(e.target.value);
              resetInactivityTimer();
            }}
            placeholder="Add task..."
            className="w-full min-w-0 rounded-lg bg-white/[0.04] px-2 py-1 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-rose-400/50 border border-white/[0.07]"
          />
          <button
            type="submit"
            className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold border border-rose-500/30"
          >
            +
          </button>
        </div>

        {/* Attached Date & Time Inputs */}
        {showDateInputs && (
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-1 border border-white/[0.06]">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-transparent text-[11px] text-white/80 focus:outline-none"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-transparent text-[11px] text-white/80 focus:outline-none"
            />
          </div>
        )}
      </form>

      {/* Body: Task Items List */}
      <div className="mt-1.5 flex flex-col gap-1 overflow-y-auto pr-1">
        {showArchive ? (
          archivedTodos.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-white/40">No archived tasks.</p>
          ) : (
            archivedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between rounded-lg bg-white/[0.02] px-2 py-1 text-xs text-white/50 border border-white/[0.03]"
              >
                <span className="line-through truncate">{todo.text}</span>
                <button
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  title="Delete permanently"
                  className="ml-2 text-white/30 hover:text-rose-400 text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))
          )
        ) : visibleList.length === 0 ? (
          <p className="py-2 text-center text-[11px] text-white/40">No active tasks. Free to code!</p>
        ) : (
          visibleList.map((todo) => {
            const isOverdue = todo.dueTimestamp ? now > todo.dueTimestamp : false;
            return (
              <div
                key={todo.id}
                className={`flex items-center justify-between rounded-lg px-2 py-1 transition-colors border ${
                  isOverdue
                    ? 'border-rose-500/40 bg-rose-500/[0.08] shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                    : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Circle Bullet — Click to complete and move to archive */}
                  <button
                    type="button"
                    onClick={() => handleCompleteAndArchive(todo)}
                    title="Click circle to complete & archive"
                    className={`size-3.5 shrink-0 rounded-full border transition-all ${
                      isOverdue
                        ? 'border-rose-400 hover:bg-rose-400/30'
                        : 'border-white/40 hover:border-emerald-400 hover:bg-emerald-400/20'
                    }`}
                  />
                  <span
                    className={`truncate text-xs ${
                      isOverdue ? 'font-medium text-rose-200' : 'text-white/85'
                    }`}
                  >
                    {todo.text}
                  </span>
                </div>

                {/* Overdue tag or Due date/time */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isOverdue && (
                    <span className="rounded bg-rose-500/30 px-1 py-0.2 text-[9px] font-bold text-rose-300 uppercase tracking-widest border border-rose-500/40 animate-pulse">
                      OVERDUE
                    </span>
                  )}
                  {todo.dueDate && (
                    <span
                      className={`text-[10px] ${
                        isOverdue ? 'text-rose-400 font-semibold' : 'text-white/40'
                      }`}
                    >
                      {todo.dueDate} {todo.dueTime || ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Row: Drawer & Expand Controls */}
      <div className="mt-1 flex items-center justify-between pt-1 text-[10px] text-white/40 border-t border-white/[0.04]">
        {showArchive ? (
          <button
            type="button"
            onClick={clearArchivedTodos}
            className="text-[10px] text-rose-400/70 hover:text-rose-300"
          >
            Clear Archive
          </button>
        ) : (
          <span>{isExpanded ? 'Auto-shrinks in 30s' : `${activeTodos.length} remaining`}</span>
        )}

        {/* Bottom-right corner buttons */}
        <div className="flex items-center gap-1">
          {/* Archive drawer icon toggle — DIRECTLY TO THE LEFT OF THE EXPAND BUTTON */}
          <button
            type="button"
            onClick={() => {
              setShowArchive((prev) => !prev);
              resetInactivityTimer();
            }}
            title={showArchive ? 'Show Active Tasks' : 'Open Archive Drawer'}
            aria-label="Archive Drawer"
            className={`flex size-5 items-center justify-center rounded-md transition-colors ${
              showArchive
                ? 'bg-white/20 text-white'
                : 'text-white/40 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            📁
          </button>

          {/* Expand / Collapse toggle button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded((prev) => !prev);
              resetInactivityTimer();
            }}
            title={isExpanded ? 'Collapse to compact view' : 'Expand full task list'}
            aria-label="Expand Tasks"
            className="flex size-5 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            {isExpanded ? '⤡' : '⤢'}
          </button>
        </div>
      </div>
    </div>
  );
});
