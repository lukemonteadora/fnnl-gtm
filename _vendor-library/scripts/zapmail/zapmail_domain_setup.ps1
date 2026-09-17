<#
Client-agnostic cold email domain setup runner.

Configure the run through .env values such as CLIENT_NAME, BRAND_KEYWORD,
DOMAIN_COUNT, and TARGET_ZAPMAIL_WORKSPACE_NAME.

Run:
  powershell -ExecutionPolicy Bypass -File .\scripts\zapmail_domain_setup.ps1
#>

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$EnvPath = Join-Path $ScriptDir ".env"
if (!(Test-Path $EnvPath)) {
  $EnvPath = Join-Path $RepoRoot ".env"
}

if (Test-Path $EnvPath) {
  Get-Content $EnvPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
      $parts = $line.Split("=", 2)
      [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim().Trim('"'), "Process")
    }
  }
}

function Get-EnvValue {
  param([string]$Name, [string]$Default = "", [switch]$Required)
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) { $value = $Default }
  if ($Required -and [string]::IsNullOrWhiteSpace($value)) {
    Stop-Run "Missing required environment variable: $Name"
  }
  return $value
}

function Get-ZapmailApiKey {
  $value = [Environment]::GetEnvironmentVariable("ZAPMAIL_API_KEY", "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    $value = [Environment]::GetEnvironmentVariable("ZAPMAIL_MCP_API_KEY", "Process")
  }
  if ([string]::IsNullOrWhiteSpace($value)) {
    Stop-Run "Missing required environment variable: ZAPMAIL_API_KEY or ZAPMAIL_MCP_API_KEY"
  }
  return $value
}

function Stop-Run {
  param([string]$Message, [int]$Code = 1)
  Write-Host ""
  Write-Host "ESCALATION NEEDED: $Message"
  exit $Code
}

function Save-Checkpoint {
  param([string]$Name, [object]$Data)
  $safeClient = ($script:ClientName -replace '[^a-zA-Z0-9_-]+', '-').Trim('-').ToLower()
  $path = Join-Path $ScriptDir "$safeClient`_$Name.json"
  $Data | ConvertTo-Json -Depth 20 | Set-Content -Path $path -Encoding UTF8
  Write-Host "Checkpoint saved: $path"
}

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Uri,
    [string]$Operation,
    [hashtable]$Headers = @{},
    [object]$Body = $null,
    [int]$Attempts = 3
  )
  $lastError = ""
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      $params = @{
        Method = $Method
        Uri = $Uri
        Headers = $Headers
        TimeoutSec = 45
      }
      if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 20)
      }
      return Invoke-RestMethod @params
    }
    catch {
      $lastError = $_.Exception.Message
      if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $lastError = "$lastError $($_.ErrorDetails.Message)"
      }
      Write-Host "$Operation failed attempt $attempt/$Attempts`: $lastError"
      if ($attempt -lt $Attempts) {
        Start-Sleep -Seconds ([Math]::Min(5 * $attempt, 15))
      }
    }
  }
  Stop-Run "$Operation failed after $Attempts attempts. Exact error: $lastError"
}

function Invoke-WebRequestWithRetry {
  param(
    [string]$Method,
    [string]$Uri,
    [string]$Operation,
    [hashtable]$Headers = @{},
    [object]$Body = $null,
    [int]$Attempts = 3
  )
  $lastError = ""
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      $params = @{
        Method = $Method
        Uri = $Uri
        Headers = $Headers
        TimeoutSec = 45
      }
      if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 20)
      }
      return Invoke-WebRequest @params
    }
    catch {
      $lastError = $_.Exception.Message
      if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $lastError = "$lastError $($_.ErrorDetails.Message)"
      }
      Write-Host "$Operation failed attempt $attempt/$Attempts`: $lastError"
      if ($attempt -lt $Attempts) {
        Start-Sleep -Seconds ([Math]::Min(5 * $attempt, 15))
      }
    }
  }
  Stop-Run "$Operation failed after $Attempts attempts. Exact error: $lastError"
}

