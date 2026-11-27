# _skills

個人跨平台 Coding Agent Skills 統一管理庫（支援 **Claude Code**、**OpenAI Codex**、**Google Antigravity**、**Cursor**、**GitHub Copilot**、**OpenCode** 等）。

所有技能按用途分為五大分類子目錄，每個子目錄下的獨立資料夾即為一個標準 Skill（必含 `SKILL.md`，視需要附帶 `scripts/`、`references/`、`assets/`、`agents/`），並透過 `scripts/` 內的一鍵腳本以符號連結（Symbolic Link / Junction）同步至本機 Windows 與 WSL 各家 Agent。

---

## 目錄結構

```text
_skills/
├── skills.manifest.json   # 唯一清單正本：分類、平台相容性、Profile 群組與第三方上游來源
├── workflow-governance/   # 代理治理、需求發想、壓力測試訪談與多模型派工 (7)
├── architecture-quality/  # 領域建模、知識圖譜、極簡審查、系統化除錯與資安稽核 (8)
├── frontend-ui/           # 前端視覺品味、UI/UX 設計系統、React 最佳實踐與網站健檢 (10)
├── content-reporting/     # 去 AI 罐頭味 (Anti-Slop)、技術寫作與互動式視覺化報告 (9)
├── automation-domain/     # Windows/WSL 部署維運、無頭瀏覽器自動化、本地模型與課程專案 (8)
└── scripts/               # 跨 OS (macOS/Windows/Linux) 統一管理工具 (manage.py + 殼層入口)
```

---

## 1. 代理治理、規劃與多模型協作 (`workflow-governance/`)

