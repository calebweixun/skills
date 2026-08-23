# lmstudio-agent

直連本機 LM Studio 的 OpenAI 相容 API 執行單次文字任務的輕量腳本，取代
opencode 之類完整 agent 框架跑本地模型時的龐大系統提示詞開銷。

## 由來

原本想用 opencode CLI 派工給本地／免費雲端模型，節省 Claude 對話 token。
實測下來，opencode 每次呼叫都會夾帶完整的工具與 skill 定義（上萬字）給
目標模型，本地小模型（甚至部分免費雲端模型）處理這包提示詞的速度撐不住，
複合型任務（讀規則、讀清單、改多個檔案）動輒卡好幾分鐘甚至逾時。

改用直接呼叫 API 的方式：自己控制系統提示詞大小，只送「任務描述＋輸入
內容」，把任務範圍收斂成「單一輸入→單一輸出」的一次性轉換，避開 agent
框架的開銷。

## 檔案

- `SKILL.md` — 給 Claude／其他 agent 讀的使用說明與限制
- `scripts/lm_agent.py` — 實際腳本，純 Python 標準函式庫（`urllib`），
  不需要額外安裝套件

## 已知的模型限制（重要）

實測 `qwen3.8-27b-uncensored-mlx`（LM Studio, 4bit MLX）：
- 簡單問答（翻譯一句話、自我介紹）：正常，20-30 秒內回應，繁中輸出正確。
- 需要推理的轉換任務（例如改寫一份 Heptabase 匯出筆記的結構）：模型會
  進入思考模式，把整個 `max_tokens` 額度耗在 `reasoning_content`，
  最終 `content` 是空的、`finish_reason: length`。測過用
  `chat_template_kwargs: {"enable_thinking": false}` 想關閉思考模式，
  無效——這個模型／LM Studio 組合不遵守這個參數。
- 解碼速度本身偏慢，實測約 8 tokens/秒。

**結論**：這個特定模型不適合拿來做結構化的檔案轉換工作。腳本本身可用，
之後換一個非思考模式的 instruct 模型（例如 Qwen2.5-Instruct 系列）
應該就能正常運作——換模型後先照 SKILL.md「先測連線」那段驗證行為，
不要直接假設能用。

## 安裝

複製進 Claude Code 全域 skills：

```bash
mkdir -p ~/.claude/skills && cp -R lmstudio-agent ~/.claude/skills/
```
