# DevDeck build journal

Newest entries first. Each iteration appends its own.

---

## 2026-08-07 — Phase 0: Store unit tests (Phase 0 COMPLETE)

**Task:** Vitest unit tests for store logic (moveSite, reorder, delete cascades, togglePrimary, migrate).

### What was built

- `src/store/store.test.ts` — 15 tests over a small controlled fixture
  (c1 ▸ s1[A, B-primary], s2, General[C]; c2 ▸ General[D]; 2 quick links):
  - **moveSite** — relocation + tail-append ordering, and General→subcategory.
  - **reorder** — re-indexes only the named ids (sites within a list,
    categories, quick links); unnamed items keep their order.
  - **delete cascades** — `deleteCategory` drops its subcategories + sites;
    `deleteSubcategory` moves sites to General appended after existing, primary
    flag preserved.
  - **togglePrimary**, **recordVisit**.
  - **migrate / normalizePersisted** — empty→valid, preserves collections +
    backfills settings, coerces garbage (null / string / non-array fields).
  - **export/import roundtrip** (SPEC §14 #9) + import rejection of bad JSON /
    missing sites array; **resetToSeed** yields the three SPEC categories.
- Tests drive the real `useStore` singleton, resetting it via
  `useStore.setState(...)` in `beforeEach` (persist/localStorage no-ops fine
  under jsdom).

### Verify

- `npm run typecheck` ✓, `npm run build` ✓, `npx vitest run` → **15 passed**.

### Phase 0 is now fully checked. Next: Phase 1 — Shell.

- **First up: Backdrop (SPEC §3.1)** — constellation of connected nodes + stray
  code glyphs, very low opacity, GPU-cheap; **fully static under
  `prefers-reduced-motion: reduce`**. Optional user background image beneath a
  dark overlay whose opacity/blur read from `settings` (backgroundImage,
  overlayOpacity, backgroundBlur). All state via `useStore` — never touch
  localStorage in components.
- Store API is ready for the shell: `useStore()` selectors for
  categories/subcategories/sites/quickLinks/settings, plus every action. Seed
  auto-loads on first run through persist. `QUOTES` is exported from the store
  barrel for the header.
- **Dev server** (reused this session on :5173): preview spawner can't resolve
  npm/node (PATH). Start via Bash `export PATH="/c/Users/GhoshCode/AppData/Local/nvm/nodejs:$PATH"`
  then `node node_modules/vite/bin/vite.js --port 5173 --strictPort` (background),
  attach with `preview_start {url:'http://localhost:5173/'}`. The browser pane
  can't screenshot unless displayed — verify via `javascript_tool` computed
  styles + `read_console_messages` instead.

## 2026-08-07 — Phase 0: Design token layer

**Task:** SPEC §9 token layer — Tailwind theme, CSS variables, fonts, glass utilities.

### What was built

- Installed **`dseg`** (the one dep this task's checkbox implies) for the
  seven-segment clock face.
- `src/styles/fonts.css` — self-hosted `@font-face` for `DSEG7` (400 + 700)
  sourcing the package's `DSEG7-Classic` woff2/woff via relative
  `../../node_modules/dseg/...` paths. Vite fingerprints and copies them into
  `dist/assets/` (confirmed: 4 files emitted). Self-hosting means the clock works
  offline / in the packaged extension.
- `src/index.css` — Google Fonts `@import` for **Space Grotesk** + **Inter**
  (Google Fonts is fine here; only `dseg` is a permitted local dep), then
  `@import 'tailwindcss'`, then the token layer:
  - `@theme` tokens → Tailwind utilities: surfaces (`--color-base` #0b0713,
    `--color-base-elevated`, `--color-glass`, `--color-glass-strong`,
    `--color-glass-border`), accent (`--color-accent` #ff2e9a,
    `--color-accent-2` #8b5cf6), category ref colors, fonts
    (`--font-display/-sans/-clock`), radii (`--radius-card` 24px,
    `--radius-inner` 13px).
  - `@layer base` — body background/color/font, full-height html/body/#root,
    quiet dark scrollbars.
  - `@utility` classes: `glass`, `glass-inner`, `accent-gradient`,
    `text-gradient`.
- `App.tsx` — dropped the inline hex (body now provides the base) and uses
  `font-display` + `text-gradient` so the root legitimately exercises the tokens.

### Gotchas / notes for later

- **Live accent theming:** utilities compile to `var(--color-accent)`. The
  Appearance task should set `--color-accent` (and `-2`) on
  `document.documentElement.style` so every accent utility updates live — no
  separate mirror var needed.
- **Tailwind v4 tree-shakes theme vars:** a `--font-*`/`--color-*` token only
  appears on `:root` once some utility references it. `--font-clock` reads empty
  until the clock component uses `font-clock` — that's expected, not a bug. The
  DSEG7 `@font-face` still loads fine when `font-family: 'DSEG7'` is applied.
- **Extension CSP (Phase 7):** Google Fonts loads over the network. When writing
  the MV3 manifest, either allow `fonts.googleapis.com`/`fonts.gstatic.com` in
  the CSP or self-host Inter/Space Grotesk. DSEG7 is already local.
- Glass utilities bake in radius (`glass` = card 24px, `glass-inner` = 13px);
  compose the rest with Tailwind utilities.

### Verify

- `npm run typecheck` ✓, `npm run build` ✓ (DSEG7 woff2/woff in dist/assets).
- **Browser (dev server 5173):** body bg `rgb(11,7,19)`; body font Inter; `glass`
  computes fill `rgba(255,255,255,0.05)`, 1px `rgba(255,255,255,0.08)` border,
  24px radius, `blur(16px) saturate(1.3)`; `text-gradient` h1 →
  `linear-gradient(120deg,#ff2e9a,#8b5cf6)` with transparent fill; **all four
  faces load** (DSEG7 400+700, Inter, Space Grotesk); **zero console errors**.

### For the next iteration (Phase 1 — Backdrop, SPEC §3.1)

- Constellation of connected nodes + stray code glyphs, very low opacity,
  GPU-cheap, **fully static under `prefers-reduced-motion: reduce`**. Optional
  user background image under a dark overlay whose opacity/blur come from
  Settings (`settings.backgroundImage/overlayOpacity/backgroundBlur`).
- **Dev server:** the preview spawner can't resolve `npm`/`node` (PATH captured
  before nvm). Start Vite via Bash with
  `export PATH="/c/Users/GhoshCode/AppData/Local/nvm/nodejs:$PATH"` then
  `node node_modules/vite/bin/vite.js --port 5173 --strictPort` (run in
  background), and `preview_start {url:'http://localhost:5173/'}` to attach.
  This session left that server running on :5173.

## 2026-08-07 — Phase 0: Seed data module

**Task:** Build the first-run seed from `v1-content.json`, filling gaps from SPEC §10.

### What was built

- Filled `getSeedState()` in `src/store/seed.ts` from a declarative
  `SEED_CATEGORIES` structure, expanded into the flat, explicitly-ordered
  SPEC §2 collections. Also added the `QUOTES` built-in list (exported from the
  store barrel) for the Phase 1 header.
- **First-run wiring is already done:** the seed flows through the store's
  persist initial state (from the previous task), so no store changes were
  needed — a fresh browser (empty localStorage) hydrates to this seed; existing
  users keep their persisted data.

### Reconciliation decision (v1 real data vs SPEC §10)

- SPEC §10's Programming primary list (GitHub, Stack Overflow, Hacker News, MDN,
  DevDocs, LeetCode, Vercel) is exactly the first 7 of the user's real v1 sites —
  SPEC §10 was clearly derived from v1. So: those 7 are `primary: true` in
  Programming's **General** group; the remaining 9 real v1 sites (AWS, ChatGPT,
  Angular, Java, Next.js, PostgreSQL, Python, Kaggle, Jupyter) stay in General so
  none of the user's real data is dropped; React (17th v1 site) moved into the
  new **Frontend** subcategory. Frontend/Backend/AI subcategory picks come from
  SPEC §10. **Design and Social** (absent from v1) are seeded wholesale from
  SPEC §10.
