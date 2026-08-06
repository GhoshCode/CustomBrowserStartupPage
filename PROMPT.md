# DevDeck build loop — read this whole file before touching anything

You are ONE iteration of an autonomous build loop constructing **DevDeck**, a
custom browser landing page for developers. You are not building the whole app
this run. You are moving it forward by exactly one task, cleanly.

The product definition lives in `SPEC.md` (read-only, the source of truth).
The work queue lives in `TODO.md`. The build journal lives in `PROGRESS.md`.

## Your job this iteration

1. **Load state.** Read `SPEC.md` and `TODO.md` in full. Read the last 3
   entries of `PROGRESS.md` if it exists — they contain warnings and decisions
   from previous iterations that you must respect.

2. **Health check.** If `package.json` exists AND the Phase 0 scaffold
   task in `TODO.md` is already checked, run
   `npm run typecheck && npm run build`. If either fails, **repairing the
   build IS your one task this iteration.** Fix it, then jump to step 5.
   If the scaffold task is still unchecked, skip this health check — any
   `package.json` in the tree belongs to the old v1 app, which is being
   replaced, not repaired.

3. **Pick ONE task.** Take the first unchecked `[ ]` item in `TODO.md`,
   respecting phase order. Never skip ahead, never batch multiple tasks.
   If the task is too big for one session, split it into smaller checkboxes
   in `TODO.md` (keeping the phase intact) and complete only the first.

4. **Implement it completely.** Production quality, exactly per `SPEC.md` and
   the engineering rules below. No stubs, no `// TODO later`, no placeholder
   UI, no dead code. If the task is visual, sweat the details: spacing,
   hover states, empty states, motion.

5. **Verify.** `npm run typecheck && npm run build` must pass before you may
   finish. If tests exist, run `npx vitest run` and make them pass. Re-read
   every file you changed once, looking for defects with fresh eyes.

6. **Record.**
   - Mark the task `[x]` in `TODO.md`.
   - Append an entry to `PROGRESS.md`: ISO date/time, task name, files
     touched, decisions made, and anything the NEXT iteration must know
     (gotchas, deferred edge cases, API quirks you discovered).
   - Commit: `git add -A && git commit -m "<type>: <task summary>"` using
     feat/fix/chore/refactor/test prefixes. Run `git init` first if this is
     the first iteration.

7. **Signal.** Write the loop status to `.loop-status`:
   - `ALL_TASKS_COMPLETE` — only if EVERY task in `TODO.md` is `[x]` AND the
     build passes. This stops the loop, so never write it early.
   - `IN_PROGRESS` — in every other case.

## Engineering rules

- **The v1 app.** The working tree contains the previous version of the
  landing page — this loop runs on a throwaway git branch, so the original
  branch keeps v1 safe. Treat v1 files strictly as reference material:
  mine them for content per the Phase 0 ground-zero task, then clear them
  from this branch. Never "fix", extend, or preserve v1 code, and never
  count it as finished work — only checked tasks in `TODO.md` are
  finished work.
- **Git discipline.** Stay on the current branch. Never switch branches,
  merge, push, or touch remotes.
- **Stack is fixed by SPEC.md** — Vite, React (latest stable), TypeScript
  strict, Tailwind CSS v4, Zustand, dnd-kit, @xyflow/react, `motion`
  (Framer Motion's current package). Do not add other runtime dependencies
  unless a TODO task names them explicitly.
- **Non-interactive only.** Every command must run without prompting for
  input. Use flags like `--yes` / templates; never launch interactive wizards.
- **All state flows through the Zustand store.** Components never read or
  write `localStorage` directly. The persisted schema carries a
  `schemaVersion`; any schema change ships with a migration in the same
  commit, and existing user data must survive it.
- **Structure:** feature folders under `src/features/<feature>/`; shared
  primitives in `src/components/`; store in `src/store/`; design tokens in
  `src/styles/`. Keep components under ~250 lines — split when larger.
- **Design tokens only.** No ad-hoc hex values or magic numbers in
  components; everything derives from the token layer defined in Phase 0.
- **Never regress finished work.** Don't rewrite or "improve" completed
  features unless the current task requires it. Refactors need a task.
- **`SPEC.md` is read-only.** If you find a genuine gap or contradiction,
  record your interpretation in `PROGRESS.md` and proceed with the most
  sensible reading. If you discover a missing prerequisite task, insert it
  into `TODO.md` at the correct phase, note why in `PROGRESS.md`, and make
  that your one task.

## Quality bar

Before finishing, ask of your work: would a senior frontend engineer merge
this PR without comments? Interactions must feel 60fps-smooth, keyboard
accessible, free of console errors, and visually consistent with the design
language in `SPEC.md` — including empty states and edge cases, not just the
happy path.
