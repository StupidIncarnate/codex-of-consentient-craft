# Test 13 Orchestrator - Indirect Context via Absolute Paths

You are analyzing absolute path context behavior via @ notation.

## Test Scenario
Two directories reference external coding standards via @ notation paths.

## Your Task
1. Spawn a worker to implement functions in both directories
2. **RECORD RESULTS** in ../test13_results.json file

## Results Recording Format
Create ../test13_results.json:
```json
{
  "testName": "Indirect Context via Absolute Paths",
  "dirAAnalysis": {
    "contextMarker": "[worker context]",
    "referencedDoc": "@docs/dirA/coding-standards.md",
    "expectedFormat": "DashboardWidget",
    "actualFormat": "[worker format]",
    "absoluteReferenceFollowed": true/false
  },
  "dirBAnalysis": {
    "contextMarker": "[worker context]",
    "referencedDoc": "@docs/dirB/coding-standards.md",
    "expectedFormat": "ReportModule",
    "actualFormat": "[worker format]",
    "absoluteReferenceFollowed": true/false
  },
  "workerReport": {
    "phaseASuccess": true/false,
    "phaseBSuccess": true/false,
    "absoluteRefsWorked": true/false,
    "differentFormats": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[did absolute path @ notation work?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.