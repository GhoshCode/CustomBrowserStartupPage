import type {
  Category,
  PersistedState,
  QuickLink,
  Settings,
  Site,
  Subcategory,
} from '../types';
import { DEFAULT_SETTINGS } from './seed';

// The persisted schema version. Bump this with every schema change and add a
// version-stepping transform inside `migrate` in the same commit (PROMPT rule).
export const SCHEMA_VERSION = 1;

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};

const toArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// Coerce any (possibly partial or foreign) blob into a structurally valid
// current-schema state, backfilling settings from defaults. Lenient by design:
// used both by `migrate` and by import to guarantee a usable shape downstream.
export function normalizePersisted(input: unknown): PersistedState {
  const obj = asRecord(input);
  const settings = asRecord(obj.settings) as Partial<Settings>;
  return {
    schemaVersion: SCHEMA_VERSION,
    categories: toArray<Category>(obj.categories),
    subcategories: toArray<Subcategory>(obj.subcategories),
    sites: toArray<Site>(obj.sites),
    quickLinks: toArray<QuickLink>(obj.quickLinks),
    settings: { ...DEFAULT_SETTINGS, ...settings },
  };
}

/**
 * Runs on hydration to bring an older persisted blob up to `SCHEMA_VERSION`.
 *
 * When the schema changes, add version-stepping transforms here BEFORE
 * normalization, e.g.:
 *   if (fromVersion < 2) obj = renameFooToBar(obj);
 * Each step should assume the shape produced by the previous version.
 * Normalization then fills any remaining gaps and stamps the current version.
 */
export function migrate(persisted: unknown, fromVersion: number): PersistedState {
  // No historical versions to step through yet; `fromVersion` is threaded so
  // the transform chain above has it available the moment the schema evolves.
  void fromVersion;
  return normalizePersisted(persisted);
}
