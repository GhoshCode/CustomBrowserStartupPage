# DevDeck — product specification (source of truth)

DevDeck is a custom browser landing page (new-tab page) for a developer. Dark,
glassy, keyboard-fast, and fully personal: the user curates categories of
sites, pins subcategories inside them, and manages everything visually —
including a mind-map sitemap with drag-and-drop. It ships as a static web app
that also loads as an unpacked Chrome extension overriding the new tab.

There is no backend, no accounts, no sync. Everything persists locally.

## 1. Tech stack (fixed)

- Vite + React (latest stable) + TypeScript in strict mode
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin
- Zustand for state, with the `persist` middleware → localStorage
- `@dnd-kit/core` + `@dnd-kit/sortable` for list drag & drop
- `@xyflow/react` (React Flow) for the mind-map sitemap
- `motion` (Framer Motion's current package) for animation
- Vitest for unit tests of store logic

## 2. Data model

Exactly ONE level of nesting: Category → Subcategory → Site. Subcategories can
never contain subcategories. All ordering is explicit via `order` fields.

```ts
interface Category {
  id: string
  name: string
  color: string        // accent hex used for the card label, pills, map nodes
  order: number
}

interface Subcategory {
  id: string
  name: string
  categoryId: string
  order: number
}

interface Site {
  id: string
  name: string
  url: string          // normalized, always with protocol
  categoryId: string
  subcategoryId: string | null   // null = lives in the category's implicit "General" group
  primary: boolean     // true = shown in the category's primary row
  order: number
  visits: number       // incremented on open
  lastVisited: number | null     // epoch ms
}

interface QuickLink { id: string; name: string; url: string; order: number }

interface Settings {
  accentColor: string
  backgroundImage: string | null  // data URL or remote URL
  overlayOpacity: number          // 0–1
  backgroundBlur: number          // px
  clock24h: boolean
  greetingName: string            // used in greetings, may be empty
}

interface PersistedState {
  schemaVersion: number           // starts at 1; bump with every schema change
  categories: Category[]
  subcategories: Subcategory[]
  sites: Site[]
  quickLinks: QuickLink[]
  settings: Settings
}
```

Store actions (minimum): CRUD for categories, subcategories, sites, and quick
links; `moveSite(siteId, categoryId, subcategoryId | null)`;
`reorder(kind, ids)`; `togglePrimary(siteId)`; `recordVisit(siteId)`;
`importState(json)`; `exportState()`; `resetToSeed()`. Deleting a subcategory
moves its sites to that category's General group; deleting a category asks for
confirmation and deletes its subcategories and sites.

A `migrate(persisted, fromVersion)` function runs on hydration. It must be
unit-tested.

## 3. Page layout (main view, top to bottom)

1. **Backdrop** — deep violet-black base with a faint, slowly drifting
   "constellation" of connected nodes and stray code glyphs (canvas or SVG,
   very low opacity, GPU-cheap, fully static when
   `prefers-reduced-motion: reduce`). An optional user background image sits
   under a dark overlay whose opacity/blur come from Settings.
2. **Header row** — left: uppercase date line in the accent color, a
   time-of-day greeting as the headline ("Late night hacking?" after 23:00,
   "Morning, {name}." etc.), and a rotating dev quote beneath it, one per
   page load, from a built-in list of ~20. Right: a large seven-segment
   digital clock (DSEG7 via the `dseg` npm package, fallback "Share Tech
   Mono"), 12/24h per Settings, ticking live.
3. **Quick links row** — pill buttons with favicon + name (Mail, Drive,
   Telegram, LinkedIn in the seed). Click opens in the same tab. Managed in
   Settings.
4. **Category grid** — responsive CSS grid of category cards: 3 columns at
   ≥1600px, 2 at ≥1100px, 1 below. Cards are equal height per row
   (~520–580px), glassy, with generous radius.
5. **Settings gear** — fixed bottom-right, opens the Settings overlay.

## 4. Category card — the core interaction

This is the heart of the app. Anatomy, top to bottom:

1. **Header** — small uppercase category label in the category color, plus a
   subtle total-site count.
2. **Primary row** — every site with `primary: true`, rendered as square-ish
   tiles (favicon large, name beneath), in a single horizontally scrolling
   row. Horizontal overflow is invited, never hidden: soft gradient fade
   masks on both edges, chevron buttons appearing on hover, and drag-to-pan
   with the pointer. Wheel + Shift also scrolls it.
3. **Pinned subcategory strip** — one pill per subcategory, in order, always
   visible (this is the "pinned" affordance), preceded by a "General" pill
   whenever ungrouped sites exist. The active pill is highlighted with an
   animated underline/background (`motion` layout animation). Clicking a
   pill smooth-scrolls the rail to that subcategory.
4. **Subcategory rail** — a horizontally scrolling row of subcategory
   cards with `scroll-snap-type: x mandatory`. Each sub-card is ~85% of the
   pane width, so the next card peeks in from the right as a scroll cue.
   Each sub-card contains its subcategory title and its own **vertically
   scrolling** site list.

**The scroll contract (must hold exactly):** with the pointer inside a
sub-card, vertical scrolling moves through that subcategory's sites;
horizontal scrolling (trackpad swipe, Shift+wheel, drag-to-pan, chevrons, or
pill clicks) surfs between subcategories. The active pill stays in sync with
the rail via an IntersectionObserver scroll-spy. When a focused card receives
←/→ arrow keys, the rail moves one subcategory.

**Site row** — favicon (see §8), name, muted domain, appearing on hover: an
open-in-new-tab icon and a drag handle. Click opens in the same tab and calls
`recordVisit`. Rows support dnd-kit reordering within their list, and a row
dragged onto a *pill* moves the site to that subcategory.

**Empty states** — a category with no sites invites adding one ("Nothing here
yet — add a site"); an empty subcategory says so inside its sub-card. Empty
states are designed, not blank.

## 5. Command palette

`Ctrl/Cmd+K` or `/` opens a centered palette: fuzzy search across every site
(match on name, domain, category, subcategory), ranked by match quality then
`visits`/`lastVisited`. ↑/↓ navigate, Enter opens, Esc closes. Each result
shows favicon, name, and its Category → Subcategory path. When nothing
matches, offer "Add '{query}' as a new site…" which jumps into the add-site
form with the query prefilled. Implement the fuzzy scorer in-house (no dep).

## 6. Settings overlay

Full-screen glass overlay (lazy-loaded chunk) with a left tab rail:

- **Library** — the whole tree as an editable list: categories with inline
  rename, color picker, delete (confirm); subcategories likewise; sites with
  edit and delete. Everything reorderable by drag. The **add-site form**
  takes a URL, auto-normalizes it, derives a default name from the domain,
  previews the favicon, and lets the user choose category, subcategory
  (or General), and a Primary toggle. Adding a site under ANY category must
  take no more than: open Settings → paste URL → pick category → save.
- **Sitemap** — the mind map, §7.
- **Quick links** — CRUD + drag reorder for the header row.
- **Appearance** — accent color, background image (URL or file → data URL),
  overlay opacity and blur sliders, 12/24h clock, greeting name. Changes
  apply live behind the overlay.
- **Data** — Export JSON (download), Import JSON (validated, migrated, with
  a summary of what will be imported), Reset to seed (confirm).

## 7. Mind-map sitemap (Settings → Sitemap)

A React Flow canvas rendering the library as a left-to-right tree, styled
like a polished roadmap mind map:

- Root node "All sites" → category nodes → subcategory nodes → site leaves.
- Category and subcategory nodes are rounded pills in the category color,
  each with a small circular **count badge** of contained sites. Site leaves
  show favicon + name.
- Edges are smooth beziers tinted by the branch's category color.
- Custom tree layout (no layout dep): compute x by depth, y by subtree size;
  re-layout animates node positions with `motion`.
- Chevron on category/subcategory nodes collapses or expands the branch.
- Pan, zoom, fit-view button, and a minimap in the corner.
- **Drag-to-reparent:** dragging a site node highlights valid drop targets
  (any category or subcategory node) using React Flow's intersection
  helpers; dropping on a subcategory moves the site there; dropping on a
  category moves it to that category's General group; releasing elsewhere
  snaps the node back. A toast confirms the move with an Undo action.
- The store is the single source of truth: map edits dispatch store actions,
  and any store change re-derives the graph.

## 8. Favicons

`Favicon` component: loads `https://www.google.com/s2/favicons?domain={host}&sz=64`,
falls back on error to a letter tile (first letter of the name on the
category color). Lazy-load off-screen favicons.

## 9. Design language

Evolve the user's existing aesthetic — do not replace it:

- Base `#0b0713` violet-black; glass cards `rgba(255,255,255,0.05)` with
  `backdrop-blur`, 1px `rgba(255,255,255,0.08)` borders, radius 24px
  (12–14px inner elements).
- Accent gradient magenta→violet (`#ff2e9a` → `#8b5cf6`) used sparingly:
  date line, active pill, focus rings, primary buttons. Each category keeps
  its own `color` for labels, pills, and map branches.
- Type: "Space Grotesk" for display (greeting, category labels), "Inter" for
  UI text, DSEG7/"Share Tech Mono" strictly for the clock. Uppercase
  letter-spaced eyebrows for labels, like the current build.
- Motion: staggered card mount on load, pill underline layout animation,
  gentle hover lifts (scale 1.02, subtle glow), spring-based — and all of it
  disabled under `prefers-reduced-motion`.
- The one showpiece is the **sitemap**; the main view stays quiet and
  disciplined so daily use never feels noisy.

## 10. Seed data (first run)

Categories: **Programming** (`#a78bfa`), **Design** (`#f472b6`), **Social**
(`#fb923c`). Quick links: Mail (gmail.com), Drive (drive.google.com),
Telegram (web.telegram.org), LinkedIn (linkedin.com).

- Programming — primary: GitHub, Stack Overflow, Hacker News, MDN, DevDocs,
  LeetCode, Vercel. Subcategories: *Frontend* (react.dev, tailwindcss.com,
  css-tricks.com, web.dev), *Backend* (spring.io, baeldung.com,
  dev.mysql.com), *AI* (claude.ai, huggingface.co, ollama.com).
- Design — primary: Figma, Dribbble. Subcategories: *Inspiration*
  (awwwards.com, mobbin.com), *Assets* (fonts.google.com, heroicons.com,
  unsplash.com).
- Social — primary: Reddit, X. Subcategory: *Dev communities*
  (news.ycombinator.com, dev.to, reddit.com/r/webdev).

## 11. Extension packaging

`public/manifest.json`, Manifest V3, with
`"chrome_url_overrides": { "newtab": "index.html" }`, name, version, and
generated icons (16/48/128). `npm run build` must produce a `dist/` that
works both served as a website and loaded via chrome://extensions → "Load
unpacked". Remote favicons must still load inside the extension.

## 12. Quality requirements

- 60fps interactions; `React.memo` on site rows; Settings and Sitemap are
  lazy chunks; no console errors or warnings.
- Keyboard: everything reachable by Tab with visible focus rings; palette
  fully keyboard-driven; Esc closes overlays.
- Degrades gracefully: long names truncate with tooltips, 50+ sites in one
  subcategory stays smooth, zero categories shows a designed onboarding
  empty state, invalid URLs are rejected with a clear message.
- Desktop-first, but nothing breaks between 1024px and ultrawide.

## 13. Non-goals

No backend, auth, sync, or telemetry. No nesting beyond one subcategory
level. No mobile layout. No browser APIs beyond what a new-tab page allows.

## 14. Acceptance checklist (final QA task runs through this)

1. Fresh load shows seed data, clock ticking, greeting matching time of day.
2. In each category: primary row scrolls horizontally with fades/chevrons.
3. Horizontal scroll in the rail snaps between subcategories; vertical
   scroll inside a sub-card scrolls only its sites; pills stay in sync and
   clicking a pill navigates.
4. Drag reorders sites; dropping a site on a pill moves it there.
5. Ctrl/Cmd+K finds any site and Enter opens it.
6. A new site can be added under any category/subcategory from Settings in
   under 10 seconds.
7. Sitemap renders the full tree with count badges; dragging a site leaf
   onto another category/subcategory moves it, main view reflects it, Undo
   reverts it.
8. Appearance changes apply live and persist across reload.
9. Export → wipe → Import restores everything byte-identical.
10. `dist/` loads as an unpacked extension and overrides the new tab.
11. Typecheck, build, and all tests pass; no console errors anywhere.
