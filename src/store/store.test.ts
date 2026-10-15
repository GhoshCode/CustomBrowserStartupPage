import { beforeEach, describe, expect, test } from 'vitest';
import type { Site } from '../types';
import { useStore, migrate, normalizePersisted, SCHEMA_VERSION } from './store';
import { DEFAULT_SETTINGS } from './seed';

const st = () => useStore.getState();
const site = (over: Partial<Site> & Pick<Site, 'id'>): Site => ({
  name: over.id.toUpperCase(),
  url: `https://${over.id}.com`,
  categoryId: 'c1',
  subcategoryId: null,
  primary: false,
  order: 0,
  visits: 0,
  lastVisited: null,
  ...over,
});

// A small, fully controlled fixture so assertions are exact:
//   c1 ▸ s1(A primary?, B primary) , s2 , General(C)
//   c2 ▸ General(D)
beforeEach(() => {
  useStore.setState({
    schemaVersion: SCHEMA_VERSION,
    categories: [
      { id: 'c1', name: 'Cat One', color: '#a78bfa', order: 0 },
      { id: 'c2', name: 'Cat Two', color: '#f472b6', order: 1 },
    ],
    subcategories: [
      { id: 's1', name: 'Sub One', categoryId: 'c1', order: 0 },
      { id: 's2', name: 'Sub Two', categoryId: 'c1', order: 1 },
    ],
    sites: [
      site({ id: 'a', categoryId: 'c1', subcategoryId: 's1', order: 0 }),
      site({ id: 'b', categoryId: 'c1', subcategoryId: 's1', primary: true, order: 1 }),
      site({ id: 'c', categoryId: 'c1', subcategoryId: null, order: 0 }),
      site({ id: 'd', categoryId: 'c2', subcategoryId: null, order: 0 }),
    ],
    quickLinks: [
      { id: 'q1', name: 'One', url: 'https://one.com', order: 0 },
      { id: 'q2', name: 'Two', url: 'https://two.com', order: 1 },
    ],
    settings: { ...DEFAULT_SETTINGS },
  });
});

const byId = (id: string) => st().sites.find((x) => x.id === id)!;

describe('moveSite', () => {
  test('relocates a site and appends it at the tail of the destination group', () => {
    st().moveSite('a', 'c2', null); // into c2 General, which already has D(order 0)
    const a = byId('a');
    expect(a.categoryId).toBe('c2');
    expect(a.subcategoryId).toBeNull();
    expect(a.order).toBe(1); // tail after D
    // other sites untouched
    expect(byId('d').order).toBe(0);
  });

  test('can move a General site into a subcategory', () => {
    st().moveSite('c', 'c1', 's1'); // s1 has A(0), B(1) → C lands at 2
    const c = byId('c');
    expect(c.subcategoryId).toBe('s1');
    expect(c.order).toBe(2);
  });
});

describe('reorder', () => {
  test('re-indexes only the ids passed, preserving their given order', () => {
    st().reorder('site', ['b', 'a']); // flip within s1
    expect(byId('b').order).toBe(0);
    expect(byId('a').order).toBe(1);
    // sites not named keep their order
    expect(byId('c').order).toBe(0);
    expect(byId('d').order).toBe(0);
  });

  test('reorders categories', () => {
    st().reorder('category', ['c2', 'c1']);
    expect(st().categories.find((c) => c.id === 'c2')!.order).toBe(0);
    expect(st().categories.find((c) => c.id === 'c1')!.order).toBe(1);
  });

  test('reorders quick links', () => {
    st().reorder('quickLink', ['q2', 'q1']);
    expect(st().quickLinks.find((q) => q.id === 'q2')!.order).toBe(0);
    expect(st().quickLinks.find((q) => q.id === 'q1')!.order).toBe(1);
  });
});

