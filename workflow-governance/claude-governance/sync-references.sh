#!/usr/bin/env bash
# 從 claude-governance repo 同步治理檔進本 skill 的 references/。
# 用法：./sync-references.sh [claude-governance repo 路徑]
#      預設 ~/Codes/claude-governance，可用 GOVERNANCE_REPO 環境變數覆蓋。
# 只改檔名與交叉引用路徑，不改內容。references/rationale.md 為手工維護，不在同步範圍。
set -euo pipefail
SRC="${1:-${GOVERNANCE_REPO:-$HOME/Codes/claude-governance}}"
DST="$(cd "$(dirname "$0")" && pwd)/references"

if [[ ! -f "$SRC/01-dispatch.md" ]]; then
  echo "找不到治理檔來源：$SRC" >&2
  echo "傳入正確路徑，或 clone https://github.com/calebweixun/claude-governance" >&2
  exit 1
fi

declare -a MAP=(
  "00-DIAGNOSTIC.md:diagnostic.md"
  "01-dispatch.md:dispatch.md"
  "02-judgment.md:judgment.md"
  "03-templates.md:templates.md"
  "04-maintenance.md:maintenance.md"
)
for pair in "${MAP[@]}"; do
  src="$SRC/${pair%%:*}"; dst="$DST/${pair##*:}"
  sed -e 's|`00-DIAGNOSTIC\.md`|`references/diagnostic.md`|g' \
      -e 's|`01-dispatch\.md`|`references/dispatch.md`|g' \
      -e 's|`02-judgment\.md`|`references/judgment.md`|g' \
      -e 's|`03-templates\.md`|`references/templates.md`|g' \
      -e 's|`04-maintenance\.md`|`references/maintenance.md`|g' \
      -e 's|`05-letter\.md`|`references/rationale.md`|g' \
      -e 's|docs/governance/||g' \
      -e 's|00-DIAGNOSTIC\.md|references/diagnostic.md|g' \
      -e 's|01-dispatch\.md|references/dispatch.md|g' \
      -e 's|02-judgment\.md|references/judgment.md|g' \
      -e 's|03-templates\.md|references/templates.md|g' \
      -e 's|04-maintenance\.md|references/maintenance.md|g' \
      -e 's|05-letter\.md|references/rationale.md|g' \
      "$src" > "$dst"
  echo "synced ${pair%%:*} -> references/${pair##*:}"
done
