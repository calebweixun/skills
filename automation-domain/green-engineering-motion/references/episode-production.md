# 整集口白 MG：製作經驗與陷阱（第 0、1、2 集）

來自三集繁中教學影片（Three.js 透明 MG 疊在老師影片上）的使用者回饋與修正。格式：症狀 → 原因 → 修法。單頁任務也適用 P-1～P-6、P-8 的規則。範本專案與路徑見 [project-context.md](project-context.md)，驗收數字見 [qa-checklist.md](qa-checklist.md)。

## 範本專案內可直接重用的東西

`E:/綠工影片/MG-Pages/episode-002-diagnostics`：

- `src/config.js`：`PARTS`（`part(id,label,start,end,mode)`，模式 `left`／`center`／`full`）、`COLORS`、`FRAMES`。
- `src/scenes/page.js`：`sync()`（進場＋cue 紀錄）、`title2`、`kicker2`、`chip`、`chain`、`emph`、`agenda2`、`bubble`、`ico()` 圖示圓盤、`turbine2／gearbox2／generator2／sensor2／leaf2`、`textAudit()`。
- `src/engine/`：`export-check.js`、`layout-model.js`（`CONTENT_RIGHT=1280`）、編輯器。
- `tools/`：`transcribe.py`、`cuesync.mjs`、`still.mjs`、`audit.mjs`、`idcheck.mjs`、`render.mjs`、`verify.mjs`／`verify.py`、`finalize.mjs`、`smoke.mjs`、`review.mjs`、`handoff.mjs`。
- `review/`：`cue-sync.md`、`ep0-style-notes.md`、`round2`～`round5/`（前後對照圖、id 檢查、`round4/weight-audit.md`）。

小片段（簽名與規則，勿整段複製）：

```js
// 進場：spoken = 口白絕對秒數；進場在 spoken-lead 開始，約 0.5 s 定位
sync(o, group, spoken, phrase, {lead: .2, until, d})   // 標題 lead .25–.3；bubble 內 .3
// 對話泡：尾端固定在 x=1274，y=tipY（老師嘴）
bubble(o, name, {x0, y0, w, h, tipY, lines})           // lines[i] = {segs:[[字,色,字重]], spoken, phrase}
```

## P-1 元素出現得太早（最大宗客訴）

- 症狀：使用者說「全部都太早出現」；早出現 1–5 s 是第一輪被退回的首要原因。
- 原因：憑感覺排時間、或照簡報頁而非口白排。
- 修法：
  1. faster-whisper（zh）word timestamps 存 `review/alignment.json`；句首用靜音起點校正。
  2. 每個進場對到關鍵詞：開始 ≤ 關鍵詞前 0.2 s（標題 ≤ 0.3 s、對話泡 0.3 s），約 0.5 s 定位；絕不更早。`sync()` 以段落相對時間換算：`rel = max(0, spoken − lead − part.start)`。
  3. `node tools/cuesync.mjs` 由實際建置輸出對位表（元素｜口白片語｜口白秒｜cue 秒｜lead｜離場）到 `review/cue-sync.md`；檢查沒有任何 cue 早於口白。
  4. 以對位表而不是記憶判斷「有沒有早」。

## P-2 元素太早消失、或出現後只剩標題

- 症狀：項目一出現就收掉；約 1 s 的空窗只有標題在畫面。
- 原因：離場時間照進場排；沒有待機動作。
- 修法：出現後保留到段落結束，用待機動作（呼吸、旋轉、浮動）；待機迴圈用未夾限的時間，動作不會在中途停止。離場只在口白已轉到下一點、需要空間時發生，且距最後相關 cue ≥ 1.5 s。掃對位表找出 ≥ 1 s 的空窗，補上導言（`kicker2`）或提前下一項的合理 lead（仍不得早於口白）。

## P-3 成組比較被切掉

- 症狀：三個異常圖逐一出現後立刻切走，老師還在比較。
- 修法：先同時出現全部（成組同進同出），再依口白逐一以外框＋標籤突顯；最後一項出現後保留到口白轉題。

## P-4 插圖不像、或被線蓋住

- 症狀：風力機認不出來；標籤飄在空中；編號被連接線壓住；葉片在線下面。
- 原因：用抽象符號代替、z-order 依建立順序。
- 修法：
  - 幾何要正確：風力機＝漸縮塔、機艙、輪轂、三片翼型葉片相隔 120° 繞輪轂旋轉、地平線；齒輪箱＝殼體內互相嚙合的齒輪。
  - 標籤貼近所標示物，用細引線，不壓在其他部件上。
  - 先建線再建標記／編號；轉動部件（葉片）`renderOrder` 高於線與引線。
  - 統一扁平青綠／海軍藍色系（`#149a96` 系列）、統一線寬；同列圖示共用圖示圓盤（`ico()`，r 128–150），讓中心、基線與間距一致。
  - 交付前每個圖示都看靜格。

