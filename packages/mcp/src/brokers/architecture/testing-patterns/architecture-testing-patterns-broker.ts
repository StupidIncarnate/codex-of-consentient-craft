/**
 * PURPOSE: Generate testing patterns and philosophy documentation for LLMs writing tests
 *
 * USAGE:
 * const markdown = architectureTestingPatternsBroker();
 * // Returns ContentText markdown with testing philosophy, proxy patterns, assertions, and test structure
 *
 * WHEN-TO-USE: When LLMs need to understand how to write tests and create proxy files
 */

import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const architectureTestingPatternsBroker = (): ContentText => {
  // Purpose
  const purpose = `**Why so strict?** Loose tests pass when code is broken. Exact tests catch real bugs.`;

  // Core Principles - Type Safety
  const typeSafety = `**CRITICAL:** Test files AND proxy files CANNOT import types from contracts.

Use \`ReturnType<typeof StubName>\` ONLY when you need the type in function signatures or annotations:

\`\`\`typescript
// ❌ WRONG - Importing type from contract
import type {User} from '../contracts/user/user-contract';

// ✅ CORRECT - Most of the time, just call the stub (TypeScript infers the type)
import {UserStub} from '../contracts/user/user.stub';
const user = UserStub({id: userId}); // TypeScript knows this is User type

// ✅ CORRECT - Only create type alias if needed in signatures
type User = ReturnType<typeof UserStub>;
const processUser = ({user}: {user: User}): void => { /* ... */ };

// ❌ WRONG - Stub already returns typed value, don't annotate
const user: ReturnType<typeof UserStub> = UserStub({id: userId});
\`\`\`

**Why:** Stubs are single source of truth for test data. They return typed values automatically.

**Exception for mocks:** Use \`registerMock\` handles with stubs for branded types, not type assertions:

\`\`\`typescript
// ✅ CORRECT - registerMock handle with branded type using stub
handle.mockResolvedValue(FileContentsStub({value: 'content'}));

// ❌ WRONG - Type error or escape hatch
handle.mockResolvedValue('content' as FileContents);
\`\`\`

**Exception for testing invalid inputs:** Use \`as never\`:

\`\`\`typescript
// ✅ CORRECT - Testing number fails string validation
expect(() => MyStub({ value: 123 as never })).toThrow(/Expected string/u);

// ❌ WRONG - Violates ban-primitives
MyStub({ value: 123 as string })
\`\`\`

**exactOptionalPropertyTypes:** Omit optional properties instead of passing undefined:

**CRITICAL:** This tsconfig setting causes runtime failures if you pass \`undefined\` explicitly. The LLM training instinct is to pass \`undefined\` for optional properties, but you MUST omit them instead.

\`\`\`typescript
// ✅ CORRECT - Omit optional parameter (don't pass it at all)
expect(myGuard({value: 'test'})).toBe(false);

// ❌ WRONG - Explicit undefined fails with exactOptionalPropertyTypes
expect(myGuard({value: 'test', optional: undefined})).toBe(false);

// LLM training says: optional?: string means you can pass undefined
// This codebase says: optional?: string means you must OMIT it, not pass undefined
\`\`\``;

  // Core Principles - DAMP > DRY
  const dampPattern = `Tests should be **Descriptive And Meaningful**, not DRY. Each test must be readable standalone without looking at helpers.`;

  // Core Principles - Test Behavior Not Implementation
  const testBehavior = `\`\`\`typescript
// ✅ CORRECT
it("VALID: {price: 100, tax: 0.1} => returns 110")

// ❌ WRONG - Testing internals
it("VALID: {price: 100} => calls _calculateTax()")
\`\`\``;

  // Core Principles - Unit vs Integration Tests
  const unitVsIntegration = `**Unit Test (mock dependencies):**
- Pure transformation logic you control
- Business rules, data transformations, validation

**Integration Test (real dependencies):**
- Logic expressed in external system's DSL/query language
- Pattern matching, querying, selecting against external structures
- The external system must interpret your logic to validate it works

\`\`\`typescript
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
  const code = \`export const foo = () => { return 'bar'; }\`;
  const results = ruleTester.run('explicit-return-types', rule, {
    invalid: [{code, errors: [{messageId: 'missingReturnType'}]}]
  });
  // ESLint parses real code, validates selectors match actual AST
});
\`\`\`

**Integration test when:** ESLint rules, SQL queries, GraphQL resolvers, Regex patterns, Template engines

**Unit test when:** Transformers, Contracts, Business logic`;

  // Test Structure
  const testStructure = `**Always use describe blocks** - never comments:

\`\`\`typescript
// ✅ CORRECT
describe("UserValidator", () => {
  describe("validateAge()", () => {
    describe("valid input", () => {
      it("VALID: {age: 18} => returns true")
    })
    describe("invalid input", () => {
      it("INVALID: {age: -1} => throws 'Age must be positive'")
    })
  })
})

// ❌ WRONG - Comments instead of describe
describe("UserValidator", () => {
  // validateAge tests
  it("VALID: {age: 18} => returns true")
})
\`\`\`

**Required prefixes (enforced by \`enforce-test-name-prefix\` lint rule):**
- \`VALID:\` - Expected success paths
- \`INVALID:\` - Validation failures (single or multiple fields)
- \`ERROR:\` - Runtime/system errors (not validation)
- \`EDGE:\` - Boundary conditions
- \`EMPTY:\` - Null/undefined/empty inputs

**Input/Output format:**
- \`{input}\` => action verb + result
- \`{price: 100, tax: 0.1}\` => returns 110
- \`{user: null}\` => throws 'User required'`;

  // Core Assertions
  const assertions = `**Use toStrictEqual for all objects/arrays** - catches property bleedthrough:

\`\`\`typescript
// ✅ CORRECT - Tests complete object
expect(result).toStrictEqual({
  id: '123',
  name: 'John'
  // Extra properties cause FAILURE
});

// ❌ WRONG - Multiple assertions miss extra properties
expect(result.id).toBe('123');
expect(result.name).toBe('John');
// {id, name, password: 'leaked!'} would PASS!

// ❌ WRONG - Weak matchers
expect(result).toMatchObject({id: '123'}); // Extra properties pass
expect(output).toContain('Error'); // Superset passes
expect(config.includes('parser')).toBe(true); // Could be anywhere
expect(typeof tsconfig.compilerOptions).toBe('object'); // Any object!
\`\`\`

**Don't be afraid of the full object:**
\`\`\`typescript
// ❌ WRONG - Weak checks that miss bugs
expect(config.includes('@typescript-eslint/parser')).toBe(true);
expect(typeof tsconfig.compilerOptions).toBe('object');

// ✅ CORRECT - Assert FULL expected value
expect(config).toStrictEqual(\`module.exports = [...full config...]\`);
expect(tsconfig).toStrictEqual({
  compilerOptions: {
    target: 'ES2020',
    module: 'commonjs',
    // ...ALL properties
  },
  include: ['**/*.ts'],
  exclude: ['node_modules']
});
\`\`\`

**Test values, not existence:**
\`\`\`typescript
// ✅ CORRECT
expect(userId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');

// ❌ WRONG
expect(userId).toBeDefined(); // Could be any value!
\`\`\`

**Test content, not just count:**
\`\`\`typescript
// ✅ CORRECT
expect(items).toStrictEqual(['apple', 'banana']);

// ❌ WRONG
expect(items).toHaveLength(2); // Could be wrong items!
\`\`\`

**Forbidden matchers - NEVER USE THESE (they allow bugs through):**

\`\`\`typescript
// ❌ FORBIDDEN MATCHERS
expect().toEqual()                  // → Use .toStrictEqual()
expect().toMatchObject()            // → Use .toStrictEqual()
expect().toContain()                // → Use .toStrictEqual() for arrays, .toBe() or .toMatch(/^exact$/u) for strings
expect().toBeTruthy()               // → Use .toBe(true)
expect().toBeFalsy()                // → Use .toBe(false)
expect().toMatch('text')            // → Use .toMatch(/^exact text$/u)
expect().toHaveProperty('key')      // → Test actual value with .toBe()
expect().toHaveLength(5)            // → Test complete array with .toStrictEqual()
expect().toBeDefined()              // → Test actual value
expect().toBeUndefined()            // → Use .toBe(undefined)
expect.objectContaining({...})      // → Test complete object
expect.arrayContaining([...])       // → Test complete array
expect.stringContaining('text')     // → Use .toBe('exact full string') or .toMatch(/^exact$/u)
expect.any(String)                  // → Test actual string value
expect.any(Number)                  // → Test actual number
expect.any(Object)                  // → Test complete object shape
// EXCEPTION: expect.any(Function) is OK - can't compare functions

// ❌ FORBIDDEN - Negated matchers (.not.*)
expect(x).not.toBe(y)              // → Assert the actual expected value: .toBe(correctValue)
expect(x).not.toHaveBeenCalled()   // → Use .toHaveBeenCalledTimes(0) paired with what WAS called
expect(x).not.toContain(y)         // → Use .toStrictEqual() on the complete collection

// ❌ FORBIDDEN - Tautological assertions
expect(true).toBe(true)            // → Assert on actual return value, not a literal
expect(false).toBe(false)          // → Assert on actual return: expect(result).toBe(false)

// ❌ FORBIDDEN - Object.keys() in expect
expect(Object.keys(obj)).toStrictEqual([...])  // → expect(obj).toStrictEqual({key: val, ...}) - assert keys AND values

// ❌ FORBIDDEN - String.includes() in expect
expect(str.includes('x')).toBe(true)           // → expect(str).toBe('exact full string')
expect(String(x).includes('y')).toBe(true)     // → expect(String(x)).toBe('exact full string')

// ❌ FORBIDDEN - Unpaired toHaveBeenCalledTimes
expect(fn).toHaveBeenCalledTimes(2)            // → Must be paired with toHaveBeenCalledWith() in same test

// ✅ CORRECT ALTERNATIVES
expect(result).toStrictEqual({id: '123', name: 'John'});
expect(flag).toBe(true);  // Not toBeTruthy()
expect(text).toMatch(/^Error: Invalid input$/u);  // Full message with anchors
expect(count).toBe(5);    // Exact value
expect(['a', 'b', 'c']).toStrictEqual(['a', 'b', 'c']);  // Complete array
expect(error).toStrictEqual({
  name: 'ConnectionError',
  message: 'Connection failed',
  code: 'ECONNREFUSED'
  // ALL error properties - no extras allowed
});
\`\`\``;

  // Proxy Architecture - Core Rule
  const proxyCore = `**Mock only at I/O boundaries. Everything else runs REAL.**

When testing any layer, only two types of things are mocked:
1. **Adapters** - Mock npm dependencies (axios, fs, etc.) at adapter boundary
2. **Global functions** - Mock non-deterministic globals (Date.now(), crypto.randomUUID(), etc.)

All business logic, transformers, guards, brokers, bindings, and React hooks run with real code to ensure contract integrity.`;

  // What Gets Mocked diagram
  const mockingDiagram = `\`\`\`
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
\`\`\``;

  // Quick Reference Table
  const quickReference = `| Category      | Needs Proxy? | Purpose                                                                                         |
|---------------|--------------|-------------------------------------------------------------------------------------------------|
| Contracts     | ❌ No         | Use stubs (.stub.ts files) - includes service objects with methods                            |
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
| Flows/Startup | ✅ Sometimes  | Integration tests with .integration.proxy.ts for complex setup (spawning processes, clients)  |`;

  // Proxy Patterns Overview
  const proxyPatterns = `**Detailed proxy patterns for each folder type** - Use \`get-folder-detail({ folderType: "..." })\` to see specific examples:

- **adapters/**: Mock npm dependencies (axios, fs, etc.) at I/O boundaries
- **brokers/**: Compose adapter proxies, mock globals if code uses them
- **bindings/**: Delegate to broker proxies
- **widgets/**: Delegate to bindings + provide UI triggers/selectors
- **responders/**: Delegate to broker proxies
- **middleware/**: Delegate to adapter proxies
- **state/**: Spy on methods, clear state in constructor
- **guards/** (optional): Provide semantic data builders for test scenarios

**Empty Proxy Pattern:**

\`\`\`typescript
// Pure functions, DSL adapters - no mocking needed
export const pureTransformerProxy = (): Record<PropertyKey, never> => ({});
\`\`\`

Use \`Record<PropertyKey, never>\` for type safety.`;

  // Create-Per-Test Pattern
  const createPerTest = `**CRITICAL:** Create a fresh proxy in each test. Proxies set up mocks in their constructor.

\`\`\`typescript
// ✅ CORRECT - Fresh proxy per test, created BEFORE calling implementation
it('VALID: {userId} => fetches user', async () => {
  const proxy = userFetchBrokerProxy(); // 1. Create proxy FIRST
  proxy.setupUserFetch({userId, user});  // 2. Setup mocks
  const result = await userFetchBroker({userId}); // 3. Call implementation
  expect(result).toStrictEqual(user);
});

// ❌ WRONG - Shared proxy
const proxy = userFetchBrokerProxy(); // Outside test
it('test 1', () => { /* ... */ });
it('test 2', () => { /* ... */ }); // Stale mocks!

// ❌ WRONG - Proxy created after calling implementation
it('VALID: {userId} => fetches user', async () => {
  const result = await userFetchBroker({userId}); // Called BEFORE proxy exists!
  const proxy = userFetchBrokerProxy(); // Too late - mocks not set up
  proxy.setupUserFetch({userId, user});
  expect(result).toStrictEqual(user);
});
\`\`\`

**Why:** Each test needs isolated mocks. Shared proxies create test interdependencies.

**CRITICAL ORDERING:** Proxy MUST be instantiated BEFORE calling the implementation under test. Proxies set up mocks in their constructor - if you call the implementation first, it runs without mocked dependencies.

**Assignment vs Just Calling:**

\`\`\`typescript
// ✅ CORRECT - Assign when you need to call setup methods
it('VALID: {userId} => fetches user', async () => {
  const proxy = userFetchBrokerProxy(); // Assign to variable
  proxy.setupUserFetch({userId, user}); // Call setup method
  const result = await userFetchBroker({userId});
  expect(result).toStrictEqual(user);
});

// ✅ CORRECT - Just call when proxy returns {} and no setup needed
it('VALID: {value} => transforms correctly', () => {
  formatDateTransformerProxy(); // Just instantiate, don't assign
  const result = formatDateTransformer({date: new Date()});
  expect(result).toBe('2024-01-15');
});

// ❌ WRONG - Assigning but never using
it('test', () => {
  const proxy = emptyProxy(); // Lint error: unused variable
  const result = doSomething();
  expect(result).toBe(expected);
});
\`\`\`

**When to assign:** You call setup methods on the proxy (most common case)

**When to just call:** Proxy returns \`{}\` with no setup methods (rare - usually pure functions/transformers)

**Constructor setup:** Proxies set up all mocks in their constructor (function body). No beforeEach hooks, no bootstrap() methods.

\`\`\`typescript
// ✅ CORRECT - Setup in constructor with registerMock
export const httpAdapterProxy = () => {
  const handle = registerMock({ fn: axios }); // Setup here
  handle.mockResolvedValue({data: {}}); // Default behavior
  return { /* semantic methods */ };
};

// ❌ WRONG - Manual setup outside proxy
beforeEach(() => {
  jest.clearAllMocks(); // Don't do this - @dungeonmaster/testing handles it
});
\`\`\`

**No direct mock manipulation:** Tests use semantic proxy methods, never \`registerMock\` or \`jest.mocked()\` directly in test files.

\`\`\`typescript
// ✅ CORRECT - Semantic proxy method (registerMock is inside the proxy)
const proxy = axiosGetAdapterProxy();
proxy.returns({url: UrlStub('/users/123'), data: user});

// ❌ WRONG - Direct mock manipulation in test
const mockAxios = jest.mocked(axios.get);
mockAxios.mockResolvedValue({data: user});

// ❌ WRONG - registerMock in test file (belongs in proxy)
const handle = registerMock({ fn: readFile });
handle.mockResolvedValue(Buffer.from(''));
\`\`\``;

  // Child Proxy Creation
  const childProxies = `**When to assign child proxy to variable:**
- You call methods on it (delegation pattern)
- You use it in return object

**When to just call without assignment:**
- Empty proxies returning \`{}\`
- Only needed for \`enforce-proxy-child-creation\` rule
- Never interact with child proxy

\`\`\`typescript
// ✅ CORRECT - Assign when used
export const userProfileBrokerProxy = () => {
  const httpProxy = httpAdapterProxy(); // Used below
  return {
    setupUserFetch: ({userId, user}) => {
      httpProxy.returns({url: \`/users/\${userId}\`, data: user});
    }
  };
};

// ✅ CORRECT - Just call when empty
export const pureTransformerProxy = () => {
  pureGuardProxy(); // Returns {}, never used
  return {};
};

// ❌ WRONG - Assigning but not using
export const badProxy = () => {
  const unused = emptyProxy(); // Lint error: unused variable
  return {};
};
\`\`\``;

  // Global Function Mocking
  const globalMocking = `ANY proxy can mock globals if the code being tested uses them. Not just brokers!

Use \`registerMock\` for globals the same way you use it for module mocks:

\`\`\`typescript
import { randomUUID } from 'crypto';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// Example: Broker proxy mocking globals via registerMock
export const userCreateBrokerProxy = () => {
  const httpProxy = httpAdapterProxy();

  // registerMock works for globals too — stack-based dispatch prevents collisions
  const uuidHandle = registerMock({ fn: randomUUID });
  uuidHandle.mockReturnValue('f47ac10b-...');

  return {
    setupUserCreate: ({userData, user}) => {
      httpProxy.returns({url: '/users', data: user});
    }
  };
};
\`\`\`

**Common globals:** Date.now(), crypto.randomUUID(), Math.random(), console.*

**Critical:** Let the function generate values using mocked globals, don't manually construct them.`;

  // Proxy Encapsulation Rule
  const proxyEncapsulation = `**CRITICAL:** Proxies must expose semantic methods, NOT child proxies. Tests should never chain through multiple proxy levels.

\`\`\`typescript
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

  return {
    setupQuestFile: ({questJson}: {questJson: string}): void => {
      pathseekerProxy.setupQuestFile({questJson});
      codeweaverProxy.setupQuestFile({questJson});
    },
  };
};

// Test uses semantic method - no knowledge of internal structure:
proxy.setupQuestFile({questJson});  // ✅ Clean, semantic
\`\`\`

**Why:**
1. **Encapsulation**: Each test only knows its direct proxy
2. **Maintainability**: Internal restructuring doesn't break tests
3. **Readability**: Tests describe WHAT scenario, not HOW to navigate proxy internals`;

  // Statics Proxy Pattern
  const staticsProxy = `**Statics proxies** override immutable values for edge case testing. Use \`Reflect.set()\` to mutate readonly constants at runtime, or \`registerSpyOn\` for getters.

\`\`\`typescript
// Use Reflect.set for direct properties
export const userStaticsProxy = () => ({
  setupUnlimitedAttempts: (): void => {
    Reflect.set(userStatics.limits, 'maxLoginAttempts', Infinity);
  }
});

// Use registerSpyOn for getters
import {registerSpyOn} from '@dungeonmaster/testing/register-mock';

export const apiStaticsProxy = () => {
  const handle = registerSpyOn({object: apiStatics, method: 'timeout'});
  handle.mockReturnValue(0);
  return {};
};
\`\`\``;

  // No Magic Numbers
  const noMagicNumbers = `**Extract magic numbers to statics files.** Tests and implementation should reference statics, not inline constants.

\`\`\`typescript
// ❌ WRONG - Magic number in contract
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
\`\`\``;

  // EndpointMock (StartEndpointMock)
  const endpointMock = `### When to Use \`StartEndpointMock\`

Use \`StartEndpointMock\` for **any test that needs to mock HTTP responses** — broker tests, widget integration tests, or any layer that ultimately calls a fetch adapter.

**Always use via the broker proxy layer** — never call \`StartEndpointMock\` directly in test files.

### When NOT to Use \`StartEndpointMock\`

- **Server-side tests** — The server package tests mock Hono's \`serve()\`, not fetch.
- **Non-HTTP I/O** — Filesystem, child process, etc. use adapter proxies (\`registerMock\`).

### JSON vs Non-JSON Responses

- \`resolves({ data })\` — 200 OK with JSON body
- \`responds({ status, body })\` — JSON response with explicit status code (4xx, 5xx, 201, 204)
- \`respondRaw({ status, body, headers })\` — Non-JSON payloads (binary, text, HTML)
- \`networkError()\` — Simulates connection refused / DNS failure

\`\`\`typescript
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
\`\`\`

### The Full Proxy Chain

\`\`\`
Test → Widget Proxy → Binding Proxy → Broker Proxy → StartEndpointMock.listen() → MSW
\`\`\`

Each layer delegates setup to the layer below. The broker proxy is the only layer that knows about \`StartEndpointMock\`.

### MSW Lifecycle

\`StartEndpointMockSetup\` manages the MSW server lifecycle automatically via \`jest.config.js\`:

- \`beforeAll\` — Starts the MSW server
- \`afterEach\` — Resets all handlers between tests
- \`afterAll\` — Closes the server

To enable EndpointMock in a package, add the setup file to \`jest.config.js\`:

\`\`\`javascript
module.exports = {
  ...baseConfig,
  setupFilesAfterEnv: [
    '<rootDir>/../../packages/testing/src/jest.setup.js',
    '<rootDir>/../../packages/testing/src/startup/start-endpoint-mock-setup.ts',
  ],
};
\`\`\``;

  // E2E Testing (Playwright)
  const e2eTesting = `E2E tests run the full stack (real server, real browser, real WebSocket). Only external dependencies (LLMs, third-party APIs) are mocked.

### Assert the Full Transition

Every user action that changes the UI must assert **three things**:

1. **Request correctness** — the right HTTP method, URL, and body were sent
2. **Old UI disappeared** — previous state elements are gone
3. **New UI appeared** — expected elements are visible

\`\`\`typescript
// ✅ CORRECT — checks request, disappearance, AND appearance
await page.getByText('Submit').click();

const req = await patchPromise;
expect(req.postDataJSON()).toHaveProperty('status', 'active');

await expect(page.getByText('Are you sure?')).not.toBeVisible({timeout: 5000});
await expect(page.getByTestId('dashboard-panel')).toBeVisible({timeout: 10_000});
\`\`\`

**Note:** \`.not.toBeVisible()\` is a Playwright-specific matcher and is allowed in e2e tests. The \`.not.*\` ban applies to Jest matchers only.

### Never Sleep, Always Wait for Elements

\`\`\`typescript
// ❌ WRONG — arbitrary sleep
await page.waitForTimeout(3000);

// ✅ CORRECT — wait for the specific element
await expect(page.getByTestId('panel')).toBeVisible({timeout: 10_000});
\`\`\`

### Drive State via the Real API

\`\`\`typescript
// ❌ WRONG — intercepting server responses
await page.route('/api/items/*', (route) => route.fulfill({body: '{}'}));

// ✅ CORRECT — use the real server
await request.patch(\`/api/items/\${itemId}\`, {data: {status: 'approved'}});
\`\`\`

### Observe Requests, Don't Intercept

\`\`\`typescript
// ✅ Watching (allowed) — page.waitForRequest just observes
const patchPromise = page.waitForRequest(
  (req) => req.method() === 'PATCH' && req.url().includes(\`/api/items/\${itemId}\`),
);
await page.getByText('Save').click();
const patchReq = await patchPromise;
expect(patchReq.postDataJSON()).toHaveProperty('status', 'active');

// ❌ Intercepting (forbidden)
await page.route('/api/items/*', (route) => route.fulfill({status: 200, body: '{}'}));
\`\`\`

### Each Test Owns Its State

Tests must not depend on ordering or state from previous tests. Create all fixtures fresh in each test.

### Timeout Increases Are a Last Resort

When an E2E test fails with a timeout, diagnose state before touching timeouts:

1. Log at each stage — confirm each stage produced expected state
2. Inspect actual system state when the failure occurs
3. Check that preconditions actually hold
4. If it passes in isolation but fails under load — shared mutable state, not timing
5. Only after confirming state is correct at every stage, increase timeout with a comment explaining why`;

  // Test Infrastructure (Harness Pattern)
  const harnessPattern = `### The \`test/\` Directory

Just as \`src/\` is for application code, \`test/\` is for test infrastructure. Every package with integration/e2e tests MUST have a \`test/\` directory.

### The \`.harness.ts\` Pattern

Harness files are the e2e/integration equivalent of \`.proxy.ts\` files:

\`\`\`typescript
// test/harnesses/quest/quest.harness.ts
export const questHarness = () => {
  return {
    create: async ({request, guildId}) => {
      const response = await request.post('/api/quests', {
        data: {guildId, title: 'Test Quest', userRequest: 'Build feature'},
      });
      return response.json();
    },
    approve: async ({request, questId}) => {
      await request.patch(\`/api/quests/\${questId}\`, {data: {status: 'approved'}});
    },
    clean: async ({request}) => { /* ... */ },
  };
};
\`\`\`

**Key properties:** Factory function, created at describe scope, semantic methods, owns its own lifecycle.

### Directory Structure

\`\`\`
my-project/
├── src/
├── test/
│   └── harnesses/
│       ├── claude-mock/
│       │   ├── claude-mock.harness.ts
│       │   └── bin-claude.js             # fake binary (non-TS artifact)
│       ├── quest/
│       │   └── quest.harness.ts
│       └── environment/
│           └── environment.harness.ts
└── e2e/
    └── *.spec.ts
\`\`\`

### Import Boundaries

- \`*.harness.ts\` → node:fs/path/os, contracts/stubs, other harnesses, test framework APIs
- \`*.spec.ts\` / \`*.integration.test.ts\` → harnesses and contracts/stubs only
- **Scenario files CANNOT import:** node:fs, node:path, node:os, node:child_process, .proxy.ts files
- **Harness files CANNOT import:** .proxy.ts files, contract value imports (use .stub.ts)
- **Unit test files CANNOT import:** .harness.ts files

### Mock Boundary Rules

Only mock external services that are: not under your control, have no test mode, and are non-deterministic or costly.

**Valid mocks:** LLM CLI → fake binary, payment processor without sandbox → stub HTTP server
**Invalid mocks:** Your own HTTP endpoints, your own WebSocket messages, your own brokers/adapters

### Harness Lifecycle

Tests never write \`beforeEach\`/\`afterEach\`. Harnesses own their lifecycle by declaring optional \`beforeEach\` and \`afterEach\` properties. A ts-jest AST transformer auto-wires these hooks.

\`\`\`typescript
export const guildHarness = () => {
  const createdGuildIds: string[] = [];

  return {
    beforeEach: (): void => { createdGuildIds.length = 0; },
    afterEach: async (): Promise<void> => {
      for (const id of createdGuildIds) {
        await GuildRemoveResponder({guildId: id});
      }
      createdGuildIds.length = 0;
    },
    create: async ({name, path}) => {
      const guild = await GuildAddResponder({name, path});
      createdGuildIds.push(guild.id);
      return guild;
    },
  };
};
\`\`\`

**For Playwright:** Spec files use \`wireHarnessLifecycle()\` from test fixtures. Spec files MUST import \`{ test, expect }\` from \`@dungeonmaster/testing/e2e\`, NOT from \`@playwright/test\`.

### Scenario File Rules

Scenario files are **scenario descriptions only** — test blocks and assertions, no infrastructure.

**Banned:** \`import {writeFileSync} from 'fs'\`, \`import * as path from 'path'\`, top-level helper functions, \`page.waitForTimeout(N)\`, \`page.route(...)\`

**Allowed:** imports from \`test/harnesses/\`, test framework APIs, \`expect()\`, \`await page.*\`, constants, inline test data`;

  // Stub Factories
  const stubFactories = `**Complete stub patterns in contracts/ folder detail** - Use \`get-folder-detail({ folderType: "contracts" })\`.

**Critical stub rules:**
- Object Stubs: Use \`StubArgument<Type>\` with spread operator + \`contract.parse()\`
- Branded Strings: Use single \`value\` property + \`contract.parse(value)\`
- Mixed Data + Functions: Destructure functions from data, preserve function references for \`jest.fn()\`
- Extract properties: ALWAYS use destructuring (\`const { x } = Stub()\`, never \`.property\`)
- Optional fields: Omit defaults (don't set \`undefined\`)

**Tests get types from stubs, NOT contracts:**

\`\`\`typescript
// ❌ WRONG - Importing from contract
import type {User} from '../contracts/user/user-contract';

// ✅ CORRECT - Get type from stub
import {UserStub} from '../contracts/user/user.stub';
type User = ReturnType<typeof UserStub>;
\`\`\``;

  // Mocking Mechanics - registerMock
  const mockingMechanics = `**Use \`registerMock\` for all mocking in proxy files.** It replaces \`jest.mock()\`/\`jest.mocked()\`/\`jest.spyOn()\`.

\`\`\`typescript
import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
\`\`\`

**Why registerMock over jest.mock/jest.spyOn?** Stack-based dispatch lets multiple proxies mock the same \`jest.fn()\` without collision. When a broker proxy composes two adapter proxies that both mock the same npm function, \`registerMock\` routes each call to the correct proxy based on the call stack. With raw \`jest.mock()\`, the second proxy would overwrite the first.

**How it works:**
1. Call \`registerMock({ fn })\` with the imported function
2. It auto-derives the caller's file path from the stack trace
3. Returns a \`MockHandle\` scoped to that caller — other proxies get their own independent handle
4. When the mocked function is called at runtime, the dispatcher inspects the call stack and routes to the matching handle

**MockHandle API:**

| Method | Purpose |
|--------|---------|
| \`handle.mockImplementation(fn)\` | Set base implementation |
| \`handle.mockImplementationOnce(fn)\` | Queue one-shot implementation (FIFO) |
| \`handle.mockReturnValue(val)\` | Set base return value |
| \`handle.mockReturnValueOnce(val)\` | Queue one-shot return value |
| \`handle.mockResolvedValue(val)\` | Set base resolved promise |
| \`handle.mockResolvedValueOnce(val)\` | Queue one-shot resolved promise |
| \`handle.mockRejectedValueOnce(val)\` | Queue one-shot rejected promise |
| \`handle.mock.calls\` | Array of call argument arrays (per-proxy) |
| \`handle.mockClear()\` | Clear calls, queue, and base impl |

**Adapter proxy example (I/O boundary):**

\`\`\`typescript
import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getWrittenContent: () => unknown;
} => {
  const handle = registerMock({ fn: writeFile });
  handle.mockResolvedValue(undefined); // Default: writes succeed

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getWrittenContent: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },
  };
};
\`\`\`

**Global function proxy example:**

\`\`\`typescript
import { randomUUID } from 'crypto';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const cryptoRandomUuidAdapterProxy = (): {
  setupReturns: (params: { uuid: Uuid }) => void;
} => {
  const handle = registerMock({ fn: randomUUID });
  handle.mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    setupReturns: ({ uuid }: { uuid: Uuid }): void => {
      handle.mockReturnValue(uuid);
    },
  };
};
\`\`\`

\`\`\`typescript
// ❌ WRONG - jest.mocked in proxy
const mockReadFile = jest.mocked(readFile);
mockReadFile.mockImplementation(async () => Buffer.from(''));

// ❌ WRONG - jest.spyOn in proxy
jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-...');

// ❌ WRONG - jest.mock in proxy
jest.mock('fs/promises');

// ✅ CORRECT - registerMock replaces all of the above
const handle = registerMock({ fn: readFile });
const uuidHandle = registerMock({ fn: randomUUID });
\`\`\`

### registerSpyOn — Spy on Global Object Methods

Use \`registerSpyOn\` to spy on methods of global objects (process, Date, crypto, Math, etc.). Returns a \`SpyOnHandle\` with the same API as \`MockHandle\`.

\`\`\`typescript
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// Spy on process.stdout.write
const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });

// Spy with passthrough — records calls but delegates to real implementation
const timerSpy = registerSpyOn({ object: globalThis, method: 'setTimeout', passthrough: true });
\`\`\`

**\`passthrough: true\`** — Spy records calls but delegates to the real implementation by default. Use for globals that must keep working (setTimeout, WebSocket). You can still override with \`.mockImplementation()\`.

**SpyOnHandle API:** Same as MockHandle — \`.mockImplementation()\`, \`.mockReturnValue()\`, \`.mockReturnValueOnce()\`, \`.mockResolvedValue()\`, \`.mockRejectedValueOnce()\`, \`.mock.calls\`, \`.mockClear()\`.

**Common targets:** \`process.stdout.write\`, \`Date.now\`, \`crypto.randomUUID\`, \`Math.random\`

### registerModuleMock — Replace Module Before Load

Use \`registerModuleMock\` to replace an entire module before it loads. Runtime no-op — the AST transformer hoists it as \`jest.mock()\`.

\`\`\`typescript
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

registerModuleMock({
  module: 'eslint-plugin-jest',
  factory: () => ({ rules: {} }),
});
\`\`\`

**When to use:** A module must be replaced before import to prevent crashes or side effects.

### requireActual — Access Real Module Under Mock

Use \`requireActual\` to access real module exports when a module is mocked. Wraps \`jest.requireActual\`.

\`\`\`typescript
import { requireActual } from '@dungeonmaster/testing/register-mock';

const realPath = requireActual({ module: 'path' });
handle.mockImplementation((...args) => realPath.join(...args));
\`\`\`

**When to use:** A parent proxy needs the real implementation of something mocked by a child proxy.

### registerIsolateModules — Test Entry Points with Side Effects

Use \`registerIsolateModules\` to test entry points that have top-level side effects. Wraps \`jest.isolateModules\` + \`jest.doMock\`.

\`\`\`typescript
import { registerIsolateModules } from '@dungeonmaster/testing/register-mock';

registerIsolateModules({
  mocks: [{ module: './start-server', factory: () => ({ startServer: mockStart }) }],
  entrypoint: require.resolve('./index'),
});
\`\`\`

**When to use:** Testing a module that calls functions at import time (like \`index.ts\` that starts a server).`;

  // Integration Testing
  const integrationTesting = `**CRITICAL:** Integration tests are **ONLY for startup files**. They validate that startup files correctly wire up the entire application. Use \`.integration.test.ts\` extension.

**All other code** (brokers, flows, guards, transformers, widgets, etc.) uses **unit tests** (\`.test.ts\`) with colocated proxies.

\`\`\`
// ✅ CORRECT - Co-located with startup file
src/startup/
  start-my-app.ts
  start-my-app.integration.test.ts   // <-- Co-located
  start-my-app.proxy.ts              // <-- If needed for complex setup

// ❌ WRONG - Separate test directory
test/start-my-app.integration.test.ts
\`\`\`

**When complex setup is needed** (spawning processes, creating clients), startup integration tests can use a colocated proxy.

**Debugging integration test timeouts:**

Integration tests that spawn processes or poll for state can time out silently — Jest reports \`Error: thrown: ""\` and \`has no assertions\`, pointing at the test file instead of the actual failure. When an integration test times out:

1. **Do NOT rerun the test repeatedly.** Integration tests take 10-30+ seconds per run. Retrying burns time without new information.
2. **Trace the code path** from the test's entry point to where it blocks. The test is usually polling for a state that will never arrive.
3. **Check for swallowed errors:** Look for \`try/catch\` blocks in the code under test that mark items as \`failed\` without surfacing the error message. Zod parse failures inside catch handlers are a common culprit.
4. **Grep dist/ for stale references:** If a contract schema changed, \`grep -r 'oldFieldName' packages/*/dist/\` reveals consumers that weren't rebuilt.
5. **Check poll helpers:** If the test uses \`pollForStatus\` or similar, the poll may be waiting for a status that the system will never reach (e.g., polling for \`complete\` when the quest went to \`blocked\`).`;

  // No Hooks or Conditionals
  const noHooksConditionals = `**CRITICAL:** \`beforeEach\`, \`afterEach\`, \`beforeAll\`, \`afterAll\` are forbidden. All setup and teardown must be inline in each test.

\`\`\`typescript
// ❌ WRONG - Hooks forbidden
beforeEach(() => {
  fs.mkdirSync(tempDir, {recursive: true});
});

// ✅ CORRECT - Inline setup/teardown
it('VALID: test case => expected result', () => {
  fs.mkdirSync(tempDir, {recursive: true}); // Inline setup
  // test logic
  fs.rmSync(tempDir, {recursive: true, force: true}); // Inline cleanup
  expect(result).toBe(expected);
});
\`\`\`

**No conditionals in tests:**
\`\`\`typescript
// ❌ WRONG - Conditional logic
if (result.hasError) {
  expect(result.error).toBe('Expected error');
}

// ✅ CORRECT - Separate tests for different paths
it('VALID: {input: success state} => returns value', () => {
  expect(result).toStrictEqual({value: 'Expected value'});
});
it('ERROR: {input: error state} => returns error', () => {
  expect(result).toStrictEqual({error: 'Expected error'});
});
\`\`\`

**Why:** Hooks create implicit dependencies. Conditionals hide what's being tested. Each test should be completely self-contained.`;

  // 100% Branch Coverage
  const branchCoverage = `**You must manually verify test cases against implementation code.** Jest's \`--coverage\` can miss logical branches.

**Method:** Read implementation line by line and create a test for every conditional path:

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

\`\`\`typescript
// Manual analysis: Needs 3 tests
const processUser = (user: User | null): string => {
  if (!user) return 'No user';        // Branch 1
  if (user.isAdmin) return 'Admin';   // Branch 2
  return user.name;                   // Branch 3
}

// Tests needed:
it('EMPTY: {user: null} => returns "No user"')
it('VALID: {user: adminUser} => returns "Admin"')
it('VALID: {user: regularUser} => returns user name')
\`\`\``;

  // Common Anti-Patterns
  const antiPatterns = `**Common testing anti-patterns are documented in syntax rules** - Use \`get-syntax-rules()\` for complete list with examples.

**Categories:**
- **Assertion Anti-Patterns**: Property bleedthrough, existence-only checks, count-only checks, weak matchers
- **Mock/Proxy Anti-Patterns**: Direct mock manipulation, mocking app code, manual cleanup, jest.spyOn misuse, shared proxies
- **Type Safety Anti-Patterns**: Using any, as, @ts-ignore to bypass errors
- **Test Organization Anti-Patterns**: Testing implementation, shared state, unit testing DSL logic, comment organization

See \`get-syntax-rules()\` testing.antiPatterns section for detailed violations and correct approaches.`;

  // Combine all sections in proper order
  const markdown = `# Testing Patterns & Philosophy

## Purpose

${purpose}

## Core Principles

### Type Safety

${typeSafety}

### DAMP > DRY

${dampPattern}

### Test Behavior, Not Implementation

${testBehavior}

### Unit Tests vs Integration Tests

${unitVsIntegration}

### 100% Branch Coverage

${branchCoverage}

## Test Structure

${testStructure}

## Core Assertions

${assertions}

## Proxy Architecture

### Core Rule

${proxyCore}

### What Gets Mocked vs What Runs Real

${mockingDiagram}

### Quick Reference: What Needs Proxies?

${quickReference}

### Detailed Proxy Patterns

${proxyPatterns}

### Proxy Encapsulation Rule

${proxyEncapsulation}

### Statics Proxy Pattern

${staticsProxy}

### Create-Per-Test Pattern

${createPerTest}

### Child Proxy Creation

${childProxies}

### Global Function Mocking

${globalMocking}

## No Magic Numbers

${noMagicNumbers}

## Stub Factories

${stubFactories}

## Mocking Mechanics

${mockingMechanics}

## EndpointMock (HTTP Mocking for Frontend Tests)

${endpointMock}

## Integration Testing

${integrationTesting}

## No Hooks or Conditionals

${noHooksConditionals}

## E2E Testing (Playwright)

${e2eTesting}

## Test Infrastructure (Harness Pattern)

${harnessPattern}

## Common Anti-Patterns

${antiPatterns}

## Summary Checklist

Before writing any test, verify:

- [ ] Created fresh proxy in test (not shared)
- [ ] Used ReturnType<typeof Stub> for types (not contract imports)
- [ ] Proxies use registerMock/registerSpyOn (not jest.mocked/jest.spyOn) and set up in constructor
- [ ] Tests use semantic proxy methods (never registerMock/jest.mocked directly in tests)
- [ ] Used toStrictEqual for objects/arrays (no weak matchers)
- [ ] No beforeEach/afterEach hooks
- [ ] No conditionals in tests
- [ ] All branches manually verified against implementation
- [ ] Each test is self-contained and isolated
- [ ] DSL/query logic uses integration tests (real execution)
`;

  return contentTextContract.parse(markdown);
};
