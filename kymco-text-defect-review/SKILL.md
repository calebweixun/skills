---
name: kymco-text-defect-review
description: Review Kymco Vision Platform "Text Defect" OCR training samples at http://100.110.134.34:18600/data by visually comparing each card's plate image against its editable recognition textbox, correcting mismatches, and importing confirmed matches. Use this whenever the user asks to check/verify/review/clean up Kymco Vision Data Manager samples, text defect samples, OCR REC 文字辨識 labels, 原始辨識 textboxes, or wants to "加入背景匯入" cards in that app — even if they just paste the URL and say "check these" or "go through the cards." Requires the ego-browser skill to drive the browser.
---

# Kymco Text Defect Sample Review

## What this does

The Kymco Vision Platform's Data Manager (Text Defect / OCR REC task) shows a queue of
scanned vehicle-plate images. Each card has an editable "原始辨識" textbox holding the
OCR guess, and a "加入背景匯入" (add to background import) button that removes the card
from the queue once confirmed. This skill drives that review: for every card, look at the
actual plate image, decide whether the textbox already matches it, fix it if not, and
import the ones that are correct — the same judgment call a human reviewer makes, just
done by looking at the image yourself instead of trusting the OCR guess blindly.

This is a **visual judgment task**, not a scripted data pipeline: you (the model) must
actually read the plate text off the cropped screenshot each time. No OCR library or
script can substitute for that — that's the whole point of the review.

## Prerequisites

