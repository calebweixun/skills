---
name: herd-dispatch
description: 透過 Herdr（hc）把開發工作分派給 Codex（ChatGPT）、agy（Google Antigravity）與 Claude，依各家 $20 訂閱的剩餘額度平均分攤、優先用掉快到期的 Codex reset 券，並用共用範本確保各家產出品質一致。當要委派子任務、跨模型審查、平行實作、大量讀檔盤點，或使用者提到 herdr、hc、codex、agy、gemini、分散額度、省 token、用量上限時使用。
---

# herd-dispatch：多家模型分工

你是協調者：拆任務、派工、驗收、整合。大量讀檔、寫測試、審查、長時間實作交給其他家；你只讀結論和 diff。

## 0. 開工前（每個 session 一次，約 1 分鐘）

```sh
python3 ~/.agents/skills/herd-dispatch/scripts/quota.py   # Codex 5 小時／每週用量、reset 券
hc templates                                              # 確認範本已安裝
codex debug models </dev/null | grep -o '"slug": *"[^"]*"' # 最新 Codex 模型
agy models </dev/null | head                              # 最新 agy 模型
```

- 模型一律用各家**最新**版本。範本寫死的型號若已不在清單上，先改範本（`~/.agents/skills/herd-dispatch/templates/`）再派工，不要沿用舊型號。
- 使用者說的型號在清單上找不到時，用清單上最新的同系列，並告訴使用者實際用了哪個。

## 1. 派工矩陣

| 任務 | 首選 | 範本 | 理由 |
|---|---|---|---|
| 規格／計畫一致性分析、PR 與 diff 審查 | Codex | `codex-review` | 跨模型審查，補 Claude 盲點 |
| 跨多檔案實作、重構、補測試 | Codex | `codex-dev` | 產出大量 token，轉到 ChatGPT 額度 |
| 兩輪仍修不好的 bug | Codex | `codex-hard` | 最高推理強度，避免 Claude 反覆試錯 |
| 掃整個目錄、長 log、跨文件盤點 | agy Gemini | `agy-scan` | 長上下文，不塞爆 Claude |
| Claude 額度吃緊但需要 Claude 風格實作 | agy Claude Sonnet | `agy-dev` | 走 Google 額度 |
| 拆任務、架構決策、最終整合、與使用者對話 | Claude（你） | — | 協調者不下場寫大量程式 |

## 2. 額度分配規則（由上往下判斷）

1. **Codex 有 7 天內到期的 reset 券** → 審查、實作、測試優先給 Codex，用最高階模型與 `high`／`xhigh`。券過期就浪費了。
2. **Codex 5 小時或每週用量 ≥ 90%**：
   - 還有 reset 券且工作還很多 → 請使用者在 Codex（`/status` 或 App）使用 reset 券。**不要自己消耗券**。
   - 沒有券 → 改派 agy。
3. **agy 回報 quota／rate limit 錯誤** → 改派 Codex，或在這一輪由 Claude 自己做。
4. **Claude 用量 ≥ 80%（看 `/usage`）** → 實作改用 `codex-dev` 或 `agy-dev`，Claude 只做驗收。
5. 都還有餘裕 → 輪流分派，讓三家用量的百分比接近。
6. **同一件工作，實作和審查一定給不同家**（例如 Codex 實作 → agy 或 Claude 審查）。

## 3. 怎麼派

```sh
# 一定要 --bg、--name、--cwd；第一個任務直接寫在 run 裡（啟動中再 send 可能會掉）
hc run --bg --name review-x --cwd /path/to/worktree codex-review "審查 X；報告寫到 specs/.../analysis/x.md"
hc wait --children any        # 等任一個回報；不要 sleep 或輪詢
hc read review-x --lines 80   # 讀結果，再打開報告檔核對
hc kill review-x; hc rm review-x
```

- **實作者**一律在自己的 git worktree 工作（`git worktree add ../wt-x -b <dev>/x`），一人一組檔案，不和別人或你自己改同一個檔案。審查者唯讀。
- **報告**：長內容寫到檔案，訊息只回路徑和摘要。Codex 在沙箱內不能呼叫 hc，要用 `hc read` 拿結果。
- **啟動卡住**：`hc get <t>` 的 status 是 `blocked` 時，先 `hc read <t> --lines 0` 看畫面：
  - 資料夾信任、hook 信任這類一次性對話框：使用者自己的 repo 可以確認；Codex 的 hook 信任選「Continue without trusting」。
  - 逐條指令的權限詢問：**不要替使用者按允許**。改用範本裡的唯讀白名單（`--settings`）重新啟動，或告訴使用者。