$script:ClientName = Get-EnvValue "CLIENT_NAME" "example-client"
$BrandKeyword = (Get-EnvValue "BRAND_KEYWORD" "acme").ToLower().Replace(" ", "")
$TargetWorkspaceName = Get-EnvValue "TARGET_ZAPMAIL_WORKSPACE_NAME" "" -Required
$Registrar = (Get-EnvValue "REGISTRAR" "spaceship").ToLower()
$DomainCount = [int](Get-EnvValue "DOMAIN_COUNT" "12")
$InboxesPerDomain = [int](Get-EnvValue "INBOXES_PER_DOMAIN" "2")
$SenderFirstName = Get-EnvValue "SENDER_FIRST_NAME" "Jane"
$SenderLastName = Get-EnvValue "SENDER_LAST_NAME" "Smith"
$UsernameShort = Get-EnvValue "SENDER_USERNAME_SHORT" $SenderFirstName.ToLower()
$UsernameFull = Get-EnvValue "SENDER_USERNAME_FULL" "$($SenderFirstName.ToLower())$($SenderLastName.ToLower())"
$ProviderPlan = Get-EnvValue "PROVIDER_PLAN" ""
$ExportApp = (Get-EnvValue "EXPORT_APP" "EMAILBISON").ToUpper()
$SendingPlatform = (Get-EnvValue "SENDING_PLATFORM" $ExportApp).ToUpper()
$RunZapmailExport = (Get-EnvValue "RUN_ZAPMAIL_EXPORT" "false").ToLower() -in @("1", "true", "yes")
$Tld = (Get-EnvValue "TLD" "com").TrimStart(".")
$MaxPriceUsd = [double](Get-EnvValue "MAX_PRICE_USD" "15")
$DryRun = (Get-EnvValue "DRY_RUN" "false").ToLower() -in @("1", "true", "yes")
$script:WorkspaceId = Get-EnvValue "ZAPMAIL_WORKSPACE_KEY" ""

$SpaceshipBase = "https://spaceship.dev/api/v1"
$DynadotBase = "https://api.dynadot.com/api3.json"
$ZapmailBase = "https://api.zapmail.ai/api/v2"
# Nameservers are NOT hardcoded. ClouDNS assigns a (potentially different) nameserver
# set per domain/zone. After connecting in Zapmail, read each domain's own
# metadata.expectedNameservers from GET /domains/connection-requests and set exactly those.
# The values below are only a historical example of the shape - never use them as a default.
$ExampleNameserversDoNotUse = @("pns61.cloudns.net", "pns62.cloudns.com", "pns63.cloudns.net", "pns64.cloudns.uk")

function Get-SpaceshipHeaders {
  return @{
    "X-API-Key" = Get-EnvValue "SPACESHIP_API_KEY" "" -Required
    "X-API-Secret" = Get-EnvValue "SPACESHIP_API_SECRET" "" -Required
    "Content-Type" = "application/json"
  }
}

function Get-ZapmailHeaders {
  param([string]$Provider = "")
  $headers = @{
    "x-auth-zapmail" = Get-ZapmailApiKey
    "Content-Type" = "application/json"
  }
  if ($script:WorkspaceId) { $headers["x-workspace-key"] = $script:WorkspaceId }
  if ($Provider) { $headers["x-service-provider"] = $Provider }
  return $headers
}

function Assert-Config {
  if ($InboxesPerDomain -ne 2) {
    Stop-Run "This runner is locked to 2 inboxes per domain. Change only with explicit approval."
  }
  $googleRanges = Get-EnvValue "GOOGLE_DOMAINS" ""
  $microsoftRanges = Get-EnvValue "MICROSOFT_DOMAINS" ""
  if (!$googleRanges -and !$microsoftRanges -and [string]::IsNullOrWhiteSpace($ProviderPlan)) {
    Stop-Run "Missing mailbox mix strategy. Run /mailbox-mix-strategy first, then set GOOGLE_DOMAINS and MICROSOFT_DOMAINS or an explicit all-GOOGLE/all-MICROSOFT PROVIDER_PLAN."
  }
  if ($googleRanges -or $microsoftRanges) {
    for ($i = 1; $i -le $DomainCount; $i++) {
      $assigned = (Test-RangeContains $googleRanges $i) -or (Test-RangeContains $microsoftRanges $i)
      if (!$assigned) {
        Stop-Run "Mailbox mix ranges do not assign a provider for domain index $i. Fix GOOGLE_DOMAINS/MICROSOFT_DOMAINS from /mailbox-mix-strategy before setup."
      }
    }
  } else {
    $plan = $ProviderPlan.ToLower()
    if (!$plan.Contains("all google") -and !$plan.Contains("all microsoft")) {
      Stop-Run "PROVIDER_PLAN must come from /mailbox-mix-strategy. Use explicit GOOGLE_DOMAINS/MICROSOFT_DOMAINS ranges for mixed setups; do not rely on a first-half default."
    }
  }
  if ($Registrar -notin @("spaceship", "dynadot")) {
    Stop-Run "REGISTRAR must be either spaceship or dynadot."
  }
  Get-ZapmailApiKey | Out-Null
  if ($Registrar -eq "spaceship") {
    Get-EnvValue "SPACESHIP_API_KEY" "" -Required | Out-Null
    Get-EnvValue "SPACESHIP_API_SECRET" "" -Required | Out-Null
    Get-EnvValue "SPACESHIP_REGISTRANT_CONTACT_ID" "" -Required | Out-Null
    Get-EnvValue "SPACESHIP_ADMIN_CONTACT_ID" "" -Required | Out-Null
    Get-EnvValue "SPACESHIP_TECH_CONTACT_ID" "" -Required | Out-Null
    Get-EnvValue "SPACESHIP_BILLING_CONTACT_ID" "" -Required | Out-Null
  } else {
    Get-EnvValue "DYNADOT_API_KEY" "" -Required | Out-Null
  }
}