This skill is built entirely on the `ego-browser` skill's Node.js runtime (`ego-browser
nodejs <<'EOF' ... EOF` heredocs). Load that skill's instructions first if you haven't
already — this file assumes you know `useOrCreateTaskSpace`, `snapshotText`, `js()`,
`captureScreenshot`, `click`, and the ref/loc addressing rules.

## Decided review rules (confirmed with the user — apply these without re-asking)

- **Match** → click the card's "加入背景匯入" button.
- **Mismatch** → correct the textbox to the actual plate text, **then click "加入背景
  匯入" immediately after**. This changed from an earlier "correct only, leave for human
  review" rule after testing found that a textbox edit is NOT persisted server-side on
  its own — even with a proper native-setter value change plus `input`/`change`/`blur`
  events dispatched, the correction reverted to the original (often garbled) OCR text on
  the next page reload. The only confirmed way to make a correction stick is to import
  it in the same action. So: fix the text, verify it now reads correctly, then import —
  don't leave a "corrected" card sitting in the queue expecting the fix to hold.
- **Unreadable** (blurry, bad angle, glare, cropped out) → skip entirely. Leave the
  textbox untouched, don't click anything. Don't guess.
- **Log every decision** to a CSV so the user can audit what happened. See Logging below.
- **No batching / no mid-run pauses.** Process the whole queue in one continuous pass,
  but post a short progress update every ~15-20 cards (running match/fixed/skipped
  counts) so the user can follow along and interrupt if something looks off.

If the user asks you to change any of these (e.g. "also click import after fixing"),
follow their instruction for that session — these are just the sensible defaults already
agreed on, not hard requirements.

**Dedup nuance**: only skip a logged card if its row's `action` is `imported`,
`corrected`, or `skipped` — those are genuinely resolved. A row logged as `failed` means
the card was *not* actually resolved (e.g. the environment had a transient problem that
round); it's still eligible, and usually worth retrying rather than leaving stuck forever.

That said, don't burn a lot of time hunting for one specific `failed` card: the list is
virtualized and has no search-by-batch-name filter, so once the queue has moved on (later
imports shift what's loaded), a handful of `failed` cards from an earlier viewport hiccup
can become genuinely unreachable by scrolling. One reasonable attempt (scroll toward
roughly where it should be, check current headings) is worth it; if it's not findable,
leave it `failed` in the log for a human to track down by batch name directly (e.g. via
the app's date filter, or the raw image API path) and move on to fresh cards instead.

**When running as multiple chained batches/subagents** (e.g. the user has you dispatch a
new subagent per N cards): before acting on any card, check the shared CSV log for a row
with that `batch_name` already in it. If one exists with action `imported`, `corrected`,
or `skipped`, skip the card — don't re-decide, don't re-log, don't touch it again.

**Exception — reconciling stale/phantom log entries.** A genuinely-imported card
disappears from the live queue. If you find a card that's logged as `imported` or
`corrected` but is *still sitting there, visibly present and unresolved*, that's not a
reason to skip it — it's a signal the earlier log entry was wrong (the click was logged
but never actually took effect server-side; this has happened for real, not just a
hypothetical). Don't just leave it stuck: re-verify it visually against its image like
any other card, and if it needs importing, import it with a proper before/after counter
check, then append a *new* reconciliation row (don't edit the old one) noting what
happened, e.g. "reconciliation: card was logged imported on an earlier pass but still
present in queue; re-verified and re-imported, counter X->Y confirmed." This is exactly
why every logged row should include a real counter-delta note — a logged action with a
vague or missing note (no "counter N->M") is a weaker signal that it actually happened,
and worth a second look if you run across it still sitting in the queue.

Only re-touch an already-*resolved* (genuinely gone from the queue) logged card if the
user explicitly asks you to revisit it.

**When multiple lanes/tabs are active at once**, a tab you haven't interacted with in a
while can show a stale "共 N 筆" counter — the page doesn't live-refresh just because
another tab imported cards. Before trusting a counter reading for any cross-lane
reconciliation or reporting, `gotoAndWait(...)` to force a fresh load rather than reading
whatever the page happens to be showing.

**Parallel lanes**: if you're one of several lanes working the same queue at once,
picking a scroll depth to reduce overlap with other lanes is a good start but not
foolproof — a fast-moving lane elsewhere can still catch up to where you started. If you
keep hitting recently-resolved cards even after your initial scroll, don't just keep
skipping past a wall of them one at a time: scroll further ahead into less-contested
territory rather than grinding through overlap.

(Earlier versions of this skill had mismatches logged as `corrected` and deliberately left
*in* the queue for human review, which meant a later batch could see the now-correct
textbox, think it was an untouched match, and import it — silently skipping the review it
was left for. That's moot now that a correction is imported in the same action as it's
made, but if you ever encounter a legacy `corrected` row from before this change, treat it
the same as any other logged row: check the card's current state, and if it's still
sitting unimported in the queue, finish the job — verify the textbox is correct and import
it — rather than leaving it stuck.)

## Workflow

1. **Open the page, sanity-check the viewport, and set the task type.** Reuse one task
   space for the whole review session (e.g. name it `kymco text defect review`) so refs
   and scroll position persist across heredoc rounds — this matters a lot when the review
   is split across many sequential subagents, since they all share this one browser tab.

   Before doing anything else, call `pageInfo()` and check `w`/`h` look like a real
   desktop viewport (e.g. `w >= 800`). A shared tab that's been through several rounds of
   automation can end up with a corrupted tiny viewport (observed once: `w:185 h:89`
   instead of the normal `~1800x1130`) — when that happens, in-page `fetch`/`FileReader`
   calls and `captureScreenshot` both fail or time out, for reasons that have nothing to
   do with the image URLs or selectors themselves. If the viewport looks wrong, call
   `gotoAndWait('http://100.110.134.34:18600/data', { timeout: 20, settle: 2 })` to force
   a clean reload before doing anything else — don't waste time debugging fetch/selector
   code when the real problem is a broken shared tab.

   Then navigate to `http://100.110.134.34:18600/data` if not already there, and open the
   "任務類型" dropdown to pick "Text Defect（文字）" if it isn't already selected — check
   the button's text first, it may already be on the right task type.

   **The viewport can also break mid-run**, not just at startup — a run that logs several
   consecutive cards as failed (e.g. "no image url") right after working fine is a strong
   signal the tab broke partway through, not that those specific cards are unusual. If you
   see 2+ failures in a row of the same kind, re-check `pageInfo()` and `gotoAndWait(...)`
   again before concluding anything about the cards themselves — then retry the same
   cards once. Only log a genuine per-card failure after a reload-and-retry still doesn't
   work.

   **If you get stuck (repeated failures, an unclear error, anything that tempts you to
   ask for broader permissions or a bypassed safety check to keep going): don't.** Stop,
   log what you've genuinely confirmed so far, and report the blocker honestly in your
   final summary. Never ask to have a permission gate, classifier, or approval step
   loosened or bypassed in order to continue a loop — if something is blocking you, that's
   information to report, not an obstacle to route around.

