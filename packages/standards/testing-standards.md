# Testing Standards

## Purpose

Minimize tokens while maintaining clarity for LLMs and humans scanning test suites.

**Why so strict?** Loose tests pass when code is broken. Exact tests catch real bugs.

## Core Principles

### Type Safety Required

Tests MUST use proper TypeScript types. **Never use `any`, `as`, or `@ts-ignore`** - if types don't match, fix the code
or types, not the test.

**Exception for mocks:** Use `jest.mocked()` instead of type assertions. When mocking functions that return branded
types (Zod `.brand<'Type'>()`), use the contract to create the branded value:

```typescript
// ✅ CORRECT - Mock with branded type
import {fileContentsContract} from './contracts/file-contents-contract';

mockFsReadFile.mockResolvedValue(fileContentsContract.parse('content'));

// ❌ WRONG - Type error
mockFsReadFile.mockResolvedValue('content'); // string is not FileContents

// ❌ WRONG - Type escape hatch
mockFsReadFile.mockResolvedValue('content' as FileContents);
```

### DAMP > DRY

Tests should be **Descriptive And Meaningful**, not DRY. Each test must be readable standalone without looking at
helpers.

### Test Behavior, Not Implementation
```typescript
// ✅ CORRECT
it("VALID: {price: 100, tax: 0.1} => returns 110")

// ❌ WRONG - Testing internals
it("VALID: {price: 100} => calls _calculateTax()")
```

### Test Isolation

Each test MUST be independent. No shared state, no order dependencies.

### 100% Branch Coverage

**CRITICAL:** You must manually verify test cases against implementation code. Jest's `--coverage` reports can miss
logical branches and give false confidence.

**Method:** Read the implementation line by line and create a test for every conditional path:

**Control Flow:**

- if/else branches
- switch cases
- ternary operators (? :)
- try/catch blocks

**Operators:**
- Optional chaining (?.)
- Nullish coalescing (??)

**Data Patterns:**

- Arrays: [], [single], [multiple]
- Strings: '', single char, multiple chars
- Loops: 0, 1, many iterations
- Pagination: first page, middle, last page
- Ranges: min boundary, within range, max boundary

**Async:**

- Immediate resolution
- Delayed resolution
- Rejected promises

**React/UI:**

- Dynamic JSX values
- Conditional rendering (&&, ternary)
- Event handlers (onClick, onChange, onSubmit)

**Why Manual Verification:**
- Jest coverage counts lines hit, not logical conditions tested
- Coverage can show 100% but miss critical edge cases
- Conditional logic creates multiple execution paths that tools can't detect

**How to Verify Branches:**
1. **Read implementation code** line by line
2. **Identify every conditional** (if/else, ternary, switch, try/catch)
3. **Create test for each path** through the logic
4. **Test edge cases** even when types suggest they won't occur

```typescript
// Manual analysis: Needs 3 tests (not what coverage tools show)
const processUser = (user: User | null): string => {
    if (!user) return 'No user';        // Branch 1: null input
    if (user.isAdmin) return 'Admin';   // Branch 2: admin user
    return user.name;                   // Branch 3: regular user
}
// Tests needed: EMPTY: {user: null}, VALID: {user: adminUser}, VALID: {user: regularUser}

// Manual analysis: Arrays need 3 tests (coverage might show 100% with just 1)
const formatList = (items: string[]): string => {
    if (items.length === 0) return 'No items';      // Branch 1: empty array
    if (items.length === 1) return items[0];        // Branch 2: single item
    return items.join(', ');                        // Branch 3: multiple items
}
// Tests needed: EMPTY: {items: []}, VALID: {items: ['apple']}, VALID: {items: ['apple', 'banana']}

// Manual analysis: Even with string type, test empty and edge cases
const formatTitle = (title: string): string => {
    if (title === '') return 'Untitled';            // Branch 1: empty string
    if (title.length === 1) return title.toUpperCase(); // Branch 2: single char
    return title.charAt(0).toUpperCase() + title.slice(1); // Branch 3: normal string
}
// Tests needed: EMPTY: {title: ''}, EDGE: {title: 'a'}, VALID: {title: 'hello'}
```