## P-5 圖解與簡報不一致、或解說一閃而過

- 症狀：投影片被整張貼入；說明在彈出文字裡一閃而過。
- 修法：內容與用字依老師簡報（`簡報靜態/pdf` PNG），以 MG 風格重繪，不複製投影片外觀。例：金字塔 → 疊放圓角層級（圖示＋標題＋副行），依口白由下往上建立，目前層以外框標示。把解說整合進圖表：TRL 各級描述緊鄰編號節點、沿曲線逐級累積，不用一閃而過的說明。色帶內多行標籤留邊距，檢查層級邊界。示意波形須註明為示意，不擴寫口白沒說的比較。不要發明簡報沒有的文字（曾有 agent 加英文副標，簡報並沒有，已移除）。

## P-6 對話泡不像老師在說話

- 規則：圓角泡＋尾巴指向老師嘴巴。老師在右（頭約 x1460–1690、y180–470，嘴約 (1590,400)）；泡位於 x≈640–1180，尾端 x ≤ 1274，x ≥ 1280 必須全空（left 模式透明 master 在該區為空）。從尾端彈出、略過衝，輕微浮動；字重混合（關鍵詞粗體、連接詞標準）。實作見 `bubble()`。

## P-7 字型與字重：「到處都是粗體」

- 原因：引擎預設字重 600 會落到粗體字面（msjhbd）；字重沒明確指定。
- 規則：
  - 微軟正黑體：標準 400（msjh）、粗體 700（msjhbd）；細體 300（msjhl）不用，40 px 在淡色底太細。
  - 粗體：頁面標題（60）、段落標題、關鍵詞、結論、圓盤內數字、膠囊標籤。
  - 標準：副行（42）、說明、圖解部件標籤、流程／步驟 chip、描述、座標軸標籤。
  - 教學字 ≥ 40 px、註腳／來源 ≥ 24 px。注意 `export-check` 訊息以 pt（px/2）表示：20 pt ＝ 40 px，12 pt ＝ 24 px。
  - 用 `tools/audit.mjs` 列出文字清單，寫 `review/roundN/weight-audit.md` 檢查層級。
  - `layout.json` 的覆寫沒有字重欄位（只有 x, y, scale, rotation, fontSize, boxWidth, hidden, locked, text, textAlign, color），字重只能改程式。

## P-8 比例與密度與 ep0 不符

- 症狀：太稀疏、或整寬厚重卡片堆疊。
- 基準（ep0 實測，見範本 `review/ep0-style-notes.md`）：標題 60 粗體在 x=60、基線 y≈94，底線 y=158（3 px 灰 `#a0bcbf`）＋135×8 青綠重點；標籤 42–52、副行 40–44；行距 ≈ 1.35×字級；圖示為自由站立 180–330 px（或 250–300 px 圓盤），無外框卡片；底色塊每幀 ≤ 3 個；內容區 x60–1240、y190–1020，內容區墨水覆蓋率約 8–16%（ep0 為 2–17%）；底部列結束 y ≲ 1005（左下藍色裝飾在 y>1020）。一次一個概念，左→右、上→下，出現後留在畫面。
- 摘要／議程卡重用 ep0「課程重點」模組（成片 `Adobe Export/ep0_3.mp4` 約 1:35；專案 page-004／`transition.js`）：卡片 x100 w1150 h116，列 y 470/600/730/860；編號圓盤 r38、標題 46 粗、副行 40 標準、圖示環 r50 位於 x1190。
- 修法：與 ep0 同時間點並排比對（`review/roundN/compare-*.jpg`）。

## P-9 開場彼此不一致

- 症狀：第 1 集開場內容密度與品質低於 ep0 開場。
- 修法：以 ep0 開場為基準重建（第 1 集 `01-intro` 在第 5 輪重做）：老師置中、深色底、淺色字、左欄 x≈60–570 與右欄 x≈1360–1900，x 590–1340 完全不放；每個物件對到逐字稿；口白結束後全部以 0.25 s 淡出，最後一格全空。

## P-10 切點靠猜

- 症狀：以為 ep0 的 MG 該從 36 s 開始，實際 52.85 s（36–37.1 s 老師仍在說話，之後是成片自己的地球轉場）。
- 修法：用該頁老師原音與成片音訊做互相關，取峰值並確認落在影格邊界（ep0：52.8528 s ＝ 第 3168 格）。相鄰段落接點：上一段最後一格與下一段第一格必須相同（透明，或同一個交接狀態，例如標題底線灰 x60–1240 y158–161 `#a0bcbf` ＋青綠 x60–195 y155–163 `#149a96`），`verify` 比對差 0 px。

