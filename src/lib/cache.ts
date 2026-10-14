// Tiny TTL cache over localStorage for network-backed widgets (weather, GitHub,
// feeds). Kept outside the Zustand store on purpose: caches are not deck data,
// are never exported, and must not bloat the persisted blob.

const PREFIX = 'devdeck:cache:';

interface Entry<T> {
  at: number; // epoch ms when stored
  key: string; // what the value was fetched for (e.g. username, coordinates)
  value: T;
}

export function readCache<T>(name: string, key: string, ttlMs: number, now = Date.now()): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (entry.key !== key || now - entry.at > ttlMs) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(name: string, key: string, value: T, now = Date.now()): void {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify({ at: now, key, value } satisfies Entry<T>));
  } catch {
    // Quota or privacy mode — the widget just refetches next time.
  }
}

export function clearCache(name: string): void {
  try {
    localStorage.removeItem(PREFIX + name);
  } catch {
    // ignore
  }
}
