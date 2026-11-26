#!/bin/sh
# 把 herd-dispatch 技能與 hc 範本連結到各家 agent 的讀取位置（可重複執行）
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd -P)"   # skill 正本（_Skills repo 內）
mkdir -p "$HOME/.agents/skills"
[ "$SRC" = "$(cd "$HOME/.agents/skills/herd-dispatch" 2>/dev/null && pwd -P)" ] || ln -sfn "$SRC" "$HOME/.agents/skills/herd-dispatch"
for dir in "$HOME/.claude/skills" "$HOME/.codex/skills" "$HOME/.gemini/antigravity-cli/skills"; do
  [ -d "$(dirname "$dir")" ] || continue
  mkdir -p "$dir"
  if [ -e "$dir/herd-dispatch" ] && [ ! -L "$dir/herd-dispatch" ]; then
    echo "略過 $dir/herd-dispatch：已有非連結的同名資料夾"; continue
  fi
  ln -sfn "$SRC" "$dir/herd-dispatch" && echo "技能 → $dir/herd-dispatch"
done
T="$HOME/.config/herdr-core/templates"; mkdir -p "$T"
for f in "$SRC"/templates/*.md; do
  n=$(basename "$f")
  if [ -e "$T/$n" ] && [ ! -L "$T/$n" ]; then echo "略過範本 $n：已有同名檔案"; continue; fi
  ln -sfn "$f" "$T/$n" && echo "範本 → $T/$n"
done
