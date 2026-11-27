# 環境安裝與排錯（Windows 為主）

MCP 來源：[hetpatel-11/Adobe_Premiere_Pro_MCP](https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP)（MIT）。實際驗證版本：v1.2.11（commit `b866e64`），搭配 Premiere Pro 2027（27.0.0 build 88）、CEP 12.0.1 與 Node.js 24。

## 架構

```text
Claude Code ──stdio──> MCP server (node dist/index.js)
                          │  以檔案交換指令（PREMIERE_TEMP_DIR）
                          ▼
             Premiere 內的 CEP 面板「MCP Bridge (CEP)」──ExtendScript──> 專案
```

MCP server 和面板必須指向**同一個** bridge 資料夾。面板每次輪詢都會寫入 `bridge-heartbeat.json`；若這個檔案超過 2.5 秒沒更新，server 就判定 bridge 沒在跑。

## 安裝

```bash
git clone https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP.git
cd Adobe_Premiere_Pro_MCP
npm run setup:win
```

`setup:win` 會依序做這些事：`npm install`、`npm run build`、把 `HKCU\Software\Adobe\CSXS.9`～`15` 的 `PlayerDebugMode` 設成 `"1"`、把面板複製到 `%APPDATA%\Adobe\CEP\extensions\MCPBridgeCEP`、建立 `%TEMP%\premiere-mcp-bridge`，最後寫入 VS Code Copilot 和 Claude Desktop 的 MCP 設定。

## 註冊到 Claude Code

這一步要用 **bash** 執行。PowerShell 會把 `--` 吃掉，導致出現 `missing required argument 'commandOrUrl'` 錯誤。

```bash
claude mcp add premiere-pro --scope user \
  -e PREMIERE_TEMP_DIR='C:\Users\<user>\AppData\Local\Temp\premiere-mcp-bridge' \
  -- 'C:\path\to\node.exe' 'C:\path\to\Adobe_Premiere_Pro_MCP\dist\index.js'
claude mcp get premiere-pro   # 應顯示 ✔ Connected
```

剛註冊時，目前這個對話不會出現 `mcp__premiere-pro__*` 工具。可以開新對話，或在原對話裡改用 `scripts/mcpcall.mjs`。

## 在 Premiere 裡啟用

1. 完全關閉 Premiere 再重開（先存檔）。
2. 開啟 `視窗 > 擴充功能 > MCP Bridge (CEP)`。
3. Temp Directory 填 bridge 資料夾的路徑，依序按 Save Configuration → Start Bridge → Test Connection。
4. 呼叫 `verify_premiere_connection`，確認回傳 `connected`。

## 排錯

### build 失敗：`'"node"' is not recognized`
原因是系統 PATH 裡有某一筆帶了多餘的引號，例如 `C:\Program Files\GitHub CLI"`。cmd 一遇到它，排在後面的 PATH 全部失效，npm 的 `.cmd` shim 因此找不到 node。

- 確認方法：`cmd /d /c "echo %PATH%"`，找出含 `"` 的那一筆。
- 暫時解法：在同一個程序裡先把 PATH 清乾淨再跑 setup。
  ```powershell
  $env:Path = ($env:Path -split ';' | Where-Object { $_ -and $_ -notmatch '"' }) -join ';'
  npm run setup:win
  ```
- 根本解法：這屬於系統設定，請使用者用**系統管理員身分**的 PowerShell 執行。若壞掉的那筆在 User PATH，把 `Machine` 改成 `User`：
  ```powershell
  $p=[Environment]::GetEnvironmentVariable('Path','Machine'); [Environment]::SetEnvironmentVariable('Path', (($p -split ';' | Where-Object { $_ -and $_ -notmatch '"' }) -join ';'), 'Machine')
  ```

### 點了「MCP Bridge」選單卻什麼都沒出現
1. 在 `HKCU\Software\Adobe\CSXS.12` 新增 `LogLevel="6"`，然後查看 `%TEMP%\CEP12-PPRO.log`。
2. 若看到 `Signature verification failed for extension com.mcp.premiere.cepbridge.panel`，代表 CEP 12（Premiere 26.5 以後）即使開了 `PlayerDebugMode` 也拒絕載入未簽章的擴充（參考上游 issue #100、#121）。
3. 解法是自簽面板，執行 `scripts/sign-cep.ps1`：
   - 它需要 Adobe 官方的 `ZXPSignCmd.exe` 4.1.103 win64，來源是 [Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD/4.1.103/win64)，約 5.5 MB。**下載前要取得使用者同意**，下載後確認 Authenticode 簽章為 `Adobe Inc.` 且狀態 `Valid`。
   - 腳本會建立本機自簽憑證（密碼隨機產生並存在本機）、簽署 `cep-plugin`、驗證簽章，再把結果解壓覆蓋到 extensions 資料夾，裡面會多出 `META-INF\signatures.xml` 和 `mimetype`。
4. 再次完全關閉並重開 Premiere。
5. **每次重跑 `setup:win` 都會蓋掉簽章，必須重新執行 `sign-cep.ps1`。**

### `verify_premiere_connection` 回 `bridge_unavailable`，但面板明明在跑
- 檢查 `bridge-heartbeat.json` 的 `t` 和現在時間相差多少，應該小於 2.5 秒。
- 檢查 MCP server 拿到的 `PREMIERE_TEMP_DIR` 是不是同一個資料夾。曾發生過的狀況：從 bash 腳本傳入時反斜線被吃掉，路徑變成 `C:Users<user>AppData...`。路徑一律用正斜線或 `scripts/mcpcall.mjs` 的 `WIN<...>` 包法傳入。
