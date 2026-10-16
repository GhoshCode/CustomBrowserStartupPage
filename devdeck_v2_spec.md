# DevDeck v2 — Full Component Specification

> Based on hand-drawn mockup + detailed verbal spec from the user.

---

## 🕐 TIME Widget (Top-Left)

### 3 Clock Styles (switchable in Settings):

| Style | Description |
|-------|-------------|
| **1. Existing Digital** | Current DSEG7 seven-segment display |
| **2. Cyberpunk** | Bold, large display like reference image — "WORLD TIME" header, massive hour:minute with smaller seconds, multiple timezone cities shown below (LA, New York, London, Paris, Kyiv etc.) |
| **3. macOS Plain** | Clean Apple-style sans-serif digital clock, minimal and elegant |

- 12/24 hour format toggle (in Settings, as existing)
- Clock style selector added to Settings → Appearance

---

## A — Weather Widget (Top Bar, beside TIME)

> [!WARNING]
> **Not detailed in verbal spec.** Awaiting confirmation — is this still planned?

---

## B — UV Effect / Current Location (Top Bar, beside TIME)

> [!WARNING]
> **Not detailed in verbal spec.** Awaiting confirmation — is this still planned?

---

## TO DO Widget (Top Bar, Center-Left)

- **Expandable height** — collapse/expand button at bottom-right corner
- **Collapsed:** Shows a compact preview (e.g., first 2-3 items)
- **Expanded:** Full list of all to-do items, overlaying content below

### To-Do Item Features:
- Text description of the task
- **Optional time attachment** → reminder at specific time
- **Optional date attachment** → deadline / due date
- **Both time + date** → "complete by this time on this day"
- Completion toggle (checkbox)
- Visual indication of overdue items

### Data Storage:
- Persisted in localStorage (Zustand store, like existing data)

---

## GIT COMMITS Widget (Top Bar, Center-Right)

- **Classic GitHub contribution tiles panel** (green squares grid showing commit activity)
- Fetches data from GitHub API using the user's GitHub username

### Settings Addition:
- New field in Settings: **GitHub Username**
- Stored alongside existing `greetingName`

### Display:
- Contribution graph (last N weeks/months, sized to fit the widget)
- Total commits count / streak info

---

## DATE & GREET (Top Bar, Far-Right)

- **Same as existing** — uppercase date line + time-of-day greeting
- No changes needed, just repositioned to far-right of the top bar

---

## C — Command Prompt (Below TIME widget)

> [!WARNING]
> **Not detailed in verbal spec.** Awaiting confirmation — is this still planned? What should it do?

---

## SEARCH BAR (Full-Width Row)

- **Always visible** (not hidden behind Ctrl+K)
- **Google-style autocomplete suggestions** — as user types, dropdown shows matching results
- **Search button INSIDE** the search bar (right side, integrated)
- Searches across all sites (same as existing command palette logic)

### G₁ — Bookmark Button (Right of Search Bar)

- **Outside** the search bar, to its right
- Click opens a **dropdown panel** showing:
  - All categories in a list format
  - Sites within each category
  - Similar layout to search results dropdown
- Essentially a "browse all bookmarks" quick-access panel

---

## E — Quick Links Strip

### Layout:
- **First 4 links:** User-configured (same as existing Quick Links feature)
- **Remaining links:** **Auto-populated** by the system based on:
  - Most frequently visited sites (`visits` count)
  - Most recently visited sites (`lastVisited` timestamp)
- **Number of auto-picked links is configurable** (in Settings)

