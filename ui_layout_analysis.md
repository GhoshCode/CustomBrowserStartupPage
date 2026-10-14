# DevDeck v2 — UI Layout Analysis from Hand-Drawn Mockup

## Component Legend (from Image 2)

| Label | Component | Purpose |
|-------|-----------|---------|
| **A** | Weather | Weather widget |
| **B** | UV Effect in Current Location | UV index / environmental data |
| **C** | Command Prompt | OS-style command prompt |
| **D** | Currently Processing | Active tasks / in-progress items |
| **E** | Quick Links | Pinned quick-access links |
| **F** | Recent Opened Links | Recently visited sites |
| **G₁** | Bookmark Button | Save/bookmark action |
| **I** | Scraped Data | Data panels with numbered lists |
| **J** | Topics | Topic categories / tags |

---

## Skeletal Layout (from Image 1)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TOP BAR                                                                │
│ ┌──────────┬────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│ │          │ A  │  │              │  │     GIT      │  │   DATE,    │  │
│ │   TIME   ├────┤  │    TO DO     │  │   COMMITS    │  │   GREET    │  │
│ │          │ B  │  │              │  │              │  │            │  │
│ └──────────┴────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│ ┌─────────┐                                                            │
│ │    C    │   ← Command Prompt                                         │
│ └─────────┘                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  SEARCH ROW                                                            │
│  ┌─🔍──── SEARCH BAR ──────────────────┬─Q*SEARCH─┐  ┌──── G₁ ────┐  │
│  └──────────────────────────────────────┴──────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  LINKS STRIP                                                           │
│  ┌───┐┌───┐┌───┐┌───┐ │ ┌───┐┌───┐┌───┐                              │
│  │ E ││ E ││ E ││ E │ │ │ F ││ F ││ F │                              │
│  └───┘└───┘└───┘└───┘ │ └───┘└───┘└───┘                              │
│  Quick Links ──────────┘  Recent Opened                                │
├─────────────────────────────────────────────────────────────────────────┤
│  MAIN CONTENT AREA (3-zone layout)                                     │
│ ┌────┐ ┌──────────┬──────────┬──────────┐ ┌─────────────────────────┐  │
│ │    │ │          │          │          │ │ 1. ────────────── ──→ I │  │
│ │ D  │ │          │          │          │ │ 2. ────────────── ──→   │  │
│ │    │ │  CARD    │  CARD    │  CARD    │ │ 3. ────────────── ──→   │  │
│ │    │ │          │          │          │ │ 4. ────────────── ──→   │  │
│ ├────┤ │          │          │          │ ├─────────────────────────┤  │
│ │    │ │          │          │          │ │ 5. ────────────── ──→ I │  │
│ │ D  │ │          │          │          │ │ 6. ────────────── ──→   │  │
│ │    │ │          │          │          │ │ 7. ────────────── ──→   │  │
│ │    │ │          │          │          │ │ 8. ────────────── ──→   │  │
│ └────┘ └──────────┴──────────┴──────────┘ ├─────────────────────────┤  │
│  ⚙️                                       │    ┌───┐┌───┐┌───┐     │  │
│                                            │    │ J ││ J ││ J │     │  │
│                                            │    └───┘└───┘└───┘     │  │
│                                            └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Zone Breakdown

### 🔹 Zone 1 — Top Bar (Header)
A horizontal bar across the top with 4 widgets:

| Position | Widget | Components |
|----------|--------|------------|
| Far-left | **Time + Environment** | `TIME` clock + `A` (Weather) + `B` (UV/Location) stacked beside it |
| Center-left | **To Do** | A task/to-do widget |
| Center-right | **Git Commits** | Git activity / commit history |
| Far-right | **Date & Greeting** | Date line + time-of-day greeting |

### 🔹 Zone 2 — Command Prompt (`C`)
Below the TIME widget on the left side — an OS-style command prompt bar.

### 🔹 Zone 3 — Search Row
A full-width search bar with:
- 🔍 Search input
- `Q*SEARCH` action button
- `G₁` Bookmark button on the far right

### 🔹 Zone 4 — Links Strip
A horizontal row of small pill/chip buttons:
- **E × 4** = Quick Links (pinned favorites)
- **| divider |**
- **F × 3** = Recent Opened Links

### 🔹 Zone 5 — Main Content Area (3-panel layout)

| Position | Component | Description |
|----------|-----------|-------------|
| **Left sidebar** | `D` × 2 stacked | "Currently Processing" panels |
| **Center** | 3 × `CARD` | Category cards (the existing site collections) |
| **Right sidebar** | `I` panels + `J` topics | Scraped data in numbered lists (1-8, split into two panels of 4), plus `J` topic tags at bottom |

### 🔹 Bottom
- ⚙️ Settings gear (bottom-left corner)
- `J × 3` Topics chips (bottom-right corner)

---

## Key Structural Changes from Current UI

| Aspect | Current | New Design |
|--------|---------|------------|
| **Layout** | Single-column with horizontal scrolling cards | **3-panel dashboard** (left sidebar + center cards + right sidebar) |
| **Header** | Simple greeting + clock | **Multi-widget top bar** (Time, Weather, UV, To Do, Git, Date) |
| **Search** | Hidden command palette (Ctrl+K) | **Always-visible search bar** with bookmark button |
| **Quick Links** | Pill row below header | **Links strip** with E (Quick) + F (Recent) separated |
| **New: Left sidebar** | — | `D` Currently Processing panels |
| **New: Right sidebar** | — | `I` Scraped Data lists + `J` Topics |
| **New widgets** | — | Weather (A), UV (B), Command Prompt (C), To Do, Git Commits |

---

## Awaiting Your Details On:

> [!IMPORTANT]
> For each component (A through J), I need you to describe:
> 1. **Visual design** — How should it look? (colors, glass, borders, icons)
> 2. **Animations** — Entry/exit, hover, interactions
> 3. **Features** — What does it do? What data does it show?
> 4. **Interactions** — Click behavior, keyboard shortcuts, drag support
> 5. **Data source** — Where does the data come from? (API, local storage, hardcoded)

Ready for your detailed specs! 🎯
