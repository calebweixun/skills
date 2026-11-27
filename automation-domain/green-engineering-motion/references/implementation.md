# 單頁實作、輸出與檢查

本檔是單頁與引擎層面的實作細節。整集口白影片的時間對位、字重、版面編輯器、輸出標示與驗證，以 [episode-production.md](episode-production.md) 與 [qa-checklist.md](qa-checklist.md) 為準；兩者衝突時以後者為準。有口白的單頁同樣要做逐字對位（元素在關鍵詞前 ≤ 0.2 s 進場）。字級以 1920×1080 像素計：教學文字 ≥ 40 px、來源／註腳 ≥ 24 px。

## 以原頁為素材與 endpoint 依據

先檢視指定投影片及其中物件。抽取原始圖片可保留一致性；複雜裁切、背景移除、duotone、翻轉等效果，以 PowerPoint 匯出的外觀作為參考。

拆分背景、動態圖示、可讀標籤、連接線、遮罩及裝飾。保留原圖像內容和相對圖層。若用原生 Three.js 幾何、SVG 或文字重建，對照原稿確認形狀、比例及術語。

### 座標

由簡報尺寸換算到 1920 × 1080：

```text
xPx = xEMU / slideWidthEMU * 1920
yPx = yEMU / slideHeightEMU * 1080
wPx = wEMU / slideWidthEMU * 1920
hPx = hEMU / slideHeightEMU * 1080
worldCenterX = xPx + wPx/2
worldCenterY = 1080 - (yPx + hPx/2)
```

正交相機可採 left=0、right=1920、top=1080、bottom=0，使一個世界單位對應一個輸出像素。依本頁的實際比例處理，不把片頭使用過的 point × 2 當成一般規則。

PNG 若裁掉透明外圍，必須補償中心點：

```text
newCenterX = oldCenterX + ((cropLeft+cropRight)/2 - oldImageWidth/2) * pixelsPerTexel
newCenterY = oldCenterY + ((cropTop+cropBottom)/2 - oldImageHeight/2) * pixelsPerTexel
```

旋轉過的 PowerPoint shape 匯出圖可能已包含旋轉，且 PNG 是實際可見範圍。確認實際邊界和中心，避免重複旋轉。片頭的 Shape.Export 當時量得 8/3 倍影像比例；這個結果須依新的投影片和匯出設定重新核對。

### 白底和遮擋

只清除確認是外部背景的區域；從外部 flood fill 可以保留封閉的白色臉部、頭盔及圖示內部細節。用深色與淺色背景都看一次，檢查白框、灰邊和破洞。

外部白色有時是原稿的遮擋設計。片頭城市的白色放射形狀會遮住後方節點和軌道；清除後曾露出不該看見的內容。可將這類原稿遮罩分層，配合轉場恢復，維持 endpoint 外觀。

這是素材分離與清理流程。新繪圖片或改變圖片內容時，依使用者選擇及環境適用工具處理。

## 動畫狀態

讓 `renderAt(timeSeconds)` 完整決定當下畫面。每次計算都設定位置、旋轉、比例、透明度、可見性、圖層順序、shader uniforms 和路徑進度，支援從後往前定位。

將段落時間集中於設定。進場、閱讀停留、主要過程、轉場、回彈及定格分開控制，避免只靠一個全域時間縮放修正所有動作。

群組以本頁關係建立：需要一起轉向的圖示共用父群組，仍保留各自 endpoint。群組縮放／旋轉時，先算 pivot 的變換位置，再以位移補償，使指定中心落在預期位置。

需要靜止的時間段明確重設到 endpoint，停止浮動、噪點、光軌、輕微旋轉等視覺變化。不同時間定位應得到相同影格，而非依賴上一次播放狀態。

## 固定規格與可用框架

```js
const WIDTH = 1920, HEIGHT = 1080;
const FPS = 60000 / 1001;
const DT = 1001 / 60000;
const durationSeconds = frameCount * DT;
// frame i: renderAt(i * DT); encode with timestamp i*DT and duration DT.
```

影格數取整數，並回報實際片長；例：360 影格為 6.006 秒、480 為 8.008 秒。以本頁設定為準。

預覽顯示大小不影響內部畫布。輸出時確認 drawing buffer 是 1920 × 1080，避免螢幕 DPR 讓輸出意外變為 4K。