function Get-DomainName {
  param([object]$Item)
  foreach ($name in @("domain", "domainName", "name")) {
    if ($Item.PSObject.Properties.Name -contains $name -and $Item.$name) {
      return ([string]$Item.$name).ToLower()
    }
  }
  return ""
}

function Get-DomainId {
  param([object]$Item)
  foreach ($name in @("id", "uuid")) {
    if ($Item.PSObject.Properties.Name -contains $name -and $Item.$name) {
      return [string]$Item.$name
    }
  }
  return ""
}

function Get-DomainItems {
  param([object]$Data)
  if ($null -eq $Data) { return @() }
  if ($Data -is [array]) { return @($Data) }
  if ($Data.PSObject.Properties.Name -contains "data") {
    $value = $Data.data
    if ($value -is [array]) { return @($value) }
    if ($value.PSObject.Properties.Name -contains "domains") { return @($value.domains) }
    if ($value.PSObject.Properties.Name -contains "items") { return @($value.items) }
  }
  if ($Data.PSObject.Properties.Name -contains "domains") { return @($Data.domains) }
  return @()
}

function Get-WorkspaceItems {
  param([object]$Data)
  if ($Data.PSObject.Properties.Name -contains "data") {
    if ($Data.data -is [array]) { return @($Data.data) }
    if ($Data.data.PSObject.Properties.Name -contains "workspaces") { return @($Data.data.workspaces) }
  }
  return @()
}

function Invoke-Preflight {
  Write-Host "[Preflight] Checking config and credentials..."
  Assert-Config
  if ($Registrar -eq "spaceship") {
    Invoke-JsonRequest -Method "GET" -Uri "$SpaceshipBase/domains?take=1&skip=0" -Headers (Get-SpaceshipHeaders) -Operation "Spaceship credential check" | Out-Null
  } else {
    Invoke-JsonRequest -Method "GET" -Uri "$DynadotBase?key=$(Get-EnvValue 'DYNADOT_API_KEY')&command=account_info" -Operation "Dynadot account_info check" | Out-Null
  }

  $workspaces = Invoke-JsonRequest -Method "GET" -Uri "$ZapmailBase/workspaces?page=1&limit=100" -Headers (Get-ZapmailHeaders) -Operation "Zapmail workspace check"
  $items = Get-WorkspaceItems $workspaces
  $target = $items | Where-Object { ([string]$_.name).ToLower() -eq $TargetWorkspaceName.ToLower() } | Select-Object -First 1
  if ($null -eq $target) {
    $names = ($items | Select-Object -First 20 | ForEach-Object { $_.name }) -join ", "
    Stop-Run "Zapmail key cannot prove access to target workspace '$TargetWorkspaceName'. Seen: $names. Regenerate the MCP Server key from inside the target workspace, not the root account."
  }
  $script:WorkspaceId = [string]$target.id
  Write-Host "Connected to workspace: $($target.name)"
  Save-Checkpoint "preflight_workspace" $target

  if ($RunZapmailExport) {
    $accounts = Invoke-JsonRequest -Method "GET" -Uri "$ZapmailBase/exports/accounts/third-party?app=$ExportApp" -Headers (Get-ZapmailHeaders) -Operation "Zapmail export account check"
    if (!($accounts.data.accounts) -or $accounts.data.accounts.Count -eq 0) {
      Write-Host "DIAGNOSIS: No linked $ExportApp account found in Zapmail. Browser fallback or manual dashboard linking is needed before export."
    }
  } else {
    Write-Host "Zapmail export check skipped. RUN_ZAPMAIL_EXPORT is false; handoff belongs to $SendingPlatform."
  }
}

