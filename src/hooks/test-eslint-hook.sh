#!/bin/bash

# Test script for eslint-hook.ts
# Usage: ./test-eslint-hook.sh [--debug]

DEBUG_FLAG=""
if [ "$1" = "--debug" ]; then
  DEBUG_FLAG="DEBUG=true"
fi

# Test content with eslint errors (using 'any' type)
TEST_CONTENT='export class TestHook {
  static logData(data: any): void {
    console.log("Debug data:", data);
  }
}'

# Create the JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "hook_event_name": "PreToolUse",
  "session_id": "test-session",
  "transcript_path": "/tmp/test.jsonl",
  "cwd": "$(pwd)",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "$(pwd)/eslint-hook.ts",
    "content": $(echo "$TEST_CONTENT" | jq -Rs .)
  }
}
EOF
)

# Run the hook
echo "Testing eslint hook with content that has 'any' type..."
if [ -n "$DEBUG_FLAG" ]; then
  echo "$JSON_PAYLOAD" | DEBUG=true npx tsx ./eslint-hook.ts --validate 2>&1
else
  echo "$JSON_PAYLOAD" | npx tsx ./eslint-hook.ts --validate 2>&1
fi