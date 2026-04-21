#!/usr/bin/env bash
# Local convenience wrapper — NOT part of the CI pipeline
# CI uses generate-spec.yml which calls run.js directly
#
# Usage:
#   ./scripts/generate-spec.sh "Brief text here"
#   ./scripts/generate-spec.sh --file specs/briefs/FB-002.md
#   ./scripts/generate-spec.sh --file specs/briefs/FB-002.md --out specs/SPEC-2025-002.yaml

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENT_DIR="$REPO_ROOT/agents/spec-generator"

if ! command -v node &>/dev/null; then
  echo "ERROR: node is required but not found in PATH" >&2
  exit 1
fi

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set" >&2
  exit 1
fi

BRIEF_TEXT=""
BRIEF_FILE=""
OUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file|-f) BRIEF_FILE="$2"; shift 2 ;;
    --out|-o)  OUT_FILE="$2";   shift 2 ;;
    *)         BRIEF_TEXT="$1"; shift   ;;
  esac
done

cd "$REPO_ROOT"

if [[ -n "$BRIEF_FILE" ]]; then
  SPEC_OUTPUT=$(node "$AGENT_DIR/run.js" --brief-file "$BRIEF_FILE")
elif [[ -n "$BRIEF_TEXT" ]]; then
  SPEC_OUTPUT=$(node "$AGENT_DIR/run.js" --brief "$BRIEF_TEXT")
else
  echo "ERROR: Provide a brief as argument or with --file path" >&2
  exit 1
fi

if [[ -n "$OUT_FILE" ]]; then
  echo "$SPEC_OUTPUT" > "$OUT_FILE"
  echo "✓ Spec written to $OUT_FILE" >&2
else
  echo "$SPEC_OUTPUT"
fi
