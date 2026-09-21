param(
    [Parameter(Mandatory=$true)] [string] $ProfileSlug,
    [string] $CampaignSlug = "",
    [string] $CampaignSlugs = "",
    [string] $PreparedBy = "Add operator name here",
    [string] $OutputName = "",
    [switch] $SkipDocx
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path "."
$profileDir = Join-Path $root "profiles\$ProfileSlug"
if (-not (Test-Path -LiteralPath $profileDir)) {
    throw "Profile folder not found: $profileDir"
}

if ([string]::IsNullOrWhiteSpace($CampaignSlugs)) {
    $CampaignSlugs = $CampaignSlug
}

$slugs = @($CampaignSlugs.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 })
if ($slugs.Count -eq 0) {
    throw "Provide -CampaignSlugs `"campaign-one,campaign-two`" or legacy -CampaignSlug `"campaign-one`"."
}

function New-TextFromCodes {
    param([int[]] $Codes)
    return (($Codes | ForEach-Object { [string][char]$_ }) -join "")
}

function Convert-DocText {
    param([string] $Text)
    if ($null -eq $Text) { return "" }

    $clean = [string]$Text
    $replacements = @(
        @{ From = @(0x00E2,0x20AC,0x201D); To = "-" },
        @{ From = @(0x00E2,0x20AC,0x201C); To = "-" },
        @{ From = @(0x00E2,0x20AC,0x2018); To = "-" },
        @{ From = @(0x00E2,0x20AC,0x02DC); To = "'" },
        @{ From = @(0x00E2,0x20AC,0x2122); To = "'" },
        @{ From = @(0x00E2,0x20AC,0x0153); To = '"' },
        @{ From = @(0x00E2,0x20AC,0x009D); To = '"' },
        @{ From = @(0x00E2,0x20AC,0x00A6); To = "..." },
        @{ From = @(0x00E2,0x2020,0x2019); To = "->" },
        @{ From = @(0x00E2,0x201A,0x00AC); To = "EUR" },
        @{ From = @(0x00E2,0x2030,0x00A5); To = ">=" },
        @{ From = @(0x00E2,0x2030,0x00A4); To = "<=" },
        @{ From = @(0x00C3,0x00B6); To = "o" },
        @{ From = @(0x00C3,0x00A5); To = "a" },
        @{ From = @(0x00C3,0x00A4); To = "a" },
        @{ From = @(0x00C3,0x00A9); To = "e" },
        @{ From = @(0x00C3,0x00A6); To = "ae" },
        @{ From = @(0x00C3,0x00B8); To = "o" }
    )
    foreach ($item in $replacements) {
        $clean = $clean.Replace((New-TextFromCodes $item.From), $item.To)
    }

    $clean = $clean.Replace([string]([char]0x2014), "-")
    $clean = $clean.Replace([string]([char]0x2013), "-")
    $clean = $clean.Replace([string]([char]0x2018), "'")
    $clean = $clean.Replace([string]([char]0x2019), "'")
    $clean = $clean.Replace([string]([char]0x201C), '"')
    $clean = $clean.Replace([string]([char]0x201D), '"')
    $clean = $clean.Replace([string]([char]0x2192), "->")
    $clean = $clean.Replace([string]([char]0x2190), "<-")
    $clean = $clean.Replace([string]([char]0x20AC), "EUR")
    $clean = $clean.Replace([string]([char]0x2265), ">=")
    $clean = $clean.Replace([string]([char]0x2264), "<=")
    $clean = $clean.Replace([string]([char]0x00A0), " ")
    $clean = $clean -replace '\*\*', ''
    $clean = $clean -replace '`', ''
    $clean = $clean -replace "[`t ]+", " "
    $clean = $clean -replace " *(`r`n|`n|`r) *", "`n"
    return $clean.Trim()
}

function Fallback {
    param([string] $Value)
    $clean = Convert-DocText $Value
    if ([string]::IsNullOrWhiteSpace($clean)) { return "Not captured in current artifacts." }
    return $clean
}

function Convert-ClientFacingText {
    param([string] $Text)
    $clean = Convert-DocText $Text
    $clean = $clean -replace 'Clay LinkedIn Jobs integration or manual export', 'job-posting extraction or manual export'
    $clean = $clean -replace 'Clay-based', 'operator-led'
    $clean = $clean -replace 'Claygent', 'personalization workflow'
    $clean = $clean -replace 'EmailBison', 'the sending platform'
    $clean = $clean -replace 'MillionVerifier', 'the selected verifier'
    return $clean
}

function Convert-SlugTitle {
    param([string] $Slug)
    return (($Slug -split "-") | ForEach-Object {
        if ($_.Length -eq 0) { "" } else { $_.Substring(0,1).ToUpper() + $_.Substring(1) }
    }) -join " "
}

function Get-Lines {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path)) { return @() }
    return @(Get-Content -LiteralPath $Path -Encoding UTF8)
}

function Get-YamlSection {
    param([object[]] $Lines, [string] $SectionName)
    $start = -1
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ([string]$Lines[$i] -match ('^' + [regex]::Escape($SectionName) + ':\s*$')) {
            $start = $i
            break
        }
    }
    if ($start -lt 0) { return @() }

    $items = New-Object System.Collections.Generic.List[string]
    for ($i = $start + 1; $i -lt $Lines.Count; $i++) {
        $line = [string]$Lines[$i]
        if ($line -match '^[A-Za-z0-9_-]+:\s*$') { break }
        $items.Add($line)
    }
    return @($items.ToArray())
}

function Get-YamlValue {
    param([object[]] $Lines, [string] $Key, [string] $Default = "")
    $pattern = '^\s*' + [regex]::Escape($Key) + ':\s*(.+?)\s*$'
    foreach ($line in $Lines) {
        if ([string]$line -match $pattern) {
            $value = $Matches[1].Trim()
            if ($value -eq ">" -or $value -eq "|") { return $Default }
            return Convert-DocText $value.Trim('"')
        }
    }
    return $Default
}

function Get-BoldLabelValue {
    param([object[]] $Lines, [string] $Label, [string] $Default = "")
    $pattern = '^\s*(?:-\s*)?\*\*' + [regex]::Escape($Label) + ':\*\*\s*(.+?)\s*$'
    foreach ($line in $Lines) {
        if ([string]$line -match $pattern) {
            return Convert-DocText $Matches[1]
        }
    }
    return $Default
}

function Get-BoldLabelValueAny {
    param([object[]] $Lines, [string[]] $Labels, [string] $Default = "")
    foreach ($label in $Labels) {
        $value = Get-BoldLabelValue -Lines $Lines -Label $label
        if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
    }
    return $Default
}

function Get-FirstMatch {
    param([object[]] $Lines, [string] $Pattern, [string] $Default = "")
    foreach ($line in $Lines) {
        if ([string]$line -match $Pattern) {
            return Convert-DocText $Matches[1]
        }
    }
    return $Default
}

function Get-MarkdownSection {
    param([object[]] $Lines, [string] $HeadingRegex)
    $start = -1
    $level = 2
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $line = [string]$Lines[$i]
        if ($line -match $HeadingRegex) {
            $start = $i
            if ($line -match '^(#+)\s') { $level = $Matches[1].Length }
            break
        }
    }
    if ($start -lt 0) { return @() }

    $items = New-Object System.Collections.Generic.List[string]
    for ($i = $start + 1; $i -lt $Lines.Count; $i++) {
        $line = [string]$Lines[$i]
        if ($line -match '^#{1,' + $level + '}\s') { break }
        $items.Add($line)
    }
    return @($items.ToArray())
}

function Get-MarkdownTableRows {
    param([object[]] $Lines)
    $rows = New-Object System.Collections.Generic.List[object]
    foreach ($line in $Lines) {
        $trimmed = ([string]$line).Trim()
        if (-not $trimmed.StartsWith("|")) { continue }
        if ($trimmed -match '^\|\s*-') { continue }
        $cells = @($trimmed.Trim("|").Split("|") | ForEach-Object { Convert-DocText $_ })
        if ($cells.Count -eq 0) { continue }
        if ($cells[0] -match '^(Campaign Name|Rank|Archetype|File)$') { continue }
        $rows.Add([pscustomobject]@{ Cells = $cells })
    }
    return @($rows.ToArray())
}

function Add-UniqueText {
    param(
        [System.Collections.Generic.List[string]] $List,
        [string] $Text
    )
    $clean = Convert-DocText $Text
    if ($clean.Length -gt 0 -and -not $List.Contains($clean)) {
        $List.Add($clean)
    }
}

function Limit-Items {
    param([object[]] $Items, [int] $Max = 5)
    $out = New-Object System.Collections.Generic.List[string]
    foreach ($item in $Items) {
        Add-UniqueText -List $out -Text ([string]$item)
        if ($out.Count -ge $Max) { break }
    }
    if ($out.Count -eq 0) { return @("Not captured in current artifacts.") }
    return @($out.ToArray())
}

function Get-Bullets {
    param([object[]] $Lines)
    $items = New-Object System.Collections.Generic.List[string]
    foreach ($line in $Lines) {
        if ([string]$line -match '^\s*-\s+(.+?)\s*$') {
            Add-UniqueText -List $items -Text $Matches[1]
        }
    }
    return @($items.ToArray())
}

