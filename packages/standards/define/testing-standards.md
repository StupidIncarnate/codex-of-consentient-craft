# Testing Standards

## Purpose

Minimize tokens while maintaining clarity for LLMs and humans scanning test suites.

**Why so strict?** Loose tests pass when code is broken. Exact tests catch real bugs.

## Core Principles

### Type Safety Required

Tests MUST use proper TypeScript types. **Never use `any`, `as`, or `@ts-ignore`** - if types don't match, fix the code
or types, not the test.

**CRITICAL: Test files AND proxy files CANNOT import types from contracts.** Use `ReturnType<typeof StubName>` to get
types:

```typescript
// ❌ WRONG - Importing type from contract
import type {ExecError} from '../contracts/exec-error/exec-error-contract';
import type {JsonRpcResponse} from '../contracts/json-rpc-response/json-rpc-response-contract';

// ✅ CORRECT - Get type from stub
import {ExecErrorStub} from '../contracts/exec-error/exec-error.stub';
import {JsonRpcResponseStub} from '../contracts/json-rpc-response/json-rpc-response.stub';

type ExecError = ReturnType<typeof ExecErrorStub>;
type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;

// ✅ CORRECT - Use inline without type alias when needed once
it('VALID: {error} => handles exec error', () => {
    const error: ReturnType<typeof ExecErrorStub> = ExecErrorStub({status: 1});
    expect(handleError(error)).toBe('Command failed with status 1');
});
```

**Why:** Stubs are the single source of truth for test data. Tests and proxies should never directly reference
contracts.

**Exception for mocks:** Use `jest.mocked()` instead of type assertions. When mocking functions that return branded
types (Zod `.brand<'Type'>()`), use the stub to create the branded value:

```typescript
// ✅ CORRECT - Mock with branded type using stub
import {FileContentsStub} from './contracts/file-contents/file-contents.stub';

mockFsReadFile.mockResolvedValue(FileContentsStub({value: 'content'}));

// ❌ WRONG - Type error
mockFsReadFile.mockResolvedValue('content'); // string is not FileContents

// ❌ WRONG - Type escape hatch
mockFsReadFile.mockResolvedValue('content' as FileContents);
```

**Exception for testing invalid inputs:** When testing validation failures with intentionally wrong types, use
`as never`:

```typescript
// ✅ CORRECT - Testing that number fails string validation
it('INVALID: {value: number} => throws ZodError', () => {
  expect(() => {
    return MyStub({ value: 123 as never });
  }).toThrow(/Expected string/u);
});

// ❌ WRONG - Raw string type violates ban-primitives
MyStub({ value: 123 as string })

// ❌ WRONG - Overly complex
MyStub({ value: 123 } as Parameters<typeof MyStub>[0])
```

**`exactOptionalPropertyTypes` requirement:** Project uses `exactOptionalPropertyTypes: true`. When testing optional
parameters, omit the property instead of passing `undefined`:

```typescript
// ✅ CORRECT - Omit optional parameter
expect(myGuard({value: 'test'})).toBe(false);

// ❌ WRONG - Explicit undefined fails with exactOptionalPropertyTypes
expect(myGuard({value: 'test', optional: undefined})).toBe(false);
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

### NO Jest Hooks

**CRITICAL:** `beforeEach`, `afterEach`, `beforeAll`, `afterAll` are forbidden. All setup and teardown must be inline in
each test.

```typescript
// ❌ WRONG - Hooks forbidden
describe('MyFeature', () => {
    beforeEach(() => {
        fs.mkdirSync(tempDir, {recursive: true});
    });

    afterEach(() => {
        fs.rmSync(tempDir, {recursive: true});
    });

    it('test case', () => {
        // test logic
    });
});

// ✅ CORRECT - Inline setup/teardown
describe('MyFeature', () => {
    it('VALID: test case => expected result', () => {
        fs.mkdirSync(tempDir, {recursive: true});

        // test logic

        fs.rmSync(tempDir, {recursive: true, force: true});

        expect(result).toBe(expected);
    });
});
```

**Why:** Hooks create implicit dependencies and make tests harder to read in isolation. Each test should be completely
self-contained.

### NO Conditionals in Tests

```typescript
// ❌ WRONG - Conditional logic
afterEach(() => {
    if (fs.existsSync(tempRoot)) {
        fs.rmSync(tempRoot, {recursive: true, force: true});
    }
});

// ❌ WRONG - Conditional assertions
it('test case', () => {
    const result = doSomething();
    if (result.hasError) {
        expect(result.error).toBe('Expected error');
    } else {
        expect(result.value).toBe('Expected value');
    }
});

// ✅ CORRECT - Unconditional cleanup with force flag
it('VALID: test case => expected result', () => {
    // ... test logic ...
    fs.rmSync(tempRoot, {recursive: true, force: true});
    expect(result).toBe(expected);
});

// ✅ CORRECT - Separate tests for different paths
it('VALID: {input: error state} => returns error', () => {
    const result = doSomething({hasError: true});
    expect(result).toStrictEqual({error: 'Expected error'});
});

it('VALID: {input: success state} => returns value', () => {
    const result = doSomething({hasError: false});
    expect(result).toStrictEqual({value: 'Expected value'});
});
```

**Why:** Conditionals in tests hide what's being tested and create multiple execution paths in a single test.

### ALL Types Must Be Branded

**Even test helper functions require branded types.** Raw primitives (`string`, `number`, etc.) are forbidden
everywhere.

```typescript
// ❌ WRONG - Raw types in test helpers
const createUser = ({name}: { name: string }): string => {
    const id = uuid();
    saveUser({id, name});
    return id;
};

// ✅ CORRECT - Branded types from contracts
import {UserNameStub} from '../contracts/user-name/user-name.stub';
import {UserIdStub} from '../contracts/user-id/user-id.stub';

type UserName = ReturnType<typeof UserNameStub>;
type UserId = ReturnType<typeof UserIdStub>;

const createUser = ({name}: { name: UserName }): UserId => {
    const id = UserIdStub({value: uuid()});
    saveUser({id, name});
    return id;
};
```

**Why:** Type safety applies to ALL code. Test helpers are production code that happens to live in test files.

### NO Magic Numbers - Use Statics

```typescript
// ❌ WRONG - Magic number
export const exitCodeContract = z.number().int().min(0).max(255).brand<'ExitCode'>();

// ✅ CORRECT - Extract to statics
// statics/exit-code/exit-code-statics.ts
export const exitCodeStatics = {
    limits: {
        max: 255,
    },
} as const;

// contracts/exit-code/exit-code-contract.ts
import {exitCodeStatics} from '../../statics/exit-code/exit-code-statics';

export const exitCodeContract = z
    .number()
    .int()
    .min(0)
    .max(exitCodeStatics.limits.max)
    .brand<'ExitCode'>();
