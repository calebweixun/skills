---
name: premiere-mg-postproduction
description: 透過 Premiere Pro MCP（hetpatel-11/Adobe_Premiere_Pro_MCP）幫 MG 教學影片做後製收尾：去背老師人像的調色、亮度與清晰度修正，依暗底／白底等不同背景分組調整，以實際輸出畫面量測數值後再動參數，最後處理字幕。適用於助教接手任何老師的課程影片。Triggers on：Premiere、PR、MCP Bridge、人像調色、老師偏白、不夠亮、太模糊、日光燈頻閃、Lumetri、Ultra Key、綠幕去背、字幕、SRT、MG 教學影片後製。
---

# MG 教學影片後製（Premiere Pro MCP）

把已剪好的 MG 教學影片收尾到一致品質：老師人像自然、亮度足、看得清楚，在不同背景上都協調，字幕正確。

**核心原則：參數一律由畫面決定。** 不同老師、不同錄影現場、不同背景的數值都不一樣。本文件給的是量測方法、目標區間和調整規則；範例數值只是起點，不可直接照抄。

**路徑慣例：** 文中的 `scripts/`、`references/` 都是相對於本 skill 目錄（也就是 SKILL.md 所在的資料夾），不是使用者的專案資料夾。執行腳本時請用完整路徑，例如 `node <skill 目錄>/scripts/mcpcall.mjs`；量測產生的畫面與對照圖則放在暫存資料夾。

**涵蓋範圍：** 老師人像的調色、亮度、清晰度，以及字幕流程。音訊（音量、降噪）、剪輯節奏、轉場與 MG 動畫本身都不在這份 skill 裡；MG 動畫製作見 `green-engineering-motion`。

## 0. 環境：先連上 Premiere

1. 若這台電腦還沒裝 MCP，照 [環境安裝與排錯](references/setup-windows.md) 安裝。Windows 上最常卡的兩關：PATH 裡有壞掉的項目導致 `'"node"' is not recognized`，以及 Premiere 26.5／2027 拒絕載入未簽章的 CEP 面板。
2. 呼叫 `verify_premiere_connection`，必須回 `status: connected`，並確認專案名稱與目前開著的序列。若回 `retry:false` 加 `userActionRequired:true`，把 `nextStep` 原文轉告使用者後停下。
3. 這個對話裡如果沒有載入 `mcp__premiere-pro__*` 工具（剛註冊 MCP 時常發生），改用 `scripts/mcpcall.mjs` 透過 stdio 直接呼叫，不必重開對話。

工具名稱、參數格式與已知的坑，見 [MCP 工具手冊](references/mcp-cookbook.md)。**動手前一定要先讀「已知的坑」那一節。**

## 1. 盤點（只讀，不改）

1. `list_sequences` 列出所有序列，問使用者這次要處理哪些。同一批錄影的集數通常可以共用參數，但仍要各自量測確認。
2. 每條序列跑 `list_sequence_tracks`，找出老師人像所在的軌道。通常是名稱相同、片段很多的那一軌，例如 V3 上的 `MIX 1 (n).mov`。不確定就問使用者。
3. 對人像片段跑 `get_effect_properties`，記下現有的效果鏈與 Lumetri 數值，這是之後回復用的基準。片段通常彼此一致；若不一致，要問清楚是不是刻意調的。
4. **背景分組**：每個人像片段取中間時間點，用 `export_frame` 匯出一張，量測人物以外的一塊背景，依亮度分組：暗底（Y < 80）、中間調（80–200）、白底（Y > 200）。同一組共用一套曝光參數。
5. 效果順序以使用者在「效果控制」面板看到的為準。API 回傳的一般效果順序和面板是**相反的**，不能拿它來判斷。正確順序（由上到下）是 Ultra Key → Lumetri Color → 陰影等外觀效果。

## 2. 量測 → 調整 → 再量測

詳細的目標區間、症狀對照表和清晰度處理，見 [人像調色與清晰度](references/presenter-grading.md)。流程如下：

1. **匯出代表畫面**：每個背景組匯出 1–2 張，用 Read 看圖，找出臉頰、額頭、衣服、背景這幾塊量測框的座標。人物位置每個片段可能不同，每張圖都要重新框。
2. **量測**：`scripts/measure.ps1` 會算出每塊區域的 RGB、亮度 Y、R/G 比、過曝比例和銳利度（Laplacian 能量）。
3. **判讀**：對照目標區間與症狀表，決定要動哪幾個參數、往哪個方向調。先向使用者說明數據和打算怎麼改，再動手。
4. **試套**：每個背景組只挑一段試改。`set_effect_property` 會回傳 `before` 和 `after`，把 `before` 記下來，要回復時用得到。
5. **驗證**：重新匯出同一時間點，再量一次，用 `scripts/compare.ps1` 做「原本／調後」的對照圖，再傳給使用者看（例如用 SendUserFile，或請使用者直接開啟圖檔）。數值沒到目標就再調一輪，常見原因是降白色、降亮部、降對比把曝光的效果抵掉了。
6. **全面套用**：使用者同意後才批次套用到其餘片段，接著把**每一段**的數值讀回來逐一核對，最後抽查幾個時間點的畫面。

規則：一次只動一組相關參數；不同背景組分開設定曝光；任何批次修改前都要先取得使用者同意；改完提醒使用者按 Ctrl+S 存檔，MCP 不會自動存檔。

## 3. 清晰度

人像看起來糊時，依序檢查：Lumetri「創意 → 銳利化」是不是 0；Ultra Key 的「柔化」是不是太高；HSL 次要校正是不是設了負的銳利化（等於磨皮）；縮放是不是小於 100%；最後確認 Premiere 節目監視器的播放解析度是不是設在 1/2 或更低。調法和量測方式見 [人像調色與清晰度](references/presenter-grading.md#清晰度)。

## 4. 字幕

這個 MCP **沒有語音辨識**。辨識用 Premiere 內建的「轉錄」或其他 ASR，校對和匯入由 agent 處理，流程見 [字幕流程](references/captions.md)。

## 5. 做不到、要誠實說的事

- 日光燈頻閃：Lumetri 消不掉。降低對比能讓它比較不明顯；真的要處理得用 Flicker Free 外掛，或交給 DaVinci Resolve 的 Deflicker。
- 對焦失準、壓縮造成的細節流失：銳利化只能改善觀感，補不回不存在的細節。
- 同名參數：Lumetri 裡的 Temperature、Tint、Contrast、Saturation、Sharpen 都各出現兩次，`set_effect_property` 只改得到第一個。要改第二個（HSL 次要校正）得用 `execute_extendscript`，執行前**必須先取得使用者明確同意**。不然就請使用者在面板上手動改。
- 動態效果：靜態畫面看不出頻閃和閃爍，交付前一定要請使用者實際播放檢查。

## 交付回報

最後回報這幾項：改了哪些序列、哪些片段（或片段數），每個背景組最後的參數表，量測數據的前後對照，哪些部分沒驗證到（例如動態播放、頻閃），以及提醒使用者存檔。
