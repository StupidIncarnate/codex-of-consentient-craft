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
`beforeEach`, no `bootstrap()` method, no manual setup.

**The pattern:**

```typescript
// ✅ CORRECT - Fresh proxy per test, constructor sets up mocks
it('test', () => {
    const proxy = createWidgetProxy();  // Mocks configured here
    proxy.setupScenario({...});         // Semantic setup
    // Test code...
});
// @questmaestro/testing auto-clears mocks after test

// ❌ WRONG - Shared proxy + beforeEach
const proxy = createWidgetProxy();
beforeEach(() => proxy.bootstrap());  // DON'T DO THIS

// ❌ WRONG - Direct mock manipulation
it('test', () => {
    jest.mocked(adapter).mockResolvedValue(...);  // DON'T DO THIS
});
```

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
│               └─ axios    (MOCKED)        │ ← Mock npm dependency
└────────────────────────────────────────────┘

Only 2 things mocked: npm dependencies + global functions
```

### Proxy Types

Proxies are test helpers that create and configure mocks. They provide semantic setup methods instead of exposing mock
implementation details.

#### Adapter Proxy (Mocks npm dependency)

**Purpose:** Mock the npm package, not the adapter. Adapter code runs real.

```typescript
// adapters/http/http-adapter.proxy.ts
import axios from 'axios';
import type {Url} from '../../contracts/url/url-contract';
import type {HttpResponse} from '../../contracts/http-response/http-response-contract';

// ✅ Mock declared in proxy - automatically hoisted when proxy is imported
jest.mock('axios');

