# grilling

來源：[mattpocock/skills](https://github.com/mattpocock/skills)
的 `skills/productivity/grilling/`（MIT License）。

對計畫或想法做窮追猛打式的壓力測試訪談：把決策拆成樹，分輪只問「前提已經settled」的
frontier 問題，每題附建議答案；查得到的事實自己派 subagent 去查，不問使用者，
只把真正的取捨丟給使用者決定。

本地 `SKILL.md` 用詞與上游略有差異（語氣微調），非逐字同步。

## 跨 agent

上游同時附了 `agents/openai.yaml`（Codex 用的 agent 定義），本地目前只留 `SKILL.md`。
若要在 Codex 裡也用，從上游補一份 `agents/openai.yaml` 進來即可（`grill-with-docs/`
已經有一份可參考）。
