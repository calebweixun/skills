<#
.SYNOPSIS
  Windows 快速入口：呼叫跨平台 scripts/manage.py 同步與管理 Claude / Codex / Gemini / Cursor Skills。

.EXAMPLE
  pwsh -File .\scripts\sync-skills.ps1 -Status
  pwsh -File .\scripts\sync-skills.ps1 -ReplaceCopies
  pwsh -File .\scripts\sync-skills.ps1 -Profile core,frontend -Prune -SaveLocal
  pwsh -File .\scripts\sync-skills.ps1 -Doctor
#>
param(
  [switch]$Status,
  [switch]$Doctor,
  [switch]$CheckUpstream,
  [switch]$Uninstall,
  [switch]$ReplaceCopies,
  [switch]$Prune,
  [switch]$SaveLocal,
  [switch]$AllAgents,
  [switch]$AllPlatforms,
  [switch]$DryRun,
  [string]$Profile,
  [string]$Include,
  [string]$Exclude,
  [string]$Agents
)

$ErrorActionPreference = "Stop"
$ManagePy = Join-Path $PSScriptRoot "manage.py"

$PyCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
  $PyCmd = @("python")
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  $PyCmd = @("py", "-3")
} else {
  throw "找不到 Python 3，請先安裝 Python 3 或確認已在 PATH 中。"
}

$CliArgs = @()
if ($Doctor) {
  $CliArgs += "doctor"
} elseif ($CheckUpstream) {
  $CliArgs += "check-upstream"
} elseif ($Uninstall) {
  $CliArgs += "uninstall"
  if ($Agents) { $CliArgs += @("--agents", $Agents) }
  if ($DryRun) { $CliArgs += "--dry-run" }
} elseif ($Status) {
  $CliArgs += "status"
  if ($Profile) { $CliArgs += @("--profile", $Profile) }
  if ($AllAgents) { $CliArgs += "--all-agents" }
  if ($AllPlatforms) { $CliArgs += "--all-platforms" }
} else {
  $CliArgs += "sync"
  if ($Profile) { $CliArgs += @("--profile", $Profile) }
  if ($Include) { $CliArgs += @("--include", $Include) }
  if ($Exclude) { $CliArgs += @("--exclude", $Exclude) }
  if ($Agents) { $CliArgs += @("--agents", $Agents) }
  if ($ReplaceCopies) { $CliArgs += "--replace-copies" }
  if ($Prune) { $CliArgs += "--prune" }
  if ($SaveLocal) { $CliArgs += "--save-local" }
  if ($AllAgents) { $CliArgs += "--all-agents" }
  if ($AllPlatforms) { $CliArgs += "--all-platforms" }
  if ($DryRun) { $CliArgs += "--dry-run" }
}

if ($PyCmd.Count -eq 1) {
  & $PyCmd[0] $ManagePy @CliArgs
} else {
  & $PyCmd[0] $PyCmd[1] $ManagePy @CliArgs
}
exit $LASTEXITCODE
