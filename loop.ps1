# DevDeck build loop — Windows / PowerShell
# Usage:  .\loop.ps1            (default 45 iterations)
#         .\loop.ps1 -Max 20
param([int]$Max = 45)

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "Claude Code CLI not found. Install it, run 'claude' once here to authenticate, then retry." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path PROMPT.md)) {
    Write-Host "PROMPT.md not found — run this from the project folder containing the loop files." -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path .loop-logs | Out-Null

for ($i = 1; $i -le $Max; $i++) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Magenta
    Write-Host ("  DevDeck loop - iteration {0} of {1}" -f $i, $Max) -ForegroundColor Magenta
    Write-Host ("=" * 60) -ForegroundColor Magenta

    $log = ".loop-logs\iter-{0:d3}.log" -f $i
    Get-Content PROMPT.md -Raw | claude -p --dangerously-skip-permissions 2>&1 | Tee-Object -FilePath $log

    $status = if (Test-Path .loop-status) { (Get-Content .loop-status -Raw).Trim() } else { "IN_PROGRESS" }
    if ($status -eq "ALL_TASKS_COMPLETE") {
        Write-Host ""
        Write-Host ("Done after {0} iterations - every task is checked and the build passes." -f $i) -ForegroundColor Green
        Write-Host "Run 'npm run dev' to see it, or load dist/ as an unpacked extension."
        exit 0
    }
}

Write-Host ""
Write-Host "Hit the iteration cap. Check TODO.md for what's left, then run .\loop.ps1 again to continue." -ForegroundColor Yellow
