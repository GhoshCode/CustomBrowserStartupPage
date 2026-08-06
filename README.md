# DevDeck build loop kit

An autonomous Claude Code loop that builds **DevDeck** — a sophisticated
custom browser landing page for developers — one clean task per iteration.

("DevDeck" is a placeholder name; find-and-replace it across these files if
you want something else.)

## What's in here

| File | Role |
| --- | --- |
| `PROMPT.md` | Instructions Claude Code receives on every iteration |
| `SPEC.md` | The product — features, interactions, design, acceptance checklist |
| `TODO.md` | ~40 phased tasks the loop consumes top to bottom |
| `loop.ps1` | The loop for Windows PowerShell |
| `loop.sh` | The loop for Git Bash / WSL / macOS / Linux |

State lives in files, not in the loop: each iteration reads `SPEC.md` +
`TODO.md` + `PROGRESS.md`, does exactly one task, verifies the build, checks
the task off, journals what it did, commits, and writes `.loop-status`. The
loop stops when that file says `ALL_TASKS_COMPLETE`.

## Run it

1. Create an **empty folder** and copy these five files into it.
2. Make sure Claude Code is installed, then run `claude` once inside that
   folder interactively to authenticate and trust the directory. Exit.
3. Start the loop:

   ```powershell
   # Windows PowerShell
   .\loop.ps1
   ```

   ```bash
   # Git Bash / WSL
   chmod +x loop.sh && ./loop.sh
   ```

4. Watch progress from another terminal: `git log --oneline`, `PROGRESS.md`,
   or the transcripts in `.loop-logs/`. Once Phase 1 lands you can keep
   `npm run dev` open and watch the app grow between iterations.

Stopping is always safe (Ctrl+C between iterations) — state is on disk, so
running the script again resumes exactly where it left off. Same if it hits
the iteration cap with tasks remaining.

## Things worth knowing

- `--dangerously-skip-permissions` lets Claude Code act without asking, which
  is what makes an unattended loop possible. Only run this in a dedicated
  project folder. If you'd rather approve things, swap the flag for
  `--permission-mode acceptEdits` and babysit the run.
- Each iteration is a full agentic session, so ~40 iterations is a real
  amount of usage. You can run it in chunks (`.\loop.ps1 -Max 10`) and spread
  it across days — resuming is free.
- Want to change the product? Edit `SPEC.md` and `TODO.md` between runs —
  never mid-iteration. The prompt forbids Claude from editing `SPEC.md`, so
  it stays your document.
- If an iteration goes sideways, the journal + git history make it cheap to
  `git revert` the bad commit, fix or clarify the TODO entry, and rerun.