function New-Candidates {
  $override = Get-EnvValue "DOMAIN_CANDIDATES" ""
  if ($override) {
    return @($override.Split(",") | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ })
  }
  $prefixes = "go,get,try,join,find,search,explore,reach,access,boost,team,send,email,connect,launch,start,build,discover,meet,use,hello,hey,my,the,top,best,run,open,live,grow,with,via,one,all,new,pro".Split(",")
  $suffixes = "hub,hq,online,today,direct,teams,projects,outreach,works,signal,scope,flow,edge,radar,desk,global,core,base,systems,engine,link,next,source,circle,stack,zone,path,spot,wave,grid,point,shift,field,net,way,pulse,vault,peak,sync,lab".Split(",")
  $candidates = New-Object System.Collections.Generic.List[string]
  foreach ($p in $prefixes) { $candidates.Add("$p$BrandKeyword.$Tld") }
  foreach ($s in $suffixes) { $candidates.Add("$BrandKeyword$s.$Tld") }
  foreach ($p in $prefixes) {
    foreach ($s in $suffixes) { $candidates.Add("$p$BrandKeyword$s.$Tld") }
  }
  return @($candidates | Select-Object -Unique | Where-Object {
    $sld = $_.Split(".")[0]
    $sld.Length -le 40 -and $sld -notmatch "mega|ultra|grp"
  })
}

function Get-SpaceshipAvailability {
  param([string[]]$Candidates)
  $available = New-Object System.Collections.Generic.List[object]
  for ($i = 0; $i -lt $Candidates.Count; $i += 20) {
    $end = [Math]::Min($i + 19, $Candidates.Count - 1)
    $batch = @($Candidates[$i..$end])
    $data = Invoke-JsonRequest -Method "POST" -Uri "$SpaceshipBase/domains/available" -Headers (Get-SpaceshipHeaders) -Body @{ domains = $batch } -Operation "Spaceship availability check"
    foreach ($item in @($data.domains)) {
      if ($item.result -ne "available") { continue }
      $price = 10.99
      foreach ($priceItem in @($item.premiumPricing)) {
        if ($priceItem.operation -eq "register") { $price = [double]$priceItem.price }
      }
      if ($price -le $MaxPriceUsd) {
        $available.Add([pscustomobject]@{ domain = $item.domain; price = $price })
      }
    }
    if ($available.Count -ge $DomainCount) { break }
  }
  return @($available | Select-Object -First $DomainCount)
}

function Get-DynadotAvailability {
  param([string[]]$Candidates)
  $available = New-Object System.Collections.Generic.List[object]
  for ($i = 0; $i -lt $Candidates.Count; $i += 100) {
    $end = [Math]::Min($i + 99, $Candidates.Count - 1)
    $batch = @($Candidates[$i..$end])
    $query = "key=$(Get-EnvValue 'DYNADOT_API_KEY')&command=search&show_price=1&currency=USD"
    for ($j = 0; $j -lt $batch.Count; $j++) {
      $query += "&domain$j=$($batch[$j])"
    }
    $data = Invoke-JsonRequest -Method "GET" -Uri "$DynadotBase?$query" -Operation "Dynadot availability check"
    foreach ($item in @($data.SearchResponse.SearchResults)) {
      if (([string]$item.Available).ToLower() -ne "yes") { continue }
      $price = [double](([string]$item.Price).Replace("$", ""))
      if ($price -le $MaxPriceUsd) {
        $available.Add([pscustomobject]@{ domain = $item.DomainName; price = $price })
      }
    }
    if ($available.Count -ge $DomainCount) { break }
  }
  return @($available | Select-Object -First $DomainCount)
}

