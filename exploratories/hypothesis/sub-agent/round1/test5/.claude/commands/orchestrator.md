# Test 5 Orchestrator - Working Directory Control

You are testing how working directory affects CLAUDE.md context for sub-agents.

## Test Scenario
- You are in root_dir/ with "test5_root" CLAUDE.md
- Worker should execute in ../work_dir/ with "test5_work" CLAUDE.md
- Test which context the worker actually gets

## Your Task
1. Read the root_dir CLAUDE.md (../root_dir/CLAUDE.md) to confirm "test5_root" context
2. Spawn a worker instructing it to work in the work_dir directory (../work_dir/)
3. Check which CLAUDE.md context the worker reports (root vs work)
4. Document whether working directory affects context inheritance

## Expected Questions
- Does the worker see "test5_root" (where spawned) or "test5_work" (where it works)?
- Can we control which directory context is used?

## Results Recording Format
Create ../test5_results.json:
```json
{
  "testName": "Working Directory Control",
  "orchestratorContext": {
    "contextMarker": "[root_dir CONTEXT_MARKER you see]",
    "workingDirectory": "[your working directory]"
  },
  "workerReport": {
    "contextMarker": "[what worker reported]",
    "workingDirectory": "[worker's working directory]",
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[which directory's CLAUDE.md does worker see?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.