**Hidden Branches Jest Misses:**
```typescript
// Coverage might show 100% with one test, but 4 logical branches exist:
const getUserStatus = (user?: User) => {
    return user?.isActive ? 'active' : 'inactive';  // 4 branches: user exists+active, user exists+inactive, user undefined, user null
}
// Tests needed:
// VALID: {user: activeUser} => 'active'
// VALID: {user: inactiveUser} => 'inactive'
// EMPTY: {user: undefined} => 'inactive'
// EMPTY: {user: null} => 'inactive'
```

## Core Pattern

```typescript
// Class Test
describe("ExportedClass", () => {
    describe("functionName()", () => {
        it("PREFIX: {input} => outcome")
    })
})
```

```typescript
describe("functionName", () => {
    it("PREFIX: {input} => outcome")
})

```

**Always use describe blocks - never comments for test organization.**

```typescript
// ✅ CORRECT - Nested describe blocks if testing a class with functions and code paths
describe("UserValidator", () => {
    describe("validateAge()", () => {
        describe("valid input", () => {
            it("VALID: {age: 18} => returns true")
            it("VALID: {age: 65} => returns true")
        })

        describe("invalid input", () => {
            it("INVALID_AGE: {age: -1} => throws 'Age must be positive'")
            it("INVALID_AGE: {age: 'twenty'} => throws 'Must be number'")
        })

        describe("edge cases", () => {
            it("EDGE: {age: 150} => throws 'Unrealistic age'")
            it("EMPTY: {age: null} => throws 'Age required'")
        })
    })

    describe("createUser()", () => {
        describe("valid input", () => {
            it("VALID: {name: 'John', email: 'john@test.com'} => returns User object")
        })

        describe("validation errors", () => {
            it("INVALID_NAME: {name: ''} => throws 'Name required'")
            it("INVALID_EMAIL: {email: 'bad'} => throws 'Invalid email'")
            it("ERROR: {name: 'John', email: 'taken@test.com'} => throws 'Email exists'")
        })
    })
})

// ❌ WRONG - Using comments instead of describe blocks
describe("UserValidator", () => {
    // validateAge tests - valid cases
    it("VALID: {age: 18} => returns true")

    // validateAge tests - invalid cases
    it("INVALID_AGE: {age: -1} => throws 'Age must be positive'")

    // createUser tests
    it("VALID: {name: 'John'} => returns User object")
})
```

### Why This Structure

- **describe(class)**: Groups all tests for an export
- **describe(function)**: Isolates function behavior
- **describe(code path)**: Groups related test scenarios (valid/invalid/edge cases)
- **PREFIX**: Immediately shows test category
- **{input} => outcome**: Pure data transformation visibility

## Prefixes (Required)

- `VALID:` - Expected success paths
- `INVALID_[FIELD]:` - Single field fails validation (e.g., `INVALID_AGE`)
- `INVALID_MULTIPLE:` - Multiple fields fail together
- `ERROR:` - Runtime/system errors (not validation)
- `EDGE:` - Boundary conditions
- `EMPTY:` - Null/undefined/empty inputs

### Complex Validation Patterns
```typescript
// Multiple field errors (when ALL errors collected)
it("INVALID_MULTIPLE: {name: '', email: ''} => throws 'Name required, Email required'")

// Interdependent fields
it("ERROR: {discount: 0.1, coupon: 'SAVE10'} => throws 'Cannot use both discount and coupon'")

// Optional fields (use ? in description when helpful)
it("VALID: {id: '123', name?: 'John'} => updates name only")
```

## Input/Output Format

**Inputs**:

- Objects: `{name: "John", age: 25}`
- Primitives: `42`, `"text"`, `true`, `null`
- Arrays: `[1, 2, 3]`
- No input: Start with `=>`

**Outputs** (action verbs required):

- Returns object: `=> returns user`, `=> returns transaction`
- Returns primitive: `=> returns true`, `=> returns 42`
- Throws: `=> throws 'Error message'`, `=> throws AuthError`
- Void actions: `=> sends email`, `=> updates cache`, `=> processes payment`

