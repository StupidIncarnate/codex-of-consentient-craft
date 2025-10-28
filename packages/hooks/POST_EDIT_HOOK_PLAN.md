# Post-Edit Hook Implementation Plan

## Overview

Create a post-edit hook that runs after Claude makes file changes. It will:

1. Run `eslint --fix` on the changed file
2. Write the fixed content back to disk
3. Report any remaining violations (those not auto-fixable) in ESLint native format
4. Use ALL enabled ESLint rules (not filtered like pre-edit hook)
5. Use `--quiet` mode to report only errors (not warnings)
6. Never block (changes already made - just informational)

## Requirements Summary

- **When**: After Write/Edit/MultiEdit operations complete
- **Action**: Run eslint --fix on the affected file
- **Output**: Write fixes to disk + report remaining errors
- **Rules**: Full project ESLint config (no filtering)
- **Format**: ESLint native output format
- **Quiet Mode**: Report errors only, suppress warnings
- **Blocking**: No - purely informational

## Architecture Comparison

### Pre-Edit Hook (Existing)

```
stdin → HookPreEditResponder → violationsCheckNewBroker → BLOCK decision
                                      ↓
                        Compare old vs new violations
                        (filtered rules only)
```

### Post-Edit Hook (New)

```
stdin → HookPostEditResponder → violationsFixAndReportBroker → Report
                                      ↓
                        1. Run eslint --fix on file
                        2. Write fixed content to disk
                        3. Report remaining errors only (quiet mode)
                        (all rules, full config)
```

## Implementation Tasks

### 1. Create Entry Point

**File**: `packages/hooks/src/startup/start-post-edit-hook.ts`

- Similar structure to `start-pre-edit-hook.ts`
- Read from stdin, validate, call responder
- Exit codes:
    - 0: Success (with or without violations - just report)
    - 1: Invalid input
    - No blocking exit code (unlike pre-edit)

### 2. Create Responder

**File**: `packages/hooks/src/responders/hook/post-edit/hook-post-edit-responder.ts`

- Accept `{ input: HookData }`
- Validate against `postToolUseHookDataContract`
- Call `violationsFixAndReportBroker`
- Return `{ violations: LintResult[], message: string }`

**Interface**:

```typescript
export interface HookPostEditResponderResult {
  violations: LintResult[];
  message: string;
}
```

### 3. Create Post-Edit Broker (Orchestrator)

**File**: `packages/hooks/src/brokers/violations/fix-and-report/violations-fix-and-report-broker.ts`

**Steps**:

1. Extract file path from tool input
2. Load full ESLint config (no filtering!)
3. Read file content from disk (after edit was applied)
4. Run eslint --fix via `eslintLintRunWithFixBroker()` (new)
5. Write fixed content back to disk via file adapter
6. Return remaining errors + formatted message

**Critical**: Unlike pre-edit which uses `eslintConfigFilterTransformer`, this broker loads the full ESLint config
without filtering.

### 4. Create ESLint Fix Broker

**File**: `packages/hooks/src/brokers/eslint/lint-run-with-fix/eslint-lint-run-with-fix-broker.ts`

**Purpose**: Run ESLint with `fix: true` option and quiet mode

**Interface**:

```typescript
export interface EslintLintRunWithFixResult {
  fixedContent: string;
  lintResults: LintResult[];  // Only errors (severity === 2)
}
```

**Implementation**:

- Input: `{ content, filePath, eslintConfig, cwd }`
- Create ESLint instance with `fix: true` option
- Create ESLint instance with full config (not filtered)
- Run on content
- Filter results to errors only (severity === 2, quiet mode)
- Return: `{ fixedContent, lintResults }`

**Quiet Mode Implementation**:

```typescript
// Filter to errors only (quiet mode - severity 2 = error, 1 = warning)
const errorResults = results.map((result) => ({
  ...result,
  messages: result.messages.filter((msg) => msg.severity === 2),
  warningCount: 0,
  errorCount: result.messages.filter((msg) => msg.severity === 2).length,
}));
```