function Join-Numbered {
    param([object[]] $Items, [int] $Max = 5)
    $clean = New-Object System.Collections.Generic.List[string]
    foreach ($item in $Items) {
        Add-UniqueText -List $clean -Text ([string]$item)
    }
    if ($clean.Count -eq 0) {
        $clean.Add("Not captured in current artifacts.")
    }

    $lines = New-Object System.Collections.Generic.List[string]
    $i = 1
    foreach ($item in ($clean | Select-Object -First $Max)) {
        $lines.Add("$i. $(Convert-DocText ([string]$item))")
        $i++
    }
    if ($clean.Count -gt $Max) {
        $lines.Add("$i. Additional options are preserved in the Markdown source.")
    }
    return (($lines.ToArray()) -join "`r")
}

function New-Decision {
    param(
        [string] $Title,
        [string] $Chosen,
        [string] $Why,
        [object[]] $Alternatives,
        [string] $Risk,
        [string] $Prompt
    )
    return [pscustomobject]@{
        Title = $Title
        Chosen = Fallback $Chosen
        Why = Fallback $Why
        Alternatives = @($Alternatives)
        Risk = Fallback $Risk
        Prompt = Fallback $Prompt
    }
}

function Get-FirstStandaloneBold {
    param([object[]] $Lines)
    foreach ($line in $Lines) {
        if ([string]$line -match '^\s*\*\*(.+?)\*\*\s*$') {
            return Convert-DocText $Matches[1]
        }
    }
    return ""
}

function Get-SourceSignalAlternatives {
    param([object[]] $CatalogLines)
    $items = New-Object System.Collections.Generic.List[string]
    $rows = Get-MarkdownTableRows -Lines (Get-MarkdownSection -Lines $CatalogLines -HeadingRegex '^##\s+Ranked Source Signals\s*$')
    foreach ($row in $rows) {
        if ($row.Cells.Count -ge 3) {
            Add-UniqueText -List $items -Text "$($row.Cells[1]): $($row.Cells[2])"
        }
    }
    return @($items.ToArray())
}

function Assert-DataPointCatalogSections {
    param([string] $Path, [object[]] $CatalogLines)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Data point catalog not found: $Path. The client-facing approval deck cannot build the 'Source-signal decision' alternatives or the 'Targeting decision' risk line without it. Run /data-point-discovery for this client, then rerun this script."
    }

    $signalRows = @(Get-SourceSignalAlternatives -CatalogLines $CatalogLines)
    if ($signalRows.Count -eq 0) {
        throw "No ranked source signals parsed from $Path. That file needs a '## Ranked Source Signals' heading above a markdown table whose first three columns stay Rank, Source family, Exact observable signal. Without it the 'Source-signal decision' section of the client deck would be blank."
    }

    $risksValue = Get-FirstMatch -Lines $CatalogLines -Pattern '^\-\s+\*\*Source risks:\*\*\s*(.+)$'
    if ([string]::IsNullOrWhiteSpace($risksValue)) {
        throw "No source risks line parsed from $Path. That file needs a bullet in the exact form '- **Source risks:** <text>', bold intact and a non-empty value after the colon. Without it the 'Targeting decision' risk line of the client deck would be blank."
    }
}

function Get-OfferAlternatives {
    param([string] $ChosenOffer)
    $items = New-Object System.Collections.Generic.List[string]

    $primarySection = Get-MarkdownSection -Lines $leadMagnetLines -HeadingRegex '^##\s+Primary Offer'
    $primaryName = Get-FirstStandaloneBold -Lines $primarySection
    if ($primaryName.Length -gt 0 -and $ChosenOffer -notlike "*$primaryName*") {
        Add-UniqueText -List $items -Text "${primaryName}: primary hiring-signal offer"
    }

    $secondarySection = Get-MarkdownSection -Lines $leadMagnetLines -HeadingRegex '^##\s+Secondary Offer'
    $secondaryName = Get-FirstStandaloneBold -Lines $secondarySection
    if ($secondaryName.Length -gt 0 -and $ChosenOffer -notlike "*$secondaryName*") {
        Add-UniqueText -List $items -Text "${secondaryName}: secondary/new-CFO offer"
    }

    $archivedSection = Get-MarkdownSection -Lines $leadMagnetLines -HeadingRegex '^##\s+Archived / Not Selected\s*$'
    foreach ($line in $archivedSection) {
        if ([string]$line -match '^\s*-\s+\*\*(.+?):\*\*\s*(.+?)\s*$') {
            Add-UniqueText -List $items -Text "$($Matches[1]): $($Matches[2])"
        }
        elseif ([string]$line -match '^\s*-\s+(.+?)\s*$') {
            Add-UniqueText -List $items -Text $Matches[1]
        }
    }

    $offerPrimary = Get-FirstMatch -Lines $offerIntelLines -Pattern '^\*\*Primary:\*\*\s*(.+)$'
    if ($offerPrimary.Length -gt 0 -and $ChosenOffer -notlike "*$offerPrimary*") {
        Add-UniqueText -List $items -Text "Market-research primary option: $offerPrimary"
    }
    $offerSecondary = Get-FirstMatch -Lines $offerIntelLines -Pattern '^\*\*Secondary:\*\*\s*(.+)$'
    if ($offerSecondary.Length -gt 0) {
        Add-UniqueText -List $items -Text "Market-research secondary option: $offerSecondary"
    }
    $offerAvoid = Get-FirstMatch -Lines $offerIntelLines -Pattern '^\*\*Avoid:\*\*\s*(.+)$'
    if ($offerAvoid.Length -gt 0) {
        Add-UniqueText -List $items -Text "Avoided primary CTA: $offerAvoid"
    }
    $offerClientNote = Get-FirstMatch -Lines $offerIntelLines -Pattern '^\*\*Note on ROI calculator.*?:\*\*\s*(.+)$'
    if ($offerClientNote.Length -gt 0) {
        Add-UniqueText -List $items -Text "Client-suggested ROI calculator: $offerClientNote"
    }

    $strategyOfferSection = Get-MarkdownSection -Lines $campaignStrategyLines -HeadingRegex '^##\s+Front-End Offer Suggestions\s*$'
    foreach ($line in $strategyOfferSection) {
        if ([string]$line -match '^\s*\*\*\d+\.\s*(.+?)\*\*\s*$') {
            $offerName = Convert-DocText $Matches[1]
            if ($ChosenOffer -notlike "*$offerName*") {
                Add-UniqueText -List $items -Text "Campaign-strategy option: $offerName"
            }
        }
    }

    return @($items.ToArray())
}

function Get-LeadSourceAlternatives {
    param([object[]] $LeadSourceLines)
    $items = New-Object System.Collections.Generic.List[string]
    $sourceOptionsSection = Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+Primary Source Path\s*$'
    foreach ($line in $sourceOptionsSection) {
        if ([string]$line -match '^\s{2}-\s+(.+)$') {
            Add-UniqueText -List $items -Text (Convert-ClientFacingText $Matches[1])
        }
    }

    $backupSection = Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+Backup Source Path\s*$'
    $oldSpecificLabel = "Specific " + "source or tool"
    $backupSpecific = Get-BoldLabelValueAny -Lines $backupSection -Labels @("Specific collection source or tool", $oldSpecificLabel)
    $backupContact = Get-BoldLabelValue -Lines $backupSection -Label "Contact enrichment layer"
    $switchRule = Get-BoldLabelValue -Lines $backupSection -Label "When to switch"
    if ($backupSpecific.Length -gt 0) { Add-UniqueText -List $items -Text "Backup collection: $(Convert-ClientFacingText $backupSpecific)" }
    if ($backupContact.Length -gt 0) { Add-UniqueText -List $items -Text "Backup contact enrichment: $(Convert-ClientFacingText $backupContact)" }
    if ($switchRule.Length -gt 0) { Add-UniqueText -List $items -Text "Switch rule: $(Convert-ClientFacingText $switchRule)" }

    return @($items.ToArray())
}

function Get-CopyAlternatives {
    param([object] $VariantData)
    $items = New-Object System.Collections.Generic.List[string]
    if (-not $VariantData) { return @() }

    foreach ($step in $VariantData.Steps) {
        foreach ($variant in $step.Variants) {
            if ($variant.Label -eq "A") { continue }
            $subject = if ([string]::IsNullOrWhiteSpace($variant.Subject)) { "(threaded follow-up)" } else { $variant.Subject }
            Add-UniqueText -List $items -Text "Email $($step.Step) Variant $($variant.Label): $subject"
        }
    }
    return @($items.ToArray())
}

function Get-FieldNames {
    param([object[]] $Lines)
    $items = New-Object System.Collections.Generic.List[string]
    foreach ($line in $Lines) {
        if ([string]$line -match '^\s*-\s*`([^`]+)`') {
            Add-UniqueText -List $items -Text $Matches[1]
        }
    }
    if ($items.Count -eq 0) {
        foreach ($line in $Lines) {
            if ([string]$line -match '^\s*-\s+([^:-]+)[:\-]') {
                Add-UniqueText -List $items -Text $Matches[1]
            }
        }
    }
    return @($items.ToArray())
}

