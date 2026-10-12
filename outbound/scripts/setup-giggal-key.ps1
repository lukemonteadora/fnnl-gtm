# One-time Giggal key setup. Writes the key to outbound/scripts/.env only, without it ever
# appearing in chat, in shell history, or in a git-tracked file. The local MCP server
# (outbound/scripts/mcp/giggal_mcp.mjs) reads the key from that file on every call, so unlike the
# AI Ark setup there is no second place to register it and no `claude mcp add` step.
#
# Run from the repo root in an interactive terminal:
#   powershell -ExecutionPolicy Bypass -File outbound/scripts/setup-giggal-key.ps1
# Get the key from the Giggal dashboard (https://giggal.ai).

$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'

$secure = Read-Host 'Giggal API key (input hidden)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

# Same shape check credential-registry.json applies to giggal: starts tp_live_, min_len 16, no placeholders.
if ($key.Length -lt 16 -or $key -notmatch '^tp_live_' -or $key -match 'YOUR_KEY|KEY_HERE|PLACEHOLDER|^x+$') {
    throw 'That does not look like a real Giggal key (too short or a placeholder). Nothing was changed.'
}

# UTF-8 without BOM, replacing the line if it exists, appending if not.
$noBom = New-Object System.Text.UTF8Encoding($false)
$text = if (Test-Path $envPath) { [IO.File]::ReadAllText($envPath) } else { '' }
if ($text -match '(?m)^GIGGAL_API_KEY=.*$') {
    $text = [regex]::Replace($text, '(?m)^GIGGAL_API_KEY=.*$', { param($m) "GIGGAL_API_KEY=$key" })
} else {
    $text = $text.TrimEnd() + "`r`nGIGGAL_API_KEY=$key`r`n"
}
[IO.File]::WriteAllText($envPath, $text, $noBom)

Write-Host ''
Write-Host "Done. Key length $($key.Length) saved to outbound/scripts/.env."
Write-Host 'Start a NEW Claude session so the giggal MCP server is loaded.'
Write-Host 'Then verify with giggal_get_credits (free). "Connected" alone proves nothing.'
