# Test 12 Orchestrator - Indirect Context via Relative Paths

You are analyzing indirect context behavior via relative path references.

## Test Scenario
Two directories reference external coding standards via relative paths.

## Your Task
1. Spawn a worker to implement functions in both directories
2. **RECORD RESULTS** in ../test12_results.json file

## Results Recording Format
Create ../test12_results.json:
```json
{
  "testName": "Indirect Context via Relative Paths",
  "dirAAnalysis": {
    "contextMarker": "[worker context]",
    "referencedDoc": "../docs/dirA/coding-standards.md",
    "expectedFormat": "InventoryModule",
    "actualFormat": "[worker format]",
    "externalReferenceFollowed": true/false
  },
  "dirBAnalysis": {
    "contextMarker": "[worker context]",
    "referencedDoc": "../docs/dirB/coding-standards.md",
    "expectedFormat": "OrderService",
    "actualFormat": "[worker format]",
    "externalReferenceFollowed": true/false
  },
  "workerReport": {
    "phaseASuccess": true/false,
    "phaseBSuccess": true/false,
    "externalDocsRead": true/false,
    "differentFormats": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[do relative path references work?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.