Three.js 貼圖設定 sRGB，保留透明度；依實作檢查 depthTest、depthWrite、renderOrder，維持插圖的前後關係。採用自訂 shader 時，保持色彩空間轉換一致。

預覽可用 requestAnimationFrame 跟隨真實時間；影片輸出逐格取樣。共用同一個 `renderAt`，使預覽速度、掉格或螢幕更新率不改變成片時間。

## 輸出格式

- 一般成片：可沿用 Mediabunny CanvasSource → AVC/H.264 MP4，video track 使用精確 FPS。片頭目標為 24 Mbps，實際 VBR 不一定等於目標。
- 透明圖示：使用透明 PNG 序列，或實際驗證有 alpha 的影片格式。H.264 MP4 為不透明成片；依任務選擇透明輸出及可觀看的合成預覽。
- 原圖分層：保留可編輯素材與 layout／設定；使用者可繼續調整顏色、時長和位置。

預覽 canvas 的 alpha 設定、背景 clear、shader 和截圖流程也必須符合透明需求。不要只讓 CSS 看起來透明便宣稱輸出有 alpha。

## 檢查實際結果

本課程預設左側 65–70% 為內容區，右側留給老師；只有明確指定全頁面才放寬。除目視檢查外，透明成片可解碼 alpha，確認進場、中段、轉場與落位都未侵入右側保留區。核對最終縮放後的字級與手機觀看可讀性，並確認原素材的資料來源已清楚附註。

挑選與本頁教學內容相關的檢查，保留必要的技術確認：

1. 檢視原頁、進場、中段、落位和最後畫面。檢查裁切、圖層、標籤可讀性與教學順序。
2. 核對要求同步的物件實際同時加入，要求先後的過程順序正確。
3. 任意前後定位能重現同一影格；若尾段應定格，尾段首尾影格可用雜湊確認相同。
4. 循環圖示檢查循環接點：最後一格與第一格銜接無跳動（比對首尾影格與 loop 前後數格）。
5. 從實際輸出檔檢查尺寸、影格數、時間戳和固定 FPS；不能只讀 config 就宣稱成片通過。
6. 解碼成片的代表時間，確認畫面和預覽一致。需要透明時，檢查輸出 alpha。

片頭曾遇到：以 HTMLVideoElement 在第一次 `seeked` 後立刻 drawImage，得到黑色畫面；以 Mediabunny CanvasSink 解碼相同時間的實際樣本則正確。若遇到此情況，先區分播放器呈現時機與真正的影片缺陷，避免誤改動畫或編碼。

可參考現有 `tools/verify.mjs` 的 `Input`／`CanvasSink.getCanvas(time)` 實際樣本解碼方式。更換頁面後，把片頭專用的位置斷言、取樣區域、章節和固定影格數改成本頁的驗收條件。

## Windows 與多個 agent

每頁獨立資料夾和可用埠。例如第 7 頁可考慮 4207，實際先確認未被其他工作使用。啟動伺服器的同一個 shell 設定 `PORT`；輸出與驗證命令的 shell 另設 `MG_URL`，避免工具連到片頭。

```powershell
$env:PORT = '4207'
node server.mjs
# 另一個命令／shell：
$env:MG_URL = 'http://127.0.0.1:4207'
node tools/render.mjs
node tools/verify.mjs
```

背景啟動 Node 伺服器使用隱藏視窗及本頁的 log 檔案，確認 HTTP 成功後再回報 URL。檔案已寫出、伺服器運作、預覽已開啟，是三個不同狀態，依實際結果回報。

若 PowerShell 能執行 node，而 npm 子命令找不到 node，可直接呼叫對應 JS 工具，或只在當次 shell 清理 PATH 中多餘引號；保留使用者的全域環境設定。

使用中文／空白路徑時，以 URL 與檔案路徑的適當 API 轉換。Node 的檔案 URL 用 `fileURLToPath()` 轉回 Windows 路徑；直接拿 `.pathname` 寫檔曾產生 `%E7...` 這類錯誤資料夾。Windows PowerShell 5.1 執行含中文的腳本時留意 UTF-8 BOM。

需要文件、影像或瀏覽器執行環境時，用現有環境的 workspace dependency 工具定位；避免假設系統預設 Python 已安裝 Pillow。

## 交付內容

回報本頁資料夾、預覽 URL、成片或透明序列位置、實際片長／規格，以及已檢查的行為。提出下一輪修改時指出可調整的時間、角度、路徑和 endpoint 設定，保留上一版成品以供比較。
