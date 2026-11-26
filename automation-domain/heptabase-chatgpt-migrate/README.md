# heptabase-chatgpt-migrate

用瀏覽器已登入的 ChatGPT（透過 `ego-browser` skill）執行 Heptabase 白板
筆記轉 Obsidian wikilink 的結構化改寫任務，並用機械化腳本核對輸出完整性。

## 由來

依序試過的方案跟結果：

| 方案 | 結果 |
|---|---|
| opencode + OpenRouter 免費 Qwen3-120b | 思考模式卡進推理迴圈，燒光 token 額度，生不出答案 |
| opencode + Tencent Hy3（免費） | 同樣卡住不動 |
| opencode + OpenRouter 自動路由 | 卡住，中止 |
| 本地 LM Studio + phi-4-mini-instruct（非思考） | 速度可以，但指令遵循能力不夠，連最小單位的格式轉換都做不到 |
| 本地 LM Studio + phi-4-mini-reasoning（思考） | 跟 Qwen3 一樣卡進推理迴圈 |
| **ChatGPT 網頁版（Go 方案，ego-browser 操作）** | **可用，但第一次輸出漏掉一整個區段，且模型自我核對的「總數」不可信** |

最終方案：用 ChatGPT 網頁版執行（品質夠），但**強制加上機械化驗證關卡**
（`scripts/verify_migration.py`），不信任模型自稱做完、自稱數字對。

## 檔案

- `SKILL.md` — 完整流程說明，含實測踩過的坑
- `references/prompt-template.md` — 實測有效的提示詞模板（含補救提示詞）
- `scripts/verify_migration.py` — 比對原始檔案與輸出的連結/圖片項目
  是否完全吻合，純 Python 標準函式庫，不需要額外套件

## 依賴

- `ego-browser` skill（瀏覽器自動化）
- 使用者的 ChatGPT 帳號需已登入且方案有效

## 快速驗證腳本本身

```bash
python3 scripts/verify_migration.py --source 原始.md --output-text "$(cat 輸出.md)"
```
