# Kymco Text Defect — ego-browser code patterns

All of these run inside `ego-browser nodejs <<'EOF' ... EOF` heredocs. Reuse the same task
space name across rounds so tabs, scroll position, and login state persist.

## 1. Open / reuse the page, sanity-check the viewport, check the task-type menu

```js
const task = await useOrCreateTaskSpace('kymco text defect review')
await openOrReuseTab('http://100.110.134.34:18600/data', { wait: true, timeout: 20 })

// A tab shared across many sequential subagent rounds can end up with a corrupted
// viewport (observed once: w:185 h:89 instead of the normal ~1800x1130). When that
// happens, in-page fetch()/FileReader calls AND captureScreenshot both fail or time
// out — for reasons unrelated to selectors or image URLs. Cheap to check, expensive to
// misdiagnose, so always check first.
const info = await pageInfo()
if (!info.w || info.w < 800) {
  cliLog(`viewport looked broken (w=${info.w} h=${info.h}), forcing a reload`)
  await gotoAndWait('http://100.110.134.34:18600/data', { timeout: 20, settle: 2 })
}

// Check current task type before switching — avoid an unnecessary click if it's
// already correct.
const current = await js(String.raw`(() => {
  const btn = document.querySelector('button[aria-label="任務類型"]')
  return btn ? btn.textContent.trim() : null
})()`)
cliLog('current task type: ' + current)

if (!current || !current.includes('Text Defect')) {
  await click('button[aria-label="任務類型"]', { label: 'open task type menu' })
  // then snapshotText() to find and click the "Text Defect（文字）" option
}
```

## 2. Enumerate loaded cards without relying on nesting depth

Don't hardcode a DOM shape — the first couple of cards can be nested one level deeper
than the rest. Pull the stable landmarks directly with `js()` instead of parsing the
`snapshotText()` tree by hand when you just need the list of batch names + element
handles to compute boxes from:

```js
const cards = await js(String.raw`(() => {
  // every card is a top-level button containing a heading, an image, a textbox, and
  // an "加入背景匯入" button — find them by those landmarks, not by nesting depth.
  const imgBtns = Array.from(document.querySelectorAll('button[aria-label="放大檢視原圖"]'))
  return imgBtns.map((imgBtn, i) => {
    // IMPORTANT: the card wrapper is NOT a literal <button> element, even though
    // snapshotText() shows it with an accessibility "button" role. It's a
    // `<div class="data-card-shell" role="button">` (or similar). imgBtn itself IS a
    // real <button>, so `imgBtn.closest('button')` resolves to imgBtn itself (closest()
    // includes the starting element) and every downstream query on `card` silently
    // returns null. Walk up to the actual card container instead — go up a fixed number
    // of parents past the point where you can find the heading/textarea siblings, or
    // (more robust) climb until you hit an ancestor that contains a `textarea`:
    let card = imgBtn.parentElement
    while (card && !card.querySelector('textarea')) card = card.parentElement
    const heading = card ? (card.querySelector('h1,h2,h3,h4,h5,h6') || card.querySelector('[class*="heading"]')) : null
    const textarea = card ? card.querySelector('textarea') : null
    const r = imgBtn.querySelector('img').getBoundingClientRect()
    return {
      index: i,
      batchName: heading ? heading.textContent.trim() : null,
      textboxValue: textarea ? textarea.value : null, // uses '\n' as the line break, not a space
      box: { x: r.x, y: r.y, w: r.width, h: r.height },
    }
  })
})()`)
cliLog(JSON.stringify(cards, null, 2))
```

Confirmed against the live app: the textbox is a real `<textarea>`, and its `.value`
contains an actual `\n` between the prefix and the digit run (e.g. `"SJ30LA-\n137455"`),
not a space — when comparing against what you read on the image, strip/normalize
whitespace rather than expecting a literal space.

**If the heading selector comes up `null`** for a card's batch name (happens
intermittently — the heading isn't always where earlier cards' DOM shape suggested),
derive the batch name from the image URL instead, which is always present and reliable:
`decodeURIComponent(img.src).match(/text_defect\/([^/]+)\//)[1]` extracts e.g.
`20260807_065359_GO` straight out of the `img.src` path.

