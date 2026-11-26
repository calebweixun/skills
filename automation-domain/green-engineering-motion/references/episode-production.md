# 整集口白 MG 製作經驗（第一、二集）

來自第 1、2 集（繁中教學影片，Three.js 透明 MG 疊在老師影片上）的使用者回饋與修正。單頁任務也適用其中的時間、插圖、字級與編輯器規則。

## 範本專案（唯讀，複製後改，不要重建）

| 路徑 | 用途 |
| --- | --- |
| `E:/綠工影片/MG-Pages/episode-002-diagnostics` | 目前最完整。`src/scenes/page.js`：`sync()`、`bubble()`、`turbine2/gearbox2/generator2/sensor2/leaf2`、`ico()` 圖示圓盤；`tools/`：`render.mjs --part`、`verify.mjs`、`finalize.mjs`、`idcheck.mjs`、`cuesync.mjs`、`still.mjs`、`audit.mjs`、`smoke.mjs`；`server.mjs`（`MG_LISTEN`／Host 白名單）；`src/engine/export-check.js`；README「工程／可攜性」；`review/cue-sync.md`、`review/ep0-style-notes.md`、`review/round4/weight-audit.md` |
| `page-002-net-zero-editor` | 版面編輯器的來源 |
| `page-003-dual-axis` | 共用 `src/engine`；`src/scenes/transition.js`「課程重點」章節卡 |
| `page-004`～`page-006` | 議程卡片（page-004）、第一集內容頁 |
| `_shared/seq03` | 口白、`word-alignment.json`、`segments.json` |
| `_review/` | 全序列連續性檢視影片、contact sheet、接點靜格 |

## 1. 時間：元素只在老師說到時才出現（最大宗客訴）

早出現 1–5 秒是第一輪被退回的首要原因。

1. 先做逐字對位：faster-whisper（zh）word timestamps，存 `review/alignment.json`。沒有逐字時間不開始排 cue。
2. 每個進場對到關鍵詞：開始時間 ≤ 關鍵詞前 0.2 s（標題 ≤ 0.3 s、對話泡 0.3 s），約 0.5 s 定位；**絕不更早**。`sync(o,g,spoken,phrase,{lead,until})` 以段落相對時間換算。
3. 產出對位表（元素｜口白片語｜口白秒數｜cue 秒數｜lead｜離場），用 `tools/cuesync.mjs` 由實際建置輸出 `review/cue-sync.md`，並檢查無任何 cue 早於口白。
4. 出現後保留到片段結束，用待機動作（呼吸、旋轉、浮動）；待機迴圈用**未夾限的時間**，動作不會在片段中途停止。
5. 離場只在口白已轉到下一點且需要空間時發生，且距最後相關 cue ≥ 1.5 s；不要出現後馬上收掉。
6. 相關項目（例如異常圖 A/B/C）同時出現，再依口白用外框＋說明標出比較（突顯）。

## 2. 插圖品質

- 圖示要能一眼辨識且幾何正確。風力機：漸縮塔、機艙、輪轂、三片翼型葉片相隔 120° 繞輪轂旋轉、地平線；齒輪箱：殼體內有互相嚙合的齒輪。
- 統一扁平青綠／海軍藍色系（#149a96 系列）、統一線寬；同列圖示共用圖示圓盤（`ico()`，r 128–150）外形，讓中心、基線與間距一致。
- 標籤貼近所標示物，用細引線；不得壓在其他部件上。轉動部件（葉片）`renderOrder` 高於線與引線，始終在最上。
- 交付前逐一用靜格檢視每個圖示。

## 3. 依簡報重繪圖解

- 內容與用字依老師簡報（`E:/綠工影片/簡報靜態/pdf` 靜態 PNG）；以 MG 風格重繪，不複製投影片外觀。例：金字塔 → 疊放圓角層級（圖示＋標題＋副行），依口白由下往上建立，目前層以外框標示。
- 編號／標記不能壓在連接線下：先建線再建標記，或設定 render order。
- 說明文字永久放在項目旁（例如 TRL 各級描述緊鄰編號節點、逐級累積），不用一閃而過的彈出文字。
- 色帶內多行標籤須留邊距，檢查層級邊界。

## 4. 對話泡