| Skill | 功能說明 | 來源 |
|---|---|---|
| [claude-governance](workflow-governance/claude-governance/) | 委派與驗收治理規則：指揮官不下場、三件套派工、不自驗、兩輪換路，含 subagent 分流原則。 | 自建（細則同步自 [calebweixun/claude-governance](https://github.com/calebweixun/claude-governance)） |
| [herd-dispatch](workflow-governance/herd-dispatch/) | 透過 Herdr（`hc`）將開發工作依額度分攤派給 Codex、Antigravity 與 Claude，優先消耗快到期券，撞上限自動等待續跑。 | 自建 |
| [grilling](workflow-governance/grilling/) | 對計畫或想法做決策樹式的窮追猛打壓力測試訪談：查得到的事實派 subagent 自查，只把真正取捨交給使用者。 | 第三方：[mattpocock/skills](https://github.com/mattpocock/skills)（MIT） |
| [grill-with-docs](workflow-governance/grill-with-docs/) | 邊執行 `grilling` 訪談邊搭配 `domain-modeling` 即時產出領域詞彙表（`CONTEXT.md`）與架構決策紀錄（ADR）。 | 第三方：[mattpocock/skills](https://github.com/mattpocock/skills)（MIT） |
| [brainstorming](workflow-governance/brainstorming/) | 寫程式或動手改架構前，先釐清使用者意圖、需求邊界與替代方案的結構化發想流程。 | 第三方：[obra/superpowers](https://github.com/obra/superpowers) |
| [executing-plans](workflow-governance/executing-plans/) | 依既有實作計畫分批執行任務，並在批次檢查點回報驗收，避免一次失控改動過多。 | 第三方：[obra/superpowers](https://github.com/obra/superpowers) |
| [find-skills](workflow-governance/find-skills/) | 協助探索、搜尋並透過 `npx skills` 安裝開源 Agent Skills 生態系中的技能套件。 | 第三方：[vercel-labs/skills](https://github.com/vercel-labs/skills) |

---

## 2. 架構設計、程式碼品質、除錯與資安稽核 (`architecture-quality/`)

| Skill | 功能說明 | 來源 |
|---|---|---|
| [domain-modeling](architecture-quality/domain-modeling/) | 建立與收斂專案領域模型（Ubiquitous Language / `CONTEXT.md`）並記錄高門檻架構決策（ADR）。 | 第三方：[mattpocock/skills](https://github.com/mattpocock/skills)（MIT） |
| [codebase-memory](architecture-quality/codebase-memory/) | 透過程式碼知識圖譜做結構化查詢：找函式／類別、追雙向呼叫鏈、查跨模組依賴與盤點死碼。 | 第三方：[DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) |
| [systematic-debugging](architecture-quality/systematic-debugging/) | 四階段根因調查除錯法：先重現與追查資料流根因，禁止未釐清原因前盲目猜測修補。 | 第三方：[obra/superpowers](https://github.com/obra/superpowers) |
| [security-audit](architecture-quality/security-audit/) | 六階段多代理資安稽核與弱點獵捕：攻擊面偵察、覆蓋率帳本追蹤、獨立驗證代理反證與結構化弱點報告。 | 第三方：[cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)（MIT） |
| [ponytail](architecture-quality/ponytail/) | 資深工程師極簡主義（YAGNI）：優先使用既有程式碼、標準庫與平台原生能力，能一行解決絕不寫五十行。 | 第三方：[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)（MIT） |
| [ponytail-review](architecture-quality/ponytail-review/) | 專注抓「過度設計」的 Diff 審查：逐行標出可刪除的抽象層、手刻標準庫與多餘第三方依賴。 | 第三方：[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)（MIT） |
| [ponytail-audit](architecture-quality/ponytail-audit/) | 全 Repo 級別的過度設計與膨脹盤點，依可刪減行數與可移除依賴數排序列出清單。 | 第三方：[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)（MIT） |
| [ponytail-debt](architecture-quality/ponytail-debt/) | 掃描並彙整專案內所有標註 `ponytail:` 的刻意簡化項目，建立可追蹤的技術債帳本。 | 第三方：[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)（MIT） |

---

## 3. 前端視覺品味、UI/UX 與 React 工程 (`frontend-ui/`)

| Skill | 功能說明 | 來源 |
|---|---|---|
| [design-taste-frontend](frontend-ui/design-taste-frontend/) | Taste Skill `v2.5.1`：打造 `figma.com` / `x.ai` 水準網站，內建色票字體與版型發牌器、真實圖資規範、多斷點無頭瀏覽器檢查與完稿守門腳本。 | 第三方：[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)（MIT） |
| [ui-ux-pro-max](frontend-ui/ui-ux-pro-max/) | UI/UX 設計知識庫與檢索腳本：色票、字體配對、UX 準則、圖表類型與跨框架實作建議（含修復後完整 `data/` 與 `scripts/`）。 | 第三方：[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT） |
| [frontend-design](frontend-ui/frontend-design/) | 高辨識度前端介面設計指引，避免千篇一律的 AI 樣板美學，強化排版張力與互動細節。 | 第三方：[anthropics/skills](https://github.com/anthropics/skills) |
| [web-design-guidelines](frontend-ui/web-design-guidelines/) | 依循 Vercel Web Interface Guidelines 審查網站 UI 細節、表單互動、焦點與無障礙規範。 | 第三方：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| [vercel-react-best-practices](frontend-ui/vercel-react-best-practices/) | Vercel 工程團隊整理的 React 與 Next.js 效能最佳化規則（消除瀑布請求、減少 Bundle 與重渲染）。 | 第三方：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| [vercel-composition-patterns](frontend-ui/vercel-composition-patterns/) | React 複合元件與組合設計模式，解決元件布林 Props 無限膨脹與耦合問題。 | 第三方：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| [shadcn](frontend-ui/shadcn/) | `shadcn/ui` 元件架構、CLI 新增／搜尋流程、主題 Token 與組合實務指南。 | 第三方：[shadcn/ui](https://github.com/shadcn/ui)（MIT） |
| [react-dev](frontend-ui/react-dev/) | React 18–19 搭配 TypeScript 的型別安全元件、泛型設計、事件型別與路由整合規範。 | 第三方：[softaworks/agent-toolkit](https://github.com/softaworks/agent-toolkit) |
| [web-artifacts-builder](frontend-ui/web-artifacts-builder/) | 以 React + Tailwind CSS + `shadcn/ui` 建構複雜互動前端並打包為單一獨立 HTML 成品。 | 第三方：[anthropics/skills](https://github.com/anthropics/skills) |
| [audit-website](frontend-ui/audit-website/) | 搭配 `squirrel` CLI 對網站執行 230+ 條 SEO、效能、安全性、壞連結與結構健檢。 | 第三方：[squirrelscan/skills](https://github.com/squirrelscan/skills) |

---

## 4. 去 AI 罐頭味（Anti-Slop）、技術寫作與視覺化報告 (`content-reporting/`)

| Skill | 功能說明 | 來源 |
|---|---|---|
| [antislop](content-reporting/antislop/) | Anti-Slop 核心過濾器（40 條規則、三層級檢驗、Liveliness 指標與交付閘門），攔截無目的的 AI 罐頭產出。 | 第三方：[miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)（MIT） |
| [antislop-ui](content-reporting/antislop-ui/) | 針對版面、色彩、元件、裝飾與微動態的 Anti-Slop 視覺過濾規則（搭配專案 `DESIGN.md` 使用）。 | 第三方：[miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)（MIT） |
| [antislop-copywriting](content-reporting/antislop-copywriting/) | 文案與文字過濾：剔除空洞口號、假造數據、AI 慣用轉折詞與雜亂 Markdown 標記。 | 第三方：[miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)（MIT） |
| [antislop-human](content-reporting/antislop-human/) | 無障礙與人機互動過濾：確保文字對比度、鍵盤導覽、焦點框與表單控制項語意正確。 | 第三方：[miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)（MIT） |
| [antislop-layoutmobile](content-reporting/antislop-layoutmobile/) | 行動端與響應式過濾：檢查跨寬度重排、斷點溢出、寬表格轉換與觸控點擊區域。 | 第三方：[miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)（MIT） |
| [antislop-code](content-reporting/antislop-code/) | 程式碼註解清理：移除重述程式碼表面意思、分隔線橫幅與 Emoji 等 AI 廢話註解，只留真正的設計意圖。 | 第三方：[miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)（MIT） |
| [html-report](content-reporting/html-report/) | 產出含 Chart.js 圖表、可搜尋排序表格、分頁、Mermaid、KaTeX 與深色模式的單檔互動式 HTML 報告，並支援發佈至 GitHub Pages。 | 自建／本機整合 |
| [show-me](content-reporting/show-me/) | 將計畫、架構圖、時程、比較表或多種設計方案（SHOW / PICK）繪製為離線可用的單檔 HTML/SVG 視覺成品。 | 第三方：源自 OpenAI Codex 視覺化工作流 |
| [technical-writer](content-reporting/technical-writer/) | 撰寫結構清晰的開發者文件、API 參考手冊、操作教學與專案 README。 | 第三方：[shubhamsaboo/awesome-llm-apps](https://github.com/shubhamsaboo/awesome-llm-apps)（MIT） |

---

## 5. 系統維運、瀏覽器自動化、本地模型與專屬流程 (`automation-domain/`)

| Skill | 功能說明 | 來源 |
|---|---|---|
| [windows-gh-pr](automation-domain/windows-gh-pr/) | 在 Windows 環境透過已登入的 GitHub CLI（`gh`）建立與更新 PR，處理連線與認證異常。 | 自建 |
| [windows-wsl-deploy](automation-domain/windows-wsl-deploy/) | 從 Windows 同步並驗證執行於 WSL 的服務：Git 同步、前後端建置、`systemd` 重啟與健康檢查。 | 自建 |
| [lmstudio-agent](automation-domain/lmstudio-agent/) | 直連本機 LM Studio API 執行單次文字任務（改寫、翻譯、摘要），避開大型 Agent 框架提示詞開銷。 | 自建 |
| [dgpa-suspension](automation-domain/dgpa-suspension/) | 透過 `ego-browser` 自動擷取行政院人事行政總處天然災害停班停課公告與各縣市狀態。 | 自建 |
| [heptabase-chatgpt-migrate](automation-domain/heptabase-chatgpt-migrate/) | 透過 `ego-browser` 操作已登入的 ChatGPT 網頁版將 Heptabase 白板筆記改寫為 Obsidian wikilink，並以腳本機械化核對連結數。 | 自建 |
| [kymco-text-defect-review](automation-domain/kymco-text-defect-review/) | 透過 `ego-browser` 覆核 Kymco Vision Platform 車牌 OCR 判讀結果、修正誤判並匯入驗證。 | 自建 |
| [green-engineering-motion](automation-domain/green-engineering-motion/) | 綠色工程教學課程 Three.js 透明 MG：整集口白逐字對位、片頭、單頁重點動畫，`1080p / 59.94fps` 透明 ProRes 輸出、版面編輯器與驗證／審查流程。 | 自建 |
| [premiere-mg-postproduction](automation-domain/premiere-mg-postproduction/) | 透過 Premiere Pro MCP 為 MG 教學影片後製收尾：去背老師人像依背景分組調色、亮度與清晰度修正（以輸出畫面量測後再調參），以及字幕處理。 | 自建（MCP：[hetpatel-11/Adobe_Premiere_Pro_MCP](https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP)） |

---

## 跨平台（macOS / Windows / Linux）× 三大家管理機制

本 Repo 以 **[skills.manifest.json](skills.manifest.json)** 作為中繼資料正本、**[scripts/manage.py](scripts/manage.py)**（零外部依賴的 Python 3 標準庫工具）作為跨作業系統統一管理引擎，以符號連結（Symbolic Link；Windows 無開發者模式時自動降級為 Junction）同步至所有已安裝的 Coding Agents。

### 支援的三大家與 Agent 路徑對照

| 陣營 | Agent / 工具 | 全域同步目標路徑 | 備註 |
|---|---|---|---|
| **Claude** | Claude Code | `~/.claude/skills` | macOS / Windows / Linux 通用 |
| **ChatGPT** | OpenAI Codex | `~/.codex/skills` & `~/.agents/skills` | 雙路徑兼容新舊版 Codex |
| **Gemini** | Gemini CLI | `~/.gemini/skills` | macOS / Windows / Linux 通用 |
| **Gemini** | Antigravity IDE | `~/.gemini/config/skills` | 自動偵測 `~/.gemini/config/plugins/`，略過已由 Plugin 提供的同名技能避免重複載入 |
| **Gemini** | Antigravity CLI (`agy`) | `~/.gemini/antigravity-cli/skills` | 同上，自動避開 Plugin 重複 |
| **共用／其他** | Copilot / OpenCode / Pi / Kimi / Amp / Qwen | `~/.agents/skills` | 跨工具標準共用層 |
| **共用／其他** | Cursor | `~/.cursor/skills` | 偵測到 `~/.cursor` 時自動同步 |

### 依作業系統與機器自動分流（Profiles 與本機設定）

為了避免在不同機器上灌入用不到的技能（浪費 Agent 系統提示詞 Token）：

- **自動 OS 過濾**：在 macOS 與 Linux 上會自動跳過標記為 `platforms: ["windows"]` 的技能（如 `windows-gh-pr`、`windows-wsl-deploy`）；若要強制全裝可加 `--all-platforms`。
- **內建 Profile 群組**（定義於 [skills.manifest.json](skills.manifest.json)）：
  - `all`（預設）：當前作業系統相容的所有 Skills
  - `core`：日常核心工程組（治理、規劃、除錯、圖譜、極簡審查、資安稽核、Anti-Slop 核心）
  - `frontend`：前端品味、UI/UX、React / Next.js / shadcn 與網站健檢
  - `writing`：Anti-Slop 文案、技術寫作、HTML 報告與 Show-Me 視覺化
  - `domain`：環境維運、本地模型、無頭瀏覽器自動化與個人專屬流程
- **單機偏好持久化（`--save-local`）**：不同電腦（例如 MacBook 只裝 `core,frontend,writing`，Windows 桌機全裝，Linux 伺服器只裝 `core`）可透過 `--save-local` 將該機器的 Profile、額外啟用（`--include`）與排除清單（`--exclude`）存到 `~/.config/skills-repo/local.json`（不進入 Git）。之後每次 `git pull` 只需直接執行 `sync` 就會沿用該機器的設定。

### 常用指令

#### macOS / Linux / WSL

```bash
# 1. 新機器初次安裝（同步當前 OS 相容的全部 Skills，將舊實體複本改為符號連結）
./scripts/sync-skills.sh sync --replace-copies

# 2. 精簡安裝並記住這台機器的偏好（例：MacBook 只要 core + frontend + writing，排除特定專案技能）
./scripts/sync-skills.sh sync --profile core,frontend,writing --exclude kymco-text-defect-review,green-engineering-motion --prune --save-local

# 3. 檢視三大家與各 Agent 的同步矩陣
./scripts/sync-skills.sh status

# 4. 全面健檢：檢查 manifest、SKILL.md 格式、README 連結、斷裂連結，並反向偵測本機是否有尚未收進 Repo 的新 Skill
./scripts/sync-skills.sh doctor

# 5. 檢查所有第三方上游 GitHub Repo 的最新 commit
./scripts/sync-skills.sh check-upstream

# 6. 安全卸載（僅移除指向本 Repo 的符號連結，不動其他自建或系統技能）
./scripts/sync-skills.sh uninstall
```

#### Windows（PowerShell）

```powershell
# 1. 初次同步安裝（支援 Windows PowerShell 5.1 與 PowerShell 7）
pwsh -File .\scripts\sync-skills.ps1 -ReplaceCopies

# 2. 套用精簡 Profile 並儲存本機偏好（自動清除不在清單內的舊連結）
pwsh -File .\scripts\sync-skills.ps1 -Profile core,frontend,writing -Prune -SaveLocal

# 3. 檢視各 Agent 同步矩陣 / 全面健檢 / 檢查上游更新
pwsh -File .\scripts\sync-skills.ps1 -Status
pwsh -File .\scripts\sync-skills.ps1 -Doctor
pwsh -File .\scripts\sync-skills.ps1 -CheckUpstream
```

### 日常維護 SOP

1. **換電腦／拉取更新後**：`git pull && ./scripts/sync-skills.sh sync --prune`（Windows 執行 `.\scripts\sync-skills.ps1 -Prune`），所有三大家 Agent 立即一致。
2. **新增或修改 Skill 時**：一律改在 `_skills/<category>/<skill-name>/` 並登記到 `skills.manifest.json` 與 `README.md`，接著跑 `doctor` 驗證零錯誤。
3. **定期盤點漂移**：每隔一段時間跑一次 `doctor`，若在某個 Agent 順手裝了新 Skill，會以 `[INFO] Local unmanaged skill` 提醒你決定要收斂回 `_skills` 還是移除。
4. **單一專案臨時掛載**（不裝到全域）：
   ```bash
   mkdir -p .agents/skills && ln -s /path/to/_skills/<category>/<skill-name> .agents/skills/<skill-name>
   ```