```

### Unit Tests vs Integration Tests

**Unit Test (mock dependencies):**

- Pure transformation logic you control
- Business rules, data transformations, validation
- Input → Logic → Output with clear boundaries

**Integration Test (real dependencies):**

- Logic expressed in external system's DSL/query language
- Pattern matching, querying, selecting against external structures
- The external system must interpret your logic to validate it works

```typescript
// ❌ WRONG - Unit test for DSL-based logic
it('VALID: rule detects missing return type', () => {
    const mockContext = {report: jest.fn()};
    const fakeNode = {type: 'ArrowFunctionExpression'};
    rule.create(mockContext)['some-selector'](fakeNode);
    expect(mockContext.report).toHaveBeenCalled();
    // CSS selector never validated against real AST!
});

// ✅ CORRECT - Integration test with real parsing
it('INVALID: exported arrow function without return type => reports violation', () => {
    const code = `export const foo = () => { return 'bar'; }`;
    const results = ruleTester.run('explicit-return-types', rule, {
        invalid: [{code, errors: [{messageId: 'missingReturnType'}]}]
    });
    // ESLint parses real code, validates selectors match actual AST
});
```

**Integration test when:**

- ESLint rules (CSS selectors on AST)
- SQL queries (SQL syntax against DB schema)
- GraphQL resolvers (resolver signatures against schema)
- Regex patterns (pattern syntax against strings)
- Template engines (template syntax against data)

**Unit test when:**

- Transformers (pure data mapping)
- Contracts (validation rules)
- Business logic (calculations, conditionals)
- Utilities (string formatting, array operations)

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

- **describe(class/function)**: Group tests for exports and isolate function behavior
- **describe(code path)**: Group related scenarios (valid/invalid/edge cases)
- **PREFIX**: Immediately shows test category
- **{input} => outcome**: Shows data transformation clearly

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
// ✅ CORRECT - Single assertion tests complete object, catches ALL properties
expect(result).toStrictEqual({
    id: '123',
    name: 'John'
    // If result has extra properties, test FAILS (good!)
});

// ❌ WRONG - Multiple assertions on individual properties = dangerous
expect(result.id).toBe('123');
expect(result.name).toBe('John');
// If result = {id: '123', name: 'John', password: 'leaked!'}, test PASSES (bad!)

// ❌ WRONG - Multiple toStrictEqual calls on different properties
expect(result.files).toStrictEqual(['*.ts', '*.tsx']);
expect(result.ignores).toStrictEqual(['dist/', 'build/']);
// Missing other properties - could have leaked data!
// Should be: expect(result).toStrictEqual({ files: [...], ignores: [...], ...allProperties })

// ❌ WRONG - Partial matching allows bleedthrough
expect(result).toMatchObject({id: '123'});
expect(result).toContain('John');
// Extra properties pass through undetected!
```

**Rule: ALWAYS test the complete object/array structure. Never test parts.**

### Don't Be Afraid of the Full Object

**Common LLM mistake:** Using weak assertions like `.toContain()`, `.includes()`, or `typeof` checks instead of
asserting the full expected structure with `toStrictEqual`.

**The problem:** These partial checks make tests pass even when the actual value is wrong.

```typescript
// ❌ WRONG - Weak string checks that miss bugs
const config = readFile('eslint.config.js');
expect(config.includes('@typescript-eslint/parser')).toStrictEqual(true);
expect(config.includes('tsconfig.json')).toStrictEqual(true);
expect(config.includes('tsconfigRootDir')).toStrictEqual(true);
// Passes if file has ANYTHING containing these strings!
// Could have wrong structure, extra code, or syntax errors

// ✅ CORRECT - Assert the FULL expected string
const config = readFile('eslint.config.js');
const expectedConfig = `
// Auto-generated eslint config for integration test environment
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
];
`;
expect(config).toStrictEqual(expectedConfig);

// ❌ WRONG - Checking typeof instead of actual structure
const tsconfig = JSON.parse(readFile('tsconfig.json'));
expect(typeof tsconfig.compilerOptions).toStrictEqual('object');
expect(tsconfig.include).toStrictEqual(['**/*.ts', '**/*.tsx']);
// First assertion passes for ANY object! Could be completely wrong.

// ✅ CORRECT - Assert the FULL expected object
const tsconfig = JSON.parse(readFile('tsconfig.json'));
expect(tsconfig).toStrictEqual({
    compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
    },
    include: ['**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
});

// ❌ WRONG - Using .toContain() on strings
expect(output).toContain('Error');
expect(output).toContain('failed');
// Passes if output is "Some other Error message with failed in it"!

// ✅ CORRECT - Assert exact error message
expect(output).toStrictEqual('Error: Authentication failed');
```

**Why weak assertions are dangerous:**

- `.toContain()` passes if string/array is a **superset** - hides extra/wrong content
- `.includes()` with `toStrictEqual(true)` is just `.toContain()` in disguise
- `typeof x === 'object'` passes for **any object**, even completely wrong ones
- Partial checks miss when structure changes unexpectedly

**Rule: If you know the exact expected value, assert it completely. Don't phone it in with weak checks.**

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

## Proxy Architecture

### The Core Rule

**Mock only at I/O boundaries. Everything else runs REAL.**

When testing any layer, only two types of things are mocked:

1. **Adapters** - Mock npm dependencies (axios, fs, etc.) at the adapter boundary
2. **Global functions** - Mock non-deterministic globals (Date.now(), crypto.randomUUID(), etc.)

All business logic, transformers, guards, brokers, bindings, and React hooks run with real code to ensure contract
integrity.

### Key Architectural Principles

**Tests never manipulate mocks directly.** Tests interact with proxies using semantic methods. Proxies encapsulate ALL
mock setup.

**Create-per-test pattern:** Each test creates a fresh proxy. The proxy constructor sets up all mocks automatically - no
`beforeEach`, no `bootstrap()` method, no manual setup. See "Create-Per-Test Pattern" section below for detailed
examples.

### Proxy Encapsulation Rule

**CRITICAL:** Proxies must expose semantic methods, NOT child proxies. Tests should never chain through multiple proxy
levels.

```typescript
// ❌ WRONG - Exposing child proxies forces tests to know internal structure
export const questExecuteBrokerProxy = () => {
    const pathseekerProxy = pathseekerPhaseBrokerProxy();
    const codeweaverProxy = codeweaverPhaseBrokerProxy();

    return {
        pathseekerProxy,  // ❌ Exposes child
        codeweaverProxy,  // ❌ Exposes child
    };
};

// Test must navigate internal structure:
pathseekerProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({...});
// ↑ This is BAD - test knows 5+ levels of internal proxy structure

// ✅ CORRECT - Expose semantic methods that delegate internally
export const questExecuteBrokerProxy = () => {
    const pathseekerProxy = pathseekerPhaseBrokerProxy();
    const codeweaverProxy = codeweaverPhaseBrokerProxy();
    const siegemasterProxy = siegemasterPhaseBrokerProxy();
    const lawbringerProxy = lawbringerPhaseBrokerProxy();

    return {
        // Semantic method handles all internal delegation
        setupQuestFile: ({questJson}: {questJson: string}): void => {
            // Proxy knows which children need this setup
            pathseekerProxy.setupQuestFile({questJson});
            codeweaverProxy.setupQuestFile({questJson});
            siegemasterProxy.setupQuestFile({questJson});
            lawbringerProxy.setupQuestFile({questJson});
        },

        setupStepComplete: ({stepId}: {stepId: StepId}): void => {
            // Semantic method for another common scenario
            pathseekerProxy.setupStepComplete({stepId});
            // ...delegate to other children as needed
        },
    };
};

// Test uses semantic method - no knowledge of internal structure:
proxy.setupQuestFile({questJson});  // ✅ Clean, semantic
```

