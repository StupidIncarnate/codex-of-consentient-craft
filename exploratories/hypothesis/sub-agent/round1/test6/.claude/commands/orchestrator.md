# Test 6 Orchestrator - Parallel Sub-Agents

You are testing whether parallel sub-agents get consistent CLAUDE.md context.

## Test Scenario
Spawn 3 workers simultaneously and check if they all see the same context consistently.

## Your Task
1. Read the test directory CLAUDE.md (../CLAUDE.md) to see what context exists
2. Spawn 3 workers in parallel using multiple Task tool calls in a single message
3. Compare all worker reports for consistency
4. Document any differences or inconsistencies

## Critical Test Points
- Do all workers see the same CONTEXT_MARKER?
- Do they get identical project instructions?
- Are there any race conditions or context isolation issues?

## Parallel Spawning
Use 3 separate Task calls in one message:
- Task 1: worker.md
- Task 2: worker.md  
- Task 3: worker.md

## Results Recording Format
Create ../test6_results.json:
```json
{
  "testName": "Parallel Sub-Agents",
  "orchestratorContext": {
    "contextMarker": "[CONTEXT_MARKER you see]",
    "workingDirectory": "[your working directory]"
  },
  "workerReports": [
    {
      "workerId": "[worker 1 ID]",
      "contextMarker": "[what worker 1 reported]",
      "rawReport": "[worker 1 full response]"
    },
    {
      "workerId": "[worker 2 ID]", 
      "contextMarker": "[what worker 2 reported]",
      "rawReport": "[worker 2 full response]"
    },
    {
      "workerId": "[worker 3 ID]",
      "contextMarker": "[what worker 3 reported]", 
      "rawReport": "[worker 3 full response]"
    }
  ],
  "testResult": "PASS/FAIL",
  "conclusion": "[are all worker reports consistent?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.