## Critical Assertions

### Always Use toStrictEqual for Objects/Arrays

**Property bleedthrough** = When unwanted properties slip through your tests undetected.

```typescript
// ✅ CORRECT - Tests complete object, catches ALL properties
expect(result).toStrictEqual({
    id: '123',
    name: 'John'
    // If result has extra properties, test FAILS (good!)
});

// ❌ WRONG - Testing individual properties = dangerous
expect(result.id).toBe('123');
expect(result.name).toBe('John');
// If result = {id: '123', name: 'John', password: 'leaked!'}, test PASSES (bad!)

// ❌ WRONG - Partial matching allows bleedthrough
expect(result).toMatchObject({id: '123'});
expect(result).toContain('John');
// Extra properties pass through undetected!
```

**Rule: ALWAYS test the complete object/array structure. Never test parts.**

### Test Values, Not Existence
```typescript
// ✅ CORRECT
expect(userId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');

// ❌ WRONG
expect(userId).toBeDefined(); // Could be any value!
```

### Test Content, Not Just Count
```typescript
// ✅ CORRECT - Verify complete array content
const items = getAllItems();
expect(items).toStrictEqual(['apple', 'banana']);

// ❌ WRONG - Count alone doesn't verify correctness
expect(getAllItems()).toHaveLength(2); // Could be wrong items!

// ❌ WRONG - Multiple assertions when one would work
expect(items[0]).toBe('apple');
expect(items[1]).toBe('banana'); // Use toStrictEqual instead!
```

## Mocking Pattern (Universal)

### The One Pattern: `jest.mock()` + `jest.mocked()`

**Use this pattern for ALL mocking:** adapters, brokers, npm packages, Node.js built-ins.

```typescript
// ✅ CORRECT - Universal pattern for module imports
import {fsReadFile} from '../../../adapters/fs/fs-read-file';
import {apiClient} from '../../../adapters/api/api-client';
import {fileContentsContract} from '../../../contracts/file-contents/file-contents-contract';
import {filePathContract} from '../../../contracts/file-path/file-path-contract';

// Mock before using (automatically hoisted)
jest.mock('../../../adapters/fs/fs-read-file');
jest.mock('../../../adapters/api/api-client');

// Type-safe mock access
const mockFsReadFile = jest.mocked(fsReadFile);
const mockApiClient = jest.mocked(apiClient);

describe('myFunction', () => {
    // No beforeEach needed - mocks auto-reset via @questmaestro/testing

    it('VALID: reads file and makes request', async () => {
        const filePath = filePathContract.parse('/config.json');
        const fileContents = fileContentsContract.parse('{"framework": "react"}');

        mockFsReadFile.mockResolvedValue(fileContents);
        mockApiClient.post.mockResolvedValue({success: true});

        const result = await myFunction({filePath});

        expect(result).toStrictEqual({ /* complete result */});
        expect(mockFsReadFile).toHaveBeenCalledTimes(1);
        expect(mockFsReadFile).toHaveBeenCalledWith({filePath});
    });
});
```

### Why This Pattern Works

**`jest.mock()` is hoisted** - even though it appears after imports, Jest automatically moves it to run FIRST:

```typescript
// You write this:
import {fsReadFile} from './adapter';

jest.mock('./adapter');

// Jest executes as:
jest.mock('./adapter');  // Runs FIRST
import {fsReadFile} from './adapter';  // Gets mocked version
```

**`jest.mocked()` provides type safety** - no unsafe type assertions needed:

```typescript
// ✅ CORRECT - Type-safe
const mockFn = jest.mocked(myFunction);
mockFn.mockReturnValue('value'); // TypeScript knows the return type

// ❌ WRONG - Unsafe type assertion (causes ESLint errors)
const mockFn = myFunction as jest.MockedFunction<typeof myFunction>;
```

### When to Use `jest.spyOn()` Instead

**ONLY use `jest.spyOn()` for global objects** (crypto, Date, window, console):