function Get-LeadSourceSummary {
    param([object[]] $LeadSourceLines)

    $oldSpecificLabel = "Specific " + "source or tool"
    $sourceStack = @(Get-Bullets -Lines (Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+Source Stack\s*$') | ForEach-Object { Convert-ClientFacingText $_ })

    $primarySection = Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+Primary Source Path\s*$'
    $primaryItems = New-Object System.Collections.Generic.List[string]
    foreach ($label in @("Source family", "Specific collection source or tool", $oldSpecificLabel, "Contact enrichment layer", "Exact signal", "Target geography", "Why this beats a generic database pull")) {
        $value = Get-BoldLabelValue -Lines $primarySection -Label $label
        if ([string]::IsNullOrWhiteSpace($value) -and $label -eq "Specific collection source or tool") {
            $value = Get-BoldLabelValue -Lines $primarySection -Label $oldSpecificLabel
        }
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            Add-UniqueText -List $primaryItems -Text "${label}: $(Convert-ClientFacingText $value)"
        }
    }
    $expectedVolume = Convert-ClientFacingText (Get-BoldLabelValue -Lines $primarySection -Label "Expected volume")

    $backupSection = Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+Backup Source Path\s*$'
    $backupItems = New-Object System.Collections.Generic.List[string]
    foreach ($label in @("Source family", "Specific collection source or tool", $oldSpecificLabel, "Contact enrichment layer", "When to switch")) {
        $value = Get-BoldLabelValue -Lines $backupSection -Label $label
        if ([string]::IsNullOrWhiteSpace($value) -and $label -eq "Specific collection source or tool") {
            $value = Get-BoldLabelValue -Lines $backupSection -Label $oldSpecificLabel
        }
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            Add-UniqueText -List $backupItems -Text "${label}: $(Convert-ClientFacingText $value)"
        }
    }

    $fieldItems = @(Get-FieldNames -Lines (Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+Fields To Collect\s*$'))
    $qaItems = @(Get-Bullets -Lines (Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+QA And Stop Gates\s*$') | ForEach-Object { Convert-ClientFacingText $_ })
    $assetBlocker = Get-MarkdownSection -Lines $LeadSourceLines -HeadingRegex '^##\s+Asset Blocker'
    $assetAction = Get-FirstMatch -Lines $assetBlocker -Pattern '^\*\*Action required from Sam:\*\*\s*(.+)$'

    return [pscustomobject]@{
        SourceStack = @(Limit-Items -Items $sourceStack -Max 5)
        PrimaryPath = @(Limit-Items -Items @($primaryItems.ToArray()) -Max 6)
        BackupPath = @(Limit-Items -Items @($backupItems.ToArray()) -Max 4)
        ExpectedVolume = $(if ([string]::IsNullOrWhiteSpace($expectedVolume)) { "Not captured in current artifacts." } else { $expectedVolume })
        Fields = @(Limit-Items -Items $fieldItems -Max 12)
        QaGates = @(Limit-Items -Items $qaItems -Max 5)
        AssetGate = Convert-ClientFacingText $assetAction
    }
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
            $currentVariant.Body = Convert-DocText ((($bodyLines.ToArray()) -join "`n").TrimEnd())
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

function Get-PrimaryVariant {
    param([object] $Step)
    foreach ($variant in $Step.Variants) {
        if ($variant.Label -eq "A") { return $variant }
    }
    if ($Step.Variants.Count -gt 0) { return $Step.Variants[0] }
    return $null
}

function Get-OutputPath {
    param([Parameter(Mandatory=$true)] [string] $PreferredPath)
    if (-not (Test-Path -LiteralPath $PreferredPath)) { return $PreferredPath }
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

function New-CampaignBrief {
    param([string] $Slug, [int] $Index)

    $campaignDir = Join-Path $profileDir "campaigns\$Slug"
    $leadSourcePlanPath = Join-Path $campaignDir "lead-source-plan.md"
    if (-not (Test-Path -LiteralPath $leadSourcePlanPath)) {
        throw "Lead source plan not found for campaign '$Slug': $leadSourcePlanPath"
    }

    $leadSourceLines = Get-Lines $leadSourcePlanPath
    $variantsPath = Join-Path $campaignDir "variants.yaml"
    $variantData = $null
    if (Test-Path -LiteralPath $variantsPath) {
        $variantData = Read-CampaignYaml -Path $variantsPath
    }

    $name = Get-BoldLabelValue -Lines $leadSourceLines -Label "Campaign" -Default (Convert-SlugTitle $Slug)
    $icp = Get-BoldLabelValue -Lines $leadSourceLines -Label "ICP"
    $offer = Get-BoldLabelValue -Lines $leadSourceLines -Label "Offer"
    $angle = Get-BoldLabelValue -Lines $leadSourceLines -Label "Campaign angle"
    $whyNow = Get-BoldLabelValue -Lines $leadSourceLines -Label "Why this list should care now"
    $sourceFamily = Get-BoldLabelValue -Lines $leadSourceLines -Label "Source family"
    $oldSpecificLabel = "Specific " + "source or tool"
    $collectionPath = Get-BoldLabelValueAny -Lines $leadSourceLines -Labels @("Specific collection source or tool", $oldSpecificLabel)
    $contactLayer = Get-BoldLabelValue -Lines $leadSourceLines -Label "Contact enrichment layer"
    $sourcePath = $collectionPath
    if (-not [string]::IsNullOrWhiteSpace($contactLayer)) {
        $sourcePath = "collection: $collectionPath; contact enrichment: $contactLayer"
    }
    $signal = Get-BoldLabelValue -Lines $leadSourceLines -Label "Exact signal"
    $geo = Get-BoldLabelValue -Lines $leadSourceLines -Label "Target geography"
    $whySource = Get-BoldLabelValue -Lines $leadSourceLines -Label "Why this beats a generic database pull"
    $expectedVolume = Get-BoldLabelValue -Lines $leadSourceLines -Label "Expected volume"
    $locationRisk = Get-BoldLabelValue -Lines $leadSourceLines -Label "Location coverage risk"
    $dataRisk = Get-BoldLabelValue -Lines $leadSourceLines -Label "Data availability risk"
    $riskParts = New-Object System.Collections.Generic.List[string]
    if (-not [string]::IsNullOrWhiteSpace($locationRisk)) { $riskParts.Add("Location coverage risk: " + (Convert-ClientFacingText $locationRisk)) }
    if (-not [string]::IsNullOrWhiteSpace($dataRisk)) { $riskParts.Add("Data availability risk: " + (Convert-ClientFacingText $dataRisk)) }
    $risk = Fallback (($riskParts.ToArray()) -join " ")
    $leadSourceSummary = Get-LeadSourceSummary -LeadSourceLines $leadSourceLines
    if ($Slug -eq "new-cfo-benchmark" -and -not [string]::IsNullOrWhiteSpace($leadSourceSummary.AssetGate)) {
        $risk = Fallback "$risk Asset gate: $($leadSourceSummary.AssetGate)"
    }

    $variantsCount = 0
    $stepsCount = 0
    if ($variantData) {
        $stepsCount = $variantData.Steps.Count
        foreach ($step in $variantData.Steps) { $variantsCount += $step.Variants.Count }
    }

    $role = if ($Slug -eq "new-cfo-benchmark") {
        "Queued / asset-gated campaign"
    }
    elseif ($Index -eq 1) {
        "Best-result campaign"
    }
    elseif ($Index -eq 2) {
        "Fast macro campaign"
    }
    else {
        "Additional selected campaign"
    }

    $roleWhy = if ($Slug -eq "new-cfo-benchmark") {
        "This is documented as a full campaign path, but it should not launch with a benchmark CTA until the benchmark data or asset-safe fallback is approved."
    }
    elseif ($Index -eq 1) {
        "This is the highest-signal path because the source proves live pain and budget before we send."
    }
    elseif ($Index -eq 2) {
        "This is the faster broader path because the list is static, the proof anchor does the work, and no custom lead magnet needs client input."
    }
    else {
        "This campaign is included as an additional approved path."
    }

    $campaignAlternatives = @(Get-CampaignAlternatives -CampaignStrategyLines $campaignStrategyLines -SelectedSlugs $slugs)
    $sourceSignalAlternatives = @(Get-SourceSignalAlternatives -CatalogLines $dataPointCatalogLines)
    $offerAlternatives = @(Get-OfferAlternatives -ChosenOffer $offer)
    $leadSourceAlternatives = @(Get-LeadSourceAlternatives -LeadSourceLines $leadSourceLines)
    $copyAlternatives = @(Get-CopyAlternatives -VariantData $variantData)

    $sourceRisks = Convert-ClientFacingText (Get-FirstMatch -Lines $dataPointCatalogLines -Pattern '^\-\s+\*\*Source risks:\*\*\s*(.+)$')
    $primaryOfferSection = Get-MarkdownSection -Lines $leadMagnetLines -HeadingRegex '^##\s+Primary Offer'
    $secondaryOfferSection = Get-MarkdownSection -Lines $leadMagnetLines -HeadingRegex '^##\s+Secondary Offer'
    $primaryOfferWhy = Get-FirstMatch -Lines $primaryOfferSection -Pattern '^Why this works:\s*(.+)$'
    $secondaryOfferWhy = Get-FirstMatch -Lines $secondaryOfferSection -Pattern '^Why this works:\s*(.+)$'
    $offerWhy = $angle
    if ($offer -like "*Billing Gap Observation*" -and $primaryOfferWhy.Length -gt 0) {
        $offerWhy = $primaryOfferWhy
    }
    elseif ($offer -like "*Benchmark*" -and $secondaryOfferWhy.Length -gt 0) {
        $offerWhy = $secondaryOfferWhy
    }

    $copyChosen = if ($variantData) {
        "$stepsCount email steps, $variantsCount variants. $angle"
    }
    else {
        "No variants.yaml captured for this campaign."
    }

    $decisions = New-Object System.Collections.Generic.List[object]
    $decisions.Add((New-Decision `
        -Title "Targeting decision" `
        -Chosen $icp `
        -Why $whyNow `
        -Alternatives $campaignAlternatives `
        -Risk (Fallback $sourceRisks) `
        -Prompt "Keep this ICP, or mark the titles, industries, headcount, or geography you want changed before list build."))

    $decisions.Add((New-Decision `
        -Title "Source-signal decision" `
        -Chosen $signal `
        -Why $whySource `
        -Alternatives $sourceSignalAlternatives `
        -Risk $risk `
        -Prompt "Keep this source signal, or mark the signal you believe better proves urgency."))

    $decisions.Add((New-Decision `
        -Title "Offer / lead magnet decision" `
        -Chosen $offer `
        -Why $offerWhy `
        -Alternatives $offerAlternatives `
        -Risk $risk `
        -Prompt "Keep this offer, or mark the offer you would rather lead with before copy or list scale."))

    $decisions.Add((New-Decision `
        -Title "Launch role decision" `
        -Chosen "$name - $role" `
        -Why "$roleWhy $whyNow" `
        -Alternatives $campaignAlternatives `
        -Risk $risk `
        -Prompt "Keep this campaign in this launch role, or mark which campaign should replace it."))

    $decisions.Add((New-Decision `
        -Title "Lead-source decision" `
        -Chosen "$sourceFamily; $sourcePath; geography: $geo" `
        -Why $whySource `
        -Alternatives $leadSourceAlternatives `
        -Risk $risk `
        -Prompt "Approve this source path, or mark the source you want used before lead build or enrichment spend."))

    $decisions.Add((New-Decision `
        -Title "Copy approach decision" `
        -Chosen $copyChosen `
        -Why $angle `
        -Alternatives $copyAlternatives `
        -Risk "Copy depends on the selected source evidence and campaign variables being present in the lead list." `
        -Prompt "Keep this copy direction, or mark the angle you want changed before upload."))

    return [pscustomobject]@{
        Slug = $Slug
        Index = $Index
        Role = $role
        RoleWhy = $roleWhy
        Name = Fallback $name
        Icp = Fallback $icp
        Offer = Fallback $offer
        Angle = Fallback $angle
        WhyNow = Fallback $whyNow
        SourceFamily = Fallback $sourceFamily
        SourcePath = Fallback $sourcePath
        Signal = Fallback $signal
        Geography = Fallback $geo
        WhySource = Fallback $whySource
        ExpectedVolume = Fallback $expectedVolume
        Risk = $risk
        VariantsPath = $variantsPath
        VariantData = $variantData
        StepCount = $stepsCount
        VariantCount = $variantsCount
        LeadSourceSummary = $leadSourceSummary
        Decisions = @($decisions.ToArray())
    }
}

function Get-BlockedCampaigns {
    param([string[]] $SelectedSlugs)
    $blocked = New-Object System.Collections.Generic.List[object]
    $campaignRoot = Join-Path $profileDir "campaigns"
    if (-not (Test-Path -LiteralPath $campaignRoot)) { return @() }

    foreach ($dir in (Get-ChildItem -LiteralPath $campaignRoot -Directory)) {
        if ($SelectedSlugs -contains $dir.Name) { continue }
        $planPath = Join-Path $dir.FullName "lead-source-plan.md"
        if (-not (Test-Path -LiteralPath $planPath)) { continue }
        $lines = Get-Lines $planPath
        $assetBlocker = Get-MarkdownSection -Lines $lines -HeadingRegex '^##\s+Asset Blocker'
        if ($assetBlocker.Count -eq 0 -and $dir.Name -ne "new-cfo-benchmark") { continue }

        $name = Get-BoldLabelValue -Lines $lines -Label "Campaign" -Default (Convert-SlugTitle $dir.Name)
        $offer = Get-BoldLabelValue -Lines $lines -Label "Offer"
        $action = Get-FirstMatch -Lines $lines -Pattern '^\*\*Action required from Sam:\*\*\s*(.+)$'
        $fallback = "Benchmark campaign is useful, but the benchmark CTA needs anonymized customer data before it is real. If the client cannot provide it, use the no-benchmark fallback copy instead."
        $blocked.Add([pscustomobject]@{
            Slug = $dir.Name
            Name = Fallback $name
            Offer = Fallback $offer
            Reason = Fallback $(if ($action.Length -gt 0) { $action } else { $fallback })
        })
    }
    return @($blocked.ToArray())
}

function Get-CampaignAlternatives {
    param([object[]] $CampaignStrategyLines, [string[]] $SelectedSlugs)
    $items = New-Object System.Collections.Generic.List[string]
    $rows = Get-MarkdownTableRows -Lines (Get-MarkdownSection -Lines $CampaignStrategyLines -HeadingRegex '^##\s+Campaign Ideas\s*$')
    foreach ($row in $rows) {
        if ($row.Cells.Count -lt 1) { continue }
        $name = $row.Cells[0]
        $isSelected = $false
        foreach ($slug in $SelectedSlugs) {
            $slugWords = @($slug.ToLowerInvariant().Split("-") | Where-Object { $_.Length -gt 2 })
            $nameNorm = " " + (($name.ToLowerInvariant() -replace '[^a-z0-9]+', ' ').Trim()) + " "
            $matchCount = 0
            foreach ($word in $slugWords) {
                if ($nameNorm -like "* $word *") { $matchCount++ }
            }
            if ($matchCount -ge [Math]::Min(2, $slugWords.Count)) { $isSelected = $true }
        }
        if (-not $isSelected) {
            $detail = if ($row.Cells.Count -ge 3) { "$name - $($row.Cells[2])" } else { $name }
            Add-UniqueText -List $items -Text $detail
        }
    }
    return @($items.ToArray())
}

function Get-ClientInputItems {
    param([object[]] $Campaigns, [object[]] $BlockedCampaigns, [object[]] $CampaignPlanLines)

    $items = New-Object System.Collections.Generic.List[string]
    $allText = (($CampaignPlanLines + @($Campaigns | ForEach-Object {
        Get-Lines (Join-Path $profileDir "campaigns\$($_.Slug)\lead-source-plan.md")
    })) -join "`n")

    if ($allText -match '(existing customer CSV|customer CSV|Sam''s CSV|CSV from Sam)') {
        Add-UniqueText -List $items -Text "Customer exclusion list: Provide the existing customer / suppression CSV before export so current customers, competitors, and already-contacted accounts are excluded."
    }

    foreach ($blocked in $BlockedCampaigns) {
        if ($blocked.Slug -eq "new-cfo-benchmark") {
            Add-UniqueText -List $items -Text "Benchmark metrics for queued New CFO campaign: Confirm anonymized customer data from 4-6 Nordic SaaS customers before using the benchmark CTA."
        }
    }

    foreach ($campaign in $Campaigns) {
        if ($campaign.Slug -eq "new-cfo-benchmark" -or ($campaign.Role -like "*asset-gated*")) {
            Add-UniqueText -List $items -Text "Benchmark metrics for New CFO campaign: Confirm anonymized customer data from 4-6 Nordic SaaS customers before using the benchmark CTA, or approve the non-benchmark fallback note."
        }
    }

    return @($items.ToArray())
}

function Get-OleColor {
    param([int] $R, [int] $G, [int] $B)
    return ($R + ($G * 256) + ($B * 65536))
}

function New-Icon {
    param([int] $CodePoint)
    return [System.Char]::ConvertFromUtf32($CodePoint)
}

$ColorNavy = Get-OleColor 11 37 69
$ColorBlue = Get-OleColor 31 77 120
$ColorAccent = Get-OleColor 46 116 181
$ColorGold = Get-OleColor 122 90 0
$ColorRisk = Get-OleColor 155 28 28
$ColorMuted = Get-OleColor 95 105 118
$ColorBorder = Get-OleColor 214 219 226
$ColorLightBlue = Get-OleColor 232 238 245
$ColorLightGray = Get-OleColor 242 244 247
$ColorPaleGold = Get-OleColor 255 248 232
$ColorPaleRed = Get-OleColor 254 242 242
$ColorWhite = Get-OleColor 255 255 255
$ColorBlack = Get-OleColor 0 0 0

$IconTarget = New-Icon 0x1F3AF
$IconSource = New-Icon 0x1F50E
$IconOffer = New-Icon 0x1F4A1
$IconCampaign = New-Icon 0x1F680
$IconCopy = New-Icon 0x270D
$IconChange = New-Icon 0x1F501
$IconPending = New-Icon 0x2705
$IconRisk = New-Icon 0x26A0
$IconReview = New-Icon 0x1F4DD
$IconQueue = New-Icon 0x23F3

function Shorten-Text {
    param([string] $Text, [int] $Max = 180)
    $clean = Convert-DocText $Text
    if ($clean.Length -le $Max) { return $clean }
    return "$($clean.Substring(0, $Max - 3).Trim())..."
}

function Convert-CellText {
    param([string] $Text)
    if ($null -eq $Text) { return "" }
    $parts = [string]$Text -split "(`r`n|`n|`r)"
    $cleaned = New-Object System.Collections.Generic.List[string]
    foreach ($part in $parts) {
        $line = Convert-DocText $part
        if ($line.Length -gt 0) { $cleaned.Add($line) }
    }
    return (($cleaned.ToArray()) -join "`r")
}

function Add-Paragraph {
    param(
        [Parameter(Mandatory=$true)] $Doc,
        [Parameter(Mandatory=$true)] [string] $Text,
        [string] $Style = "Normal",
        [bool] $Bold = $false,
        [double] $FontSize = 10,
        [int] $SpaceAfter = 4,
        [int] $SpaceBefore = 0,
        [int] $Color = -1,
        [int] $Align = 0,
        [bool] $KeepWithNext = $false
    )
    $p = $Doc.Paragraphs.Add()
    $p.Range.Text = Convert-DocText $Text
    $p.Range.Style = $Style
    $p.Range.Font.Name = "Calibri"
    $p.Range.Font.Size = $FontSize
    $p.Range.Font.Bold = [int]$Bold
    if ($Color -ge 0) { $p.Range.Font.Color = $Color }
    $p.Alignment = $Align
    $p.SpaceAfter = $SpaceAfter
    $p.SpaceBefore = $SpaceBefore
    $p.LineSpacingRule = 0
    $p.Range.ParagraphFormat.KeepWithNext = $(if ($KeepWithNext) { -1 } else { 0 })
    $p.Range.InsertParagraphAfter() | Out-Null
    return $p
}

function Set-CellText {
    param(
        [Parameter(Mandatory=$true)] $Cell,
        [Parameter(Mandatory=$true)] [string] $Text,
        [bool] $Bold = $false,
        [double] $FontSize = 9.5,
        [int] $Color = -1,
        [int] $Fill = -1,
        [int] $Align = 0
    )
    $Cell.Range.Text = Convert-CellText $Text
    $Cell.Range.Font.Name = "Calibri"
    $Cell.Range.Font.Size = $FontSize
    $Cell.Range.Font.Bold = [int]$Bold
    if ($Color -ge 0) { $Cell.Range.Font.Color = $Color }
    $Cell.Range.ParagraphFormat.SpaceAfter = 0
    $Cell.Range.ParagraphFormat.LineSpacingRule = 0
    $Cell.Range.ParagraphFormat.Alignment = $Align
    if ($Fill -ge 0) { $Cell.Shading.BackgroundPatternColor = $Fill }
    $Cell.VerticalAlignment = 1
}

function Format-Table {
    param([Parameter(Mandatory=$true)] $Table)
    $Table.AllowAutoFit = $false
    $Table.TopPadding = 5
    $Table.BottomPadding = 5
    $Table.LeftPadding = 7
    $Table.RightPadding = 7
    $Table.Spacing = 0
    $Table.Borders.Enable = $true
    foreach ($border in @(-1, -2, -3, -4, -5, -6)) {
        $Table.Borders.Item($border).LineStyle = 1
        $Table.Borders.Item($border).Color = $ColorBorder
    }
}

function Add-PageBreak {
    param([Parameter(Mandatory=$true)] $Doc)
    $range = $Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1)
    $range.InsertBreak(7) | Out-Null
}

function Add-MetaTable {
    param($Doc, [string] $ClientName, [string] $ClientWebsite, [string] $ClientContact, [string] $PreparedBy, [string] $CampaignLabel)
    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), 3, 4)
    Format-Table $table
    $table.Columns.Item(1).Width = 72
    $table.Columns.Item(2).Width = 180
    $table.Columns.Item(3).Width = 78
    $table.Columns.Item(4).Width = 174

    $pairs = @(
        @("Client", $ClientName, "Campaigns", $CampaignLabel),
        @("Date", (Get-Date -Format "yyyy-MM-dd"), "Prepared by", $PreparedBy),
        @("Contact", $ClientContact, "Website", $ClientWebsite)
    )

    for ($i = 0; $i -lt $pairs.Count; $i++) {
        $row = $i + 1
        Set-CellText -Cell $table.Cell($row,1) -Text $pairs[$i][0] -Bold $true -FontSize 8.5 -Color $ColorMuted -Fill $ColorLightGray
        Set-CellText -Cell $table.Cell($row,2) -Text $pairs[$i][1] -FontSize 9.3
        Set-CellText -Cell $table.Cell($row,3) -Text $pairs[$i][2] -Bold $true -FontSize 8.5 -Color $ColorMuted -Fill $ColorLightGray
        Set-CellText -Cell $table.Cell($row,4) -Text $pairs[$i][3] -FontSize 9.3
    }
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 8 | Out-Null
}

function Add-Callout {
    param($Doc, [string] $Text, [int] $Fill = -1, [int] $Color = -1)
    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), 1, 1)
    Format-Table $table
    $table.Columns.Item(1).Width = 504
    Set-CellText -Cell $table.Cell(1,1) -Text $Text -Bold $true -FontSize 9.8 -Color $Color -Fill $Fill
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 6 | Out-Null
}

function Add-SnapshotTable {
    param($Doc, [object[]] $Campaigns, [object[]] $ClientInputs)
    Add-Paragraph -Doc $Doc -Text "Decision Snapshot" -Style "Heading 1" -Bold $true -FontSize 16 -Color $ColorAccent -SpaceBefore 12 -SpaceAfter 6 -KeepWithNext $true | Out-Null

    $inputStatus = if ($ClientInputs.Count -gt 0) { "$($ClientInputs.Count) client-facing item(s) need confirmation." } else { "No new client-provided campaign assets required." }
    $rows = New-Object System.Collections.Generic.List[object]
    foreach ($campaign in $Campaigns) {
        $action = if ($campaign.Role -like "*asset-gated*") { "Confirm asset / edit" } else { "Approve / edit" }
        $rows.Add(@("$IconCampaign Campaign $($campaign.Index)", "$($campaign.Name) - $($campaign.Role)", $action))
    }
    $rows.Add(@("$IconTarget ICP", $Campaigns[0].Icp, "Approve / edit"))
    $rows.Add(@("$IconOffer Offers", (($Campaigns | ForEach-Object { $_.Offer }) -join " | "), "Approve / edit"))
    $sourceSnapshot = if ($Campaigns.Count -gt 1) {
        "See each campaign module for source stack, primary path, backup path, expected volume, fields to collect, and QA stop gates."
    } else {
        $Campaigns[0].SourcePath
    }
    $rows.Add(@("$IconSource Source paths", $sourceSnapshot, "Review module details"))
    $rows.Add(@("$IconPending Client inputs", $inputStatus, "Provide / confirm"))

    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), $rows.Count + 1, 3)
    Format-Table $table
    $table.Columns.Item(1).Width = 108
    $table.Columns.Item(2).Width = 288
    $table.Columns.Item(3).Width = 108
    Set-CellText -Cell $table.Cell(1,1) -Text "Decision" -Bold $true -FontSize 9 -Color $ColorWhite -Fill $ColorNavy
    Set-CellText -Cell $table.Cell(1,2) -Text "Current choice" -Bold $true -FontSize 9 -Color $ColorWhite -Fill $ColorNavy
    Set-CellText -Cell $table.Cell(1,3) -Text "Client action" -Bold $true -FontSize 9 -Color $ColorWhite -Fill $ColorNavy

    for ($i = 0; $i -lt $rows.Count; $i++) {
        $row = $i + 2
        Set-CellText -Cell $table.Cell($row,1) -Text $rows[$i][0] -Bold $true -FontSize 9.1 -Color $ColorBlue -Fill $ColorLightBlue
        Set-CellText -Cell $table.Cell($row,2) -Text (Shorten-Text $rows[$i][1] 290) -FontSize 9
        Set-CellText -Cell $table.Cell($row,3) -Text $rows[$i][2] -FontSize 8.7 -Align 1
    }
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 8 | Out-Null
}