- **primary is orthogonal to grouping** (SPEC §4): a `primary` site still has a
  `subcategoryId` (here `null` = General), so it shows in BOTH the primary row
  and its General list. That is intended, not a bug — don't "dedupe" it.

### Counts (for reference)

- 3 categories, 6 subcategories, 38 sites (13 primary), 4 quick links, 20 quotes.
- Seed ids are stable slugs (`cat-…`, `sub-…-…`, `site-…-…-…`, `ql-…`) →
  deterministic seed, idempotent `resetToSeed`. Verified unique + referentially
  valid via a throwaway vitest spec (removed after passing).

### Verify

- `npm run typecheck` ✓, `npm run build` ✓. Not yet rendered (App is still the
  scaffold placeholder) so nothing visual to check this iteration — the Phase 1
  shell tasks surface it.

### For the next iteration (Design token layer — Phase 0)

- SPEC §9: Tailwind `@theme` tokens + CSS variables, fonts (Space Grotesk, Inter
  for UI, DSEG7 via the `dseg` npm package for the clock), glass utility classes.
  Base `#0b0713`, glass `rgba(255,255,255,0.05)` + blur + 1px
  `rgba(255,255,255,0.08)` border, radius 24px. Accent gradient `#ff2e9a` →
  `#8b5cf6`. `dseg` is the ONE dependency that task's checkbox implies — its font
  is needed by the clock; add it then.