## P-11 輸出格式與標示

- 1920×1080、60000/1001 fps，`renderAt(t)` 決定性，預覽與逐格輸出共用。
- 透明 ProRes 4444（編碼輸入 `yuva444p10le`；ffmpeg 解碼顯示 `yuva444p12le`，兩者是不同階段，文件一致標示）＋含原音的完整預覽 MP4。每段各一個 MOV、預覽、首尾 PNG、`render.json`，另有整集 master。
- `render.json` 記錄真實開始／結束時間；舊輸出沒有時間紀錄就重出，不推算。`verification.json` `complete=true` 才算驗證完成；`finalize.mjs` 會拒絕沒有有效時間戳或驗證早於輸出的資料。
- 分段重出 `render.mjs --part=<id>` 也會重建完整預覽與 master。

## P-12 可攜性

- 專案自足：真實的 `node_modules` 與 `tools/bin/ffmpeg.exe` 複本，不用 junction 連到別的頁面。新環境 `npm install`，Windows 版 FFmpeg 放 `tools/bin/`。
- 環境變數與退路：`MG_PYTHON`（Python 直譯器，預設 `python`，需 `av`、`numpy`、`Pillow`）、`MG_PY_PACKAGES`（額外套件目錄，如 `tools/python-packages`）、`MG_FONT`（中文字型檔，未設定自動找微軟正黑體、Noto CJK）、`MG_TMP`（暫存，預設系統暫存）、`MG_MODELS`（whisper 模型，預設 `tools/models`）。
- 測試埠分開：smoke 用 `MG_SMOKE_PORT`，伺服器用 `PORT`，工具連線用 `MG_URL`；兩項測試分開執行避免埠衝突。

## P-13 手機檢視（Tailscale）

- 症狀：使用者要在手機審查。
- 做法：`$env:MG_LISTEN='127.0.0.1,<tailscale-ip>'; node server.mjs`。只綁列出的位址，絕不綁 0.0.0.0；`127.0.0.1` 一律包含（內部輸出程式要用）。Host 標頭白名單含 localhost、各監聽位址與本機 MagicDNS，可用 `MG_ALLOWED_HOSTS` 追加；POST 的 Origin 必須等於 Host，其餘 403。
- 不修改防火牆或系統設定；Windows 防火牆提示由使用者按允許。不終止不是你啟動的伺服器。編輯器能存檔與觸發輸出，只在自己的 tailnet 內用。
- 每輪準備好後通知審查者（連結與這輪改了什麼）。

## P-14 版面編輯器與使用者的 layout.json

- 編輯器：所有物件可選取（註冊所有 mesh；命中矩形依面積排序；Ctrl+點選外層群組；雙擊選父層）；版面修補在動畫之後套用，不影響時間；`layout.json` 帶 `revision`（不符回 409），歷史在 `layouts/history/`；預設版面為整理對齊（tidy）。
- 匯出規則是警告（`--strict` 才阻擋），因為使用者會自行核准自己的調整。
- 症狀：使用者調過位置後，我的改動讓他的調整跑到別的物件上。
- 原因：物件 id 依建立順序產生；中途插入物件或「無害」的改動（例如 chip 字級）會讓後面的 id 位移。
- 修法：
  1. `layout.json` 是使用者的，絕不覆寫。每輪修改前備份（`review/layout-user-<日期>.json`）。
  2. 每段給固定 id 基底（如每段 10000）；新物件只加在該段最後。
  3. 改程式前後各跑 `node tools/idcheck.mjs <out.json> [before.json]`（每個 layout id 的 kind／name／parent／所屬段落比對）。若看似無害的改動讓 id 位移，還原或回報。
  4. 使用者存檔後，所有含 layout.json 物件的段落都要重出（渲染須套用 layout.json）。
  5. 重建某段時，列出使用者已過時的調整，讓他重做。

## P-15 多 agent 分工（選用，曾有效）

便宜模型探索、中階模型執行、頂級模型只審靜格／分鏡／驗證數字。並行 agent 不得編輯同一檔：工程（`tools/`、`src/engine/`、驗證）與視覺（`src/scenes/`）分開。細節見 [handoff.md](handoff.md)。

## 結構與連續性

系列片頭 → 章節標題卡（「課程重點」議程，依全文逐字稿設計，如簡報的章節分隔頁）→ 內容頁 → 片尾。複用上一集專案（複製編輯器版本）而非重建。完成後產出全序列連續性檢視影片、contact sheet 與接點靜格（範本 `_review/`）。口白帶出的數字、術語以簡報為準；ASR 的錯字（例如「整段／診斷」）以簡報與上下文對照，標籤採課程術語。
