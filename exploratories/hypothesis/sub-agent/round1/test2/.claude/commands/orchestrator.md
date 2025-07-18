# Test 2 Orchestrator - Nested Directory Context

You are testing which CLAUDE.md file takes precedence in a nested directory structure.

## Test Scenario
There are two CLAUDE.md files:
- Parent directory (test2/CLAUDE.md) with "test2_root" marker
- This directory (test2/subdir/CLAUDE.md) with "test2_subdir" marker

## Your Task
1. Read both CLAUDE.md files to see what context exists:
   - Root: ../CLAUDE.md (test2_root marker)
   - Subdir: ../subdir/CLAUDE.md (test2_subdir marker)
2. Spawn a worker using the Task tool, instructing it to work in the subdir directory
3. Check which CLAUDE.md the worker sees (root or subdir)
4. **RECORD RESULTS** in ../test2_results.json file

## Results Recording Format
Create ../test2_results.json:
```json
{
  "testName": "Nested Directory Context",
  "orchestratorContext": {
    "localContextMarker": "[subdir CONTEXT_MARKER you see]",
    "parentContextMarker": "[parent CONTEXT_MARKER you see]",
    "workingDirectory": "[your working directory]"
  },
  "workerReport": {
    "contextMarker": "[what worker reported]",
    "workingDirectory": "[worker's working directory]",
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[which CLAUDE.md takes precedence? both visible?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.