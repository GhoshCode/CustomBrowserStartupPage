import { memo } from 'react';
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

const DroppablePill = memo(function DroppablePill({
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
      data-group-id={group.id}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(group.id)}
      className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 select-none ${
        isOver
          ? 'scale-105 bg-white/25 text-white ring-2 ring-white/60 shadow-lg'
          : isActive
          ? 'bg-white/15 text-white font-semibold ring-1 ring-white/20 shadow-md'
          : 'text-white/50 hover:bg-white/5 hover:text-white/85'
      }`}
      style={{
        boxShadow: isActive ? `0 0 12px ${categoryColor}35` : undefined,
      }}
    >
      <span className="relative z-10">{group.name}</span>
      <span
        className={`relative z-10 text-[10px] tabular-nums font-mono ${
          isActive || isOver ? 'text-white/80' : 'text-white/30'
        }`}
      >
        {group.count}
      </span>
    </button>
  );
});

export const PinnedStrip = memo(function PinnedStrip({
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
      className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.04] overflow-x-auto ultra-thin-scrollbar select-none pb-1.5"
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
});