function Add-WhyPair {
    param($Doc, [object[]] $Campaigns)
    Add-Paragraph -Doc $Doc -Text "Why These Campaigns" -Style "Heading 1" -Bold $true -FontSize 15.5 -Color $ColorAccent -SpaceBefore 12 -SpaceAfter 5 -KeepWithNext $true | Out-Null
    $text = "This campaign set balances signal quality, speed, and a queued benchmark path. Campaign 1 uses a tight hiring trigger so the source proves current billing pain. Campaign 2 uses a Heeros lookalike list for broader proof-led coverage. Campaign 3 is documented for client review, but remains asset-gated until benchmark data or the no-benchmark fallback is approved."
    if ($Campaigns.Count -lt 3) {
        $text = "This launch pair balances signal quality and speed. Campaign 1 uses a tight source signal so the list proves current pain. Campaign 2 uses a broader proof-led list so we can launch faster without waiting for a new client-created asset."
    }
    Add-Callout -Doc $Doc -Text $text -Fill $ColorLightBlue -Color $ColorBlue
}

function Add-CampaignDecisionCard {
    param($Doc, [object] $Campaign)

    Add-Paragraph -Doc $Doc -Text "$IconCampaign Campaign $($Campaign.Index): $($Campaign.Role)" -Style "Heading 1" -Bold $true -FontSize 15.5 -Color $ColorAccent -SpaceBefore 13 -SpaceAfter 5 -KeepWithNext $true | Out-Null
    Add-Paragraph -Doc $Doc -Text $Campaign.Name -Bold $true -FontSize 12 -Color $ColorNavy -SpaceAfter 4 -KeepWithNext $true | Out-Null

    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), 7, 2)
    Format-Table $table
    $table.Columns.Item(1).Width = 96
    $table.Columns.Item(2).Width = 408

    Set-CellText -Cell $table.Cell(1,1) -Text "Chosen" -Bold $true -FontSize 9.3 -Color $ColorWhite -Fill $ColorBlue
    Set-CellText -Cell $table.Cell(1,2) -Text "$($Campaign.Name) ($($Campaign.Role))" -Bold $true -FontSize 9.5 -Fill $ColorLightBlue

    Set-CellText -Cell $table.Cell(2,1) -Text "Why" -Bold $true -FontSize 9.3 -Color $ColorBlue -Fill $ColorLightGray
    Set-CellText -Cell $table.Cell(2,2) -Text "$($Campaign.RoleWhy) $($Campaign.WhyNow)" -FontSize 9

    Set-CellText -Cell $table.Cell(3,1) -Text "ICP" -Bold $true -FontSize 9.3 -Color $ColorBlue -Fill $ColorLightGray
    Set-CellText -Cell $table.Cell(3,2) -Text $Campaign.Icp -FontSize 9

    Set-CellText -Cell $table.Cell(4,1) -Text "Offer" -Bold $true -FontSize 9.3 -Color $ColorBlue -Fill $ColorLightGray
    Set-CellText -Cell $table.Cell(4,2) -Text $Campaign.Offer -FontSize 9

    Set-CellText -Cell $table.Cell(5,1) -Text "Source proof" -Bold $true -FontSize 9.3 -Color $ColorBlue -Fill $ColorLightGray
    Set-CellText -Cell $table.Cell(5,2) -Text "$($Campaign.Signal) Source path: $($Campaign.SourcePath)" -FontSize 9

    Set-CellText -Cell $table.Cell(6,1) -Text "$IconRisk Risk" -Bold $true -FontSize 9.3 -Color $ColorRisk -Fill $ColorPaleRed
    Set-CellText -Cell $table.Cell(6,2) -Text $Campaign.Risk -FontSize 8.9 -Color $ColorRisk -Fill $ColorPaleRed

    Set-CellText -Cell $table.Cell(7,1) -Text "$IconReview Review" -Bold $true -FontSize 9.3 -Color $ColorGold -Fill $ColorPaleGold
    Set-CellText -Cell $table.Cell(7,2) -Text "Approve this campaign role, ICP, source path, and offer, or mark what should change before list build." -FontSize 8.9 -Color $ColorGold -Fill $ColorPaleGold
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 5 | Out-Null
}

