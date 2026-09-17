param(
    [Parameter(Mandatory=$true)] [string] $ProfileSlug,
    [Parameter(Mandatory=$true)] [string] $CampaignSlugs,
    [string] $OutputName = "",
    [string] $DocTitle = "",
    [string] $Intro = "",
    [string] $TargetsJson = "{}",
    [string] $AnglesJson = "{}"
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

$slugs = $CampaignSlugs.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 }
if ($slugs.Count -eq 0) {
    throw "No campaign slugs provided."
}

function Convert-JsonObjectToHashtable {
    param([string] $Json, [string] $Name)
    try {
        $object = ConvertFrom-Json $Json
    } catch {
        throw "$Name must be valid JSON object text."
    }

    $table = @{}
    if ($null -eq $object) { return $table }
    foreach ($property in $object.PSObject.Properties) {
        $table[$property.Name] = [string]$property.Value
    }
    return $table
}

$targets = Convert-JsonObjectToHashtable -Json $TargetsJson -Name "TargetsJson"
$angles = Convert-JsonObjectToHashtable -Json $AnglesJson -Name "AnglesJson"

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

function Convert-SlugTitle {
    param([string] $Slug)
    return (($Slug -split "-") | ForEach-Object {
        if ($_.Length -eq 0) { "" } else { $_.Substring(0,1).ToUpper() + $_.Substring(1) }
    }) -join " "
}

function Read-CampaignYaml {
    param([Parameter(Mandatory=$true)] [string] $Path)

    $lines = Get-Content -LiteralPath $Path -Encoding UTF8
    $name = ""
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
            continue
        }

        if ($line -match '^\s{6}-\slabel:\s*(.+)$' -and $currentStep) {
            $currentVariant = [pscustomobject]@{
                Label = Convert-YamlScalar $Matches[1]
                Subject = ""
                Body = ""
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
        Steps = $steps
    }
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
    try { $p.Range.Style = $Style } catch { }   # some Word installs/templates don't expose every built-in style by name; font/size/bold are set explicitly below, so degrade to default rather than E_FAIL
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
        [Parameter(Mandatory=$true)] [int] $Step,
        [Parameter(Mandatory=$true)] [int] $DelayDays,
        [Parameter(Mandatory=$true)] [string] $Label,
        [string] $Subject,
        [Parameter(Mandatory=$true)] [string] $Body
    )

    $subjectText = if ([string]::IsNullOrWhiteSpace($Subject)) { "(threaded, no subject)" } else { $Subject }
    Add-Paragraph -Doc $Doc -Text "Email $Step - Day +$DelayDays - Variant $Label" -Bold $true -FontSize 12 -SpaceAfter 1 -SpaceBefore 5 | Out-Null
    Add-Paragraph -Doc $Doc -Text "Subject: $subjectText" -Style "List Paragraph" -Bold $true -FontSize 10 -SpaceAfter 8 | Out-Null

    $parts = $Body -split "(`r`n){2,}|`n`n"
    foreach ($part in $parts) {
        $cleanPart = $part.Trim()
        if ($cleanPart.Length -gt 0) {
            Add-Paragraph -Doc $Doc -Text $cleanPart -Style "List Paragraph" -FontSize 10 -SpaceAfter 8 | Out-Null
        }
    }
}

$parsedCampaigns = foreach ($slug in $slugs) {
    $yamlPath = Join-Path $profileDir "campaigns\$slug\variants.yaml"
    if (-not (Test-Path -LiteralPath $yamlPath)) {
        throw "variants.yaml not found for campaign '$slug': $yamlPath"
    }
    $data = Read-CampaignYaml -Path $yamlPath
    $target = if ($targets.ContainsKey($slug)) { [string]$targets[$slug] } else { "Add target audience here." }
    $angle = if ($angles.ContainsKey($slug)) { [string]$angles[$slug] } else { "Add campaign angle here." }
    [pscustomobject]@{
        Slug = $slug
        Title = Convert-SlugTitle $slug
        Target = $target
        Angle = $angle
        Data = $data
    }
}

if ([string]::IsNullOrWhiteSpace($DocTitle)) {
    $DocTitle = "$ProfileSlug - Campaign Launches"
}

if ([string]::IsNullOrWhiteSpace($Intro)) {
    $Intro = "MVP launch sheet for the selected cold email campaign sequence. The point is simple: show what we are launching, who each campaign targets, the angle, and the full email sequence."
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

    Add-Heading -Doc $doc -Text "Campaign Snapshot" -Level 1 | Out-Null
    foreach ($campaign in $parsedCampaigns) {
        $variantCount = 0
        foreach ($step in $campaign.Data.Steps) { $variantCount += $step.Variants.Count }
        Add-Paragraph -Doc $doc -Text "$($campaign.Title): $($campaign.Data.Steps.Count) emails, $variantCount total variants. $($campaign.Angle)" -Style "List Paragraph" -FontSize 9.5 -SpaceAfter 2 | Out-Null
    }

    $index = 1
    foreach ($campaign in $parsedCampaigns) {
        Add-Heading -Doc $doc -Text "$index. $($campaign.Title)" -Level 1 | Out-Null
        Add-LabelLine -Doc $doc -Label "Target:" -Text $campaign.Target
        Add-LabelLine -Doc $doc -Label "Angle:" -Text $campaign.Angle
        Add-Heading -Doc $doc -Text "Sequence" -Level 2 | Out-Null

        foreach ($step in $campaign.Data.Steps) {
            foreach ($variant in $step.Variants) {
                Add-EmailBlock -Doc $doc -Step $step.Step -DelayDays $step.DelayDays -Label $variant.Label -Subject $variant.Subject -Body $variant.Body
            }
        }
        $index++
    }

    $doc.BuiltInDocumentProperties("Title") = $DocTitle
    $doc.BuiltInDocumentProperties("Subject") = "MVP cold email campaign launch sheet"
    $doc.BuiltInDocumentProperties("Author") = $(if ($env:DOC_AUTHOR) { $env:DOC_AUTHOR } else { "FNNL Agency" })

    $doc.SaveAs2([string]$outPath, 16)
    $doc.Close($false)
}
finally {
    try { $word.Quit() } catch { }   # Word can disconnect after SaveAs2/Close on some boxes; the .docx is already written, so a Quit RPC failure must not fail the run
}

Write-Output "Wrote $outPath"
