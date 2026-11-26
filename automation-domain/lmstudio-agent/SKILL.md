---
name: lmstudio-agent
description: 直連本機 LM Studio（OpenAI 相容 API）執行輕量、單次的文字任務（改寫檔案內容、翻譯、摘要、格式轉換），不透過 opencode 等 agent 框架，避免龐大系統提示詞拖垮本地模型速度。強制回覆使用繁體中文。Triggers on：本機模型、local model、LM Studio、離線模型、免費模型太慢、單檔案轉換、改寫 frontmatter、批次文字處理、不想燒 Claude token。
---

# LM Studio Agent — 直連本地模型做單次文字任務

## 用途與邊界

**適合**：單一輸入 → 單一輸出的文字任務。改寫一份筆記的格式、翻譯一段文字、
摘要一份文件、把某種匯出格式轉成另一種格式。任務描述在一次呼叫裡講得完，
不需要多輪工具呼叫（讀多個檔案、跑指令、查證資料）。

**不適合**：需要跨檔案推理歸屬（例如「這張卡片屬於哪個白板」這種要交叉比對
多份清單才能判斷的任務）、需要執行 shell 指令或多步驟操作的任務、需要模型
自己決定下一步該做什麼的 agentic 工作流。這類任務請用真正的 agent
框架（opencode、Claude Code 本身等），或乾脆讓 Claude 直接處理。

背後原因：像 opencode 這類 agent CLI，每次呼叫都會把完整的工具定義、
skill 清單灌進系統提示詞（實測上萬字），本地模型光是消化這包提示詞
就可能要好幾分鐘，正式任務往往直接卡死或逾時。這支腳本只送「系統提示詞
（幾行）+ 任務描述 + 輸入內容」，沒有工具定義，開銷小很多。

## 已知限制：思考模式模型可能失控

如果 LM Studio 載入的是「思考模式」（thinking）模型（例如某些 Qwen3
變體），碰到需要推理的任務（不是單純翻譯一句話那種）可能會把整個
`max_tokens` 額度都燒在內部思考（`reasoning_content`），從頭到尾生不出
真正的答案（`finish_reason: length`、`content` 是空的）。實測過
`chat_template_kwargs: {"enable_thinking": false}` 對此無效——這個參數
不保證真的關掉思考。

**判斷方式**：先用簡單任務測（見下方「先測連線」），如果那個都要跑很久，
或稍微複雜一點的任務（例如「改寫這份文件的結構」）回應內容是空的、
`finish_reason` 是 `length`，就代表卡到這個問題。**這種情況換一個
非思考模式的 instruct 模型**（例如 Qwen2.5-Instruct 系列），不要在腳本
層面硬解——這是模型本身的行為，不是腳本或參數能穩定控制的。

## 前置條件

1. LM Studio 開著，Local Server 已啟動（預設 port 1234，Settings 裡確認）。
2. 已載入一個支援 tool use / 一般對話的模型（腳本本身不用工具呼叫，但
   選模型時避免用還在跑思考模式又管不住的版本，見上一節）。
3. 確認連得上：`curl -s http://localhost:1234/v1/models`

## 使用方式

```bash
# 純問答（無輸入檔案）
python3 scripts/lm_agent.py --task "用一句話介紹你自己"

# 讀檔案、印到 stdout
python3 scripts/lm_agent.py --task "把這份筆記的重點摘要成三點" --input note.md

# 讀檔案、寫到另一個檔案
python3 scripts/lm_agent.py --task "翻成白話文" --input a.md --output b.md

# 讀檔案、直接覆寫（小心，沒有備份，先確定有 git 版控再用）
python3 scripts/lm_agent.py --task "補齊 YAML frontmatter" --input note.md --in-place

# 從 stdin 餵內容
cat note.md | python3 scripts/lm_agent.py --task "改寫成條列式"
```

### 常用參數

| 參數 | 說明 | 預設 |
|---|---|---|
| `--model` | 模型名稱，對應 LM Studio 載入的模型 id | `qwen3.8-27b-uncensored-mlx` |
| `--base-url` | API base URL | `http://localhost:1234/v1` |
| `--timeout` | 秒數，本地模型慢，別設太短 | `600` |
| `--max-tokens` | 輸出上限；思考模型會把這個額度優先耗在思考上 | `4000` |
| `--no-lang-enforce` | 關閉「強制繁體中文」的預設系統提示詞 | 預設強制繁中 |
| `--system` | 完全自訂系統提示詞（會取代繁中強制規則） | — |

## 先測連線（換模型後一定要先跑這個）

```bash
curl -s http://localhost:1234/v1/models
python3 scripts/lm_agent.py --task "只回覆：測試成功" --timeout 60
```

第二個指令應該在數十秒內回應「測試成功」。如果超過一分鐘沒回應、或回應是
空的，先照上面「已知限制」排查是不是思考模式卡住了，再往下用。

## 語言強制的原理

腳本預設會在系統提示詞加入「一律使用繁體中文回覆，禁止輸出英文句子」的
規則。這是提示詞層級的約束，不是強制解碼限制——多數 instruct 模型會遵守，
但不保證 100%（尤其是程式碼、專有名詞、檔名本來就該保留原文）。如果測出來
常常夾雜英文，把任務描述本身也用繁中寫、且更直接地要求「只能用繁體中文」，
通常能改善。
