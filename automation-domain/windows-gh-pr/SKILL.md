---
name: windows-gh-pr
description: Create or update GitHub pull requests from Windows using the authenticated GitHub CLI. Use when a user asks to push a local branch, open a PR, or recover from GitHub connector or gh failures; verify the repository, branch, authentication, staged scope, and existing PR before publishing.
---

# Windows GitHub PR

Use the Windows `gh.exe` installation for GitHub writes. Keep git operations in the
repository's normal shell/worktree, but run `gh` from Windows PowerShell so it uses the
known Windows keyring login. Create at most one draft PR for a branch and report the URL.

## Workflow

1. Identify the repository and current branch. Do not publish from `main`; create or use a
   feature branch. Confirm the user authorized both pushing and PR creation.

2. Inspect before staging:

   ```powershell
   git -C <repo> status --short --branch
   git -C <repo> diff --check
   git -C <repo> diff --stat
   ```

   For mixed worktrees, stage only the confirmed paths with `git add -- <paths>`; never use
   `git add -A`, `git add .`, or `git add --all`.

3. Run focused validation, then commit. Confirm the staged diff and commit:

   ```powershell
   git -C <repo> diff --cached --check
   git -C <repo> diff --cached --stat
   git -C <repo> commit -m "<message>"
   ```

   When Git runs inside WSL, keep the commit command in the repository's native shell.
   PowerShell may remove nested quotes before `wsl.exe` receives them, especially when a
   commit message contains parentheses or brackets. Prefer an explicitly quoted WSL shell
   command, for example:

   ```powershell
   wsl.exe -d Ubuntu --cd /path/to/repo bash -lc `
     'git commit -m "[fix(module):message]"'
   ```

4. Verify Windows CLI authentication before any GitHub mutation:

   ```powershell
   gh --version
   gh auth status
   ```

   If `gh` is missing, stop and tell the user to install GitHub CLI; do not fall back to a
   connector that has already returned 404 or retry blindly.

5. Push the exact current branch. Git pushes can remain in the repository shell:

   ```powershell
   git -C <repo> push -u origin <branch>
   ```

6. Check for an existing PR before creating one:

   ```powershell
   gh pr list --repo <owner>/<repo> --head <branch> --state all `
     --json number,title,state,url,baseRefName,headRefName
   ```

   If a matching open PR exists, reuse it and do not create another. If a closed PR exists,
   report it and ask before reopening; never blindly create a duplicate.

7. Create one draft PR with explicit base/head. Use a PowerShell here-string piped to
   `--body-file -` so Markdown is not split into unknown CLI arguments:

   ```powershell
   $body = @'
   ## Summary
   - ...

   ## Verification
   - ...
   '@
   $body | gh pr create --repo <owner>/<repo> --base main --head <branch> `
     --draft --title "<title>" --body-file -
   ```

   The default is draft (`--draft`) unless the user explicitly requests a ready PR. Capture
   and return the URL printed by `gh`.

8. If the user also requested merge, inspect mergeability and wait for required checks.
   Do not bypass a pending or failing check merely because the CLI permits admin merge:

   ```powershell
   gh pr view <number> --repo <owner>/<repo> `
     --json isDraft,state,mergeable,mergeStateStatus,statusCheckRollup
   gh pr checks <number> --repo <owner>/<repo> --watch --interval 10
   gh pr merge <number> --repo <owner>/<repo> --merge --delete-branch
   ```

   Verify the returned merge commit, then fast-forward the local base branch. Treat any
   requested deployment as a separate phase: a successful merge does not prove that the
   target host pulled, rebuilt, restarted, or became healthy. Use a deployment-specific
   skill when one is available.

## Failure handling

- `gh auth status` failure: stop; ask the user to authenticate with `gh auth login`.
- Repository or PR API 404 from a connector: do not retry the connector. Confirm the remote
  with `git remote -v`, then use Windows `gh.exe`.
- CLI argument errors caused by Markdown: use a here-string and `--body-file -`, never pass
  a multiline body as an unquoted positional argument.
- PowerShell-to-WSL quoting failures: stop composing deeper nested quotes. Run the command
  in WSL's native shell, or pass direct executable arguments when no shell operators are
  required. A PowerShell here-string piped to WSL may carry CRLF; normalize carriage returns
  before piping or avoid the pipeline for executable paths, otherwise a remote script can
  be interpreted as `script.sh\r`.
- Push rejection/non-fast-forward: fetch and inspect the base/branch state; do not force-push
  unless the user explicitly authorizes it.
- Any unexpected existing worktree changes: stop and ask which paths belong in the PR.
