# dgpa-suspension

這是一個專為 Antigravity (Gemini) 設計的自訂 Skill，主要功能是自動化查詢「行政院人事行政總處 (DGPA)」的天然災害停止辦公及上課情形。

## 功能說明

當你需要知道某個特定日期或特定縣市是否有宣佈停班停課時，可以透過 Agent 呼叫此技能。該技能會自動啟動無頭瀏覽器，前往人事總處的公告網頁，智慧擷取各縣市的詳細停班課狀態並整理回報。

* **查詢目標網站**：[行政院人事行政總處 - 天然災害停止辦公及上課情形](https://www.dgpa.gov.tw/informationlist?uid=374&page=1)

## 系統依賴 (Dependencies)

此技能強烈依賴 **`ego-browser`** 才能正常運作。

* `ego-browser` 是專為 AI Agent 設計的輕量級 Chromium 無頭瀏覽器，讓 Agent 可以直接執行 JavaScript、操作 DOM 以及抓取動態網頁資料。
* 在執行此技能前，請確保你的 Antigravity 環境中已經正確安裝並啟用了 `ego-browser` 技能與環境。

## 工作原理

1. Agent 啟動 `ego-browser` 並前往 DGPA 的公告列表首頁。
2. 根據查詢的日期條件（如特定年月份）過濾列表，並自動找出對應的公告連結。
3. 由於 DGPA 的詳細縣市清單通常放置於網頁內的附件 (`nds.html`) 中，本腳本會自動進入該公告並抓取附件連結。
4. 下載並解析 `nds.html` 的 Table 內容，過濾出目標縣市（如高雄市）的停班課狀態，並將最終結果輸出回報。
