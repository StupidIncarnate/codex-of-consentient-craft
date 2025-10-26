# Test Coverage Analysis Report - @questmaestro/tooling

**Generated:** 2025-10-25
**Current Test Suite Status:** 12 test suites, 38 tests passing
**Overall Branch Coverage:** ~64% (broker), 100% (adapters with gaps), 100% (contracts with gaps)

---

## Executive Summary

While all existing tests pass and follow testing standards correctly, there are **significant gaps** in:

1. **Branch Coverage** - Broker has 64.28% coverage with critical regex detection untested
2. **Edge Cases** - Missing ~80+ edge case tests across contracts, adapters, and broker
3. **Standards Violations** - TypeScript parse adapter has 3 violations to fix
4. **Real-World Scenarios** - Regex literals, unicode, special characters, error handling

### Critical Issues

🔴 **BLOCKER**: Regex literal detection (lines 60-62) completely untested - tool advertises finding regex but has 0 tests
for it!
🔴 **BLOCKER**: Default parameters (lines 24-25) untested - users will hit this immediately
🟡 **HIGH**: TypeScript parse adapter violates testing standards (toBeDefined, array element testing)
🟡 **MEDIUM**: Missing 53 adapter edge case tests (errors, unicode, special chars)
🟢 **LOW**: Missing 30+ contract edge case tests (comprehensive but not critical)

---

## Table of Contents