```typescript
// ✅ CORRECT - spyOn for global objects
jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
jest.spyOn(console, 'log').mockImplementation();

// ❌ WRONG - Don't use spyOn for module imports
import * as adapter from './adapter';

jest.spyOn(adapter, 'fsReadFile'); // Doesn't work! Use jest.mock() instead
```

**Why spyOn doesn't work for module imports:** When your code does `import { fsReadFile }`, it creates a direct binding
to the real function, bypassing any spy on the namespace object.

### Mocking with Branded Types

When using Zod branded types, mocks must use the branded type:

```typescript
// contracts/file-contents/file-contents-contract.ts
export const fileContentsContract = z.string().brand<'FileContents'>();
export type FileContents = z.infer<typeof fileContentsContract>;

// adapter returns branded type
export const fsReadFile = async ({filePath}: { filePath: FilePath }): Promise<FileContents> =>
    fileContentsContract.parse(await readFile(filePath, 'utf8'));

// test - must use branded type
jest.mock('../../../adapters/fs/fs-read-file');
const mockFsReadFile = jest.mocked(fsReadFile);

it('VALID: reads file', async () => {
    // ❌ WRONG - Type error: string is not FileContents
    mockFsReadFile.mockResolvedValue('plain string');

    // ✅ CORRECT - Use contract to create branded type
    const contents = fileContentsContract.parse('mocked content');
    mockFsReadFile.mockResolvedValue(contents);

    // ✅ CORRECT - Or inline
    mockFsReadFile.mockResolvedValue(fileContentsContract.parse('mocked content'));
});
```

**Create test stubs for commonly mocked branded types:**

Stubs are co-located with their contracts using the `.stub.ts` extension:

```typescript
// contracts/file-contents/file-contents.stub.ts
import {fileContentsContract, type FileContents} from './file-contents-contract';

export const FileContentsStub = (value: string): FileContents =>
    fileContentsContract.parse(value);

// contracts/file-path/file-path.stub.ts
import {filePathContract, type FilePath} from './file-path-contract';

export const FilePathStub = (value: string): FilePath =>
    filePathContract.parse(value);

// Usage in tests (from adapters/fs/fs-read-file.test.ts)
import {FileContentsStub} from '../../contracts/file-contents/file-contents.stub';
import {FilePathStub} from '../../contracts/file-path/file-path.stub';

const filePath = FilePathStub('/config.json');
const fileContents = FileContentsStub('mocked content');

mockFsReadFile.mockResolvedValue(fileContents);
expect(mockFsReadFile).toHaveBeenCalledWith({filePath});
```

### What to Mock (Unit Tests)

**Mock ALL imports except pure functions:**

**MUST mock:**

- **Adapters** - External system wrappers (fs, db, api, etc.)
- **Brokers** - Business logic functions (both atomic and orchestration)
- **Transformers** - Data transformation functions (unless pure and side-effect free)
- **Global objects** - Mock using `jest.spyOn()` on crypto, Date, console, window

**DO NOT mock:**

- **Contracts** - Pure Zod schemas and type definitions (no side effects)
- **Pure utility functions** - Functions that only transform data with no I/O
- **Type imports** - `import type { ... }`

**Why mock everything:** With branded types on all returns, you need to control the exact typed values in tests. Mocking
ensures unit isolation and prevents tests from becoming integration tests.

