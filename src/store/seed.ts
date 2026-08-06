import type { PersistedState, Settings } from '../types';
import { SCHEMA_VERSION } from './migrate';

// Default appearance settings applied on first run and whenever the user
// resets. Accent is the magenta head of the SPEC §9 magenta→violet gradient.
export const DEFAULT_SETTINGS: Settings = {
  accentColor: '#ff2e9a',
  backgroundImage: null,
  overlayOpacity: 0.5,
  backgroundBlur: 0,
  clock24h: false,
  greetingName: '',
};

// The first-run / reset-to-seed state. This is the single seam the seed-data
// task fills from `v1-content.json` (SPEC §10); until then it is a valid empty
// deck so the store, persistence, and migration are exercisable end to end.
export function getSeedState(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    categories: [],
    subcategories: [],
    sites: [],
    quickLinks: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
