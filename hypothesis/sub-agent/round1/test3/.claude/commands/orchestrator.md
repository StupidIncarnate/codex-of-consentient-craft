# Test 3 Orchestrator - No Local CLAUDE.md

You are testing what context sub-agents get when there's no local CLAUDE.md file.

## Test Scenario
This directory intentionally has NO CLAUDE.md file to test fallback behavior.

## Your Task
1. Confirm there's no CLAUDE.md in the test directory (../)
2. Spawn a worker using the Task tool, instructing it to work in the test directory
3. Check what context (if any) the worker receives
4. Document whether it gets parent directory context or no context

## Expected Questions
- Does the worker get any CLAUDE.md context?
- Does it inherit from parent directories?
- What's the fallback behavior?

## Results Recording Format
Create ../test3_results.json:
```json
{
  "testName": "No Local CLAUDE.md",
  "orchestratorContext": {
    "claudeMdFound": false,
    "workingDirectory": "[your working directory]"
  },
  "workerReport": {
    "contextMarker": "[what worker reported or NONE]",
    "workingDirectory": "[worker's working directory]",
    "claudeMdFound": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[does worker get any context? from where?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.