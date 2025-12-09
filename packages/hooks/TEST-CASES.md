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

| Aspect          | Pre-Edit Hook                    | Post-Edit Hook           |
|-----------------|----------------------------------|--------------------------|
| **When**        | Before changes                   | After changes applied    |
| **Purpose**     | Block bad edits                  | Auto-fix + report        |
| **Blocking**    | Yes (exit 2 if violations)       | No (always exit 0)       |
| **Rules**       | Filtered subset (hook config)    | **All ESLint rules**     |
| **Auto-fix**    | No                               | **Yes** (writes to disk) |
| **Quiet mode**  | No (all severities)              | **Yes** (errors only)    |
| **Comparison**  | Old vs new content               | Just new content         |
| **Config file** | `.dungeonmaster-hooks.config.js` | Uses `eslint.config.js`  |

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
npm test --workspace=@dungeonmaster/hooks -- start-post-edit-hook.integration.test.ts
npm test --workspace=@dungeonmaster/hooks -- start-pre-edit-hook.integration.test.ts
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

**IMPORTANT:** Use `.info.ts` extension to avoid colocation rule violations during testing.

**Run tests in:** Any location inside the repo (e.g., `packages/hooks/src/.test-tmp/`)

**Hook behavior:**

- Post-edit hook runs automatically after Write/Edit operations complete
- Uses full `eslint.config.js` (all rules)
- Auto-fixes what it can, reports remaining errors

---

## Write Tool Tests (Post-Edit)

### Test 1: Write with auto-fixable violation (arrow-body-style)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - arrow - test.info.ts
Content:
    export const add = ({a, b}: { a: number; b: number }): number => {
        return a + b;
    };
```

**Expected:**

- File is written successfully
- Post-edit hook runs automatically
- Hook auto-fixes arrow-body-style (removes braces, converts to `=> a + b`)
- **Verify file was modified:** Read the file back - should be `=> a + b` not `{ return a + b; }`
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0 (never blocks)

### Test 2: Write with non-fixable error (no-console)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - console - test.info.ts
Content:
    export const test = (): void => {
        console.log('debug');
    };
```

**Expected:**

- File is written successfully
- Post-edit hook runs automatically
- Hook reports remaining violation: `no-console` (Unexpected console statement)
- **Verify file unchanged:** console.log remains (not auto-fixable)
- Reports violation to stderr with error details
- Exit code: 0 (never blocks)

### Test 3: Write with clean code

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - clean - test.info.ts
Content:
    export const testClean = ({param}: { param: string }): string => param.toUpperCase();
```

**Expected:**
- File is written successfully
- Post-edit hook runs automatically
- No violations found (code is already clean)
- **Verify file unchanged:** Code matches what was written
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 4: Write with multiple fixable violations (arrow-body + prettier)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - multi - test.info.ts
Content:
    export const add = ({a, b}: { a: number; b: number }): number => {
        return a + b;
    };
```

**Expected:**

- File is written successfully
- Post-edit hook runs automatically
- Hook auto-fixes both arrow-body-style and prettier violations
- **Verify file was fixed:** Should have proper spacing and `=> a + b`
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0 (never blocks)

---

## Edit Tool Tests (Post-Edit)

### Test 5: Edit adding auto-fixable violation (arrow-body-style)

**Setup:** First create a clean file

```typescript
Write: packages / hooks / src /
.
test - tmp / post - edit - test.info.ts
Content:
    export const testFunc = ({x}: { x: number }): number => x;
```

**Command:**

```typescript
Edit: packages / hooks / src /
.
test - tmp / post - edit - test.info.ts
Old: export const testFunc = ({x}: { x: number }): number => x;
New: export const testFunc = ({x}: { x: number }): number => {
    return x;
};
```

**Expected:**

- Edit is applied successfully
- Post-edit hook runs automatically
- Hook auto-fixes arrow-body-style (removes braces again)
- **Verify file was fixed:** Should be back to `=> x` not `{ return x; }`
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 6: Edit adding non-fixable error (no-console)

**Setup:** Use file from Test 5

**Command:**

```typescript
Edit: packages / hooks / src /
.
test - tmp / post - edit - test.info.ts
Old: export const testFunc = ({x}: { x: number }): number => x;
New: export const testFunc = ({x}: { x: number }): number => {
    console.log(x);
    return x;
};
```

**Expected:**

- Edit is applied successfully
- Post-edit hook runs automatically
- Hook reports remaining violation: `no-console` (Unexpected console statement)
- **Verify violation reported:** stderr shows console.log error
- Exit code: 0 (never blocks)

### Test 7: Edit removing violations

**Setup:** Use file from Test 6

**Command:**

