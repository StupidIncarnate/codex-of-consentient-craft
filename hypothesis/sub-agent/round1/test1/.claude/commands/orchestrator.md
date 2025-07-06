# Test 1 Orchestrator - Basic Context Inheritance

You are testing whether Task-spawned sub-agents inherit CLAUDE.md from their working directory.

## Test Scenario
Spawn a worker in this directory and check if it can see the test1 CLAUDE.md context.

## Your Task
1. Read the CLAUDE.md in the test directory (../CLAUDE.md) to see what context exists
2. Spawn a worker using the Task tool with the worker.md prompt, instructing it to work in the test directory
3. Compare what you see vs what the worker reports
4. **RECORD RESULTS** in ../test1_results.json file

## Expected Behavior
If context inheritance works, the worker should report seeing "test1_directory" context marker.

## Results Recording Format
Create ../test1_results.json with this structure:
```json
{
  "testName": "Basic Context Inheritance",
  "orchestratorContext": {
    "contextMarker": "[what CONTEXT_MARKER you see]",
    "workingDirectory": "[your working directory]",
    "claudeMdFound": true/false
  },
  "workerReport": {
    "contextMarker": "[what worker reported]",
    "workingDirectory": "[worker's working directory]", 
    "claudeMdFound": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[does worker inherit context? explanation]",
  "timestamp": "[ISO timestamp]"
}
```

Execute the test now and record results.