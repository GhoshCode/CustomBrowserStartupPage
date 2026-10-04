# DevDeck

**DevDeck** is a bespoke, glassy, keyboard-fast custom browser landing page (new-tab page) designed specifically for developers. It offers complete local personalization for curating developer resources, documentation, tools, and social feeds with zero backend, zero accounts, and zero tracking.

Everything persists locally in `localStorage` with explicit schema versioning and migration.

---

## ✨ Features

- **Constellation Backdrop:** Subtle, GPU-efficient drifting canvas constellation and stray glyphs with support for custom background images, blur, and overlay opacity. Fully respects `prefers-reduced-motion`.
- **Developer Header:**
  - Dynamic time-of-day greeting (e.g. *"Late night hacking?"*, *"Morning, {name}."*).
  - Live digital seven-segment clock with 12h/24h toggle support.
  - Rotating dev quotes on every visit.
- **Quick Links:** Immediate-access pinned shortcut bar for frequently visited services (Mail, Drive, Telegram, etc.) with favicon integration.
- **Category Cards (Core Interaction):**
  - **Header:** Colored category indicator dot, uppercase tracking title, and tabular site counter.
  - **Primary Row:** Horizontal scrolling tiles with edge fade masks, hover chevrons, Shift+wheel support, and pointer drag-to-pan.
  - **Pinned Subcategory Strip:** Sticky navigation pills with spring-animated active indicator and droppable target support.
  - **Subcategory Rail:** Horizontal snap rail (`scroll-snap-type: x mandatory`) at ~85% pane width with peek cues, holding vertically scrolling site lists.
  - **Drag & Drop:** Reorder sites within lists using `@dnd-kit`, or drag a site onto any subcategory pill to move it there immediately.
- **Command Palette (`Ctrl/Cmd+K` or `/`):**
  - Instant in-house fuzzy search across site names, domains, categories, and subcategories.
  - Ranked by match quality and visit frequency.
  - Category → Subcategory breadcrumb paths.
  - Fallback action: *"Add '{query}' as a new site…"*, prefilling the add-site form.
- **Settings Overlay:**
  - **Library:** Full CRUD for categories, subcategories, and sites. Fast add-site form with automatic URL normalization, domain extraction, and live favicon preview.
  - **Mind-Map Sitemap:** Interactive React Flow canvas rendering your entire link hierarchy as an animated left-to-right roadmap. Features count badges, expand/collapse chevrons, and drag-to-reparent with an Undo toast.
  - **Quick Links:** CRUD and drag-to-reorder for header quick links.
  - **Appearance:** Accent color presets and color picker, custom background image URL or file upload, opacity and blur sliders, 12h/24h clock toggle, and custom greeting name.
  - **Data:** One-click JSON backup export, schema-validated JSON import, and reset-to-seed danger zone.
- **Chrome / Edge MV3 Extension Ready:** Preconfigured with Manifest V3 and bundled icons (16px, 48px, 128px) so `dist/` doubles as an unpacked new-tab extension.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript (Strict mode)
- **Bundler:** Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) + Design Tokens
- **State Management:** Zustand 5 with `persist` middleware & hermetic migration
- **Drag & Drop:** `@dnd-kit/core` & `@dnd-kit/sortable`
- **Mind Map:** `@xyflow/react` (React Flow)
- **Animations:** `motion` (v13)
- **Unit Testing:** Vitest

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm or pnpm

### Development

Run the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

Create an optimized production build in `dist/`:
```bash
npm run build
```

### Type Checking & Unit Tests

Verify TypeScript types and execute the store unit test suite:
```bash
npm run typecheck
npm test
```

---

## 🧩 Loading as an Unpacked Browser Extension

DevDeck is packaged as a standard Chromium Manifest V3 extension that overrides the new tab page:

1. Run `npm run build` to generate the production bundle into the `dist/` directory.
2. In Google Chrome, Microsoft Edge, Brave, or any Chromium browser, navigate to:
   - Chrome / Brave: `chrome://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `dist/` folder inside this repository.
6. Open a new tab (`Ctrl+T` or `Cmd+T`) to launch your DevDeck!

---

## 📄 License
MIT
