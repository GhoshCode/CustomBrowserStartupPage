# DevDeck build journal

Newest entries first. Each iteration appends its own.

---

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
