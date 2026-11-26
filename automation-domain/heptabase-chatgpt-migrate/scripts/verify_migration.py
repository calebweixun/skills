#!/usr/bin/env python3
"""
比對 Heptabase 白板匯出檔（原始）跟 ChatGPT 改寫後的 wikilink 版本，
確認連結/圖片項目沒有被漏掉或多加。

**不要相信 ChatGPT 自己回報的「項目總數：N」**——實測過它會自己算錯
（少列一項但總數沒跟著減），這支腳本才是唯一可信的核對依據。

用法：
    python3 verify_migration.py --source 原始白板.md --output 改寫後.md

比對邏輯：
- 從原始檔案抓出所有 `[text](path)` 與 `![text](path)`，取 path 的
  basename、URL 解碼、去除副檔名，當作「項目識別碼」集合。
- 從輸出檔案抓出所有 `[[name]]` 與 `![[name]]`，取 name（去除可能殘留
  的副檔名），當作另一個集合。
- 兩個集合互相比對，回報「原文有但輸出沒有」（漏掉）跟「輸出有但原文
  沒有」（多出/幻覺）。
- exit code 0 代表完全吻合；非 0 代表有落差，不能直接採用輸出，要人工
  核對。
"""

import argparse
import re
import sys
import urllib.parse
from pathlib import Path

MD_LINK_RE = re.compile(r'!?\[[^\]]*\]\(([^)]+)\)')
WIKILINK_RE = re.compile(r'!?\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]')


def normalize(name: str) -> str:
    name = urllib.parse.unquote(name)
    name = name.split('/')[-1]
    name = re.sub(r'\.(md|pdf|png|jpe?g|gif|mp4|mov|m4a)$', '', name, flags=re.IGNORECASE)
    return name.strip().lower()


def extract_source_items(text: str) -> set:
    items = set()
    for match in MD_LINK_RE.finditer(text):
        path = match.group(1)
        if path.startswith('http://') or path.startswith('https://'):
            continue
        items.add(normalize(path))
    return items


def extract_output_items(text: str) -> set:
    items = set()
    for match in WIKILINK_RE.finditer(text):
        items.add(normalize(match.group(1)))
    return items


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, help="原始 Heptabase 匯出的白板/卡片 .md 檔")
    parser.add_argument("--output", help="ChatGPT 改寫後的 .md 檔（跟 --output-text 二選一）")
    parser.add_argument("--output-text", help="改寫後的內容直接用字串傳入（跟 --output 二選一）")
    args = parser.parse_args()

    if not args.output and args.output_text is None:
        parser.error("--output 或 --output-text 至少要給一個")

    source_path = Path(args.source)
    if not source_path.exists():
        print(f"錯誤：原始檔案不存在：{source_path}", file=sys.stderr)
        sys.exit(2)
    source_text = source_path.read_text(encoding="utf-8")

    if args.output_text is not None:
        output_text = args.output_text
    else:
        output_path = Path(args.output)
        if not output_path.exists():
            print(f"錯誤：輸出檔案不存在：{output_path}", file=sys.stderr)
            sys.exit(2)
        output_text = output_path.read_text(encoding="utf-8")

    source_items = extract_source_items(source_text)
    output_items = extract_output_items(output_text)

    missing = source_items - output_items  # 原文有，輸出漏掉
    extra = output_items - source_items    # 輸出有，原文沒有（可能幻覺或誤植）

    print(f"原始項目數：{len(source_items)}")
    print(f"輸出項目數：{len(output_items)}")

    if not missing and not extra:
        print("✅ 完全吻合，可以採用。")
        sys.exit(0)

    if missing:
        print(f"\n❌ 漏掉 {len(missing)} 項（原文有、輸出沒有）：")
        for item in sorted(missing):
            print(f"  - {item}")

    if extra:
        print(f"\n⚠️  多出 {len(extra)} 項（輸出有、原文沒有，可能是幻覺或改寫過頭）：")
        for item in sorted(extra):
            print(f"  - {item}")

    print("\n判定：不要直接採用，先人工核對上面的差異。")
    sys.exit(1)


if __name__ == "__main__":
    main()
