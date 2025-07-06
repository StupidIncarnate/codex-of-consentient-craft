# Test 11 Orchestrator - Implicit Context Standards

You are analyzing implicit context pickup behavior.

## Test Scenario
Two directories with different describe format requirements in their development standards.

## Your Task
1. Spawn a worker to implement functions in both directories
2. **RECORD RESULTS** in ../test11_results.json file

## Results Recording Format
Create ../test11_results.json:
```json
{
  "testName": "Implicit Context Standards",
  "dirAAnalysis": {
    "contextMarker": "[what worker found]",
    "expectedDescribeFormat": "MobileApp",
    "actualDescribeFormat": "[format worker actually used]",
    "standardsFollowed": true/false
  },
  "dirBAnalysis": {
    "contextMarker": "[what worker found]",
    "expectedDescribeFormat": "APIEndpoint",
    "actualDescribeFormat": "[format worker actually used]",
    "standardsFollowed": true/false
  },
  "workerReport": {
    "phaseASuccess": true/false,
    "phaseBSuccess": true/false,
    "differentFormats": true/false,
    "patternAwareness": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[do workers naturally follow implicit standards?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.