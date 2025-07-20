#!/bin/bash

# Test script for eslint-hook.ts PreToolUse
# Usage: ./test-pre-hook.sh [--debug]

DEBUG_FLAG=""
if [ "$1" = "--debug" ]; then
  DEBUG_FLAG="DEBUG=true"
fi

# Test content with bad formatting
TEST_CONTENT='function    badlyFormatted(  x:number,y:string   ){
return x+y.length
}

const   spaceIssues="test"
const noSemicolon = "missing"
export { badlyFormatted }'

# Create the JSON payload for PreToolUse
JSON_PAYLOAD=$(cat <<EOF
{
  "hook_event_name": "PreToolUse",
  "session_id": "test-session",
  "transcript_path": "/tmp/test.jsonl",
  "cwd": "$(pwd)",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "$(pwd)/src/test-pre-hook-temp.ts",
    "content": $(echo "$TEST_CONTENT" | jq -Rs .)
  }
}
EOF
)

# Run the hook
echo "Testing PreToolUse hook with formatting issues..."
echo "Content being written:"
echo "$TEST_CONTENT"
echo ""
echo "Running PreToolUse hook..."
if [ -n "$DEBUG_FLAG" ]; then
  echo "$JSON_PAYLOAD" | DEBUG=true npx tsx ./src/hooks/eslint-hook.ts 2>&1
  EXIT_CODE=$?
else
  echo "$JSON_PAYLOAD" | npx tsx ./src/hooks/eslint-hook.ts 2>&1
  EXIT_CODE=$?
fi

echo ""
echo "Exit code: $EXIT_CODE"
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ PreToolUse hook passed (formatting issues don't block)"
else
  echo "❌ PreToolUse hook failed (exit code $EXIT_CODE)"
fi