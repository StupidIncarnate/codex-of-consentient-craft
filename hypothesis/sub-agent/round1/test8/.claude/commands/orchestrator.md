# Test 8 Orchestrator - Large Context File

You are testing whether large CLAUDE.md files affect sub-agent behavior or cause truncation.

## Test Scenario
The CLAUDE.md file is intentionally large (~5000+ characters) with testing standards buried in the middle.

## Your Task
1. Read the test directory CLAUDE.md (../CLAUDE.md) to confirm it's large and contains testing standards
2. Spawn a worker using the Task tool with the worker.md prompt
3. Check if the worker can still see the testing standards despite the large context
4. Document any truncation, performance issues, or context limitations

## Critical Questions
- Does the worker see the CONTEXT_MARKER at the top?
- Can it find the testing standards in the middle of the large file?
- Are there any signs of truncation or missing information?
- Does the large context affect performance or reliability?

## Results Recording Format
Create ../test8_results.json:
```json
{
  "testName": "Large Context File",
  "orchestratorContext": {
    "contextMarker": "[CONTEXT_MARKER you see]",
    "contextSize": "[approximate character count]",
    "testingStandardsSeen": true/false,
    "workingDirectory": "[your working directory]"
  },
  "workerReport": {
    "contextMarker": "[what worker reported]",
    "testingStandardsSeen": true/false,
    "truncationDetected": true/false,
    "performanceIssues": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[how does large context affect sub-agents?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.