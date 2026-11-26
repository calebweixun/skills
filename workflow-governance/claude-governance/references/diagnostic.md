# 00 — Harness 快速診斷（先跑這份，10 分鐘）

> 撰寫背景：本文件由 claude.ai 上的 Fable 5 撰寫，**沒有看過你的實際環境**。
> 因此這不是「你的診斷結果」，而是「診斷程序＋已知最常見的三大病灶」。
> 未來第一個 Claude Code session 的第一件事：照本文件跑完自查指令，
> 把結果寫進本檔最下方的「本環境實測結果」區塊。之後所有檔案引用診斷時，以實測結果為準。

## 自查指令（依序執行，把輸出貼到文末）

```bash
# 1. 盤點所有會被自動載入的指令檔（這些每個 session 都吃 token）
wc -l ~/.claude/CLAUDE.md 2>/dev/null; find . -name CLAUDE.md -not -path "*/node_modules/*" -exec wc -l {} + 2>/dev/null
ls -la ~/.claude/agents/ .claude/agents/ 2>/dev/null
ls -la ~/.claude/skills/ .claude/skills/ 2>/dev/null

# 2. 找重複與過時規則（人工看，重點：同一件事寫兩次、指向不存在的檔案）
grep -n "TODO\|DEPRECATED\|舊\|已棄用" ~/.claude/CLAUDE.md ./CLAUDE.md 2>/dev/null

# 3. 確認可用模型與 effort（不要憑印象，跑一次看選單）
#    在 Claude Code 互動模式輸入：/model   （記下可選型號與 effort 滑桿）
#    再輸入：/effort                        （記下目前等級與來源）

# 4. 確認 MCP 與 hooks
claude mcp list 2>/dev/null
cat .claude/settings.json ~/.claude/settings.json 2>/dev/null | grep -A5 "hooks\|permissions"

# 5. 檢查 agent memory 是否啟用（會影響 subagent 是否累積經驗）
ls ~/.claude/agent-memory/ .claude/agent-memory/ 2>/dev/null
```

## 三大最常見病灶（依殺傷力排序）＋修法

### 病灶 1：主對話當工人用 → context 被工具輸出灌爆，後半場失智
**症狀判準**（符合任一即中）：
- 主對話裡出現整頁的檔案內容、grep 大量輸出、網頁全文。
- Session 進行 1–2 小時後開始忘記先前決定、重問已答過的問題、建議偏離既有慣例。
- 經常觸發 auto-compact（compaction 本身就是 context 已滿的證據）。

**修法**：所有「大量讀取」一律派 subagent，主對話只收結論。具體規則見 `references/dispatch.md`。
最低成本起步：直接用內建 `Explore` agent（Haiku、唯讀）做所有 codebase 搜尋。

### 病灶 2：模型與 effort 不分任務一律開最大（或一律預設）→ 漏 token
**症狀判準**：
- 改個 typo 也用 Opus 高 effort；或反過來，複雜除錯用預設 effort 反覆失敗三次以上。
- 從沒用過 `/effort`、subagent frontmatter 從沒寫過 `model:` 欄位。

**修法**：套用 `references/dispatch.md` 的「任務型態 → 模型×effort」對照表。
一行速記：**搜尋用 haiku、量產用 sonnet 低中 effort、判斷用主模型高 effort、卡關才升 opus。**

### 病灶 3：自己驗自己 → 錯誤在同一個 context 裡自我強化
**症狀判準**：
- 寫完程式碼只說「應該可以了」沒實際跑測試。
- 改完檔案沒 read-back 確認寫入內容。
- 同一個 session 既寫又審，審查結論永遠是「沒問題」。

**修法**：驗收一律派 fresh-context agent（新 context、看不到實作過程的偏見）。
檔案改動用 read-back；程式碼用測試或實跑；高風險判斷用第二意見。細則見 `references/judgment.md` 第 5 節。

## 誠實標註：這套診斷的極限
- 上面三病灶是 Claude Code 使用者的**通例**，不是你環境的實測。你的環境可能另有更大的洞（例如某個 MCP server 每次注入巨量 schema、某個 hook 吃掉大量輸出）。自查指令第 1、4 步就是抓這種洞的。
- Token 洩漏無法從內部精確計量。粗略代理指標：session 撐多久才 compact、`/cost`（若可用）的數字趨勢。

---

## 本環境實測結果（未來 session 填寫）

- 日期：
- 可用模型（/model 實際選單）：
- 可用 effort 等級：
- CLAUDE.md 總行數（全部層級加總）：
- 已裝 subagents：
- 已裝 MCP servers：
- agent memory 啟用狀態：
- 實測發現的最大病灶（若與上述三項不同）：
