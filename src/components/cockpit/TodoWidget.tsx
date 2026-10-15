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
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // 30-second inactivity timer for auto-shrink when expanded
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isExpanded) {
      timerRef.current = setTimeout(() => {
        setIsExpanded(false);
        setShowArchive(false);
        setShowScheduleModal(false);
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
    setShowScheduleModal(false);
    resetInactivityTimer();
  };

  // Helper date shortcuts
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setNewDate(d.toISOString().split('T')[0]);
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
    : [...overdueTodos, ...normalTodos].slice(0, 2);

  return (
    <div data-testid="todo-widget-slot" className="relative h-[142px] w-full">
      <div
        data-testid="todo-widget-inner"
        onMouseMove={resetInactivityTimer}
        onKeyDown={resetInactivityTimer}
        className={`glass group flex flex-col justify-between overflow-hidden p-3 transition-all duration-300 ${
          isExpanded
            ? 'absolute top-0 left-0 right-0 z-50 h-[390px] bg-[#0d0718]/98 shadow-[0_24px_64px_rgba(0,0,0,0.85)] backdrop-blur-2xl border border-white/25 rounded-2xl'
            : 'h-[142px] w-full rounded-2xl border border-white/10 hover:border-white/15'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-rose-400">✓</span>
            <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
              {showArchive ? 'ARCHIVED TASKS' : 'TASKS / TO-DO'}
            </span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-semibold text-white/70">
              {showArchive ? archivedTodos.length : activeTodos.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Visual Calendar & Clock trigger button */}
            <button
              type="button"
              onClick={() => {
                setShowScheduleModal((prev) => {
                  const next = !prev;
                  if (next) setIsExpanded(true);
                  return next;
                });
                resetInactivityTimer();
              }}
              title="Attach Due Date (Calendar 📅) & Time (Clock 🕒)"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                newDate || newTime || showScheduleModal
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                  : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span>📅</span>
              <span className="text-[9px]">
                {newDate ? `${newDate.slice(5)} ${newTime || ''}` : 'Due'}
              </span>
            </button>

            {/* Expand / Collapse toggle */}
            <button
              type="button"
              onClick={() => {
                setIsExpanded((prev) => !prev);
                resetInactivityTimer();
              }}
              title={isExpanded ? 'Collapse' : 'Expand full task list'}
              aria-label="Expand Tasks"
              className="flex size-5 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              {isExpanded ? '⤡' : '⤢'}
            </button>
          </div>
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleAdd} className="mt-1 flex items-center gap-1.5 shrink-0">
          <input
            type="text"
            value={newText}
            onChange={(e) => {
              setNewText(e.target.value);
              resetInactivityTimer();
            }}
            placeholder="Add new task..."
            className="w-full min-w-0 rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-rose-400/50 border border-white/[0.07]"
          />
          <button
            type="submit"
            className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/25 text-rose-200 hover:bg-rose-500/40 text-xs font-bold border border-rose-500/40 transition-colors"
          >
            +
          </button>
        </form>

        {/* Visual Calendar & Clock Popover / Drawer */}
        {showScheduleModal && (
          <div data-testid="todo-schedule-drawer" className="my-1 rounded-xl border border-rose-500/30 bg-[#160a1e] p-2.5 shadow-2xl backdrop-blur-2xl space-y-2 z-20 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-rose-300">
              <span className="flex items-center gap-1">
                <span>📅 Due Date</span> & <span>🕒 Clock Time</span>
              </span>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Visual Date & Time Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-white/50 block">Calendar</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-white/50 block">Clock</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[9px] text-white/40 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className="rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-[9px] text-white/80"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-[9px] text-white/80"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(3)}
                className="rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-[9px] text-white/80"
              >
                +3 Days
              </button>
              <button
                type="button"
                onClick={() => setNewTime('09:00')}
                className="rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-[9px] text-rose-300"
              >
                09:00 AM
              </button>
              <button
                type="button"
                onClick={() => setNewTime('18:00')}
                className="rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-[9px] text-rose-300"
              >
                06:00 PM
              </button>
            </div>
          </div>
        )}

        {/* Task Items List / Empty State */}
        <div className="my-1 flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col justify-center">
          {showArchive ? (
            archivedTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-2 text-center text-white/40 select-none">
                <span className="text-xs">📁</span>
                <span className="text-[11px] mt-0.5">Archive is empty</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {archivedTodos.map((todo) => (
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
                ))}
              </div>
            )
          ) : visibleList.length === 0 ? (
            /* Clear & Visible Empty State Message */
            <div className="flex flex-1 flex-col items-center justify-center py-1 text-center select-none">
              <span className="text-sm">🎯</span>
              <p className="text-xs font-semibold text-white/90 mt-0.5">All tasks completed!</p>
              <p className="text-[10px] text-white/50">Free to code or add next item</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {visibleList.map((todo) => {
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
                          className={`text-[9px] font-mono ${
                            isOverdue ? 'text-rose-400 font-semibold' : 'text-white/40'
                          }`}
                        >
                          {todo.dueDate.slice(5)} {todo.dueTime || ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Status & Controls */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-white/40 border-t border-white/[0.04] shrink-0">
          {showArchive ? (
            <button
              type="button"
              onClick={clearArchivedTodos}
              className="text-[10px] text-rose-400/80 hover:text-rose-300 font-medium"
            >
              Clear Archive
            </button>
          ) : (
            <span>
              {isExpanded
                ? 'Auto-shrinks in 30s'
                : activeTodos.length > 0
                ? `${activeTodos.length} remaining`
                : 'Zero pending'}
            </span>
          )}

          {/* Archive drawer toggle */}
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
        </div>
      </div>
    </div>
  );
});
