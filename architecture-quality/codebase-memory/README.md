# codebase-memory

來源：[DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)（MIT License）。

高效能的程式碼智慧 MCP server：把 codebase 索引成持久化知識圖，158 種語言、毫秒級查詢，
token 用量比直接讀檔省約 99%。單一靜態執行檔、零依賴。

這個 skill 教 agent 怎麼用該 MCP 的工具（`search_graph`、`trace_path`、`get_code_snippet`、
`query_graph`、`get_architecture`、`search_code`）做結構化查詢：找函式/類別、追呼叫鏈、
查依賴、抓死碼、算 fan-out。

## 依賴

需要先裝好並啟用 `codebase-memory-mcp` 這個 MCP server，本 skill 只是教怎麼用它的工具，
不含 server 本體。安裝方式見上游 repo README（支援 Claude Code、Codex、Gemini CLI、
Cursor、Windsurf 等多個 MCP host）。