function Confirm-Balance {
  param([object[]]$Selected)
  $total = 0
  foreach ($item in $Selected) { $total += [double]$item.price }
  if ($total -le 0) { $total = $DomainCount * 11 }
  Write-Host ""
  Write-Host "Selected domains:"
  foreach ($item in $Selected) { Write-Host ("  {0}  ${1:N2}" -f $item.domain, [double]$item.price) }
  Write-Host ("Estimated registrar cost: ${0:N2}" -f $total)
  $answer = Read-Host "Have you topped up at least $([string]::Format('{0:N2}', $total)) in $($Registrar.Substring(0,1).ToUpper()+$Registrar.Substring(1))? Type YES to continue"
  if ($answer.Trim() -ne "YES") {
    Stop-Run "Purchase stopped. Top up $Registrar before proceeding." 0
  }
}

function Invoke-Purchase {
  param([object[]]$Selected)
  if ($DryRun) { return @($Selected | ForEach-Object { $_.domain }) }
  $purchased = New-Object System.Collections.Generic.List[string]
  if ($Registrar -eq "spaceship") {
    $contacts = @{
      registrant = Get-EnvValue "SPACESHIP_REGISTRANT_CONTACT_ID" "" -Required
      admin = Get-EnvValue "SPACESHIP_ADMIN_CONTACT_ID" "" -Required
      tech = Get-EnvValue "SPACESHIP_TECH_CONTACT_ID" "" -Required
      billing = Get-EnvValue "SPACESHIP_BILLING_CONTACT_ID" "" -Required
    }
    foreach ($item in $Selected) {
      $domain = $item.domain
      $response = Invoke-WebRequestWithRetry -Method "POST" -Uri "$SpaceshipBase/domains/$domain" -Headers (Get-SpaceshipHeaders) -Operation "Spaceship purchase $domain" -Body @{
        autoRenew = $false
        years = 1
        privacyProtection = @{ level = "high"; userConsent = $true }
        contacts = $contacts
      }
      $operationId = $response.Headers["spaceship-async-operationid"]
      if ($operationId) {
        Wait-SpaceshipAsync $operationId $domain
      }
      $purchased.Add($domain)
      Save-Checkpoint "purchased_domains" @($purchased)
    }
  } else {
    foreach ($item in $Selected) {
      $domain = $item.domain
      Invoke-JsonRequest -Method "GET" -Uri "$DynadotBase?key=$(Get-EnvValue 'DYNADOT_API_KEY')&command=register&domain=$domain&duration=1" -Operation "Dynadot purchase $domain" | Out-Null
      $purchased.Add($domain)
      Save-Checkpoint "purchased_domains" @($purchased)
      Start-Sleep -Seconds 1
    }
  }
  return @($purchased)
}

function Wait-SpaceshipAsync {
  param([string]$OperationId, [string]$Domain)
  $started = Get-Date
  while (((Get-Date) - $started).TotalMinutes -lt 10) {
    $data = Invoke-JsonRequest -Method "GET" -Uri "$SpaceshipBase/async-operations/$OperationId" -Headers (Get-SpaceshipHeaders) -Operation "Spaceship async poll $Domain"
    if ($data.status -eq "success") {
      Write-Host "Registered: $Domain"
      return
    }
    if ($data.status -eq "failed") {
      Stop-Run "Spaceship purchase failed for $Domain`: $($data.details)"
    }
    Write-Host "Spaceship still processing $Domain`: $($data.status)"
    Start-Sleep -Seconds 5
  }
  Stop-Run "Spaceship purchase took longer than expected for $Domain. Operation ID: $OperationId"
}

function Get-ProviderForIndex {
  param([int]$Index)
  $googleRanges = Get-EnvValue "GOOGLE_DOMAINS" ""
  $microsoftRanges = Get-EnvValue "MICROSOFT_DOMAINS" ""
  if ($googleRanges -or $microsoftRanges) {
    if (Test-RangeContains $googleRanges $Index) { return "GOOGLE" }
    if (Test-RangeContains $microsoftRanges $Index) { return "MICROSOFT" }
    Stop-Run "No provider assigned for domain index $Index."
  }
  $plan = $ProviderPlan.ToLower()
  if ($plan.Contains("all google")) { return "GOOGLE" }
  if ($plan.Contains("all microsoft")) { return "MICROSOFT" }
  Stop-Run "No explicit provider assigned for domain index $Index. Run /mailbox-mix-strategy and set GOOGLE_DOMAINS/MICROSOFT_DOMAINS."
}

