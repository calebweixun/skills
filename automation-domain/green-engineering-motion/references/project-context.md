# 專案與素材位置

本機路徑整理（已完成第 0、1、2 集與單頁／片頭專案）。開始新任務時重新檢視指定頁面與來源檔，避免使用過期截圖。

## 原始內容

| 用途 | 本機位置 |
| --- | --- |
| 課程主簡報 | `E:/綠工影片/機器設備智能診斷系統暨綠色工程_v3.pptx`（PDF 同名 `.pdf`） |
| 片頭設計來源 | `E:/綠工影片/片頭元素.pptx` |
| 其他靜態素材 PDF | `E:/綠工影片/靜態元素.pdf` |
| 靜態版型與素材 | `E:/綠工影片/簡報靜態/`（`0_片頭.png`、`1_目錄.png`、`2_內容.png`、`3_片尾.png`、`Intro.png`） |
| 老師簡報靜態 PNG | `E:/綠工影片/簡報靜態/pdf` |
| 參考成片（ep0） | `E:/綠工影片/Adobe Export/ep0_3.mp4`（約 1:35 為「課程重點」模組）；第二集原音 `ep1.mp4`（只有音訊，約 6:08.64） |

`簡報靜態/` 檔名前的數字不是主簡報投影片頁碼，須檢查圖片與主簡報的實際對應。PowerPoint 實際投影片編號以 1 起算並包含封面；先確認「頁碼＋頁面標題」再抽取元素。PDF 與 PowerPoint 若有差異，依使用者指定的主要來源並說明。notesSlide 編號與 slide 編號不一定一一相同，內容對照以圖片與口白為主。

## 已完成專案（皆在 `E:/綠工影片/MG-Pages/`）

| 專案 | 用途 |
| --- | --- |
| `episode-002-diagnostics` | 整集範本（最完整）：引擎、`page.js` helper、`tools/*`、`review/*` 範例、README「工程／可攜性」 |
| `page-001-opening` | ep0 開場 MG（老師置中，口白 0→52.85 s，3168 格）；README 記錄切點互相關與接點 |
| `page-002-net-zero`、`page-002-net-zero-editor` | ep0 第 2 頁；版面編輯器來源 |
| `page-003-dual-axis` | 共用 `src/engine`；`src/scenes/transition.js`「課程重點」章節卡 |
| `page-004-energy-transition` | 比例參考與單頁範本；議程卡片 |
| `page-005-circular-economy`、`page-006-course-goals` | ep0 內容頁 |
| `_shared/seq03` | 口白、`word-alignment.json`、`segments.json` |
| `_review/` | 全序列連續性檢視影片、contact sheet、接點靜格 |

地球片頭（舊專案）：`E:/綠工影片/MG-Earth-Interlock/`（第一版）、`MG-Earth-Interlock-Cinematic/`（02.2，720 格／12.012 s；`exports/Endpoint-1920x1080.png`、`review/storyboard.jpg`、`review/verification.json`）。讀程式以目前 `src/` 為準，`versions/` 是舊稿。舊片頭預覽埠 4174／4173，伺服器不一定仍在執行；新專案選自己的可用埠並回報實際 URL。

## 可借用的程式

- 引擎：`src/engine/*`（`renderAt`、版面編輯器、`export-check.js`）、`src/scene.js`（單位像素座標、圖層分組、pivot、endpoint）。
- `server.mjs`：本機靜態伺服器、版面存取（`revision`、409）、輸出工作、`MG_LISTEN`／Host 白名單。
- `tools/browser.mjs`（本機 Edge／Chrome，讀 `MG_URL`）、`render.mjs`、`verify.mjs`／`verify.py`、`finalize.mjs`、`smoke.mjs`、`cuesync.mjs`、`still.mjs`、`audit.mjs`、`idcheck.mjs`、`transcribe.py`。
- 片頭專用的東西（`extract_pptx.ps1`、`prepare_assets.py`、`prepare_frame.py`、地球語意的驗收取樣）換頁時要依實際投影片尺寸、shape ID、裁切區域與影格數調整，不可直接沿用。

## 環境與版本

- 已驗證：Three.js `0.187.0`、Mediabunny `1.65.1`、Playwright `1.62.1`；以實際 `package.json`／lockfile 為準。
- 環境變數：`MG_PYTHON`、`MG_PY_PACKAGES`、`MG_FONT`、`MG_TMP`、`MG_MODELS`、`MG_URL`、`PORT`、`MG_LISTEN`、`MG_ALLOWED_HOSTS`、`MG_SMOKE_PORT`、`MG_EXPORT_DIR`（說明見 [episode-production.md](episode-production.md) P-12、P-13）。
- 專案自足：每個專案自有 `node_modules` 與 `tools/bin/ffmpeg.exe`，不用 junction 連到別的專案。

## 單頁隔離

每頁放 `E:/綠工影片/MG-Pages/page-007-short-name/` 這類目錄；已有成品先保存版本再修改。原簡報、`簡報靜態/` 與已完成專案唯讀，抽圖、加工、程式與影片都寫入本頁目錄。

程式探索遵循專案的 codebase-memory-mcp 約定：先查 graph，未索引則先索引；圖譜未提供 source 時再讀已定位的檔案。

製作規則見 [整集製作經驗與陷阱](episode-production.md)，單頁細節見 [implementation.md](implementation.md)。
