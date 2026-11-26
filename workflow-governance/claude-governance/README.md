# claude-governance skill

把一套 Claude Code 治理制度變成任何 agent 都能載入的 skill：**指揮官不下場、三件套派工、
不自驗、兩輪換路。**

核心假設：判斷力靠感覺時強弱模型差距很大，寫成顯式判準與 checklist 後弱模型可以逼近。
所以規則一律寫成可機械核銷的形式（有數字、有 pass/fail、有正反例）。

制度原始 repo：[calebweixun/claude-governance](https://github.com/calebweixun/claude-governance)
（MIT，Fable 5 於 2026-07 撰寫）。本 skill 是它的 skill 化版本。

## 什麼時候會觸發

要派工給 subagent、要選 model 與 effort、要寫派工 prompt、要驗收產出、判斷任務是否真的完成、
考慮要不要升級模型、同一問題反覆失敗、不確定該不該停下來問使用者——這些情境都會觸發。

## 結構

| 檔案 | 內容 | 何時讀 |
|---|---|---|
| `SKILL.md` | 核心規則 137 行：八節判準＋「你是主對話還是 subagent」分流＋引用路由 | 觸發時載入 |
| `references/templates.md` | 五份派工模板（搜尋／實作／重構／研究／審查），抄了填空 | 要寫派工 prompt |
| `references/dispatch.md` | 派工判準、model×effort 對照表、升降級路徑、內建 agent 速查 | 派工細節 |
| `references/judgment.md` | 五組 rubric 的正例／反例、harness 極限 | 不確定怎麼判斷 |
| `references/maintenance.md` | 綠黃紅區修改權限、教訓四行格式、精簡排程 | 要改治理規則本身 |
| `references/diagnostic.md` | 環境自查程序＋三大常見病灶 | 新環境開場、每 60 天 |
| `references/rationale.md` | 設計理由、制度四種退化方式與預防 | 想知道為什麼這樣設計 |

**subagent 也適用**：`SKILL.md` 開頭第一張表做讀者分流。subagent 不能再開 subagent，
所以它跳過派工規則，改用回報合約＋完成定義＋誠實條款；**需要驗收但開不了 agent 時，
必須在回報中要求上游派驗收 agent，不准自稱已驗收。**

## 安裝

個人全域（所有專案可用）：

```bash
mkdir -p ~/.claude/skills && cp -R claude-governance ~/.claude/skills/
```

單一專案（進版控、團隊共用）：

```bash
mkdir -p .claude/skills && cp -R /path/to/skills/claude-governance .claude/skills/
```

裝好後用 `/claude-governance` 直接喚起，或讓模型依 description 自動觸發。

## 維護

`references/diagnostic.md`–`maintenance.md` 五份的**唯一真實來源**是
[claude-governance](https://github.com/calebweixun/claude-governance) repo 根目錄的 `00`–`04`。
治理 repo 更新後同步：

```bash
./sync-references.sh ~/Codes/claude-governance
```

腳本只改檔名與交叉引用路徑，不改內容，可重跑（已驗證冪等）。

兩個例外**手工維護**，改治理 repo 時要記得跟上：
- `references/rationale.md` ← 改寫自 `05-letter.md`
- `SKILL.md` ← 濃縮版。改動數字或原則屬 `references/maintenance.md` 定義的**黃區**，
  需先向使用者提案再改。

## 已知限制

- 型號別名（haiku/sonnet/opus）與 effort 等級來自 2026-07 的官方文件。以環境實測（`/model`）為準，
  不符就依 `references/maintenance.md` 綠區規則改掉。
- 制度補執行品質，補不了品味判斷、模糊需求、查不到的外部事實。這三項的處置寫在
  `SKILL.md` 第 8 節誠實條款。
