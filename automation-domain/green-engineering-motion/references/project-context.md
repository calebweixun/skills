# 專案與素材位置

技能自足：程式在 `templates/`，參考圖在 `examples/`，其餘輸入由使用者提供。開始新任務時重新檢視指定頁面與來源檔，避免使用過期截圖。以下 `<SKILL_DIR>` 指本技能資料夾，`<PROJECT>` 指你複製範本後的工作資料夾。

## 技能內附

| 內容 | 位置（相對於 `<SKILL_DIR>`） |
| --- | --- |
| 整集範本（引擎、`page.js` helper、`tools/*`、版面編輯器、輸出與驗證） | `templates/episode/` |
| 單頁範本（單頁動畫，含交接首尾格規格） | `templates/single-page/` |
| ep0 式開場 `page.js`（僅程式碼） | `templates/episode/examples/opening-page.js` |
| MG-only 分鏡圖（比例與密度參考） | `examples/` |
| 比例／字重基準 | `references/ep0-style-notes.md`、`references/weight-hierarchy.md` |

## 使用者提供的輸入（不隨技能分享）

| 用途 | 放置方式（佔位符） |
| --- | --- |
| 課程簡報 | `<SLIDES>.pptx`（及同名 PDF）；頁面 PNG 資料夾 `<SLIDES_DIR>/` |
| 口白（音檔或成片） | `<NARRATION>`；`tools/prepare.py` 轉成 `<PROJECT>/assets/narration.mp4`／`narration.wav`／`narration-asr.wav` |
| 逐字時間 | `<PROJECT>/review/alignment.json`（`tools/transcribe.py` 產生） |
| ep0 參考成片（選用） | `<EP0_FILM>`，用於並排比對；沒有則用 `references/ep0-style-notes.md` 與 `examples/` |
| 開場老師比例參考圖（選用） | `<PROJECT>/assets/reference-01.png` |
| 其他靜態版型（片頭、目錄、片尾） | `<SLIDES_DIR>/` 或使用者指定資料夾 |

頁碼與簡報檔名前的數字不一定一致：PowerPoint 實際投影片編號以 1 起算並包含封面；先確認「頁碼＋頁面標題」再抽取元素。PDF 與 PowerPoint 若有差異，依使用者指定的主要來源並說明。notesSlide 編號與 slide 編號不一定一一相同，內容對照以圖片與口白為主。

原簡報、原片唯讀；抽圖、加工、程式與影片都寫入 `<PROJECT>`。

## 本課程原作者的輸入檔（僅供參考，不隨技能分享）

原作者的課程使用「機器設備智能診斷系統暨綠色工程」簡報、ep0 開場成片（約 52.85 s 處接第二集）與各集口白；對應佔位符分別是 `<SLIDES>.pptx`、`<EP0_FILM>`、`<NARRATION>`。換課程時一律換成自己的檔案。

## 可借用的程式

- 引擎：`src/engine/*`（`renderAt`、版面編輯器、`export-check.js`）、`src/scene.js`（單位像素座標、圖層分組、pivot、endpoint）。
- `server.mjs`：本機靜態伺服器、版面存取（`revision`、409）、輸出工作、`MG_LISTEN`／Host 白名單。
- `tools/browser.mjs`（本機 Edge／Chrome，讀 `MG_URL`）、`render.mjs`、`verify.mjs`／`verify.py`、`finalize.mjs`、`smoke.mjs`、`cuesync.mjs`、`still.mjs`、`audit.mjs`、`idcheck.mjs`、`transcribe.py`、`prepare.py`、`handoff.mjs`。
- `prepare.py` 只做簡報文字與口白轉檔；從簡報抽圖／裁切要依實際投影片尺寸、shape ID 與影格數自行寫。

## 環境與版本

- 已驗證：Three.js `0.187.0`、Mediabunny `1.65.1`、Playwright `1.62.1`；以實際 `package.json`／lockfile 為準。需 Node 20+、Edge 或 Chrome（或 `npx playwright install chromium`）。
- ffmpeg：`MG_FFMPEG`（完整路徑）> `tools/bin/ffmpeg.exe` > PATH。
- Python：`pip install faster-whisper numpy pillow av`。
- 環境變數：`MG_PYTHON`、`MG_PY_PACKAGES`、`MG_FONT`、`MG_TMP`、`MG_MODELS`、`MG_OFFLINE`、`MG_FFMPEG`、`MG_URL`、`PORT`、`MG_LISTEN`、`MG_ALLOWED_HOSTS`、`MG_SMOKE_PORT`、`MG_EXPORT_DIR`（說明見 [episode-production.md](episode-production.md) P-12、P-13 與範本 README）。
- 專案自足：每個專案自有 `node_modules` 與 ffmpeg，不用 junction 連到別的專案。

## 單頁隔離

每頁一個獨立資料夾與預覽埠；已有成品先保存版本再修改。

製作規則見 [整集製作經驗與陷阱](episode-production.md)，單頁細節見 [implementation.md](implementation.md)。