**Why this matters:**

1. **Encapsulation**: Each test only knows its direct proxy (from REALISTIC-FLOW-EXAMPLE summary)
2. **Maintainability**: Internal restructuring doesn't break tests
3. **Readability**: Tests describe WHAT scenario, not HOW to navigate proxy internals
4. **Single source of truth**: Proxy owns knowledge of its dependencies

**The pattern:**

- Child proxies are created internally (assigned to variables if methods are used)
- Return object exposes semantic methods that delegate to children
- Tests call semantic methods without knowing child proxy structure
- If 4 children need the same setup, the parent proxy handles that in one semantic method

### What Gets Mocked vs What Runs Real

```
Widget Test:
┌────────────────────────────────────────────┐
│ Widget                     (REAL)          │ ← Test renders this
│   └─ useBinding           (REAL)          │ ← Real React hook
│       └─ Broker           (REAL)          │ ← Real business logic
│           ├─ Date.now()    (MOCKED)       │ ← Mock global function
│           ├─ Transformer  (REAL)          │ ← Real pure function
│           ├─ Guard        (REAL)          │ ← Real boolean check
│           └─ httpAdapter  (REAL)          │ ← Real adapter code
│               └─ axios    (MOCKED)        │ ← Mock npm dependency (I/O)
└────────────────────────────────────────────┘

Only 2 things mocked: I/O npm dependencies + global functions
*Exception: DSL/query adapters (ESLint, SQL, GraphQL) run fully real to validate logic
```

### Proxy Types

Proxies create and configure mocks, providing semantic setup methods instead of exposing mock implementation details.

**Three core patterns:**

1. **Adapter Proxy** - Mocks npm packages at I/O boundary
2. **Broker Proxy** - Composes adapter proxies
3. **Higher-layer Proxies** - Delegate to child proxies

**Global mocks** - Any proxy can mock globals (Date, crypto, etc) if the code it tests uses them. See "Global Function
Mocks" section.

#### Quick Reference: What Needs Proxies?

| Category     | Needs Proxy? | Purpose                                                                                         |
|--------------|--------------|-------------------------------------------------------------------------------------------------|
| Contracts    | ❌ No         | Use stubs (`.stub.ts` files) - includes service objects with methods                            |
| Errors       | ❌ No         | Throw directly in tests                                                                         |
| Adapters     | ✅ Sometimes  | **Mock npm dependency** (axios, fs, etc.). Empty proxy if no mocking needed (simple re-exports) |
| Brokers      | ✅ Sometimes  | Compose adapter proxies, provide semantic setup. Empty proxy if no dependencies mocked          |
| Guards       | ❌ No         | Pure boolean functions - run real, no mocking needed                                            |
| Transformers | ❌ No         | Pure data transformation - run real, no mocking needed                                          |
| Statics      | ❌ No         | Immutable values - test with actual values                                                      |
| State        | ✅ Yes        | Spy on methods, clear state, mock external stores                                               |
| Bindings     | ✅ Yes        | Delegate to broker proxies                                                                      |
| Middleware   | ✅ Yes        | Delegate to adapter proxies                                                                     |
| Responders   | ✅ Yes        | Delegate to broker proxies                                                                      |
| Widgets      | ✅ Yes        | Delegate to bindings + provide UI triggers/selectors                                            |
| Flows        | ❌ No         | Integration tests (`.integration.test.ts`) - no proxies                                         |
| Startup      | ✅ Sometimes  | Integration tests with `.integration.proxy.ts` for complex setup (spawning processes, clients)  |

#### 1. Adapter Proxy (Foundation)

**Purpose:** Mock npm packages at I/O boundaries. Adapter code runs real.

**When to mock:** I/O adapters (axios, fs/promises, ioredis) - these translate between npm types and contracts.

**When NOT to mock:** DSL/query adapters (ESLint, SQL, GraphQL) - these need real execution to validate your DSL/query
logic. See "Unit Tests vs Integration Tests" section.

```typescript
// adapters/http/http-adapter.proxy.ts
import axios from 'axios';
import type {Url} from '../../contracts/url/url-contract';
import type {HttpResponse} from '../../contracts/http-response/http-response-contract';
import {HttpStatusStub} from '../../contracts/http-status/http-status.stub';

// ✅ Mock declared in proxy - automatically hoisted when proxy is imported
jest.mock('axios');

export const httpAdapterProxy = () => {
    // ✅ Mock the npm dependency (axios), not the adapter!
    const mock = jest.mocked(axios);

    // ✅ Setup default mock behavior (runs fresh in each test when proxy is created)
    mock.mockImplementation(async () => ({
        data: {},
        status: HttpStatusStub(200),
        statusText: 'OK'
    }));

    return {
        returns: ({url, response}: { url: Url; response: HttpResponse }): void => {
            mock.mockResolvedValueOnce(response);
        },

        throws: ({url, error}: { url: Url; error: Error }): void => {
            mock.mockRejectedValueOnce(error);
        }
    };
};
```

**Empty Proxy Pattern:**

When an adapter is a simple re-export with no mocking needed (e.g., DSL/query adapters that run real):

```typescript
// adapters/eslint-plugin/load/eslint-plugin-load-adapter.proxy.ts
// Proxy for simple re-export adapter - no mocking needed for DSL validation

export const eslintPluginLoadAdapterProxy = (): Record<PropertyKey, never> => ({});
```

**Use `Record<PropertyKey, never>` for empty object return types** - this ensures no properties can be added while
accepting all valid key types (string | number | symbol).

#### 2. Broker Proxy (Composition)

**Purpose:** Compose adapter proxies. Mock globals if the broker uses them (see "Global Function Mocks" section).

```typescript
// brokers/user/profile/user-profile-broker.proxy.ts
import {httpAdapterProxy} from '../../../adapters/http/http-adapter.proxy';
import type {UserId} from '../../../contracts/user-id/user-id-contract';
import type {User} from '../../../contracts/user/user-contract';
import {UrlStub} from '../../contracts/url/url.stub';
import {HttpStatusStub} from '../../contracts/http-status/http-status.stub';

export const userProfileBrokerProxy = () => {
    const httpProxy = httpAdapterProxy();  // Compose child proxy

    return {
        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }): void => {
            const userUrl = UrlStub(`https://api.example.com/users/${userId}`);

            // Broker makes 2 HTTP calls - both return same user for own profile
            httpProxy.returns({url: userUrl, response: {data: user, status: HttpStatusStub(200)}});
            httpProxy.returns({url: userUrl, response: {data: user, status: HttpStatusStub(200)}});
        }
    };
};
```

#### 3. Widget Proxy (Delegation + UI Helpers)

**Purpose:** Delegate to child proxies for setup, provide widget-specific triggers and selectors.

```typescript
// widgets/user-profile/user-profile-widget.proxy.ts
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useUserProfileBindingProxy} from '../../bindings/use-user-profile/use-user-profile-binding.proxy';
import type {UserId} from '../../contracts/user-id/user-id-contract';
import type {User} from '../../contracts/user/user-contract';