export const httpAdapterProxy = () => {
    // ✅ Mock the npm dependency (axios), not the adapter!
    const mock = jest.mocked(axios);

    // ✅ Setup default mock behavior (runs fresh in each test when proxy is created)
    mock.mockImplementation(async () => ({
        data: {},
        status: 200,
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

#### Broker Proxy (Setup helper + global mocks)

**Purpose:** Provide semantic setup methods and mock global functions in constructor.

```typescript
// brokers/user/profile/user-profile-broker.proxy.ts
import {httpAdapterProxy} from '../../../adapters/http/http-adapter.proxy';
import type {UserId} from '../../../contracts/user-id/user-id-contract';
import type {User} from '../../../contracts/user/user-contract';

export const userProfileBrokerProxy = () => {
    // Create child proxy (which sets up axios mock)
    const httpProxy = httpAdapterProxy();

    // Mock global functions for predictable values (runs when proxy is created)
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    // NO jest.mocked(broker) - broker runs real!

    return {
        // Semantic setup - encapsulates what "viewing own profile" means
        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }): void => {
            const userUrl = `https://api.example.com/users/${userId}`;

            // Broker makes 2 HTTP calls (profile user + current user)
            // When viewing own profile, both return same user
            httpProxy.returns({url: userUrl, response: {data: user, status: 200}});
            httpProxy.returns({url: userUrl, response: {data: user, status: 200}});
        }
    };
};
```

#### Guard Proxy (Data builder)

**Purpose:** Provide helpers to build test data that exercises each guard path. Guard runs real.

```typescript
// guards/has-edit-permission/has-edit-permission-guard.proxy.ts
import type {User} from '../../contracts/user/user-contract';
import type {UserId} from '../../contracts/user-id/user-id-contract';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

export const hasEditPermissionGuardProxy = () => {
    // NO jest.mocked() - guard runs real!
    // Proxy provides SEMANTIC HELPERS for setting up test data

    return {
        // Helper: Make user match profile user (permission granted)
        setupForOwnProfileEdit: ({userId}: { userId: UserId }): User => {
            return UserStub({id: userId, isAdmin: false});
        },

        // Helper: Make user an admin (permission granted)
        setupForAdminEdit: (): User => {
            return UserStub({isAdmin: true});
        },

        // Helper: Make user different and non-admin (permission denied)
        setupForNoEdit: ({userId}: { userId: UserId }): User => {
            const differentId = UserIdStub(`different-from-${userId}`);
            return UserStub({id: differentId, isAdmin: false});
        }
    };
};
```

#### State Proxy (Jest spies + cleanup)

**Purpose:** Track state method calls and clear state between tests. Swap external systems (Redis, DB) with in-memory
versions.

```typescript
// state/user-cache/user-cache-state.proxy.ts
import type {User, UserId} from '../../contracts/user/user-contract';
import {userCacheState} from './user-cache-state';

export const userCacheStateProxy = () => {
    // Spy on state methods so Jest tracks them
    jest.spyOn(userCacheState, 'get');
    jest.spyOn(userCacheState, 'set');
    jest.spyOn(userCacheState, 'clear');

    // Clear real state when proxy is created (per test)
    userCacheState.clear();

    return {
        // Semantic setup
        setupCachedUser: ({userId, user}: { userId: UserId; user: User }): void => {
            userCacheState.set({id: userId, user});
        },

        // Verification helpers
        getCachedUser: ({userId}: { userId: UserId }): User | undefined => {
            return userCacheState.get({id: userId});
        },

        wasCached: ({userId}: { userId: UserId }): boolean => {
            const getSpy = jest.mocked(userCacheState.get);
            return getSpy.mock.calls.some(call => call[0].id === userId);
        }
    };
};

// For external systems, mock the npm package
// state/redis-client/redis-client-state.proxy.ts
import RedisMock from 'ioredis-mock';

// Mock ioredis to use in-memory mock
jest.mock('ioredis', () => require('ioredis-mock'));

export const redisClientStateProxy = () => {
    const mockRedis = new RedisMock();

    jest.spyOn(redisClientState, 'get');
    jest.spyOn(redisClientState, 'set');

    // Clear all keys when proxy created
    mockRedis.flushall();

    return {
        setupCachedValue: async ({key, value}: { key: string; value: string }): Promise<void> => {
            await redisClientState.set({key, value});
        },

        getValue: async ({key}: { key: string }): Promise<string | null> => {
            return await redisClientState.get({key});
        }
    };
};
```

#### Binding Proxy (Delegates to broker)

**Purpose:** Delegate to broker proxy for setup. Bindings run real (React hooks execute).

```typescript
// bindings/use-user-profile/use-user-profile-binding.proxy.ts
import {userProfileBrokerProxy} from '../../brokers/user/profile/user-profile-broker.proxy';
import type {UserId} from '../../contracts/user-id/user-id-contract';
import type {User} from '../../contracts/user/user-contract';

export const useUserProfileBindingProxy = () => {
    // Create child proxy (which sets up entire chain)
    const brokerProxy = userProfileBrokerProxy();

    // NO jest.mocked(binding) - binding (React hook) runs real!

    return {
        // Delegate to broker proxy
        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }): void => {
            brokerProxy.setupOwnProfile({userId, user});
        },

        setupUserFetch: ({userId, user}: { userId: UserId; user: User }): void => {
            brokerProxy.setupUserFetch({userId, user});
        }
    };
};
```

#### Widget Proxy (Setup helper + triggers)

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

#### Transformer Proxy (Optional - Usually not needed)

**Purpose:** Transformers are pure functions. Proxy rarely needed, but can provide semantic data builders.

```typescript
// transformers/user-to-dto/user-to-dto-transformer.proxy.ts
import {UserStub} from '../../contracts/user/user.stub';
import type {User} from '../../contracts/user/user-contract';

export const userToDtoTransformerProxy = () => {
    // NO jest.mocked() - transformer runs real!
    // Proxy just provides semantic data builders

    return {
        // Helper: Create user with specific fields for DTO testing
        setupUserWithAllFields: (): User => {
            return UserStub({
                id: 'user-1',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                isAdmin: false,
                isPremium: true
            });
        },

        setupUserWithMinimalFields: (): User => {
            return UserStub({
                id: 'user-1',
                firstName: 'Jane',
                lastName: 'Smith'
            });
        }
    };
};

// Usually transformers don't need proxies - just test with stubs directly
```

#### Middleware Proxy (Delegates to adapters)

**Purpose:** Middleware orchestrates infrastructure adapters. Proxy delegates to adapter proxies.

```typescript
// middleware/http-telemetry/http-telemetry-middleware.proxy.ts
import {winstonLogAdapterProxy} from '../../adapters/winston/winston-log-adapter.proxy';
import {prometheusCounterAdapterProxy} from '../../adapters/prometheus/prometheus-counter-adapter.proxy';

