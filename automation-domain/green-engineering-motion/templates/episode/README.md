# 整集 MG 專案範本（episode）

整集口白教學影片的 Three.js 透明疊圖專案起點。`src/scenes/page.js` 與 `src/config.js` 是**可跑的範例內容**（原作者某一集的版面與口白對位），開新專案時整份替換成自己的課程內容；引擎（`src/engine/*`、`src/scene.js`、`src/app.js`）、`server.mjs`、`tools/*` 為通用，不用改。

## 快速開始

```powershell
# 1. 複製範本到工作位置（不要在技能資料夾內作業）
Copy-Item -Recurse <SKILL_DIR>/templates/episode <PROJECT>
cd <PROJECT>

# 2. 安裝 Node 依賴（three 0.187.0、mediabunny 1.65.1、playwright 1.62.1；需 Node 20+）
npm install

# 3. ffmpeg：把 ffmpeg.exe 放到 tools/bin/，或 $env:MG_FFMPEG='C:\path\to\ffmpeg.exe'，或讓 ffmpeg 在 PATH 上

# 4. Python（轉寫與驗證用）：python -m pip install faster-whisper numpy pillow av
#    不想裝進系統：python -m pip install --target tools/python-packages ...，或設 MG_PY_PACKAGES

# 5. 放入使用者提供的輸入（不隨範本提供）
python tools/prepare.py <SLIDES>.pptx <NARRATION>.mp4   # 產生 assets/narration.{mp4,wav}、narration-asr.wav、review/source-slides.json
python tools/transcribe.py                               # review/alignment.json（faster-whisper small，首次執行會下載模型）

# 6. 改 src/config.js（SCENE_ID、PARTS、FRAMES）與 src/scenes/page.js，預覽
node server.mjs                                          # http://127.0.0.1:4222/
node tools/cuesync.mjs ; node tools/still.mjs ... ; node tools/audit.mjs

# 7. 輸出與驗證
node tools/render.mjs ; node tools/verify.mjs ; node tools/finalize.mjs
node tools/smoke.mjs ; node tools/render.mjs --check-only
```

## 使用者輸入（不隨範本提供）

| 檔案 | 說明 |
| --- | --- |
| `assets/narration.mp4`／`.wav`／`narration-asr.wav` | 口白（`prepare.py` 由你的音檔產生）。沒有它，預覽可載入、可 `renderAt`，但不能播放原音、不能 `render`／`verify` |
| `assets/reference-01.png` | 選用：開場老師置中的比例參考圖（編輯器的「開場人像比例參考」、`render.mjs` 的 center 預覽背景、`sheet.py`） |
| `review/source-slides.json`、`review/alignment.json` | 由 `prepare.py`、`transcribe.py` 產生，含課程內容，已列入 `.gitignore` |

## 環境變數

`PORT`（預設 4222）、`MG_LISTEN`（預設 127.0.0.1，不允許 0.0.0.0）、`MG_ALLOWED_HOSTS`、`MG_URL`（工具連線的預覽網址）、`MG_FFMPEG`、`MG_PYTHON`、`MG_PY_PACKAGES`、`MG_MODELS`（Whisper 模型資料夾）、`MG_OFFLINE=1`（只用本機模型）、`MG_FONT`（CJK 字型檔，供 Python 製圖）、`MG_TMP`、`MG_SMOKE_PORT`、`MG_EXPORT_DIR`。

## 內容

- `tools/initial-prompt.txt`：轉寫的詞彙提示，換成你的課程用語。
- `examples/opening-page.js`：另一種開場（老師置中、深色底）的 `page.js` 參考，僅程式碼。
- `layout.json`：空的起始版面（`revision: 0`）；版面編輯器存檔後屬於使用者。
- 遠端（例如 Tailscale）使用：`$env:MG_LISTEN='127.0.0.1,<tailnet-ip>'; node server.mjs`；Host 白名單可用 `MG_ALLOWED_HOSTS` 追加。伺服器只綁指定位址，不改防火牆。

完整製作流程、陷阱與檢查清單見技能的 `SKILL.md` 與 `references/`。
