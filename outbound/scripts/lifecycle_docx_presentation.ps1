param(
    [Parameter(Mandatory=$true)] [string] $ProfileSlug,
    [Parameter(Mandatory=$true)] [string] $SourcePath,
    [Parameter(Mandatory=$true)] [string] $FlowType,
    [string] $OutputName = "",
    [string] $DocTitle = "",
    [string] $Intro = ""
)

$ErrorActionPreference = "Stop"

# ---- House style (shared brand; keep in sync with brief_md_to_docx.ps1 CSS) ----
# Calibri body + logo-red (#dd1729) headings/title. Montserrat is the brand's display
# face but is not installed/guaranteed, and Word COM cannot fall back through a font stack,
# so Calibri is used for cross-machine consistency. To switch to real Montserrat, install it
# fleet-wide and change $HouseFont here AND the brief CSS.
$HouseFont  = "Calibri"
$BrandColor = 2693085   # house logo red #dd1729 as Word BGR long (was 12611584 = Office blue #0070C0)

$root = Resolve-Path "."
$profileDir = Join-Path $root "profiles\$ProfileSlug"
if (-not (Test-Path -LiteralPath $profileDir)) {
    throw "Profile folder not found: $profileDir"
}

$resolvedSource = if ([System.IO.Path]::IsPathRooted($SourcePath)) {
    $SourcePath
} else {
    Join-Path $root $SourcePath
}

if (-not (Test-Path -LiteralPath $resolvedSource)) {
    throw "Source file not found: $resolvedSource"
}

function Convert-DocText {
    param([string] $Text)
    if ($null -eq $Text) { return "" }
    $clean = $Text
    $clean = $clean.Replace(([string]([char]0x00E2) + [char]0x20AC + [char]0x201D), "-")
    $clean = $clean.Replace(([string]([char]0x00E2) + [char]0x20AC + [char]0x201C), "-")
    $clean = $clean.Replace(([string]([char]0x00E2) + [char]0x20AC + [char]0x02DC), "'")
    $clean = $clean.Replace(([string]([char]0x00E2) + [char]0x20AC + [char]0x2122), "'")
    $clean = $clean.Replace(([string]([char]0x00E2) + [char]0x20AC + [char]0x0153), '"')
    $clean = $clean.Replace(([string]([char]0x00E2) + [char]0x20AC + [char]0x009D), '"')
    $clean = $clean.Replace(([string]([char]0x00C3) + [char]0x00B6), "o")
    $clean = $clean.Replace(([string]([char]0x00C3) + [char]0x00A5), "a")
    $clean = $clean.Replace(([string]([char]0x00C3) + [char]0x00A6), "ae")
    $clean = $clean.Replace(([string]([char]0x00C3) + [char]0x00B8), "o")
    $clean = $clean.Replace([string]([char]0x2014), "-")
    $clean = $clean.Replace([string]([char]0x2013), "-")
    $clean = $clean.Replace([string]([char]0x2019), "'")
    $clean = $clean.Replace([string]([char]0x201C), '"')
    $clean = $clean.Replace([string]([char]0x201D), '"')
    return $clean
}

function Convert-YamlScalar {
    param([string] $Value)
    if ($null -eq $Value) { return "" }
    $v = $Value.Trim()
    if ($v.StartsWith('"') -and $v.EndsWith('"')) {
        return Convert-DocText $v.Substring(1, $v.Length - 2)
    }
    return Convert-DocText $v
}

