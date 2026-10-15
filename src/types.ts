// DevDeck domain model — SPEC §2. One level of nesting only:
// Category → Subcategory → Site. All ordering is explicit via `order`.

export type ClockStyle = 'dseg7' | 'cyberpunk' | 'macos';

export interface Category {
  id: string;
  name: string;
  color: string; // accent hex used for the card label, pills, map nodes
  order: number;
  isPinned?: boolean; // Exactly ONE category card may be pinned at a time
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

export interface TodoItem {
  id: string;
  text: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  dueTimestamp?: number; // epoch ms
  isOverdue: boolean; // computed: now > dueTimestamp
  completed: boolean;
  completedAt?: number | null;
  archived: boolean;
  priority?: 'low' | 'normal' | 'urgent';
  order: number;
}

export interface ProcessingSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'custom';
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  timeOfDay?: string; // HH:mm
  startMonthYear?: string; // YYYY-MM
  endMonthYear?: string; // YYYY-MM
}

export interface ProcessingSite {
  id: string;
  name: string;
  url: string;
  icon?: string;
  notes?: string;
  schedule: ProcessingSchedule;
  order: number;
}

export interface WeatherData {
  temperature: number; // Celsius
  conditionCode: number;
  conditionText: string;
  city: string;
  postalCode?: string;
  uvIndex: number;
  uvRisk: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
  lastUpdated: number;
}

export interface GitContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitStats {
  username: string;
  totalCommitsYear: number;
  currentStreak: number;
  longestStreak: number;
  contributions: GitContributionDay[];
  lastFetched: number;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: 'HackerNews' | 'Dev.to' | 'GitHub' | 'RemoteOK';
  category: 'tech' | 'job' | 'trending';
  tags: string[];
  publishedAt: number;
}

export interface TopicChip {
  id: string;
  label: string; // e.g. "AI"
  tagQuery: string; // e.g. "ai,llm"
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

  // v2 Additions
  clockStyle: ClockStyle;
  showSeconds: boolean;
  githubUsername: string;
  githubToken?: string;
  weatherEnabled: boolean;
  useGeolocation: boolean;
  manualCityName?: string;
  searchEngine: 'google' | 'duckduckgo' | 'github' | 'perplexity';
  autoQuickLinkCount: number; // default 6
  recentLinkCount: number; // default 8
  enabledTopics: string[]; // ids of TopicChip
}

export const SCHEMA_VERSION = 2;

export interface PersistedState {
  schemaVersion: number; // 2
  categories: Category[];
  subcategories: Subcategory[];
  sites: Site[];
  quickLinks: QuickLink[];
  todos: TodoItem[];
  processingSites: ProcessingSite[];
  topicChips: TopicChip[];
  settings: Settings;
}

// Discriminates which collection a `reorder` call targets.
export type ReorderKind =
  | 'category'
  | 'subcategory'
  | 'site'
  | 'quickLink'
  | 'todo'
  | 'processingSite';

// Result of importing a state blob — either the applied summary or an error.
export interface ImportSummary {
  categories: number;
  subcategories: number;
  sites: number;
  quickLinks: number;
  todos?: number;
  processingSites?: number;
}

export type ImportResult =
  | { ok: true; summary: ImportSummary }
  | { ok: false; error: string };

