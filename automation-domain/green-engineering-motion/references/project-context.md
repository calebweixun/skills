# 專案與素材位置

這份交接依 2026-11-05 的本機檔案及已完成的片頭整理。開始新任務時重新檢視指定頁面與來源檔，避免使用過期截圖。

## 原始內容

| 用途 | 本機位置 |
| --- | --- |
| 課程主簡報 | `E:/綠工影片/機器設備智能診斷系統暨綠色工程_v3.pptx` |
| 主簡報 PDF | `E:/綠工影片/機器設備智能診斷系統暨綠色工程_v3.pdf` |
| 片頭設計來源 | `E:/綠工影片/片頭元素.pptx` |
| 其他靜態素材 PDF | `E:/綠工影片/靜態元素.pdf` |
| 靜態版型與素材 | `E:/綠工影片/簡報靜態/` |

`簡報靜態/` 已有 `0_片頭.png`、`1_目錄.png`、`2_內容.png`、`3_片尾.png`、`Intro.png`。這些是片頭、目錄、內容、片尾等版型素材，檔名前的數字不能直接視為主簡報投影片頁碼。應檢查圖片和主簡報的實際對應關係。

PowerPoint 實際投影片編號採 1 起算並包含封面。先確認「頁碼＋頁面標題」，再抽取元素。PDF 與 PowerPoint 若有內容或版本差異，依使用者指定的主要來源處理並說明差異。

## 已完成的參考專案

| 參考 | 路徑 |
| --- | --- |
| 第一版片頭 | `E:/綠工影片/MG-Earth-Interlock/` |
| 電影式片頭，目前實作 02.2 | `E:/綠工影片/MG-Earth-Interlock-Cinematic/` |
| 片頭最終圖 | `E:/綠工影片/MG-Earth-Interlock-Cinematic/exports/Endpoint-1920x1080.png` |
| 片頭成片 | `E:/綠工影片/MG-Earth-Interlock-Cinematic/exports/Earth-Interlock-Cinematic-1080p5994.mp4` |
| 分鏡檢視 | `E:/綠工影片/MG-Earth-Interlock-Cinematic/review/storyboard.jpg` |
| 檢查結果 | `E:/綠工影片/MG-Earth-Interlock-Cinematic/review/verification.json` |

02.2 採 720 影格／12.012 秒；舊稿在該專案的 `versions/`。讀取程式時以目前的 `src/` 為準，避免將舊版本的動作當成現行實作。

片頭預覽原本使用 4174 埠；第一版使用 4173 埠。伺服器不一定仍在執行。新頁面使用自己的可用埠，回報實際啟動的 URL。

## 可以借用的程式

- `src/export.js`：以固定時間逐格繪製與 H.264 編碼。
- `server.mjs`：本機靜態伺服器、套件映射及 MP4 range request。
- `tools/browser.mjs`：使用本機 Edge／Chrome 的驗證入口；讀取 `MG_URL`。
- `src/scene.js`：單位像素座標、圖層分組、pivot、endpoint、前後遮擋。
- `src/cinematic-effects.js`：緩動、路徑描繪、回彈及背景轉場的實例。
- `tools/verify.mjs`：實際影片樣本解碼、FPS、逐格定位與定格檢查的實例。

這些檔案包含片頭專用細節。重用時保留所需機制，將構圖、元件和教學行為換成本頁內容。

特別注意：

- `tools/extract_pptx.ps1` 目前指定第 1 張投影片和 shape ID 11–30；座標換算也為片頭設定。新頁面要依實際投影片尺寸、頁碼及 shape ID 調整。
- `tools/prepare_assets.py` 包含片頭專屬的城市遮罩、特定 ID 和匯出比例。
- `tools/prepare_frame.py` 的裁切區域是片頭的邊框、飾帶與校徽。
- 預覽 HTML、章節按鈕、工具腳本內的影格數與時間點，要與新頁面的設定同步。部分腳本仍有片頭的固定數字。
- 原檢查程式的「地球在中央」「對角轉白」及畫面區域取樣屬於片頭語意。新頁面改為本頁的驗收行為。

## 單頁隔離

建議每頁放在 `E:/綠工影片/MG-Pages/page-007-short-name/` 這類目錄。不同頁面或方案使用不同目錄；已有成品先保存版本再修改。

原簡報、`簡報靜態/` 和已完成的片頭作為共用來源。新頁面的抽圖、加工、程式與影片都寫入本頁目錄。

本機已驗證的套件版本為 Three.js `0.187.0`、Mediabunny `1.65.1`、Playwright `1.62.1`。這是片頭當時的版本，重用時以實際 `package.json`／lockfile 為準。

程式探索遵循專案的 codebase-memory-mcp 約定：先查 graph，未索引則先索引；查目前的 `src/`，留意 `versions/` 的舊符號。圖譜未提供 source 或漏掉所需內容時，再針對已定位的檔案讀取。

## 整集（第一、二集）專案

| 參考 | 路徑 |
| --- | --- |
| 第二集（最新範本） | `E:/綠工影片/MG-Pages/episode-002-diagnostics/` |
| 編輯器來源／共用引擎／章節卡 | `MG-Pages/page-002-net-zero-editor`、`page-003-dual-axis`（`src/engine`、`src/scenes/transition.js`） |
| 口白與逐字對位 | `MG-Pages/_shared/seq03/`（`word-alignment.json`、`segments.json`）；第二集 `review/alignment.json` |
| 全序列連續性檢視 | `MG-Pages/_review/` |
| 老師簡報靜態 PNG | `E:/綠工影片/簡報靜態/pdf` |

做整集時的製作規則、時間對位與驗證流程見 [整集口白 MG 製作經驗](episode-production.md)。
