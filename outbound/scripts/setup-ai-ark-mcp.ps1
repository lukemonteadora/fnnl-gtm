# One-time AI Ark key setup. Sets the SAME key in both places it is read, without the key
# ever appearing in chat, in shell history, or in a git-tracked file:
#   1. outbound/scripts/.env  (AI_ARK_API_KEY, gitignored; read by /preflight-credentials and the scripts)
#   2. the "ai-ark" MCP server URL in ~/.claude.json at LOCAL scope for this repo only (hosted MCP takes
#      the key as ?token=). Local, not user, scope: AI Ark is FNNL-only (operator directive 2026-09-23), so it
#      must never load in the A-Sales or other workspaces. The script cds to the repo root to bind the scope.
# Never point this at the repo's .mcp.json: that file is tracked, so a token there would be committed.
#
# Run from the repo root in an interactive terminal:
#   powershell -ExecutionPolicy Bypass -File outbound/scripts/setup-ai-ark-mcp.ps1
# Get the key at https://app.ai-ark.com/settings/api-management/dashboard

$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'

$secure = Read-Host 'AI Ark API key (input hidden)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

# Same shape check credential-registry.json applies to ai_ark (min_len 16, no placeholders), plus a
# token-charset check: a pasted command or sentence (spaces, slashes) is not a key, and a length
# check alone let one through.
if ($key.Length -lt 16 -or $key -match 'YOUR_KEY|KEY_HERE|PLACEHOLDER|^x+$') {
    throw 'That does not look like a real AI Ark key (too short or a placeholder). Nothing was changed.'
}
if ($key -notmatch '^[A-Za-z0-9_.\-]+$') {
    throw 'That contains spaces or symbols a key never has. You probably pasted the wrong text (a command?). Paste only the key. Nothing was changed.'
}

# 1. .env, UTF-8 without BOM, replacing the line if it exists, appending if not.
$noBom = New-Object System.Text.UTF8Encoding($false)
$text = if (Test-Path $envPath) { [IO.File]::ReadAllText($envPath) } else { '' }
if ($text -match '(?m)^AI_ARK_API_KEY=.*$') {
    $text = [regex]::Replace($text, '(?m)^AI_ARK_API_KEY=.*$', { param($m) "AI_ARK_API_KEY=$key" })
} else {
    $text = $text.TrimEnd() + "`r`nAI_ARK_API_KEY=$key`r`n"
}
[IO.File]::WriteAllText($envPath, $text, $noBom)

# 2. MCP, local scope bound to the FNNL repo root. Remove first because `claude mcp add` refuses an existing
#    name; the user-scope remove also clears any stale copy an older version of this script left behind.
$url = 'https://api.ai-ark.com/v1/mcp?token=' + [uri]::EscapeDataString($key)
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location $repoRoot
try {
    $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    & claude mcp remove ai-ark -s user | Out-Null
    & claude mcp remove ai-ark -s local | Out-Null
    $ErrorActionPreference = $prev
    & claude mcp add --transport http -s local ai-ark $url
    if ($LASTEXITCODE -ne 0) { throw 'claude mcp add failed. The .env was updated, the MCP was not.' }
} finally { Pop-Location }

Write-Host ''
Write-Host "Done. Key length $($key.Length) saved to scripts/.env and to the ai-ark MCP (local scope, FNNL repo only)."
Write-Host 'Start a NEW Claude session: the running one keeps the old connection.'
Write-Host 'Then verify with a company_search (size 1). "Connected" alone proves nothing.'
