import { memo, useState } from 'react';
import { useStore } from '../../store';

export const TopicChips = memo(function TopicChips() {
  const topicChips = useStore((s) => s.topicChips);
  const enabledTopics = useStore((s) => s.settings.enabledTopics ?? []);
  const toggleTopicChip = useStore((s) => s.toggleTopicChip);
  const addTopicChip = useStore((s) => s.addTopicChip);
  const deleteTopicChip = useStore((s) => s.deleteTopicChip);

  const [isAdding, setIsAdding] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagLabel.trim()) return;
    addTopicChip(newTagLabel.trim());
    setNewTagLabel('');
    setIsAdding(false);
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-3 backdrop-blur-xl shrink-0 select-none">
      <div className="flex items-center justify-between pb-1.5 px-0.5 border-b border-white/[0.04] mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
            FILTER TOPICS
          </span>
          <span className="text-[9px] text-cyan-400 font-mono font-semibold">
            ({enabledTopics.length} active)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          title="Add custom topic / tag filter"
          className="text-[10px] font-semibold text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-0.5 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20"
        >
          <span>+</span>
          <span>Add Tag</span>
        </button>
      </div>

      {/* Inline Add Tag Input */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-2 flex items-center gap-1">
          <input
            type="text"
            value={newTagLabel}
            onChange={(e) => setNewTagLabel(e.target.value)}
            placeholder="Tag name (e.g. Docker, Next.js)..."
            className="flex-1 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white placeholder-white/35 focus:outline-none focus:border-cyan-400"
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
            onClick={() => setIsAdding(false)}
            className="rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50 hover:bg-white/10"
          >
            ✕
          </button>
        </form>
      )}

      {/* Chips list */}
      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5">
        {topicChips.map((chip) => {
          const isActive = enabledTopics.includes(chip.id);
          return (
            <div
              key={chip.id}
              className={`group flex items-center rounded-xl text-xs font-semibold tracking-tight transition-all border ${
                isActive
                  ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                  : 'border-white/5 bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTopicChip(chip.id)}
                className="flex items-center gap-1 px-2 py-1 focus:outline-none"
              >
                <span className="text-[10px] opacity-70">#</span>
                <span>{chip.label}</span>
              </button>

              {/* Delete chip button on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTopicChip(chip.id);
                }}
                title={`Delete #${chip.label}`}
                className="size-4 mr-1 flex items-center justify-center rounded-full text-white/30 hover:bg-rose-500/20 hover:text-rose-300 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