- **Codex 啟動時的 hook 信任對話框**：每次開新的 Codex 都會先問 hook 要不要信任，所以範本的第一則任務會送不進去（`first_message.sent: false`）。處理步驟：
  1. `hc keys <t> down down enter`，選「Continue without trusting」。
  2. 把範本內文加上任務，用 `hc send` 重送一次。
  3. 版本更新提示已經在範本關掉了（`check_for_update_on_startup=false`）。要更新 Codex 時，請使用者自己執行 `codex update`。
- **agy 啟動時出現 `blocked (auth)` 通知**：通常是登入狀態還在載入，屬於暫時狀態。先跑 `hc wait <t> --timeout 15`，再用 `hc get` 看 status，變成 `working` 就不必處理。
- **Codex 不會把狀態回報給 hc**：status 一直是 null，所以 `hc wait` 只會逾時，不會在它做完時返回。要知道它做完沒，看畫面上還有沒有 `Working (`：
  `hc wait <t> --timeout 190; hc read <t> --lines 0 | grep -q "Working (" || echo 完成`
- **重送前先讀**：`first_message.sent` 為 false，或 send 失敗時，先 `hc read` 確認對方沒收到再送。

## 4. 品質一致的做法

各家看到的規則要一樣：

- **全域技能**放在 `~/.agents/skills/`（唯一正本），用符號連結給三家讀取：`~/.claude/skills`、`~/.codex/skills`、`~/.gemini/antigravity-cli/skills`。安裝或修復連結：`sh ~/.agents/skills/herd-dispatch/scripts/install.sh`。
- **專案規則**：每個範本開頭都要求先讀 `AGENTS.md`，沒有就讀 `CLAUDE.md`；專案技能則讀 `.agents/skills/` 或 `.claude/skills/` 底下的 `SKILL.md`。派工時直接寫出技能名稱，例如「依 speckit-analyze 流程」。
- **MCP**：開發用的 `codebase-memory-mcp` 三家都要有：
  - 檢查：`codex mcp list`、`agy mcp list`、`claude mcp list`。
  - 缺的話依各家指令補上，指令都指向同一個執行檔 `~/.local/bin/codebase-memory-mcp`。
- **驗收時不要相信子代理自己的回報**：自己讀 diff、重跑測試，看到結果才算完成。同一個問題被退回兩輪，就換做法或換一家模型。

## 5. 撞到用量上限：自動續跑

派出長任務後，順手掛一個守候程式。agent 撞到上限停下來時，守候程式會等到限制解除，再送「從中斷處繼續」：

```sh
R=~/.agents/skills/herd-dispatch/scripts/resume.py
hc run --bg --outlive-parent --name resume-dev-x python3 $R dev-x              # 守子代理，任務完成就結束
hc run --bg --outlive-parent --name resume-lead  python3 $R $HC_TERMINAL_ID --persist   # 守協調者自己
python3 $R dev-x --dry-run                                                      # 只判斷不等待
```

- **重置時間從哪來**：
  - Codex：直接讀官方 API。
  - Claude、agy：從畫面上的「resets 5pm」「try again at 8:55 PM」解析。
  - 解析不出時間：先等 30 分鐘，之後每次加倍，最多等 180 分鐘。
- **會停手的情況**：
  - 只在 agent 停下來、而且畫面最後幾行出現上限字樣時才續跑。
  - 遇到 `blocked`（需要人核准或回答）就只回報，不代替使用者送出。
  - 最多續跑 12 次。
- **與改派的分工**：
  - 不急的工作：掛 `resume.py` 等它恢復。
  - 急的工作：照第 2 節改派給還有額度的那一家，讓 `hc read` 拿到的進度跟著新任務一起交出去。
- **續跑必須沿用原本的終端**：resume.py 用 `hc send` 送到同一個終端，對話紀錄還在，所以不會從頭重做。不要另外開新終端重跑同一個任務。

## 6. 禁止

- 不要替使用者消耗 Codex reset 券、不要替使用者核准逐條權限、不要讓子代理再派子代理。
- 子代理不 commit、push、merge，由協調者驗收後處理。
- 不要用 one-shot 模式（`codex exec`、`agy -p`）做長任務；要可觀察、可插話，就用 `hc run --bg` 跑互動模式。
