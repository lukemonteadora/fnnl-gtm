<#
.SYNOPSIS
  Generic HTML -> PDF renderer via Word COM (wdFormatPDF = 17). Used by any skill that needs
  a one-off styled PDF from HTML (for example, a per-company access-read generator).

.DESCRIPTION
  Word-COM gotcha (see memory docx-render-onedrive-comgotcha): rendering into a OneDrive-synced
  path fails silently/hangs. Both -HtmlPath and -PdfPath MUST be under a non-synced path
  (e.g. %TEMP%); the caller copies the finished PDF back to the real destination afterward.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\html_to_pdf_word.ps1 -HtmlPath "$env:TEMP\x.html" -PdfPath "$env:TEMP\x.pdf"
#>
param(
  [Parameter(Mandatory = $true)] [string]$HtmlPath,
  [Parameter(Mandatory = $true)] [string]$PdfPath
)
$ErrorActionPreference = 'Stop'
$word = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $htmlFull = [System.IO.Path]::GetFullPath($HtmlPath)
  $pdfFull  = [System.IO.Path]::GetFullPath($PdfPath)
  $opened = $word.Documents.Open($htmlFull, $false, $false)
  $opened.SaveAs([ref]$pdfFull, [ref]17)  # wdFormatPDF = 17
  $opened.Close()
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  $word = $null
  $f = Get-Item -LiteralPath $pdfFull
  Write-Output ("PDF written: {0} ({1:N0} bytes)" -f $f.FullName, $f.Length)
}
catch {
  if ($word) { try { $word.Quit() } catch {} }
  Write-Error "PDF generation failed: $_"
  exit 1
}
