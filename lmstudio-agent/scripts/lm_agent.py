#!/usr/bin/env python3
"""
直連本機 LM Studio（OpenAI 相容 API）做單一、輕量的文字任務。
不帶任何 agent 框架的工具定義／系統提示詞，避免像 opencode 那樣把一大包
工具規格灌給本地模型，拖垮推理速度。專門用來做「讀一份輸入、依指示轉換、
吐出一份輸出」這種一次性任務,例如：改寫一則筆記的 frontmatter、把一段
匯出格式的內文轉成 wikilink、摘要一份文件。

用法：
    python3 lm_agent.py --task "把這份筆記的 frontmatter 補齊" --input note.md
    python3 lm_agent.py --task "..." --input note.md --output note.md   # 直接覆寫
    python3 lm_agent.py --task "..." --input note.md --in-place         # 同上，語意較清楚
    echo "一些文字" | python3 lm_agent.py --task "翻成白話文"

預設強制回覆使用繁體中文，除非用 --no-lang-enforce 關掉。
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_BASE_URL = "http://localhost:1234/v1"
DEFAULT_MODEL = "qwen3.8-27b-uncensored-mlx"
DEFAULT_MAX_TOKENS = 4000
DEFAULT_TEMPERATURE = 0.3
DEFAULT_TIMEOUT = 600

ZH_TW_SYSTEM_PROMPT = (
    "你是一個文字處理助手。規則：\n"
    "1. 一律使用繁體中文回覆，禁止輸出英文句子或段落（程式碼、檔名、URL、"
    "專有名詞本身可保留原文）。\n"
    "2. 只輸出任務要求的結果本身，不要加開場白、結語或「好的，以下是...」"
    "這類客套話。\n"
    "3. 如果輸入內容本身包含 markdown frontmatter，維持 YAML 格式正確。"
)


def build_messages(task: str, input_text: str | None, lang_enforce: bool, custom_system: str | None):
    system_prompt = custom_system if custom_system is not None else (
        ZH_TW_SYSTEM_PROMPT if lang_enforce else "你是一個文字處理助手，請完成使用者的任務。"
    )
    user_content = task
    if input_text is not None:
        user_content += f"\n\n---以下是輸入內容---\n{input_text}\n---輸入內容結束---"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]


def call_lm_studio(base_url: str, model: str, messages: list, max_tokens: int,
                    temperature: float, timeout: int) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        raise RuntimeError(
            f"連不上 LM Studio（{url}）：{e}\n"
            "請確認 LM Studio 的本機伺服器有開啟，且監聽的 port 跟 --base-url 一致。"
        ) from e
    except TimeoutError as e:
        raise RuntimeError(
            f"逾時（{timeout} 秒）沒有回應。本地模型處理長輸入可能很慢，"
            "可以加大 --timeout，或把輸入切更小段。"
        ) from e

    choices = body.get("choices") or []
    if not choices:
        raise RuntimeError(f"LM Studio 回應格式異常，沒有 choices：{body}")
    message = choices[0].get("message", {})
    content = message.get("content", "")
    return content.strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--task", required=True, help="要交代模型做的任務描述")
    parser.add_argument("--input", help="輸入檔案路徑；不給則嘗試讀 stdin；都沒有則只送 --task")
    parser.add_argument("--output", help="輸出檔案路徑；不給則印到 stdout")
    parser.add_argument("--in-place", action="store_true", help="直接覆寫 --input 指定的檔案（等同 --output 設成同一個檔案）")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"模型名稱（預設 {DEFAULT_MODEL}）")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help=f"LM Studio API base URL（預設 {DEFAULT_BASE_URL}）")
    parser.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS)
    parser.add_argument("--temperature", type=float, default=DEFAULT_TEMPERATURE)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help=f"秒數（預設 {DEFAULT_TIMEOUT}，本地模型較慢，別設太短）")
    parser.add_argument("--system", help="覆蓋預設的系統提示詞（會取代繁中強制規則，自己確保有講清楚語言要求）")
    parser.add_argument("--no-lang-enforce", action="store_true", help="關閉「強制繁體中文」的預設系統提示詞")
    args = parser.parse_args()

    if args.in_place:
        if not args.input:
            parser.error("--in-place 需要搭配 --input 使用")
        if args.output:
            parser.error("--in-place 跟 --output 不要一起用")
        args.output = args.input

    input_text = None
    if args.input:
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"錯誤：輸入檔案不存在：{input_path}", file=sys.stderr)
            sys.exit(1)
        input_text = input_path.read_text(encoding="utf-8")
    elif not sys.stdin.isatty():
        stdin_data = sys.stdin.read()
        if stdin_data.strip():
            input_text = stdin_data

    messages = build_messages(
        task=args.task,
        input_text=input_text,
        lang_enforce=not args.no_lang_enforce,
        custom_system=args.system,
    )

    try:
        result = call_lm_studio(
            base_url=args.base_url,
            model=args.model,
            messages=messages,
            max_tokens=args.max_tokens,
            temperature=args.temperature,
            timeout=args.timeout,
        )
    except RuntimeError as e:
        print(f"錯誤：{e}", file=sys.stderr)
        sys.exit(1)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(result, encoding="utf-8")
        print(f"已寫入：{output_path}", file=sys.stderr)
    else:
        print(result)


if __name__ == "__main__":
    main()
