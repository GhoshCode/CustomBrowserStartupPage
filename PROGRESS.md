# DevDeck build journal

Newest entries first. Each iteration appends its own.

---

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
