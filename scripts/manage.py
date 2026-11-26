#!/usr/bin/env python3
"""Cross-OS (macOS / Windows / Linux) & Cross-Agent (Claude / Codex / Gemini / Cursor) Skill Manager.

Zero external dependencies (Python 3 stdlib only).

Commands:
  sync            Sync selected skills via symlinks (or Windows junctions) to detected agents
  status          Show installation & link matrix across all agents
  doctor          Audit repo manifest, SKILL.md frontmatter, README links, broken links & untracked drift
  check-upstream  Query upstream GitHub repos (via git ls-remote) for latest commit SHAs
  uninstall       Remove only symlinks pointing into this repo
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = REPO_ROOT / "skills.manifest.json"
LOCAL_CONFIG_PATH = Path.home() / ".config" / "skills-repo" / "local.json"
IGNORED_TOP_DIRS = {".git", "scripts"}
IGNORED_AGENT_ENTRIES = {".system", ".DS_Store"}


@dataclass(frozen=True)
class AgentTarget:
    id: str
    family: str
    label: str
    parent: Path
    skills_dir: Path
    always_create: bool = False
    skip_agy_plugin_dupes: bool = False


def current_os() -> str:
    sys_name = platform.system().lower()
    if sys_name == "darwin":
        return "macos"
    if sys_name == "windows":
        return "windows"
    return "linux"


def get_agent_targets(home: Path) -> list[AgentTarget]:
    return [
        AgentTarget(
            id="shared",
            family="Shared",
            label="Shared (.agents)",
            parent=home / ".agents",
            skills_dir=home / ".agents" / "skills",
            always_create=True,
        ),
        AgentTarget(
            id="claude",
            family="Claude",
            label="Claude Code",
            parent=home / ".claude",
            skills_dir=home / ".claude" / "skills",
        ),
        AgentTarget(
            id="codex",
            family="ChatGPT",
            label="Codex",
            parent=home / ".codex",
            skills_dir=home / ".codex" / "skills",
        ),
        AgentTarget(
            id="gemini-cli",
            family="Gemini",
            label="Gemini CLI",
            parent=home / ".gemini",
            skills_dir=home / ".gemini" / "skills",
        ),
        AgentTarget(
            id="antigravity",
            family="Gemini",
            label="Antigravity IDE",
            parent=home / ".gemini",
            skills_dir=home / ".gemini" / "config" / "skills",
            skip_agy_plugin_dupes=True,
        ),
        AgentTarget(
            id="antigravity-cli",
            family="Gemini",
            label="Antigravity CLI",
            parent=home / ".gemini" / "antigravity-cli",
            skills_dir=home / ".gemini" / "antigravity-cli" / "skills",
            skip_agy_plugin_dupes=True,
        ),
        AgentTarget(
            id="cursor",
            family="Other",
            label="Cursor",
            parent=home / ".cursor",
            skills_dir=home / ".cursor" / "skills",
        ),
    ]


def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        sys.exit(f"ERROR: manifest not found at {MANIFEST_PATH}")
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def load_local_config() -> dict:
    if not LOCAL_CONFIG_PATH.exists():
        return {}
    try:
        data = json.loads(LOCAL_CONFIG_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError as exc:
        print(f"WARNING: ignoring invalid local config {LOCAL_CONFIG_PATH}: {exc}", file=sys.stderr)
        return {}


def discover_repo_skills() -> dict[str, Path]:
    found: dict[str, Path] = {}
    for cat_dir in sorted(REPO_ROOT.iterdir()):
        if not cat_dir.is_dir() or cat_dir.name in IGNORED_TOP_DIRS or cat_dir.name.startswith("."):
            continue
        for skill_dir in sorted(cat_dir.iterdir()):
            if skill_dir.is_dir() and (skill_dir / "SKILL.md").is_file():
                found[skill_dir.name] = skill_dir
    return found


def get_agy_plugin_skills(home: Path) -> set[str]:
    names: set[str] = set()
    plugins_dir = home / ".gemini" / "config" / "plugins"
    if not plugins_dir.is_dir():
        return names
    for plugin in plugins_dir.iterdir():
        skills_dir = plugin / "skills"
        if not skills_dir.is_dir():
            continue
        for skill in skills_dir.iterdir():
            if skill.is_dir() and (skill / "SKILL.md").is_file():
                names.add(skill.name)
    return names


def is_link(path: Path) -> bool:
    if path.is_symlink():
        return True
    # Python 3.12+ supports os.path.isjunction on Windows
    is_junction = getattr(os.path, "isjunction", None)
    return bool(is_junction and is_junction(path))


def link_points_into_repo(path: Path) -> bool:
    if not is_link(path):
        return False
    try:
        raw_target = os.readlink(path)
    except OSError:
        return False
    # Strip Windows extended-length prefix \\?\ if present
    cleaned = re.sub(r"^\\\\\?\\", "", raw_target)
    target = Path(cleaned)
    if not target.is_absolute():
        target = (path.parent / target).resolve(strict=False)
    else:
        target = target.resolve(strict=False)
    repo_resolved = REPO_ROOT.resolve(strict=False)
    try:
        target.relative_to(repo_resolved)
        return True
    except ValueError:
        return False


def remove_link(path: Path) -> None:
    if os.name == "nt":
        # On Windows, directory symlinks and junctions are removed via rmdir (never deleting target contents)
        is_junction = getattr(os.path, "isjunction", None)
        if (is_junction and is_junction(path)) or path.is_dir():
            os.rmdir(path)
            return
    path.unlink()


def create_dir_link(link_path: Path, target_path: Path) -> None:
    try:
        os.symlink(str(target_path), str(link_path), target_is_directory=True)
    except OSError:
        if os.name != "nt":
            raise
        subprocess.run(
            ["cmd", "/c", "mklink", "/J", str(link_path), str(target_path)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )


def resolve_selected_skills(
    manifest: dict,
    repo_skills: dict[str, Path],
    *,
    profiles: list[str] | None,
    include: list[str] | None,
    exclude: list[str] | None,
    all_platforms: bool,
    local_cfg: dict,
) -> list[str]:
    skills_meta: dict = manifest.get("skills", {})
    profiles_meta: dict = manifest.get("profiles", {})
    os_name = current_os()

    eff_profiles = profiles if profiles is not None else local_cfg.get("profiles")
    eff_include = set(include if include is not None else local_cfg.get("include", []))
    eff_exclude = set(exclude if exclude is not None else local_cfg.get("exclude", []))

    if not eff_profiles or "all" in eff_profiles:
        selected = set(repo_skills.keys())
    else:
        selected = set()
        for prof in eff_profiles:
            if prof not in profiles_meta:
                valid = ", ".join(sorted(profiles_meta.keys()))
                sys.exit(f"ERROR: unknown profile '{prof}'. Available: all, {valid}")
            selected.update(profiles_meta[prof].get("skills", []))

    selected.update(eff_include)
    selected.difference_update(eff_exclude)

    final: list[str] = []
    for name in sorted(selected):
        if name not in repo_skills:
            print(f"WARNING: selected skill '{name}' not found in repo, skipping", file=sys.stderr)
            continue
        platforms = skills_meta.get(name, {}).get("platforms", ["all"])
        if not all_platforms and "all" not in platforms and os_name not in platforms:
            continue
        final.append(name)
    return final


def resolve_targets(
    home: Path,
    *,
    agent_ids: list[str] | None,
    all_agents: bool,
    local_cfg: dict,
) -> list[AgentTarget]:
    targets = get_agent_targets(home)
    by_id = {t.id: t for t in targets}
    eff_ids = agent_ids if agent_ids is not None else local_cfg.get("agents")

    if eff_ids:
        chosen = []
        for aid in eff_ids:
            if aid not in by_id:
                sys.exit(f"ERROR: unknown agent '{aid}'. Available: {', '.join(by_id.keys())}")
            chosen.append(by_id[aid])
        return chosen

    if all_agents:
        return targets

    return [t for t in targets if t.always_create or t.parent.exists()]


def sync_herdr_templates(home: Path, selected_skills: list[str], dry_run: bool) -> None:
    if "herd-dispatch" not in selected_skills:
        return
    tpl_src = REPO_ROOT / "workflow-governance" / "herd-dispatch" / "templates"
    if not tpl_src.is_dir():
        return
    herdr_present = (home / ".config" / "herdr-core").exists() or (home / ".config" / "herdr-app").exists()
    if not herdr_present:
        return
    dst_dir = home / ".config" / "herdr-core" / "templates"
    if not dry_run:
        dst_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for md in sorted(tpl_src.glob("*.md")):
        dst = dst_dir / md.name
        if dst.exists() and not is_link(dst):
            continue
        if not dry_run:
            if is_link(dst):
                dst.unlink()
            try:
                os.symlink(str(md), str(dst))
            except OSError:
                shutil.copy2(md, dst)
        count += 1
    print(f"[Herdr Templates   ] synced {count} templates -> {dst_dir}")


def cmd_sync(args: argparse.Namespace) -> int:
    home = Path.home()
    manifest = load_manifest()
    local_cfg = {} if args.ignore_local else load_local_config()
    repo_skills = discover_repo_skills()
    agy_plugins = get_agy_plugin_skills(home)

    profiles = args.profile.split(",") if args.profile else None
    include = args.include.split(",") if args.include else None
    exclude = args.exclude.split(",") if args.exclude else None
    agent_ids = args.agents.split(",") if args.agents else None

    if args.save_local:
        cfg_to_save: dict = {}
        if profiles:
            cfg_to_save["profiles"] = profiles
        if include:
            cfg_to_save["include"] = include
        if exclude:
            cfg_to_save["exclude"] = exclude
        if agent_ids:
            cfg_to_save["agents"] = agent_ids
        LOCAL_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        LOCAL_CONFIG_PATH.write_text(json.dumps(cfg_to_save, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Saved machine config -> {LOCAL_CONFIG_PATH}")
        local_cfg = cfg_to_save

    selected = resolve_selected_skills(
        manifest,
        repo_skills,
        profiles=profiles,
        include=include,
        exclude=exclude,
        all_platforms=args.all_platforms,
        local_cfg=local_cfg,
    )
    selected_set = set(selected)
    targets = resolve_targets(home, agent_ids=agent_ids, all_agents=args.all_agents, local_cfg=local_cfg)

    print(
        f"OS: {current_os()} | Repo: {REPO_ROOT} | Selected: {len(selected)}/{len(repo_skills)} skills"
        + (" [DRY-RUN]" if args.dry_run else "")
    )

    for target in targets:
        if not args.dry_run:
            target.skills_dir.mkdir(parents=True, exist_ok=True)

        pruned = 0
        if target.skills_dir.is_dir():
            for existing in list(target.skills_dir.iterdir()):
                if is_link(existing) and link_points_into_repo(existing):
                    broken = not existing.exists()
                    unselected = args.prune and existing.name not in selected_set
                    plugin_dupe = target.skip_agy_plugin_dupes and existing.name in agy_plugins
                    if broken or unselected or plugin_dupe:
                        if not args.dry_run:
                            remove_link(existing)
                        pruned += 1

        linked = 0
        skipped_plugin = 0
        skipped_copy = 0

        for name in selected:
            if target.skip_agy_plugin_dupes and name in agy_plugins:
                skipped_plugin += 1
                continue

            src = repo_skills[name]
            dst = target.skills_dir / name

            if is_link(dst):
                try:
                    if dst.resolve() == src.resolve():
                        linked += 1
                        continue
                except OSError:
                    pass
                if not args.dry_run:
                    remove_link(dst)
            elif dst.exists():
                if args.replace_copies:
                    if not args.dry_run:
                        shutil.rmtree(dst)
                else:
                    skipped_copy += 1
                    print(f"  [skip copy] {dst} (use --replace-copies to convert to symlink)")
                    continue

            if not args.dry_run:
                create_dir_link(dst, src)
            linked += 1

        extras = []
        if skipped_plugin:
            extras.append(f"plugin-provided: {skipped_plugin}")
        if skipped_copy:
            extras.append(f"skipped-copies: {skipped_copy}")
        if pruned:
            extras.append(f"pruned: {pruned}")
        extra_str = f" ({', '.join(extras)})" if extras else ""
        print(f"[{target.family:<7} | {target.label:<15}] synced {linked:>2} -> {target.skills_dir}{extra_str}")

    sync_herdr_templates(home, selected, args.dry_run)
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    home = Path.home()
    manifest = load_manifest()
    local_cfg = {} if args.ignore_local else load_local_config()
    repo_skills = discover_repo_skills()
    agy_plugins = get_agy_plugin_skills(home)

    selected = resolve_selected_skills(
        manifest,
        repo_skills,
        profiles=args.profile.split(",") if args.profile else None,
        include=None,
        exclude=None,
        all_platforms=args.all_platforms,
        local_cfg=local_cfg,
    )
    selected_set = set(selected)
    targets = resolve_targets(home, agent_ids=None, all_agents=args.all_agents, local_cfg=local_cfg)

    print(f"OS: {current_os()} | Repo: {REPO_ROOT} | Active target skills: {len(selected)}/{len(repo_skills)}")
    if LOCAL_CONFIG_PATH.exists() and not args.ignore_local:
        print(f"Local machine config: {LOCAL_CONFIG_PATH}")
    print("-" * 105)
    print(f"{'Family':<8} {'Agent':<16} {'Linked':>6} {'Copies':>6} {'Plugin':>6} {'Missing':>7} {'Extra':>6}  Path")
    print("-" * 105)

    for target in targets:
        linked = copies = plugin_dup = missing = extra = 0
        for name in selected:
            if target.skip_agy_plugin_dupes and name in agy_plugins:
                plugin_dup += 1
                continue
            dst = target.skills_dir / name
            if is_link(dst) and dst.exists():
                linked += 1
            elif dst.exists():
                copies += 1
            else:
                missing += 1

        if target.skills_dir.is_dir():
            for entry in target.skills_dir.iterdir():
                if entry.name in IGNORED_AGENT_ENTRIES or entry.name.startswith("."):
                    continue
                if entry.name not in selected_set and (entry.is_dir() or is_link(entry)):
                    extra += 1

        print(
            f"{target.family:<8} {target.label:<16} {linked:>6} {copies:>6} {plugin_dup:>6} {missing:>7} {extra:>6}  {target.skills_dir}"
        )
    return 0


def cmd_doctor(_args: argparse.Namespace) -> int:
    home = Path.home()
    manifest = load_manifest()
    repo_skills = discover_repo_skills()
    manifest_skills = set(manifest.get("skills", {}).keys())
    issues = 0

    print("=== 1. Repo & Manifest Consistency ===")
    only_disk = sorted(set(repo_skills.keys()) - manifest_skills)
    only_manifest = sorted(manifest_skills - set(repo_skills.keys()))
    if only_disk:
        print(f"  [FAIL] Skills on disk missing from skills.manifest.json: {', '.join(only_disk)}")
        issues += len(only_disk)
    if only_manifest:
        print(f"  [FAIL] Skills in skills.manifest.json missing on disk: {', '.join(only_manifest)}")
        issues += len(only_manifest)
    for name, path in sorted(repo_skills.items()):
        expected_cat = manifest.get("skills", {}).get(name, {}).get("category")
        actual_cat = path.parent.name
        if expected_cat and expected_cat != actual_cat:
            print(f"  [FAIL] Category mismatch for {name}: manifest={expected_cat}, disk={actual_cat}")
            issues += 1
    if issues == 0:
        print(f"  [OK]   All {len(repo_skills)} skills match skills.manifest.json")

    print("\n=== 2. SKILL.md Frontmatter & README Links ===")
    fm_issues = 0
    for name, path in sorted(repo_skills.items()):
        raw = (path / "SKILL.md").read_text(encoding="utf-8", errors="replace")
        m = re.match(r"^---\r?\n(.*?)\r?\n---", raw, re.DOTALL)
        if not m:
            print(f"  [FAIL] {name}: missing YAML frontmatter")
            fm_issues += 1
            continue
        fm = m.group(1)
        nm = re.search(r"^name:\s*['\"]?([^'\"\r\n]+)['\"]?\s*$", fm, re.MULTILINE)
        dm = re.search(r"^description:\s*(.+)$", fm, re.MULTILINE)
        if not nm or nm.group(1).strip() != name:
            print(f"  [FAIL] {name}: frontmatter name does not match folder name")
            fm_issues += 1
        if not dm:
            print(f"  [FAIL] {name}: missing description")
            fm_issues += 1

    readme = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
    readme_links = set(re.findall(r"\]\(([a-z0-9-]+/[a-z0-9-]+)/\)", readme))
    expected_links = {f"{p.parent.name}/{n}" for n, p in repo_skills.items()}
    missing_in_readme = sorted(expected_links - readme_links)
    broken_in_readme = sorted(readme_links - expected_links)
    for item in missing_in_readme:
        print(f"  [FAIL] Missing in README.md: {item}")
        fm_issues += 1
    for item in broken_in_readme:
        print(f"  [FAIL] Broken link in README.md: {item}")
        fm_issues += 1
    if fm_issues == 0:
        print(f"  [OK]   All {len(repo_skills)} SKILL.md frontmatters & README links valid")
    issues += fm_issues

    print("\n=== 3. Agent Symlinks & Drift Audit ===")
    drift_count = 0
    for target in get_agent_targets(home):
        if not target.skills_dir.is_dir():
            continue
        for entry in sorted(target.skills_dir.iterdir()):
            if entry.name in IGNORED_AGENT_ENTRIES or entry.name.startswith("."):
                continue
            if is_link(entry) and not entry.exists():
                print(f"  [FAIL] Broken symlink: {entry}")
                issues += 1
                continue
            if re.search(r"\.(bak|backup)", entry.name, re.IGNORECASE):
                print(f"  [WARN] Backup dir inside live skills folder (may duplicate skills): {entry}")
                drift_count += 1
                continue
            if entry.name not in repo_skills and (entry.is_dir() or is_link(entry)):
                if (entry / "SKILL.md").is_file():
                    print(f"  [INFO] Local unmanaged skill (not in _skills): {entry}")
                    drift_count += 1
    if drift_count == 0 and issues == 0:
        print("  [OK]   Zero broken links and zero unmanaged drift across detected agents")

    print(f"\nDoctor summary: {issues} error(s), {drift_count} notice(s)")
    return 1 if issues else 0


def cmd_check_upstream(_args: argparse.Namespace) -> int:
    manifest = load_manifest()
    repos: dict[str, list[str]] = {}
    for name, meta in sorted(manifest.get("skills", {}).items()):
        if meta.get("origin") != "third-party":
            continue
        repo_url = (meta.get("upstream") or {}).get("repo")
        if repo_url:
            repos.setdefault(repo_url, []).append(name)

    print(f"Checking {len(repos)} upstream third-party repositories via git ls-remote...\n")
    print(f"{'HEAD (short)':<14} {'Upstream Repo':<46} Skills")
    print("-" * 105)
    for url, skill_names in sorted(repos.items()):
        proc = subprocess.run(
            ["git", "ls-remote", url, "HEAD"],
            text=True,
            capture_output=True,
            timeout=15,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            sha = proc.stdout.strip().split()[0][:10]
        else:
            sha = "UNREACHABLE"
        short_url = url.replace("https://github.com/", "")
        print(f"{sha:<14} {short_url:<46} {', '.join(skill_names)}")
    return 0


def cmd_uninstall(args: argparse.Namespace) -> int:
    home = Path.home()
    targets = resolve_targets(home, agent_ids=args.agents.split(",") if args.agents else None, all_agents=True, local_cfg={})
    total = 0
    for target in targets:
        if not target.skills_dir.is_dir():
            continue
        removed = 0
        for entry in list(target.skills_dir.iterdir()):
            if is_link(entry) and link_points_into_repo(entry):
                if not args.dry_run:
                    remove_link(entry)
                removed += 1
        if removed:
            print(f"[{target.label:<16}] removed {removed} repo symlinks from {target.skills_dir}")
            total += removed
    print(f"Total removed: {total}" + (" [DRY-RUN]" if args.dry_run else ""))
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Cross-OS & Cross-Agent Skills Manager")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("sync", help="Sync skills to all detected agents via symlinks")
    s.add_argument("--profile", help="Comma-separated profiles: all, core, frontend, writing, domain")
    s.add_argument("--include", help="Comma-separated extra skill names to include")
    s.add_argument("--exclude", help="Comma-separated skill names to exclude")
    s.add_argument("--agents", help="Comma-separated agent IDs: shared, claude, codex, gemini-cli, antigravity, antigravity-cli, cursor")
    s.add_argument("--all-agents", action="store_true", help="Create directories and sync to all known agents even if not installed yet")
    s.add_argument("--all-platforms", action="store_true", help="Include OS-specific skills (e.g. windows-* on macOS/Linux)")
    s.add_argument("--replace-copies", action="store_true", help="Replace existing static skill folders with symlinks")
    s.add_argument("--prune", action="store_true", help="Remove repo-owned symlinks for skills outside the current selection")
    s.add_argument("--save-local", action="store_true", help="Save profile/include/exclude/agents choices to ~/.config/skills-repo/local.json")
    s.add_argument("--ignore-local", action="store_true", help="Ignore ~/.config/skills-repo/local.json for this run")
    s.add_argument("--dry-run", action="store_true", help="Preview changes without modifying files")
    s.set_defaults(func=cmd_sync)

    st = sub.add_parser("status", help="Show link status across Claude, Codex, Gemini, Cursor & .agents")
    st.add_argument("--profile", help="Evaluate status against specific profile(s)")
    st.add_argument("--all-agents", action="store_true", help="Show all known agents including absent ones")
    st.add_argument("--all-platforms", action="store_true")
    st.add_argument("--ignore-local", action="store_true")
    st.set_defaults(func=cmd_status)

    d = sub.add_parser("doctor", help="Audit manifest, SKILL.md, README links, broken symlinks & local drift")
    d.set_defaults(func=cmd_doctor)

    u = sub.add_parser("check-upstream", help="Check latest HEAD commits of all third-party upstream repos")
    u.set_defaults(func=cmd_check_upstream)

    un = sub.add_parser("uninstall", help="Remove symlinks pointing into this repo")
    un.add_argument("--agents", help="Comma-separated agent IDs to clean")
    un.add_argument("--dry-run", action="store_true")
    un.set_defaults(func=cmd_uninstall)

    return p


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
