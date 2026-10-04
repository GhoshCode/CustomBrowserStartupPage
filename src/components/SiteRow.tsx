import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Site } from '../types';
import { useStore } from '../store';
import { Favicon } from './Favicon';

interface SiteRowProps {
  site: Site;
  categoryColor: string;
  isOverlay?: boolean;
}

export const SiteRow = React.memo(function SiteRow({
  site,
  categoryColor,
  isOverlay = false,
}: SiteRowProps) {
  const recordVisit = useStore((s) => s.recordVisit);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: site.id,
    data: { type: 'site', site },
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  let hostname = '';
  try {
    hostname = new URL(site.url).hostname.replace(/^www\./, '');
  } catch {
    hostname = site.url;
  }

  const handleClick = () => {
    recordVisit(site.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-site-id={site.id}
      className={`group/site flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 ${
        isOverlay
          ? 'glass-inner bg-white/10 shadow-2xl border-white/20'
          : 'hover:bg-white/[0.07] hover:border-white/10'
      }`}
    >
      <a
        href={site.url}
        onClick={handleClick}
        className="flex min-w-0 flex-1 items-center gap-2.5 focus-visible:outline-none"
      >
        <Favicon
          url={site.url}
          name={site.name}
          categoryColor={categoryColor}
          className="size-5"
        />
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span
            title={site.name}
            className="truncate text-xs font-medium text-white/85 group-hover/site:text-white"
          >
            {site.name}
          </span>
          <span
            title={site.url}
            className="truncate text-[10px] text-white/35 group-hover/site:text-white/50"
          >
            {hostname}
          </span>
        </div>
      </a>

      {/* Hover actions: open in new tab & drag handle */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/site:opacity-100 focus-within:opacity-100">
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          title="Open in new tab"
          aria-label={`Open ${site.name} in new tab`}
          className="flex size-6 items-center justify-center rounded text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h4a.75.75 0 010 1.5h-4z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M6.19 13.81a.75.75 0 001.06 0l7.25-7.25v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69L6.19 12.75a.75.75 0 000 1.06z"
              clipRule="evenodd"
            />
          </svg>
        </a>

        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${site.name}`}
          className="flex size-6 cursor-grab active:cursor-grabbing items-center justify-center rounded text-white/30 hover:text-white/70"
        >
          <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zM13 2a2 2 0 100 4 2 2 0 000-4zM13 8a2 2 0 100 4 2 2 0 000-4zM13 14a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </button>
      </div>
    </div>
  );
});
