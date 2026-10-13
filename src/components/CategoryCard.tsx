import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Category, Site } from '../types';
import { useStore } from '../store';
import { PrimaryRow } from './PrimaryRow';
import { PinnedStrip, type GroupItem } from './PinnedStrip';
import { SubcategoryRail, type RailGroup } from './SubcategoryRail';
import { SiteRow } from './SiteRow';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard = memo(function CategoryCard({ category }: CategoryCardProps) {
  const allSites = useStore((s) => s.sites);
  const allSubcategories = useStore((s) => s.subcategories);
  const moveSite = useStore((s) => s.moveSite);
  const reorder = useStore((s) => s.reorder);

  const railRef = useRef<HTMLDivElement>(null);
  const [activeSite, setActiveSite] = useState<Site | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const categorySites = useMemo(
    () =>
      allSites
        .filter((s) => s.categoryId === category.id)
        .sort((a, b) => a.order - b.order),
    [allSites, category.id],
  );

  const subcategories = useMemo(
    () =>
      allSubcategories
        .filter((sub) => sub.categoryId === category.id)
        .sort((a, b) => a.order - b.order),
    [allSubcategories, category.id],
  );

  const primarySites = useMemo(
    () => categorySites.filter((s) => s.primary),
    [categorySites],
  );

  // Groups: "General" (sites with subcategoryId === null) + each subcategory in order
  const railGroups = useMemo<RailGroup[]>(() => {
    const generalSites: Site[] = [];
    const subcatMap = new Map<string, Site[]>();

    for (const sub of subcategories) {
      subcatMap.set(sub.id, []);
    }

    for (const site of categorySites) {
      if (!site.subcategoryId) {
        generalSites.push(site);
      } else {
        const list = subcatMap.get(site.subcategoryId);
        if (list) {
          list.push(site);
        } else {
          generalSites.push(site);
        }
      }
    }

    const groups: RailGroup[] = [];

    if (generalSites.length > 0 || subcategories.length === 0) {
      groups.push({
        id: 'general',
        name: 'General',
        sites: generalSites,
      });
    }

    for (const sub of subcategories) {
      groups.push({
        id: sub.id,
        name: sub.name,
        sites: subcatMap.get(sub.id) || [],
      });
    }

    return groups;
  }, [categorySites, subcategories]);

  const stripGroups = useMemo<GroupItem[]>(
    () =>
      railGroups.map((g) => ({
        id: g.id,
        name: g.name,
        count: g.sites.length,
      })),
    [railGroups],
  );

  const [activeGroupId, setActiveGroupId] = useState<string>(() =>
    railGroups[0]?.id ?? 'general',
  );

  const isProgrammaticScrollRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null);

  const handlePillSelect = useCallback((id: string) => {
    setActiveGroupId(id);
    const rootEl = railRef.current;
    if (!rootEl) return;
    const cardEl = rootEl.querySelector<HTMLElement>(`[data-subcategory-card-id="${id}"]`);
    if (cardEl) {
      isProgrammaticScrollRef.current = true;
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
      const targetLeft = Math.max(0, cardEl.offsetLeft - 16);
      rootEl.scrollTo({ left: targetLeft, behavior: 'smooth' });
      scrollTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        scrollTimerRef.current = null;
      }, 450);
    }
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const site = allSites.find((s) => s.id === event.active.id);
    if (site) {
      setActiveSite(site);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSite(null);

    if (!over) return;

    // Case 1: Dropped onto a Pinned Strip subcategory pill
    if (String(over.id).startsWith('droppable-pill-')) {
      const targetSubcategory = over.data.current?.subcategoryId ?? null;
      moveSite(String(active.id), category.id, targetSubcategory);
      return;
    }

    // Case 2: Reordered within the site list
    if (active.id !== over.id) {
      const activeItem = allSites.find((s) => s.id === active.id);
      const overItem = allSites.find((s) => s.id === over.id);

      if (
        activeItem &&
        overItem &&
        activeItem.categoryId === overItem.categoryId &&
        activeItem.subcategoryId === overItem.subcategoryId
      ) {
        // Group items in this subcategory/general
        const groupSites = allSites.filter(
          (s) =>
            s.categoryId === activeItem.categoryId &&
            s.subcategoryId === activeItem.subcategoryId,
        ).sort((a, b) => a.order - b.order);

        const oldIndex = groupSites.findIndex((s) => s.id === active.id);
        const newIndex = groupSites.findIndex((s) => s.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedGroup = arrayMove(groupSites, oldIndex, newIndex);
          reorder('site', reorderedGroup.map((s) => s.id));
        }
      }
    }
  };

  const totalSites = categorySites.length;

  return (
    <article
      data-category-id={category.id}
      className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:border-white/20 shadow-lg select-none"
    >
      {/* 1. Header Region: colored label + site count */}
      <header className="flex items-center justify-between px-5 pt-3.5 pb-2.5 border-b border-white/[0.06] select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2 rounded-full"
            style={{
              backgroundColor: category.color,
              boxShadow: `0 0 10px ${category.color}80`,
            }}
          />
          <h2
            className="font-display text-xs font-bold tracking-[0.2em] uppercase"
            style={{ color: category.color }}
          >
            {category.name}
          </h2>
        </div>
        <span className="text-xs font-medium text-white/40 tabular-nums">
          {totalSites} {totalSites === 1 ? 'site' : 'sites'}
        </span>
      </header>

      {totalSites === 0 ? (
        /* Empty category state per SPEC §4 */
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-white/[0.04] text-white/30">
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/60">Nothing here yet</p>
          <p className="mt-1 text-xs text-white/40">Add a site to this category in Settings</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 flex-col overflow-hidden min-h-0">
            {/* 2. Primary Row Region */}
            <PrimaryRow sites={primarySites} categoryColor={category.color} />

            {/* 3. Pinned Subcategory Strip */}
            <PinnedStrip
              categoryId={category.id}
              categoryColor={category.color}
              groups={stripGroups}
              activeId={activeGroupId}
              onSelect={handlePillSelect}
            />

            {/* 4. Subcategory Rail Region */}
            <SubcategoryRail
              groups={railGroups}
              categoryColor={category.color}
              activeId={activeGroupId}
              onActiveChange={setActiveGroupId}
              onSelectGroup={handlePillSelect}
              scrollRef={railRef}
              isProgrammaticScrollRef={isProgrammaticScrollRef}
            />

            {/* 5. Subcategory Indicator Dots */}
            {railGroups.length > 1 && (
              <div
                role="tablist"
                aria-label={`Subcategory indicator for ${category.name}`}
                className="flex items-center justify-center py-1.5 border-t border-white/[0.04] shrink-0 select-none bg-black/10"
              >
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {railGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handlePillSelect(g.id)}
                      tabIndex={-1}
                      title={`Jump to ${g.name}`}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        g.id === activeGroupId
                          ? 'w-5'
                          : 'w-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                      style={{
                        backgroundColor: g.id === activeGroupId ? category.color : undefined,
                        boxShadow: g.id === activeGroupId ? `0 0 8px ${category.color}80` : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeSite ? (
              <div className="w-64">
                <SiteRow
                  site={activeSite}
                  categoryColor={category.color}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </article>
  );
});
