# ui-ux-pro-max

來源：[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
（`.claude/skills/ui-ux-pro-max/`，MIT License，2024 Next Level Builder）。

## 這次修復了什麼

`data/`、`scripts/` 原本是兩個**失效的相對路徑殘留**——內容是純文字
`../../../src/ui-ux-pro-max/{data,scripts}`，指向 repo 外不存在的位置（推測是從上游某個舊版
repo 佈局複製symlink 時沒有正確展開）。`SKILL.md` 裡的 `search.py` 呼叫因此完全跑不起來。

現已改用 `git clone --depth 1` 從上游取出對應的真實檔案（`data/`、`scripts/`、以及上游新增的
`references/`），並實測 `python3 scripts/search.py "fintech crypto" --design-system` 可正常輸出。

## 已知的版本落差（誠實標註，未動 SKILL.md 內容）

本地 `SKILL.md`（658 行）與上游目前 `main` 的 `SKILL.md`（214 行，commit `bc826e2`，2026-08-20）
內容差異很大——上游把大量細節搬進新增的 `references/pro-rules.md`、
`references/quick-reference.md`，並更新了資料集數字（例如 style/palette 數量）。
本地 `SKILL.md` 是較舊的版本，描述的數字（如「161 色票」）可能與現在複製進來的最新資料
（`data/`）對不上，但兩者結構相容——`scripts/search.py` 讀的欄位沒變，實測正常。

如果要完全跟上游同步（含新版 `SKILL.md` 敘述），之後另外處理，這次只修「連結失效」這個
機械性問題，不動內容判斷。
