import type {
  Category,
  PersistedState,
  QuickLink,
  Settings,
  Site,
  Subcategory,
} from '../types';
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

// Built-in rotating dev quotes (SPEC §2 header — one per page load, ~20).
// The first ten are the user's real v1 quotes (`js/widgets.js`); the rest round
// the list out to twenty so the header rotation has range.
export const QUOTES: readonly string[] = [
  'Talk is cheap. Show me the code. — Linus Torvalds',
  'Programs must be written for people to read. — Harold Abelson',
  'Simplicity is the soul of efficiency. — Austin Freeman',
  'First, solve the problem. Then, write the code. — John Johnson',
  'Make it work, make it right, make it fast. — Kent Beck',
  "Code is like humor. When you have to explain it, it's bad. — Cory House",
  'The best error message is the one that never shows up. — Thomas Fuchs',
  'Deleted code is debugged code. — Jeff Sickel',
  'Weeks of coding can save you hours of planning. — Unknown',
  'It works on my machine. — Everyone, at some point',
  'Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler',
  'Premature optimization is the root of all evil. — Donald Knuth',
  'There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton',
  'Debugging is twice as hard as writing the code in the first place. — Brian Kernighan',
  'Controlling complexity is the essence of computer programming. — Brian Kernighan',
  'Good code is its own best documentation. — Steve McConnell',
  "Programming isn't about what you know; it's about what you can figure out. — Chris Pine",
  'The function of good software is to make the complex appear simple. — Grady Booch',
  'Testing leads to failure, and failure leads to understanding. — Burt Rutan',
  'Simplicity is prerequisite for reliability. — Edsger Dijkstra',
];

// ---- Declarative seed --------------------------------------------------------
// Programming carries the user's real v1 sites; the seven featured ones stay in
// the primary row, the rest sit in General, and the SPEC §10 subcategories add
// curated Frontend/Backend/AI picks. Design and Social (absent from v1) come
// wholesale from SPEC §10.

interface SeedSite {
  name: string;
  url: string;
  primary?: boolean;
}
interface SeedSub {
  name: string;
  sites: SeedSite[];
}
interface SeedCategory {
  name: string;
  color: string;
  general: SeedSite[]; // subcategoryId === null
  subs: SeedSub[];
}

const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: 'Programming',
    color: '#a78bfa',
    general: [
      { name: 'GitHub', url: 'https://github.com', primary: true },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', primary: true },
      { name: 'Hacker News', url: 'https://news.ycombinator.com/', primary: true },
      { name: 'MDN', url: 'https://developer.mozilla.org/en-US', primary: true },
      { name: 'DevDocs', url: 'https://devdocs.io', primary: true },
      { name: 'LeetCode', url: 'https://leetcode.com', primary: true },
      { name: 'Vercel', url: 'https://vercel.com', primary: true },
      { name: 'AWS', url: 'https://aws.amazon.com' },
      { name: 'ChatGPT', url: 'https://chatgpt.com' },
      { name: 'Angular', url: 'https://angular.io' },
      { name: 'Java', url: 'https://dev.java' },
      { name: 'Next.js', url: 'https://nextjs.org' },
      { name: 'PostgreSQL', url: 'https://www.postgresql.org/docs/' },
      { name: 'Python', url: 'https://docs.python.org/3/' },
      { name: 'Kaggle', url: 'https://www.kaggle.com' },
      { name: 'Jupyter', url: 'https://jupyter.org' },
    ],
    subs: [
      {
        name: 'Frontend',
        sites: [
          { name: 'React', url: 'https://react.dev' },
          { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
          { name: 'CSS-Tricks', url: 'https://css-tricks.com' },
          { name: 'web.dev', url: 'https://web.dev' },
        ],
      },
      {
        name: 'Backend',
        sites: [
          { name: 'Spring', url: 'https://spring.io' },
          { name: 'Baeldung', url: 'https://baeldung.com' },
          { name: 'MySQL', url: 'https://dev.mysql.com' },
        ],
      },
      {
        name: 'AI',
        sites: [
          { name: 'Claude', url: 'https://claude.ai' },
          { name: 'Hugging Face', url: 'https://huggingface.co' },
          { name: 'Ollama', url: 'https://ollama.com' },
        ],
      },
    ],
  },
  {
    name: 'Design',
    color: '#f472b6',
    general: [
      { name: 'Figma', url: 'https://figma.com', primary: true },
      { name: 'Dribbble', url: 'https://dribbble.com', primary: true },
    ],
    subs: [
      {
        name: 'Inspiration',
        sites: [
          { name: 'Awwwards', url: 'https://awwwards.com' },
          { name: 'Mobbin', url: 'https://mobbin.com' },
        ],
      },
      {
        name: 'Assets',
        sites: [
          { name: 'Google Fonts', url: 'https://fonts.google.com' },
          { name: 'Heroicons', url: 'https://heroicons.com' },
          { name: 'Unsplash', url: 'https://unsplash.com' },
        ],
      },
    ],
  },
  {
    name: 'Social',
    color: '#fb923c',
    general: [
      { name: 'Reddit', url: 'https://reddit.com', primary: true },
      { name: 'X', url: 'https://x.com', primary: true },
    ],
    subs: [
      {
        name: 'Dev communities',
        sites: [
          { name: 'Hacker News', url: 'https://news.ycombinator.com' },
          { name: 'DEV Community', url: 'https://dev.to' },
          { name: 'r/webdev', url: 'https://reddit.com/r/webdev' },
        ],
      },
    ],
  },
];

const SEED_QUICK_LINKS: Array<{ name: string; url: string }> = [
  { name: 'Mail', url: 'https://gmail.com' },
  { name: 'Drive', url: 'https://drive.google.com' },
  { name: 'Telegram', url: 'https://web.telegram.org' },
  { name: 'LinkedIn', url: 'https://linkedin.com' },
];

const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// The first-run / reset-to-seed state, expanded from the declarative seed above
// into the flat, explicitly-ordered SPEC §2 collections. Ids are stable slugs so
// the seed is deterministic (handy for tests and idempotent resets).
export function getSeedState(): PersistedState {
  const categories: Category[] = [];
  const subcategories: Subcategory[] = [];
  const sites: Site[] = [];

  SEED_CATEGORIES.forEach((cat, ci) => {
    const categoryId = `cat-${slug(cat.name)}`;
    categories.push({ id: categoryId, name: cat.name, color: cat.color, order: ci });

    const pushSite = (
      s: SeedSite,
      subcategoryId: string | null,
      scope: string,
      order: number,
    ) => {
      sites.push({
        id: `site-${slug(cat.name)}-${scope}-${slug(s.name)}`,
        name: s.name,
        url: s.url,
        categoryId,
        subcategoryId,
        primary: s.primary ?? false,
        order,
        visits: 0,
        lastVisited: null,
      });
    };

    cat.general.forEach((s, i) => pushSite(s, null, 'general', i));

    cat.subs.forEach((sub, sbi) => {
      const subId = `sub-${slug(cat.name)}-${slug(sub.name)}`;
      subcategories.push({ id: subId, name: sub.name, categoryId, order: sbi });
      sub.sites.forEach((s, i) => pushSite(s, subId, slug(sub.name), i));
    });
  });

  const quickLinks: QuickLink[] = SEED_QUICK_LINKS.map((q, i) => ({
    id: `ql-${slug(q.name)}`,
    name: q.name,
    url: q.url,
    order: i,
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    categories,
    subcategories,
    sites,
    quickLinks,
    settings: { ...DEFAULT_SETTINGS },
  };
}
