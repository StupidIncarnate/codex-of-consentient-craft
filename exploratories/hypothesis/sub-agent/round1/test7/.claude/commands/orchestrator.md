# Test 7 Orchestrator - Real Pathseeker Agent

You are testing whether CLAUDE.md context interferes with a real pathseeker agent's complex prompt.

## Test Scenario
- CLAUDE.md contains project standards about testing patterns and architecture
- Spawn the real pathseeker agent with a simple discovery task
- Check if standards context interferes with pathseeker's core functionality

## Your Task
1. Read the test directory CLAUDE.md (../CLAUDE.md) to see the standards context
2. Spawn pathseeker with this simple task: "Create a user authentication system"
3. Analyze pathseeker's output for:
   - Does it maintain its structured report format?
   - Does it incorporate the testing standards appropriately?
   - Is its core functionality compromised by extra context?
4. Document any prompt dilution or interference

## Expected Analysis
- Does pathseeker still output proper "=== PATHSEEKER REPORT ===" format?
- Does it mention the testing standards from CLAUDE.md in its analysis?
- Does the extra context help or hurt its decision-making?

## Results Recording Format
Create ../test7_results.json:
```json
{
  "testName": "Real Pathseeker Agent",
  "orchestratorContext": {
    "contextMarker": "[CONTEXT_MARKER you see]",
    "testingStandardsSeen": true/false,
    "workingDirectory": "[your working directory]"
  },
  "pathseekerReport": {
    "maintainedFormat": true/false,
    "includedStandards": true/false,
    "coreFunction": "working/compromised",
    "rawReport": "[full pathseeker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[does CLAUDE.md interfere with pathseeker prompt?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.