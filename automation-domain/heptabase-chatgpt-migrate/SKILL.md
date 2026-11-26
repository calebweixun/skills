---
name: heptabase-chatgpt-migrate
description: 用已登入的 ChatGPT（透過 ego-browser）把 Heptabase 匯出的白板/卡片筆記改寫成 Obsidian wikilink 格式，並用機械化腳本核對連結數量，避免漏項或幻覺。Triggers on：Heptabase 匯入、白板筆記轉換、改寫成 wikilink、ChatGPT 網頁版跑任務、opencode/本地模型跑不動的結構化轉換任務。
---

# Heptabase → Obsidian 遷移（ChatGPT 網頁版執行 + 機械化驗證）

## 背景：為什麼是這個組合

先前試過 opencode 派工本地/免費模型（Qwen3-120b、Tencent Hy3、OpenRouter
自動路由、phi-4-mini-instruct、phi-4-mini-reasoning）處理 Heptabase 白板
筆記轉 wikilink 的任務，全部失敗：思考模式模型會卡進推理迴圈燒光 token
額度、非思考小模型指令遵循能力不夠（連基本格式轉換都做不到）。

改用瀏覽器已登入的 ChatGPT（Go 方案）網頁版執行，品質明顯好轉——但**不是
沒有風險**。實測發現兩個問題：
1. 第一次輸出漏掉了一整個區段（7 張圖片的 embed），指令沒有明確要求
   「每一項都不能少」時，模型會自行省略它判斷不重要的內容。
2. 事後要求它「一字不改重新輸出」時，又漏掉一項（但自己回報的總數
   沒有跟著減少——**它自我核對的數字不可信**）。

結論：**ChatGPT 網頁版可以用，但每一次輸出都必須經過機械化驗證，不能
只看它自稱做完、自稱數字對。** 這是本 skill 存在的理由——把驗證步驟
變成流程裡的強制關卡，而不是選擇性的人工複查。

## 前置條件

- 使用者已經用 ego-browser 登入 ChatGPT（`ego-browser` skill 的
  task space 能開到 https://chatgpt.com 且顯示已登入帳號）。
- 本 skill 依賴 `ego-browser` skill 提供的瀏覽器操作能力。

## 完整流程

### 1. 準備原始檔案與任務

確認要轉換的來源檔案（例如 Heptabase 匯出的
`Whiteboard/xxx.md`），讀取其內容。

### 2. 用固定模板組出提示詞

**一定要用 `references/prompt-template.md` 這份模板**，不要自己即興
寫指令。這份模板是實測過的版本，關鍵要求都在裡面：

- 明確列出每一種項目類型都要保留（連結、圖片 embed），不能只憑常識
  判斷「重要的留、不重要的省略」。
- YAML frontmatter 要有 `---` 前後分隔線。
- **整份輸出要包在一個 ``` 程式碼區塊裡**——這點很關鍵：ChatGPT 的
  網頁介面會把 `---` 渲染成 `<hr>` 或跟 setext 標題語法搞混，用
  `innerText` 直接讀取會讀不到分隔線本身。包在程式碼區塊裡，瀏覽器
  端讀到的就是未經 markdown 渲染的原始文字，才能可靠抓取。
- 不要依賴它自己回報的「項目總數」做核對依據——那只是輔助，真正的
  核對在步驟 4。

### 3. 用 ego-browser 送出並取回結果

```js
const task = await useOrCreateTaskSpace('heptabase 遷移: <白板名稱>')
await openOrReuseTab('https://chatgpt.com', { wait: true, timeout: 20 })
// 開新對話，或延續同一個對話繼續處理下一份檔案

await fillInput('@<輸入框ref>', prompt)  // prompt = 模板 + 原始檔案內容
await pressKey('Enter')
await waitForNetworkIdle({ timeout: 30 }).catch(() => {})
await wait(5)

// 一定要從 DOM 抓 innerText，因為輸出包在程式碼區塊裡，能保留原始 --- 等符號
const raw = await js(String.raw`(() => {
  const resp = document.querySelectorAll('[data-message-author-role="assistant"]')
  const last = resp[resp.length - 1]
  return last ? last.innerText : 'NOT_FOUND'
})()`)
cliLog(raw)
```

把 `raw` 裡的內容取出（去掉最外層的 ``` 圍欄跟語言標籤那一行，例如
「Markdown」），存成暫存檔準備驗證。

### 4. 機械化驗證（強制關卡，不可跳過）

```bash
python3 scripts/verify_migration.py --source <原始白板.md> --output <暫存輸出.md>
```

- **exit code 0（完全吻合）**：可以把輸出寫入正式位置。
- **exit code 1（有落差）**：不要採用。回到步驟 2/3，把腳本報出的
  缺漏項目明確列給 ChatGPT，要求它補上遺漏的項目重新輸出，再驗證一次。
  最多重試 2 次；還是有落差就停下來交給人工處理，不要無限重試。

### 5. 落地

驗證通過後，依照 vault 的 `AGENTS.md` 規則（frontmatter 格式、目標
資料夾、MANIFEST.md 打勾）把結果寫入正式位置，原始檔案從 inbox 移除。

## 已知限制

- ChatGPT 網頁版沒有 API 那麼穩定的輸出格式控制，每次遣詞造句可能
  略有差異（例如有時用條列 `-`、有時不用），驗證腳本只看
  `[[...]]`／`![[...]]` 的目標名稱是否對得上，不管格式細節，這是刻意
  設計成寬鬆比對，重點抓「有沒有漏東西」。
- 這個流程仰賴使用者的 ChatGPT 帳號登入狀態，帳號登出或方案到期會
  導致失敗，需要使用者重新登入。
- 一次對話處理太多份檔案，上下文變長可能讓後面幾份的品質下降——建議
  每處理 3-5 份白板就開一個新對話。
