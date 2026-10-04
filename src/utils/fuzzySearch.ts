import type { Category, Site, Subcategory } from '../types';

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

    let domain = '';
    try {
      domain = new URL(site.url).hostname.replace(/^www\./, '');
    } catch {
      domain = site.url;
    }

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