```typescript
// ✅ CORRECT - Mock ALL imports (adapters, brokers, transformers)
import {fsReadFile} from '../../../adapters/fs/fs-read-file';
import {configParseBroker} from '../../../brokers/config/parse/config-parse-broker';
import {apiClient} from '../../../adapters/api/api-client';
import {FileContentsStub} from '../../../contracts/file-contents/file-contents.stub';
import {FilePathStub} from '../../../contracts/file-path/file-path.stub';
import {ConfigStub} from '../../../contracts/config/config.stub';

jest.mock('../../../adapters/fs/fs-read-file');
jest.mock('../../../brokers/config/parse/config-parse-broker');
jest.mock('../../../adapters/api/api-client');

const mockFsReadFile = jest.mocked(fsReadFile);
const mockConfigParseBroker = jest.mocked(configParseBroker);
const mockApiClient = jest.mocked(apiClient);

describe('configLoadBroker', () => {
    beforeEach(() => {
        // Mock globals for predictable IDs/timestamps
        jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
        jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    });

    it('VALID: loads config and creates record', async () => {
        const filePath = FilePathStub('/config.json');
        const fileContents = FileContentsStub('{ "framework": "react" }');
        const parsedConfig = ConfigStub({framework: 'react'});

        mockFsReadFile.mockResolvedValue(fileContents);
        mockConfigParseBroker.mockResolvedValue(parsedConfig);
        mockApiClient.post.mockResolvedValue({success: true});

        const result = await configLoadBroker({filePath});

        // Test complete object with exact mocked values
        expect(result).toStrictEqual({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            timestamp: 1609459200000,
            config: parsedConfig,
            synced: true
            // ALL properties
        });

        // Verify all mocks were called correctly
        expect(mockFsReadFile).toHaveBeenCalledWith({filePath});
        expect(mockConfigParseBroker).toHaveBeenCalledWith({contents: fileContents});
        expect(mockApiClient.post).toHaveBeenCalledTimes(1);
    });
});

// ❌ WRONG - Not mocking imported broker
import {configParseBroker} from '../../../brokers/config/parse';
// Missing: jest.mock('../../../brokers/config/parse');
// This becomes an integration test, testing BOTH brokers together!

// ✅ CORRECT - Don't mock pure contracts
import {configContract} from '../../../contracts/config/config-contract';
// No jest.mock needed - contracts are pure schemas
const validConfig = configContract.parse({framework: 'react'});
```

### Avoiding Conditionals in Mocks

When using mocks, never use conditional logic inside mock implementations. Conditionals make tests brittle and
hard to debug.

```typescript
// Setup for examples below
import {ESLint} from 'eslint';

jest.mock('eslint');
const mockESLint = jest.mocked(ESLint);

// ❌ WRONG - Conditional logic in mock creates test complexity
let callCount = 0;
mockESLint.mockImplementation((options) => {
    callCount++;
    if (callCount === 1) {
        return {lintText: mockFirstCall};
    } else {
        return {lintText: mockSecondCall};
    }
});

// ❌ WRONG - State tracking makes tests fragile
const mockInstances = [];
mockESLint.mockImplementation((options) => {
    const instance = mockInstances.length === 0 ? firstInstance : secondInstance;
    mockInstances.push(instance);
    return instance;
});

// ✅ CORRECT - Explicit call ordering without conditionals
mockESLint
    .mockImplementationOnce(() => ({lintText: mockFirstCall}))
    .mockImplementationOnce(() => ({lintText: mockSecondCall}));

// ✅ CORRECT - Verify specific calls with exact arguments
expect(mockESLint).toHaveBeenNthCalledWith(1, {
    cwd: '/expected/path',
    overrideConfig: [originalConfig]
});
expect(mockESLint).toHaveBeenNthCalledWith(2, {
    cwd: '/expected/path',
    overrideConfig: [simplifiedConfig]
});
```

**Why conditionals in mocks are bad:**

- Hide test intent - unclear what behavior is being tested
- Create debugging nightmares - failures don't show which path failed
- Introduce race conditions - call order becomes critical
- Make tests brittle - small changes break unrelated tests

**Better patterns:**

- Use `mockImplementationOnce()` for sequential calls
- Use `mockResolvedValueOnce()` for async sequential calls
- Verify exact call arguments with `toHaveBeenNthCalledWith()`
- Keep each test's mock setup isolated and explicit

### Test Mock Calls Completely
```typescript
// ✅ CORRECT - Test both count AND arguments
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('expectedArg', {id: '123'});

// ❌ WRONG - Only testing call count
expect(mockFn).toHaveBeenCalledTimes(1); // Called with what args?

// ❌ WRONG - Only testing arguments
expect(mockFn).toHaveBeenCalledWith('expectedArg'); // Called how many times?
```

### Async Testing
```typescript
// Async success
await expect(fetchData()).resolves.toStrictEqual({ data: 'value' });

// Async failure
await expect(failingCall()).rejects.toThrow('Error message');
```