function Get-OutputPath {
    param([Parameter(Mandatory=$true)] [string] $PreferredPath)

    if (-not (Test-Path -LiteralPath $PreferredPath)) {
        return $PreferredPath
    }

    try {
        $stream = [System.IO.File]::Open($PreferredPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
        $stream.Close()
        Remove-Item -LiteralPath $PreferredPath -Force
        return $PreferredPath
    }
    catch {
        $dir = Split-Path -Parent $PreferredPath
        $base = [System.IO.Path]::GetFileNameWithoutExtension($PreferredPath)
        $ext = [System.IO.Path]::GetExtension($PreferredPath)
        $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
        return (Join-Path $dir "$base - revised $stamp$ext")
    }
}

function Read-SequenceYaml {
    param([Parameter(Mandatory=$true)] [string] $Path)

    $lines = Get-Content -LiteralPath $Path -Encoding UTF8
    $name = ""
    $summary = New-Object System.Collections.Generic.List[string]
    $steps = New-Object System.Collections.Generic.List[object]
    $currentStep = $null
    $currentVariant = $null
    $capturingBody = $false
    $bodyLines = New-Object System.Collections.Generic.List[string]

    function Finish-Body {
        if ($currentVariant -and $capturingBody) {
            $currentVariant.Body = Convert-DocText ((($bodyLines.ToArray()) -join "`r`n").TrimEnd())
            $bodyLines.Clear()
            Set-Variable -Name capturingBody -Value $false -Scope 1
        }
    }

    foreach ($raw in $lines) {
        $line = [string]$raw

        if ($line -match '^name:\s*(.+)$') {
            $name = Convert-YamlScalar $Matches[1]
            continue
        }

        if ($line -match '^#\s*(TRIGGER|PURPOSE|SETUP):\s*(.+)$') {
            $summary.Add("$($Matches[1].Substring(0,1).ToUpper())$($Matches[1].Substring(1).ToLower()): $(Convert-DocText $Matches[2])")
            continue
        }

        if ($line -match '^#\s{4,}(.+)$' -and $summary.Count -gt 0) {
            $summary[$summary.Count - 1] = "$($summary[$summary.Count - 1]) $(Convert-DocText $Matches[1])"
            continue
        }

        if ($capturingBody) {
            if ($line -match '^\s{6}-\slabel:\s*(.+)$' -or $line -match '^\s{2}-\sstep:\s*(\d+)\s*$') {
                Finish-Body
            }
            else {
                if ($line.StartsWith("          ")) {
                    $bodyLines.Add($line.Substring(10))
                }
                elseif ($line.Trim().Length -eq 0) {
                    $bodyLines.Add("")
                }
                else {
                    $bodyLines.Add($line)
                }
                continue
            }
        }

        if ($line -match '^\s{2}-\sstep:\s*(\d+)\s*$') {
            $currentStep = [pscustomobject]@{
                Header = "Email $($Matches[1])"
                Step = [int]$Matches[1]
                DelayDays = 0
                Variants = New-Object System.Collections.Generic.List[object]
            }
            $steps.Add($currentStep)
            $currentVariant = $null
            continue
        }

        if ($line -match '^\s*delay_days:\s*(\d+)\s*$' -and $currentStep) {
            $currentStep.DelayDays = [int]$Matches[1]
            $currentStep.Header = "Email $($currentStep.Step) - Day +$($currentStep.DelayDays)"
            continue
        }

        if ($line -match '^\s{6}-\slabel:\s*(.+)$' -and $currentStep) {
            $currentVariant = [pscustomobject]@{
                Label = Convert-YamlScalar $Matches[1]
                Subject = ""
                Body = ""
                Meta = @()
            }
            $currentStep.Variants.Add($currentVariant)
            continue
        }

        if ($line -match '^\s*subject:\s*(.*)$' -and $currentVariant) {
            $currentVariant.Subject = Convert-YamlScalar $Matches[1]
            continue
        }

        if ($line -match '^\s*body:\s*\|\s*$' -and $currentVariant) {
            $capturingBody = $true
            $bodyLines.Clear()
            continue
        }
    }

    Finish-Body

    return [pscustomobject]@{
        Name = $name
        Summary = $summary
        Steps = $steps
        Sections = @()
        Notes = @()
    }
}

function Get-MarkdownBodyParagraphs {
    param([string] $Body)
    $parts = $Body -split "(`r?`n){2,}"
    $paragraphs = New-Object System.Collections.Generic.List[string]
    foreach ($part in $parts) {
        $clean = (($part -split "`r?`n") -join " ").Trim()
        if ($clean.Length -gt 0) {
            $paragraphs.Add((Convert-DocText $clean))
        }
    }
    return $paragraphs
}

# Non-email sections (## Call Script, ## Confirmation Page) keep one paragraph per source line,
# so script labels and FAQ Q/A lines stay on their own lines in the DOCX.
function Get-SectionParagraphs {
    param([string] $Body)
    $paragraphs = New-Object System.Collections.Generic.List[string]
    foreach ($part in ($Body -split "`r?`n")) {
        $clean = $part.Trim()
        if ($clean.Length -gt 0) {
            $paragraphs.Add((Convert-DocText $clean))
        }
    }
    return $paragraphs
}

function Read-LifecycleMarkdown {
    param([Parameter(Mandatory=$true)] [string] $Path)

    $lines = Get-Content -LiteralPath $Path -Encoding UTF8
    $title = ""
    $when = New-Object System.Collections.Generic.List[string]
    $notes = New-Object System.Collections.Generic.List[string]
    $steps = New-Object System.Collections.Generic.List[object]
    $sections = New-Object System.Collections.Generic.List[object]
    $mode = ""
    $current = $null
    $inFence = $false
    $bodyLines = New-Object System.Collections.Generic.List[string]

    function Finish-Current {
        if ($current) {
            $body = Convert-DocText ((($bodyLines.ToArray()) -join "`r`n").Trim())
            if ($body -match '^\s*Subject:\s*(.+?)(\r?\n|$)') {
                $current.Subject = Convert-DocText $Matches[1].Trim()
                $body = ($body -replace '^\s*Subject:\s*.+?(\r?\n)+', '').Trim()
            }
            $current.Body = $body
            $bodyLines.Clear()
        }
    }

    foreach ($raw in $lines) {
        $line = Convert-DocText ([string]$raw)

        if ($line -match '^#\s+(.+)$' -and [string]::IsNullOrWhiteSpace($title)) {
            $title = $Matches[1].Trim()
            continue
        }

        if ($line -match '^##\s+When to Use\s*$') {
            Finish-Current
            $current = $null
            $mode = "when"
            continue
        }

        if ($line -match '^##\s+Notes\s*$') {
            Finish-Current
            $current = $null
            $mode = "notes"
            continue
        }

        # Call script (interested-reply.md) and confirmation page (pre-call.md) are not emails:
        # render them as their own headed sections, before the sequence if they come first.
        if ($line -match '^##\s+(Call Script|Confirmation Page)\s*$') {
            Finish-Current
            $mode = "section"
            $current = [pscustomobject]@{
                Header = $Matches[1].Trim()
                Subject = ""
                Body = ""
                Meta = New-Object System.Collections.Generic.List[string]
                BeforeSequence = ($steps.Count -eq 0)
            }
            $sections.Add($current)
            continue
        }

        if ($line -match '^##\s+(.+)$') {
            Finish-Current
            $mode = "email"
            $current = [pscustomobject]@{
                Header = $Matches[1].Trim()
                Subject = ""
                Body = ""
                Meta = New-Object System.Collections.Generic.List[string]
            }
            $step = [pscustomobject]@{
                Header = $current.Header
                Step = $steps.Count + 1
                DelayDays = 0
                Variants = New-Object System.Collections.Generic.List[object]
            }
            $variant = [pscustomobject]@{
                Label = "A"
                Subject = ""
                Body = ""
                Meta = $current.Meta
            }
            $step.Variants.Add($variant)
            $steps.Add($step)
            $current = $variant
            continue
        }

        if ($line.Trim() -eq '```') {
            $inFence = -not $inFence
            continue
        }

        if ($inFence -and $current) {
            $bodyLines.Add($line)
            continue
        }

        if ($current -and $line -match '^\*\*(Subject|Trigger|Send as|Word count|Purpose):\*\*\s*(.*)$') {
            $label = $Matches[1]
            $value = $Matches[2].Trim().Trim('`')
            if ($label -eq "Subject") {
                $current.Subject = Convert-DocText $value
            }
            else {
                $current.Meta.Add("$label`: $(Convert-DocText $value)")
            }
            continue
        }

        # Sections keep unfenced lines too, so a call script written as plain lines is not dropped.
        if ($mode -eq "section" -and $current) {
            $bodyLines.Add($line)
            continue
        }

        if ($mode -eq "when" -and $line.Trim().Length -gt 0 -and $line.Trim() -ne "---") {
            $when.Add($line.Trim().TrimStart("-").Trim())
            continue
        }

        if ($mode -eq "notes" -and $line.Trim().Length -gt 0 -and $line.Trim() -ne "---") {
            $notes.Add($line.Trim().TrimStart("-").Trim())
            continue
        }
    }

    Finish-Current

    foreach ($step in $steps) {
        foreach ($variant in $step.Variants) {
            if ($variant.Body.Length -eq 0) {
                $variant.Body = ""
            }
        }
    }

    return [pscustomobject]@{
        Name = $title
        Summary = $when
        Steps = $steps
        Sections = $sections
        Notes = $notes
    }
}

function Add-Paragraph {
    param(
        [Parameter(Mandatory=$true)] $Doc,
        [Parameter(Mandatory=$true)] [string] $Text,
        [string] $Style = "Normal",
        [bool] $Bold = $false,
        [double] $FontSize = 10,
        [int] $SpaceAfter = 3,
        [int] $SpaceBefore = 0
    )

    $p = $Doc.Paragraphs.Add()
    $p.Range.Text = $Text
    $p.Range.Style = $Style
    $p.Range.Font.Name = $HouseFont
    $p.Range.Font.Size = $FontSize
    $p.Range.Font.Bold = [int]$Bold
    $p.SpaceAfter = $SpaceAfter
    $p.SpaceBefore = $SpaceBefore
    $p.LineSpacingRule = 0
    $p.Range.InsertParagraphAfter() | Out-Null
    return $p
}

function Add-Heading {
    param(
        [Parameter(Mandatory=$true)] $Doc,
        [Parameter(Mandatory=$true)] [string] $Text,
        [int] $Level = 1
    )
    $style = if ($Level -eq 1) { "Heading 1" } else { "Heading 2" }
    $before = if ($Level -eq 1) { 9 } else { 4 }
    $p = Add-Paragraph -Doc $Doc -Text $Text -Style $style -Bold $true -FontSize 16 -SpaceAfter 3 -SpaceBefore $before
    $p.Range.Font.Color = $BrandColor
    return $p
}

function Add-LabelLine {
    param(
        [Parameter(Mandatory=$true)] $Doc,
        [Parameter(Mandatory=$true)] [string] $Label,
        [Parameter(Mandatory=$true)] [string] $Text
    )
    Add-Paragraph -Doc $Doc -Text $Label -FontSize 12 -Bold $true -SpaceAfter 2 | Out-Null
    Add-Paragraph -Doc $Doc -Text $Text -FontSize 9.5 -SpaceAfter 2 | Out-Null
}

function Add-EmailBlock {
    param(
        [Parameter(Mandatory=$true)] $Doc,
        [Parameter(Mandatory=$true)] [string] $Header,
        [string] $Label = "",
        [string] $Subject = "",
        [Parameter(Mandatory=$true)] [string] $Body,
        [object[]] $Meta = @()
    )

    $displayHeader = if ([string]::IsNullOrWhiteSpace($Label)) { $Header } else { "$Header - Variant $Label" }
    $subjectText = if ([string]::IsNullOrWhiteSpace($Subject)) { "(threaded, no subject)" } else { $Subject }
    Add-Paragraph -Doc $Doc -Text $displayHeader -Bold $true -FontSize 12 -SpaceAfter 1 -SpaceBefore 5 | Out-Null
    foreach ($item in $Meta) {
        if (-not [string]::IsNullOrWhiteSpace([string]$item)) {
            Add-Paragraph -Doc $Doc -Text ([string]$item) -FontSize 9.5 -SpaceAfter 2 | Out-Null
        }
    }
    Add-Paragraph -Doc $Doc -Text "Subject: $subjectText" -Style "List Paragraph" -Bold $true -FontSize 10 -SpaceAfter 8 | Out-Null

    foreach ($paragraph in (Get-MarkdownBodyParagraphs -Body $Body)) {
        Add-Paragraph -Doc $Doc -Text $paragraph -Style "List Paragraph" -FontSize 10 -SpaceAfter 8 | Out-Null
    }
}

function Add-SectionBlock {
    param(
        [Parameter(Mandatory=$true)] $Doc,
        [Parameter(Mandatory=$true)] $Section
    )
    Add-Heading -Doc $Doc -Text ([string]$Section.Header) -Level 1 | Out-Null
    foreach ($item in $Section.Meta) {
        if (-not [string]::IsNullOrWhiteSpace([string]$item)) {
            Add-Paragraph -Doc $Doc -Text ([string]$item) -FontSize 9.5 -SpaceAfter 2 | Out-Null
        }
    }
    foreach ($paragraph in (Get-SectionParagraphs -Body ([string]$Section.Body))) {
        Add-Paragraph -Doc $Doc -Text $paragraph -Style "List Paragraph" -FontSize 10 -SpaceAfter 6 | Out-Null
    }
}

switch ($FlowType) {
    "followups" {
        $flow = Read-SequenceYaml -Path $resolvedSource
        if ([string]::IsNullOrWhiteSpace($DocTitle)) { $DocTitle = "Cold Email Follow-Ups" }
        if ([string]::IsNullOrWhiteSpace($Intro)) { $Intro = "What gets sent when prospects do not reply to the main cold email sequence." }
    }
    "interested-reply" {
        $flow = Read-LifecycleMarkdown -Path $resolvedSource
        if ([string]::IsNullOrWhiteSpace($DocTitle)) { $DocTitle = "Interested-Replies Sequence" }
        if ([string]::IsNullOrWhiteSpace($Intro)) { $Intro = "What gets sent, and said on the call, when someone replies with interest, including the follow-ups if they have not booked yet." }
    }
    "pre-call" {
        $flow = Read-LifecycleMarkdown -Path $resolvedSource
        if ([string]::IsNullOrWhiteSpace($DocTitle)) { $DocTitle = "Pre-Call Nurture Flow" }
        if ([string]::IsNullOrWhiteSpace($Intro)) { $Intro = "The confirmation page the prospect sees at booking, and what gets sent between booking and the call." }
    }
    default {
        throw "Unsupported FlowType '$FlowType'. Use followups, interested-reply, or pre-call."
    }
}

if ([string]::IsNullOrWhiteSpace($OutputName)) {
    $OutputName = "$DocTitle.docx"
}
if (-not $OutputName.EndsWith(".docx")) {
    $OutputName = "$OutputName.docx"
}

$outPath = Get-OutputPath -PreferredPath (Join-Path $profileDir $OutputName)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.Options.SaveNormalPrompt = $false

try {
    $doc = $word.Documents.Add()
    $doc.PageSetup.TopMargin = 54
    $doc.PageSetup.BottomMargin = 54
    $doc.PageSetup.LeftMargin = 54
    $doc.PageSetup.RightMargin = 54

    $title = Add-Paragraph -Doc $doc -Text $DocTitle -Style "Title" -Bold $true -FontSize 20 -SpaceAfter 3
    $title.Range.Font.Color = $BrandColor
    Add-Paragraph -Doc $doc -Text $Intro -FontSize 10.5 -SpaceAfter 7 | Out-Null

    if ($flow.Summary.Count -gt 0) {
        Add-Heading -Doc $doc -Text "When To Use" -Level 1 | Out-Null
        foreach ($line in $flow.Summary) {
            Add-Paragraph -Doc $doc -Text ([string]$line) -FontSize 9.5 -SpaceAfter 2 | Out-Null
        }
    }

    foreach ($section in $flow.Sections) {
        if ($section.BeforeSequence) { Add-SectionBlock -Doc $doc -Section $section }
    }

    Add-Heading -Doc $doc -Text "Sequence" -Level 1 | Out-Null
    foreach ($step in $flow.Steps) {
        foreach ($variant in $step.Variants) {
            Add-EmailBlock -Doc $doc -Header $step.Header -Label $variant.Label -Subject $variant.Subject -Body $variant.Body -Meta $variant.Meta
        }
    }

    foreach ($section in $flow.Sections) {
        if (-not $section.BeforeSequence) { Add-SectionBlock -Doc $doc -Section $section }
    }

    if ($flow.Notes.Count -gt 0) {
        Add-Heading -Doc $doc -Text "Notes" -Level 1 | Out-Null
        foreach ($note in $flow.Notes) {
            Add-Paragraph -Doc $doc -Text ([string]$note) -Style "List Paragraph" -FontSize 9.5 -SpaceAfter 2 | Out-Null
        }
    }

    $doc.BuiltInDocumentProperties("Title") = $DocTitle
    $doc.BuiltInDocumentProperties("Subject") = "Cold email lifecycle DOCX presentation"
    $doc.BuiltInDocumentProperties("Author") = $(if ($env:DOC_AUTHOR) { $env:DOC_AUTHOR } else { "FNNL Agency" })

    $doc.SaveAs2([string]$outPath, 16)
    $doc.Close($false)
}
finally {
    $word.Quit()
}

Write-Output "Wrote $outPath"
