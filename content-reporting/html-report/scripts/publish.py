#!/usr/bin/env python3
"""Update the report manifest and optionally publish an HTML report.

Default mode is draft/local: update reports/manifest.json and print the local
HTML path. Commit and push happen only when explicitly requested.

Usage:
    publish.py --html reports/example.html --title "Example" [options]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
CONFIG_PATH = SKILL_DIR / "config.json"


def main() -> int:
    args = _parse_args()
    cfg = _load_config()
    repo_path = _resolve_repo_path(args.repo, cfg)
    reports_dir = (cfg.get("reports_dir") or "reports").strip("/") or "reports"
    base_url = (cfg.get("base_url") or "").rstrip("/") or _derive_base_url(repo_path)

    html_path = _resolve_html_path(args.html, repo_path)
    reports_path = (repo_path / reports_dir).resolve()
    manifest_path = reports_path / "manifest.json"
    html_rel = _relative_to_repo(html_path, repo_path)
    manifest_rel = _relative_to_repo(manifest_path, repo_path)
    manifest_file = _relative_to_reports(html_path, reports_path)

    if args.push and not args.commit:
        sys.exit("ERROR: --push requires --commit.")
    if args.draft and args.commit:
        sys.exit("ERROR: --draft cannot be combined with --commit.")

    allowed_dirty = {html_rel.as_posix(), manifest_rel.as_posix()}
    if args.commit:
        _ensure_no_unrelated_changes(repo_path, allowed_dirty)

    report_date = _date_from_filename(manifest_file.name)
    _update_manifest(
        manifest_path,
        filename=manifest_file.as_posix(),
        report_date=report_date,
        title=args.title,
        description=args.description,
    )

    if not args.commit:
        print(f"DRAFT: {html_path}")
        return 0

    _git(repo_path, ["add", "--", html_rel.as_posix(), manifest_rel.as_posix()])
    if _git(repo_path, ["diff", "--cached", "--quiet"], check=False).returncode == 0:
        print("No report changes to commit.", file=sys.stderr)
    else:
        _git(repo_path, ["commit", "-m", f"report: {args.title}"])

    if args.push:
        _git(repo_path, ["push"])
        print(_public_url(base_url, html_rel, html_path))
    else:
        print(f"COMMITTED: {html_path}")
    return 0


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", help="path to the GitHub Pages report repo")
    parser.add_argument("--html", required=True, help="HTML report path, repo-relative or absolute")
    parser.add_argument("--title", required=True, help="report title for the manifest and commit message")
    parser.add_argument("--description", default="", help="one-line report description")
    parser.add_argument("--commit", action="store_true", help="stage the report and manifest, then commit")
    parser.add_argument("--push", action="store_true", help="push after committing and print the public URL")
    parser.add_argument("--draft", action="store_true", help="explicit draft mode; this is also the default")
    return parser.parse_args()


def _load_config() -> dict:
    if not CONFIG_PATH.exists():
        sys.exit(f"ERROR: missing config file at {CONFIG_PATH}")
    try:
        cfg = json.loads(CONFIG_PATH.read_text())
    except json.JSONDecodeError as exc:
        sys.exit(f"ERROR: invalid JSON in {CONFIG_PATH}: {exc}")
    if not isinstance(cfg, dict):
        sys.exit(f"ERROR: config at {CONFIG_PATH} must be a JSON object.")
    return cfg


def _resolve_repo_path(arg: str | None, cfg: dict) -> Path:
    raw = (arg or cfg.get("local_repo_path") or "").strip()
    if raw:
        repo = Path(os.path.expanduser(raw)).resolve()
    else:
        repo = _find_parent_git_repo(SCRIPT_DIR)
        if repo is None:
            sys.exit(
                "ERROR: could not auto-detect a report repo. Pass --repo or set "
                f"local_repo_path in {CONFIG_PATH}."
            )
    if not (repo / ".git").exists():
        sys.exit(f"ERROR: {repo} is not a git repository.")
    return repo


def _find_parent_git_repo(start: Path) -> Path | None:
    for parent in [start.resolve(), *start.resolve().parents]:
        if (parent / ".git").exists():
            return parent
    return None


def _resolve_html_path(arg: str, repo_path: Path) -> Path:
    html_path = Path(os.path.expanduser(arg))
    if not html_path.is_absolute():
        html_path = repo_path / html_path
    html_path = html_path.resolve()
    if not html_path.exists():
        sys.exit(f"ERROR: HTML file not found: {arg}")
    if html_path.suffix.lower() != ".html":
        sys.exit(f"ERROR: HTML file must end with .html: {html_path}")
    _relative_to_repo(html_path, repo_path)
    return html_path


def _relative_to_repo(path: Path, repo_path: Path) -> Path:
    try:
        return path.resolve().relative_to(repo_path.resolve())
    except ValueError:
        sys.exit(f"ERROR: {path.resolve()} is outside the repo at {repo_path.resolve()}")


def _relative_to_reports(path: Path, reports_path: Path) -> Path:
    try:
        return path.resolve().relative_to(reports_path.resolve())
    except ValueError:
        sys.exit(f"ERROR: report HTML must live under {reports_path}")


def _date_from_filename(filename: str) -> str:
    match = re.match(r"^(\d{4}-\d{2}-\d{2})", filename)
    return match.group(1) if match else date.today().isoformat()


def _update_manifest(path: Path, filename: str, report_date: str, title: str, description: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    items: list[dict] = []
    if path.exists():
        try:
            loaded = json.loads(path.read_text())
        except json.JSONDecodeError:
            loaded = []
        if isinstance(loaded, list):
            items = [item for item in loaded if isinstance(item, dict)]

    items = [item for item in items if item.get("file") != filename]
    items.insert(
        0,
        {
            "file": filename,
            "title": title,
            "date": report_date,
            "description": description,
        },
    )
    path.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n")


def _ensure_no_unrelated_changes(repo_path: Path, allowed: set[str]) -> None:
    dirty = set()
    dirty.update(_git_lines(repo_path, ["diff", "--name-only"]))
    dirty.update(_git_lines(repo_path, ["diff", "--cached", "--name-only"]))
    dirty.update(_git_lines(repo_path, ["ls-files", "--others", "--exclude-standard"]))
    unrelated = sorted(path for path in dirty if path not in allowed)
    if unrelated:
        formatted = "\n".join(f"  {path}" for path in unrelated)
        sys.exit(
            "ERROR: unrelated working tree changes would make publishing unsafe:\n"
            f"{formatted}\n"
            "Commit, stash, or remove them before running with --commit."
        )


def _derive_base_url(repo_path: Path) -> str:
    result = _git(repo_path, ["config", "--get", "remote.origin.url"], check=False, capture=True)
    if result.returncode != 0:
        return ""
    remote = result.stdout.strip()
    match = re.search(r"github\.com[:/]+([^/]+)/([^/]+?)(?:\.git)?/?$", remote)
    if not match:
        return ""
    owner, repo = match.group(1), match.group(2)
    return f"https://{owner}.github.io/{repo}"


def _public_url(base_url: str, html_rel: Path, html_path: Path) -> str:
    if base_url:
        return f"{base_url}/{html_rel.as_posix()}"
    return f"(no base_url; local: {html_path})"


def _git_lines(repo_path: Path, args: list[str]) -> list[str]:
    result = _git(repo_path, args, capture=True)
    return [line for line in result.stdout.splitlines() if line]


def _git(
    repo_path: Path,
    args: list[str],
    *,
    check: bool = True,
    capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(repo_path), *args],
        check=check,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


if __name__ == "__main__":
    sys.exit(main())
