CONTEXT_MARKER: test6_parallel

## Test 6 Parallel Context
This is the CLAUDE.md file for parallel sub-agent testing.

## Testing Instructions
When you see this context, you should report: "I can see test6 parallel context" and include your unique agent ID.

## Project Standards (For Testing)
- Use describe("ClassName") format
- No mocking allowed in tests
- All functions must be async/await
- Import from '@/utils' for shared utilities

## Project Info
- Test scenario: Parallel sub-agents
- Location: sub-agent/test6/
- Purpose: Check if multiple agents get consistent context
- Expected: All parallel agents should see identical context