```typescript
Edit: packages / hooks / src /
.
test - tmp / post - edit - test.info.ts
Old: export const testFunc = ({x}: { x: number }): number => {
    console.log(x);
    return x;
};
New: export const testFunc = ({x}: { x: number }): number => x;
```

**Expected:**
- Edit is applied successfully
- Post-edit hook runs automatically
- No violations found (console.log removed, arrow-body auto-fixed)
- **Verify file is clean:** Code is properly formatted
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

---

## Verification Tests

### Test 8: Verify auto-fix actually modifies file on disk

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - verify - fix.info.ts
Content:
    export const multiply = ({x, y}: { x: number; y: number }): number => {
        return x * y;
    };
```

**Then immediately read the file:**

```typescript
Read: packages / hooks / src /
.
test - tmp / post - verify - fix.info.ts
```

**Expected:**

- File should NOT contain original content with braces
- File should be auto-fixed to: `=> x * y` (no braces, no return statement)
- This proves post-edit hook actually wrote fixes to disk
- stderr showed "All violations auto-fixed successfully"

### Test 9: Verify non-fixable violations remain in file

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - verify - nonfixable.info.ts
Content:
    export const debug = (): void => {
        console.log('test');
    };
```

**Then immediately read the file:**

```typescript
Read: packages / hooks / src /
.
test - tmp / post - verify - nonfixable.info.ts
```

**Expected:**

- File still contains `console.log('test');` (not auto-fixable)
- stderr showed `no-console` violation error
- This proves non-fixable violations are reported but file left as-is
- Exit code was 0 (non-fixable violations don't block)

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
- ESLint ignores non-TypeScript file (no violations)
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 11: Empty TypeScript file

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - empty.info.ts
Content:
    (empty - no
content
)
```

**Expected:**
- File is written successfully
- Post-edit hook runs automatically
- No violations found (empty file is valid)
- Reports "All violations auto-fixed successfully" to stderr
- Exit code: 0

### Test 12: File with colocation violation (non-fixable post-edit rule)

**Command:**

```typescript
Write: packages / hooks / src /
.
test - tmp / post - colocation - test - broker.ts
Content:
    export const testBroker = async ({data}: { data: string }): Promise<string> => data;
```

**Expected:**

- File is written successfully
- Post-edit hook runs automatically
- Hook reports colocation violation: "Implementation file must have a colocated test file"
- **Verify violation reported:** stderr shows error about missing `.test.ts` file
- Exit code: 0 (never blocks, just reports)

---

## Success Criteria (Post-Edit Hook)

- ✅ All tests complete successfully with exit code 0
- ✅ Auto-fixable violations are fixed and written to disk
- ✅ Remaining error-level violations are reported to stderr (informational)
- ✅ Hook NEVER blocks any operation (always exits 0)
- ✅ Verification tests confirm file modifications actually happened
- ✅ Non-TypeScript files are handled gracefully

---

## Post-Edit Hook Output Examples

### Success with auto-fix:
```
All violations auto-fixed successfully
```

### Remaining violations after auto-fix (non-fixable rules):
```
🛑 New code quality violations detected:
  ❌ Code Quality Issue: 1 violation
     Line 2:3 - Unexpected console statement.
These rules help maintain code quality and safety. Please fix the violations.
```

Or:
```
🛑 New code quality violations detected:
  ❌ Code Quality Issue: 1 violation
     Line 1:1 - Implementation file must have a colocated test file. Create example-broker.test.ts (or .integration.test.ts or .spec.ts variant) in the same directory.
These rules help maintain code quality and safety. Please fix the violations.
```

### No violations:
```
All violations auto-fixed successfully
```

---

## Key Differences from Pre-Edit Hook

| Aspect                 | Pre-Edit Hook                       | Post-Edit Hook                                          |
|------------------------|-------------------------------------|---------------------------------------------------------|
| **When runs**          | Before file write                   | After file write                                        |
| **Purpose**            | Block bad code                      | Auto-fix + report                                       |
| **Blocks?**            | Yes (exit 2)                        | No (always exit 0)                                      |
| **Auto-fix**           | No                                  | **Yes** - writes to disk                                |
| **Rules checked**      | Filtered subset (35 pre-edit rules) | All ESLint rules                                        |
| **File extension tip** | N/A                                 | Use `.info.ts` to avoid colocation rules during testing |

---

## Tips for Manual Testing

1. **Use `.info.ts` extension** - Avoids colocation rule violations during testing
2. **Verify fixes were written** - Always read file back to confirm auto-fix worked
3. **Check stderr output** - Post-edit hook reports all status to stderr
4. **Exit code always 0** - Post-edit never blocks, even with violations
5. **Test in repo** - Files must be inside the repo for ESLint config discovery