Still use `snapshotText()` when you need actual clickable `ref=N` values for `click()` —
the `js()` query above is for bulk bounding-box/text extraction, not for producing refs.
After a `js()`-based scan tells you *which* card (by batch name or index) needs an action,
take a fresh `snapshotText()` and locate that same card by its batch-name heading text to
get current refs for its textbox and import button. Refs go stale the moment you call
`snapshotText()` again, so resolve-then-act, don't cache refs across snapshots.

## 3. Fetch a card's raw plate image directly (preferred over screenshotting)

Every card's `<img>` points at a real, individually-fetchable URL on the app's own API,
e.g. `http://100.110.134.34:18600/api/images/%2Fhome%2Fasus%2Fcode%2Finput%2FDCMI%2Ftext_defect%2F20260807_065359_GO%2Fraw.jpg?v=1`.
Downloading that directly gets you the full, uncropped raw photo — no scroll position to
manage, no bottom-toolbar overlap, no `getBoundingClientRect()`/clip-region math, and
none of the `captureScreenshot` timeouts that show up under load. This is the preferred
method; only fall back to screenshotting (further below) if a fetch ever fails.

```js
// Node's `require` and top-level `await` can't coexist in the same heredoc — use
// dynamic import for fs instead.
const fsMod = await import('fs')
const fs = fsMod.default

const imgSrc = await js(String.raw`(() => {
  const imgBtns = document.querySelectorAll('button[aria-label="放大檢視原圖"]')
  const img = imgBtns[CARD_INDEX].querySelector('img')
  return img ? img.src : null
})()`)

// Do the fetch INSIDE the page (js()) rather than with serverFetch/browserFetch's own
// 'binary'/'base64' encoding options — those were observed to mangle JPEG bytes (an
// `encoding: 'binary'` fetch produced a corrupted file; the in-page fetch+FileReader
// dataURL round-trip below produced a byte-perfect JPEG every time it was tested).
const dataUrl = await js(String.raw`(async () => {
  const res = await fetch(${JSON.stringify('IMG_SRC_PLACEHOLDER')})
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
})()`.replace('IMG_SRC_PLACEHOLDER', imgSrc))

const base64 = dataUrl.split(',')[1]
const out = `${scratchpadDir}/card_${CARD_INDEX}.jpg`
fs.writeFileSync(out, Buffer.from(base64, 'base64'))
```

(The `.replace(...)` dance above is just to safely inject the already-fetched `imgSrc`
string into the template — you can also build the whole `js(String.raw\`...\`)` call with
a plain template literal and `JSON.stringify(imgSrc)` interpolated directly, whichever is
less fiddly in your heredoc.)

Then use the `Read` tool (outside the heredoc, back in the main assistant turn) on `out`
to actually look at the plate and read the text yourself.

### Fallback: viewport screenshot with a clip region

Only use this if the direct fetch fails (non-200, CORS, etc.):

```js
const box = await js(String.raw`(() => {
  const imgBtns = document.querySelectorAll('button[aria-label="放大檢視原圖"]')
  const img = imgBtns[CARD_INDEX].querySelector('img')
  const r = img.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
})()`)

const pad = 10
const out = `${scratchpadDir}/card_${CARD_INDEX}.png`
await captureScreenshot(out, {
  clip: { x: box.x - pad, y: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 }
})
```

**If the crop looks wrong** (bottom of the plate cut off, or overlaid with unrelated
toolbar text like "全不選 / AI識讀 / AI裁切 / 還原原圖 / 還原標籤"), the card is too close
to the bottom of the viewport — the app has a toolbar fixed to the bottom of the screen,
not to the page. Scroll so the card sits higher (e.g. `scrollBy(-300)` or scroll to put the
card in the top half of the viewport) and re-capture rather than trusting the clipped crop.

## 4. Read the textbox's current value