function Test-RangeContains {
  param([string]$Ranges, [int]$Index)
  foreach ($part in $Ranges.Split(",")) {
    $clean = $part.Trim()
    if (!$clean) { continue }
    if ($clean.Contains("-")) {
      $bounds = $clean.Split("-", 2)
      if ($Index -ge [int]$bounds[0] -and $Index -le [int]$bounds[1]) { return $true }
    } elseif ($Index -eq [int]$clean) {
      return $true
    }
  }
  return $false
}

function Get-ExpectedNameservers {
  # Poll Zapmail connection requests until each domain exposes its OWN
  # metadata.expectedNameservers (populated once it reaches CHECKING_NS_IN_WHOIS).
  # Returns a hashtable @{ domain = @(nameservers) } read per domain - never shared/guessed.
  param([string[]]$Domains, [int]$TimeoutMinutes = 15)
  $result = @{}
  if ($DryRun) {
    Write-Host "DRY_RUN: would read per-domain expected nameservers"
    foreach ($d in $Domains) { $result[$d] = $ExampleNameserversDoNotUse }
    return $result
  }
  $wanted = @{}; foreach ($d in $Domains) { $wanted[$d.ToLower()] = $true }
  $deadline = (Get-Date).AddMinutes($TimeoutMinutes)
  while ((Get-Date) -lt $deadline -and $result.Count -lt $wanted.Count) {
    $data = Invoke-JsonRequest -Method "GET" -Uri "$ZapmailBase/domains/connection-requests?page=1&limit=100" -Headers (Get-ZapmailHeaders) -Operation "Zapmail connection requests (per-domain expected nameservers)"
    $rows = @(); if ($data.data -and $data.data.data) { $rows = $data.data.data }
    foreach ($row in $rows) {
      $name = ("" + $row.domainName).ToLower()
      $expected = $null
      if ($row.metadata -and $row.metadata.expectedNameservers) { $expected = @($row.metadata.expectedNameservers) }
      if ($wanted.ContainsKey($name) -and $expected -and -not $result.ContainsKey($name)) {
        $result[$name] = $expected
        Write-Host "  $name : expected nameservers = $($expected -join ', ')"
      }
    }
    if ($result.Count -lt $wanted.Count) { Start-Sleep -Seconds 20 }
  }
  $missing = @($wanted.Keys | Where-Object { -not $result.ContainsKey($_) })
  if ($missing.Count -gt 0) {
    Stop-Run "Could not read expected nameservers for: $($missing -join ', '). These have not reached CHECKING_NS_IN_WHOIS yet. Do NOT guess or copy another domain's nameservers - re-run once they advance."
  }
  return $result
}

function Set-Nameservers {
  # Set each domain's OWN expected nameservers. Never share one set across domains.
  param([hashtable]$ExpectedByDomain)
  if ($DryRun) { Write-Host "DRY_RUN: would switch nameservers per-domain"; return }
  foreach ($domain in $ExpectedByDomain.Keys) {
    $hosts = @($ExpectedByDomain[$domain])
    if (-not $hosts -or $hosts.Count -eq 0) { Stop-Run "No expected nameservers resolved for $domain; refusing to guess." }
    if ($Registrar -eq "spaceship") {
      Invoke-JsonRequest -Method "PUT" -Uri "$SpaceshipBase/domains/$domain/nameservers" -Headers (Get-SpaceshipHeaders) -Operation "Spaceship nameserver update $domain" -Body @{
        provider = "custom"
        hosts = $hosts
      } | Out-Null
    } else {
      # One domain per set_ns call - no shared batch nameservers.
      $uri = "$DynadotBase?key=$(Get-EnvValue 'DYNADOT_API_KEY')&command=set_ns&domain=$domain"
      for ($i = 0; $i -lt $hosts.Count; $i++) { $uri += "&ns$i=$($hosts[$i])" }
      Invoke-JsonRequest -Method "GET" -Uri $uri -Operation "Dynadot nameserver update $domain" | Out-Null
    }
  }
  Save-Checkpoint "nameserver_updates" @{ expectedByDomain = $ExpectedByDomain }
}

function Connect-ZapmailDomains {
  param([hashtable]$Providers)
  foreach ($provider in @("GOOGLE", "MICROSOFT")) {
    $domains = @($Providers.Keys | Where-Object { $Providers[$_] -eq $provider })
    if ($domains.Count -eq 0) { continue }
    if ($DryRun) { Write-Host "DRY_RUN: would connect $($domains.Count) domains as $provider"; continue }
    Invoke-JsonRequest -Method "POST" -Uri "$ZapmailBase/domains/connect-domain" -Headers (Get-ZapmailHeaders $provider) -Operation "Zapmail connect domains as $provider" -Body @{ domainNames = $domains } | Out-Null
  }
  Save-Checkpoint "zapmail_connected_domains" $Providers
}