export const httpTelemetryMiddlewareProxy = () => {
    const logProxy = winstonLogAdapterProxy();
    const metricsProxy = prometheusCounterAdapterProxy();

    return {
        setupHttpRequest: ({method, url, statusCode}: {
            method: string;
            url: string;
            statusCode: number;
        }): void => {
            // Middleware will log and increment counter
            logProxy.expectsLog({level: 'info', message: `${method} ${url} - ${statusCode}`});
            metricsProxy.expectsIncrement({name: 'http_requests_total', labels: {method, status: String(statusCode)}});
        }
    };
};
```

#### Responder Proxy (Delegates to brokers)

**Purpose:** Responders handle requests. Proxy delegates to broker proxies.

```typescript
// responders/user/get/user-get-responder.proxy.ts
import {userFetchBrokerProxy} from '../../../brokers/user/fetch/user-fetch-broker.proxy';
import type {UserId} from '../../../contracts/user-id/user-id-contract';
import type {User} from '../../../contracts/user/user-contract';

export const userGetResponderProxy = () => {
    const brokerProxy = userFetchBrokerProxy();

    return {
        setupUserGet: ({userId, user}: { userId: UserId; user: User }): void => {
            brokerProxy.setupUserFetch({userId, user});
        }
    };
};

// Responder tests usually mock Express req/res
// Test validates input parsing, broker call, response formatting
```

#### Statics Proxy (Override immutable values)

**Purpose:** Override static values for tests. Prevents conditionals in statics files.

```typescript
// statics/user/user-statics.ts
export const userStatics = {
    roles: {
        admin: 'admin',
        user: 'user',
        guest: 'guest'
    },
    limits: {
        maxLoginAttempts: 5,
        sessionTimeout: 3600
    }
} as const;

// statics/user/user-statics.proxy.ts
export const userStaticsProxy = () => {
    // Store original values
    const original = {
        maxLoginAttempts: userStatics.limits.maxLoginAttempts,
        sessionTimeout: userStatics.limits.sessionTimeout
    };

    return {
        // Override for specific test scenarios
        setupUnlimitedAttempts: (): void => {
            // Use Reflect.set to mutate readonly const at runtime
            Reflect.set(userStatics.limits, 'maxLoginAttempts', Infinity);
        },

        setupShortTimeout: (): void => {
            Reflect.set(userStatics.limits, 'sessionTimeout', 60); // 1 minute for tests
        },

        // Restore originals (called by @questmaestro/testing cleanup)
        restore: (): void => {
            Reflect.set(userStatics.limits, 'maxLoginAttempts', original.maxLoginAttempts);
            Reflect.set(userStatics.limits, 'sessionTimeout', original.sessionTimeout);
        }
    };
};

// Usage in test
it('VALID: {unlimited attempts} => does not lock account', async () => {
    const staticsProxy = userStaticsProxy();
    staticsProxy.setupUnlimitedAttempts();

    // Test code that uses userStatics.limits.maxLoginAttempts
    // Sees Infinity instead of 5
});

// Alternative: Use jest.spyOn for readonly objects
// statics/api/api-statics.proxy.ts
export const apiStaticsProxy = () => {
    jest.spyOn(apiStatics, 'baseUrl', 'get').mockReturnValue('https://test.api.com');
    jest.spyOn(apiStatics, 'timeout', 'get').mockReturnValue(1000);

    return {
        setupDevApi: (): void => {
            jest.spyOn(apiStatics, 'baseUrl', 'get').mockReturnValue('http://localhost:3000');
        }
    };
};
```

**Why statics need proxies:**

- Allows test-specific value overrides for edge cases without modifying source
- Lets you test behavior at different limits/thresholds
- Keeps statics truly immutable in production code

**Environment config is fine:**

```typescript
// ✅ CORRECT - Environment-based config is normal
export const apiStatics = {
    baseUrl: process.env.API_BASE_URL || 'https://api.com',
    timeout: parseInt(process.env.API_TIMEOUT || '5000', 10)
} as const;

