# Manual Test Cases for Pre-Edit and Post-Edit Hooks

## Overview

This document provides manual test cases to verify both hooks are working correctly:

- **Pre-Edit Hook**: Runs before changes, blocks violations (filtered rules)
- **Post-Edit Hook**: Runs after changes, auto-fixes and reports (all rules)

## Configured Rules (Hook should ONLY check these 3)

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/ban-ts-comment`
- `eslint-comments/no-use`

## Test Setup

Run tests in `packages/hooks/src/.test-tmp/` directory with hook enabled.

---

## Write Tool Tests

### Test 1: Write with `any` violation

**Command:**

```typescript
Write: packages / hooks / src / test - tmp / write - any - test.ts
Content:
    function testAny(param: any): void {
        console.log(param);
    }
```

**Expected:** BLOCKED - Should show `@typescript-eslint/no-explicit-any` violation

### Test 2: Write without violations

**Command:**

```typescript
Write: packages / hooks / src / test - tmp / write - clean - test.ts
Content:
    function testClean(param: string): void {
        console.log(param);
    }
```

**Expected:** ALLOWED - Should create file successfully

### Test 3: Write with unused vars (non-target rule)

**Command:**

```typescript
Write: packages / hooks / src / test - tmp / write - unused - vars - test.ts
Content:
    function testUnused(param: string): void {
        const unusedVariable = "this should be allowed";
        const anotherUnused = 42;
        console.log(param);
    }