function Add-DecisionCard {
    param($Doc, [object] $Decision, [int] $Index)

    Add-Paragraph -Doc $Doc -Text "$Index. $($Decision.Title)" -Bold $true -FontSize 12.2 -Color $ColorNavy -SpaceBefore 8 -SpaceAfter 3 -KeepWithNext $true | Out-Null

    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), 5, 2)
    Format-Table $table
    $table.Columns.Item(1).Width = 104
    $table.Columns.Item(2).Width = 400

    Set-CellText -Cell $table.Cell(1,1) -Text "Chosen" -Bold $true -FontSize 8.9 -Color $ColorWhite -Fill $ColorBlue
    Set-CellText -Cell $table.Cell(1,2) -Text $Decision.Chosen -Bold $true -FontSize 9.1 -Fill $ColorLightBlue

    Set-CellText -Cell $table.Cell(2,1) -Text "Why this was chosen" -Bold $true -FontSize 8.9 -Color $ColorBlue -Fill $ColorLightGray
    Set-CellText -Cell $table.Cell(2,2) -Text $Decision.Why -FontSize 8.9

    Set-CellText -Cell $table.Cell(3,1) -Text "Options considered" -Bold $true -FontSize 8.9 -Color $ColorBlue -Fill $ColorLightGray
    Set-CellText -Cell $table.Cell(3,2) -Text (Join-Numbered -Items $Decision.Alternatives -Max 6) -FontSize 8.6

    Set-CellText -Cell $table.Cell(4,1) -Text "$IconRisk Main risk" -Bold $true -FontSize 8.9 -Color $ColorRisk -Fill $ColorPaleRed
    Set-CellText -Cell $table.Cell(4,2) -Text $Decision.Risk -FontSize 8.7 -Color $ColorRisk -Fill $ColorPaleRed

    Set-CellText -Cell $table.Cell(5,1) -Text "$IconReview Client prompt" -Bold $true -FontSize 8.9 -Color $ColorGold -Fill $ColorPaleGold
    Set-CellText -Cell $table.Cell(5,2) -Text $Decision.Prompt -FontSize 8.7 -Color $ColorGold -Fill $ColorPaleGold
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 3 | Out-Null
}

