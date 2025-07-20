#!/bin/bash

# Test script for eslint-hook.ts PostToolUse
# Usage: ./test-post-hook.sh [--debug]

DEBUG_FLAG=""
if [ "$1" = "--debug" ]; then
  DEBUG_FLAG="DEBUG=true"
fi

# First, create a test file with bad formatting
TEST_FILE="$(pwd)/src/test-post-hook-temp.ts"
echo 'Creating test file with bad formatting...'
cat > "$TEST_FILE" <<'EOF'
function    badlyFormatted(  x:number,y:string   ){
return x+y.length
}

const   spaceIssues="test"
const noSemicolon = 'missing'
EOF

echo "Test file created at: $TEST_FILE"
echo "Content before PostToolUse hook:"
cat "$TEST_FILE"
echo ""

# Create the JSON payload for PostToolUse
JSON_PAYLOAD=$(cat <<EOF
{
  "hook_event_name": "PostToolUse",
  "session_id": "test-session",
  "transcript_path": "/tmp/test.jsonl",
  "cwd": "$(pwd)",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "$TEST_FILE",
    "content": "dummy content - PostToolUse reads from disk"
  }
}
EOF
)

# Run the hook
echo "Running PostToolUse hook..."
if [ -n "$DEBUG_FLAG" ]; then
  echo "$JSON_PAYLOAD" | DEBUG=true npx tsx ./src/hooks/eslint-hook.ts 2>&1
else
  echo "$JSON_PAYLOAD" | npx tsx ./src/hooks/eslint-hook.ts 2>&1
fi

echo ""
echo "Content after PostToolUse hook:"
cat "$TEST_FILE"

# Clean up
echo ""
echo "Cleaning up test file..."
rm -f "$TEST_FILE"