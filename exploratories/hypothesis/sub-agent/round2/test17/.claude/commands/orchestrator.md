# Test 17 Orchestrator - Malformed Context Handling

You are analyzing malformed context handling behavior.

## Test Scenario
Worker must handle intentionally malformed CLAUDE.md with broken markdown syntax.

## Your Task
1. Spawn a worker to implement legacy migration functionality despite malformed context
2. **RECORD RESULTS** in ../test17_results.json file

## Results Recording Format
Create ../test17_results.json:
```json
{
  "testName": "Malformed Context Handling",
  "contextAnalysis": {
    "contextMarker": "[what marker worker found]",
    "malformedContent": "[broken elements detected]",
    "parseIssues": "[parsing problems encountered]",
    "fallbackBehavior": "[how worker handled errors]"
  },
  "workerReport": {
    "functionCreated": true/false,
    "testCreated": true/false,
    "describeFormat": "[format worker used]",
    "errorHandling": "[how worker handled malformed content]",
    "contextIssues": "[issues worker reported]",
    "status": "[SUCCESS/PARTIAL/FAILED]",
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[how well are malformed files handled?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.