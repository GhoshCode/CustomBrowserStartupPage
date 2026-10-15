import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useStore } from '../../store';
import {
  GIT_TTL_MS,
  buildWeeks,
  cachedGitStats,
  loadGitStats,
  type ContributionDay,
  type GitStats,
  type Level,
} from '../../services/github';

// GIT COMMITS (spec §3.5): classic green contribution tiles sized to the
// widget (16–52 weeks), plus current streak, longest streak and the
// calendar-year total. With no username it shows an inline setup field.

const CELL = 9;
const GAP = 2;
const MIN_WEEKS = 16;
const MAX_WEEKS = 52;

// GitHub's greens; the --gh-* tokens switch to the light palette in light mode.
const LEVEL_BG: Record<Level, string> = {
  0: 'var(--gh-0)',
  1: 'var(--gh-1)',
  2: 'var(--gh-2)',
  3: 'var(--gh-3)',
  4: 'var(--gh-4)',
};

type State =
  | { status: 'idle' | 'loading'; stats: GitStats | null }
  | { status: 'ready'; stats: GitStats }
  | { status: 'error'; stats: GitStats | null; error: string };

export const GitWidget = memo(function GitWidget() {
  const username = useStore((s) => s.settings.githubUsername);
  const token = useStore((s) => s.settings.githubToken);
  const [state, setState] = useState<State>(() => {
    const hit = username ? cachedGitStats(username, token) : null;
    return hit ? { status: 'ready', stats: hit } : { status: 'idle', stats: null };
  });

  const refresh = useCallback(
    (force: boolean) => {
      if (!username) return;
      setState((s) => ({ status: 'loading', stats: s.stats?.username === username ? s.stats : null }));
      loadGitStats(username, token, { force })
        .then((stats) => setState({ status: 'ready', stats }))
        .catch((err: unknown) =>
          setState((s) => ({
            status: 'error',
            stats: s.stats,
            error: err instanceof Error ? err.message : 'GitHub unavailable',
          })),
        );
    },
    [username, token],
  );

  useEffect(() => {
    refresh(false);
    const timer = setInterval(() => refresh(false), GIT_TTL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  if (!username) return <GitSetup />;

  const { stats } = state;
  const error = state.status === 'error' ? state.error : null;

  return (
    <div data-testid="git-widget" className="glass flex h-full min-w-0 flex-col gap-2 px-3 pt-2.5 pb-2.5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-[11px] font-semibold tracking-[0.2em] text-white/60">GIT COMMITS</h2>
        <a
          href={`https://github.com/${username}`}
          className="truncate font-mono text-[10px] text-white/35 hover:text-white/70"
          title="Open GitHub profile"
        >
          @{username}
        </a>
        <button
          type="button"
          onClick={() => refresh(true)}
          aria-label="Refresh contributions"
          title={stats ? `Updated ${new Date(stats.fetchedAt).toLocaleTimeString()} — refresh` : 'Refresh'}
          className={`ml-auto text-xs text-white/35 hover:text-white/80 ${state.status === 'loading' ? 'animate-spin' : ''}`}
        >
          ↻
        </button>
      </div>

      <div className="flex items-baseline gap-4 font-mono">
        <Stat value={stats?.currentStreak} unit="d" label="streak" accent />
        <Stat value={stats?.longestStreak} unit="d" label="longest" />
        <Stat value={stats?.totalYear} label={`in ${new Date().getFullYear()}`} />
      </div>

      {error && !stats ? (
        <p className="text-xs text-red-300/80" role="alert">
          {error}
        </p>
      ) : (
        <Heatmap days={stats?.days ?? []} loading={!stats} />
      )}
    </div>
  );
});

function Stat({ value, unit = '', label, accent = false }: { value?: number; unit?: string; label: string; accent?: boolean }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={`text-[15px] font-bold tabular-nums ${accent ? 'text-[#39d353]' : 'text-white/90'}`}>
        {value ?? '–'}
        {value !== undefined && unit}
      </span>
      <span className="text-[9px] tracking-wider text-white/40 uppercase">{label}</span>
    </span>
  );
}

// Columns are Sunday-first weeks, newest on the right; the count of weeks
// follows the widget's width.
function Heatmap({ days, loading }: { days: readonly ContributionDay[]; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState(MIN_WEEKS);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const fit = Math.floor((el.clientWidth + GAP) / (CELL + GAP));
      setWeeks(Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, fit)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = useMemo(() => buildWeeks(days, weeks, new Date()), [days, weeks]);

  return (
    <div ref={ref} className="min-h-0 min-w-0 flex-1 overflow-hidden" aria-label="Contribution graph">
      <div className="flex justify-end" style={{ gap: GAP }}>
        {columns.map((week, i) => (
          <div key={i} className="flex flex-col" style={{ gap: GAP }}>
            {week.map((day, j) => (
              <span
                key={j}
                title={day ? `${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}` : undefined}
                className={loading ? 'animate-pulse' : undefined}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 2,
                  background: day ? LEVEL_BG[day.level] : 'transparent',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GitSetup() {
  const updateSettings = useStore((s) => s.updateSettings);
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = value.trim().replace(/^@/, '');
    if (name) updateSettings({ githubUsername: name });
  };
  return (
    <form onSubmit={submit} data-testid="git-widget" className="glass flex h-full flex-col justify-center gap-2 px-4">
      <h2 className="font-display text-[11px] font-semibold tracking-[0.2em] text-white/60">GIT COMMITS</h2>
      <p className="text-xs text-white/45">Show your contribution tiles — enter your GitHub username.</p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="username"
          aria-label="GitHub username"
          className="glass-inner min-w-0 flex-1 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white/90 outline-none placeholder:text-white/30"
        />
        <button type="submit" className="accent-gradient rounded-lg px-3 text-xs font-semibold text-white">
          Connect
        </button>
      </div>
    </form>
  );
}