describe('delete cascades', () => {
  test('deleting a category removes its subcategories and sites', () => {
    st().deleteCategory('c1');
    expect(st().categories.map((c) => c.id)).toEqual(['c2']);
    expect(st().subcategories).toHaveLength(0); // s1, s2 gone
    expect(st().sites.map((s) => s.id)).toEqual(['d']); // a, b, c gone
  });

  test('deleting a subcategory moves its sites to General, appended after existing', () => {
    st().deleteSubcategory('s1');
    expect(st().subcategories.map((s) => s.id)).toEqual(['s2']);
    const a = byId('a');
    const b = byId('b');
    expect(a.subcategoryId).toBeNull();
    expect(b.subcategoryId).toBeNull();
    expect(a.categoryId).toBe('c1');
    // C already occupied General order 0 → A and B appended at 1 and 2
    expect([a.order, b.order].sort()).toEqual([1, 2]);
    // primary flag survives the move
    expect(b.primary).toBe(true);
  });
});

describe('togglePrimary', () => {
  test('flips the primary flag both ways', () => {
    expect(byId('a').primary).toBe(false);
    st().togglePrimary('a');
    expect(byId('a').primary).toBe(true);
    st().togglePrimary('a');
    expect(byId('a').primary).toBe(false);
  });
});

describe('recordVisit', () => {
  test('increments visits and stamps lastVisited', () => {
    const before = Date.now();
    st().recordVisit('a');
    const a = byId('a');
    expect(a.visits).toBe(1);
    expect(a.lastVisited).not.toBeNull();
    expect(a.lastVisited!).toBeGreaterThanOrEqual(before);
  });
});

describe('migrate', () => {
  test('normalizes an empty blob to a valid current-schema state', () => {
    const out = migrate({}, 0);
    expect(out.schemaVersion).toBe(SCHEMA_VERSION);
    expect(out.categories).toEqual([]);
    expect(out.subcategories).toEqual([]);
    expect(out.sites).toEqual([]);
    expect(out.quickLinks).toEqual([]);
    expect(out.settings).toEqual(DEFAULT_SETTINGS);
  });

  test('preserves provided collections and backfills missing settings', () => {
    const out = migrate(
      {
        categories: [{ id: 'x', name: 'X', color: '#fff', order: 0 }],
        settings: { clock24h: true },
      },
      0,
    );
    expect(out.categories).toHaveLength(1);
    expect(out.settings.clock24h).toBe(true); // provided
    expect(out.settings.accentColor).toBe(DEFAULT_SETTINGS.accentColor); // defaulted
    expect(out.settings.overlayOpacity).toBe(DEFAULT_SETTINGS.overlayOpacity);
  });

  test('coerces garbage input into a safe empty state', () => {
    expect(normalizePersisted(null).categories).toEqual([]);
    expect(normalizePersisted('nope').sites).toEqual([]);
    // non-array collection fields are discarded, not trusted
    expect(normalizePersisted({ sites: 'oops' }).sites).toEqual([]);
  });
});

