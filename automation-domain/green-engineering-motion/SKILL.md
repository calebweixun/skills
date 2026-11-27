---
name: green-engineering-motion
description: 為綠色工程教學課程製作 Three.js MG 動畫：整集口白教學影片的透明疊圖（逐字對位、片頭、章節卡、片尾）、單頁重點動態圖示、既有片頭修改；含版面編輯器、1080p／59.94 fps 透明 ProRes 輸出、驗證與審查流程。
---

# 綠工課程 MG（Three.js 透明疊圖）

把老師的教學簡報與口白，做成可編輯、可預覽、可輸出的 Three.js MG：疊在老師影片上的透明 ProRes 4444，加一支含原音的完整預覽 MP4。只讀這份技能，應能做出與已完成各集同品質的成果。

## 何時用、用哪個範本

| 任務 | 做法 |
| --- | --- |
| 整集口白教學影片（多段、有逐字稿） | 複製 [`templates/episode/`](templates/episode/README.md) 為新專案，走下方「整集流程」 |
| ep0 式開場（老師置中、深色底） | 參考 `templates/episode/examples/opening-page.js`（開場 `page.js`）與範例 `01-intro` 段（`center` 模式） |
| 單頁重點動畫（一頁一個關係） | 複製 [`templates/single-page/`](templates/single-page/README.md)（比例參考見 [`examples/`](examples/README.md)）；讀 [單頁實作與輸出](references/implementation.md)、[動作語言](references/motion-language.md) |
| 修改既有地球片頭（02.2） | 讀 [動作語言](references/motion-language.md)；它是動作案例，不是內容模板 |

輸入檔（簡報、口白、參考片）由使用者提供，見 [專案與素材位置](references/project-context.md)。複製範本再改，不要重建；原簡報與原片一律唯讀。

## 快速開始

1. 複製範本：`Copy-Item -Recurse <SKILL_DIR>/templates/episode <PROJECT>`（單頁用 `templates/single-page`），`cd <PROJECT>`。
2. `npm install`（Node 20+）。
3. 放 ffmpeg：`tools/bin/ffmpeg.exe`，或環境變數 `MG_FFMPEG`，或在 PATH。另需 Python：`pip install faster-whisper numpy pillow av`（`MG_PYTHON`、`MG_PY_PACKAGES` 可指定）。
4. 放入使用者輸入：口白與簡報 → `python tools/prepare.py <SLIDES>.pptx <NARRATION>.mp4`（產生 `assets/narration*.wav`、`review/source-slides.json`）。
5. 逐字對位：`python tools/transcribe.py` → `review/alignment.json`。
6. 改 `src/config.js`、`src/scenes/page.js`；`node server.mjs` 預覽（`http://127.0.0.1:4222/`），`cuesync`／`still`／`audit` 檢查。
7. `node tools/render.mjs`（輸出）→ `node tools/verify.mjs`（驗證）→ `node tools/finalize.mjs`。

模板內容與輸入清單見 [`templates/episode/README.md`](templates/episode/README.md)、[`templates/single-page/README.md`](templates/single-page/README.md)。

## 文件地圖

1. [專案與素材位置](references/project-context.md)：輸入檔、範本、環境變數、可借用程式。
2. [整集製作經驗與陷阱](references/episode-production.md)：症狀 → 原因 → 修法（P-1～P-15），品質的核心。
3. [QA 與交付檢查清單](references/qa-checklist.md)：審查輪次、驗證數字、交接內容。
4. [單頁實作與輸出](references/implementation.md)：座標換算、`renderAt`、素材清理、輸出與 Windows 細節。
5. [動作語言](references/motion-language.md)：分段曲線、卡通感、回彈。
6. [單頁任務提示與交接欄位](references/handoff.md)：貼給其他 agent 的提示、交接格式、多 agent 分工。
7. [ep0 風格筆記](references/ep0-style-notes.md)、[字重與層級](references/weight-hierarchy.md)：比例、密度、字重基準。
8. [`examples/`](examples/README.md)：MG-only 分鏡圖。

## 硬性規則（每個專案都適用）

- **時間**：元素在老師說到關鍵詞前 ≤ 0.2 s 才進場（標題 ≤ 0.3 s、對話泡 0.3 s），絕不更早。「太早出現」是最大宗客訴。
- **版面**：`left`（內容 x<1280，老師在右）、`center`（片頭，保留 x 590–1340）、`full`（標題卡、片尾）。`export-check.js` 以警告提醒。
- **字**：微軟正黑體；字重一律明確指定（引擎預設 600 會渲染成粗體）。標題、關鍵詞粗體，副行、標籤標準；不用細體。教學字 ≥ 40 px（不是 pt），來源／註腳 ≥ 24 px。簡報沒有的文字不要加。
- **插圖**：可辨識、幾何正確、色系線寬一致，依簡報以 MG 風格重繪。
- **使用者檔案**：`layout.json` 屬於使用者，不覆寫；改前備份，改前後跑 `idcheck`。

## 整集流程