function Add-LeadSourceSummary {
    param($Doc, [object] $Campaign)
    if (-not $Campaign.LeadSourceSummary) { return }

    Add-Paragraph -Doc $Doc -Text "$IconSource Expanded Lead-Source Summary - Campaign $($Campaign.Index)" -Style "Heading 1" -Bold $true -FontSize 15.5 -Color $ColorAccent -SpaceBefore 10 -SpaceAfter 4 -KeepWithNext $true | Out-Null
    Add-Paragraph -Doc $Doc -Text $Campaign.Name -Bold $true -FontSize 12 -Color $ColorNavy -SpaceAfter 4 -KeepWithNext $true | Out-Null

    $summary = $Campaign.LeadSourceSummary
    $rows = @(
        @("Source stack", (Join-Numbered -Items $summary.SourceStack -Max 6)),
        @("Primary path", (Join-Numbered -Items $summary.PrimaryPath -Max 8)),
        @("Backup path", (Join-Numbered -Items $summary.BackupPath -Max 5)),
        @("Expected volume", $summary.ExpectedVolume),
        @("Fields to collect", (Join-Numbered -Items $summary.Fields -Max 12)),
        @("QA / stop gates", (Join-Numbered -Items $summary.QaGates -Max 5))
    )
    if (-not [string]::IsNullOrWhiteSpace($summary.AssetGate)) {
        $rows += ,@("Asset gate", $summary.AssetGate)
    }

    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), $rows.Count, 2)
    Format-Table $table
    $table.Columns.Item(1).Width = 108
    $table.Columns.Item(2).Width = 396

    for ($i = 0; $i -lt $rows.Count; $i++) {
        $row = $i + 1
        $isAsset = $rows[$i][0] -eq "Asset gate"
        $fill = if ($isAsset) { $ColorPaleGold } else { $ColorLightGray }
        $color = if ($isAsset) { $ColorGold } else { $ColorBlue }
        Set-CellText -Cell $table.Cell($row,1) -Text $rows[$i][0] -Bold $true -FontSize 8.6 -Color $color -Fill $fill
        Set-CellText -Cell $table.Cell($row,2) -Text $rows[$i][1] -FontSize 8.1 -Color $(if ($isAsset) { $ColorGold } else { $ColorBlack }) -Fill $(if ($isAsset) { $ColorPaleGold } else { -1 })
    }
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 5 | Out-Null
}

function Add-CampaignModule {
    param($Doc, [object] $Campaign)

    Add-PageBreak -Doc $Doc
    Add-CampaignDecisionCard -Doc $Doc -Campaign $Campaign

    Add-Paragraph -Doc $Doc -Text "Decision Detail" -Bold $true -FontSize 13.5 -Color $ColorAccent -SpaceBefore 8 -SpaceAfter 3 -KeepWithNext $true | Out-Null
    $decisionIndex = 1
    foreach ($decision in $Campaign.Decisions) {
        if ($decisionIndex -eq 3 -or $decisionIndex -eq 5) {
            Add-PageBreak -Doc $Doc
            Add-Paragraph -Doc $Doc -Text "$IconCampaign Campaign $($Campaign.Index) Decision Detail Continued" -Style "Heading 1" -Bold $true -FontSize 14.5 -Color $ColorAccent -SpaceBefore 0 -SpaceAfter 5 -KeepWithNext $true | Out-Null
        }
        Add-DecisionCard -Doc $Doc -Decision $decision -Index $decisionIndex
        $decisionIndex++
    }

    Add-PageBreak -Doc $Doc
    Add-LeadSourceSummary -Doc $Doc -Campaign $Campaign

    if ($Campaign.VariantData) {
        Add-PageBreak -Doc $Doc
        Add-CopyPreview -Doc $Doc -Campaign $Campaign
    }
}

function Add-QueuedCampaigns {
    param($Doc, [object[]] $BlockedCampaigns)
    if ($BlockedCampaigns.Count -eq 0) { return }

    Add-Paragraph -Doc $Doc -Text "$IconQueue Queued / Asset-Gated Campaign" -Style "Heading 1" -Bold $true -FontSize 15.5 -Color $ColorAccent -SpaceBefore 13 -SpaceAfter 5 -KeepWithNext $true | Out-Null
    foreach ($blocked in $BlockedCampaigns) {
        $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), 3, 2)
        Format-Table $table
        $table.Columns.Item(1).Width = 96
        $table.Columns.Item(2).Width = 408
        Set-CellText -Cell $table.Cell(1,1) -Text "Campaign" -Bold $true -FontSize 9.3 -Color $ColorWhite -Fill $ColorBlue
        Set-CellText -Cell $table.Cell(1,2) -Text $blocked.Name -Bold $true -FontSize 9.5 -Fill $ColorLightBlue
        Set-CellText -Cell $table.Cell(2,1) -Text "Offer" -Bold $true -FontSize 9.3 -Color $ColorBlue -Fill $ColorLightGray
        Set-CellText -Cell $table.Cell(2,2) -Text $blocked.Offer -FontSize 9
        Set-CellText -Cell $table.Cell(3,1) -Text "Why queued" -Bold $true -FontSize 9.3 -Color $ColorGold -Fill $ColorPaleGold
        Set-CellText -Cell $table.Cell(3,2) -Text $blocked.Reason -FontSize 9 -Color $ColorGold -Fill $ColorPaleGold
        Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 5 | Out-Null
    }
}

function Add-EmailPreviewBlock {
    param($Doc, [object] $Campaign, [object] $Step, [object] $Variant)

    $subject = if ([string]::IsNullOrWhiteSpace($Variant.Subject)) { "(threaded follow-up; no new subject)" } else { $Variant.Subject }
    $delay = if ($Step.DelayDays -eq 0) { "Day 0" } else { "Day +$($Step.DelayDays)" }

    Add-Paragraph -Doc $Doc -Text "Email $($Step.Step) - $delay - Variant $($Variant.Label)" -Bold $true -FontSize 11.5 -Color $ColorNavy -SpaceBefore 7 -SpaceAfter 2 -KeepWithNext $true | Out-Null

    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), 2, 2)
    Format-Table $table
    $table.Columns.Item(1).Width = 84
    $table.Columns.Item(2).Width = 420
    Set-CellText -Cell $table.Cell(1,1) -Text "Subject" -Bold $true -FontSize 8.8 -Color $ColorWhite -Fill $ColorBlue
    Set-CellText -Cell $table.Cell(1,2) -Text $subject -Bold $true -FontSize 9.2 -Fill $ColorLightBlue
    Set-CellText -Cell $table.Cell(2,1) -Text "Preview copy" -Bold $true -FontSize 8.8 -Color $ColorBlue -Fill $ColorLightGray
    Set-CellText -Cell $table.Cell(2,2) -Text $Variant.Body -FontSize 9.2
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 4 | Out-Null
}

