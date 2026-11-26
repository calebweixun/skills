#!/usr/bin/env bash
# macOS / Linux / WSL 快速入口：呼叫跨平台 scripts/manage.py 管理 Claude / Codex / Gemini / Cursor Skills。
#
# 用法：
#   ./scripts/sync-skills.sh sync --replace-copies
#   ./scripts/sync-skills.sh sync --profile core,frontend --prune --save-local
#   ./scripts/sync-skills.sh status
#   ./scripts/sync-skills.sh doctor
#   ./scripts/sync-skills.sh check-upstream
#   ./scripts/sync-skills.sh --status            # 向下相容舊參數
#   ./scripts/sync-skills.sh --replace-copies    # 向下相容舊參數

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
MANAGE_PY="$SCRIPT_DIR/manage.py"

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "ERROR: Python 3 is required." >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  exec "$PY" "$MANAGE_PY" sync
fi

case "$1" in
  sync|status|doctor|check-upstream|uninstall|-h|--help)
    exec "$PY" "$MANAGE_PY" "$@"
    ;;
  --status)
    shift
    exec "$PY" "$MANAGE_PY" status "$@"
    ;;
  --doctor)
    shift
    exec "$PY" "$MANAGE_PY" doctor "$@"
    ;;
  *)
    exec "$PY" "$MANAGE_PY" sync "$@"
    ;;
esac