## Common Anti-Patterns (Avoid These!)

1. **Property Bleedthrough**: Using partial matchers that miss extra properties
2. **Testing Implementation**: Spying on internal methods instead of outputs
3. **Shared Test State**: Tests depending on each other
4. **Existence-Only Checks**: Using toBeDefined() instead of actual values
5. **Count-Only Checks**: Testing length without verifying content
6. **Under-Mocking**: Not mocking imported brokers/transformers (creates integration tests, not unit tests)
7. **Conditional Mocking**: Using if/else logic inside mock implementations
8. **String IDs**: Using 'user-123' instead of proper UUIDs
9. **Comment Organization**: Using comments instead of describe blocks for test structure
10. **Manual Mock Cleanup**: Calling `mockReset()`, `mockClear()`, `clearAllMocks()` - @questmaestro/testing handles
    this globally
11. **Type Escape Hatches**: Using `any`, `as`, `@ts-ignore` in tests
12. **Using `jest.spyOn()` for Module Imports**: Only use spyOn for global objects (crypto, Date, window)
13. **Unsafe Type Assertions in Mocks**: Using `as jest.MockedFunction<typeof fn>` instead of `jest.mocked()`
14. **Manual Mock Factories**: Using `jest.mock('module', () => ({ fn: jest.fn() }))` when auto-mocking works
15. **Importing Before Mocking**: Worrying about import order (jest.mock is hoisted automatically)

## Forbidden Jest Matchers

```tsx
// ❌ NEVER USE THESE - They allow bugs through
expect().toEqual()                     // → Use .toStrictEqual()
expect().toMatchObject()               // → Use .toStrictEqual()
expect().toContain()                   // → Use .toStrictEqual()
expect().toBeTruthy() / expect.toBeFalsy()   // → Use .toBe(true) / .toBe(false)
expect().toMatch('text')               // → Use .toMatch(/^exact text$/)
expect().toHaveProperty('key')         // → Test actual value with .toBe()
expect.objectContaining()      // → Test complete object
expect.arrayContaining()       // → Test complete array
expect.stringContaining()      // → Use regex /^.*substring.*$/
expect.any(String)             // → Test actual string value
expect.any(Number)             // → Test actual number
expect.any(Object)             // → Test complete object shape
// EXCEPTION: expect.any(Function) is OK - can't compare functions

// ✅ CORRECT ALTERNATIVES
expect(result).toStrictEqual({id: '123', name: 'John'})
expect(flag).toBe(true)  // Not toBeTruthy()
expect(text).toMatch(/^Error: Invalid input$/)  // Full message with anchors
expect(count).toBe(5)    // Exact value, not range
expect(['a', 'b', 'c']).toStrictEqual(['a', 'b', 'c'])  // Complete array
expect(error).toStrictEqual({
    name: 'ConnectionError',
    message: 'Connection failed',
    code: 'ECONNREFUSED'
    // ALL error properties
})
```

## Writing Tests (LLM Instructions)

### When Types Don't Match

If you encounter type errors, **ASK THE USER** - never use:

- `as any` or type assertions
- `@ts-ignore` or `@ts-expect-error`
- `.toEqual()` to avoid checking complete objects
- `expect.any()` to bypass exact value testing

The type mismatch indicates either a bug in the code or your test approach needs adjustment.

### Step 1: Write Stubs

First pass - structure only, no implementations:
```typescript
describe("Calculator", () => {
    describe("add()", () => {
        it("VALID: {a: 1, b: 2} => returns 3")
        it("VALID: {a: -1, b: 1} => returns 0")
        it("EDGE: {a: MAX_INT, b: 1} => throws 'Overflow'")
    })
})
```

### Step 2: Add Assertions
```typescript
it("VALID: {a: 1, b: 2} => returns 3", () => {
    expect(add(1, 2)).toBe(3);
})
```

### Key Rules

1. **Always use PREFIX** - Never write tests without category prefix
2. **Action verbs in outcomes** - `=> returns user` not `=> user`
3. **Specific over generic** - `INVALID_AGE` not just `ERROR`
4. **No filler words** - No "should", "when", "with", "given"
5. **Real error messages** - Use actual strings from code
6. **Group by prefix** - All VALID tests together, then INVALID_*, etc.