export const userProfileWidgetProxy = () => {
    // Create child proxy (which creates entire chain and sets up all mocks)
    const bindingProxy = useUserProfileBindingProxy();

    // NO jest.mocked(widget) - widget renders real!

    return {
        // Delegate to binding proxy
        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }): void => {
            bindingProxy.setupOwnProfile({userId, user});
        },

        // Widget-specific triggers for ui elements
        triggerEdit: async (): Promise<void> => {
            const button = screen.queryByTestId('EDIT_BUTTON');
            if (!button) {
                throw new Error('Edit button not visible');
            }
            await userEvent.click(button);
        },

        // Widget-specific selectors
        isLoading: (): boolean => screen.queryByTestId('LOADING') !== null
    };
};
```

#### Other Proxy Types (Brief Reference)

**State Proxy** - Spy on state methods with `jest.spyOn()`, clear state in constructor. For external systems (Redis,
DB), mock the npm package and swap with in-memory version.

**Guard Proxy** - Provide semantic data builders for different guard paths. Guard runs real, proxy just builds test
data.

**Binding/Middleware/Responder Proxies** - All follow delegation pattern: create child proxy (broker/adapter), delegate
setup methods. Code runs real.

**Transformer Proxy** - Provide semantic data builders for test data. Transformers run real, proxy builds input data.

**Statics Proxy** - Override immutable values for edge case testing. Use `Reflect.set()` to mutate readonly constants at
runtime, or `jest.spyOn()` for getters.

```typescript
// Use Reflect.set for direct properties
export const userStaticsProxy = () => ({
    setupUnlimitedAttempts: (): void => {
        Reflect.set(userStatics.limits, 'maxLoginAttempts', Infinity);
    }
});

// Use jest.spyOn for getters
export const apiStaticsProxy = () => {
    jest.spyOn(apiStatics, 'timeout', 'get').mockReturnValue(0);
    return {};
};
```

#### Guard Proxies: Why Pure Functions Need Test Helpers

**The Problem:** Guards are pure boolean functions with multiple logical paths. When testing layers that use guards, you
need data that triggers each path. Without helpers, test authors must understand guard implementation details.

**Example Guard:**
```typescript
// guards/has-edit-permission/has-edit-permission-guard.ts
export const hasEditPermissionGuard = ({currentUser, profileUserId}: {
    currentUser?: User;
    profileUserId?: UserId;
}): boolean => {
    if (!currentUser || !profileUserId) return false;  // Path 0: Missing params
    if (currentUser.id === profileUserId) return true; // Path 1: Own profile
    if (currentUser.isAdmin) return true;              // Path 2: Admin
    return false;                                      // Path 3: Deny
};
```

**Note:** All guard parameters must be optional (enforced by `@dungeonmaster/enforce-optional-guard-params` rule).
Guards
validate parameters exist before using them.

**Without Guard Proxy:**
```typescript
// Widget test must know guard logic
it('VALID: {admin, different user} => shows edit button', () => {
    const user = UserStub({
        id: UserIdStub('user-1'),
        isAdmin: true  // ← Must know: isAdmin gives permission
    });
    // ...
});
```

**With Guard Proxy:**
```typescript
// guards/has-edit-permission/has-edit-permission-guard.proxy.ts
export const hasEditPermissionGuardProxy = () => {
    // NO jest.mocked() - guard runs real!

    return {
        // Semantic helper for Path 1
        setupForOwnProfileEdit: ({userId}: { userId: UserId }): User => {
            return UserStub({id: userId, isAdmin: false});
        },

        // Semantic helper for Path 2
        setupForAdminEdit: (): User => {
            return UserStub({isAdmin: true});
        },

        // Semantic helper for Path 3
        setupForNoEdit: ({userId}: { userId: UserId }): User => {
            const differentId = UserIdStub(`different-from-${userId}`);
            return UserStub({id: differentId, isAdmin: false});
        }
    };
};

// Higher-layer proxy uses guard helpers
export const userProfileBrokerProxy = () => {
    const httpProxy = httpAdapterProxy();
    const guardProxy = hasEditPermissionGuardProxy();

    return {
        setupOwnProfileWithEdit: ({userId, user}) => {
            const editableUser = guardProxy.setupForOwnProfileEdit({userId});
            httpProxy.returns({
                url: UrlStub(`/users/${userId}`),
                response: {data: editableUser, status: HttpStatusStub(200)}
            });
        }
    };
};

// Widget test is now semantic
it('VALID: {admin viewing profile} => shows edit button', () => {
    widgetProxy.setupAdminViewingProfile({userId, user, adminId});  // ← Semantic!
    // ...
});
```

**Key Benefits:**

- **Semantic**: Tests describe WHAT scenario, not HOW to construct it
- **Encapsulated**: Only guard proxy knows implementation details
- **Reusable**: Guard proxy helpers used across all higher layers
- **Guard runs real**: Helpers build data, guard executes normally

### Global Function Mocks

**ANY proxy can mock globals** - not just brokers. Mock in the proxy constructor when the code being tested uses
non-deterministic functions.

**Common globals to mock:** `Date.now()`, `crypto.randomUUID()`, `Math.random()`, `console.*`

```typescript
// Example: Broker proxy mocking globals because broker uses them
export const userCreateBrokerProxy = () => {
    const httpProxy = httpAdapterProxy();

    // Mock in constructor (runs when proxy is created)
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    return {
        setupUserCreate: ({userData}): void => {
            httpProxy.returns({url: UrlStub('/users'), response: {data: {success: true}, status: HttpStatusStub(201)}});
        }
    };
};

// Example: Adapter proxy mocking console because adapter logs
export const emailAdapterProxy = () => {
    jest.spyOn(console, 'log').mockImplementation();  // Silence logs in tests

    return { /* semantic methods */ };
};
```

**Critical:** Don't manually construct values the function generates. Let the function generate them using mocked
globals, then verify the result.

### Create-Per-Test Pattern

**Critical:** Create a fresh proxy in each test. Proxies set up mocks in their constructors.

```typescript
// widgets/user-profile/user-profile-widget.test.tsx
import {render, screen, waitFor} from '@testing-library/react';
import {UserProfileWidget} from './user-profile-widget';
import {userProfileWidgetProxy} from './user-profile-widget.proxy';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