- The store-logic **vitest test task** is still pending (Phase 0, last item):
  cover moveSite, reorder, delete cascades (category → subs+sites; subcategory →
  sites to General), togglePrimary, migrate.

## 2026-08-07 — Phase 0: Types + Zustand store

**Task:** Define all SPEC §2 types and the persisted Zustand store (schemaVersion 1, migrate scaffold, every store action).

### What was built

- `src/types.ts` — the SPEC §2 domain model verbatim (`Category`,
  `Subcategory`, `Site`, `QuickLink`, `Settings`, `PersistedState`) plus helper
  types `ReorderKind`, `ImportSummary`, `ImportResult`.
- `src/store/migrate.ts` — `SCHEMA_VERSION = 1`; pure `migrate(persisted,
  fromVersion)` scaffold that documents where version-stepping transforms go and
  delegates to `normalizePersisted` (lenient coercion → valid current-schema
  state, settings backfilled from defaults). Both exported for the later test task.
- `src/store/seed.ts` — `DEFAULT_SETTINGS` and `getSeedState()`. **Seam for the
  next task:** currently returns a valid EMPTY deck; the seed-data task fills
  `getSeedState()` from `v1-content.json`. First-run seed falls out of persist's
  initial state, so wiring the real seed there needs no store changes.
- `src/store/store.ts` — `useStore` (zustand `create` + `persist`). All SPEC §2
  actions: CRUD for categories/subcategories/sites/quickLinks, `moveSite`,
  `reorder(kind, ids)`, `togglePrimary`, `recordVisit`, `importState`,
  `exportState`, `resetToSeed`, plus `updateSettings` (needed by Appearance).
- `src/store/index.ts` — barrel re-exporting the hook, action input types, and
  migrate/seed helpers.

### Decisions / behavior notes for later iterations

- **Delete cascades (SPEC §2):** `deleteCategory` removes its subcategories AND
  sites. `deleteSubcategory` moves its sites to that category's General group
  (`subcategoryId: null`), appended after existing General sites. Confirmation
  dialogs are a UI concern — the store just performs the cascade.
