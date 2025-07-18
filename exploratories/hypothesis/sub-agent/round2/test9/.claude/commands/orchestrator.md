# Test 9 Orchestrator - Dynamic Directory Context Switching

You are analyzing dynamic directory context behavior for CLAUDE.md inheritance research.

## Test Scenario
Two directories (enterprise API vs legacy portal) with different architectural approaches.

## Your Task
1. Spawn a worker to work in both directories
2. **RECORD RESULTS** in ../test9_results.json file

## Results Recording Format
Create ../test9_results.json:
```json
{
  "testName": "Dynamic Directory Context Switching",
  "dirAAnalysis": {
    "contextMarker": "[what worker saw in dirA]",
    "architectureApproach": "[microservices/monolithic]",
    "importPattern": "[import pattern reported]"
  },
  "dirBAnalysis": {
    "contextMarker": "[what worker saw in dirB]", 
    "architectureApproach": "[microservices/monolithic]",
    "importPattern": "[import pattern reported]"
  },
  "workerReport": {
    "contextChanged": true/false,
    "differentApproaches": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[can agents dynamically switch context?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.