it('VALID: {own profile} => displays name and edit button', async () => {
    // Create fresh proxy for this test (sets up entire chain)
    const widgetProxy = userProfileWidgetProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        isPremium: true
    });

    widgetProxy.setupOwnProfile({userId, user});

    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);

    // Real widget → real hook → real broker → real transformer/guard
    await waitFor(() => {
        expect(widgetProxy.isLoading()).toBe(false);
    });

    expect(screen.getByText(/^Jane Smith$/)).toBeInTheDocument();
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();
});
// @dungeonmaster/testing automatically clears all mocks after test
```

### Child Proxy Creation: Assignment vs Direct Call

**When to assign child proxy to variable:**

- You need to call methods on the child proxy (delegation pattern)
- The child proxy provides setup methods used in the parent's return object

**When to just call without assignment:**

- Empty proxies that return `{}` (pure functions with no dependencies)
- Child proxy is only needed to satisfy `enforce-proxy-child-creation` rule
- You never interact with the child proxy's methods

```typescript
// ✅ CORRECT - Assign when you use the child proxy
export const userProfileBrokerProxy = () => {
    const httpProxy = httpAdapterProxy();  // Used below
    const cacheProxy = userCacheStateProxy();  // Used below

    return {
        setupUserFetch: ({userId, user}) => {
            httpProxy.returns({url: UrlStub(`/users/${userId}`), response: {data: user}});
            cacheProxy.setupCachedUser({userId, user});
        }
    };
};

// ✅ CORRECT - Just call when child is empty/unused
export const validateProxyFunctionReturnLayerBrokerProxy = (): Record<PropertyKey, never> => {
    // These child proxies return {} and have no methods we use
    validateReturnStatementLayerBrokerProxy();
    validateObjectExpressionLayerBrokerProxy();

    return {};
};

// ❌ WRONG - Assigning but never using
export const myProxy = () => {
    const childProxy = emptyChildProxy();  // Lint error: unused variable
    return {};
};
```

**Why this matters:**

- `enforce-proxy-child-creation` rule requires child proxies are created to maintain test architecture
- Empty proxies (returning `{}`) exist purely for structural compliance when implementation has no dependencies
- Unused variable assignments trigger `@typescript-eslint/no-unused-vars` lint errors

### Composing State + Adapter Proxies

When a broker uses state, create both proxies and delegate:

```typescript
export const userFetchBrokerProxy = () => {
    const httpProxy = httpAdapterProxy();
    const cacheProxy = userCacheStateProxy(); // Clears state + sets up spies

    return {
        setupCachedUser: ({userId, user}): void => {
            cacheProxy.setupCachedUser({userId, user}); // HTTP won't be called
        },
        setupUserFetch: ({userId, user}): void => {
            httpProxy.returns({url: UrlStub(`/users/${userId}`), response: {data: user, status: HttpStatusStub(200)}});
            // Cache already cleared by state proxy constructor
        }
    };
};
```

## Mocking Mechanics

### jest.mock() + jest.mocked()

**Used in proxy files, not tests.** `jest.mock()` is automatically hoisted to run before imports. `jest.mocked()`
provides type-safe access.

```typescript
import {readFile} from 'fs/promises';
jest.mock('fs/promises');  // Hoisted automatically

export const fsReadFileAdapterProxy = () => {
    const mockReadFile = jest.mocked(readFile);  // Type-safe
    mockReadFile.mockImplementation(async () => Buffer.from(''));
    return { /* semantic methods */ };
};
```

### jest.spyOn() for Globals Only

Use `jest.spyOn()` for global objects (crypto, Date, console), not module imports:

```typescript
// ✅ CORRECT - Global objects
jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
jest.spyOn(Date, 'now').mockReturnValue(1609459200000);

// ❌ WRONG - Module imports (use jest.mock instead)
import * as adapter from './adapter';

jest.spyOn(adapter, 'fsReadFile'); // Doesn't work!
```

### Branded Types

When mocking functions that return branded types, use stubs to create branded values:

```typescript
// ❌ WRONG - Raw string
mockFsReadFileAdapter.mockResolvedValue('plain string'); // Type error

// ✅ CORRECT - Use stub
mockFsReadFileAdapter.mockResolvedValue(FileContentsStub({value: 'content'}));
```

## Common Anti-Patterns (Avoid These!)

### Assertion Anti-Patterns

- **Property Bleedthrough**: Using partial matchers (toMatchObject, toContain) that miss extra properties
- **Existence-Only Checks**: Using toBeDefined() instead of testing actual values
- **Count-Only Checks**: Testing array.length without verifying complete content

### Mock/Proxy Anti-Patterns

- **Direct Mock Manipulation**: Using `jest.mocked()` directly in tests instead of proxy semantic methods
- **Mocking Application Code**: Using `jest.mock()` on application code - only mock npm packages in proxies
- **Conditional Mocking**: Using if/else logic inside mock implementations
- **Manual Mock Cleanup**: Calling `mockReset()`, `mockClear()`, `clearAllMocks()` - @dungeonmaster/testing handles this
- **Using jest.spyOn() for Modules**: Only use spyOn for global objects (crypto, Date), not module imports
- **Unsafe Type Assertions**: Using `as jest.MockedFunction<typeof fn>` instead of `jest.mocked()`
- **Manual Mock Factories**: Using `jest.mock('module', () => ({...}))` when auto-mocking works
- **Shared Proxy Instances**: Creating proxy once outside tests - always create fresh proxy per test
- **Bootstrap Pattern**: Using `proxy.bootstrap()` method - proxies use constructor setup instead

### Stub Anti-Patterns

- **Using Jest in Stubs**: Calling `jest.fn()` inside stub files - stubs accept mocks via props
- **Missing Contract Stubs**: Not creating `.stub.ts` files for contracts used in tests
- **Mocking npm Types Directly**: Trying to mock library types instead of using contract stubs

### Type Safety Anti-Patterns

- **Type Escape Hatches**: Using `any`, `as`, `@ts-ignore` in tests

### Test Organization Anti-Patterns

- **Testing Implementation**: Spying on internal methods instead of testing outputs
- **Shared Test State**: Tests depending on each other or shared setup
- **Unit Testing DSL Logic**: Mocking systems that interpret DSL/queries (ESLint selectors, SQL, GraphQL)
- **String IDs**: Using 'user-123' instead of proper UUIDs (use 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
- **Comment Organization**: Using comments instead of describe blocks for test structure

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

## Writing Tests

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

### Stub Factory Pattern

**Stubs are data factories that create valid instances of a type with sensible defaults. They are co-located with
contracts using `.stub.ts` extension.**

Stubs accept overrides via props. When tests need to verify function calls, they pass `jest.fn()` to the stub. **Stubs
never use `jest.fn()` internally** - they accept mocks via props.

```typescript
// contracts/user/user.stub.ts
import {userContract} from './user-contract';
import type {User} from './user-contract';
import type {StubArgument} from '@dungeonmaster/shared/@types';

export const UserStub = ({...props}: StubArgument<User> = {}): User =>
    userContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Always use UUIDs
    name: 'John Doe',
    email: 'john@example.com',
    ...props,
    });

// contracts/thing/thing.stub.ts - with mixed data and functions
import {thingContract} from './thing-contract';
import type {Thing} from './thing-contract';
import type {StubArgument} from '@dungeonmaster/shared/@types';

export const ThingStub = ({...props}: StubArgument<Thing> = {}): Thing => {
    // Separate function props from data props
    const {someFunction, ...dataProps} = props;

    // Return: validated data + functions (preserved references)
    return {
        // Data properties validated through contract
        ...thingContract.parse({
            name: 'default-thing',
            ...dataProps,
        }),
        // Function properties preserved (not parsed to maintain references)
        someFunction: someFunction ?? ((): void => {}), // Default no-op
    };
};