function Add-CopyPreview {
    param($Doc, [object] $Campaign)
    if (-not $Campaign.VariantData) { return }

    Add-Paragraph -Doc $Doc -Text "$IconCopy Copy Sequence Preview - Campaign $($Campaign.Index)" -Style "Heading 1" -Bold $true -FontSize 15.5 -Color $ColorAccent -SpaceBefore 10 -SpaceAfter 3 -KeepWithNext $true | Out-Null
    Add-Paragraph -Doc $Doc -Text $Campaign.Name -Bold $true -FontSize 12 -Color $ColorNavy -SpaceAfter 3 -KeepWithNext $true | Out-Null
    Add-Paragraph -Doc $Doc -Text "Showing every saved variant from variants.yaml, grouped by email step, so the client can review the actual copy options inline." -FontSize 9.3 -Color $ColorMuted -SpaceAfter 5 | Out-Null

    foreach ($step in $Campaign.VariantData.Steps) {
        foreach ($variant in $step.Variants) {
            Add-EmailPreviewBlock -Doc $Doc -Campaign $Campaign -Step $step -Variant $variant
        }
    }
}

function Add-NumberedMatrix {
    param($Doc, [string] $Title, [string] $Icon, [object[]] $Items, [string] $SecondColumnHeader = "What happens")
    Add-Paragraph -Doc $Doc -Text "$Icon $Title" -Style "Heading 1" -Bold $true -FontSize 15.5 -Color $ColorAccent -SpaceBefore 12 -SpaceAfter 5 -KeepWithNext $true | Out-Null

    $rows = [Math]::Max($Items.Count, 1) + 1
    $table = $Doc.Tables.Add($Doc.Range($Doc.Content.End - 1, $Doc.Content.End - 1), $rows, 3)
    Format-Table $table
    $table.Columns.Item(1).Width = 36
    $table.Columns.Item(2).Width = 152
    $table.Columns.Item(3).Width = 316
    Set-CellText -Cell $table.Cell(1,1) -Text "#" -Bold $true -FontSize 9 -Color $ColorWhite -Fill $ColorNavy -Align 1
    Set-CellText -Cell $table.Cell(1,2) -Text "Area" -Bold $true -FontSize 9 -Color $ColorWhite -Fill $ColorNavy
    Set-CellText -Cell $table.Cell(1,3) -Text $SecondColumnHeader -Bold $true -FontSize 9 -Color $ColorWhite -Fill $ColorNavy

    $displayItems = if ($Items.Count -gt 0) { $Items } else { @("No client-facing campaign assets are needed for the selected campaign set.") }
    $i = 1
    foreach ($item in $displayItems) {
        $parts = (Convert-DocText $item).Split(":", 2)
        $area = if ($parts.Count -gt 1) { $parts[0] } else { "Review item" }
        $detail = if ($parts.Count -gt 1) { $parts[1].Trim() } else { $parts[0] }
        $row = $i + 1
        Set-CellText -Cell $table.Cell($row,1) -Text ([string]$i) -Bold $true -FontSize 9 -Color $ColorBlue -Fill $ColorLightBlue -Align 1
        Set-CellText -Cell $table.Cell($row,2) -Text $area -Bold $true -FontSize 9 -Color $ColorBlue
        Set-CellText -Cell $table.Cell($row,3) -Text $detail -FontSize 9
        $i++
    }
    Add-Paragraph -Doc $Doc -Text " " -FontSize 1 -SpaceAfter 5 | Out-Null
}

function Write-ApprovalDocx {
    param(
        [string] $DocxPath,
        [string] $DocTitle,
        [string] $ClientName,
        [string] $ClientWebsite,
        [string] $ClientContact,
        [string] $PreparedBy,
        [object[]] $Campaigns,
        [object[]] $BlockedCampaigns,
        [object[]] $ClientInputs
    )

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
        $doc.PageSetup.HeaderDistance = 36
        $doc.PageSetup.FooterDistance = 36

        $section = $doc.Sections.Item(1)
        $header = $section.Headers.Item(1).Range
        $header.Text = "Campaign Approval Brief | $ClientName"
        $header.Font.Name = "Calibri"
        $header.Font.Size = 8.5
        $header.Font.Color = $ColorMuted
        $header.ParagraphFormat.Alignment = 1

        $footer = $section.Footers.Item(1).Range
        $footer.Text = "Client review draft - update the saved campaign artifacts if preferences change."
        $footer.Font.Name = "Calibri"
        $footer.Font.Size = 8
        $footer.Font.Color = $ColorMuted
        $footer.ParagraphFormat.Alignment = 1

        $campaignLabel = (($Campaigns | ForEach-Object { $_.Name }) -join " + ")
        $subtitle = if ($Campaigns.Count -eq 1) { "Selected launch campaign" } elseif ($Campaigns.Count -eq 2) { "First two launch campaigns" } else { "Three campaign paths" }
        Add-Paragraph -Doc $doc -Text "Client Campaign Approval Brief" -Bold $true -FontSize 10 -Color $ColorGold -SpaceAfter 0 -KeepWithNext $true | Out-Null
        Add-Paragraph -Doc $doc -Text $ClientName -Bold $true -FontSize 28 -Color $ColorNavy -SpaceAfter 3 -KeepWithNext $true | Out-Null
        Add-Paragraph -Doc $doc -Text $subtitle -FontSize 13.5 -Color $ColorMuted -SpaceAfter 12 -KeepWithNext $true | Out-Null

        Add-MetaTable -Doc $doc -ClientName $ClientName -ClientWebsite $ClientWebsite -ClientContact $ClientContact -PreparedBy $PreparedBy -CampaignLabel $campaignLabel
        Add-Callout -Doc $doc -Text "Use this brief to approve the selected campaign paths before list build, enrichment spend, or upload. If the client prefers a different offer, source, copy variant, or launch order, change the saved campaign artifacts before execution." -Fill $ColorLightBlue -Color $ColorBlue
        Add-SnapshotTable -Doc $doc -Campaigns $Campaigns -ClientInputs $ClientInputs
        Add-WhyPair -Doc $doc -Campaigns $Campaigns

        foreach ($campaign in $Campaigns) {
            Add-CampaignModule -Doc $doc -Campaign $campaign
        }

        Add-PageBreak -Doc $doc
        Add-QueuedCampaigns -Doc $doc -BlockedCampaigns $BlockedCampaigns
        $impactItems = @(
            "ICP change: rerun offer intelligence if affected, then data-point discovery, campaign strategy, and lead-source planning.",
            "Offer change: rerun offer intelligence or lead-magnet brainstorm, then campaign strategy and copy.",
            "Source change: rerun lead-source planning, the selected source workflow, and list QA.",
            "Copy angle change: rerun campaign-copywriting only."
        )
        Add-NumberedMatrix -Doc $doc -Title "Change Impact Map" -Icon $IconChange -Items $impactItems -SecondColumnHeader "Rerun this before launch"
        Add-NumberedMatrix -Doc $doc -Title "Client Decisions / Assets Needed" -Icon $IconPending -Items $ClientInputs -SecondColumnHeader "What is needed from the client"

        $doc.BuiltInDocumentProperties("Title") = $DocTitle
        $doc.BuiltInDocumentProperties("Subject") = "Client campaign approval brief"
        $doc.BuiltInDocumentProperties("Author") = "Codex"
        $doc.SaveAs2([string]$DocxPath, 16)
        $doc.Close($false)
    }
    finally {
        $word.Quit()
    }
}

$clientProfilePath = Join-Path $profileDir "client-profile.yaml"
$campaignPlanPath = Join-Path $profileDir "campaign-plan.md"
$campaignStrategyPath = Join-Path $profileDir "campaign-strategy.md"
$dataPointCatalogPath = Join-Path $profileDir "data-point-catalog.md"
$offerIntelPath = Join-Path $profileDir "offer-intelligence.md"
$leadMagnetsPath = Join-Path $profileDir "lead-magnets.md"

$profileLines = Get-Lines $clientProfilePath
$businessSection = Get-YamlSection -Lines $profileLines -SectionName "business"
$clientName = Get-YamlValue -Lines $businessSection -Key "name" -Default (Convert-SlugTitle $ProfileSlug)
$clientWebsite = Get-YamlValue -Lines $businessSection -Key "website" -Default "Not captured in current artifacts."
$clientContact = Get-YamlValue -Lines $businessSection -Key "contact" -Default "Not captured in current artifacts."

$campaignPlanLines = Get-Lines $campaignPlanPath
$campaignStrategyLines = Get-Lines $campaignStrategyPath
$dataPointCatalogLines = Get-Lines $dataPointCatalogPath
$offerIntelLines = Get-Lines $offerIntelPath
$leadMagnetLines = Get-Lines $leadMagnetsPath

# The data point catalog feeds two client-facing deck fields. Get-Lines returns empty on a missing
# file with no error, so block here instead of shipping a deck with those fields silently blank.
Assert-DataPointCatalogSections -Path $dataPointCatalogPath -CatalogLines $dataPointCatalogLines

