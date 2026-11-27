<#
.SYNOPSIS
    Self-signs the MCP Bridge CEP panel so CEP 12 (Premiere 26.5+ / 2027) loads it.

.DESCRIPTION
    Needs Adobe's ZXPSignCmd.exe 4.1.103 win64 from
    https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD/4.1.103/win64
    Get the user's OK before downloading it; this script refuses to run it unless
    its Authenticode signature is Valid and signed by Adobe Inc.

    Creates a local self-signed certificate once (random password kept next to it),
    signs <repo>\cep-plugin, verifies, and extracts the signed package over the
    installed extension. Re-run after every `npm run setup:win`, which overwrites
    the signed files. Restart Premiere afterwards.

.EXAMPLE
    pwsh -File sign-cep.ps1 -RepoRoot C:\Codes\Adobe_Premiere_Pro_MCP -ZxpSignCmd $env:LOCALAPPDATA\Adobe_Premiere_Pro_MCP\signing\ZXPSignCmd.exe
#>
param(
    [Parameter(Mandatory)] [string] $RepoRoot,
    [Parameter(Mandatory)] [string] $ZxpSignCmd,
    [string] $WorkDir = (Join-Path $env:LOCALAPPDATA 'Adobe_Premiere_Pro_MCP\signing'),
    [string] $Target = (Join-Path $env:APPDATA 'Adobe\CEP\extensions\MCPBridgeCEP')
)
$ErrorActionPreference = 'Stop'

$sig = Get-AuthenticodeSignature $ZxpSignCmd
if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch 'O=Adobe Inc\.') {
    throw "ZXPSignCmd signature is not a valid Adobe Inc. signature: $($sig.Status) $($sig.SignerCertificate.Subject)"
}

New-Item -ItemType Directory -Force $WorkDir | Out-Null
$cert = Join-Path $WorkDir 'local-mcp-bridge.p12'
$pwFile = Join-Path $WorkDir 'cert-password.txt'
if (-not (Test-Path $pwFile)) {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    Set-Content $pwFile (([Convert]::ToBase64String($bytes)) -replace '[+/=]', 'x') -NoNewline
}
$pw = Get-Content $pwFile -Raw
if (-not (Test-Path $cert)) {
    & $ZxpSignCmd -selfSignedCert TW NA 'Local MCP Bridge' 'Local MCP Bridge' $pw $cert -validityDays 3650
    if ($LASTEXITCODE) { throw 'certificate creation failed' }
}

$zxp = Join-Path $WorkDir 'MCPBridgeCEP.zxp'
Remove-Item $zxp -ErrorAction SilentlyContinue
& $ZxpSignCmd -sign (Join-Path $RepoRoot 'cep-plugin') $zxp $cert $pw
if ($LASTEXITCODE) { throw 'signing failed' }
& $ZxpSignCmd -verify $zxp
if ($LASTEXITCODE) { throw 'signature verification failed' }

$unzipped = Join-Path $WorkDir 'unzipped'
Remove-Item $unzipped -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item $zxp "$zxp.zip" -Force
Expand-Archive "$zxp.zip" $unzipped -Force
New-Item -ItemType Directory -Force $Target | Out-Null
Copy-Item (Join-Path $unzipped '*') $Target -Recurse -Force
if (-not (Test-Path (Join-Path $Target 'META-INF\signatures.xml'))) { throw 'signatures.xml missing after install' }
Write-Host "Signed panel installed to $Target. Fully quit and relaunch Premiere."
