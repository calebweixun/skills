# QA 與交付檢查清單

交付前逐項確認；完整原因與修法見 [episode-production.md](episode-production.md)。

## 1. 審查流程

1. 關鍵時刻靜格（`node tools/still.mjs <outdir> <t1,t2,...|part:<id>> [prefix]`，輸出白底、深底、老師參考三種）與每段附時間戳的分鏡（storyboard）。
2. 與參考影片 ep0（`E:/綠工影片/Adobe Export/ep0_3.mp4`，1:35 「課程重點」模組；page-004）同時間點並排比對比例與密度。
3. 誠實列出限制（例如示意波形、WebGL 大跳轉後首繪的 ≤1/255 邊緣差異、Premiere XML 未在 UI 實測匯入）。
4. 通知審查者。回饋成輪：時間 → 插圖 → 比例 → 字重；每輪在 `review/roundN/` 保留 `before`、`after` 與前後對照圖、修改前 `layout.json` 備份、`idcheck` 結果、`render.log`。

## 2. 內容與時間

- [ ] `review/cue-sync.md` 由實際建置重產；沒有 cue 早於口白；lead ≤ 0.2 s（標題 ≤ 0.3、對話泡 0.3）。
- [ ] 元素待機到段落結束；離場在口白轉題後，距最後相關 cue ≥ 1.5 s；無 ≥ 1 s 只剩標題的空窗。
- [ ] 成組比較先全顯、再逐一突顯。
- [ ] 文字全部出自簡報／口白；數字術語以簡報為準；示意圖標註「示意」。

## 3. 視覺

- [ ] 插圖可辨識、幾何正確；標籤有引線；數字在線之上；轉動部件在線之上。
- [ ] 色系、線寬、圖示圓盤一致；與 ep0 比例密度相當（底色塊 ≤ 3、墨水覆蓋率約 8–16%）。
- [ ] 字重：標題／關鍵詞粗體，其餘標準；教學字 ≥ 40 px；註腳 ≥ 24 px（`audit.mjs`）。
- [ ] 保留區：left 內容 x < 1280、泡尾 ≤ 1274；center 保留 x 590–1340；左下藍色裝飾（x<200、y>1020）不被覆蓋；`export-check` 無警告或警告已逐項說明。

## 4. 版面編輯器與使用者檔案

- [ ] 改動前已備份 `layout.json`；`idcheck` 前後一致；不一致已回報並列出使用者需重做的調整。
- [ ] 使用者存檔後，所有受影響段落已重出。

## 5. 輸出與驗證

- [ ] 1920×1080、60000/1001 fps、影格數與實際片長（例：第二集 22096 格、368.634933 s）。
- [ ] 透明 ProRes 4444（標示 `yuva444p10le` 編碼輸入／`yuva444p12le` 解碼顯示）、完整原音預覽 MP4、每段 MOV＋預覽＋首尾 PNG＋`render.json`、整集 master。
- [ ] `verify.mjs`：尺寸、fps、影格數、alpha、決定性（任意前後定位同一影格）、人像區、音訊相關 > 0.98（`verify.py` 門檻）、相鄰段落接點差 0 px；`verification.json` `complete=true`。
- [ ] `finalize.mjs` 成功（`review/actual-output.jpg`、render／verification／export-check／layout 存於工作資料夾）；`render.json` 有真實起訖時間。
- [ ] `node tools/smoke.mjs` 與 `node tools/render.mjs --check-only` 通過（分開執行、不同埠）。
- [ ] 專案自足、環境變數有退路。

## 6. 交接內容

說明文件（README）含：來源與簡報頁碼對照、段落表（原音秒數 → 內容）、啟動與遠端檢視方式、重出指令、交付檔案清單、已驗證項目、限制、需使用者決定的事。整集另附：`alignment.json`、`cue-sync.md`、`layout.json` 版本與備份位置、`idcheck` 結果、各段重出清單、`verification.json`、關鍵靜格與分鏡、`剪輯對位表.csv`／`timing.json`（原音絕對秒數、首尾影格、構圖）。
