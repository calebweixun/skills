# _Skills

個人管理的 Claude Code / Antigravity skill 集合。每個子目錄是一個獨立 skill，含
`SKILL.md`（必要）與視需要的 `references/`、`agents/`、`README.md`。

## 目錄

| Skill | 做什麼 |
|---|---|
| [claude-governance](claude-governance/) | 委派與驗收的治理規則：指揮官不下場、三件套派工、不自驗、兩輪換路。任何 agent 皆適用，含 subagent 分流。細則同步自 [claude-governance repo](https://github.com/calebweixun/claude-governance)。 |
| [codebase-memory](codebase-memory/) | 用 codebase 知識圖做結構化程式碼查詢：找函式/類別、追呼叫鏈、查依賴、抓死碼。 |
| [dgpa-suspension](dgpa-suspension/) | 用 ego-browser 查詢行政院人事行政總處的停班停課公告。 |
| [domain-modeling](domain-modeling/) | 建立與收斂專案的領域模型（ubiquitous language）、記錄架構決策（ADR）。 |
| [grill-with-docs](grill-with-docs/) | 邊 `/grilling` 邊用 `/domain-modeling` 產出 ADR 與詞彙表。 |
| [grilling](grilling/) | 對計畫或想法做窮追猛打式的壓力測試訪談。 |
| [kymco-text-defect-review](kymco-text-defect-review/) | 用 ego-browser 覆核 Kymco Vision Platform 車牌 OCR 判讀結果，比對車牌圖與辨識文字框，修正誤判並匯入。已在正式環境跑過 2951 筆、121 筆修正並獨立驗證。 |
| [ui-ux-pro-max](ui-ux-pro-max/) | UI/UX 設計指引。⚠️ `data`、`scripts` 目前是失效的相對路徑殘留（指向 repo 外的 `../../../src/ui-ux-pro-max/`），非本次整理範圍，需要時另外修。 |
| [windows-gh-pr](windows-gh-pr/) | 在 Windows 上用已登入的 GitHub CLI 建立/更新 PR，處理連線與認證失敗。 |
| [windows-wsl-deploy](windows-wsl-deploy/) | 從 Windows 更新並驗證跑在 WSL 的應用：Git 同步、前後端建置、systemd 重啟、健康檢查。 |

## 安裝

Claude Code 全域：

```bash
mkdir -p ~/.claude/skills && cp -R <skill-dir> ~/.claude/skills/
```

單一專案：

```bash
mkdir -p .claude/skills && cp -R /path/to/_Skills/<skill-dir> .claude/skills/
```

Antigravity（Gemini）走各自 README 說明的安裝方式（見 `dgpa-suspension/README.md`）。
