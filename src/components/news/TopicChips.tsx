import { memo } from 'react';
import { useStore } from '../../store';

export const TopicChips = memo(function TopicChips() {
  const topicChips = useStore((s) => s.topicChips);
  const enabledTopics = useStore((s) => s.settings.enabledTopics ?? []);
  const toggleTopicChip = useStore((s) => s.toggleTopicChip);

  return (
    <div className="glass rounded-2xl border border-white/10 p-2.5 backdrop-blur-xl shrink-0">
      <div className="flex items-center justify-between pb-1.5 px-1 border-b border-white/[0.04] mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
          FILTER CHIPS (J)
        </span>
        <span className="text-[9px] text-cyan-400 font-mono">
          {enabledTopics.length} Active
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {topicChips.map((chip) => {
          const isActive = enabledTopics.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => toggleTopicChip(chip.id)}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold tracking-tight transition-all border ${
                isActive
                  ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                  : 'border-white/5 bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
              }`}
            >
              <span className="text-[10px] opacity-70">#</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
