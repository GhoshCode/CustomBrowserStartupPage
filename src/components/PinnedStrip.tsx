import { useDroppable } from '@dnd-kit/core';
import { motion } from 'motion/react';

export interface GroupItem {
  id: string;
  name: string;
  count: number;
}

interface PinnedStripProps {
  categoryId: string;
  categoryColor: string;
  groups: GroupItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

interface DroppablePillProps {
  group: GroupItem;
  isActive: boolean;
  categoryId: string;
  categoryColor: string;
  onSelect: (id: string) => void;
}

function DroppablePill({
  group,
  isActive,
  categoryId,
  categoryColor,
  onSelect,
}: DroppablePillProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-pill-${group.id}`,
    data: {
      type: 'pill',
      subcategoryId: group.id === 'general' ? null : group.id,
      categoryId,
    },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(group.id)}
      className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
        isOver
          ? 'scale-105 bg-white/20 text-white ring-2 ring-white/50 shadow-lg'
          : isActive
          ? 'text-white'
          : 'text-white/50 hover:text-white/80'
      }`}
    >
      {isActive && !isOver && (
        <motion.div
          layoutId={`active-pill-${categoryId}`}
          className="absolute inset-0 rounded-full bg-white/10 border border-white/10"
          style={{
            boxShadow: `0 0 12px ${categoryColor}30`,
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{group.name}</span>
      <span
        className={`relative z-10 text-[10px] tabular-nums ${
          isActive || isOver ? 'text-white/70' : 'text-white/30'
        }`}
      >
        {group.count}
      </span>
    </button>
  );
}

export function PinnedStrip({
  categoryId,
  categoryColor,
  groups,
  activeId,
  onSelect,
}: PinnedStripProps) {
  if (groups.length <= 1) return null;

  return (
    <nav
      aria-label="Subcategory groups"
      className="shrink-0 flex items-center gap-1.5 px-6 py-2.5 border-b border-white/[0.04] overflow-x-auto scrollbar-none select-none"
    >
      {groups.map((group) => (
        <DroppablePill
          key={group.id}
          group={group}
          isActive={group.id === activeId}
          categoryId={categoryId}
          categoryColor={categoryColor}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}
