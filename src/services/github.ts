// GIT COMMITS widget data (spec §3.5). The public REST API has no contribution
// calendar, so:
//   • no token  → github-contributions-api.jogruber.de (public, CORS-open,
//                 scrapes the profile calendar; public contributions only)
//   • PAT given → GitHub GraphQL contributionsCollection (includes private
//                 contributions when the user has that profile setting on)

import { readCache, writeCache } from '../lib/cache';
import { localDateKey } from '../lib/time';

export type Level = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string; // 'YYYY-MM-DD'
  count: number;
  level: Level;
}

export interface GitStats {
  username: string;
  days: ContributionDay[]; // ascending, ~1 year
  totalYear: number; // current calendar year
  currentStreak: number;
  longestStreak: number;
  fetchedAt: number;
}

export const GIT_TTL_MS = 60 * 60 * 1000; // plan Phase 1: cached for 1 hour
const CACHE_NAME = 'github';

type Fetch = typeof fetch;

const toLevel = (n: unknown): Level => (n === 1 || n === 2 || n === 3 || n === 4 ? n : 0);

async function fetchPublic(username: string, fetcher: Fetch): Promise<ContributionDay[]> {
  const res = await fetcher(
    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
  );
  if (res.status === 404) throw new Error(`GitHub user "${username}" not found`);
  if (!res.ok) throw new Error(`Contributions request failed (${res.status})`);
  const json = (await res.json()) as { contributions?: Array<{ date: string; count: number; level: number }> };
  if (!Array.isArray(json.contributions)) throw new Error('Unexpected contributions response');
  return json.contributions.map((d) => ({ date: d.date, count: d.count, level: toLevel(d.level) }));
}

const GRAPHQL_LEVEL: Record<string, Level> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

async function fetchWithToken(username: string, token: string, fetcher: Fetch): Promise<ContributionDay[]> {
  const query = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
    weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;
  const res = await fetcher('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (res.status === 401) throw new Error('GitHub token was rejected');
  if (!res.ok) throw new Error(`GitHub GraphQL request failed (${res.status})`);
  const json = (await res.json()) as {
    errors?: Array<{ message: string }>;
    data?: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: string }> }>;
          };
        };
      } | null;
    };
  };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  const user = json.data?.user;
  if (!user) throw new Error(`GitHub user "${username}" not found`);
  return user.contributionsCollection.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: GRAPHQL_LEVEL[d.contributionLevel] ?? 0,
    })),
  );
}

const shiftDay = (key: string, delta: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  return localDateKey(new Date(y, m - 1, d + delta));
};
const nextDayKey = (key: string) => shiftDay(key, 1);
const prevDayKey = (key: string) => shiftDay(key, -1);

// Streaks follow GitHub's convention: an empty *today* doesn't break the
// current streak (the day isn't over yet), but an empty yesterday does.
export function computeStats(
  username: string,
  input: readonly ContributionDay[],
  now = new Date(),
): GitStats {
  const todayKey = localDateKey(now);
  // Drop future days the calendar may pad the last week with.
  const days = [...input].filter((d) => d.date <= todayKey).sort((a, b) => a.date.localeCompare(b.date));
  const year = String(now.getFullYear());

  // Runs need consecutive *dates*, not just consecutive entries — a gap in the
  // data must not join two streaks.
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    const contiguous = prev !== null && nextDayKey(prev) === d.date;
    run = d.count > 0 ? (contiguous ? run + 1 : 1) : 0;
    longest = Math.max(longest, run);
    prev = d.date;
  }

  let current = 0;
  let expected = todayKey;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.date !== expected) {
      // Today may simply be missing from the data; anything older is a gap.
      if (expected === todayKey && d.date === prevDayKey(todayKey)) expected = d.date;
      else break;
    }
    if (d.count > 0) current++;
    else if (d.date !== todayKey) break;
    expected = prevDayKey(d.date);
  }

  return {
    username,
    days,
    totalYear: days.filter((d) => d.date.startsWith(year)).reduce((sum, d) => sum + d.count, 0),
    currentStreak: current,
    longestStreak: longest,
    fetchedAt: now.getTime(),
  };
}

const cacheKey = (username: string, token: string) => `${username.toLowerCase()}|${token ? 'pat' : 'public'}`;

export function cachedGitStats(username: string, token: string): GitStats | null {
  return readCache<GitStats>(CACHE_NAME, cacheKey(username, token), GIT_TTL_MS);
}

export async function loadGitStats(
  username: string,
  token: string,
  opts: { force?: boolean; fetcher?: Fetch } = {},
): Promise<GitStats> {
  const user = username.trim();
  if (!user) throw new Error('Set your GitHub username in Settings → Profile');
  if (!opts.force) {
    const hit = cachedGitStats(user, token);
    if (hit) return hit;
  }
  const fetcher = opts.fetcher ?? fetch;
  const days = token ? await fetchWithToken(user, token, fetcher) : await fetchPublic(user, fetcher);
  const stats = computeStats(user, days);
  writeCache(CACHE_NAME, cacheKey(user, token), stats);
  return stats;
}

// The last `count` Sunday-first weeks ending with the week containing `today`,
// oldest first. Days after today are null; days without data are level 0.
export function buildWeeks(
  days: readonly ContributionDay[],
  count: number,
  today: Date,
): Array<Array<ContributionDay | null>> {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const todayKey = localDateKey(today);
  const firstSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - (count - 1) * 7);
  return Array.from({ length: count }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = localDateKey(
        new Date(firstSunday.getFullYear(), firstSunday.getMonth(), firstSunday.getDate() + w * 7 + d),
      );
      if (key > todayKey) return null;
      return byDate.get(key) ?? { date: key, count: 0, level: 0 };
    }),
  );
}
