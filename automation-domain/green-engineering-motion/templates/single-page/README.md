# 單頁 MG 專案範本（single-page）

一頁一個教學關係的 Three.js 透明動畫專案起點。`src/scenes/page.js`、`src/config.js`（`CUES`、`IDLE`、`FRAMES`）是**可跑的範例內容**（時間軸／能源轉換，約 36.4 s），開新頁面時替換成自己的內容；引擎、`server.mjs`、`tools/*` 通用。

## 快速開始

```powershell
Copy-Item -Recurse <SKILL_DIR>/templates/single-page <PROJECT>
cd <PROJECT>
npm install                                  # three 0.187.0、mediabunny 1.65.1、playwright 1.62.1；Node 20+
# ffmpeg：放到 tools/bin/ffmpeg.exe，或 $env:MG_FFMPEG='C:\path\to\ffmpeg.exe'，或在 PATH 上
# Python（選用，逐字對位／封裝）：python -m pip install faster-whisper numpy pillow
$env:PORT='4206'; node server.mjs            # http://127.0.0.1:4206
$env:MG_URL='http://127.0.0.1:4206'
node tools/render.mjs                        # 或在編輯器按「輸出影片」
node tools/verify.mjs [exports\renders\<資料夾>]
node tools/smoke-editor.mjs                  # 埠 4213，暫存版面
node tools/storyboard.mjs review\storyboard.jpg 1.6 2.9 ... --cols=4
```

## 使用者輸入（不隨範本提供）

| 檔案 | 說明 |
| --- | --- |
| `assets/narration.wav` | 該頁口白（48 kHz 立體聲）。沒有它，預覽可載入、可 `renderAt`，但不能播放原音，`render.mjs`／`verify.mjs` 會失敗 |
| `assets/narration-asr.wav` | 16 kHz 單聲道，給 `tools/align_narration.py`（逐字對位，輸出 `review/narration-word-alignment.json`） |
| `assets/source-slide-004.png` | 選用：原簡報該頁截圖，只有 `tools/compare-source.mjs`（原稿 vs MG 並排）用到；場景本身不需要 |

## 內容與環境變數

- `tools/initial-prompt.txt`：逐字對位的詞彙提示，換成你的課程用語。
- `layout.json` 為空的起始版面；`tools/verify.mjs` 的 `P3_ENDPOINT`（選用）可指定上一頁的 `Endpoint-Transparent.png`，用來檢查第 0 格交接。
- 環境變數：`PORT`、`MG_URL`、`MG_FFMPEG`、`MG_PY_PACKAGES`、`MG_MODELS`、`MG_LAYOUT_FILE`、`MG_EXPORT_DIR`。

## 交接規格

第 0 格只有標題底線，其餘 alpha 0；最後 `EXIT_FRAMES` 格淡出回同一狀態，與下一頁接點 0 像素差。文字 ≥ 40 px、右緣 ≤ 1232。細節見技能的 `SKILL.md` 與 `references/`。
