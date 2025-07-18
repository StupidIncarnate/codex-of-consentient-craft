# Test 10 Orchestrator - Large File Context Processing

You are analyzing large CLAUDE.md file processing capabilities.

## Test Scenario
Large enterprise platform documentation (600+ lines) with deep content markers.

## Your Task
1. Spawn a worker to analyze the comprehensive documentation
2. **RECORD RESULTS** in ../test10_results.json file

## Results Recording Format
Create ../test10_results.json:
```json
{
  "testName": "Large File Context Processing",
  "fileAnalysis": {
    "contextMarker": "[marker worker saw]",
    "approximateSize": "[lines/scope estimate]",
    "deepMarkerVisible": true/false,
    "integrationMarkerVisible": true/false,
    "documentationComplete": true/false
  },
  "workerReport": {
    "contextMarker": "[what worker reported]",
    "milestoneMarkerSeen": true/false,
    "integrationMarkerSeen": true/false,
    "truncationDetected": true/false,
    "performanceIssues": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[are large files processed completely?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.