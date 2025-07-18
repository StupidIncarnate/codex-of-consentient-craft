# Test 15 Orchestrator - Nested Context Hierarchy

You are analyzing nested context hierarchy behavior across 3 levels.

## Test Scenario
3-level hierarchy implementation with different standards at Root/API/V2 levels.

## Your Task
1. Spawn a worker to implement GraphQL resolver in deepest level
2. **RECORD RESULTS** in ../test15_results.json file

## Results Recording Format
Create ../test15_results.json:
```json
{
  "testName": "Nested Context Hierarchy",
  "hierarchyAnalysis": {
    "rootLevel": "[Root CLAUDE.md standards]",
    "apiLevel": "[API CLAUDE.md standards]",
    "v2Level": "[V2 CLAUDE.md standards]",
    "actualFormat": "[worker format used]",
    "contextLevelApplied": "[Root/API/V2]"
  },
  "workerReport": {
    "functionCreated": true/false,
    "testCreated": true/false,
    "describeFormat": "[exact describe format]",
    "contextSourceUsed": "[which CLAUDE.md file]",
    "developmentApproach": "[worker approach]",
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[which context level took precedence?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.