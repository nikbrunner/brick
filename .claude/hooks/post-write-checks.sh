#!/usr/bin/env bash
# Format, lint, and type-check written TypeScript files
set -euo pipefail

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path')

# Only process TypeScript files
[[ "$file" == *.ts ]] || exit 0

# Format first, then lint, then type-check
deno fmt "$file" 2>/dev/null
deno lint "$file" 2>/dev/null
deno check "$file" 2>/dev/null
