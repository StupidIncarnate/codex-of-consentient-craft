# Testing Standards

## Purpose

Minimize tokens while maintaining clarity for LLMs and humans scanning test suites.

**Why so strict?** Loose tests pass when code is broken. Exact tests catch real bugs.

## Core Principles

### Type Safety Required

Tests MUST use proper TypeScript types. **Never use `any`, `as`, or `@ts-ignore`** - if types don't match, fix the code
or types, not the test.

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

| Category      | Needs Proxy? | Purpose                                                                                         |
|---------------|--------------|-------------------------------------------------------------------------------------------------|
| Contracts     | ❌ No         | Use stubs (`.stub.ts` files)                                                                    |
| Errors        | ❌ No         | Throw directly in tests                                                                         |
| Adapters      | ✅ Sometimes  | **Mock npm dependency** (axios, fs, etc.). Empty proxy if no mocking needed (simple re-exports) |
| Brokers       | ✅ Sometimes  | Compose adapter proxies, provide semantic setup. Empty proxy if no dependencies mocked          |
| Guards        | ❌ No         | Pure boolean functions - run real, no mocking needed                                            |
| Transformers  | ❌ No         | Pure data transformation - run real, no mocking needed                                          |
| Statics       | ❌ No         | Immutable values - test with actual values                                                      |
| State         | ✅ Yes        | Spy on methods, clear state, mock external stores                                               |
| Bindings      | ✅ Yes        | Delegate to broker proxies                                                                      |
| Middleware    | ✅ Yes        | Delegate to adapter proxies                                                                     |
| Responders    | ✅ Yes        | Delegate to broker proxies                                                                      |
| Widgets       | ✅ Yes        | Delegate to bindings + provide UI triggers/selectors                                            |
| Flows/Startup | ❌ No         | Integration tests                                                                               |

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

**Note:** All guard parameters must be optional (enforced by `@questmaestro/enforce-optional-guard-params` rule). Guards
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
// @questmaestro/testing automatically clears all mocks after test
```

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
- **Manual Mock Cleanup**: Calling `mockReset()`, `mockClear()`, `clearAllMocks()` - @questmaestro/testing handles this
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

### Stub Factory Pattern

**Stubs are data factories that create valid instances of a type with sensible defaults. They are co-located with
contracts using `.stub.ts` extension.**

Stubs accept overrides via props. When tests need to verify function calls, they pass `jest.fn()` to the stub. **Stubs
never use `jest.fn()` internally** - they accept mocks via props.

```typescript
// contracts/user/user.stub.ts
import {userContract} from './user-contract';
import type {User} from './user-contract';
import type {StubArgument} from '@questmaestro/shared/@types';

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
import type {StubArgument} from '@questmaestro/shared/@types';

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
import type {StubArgument} from '@questmaestro/shared/@types';

export const UserStub = ({...props}: StubArgument<User> = {}): User =>
    userContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'John Doe',
    ...props,
    });

// Contract stub - translated from npm package (object)
// contracts/http-response/http-response.stub.ts
import type {StubArgument} from '@questmaestro/shared/@types';

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
import type {StubArgument} from '@questmaestro/shared/@types';
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

**Stub Patterns (Enforced by `@questmaestro/enforce-stub-patterns` rule):**

1. **Object Stubs** (complex types with data properties only):
    - MUST use spread operator: `({ ...props }: StubArgument<Type> = {})`
    - MUST use `StubArgument<Type>` from `@questmaestro/shared/@types`
    - MUST return `contract.parse({ defaults, ...props })`

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
- **NO separate** `tests/stubs/` or `tests/proxies/` directories

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
- Prevents importing contracts in test files (enforced by `@questmaestro/ban-contract-in-tests` rule)
- Tests both the contract validation AND the stub factory in one test

**Contract test structure:**

- Test valid inputs with various edge cases (empty, long, special characters, unicode)
- Use stub with different `value` or property overrides
- Assert stub returns expected branded type
- Do NOT test invalid inputs (stubs only create valid instances)

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