// ✅ CORRECT - Test passes jest.fn() when needed
it('VALID: calls function', () => {
    const mockFn = jest.fn();
    const thing = ThingStub({someFunction: mockFn});

    doSomething(thing);

    expect(mockFn).toHaveBeenCalledTimes(1);
});

// contracts/async-service/async-service.stub.ts - async functions
import type {StubArgument} from '@dungeonmaster/shared/@types';

export const AsyncServiceStub = ({...props}: StubArgument<AsyncService> = {}): AsyncService => {
    const {sendRequest, close, ...dataProps} = props;

    return {
        ...asyncServiceContract.parse({
            id: 'service-123',
            ...dataProps,
        }),
        // Async functions must use await to satisfy @typescript-eslint/require-await
        sendRequest:
            sendRequest ??
            (async (_request: Request) => await Promise.resolve(ResponseStub())),
        close: close ?? (async () => await Promise.resolve()),
    };
};

// ❌ WRONG - Never use any or type escapes
const BadStub = (props: any = {}): any => ({ // NO!
    ...props
});

// ❌ WRONG - Not using StubArgument or contract.parse()
const BadStub2 = ({...props}: Partial<User> = {}): User => ({
    id: '123',
    ...props,
});
```

### Contract Stubs

**All stubs live in contracts/:** `contracts/[name]/[name].stub.ts`

With the adapter pivot, adapters translate npm types → contract types. Tests use contract stubs, not npm types:

```typescript
// Contract stub - project-defined type (object)
// contracts/user/user.stub.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';

export const UserStub = ({...props}: StubArgument<User> = {}): User =>
    userContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'John Doe',
    ...props,
    });

// Contract stub - translated from npm package (object)
// contracts/http-response/http-response.stub.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';

export const HttpResponseStub = ({...props}: StubArgument<HttpResponse> = {}): HttpResponse =>
    httpResponseContract.parse({
    body: {},
        statusCode: 200,
    headers: {},
    ...props,
    });

// Contract stub - branded primitive (single value)
// contracts/file-path/file-path.stub.ts
export const FilePathStub = (
    {value}: { value: string } = {value: '/test/file.ts'}
): FilePath => filePathContract.parse(value);

// Contract stub - complex type with mixed data and functions (object)
// contracts/eslint-context/eslint-context.stub.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';
import {z} from 'zod';

// Contract defines only data properties (functions cause Zod type inference issues)
export const eslintContextContract = z.object({
    filename: z.string().brand<'Filename'>().optional(),
});

// TypeScript type adds function methods via intersection
export type EslintContext = z.infer<typeof eslintContextContract> & {
    report: (...args: unknown[]) => unknown;
    getFilename?: () => string & z.BRAND<'Filename'>;
    getScope?: () => unknown;
    getSourceCode?: () => unknown;
};

// Service objects with methods also use this pattern
// contracts/mcp-server-client/mcp-server-client-contract.ts
import {ChildProcess} from 'child_process';

export const mcpServerClientContract = z.object({
    process: z.instanceof(ChildProcess),  // Data property
});

export type McpServerClient = z.infer<typeof mcpServerClientContract> & {
    sendRequest: (request: JsonRpcRequest) => Promise<JsonRpcResponse>;  // Methods
    close: () => Promise<void>;
};

const filenameContract = z.string().brand<'Filename'>();

export const EslintContextStub = ({
                                      ...props
                                  }: StubArgument<EslintContext> = {}): EslintContext => {
    // Separate function props from data props
    const {report, getFilename, getScope, getSourceCode, ...dataProps} = props;

    // Return: validated data + functions (preserved references)
    return {
        // Data properties validated through contract
        ...eslintContextContract.parse({
            filename: filenameContract.parse('/test/file.ts'),
            ...dataProps,
        }),
        // Function properties preserved (not parsed to maintain references)
        report: report ?? ((..._args: unknown[]): unknown => true),
        getFilename: getFilename ?? ((): string & z.BRAND<'Filename'> => filenameContract.parse('/test/file.ts')),
        getScope: getScope ?? ((): unknown => ({})),
        getSourceCode: getSourceCode ?? ((): unknown => ({})),
    };
};
```

**Stub Patterns (Enforced by `@dungeonmaster/enforce-stub-patterns` rule):**

1. **Object Stubs** (complex types with data properties only):
    - MUST use spread operator: `({ ...props }: StubArgument<Type> = {})`
   - MUST use `StubArgument<Type>` from `@dungeonmaster/shared/@types`
    - MUST return `contract.parse({ defaults, ...props })`
   - **Optional fields:** Only provide defaults for required fields, let optional fields be omitted

2. **Branded String Stubs** (single primitive value):
    - MUST use single `value` property: `({ value }: { value: string } = { value: 'default' })`
    - MUST return `contract.parse(value)`

3. **Mixed Data + Function Stubs** (types with both data properties and functions):
    - Contract defines ONLY data properties (no `z.function()`)
    - Type uses intersection: `z.infer<typeof contract> & { functions... }`
    - Stub destructures function props from data props
    - Data props validated through `contract.parse()`
    - Function props preserved outside parse (maintains references for `jest.fn()`)
    - See EslintContext example above for full pattern

4. **All Stubs** (all patterns):
    - MUST use object destructuring parameters
   - Data properties MUST be validated through `contract.parse()`
   - Function properties MUST be preserved outside parse
    - MUST import colocated contract from same directory

**Stub defaults for optional fields:**

```typescript
// ✅ CORRECT - No default for optional fields
export const JsonRpcResponseStub = ({...props} = {}): JsonRpcResponse =>
    jsonRpcResponseContract.parse({
        jsonrpc: '2.0',
        id: 1,
        // result and error are optional - omit defaults
        ...props,
    });

// ❌ WRONG - Default for optional field interferes with error responses
export const BadStub = ({...props} = {}): JsonRpcResponse =>
    jsonRpcResponseContract.parse({
        jsonrpc: '2.0',
        id: 1,
        result: {},  // BAD! Prevents error-only responses from working
        ...props,
    });
```

**Stub Type Strategy:**

- **Branded primitives**: Use contract to parse value (e.g., `filePathContract.parse('/path')`)
- **Objects with branded fields**: Use contract shape to parse fields individually
- **Functions**: Provide no-op default, tests override with `jest.fn()` via props
- **Complex types**: Build minimal structure that satisfies the contract

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

### Extracting Properties from Stubs

When you need specific properties from a stub (e.g., branded values), ALWAYS use destructuring:

```typescript
// ✅ CORRECT - Use destructuring to extract properties
const { message } = RuleViolationStub({ message: 'Test error' });
const { messageId } = RuleViolationStub({ messageId: 'testError' });

// ✅ CORRECT - Extract multiple properties from single stub
const { message, messageId } = RuleViolationStub({
  message: 'Test error',
  messageId: 'testError',
});