圓角泡＋指向老師嘴巴的尾巴。老師在右（頭約 x1460–1690、y180–470，嘴約 (1590,400)）；泡位於 x≈640–1180，尾端 ≤ x1274，x≥1280 必須全空。從尾端彈出、略過衝，輕微浮動；字重混合（關鍵詞粗體、連接詞標準）。實作見範本 `bubble()`。

## 5. 字型與字重

微軟正黑體。**不要全部粗體**：引擎預設 600 會渲染成粗體，字重必須明確指定。
- 粗體：頁面標題（60）、段落標題、關鍵詞、結論、圓盤內數字、膠囊標籤。
- 標準：副行（42）、說明、圖解部件標籤、流程／步驟 chip、描述。
- 不用細體（300）：40 px 在淡色底太細。
- 教學字 ≥ 40、註腳 ≥ 24。比例對照第一集（ep0）：標題 60、標籤 42–52、開放版面搭配 250–300 px 圖示圓盤，而非整寬厚重卡片；文字密度與 ep0 相當，不要太稀疏。
- 議程卡（page-004／章節卡）：卡片 x100 w1150 h116，列 y 470/600/730/860；編號圓盤 r38、標題 46 粗、副行 40 標準、圖示環 r50 位於 x1190。
- 以 `tools/audit.mjs` 列出文字清單，寫 `review/round*/weight-audit.md` 檢查字重層級。

## 6. 版面編輯器

- 所有物件可選取（註冊所有 mesh；命中矩形依面積排序；Ctrl+點擊選外層群組；雙擊選父層）。
- 版面修補於動畫之後套用，不影響時間。`layout.json` 帶 `revision`（不符回 409）與 `layouts/` 歷史；預設版面為整理對齊（tidy）。
- 匯出規則是**警告**，不是阻擋（`--strict` 才阻擋），因為使用者會自行核准自己的調整。
- **保護使用者的 layout.json**：物件 id 依建立順序產生，所以每個段落給固定 id 基底（如每段 10000）、新物件只能加在最後；改程式前後跑 id 穩定檢查（`tools/idcheck.mjs`：每個 layout id 的 kind／name 對照）。每輪修改前備份 layout.json；使用者存檔後，**所有**含 layout.json 物件的段落都要重出（渲染須套用 layout.json）。

## 7. 遠端檢視（手機經 Tailscale）

`server.mjs`：`MG_LISTEN` 逗號清單（如 `127.0.0.1,100.x`），絕不綁 0.0.0.0；Host 白名單含 MagicDNS；POST 的 Origin 必須等於 Host。不更改防火牆或系統設定；Windows 防火牆提示由使用者自己按允許。

## 8. 工程與驗證

- 專案自足：真實的 `node_modules` 與 `tools/bin` 複本，不用 junction 連到別的專案。環境變數：`MG_PYTHON`、`MG_PY_PACKAGES`、`MG_FONT`、`MG_TMP`。
- 匯出檢查每 0.25 s 取樣，加各段首尾；人像保留區依段落（left：x<1280；center／full 變體）。
- `render.json` 誠實標示 ProRes 4444（編碼輸入 `yuva444p10le`，ffmpeg 解碼顯示 `yuva444p12le`）。工作資料夾記錄真實開始／結束時間，並保存 verification／render／export-check JSON 與實際輸出靜格；舊輸出沒有時間紀錄就重出，不推算。
- 分段重出 `render.mjs --part=<id>`，會重建完整預覽與 master。
- `verify.mjs`：影格數、fps、alpha、決定性、人像區、音訊相關（≥ 0.9999）、相鄰段落接點差異 = 0 px（影格精確的交接狀態，例如標題底線灰 x60–1240 y158–161 #a0bcbf＋青綠重點 x60–195 y155–163 #149a96）。
- 測試埠與渲染伺服器分開（`MG_SMOKE_PORT`、`PORT`、`MG_URL`）。

## 9. 結構與連續性

系列片頭 → 章節標題卡（「課程重點」議程，依全文逐字稿設計，如簡報的章節分隔頁）→ 內容頁。複用上一集專案（複製編輯器版本）而非重建。完成後產出全序列連續性檢視影片、contact sheet 與接點靜格（範本 `_review/`）。

## 10. 交付前檢視流程

每個關鍵時刻出靜格（`tools/still.mjs`），每段做附時間戳的分鏡；與參考影片（ep0）同時間點並排比對；最後誠實列出仍存在的限制。口白帶出的數字、術語以簡報為準；示意波形須註明為示意，不擴寫口白沒說的比較。
