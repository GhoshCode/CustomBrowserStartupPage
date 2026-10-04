import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Category,
  ImportResult,
  PersistedState,
  QuickLink,
  ReorderKind,
  Settings,
  Site,
  Subcategory,
} from '../types';
import { migrate, normalizePersisted, SCHEMA_VERSION } from './migrate';
import { getSeedState } from './seed';

const STORAGE_KEY = 'devdeck';

// Stable-ish unique id. crypto.randomUUID exists in every target (browser, and
// Node/jsdom under Vitest); the suffix fallback keeps tests hermetic if not.
const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const nextOrder = (items: ReadonlyArray<{ order: number }>): number =>
  items.reduce((max, i) => (i.order > max ? i.order : max), -1) + 1;

// ---- Action input shapes (ids/order/derived fields are generated) ----------

export type NewCategory = { name: string; color: string };
export type NewSubcategory = { name: string; categoryId: string };
export type NewSite = {
  name: string;
  url: string;
  categoryId: string;
  subcategoryId: string | null;
  primary?: boolean;
};
export type NewQuickLink = { name: string; url: string };

export interface StoreActions {
  // Category CRUD
  addCategory: (input: NewCategory) => Category;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
  // Subcategory CRUD
  addSubcategory: (input: NewSubcategory) => Subcategory;
  updateSubcategory: (id: string, patch: Partial<Omit<Subcategory, 'id'>>) => void;
  deleteSubcategory: (id: string) => void;
  // Site CRUD
  addSite: (input: NewSite) => Site;
  updateSite: (id: string, patch: Partial<Omit<Site, 'id'>>) => void;
  deleteSite: (id: string) => void;
  // Quick link CRUD
  addQuickLink: (input: NewQuickLink) => QuickLink;
  updateQuickLink: (id: string, patch: Partial<Omit<QuickLink, 'id'>>) => void;
  deleteQuickLink: (id: string) => void;
  // Movement / ordering / flags
  moveSite: (siteId: string, categoryId: string, subcategoryId: string | null) => void;
  reorder: (kind: ReorderKind, ids: string[]) => void;
  togglePrimary: (siteId: string) => void;
  recordVisit: (siteId: string) => void;
  // Settings
  updateSettings: (patch: Partial<Settings>) => void;
  // Data
  importState: (json: string) => ImportResult;
  exportState: () => string;
  resetToSeed: () => void;
}

export type Store = PersistedState & StoreActions;

// Pull just the persisted slice out of the live store (used by export/persist).
const pickPersisted = (s: Store): PersistedState => ({
  schemaVersion: s.schemaVersion,
  categories: s.categories,
  subcategories: s.subcategories,
  sites: s.sites,
  quickLinks: s.quickLinks,
  settings: s.settings,
});

