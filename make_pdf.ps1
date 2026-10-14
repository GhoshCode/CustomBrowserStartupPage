$chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$html = "c:\GhoshCode WorkSpace\CustomBrowserStartupPage\DevDeck_v2_Specification.html"
$pdf = "c:\GhoshCode WorkSpace\CustomBrowserStartupPage\DevDeck_v2_Ultra_Detailed_Specification.pdf"

$tempDir = Join-Path $env:TEMP "chrome_pdf_$(Get-Random)"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$errLog = Join-Path $env:TEMP "chrome_err.log"
$outLog = Join-Path $env:TEMP "chrome_out.log"

$tempHtml = Join-Path $tempDir "spec.html"
Copy-Item $html $tempHtml
$tempPdf = Join-Path $tempDir "output.pdf"

$args = @(
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--user-data-dir=$tempDir",
    "--no-pdf-header-footer",
    "--print-to-pdf=$tempPdf",
    "$tempHtml"
)

$process = Start-Process -FilePath $chrome -ArgumentList $args -PassThru -Wait -RedirectStandardError $errLog -RedirectStandardOutput $outLog
if (Test-Path $tempPdf) {
    Copy-Item $tempPdf $pdf -Force
}
Write-Output "ExitCode: $($process.ExitCode)"
Write-Output "PDF Exists: $(Test-Path $pdf)"
if (Test-Path $errLog) {
    Write-Output "=== STDERR ==="
    Get-Content $errLog -Tail 20
}
if (Test-Path $outLog) {
    Write-Output "=== STDOUT ==="
    Get-Content $outLog -Tail 20
}
if (Test-Path $pdf) {
    $item = Get-Item $pdf
    Write-Output "Size: $($item.Length) bytes"
}
