# grill-with-docs

來源：[mattpocock/skills](https://github.com/mattpocock/skills)
的 `skills/engineering/grill-with-docs/`（MIT License）。

`grilling` 的組合版：一邊做窮追猛打式訪談，一邊順手用 `domain-modeling` 把過程中定案的
術語與架構決策寫進 `CONTEXT.md`／ADR，不用事後補。依賴 `grilling` 與 `domain-modeling`
這兩個 skill 同時存在。

`disable-model-invocation: true`——不會被自動觸發，需要使用者明確叫（例如 `/grilling`
搭配本 skill 的指示）。

## 跨 agent

`agents/openai.yaml` 是給 Codex 用的 agent 定義，來源同一個上游 repo，隨本 skill 一起帶著走。
