import type { Category, Site, Subcategory } from './types';

// --- URL & Domain Utilities --------------------------------------------------

/**
 * Normalizes user-input URL strings by ensuring an https:// protocol prefix and trimmed whitespace.
 */
export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Extracts a clean hostname from a URL, stripping 'www.'.
 */
export function getHostname(rawUrl: string): string {
  try {
    const normalized = normalizeUrl(rawUrl);
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

/**
 * Derives a readable site name from a URL domain (e.g. "https://github.com/..." -> "Github").
 */
export function deriveNameFromUrl(rawUrl: string): string {
  try {
    const host = getHostname(rawUrl);
    const part = host.split('.')[0] || '';
    if (!part) return '';
    return part.charAt(0).toUpperCase() + part.slice(1);
  } catch {
    return '';
  }
}

// --- Fuzzy Search Utilities --------------------------------------------------

export interface ScoredSite {
  site: Site;
  category: Category;
  subcategory: Subcategory | null;
  score: number;
}

/**
 * In-house fuzzy scorer without external dependencies.
 * Matches `pattern` against `target`. Returns score >= 0 if match, -1 if no match.
 * Higher score = better match.
 */
export function fuzzyMatch(pattern: string, target: string): number {
  const p = pattern.toLowerCase().trim();
  const t = target.toLowerCase();

  if (!p) return 0;
  if (t === p) return 1000;
  if (t.startsWith(p)) return 800 + (100 - Math.min(t.length, 90));

  const subIndex = t.indexOf(p);
  if (subIndex !== -1) {
    // Exact substring match bonus, penalized by distance from start
    return 600 - subIndex * 2;
  }

  // Subsequence matching with word-boundary and consecutive character bonuses
  let score = 0;
  let pIdx = 0;
  let prevMatchIdx = -2;

  for (let tIdx = 0; tIdx < t.length && pIdx < p.length; tIdx++) {
    if (t[tIdx] === p[pIdx]) {
      score += 10;
      // Consecutive characters bonus
      if (tIdx === prevMatchIdx + 1) {
        score += 25;
      }
      // Word boundary bonus (start of word or after delimiter)
      if (tIdx === 0 || /[\s\-_./]/.test(t[tIdx - 1])) {
        score += 35;
      }
      prevMatchIdx = tIdx;
      pIdx++;
    }
  }

  if (pIdx === p.length) {
    // All characters of pattern were found in sequence
    return score;
  }

  return -1;
}

export function searchSites(
  query: string,
  sites: Site[],
  categories: Category[],
  subcategories: Subcategory[],
): ScoredSite[] {
  const trimmed = query.trim();
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const subMap = new Map(subcategories.map((s) => [s.id, s]));

  const scored: ScoredSite[] = [];

  for (const site of sites) {
    const category = catMap.get(site.categoryId);
    if (!category) continue;
    const subcategory = site.subcategoryId ? subMap.get(site.subcategoryId) ?? null : null;

    const domain = getHostname(site.url);

    if (!trimmed) {
      // Empty query: rank by recent visits / popularity
      const recencyBonus = site.lastVisited
        ? Math.max(0, 100 - Math.floor((Date.now() - site.lastVisited) / (1000 * 60 * 60 * 24)))
        : 0;
      const score = (site.visits || 0) * 10 + recencyBonus;
      scored.push({ site, category, subcategory, score });
      continue;
    }

    const nameScore = fuzzyMatch(trimmed, site.name);
    const domainScore = fuzzyMatch(trimmed, domain);
    const catScore = fuzzyMatch(trimmed, category.name);
    const subScore = subcategory ? fuzzyMatch(trimmed, subcategory.name) : -1;

    const maxMatchScore = Math.max(
      nameScore * 1.5,
      domainScore * 1.2,
      catScore * 0.9,
      subScore * 0.9,
    );

    if (maxMatchScore > 0) {
      // Secondary sort bonus based on visits and lastVisited
      const visitsBonus = Math.min(site.visits * 2, 50);
      const recencyBonus = site.lastVisited && Date.now() - site.lastVisited < 86400000 ? 20 : 0;
      const totalScore = maxMatchScore + visitsBonus + recencyBonus;

      scored.push({
        site,
        category,
        subcategory,
        score: totalScore,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Ensures category accent colors have sufficient contrast against light mode surfaces (WCAG AAA).
 */
export function getCategoryDisplayColor(hex: string, isLight: boolean): string {
  if (!isLight || !hex) return hex;
  const map: Record<string, string> = {
    '#fbbf24': '#b45309', // yellow -> deep amber
    '#38bdf8': '#0284c7', // light sky -> ocean blue
    '#4ade80': '#15803d', // neon green -> forest green
    '#f472b6': '#be185d', // light pink -> ruby rose
    '#a78bfa': '#6d28d9', // lavender -> deep purple
    '#fb923c': '#c2410c', // peach orange -> rich orange
    '#22d3ee': '#0e7490', // cyan -> deep teal
    '#e879f9': '#a21caf', // light fuchsia -> rich fuchsia
    '#818cf8': '#4338ca', // periwinkle -> deep indigo
    '#f87171': '#b91c1c', // salmon red -> crimson red
    '#34d399': '#047857', // mint -> emerald
    '#60a5fa': '#1d4ed8', // light blue -> royal blue
    '#94a3b8': '#334155', // slate -> dark slate
  };
  return map[hex.toLowerCase()] || hex;
}
