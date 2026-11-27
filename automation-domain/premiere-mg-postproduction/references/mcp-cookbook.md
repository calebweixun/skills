# MCP 工具手冊

MCP 只直接開放 5 個工具：`search_tools`、`get_tool_schema`、`invoke_tool`、`verify_premiere_connection`、`list_sequences`。其他 280 多個 Premiere 操作都要先用 `search_tools` 找到名稱，再透過 `invoke_tool`（`{"name":..., "arguments":{...}}`）呼叫。不要自己編造工具名稱。

## 本流程用到的工具

| 用途 | 工具 | 參數（實測可用） |
|---|---|---|
| 連線檢查 | `verify_premiere_connection` | `{}` |
| 列出序列 | `list_sequences` | `{}`，回傳 id、name、duration、軌道數 |
| 列出軌道與片段 | `list_sequence_tracks` | `{"sequenceId"}`，回傳 `videoTracks[].clips[]`，每個片段有 `id`、`name`、`startTime`、`endTime` |
| 讀效果 | `get_effect_properties` | `{"clipId","sequenceId"}`，資料在 `data.components[].properties[]` |
| 改參數 | `set_effect_property` | `{"clipId","sequenceId","effectName":"Lumetri Color","propertyName":"Exposure","value":0.9}`，回傳 `before`、`after` |
| 匯出畫面 | `export_frame` | `{"sequenceId","time":秒,"outputPath":"C:\\...\\x.png","format":"png"}` |
| 字幕 | `create_caption_track`、`read_sequence_captions` | 見 [字幕流程](captions.md) |
| 原生腳本 | `execute_extendscript` | **執行前必須取得使用者同意** |

## 已知的坑（全部實際遇過）

1. **非目前序列的片段找不到**：只給 `clipId` 時，查找範圍只有目前開著的序列，會回 `Clip not found`。處理其他序列一律加上 `sequenceId`。
2. **效果順序是反的**：`components` 裡一般效果的排列順序和「效果控制」面板相反（`Opacity`、`Motion` 這兩個固定效果在最前面）。判斷順序要請使用者截圖面板。
3. **同名參數**：Lumetri 裡的 `Temperature`、`Tint`、`Contrast`、`Saturation`、`Sharpen` 各出現兩次。`set_effect_property` 只會改到第一個：前四個的第一個是「基本校正」，`Sharpen` 的第一個是「創意」。第二個屬於 HSL 次要校正，只能用 `execute_extendscript` 修改，需使用者同意。
4. **區段的布林值不可信**：`Basic Correction=false`、`Light=false` 這類值是 UI 區段的展開狀態，不代表該區段沒有作用。
5. **顏色值精度遺失**：`White Balance`、`Key Color` 這類顏色會以 64 位元整數回傳，經過 JSON 後精度已經掉了，不能拿來判斷實際顏色。
6. **Windows 路徑**：`export_frame` 的 `outputPath` 要用反斜線（JSON 裡寫成 `\\`）。用正斜線曾得到 `Unknown error exception`。在 bash heredoc 或某些工具裡，`\\` 會被吃成單一反斜線，因此 `mcpcall.mjs` 提供 `"WIN<C:/a/b.png>"` 的寫法，由它自動轉換。
7. **一次只送一個指令**：bridge 透過檔案逐一處理指令，不要同時送出多個呼叫。批次作業請在一個迴圈裡依序執行，長時間的工作放到背景跑。
8. **`verify_premiere_connection` 會自動開啟 Premiere**：Premiere 沒在執行時，呼叫它會直接啟動 Premiere，然後回傳 `bridge_unavailable`（`launched: true`）。只想確認狀態時，先用 `Get-Process 'Adobe Premiere Pro'` 檢查 Premiere 有沒有在跑。
9. **輸出很長**：一個片段的 `get_effect_properties` 大約 12 KB。先存成檔案，再用 node 挑出需要的欄位，不要整包塞進對話。

## 不在對話內工具時：`scripts/mcpcall.mjs`

```bash
export PREMIERE_MCP_ENTRY='C:/path/Adobe_Premiere_Pro_MCP/dist/index.js'
export PREMIERE_TEMP_DIR='C:/Users/<user>/AppData/Local/Temp/premiere-mcp-bridge'
node scripts/mcpcall.mjs verify_premiere_connection
node scripts/mcpcall.mjs list_sequence_tracks '{"sequenceId":"..."}' > tracks.json
node scripts/mcpcall.mjs set_effect_property '{"clipId":"000f4256","sequenceId":"...","effectName":"Lumetri Color","propertyName":"Exposure","value":1.2}'
node scripts/mcpcall.mjs export_frame '{"sequenceId":"...","time":90,"outputPath":"WIN<C:/tmp/f_90.png>","format":"png"}'
```

不在上面 5 個開放工具裡的名稱，`mcpcall.mjs` 會自動改用 `invoke_tool` 包裝，輸出為 `structuredContent` 的 JSON。

## 批次套用範本（bash）

```bash
SQ=<sequenceId>
for id in 000f4257 000f4258; do
  for kv in Temperature:4 Tint:5 Exposure:1.2; do
    node scripts/mcpcall.mjs set_effect_property \
      "{\"clipId\":\"$id\",\"sequenceId\":\"$SQ\",\"effectName\":\"Lumetri Color\",\"propertyName\":\"${kv%%:*}\",\"value\":${kv#*:}}" \
      | grep -q '"success": true' || echo "FAIL $id $kv"
  done
done
```

套用完要把每一段的數值讀回來，確認全部一致，再回報給使用者。
