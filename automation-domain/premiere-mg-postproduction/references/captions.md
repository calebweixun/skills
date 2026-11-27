# 字幕流程

Premiere Pro MCP **沒有語音轉文字的功能**，agent 本身和 subagent 也沒有辨識引擎。分工如下：

| 步驟 | 誰做 | 怎麼做 |
|---|---|---|
| 1. 辨識 | 使用者在 Premiere 操作 | `視窗 > 文字 > 轉錄 > 建立轉錄`，語言選中文（有繁體就選繁體），音軌只選老師的人聲，不要選背景音樂 |
| 2. 斷句 | 使用者在 Premiere 操作 | 按「建立字幕」，每段 1 行，每行約 16–18 個中文字 |
| 3. 匯出 | 使用者在 Premiere 操作 | 在字幕面板的 `⋯` 選「匯出為 SRT 檔」，存到專案資料夾 |
| 4. 校對 | agent（可派 subagent） | 簡轉繁、專有名詞改正、拆分太長的句子，時間碼不動 |
| 5. 匯回 | agent 透過 MCP | 用 `import_media` 匯入校對好的 SRT，再用 `create_caption_track`（傳入 SRT 的 project item ID）建立新字幕軌。原本的字幕軌保留，方便對照 |

替代方案：用本機 Whisper／faster-whisper 辨識。這需要另外安裝 ffmpeg 和模型，**下載前要取得使用者同意**。

## 術語表要從哪裡來

直接從老師的簡報抽出文字，不要靠猜：

```powershell
Copy-Item deck.pptx deck.zip; Expand-Archive deck.zip x -Force
Get-ChildItem x\ppt\slides\slide*.xml | Sort-Object { [int]($_.BaseName -replace 'slide','') } | ForEach-Object {
  "[$($_.BaseName)] " + (([regex]::Matches((Get-Content $_ -Raw -Encoding UTF8),'<a:t>([^<]*)</a:t>') | ForEach-Object { $_.Groups[1].Value }) -join ' ') }
```

先找出這一集對應的是哪幾頁投影片（看主題頁標題），再整理成「正確寫法 ← 常見誤辨」的對照表。容易辨識錯的包括人名、系所名、英文縮寫（例如 AIoT、TRL、CCUS），以及同音詞（例如振動／震動、轉子／轉紙）。

## 校對規則

- 只改文字，不改時間碼。斷句需要拆分時，用原時間按字數比例切開。
- 老師的口語贅詞（「那個」「然後」）只刪明顯多餘的，保留說話的語氣。
- 標點：句末不加句號，句中以空格或全形逗號分隔，整份統一一種。
- 交付時附上修改清單（原文 → 修改後），讓使用者能快速抽查。

狀態說明：這份流程在原案例中只走到「使用者選擇內建轉錄」，SRT 匯回的步驟（`create_caption_track`）還沒有實際跑過一輪驗證。第一次使用時，匯回後務必用 `read_sequence_captions` 讀回來核對。
