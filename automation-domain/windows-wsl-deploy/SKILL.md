---
name: windows-wsl-deploy
description: Update and verify applications hosted in local or remote WSL environments from Windows. Use for post-merge deployments that require Git synchronization, frontend or backend builds, systemd restart, and health checks across PowerShell, WSL, SSH, or NVM boundaries.
---

# Windows WSL Deploy

Deploy the exact authorized revision without disturbing target-host data or unrelated
worktree files. Separate source synchronization, build, restart, and health verification so
a partial success is never reported as a completed deployment.

## Discover the target

1. Read the project's deployment documentation before choosing commands or ports.
2. Resolve the target from existing SSH configuration, inventory, VPN/Tailscale status, or
   other maintained local configuration. Do not guess an IP or encode a one-off host address
   into the skill.
3. Connect read-only first. Record hostname, user, repository path, branch, current commit,
   and `git status --short --branch`.
4. Preserve untracked backups and local changes. A clean tracked worktree with unrelated
   untracked backup directories can usually be fast-forwarded, but never delete or overwrite
   those directories as part of an update.

## Deploy in observable phases

1. Synchronize source with `git fetch` and `git pull --ff-only`. Verify the target commit
   immediately. If pull fails, stop rather than reset or force.
2. Run the build command required by the project. A successful pull followed by a failed
   build is a partial deployment: report the phase accurately and continue only with a safe,
   documented recovery.
3. Restart using the project's service wrapper or documented systemd unit. Prefer absolute
   remote script paths when a shell working directory is not guaranteed.
4. Wait for initialization, then verify all relevant signals:

   - target Git commit matches the intended merged revision;
   - production assets contain an observable marker from the new build when applicable;
   - service manager reports `active`;
   - the HTTP health/config endpoint responds successfully;
   - recent logs show startup progress and no terminal error.

Do not treat `systemctl restart` returning zero as sufficient: the service can still be
scanning, loading models, timing out, or restarting in a loop.

## Windows, WSL, SSH, and NVM pitfalls

- Non-interactive SSH normally does not source interactive NVM initialization. If `npm` or
  `node` is missing, inspect the target's existing `~/.nvm/versions/node/*/bin` and service
  environment, then prepend the discovered installed runtime to `PATH`. Do not install or
  upgrade Node merely to repair a non-interactive PATH.
- PowerShell here-strings use CRLF. Piping one directly into WSL/SSH can append `\r` to a
  remote executable path. Prefer direct SSH arguments and absolute paths. If a script must be
  piped, normalize carriage returns before execution.
- Deep PowerShell → `wsl.exe` → `bash -lc` → `ssh` quote nesting is fragile. When shell
  operators are unnecessary, pass executable arguments directly. When they are necessary,
  keep one native-shell command boundary and test read-only first.
- If a friendly SSH alias does not resolve in WSL, inspect both Windows and WSL SSH configs
  and the active VPN inventory. Use an already configured endpoint and identity; do not
  invent credentials or silently switch accounts.

## Failure handling

- After any failure, inspect which phases completed before retrying. Do not repeat a Git pull,
  dependency install, build, or restart blindly.
- If source updated but build failed, leave the running service untouched until a valid build
  exists whenever possible.
- If build succeeded but restart failed, use the documented absolute restart script or
  service command and verify the old service state before proceeding.
- If health checks time out, inspect service status and recent journal output. Startup work
  such as dependency checks, model loading, or dataset scanning may be legitimate; wait in
  bounded intervals and keep the user updated.