### Scroll Behavior:
- **First 4 links are FIXED** (always visible, don't scroll)
- Everything after the 4th is **horizontally scrollable**
- Sticky left edge for the pinned 4, scrollable overflow for the rest

---

## F — Recent Opened Links Strip

- Shown **after** Quick Links with a visual **divider/separator**
- Auto-populated from recently opened sites (sorted by `lastVisited`)
- Horizontally scrollable
- Shows favicon + name (pill/chip style)

---

## MAIN SECTION — Category Cards (Center)

- **Same design as existing cards** — no visual changes to card internals
- **NEW: Pin button** on each category card
  - Pinning a card keeps it visible/fixed even during horizontal scrolling
  - **First card is always fixed** (never scrolls away)
  - Other cards scroll horizontally (existing behavior)
  - Pinned cards stay anchored alongside the first card

---

## D — Currently Processing (Left Sidebar)

### Purpose:
- A dedicated panel for sites the user is actively working on
- Can hold **N number of sectioned sites**

### Own Settings Button:
- Opens a mini-settings panel to **add/remove sites** from the "Currently Processing" list

### Reminder / Scheduling System (per site):
Each site in Currently Processing has its own reminder settings:

| Setting | Options |
|---------|---------|
| Frequency | Every second · Every minute · Every hour · Every day |
| Weekly frequency | Which days of the week |
| Date range | From month-year → to month-year |

- **Cron-job style scheduling** — user configures when to receive reminders to work on that site
- Reminder delivery: Browser notification (Chrome extension notification API)

---

## I — Scraped Data / News (Right Sidebar)

### Content Types:
- 📰 **Latest News** (tech, business, general)
- 💼 **Latest Jobs**
- 🏷️ **Topics / Tags** (trending topics)
- 🌍 **Trending globally** from various sources

### Data Sources:
- User-defined sites/sources (configurable in Settings)
- Random/global trending sources

### Display:
- Numbered list format (1-4 in top panel, 5-8 in bottom panel)
- Each item shows title + source + timestamp
- Clickable → opens the article/job posting

### Settings — Scraping Configuration:
A **dedicated section** in the main Settings overlay:
- Add / delete **topics and tags** to track
- Add / delete **source sites** to scrape from
- Configure which categories of news to show

---

## J — Topics (Bottom-Right, below Scraped Data)

- **Small rectangle buttons** (filter chips)
- Each button represents a **topic/tag category**
- Clicking a topic filters the Scraped Data panel (I) to show only that topic's news
- Topics are managed in Settings → Scraping Configuration

---

## ⚙️ Settings Additions (Updated Settings Overlay)

New tabs/sections needed in Settings:

| Section | New Fields |
|---------|------------|
| **Appearance** | Clock style selector (Existing / Cyberpunk / macOS), existing fields |
| **Appearance** | (keep existing: accent, background, blur, overlay, 12/24h, greeting) |
| **Profile** | GitHub Username (for Git Commits widget) |
| **Quick Links** | Auto-pick count slider, existing CRUD |
| **Currently Processing** | Add/remove sites, per-site reminder/cron config |
| **Scraping** | Topics/tags CRUD, Source sites CRUD, news categories toggle |
| **To Do** | (may be managed inline in the widget itself) |

---

## 🚨 Critical Architecture Questions

> [!IMPORTANT]
> These questions affect what's technically possible. Please answer before I start building.

### 1. Weather (A) & UV (B) — Still planned?
You didn't mention these in the detailed spec. Should I include them or drop them?

### 2. Command Prompt (C) — Still planned?
What should this do? Open a terminal? Run shell commands? Or is it something else?

### 3. Scraping / News Data — How to fetch?
The current app has **no backend** and runs as a static Chrome extension. Scraping requires:
- **Option A:** Use public RSS feeds / APIs (e.g., HackerNews API, Dev.to API, NewsAPI.org) — needs an API key
- **Option B:** Use a proxy/serverless function to scrape sites
- **Option C:** Use Chrome extension background service worker to fetch & parse

Which approach do you prefer?

### 4. Git Commits — GitHub API
- GitHub's public API allows unauthenticated requests (60/hour rate limit)
- For higher limits: needs a GitHub Personal Access Token
- Should I use **public API only**, or add a token input in Settings?

### 5. Reminders / Cron Notifications
- In a Chrome extension: use `chrome.alarms` API for scheduling
- In a web app: use `Notification` API + `setInterval`/service workers
- **Which should I target?** (Chrome extension APIs are more reliable for this)

### 6. Search Suggestions
- Should suggestions search only **user's own sites** (existing behavior)?
- Or also query **Google Autocomplete API** for web-wide suggestions?
- Or both (user sites first, then web suggestions)?

### 7. Job Listings
- What kind of jobs? Developer jobs? Any specific job boards?
- Should I use APIs like GitHub Jobs, LinkedIn (limited), Indeed, or aggregate from RSS?

---

## Summary of Effort

| Area | Complexity | Notes |
|------|-----------|-------|
| Clock styles (3 modes) | 🟡 Medium | New component variants |
| To Do widget | 🟡 Medium | New data model + UI |
| Git Commits | 🟡 Medium | GitHub API integration |
| Search Bar redesign | 🟢 Low | Refactor existing CommandPalette |
| Bookmark Panel | 🟢 Low | New dropdown from existing data |
| Pin button on Cards | 🟡 Medium | Scroll logic changes |
| Quick Links auto-pick | 🟢 Low | Sort existing data |
| Currently Processing | 🔴 High | New data model + cron/reminder system |
| Scraped Data / News | 🔴 High | External APIs + scraping logic |
| Topics filter | 🟡 Medium | Filter UI + settings CRUD |
| Settings expansion | 🟡 Medium | Multiple new sections |
| Visual redesign (Apple aesthetic) | 🔴 High | Full CSS/component overhaul |