describe('export / import roundtrip', () => {
  test('exportState → importState restores the same data', () => {
    const json = st().exportState();
    // wreck the live state
    st().deleteCategory('c1');
    st().deleteCategory('c2');
    expect(st().sites).toHaveLength(0);

    const result = st().importState(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({
        categories: 2,
        subcategories: 2,
        sites: 4,
        quickLinks: 2,
        todos: 0,
        processingSites: 0,
      });
    }
    expect(st().sites.map((s) => s.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(st().categories).toHaveLength(2);
  });

  test('importState rejects non-JSON and malformed payloads', () => {
    expect(st().importState('{not json')).toEqual({
      ok: false,
      error: 'File is not valid JSON.',
    });
    const bad = st().importState(JSON.stringify({ categories: [] })); // no sites array
    expect(bad.ok).toBe(false);
  });
});

describe('category single-pin behavior', () => {
  beforeEach(() => {
    st().resetToSeed();
  });

  test('pinning a category gives it order 0 and unpins all other categories', () => {
    const cats = st().categories;
    const catToPin = cats[2];
    st().togglePinCategory(catToPin.id);

    const updated = st().categories;
    const pinned = updated.find((c) => c.id === catToPin.id);
    expect(pinned?.isPinned).toBe(true);
    expect(pinned?.order).toBe(0);

    const otherPinned = updated.filter((c) => c.id !== catToPin.id && c.isPinned);
    expect(otherPinned).toHaveLength(0);

    // Pinning another category unpins the previous one
    const nextCat = updated[3];
    st().togglePinCategory(nextCat.id);

    const updated2 = st().categories;
    expect(updated2.find((c) => c.id === catToPin.id)?.isPinned).toBe(false);
    expect(updated2.find((c) => c.id === nextCat.id)?.isPinned).toBe(true);
    expect(updated2.find((c) => c.id === nextCat.id)?.order).toBe(0);
  });

  test('unpinning a pinned category toggles isPinned to false', () => {
    const cat = st().categories[0];
    st().togglePinCategory(cat.id);
    expect(st().categories.find((c) => c.id === cat.id)?.isPinned).toBe(true);

    st().togglePinCategory(cat.id);
    expect(st().categories.find((c) => c.id === cat.id)?.isPinned).toBe(false);
  });
});

describe('to-dos CRUD and overdue logic', () => {
  beforeEach(() => {
    st().resetToSeed();
  });

  test('adds and toggles a to-do item', () => {
    const item = st().addTodo({ text: 'Review PR #42', priority: 'urgent' });
    expect(item.text).toBe('Review PR #42');
    expect(item.completed).toBe(false);
    expect(item.archived).toBe(false);
    expect(item.priority).toBe('urgent');

    st().toggleTodo(item.id);
    const toggled = st().todos.find((t) => t.id === item.id);
    expect(toggled?.completed).toBe(true);
    expect(toggled?.completedAt).toBeTypeOf('number');

    st().archiveTodo(item.id);
    expect(st().todos.find((t) => t.id === item.id)?.archived).toBe(true);
  });

  test('computes overdue status correctly', () => {
    // Past date
    const overdueItem = st().addTodo({
      text: 'Submit patch',
      dueDate: '2020-01-01',
      dueTime: '12:00',
    });
    expect(overdueItem.isOverdue).toBe(true);

    // Future date
    const futureItem = st().addTodo({
      text: 'Future release',
      dueDate: '2099-01-01',
      dueTime: '12:00',
    });
    expect(futureItem.isOverdue).toBe(false);
  });
});

describe('processing sites and topic chips', () => {
  beforeEach(() => {
    st().resetToSeed();
  });

  test('adds and deletes a processing site', () => {
    const ps = st().addProcessingSite({
      name: 'Batch Worker',
      url: 'https://worker.internal/batch',
      schedule: {
        enabled: true,
        frequency: 'daily',
        daysOfWeek: [1, 2, 3, 4, 5],
        timeOfDay: '09:00',
      },
    });
    expect(st().processingSites.find((p) => p.id === ps.id)).toBeDefined();

    st().deleteProcessingSite(ps.id);
    expect(st().processingSites.find((p) => p.id === ps.id)).toBeUndefined();
  });

  test('toggles topic chip in settings.enabledTopics', () => {
    const topicId = 'topic-cloud';
    const initialEnabled = st().settings.enabledTopics.includes(topicId);

    st().toggleTopicChip(topicId);
    expect(st().settings.enabledTopics.includes(topicId)).toBe(!initialEnabled);

    st().toggleTopicChip(topicId);
    expect(st().settings.enabledTopics.includes(topicId)).toBe(initialEnabled);
  });

  test('adds and deletes custom topic chips', () => {
    const newChip = st().addTopicChip('Kubernetes', 'k8s');
    expect(newChip.label).toBe('Kubernetes');
    expect(newChip.tagQuery).toBe('k8s');
    expect(st().topicChips.find((t) => t.id === newChip.id)).toBeDefined();
    expect(st().settings.enabledTopics.includes(newChip.id)).toBe(true);

    st().deleteTopicChip(newChip.id);
    expect(st().topicChips.find((t) => t.id === newChip.id)).toBeUndefined();
    expect(st().settings.enabledTopics.includes(newChip.id)).toBe(false);
  });
});

describe('resetToSeed', () => {
  test('replaces state with the seed deck', () => {
    st().resetToSeed();
    // seed has 10+ categories (13 total) and 200+ sites (336 total)
    expect(st().categories.length).toBeGreaterThanOrEqual(10);
    expect(st().sites.length).toBeGreaterThanOrEqual(200);
    expect(st().topicChips.length).toBeGreaterThanOrEqual(5);
  });
});