```

**Expected:** ALLOWED - Should ignore unused variables (not in configured rules)

---

## Edit Tool Tests

### Test 4: Edit adding `any` type

**Setup:** First create clean file from Test 2
**Command:**

```typescript
Edit: packages / hooks / src / test - tmp / write - clean - test.ts
Old: function testClean(param: string): void {
    New: function testClean(param: any): void {
```

**Expected:** BLOCKED - Should show `@typescript-eslint/no-explicit-any` violation

### Test 5: Edit without new violations

**Command:**

```typescript
Edit: packages / hooks / src / test - tmp / write - clean - test.ts
Old: console.log(param);
New: console.log("Processing:", param);
```

**Expected:** ALLOWED - Should allow harmless string change

---

## MultiEdit Tool Tests

### Test 6: MultiEdit with violations

**Setup:** Use file from Test 3
**Command:**

```typescript
MultiEdit: packages / hooks / src / test - tmp / write - unused - vars - test.ts
Edit
1
:

function testUnused(param: string): void { → function testUnused(param: any): void {
    Edit
    2
:
    console.log(param); → console.log("Result:", param);
```

**Expected:** BLOCKED - Should show `@typescript-eslint/no-explicit-any` violation

### Test 7: MultiEdit without violations

**Command:**

```typescript
MultiEdit: packages / hooks / src / test - tmp / write - unused - vars - test.ts
Edit
1
:
const unusedVariable = "this should be allowed"; → const unusedVariable = "this is still allowed";
Edit
2
:
console.log(param); → console.log("Processing:", param);
```

**Expected:** ALLOWED - Should apply both edits successfully

### Test 7.1: MultiEdit with multiple `any` violations

**Setup:** Use file from Test 2
**Command:**

```typescript
MultiEdit: packages / hooks / src / test - tmp / write - clean - test.ts
Edit
1
:

function testClean(param: string): void { → function testClean(param: any): any {
    Edit
    2
:
    console.log("Processing:", param); → const result: any = param;
    console.log("Processing:", result);
    return result;
```

**Expected:** BLOCKED - Should show multiple `@typescript-eslint/no-explicit-any` violations with count

---

## Rule-Specific Tests

### Test 8: @ts-ignore comment blocking

**Command:**

```typescript
Write: packages / hooks / src / test - tmp / ts - ignore - test.ts
Content:
    function testTsIgnore(): void {
        // @ts-ignore
        const result = someUndefinedFunction();
        console.log(result);
    }
```

**Expected:** BLOCKED - Should show `@typescript-eslint/ban-ts-comment` violation

### Test 9: eslint-disable comment blocking

**Command:**

```typescript
Write: packages / hooks / src / test - tmp / eslint - disable - test.ts
Content:
    function testEslintDisable(): void {
        // eslint-disable-next-line no-console
        console.log("This should be blocked");
    }
```

**Expected:** BLOCKED - Should show `eslint-comments/no-use` violation

---

## Post-Test Cleanup

```bash
rm packages/hooks/src/.test-tmp/*
```

## Success Criteria (Pre-Edit Hook)

- All BLOCKED tests should prevent the operation with appropriate error messages
- All ALLOWED tests should complete successfully
- Hook should only check the 3 configured rules, ignoring other ESLint violations
- All three tools (Write, Edit, MultiEdit) should be properly intercepted

---

# Post-Edit Hook Manual Tests

## Overview

The post-edit hook runs **after** file changes are applied. It:

- Runs ESLint with `--fix` on the modified file
- Writes auto-fixes back to disk automatically
- Reports only **error-level** violations (quiet mode - no warnings)
- Uses **all ESLint rules** (not filtered like pre-edit)
- **Never blocks** (always exits with code 0)

## Test Setup

For manual command-line testing:

```bash
cd packages/hooks
```

## Command-Line Tests

### Test 1: Clean Code (No Violations)

**Scenario:** Write file with clean TypeScript code

**Command:**

```bash
echo '{
  "hook_event_name": "PostToolUse",
  "cwd": "'$(pwd)'",
  "tool_name": "Write",
  "tool_input": {
    "tool_name": "Write",
    "file_path": "/tmp/test-clean.ts",
    "content": "export const add = ({ a, b }: { a: number; b: number }): number => a + b;"
  }
}' | npx tsx src/startup/start-post-edit-hook.ts
echo "Exit code: $?"
```

**Expected:**

- Exit code: `0`
- Stderr: Empty or "All violations auto-fixed successfully"
- File `/tmp/test-clean.ts` unchanged (already clean)

---

### Test 2: Auto-Fixable Violations

**Scenario:** File with fixable violations (e.g., missing semicolons)

**Setup:**

```bash
cat > /tmp/test-fixable.ts << 'EOF'
export const greet = ({ name }: { name: string }): string => {
  return `Hello, ${name}`
}
EOF
```

**Command:**

```bash
echo '{
  "hook_event_name": "PostToolUse",
  "cwd": "'$(pwd)'",
  "tool_name": "Write",
  "tool_input": {
    "tool_name": "Write",
    "file_path": "/tmp/test-fixable.ts",
    "content": "export const greet = ({ name }: { name: string }): string => {\n  return \`Hello, \${name}\`\n}"
  }
}' | npx tsx src/startup/start-post-edit-hook.ts
echo "Exit code: $?"
cat /tmp/test-fixable.ts
```

**Expected:**

- Exit code: `0`
- Stderr: "All violations auto-fixed successfully"
- File `/tmp/test-fixable.ts` is auto-fixed with semicolons added

---

### Test 3: Non-Fixable Error Violations

**Scenario:** File with error-level violations that cannot be auto-fixed

**Setup:**

```bash
cat > /tmp/test-errors.ts << 'EOF'
export const debug = (): void => {
  console.log('debug message');
};
EOF
```

**Command:**

```bash
echo '{
  "hook_event_name": "PostToolUse",
  "cwd": "'$(pwd)'",
  "tool_name": "Write",
  "tool_input": {
    "tool_name": "Write",
    "file_path": "/tmp/test-errors.ts",
    "content": "export const debug = (): void => {\n  console.log(\"debug message\");\n};"
  }
}' | npx tsx src/startup/start-post-edit-hook.ts
echo "Exit code: $?"
```

**Expected:**

- Exit code: `0` (never blocks!)
- Stderr contains:
  ```
  🛑 New code quality violations detected:
    ❌ Code Quality Issue: 1 violation
       Line 2:3 - Unexpected console statement

  These rules help maintain code quality and safety. Please fix the violations.
  ```
- File may have fixable violations auto-fixed, but unfixable errors remain

---

### Test 4: Warning Violations (Quiet Mode Test)

**Scenario:** File with only warning-level violations

**Setup:**

```bash
# Assuming some rule is configured as "warn" instead of "error"
cat > /tmp/test-warnings.ts << 'EOF'
export const test = (): string => {
  const unused = 'value';  // Might be warning-level
  return 'test';
};
EOF
```

**Command:**

```bash
echo '{
  "hook_event_name": "PostToolUse",
  "cwd": "'$(pwd)'",
  "tool_name": "Write",
  "tool_input": {
    "tool_name": "Write",
    "file_path": "/tmp/test-warnings.ts",
    "content": "export const test = (): string => {\n  const unused = '\''value'\'';\n  return '\''test'\'';\n};"
  }
}' | npx tsx src/startup/start-post-edit-hook.ts
echo "Exit code: $?"
```

**Expected:**

- Exit code: `0`
- Stderr: "All violations auto-fixed successfully" (warnings filtered out by quiet mode)
- Warnings are **NOT** reported

---

### Test 5: Edit Tool

**Scenario:** Edit existing file

**Setup:**

```bash
cat > /tmp/test-edit.ts << 'EOF'
export const oldFunc = (): string => 'old';
EOF
```

**Command:**

```bash
echo '{
  "hook_event_name": "PostToolUse",
  "cwd": "'$(pwd)'",
  "tool_name": "Edit",
  "tool_input": {
    "tool_name": "Edit",
    "file_path": "/tmp/test-edit.ts",
    "old_string": "export const oldFunc = (): string => '\''old'\'';",
    "new_string": "export const newFunc = (): string => '\''new'\'';"
  }
}' | npx tsx src/startup/start-post-edit-hook.ts
echo "Exit code: $?"
cat /tmp/test-edit.ts
```

**Expected:**

- Exit code: `0`
- File checked, auto-fixed if needed
- Stderr reports success or remaining errors

---

### Test 6: Invalid Hook Data

**Test 6a: Invalid JSON**

**Command:**

```bash
echo 'invalid json' | npx tsx src/startup/start-post-edit-hook.ts
echo "Exit code: $?"
```

**Expected:**

- Exit code: `1`
- Stderr: "Hook error: Unexpected token"

**Test 6b: Missing Required Fields**

**Command:**

```bash
echo '{"invalid": "data"}' | npx tsx src/startup/start-post-edit-hook.ts
echo "Exit code: $?"
```

**Expected:**

- Exit code: `1`
- Stderr: "Invalid hook data format"

---

## Integration with Claude Code

### Setup Configuration

Add to your Claude Code config (`.claude-code-config.json` or similar):

```json
{
  "hooks": {
    "preToolUse": {
      "command": "npx tsx packages/hooks/src/startup/start-pre-edit-hook.ts"
    },
    "postToolUse": {
      "command": "npx tsx packages/hooks/src/startup/start-post-edit-hook.ts"
    }
  }
}
```

### Expected Workflow

1. **User requests edit** via Claude Code
2. **Pre-edit hook runs**:
    - If new violations detected (in filtered rules) → Edit **BLOCKED** (exit 2)
    - If no new violations → Edit proceeds
3. **Edit is applied** to file
4. **Post-edit hook runs**:
    - Runs ESLint with `--fix` on file
    - Auto-fixes violations and writes to disk
    - Reports remaining **error-level** violations to stderr
    - **Never blocks** (exit 0)

---

## Key Differences: Pre-Edit vs Post-Edit

| Aspect          | Pre-Edit Hook                   | Post-Edit Hook           |
|-----------------|---------------------------------|--------------------------|
| **When**        | Before changes                  | After changes applied    |
| **Purpose**     | Block bad edits                 | Auto-fix + report        |
| **Blocking**    | Yes (exit 2 if violations)      | No (always exit 0)       |
| **Rules**       | Filtered subset (hook config)   | **All ESLint rules**     |
| **Auto-fix**    | No                              | **Yes** (writes to disk) |
| **Quiet mode**  | No (all severities)             | **Yes** (errors only)    |
| **Comparison**  | Old vs new content              | Just new content         |
| **Config file** | `.questmaestro-hooks.config.js` | Uses `eslint.config.js`  |

---

## Debugging Tips

### Enable Verbose Output

```bash
DEBUG=eslint:* npx tsx src/startup/start-post-edit-hook.ts < input.json
```

### Check File After Auto-Fix

```bash
# Run hook, then check if file was modified
cat /tmp/test-file.ts
```

### Verify ESLint Config

```bash
# Check what config ESLint would use
npx eslint --print-config /tmp/test-file.ts
```

### Run Integration Tests

```bash
npm test --workspace=@questmaestro/hooks -- start-post-edit-hook.integration.test.ts
npm test --workspace=@questmaestro/hooks -- start-pre-edit-hook.integration.test.ts
```

---

## Exit Codes Reference

| Exit Code | Meaning                                           | Hook Type         |
|-----------|---------------------------------------------------|-------------------|
| **0**     | Success (pre: no new violations, post: completed) | Both              |
| **1**     | Invalid input (malformed JSON, missing fields)    | Both              |
| **2**     | New violations detected - edit **BLOCKED**        | **Pre-edit only** |

**Note:** Post-edit hook **never** returns exit code 2 (never blocks).

---

## Common Issues

### Issue: "ESLint error: Failed to load config"

**Cause:** Hook can't find `eslint.config.js`

**Solution:** Ensure `cwd` in hook data points to project root

---

### Issue: "No violations detected but file still has errors"

**Cause:** Quiet mode filters warnings, or rules not enabled as "error"

**Solution:** Check `eslint.config.js` - rules must be set to `"error"` (not `"warn"`)

---

### Issue: "Auto-fix didn't write changes"

**Cause:** File path incorrect or permissions issue

**Solution:**

- Verify file path is absolute
- Check file is writable: `ls -la /tmp/test-file.ts`

---

## Performance Notes

- **Pre-edit**: Runs ESLint twice (old + new content) for comparison
- **Post-edit**: Runs ESLint once with `--fix` enabled
- Both use ESLint's caching when available
- Integration tests use temp directories to avoid affecting real files