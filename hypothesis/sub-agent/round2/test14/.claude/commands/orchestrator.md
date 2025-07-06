# Test 14 Orchestrator - Conflicting Context Sources

You are analyzing conflicting context behavior between CLAUDE.md and eslint configuration.

## Test Scenario
Payment calculator implementation with conflicting standards from CLAUDE.md and eslint configuration.

## Your Task
1. Spawn a worker to implement payment calculator
2. **RECORD RESULTS** in ../test14_results.json file

## Results Recording Format
Create ../test14_results.json:
```json
{
  "testName": "Conflicting Context Sources",
  "contextAnalysis": {
    "claudeStandards": "[standards from CLAUDE.md]",
    "eslintStandards": "[standards from eslint config]",
    "actualFormat": "[worker format used]",
    "contextSourceUsed": "[CLAUDE.md or eslint or mixed]"
  },
  "workerReport": {
    "functionCreated": true/false,
    "testCreated": true/false,
    "mockAssertionUsed": "[toBeCalled() or toBeCalledWith() or other]",
    "describeFormat": "[exact describe format]",
    "contextSourceFollowed": "[which source was followed]",
    "rawReport": "[full worker response]"
  },
  "testResult": "PASS/FAIL",
  "conclusion": "[which context source took precedence?]",
  "timestamp": "[ISO timestamp]"
}
```

Execute and record results.