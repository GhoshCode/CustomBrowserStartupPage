# DevDeck work queue

Rules: work strictly top to bottom. One task per loop iteration. Mark `[x]`
only when typecheck + build pass. If a task is too large, split it into
sub-checkboxes here and do the first.

## Phase 0 — Foundation

- [x] Ground zero: ensure `.gitignore` covers node_modules and build
      output, then commit the untouched tree as a safety snapshot
      ("chore: snapshot v1 + loop kit"). Inventory the v1 app in
      PROGRESS.md (stack, entry files, where the site list / quick links /
      quotes / category colors live) and extract ALL of that content into
      `v1-content.json` at the repo root. Then delete the v1 app files
      from this branch (they remain safe on the original branch and in
      history) so the tree holds only the loop files + `v1-content.json`.
      Commit.
- [x] Scaffold the project non-interactively in THIS directory (it
      contains the loop's .md files and `v1-content.json` — create config
      files directly rather than using an interactive scaffolder): Vite +
      React + TS strict, Tailwind v4 via `@tailwindcss/vite`, deps from
      SPEC §1, scripts `dev` / `build` / `typecheck` (tsc --noEmit) /
      `test` (vitest), commit
- [x] Define all types from SPEC §2 and the Zustand store with `persist`,
      `schemaVersion: 1`, and a `migrate` scaffold; implement every store
      action listed in SPEC §2
- [x] Seed data module built from `v1-content.json` — the user's real
      sites, quick links, and quotes — filling any gaps from SPEC §10;
      loaded on first run only
- [x] Design token layer per SPEC §9: Tailwind theme, CSS variables, fonts
      (Space Grotesk, Inter, DSEG7 via `dseg`), glass utility classes
- [ ] Vitest unit tests for store logic: moveSite, reorder, delete cascades,
      togglePrimary, migrate

## Phase 1 — Shell

- [ ] Backdrop component per SPEC §3.1 (constellation + optional user image
      + overlay), reduced-motion aware
- [ ] Header: date line, time-of-day greeting, rotating dev quote (~20
      built in), live seven-segment clock honoring the 12/24h setting
- [ ] Quick links row rendered from the store with favicons and hover lift
- [ ] Responsive category grid container per SPEC §3.4 with glass card frames

## Phase 2 — Category card core

- [ ] CategoryCard header (colored label + site count) and internal layout
      regions
- [ ] PrimaryRow: horizontal scroll tiles with edge fade masks, hover
      chevrons, Shift+wheel support
- [ ] SubcategoryRail: scroll-snap x mandatory, sub-cards at ~85% pane width
      with peek, each holding a vertically scrolling SiteList
- [ ] Pinned pill strip incl. "General", scroll-spy sync via
      IntersectionObserver, click-to-scroll, animated active indicator
- [ ] SiteRow + Favicon component with letter-tile fallback and lazy loading
- [ ] General group for `subcategoryId: null` sites; designed empty states
      for empty categories and empty subcategories

## Phase 3 — Motion & drag

- [ ] Mount stagger for cards, hover micro-interactions, spring transitions;
      all gated behind prefers-reduced-motion
- [ ] Drag-to-pan on PrimaryRow and SubcategoryRail with click-vs-drag
      threshold; ←/→ keyboard rail navigation on focused cards
- [ ] dnd-kit sortable within each site list, persisting order
- [ ] Drag a site row onto a subcategory pill to move it there (pill
      highlights as a drop target)
- [ ] recordVisit on every site open (data only; used by palette ranking)

## Phase 4 — Command palette

- [ ] Palette overlay on Ctrl/Cmd+K and `/`: in-house fuzzy scorer over all
      sites, ranked per SPEC §5, full keyboard navigation, favicon +
      category path per result
- [ ] "Add '{query}' as a new site…" fallback action that opens the add-site
      form prefilled

## Phase 5 — Settings

- [ ] Settings shell: gear button, lazy-loaded full-screen glass overlay
      with left tab rail and Esc/close handling
- [ ] Library tab: category CRUD with inline rename, color picker, confirmed
      delete with cascades per SPEC §2
- [ ] Library tab: subcategory CRUD (delete moves sites to General) and site
      edit/delete
- [ ] Add-site form per SPEC §6: URL normalization, name-from-domain,
      favicon preview, category/subcategory/General select, Primary toggle
- [ ] Drag reordering in the Library tree for categories, subcategories,
      and sites
- [ ] Quick links tab: CRUD + drag reorder
- [ ] Appearance tab: accent, background image (URL or file→dataURL),
      overlay opacity + blur sliders, clock format, greeting name — applied
      live
- [ ] Data tab: export JSON download, import with validation + migration +
      summary, reset-to-seed with confirm

## Phase 6 — Mind-map sitemap

- [ ] Sitemap tab scaffold: React Flow canvas, custom node components
      (root / category / subcategory / site), pan + zoom + fit + minimap
- [ ] Custom left-to-right tree layout per SPEC §7 (x by depth, y by subtree
      size), derived from the store, animated re-layout
- [ ] Node styling: colored pills, count badges, favicon leaves, bezier
      edges tinted per branch
- [ ] Collapse/expand branches via node chevrons
- [ ] Drag-to-reparent per SPEC §7: intersection highlighting, drop rules
      (subcategory vs category→General), snap-back, toast with Undo

## Phase 7 — Ship

- [ ] MV3 manifest + generated icons; verify dist/ works as website AND
      unpacked new-tab extension
- [ ] Accessibility pass: focus order, aria labels, contrast, reduced motion
      audit
- [ ] Performance pass: lazy chunks confirmed, memoized rows, no console
      errors, smooth with 50+ sites in one subcategory
- [ ] Edge cases: long names truncate with tooltips, invalid URL rejection,
      zero-categories onboarding empty state
- [ ] README.md: what DevDeck is, screenshots section, dev/build commands,
      load-as-extension instructions
- [ ] Final QA: run the full SPEC §14 acceptance checklist, fix every
      finding, then and only then write ALL_TASKS_COMPLETE