1. [Broker Test Coverage Analysis](#broker-test-coverage-analysis)
2. [Adapter Test Coverage Analysis](#adapter-test-coverage-analysis)
3. [Contract Test Coverage Analysis](#contract-test-coverage-analysis)
4. [Testing Standards Violations](#testing-standards-violations)
5. [Detailed Missing Test Cases](#detailed-missing-test-cases)
6. [Implementation Priority](#implementation-priority)

---

## Broker Test Coverage Analysis

**File:** `src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.test.ts`
**Implementation:** `src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.ts`

### Current Coverage

- **Statements:** 100%
- **Branch Coverage:** 64.28% ❌
- **Functions:** 100%
- **Lines:** 100%
- **Uncovered Lines:** 24, 28, 60-62

### Uncovered Branches

#### Branch 1: Default Threshold (Line 24) - UNCOVERED

```typescript
const actualThreshold = threshold ?? 3;
```

**Impact:** Users calling without threshold parameter will hit untested code
**Risk:** HIGH - common usage pattern

#### Branch 2: CWD Parameter (Line 28) - UNCOVERED

```typescript
const filePaths = await globFindAdapter(cwd ? {pattern, cwd} : {pattern});
```

**Impact:** Both with and without cwd parameter untested
**Risk:** HIGH - affects file discovery

#### Branch 3: Regex Detection (Lines 60-62) - UNCOVERED ⚠️ CRITICAL

```typescript
const isRegex = literalValue.startsWith('/') &&
    (literalValue.endsWith('/') || /\/[gimsuvy]*$/u.exec(literalValue));
const type = literalTypeContract.parse(isRegex ? 'regex' : 'string');
```

**Impact:** Tool advertises finding regex patterns but has ZERO tests for regex detection!
**Risk:** CRITICAL - core functionality completely untested

### Critical Missing Tests (for 100% Branch Coverage)

```typescript
describe('duplicateDetectionDetectBroker', () => {
    describe('default parameters', () => {
        it('VALID: {threshold: omitted} => uses default threshold of 3', async () => {
            // Tests line 24: threshold ?? 3
            // Setup: 3 duplicates without providing threshold
            // Expect: Returns duplicates (proves default of 3 works)
        });

        it('VALID: {minLength: omitted} => uses default minLength of 3', async () => {
            // Tests line 25: minLength ?? 3
            // Setup: Strings of length 2 and 3 without providing minLength
            // Expect: Only includes strings >= 3 chars
        });
    });

    describe('cwd parameter', () => {
        it('VALID: {cwd: "/custom/path"} => passes cwd to glob adapter', async () => {
            // Tests line 28: cwd ? { pattern, cwd } : { pattern }
            // Setup: Provide custom cwd
            // Expect: Finds files in custom directory
        });

        it('VALID: {cwd: omitted} => uses current directory', async () => {
            // Tests line 28: cwd ? { pattern, cwd } : { pattern }
            // Setup: Don't provide cwd
            // Expect: Uses process.cwd()
        });
    });

    describe('regex literal detection', () => {
        it('VALID: {files with regex literals} => detects regex type', async () => {
            // Tests lines 60-62: regex detection
            // Setup: /test/g appearing 3+ times
            // Expect: Returns report with type: 'regex'
        });

        it('VALID: {regex without flags /pattern/} => detects regex type', async () => {
            // Tests lines 60-62: regex without flags
            // Setup: /test/ appearing 3+ times
            // Expect: Returns report with type: 'regex'
        });

        it('VALID: {regex with multiple flags /pattern/gimsu} => detects regex type', async () => {
            // Tests lines 60-62: regex with many flags
            // Setup: /test/gimsu appearing 3+ times
            // Expect: Returns report with type: 'regex'
        });

        it('VALID: {mixed strings and regex} => returns both types correctly', async () => {
            // Tests lines 60-62: both types in same scan
            // Setup: Both "error" string and /test/ regex appearing 3+ times
            // Expect: Two reports, one type: 'string', one type: 'regex'
        });

        it('VALID: {file with only regex literals} => returns only regex reports', async () => {
            // Tests lines 60-62: only regex, no strings
            // Setup: Only regex patterns
            // Expect: All reports have type: 'regex'
        });
    });

    describe('special characters in literals', () => {
        it('VALID: {strings with escaped quotes} => handles escaped characters', async () => {
            // Setup: "He said \"hello\"" appearing 3+ times
            // Expect: Correct value with unescaped quotes
        });

        it('VALID: {strings with newlines} => handles multiline strings', async () => {
            // Setup: "line1\nline2" appearing 3+ times
            // Expect: Correct value with actual newline
        });

        it('VALID: {strings with unicode} => handles unicode characters', async () => {
            // Setup: "Hello 👋 世界" appearing 3+ times
            // Expect: Correct unicode preservation
        });
    });

    describe('threshold boundary cases', () => {
        it('EDGE: {duplicates at exact threshold} => includes them', async () => {
            // Setup: Literal appearing exactly threshold times
            // Expect: Included in results
        });

        it('EDGE: {duplicates one below threshold} => excludes them', async () => {
            // Setup: Literal appearing threshold-1 times
            // Expect: NOT in results
        });

        it('VALID: {threshold: 2, multiple duplicates} => returns all meeting threshold', async () => {
            // Setup: Mix of 2, 3, and 1 occurrences with threshold=2
            // Expect: Only those with 2+ occurrences
        });
    });

    describe('minLength boundary cases', () => {
        it('EDGE: {strings at exact minLength} => includes them', async () => {
            // Setup: "abc" with minLength=3
            // Expect: Included
        });

        it('EDGE: {strings one char below minLength} => excludes them', async () => {
            // Setup: "ab" with minLength=3
            // Expect: NOT included
        });

        it('VALID: {minLength: 1} => includes single character strings', async () => {
            // Setup: "x" appearing 3+ times with minLength=1
            // Expect: Included
        });
    });

    describe('sorting verification', () => {
        it('VALID: {multiple duplicates with different counts} => sorts by count descending', async () => {
            // Setup: "high" with 5 occurrences, "low" with 2
            // Expect: "high" appears first in results array
        });
    });

    describe('single file duplicates', () => {
        it('VALID: {single file with internal duplicates} => detects within-file duplicates', async () => {
            // Setup: One file with same literal 3+ times
            // Expect: Detects duplicates within single file
        });
    });
});
```

### Additional Edge Cases Needed

- Empty files
- Files with only whitespace
- Files with only comments (no literals)
- Very large files (1000+ duplicates)
- Cross-file aggregation (same literal across 100+ files)
- Regex with special characters: `/[a-z]\d+\.*/`
- Strings with backslashes: `"C:\\path\\to\\file"`

**Total Missing Broker Tests:** ~20+

---

## Adapter Test Coverage Analysis

### 1. TypeScript Parse Adapter

**File:** `src/adapters/typescript/parse/typescript-parse-adapter.test.ts`
**Current Tests:** 5 passing

#### ❌ Testing Standards Violations (MUST FIX FIRST)

**Violation 1: Using `toBeDefined()` instead of testing actual values**

Lines 17, 39, 83 use `toBeDefined()` which only checks existence.

```typescript
// ❌ WRONG - Line 17
expect(testOccurrences).toBeDefined();

// ✅ CORRECT - Should directly test the value
expect(testOccurrences).toStrictEqual([
    {filePath: '/file.ts', line: 1, column: 28},
    {filePath: '/file.ts', line: 1, column: 10}
]);
```

**Violation 2: Testing array elements individually (Lines 19-27, 41-45)**

```typescript
// ❌ WRONG - Lines 19-27
expect(testOccurrences?.[0]).toStrictEqual({filePath: '/file.ts', line: 1, column: 28});
expect(testOccurrences?.[1]).toStrictEqual({filePath: '/file.ts', line: 1, column: 10});

// ✅ CORRECT - Test complete array
expect(testOccurrences).toStrictEqual([
    {filePath: '/file.ts', line: 1, column: 28},
    {filePath: '/file.ts', line: 1, column: 10}
]);
```

**Violation 3: Optional chaining in assertions (Lines 19, 24, 41, 85-87)**

Using `?.[0]` masks potential undefined values.

**Fix:** Remove `toBeDefined()` checks and test complete arrays.

#### Missing Test Cases (28 total)

**Branch Coverage (2 tests)**

- Single occurrence creates new map entry (tests else branch)
- Multiple occurrences updates existing map entry (tests if branch)

**Source Code Edge Cases (11 tests)**

- Empty source code
- Only comments (no literals)
- Template literals
- Nested objects
- Array literals
- Function default arguments
- JSX elements (if applicable)
- Import/export statements
- Type annotations (string literal types)
- String exactly at minLength
- String one char below minLength

**MinLength Variations (3 tests)**

- minLength: 0 (includes empty strings)
- minLength: 1 (includes single chars)
- minLength: 1000 (excludes everything)

**Special String Content (5 tests)**

- Unicode: "🚀emoji", "你好世界"
- Escaped quotes: `"He said \"hello\""`
- Newlines in strings: `"line1\nline2"`
- Very long strings (10,000+ chars)
- Whitespace-only strings: "   "

**Invalid TypeScript (3 tests)**

- Syntax errors (parser is resilient)
- Incomplete tokens
- Mixed single/double quotes

**Regex Variations (4 tests)**

- Regex with different flags: `/test/gi`, `/test/m`
- Complex regex patterns: `/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-z]{2,}$/`
- Duplicate regex patterns
- Escaped characters in regex: `/\d+\.\d+/`

### 2. FS Read File Adapter

**File:** `src/adapters/fs/read-file/fs-read-file-adapter.test.ts`
**Current Tests:** 3 passing
**Standards Compliance:** ✅ All good

#### Missing Test Cases (11 total)

**File System Errors (6 tests)**

- Permission denied (EACCES)
- Is directory (EISDIR)
- Broken symlink (ELOOP)
- File locked (EBUSY)
- Invalid encoding
- Path too long (ENAMETOOLONG)

**File Content Edge Cases (5 tests)**

- Very large file (10MB+)
- Unicode content: "const emoji = \"🚀\";"
- Special characters: `"\\n\\t\\r\\"\\\\"`
- Only whitespace content
- Single character content

### 3. Glob Find Adapter

**File:** `src/adapters/glob/find/glob-find-adapter.test.ts`
**Current Tests:** 3 passing
**Standards Compliance:** ✅ All good

#### Missing Test Cases (14 total)

**CWD Variations (2 tests)**

- Explicit cwd parameter
- Omitted cwd (uses process.cwd())

**Pattern Edge Cases (8 tests)**

- Single wildcard: `"*"`
- Recursive wildcard: `"**"`
- Multiple extensions: `"*.{ts,tsx,js}"`
- Complex negation: `"src/**/!(*.test).ts"`
- Empty results
- Single file match
- Many files (100+)
- Character classes: `"[a-z]*.ts"`

**Error Scenarios (4 tests)**

- Glob pattern error
- CWD does not exist
- CWD is a file (not directory)
- Permission denied on CWD

**Note:** Proxy needs `throws()` method added for error testing.

---

## Contract Test Coverage Analysis

All contract tests follow standards correctly (✅), but missing comprehensive edge cases.

### Missing Edge Cases by Contract

#### 1. AbsoluteFilePath (10+ missing)

- Root directory: "/"
- Single char: "/a"
- Very long path
- Spaces in path: "/path/with spaces/file.ts"
- Special chars: dashes, underscores, dots, @
- Unicode: "/путь/файл.ts", "/路径/文件.ts"
- Empty string (if allowed)

#### 2. LiteralValue (9+ missing)

- Single character
- Very long string
- Spaces, newlines, tabs
- Quotes and backslashes
- Special characters
- Unicode/emoji: "文字列", "🔥💯"

#### 3. LiteralType

- ✅ Complete (enum with 2 values, both tested)

#### 4. GlobPattern (8+ missing)

- Empty: ""
- Single wildcards: "*", "?"
- Complex patterns: "**/*", "*.{ts,tsx}"
- Negation: "!node_modules/**"
- Character classes: "[abc]*.ts"
- Spaces in pattern

#### 5. SourceCode (10+ missing)

- Single whitespace, single char
- Escaped quotes in code
- Comments only
- Multiline code
- Regex in code
- Template literals
- Complex objects
- Unicode identifiers
- Very long code

#### 6. OccurrenceThreshold (2 missing)

- Very large number (1,000,000)
- MAX_SAFE_INTEGER

#### 7. LiteralOccurrence (4 missing)

- Very large line/column numbers
- MAX_SAFE_INTEGER boundaries
- Root file path
- Very long file path

#### 8. DuplicateLiteralReport (3 missing)

- Large count (100+)
- Empty string value
- Very long literal value
- Special characters in value

**Total Missing Contract Tests:** ~30+

---

## Testing Standards Violations

### TypeScript Parse Adapter - 3 Violations

**Location:** `src/adapters/typescript/parse/typescript-parse-adapter.test.ts`

1. **Lines 17, 39, 83:** Using `toBeDefined()` instead of actual value assertions
    - **Standard:** "Test Values, Not Existence"
    - **Fix:** Remove `toBeDefined()` and test complete values

2. **Lines 18-27, 40-44, 85-87:** Testing array elements individually
    - **Standard:** "Property Bleedthrough" - always test complete objects/arrays
    - **Fix:** Use single `toStrictEqual()` on entire array

3. **Lines 19, 24, 41, 85-87:** Optional chaining in assertions (`?.[0]`)
    - **Standard:** Assertions should fail clearly if value is undefined
    - **Fix:** Remove optional chaining or assert non-null first

### All Other Tests: ✅ Compliant

- Proper use of stubs (not contracts)
- Complete object assertions with `toStrictEqual()`
- Proper PREFIX: {input} => outcome format
- Nested describe blocks
- Explicit values to stubs

---

## Detailed Missing Test Cases

### Priority 1: Critical for 100% Branch Coverage

**Broker - Regex Detection (Lines 60-62)**

```typescript
it('VALID: {files with regex literals} => detects regex type', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({value: '**/*.ts'});
    const files = [
        {
            filePath: AbsoluteFilePathStub({value: '/file1.ts'}),
            sourceCode: SourceCodeStub({value: 'const p1 = /test/g; const p2 = /test/g;'}),
        },
        {
            filePath: AbsoluteFilePathStub({value: '/file2.ts'}),
            sourceCode: SourceCodeStub({value: 'const p3 = /test/g;'}),
        },
    ];
    const threshold = OccurrenceThresholdStub({value: 3});

    brokerProxy.setupFiles({pattern, files});

    const result = await duplicateDetectionDetectBroker({pattern, threshold});

    expect(result).toStrictEqual([
        {
            value: '/test/g',
            type: 'regex',
            count: 3,
            occurrences: [
                {filePath: '/file1.ts', line: 1, column: 39},
                {filePath: '/file1.ts', line: 1, column: 16},
                {filePath: '/file2.ts', line: 1, column: 17},
            ],
        },
    ]);
});

it('VALID: {regex without flags} => detects regex type', async () => {
    // Same structure but /test/ without flags
});

it('VALID: {regex with multiple flags /pattern/gimsu} => detects regex type', async () => {
    // Test all flag combinations
});

it('VALID: {mixed strings and regex} => returns both types correctly', async () => {
    // Test both "error" strings and /test/ regex in same scan
    // Expect 2 reports, one for each type
});
```

**Broker - Default Parameters (Lines 24-25)**

```typescript
it('VALID: {threshold: omitted} => uses default threshold of 3', async () => {
    const brokerProxy = duplicateDetectionDetectBrokerProxy();
    const pattern = GlobPatternStub({value: '**/*.ts'});
    const files = [
        {
            filePath: AbsoluteFilePathStub({value: '/file1.ts'}),
            sourceCode: SourceCodeStub({
                value: 'const a = "test"; const b = "test"; const c = "test";'
            }),
        },
    ];

    brokerProxy.setupFiles({pattern, files});

    // Call WITHOUT threshold parameter
    const result = await duplicateDetectionDetectBroker({pattern});

    expect(result).toStrictEqual([
        {
            value: 'test',
            type: 'string',
            count: 3,
            occurrences: [
                {filePath: '/file1.ts', line: 1, column: 43},
                {filePath: '/file1.ts', line: 1, column: 24},
                {filePath: '/file1.ts', line: 1, column: 10},
            ],
        },
    ]);
});

it('VALID: {minLength: omitted} => uses default minLength of 3', async () => {
    // Similar test for minLength default
});
```

**Broker - CWD Parameter (Line 28)**

```typescript
it('VALID: {cwd: "/custom/path"} => passes cwd to glob adapter', async () => {
    // Test with explicit cwd
});

it('VALID: {cwd: omitted} => uses current directory', async () => {
    // Test without cwd parameter
});
```

### Priority 2: Standards Violations

**TypeScript Parse Adapter - Fix All Violations**

```typescript
// Before (WRONG):
const testOccurrences = result.get(LiteralValueStub({value: 'test'}));
expect(testOccurrences).toBeDefined();
expect(testOccurrences).toHaveLength(2);
expect(testOccurrences?.[0]).toStrictEqual({filePath: '/file.ts', line: 1, column: 28});
expect(testOccurrences?.[1]).toStrictEqual({filePath: '/file.ts', line: 1, column: 10});

// After (CORRECT):
const testOccurrences = result.get(LiteralValueStub({value: 'test'}));
expect(testOccurrences).toStrictEqual([
    {filePath: '/file.ts', line: 1, column: 28},
    {filePath: '/file.ts', line: 1, column: 10},
]);
```

Apply this fix to all 3 affected tests in the file.

### Priority 3: High-Value Edge Cases

**Special Characters (affects real-world usage)**

```typescript
describe('special characters in literals', () => {
    it('VALID: {strings with escaped quotes} => handles escaped characters', async () => {
        // "He said \"hello\"" appearing 3+ times
    });

    it('VALID: {strings with newlines} => handles multiline strings', async () => {
        // "line1\nline2" appearing 3+ times
    });

    it('VALID: {strings with unicode} => handles unicode characters', async () => {
        // "Hello 👋 世界" appearing 3+ times
    });

    it('VALID: {strings with backslashes} => handles escape sequences', async () => {
        // "C:\\path\\to\\file" appearing 3+ times
    });
});
```

**Threshold Boundaries**

```typescript
describe('threshold boundary cases', () => {
    it('EDGE: {duplicates at exact threshold} => includes them', async () => {
        // Exactly 3 occurrences with threshold=3
    });

    it('EDGE: {duplicates one below threshold} => excludes them', async () => {
        // Exactly 2 occurrences with threshold=3
    });

    it('VALID: {threshold: 2} => returns all with 2+ occurrences', async () => {
        // Test lower threshold
    });
});
```

**MinLength Boundaries**

```typescript
describe('minLength boundary cases', () => {
    it('EDGE: {strings at exact minLength} => includes them', async () => {
        // "abc" with minLength=3
    });

    it('EDGE: {strings one char below minLength} => excludes them', async () => {
        // "ab" with minLength=3
    });

    it('VALID: {minLength: 1} => includes single character strings', async () => {
        // "x" with minLength=1
    });
});
```

### Priority 4: Comprehensive Edge Cases

**Adapter Tests** - See detailed sections above for all 53 missing tests

**Contract Tests** - See detailed sections above for all ~30 missing tests

---

## Implementation Priority

### Phase 1: Blockers (MUST DO IMMEDIATELY) 🔴

**Estimated Effort:** 2-3 hours

1. **Fix TypeScript Parse Adapter violations** (3 tests)
    - Remove `toBeDefined()`
    - Test complete arrays
    - Remove optional chaining

2. **Add broker regex detection tests** (5 tests)
    - Regex with flags
    - Regex without flags
    - Mixed strings and regex
    - Only regex literals
    - Regex with multiple flags

3. **Add broker default parameter tests** (2 tests)
    - Default threshold
    - Default minLength

4. **Add broker cwd tests** (2 tests)
    - With cwd
    - Without cwd

**Outcome:** 100% branch coverage, all standards violations fixed

### Phase 2: High-Value Edge Cases (SHOULD DO) 🟡

**Estimated Effort:** 3-4 hours

1. **Broker special characters** (4 tests)
    - Escaped quotes
    - Newlines
    - Unicode
    - Backslashes

2. **Broker boundaries** (6 tests)
    - Threshold boundaries (3)
    - MinLength boundaries (3)

3. **TypeScript parser edge cases** (10 tests)
    - Empty source
    - Comments only
    - Template literals
    - Nested structures
    - Import statements
    - Type annotations
    - Single occurrence
    - Regex variations
    - Invalid syntax
    - Mixed quotes

4. **Adapter errors** (6 tests)
    - FS permission denied
    - FS file not found variations
    - Glob pattern errors
    - Add `throws()` to glob proxy

**Outcome:** Critical real-world scenarios covered

### Phase 3: Comprehensive Coverage (NICE TO HAVE) 🟢

**Estimated Effort:** 6-8 hours

1. **Remaining adapter tests** (~37 tests)
    - All FS edge cases
    - All Glob pattern variations
    - All TypeScript parser edge cases

2. **Contract edge cases** (~30 tests)
    - Unicode for all string contracts
    - Boundary values for all number contracts
    - Special characters
    - Very long strings
    - Empty values where applicable

**Outcome:** Truly comprehensive test suite

---

## Summary Statistics

### Current State

- **Test Suites:** 12 passing
- **Tests:** 38 passing
- **Branch Coverage:** ~64% (broker), varies by adapter
- **Standards Violations:** 3 (TypeScript parse adapter)

### After Phase 1

- **Test Suites:** 12 passing
- **Tests:** 50 passing (+12)
- **Branch Coverage:** 100% (all components)
- **Standards Violations:** 0 ✅

### After Phase 2

- **Test Suites:** 12 passing
- **Tests:** 76 passing (+38 from current)
- **Edge Case Coverage:** HIGH
- **Real-World Readiness:** PRODUCTION READY ✅

### After Phase 3

- **Test Suites:** 12 passing
- **Tests:** 143+ passing (+105 from current)
- **Edge Case Coverage:** COMPREHENSIVE
- **Test Suite Maturity:** EXCELLENT ✅

---

## Quick Reference: Files Needing Updates

### Immediate Changes Required

1. `src/adapters/typescript/parse/typescript-parse-adapter.test.ts`
    - Fix 3 standards violations
    - Add map update branch tests (2)
    - Add edge cases (26)

2. `src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.test.ts`
    - Add regex detection tests (5)
    - Add default parameter tests (2)
    - Add cwd tests (2)
    - Add special char tests (4)
    - Add boundary tests (6)

3. `src/adapters/glob/find/glob-find-adapter.proxy.ts`
    - Add `throws()` method for error testing

4. `src/adapters/glob/find/glob-find-adapter.test.ts`
    - Add cwd tests (2)
    - Add pattern tests (8)
    - Add error tests (4)

5. `src/adapters/fs/read-file/fs-read-file-adapter.test.ts`
    - Add error tests (6)
    - Add content edge cases (5)

6. All contract test files
    - Add comprehensive edge cases (~30 total across 8 files)

---

## Testing Standards Reference

From `packages/standards/testing-standards.md`:

### Key Rules Applied

✅ Use stubs, not contracts in tests
✅ Use `toStrictEqual()` for objects/arrays
✅ Use `toBe()` for primitives
✅ Test complete objects, never individual properties
✅ Never use `toBeDefined()`, `toMatchObject()`, or partial matchers
✅ Follow PREFIX: {input} => outcome format
✅ Use nested describe blocks for organization
✅ Provide explicit values to stubs
✅ Create proxy per test (not shared)
✅ 100% branch coverage via manual verification

### Rules Violated (TypeScript Parse Adapter)

❌ Using `toBeDefined()` instead of testing values
❌ Testing array elements individually
❌ Optional chaining in assertions

---

## Conclusion

The test suite has a solid foundation with good structure and standards compliance. However, there are critical gaps:

1. **Regex detection** - completely untested despite being advertised functionality
2. **Default parameters** - untested, will affect all users
3. **Standards violations** - need fixing in TypeScript adapter
4. **Edge cases** - missing ~80+ tests for comprehensive coverage

**Recommendation:** Complete Phase 1 immediately to reach production-ready state, then consider Phase 2 for robust
real-world coverage.

---

**Report End**
