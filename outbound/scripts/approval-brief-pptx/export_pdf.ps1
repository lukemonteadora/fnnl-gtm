# Render a PPTX to a single PDF via PowerPoint COM (Windows-native QA render).
# One-file SaveAs is far more robust than folder PNG Export on this box, and the
# Read tool renders PDF pages visually for slide-by-slide inspection.
# Run the COM render from a NON-OneDrive path (%TEMP%) to avoid the render gotcha.
param(
  [Parameter(Mandatory = $true)][string]$Pptx,
  [Parameter(Mandatory = $true)][string]$Pdf
)
$ErrorActionPreference = "Stop"
$app = New-Object -ComObject PowerPoint.Application
try { $app.Visible = -1 } catch {}
$pres = $app.Presentations.Open($Pptx, -1, 0, -1)   # ReadOnly, Untitled=false, WithWindow=true
$count = $pres.Slides.Count
$pres.SaveAs($Pdf, 32)                               # ppSaveAsPDF = 32
$pres.Close()
$app.Quit()
try {
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app)  | Out-Null
} catch {}
Write-Output "PDF $count slides -> $Pdf"