// ✅ CORRECT - Use proxy to test edge cases beyond env config
// apiStatics.proxy.ts
export const apiStaticsProxy = () => {
    return {
        setupZeroTimeout: (): void => {
            Reflect.set(apiStatics, 'timeout', 0); // Test timeout edge case
        },
        setupInfiniteTimeout: (): void => {
            Reflect.set(apiStatics, 'timeout', Infinity); // Test no timeout
        }
    };
};

// Test uses proxy to override for specific scenario
it('EDGE: {timeout: 0} => throws immediately', () => {
    const proxy = apiStaticsProxy();
    proxy.setupZeroTimeout();
    // Test code that uses apiStatics.timeout sees 0
});
```

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

### Global Function Mocks

Mock global functions in proxy constructor for predictable values.

**When to mock:**

- `Date.now()`, `Date.UTC()`, `new Date()`
- `crypto.randomUUID()`, `crypto.getRandomValues()`
- `Math.random()`
- `console.log()`, `console.error()`, `console.warn()`

**Example:**

```typescript
export const userCreateBrokerProxy = () => {
    const httpProxy = httpAdapterProxy();

    // Mock globals in constructor (runs when proxy is created)
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    return {
        setupUserCreate: ({userData, timestamp, id}: {
            userData: UserData;
            timestamp?: number;  // Optional override
            id?: string;         // Optional override
        }): void => {
            // Override defaults for specific scenarios
            if (timestamp !== undefined) {
                jest.spyOn(Date, 'now').mockReturnValue(timestamp);
            }
            if (id !== undefined) {
                jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);
            }

            httpProxy.returns({url: '/users', response: {data: {success: true}, status: 201}});
        }
    };
};

// Test verifies function USED the mocked globals
it('VALID: {userData} => creates user with mocked ID and timestamp', async () => {
    const brokerProxy = userCreateBrokerProxy();
    const userData = UserDataStub({firstName: 'Jane', lastName: 'Smith'});

    brokerProxy.setupUserCreate({userData});

    const result = await userCreateBroker({userData});

    // Test that broker USED the mocked global functions
    expect(result).toStrictEqual({
        ...userData,
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // Generated by mocked crypto.randomUUID()
        createdAt: 1609459200000,                     // Generated by mocked Date.now()
        updatedAt: 1609459200000
    });

    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(Date.now).toHaveBeenCalledTimes(2);
});
```

**Critical:** Don't manually construct values the function generates. Let the function generate them using mocked
globals, then verify they used the mocks.

```typescript
// ❌ WRONG - Manually setting values the function generates
setupUserCreate: ({userData}) => {
    httpProxy.returns({
        response: {
            data: {
                ...userData,
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // ❌ Don't set this!
                createdAt: 1609459200000                      // ❌ Don't set this!
            }
        }
    });
}

// ✅ CORRECT - Let function generate values, verify they used mocked globals
setupUserCreate: ({userData}): void => {
    httpProxy.returns({
        response: {
            data: {success: true},  // ✅ Just mock server response
            status: 201
        }
    });
}