1. **取得素材**：口白音檔（或成片）、老師簡報（`<SLIDES>.pptx` 與頁面 PNG 資料夾 `<SLIDES_DIR>/`；由使用者提供）、逐字稿。確認各段對應的簡報頁碼（PowerPoint 實際編號含封面）。
2. **逐字對位**：`tools/transcribe.py`（faster-whisper，zh，word timestamps）→ `review/alignment.json`。句首用靜音起點校正。沒有逐字時間不開始排 cue。
3. **分段與版面模式**：寫進 `src/config.js` 的 `PARTS`（id、起訖、`left`／`center`／`full`），邊界貼齊影格。MG 要接在成片後時，以音訊互相關求切點（P-10），不要猜。
4. **依簡報設計每段**：先寫段落計畫（口白片語 → 畫面元素）；內容與用字取自簡報；對照 ep0 的比例與密度。
5. **建置場景**（`src/scenes/page.js`）：每個進場一行 `sync(o, group, 口白秒數, 片語, {lead, until})`；每段固定 id 基底；先建線再建標記；轉動部件提高 `renderOrder`。
6. **產對位表**：`node tools/cuesync.mjs` → `review/cue-sync.md`，檢查無 cue 早於口白、無 1 s 以上只剩標題的空窗。
7. **看靜格**：`tools/still.mjs` 出關鍵時刻靜格與每段分鏡，逐一檢查插圖、字重、保留區。
8. **文字稽核**：`node tools/audit.mjs` 列出每個文字的字級與字重，確認層級。
9. **回饋輪**：備份到 `review/roundN/before` → 修改 → 重出受影響段落 → 前後對照圖。回饋順序通常是時間 → 插圖 → 比例 → 字重。使用者存版面後，重出所有含其 layout 物件的段落。
10. **輸出與驗證**：`node tools/render.mjs`（或 `--part=<id>`）→ `node tools/verify.mjs` → `node tools/finalize.mjs`；`smoke.mjs` 與 `render.mjs --check-only` 通過。
11. **審查與交接**：ep0 並排比對、誠實列出限制、通知審查者；依 [QA 清單](references/qa-checklist.md) 交接。

規格：1920×1080、60000/1001 fps（`DT = 1001/60000`），決定性 `renderAt(t)` 由預覽與逐格輸出共用；輸出透明 ProRes 4444（編碼輸入 `yuva444p10le`，ffmpeg 解碼顯示 `yuva444p12le`，兩者描述不同階段，文件中一致標示）＋完整原音預覽 MP4；每段各一個 MOV 與預覽，另有整集 master。

## 單頁流程（一頁一個重點）

先實際檢視指定頁，選一個主要教學關係，簡短說明設計後開始。構圖預設左側 65–70%，右側留給老師；明說「全頁面」才用全幅。來源資料（出版機構、網址）保留並附註，網址不猜。每頁獨立資料夾（`<PROJECT>/`，例如 `page-NNN-短名/`）與預覽埠。

## 交付前檢查清單

缺一不交付（細節見 [QA 清單](references/qa-checklist.md)）：

- [ ] `review/cue-sync.md` 由實際建置重產；沒有 cue 早於口白；元素待機到段落結束；離場距最後相關 cue ≥ 1.5 s。
- [ ] 無 1 s 以上只剩標題的空窗；成組比較（如異常 A/B/C）先同時出現，再逐一突顯。
- [ ] 每個插圖以靜格檢視：可辨識、幾何正確、標籤有引線、z-order 正確（數字不被線蓋住、轉動部件在線之上）。
- [ ] 對話泡尾端指向老師嘴巴，尾端 x ≤ 1274；left 模式 x ≥ 1280 全空；center 模式 x 590–1340 全空。
- [ ] `audit.mjs` 稽核：字重明確、教學字 ≥ 40、註腳 ≥ 24；沒有簡報以外的文字（例如自加英文副標）。
- [ ] 與 ep0（使用者提供的 `<EP0_FILM>` 1:35「課程重點」；沒有則對照 [ep0 風格筆記](references/ep0-style-notes.md) 與 [`examples/`](examples/README.md)）並排比對比例與密度；各集開場品質一致。
- [ ] `layout.json` 已備份；`idcheck` 前後一致（或已回報被移動的 id 與使用者需重做的調整）。
- [ ] 全部受影響段落已重出；相鄰段落接點差異 0 px。
- [ ] `verification.json` `complete=true`；尺寸、fps、影格數、alpha、決定性、音訊相關 > 0.98（`verify.py` 門檻） 通過；`smoke.mjs` 與 `render.mjs --check-only` 通過。
- [ ] 專案自足（無 junction 到別的頁面資料夾）；`MG_PYTHON`、`MG_PY_PACKAGES`、`MG_FONT`、`MG_TMP` 有退路。
- [ ] 關鍵靜格與分鏡已出；限制誠實列出；審查者已通知。

## 邊界

- 不綁 0.0.0.0、不改防火牆、不終止不是自己啟動的伺服器（P-13）。
- 不提交 git、不改使用者的 `layout.json`、不改原簡報與原片。
- 把「檔案已輸出」「伺服器運作」「預覽已開啟」分開回報，依實際結果。
