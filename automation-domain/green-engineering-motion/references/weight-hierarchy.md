# 字重與層級（第 4 輪稽核結論）

Font: Microsoft JhengHei; installed files msjh.ttc (regular 400), msjhbd.ttc (bold 700), msjhl.ttc (light 300). The engine draws text to canvas with CSS weights, so 300/400/700 select real faces. Rounds 1-3 used weight 700 (`bold()`) or the engine default 600, which also resolves to the bold face, hence "bold everywhere". Light (300) was not used: at 40-46 px on tinted chips it reads too thin; regular is the lightest weight applied.

Hierarchy: page title (60) bold · section heading, key term, concept label, emphasised conclusion, numbers in discs, tier names, stage names and the four course goals bold · explanatory sub-lines, captions, diagram part labels, list/chip step text, TRL descriptions, pyramid sub-lines, axis labels regular · speech bubbles mixed (keyword bold; connective words and the question regular). Sizes: regular sub-lines raised 40 → 42 where layout allowed; nothing below 40.

layout.json (revision 8) weight overrides: none — the layout schema has no weight field (x, y, scale, rotation, fontSize, boxWidth, hidden, locked, text, textAlign, color). Its three text overrides (text-d3904a01 TRL kicker, text-6241a492 spectrum caption, text-cd78d8ec 倒車距離感測器) only replace the string; they still apply and the underlying objects were restyled.

逐物件稽核表含課程文字，未隨技能分享；用 `node tools/audit.mjs` 為自己的專案產生。
