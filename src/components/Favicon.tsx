import { memo, useState } from 'react';
import { getHostname } from '../utils';

interface FaviconProps {
  url: string;
  name: string;
  categoryColor?: string;
  className?: string;
}

export const Favicon = memo(function Favicon({
  url,
  name,
  categoryColor = '#a78bfa',
  className = 'size-6',
}: FaviconProps) {
  const [hasError, setHasError] = useState(false);
  const domain = getHostname(url);
  const initial = (name.trim()[0] || '?').toUpperCase();

  if (hasError || !domain) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded font-display text-xs font-bold text-white shadow-sm shrink-0`}
        style={{ backgroundColor: categoryColor }}
        aria-hidden="true"
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      className={`${className} rounded-sm object-contain shrink-0`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
});
