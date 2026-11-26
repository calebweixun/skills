#!/usr/bin/env python3
"""撞到用量上限時，等限制解除後自動叫 agent 續跑。

用法（在 hc 終端裡跑，才能在協調者離開後繼續守著）：
  hc run --bg --outlive-parent --name resume-t6 python3 resume.py t6
  hc run --bg --outlive-parent --name resume-me python3 resume.py $HC_TERMINAL_ID --persist

  <t>            要守的終端（Codex／agy／Claude Code 都可以，也可以是協調者自己）
  --persist      任務做完也不結束，繼續守下一輪（守協調者自己時用）
  --message TXT  續跑時送出的訊息（預設：額度已恢復，請從中斷處繼續）
  --max-rounds N 最多續跑幾次（預設 12）
  --fallback-min 解析不出重置時間時，第一次等幾分鐘（預設 30，之後倍增，上限 180）
  --dry-run      只判斷、不等待也不送出（測試用）

判斷方式：agent 停下來（不是 working）時讀畫面最後 30 行，比對各家「用量上限」字樣。
重置時間：Codex 直接讀 account/rateLimits；Claude／agy 從畫面解析「resets 5pm」「try again at 8:55 PM」之類的時間，
解析不到就退避等待。人需要介入（blocked：權限、問題）時只回報、不代送。不會消耗 Codex reset 券。
"""
import argparse, datetime as dt, json, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

LIMIT_RE = re.compile(
    r"hit your (usage )?limit|usage limit reached|limit will reset|rate limit(ed| reached| exceeded)|"
    r"RESOURCE_EXHAUSTED|quota (exceeded|exhausted)|exhausted your|try again at|429 Too Many", re.I)
BUSY_RE = re.compile(r"Working \(|Waiting for background terminal|esc to interrupt|Generating\.\.\.", re.I)
AUTO_RE = re.compile(r"continues automatically when it resets", re.I)
TIME_RE = re.compile(r"(?:reset[s]?(?: at)?|try again at|available at)\s*(?:[A-Za-z]{3,9}\.? \d{1,2}(?:st|nd|rd|th)?,? (?:\d{4} )?)?"
                     r"(?:at )?(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?", re.I)


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def hc(*args, timeout=None):
    r = subprocess.run(["hc", *args], capture_output=True, text=True, timeout=timeout)
    return r.stdout


def get(t):
    try:
        return json.loads(hc("get", t, "--json"))
    except ValueError:
        return {}


def screen_tail(t, n=30):
    lines = [l for l in hc("read", t, "--lines", "0").splitlines() if l.strip()]
    return "\n".join(lines[-n:])


def parse_reset(text, now):
    """從畫面文字找最後一個重置時間；找不到回傳 None。"""
    best = None
    for m in TIME_RE.finditer(text):
        h, mi, ap = int(m.group(1)), int(m.group(2) or 0), (m.group(3) or "").lower().replace(".", "")
        if ap == "pm" and h < 12:
            h += 12
        if ap == "am" and h == 12:
            h = 0
        if h > 23 or mi > 59:
            continue
        t = now.replace(hour=h, minute=mi, second=0, microsecond=0)
        if t <= now:
            t += dt.timedelta(days=1)
        best = t
    return best


def codex_reset(now):
    try:
        from quota import codex_limits
    except ImportError:
        return None
    r = codex_limits()
    rl = (r or {}).get("rateLimits") or {}
    full = [w for w in (rl.get("primary"), rl.get("secondary")) if w and w.get("usedPercent", 0) >= 99]
    if not full:
        return None
    return dt.datetime.fromtimestamp(max(w["resetsAt"] for w in full))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("terminal")
    ap.add_argument("--persist", action="store_true")
    ap.add_argument("--message", default="（自動續跑）用量限制已解除，請從中斷處繼續剛才的任務；已完成的部分不要重做。")
    ap.add_argument("--max-rounds", type=int, default=12)
    ap.add_argument("--fallback-min", type=int, default=30)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    t, rounds, backoff, seen_turn = a.terminal, 0, a.fallback_min, None
    handled = set()  # 已處理過的上限訊息行，避免續跑後殘留在畫面上又被觸發

    while rounds < a.max_rounds:
        info = get(t)
        if not info:
            log("找不到終端", t); return 3
        if info.get("state") == "finished":
            log(t, "已結束，停止守候"); return 0
        st = (info.get("status") or {}).get("state") if isinstance(info.get("status"), dict) else info.get("status")
        if st == "working":
            hc("wait", t, "--timeout", "1800", timeout=1900)
            continue
        if st is None and BUSY_RE.search(screen_tail(t, 12)):
            # Codex 等不回報狀態的 agent：看畫面判斷仍在工作
            hc("wait", t, "--timeout", "190", timeout=260)
            continue
        if st == "blocked":
            log(t, "需要人介入（blocked），不代送：", screen_tail(t, 8)); return 9
        tail = "\n".join(l for l in screen_tail(t).splitlines() if l.strip() not in handled)
        if not LIMIT_RE.search(tail):
            if a.persist and not a.dry_run:
                seen_turn = info.get("turn")
                log(t, f"停在第 {seen_turn} 輪，沒撞限制；等下一輪")
                # 等它開始新的一輪再判斷（事件驅動，不輪詢）
                p = subprocess.Popen(["hc", "events", "--terminal", t, "--json"], stdout=subprocess.PIPE, text=True)
                for _ in p.stdout:
                    i2 = get(t)
                    s2 = (i2.get("status") or {}).get("state") if isinstance(i2.get("status"), dict) else i2.get("status")
                    if i2.get("state") == "finished" or s2 == "working":
                        break
                p.kill()
                continue
            log(t, "停下來且沒有用量上限字樣，視為完成"); return 0
        if AUTO_RE.search(tail):
            log(t, "agent 會在重置後自行繼續，不代送"); hc("wait", t, "--timeout", "3600", timeout=3700); continue

        now = dt.datetime.now()
        agent = (info.get("agent") or (info.get("foreground") or {}).get("name") or "").lower()
        when = codex_reset(now) if "codex" in agent else None
        when = when or parse_reset(tail, now)
        src = "畫面／API 時間"
        if not when:
            when, src = now + dt.timedelta(minutes=backoff), f"退避 {backoff} 分鐘"
            backoff = min(backoff * 2, 180)
        when += dt.timedelta(seconds=90)
        log(t, f"撞到用量上限；{when:%m-%d %H:%M} 續跑（{src}）")
        if a.dry_run:
            return 0
        while (left := (when - dt.datetime.now()).total_seconds()) > 0:
            time.sleep(min(left, 300))
        i3 = get(t)
        if i3.get("state") == "finished":
            log(t, "等待期間已結束"); return 0
        handled.update(l.strip() for l in tail.splitlines() if LIMIT_RE.search(l) or TIME_RE.search(l))
        hc("send", t, a.message)
        rounds += 1
        log(t, f"已送出續跑訊息（第 {rounds} 次）")
        time.sleep(60)  # 讓它開始處理，避免同一段畫面重複觸發
    log("已達續跑上限", a.max_rounds); return 1


if __name__ == "__main__":
    sys.exit(main())
