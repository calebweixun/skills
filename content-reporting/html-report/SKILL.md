---
name: html-report
description: Generate rich, interactive, self-contained HTML reports with charts, searchable tables, tabs, collapsibles, code highlighting, Mermaid diagrams, KaTeX math, dark mode, and optional GitHub Pages publishing. Use when the user asks for a report, writeup, dashboard, summary page, share link, or a navigable presentation of data or comparisons.
---

# html-report

Create a polished self-contained HTML report and optionally publish it through a GitHub Pages report repo.

## Default Behavior

- Prefer draft/local output unless the user explicitly asks to commit, push, publish, or produce a public URL.
- Never fabricate a URL. Return the exact output from `scripts/publish.py`.
- Keep the report as one HTML file with CDN dependencies only; no build step.
- Use `assets/base.html` as the starting template.
- Use `scripts/publish.py` to update `reports/manifest.json`.

## Report Planning

Before writing HTML, decide:

- the headline finding for the top of the report
- the top-level sections and stable heading IDs
- which sections benefit from charts, searchable/sortable tables, tabs, collapsibles, code blocks, Mermaid, or math
- whether the report needs a sticky table of contents; use one for more than two top-level sections

Every substantive report should use at least three HTML-native affordances where they fit the content.

## Generation Workflow

1. Resolve the report repo.
   - If the current workspace is the report repo, use it.
   - If the skill is installed globally, pass `--repo <path-to-report-repo>` or read `config.json` for `local_repo_path`.
2. Generate one file at `<repo>/<reports_dir>/<YYYY-MM-DD>-<short-kebab-slug>.html`.
3. Start from `assets/base.html`; replace the title, description, Open Graph tags, header, TOC, sections, CSS, and bottom script as needed.
4. Set `<title>`, `<meta name="description">`, `<meta name="viewport">`, and Open Graph tags.
5. Run:

```bash
python3 <skill-dir>/scripts/publish.py \
  --repo <report-repo> \
  --html reports/<YYYY-MM-DD>-<slug>.html \
  --title "<report title>" \
  --description "<one-line description>"
```

This updates the manifest and prints `DRAFT: <path>` without committing or pushing.

Only when the user explicitly asks to publish, run the same command with:

```bash
--commit --push
```

## Quality Bar

- Single HTML file, no build step, CDN-only libraries.
- Mobile responsive at a 375px viewport.
- Dark mode toggle persisted with `localStorage`.
- Print stylesheet.
- `prefers-reduced-motion` respected.
- Anchor links on all section headings.
- No inline `style=""`; use one `<style>` block.
- Charts must be responsive and not overflow on mobile.
- Tables over 10 rows need search, sort, or filtering.
- Code blocks need syntax highlighting and copy buttons.

## Useful HTML Affordances

| Capability | Use it for |
|---|---|
| Chart.js | numeric data, trends, distributions |
| searchable/sortable tables | tabular data with more than 5 rows |
| tabs | alternatives, before/after, multiple views |
| `<details>` | optional depth, raw output, appendices |
| highlight.js | code snippets |
| Mermaid | workflows, architecture, state machines |
| KaTeX | equations |
| tooltips/popovers | definitions, footnotes, citations |

## Do Not Use For

- one-line answers
- throwaway debug output
- files that must live inside another software project
- content the user explicitly requested as markdown or plain text