2. **Enumerate the currently-loaded cards.** Call `snapshotText()` and find the card
   buttons (top-level `button [ref=N, loc=unstable]` nodes that each contain a heading
   with a batch name like `20260807_072809_GO`, an `image`, a `textbox`, and a button
   labeled "加入背景匯入"). The list only has ~20-40 cards loaded at a time and grows via
   lazy-load as you scroll — see `references/browser-workflow.md` for the scroll pattern.

   **Card DOM shape varies.** The first 1-2 cards in a freshly loaded page can have an
   extra nesting level (separate containers for the image-vs-controls and for
   GO/NG/PASS-vs-textbox) compared to later cards, which are flatter. Don't assume a
   fixed nesting depth — search by the stable landmarks instead: the button labeled
   `放大檢視原圖` (contains the `image`), the `textbox`, and the button whose text is
   `加入背景匯入`, all within the same top-level card button.

   **Refs expire on the next snapshot.** A `ref=N` from `snapshotText()` is only valid
   until you call `snapshotText()` again. If you need a ref for a card you found earlier,
   act on it *before* the next snapshot, or re-resolve it via a stable `loc=` value or a
   fresh snapshot.

3. **Fetch each card's image directly — don't screenshot the page for this.** Every
   card's `<img>` has a real, directly-fetchable URL, e.g.
   `http://100.110.134.34:18600/api/images/%2Fhome%2Fasus%2Fcode%2Finput%2FDCMI%2Ftext_defect%2F20260807_065359_GO%2Fraw.jpg?v=1`.
   Read the `img.src` for the card and download it (in-page `fetch` + `FileReader` →
   base64 → write to a local file with Node's `fs`; see
   `references/browser-workflow.md` section 3 for the exact code). Then `Read` the saved
   file to look at it.

   This is strictly better than viewport screenshotting for this app: it's the full,
   uncropped raw photo (nothing to accidentally cut off), it's unaffected by scroll
   position or the fixed bottom toolbar that can otherwise overlap a card's image when
   the card sits low in the viewport, and it doesn't depend on `captureScreenshot`
   clip-region math or timing at all. Only fall back to a viewport screenshot if the
   direct fetch ever fails (e.g. non-200 response, CORS issue) — and if you do, scroll
   the card into the upper 2/3 of the viewport first so the fixed bottom toolbar can't
   overlap the crop.

4. **Compare and act**, per the rules above:
   - Read the textbox's current value from the snapshot (it renders as two `text` nodes,
     e.g. `"SJ30LA-"` + `"137478"` — concatenate them, the display just wraps the line).
   - If it matches what you actually read on the plate: click the "加入背景匯入" button
     for that card.
   - If it differs: use `fillInput` (or click + select-all + type) to correct the
     textbox to the real text, matching the existing format (prefix, hyphen, space/line
     break, digit run) used by the surrounding correct entries — don't invent a new
     format. **Immediately verify the textarea's `.value` actually shows the corrected
     text, then click "加入背景匯入" right away, in the same round** — a correction that
     isn't imported doesn't survive a reload (see the rule above); don't leave it
     half-done.

     **Double-check visually-ambiguous characters before calling something a
     mismatch.** `0` vs `O`, `1` vs `I`/`l`, `5` vs `S`, `8` vs `B` are easy to misread
     off a low-contrast embossed plate, especially at a glance. Cards in this dataset
     share long common prefixes (e.g. many plates in a row all start `SJ30LA-`) — if
     your reading of one card's prefix differs from the prefix every neighboring card
     shares, that's a signal to look again more carefully before "correcting" it, not a
     license to assume it's fine either way. Getting this wrong is worse than a missed
     import: it actively writes bad data into a correct textbox. (Caught during testing:
     a plate correctly reading `SJ30LA-137449` — matching its textbox — was misread as
     `SJ3OLA-137449` and logged as a "correction"; it was only unwritten because the
     click layer happened to fail that round. Don't rely on that kind of luck.)
   - If unreadable: skip, don't touch the card.
   - Append a row to the log (see below) for every card you decide on, including skips.

5. **Verify each import.** After clicking "加入背景匯入", the card should disappear from
   the queue and the header counters ("共 N 筆", GO/NG/PASS totals) should decrement by
   one. Re-check this periodically (not necessarily after every single click) — if counts
   *aren't* dropping, stop and investigate before continuing; something is wrong with the
   click targeting.

   **Clicking reliably**: always take a *fresh* `snapshotText()` immediately before the
   click and use the `ref=N` it just gave you for that exact button — don't reuse refs
   from an earlier snapshot, and don't try to locate the button by regex-parsing the
   snapshot's text output or by guessing a CSS selector; the snapshot tree already gives
   you a clean structure to walk. If a click doesn't move the counter, one clean retry
   with a brand-new snapshot is reasonable — but don't spiral into trying five different
   selector strategies. Report it as a failure and move on rather than burning the whole
   batch fighting one card. (Confirmed during testing: a fresh snapshot immediately
   before `click()` worked reliably every time; the failures seen came from stale/parsed
   refs, not from anything wrong with the button itself.)

   **The fixed bottom toolbar can silently swallow clicks, not just obscure
   screenshots.** If a card sits low enough in the viewport, the toolbar div can be the
   actual top element at that screen position — the click lands on the toolbar instead of
   the button, with no error and no counter change. If a click on a freshly-snapshotted
   ref doesn't move the counter, scroll the card into the upper ~60% of the viewport and
   retry before assuming anything else is wrong.

   **Prefer `fillInput` over click+select-all+type for correcting a textarea.** Testing
   found at least one case where click + `cmd+a`/`ctrl+a` + `typeText` silently didn't
   update a card's textarea, while `fillInput` on the same element worked. If a text
   correction doesn't seem to take (re-check the textarea's value after), try `fillInput`
   instead of debugging the keyboard-based approach further.

   **A single transient tool-permission/classifier denial on an otherwise normal action
   is not the same as being genuinely blocked.** If one click or one script gets denied
   once, a clean retry of the identical action is reasonable and often just works — that's
   different from the "don't ask to loosen guardrails" rule above, which is about
   responding to a real, repeated block by trying to get the safety mechanism itself
   weakened. Retrying the same allowed action once is fine; asking for broader permissions
   is not.

