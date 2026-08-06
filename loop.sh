#!/usr/bin/env bash
# DevDeck build loop — Git Bash / WSL / macOS / Linux
# Usage:  ./loop.sh          (default 45 iterations)
#         ./loop.sh 20
set -u
MAX="${1:-45}"

if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code CLI not found. Install it, run 'claude' once here to authenticate, then retry." >&2
  exit 1
fi
if [[ ! -f PROMPT.md ]]; then
  echo "PROMPT.md not found — run this from the project folder containing the loop files." >&2
  exit 1
fi

mkdir -p .loop-logs

for ((i = 1; i <= MAX; i++)); do
  printf '\n============================================================\n'
  printf '  DevDeck loop — iteration %d of %d\n' "$i" "$MAX"
  printf '============================================================\n'

  log=$(printf '.loop-logs/iter-%03d.log' "$i")
  claude -p --dangerously-skip-permissions < PROMPT.md 2>&1 | tee "$log"

  status=$(cat .loop-status 2>/dev/null || echo "IN_PROGRESS")
  if [[ "$status" == "ALL_TASKS_COMPLETE" ]]; then
    printf '\nDone after %d iterations — every task is checked and the build passes.\n' "$i"
    echo "Run 'npm run dev' to see it, or load dist/ as an unpacked extension."
    exit 0
  fi
done

printf '\nHit the iteration cap. Check TODO.md for what is left, then run ./loop.sh again to continue.\n'
