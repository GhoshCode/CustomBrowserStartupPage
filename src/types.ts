// DevDeck domain model — SPEC §2. One level of nesting only:
// Category → Subcategory → Site. All ordering is explicit via `order`.

export interface Category {
  id: string;
  name: string;
  color: string; // accent hex used for the card label, pills, map nodes
  order: number;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  order: number;
}

export interface Site {
  id: string;
  name: string;
  url: string; // normalized, always with protocol
  categoryId: string;
  subcategoryId: string | null; // null = the category's implicit "General" group
  primary: boolean; // true = shown in the category's primary row
  order: number;
  visits: number; // incremented on open
  lastVisited: number | null; // epoch ms
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  order: number;
}

export type ThemeMode = 'dark' | 'light';

export interface Settings {
  accentColor: string;
  themeMode?: ThemeMode; // 'dark' | 'light'
  presetTheme?: string | null; // e.g. 'default-dark', 'default-light', 'cyberpunk', etc.
  backgroundImage: string | null; // data URL, remote URL, or css gradient
  overlayOpacity: number; // 0–1
  backgroundBlur: number; // px
  clock24h: boolean;
  greetingName: string; // used in greetings, may be empty
}


export const SCHEMA_VERSION = 1;

export interface PersistedState {
  schemaVersion: number; // starts at 1; bump with every schema change
  categories: Category[];
  subcategories: Subcategory[];
  sites: Site[];
  quickLinks: QuickLink[];
  settings: Settings;
}

// Discriminates which collection a `reorder` call targets.
export type ReorderKind = 'category' | 'subcategory' | 'site' | 'quickLink';

// Result of importing a state blob — either the applied summary or an error.
export interface ImportSummary {
  categories: number;
  subcategories: number;
  sites: number;
  quickLinks: number;
}

export type ImportResult =
  | { ok: true; summary: ImportSummary }
  | { ok: false; error: string };
