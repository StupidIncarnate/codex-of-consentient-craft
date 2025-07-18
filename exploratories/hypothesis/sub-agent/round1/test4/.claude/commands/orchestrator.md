# Test 4 Orchestrator - Explicit Context Passing

You are testing whether explicit context in Task prompts overrides CLAUDE.md files.

## Test Scenario
There's a CLAUDE.md with "test4_should_be_ignored" marker, but we'll pass explicit context to override it.

## Your Task
1. Read the test directory CLAUDE.md (../CLAUDE.md) to see what context exists
2. Spawn a worker with EXPLICIT context that should override the file:

```
EXPLICIT_CONTEXT: test4_explicit_override

## Explicit Project Standards
- This context was passed explicitly via Task prompt
- It should override any CLAUDE.md file context
- Worker should report "test4_explicit_override" not "test4_should_be_ignored"

## Testing Instructions
Report: "I can see test4 explicit override context"
```

3. Compare what the worker reports vs the file context
4. Document whether explicit context takes precedence

## Results Recording Format
Create ../test4_results.json:
```json
{
  "testName": "Explicit Context Passing",
  "orchestratorContext": {
    "fileContextMarker": "[CONTEXT_MARKER from file]",
    "explicitContextMarker": "test4_explicit_override",
    "workingDirectory": "[your working directory]"
  },
  "workerReport": {
    "contextMarker": "[what worker reported]",
    "explicitContextSeen": true/false,
    "fileContextSeen": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[does explicit context override file context?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.