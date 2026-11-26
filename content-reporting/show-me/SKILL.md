---
name: show-me
description: Render plans, architectures, timelines, comparisons, reports, layouts, or visual choices as a self-contained local HTML page and show it in Codex. Use when the user says "show me", asks for a flowchart or visual explanation, or when spatial structure is materially clearer than prose. Do not use for text meant to be pasted into another tool.
---

# Show me for Codex

Turn information with meaningful shape into a visual artifact the user can inspect. A file is not delivered until it has been rendered, checked, and opened or linked in Codex.

## Choose the output

- Use **SHOW** for a plan, flow, architecture, timeline, comparison, report, or one concept with variants.
- Use **PICK** when the user must choose among visual directions. Show at least three genuinely different structural options when three useful options exist; do not manufacture weak options merely to reach a quota.
- Keep plain text for content intended to be copied into source code, configuration, email, chat, or another editor.

## Build the artifact

1. Verify every filename, number, status, relationship, and URL used in the visual. Mark unavailable evidence as `not verified` rather than guessing.
2. Write one complete HTML file with `<meta charset="utf-8">`, inline CSS and inline JavaScript. Do not use CDN links, web fonts, analytics, or network requests.
3. Prefer semantic HTML, CSS, and inline SVG. Mermaid is allowed only when its renderer is bundled into the file; otherwise draw the flow with HTML/CSS/SVG so the page works offline.
4. Put durable project artifacts in the user-requested location. Otherwise use the current Codex visualization workspace when available, or a task-specific directory under `%USERPROFILE%\.codex\visualizations`. Do not place generated files in the repository unless the user asked for that.
5. Make dense visuals responsive, printable, keyboard-readable, and legible in light and dark environments. Avoid decorative background grids behind text.
6. For PICK mode, place options side by side when space permits. Name each option by its structural idea, add a one-sentence argument, and provide a copyable selection control.

## Inspect and deliver in Codex

1. Open the local HTML with the Codex app's browser/file preview capability when available. Prefer `open_in_codex` over launching an external shell browser.
2. Verify the rendered page yourself. Check clipping, overlap, scroll behavior, contrast, missing assets, and that labels and relationships match the evidence.
3. If Codex cannot render the page, provide a clickable absolute file link and clearly say the preview was not verified.
4. Lead the response with the visual's verdict, include failures or uncertainty, and end with one concrete next step only when one is useful.

## Invariants

- Embed images as data URLs or inline SVG when portability matters.
- Never claim the user saw a page solely because a command exited successfully.
- Do not replace a requested native artifact such as PPTX, DOCX, XLSX, or repository code with HTML; use HTML only as the appropriate preview or requested deliverable.
- Preserve the user's scope and authorization. Rendering a view does not authorize publishing, deployment, or unrelated edits.