const result = await userCreateBroker({userData});
expect(result.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');  // ✅ Verifies broker used mocked crypto.randomUUID()
```

### State Integration with Broker Proxy

When a broker uses state, the broker proxy creates and delegates to the state proxy:

```typescript
// brokers/user/fetch/user-fetch-broker.ts
export const userFetchBroker = async ({userId}: { userId: UserId }): Promise<User> => {
    // Check cache first
    const cached = userCacheState.get({id: userId});
    if (cached) return cached;

    // Not in cache, fetch from API
    const response = await httpAdapter({url: `/users/${userId}`});
    const user = userContract.parse(response.data);

    // Store in cache
    userCacheState.set({id: userId, user});
    return user;
};

// brokers/user/fetch/user-fetch-broker.proxy.ts
export const userFetchBrokerProxy = () => {
    const httpProxy = httpAdapterProxy();
    const cacheProxy = userCacheStateProxy(); // State proxy clears + spies

    return {
        // Cache hit scenario
        setupCachedUser: ({userId, user}: { userId: UserId; user: User }): void => {
            cacheProxy.setupCachedUser({userId, user}); // Delegate to state proxy
            // No HTTP mock needed - broker won't call it
        },

        // Cache miss scenario
        setupUserFetch: ({userId, user}: { userId: UserId; user: User }): void => {
            // Cache already cleared by state proxy
            httpProxy.returns({url: `/users/${userId}`, response: {data: user, status: 200}});
        },

        // Verification helpers
        isCached: ({userId}: { userId: UserId }): boolean => {
            return cacheProxy.getCachedUser({userId}) !== undefined;
        },

        getHttpCallCount: (): number => httpProxy.getCallCount()
    };
};

// Test: Cache hit
it('VALID: {userId in cache} => returns cached user without HTTP call', async () => {
    const brokerProxy = userFetchBrokerProxy();
    const userId = UserIdStub('user-1');
    const user = UserStub({id: userId, name: 'Jane'});

    brokerProxy.setupCachedUser({userId, user});

    const result = await userFetchBroker({userId});

    expect(result).toStrictEqual(user);
    expect(brokerProxy.getHttpCallCount()).toBe(0); // No HTTP call
    expect(brokerProxy.isCached({userId})).toBe(true);
});

// Test: Cache miss
it('VALID: {userId not in cache} => fetches from API and caches', async () => {
    const brokerProxy = userFetchBrokerProxy();
    const userId = UserIdStub('user-1');
    const user = UserStub({id: userId, name: 'Jane'});

    brokerProxy.setupUserFetch({userId, user});

    const result = await userFetchBroker({userId});

    expect(result).toStrictEqual(user);
    expect(brokerProxy.getHttpCallCount()).toBe(1); // HTTP was called
    expect(brokerProxy.isCached({userId})).toBe(true); // Now cached
});
```

### Key Principles

1. **Only adapters mock npm dependencies** - Use `jest.mock()` + `jest.mocked()`
2. **Global mocks in proxy constructor** - Set when proxy is created
3. **State proxies use jest.spyOn()** - Track calls, clear state between tests
4. **External state mocks npm package** - Swap Redis → RedisMock, pg → pg-mem
5. **Setup flows UP** - widgetProxy → bindingProxy → brokerProxy → stateProxy + adapterProxy
6. **Execution flows DOWN** - Widget → Binding → Broker → State (all REAL) + Adapter (all REAL except npm package)
7. **Semantic methods** - `setupOwnProfile()` not `mockHttpCall()`
8. **Create per test** - Fresh proxy in each test, mocks auto-reset via @questmaestro/testing
9. **Don't construct generated values** - Let functions generate via mocked globals, verify they used them
10. **Guards run real** - Guard proxies build test data, don't mock the guard
11. **State runs real** - State proxies spy and clear, don't mock state methods
12. **Everything runs real** - Only npm dependencies and globals are mocked

## Mocking Pattern (Universal)

### The One Pattern: `jest.mock()` + `jest.mocked()`

**IMPORTANT: This pattern is used INSIDE PROXY FILES, not directly in tests.** Tests interact with proxies using
semantic methods. Proxies encapsulate all mock setup.

**Use this pattern in `.proxy.ts` files** for mocking adapters and npm packages:

```typescript
// adapters/fs/fs-read-file-adapter.proxy.ts
import {readFile} from 'fs/promises';

// Mock npm package (automatically hoisted)
jest.mock('fs/promises');

export const fsReadFileAdapterProxy = () => {
    // Type-safe mock access
    const mockReadFile = jest.mocked(readFile);

    // Setup default behavior (runs when proxy created)
    mockReadFile.mockImplementation(async () => Buffer.from(''));

    return {
        returns: ({filePath, contents}: { filePath: FilePath; contents: FileContents }): void => {
            mockReadFile.mockResolvedValueOnce(Buffer.from(contents));
        },

        throws: ({filePath, error}: { filePath: FilePath; error: Error }): void => {
            mockReadFile.mockRejectedValueOnce(error);
        }
    };
};

// Test uses proxy, not direct mocks
import {fsReadFileAdapter} from './fs-read-file-adapter';
import {fsReadFileAdapterProxy} from './fs-read-file-adapter.proxy';

it('VALID: reads file', async () => {
    const adapterProxy = fsReadFileAdapterProxy();  // Proxy sets up mocks
    const filePath = FilePathStub('/config.json');
    const contents = FileContentsStub('data');

    adapterProxy.returns({filePath, contents});  // Semantic setup

    const result = await fsReadFileAdapter({filePath});

    expect(result).toStrictEqual(contents);
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

**ONLY use `jest.spyOn()` for global objects** (crypto, Date, window, console) when in proxies:

```typescript
// ✅ CORRECT - spyOn for global objects
jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
jest.spyOn(console, 'log').mockImplementation();

// ❌ WRONG - Don't use spyOn for module imports
import * as adapter from './adapter';

jest.spyOn(adapter, 'fsReadFile'); // Doesn't work! Use jest.mock() instead
```

**Why spyOn doesn't work for module imports:** When your code does `import { fsReadFileAdapter }`, it creates a direct
binding
to the real function, bypassing any spy on the namespace object.

### Mocking with Branded Types

When using Zod branded types, mocks must use the branded type:

```typescript
// contracts/file-contents/file-contents-contract.ts
export const fileContentsContract = z.string().brand<'FileContents'>();
export type FileContents = z.infer<typeof fileContentsContract>;

// adapter returns branded type
export const fsReadFileAdapter = async ({filePath}: { filePath: FilePath }): Promise<FileContents> =>
    fileContentsContract.parse(await readFile(filePath, 'utf8'));

// test - must use branded type
jest.mock('../../../adapters/fs/fs-read-file-adapter');
const mockFsReadFileAdapter = jest.mocked(fsReadFileAdapter);

it('VALID: reads file', async () => {
    // ❌ WRONG - Type error: string is not FileContents
    mockFsReadFileAdapter.mockResolvedValue('plain string');

    // ✅ CORRECT - Use contract to create branded type
    const contents = fileContentsContract.parse('mocked content');
    mockFsReadFileAdapter.mockResolvedValue(contents);

    // ✅ CORRECT - Or inline
    mockFsReadFileAdapter.mockResolvedValue(fileContentsContract.parse('mocked content'));
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

// Usage in tests (from adapters/fs/fs-read-file-adapter.test.ts)
import {FileContentsStub} from '../../contracts/file-contents/file-contents.stub';
import {FilePathStub} from '../../contracts/file-path/file-path.stub';

const filePath = FilePathStub('/config.json');
const fileContents = FileContentsStub('mocked content');

mockFsReadFileAdapter.mockResolvedValue(fileContents);
expect(mockFsReadFileAdapter).toHaveBeenCalledWith({filePath});
```

### What to Mock (In Proxy Files)

**IMPORTANT: This guidance applies to `.proxy.ts` files, not test files.** Tests use proxy semantic methods. Proxies
handle all mock setup internally.

**In proxy files, mock:**

- **npm packages** - External libraries (axios, fs/promises, ioredis, etc.) - mocked in adapter proxies
- **Global objects** - Non-deterministic functions (crypto, Date, console) - mocked in broker/binding proxies
- **State systems** - External state (Redis, DB pools) - swap with in-memory versions in state proxies

**Never mock in proxies:**

- **Application code** - Adapters, brokers, transformers, guards all run REAL
- **Contracts** - Pure Zod schemas (no side effects)
- **Type imports** - `import type { ... }`

**Why everything runs real:** The proxy architecture mocks ONLY at I/O boundaries (npm packages, globals). All
application code runs real to ensure contract integrity across layers.

```typescript
// ✅ CORRECT - Adapter proxy mocks npm package
// adapters/fs/fs-read-file-adapter.proxy.ts
import {readFile} from 'fs/promises';

jest.mock('fs/promises');  // Mock npm package

export const fsReadFileAdapterProxy = () => {
    const mockReadFile = jest.mocked(readFile);
    mockReadFile.mockImplementation(async () => Buffer.from(''));

    return {
        returns: ({filePath, contents}: { filePath: FilePath; contents: FileContents }): void => {
            mockReadFile.mockResolvedValueOnce(Buffer.from(contents));
        }
    };
};

// ✅ CORRECT - Broker proxy creates adapter proxy, mocks globals
// brokers/config/load/config-load-broker.proxy.ts
import {fsReadFileAdapterProxy} from '../../../adapters/fs/fs-read-file-adapter.proxy';

export const configLoadBrokerProxy = () => {
    const fsProxy = fsReadFileAdapterProxy();  // Adapter proxy sets up fs mock

    // Mock globals for predictable values (constructor setup)
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);

    return {
        setupConfigLoad: ({filePath, contents, config}: {
            filePath: FilePath;
            contents: FileContents;
            config: Config;
        }): void => {
            fsProxy.returns({filePath, contents});
            // configParseBroker runs REAL - no mock needed
        }
    };
};

// ✅ CORRECT - Test uses proxy
it('VALID: loads config', async () => {
    const brokerProxy = configLoadBrokerProxy();  // Sets up all mocks
    const filePath = FilePathStub('/config.json');
    const contents = FileContentsStub('{"key": "value"}');
    const config = ConfigStub({key: 'value'});

    brokerProxy.setupConfigLoad({filePath, contents, config});

    const result = await configLoadBroker({filePath});

    expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // From mocked crypto
        timestamp: 1609459200000,                    // From mocked Date
        config,
        synced: true
    });
});

// ❌ WRONG - Don't mock application code in proxies
jest.mock('../../../brokers/config/parse');  // NO! Broker runs real

// ❌ WRONG - Don't mock directly in tests
it('test', () => {
    jest.mocked(fsReadFileAdapter).mockResolvedValue(...);  // NO! Use proxy
});
```

**The Pattern:**

- **Adapter proxies**: Mock npm packages (`jest.mock('axios')`)
- **Broker proxies**: Create adapter proxies + mock globals
- **Widget/Responder proxies**: Create broker proxies (inherit all mocks)
- **Tests**: Create proxy, use semantic methods, test real code

## Common Anti-Patterns (Avoid These!)

1. **Property Bleedthrough**: Using partial matchers that miss extra properties
2. **Testing Implementation**: Spying on internal methods instead of outputs
3. **Shared Test State**: Tests depending on each other
4. **Existence-Only Checks**: Using toBeDefined() instead of actual values
5. **Count-Only Checks**: Testing length without verifying content
6. **Direct Mock Manipulation in Tests**: Using `jest.mocked()` directly in tests instead of proxy semantic methods
7. **Mocking Application Code**: Using `jest.mock()` on adapters/brokers/transformers - only mock npm packages in
   proxies
8. **Unit Testing DSL Logic**: Mocking systems that interpret your DSL/query language (ESLint selectors, SQL queries,
   GraphQL schemas)
9. **Conditional Mocking**: Using if/else logic inside mock implementations
10. **String IDs**: Using 'user-123' instead of proper UUIDs
11. **Comment Organization**: Using comments instead of describe blocks for test structure
12. **Manual Mock Cleanup**: Calling `mockReset()`, `mockClear()`, `clearAllMocks()` - @questmaestro/testing handles
    this globally
13. **Type Escape Hatches**: Using `any`, `as`, `@ts-ignore` in tests
14. **Using `jest.spyOn()` for Module Imports**: Only use spyOn for global objects (crypto, Date, window)
15. **Unsafe Type Assertions in Mocks**: Using `as jest.MockedFunction<typeof fn>` instead of `jest.mocked()`
16. **Manual Mock Factories**: Using `jest.mock('module', () => ({ fn: jest.fn() }))` when auto-mocking works
17. **Importing Before Mocking**: Worrying about import order (jest.mock is hoisted automatically)
18. **Using Jest in Stubs**: Calling `jest.fn()` inside stub files - stubs accept mocks via props instead
19. **Missing Contract Stubs**: Not creating stubs for contracts used in tests - every contract needs a `.stub.ts`
20. **Mocking npm Types Directly**: Trying to mock library types instead of using contract stubs for translated types
21. **Shared Proxy Instances**: Creating proxy once outside tests - always create fresh proxy per test
22. **Bootstrap Pattern**: Using `proxy.bootstrap()` method - proxies use constructor setup now

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

### Stub Pattern

**Stubs are data factories that create valid instances of a type with sensible defaults.**

Stubs provide default values and accept overrides via props. When tests need to verify function calls, they pass
`jest.fn()` to the stub:

```typescript
// ✅ CORRECT - Stub provides defaults, accepts overrides
export const ThingStub = (props: Partial<Thing> = {}): Thing => ({
    someFunction: (): void => {
    }, // Default no-op
    ...props, // Test overrides here
});

// ✅ CORRECT - Test passes jest.fn() when needed
it('VALID: calls function', () => {
    const mockFn = jest.fn();
    const thing = ThingStub({someFunction: mockFn});

    doSomething(thing);

    expect(mockFn).toHaveBeenCalledTimes(1);
});
```

**Stubs never use `jest.fn()` internally** - they accept mocks via props.

### Contract Stubs

**All stubs live in contracts/:** `contracts/[name]/[name].stub.ts`

With the adapter pivot, adapters translate npm types → contract types. Tests use contract stubs, not npm types:

```typescript
// Contract stub - project-defined type
// contracts/user/user.stub.ts
export const UserStub = (props: Partial<User> = {}): User => ({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'John Doe',
    ...props,
});

// Contract stub - translated from npm package
// contracts/http-response/http-response.stub.ts
export const HttpResponseStub = (props: Partial<HttpResponse> = {}): HttpResponse => ({
    body: {},
    statusCode: httpResponseContract.shape.statusCode.parse(200),
    headers: {},
    ...props,
});

// Contract stub - complex type with functions
// contracts/eslint-rule-module/eslint-rule-module.stub.ts
export const EslintRuleModuleStub = (
    props: Partial<EslintRuleModule> = {}
): EslintRuleModule => ({
    meta: {
        type: 'problem',
        messages: eslintRuleMetaContract.shape.messages.parse({
            error: 'Default error'
        }),
        schema: [],
    },
    create: () => ({}),  // Default no-op function
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

**Use responder proxies** that delegate to broker/adapter proxies for all mock setup:

```typescript
// responders/user/create/user-create-responder.test.ts
import {UserCreateResponder} from './user-create-responder';
import {userCreateResponderProxy} from './user-create-responder.proxy';
import {UserDataStub} from '../../../contracts/user-data/user-data.stub';
import {UserStub} from '../../../contracts/user/user.stub';
import {UserIdStub} from '../../../contracts/user-id/user-id.stub';

describe("UserCreateResponder", () => {
    describe("POST /users", () => {
        it("VALID: {name: 'John', email: 'john@test.com'} => returns 201", async () => {
            // Create proxy (sets up all mocks including globals)
            const responderProxy = userCreateResponderProxy();

            const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');
            const userData = UserDataStub({
                name: 'John',
                email: 'john@test.com'
            });
            const user = UserStub({
                id: userId,
                name: 'John',
                email: 'john@test.com',
                createdAt: 1609459200000
            });

            // Semantic setup - proxy handles all mock configuration
            responderProxy.setupUserCreate({userData, user});

            const res = await request(app)
                .post('/users')
                .send({name: 'John', email: 'john@test.com'});

            expect(res.status).toBe(201);
            expect(res.body).toStrictEqual({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John',
                email: 'john@test.com',
                createdAt: 1609459200000
                // Must test ALL properties to prevent bleedthrough
            });
        });

        it("INVALID_EMAIL: {email: 'bad'} => returns 400", async () => {
            // No proxy needed for validation-only test (no broker called)
            const res = await request(app)
                .post('/users')
                .send({name: 'John', email: 'bad'});

            expect(res.status).toBe(400);
            expect(res.body).toStrictEqual({
                error: 'Invalid email',
                code: 'INVALID_EMAIL'
                // Test complete error object
            });
        });
    });
});

// responders/user/create/user-create-responder.proxy.ts
import {userCreateBrokerProxy} from '../../../brokers/user/create/user-create-broker.proxy';
import type {UserData} from '../../../contracts/user-data/user-data-contract';
import type {User} from '../../../contracts/user/user-contract';

export const userCreateResponderProxy = () => {
    // Delegates to broker proxy (which sets up adapter mocks + globals)
    const brokerProxy = userCreateBrokerProxy();

    return {
        setupUserCreate: ({userData, user}: { userData: UserData; user: User }): void => {
            brokerProxy.setupUserCreate({userData, user});
        }
    };
};
```

**Key principles:**

- Tests use **proxy semantic methods**, not direct mock manipulation
- Proxies encapsulate all mock setup (adapters, globals, state)
- Each test creates a **fresh proxy** (constructor sets up mocks automatically)
- @questmaestro/testing auto-clears mocks after each test

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