function Get-ZapmailDomains {
  param([string]$Provider)
  $data = Invoke-JsonRequest -Method "GET" -Uri "$ZapmailBase/domains?page=1&limit=100" -Headers (Get-ZapmailHeaders $Provider) -Operation "Zapmail list domains"
  return Get-DomainItems $data
}

function Test-DomainsInWorkspace {
  param([string[]]$Domains)
  $seen = @{}
  foreach ($provider in @("GOOGLE", "MICROSOFT")) {
    foreach ($item in @(Get-ZapmailDomains $provider)) {
      $name = Get-DomainName $item
      if ($name) { $seen[$name] = $item }
    }
  }
  $missing = @($Domains | Where-Object { !$seen.ContainsKey($_.ToLower()) })
  if ($missing.Count -gt 0) {
    Stop-Run "Domains are not in this workspace: $($missing -join ', '). This means the API key is scoped to a different workspace. Regenerate the MCP key from inside $TargetWorkspaceName."
  }
}

function Get-Assignable {
  param([string]$Provider)
  $data = Invoke-JsonRequest -Method "GET" -Uri "$ZapmailBase/domains/assignable?page=1&limit=100" -Headers (Get-ZapmailHeaders $Provider) -Operation "Zapmail assignable poll"
  return Get-DomainItems $data
}

function Invoke-ZeroAssignableDiagnosis {
  param([string[]]$Domains)
  Write-Host "DIAGNOSIS: Assignable count is still 0 after 10 minutes."
  Test-DomainsInWorkspace $Domains
  foreach ($provider in @("GOOGLE", "MICROSOFT")) {
    foreach ($item in @(Get-ZapmailDomains $provider)) {
      $name = Get-DomainName $item
      if ($Domains -contains $name) {
        Write-Host "  $name status=$($item.status) assignedMailboxesCount=$($item.assignedMailboxesCount)"
      }
    }
  }
}

function Wait-Assignable {
  param([string[]]$Domains)
  $assigned = @{}
  $started = Get-Date
  $diagnosed = $false
  $target = [Math]::Max(1, [Math]::Floor($Domains.Count * 0.95))
  while (((Get-Date) - $started).TotalMinutes -lt 90) {
    foreach ($provider in @("GOOGLE", "MICROSOFT")) {
      foreach ($item in @(Get-Assignable $provider)) {
        $name = Get-DomainName $item
        if (($Domains | ForEach-Object { $_.ToLower() }) -contains $name) {
          $assigned[$name] = Get-DomainId $item
        }
      }
    }
    Write-Host "Assignable: $($assigned.Count)/$($Domains.Count)"
    if ($assigned.Count -ge $target) {
      Save-Checkpoint "domain_uuids" $assigned
      return $assigned
    }
    if ($assigned.Count -eq 0 -and !$diagnosed -and ((Get-Date) - $started).TotalMinutes -ge 10) {
      Invoke-ZeroAssignableDiagnosis $Domains
      $diagnosed = $true
    }
    Start-Sleep -Seconds 120
  }
  Stop-Run "Zapmail assignable polling exceeded 90 minutes. Assigned count: $($assigned.Count)"
}

function New-MailboxPayload {
  param([string]$Domain)
  return @(
    @{ firstName = $SenderFirstName; lastName = $SenderLastName; mailboxUsername = $UsernameShort; domainName = $Domain },
    @{ firstName = $SenderFirstName; lastName = $SenderLastName; mailboxUsername = $UsernameFull; domainName = $Domain }
  )
}

function New-Inboxes {
  param([hashtable]$DomainIds, [hashtable]$Providers)
  foreach ($provider in @("GOOGLE", "MICROSOFT")) {
    $payload = @{}
    foreach ($domain in $DomainIds.Keys) {
      if ($Providers[$domain] -eq $provider) {
        $payload[$DomainIds[$domain]] = New-MailboxPayload $domain
      }
    }
    if ($payload.Keys.Count -eq 0) { continue }
    if ($DryRun) { Write-Host "DRY_RUN: would create inboxes for $($payload.Keys.Count) $provider domains"; continue }
    Invoke-JsonRequest -Method "POST" -Uri "$ZapmailBase/mailboxes" -Headers (Get-ZapmailHeaders $provider) -Operation "Zapmail create mailboxes $provider" -Body $payload | Out-Null
  }
  Save-Checkpoint "mailbox_creation_requested" @{ domains = @($DomainIds.Keys) }
}