## Examples

```typescript
describe("UserValidator", () => {
    describe("validateAge()", () => {
        it("VALID: {age: 18} => returns true")
        it("VALID: {age: 65} => returns true")
        it("INVALID_AGE: {age: -1} => throws 'Age must be positive'")
        it("INVALID_AGE: {age: 'twenty'} => throws 'Must be number'")
        it("EDGE: {age: 150} => throws 'Unrealistic age'")
        it("EMPTY: {age: null} => throws 'Age required'")
    })

    describe("createUser()", () => {
        it("VALID: {name: 'John', email: 'john@test.com'} => returns User object")
        it("INVALID_NAME: {name: ''} => throws 'Name required'")
        it("INVALID_EMAIL: {email: 'bad'} => throws 'Invalid email'")
        it("ERROR: {name: 'John', email: 'taken@test.com'} => throws 'Email exists'")
    })

    describe("processPayment()", () => {
        it("VALID: {amount: 100, card: validCard} => processes transaction")
        it("EMPTY: {} => throws 'No payment data'")
        it("EDGE: {amount: 0.01} => processes transaction")
        it("ERROR: {amount: 100, card: expiredCard} => throws 'Card expired'")
    })
})
```

## Stub Factories & Test Helpers

### When to Create Factories/Helpers

- **Data factories**: When multiple tests use similar data with minor variations
- **Action helpers**: When same setup/action sequence appears 3+ times in a file
- **Complex state**: Multi-step process to reach specific test state
- **One stub function export** (primary)

### Stub Factory Pattern (Type-Safe)

**Stubs are co-located with contracts using `.stub.ts` extension:**

```typescript
// contracts/user/user.stub.ts
import type {User} from './user-contract'; // Co-located with contract

export const UserStub = (props: Partial<User> = {}): User => ({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Always use UUIDs
    name: 'John Doe',
    email: 'john@example.com',
    ...props,
});

// ❌ WRONG - Never use any or type escapes
const BadStub = (props: any = {}): any => ({ // NO!
    ...props
});
```

### Usage (Always Provide Explicit Values)

```typescript
// ✅ CORRECT - Explicit values show what's being tested
it("VALID: {email: 'test@example.com'} => sends welcome email", () => {
    const user = UserStub({email: 'test@example.com'});
    expect(sendWelcomeEmail(user)).toStrictEqual({
        to: 'test@example.com',
        subject: 'Welcome',
        template: 'welcome'
    });
})

// ❌ WRONG - Relying on stub defaults = brittle/unclear
it("VALID: {} => sends welcome email", () => {
    const user = UserStub(); // What email is being tested?
    expect(sendWelcomeEmail(user)).toStrictEqual(/* ... */);
})
```

### Test Action Helpers (File-Scoped)
```typescript
// At top of test file, NOT exported
const TestActions = {
    createAuthenticatedUser: () => {
        const user = UserStub({role: 'admin'});
        mockAuth.login(user);
        return user;
  },

    setupPaymentFlow: async () => {
        // Complex multi-step setup
        await mockStripe.init();
        await mockDatabase.clearTransactions();
    }
};

// Usage in tests
it("VALID: authenticated admin => returns dashboard data", async () => {
    const user = TestActions.createAuthenticatedUser();
    const result = await getDashboard(user.id);
    expect(result).toStrictEqual({ /* ... */});
})
```

## Parameterized Tests

```typescript
it.each([
    [18, true],
    [65, true],
    [17, false]
])("VALID: {age: %i} => returns %s")

// Only test null/undefined if type allows it (string | null | undefined)
it.each(['', null, undefined])(
    "EMPTY: {name: %s} => throws 'Name required'"
)
```

## File Organization

```
src/
  contracts/
    user/
      user-contract.ts
      user-contract.test.ts
      user.stub.ts          // Co-located stub for tests
  adapters/
    fs/
      fs-read-file.ts
      fs-read-file.test.ts  // Co-located unit tests
tests/
  e2e/                      // End-to-end tests only
```

