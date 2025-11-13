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
Write: packages / hooks / src /
.
test - tmp / write - any - test.ts
Content:
    function testAny(param: any): void {
        console.log(param);
    }
```

**Expected:** BLOCKED - Should show `@typescript-eslint/no-explicit-any` violation

### Test 2: Write without violations

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / write - clean - test.ts
Content:
    function testClean(param: string): void {
        console.log(param);
    }
```

**Expected:** ALLOWED - Should create file successfully

### Test 3: Write with unused vars (non-target rule)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / write - unused - vars - test.ts
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
Edit: packages / hooks / src /
.
test - tmp / write - clean - test.ts
Old: function testClean(param: string): void {
    New: function testClean(param: any): void {
```

**Expected:** BLOCKED - Should show `@typescript-eslint/no-explicit-any` violation

### Test 5: Edit without new violations

**Command:**

```typescript
Edit: packages / hooks / src /
.
test - tmp / write - clean - test.ts
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
MultiEdit: packages / hooks / src /
.
test - tmp / write - unused - vars - test.ts
Edit
1
:
Old: function testUnused(param: string): void {
    New: function testUnused(param: any): void {
        Edit
        2
    :
        Old: console.log(param);
        New: console.log("Result:", param);
```

**Expected:** BLOCKED - Should show `@typescript-eslint/no-explicit-any` violation

### Test 7: MultiEdit without violations

**Command:**

```typescript
MultiEdit: packages / hooks / src /
.
test - tmp / write - unused - vars - test.ts
Edit
1
:
Old: const unusedVariable = "this should be allowed";
New: const unusedVariable = "this is still allowed";
Edit
2
:
Old: console.log(param);
New: console.log("Processing:", param);
```

**Expected:** ALLOWED - Should apply both edits successfully

### Test 7.1: MultiEdit with multiple `any` violations

**Setup:** Use file from Test 2

**Command:**

```typescript
MultiEdit: packages / hooks / src /
.
test - tmp / write - clean - test.ts
Edit
1
:
Old: function testClean(param: string): void {
    New: function testClean(param: any): any {
        Edit
        2
    :
        Old: console.log("Processing:", param);
        New: const result: any = param;
        console.log("Processing:", result);
        return result;
```

**Expected:** BLOCKED - Should show multiple `@typescript-eslint/no-explicit-any` violations with count

---

## Rule-Specific Tests

### Test 8: @ts-ignore comment blocking

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / ts - ignore - test.ts
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
Write: packages / hooks / src /
.
test - tmp / eslint - disable - test.ts
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

---

# Post-Edit Hook Manual Test Cases

## Overview

The post-edit hook runs AFTER changes are applied to files. It:

- Runs ESLint with `--fix` on the modified file
- Auto-fixes violations and writes changes to disk
- Reports remaining **error-level** violations to stderr (informational only)
- **NEVER blocks** - always exits with code 0

## Test Setup

Run tests in `packages/hooks/src/.test-tmp/` directory with post-edit hook enabled.

**Important:**

- Post-edit hook runs automatically after Write/Edit/MultiEdit operations complete
- These tests use violations NOT in pre-edit filter (pre-edit only blocks: `no-explicit-any`, `ban-ts-comment`,
  `no-use`)
- Post-edit checks ALL ESLint rules and auto-fixes what it can

---

## Write Tool Tests (Post-Edit)

### Test 1: Write with auto-fixable violation (arrow-body-style)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - write - arrow - body.ts
Content:
    export const add = ({a, b}: { a: number; b: number }): number => {
        return a + b;
    };
```

**Expected:**

- File is written successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook auto-fixes arrow-body-style (removes braces, converts to `=> a + b`)
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0 (never blocks)

### Test 2: Write with non-fixable error (enforce-object-destructuring-params)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - write - no - destructure.ts
Content:
    export const process = (data: unknown): unknown => data;
```

**Expected:**

- File is written successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook reports remaining violation: `@questmaestro/enforce-object-destructuring-params`
- Error message to stderr: "Parameters must use object destructuring pattern"
- Exit code: 0 (never blocks)

### Test 3: Write with clean code

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - write - clean - test.ts
Content:
    export function testClean(param: string): string {
        return param.toUpperCase();
    }
```

**Expected:**

- File is written successfully
- Post-edit hook runs automatically
- No violations found
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 4: Write with multiple violations (missing return type + can be fixed)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - write - multiple - test.ts
Content:
    export const add = ({a, b}: { a: number; b: number }) => {
        return a + b;
    };
```

**Expected:**

- File is written successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook reports violation: `@questmaestro/explicit-return-types` (missing return type)
- Hook may also auto-fix arrow-body-style
- Error message to stderr with violation details
- Exit code: 0 (never blocks)

---

## Edit Tool Tests (Post-Edit)

### Test 5: Edit adding auto-fixable violation (arrow-body-style)

**Setup:** First create clean file from Test 3

**Command:**

```typescript
Edit: packages / hooks / src /
.
test - tmp / post - write - clean - test.ts
Old: return param.toUpperCase();
New: return param.toUpperCase() + param.toLowerCase();
```

Then change to block style:

```typescript
Edit: packages / hooks / src /
.
test - tmp / post - write - clean - test.ts
Old: export function testClean(param: string): string {
    return param.toUpperCase() + param.toLowerCase();
}
New: export const testClean = ({param}: { param: string }): string => {
    return param.toUpperCase() + param.toLowerCase();
};
```

**Expected:**

- Edit is applied successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook auto-fixes arrow-body-style (removes braces)
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 6: Edit adding non-fixable error (forbid-non-exported-functions)

**Setup:** Use file from Test 3

**Command:**

```typescript
Edit: packages / hooks / src /
.
test - tmp / post - write - clean - test.ts
Old: export function testClean(param: string): string {
    return param.toUpperCase();
}
New: const helper = (): string => "test";

export function testClean(param: string): string {
    return param.toUpperCase();
}
```

**Expected:**

- Edit is applied successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook reports remaining violation: `@questmaestro/forbid-non-exported-functions`
- Error message to stderr: "All functions must be exported"
- Exit code: 0 (never blocks)

### Test 7: Edit removing violations

**Setup:** Use file from Test 2

**Command:**

```typescript
Edit: packages / hooks / src /
.
test - tmp / post - write - no - destructure.ts
Old: export const process = (data: unknown): unknown => data;
New: export const process = ({data}: { data: unknown }): unknown => data;
```

**Expected:**

- Edit is applied successfully
- Post-edit hook runs automatically
- No violations found (destructuring pattern now used)
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

---

## MultiEdit Tool Tests (Post-Edit)

### Test 8: MultiEdit with auto-fixable violations (arrow-body-style)

**Setup:** Create a new file with multiple arrow functions

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - multi - arrows.ts
Content:
    export const add = ({a, b}: { a: number; b: number }): number => {
        return a + b;
    };

export const subtract = ({a, b}: { a: number; b: number }): number => {
    return a - b;
};
```

**Expected:**

- Both edits are applied successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook auto-fixes both arrow-body-style violations (removes braces)
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 9: MultiEdit with mixed violations (missing return type + non-exported function)

**Setup:** Use file from Test 3

**Command:**

```typescript
MultiEdit: packages / hooks / src /
.
test - tmp / post - write - clean - test.ts
Edit
1
:
Old: export function testClean(param: string): string {
    New: const helper = (): string => "test";

    export function testClean(param: string): string {
        Edit
        2
    :
        Old: return param.toUpperCase();
        New: const transform = (x: string) => x.toLowerCase();
        return param.toUpperCase();
```

**Expected:**

- Both edits are applied successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook reports violations:
    - `@questmaestro/forbid-non-exported-functions` for helper
    - `@questmaestro/explicit-return-types` for transform
    - `@questmaestro/forbid-non-exported-functions` for transform
- Error message to stderr with violation details
- Exit code: 0 (never blocks)

---

## Edge Cases (Post-Edit)

### Test 10: Non-TypeScript file (Markdown)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - readme.md
Content:
    #
Test
README

Some
markdown
content.
```

**Expected:**

- File is written successfully
- Post-edit hook runs automatically
- ESLint ignores non-TypeScript file
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 11: Empty file

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - empty.ts
Content:
    (empty)
```

**Expected:**

- File is written successfully
- Post-edit hook runs automatically
- No violations found
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 12: File with only auto-fixable violations (arrow-body-style)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - all - fixable.ts
Content:
    export const add = ({a, b}: { a: number; b: number }): number => {
        return a + b;
    };

export const multiply = ({a, b}: { a: number; b: number }): number => {
    return a * b;
};

export const divide = ({a, b}: { a: number; b: number }): number => {
    return a / b;
};
```

**Expected:**

- File is written successfully (pre-edit allows - not in filtered rules)
- Post-edit hook runs automatically
- Hook auto-fixes all arrow-body-style violations (removes braces from all 3 functions)
- User can see file is modified after hook completes
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

---

---

## Verification Tests (Post-Edit Auto-Fix)

### Test 13: Verify auto-fix actually modified file

**Step 1 - Write file with fixable violations:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - verify - autofix.ts
Content:
    export const add = ({a, b}: { a: number; b: number }): number => {
        return a + b;
    };

export const subtract = ({a, b}: { a: number; b: number }): number => {
    return a - b;
};
```

**Step 2 - Read file to verify auto-fix applied:**

```typescript
Read: packages / hooks / src /
.
test - tmp / post - verify - autofix.ts
```

**Expected:**

- File content should be different from what was written (auto-fixed)
- Arrow functions should be converted to expression body (no braces)
- Should see: `=> a + b` and `=> a - b` instead of `{ return ... }`
- Post-edit hook reported "All violations auto-fixed successfully"

### Test 14: Verify non-fixable violations remain in file

**Step 1 - Write file with non-fixable violation:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - verify - nonfixable.ts
Content:
    export const process = (data: unknown): unknown => data;
```

**Step 2 - Read file to verify violations remain:**

```typescript
Read: packages / hooks / src /
.
test - tmp / post - verify - nonfixable.ts
```

**Expected:**

- File content unchanged (no auto-fix available for enforce-object-destructuring-params)
- Post-edit hook reported violations to stderr: `@questmaestro/enforce-object-destructuring-params`
- File still contains `(data: unknown)` instead of `({ data }: { data: unknown })`

---

## Success Criteria (Post-Edit Hook)

- All tests complete successfully with exit code 0
- Auto-fixable violations are fixed and written to disk
- Remaining error-level violations are reported to stderr (informational)
- Hook NEVER blocks any operation (always exits 0)
- All three tools (Write, Edit, MultiEdit) trigger post-edit hook
- Non-TypeScript files are handled gracefully

---

## Post-Edit Hook Output Examples

### Success with auto-fix:

```
All violations auto-fixed successfully
```

### Remaining violations after auto-fix (non-fixable rules):

```
Found 1 ESLint error(s):
  - @questmaestro/enforce-object-destructuring-params: 1 violation(s)
```

Or:

```
Found 2 ESLint error(s):
  - @questmaestro/forbid-non-exported-functions: 2 violation(s)
```

Or:

```
Found 1 ESLint error(s):
  - @questmaestro/explicit-return-types: 1 violation(s)
```

### No violations:

```
All violations auto-fixed successfully
```

**Note:** Post-edit tests use violations NOT in pre-edit filter. Pre-edit ONLY blocks:

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/ban-ts-comment`
- `eslint-comments/no-use`

Post-edit tests use rules like:

- `arrow-body-style` (auto-fixable)
- `@questmaestro/enforce-object-destructuring-params` (non-fixable)
- `@questmaestro/explicit-return-types` (non-fixable)
- `@questmaestro/forbid-non-exported-functions` (non-fixable)