From a `snapshotText()` node, a textbox renders its value as one or more `text` children
that need concatenating (the UI just wraps the line, it's not two separate fields):

```
textbox [ref=456, loc=unstable]
  text "SJ30LA-"
  text
  text "137478"
```
→ current value is `"SJ30LA-137478"` (ignore the blank `text` node, it's just the wrap
point).

You can also read it directly and more reliably via `js()` on the textarea's `.value`
(see the `cards` extraction in section 2) if the snapshot text is ambiguous.

## 5. Correct a mismatched textbox, then import it

**A textbox edit is not saved on its own.** Testing confirmed that even a "proper" React
-compatible edit (native `HTMLTextAreaElement` value setter + dispatched `input`/`change`/
`blur` events) reverts to the original OCR text after the next page reload — there's no
autosave on blur/change. The only thing that has been confirmed to make a correction
stick is importing the card in the same round right after fixing it. So this step always
ends with a click on "加入背景匯入", not just a text fix.

```js
await fillInput('@REF_OF_TEXTBOX', 'SJ30LA-137480') // match the existing format exactly
```

If `fillInput` doesn't seem to take (re-check `.value` after), fall back to the
click+select-all+type approach, or the explicit native-setter version:

```js
await js(String.raw`(() => {
  const textarea = document.querySelector(${JSON.stringify('SOME_SELECTOR')})
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
  setter.call(textarea, 'SJ30LA-\n137480')
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.dispatchEvent(new Event('change', { bubbles: true }))
})()`)
```

Then verify the textarea's current value actually reads correctly, and immediately click
"加入背景匯入" for that same card (see section 6) — don't leave a correction unimported.

## 6. Import a confirmed match and verify the counter dropped

**Regex escaping inside `String.raw`**: use a single backslash (`\s`, `\d`) exactly as
below. `String.raw` already preserves backslashes literally, so doubling them (`\\s`,
`\\d`) sends a literal backslash-plus-letter into the regex — it silently fails to match
(returns `null`, no error) rather than throwing, which is easy to miss. If a counter-check
snippet is quietly returning `null` instead of a number, check this first before assuming
something is wrong with the page.

```js
const before = await js(String.raw`(() => {
  const m = document.body.innerText.match(/共\s*(\d+)\s*筆/)
  return m ? parseInt(m[1], 10) : null
})()`)

await click('@REF_OF_IMPORT_BUTTON', { label: '加入背景匯入' })
await wait(1)

const after = await js(String.raw`(() => {
  const m = document.body.innerText.match(/共\s*(\d+)\s*筆/)
  return m ? parseInt(m[1], 10) : null
})()`)

if (after !== before - 1) {
  cliLog(`WARNING: count did not drop as expected (before=${before}, after=${after})`)
}
```

If the count doesn't drop, stop and re-snapshot to see what actually happened before
continuing — don't just plow ahead assuming the click landed.

### Alternative: DOM-marking instead of ref/coordinate clicks

For bulk imports across many cards in one round, one batch found it more robust to mark
the target element directly in the DOM with a throwaway attribute, then `click()` against
that attribute as a plain CSS selector — this sidesteps both stale-ref issues and the
bottom-toolbar-intercepts-the-click problem, since you're selecting the real button
element itself rather than a screen coordinate or a ref that might have gone stale:

```js
await js(String.raw`(() => {
  const els = document.querySelectorAll('h1,h2,h3,h4,h5,h6, [class*="heading"]')
  let heading = null
  for (const e of els) { if (e.textContent.includes(${JSON.stringify(BATCH_NAME)})) { heading = e; break } }
  if (!heading) return false
  let card = heading.parentElement
  let hops = 0
  while (card && !card.querySelector('textarea') && hops < 10) { card = card.parentElement; hops++ }
  const buttons = card ? Array.from(card.querySelectorAll('button')) : []
  const importBtn = buttons.find(b => b.textContent.includes('加入背景匯入'))
  if (!importBtn) return false
  importBtn.setAttribute('data-eb-target', 'import')
  importBtn.scrollIntoView({ block: 'center' })
  return true
})()`)

await click('[data-eb-target="import"]', { label: '加入背景匯入' })
```

Either approach (fresh-snapshot-ref, or DOM-marking) works — use whichever is going more
smoothly in a given session. If refs are behaving (batches have seen this too), don't
switch away from the simpler snapshot approach just because it's available.

## 7. Load more cards

The list is **paginated in fixed increments** (a "顯示下 48 筆" — "show next 48" —
control near the bottom of the loaded cards), not a true infinite-scroll that lazy-loads
as you approach the bottom. `scrollToBottomUntil` still works because scrolling to the
bottom reveals that button, but if it's not doing what you expect, look for and click that
button directly instead of relying purely on scroll position:

```js
await scrollToBottomUntil(
  async () => (await js(String.raw`document.querySelectorAll('button[aria-label="放大檢視原圖"]').length`)) >= TARGET_COUNT,
  { step: 900, wait: 1, maxSteps: 20 }
)
```

Watch for the total ("共 N 筆") staying flat across a scroll — that means you've reached
the end of what's currently loaded/available, not that the app is stuck.