// Re-index `order` (0..n-1) for the items named in `ids`, preserving that
// order; items not named are left untouched.
const applyOrder = <T extends { id: string; order: number }>(
  items: T[],
  ids: string[],
): T[] => {
  const rank = new Map(ids.map((id, i) => [id, i]));
  return items.map((item) =>
    rank.has(item.id) ? { ...item, order: rank.get(item.id)! } : item,
  );
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...getSeedState(),

      // ---- Categories ----------------------------------------------------
      addCategory: ({ name, color }) => {
        const category: Category = {
          id: newId(),
          name,
          color,
          order: nextOrder(get().categories),
        };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      // Cascades: removing a category removes its subcategories and sites too.
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          subcategories: s.subcategories.filter((sc) => sc.categoryId !== id),
          sites: s.sites.filter((site) => site.categoryId !== id),
        })),

      // ---- Subcategories -------------------------------------------------
      addSubcategory: ({ name, categoryId }) => {
        const sub: Subcategory = {
          id: newId(),
          name,
          categoryId,
          order: nextOrder(get().subcategories.filter((sc) => sc.categoryId === categoryId)),
        };
        set((s) => ({ subcategories: [...s.subcategories, sub] }));
        return sub;
      },
      updateSubcategory: (id, patch) =>
        set((s) => ({
          subcategories: s.subcategories.map((sc) =>
            sc.id === id ? { ...sc, ...patch } : sc,
          ),
        })),
      // Deleting a subcategory moves its sites to the category's General group
      // (subcategoryId = null), appended after any existing General sites.
      deleteSubcategory: (id) =>
        set((s) => {
          const target = s.subcategories.find((sc) => sc.id === id);
          if (!target) return {};
          let generalTail = nextOrder(
            s.sites.filter(
              (site) => site.categoryId === target.categoryId && site.subcategoryId === null,
            ),
          );
          const sites = s.sites.map((site) =>
            site.subcategoryId === id
              ? { ...site, subcategoryId: null, order: generalTail++ }
              : site,
          );
          return {
            subcategories: s.subcategories.filter((sc) => sc.id !== id),
            sites,
          };
        }),

      // ---- Sites ---------------------------------------------------------
      addSite: ({ name, url, categoryId, subcategoryId, primary = false }) => {
        const site: Site = {
          id: newId(),
          name,
          url,
          categoryId,
          subcategoryId,
          primary,
          order: nextOrder(
            get().sites.filter(
              (s) => s.categoryId === categoryId && s.subcategoryId === subcategoryId,
            ),
          ),
          visits: 0,
          lastVisited: null,
        };
        set((s) => ({ sites: [...s.sites, site] }));
        return site;
      },
      updateSite: (id, patch) =>
        set((s) => ({
          sites: s.sites.map((site) => (site.id === id ? { ...site, ...patch } : site)),
        })),
      deleteSite: (id) => set((s) => ({ sites: s.sites.filter((site) => site.id !== id) })),

      // ---- Quick links ---------------------------------------------------
      addQuickLink: ({ name, url }) => {
        const link: QuickLink = {
          id: newId(),
          name,
          url,
          order: nextOrder(get().quickLinks),
        };
        set((s) => ({ quickLinks: [...s.quickLinks, link] }));
        return link;
      },
      updateQuickLink: (id, patch) =>
        set((s) => ({
          quickLinks: s.quickLinks.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        })),
      deleteQuickLink: (id) =>
        set((s) => ({ quickLinks: s.quickLinks.filter((q) => q.id !== id) })),

      // ---- Movement / ordering / flags -----------------------------------
      // Move a site to a new category/subcategory, appended at the tail of the
      // destination group so it lands predictably.
      moveSite: (siteId, categoryId, subcategoryId) =>
        set((s) => {
          const order = nextOrder(
            s.sites.filter(
              (site) => site.categoryId === categoryId && site.subcategoryId === subcategoryId,
            ),
          );
          return {
            sites: s.sites.map((site) =>
              site.id === siteId ? { ...site, categoryId, subcategoryId, order } : site,
            ),
          };
        }),
      reorder: (kind, ids) =>
        set((s) => {
          switch (kind) {
            case 'category':
              return { categories: applyOrder(s.categories, ids) };
            case 'subcategory':
              return { subcategories: applyOrder(s.subcategories, ids) };
            case 'site':
              return { sites: applyOrder(s.sites, ids) };
            case 'quickLink':
              return { quickLinks: applyOrder(s.quickLinks, ids) };
            default:
              return {};
          }
        }),
      togglePrimary: (siteId) =>
        set((s) => ({
          sites: s.sites.map((site) =>
            site.id === siteId ? { ...site, primary: !site.primary } : site,
          ),
        })),
      recordVisit: (siteId) =>
        set((s) => ({
          sites: s.sites.map((site) =>
            site.id === siteId
              ? { ...site, visits: site.visits + 1, lastVisited: Date.now() }
              : site,
          ),
        })),

      // ---- Settings ------------------------------------------------------
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ---- Data ----------------------------------------------------------
      importState: (json) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(json);
        } catch {
          return { ok: false, error: 'File is not valid JSON.' };
        }
        if (!parsed || typeof parsed !== 'object') {
          return { ok: false, error: 'File does not contain a DevDeck backup.' };
        }
        const record = parsed as Record<string, unknown>;
        if (!Array.isArray(record.categories) || !Array.isArray(record.sites)) {
          return { ok: false, error: 'Backup is missing its categories or sites.' };
        }
        const fromVersion =
          typeof record.schemaVersion === 'number' ? record.schemaVersion : 0;
        const next = migrate(record, fromVersion);
        set(() => ({ ...next }));
        return {
          ok: true,
          summary: {
            categories: next.categories.length,
            subcategories: next.subcategories.length,
            sites: next.sites.length,
            quickLinks: next.quickLinks.length,
          },
        };
      },
      exportState: () => JSON.stringify(pickPersisted(get()), null, 2),
      resetToSeed: () => set(() => ({ ...getSeedState() })),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      // Persist only the data slice — never the action functions.
      partialize: (s): PersistedState => pickPersisted(s),
      migrate: (persisted, version) => migrate(persisted, version),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') {
          return current;
        }
        const p = normalizePersisted(persisted);
        const obj = persisted as Record<string, unknown>;
        return {
          ...current,
          ...p,
          categories:
            Array.isArray(obj.categories) && obj.categories.length > 0
              ? p.categories
              : current.categories,
          subcategories:
            Array.isArray(obj.subcategories) && obj.subcategories.length > 0
              ? p.subcategories
              : current.subcategories,
          sites:
            Array.isArray(obj.sites) && obj.sites.length > 0
              ? p.sites
              : current.sites,
          quickLinks:
            Array.isArray(obj.quickLinks) && obj.quickLinks.length > 0
              ? p.quickLinks
              : current.quickLinks,
          settings: { ...current.settings, ...p.settings },
        };
      },
    },
  ),
);
