# Test 19 Orchestrator - Context Size Limits

## Test Objective
Test how workers handle extremely large CLAUDE.md context files and whether context size affects processing or truncation occurs.

## Instructions
1. Navigate to the test19 directory
2. Execute the worker command
3. Observe how the worker handles the large context file (1000+ lines)

## Expected JSON Results Format
```json
{
  "test_id": "test19",
  "test_name": "Context Size Limits",
  "worker_response": {
    "working_directory": "",
    "context_marker": "",
    "context_size": "",
    "context_completeness": "",
    "function_created": "",
    "test_created": "",
    "describe_format": "",
    "requirements_followed": "",
    "performance_issues": "",
    "memory_issues": "",
    "context_processing": "",
    "status": ""
  },
  "analysis": {
    "context_size_handling": "",
    "processing_performance": "",
    "truncation_detection": "",
    "implementation_quality": ""
  },
  "timestamp": ""
}
```

## Execution Command
```bash
cd /codex-of-consentient-craft/sub-agent/round2/test19
claude --file .claude/commands/worker.md
```