# Test 16 Orchestrator - Context Accumulation

You are analyzing context accumulation behavior across multiple directories.

## Test Scenario
Multi-directory sequence implementation with different standards in each directory.

## Your Task
1. Spawn a worker to implement functions in 3 directories sequentially
2. **RECORD RESULTS** in ../test16_results.json file

## Results Recording Format
Create ../test16_results.json:
```json
{
  "testName": "Context Accumulation",
  "directoryAnalysis": {
    "dirA": {
      "standards": "[dirA CLAUDE.md standards]",
      "describeFormat": "[format used in dirA]",
      "contextApplied": "[dirA context]"
    },
    "dirB": {
      "standards": "[dirB CLAUDE.md standards]",
      "describeFormat": "[format used in dirB]",
      "contextApplied": "[dirB context]"
    },
    "dirC": {
      "standards": "[dirC CLAUDE.md standards]",
      "describeFormat": "[format used in dirC]",
      "contextApplied": "[dirC context]"
    }
  },
  "workerReport": {
    "authCreated": true/false,
    "validatorCreated": true/false,
    "notifierCreated": true/false,
    "contextSwitching": "[how context changed]",
    "contextAccumulation": "[did context accumulate?]",
    "differentFormats": true/false,
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[how did context change across directories?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.