**Note**: This is different from existing `eslintLintRunTargetedBroker` which:

- Doesn't fix
- Uses filtered rules from hook config
- Doesn't implement quiet mode

### 5. Contracts

**Already Exist**:

- `packages/hooks/src/contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract.ts` ✅
- `packages/hooks/src/contracts/lint-result/lint-result-contract.ts` ✅
- `packages/hooks/src/contracts/lint-message/lint-message-contract.ts` ✅

**New Interface** (defined in responder file):

```typescript
export interface HookPostEditResponderResult {
  violations: LintResult[];
  message: string;
}
```

### 6. File Write Capability

**Check if exists**:

- Look for: `packages/hooks/src/adapters/fs/write-file/fs-write-file-adapter.ts`
- If not, create it to write fixed content back to disk

**Pattern** (if needed):

```typescript
import { writeFile } from 'fs/promises';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

export const fsWriteFileAdapter = async ({
  filePath,
  content,
}: {
  filePath: FilePath;
  content: FileContents;
}): Promise<void> => {
  await writeFile(filePath, content, 'utf8');
};
```

### 7. Testing Strategy

Following testing standards:

**Unit Tests** (with proxies):

- `hook-post-edit-responder.test.ts` - Test responder validation and delegation
- `violations-fix-and-report-broker.test.ts` - Test orchestration logic
- `eslint-lint-run-with-fix-broker.test.ts` - Test ESLint fix execution and quiet mode

**Integration Test**:

- `start-post-edit-hook.integration.test.ts` - End-to-end test with real files
- Create temp file with violations (some fixable, some not)
- Run hook
- Verify file is fixed on disk
- Verify only error-level violations reported (warnings suppressed)

### 8. Message Formatting

**ESLint Native Format** means:

- Use ESLint's built-in formatter or raw `LintResult[]` structure
- Include: file path, line, column, message, ruleId, severity
- Example output:
  ```
  /path/to/file.ts
    10:5  error  'foo' is not defined  no-undef
    15:3  error  Missing return type  @typescript-eslint/explicit-function-return-type

  ✖ 2 errors
  ```

**Note**: Warnings will not appear due to quiet mode.

## Key Differences from Pre-Edit Hook

| Aspect             | Pre-Edit Hook                   | Post-Edit Hook                |
|--------------------|---------------------------------|-------------------------------|
| **Timing**         | Before changes                  | After changes                 |
| **Purpose**        | Block bad edits                 | Fix + report                  |
| **Rules**          | Filtered (hook config)          | All rules (full config)       |
| **Config Loading** | `hookConfigLoadBroker` + filter | Just `eslintLoadConfigBroker` |
| **Fixing**         | No fixing                       | Yes, with --fix               |
| **File Write**     | No                              | Yes (write fixes back)        |
| **Blocking**       | Yes (shouldBlock)               | No (just report)              |
| **Output**         | Custom format                   | ESLint native                 |
| **Quiet Mode**     | No                              | Yes (errors only)             |
| **Comparison**     | Old vs new violations           | Just current violations       |

## File Structure Overview

```
packages/hooks/src/
├── startup/
│   ├── start-pre-edit-hook.ts (existing)
│   └── start-post-edit-hook.ts (NEW)
├── responders/hook/
│   ├── pre-edit/ (existing)
│   └── post-edit/ (NEW)
│       ├── hook-post-edit-responder.ts
│       ├── hook-post-edit-responder.proxy.ts
│       └── hook-post-edit-responder.test.ts
├── brokers/
│   ├── violations/
│   │   ├── check-new/ (existing - pre-edit)
│   │   └── fix-and-report/ (NEW - post-edit)
│   │       ├── violations-fix-and-report-broker.ts
│   │       ├── violations-fix-and-report-broker.proxy.ts
│   │       └── violations-fix-and-report-broker.test.ts
│   └── eslint/
│       ├── lint-run-targeted/ (existing - no fix, filtered rules)
│       └── lint-run-with-fix/ (NEW - with fix, all rules, quiet mode)
│           ├── eslint-lint-run-with-fix-broker.ts
│           ├── eslint-lint-run-with-fix-broker.proxy.ts
│           └── eslint-lint-run-with-fix-broker.test.ts
├── adapters/fs/
│   └── write-file/ (check if exists, create if needed)
│       ├── fs-write-file-adapter.ts
│       ├── fs-write-file-adapter.proxy.ts
│       └── fs-write-file-adapter.test.ts
└── contracts/
    └── post-tool-use-hook-data/ (existing ✅)
```