- **`reorder`** re-indexes `order` to 0..n-1 for exactly the ids passed,
  preserving their array order; unnamed items are untouched. Callers pass one
  scoped list at a time (a subcategory's sites, one category's subcategories,
  etc.). `order` is only ever compared within a scope.
- **`addSite`/`moveSite`** append at the tail of the destination group.
  `togglePrimary` only flips the flag (primary row sorts by the same `order`).
- **`importState(json)`** parses → shallow-validates (`categories` & `sites`
  must be arrays) → `migrate` → replaces state; returns
  `{ ok, summary | error }`. `exportState()` returns pretty JSON of the
  persisted slice only.
- **persist config:** `name: 'devdeck'`, `version: SCHEMA_VERSION`,
  `partialize` persists only the data slice (never action fns), `migrate` wired
  to the pure fn, custom `merge` deep-merges `settings` so a persisted blob
  missing a newly added setting still gets its default.
- **ids:** `crypto.randomUUID()` with a string fallback — works in browser and
  under Vitest/jsdom (Node 22).
- **Components must never touch localStorage** — everything routes through
  `useStore` (PROMPT rule). Settings live-apply via `updateSettings`.

### Verify

- `npm run typecheck` ✓, `npm run build` ✓. The store is not imported by `App`
  yet, so it is tree-shaken from the current bundle (JS size unchanged) — it is
  the foundation later phases consume, not dead code.

### For the next iteration (Seed data module)

- Fill `getSeedState()` in `src/store/seed.ts` from `v1-content.json`
  (Programming + its 17 sites, quick links, accent) and complete Design/Social
  from SPEC §10. Generate `order` sequentially; ids via any stable scheme.
  Nothing else in the store needs to change — first-run seeding already flows
  through persist's initial state.
- Node/PATH gotcha still applies for Bash: prefix
  `export PATH="/c/Users/GhoshCode/AppData/Local/nvm/nodejs:$PATH"`.

## 2026-08-07 — Phase 0: Scaffold

**Task:** Scaffold Vite + React + TS strict + Tailwind v4 + SPEC §1 deps, non-interactively.

### What was built

- Wrote config directly (no interactive scaffolder): `package.json` (scripts
  `dev`/`build`/`preview`/`typecheck`/`test`), `vite.config.ts`,
  `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`,
  `src/vite-env.d.ts`.
- Installed SPEC §1 stack. Resolved versions (cutting-edge — note for later):
  React **19.2**, Vite **8.2**, TypeScript **7.0**, Vitest **4.1**,
  Tailwind **4.3** (`@tailwindcss/vite`), Zustand **5**, `@dnd-kit/core` 6 +
  `sortable` 10 + `utilities` 3, `@xyflow/react` 12, `motion` **13**, jsdom 30.
- `vite.config.ts` sets `base: './'` (relative asset URLs so one `dist/` works
  as website AND unpacked extension, SPEC §11) and a Vitest block
  (`environment: 'jsdom'`, `globals: true`).
- `tsconfig.json` is strict + `noUnusedLocals/Parameters`, `verbatimModuleSyntax`
  (use `import type` for type-only imports), `isolatedModules`, `noEmit`.
- `src/index.css` is just `@import "tailwindcss";` — the token layer
  (`@theme`, fonts, glass utilities) is a later Phase 0 task.
- `App.tsx` is a minimal real app root (violet-black backdrop + DevDeck eyebrow),
  a placeholder-free shell the Phase 1 tasks replace.

### Verify

- `npm run typecheck` ✓ (exit 0), `npm run build` ✓ (dist: 191 KB JS / 60 KB gz).
- Visual: dev server at http://localhost:5173 renders, Tailwind applied
  (`font-semibold` → weight 600), **zero console errors**.

### For the next iteration (Types + Zustand store)

