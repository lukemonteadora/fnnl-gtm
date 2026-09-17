<#
.SYNOPSIS
  Campaign Approval Brief styling engine.
  Converts a Markdown brief (authored per docs/campaign-approval-brief-template.md)
  into a styled .docx using the locked house template, via Markdown -> HTML -> Word COM.

.DESCRIPTION
  This is the repeatable rendering layer for /campaign-approval-brief.
  The Markdown is the source of record; this script locks the visual template
  (fonts, sizes, colors, tables, blockquotes) so every brief looks identical.

  Supported Markdown: # ## ### headings, pipe tables, > blockquotes (blank '>'
  lines become paragraph breaks), - and 1. lists (one nested level), **bold**,
  *italic* / _italic_, `inline code`, and --- horizontal rules.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\brief_md_to_docx.ps1 `
    -MarkdownPath "profiles\<client-slug>\campaign-approval-brief.md" `
    -OutputDocx  "profiles\<client-slug>\Campaign Approval Brief - <Client>.docx"
#>
param(
  [Parameter(Mandatory = $true)] [string]$MarkdownPath,
  [Parameter(Mandatory = $true)] [string]$OutputDocx,
  [switch]$KeepHtml
)

$ErrorActionPreference = 'Stop'

# ---- Locked house style (shared with the presentation renderers; do not edit per client) ----
# Palette is the house brand: logo red (#dd1729) is the brand signature, paired with
# near-black text (#1c1917), white-smoke borders (#e2e2e2) and a faint red zebra
# (#fceaec). Font is Calibri, chosen over a display face such as Montserrat on
# purpose: Montserrat is not installed on the render box or guaranteed on a client's
# machine, and the imperative Word-COM presentation renderers (campaign_docx_presentation.ps1,
# lifecycle_docx_presentation.ps1) cannot fall back through a CSS font stack. Calibri ships
# with Office on Windows and Mac, so every output (brief AND presentation) renders the
# same on every machine. The house brand is carried by the red palette + structure, which
# render identically everywhere. (To use real Montserrat: install it fleet-wide, then set it
# here and as $HouseFont in the two presentation scripts.)
$css = @'
body{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:11pt;color:#1c1917;line-height:1.4;}
h1{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:22pt;color:#dd1729;border-bottom:2px solid #dd1729;padding-bottom:4px;}
h2{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:15pt;color:#dd1729;margin-top:22px;border-bottom:1px solid #f7c5ca;padding-bottom:2px;}
h3{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:12.5pt;color:#dd1729;margin-top:16px;}
table{border-collapse:collapse;width:100%;margin:8px 0;font-size:10pt;}
th,td{border:1px solid #e2e2e2;padding:5px 7px;text-align:left;vertical-align:top;}
th{background:#dd1729;color:#fff;}
tr:nth-child(even){background:#fceaec;}
blockquote{border-left:3px solid #dd1729;margin:4px 0 10px 0;padding:4px 12px;background:#fafafa;color:#1c1917;}
code{background:#f2f2f2;padding:1px 3px;font-family:Consolas,monospace;font-size:9.5pt;color:#dd1729;}
hr{border:none;border-top:1px solid #e2e2e2;margin:18px 0;}
.meta{color:#5d6c7b;}
ul,ol{margin-top:4px;}
li{margin-bottom:3px;}
'@

function ConvertTo-HtmlEscaped([string]$s) {
  $s = $s -replace '&', '&amp;'
  $s = $s -replace '<', '&lt;'
  $s = $s -replace '>', '&gt;'
  return $s
}

function ConvertTo-Inline([string]$s) {
  $s = ConvertTo-HtmlEscaped $s
  # inline code first so its contents are protected from bold/italic
  $s = [regex]::Replace($s, '`([^`]+)`', '<code>$1</code>')
  # bold (** **) before italic (* *)
  $s = [regex]::Replace($s, '\*\*([^*]+)\*\*', '<b>$1</b>')
  $s = [regex]::Replace($s, '\*([^*]+)\*', '<i>$1</i>')
  $s = [regex]::Replace($s, '(?<![A-Za-z0-9])_([^_]+)_(?![A-Za-z0-9])', '<i>$1</i>')
  return $s
}

function Test-TableSeparator([string]$line) {
  $t = $line.Trim()
  if (-not $t.StartsWith('|')) { return $false }
  $stripped = $t -replace '[\|\:\-\s]', ''
  return ($stripped.Length -eq 0 -and $t -match '-')
}

function Split-Row([string]$line) {
  $t = $line.Trim()
  $t = $t -replace '^\|', '' -replace '\|$', ''
  return ($t -split '\|') | ForEach-Object { $_.Trim() }
}

$lines = Get-Content -LiteralPath $MarkdownPath -Encoding UTF8
$html = New-Object System.Collections.Generic.List[string]
$i = 0
$n = $lines.Count

while ($i -lt $n) {
  $line = $lines[$i]
  $trim = $line.Trim()

  # blank line
  if ($trim -eq '') { $i++; continue }

  # horizontal rule
  if ($trim -match '^(\-{3,}|\*{3,})$') { $html.Add('<hr>'); $i++; continue }

  # headings
  if ($trim -match '^(#{1,6})\s+(.*)$') {
    $level = $matches[1].Length
    $text = ConvertTo-Inline $matches[2]
    $html.Add("<h$level>$text</h$level>")
    $i++; continue
  }

  # table: current line starts with | and the next line is a separator
  if ($trim.StartsWith('|') -and ($i + 1 -lt $n) -and (Test-TableSeparator $lines[$i + 1])) {
    $headers = Split-Row $line
    $html.Add('<table>')
    $thRow = ($headers | ForEach-Object { "<th>$(ConvertTo-Inline $_)</th>" }) -join ''
    $html.Add("<tr>$thRow</tr>")
    $i += 2  # skip header + separator
    while ($i -lt $n -and $lines[$i].Trim().StartsWith('|')) {
      $cells = Split-Row $lines[$i]
      $tdRow = ($cells | ForEach-Object { "<td>$(ConvertTo-Inline $_)</td>" }) -join ''
      $html.Add("<tr>$tdRow</tr>")
      $i++
    }
    $html.Add('</table>')
    continue
  }

  # blockquote: consecutive '>' lines; blank '>' lines => paragraph break
  if ($trim.StartsWith('>')) {
    $parts = New-Object System.Collections.Generic.List[string]
    while ($i -lt $n -and $lines[$i].Trim().StartsWith('>')) {
      $content = $lines[$i].Trim() -replace '^>\s?', ''
      $parts.Add($content)
      $i++
    }
    $joined = ''
    foreach ($p in $parts) {
      if ($p.Trim() -eq '') { $joined += '<br><br>' }
      else {
        if ($joined.Length -gt 0 -and -not $joined.EndsWith('<br>')) { $joined += ' ' }
        $joined += (ConvertTo-Inline $p)
      }
    }
    $joined = $joined -replace '(<br>)+$', ''
    $html.Add("<blockquote>$joined</blockquote>")
    continue
  }

  # lists (one nested level via 2+ leading spaces)
  if ($trim -match '^([\-\*]|\d+\.)\s+') {
    $isOrdered = $trim -match '^\d+\.\s+'
    $tag = if ($isOrdered) { 'ol' } else { 'ul' }
    $html.Add("<$tag>")
    $openNested = $false
    while ($i -lt $n -and $lines[$i].Trim() -match '^([\-\*]|\d+\.)\s+') {
      $raw = $lines[$i]
      $indent = ($raw.Length - $raw.TrimStart().Length)
      $itemText = $raw.Trim() -replace '^([\-\*]|\d+\.)\s+', ''
      $itemHtml = ConvertTo-Inline $itemText
      if ($indent -ge 2) {
        if (-not $openNested) { $html.Add("<$tag>"); $openNested = $true }
        $html.Add("<li>$itemHtml</li>")
      }
      else {
        if ($openNested) { $html.Add("</$tag>"); $openNested = $false }
        $html.Add("<li>$itemHtml</li>")
      }
      $i++
    }
    if ($openNested) { $html.Add("</$tag>") }
    $html.Add("</$tag>")
    continue
  }

  # paragraph: gather consecutive plain lines, join with <br> to preserve authored breaks
  $paraLines = New-Object System.Collections.Generic.List[string]
  while ($i -lt $n) {
    $l = $lines[$i]
    $t = $l.Trim()
    if ($t -eq '') { break }
    if ($t -match '^(#{1,6})\s' -or $t.StartsWith('>') -or $t.StartsWith('|') -or `
        $t -match '^(\-{3,}|\*{3,})$' -or $t -match '^([\-\*]|\d+\.)\s+') { break }
    $paraLines.Add((ConvertTo-Inline $t))
    $i++
  }
  if ($paraLines.Count -gt 0) {
    $cls = ''
    # tag the top metadata block (lines that are mostly **Label:** pairs) as .meta
    if (($paraLines | Where-Object { $_ -match '<b>.*:</b>' }).Count -ge 2 -and $paraLines.Count -ge 2) {
      $cls = ' class="meta"'
    }
    $html.Add("<p$cls>$([string]::Join('<br>', $paraLines))</p>")
  }
}

$doc = @"
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
$css
</style></head><body>
$([string]::Join("`r`n", $html))
</body></html>
"@

$htmlPath = [System.IO.Path]::ChangeExtension($OutputDocx, '.tmp.html')
# Write UTF-8 with BOM so Word reads accented chars / arrows correctly
[System.IO.File]::WriteAllText($htmlPath, $doc, (New-Object System.Text.UTF8Encoding $true))

$word = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $opened = $word.Documents.Open($htmlPath, $false, $false)
  $full = [System.IO.Path]::GetFullPath($OutputDocx)
  $opened.SaveAs([ref]$full, [ref]16)  # wdFormatDocumentDefault = .docx
  $opened.Close()
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  $word = $null
  if (-not $KeepHtml) { Remove-Item $htmlPath -Force -ErrorAction SilentlyContinue }
  $f = Get-Item -LiteralPath $OutputDocx
  Write-Output ("DOCX written: {0} ({1:N0} bytes)" -f $f.FullName, $f.Length)
}
catch {
  if ($word) { try { $word.Quit() } catch {} }
  Write-Error "DOCX generation failed: $_"
  Write-Output "HTML kept for inspection: $htmlPath"
  exit 1
}
