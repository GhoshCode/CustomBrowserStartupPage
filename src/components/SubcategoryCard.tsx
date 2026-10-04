import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Site } from '../types';
import { SiteRow } from './SiteRow';

interface SubcategoryCardProps {
  id: string;
  name: string;
  sites: Site[];
  categoryColor: string;
}

export function SubcategoryCard({
  id,
  name,
  sites,
  categoryColor,
}: SubcategoryCardProps) {
  const siteIds = sites.map((s) => s.id);

  return (
    <div
      data-subcategory-card-id={id}
      className="glass-inner flex h-full w-[85%] min-w-[85%] max-w-[85%] shrink-0 snap-start flex-col overflow-hidden p-3.5 transition-all duration-200"
    >
      {/* Subcategory Card Header */}
      <div className="mb-2 flex items-center justify-between border-b border-white/[0.04] pb-2 px-1 select-none">
        <h3 className="text-xs font-semibold text-white/90 truncate">
          {name}
        </h3>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/40 tabular-nums">
          {sites.length}
        </span>
      </div>

      {/* Vertically Scrolling Site List with SortableContext */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {sites.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <p className="text-xs font-medium text-white/40">No sites yet</p>
            <p className="mt-0.5 text-[10px] text-white/25">Add sites to {name}</p>
          </div>
        ) : (
          <SortableContext items={siteIds} strategy={verticalListSortingStrategy}>
            {sites.map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                categoryColor={categoryColor}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