// ❌ WRONG - Property access without destructuring (triggers @typescript-eslint/prefer-destructuring)
const message = RuleViolationStub({ message: 'Test error' }).message;
const messageId = RuleViolationStub({ messageId: 'testError' }).messageId;
```

**Why:** ESLint's `@typescript-eslint/prefer-destructuring` rule enforces destructuring for better readability and
consistency.

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
      fs-read-file-adapter.ts
      fs-read-file-adapter.proxy.ts  // Co-located proxy for test setup
      fs-read-file-adapter.test.ts   // Co-located unit tests
  brokers/
    user/
      fetch/
        user-fetch-broker.ts
        user-fetch-broker.proxy.ts  // Co-located proxy
        user-fetch-broker.test.ts
tests/
  e2e/                      // End-to-end tests only
```

**Co-location rules:**

- **Stub files** (`.stub.ts`) are co-located with contracts
- **Proxy files** (`.proxy.ts`) are co-located with the code they test
- **Test files** (`.test.ts`) are co-located with implementation files
- **Integration test files** (`.integration.test.ts`) are co-located with startup and flow files
- **NO separate** `tests/stubs/` or `tests/proxies/` directories

## Integration Testing

Integration tests are for **startup and flow files**. They validate that these files correctly wire up the application.
They use `.integration.test.ts` extension and are co-located with the implementation files.

**ESLint Enforced:** The `@dungeonmaster/enforce-implementation-colocation` rule:

- **Requires** `.integration.test.ts` for startup and flow files (will error if missing)
- **Forbids** `.test.ts` for startup and flow files (will error if present)

**All other code** (brokers, flows, guards, transformers, widgets, etc.) uses **unit tests** (`.test.ts`) with colocated
proxies.

### No Proxies in Integration Tests

**CRITICAL:** Integration tests (`.integration.test.ts`, `.e2e.test.ts`) must **NOT** import proxy files. This is
enforced by lint rules.

```typescript
// ❌ FORBIDDEN in integration tests - importing any proxy files
import {StartInstallProxy} from './start-install.proxy';
import {userBrokerProxy} from '../brokers/user/user-broker.proxy';

// ✅ CORRECT in integration tests - run real code only
import {StartInstall} from './start-install';
import {installTestbedCreateBroker} from '@dungeonmaster/testing';
```

**Why:** Integration tests validate real system behavior. Proxies contain `jest.mock()` calls that mock dependencies,
defeating the purpose of integration testing. Integration tests run the full stack with real implementations.

**File Location:**

```typescript
// ✅ CORRECT - Co-located with startup file
src /
startup /
start - my - app.ts
start - my - app.integration.test.ts   // <-- Co-located
start - my - app.proxy.ts              // <-- Proxy (if needed for complex setup)

// ❌ WRONG - Separate test directory
test /
start - my - app.integration.test.ts  // <-- Don't do this
```

**All core testing principles apply:** No hooks, no conditionals, branded types everywhere, types from stubs.

### Integration Test Proxies (Startup Only)

**IMPORTANT:** Only **startup integration tests** can use proxies. Integration tests are for startup and flow files -
all
other code uses unit tests with proxies. Flow integration tests do NOT use proxies.

**When complex setup is needed** (spawning processes, creating clients, managing async resources), startup integration
tests can use a colocated proxy:

```typescript
// startup/start-mcp-server.proxy.ts
import {JsonRpcResponseStub} from '../contracts/json-rpc-response/json-rpc-response.stub';
import {McpServerClientStub} from '../contracts/mcp-server-client/mcp-server-client.stub';

type McpServerClient = ReturnType<typeof McpServerClientStub>;
type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;

// Startup folder uses PascalCase for exports
export const StartMcpServerProxy = (): {
    createClient: () => Promise<McpServerClient>;
} => {
    const createClient = async (): Promise<McpServerClient> => {
        // Complex setup: spawn process, setup listeners, etc.
        const serverProcess = spawn('npx', ['tsx', serverEntryPoint], {...});

        // Return contract-compliant object with methods
        return {
            process: serverProcess,
            sendRequest: async (request) => { /* ... */
            },
            close: async () => { /* ... */
            },
        };
    };

    return {createClient};
};
```

**Key principles:**

- Extract types via `ReturnType<typeof Stub>` - never import from contracts
- Service objects with methods (clients, connections) ARE contracts
- Use statics for magic numbers (timeouts, delays)
- Avoid mutable state (`let`) - use const objects with mutable properties: `const state = { value: '' }`
- **Proxies CAN have nested functions** - the create-per-test pattern requires returning objects with helper methods

### Complete Integration Test Example

```typescript
import * as fs from 'fs';
import * as path from 'path';
import {execSync} from 'child_process';
import {ExecErrorStub} from '../contracts/exec-error/exec-error.stub';
import {CommandResultStub} from '../contracts/command-result/command-result.stub';
import {ExitCodeStub} from '../contracts/exit-code/exit-code.stub';
import {TestProjectNameStub} from '../contracts/test-project-name/test-project-name.stub';

type ExecError = ReturnType<typeof ExecErrorStub>;
type TestProjectName = ReturnType<typeof TestProjectNameStub>;

const tempRoot = path.join(process.cwd(), '.test-tmp', 'my-app-tests');
const startupPath = path.join(process.cwd(), 'src', 'startup', 'start-my-app.ts');

const createProject = ({name}: { name: TestProjectName }): string => {
    const dir = path.join(tempRoot, name);
    fs.mkdirSync(dir, {recursive: true});
    return dir;
};

const runStartup = ({args}: { args: readonly string[] }) => {
    const command = `npx tsx ${startupPath} ${args.join(' ')}`;

    try {
        const stdout = execSync(command, {encoding: 'utf8'});
        return CommandResultStub({
            exitCode: ExitCodeStub({value: 0}),
            stdout: ProcessOutputStub({value: stdout}),
        });
    } catch (error) {
        const execError = error as ExecError;
        return CommandResultStub({
            exitCode: ExitCodeStub({value: execError.status ?? 1}),
            stdout: ProcessOutputStub({value: execError.stdout?.toString() ?? ''}),
        });
    }
};

describe('StartMyApp', () => {
    describe('with valid config', () => {
        it('VALID: {args: ["--config", "test.json"]} => returns exit code 0', () => {
            fs.mkdirSync(tempRoot, {recursive: true});

            const projectDir = createProject({name: TestProjectNameStub({value: 'valid-config'})});
            fs.writeFileSync(path.join(projectDir, 'test.json'), '{}');

            const result = runStartup({args: [`--config`, `${projectDir}/test.json`]});

            fs.rmSync(tempRoot, {recursive: true, force: true});

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toMatch(/App started successfully/u);
        });
    });
});
```

## Contract Testing

**CRITICAL:** Contract tests MUST import and use stubs, NOT the contract directly.

