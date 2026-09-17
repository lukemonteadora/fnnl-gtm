# Export every slide of a PPTX to PNG via PowerPoint COM (Windows-native QA render).
# Replaces the soffice/pdftoppm path from the prompt guide, which needs LibreOffice
# + poppler (absent on this box). Mirrors the Word-COM pattern used by the DOCX brief.
# Run the COM render from a NON-OneDrive path (e.g. %TEMP%) — COM export can fail
# writing into the OneDrive-synced repo (documented render gotcha).
param(
  [Parameter(Mandatory = $true)][string]$Pptx,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [int]$Width = 1920,
  [int]$Height = 1080
)
$ErrorActionPreference = "Stop"
if (!(Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
Get-ChildItem -Path $OutDir -Filter *.PNG -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

$app = New-Object -ComObject PowerPoint.Application
try { $app.Visible = -1 } catch {}       # PowerPoint usually requires Visible=msoTrue to automate
$pres = $app.Presentations.Open($Pptx, -1, 0, 0)   # ReadOnly, Untitled=false, WithWindow=false
$count = $pres.Slides.Count
# per-slide Export is more reliable than presentation-level folder Export on this box
for ($i = 1; $i -le $count; $i++) {
  $f = Join-Path $OutDir ("slide{0:D2}.png" -f $i)
  $pres.Slides.Item($i).Export($f, "PNG", $Width, $Height)
}
$pres.Close()
$app.Quit()
try {
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app)  | Out-Null
} catch {}
Write-Output "EXPORTED $count slides -> $OutDir"