## Implementation Order

1. Check/create file write adapter
2. Create ESLint fix broker (bottom-up) with quiet mode
3. Create violations fix-and-report broker (orchestrator)
4. Create responder
5. Create startup entry point
6. Add tests (unit then integration)
7. Update documentation

## Code Quality Considerations

### Import Rules

Brokers can only import entry files from other folders:

- ✅ Import adapters: Must match `-adapter.ts` pattern
- ✅ Import contracts: Must match `-contract.ts` pattern
- ✅ Import transformers: Must match `-transformer.ts` pattern
- ❌ Cannot import non-entry files across folders

### Type Definitions

- All types must be defined in contracts/ and imported
- No ad-hoc interface definitions in brokers/
- No raw primitive types (string, number) - use branded Zod types
- No magic numbers - extract to statics/

### Quiet Mode Implementation

```typescript
// Filter messages to errors only (severity === 2)
const errorResults = results.map((result) => ({
  ...result,
  messages: result.messages.filter((msg) => msg.severity === 2),
  warningCount: 0,
  errorCount: result.messages.filter((msg) => msg.severity === 2).length,
}));
```

**Note**: The number `2` is a magic number violation. Should extract to statics:

```typescript
// statics/lint-severity/lint-severity-statics.ts
export const lintSeverityStatics = {
  warning: 1,
  error: 2,
} as const;
```

## Hook Configuration

**User Configuration** (example):

```json
{
  "hooks": {
    "post-edit": {
      "command": "npx tsx packages/hooks/src/startup/start-post-edit-hook.ts"
    }
  }
}
```

## Success Criteria

✅ Post-edit hook runs after Write/Edit/MultiEdit operations
✅ Runs `eslint --fix` on the changed file
✅ Writes fixed content back to disk automatically
✅ Reports only error-level violations (quiet mode - no warnings)
✅ Uses full project ESLint configuration (no rule filtering)
✅ Never blocks (informational only)
✅ Has comprehensive unit and integration tests
✅ Follows project standards (contracts, brokers, proxies, etc.)

## Notes

### Difference in Config Loading

**Pre-Edit Hook**:

```typescript
// Load hook config (which rules to check)
const hookConfig = await hookConfigLoadBroker({ cwd });

// Load ESLint config
const eslintConfig = await eslintLoadConfigBroker({ cwd });

// FILTER rules based on hook config
const filteredConfig = eslintConfigFilterTransformer({
  eslintConfig,
  targetRules: hookConfig.rules,
});

// Run with filtered rules
await eslintLintRunTargetedBroker({ config: filteredConfig });
```

**Post-Edit Hook**:

```typescript
// Load ESLint config only - NO hook config, NO filtering
const eslintConfig = await eslintLoadConfigBroker({ cwd });

// Run with FULL config
await eslintLintRunWithFixBroker({ config: eslintConfig });
```

### Exit Codes

**Pre-Edit Hook**:

- 0: No violations, edit allowed
- 1: Invalid input
- 2: Violations detected, edit blocked

**Post-Edit Hook**:

- 0: Success (with or without violations)
- 1: Invalid input
- No exit code 2 (never blocks)

## Future Enhancements

- Support "dry-run" mode that doesn't write fixes
- Track before/after comparison like pre-edit hook
- Different exit codes for unfixable violations
- Integration with CI/CD pipelines
- Configuration option to control quiet mode
