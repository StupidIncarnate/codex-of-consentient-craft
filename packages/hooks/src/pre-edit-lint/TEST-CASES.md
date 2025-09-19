# Manual Test Cases for Pre-Edit Lint Hook

## Overview

These are manual test cases to verify the pre-edit lint hook is working correctly across all supported tools (Write,
Edit, MultiEdit) and only enforcing the configured rules.

## Configured Rules (Hook should ONLY check these 3)

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/ban-ts-comment`
- `eslint-comments/no-use`

## Test Setup

Run tests in `packages/hooks/src/test-tmp/` directory with hook enabled.

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
rm packages/hooks/src/test-tmp/*
```

## Success Criteria

- All BLOCKED tests should prevent the operation with appropriate error messages
- All ALLOWED tests should complete successfully
- Hook should only check the 3 configured rules, ignoring other ESLint violations
- All three tools (Write, Edit, MultiEdit) should be properly intercepted