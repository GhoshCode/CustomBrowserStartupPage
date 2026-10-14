# DevDeck v2 — Implementation Plan (draft for review)

> Sources: `ui_layout_analysis.md` (wireframe), `devdeck_v2_spec.md` (features), `DevDeck_v2_Ultra_Detailed_Specification.pdf`, and current code on `v6.0`.
> Status: **APPROVED & READY FOR IMPLEMENTATION. All §7 questions have been answered and frozen.**

---

## 1. What I understood

The goal is to turn DevDeck from a **single-column page** (header, then quick-links/search, then scrolling category cards) into a **3-panel developer dashboard**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [TIME | A/B]     [TO DO ▾]      [GIT COMMITS ▦]         [DATE / GREET] │  Top Bar
│ [C command prompt [⚙ Admin]]                                           │
├────────────────────────────────────────────────────────────────────────┤
│         [🔍 search …………………………………………… (Search)]   [G₁ ★]              │  Search Row
├────────┬──────────────────────────────────────────────┬────────────────┤
│   D    │ ┌──────────────────────────────────────────┐ │    I  1–4      │  3-Column Cockpit
│   D    │ │ [E][E][E][E] │ [F][F][F] ... →scroll     │ │    I  5–8      │
│  [⚙]   │ ├──────────────┬──────────────┬────────────┤ │   [J][J][J]    │
│        │ │ [📌PIN] CARD │  CARD        │  CARD →    │ │                │
└────────┴─┴──────────────┴──────────────┴────────────┴─┴────────────────┘
```

Everything stays **client-side** (Zustand + localStorage). It still ships as **both a website and an MV3 new-tab extension** from the same `dist/`.

---

## 2. Where we start from (current code)

| Today | File | What happens to it in v2 |
|---|---|---|
| Header (date, greeting, quote, DSEG clock) | `components/Header.tsx` | Split into `TimeWidget` (left) + `DateGreet` (far right) |
| Search box with suggestions + quick-link pills | `components/QuickLinks.tsx` | Split into `SearchBar` (Zone 3) + `LinksStrip` (Zone 4) |
| Ctrl+K command palette | `components/CommandPalette.tsx` | Its `searchSites` ranking is reused by `SearchBar` (see Q8 for keep/retire) |
| Horizontal category cards | `components/CategoryGrid.tsx`, `CategoryCard.tsx` | Same cards; add pin button + sticky pinned area |
| Settings gear, bottom-right | `App.tsx` | Moves bottom-left (wireframe) |
| Settings tabs: Library, Sitemap, Quick Links, Appearance, Data | `components/settings/*` | Add Profile, Processing, Scraping; extend Appearance + Quick Links |
| Store schema v1 | `store/store.ts`, `types.ts` | Schema **v2** with migration (§3) |
| `visits` / `lastVisited` already tracked on every site open | `recordVisit` | Powers auto quick links + Recent strip. No new tracking needed |
| Manifest: no permissions | `public/manifest.json` | Add `alarms`, `notifications`, `storage`, host permissions (Phase 0) |

---

## 3. Data model changes (schema v1 → v2)

```ts
// Settings — new fields
clockStyle: 'digital' | 'cyberpunk' | 'macos';      // default 'digital'
worldClockZones: string[];                           // for cyberpunk style, IANA zones
githubUsername: string;
githubToken?: string;                                // only if Q4 = token
autoQuickLinkCount: number;                          // default 6
recentLinkCount: number;                             // default 8

// Category — new field
pinned?: boolean;                                    // first card is always fixed regardless

// New collections
todos: Todo[]            // { id, text, done, dueDate?: 'YYYY-MM-DD', dueTime?: 'HH:mm', createdAt, order }
processing: ProcItem[]   // { id, siteId | url+name, section?, schedule: Schedule, order }
feeds: { topics: Topic[]; sources: Source[]; categories: Record<'news'|'jobs'|'trending', boolean> }
feedCache: FeedItem[]    // not exported; refreshed on a timer

Schedule = { every: 'minute'|'hour'|'day'; days: number[] /*0-6*/; from: 'YYYY-MM'; to: 'YYYY-MM' }
```

- `SCHEMA_VERSION` 1 → 2. `migrate()` fills defaults, so existing decks keep all their data.
- Export/import includes the new collections, except caches and the GitHub token **[ASSUMED]**.
- **Caveat:** `store.ts` `merge()` currently *resets the deck to seed* whenever there are fewer than 10 categories. I'll keep that behaviour, but make sure it never wipes todos or processing items.
- **Extension caveat:** the background service worker that fires reminders **cannot read localStorage**. So the reminder schedule is also mirrored to `chrome.storage.local` whenever it changes.

---

## 4. Build phases

Each phase ends with typecheck + unit tests + Playwright e2e passing and a screenshot check, then **one commit on `v6.0`**.

### Phase 0 — Foundations
- Schema v2 types, defaults, migration, plus store tests for the migration.
- New `DashboardLayout` shell: CSS grid for the 5 zones, with empty placeholder slots.
- Responsive rules **[ASSUMED]**:
  - ≥1440px: all 3 panels visible.
  - 1024–1439px: sidebars narrower; I/J collapse into a toggle drawer.
  - <1024px: both sidebars become slide-out drawers.
- Manifest permissions; an `isExtension` helper so web mode degrades gracefully.

### Phase 1 — Top bar (Zone 1)
- **TimeWidget** with 3 styles:
  - *Digital*: the current DSEG7 clock.
  - *Cyberpunk*: "WORLD TIME" header, big HH:MM with smaller seconds, a row of cities (LA, NY, London, Paris, Kyiv, editable).
  - *macOS*: SF-style sans clock.
  - Style picker goes in Settings → Appearance; the 12/24h toggle is kept.
- **DateGreet**: the existing date line + greeting, moved far-right. Quote line: see Q9.
- **TodoWidget**:
  - Collapsed state shows the first 3 items; a ▾ button at bottom-right expands it.
  - Expanded state is an overlay panel that sits above the content below.
  - Add / edit / check / delete / reorder items.
  - Optional date, optional time, or both.
  - Overdue items turn red; items due today are accent-coloured.
  - Time-based reminders use the same notification system as Phase 4.
- **GitCommitsWidget**:
  - Shows a contribution tile grid sized to the widget (~16–20 weeks), plus a total and current streak.
  - Cached for 1 hour.
  - Data source: see Q4. The plain public REST API **does not return the contribution calendar**.

### Phase 2 — Search row + links strip (Zones 3–4)
- **SearchBar** (always visible):
  - Search button inside it on the right.
  - Dropdown suggestions: your sites first (the existing ranking), then web suggestions (Q6).
  - Keyboard: ↑ ↓ Enter Esc, and `/` focuses the bar.
  - Enter on a URL opens it; anything else goes to a Google search.
- **BookmarkButton (G₁)**: opens a dropdown listing every category with its sites (collapsible, filterable). Meaning confirmed in Q1.
- **LinksStrip**:
  - The first 4 configured Quick Links are sticky on the left.
  - Next come N auto-picked links, ranked by `visits` with a recency boost, excluding anything already shown.
  - Those auto links scroll horizontally.
  - Then a divider, then the Recent strip: sites sorted by `lastVisited`, favicon + name chips, scrollable.

### Phase 3 — Category cards (Zone 5 centre)
- Pin button 📌 on each card header.
- The first card plus all pinned cards are `position: sticky` at the left, using stacked offsets. The rest scroll underneath them.
- Pin cap of 2 **[ASSUMED]**, so pinned cards can't fill the whole width (Q10).
- Card internals stay unchanged.

### Phase 4 — Currently Processing (Zone 5 left, D)
- A list of sites you're actively working on, in N sections. Each section can be collapsed.
- A gear inside the panel opens a mini-panel to add or remove sites (picked from your library or by pasting a URL) and to set each site's schedule.
- Schedule fields:
  - Frequency: every minute / hour / day (see Q5 on "every second").
  - Days of the week.
  - From month-year → to month-year.
- Delivery:
  - Extension: `chrome.alarms` + `chrome.notifications`. Clicking a notification opens the site.
  - Web: the `Notification` API, only while a DevDeck tab is open.

### Phase 5 — Scraped data + topics (Zone 5 right, I + J)
- Two panels (items 1–4 and 5–8): numbered rows with title, source and relative time. Clicking opens a new tab.
- Topic chips (J) filter the panels. The "All" chip is the default.
- Fetching layer: one adapter per source, normalised into `FeedItem`. Refreshes every 30 minutes, cached, with a manual refresh button.
- Proposed no-key sources **[ASSUMED, pending Q3/Q7]**:
  - News: Hacker News (Algolia API), Dev.to API, Reddit JSON, any RSS/Atom feed you add.
  - Jobs: HN "Who is hiring", Remotive, RemoteOK.
  - Trending: GitHub trending (via HTML), HN front page.
- RSS and HTML scraping only work in the **extension** (host permissions get around CORS). Web mode is limited to CORS-friendly APIs.

### Phase 6 — Settings expansion
New or changed tabs:
- **Appearance**: clock style + world-clock cities.
- **Profile**: name, GitHub username/token.
- **Quick Links**: auto-pick count + recent count.
- **Processing**: the full list editor.
- **Scraping**: topics, sources and categories CRUD.
- **Data**: export covers the v2 collections.

### Phase 7 — Optional widgets (only if confirmed: Q2)
- **A Weather + B UV/location**:
  - Open-Meteo (free, no key) for current conditions + UV index.
  - Location from browser geolocation, or a city typed in Settings.
  - Cached for 30 minutes.
- **C Command bar**: see Q2. An extension can't run real shell commands, so I'd suggest a typed-command bar such as `gh <repo>`, `todo <text>`, `g <query>`, `open <site>`.

### Phase 8 — Visual pass + QA
- Unify the new widgets in the chosen visual language (Q11), both themes, with reduced-motion support.
- Update and extend Playwright e2e tests and visual screenshots; run a performance check that 300+ sites stays smooth.
- Rebuild `dist/` and load-test it as an unpacked extension.

---

## 5. Order and size

| Phase | Size | Depends on answers |
|---|---|---|
| 0 Foundations | M | Q11 (breakpoints) |
| 1 Top bar | M–L | Q4, Q9 |
| 2 Search + links | S–M | Q1, Q6, Q8, Q12 |
| 3 Pinned cards | M | Q10 |
| 4 Processing + reminders | L | Q5, Q13 |
| 5 Scraped data + topics | L | Q3, Q7 |
| 6 Settings | M | — |
| 7 A/B/C | S–M | Q2 |
| 8 Visual + QA | M–L | Q11 |

Phases 0 → 2 → 3 can start as soon as Q1, Q8, Q10, Q11 and Q12 are answered.

---

## 6. Out of scope (unless you say otherwise)
- Any backend server or user accounts. Sync between devices stays manual export/import.
- Real terminal / shell execution.
- LinkedIn or Indeed scraping (they block it and it breaks their terms).

---

## 7. Approved Decisions & Answers to All Questions

### Layout & Behavior
1. **G₁ Bookmark Button:** Opens an elongated dropdown panel with all categories/sites + a visual **Site Map** tree enabling users to drag/move sites between categories and add/rename/delete category folders easily.
2. **A Weather, B UV & C Command Prompt:**
   - **A (Weather):** YES. Real-time temperature in Celsius (°C) for user's GPS/geolocation (Open-Meteo API, CORS open, no API key).
   - **B (UV):** YES. Solar UV index of user location with color-coded risk badge (Low to Extreme).
   - **C (Command Prompt):** YES. Terminal input bar with small **System Administrator Icon** (wrench and gear / admin shield from reference image) on right. When toggled, commands trigger terminal launch in elevated / Administrator mode.
3. **D Currently Processing:** Dedicated left sidebar holding $N$ active workspace projects. Has a mini-settings cog at bottom to add/remove sites and configure per-site **cron reminders** (hourly/daily, weekdays, month-year range) using browser notifications (`chrome.alarms`).
4. **Ctrl+K Command Palette:** Keep Ctrl+K as a hotkey to instantly focus the new, always-visible Search Bar.
5. **Quote Line:** Clean temporal greeting (GOOD MORNING/EVENING) + uppercase date line.
6. **Pinned Category Cards (CRITICAL CONSTRAINT):** Exactly **ONE** category card can be pinned at any time! Pinning moves it temporarily to the FIRST position in the row and keeps it anchored during horizontal scrolling. Unpinning immediately restores the card to its original sequenced position.
7. **Quick Links Strip (E):** The first 4 links are permanently FIXED on the left edge. Subsequent links auto-populate based on visit count + recency (count configurable via slider in Settings, 2–12 links) and scroll horizontally.
8. **Recent Links Strip (F):** Follows Quick Links separated by a vertical glass divider (`|`). Displays chronologically recently opened sites as chips.

### Data & External Services
9. **Cyberpunk Clock (CRITICAL CONSTRAINT):** Exact visual style from reference image with massive blocky hours:minutes and smaller stacked seconds on the right. **DO NOT** show multiple timezone cities below (LA, New York, London, Paris, Kyiv).
10. **To Do Widget Interaction:**
    - **30s Auto-Shrink:** Expand button reveals full list as an overlay on top of lower content. Inactivity for 30s automatically shrinks it back.
    - **Red Danger Zone:** Tasks exceeding due date/time are pinned to the top with a crimson danger background.
    - **Archive:** Leading bullet marks task complete and archives it; mini archive drawer icon is located directly to the left of the expand button in bottom-right corner.
11. **GitHub Activity Heatmap:** Classic green contribution tiles matrix, annual commit tally, and streak counters. Configured via GitHub username in Settings → Profile with optional PAT token.
12. **Search Autocomplete:** Multi-tier live dropdown: Tier 1 matching bookmarks, Tier 2 Google Autocomplete API suggestions, Tier 3 direct search engine query. Includes integrated inner search button.
13. **Tech News (I) & Topics (J):** Dual-section panel (1–4 top breaking news, 5–8 developer jobs & trending). Topic filter chips (`#AI`, `#Frontend`, `#DevOps`) filter the feed.

### Visual Styling
14. **Aesthetic Direction:** Obsidian Dark luxury glassmorphism (`backdrop-filter: blur(24px)`), Apple-grade typography and specular borders, matching the reference images. All specs certified in `DevDeck_v2_Ultra_Detailed_Specification.pdf`.
