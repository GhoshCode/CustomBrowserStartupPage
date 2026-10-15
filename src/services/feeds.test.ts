import { beforeEach, describe, expect, test } from 'vitest';
import type { FeedSource, Topic } from '../types';
import { fetchSource, loadFeeds, matchesTopic, parseFeedXml, selectPanel, type FeedItem } from './feeds';

const src = (kind: FeedSource['kind'], category: FeedSource['category'] = 'news'): FeedSource => ({
  id: `s-${kind}`,
  name: kind.toUpperCase(),
  kind,
  url: `https://example.com/${kind}`,
  category,
  enabled: true,
});
const json = (body: unknown, ok = true) =>
  (async () => ({ ok, status: ok ? 200 : 503, json: async () => body, text: async () => String(body) })) as unknown as typeof fetch;

describe('adapters', () => {
  test('hn uses the story URL, falling back to the discussion', async () => {
    const items = await fetchSource(
      src('hn'),
      json({ hits: [{ objectID: '1', title: 'A', url: 'https://a.dev', created_at_i: 1_700_000_000, points: 9 }, { objectID: '2', title: 'Ask HN', created_at_i: 1 }] }),
    );
    expect(items[0]).toMatchObject({ id: 's-hn:1', url: 'https://a.dev', publishedAt: 1_700_000_000_000, meta: '9 pts' });
    expect(items[1].url).toBe('https://news.ycombinator.com/item?id=2');
  });

  test('hnjobs extracts the company', async () => {
    const [job] = await fetchSource(src('hnjobs', 'jobs'), json({ hits: [{ objectID: '3', title: 'Acme (YC W24) Is Hiring a Staff Engineer', created_at_i: 1 }] }));
    expect(job.meta).toBe('Acme (YC W24)');
  });

  test('remoteok skips the legal-notice element', async () => {
    const items = await fetchSource(
      src('remoteok', 'jobs'),
      json([{ legal: 'terms' }, { id: 7, position: 'Rust Engineer', company: 'Oxide', url: 'https://r.ok/7', tags: ['rust'], epoch: 10 }]),
    );
    expect(items).toEqual([
      expect.objectContaining({ title: 'Rust Engineer', meta: 'Oxide', tags: ['rust'], publishedAt: 10_000 }),
    ]);
  });

  test('remotive and devto map their fields', async () => {
    const [job] = await fetchSource(src('remotive', 'jobs'), json({ jobs: [{ id: 1, title: 'FE Dev', url: 'u', company_name: ' Linear ', tags: ['react'], publication_date: '2026-10-11T20:17:27' }] }));
    expect(job).toMatchObject({ title: 'FE Dev', meta: 'Linear', tags: ['react'] });
    const [post] = await fetchSource(src('devto'), json([{ id: 5, title: 'Hooks', url: 'd', tag_list: ['react'], published_at: '2026-10-14T12:03:29Z' }]));
    expect(post).toMatchObject({ id: 's-devto:5', tags: ['react'], publishedAt: Date.parse('2026-10-14T12:03:29Z') });
  });
});

test('parseFeedXml reads RSS items and Atom entries', () => {
  const rss = `<rss><channel><item><title>One</title><link>https://x/1</link><pubDate>Wed, 14 Oct 2026 10:00:00 GMT</pubDate><category>AI</category></item></channel></rss>`;
  expect(parseFeedXml(rss, src('rss'))[0]).toMatchObject({ title: 'One', url: 'https://x/1', tags: ['AI'] });
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Two</title><link href="https://x/2"/><id>tag:2</id><updated>2026-10-14T10:00:00Z</updated></entry></feed>`;
  expect(parseFeedXml(atom, src('rss'))[0]).toMatchObject({ id: 's-rss:tag:2', title: 'Two', url: 'https://x/2' });
  expect(() => parseFeedXml('<<nope', src('rss'))).toThrow('not a valid');
});

describe('matchesTopic', () => {
  const ai: Topic = { id: 't', label: 'AI', query: 'ai, machine learning' };
  test.each([
    ['AI agents are here', true],
    ['New machine learning compiler', true],
    ['Fixing email deliverability', false],
    ['Said the CEO', false],
  ])('%s → %s', (title, expected) => {
    expect(matchesTopic({ title, tags: [] }, ai)).toBe(expected);
  });
  test('tags count and no topic matches everything', () => {
    expect(matchesTopic({ title: 'Weekly', tags: ['ai'] }, ai)).toBe(true);
    expect(matchesTopic({ title: 'Anything', tags: [] }, null)).toBe(true);
  });
});

test('selectPanel filters by category and topic, sorts newest first, de-duplicates URLs', () => {
  const item = (id: string, over: Partial<FeedItem>): FeedItem => ({
    id, title: id, url: `https://${id}`, source: 'S', category: 'news', tags: [], publishedAt: 0, ...over,
  });
  const items = [
    item('old', { publishedAt: 1 }),
    item('new', { publishedAt: 3 }),
    item('dup', { publishedAt: 2, url: 'https://new' }),
    item('job', { category: 'jobs', publishedAt: 9 }),
  ];
  expect(selectPanel(items, 'news', null, 4).map((i) => i.id)).toEqual(['new', 'old']);
  expect(selectPanel(items, 'jobs', null, 4).map((i) => i.id)).toEqual(['job']);
});

describe('loadFeeds', () => {
  beforeEach(() => localStorage.clear());
  test('one failing source does not hide the others', async () => {
    const fetcher = (async (url: string) =>
      url.includes('devto')
        ? { ok: false, status: 503, json: async () => ({}) }
        : { ok: true, status: 200, json: async () => ({ hits: [{ objectID: '1', title: 'A', url: 'https://a', created_at_i: 1 }] }) }) as unknown as typeof fetch;
    const res = await loadFeeds([src('hn'), src('devto')], { fetcher });
    expect(res.items).toHaveLength(1);
    expect(res.errors[0]).toMatch(/^DEVTO: example.com responded 503/);
  });
});