function Get-Mailboxes {
  param([string]$Provider)
  $data = Invoke-JsonRequest -Method "GET" -Uri "$ZapmailBase/mailboxes?page=1&limit=100&contains=$UsernameShort" -Headers (Get-ZapmailHeaders $Provider) -Operation "Zapmail mailbox status poll"
  if ($data.data.mailboxes) { return @($data.data.mailboxes) }
  if ($data.data.items) { return @($data.data.items) }
  if ($data.data -is [array]) { return @($data.data) }
  return @()
}

function Wait-ActiveMailboxes {
  param([string[]]$Domains)
  $expected = $Domains.Count * $InboxesPerDomain
  $started = Get-Date
  while (((Get-Date) - $started).TotalMinutes -lt 720) {
    $mailboxes = @()
    $mailboxes += Get-Mailboxes "GOOGLE"
    $mailboxes += Get-Mailboxes "MICROSOFT"
    $matching = @($mailboxes | Where-Object {
      $email = ([string]$_.email).ToLower()
      $Domains | Where-Object { $email.EndsWith("@$($_.ToLower())") }
    })
    $active = @($matching | Where-Object { ([string]$_.status).ToUpper() -eq "ACTIVE" })
    Write-Host "Active mailboxes: $($active.Count)/$expected"
    if ($active.Count -ge $expected) {
      Save-Checkpoint "active_mailboxes" $active
      return
    }
    Start-Sleep -Seconds 600
  }
  Stop-Run "Mailbox activation exceeded 720 minutes. Export blocked."
}

function Export-Mailboxes {
  if ($DryRun) { Write-Host "DRY_RUN: would export ACTIVE inboxes to $ExportApp"; return }
  $response = Invoke-JsonRequest -Method "POST" -Uri "$ZapmailBase/exports/mailboxes" -Headers (Get-ZapmailHeaders) -Operation "Zapmail export to $ExportApp" -Body @{
    apps = @($ExportApp)
    ids = @()
    excludeIds = @()
    tagIds = @()
    contains = $UsernameShort
    status = "ACTIVE"
  }
  Save-Checkpoint "export_response" $response
}

Invoke-Preflight
$candidates = New-Candidates
if ($Registrar -eq "spaceship") {
  $selected = Get-SpaceshipAvailability $candidates
} else {
  $selected = Get-DynadotAvailability $candidates
}
if ($selected.Count -lt $DomainCount) {
  Stop-Run "Only $($selected.Count) domains available, but DOMAIN_COUNT is $DomainCount."
}
Confirm-Balance $selected
$purchased = Invoke-Purchase $selected

$providers = @{}
for ($i = 0; $i -lt $purchased.Count; $i++) {
  $providers[$purchased[$i]] = Get-ProviderForIndex ($i + 1)
}
Save-Checkpoint "provider_plan" $providers

# Connect in Zapmail FIRST - Zapmail only reveals each domain's correct nameservers
# after connect. Then read per-domain expected nameservers and set each domain's own
# set. Never hardcode or share one nameserver set across domains.
Connect-ZapmailDomains $providers
$expectedByDomain = Get-ExpectedNameservers $purchased
Set-Nameservers $expectedByDomain
Test-DomainsInWorkspace $purchased
$rawIds = Wait-Assignable $purchased
$domainIds = @{}
foreach ($domain in $purchased) {
  $lower = $domain.ToLower()
  if ($rawIds.ContainsKey($lower)) { $domainIds[$domain] = $rawIds[$lower] }
}
New-Inboxes $domainIds $providers
Wait-ActiveMailboxes @($domainIds.Keys)
Write-Host ""
if ($RunZapmailExport) {
  Export-Mailboxes
  Write-Host "Setup complete. Confirm exported senders in $ExportApp and start warmup."
} else {
  Write-Host "Zapmail provisioning complete. Export/import was not run."
  Write-Host "Next: import or connect ACTIVE inboxes in $SendingPlatform, start warmup, apply signatures, tag insurance, then log tracker."
}
Write-Host "Wait 2 weeks before sending real campaigns."
