# ep0 風格量測筆記（比例與密度基準）

來源：作者從 ep0 成片的 MG 段落量測，對照整集範例第一輪／第二輪。靜格與老師位置圖屬於課程素材，未隨技能分享；以下數字可直接作為基準。


| item | ep0 (measured from stills + source code) | episode 2 round 1 | episode 2 round 2 |
| --- | --- | --- | --- |
| title | 60 px bold blue at x=60, baseline y≈94; rule y=158 (3 px) + 135×8 teal accent | same | same |
| body / label text | 40–44 px (labels 44 bold, sub 40 regular, 42 for lead sentences); footnote 24 | titles of cards 50–54, many 40 | labels 42–52 bold, sub/body 40–44, nothing below 40 |
| line pitch | ≈1.35 × font size | same engine | same engine |
| icons | free-standing, 180–330 px tall (turbine ≈250, factory ≈280, flow icons ≈200); no card around them | 88–176 px inside 220 px tinted cards | 250–300 px discs (r 128–150) or free drawings, 1 icon per column |
| cards / panels | almost none; thin accent bars, one tinted block at most | tinted full-width cards stacked 3–4 high | tint only for stage stripes, panels and chips; ≤ 3 tinted blocks per frame |
| content width | x 60–1240; teacher zone x>1280 untouched | same | same (export-check passes; tail of speech bubbles ends at x=1274) |
| ink coverage of content area (x60–1240, y190–1020) | 2–17 %, typical ≈ 9 % (open layouts with large whitespace) | 20–30 % | ≈ 8–16 % |
| margins | left 60, top of body ≈ 190–205, bottom ≤ 1000 (bottom-left blue decoration below y 1020) | same | same; bottom row of chips ends y ≈ 1005 |
| build order | one idea at a time, left → right / top → bottom; things remain on screen | everything pre-built, early | cumulative, each element on its spoken word |

Teacher position (from ep0 stills; the narration source has no video track): head x ≈ 1460–1690, y ≈ 180–470, mouth ≈ (1590, 400), shoulders x ≈ 1300–1880. Speech bubbles therefore sit at x 640–1180, y 222–575 with the tail tip at (1274, 380–400), pointing at the mouth while staying inside the x<1280 content zone (the transparent master must be empty at x≥1280).
