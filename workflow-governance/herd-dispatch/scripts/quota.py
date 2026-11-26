#!/usr/bin/env python3
"""查各家訂閱額度，給派工決策用。用法：quota.py [--json]
- Codex：經 `codex app-server` 的 account/rateLimits/read 讀 5 小時／每週用量與 reset 券（唯讀，不消耗券）。
- Claude、agy：沒有可程式化讀取的介面，只印出查詢方式。
"""
import json, subprocess, select, sys, time, datetime as dt

def codex_limits(timeout=25):
    try:
        p = subprocess.Popen(["codex", "app-server"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=subprocess.DEVNULL, text=True)
    except FileNotFoundError:
        return {"error": "codex 未安裝"}
    def send(o):
        p.stdin.write(json.dumps(o) + "\n"); p.stdin.flush()
    try:
        send({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"clientInfo": {"name": "herd-quota", "version": "1"}}})
        send({"jsonrpc": "2.0", "method": "initialized"})
        send({"jsonrpc": "2.0", "id": 2, "method": "account/rateLimits/read"})
        end = time.time() + timeout
        while time.time() < end:
            r, _, _ = select.select([p.stdout], [], [], 1)
            if not r:
                continue
            line = p.stdout.readline()
            if not line:
                break
            try:
                o = json.loads(line)
            except ValueError:
                continue
            if o.get("id") == 2:
                return o.get("result") or {"error": o.get("error")}
        return {"error": "逾時"}
    finally:
        p.kill()

def ts(t):
    return dt.datetime.fromtimestamp(t).strftime("%m-%d %H:%M") if t else "?"

def main():
    r = codex_limits()
    if "--json" in sys.argv:
        print(json.dumps({"codex": r}, ensure_ascii=False, indent=1)); return
    print("== Codex（ChatGPT）")
    if "error" in r:
        print("  讀取失敗：", r["error"])
    else:
        rl = r.get("rateLimits") or {}
        for k, name in (("primary", "5 小時"), ("secondary", "每週")):
            w = rl.get(k) or {}
            print(f"  {name}：已用 {w.get('usedPercent', '?')}%，{ts(w.get('resetsAt'))} 重置")
        cr = r.get("rateLimitResetCredits") or {}
        av = [c for c in cr.get("credits", []) if c.get("status") == "available"]
        av.sort(key=lambda c: c.get("expiresAt", 0))
        soon = [c for c in av if c.get("expiresAt", 0) - time.time() < 7 * 86400]
        print(f"  reset 券：{len(av)} 張可用" + (f"，最早 {ts(av[0]['expiresAt'])} 到期" if av else ""))
        if soon:
            print(f"  ⚠ {len(soon)} 張 7 天內到期 → 優先派工給 Codex 高階模型")
    print("== Claude：主控自己用 /usage 查（或 statusline 的 rate_limits）")
    print("== agy（Google）：在 agy 互動畫面查用量；碰到 quota 錯誤就改派其他家")

if __name__ == "__main__":
    main()