$campaigns = New-Object System.Collections.Generic.List[object]
$index = 1
foreach ($slug in $slugs) {
    $campaigns.Add((New-CampaignBrief -Slug $slug -Index $index))
    $index++
}

$blockedCampaigns = @(Get-BlockedCampaigns -SelectedSlugs $slugs)
$clientInputs = @(Get-ClientInputItems -Campaigns $campaigns -BlockedCampaigns $blockedCampaigns -CampaignPlanLines $campaignPlanLines)

$mdPath = Join-Path $profileDir "campaign-approval-brief.md"
$today = Get-Date -Format "yyyy-MM-dd"
$docTitle = "Campaign Approval Brief - $clientName"
$campaignNamesText = (($campaigns | ForEach-Object { $_.Name }) -join " + ")
$selectedCampaignText = "Campaign 1 is $($campaigns[0].Name) as $($campaigns[0].Role)."
if ($campaigns.Count -gt 1) {
    $selectedCampaignText = "$selectedCampaignText Campaign 2 is $($campaigns[1].Name) as $($campaigns[1].Role)."
}
if ($campaigns.Count -gt 2) {
    $selectedCampaignText = "$selectedCampaignText Campaign 3 is $($campaigns[2].Name) as $($campaigns[2].Role)."
}
$offersText = (($campaigns | ForEach-Object { $_.Offer }) -join " | ")
$sourcePathsText = (($campaigns | ForEach-Object { "$($_.Name): $($_.SourcePath)" }) -join " | ")

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# $docTitle")
$md.Add("")
$md.Add("**Client:** $(Fallback $clientName)")
$md.Add("**Website:** $(Fallback $clientWebsite)")
$md.Add("**Campaigns:** $campaignNamesText")
$md.Add("**Date:** $today")
$md.Add("**Prepared by:** $(Fallback $PreparedBy)")
$md.Add("**Client contact:** $(Fallback $clientContact)")
$md.Add("")
$md.Add("## Executive Summary")
$md.Add("")
$md.Add("**Selected campaign set:** $selectedCampaignText")
$md.Add("**ICP:** $($campaigns[0].Icp)")
$md.Add("**Offers:** $offersText")
$md.Add("**Source paths:** $sourcePathsText")
$md.Add("**Copy preview:** Every saved variant from each selected campaign's variants.yaml is included below.")
$md.Add("**Current status:** Copy artifacts exist for selected campaigns where variants.yaml is present. Client-facing assets needed are listed at the end.")
$md.Add("")
$md.Add("## Why These Campaigns")
$md.Add("")
if ($campaigns.Count -gt 2) {
    $md.Add("Campaign 1 uses a tight source signal so the list proves current pain before outreach. Campaign 2 uses a broader proof-led lookalike list so we can launch faster without waiting for a new client-created asset. Campaign 3 is documented for client review, but remains asset-gated until benchmark data or the no-benchmark fallback is approved.")
}
else {
    $md.Add("Campaign 1 uses a tight source signal so the list proves current pain before outreach. Campaign 2 uses a broader proof-led lookalike list so we can launch faster without waiting for a new client-created asset.")
}
$md.Add("")

foreach ($campaign in $campaigns) {
    $md.Add("## Campaign $($campaign.Index) Module: $($campaign.Role)")
    $md.Add("")
    $md.Add("### Campaign summary")
    $md.Add("")
    $md.Add("| Field | Current choice |")
    $md.Add("|---|---|")
    $md.Add("| Campaign | $($campaign.Name) |")
    $md.Add("| Launch role | $($campaign.Role) |")
    $md.Add("| ICP | $($campaign.Icp) |")
    $md.Add("| Offer / lead magnet | $($campaign.Offer) |")
    $md.Add("| Source signal | $($campaign.Signal) |")
    $md.Add("| Source path | $($campaign.SourcePath) |")
    $md.Add("| Expected volume | $($campaign.ExpectedVolume) |")
    $md.Add("| Copy source | $(if ($campaign.VariantData) { 'All variants from variants.yaml' } else { 'No variants.yaml captured' }) |")
    $md.Add("")

    foreach ($decision in $campaign.Decisions) {
        $md.Add("### $($decision.Title)")
        $md.Add("")
        $md.Add("**Chosen:** $($decision.Chosen)")
        $md.Add("")
        $md.Add("**Why this was chosen:** $($decision.Why)")
        $md.Add("")
        $md.Add("**Alternatives considered:**")
        $alts = @(Limit-Items -Items $decision.Alternatives -Max 12)
        foreach ($item in $alts) {
            $md.Add("- $item")
        }
        $md.Add("")
        $md.Add("**Main risk:** $($decision.Risk)")
        $md.Add("")
        $md.Add("**Client approval prompt:** $($decision.Prompt)")
        $md.Add("")
    }

    if ($campaign.LeadSourceSummary) {
        $md.Add("### Expanded Lead-Source Summary")
        $md.Add("")
        $md.Add("**Source stack:**")
        foreach ($item in $campaign.LeadSourceSummary.SourceStack) { $md.Add("- $item") }
        $md.Add("")
        $md.Add("**Primary source path:**")
        foreach ($item in $campaign.LeadSourceSummary.PrimaryPath) { $md.Add("- $item") }
        $md.Add("")
        $md.Add("**Backup source path:**")
        foreach ($item in $campaign.LeadSourceSummary.BackupPath) { $md.Add("- $item") }
        $md.Add("")
        $md.Add("**Expected volume:** $($campaign.LeadSourceSummary.ExpectedVolume)")
        $md.Add("")
        $md.Add("**Fields to collect:**")
        foreach ($item in $campaign.LeadSourceSummary.Fields) { $md.Add("- $item") }
        $md.Add("")
        $md.Add("**QA / stop gates:**")
        foreach ($item in $campaign.LeadSourceSummary.QaGates) { $md.Add("- $item") }
        if (-not [string]::IsNullOrWhiteSpace($campaign.LeadSourceSummary.AssetGate)) {
            $md.Add("")
            $md.Add("**Asset gate:** $($campaign.LeadSourceSummary.AssetGate)")
        }
        $md.Add("")
    }

    if ($campaign.VariantData) {
        $md.Add("### Copy Sequence Preview")
        $md.Add("")
        $md.Add("Showing every saved variant from variants.yaml.")
        $md.Add("")
        foreach ($step in $campaign.VariantData.Steps) {
            $delay = if ($step.DelayDays -eq 0) { "Day 0" } else { "Day +$($step.DelayDays)" }
            foreach ($variant in $step.Variants) {
                $subject = if ([string]::IsNullOrWhiteSpace($variant.Subject)) { "(threaded follow-up; no new subject)" } else { $variant.Subject }
                $md.Add("#### Email $($step.Step) - $delay - Variant $($variant.Label)")
                $md.Add("")
                $md.Add("**Subject:** $subject")
                $md.Add("")
                $md.Add($variant.Body)
                $md.Add("")
            }
        }
    }
    else {
        $md.Add("### Copy Sequence Preview")
        $md.Add("")
        $md.Add("Not captured in current artifacts.")
        $md.Add("")
    }
}

if ($blockedCampaigns.Count -gt 0) {
    $md.Add("## Queued / Asset-Gated Campaign")
    $md.Add("")
    foreach ($blocked in $blockedCampaigns) {
        $md.Add("**$($blocked.Name):** $($blocked.Reason)")
        $md.Add("")
    }
}

$md.Add("## Change Impact Map")
$md.Add("")
$md.Add("- ICP change: rerun offer intelligence if affected, then data-point discovery, campaign strategy, and lead-source planning.")
$md.Add("- Offer change: rerun offer intelligence or lead-magnet brainstorm, then campaign strategy and copy.")
$md.Add("- Source change: rerun lead-source planning, the selected source workflow, and list QA.")
$md.Add("- Copy angle change: rerun campaign-copywriting only.")
$md.Add("")
$md.Add("## Client Decisions / Assets Needed")
$md.Add("")
if ($clientInputs.Count -gt 0) {
    foreach ($item in $clientInputs) {
        $md.Add("- $item")
    }
}
else {
    $md.Add("- No new client-provided campaign assets are needed for the selected campaign set.")
}
$md.Add("")

Set-Content -LiteralPath $mdPath -Value $md -Encoding UTF8
Write-Output "Wrote $mdPath"

if (-not $SkipDocx) {
    if ([string]::IsNullOrWhiteSpace($OutputName)) {
        $safeClient = ($clientName -replace '[\\/:*?"<>|]', '').Trim()
        if ([string]::IsNullOrWhiteSpace($safeClient)) { $safeClient = $ProfileSlug }
        $OutputName = "Campaign Approval Brief - $safeClient.docx"
    }
    if (-not $OutputName.EndsWith(".docx")) { $OutputName = "$OutputName.docx" }
    $docxPath = Get-OutputPath -PreferredPath (Join-Path $profileDir $OutputName)

    try {
        Write-ApprovalDocx `
            -DocxPath $docxPath `
            -DocTitle $docTitle `
            -ClientName (Fallback $clientName) `
            -ClientWebsite (Fallback $clientWebsite) `
            -ClientContact (Fallback $clientContact) `
            -PreparedBy (Fallback $PreparedBy) `
            -Campaigns $campaigns `
            -BlockedCampaigns $blockedCampaigns `
            -ClientInputs $clientInputs
        Write-Output "Wrote $docxPath"
    }
    catch {
        Write-Output "Word COM DOCX generation unavailable or failed: $($_.Exception.Message)"
        Write-Output "Markdown output is ready: $mdPath"
    }
}