**Stub files are co-located with their contracts using `.stub.ts` extension**, not in a separate `tests/stubs/`
directory.

## Framework-Specific Patterns

### React Testing
```typescript
describe("UserCard", () => {
    describe("render()", () => {
        it("VALID: {user: activeUser} => renders name", () => {
            render(<UserCard user = {UserStub({name: 'John'})}
            />);
            expect(screen.getByTestId('user-name')).toHaveTextContent(/^John$/);
        })

        it("VALID: {onClick: handler} => calls handler on click", () => {
            const onClick = jest.fn();
            const user = UserStub({id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'John'});
            render(<UserCard user = {user}
            onClick = {onClick}
            />);
            fireEvent.click(screen.getByTestId('card-button'));
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClick).toHaveBeenCalledWith({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John',
                email: 'john@example.com'  // Test complete object!
            });
        })

        it("EDGE: {user: null} => renders placeholder", () => {
            render(<UserCard user = {null}
            />);
            expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        })
    })
})

// Use data-testid for element selection
screen.getByTestId('submit-button')
// Use regex for exact text matching
expect(element).toHaveTextContent(/^Exact Text$/);
```

### Node.js API Testing
```typescript
// Mock adapters that controllers use
import {dbCreateUser} from '../../../adapters/database/db-create-user';
import {emailSendWelcome} from '../../../adapters/email/email-send-welcome';

jest.mock('../../../adapters/database/db-create-user');
jest.mock('../../../adapters/email/email-send-welcome');

const mockDbCreateUser = jest.mocked(dbCreateUser);
const mockEmailSendWelcome = jest.mocked(emailSendWelcome);

describe("UserController", () => {
    beforeEach(() => {
        // Mock globals for predictable IDs/timestamps
        jest.spyOn(crypto, 'randomUUID')
            .mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
        jest.spyOn(Date, 'now').mockReturnValue(1609459200000);

        // No mockReset needed - mocks auto-reset via @questmaestro/testing
    });

    describe("POST /users", () => {
        it("VALID: {name: 'John', email: 'john@test.com'} => returns 201", async () => {
            mockDbCreateUser.mockResolvedValue({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John',
                email: 'john@test.com',
                createdAt: 1609459200000
            });
            mockEmailSendWelcome.mockResolvedValue({sent: true});

            const res = await request(app)
                .post('/users')
                .send({name: 'John', email: 'john@test.com'});

            expect(res.status).toBe(201);
            expect(res.body).toStrictEqual({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // Exact mocked ID
                name: 'John',
                email: 'john@test.com',
                createdAt: 1609459200000
                // Must test ALL properties to prevent bleedthrough
            });

            // Verify adapter calls
            expect(mockDbCreateUser).toHaveBeenCalledTimes(1);
            expect(mockDbCreateUser).toHaveBeenCalledWith({
                name: 'John',
                email: 'john@test.com'
            });
            expect(mockEmailSendWelcome).toHaveBeenCalledTimes(1);
        })

        it("INVALID_EMAIL: {email: 'bad'} => returns 400", async () => {
            const res = await request(app)
                .post('/users')
                .send({name: 'John', email: 'bad'});
            expect(res.status).toBe(400);
            expect(res.body).toStrictEqual({
                error: 'Invalid email',
                code: 'INVALID_EMAIL'
                // Test complete error object
            });
        })
    })
})
```

### CLI/NPX Library Testing
```typescript
describe("CLI", () => {
    describe("execute()", () => {
        it("VALID: ['--config', 'file.json'] => processes config", () => {
            const result = cli.execute(['--config', 'file.json']);
            expect(result).toStrictEqual({
                exitCode: 0,
                output: 'Config loaded from file.json',
                errors: []
                // Test complete result object
            });
        })

        it("ERROR: ['--invalid'] => returns help text", () => {
            const result = cli.execute(['--invalid']);
            expect(result).toStrictEqual({
                exitCode: 1,
                output: 'Usage: cli [options]\nOptions:\n  --config <file>',
                errors: ['Unknown option: --invalid']
            });
        })
    })
})
```