6. **Scroll for more cards** once you've worked through the currently-loaded batch, then
   repeat from step 2. Continue until the "共 N 筆" total reaches 0, or until you've swept
   the whole list once without finding new cards to load.

7. **Report progress every ~15-20 cards**: short line like "45 reviewed — 40 matched &
   imported, 3 corrected, 2 skipped (unreadable)". Don't stop and wait for confirmation
   unless something looks genuinely wrong (e.g. counts not decrementing, textbox format
   wildly inconsistent, network/page errors) — in that case, stop and describe what you
   saw.

8. **Final summary**: total reviewed, imported, corrected (with a few examples), skipped,
   and the log file path.

## Logging

Keep a running CSV in the scratchpad directory, e.g.
`<scratchpad>/kymco_text_defect_review_log.csv`, with columns:

```
timestamp,batch_name,original_text,image_text,action,note
```

- `action` is one of `imported` (clean match, clicked import as-is), `corrected`
  (textbox was wrong, fixed it, **then also imported it** — `original_text` /
  `image_text` in the row show what changed), `skipped` (unreadable), or `failed` (a
  genuine attempt that didn't go through — see the dedup/retry notes above).
- `note` is optional — use it for anything unusual (e.g. "toolbar overlapped crop, had to
  rescroll", "ambiguous last digit, low confidence").
- Append rows as you go, not all at the end — if the session gets interrupted, the log
  should still reflect everything done so far.
- **Append-only.** Never rewrite, truncate, or "clean up" existing lines in this file —
  other batches may be reading or about to append to it. If you log something wrong, add
  a corrective note as a new row rather than editing an old one.
- **Use the exact same log file path across every batch/lane, always under the scratchpad
  directory** — never the user's project/working directory. When running as multiple
  lanes, the log is the shared coordination mechanism (it's how dedup works across
  lanes); a lane that can't locate the established path and decides to create its own
  fresh log file "since scratchpad is per-session" is wrong and will silently fork the
  audit trail — worse, writing it into the user's actual working directory leaves a stray
  file behind that doesn't belong there. If you're unsure of the path, ask the dispatcher
  or check what earlier batches used before creating anything new.

## Detailed code patterns

`references/browser-workflow.md` has the concrete, previously-verified ego-browser code
for every step above: opening/reusing the task space, checking and switching the task-type
dropdown, enumerating cards, computing image bounding boxes, cropping screenshots, reading
textbox values, filling corrections, clicking import, and confirming counter deltas. Read
it before the first browsing round of a new session so you're not re-deriving selectors
from scratch.