```typescript
// ✅ CORRECT - Contract test uses stub
// contracts/error-message/error-message-contract.test.ts
import { ErrorMessageStub } from './error-message.stub';

describe('errorMessageContract', () => {
  it('VALID: {value: "An error occurred"} => parses successfully', () => {
    const result = ErrorMessageStub({ value: 'An error occurred' });

    expect(result).toBe('An error occurred');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ErrorMessageStub({ value: '' });

    expect(result).toBe('');
  });
});

// ❌ WRONG - Never import contract directly in tests
import { errorMessageContract } from './error-message-contract';

it('VALID: {value: "test"} => parses successfully', () => {
  const result = errorMessageContract.parse('test'); // FORBIDDEN!
});
```

**Why stubs in contract tests:**

- Enforces consistent test data creation patterns across all test types
- Validates that stubs correctly use contracts (integration point)
- Prevents importing contracts in test files (enforced by `@dungeonmaster/ban-contract-in-tests` rule)
- Tests both the contract validation AND the stub factory in one test

**Contract test structure:**

- Test valid inputs with various edge cases (empty, long, special characters, unicode)
- Use stub with different `value` or property overrides
- Assert stub returns expected branded type
- Do NOT test invalid inputs (stubs only create valid instances)

## EndpointMock (HTTP Mocking for Frontend Tests)

### When to Use `StartEndpointMock`

Use `StartEndpointMock` for **any test that needs to mock HTTP responses** — broker tests, widget integration tests, or
any layer that ultimately calls a fetch adapter.

**Always use via the broker proxy layer** — never call `StartEndpointMock` directly in test files. The broker proxy owns
knowledge of which endpoints its broker calls, so it calls `StartEndpointMock.listen()` with the specific method + URL.

### When NOT to Use `StartEndpointMock`

- **Server-side tests** — The server package tests mock Hono's `serve()`, not fetch. Server code handles incoming
  requests; it does not make outgoing HTTP calls via fetch adapters.
- **Non-HTTP I/O** — Filesystem operations, child process spawning, and similar I/O use existing adapter proxies
  (`jest.mock('fs/promises')`, etc.), not endpoint mocking.

### JSON vs Non-JSON Responses

**JSON payloads (common case):**

- `resolves({ data })` — Shorthand for 200 OK with JSON body. Use when the broker expects a successful JSON response.
- `responds({ status, body })` — JSON response with explicit status code. Use for error responses (4xx, 5xx) or when
  you need a non-200 success status (201, 204).

```typescript
// Broker proxy using JSON helpers
export const projectFetchBrokerProxy = () => {
    const endpoint = StartEndpointMock.listen({method: 'get', url: '/api/projects'});

    return {
        setupProjects: ({projects}: { projects: readonly Project[] }): void => {
            endpoint.resolves({data: projects});
        },

        setupNotFound: (): void => {
            endpoint.responds({status: 404, body: {error: 'Not found'}});
        },
    };
};
```

**Non-JSON payloads (escape hatch):**

- `respondRaw({ status, body, headers })` — For binary, text, HTML, or any non-JSON payload. You control the full
  response including headers.

```typescript
// Broker proxy for a binary download endpoint
export const fileDownloadBrokerProxy = () => {
    const endpoint = StartEndpointMock.listen({method: 'get', url: '/api/files/download'});

    return {
        setupBinaryFile: ({content}: { content: ArrayBuffer }): void => {
            endpoint.respondRaw({
                status: 200,
                body: content,
                headers: {'content-type': 'application/octet-stream'},
            });
        },
    };
};
```

**Network errors:**

- `networkError()` — Simulates a network failure (connection refused, DNS failure). Use when testing error handling for
  unreachable servers.

### The Full Proxy Chain

```
Test → Widget Proxy → Binding Proxy → Broker Proxy → StartEndpointMock.listen() → MSW
```

Each layer delegates setup to the layer below. The broker proxy is the only layer that knows about
`StartEndpointMock` — it creates endpoints for the specific HTTP calls its broker makes. Higher-layer proxies
(binding, widget) expose semantic methods that delegate to the broker proxy.

```typescript
// Broker proxy — owns endpoint knowledge
export const userFetchBrokerProxy = () => {
    const endpoint = StartEndpointMock.listen({method: 'get', url: '/api/users/123'});

    return {
        setupUser: ({user}: { user: User }): void => {
            endpoint.resolves({data: user});
        },
    };
};

// Binding proxy — delegates to broker proxy
export const useUserDataBindingProxy = () => {
    const brokerProxy = userFetchBrokerProxy();

    return {
        setupUser: ({user}: { user: User }): void => {
            brokerProxy.setupUser({user});
        },
    };
};

// Widget proxy — delegates to binding proxy
export const userCardWidgetProxy = () => {
    const bindingProxy = useUserDataBindingProxy();

    return {
        setupUser: ({user}: { user: User }): void => {
            bindingProxy.setupUser({user});
        },
    };
};
```

### MSW Lifecycle

`StartEndpointMockSetup` manages the MSW server lifecycle automatically via `jest.config.js`:

- `beforeAll` — Starts the MSW server (unhandled requests are bypassed)
- `afterEach` — Resets all handlers between tests
- `afterAll` — Closes the server

To enable EndpointMock in a package, add the setup file to `jest.config.js`:

```javascript
module.exports = {
    ...baseConfig,
    setupFilesAfterEnv: [
        '<rootDir>/../../packages/testing/src/jest.setup.js',
        '<rootDir>/../../packages/testing/src/startup/start-endpoint-mock-setup.ts',
    ],
};
```

## Framework-Specific Patterns

### React Testing

```tsx
describe("UserCard", () => {
    describe("render()", () => {
        it("VALID: {user: activeUser} => renders name", () => {
            render(<UserCard user={UserStub({name: 'John'})}/>);
            expect(screen.getByTestId('user-name')).toHaveTextContent(/^John$/);
        })

        it("VALID: {onClick: handler} => calls handler on click", () => {
            const onClick = jest.fn();
            const user = UserStub({id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'John'});
            render(<UserCard user={user} onClick={onClick}/>);
            fireEvent.click(screen.getByTestId('card-button'));
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClick).toHaveBeenCalledWith({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John',
                email: 'john@example.com'  // Test complete object!
            });
        })

        it("EDGE: {user: null} => renders placeholder", () => {
            render(<UserCard user={null}/>);
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

Use responder proxies that delegate to broker/adapter proxies:

```typescript
describe("UserCreateResponder", () => {
    describe("POST /users", () => {
        it("VALID: {name: 'John', email: 'john@test.com'} => returns 201", async () => {
            const responderProxy = userCreateResponderProxy();
            const user = UserStub({
                id: UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
                name: 'John',
                email: 'john@test.com',
                createdAt: 1609459200000
            });

            responderProxy.setupUserCreate({userData: {name: 'John', email: 'john@test.com'}, user});

            const res = await request(app).post('/users').send({name: 'John', email: 'john@test.com'});

            expect(res.status).toBe(201);
            expect(res.body).toStrictEqual({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John',
                email: 'john@test.com',
                createdAt: 1609459200000
            });
        });

        it("INVALID_EMAIL: {email: 'bad'} => returns 400", async () => {
            const res = await request(app).post('/users').send({name: 'John', email: 'bad'});

            expect(res.status).toBe(400);
            expect(res.body).toStrictEqual({error: 'Invalid email', code: 'INVALID_EMAIL'});
        });
    });
});
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