- **Node/PATH:** the preview spawner and the Bash/PowerShell tools captured PATH
  before nvm's node dir was on it. In Bash, prefix
  `export PATH="/c/Users/GhoshCode/AppData/Local/nvm/nodejs:$PATH"` for every
  `node`/`npm`/`npx` call. `.claude/launch.json` uses portable `npm run dev`; if
  the preview spawner throws `spawn node ENOENT`, run Vite via Bash
  (`node node_modules/vite/bin/vite.js --port 5173`) and `navigate` to it, as
  this iteration did.
- **Dev server is currently left running** on :5173 (started with `--strictPort`).
  Reuse it, or kill the stray node process before restarting.
- `verbatimModuleSyntax` is on: import types with `import type { X }`.
- TS is v7 — behaves like TS5 config here, but watch for stricter defaults.

## 2026-08-07 — Phase 0: Ground zero

**Task:** Snapshot v1, inventory it, extract content to `v1-content.json`, clear the v1 app.

### v1 app inventory (the tree being replaced)

- **Stack:** dependency-free vanilla JS + CSS, no build step, no `package.json`.
  Loaded as `index.html` pulling ~15 `<script>` tags in order. Also packaged as
  an MV3 Chrome extension via `manifest.json`.
- **Entry:** `index.html` → `js/config.js` (all config), then `js/index.js`
  wires modules: `form`, `help`, `suggester`, `queryParser`, `influencers`,
  `settingsStore`, `settingsPanel`, `effects`, `widgets`, `flipclock`, `palette`.
- **Where content lived:**
  - **Sites + quick links:** `js/config.js` → `CONFIG.commands[]`. Each item has
    `category`, `name`, `key`, `url`, optional `search`, `color`, `icon`,
    `quickLaunch`. The `*` item is the default search engine (google).
  - **Categories:** implied by the `category` field — real content category was
    **Programming** (17 sites); `Frequently Accessed` / `General` held the
    quick-links (Mail, Drive, Telegram, LinkedIn).
  - **Quotes:** `js/widgets.js` → `QUOTES[]` (10 developer quotes).
  - **Colors/accent:** per-site gradient hexes in `CONFIG.commands`; the global
    accent default (`#22d3ee` → `#a78bfa`) in `js/settingsStore.js`
    (`getIconStyle`). Seed background gradient also there.
- **Extracted to** `v1-content.json`: accent, quick links, the Programming
  category with all 17 sites (name/url/key/primary/reference color), and the 10
  quotes. v1 had **no Design or Social sites** — the seed task fills those from
  SPEC §10.

### Actions

- Added `.gitignore` (node_modules, dist, caches, `.DS_Store`, `.loop-status`).
- Snapshot commit `chore: snapshot v1 + loop kit` captured the whole tree first.
- Wrote `v1-content.json`, deleted the v1 app files (index.html, css/, js/,
  assets/, tools/, manifest.json, README.md, .DS_Store). Tree now holds only the
  loop kit (`PROMPT/SPEC/TODO.md`, `loop.ps1/.sh`), `v1-content.json`,
  `PROGRESS.md`, `.gitignore`, `LICENSE`, and `.claude/`.

### For the next iteration (Scaffold)

- **v1 is safe** on branches `v4.0` / `origin/v4.0` (open PR) and `main`, plus in
  this branch's history at the snapshot commit. Do not try to preserve it here.
- `.claude/launch.json` still points at the now-deleted `tools/serve.js`. The
  scaffold task should repoint it to Vite's dev server (`npm run dev`, port 5173).
- **Node is v22 via nvm-windows**, but its dir was added to PATH after this app
  session started, so tools that captured PATH at startup (the preview spawner,
  the Bash/PowerShell tools) can't resolve a bare `node`. Prefix
  `export PATH="/c/Users/GhoshCode/AppData/Local/nvm/nodejs:$PATH"` in Bash, and
  if the preview spawner throws `spawn node ENOENT`, set `runtimeExecutable` to
  the absolute `...\nvm\nodejs\node.exe` as a local (uncommitted) override.
- Do NOT commit machine-specific paths into `launch.json`.
