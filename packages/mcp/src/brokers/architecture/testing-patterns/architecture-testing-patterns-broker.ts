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
import type {User} from '../contracts/user/user-contract';  // ❌ type from a contract
import {UserStub} from '../contracts/user/user.stub';

const user = UserStub({id: userId});                         // ✅ the stub infers the type
const other: ReturnType<typeof UserStub> = UserStub({id});   // ❌ redundant annotation

type User = ReturnType<typeof UserStub>;                     // ✅ only for a signature
const processUser = ({user}: {user: User}): void => { /* ... */ };
\`\`\`

**Why:** Stubs are the single source of truth for test data, and they return typed values already.

**Never silence a type error with \`any\`, \`as\`, or \`@ts-ignore\`.** Two escape hatches are allowed:

- **Branded types in mocks** — pass a stub, not an assertion. \`handle.calledWith([]).resolves(FileContentsStub({value: 'content'}))\`, never \`.resolves('content' as FileContents)\`.
- **Deliberately invalid input** — \`as never\`, never \`as string\` (that violates \`ban-primitives\`). \`expect(() => MyStub({value: 123 as never})).toThrow(/Expected string/u)\`.

**exactOptionalPropertyTypes: OMIT an optional property, never pass \`undefined\`.** Your training says \`optional?: string\` accepts \`undefined\`; this tsconfig setting fails at runtime when you pass it. Write \`myGuard({value: 'test'})\`, not \`myGuard({value: 'test', optional: undefined})\`.`;

  // Core Principles - DAMP > DRY
  const dampPattern = `Tests should be **Descriptive And Meaningful**, not DRY. Each test must be readable standalone without looking at helpers.`;

  // Core Principles - Parameterize State Matrices
  const parameterizeStateMatrices = `**DAMP > DRY still holds.** But when a test is repeated 3 or more times with the only variation being an input value (cycling through every status in a union, every enum member, every invalid input variant), parameterize with \`it.each\`, \`test.each\`, or \`describe.each\`. The body, setup, and assertion shape must be identical across cases — only literal values change.

\`\`\`typescript
// ❌ WRONG - 15 near-identical tests differing only by the status literal
it('EMPTY: {status: pending} => neither PAUSE nor RESUME button visible', () => { /* ... */ });
it('EMPTY: {status: created} => neither PAUSE nor RESUME button visible', () => { /* ... */ });

// ✅ CORRECT - one parameterized test, list derived from the canonical static
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];
const NOT_PAUSE_RESUME_STATUSES = STATUSES.filter((s) => {
  const meta = questStatusMetadataStatics.statuses[s];
  return !meta.isPauseable && !meta.isResumable;
});

it.each(NOT_PAUSE_RESUME_STATUSES)(
  'EMPTY: {status: %s} => neither PAUSE nor RESUME button visible',
  (status) => {
    const proxy = ExecutionPanelWidgetProxy();
    mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={QuestStub({ status })} /> });
    expect(proxy.hasPauseButton()).toBe(false);
    expect(proxy.hasResumeButton()).toBe(false);
  },
);
\`\`\`

**Literals in \`expect(...)\` vs \`it.each(...)\`:**
- \`expect(x).toBe('pending')\` — a hardcoded literal in an assertion is fine. It is the specific output for that case's specific input, and it should not change as the union grows.
- \`it.each([...])\` — **NEVER hardcode the list of cases.** Derive a finite input set (every status in a union, every enum member, every role) from its \`*-statics.ts\`, Zod \`.options\`, or exported readonly array, then \`.filter()\`/\`.map()\` the subset. A hardcoded array goes stale the moment someone adds a union member: the new member is silently skipped and "covers every status" becomes a lie.

**When to parameterize:** 3 or more cases whose body, setup and assertion shape are identical and only the literal input differs — union variants, enum members, status matrices, error codes, boundary values. The test proves one rule holds for every member of a set.

**When NOT to parameterize (DAMP wins):** setup differs between cases, assertion shape differs beyond a simple mapping, each case carries a distinct meaning deserving its own sentence-length name, or there are only 2 cases.

**Grouping related variants:** \`describe.each\` when several \`it\` blocks share one parameterization (e.g. "for each pause-capable status, [PAUSE is visible] and [click PAUSE fires onPause]"). The same derive-from-a-static rule applies.

\`\`\`typescript
const PAUSEABLE_STATUSES = STATUSES.filter(
  (s) => questStatusMetadataStatics.statuses[s].isPauseable,
);

describe.each(PAUSEABLE_STATUSES)('pause-capable status: %s', (status) => {
  it('VALID: {status} => PAUSE button visible', () => { /* ... */ });
  it('VALID: {click PAUSE} => calls onPause once', () => { /* ... */ });
});
\`\`\`

**Subset-membership expected values:** When \`it.each\` iterates the full list and each case's expected value is "is this member in a subset?" (e.g., "is this status pauseable?"), derive the subset by filtering the same statics source. One statics source drives BOTH the iteration list AND the expected-subset set — don't hand-maintain a second hardcoded copy.

\`\`\`typescript
const PAUSEABLE_STATUSES = new Set(
  STATUSES.filter((s) => questStatusMetadataStatics.statuses[s].isPauseable),
);

it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
  expect(isQuestPauseableQuestStatusGuard({ status })).toBe(PAUSEABLE_STATUSES.has(status));
});
\`\`\`

**Name template rules:** use \`%s\` for the positional case value; keep the \`VALID:\`/\`INVALID:\`/\`EMPTY:\` prefix, which \`enforce-test-name-prefix\` validates on the SUBSTITUTED name; keep the \`{input} => result\` shape so substituted titles still read naturally.`;

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
- **Unit test:** transformers, contracts, business logic

**Integration Test (real dependencies):**
- Logic expressed in an external system's DSL/query language
- Pattern matching, querying, selecting against external structures
- The external system must interpret your logic for the test to prove anything
- **Integration test:** ESLint rules, SQL queries, GraphQL resolvers, regex patterns, template engines

\`\`\`typescript
// ❌ WRONG - unit test for DSL logic: the CSS selector is never validated against a real AST
rule.create({report: jest.fn()})['some-selector']({type: 'ArrowFunctionExpression'});

// ✅ CORRECT - ESLint parses real code, so the selector is proven to match a real AST
ruleTester.run('explicit-return-types', rule, {
  invalid: [{
    code: \`export const foo = () => { return 'bar'; }\`,
    errors: [{messageId: 'missingReturnType'}],
  }],
});
\`\`\``;

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

// ❌ WRONG - a comment where a describe belongs
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

**Input/Output format:** \`{input}\` => action verb + result. \`{price: 100, tax: 0.1}\` => returns 110. \`{user: null}\` => throws 'User required'.`;

  // Core Assertions
  const assertions = `**Use toStrictEqual for all objects/arrays** - catches property bleedthrough:

\`\`\`typescript
// ✅ CORRECT - one assertion over the complete object; an extra property FAILS
expect(result).toStrictEqual({id: '123', name: 'John'});

// ❌ WRONG - per-property assertions miss extras: {id, name, password: 'leaked!'} PASSES
expect(result.id).toBe('123');
expect(result.name).toBe('John');

// ❌ WRONG - weak matchers
expect(result).toMatchObject({id: '123'}); // Extra properties pass
expect(output).toContain('Error'); // Superset passes
\`\`\`

Assert VALUES, not existence — \`expect(userId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')\`, never \`.toBeDefined()\`. Assert CONTENT, not count — \`expect(items).toStrictEqual(['apple', 'banana'])\`, never \`.toHaveLength(2)\`. Assert the COMPLETE error object — \`{name, message, code}\`, no extras allowed.

**Forbidden matchers - NEVER USE THESE (they let bugs through):**

| Forbidden | Use instead |
|---|---|
| \`.toEqual()\` | \`.toStrictEqual()\` |
| \`.toMatchObject()\` | \`.toStrictEqual()\` |
| \`.toContain()\` | \`.toStrictEqual()\` for arrays; \`.toBe()\` or \`.toMatch(/^exact$/u)\` for strings |
| \`.toBeTruthy()\` / \`.toBeFalsy()\` | \`.toBe(true)\` / \`.toBe(false)\` |
| \`.toMatch('text')\` | \`.toMatch(/^exact text$/u)\` — anchored, full message |
| \`.toHaveProperty('key')\` | \`.toBe()\` on the actual value |
| \`.toHaveLength(5)\` | \`.toStrictEqual()\` on the complete array |
| \`.toBeDefined()\` | assert the actual value |
| \`.toBeUndefined()\` | \`.toBe(undefined)\` |
| \`expect.objectContaining({...})\` | assert the complete object |
| \`expect.arrayContaining([...])\` | assert the complete array |
| \`expect.stringContaining('text')\` | \`.toBe('exact full string')\` or \`.toMatch(/^exact$/u)\` |
| \`expect.any(String / Number / Object)\` | the actual value, or the complete shape. EXCEPTION: \`expect.any(Function)\` is OK — functions cannot be compared |
| \`expect(x).not.toBe(y)\` | \`.toBe(correctValue)\` — assert what it IS |
| \`expect(x).not.toHaveBeenCalled()\` | \`.toHaveBeenCalledTimes(0)\`, paired with what WAS called |
| \`expect(x).not.toContain(y)\` | \`.toStrictEqual()\` on the complete collection |
| \`expect(true).toBe(true)\` | assert the actual return value, never a literal |
| \`expect(Object.keys(obj)).toStrictEqual([...])\` | \`expect(obj).toStrictEqual({key: val})\` — keys AND values |
| \`expect(str.includes('x')).toBe(true)\` | \`expect(str).toBe('exact full string')\` |
| \`expect(typeof x).toBe('object')\` | the complete value — any object passes a typeof check |
| \`expect(fn).toHaveBeenCalledTimes(2)\` alone | pair it with \`.toHaveBeenCalledWith()\` in the same test |`;

  // Proxy Architecture - Core Rule
  const proxyCore = `**Mock only at I/O boundaries. Everything else runs REAL.**

When testing any layer, only two types of things are mocked:
1. **Adapters** - Mock npm dependencies (axios, fs, etc.) at adapter boundary
2. **Global functions** - Mock non-deterministic globals (Date.now(), crypto.randomUUID(), etc.)

All business logic, transformers, guards, brokers, bindings, and React hooks run with real code to ensure contract integrity.`;

  // What Gets Mocked diagram
  const mockingDiagram = `\`\`\`
Widget Test:
Widget                   (REAL)     ← Test renders this
  └─ useBinding          (REAL)     ← Real React hook
      └─ Broker          (REAL)     ← Real business logic
          ├─ Date.now()  (MOCKED)   ← Mock global function
          ├─ Transformer (REAL)     ← Real pure function
          ├─ Guard       (REAL)     ← Real boolean check
          └─ httpAdapter (REAL)     ← Real adapter code
              └─ axios   (MOCKED)   ← Mock npm dependency (I/O)

Only 2 things mocked: I/O npm dependencies + global functions
*Exception: DSL/query adapters (ESLint, SQL, GraphQL) run fully real to validate logic
\`\`\``;

  // Quick Reference Table
  const quickReference = `| Category | Needs Proxy? | Purpose |
|---|---|---|
| Contracts | ❌ No | Use stubs (.stub.ts files) - includes service objects with methods |
| Errors | ❌ No | Throw directly in tests |
| Adapters | ✅ Sometimes | **Mock npm dependency** (axios, fs, etc.). Empty proxy if no mocking needed (simple re-exports) |
| Brokers | ✅ Sometimes | Compose adapter proxies, provide semantic setup. Empty proxy if no dependencies mocked |
| Guards | ❌ No | Pure boolean functions - run real. Optional proxy only to build semantic test data |
| Transformers | ❌ No | Pure data transformation - run real, no mocking needed |
| Statics | ❌ No | Immutable values - test with actual values |
| State | ✅ Yes | Spy on methods, clear state in the constructor, mock external stores |
| Bindings | ✅ Yes | Delegate to broker proxies |
| Middleware | ✅ Yes | Delegate to adapter proxies |
| Responders | ✅ Yes | Delegate to broker proxies |
| Widgets | ✅ Yes | Delegate to bindings + provide UI triggers/selectors |
| Flows/Startup | ✅ Sometimes | Integration tests with .integration.proxy.ts for complex setup (spawning processes, clients) |`;

  // Proxy Patterns Overview
  const proxyPatterns = `**Detailed proxy patterns for each folder type** - Use \`get-folder-detail({ folderType: "..." })\` to see specific examples: adapters, brokers, bindings, widgets, responders, middleware, state, guards.

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
  const proxy = userFetchBrokerProxy();            // 1. Create proxy FIRST
  proxy.setupUserFetch({userId, user});            // 2. Setup mocks
  const result = await userFetchBroker({userId});  // 3. Call implementation
  expect(result).toStrictEqual(user);
});

// ❌ WRONG - a proxy declared outside the tests leaves test 2 with stale mocks
const proxy = userFetchBrokerProxy();
\`\`\`

**Why that order:** a proxy sets up its mocks in its constructor (the function body — no \`beforeEach\` hooks, no \`bootstrap()\` methods). Call the implementation first and it runs with nothing mocked. Share one proxy across tests and those tests depend on each other.

**Never write manual mock cleanup.** \`@dungeonmaster/testing\` resets every mock between tests. A \`mockReset()\`/\`mockClear()\` call in a test or proxy is redundant.

**Assignment vs just calling:** assign the proxy to a variable when you call setup methods on it (the common case). Just call it without assigning when it returns \`{}\` and has no setup methods — rare, usually pure functions and transformers.

A constructor-level \`calledWith([])\` catch-all answers EVERY call you did not describe more specifically, which silences the throw. Stage one only when a parent proxy builds this adapter without describing any call of its own, or when a spy exists purely to record-and-swallow output the test asserts separately via \`callsMatching\`.

**No direct mock manipulation:** tests call semantic proxy methods. \`registerMock\`, \`jest.mocked()\`, \`jest.spyOn()\` and \`jest.mock()\` belong inside the proxy, never in a test file.

\`\`\`typescript
// ✅ CORRECT - semantic method; registerMock lives inside the proxy
const proxy = axiosGetAdapterProxy();
proxy.returns({url: UrlStub('/users/123'), data: user});

// ❌ WRONG - either of these in a test file
jest.mocked(axios.get).mockResolvedValue({data: user});
registerMock({ fn: readFile }).calledWith([]).resolves(Buffer.from(''));
\`\`\``;

  // Child Proxy Creation
  const childProxies = `**When to assign child proxy to variable:** you call methods on it (the delegation pattern), or you use it in the return object.

**When to just call it without assignment:** empty proxies returning \`{}\`, needed only to satisfy \`enforce-proxy-child-creation\`, which you never interact with.

Assign first, then call setup on the Identifier — \`const httpProxy = httpAdapterProxy(); httpProxy.returns(...)\`. Never chain setup off the constructor call: \`enforce-proxy-patterns\` only recognises the Identifier form. The Global Function Mocking example below shows the whole shape.`;

  // Global Function Mocking
  const globalMocking = `ANY proxy can mock globals if the code being tested uses them. Not just brokers! Use \`registerMock\` exactly as you do for module mocks:

\`\`\`typescript
import { randomUUID } from 'crypto';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const userCreateBrokerProxy = () => {
  const httpProxy = httpAdapterProxy();
  // calls are matched on arguments, so globals collide with nothing
  const uuidHandle = registerMock({ fn: randomUUID });
  uuidHandle.calledWith([]).returns('f47ac10b-...'); // no args to key on — the honest catch-all

  return {
    setupUserCreate: ({user}) => httpProxy.returns({url: '/users', data: user}),
  };
};
\`\`\`

**Common globals:** Date.now(), crypto.randomUUID(), Math.random(), console.*

**Critical:** Let the function generate values using mocked globals, don't manually construct them.`;

  // Proxy Encapsulation Rule
  const proxyEncapsulation = `**CRITICAL:** Proxies must expose semantic methods, NOT child proxies. Tests should never chain through multiple proxy levels.

\`\`\`typescript
export const questExecuteBrokerProxy = () => {
  const pathseekerProxy = pathseekerPhaseBrokerProxy();
  const codeweaverProxy = codeweaverPhaseBrokerProxy();

  // ❌ WRONG - returning { pathseekerProxy, codeweaverProxy } forces every test to write:
  // pathseekerProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({...});

  // ✅ CORRECT - one semantic method that delegates internally, so the test writes only:
  //   proxy.setupQuestFile({questJson});
  return {
    setupQuestFile: ({questJson}: {questJson: string}): void => {
      pathseekerProxy.setupQuestFile({questJson});
      codeweaverProxy.setupQuestFile({questJson});
    },
  };
};
\`\`\`

**Why:** each test knows only its direct proxy, internal restructuring stops breaking tests, and a test then describes WHAT scenario it sets up rather than HOW to navigate proxy internals.`;

  // Statics Proxy Pattern
  const staticsProxy = `**Statics proxies** override immutable values for edge case testing. Use \`Reflect.set()\` to mutate readonly constants at runtime, or \`registerSpyOn\` for getters.

\`\`\`typescript
import {registerSpyOn} from '@dungeonmaster/testing/register-mock';

// Reflect.set for direct properties
export const userStaticsProxy = () => ({
  setupUnlimitedAttempts: (): void =>
    Reflect.set(userStatics.limits, 'maxLoginAttempts', Infinity),
});

// registerSpyOn for getters
export const apiStaticsProxy = () => {
  registerSpyOn({object: apiStatics, method: 'timeout'}).calledWith([]).returns(0);
  return {};
};
\`\`\``;

  // No Magic Numbers
  const noMagicNumbers = `**Extract magic numbers to statics files.** Tests and implementation should reference statics, not inline constants.

\`\`\`typescript
// ❌ WRONG - magic number in the contract
export const exitCodeContract = z.number().int().min(0).max(255).brand<'ExitCode'>();

// ✅ CORRECT - statics/exit-code/exit-code-statics.ts
export const exitCodeStatics = { limits: { max: 255 } } as const;

// ✅ contracts/exit-code/exit-code-contract.ts
export const exitCodeContract = z
  .number()
  .int()
  .min(0)
  .max(exitCodeStatics.limits.max)
  .brand<'ExitCode'>();
\`\`\`

**Same principle applies to lists and enumerations** — see Parameterize State Matrices above for the full \`it.each\` derive-from-statics rule.`;

  // EndpointMock (StartEndpointMock)
  const endpointMock = `Use \`StartEndpointMock\` for **any test that needs to mock HTTP responses** — broker tests, widget integration tests, or any layer that ultimately calls a fetch adapter. **Always via the broker proxy layer** — never call it directly in a test file.

**Do NOT use it for:** server-side tests (the server package mocks Hono's \`serve()\`, not fetch), or non-HTTP I/O (filesystem, child process — those use adapter proxies with \`registerMock\`).

| Method | Response |
|---|---|
| \`resolves({ data })\` | 200 OK with a JSON body |
| \`responds({ status, body })\` | JSON with an explicit status code (4xx, 5xx, 201, 204) |
| \`respondRaw({ status, body, headers })\` | Non-JSON payloads (binary, text, HTML) |
| \`networkError()\` | Connection refused / DNS failure |

\`\`\`typescript
export const projectFetchBrokerProxy = () => {
  const endpoint = StartEndpointMock.listen({method: 'get', url: '/api/projects'});

  return {
    setupProjects: ({projects}: { projects: readonly Project[] }): void =>
      endpoint.resolves({data: projects}),
    setupNotFound: (): void =>
      endpoint.responds({status: 404, body: {error: 'Not found'}}),
  };
};
\`\`\`

**The full chain:** Test → Widget Proxy → Binding Proxy → Broker Proxy → \`StartEndpointMock.listen()\` → MSW. Each layer delegates setup to the layer below, and the broker proxy is the only layer that knows about \`StartEndpointMock\`.

**MSW lifecycle:** \`StartEndpointMockSetup\` handles start, per-test handler reset and close. To enable EndpointMock in a package, add \`start-endpoint-mock-setup.ts\` to \`setupFilesAfterEnv\` in \`jest.config.js\`.`;

  // E2E Testing (Playwright)
  const e2eTesting = `E2E tests run the full stack (real server, real browser, real WebSocket). Only external dependencies (LLMs, third-party APIs) are mocked.

### e2e = Playwright Exclusively, Colocated in the E2E-Eligible Package

**\`e2e\` means Playwright — nothing else.** A non-Playwright (Jest) test that exercises a slice end-to-end is named **integration** (\`.integration.test.ts\`), never "e2e".

**e2es are \`*.e2e.ts\`, colocated in the entry flow's folder of the e2e-eligible package.** A package is e2e-eligible when its \`packageType\` is \`frontend-react\` or \`frontend-ink\`. Each e2e lives in the flow/route folder where the test starts — its \`page.goto\` target: \`<e2e-eligible-package>/src/flows/<route>/<feature>.e2e.ts\`. Where the test STARTS is where it lives, even when it bridges two e2e-eligible packages.

**The Playwright config + package-specific harnesses live in the e2e-eligible package.** \`<e2e-eligible-package>/playwright.config.ts\` (\`testMatch: '**/*.e2e.ts'\`) and \`<e2e-eligible-package>/test/harnesses/\` own the e2e stack. The \`testing\` package holds ONLY cross-package reshareables (register-mock, shared stubs, \`installTestbedCreateBroker\`) — it does NOT own e2e config, harnesses, or specs.

**Nest Playwright's \`outputDir\` and Vite's \`cacheDir\` under the run's port** — \`test-results/<port>\`, \`node_modules/.vite-<port>\` — or parallel walks wipe each other's traces and cache. Ward reaps both, so it costs no disk.

### The Dev Server a Run Starts Must Not Watch Files

Playwright's \`webServer\` command must name a NO-WATCH script, and the block must set \`reuseExistingServer: false\`. A watcher that RESTARTS the process drops the port mid-suite, so in-flight requests get a bare 500 with an EMPTY body and several unrelated specs fail at once. A watcher that HOT-RELOADS reloads the page a spec is asserting on — a blank screenshot, then a timeout. **For Vite, \`hmr: false\` alone is not enough: add \`watch: null\`.** The scaffolded \`playwright.config.ts\` carries the whole rule in its comments.

### Assert the Full Transition

Every user action that changes the UI must assert **three things**: the request was correct (method, URL, body), the old UI disappeared, and the new UI appeared.

\`\`\`typescript
// 1. request — set the watcher up BEFORE the click
const patchPromise = page.waitForRequest(
  (req) => req.method() === 'PATCH' && req.url().includes(\`/api/items/\${itemId}\`),
);
await page.getByText('Submit').click();
expect((await patchPromise).postDataJSON()).toHaveProperty('status', 'active');

// 2. old UI gone, 3. new UI present
await expect(page.getByText('Are you sure?')).not.toBeVisible({timeout: 5000});
await expect(page.getByTestId('dashboard-panel')).toBeVisible({timeout: 10_000});
\`\`\`

**Note:** \`.not.toBeVisible()\` is a Playwright-specific matcher and is allowed in e2e tests. The \`.not.*\` ban applies to Jest matchers only.

### Never Sleep, Always Wait for Elements

Never \`await page.waitForTimeout(3000)\`. Always wait for the specific element: \`await expect(page.getByTestId('panel')).toBeVisible({timeout: 10_000})\`.

### Drive State via Server/Filesystem Writes — ONLY for preconditions

This rule applies to **every server-mutating call** (\`request.patch\`/\`post\`/\`delete\`, \`writeQuestFile\`, \`fs.writeFile\`/\`fs.rm\`, harness helpers wrapping these). Use them to set the *starting state* only. **Never** use them to perform the mutation the test is actually exercising — if the UI has a control for it, drive it through that UI. Bypassing skips the point of an E2E: you never verify the control wires up, the handler fires, and the request body/URL are correct.

\`\`\`typescript
// ❌ WRONG — the test's purpose is to verify the APPROVE button transitions the quest;
// PATCHing skips the button. Passes silently while the button is broken.
await request.patch(\`/api/quests/\${questId}\`, {data: {status: 'approved'}});

// ✅ CORRECT — click the real button so the test verifies the actual user path
await page.getByTestId('PIXEL_BTN').filter({hasText: 'APPROVE'}).click();
await expect(page.getByText('Begin Quest modal')).toBeVisible();
\`\`\`

**Rule of thumb:** OK to write state the test doesn't care about (seeded fixtures, upstream phases). NOT OK to write the mutation the test name is about — drive it through the UI unless it's a pure server-side effect with no user-facing control (cron, webhooks).

**Locators:** use \`page.getByTestId('<testid>').filter({hasText: '<label>'})\`, not \`getByRole\`. All interactive elements have stable testids (\`PIXEL_BTN\`, \`CHAT_INPUT\`); filter by text when multiple share a testid.

### Observe Requests, Don't Intercept

Use \`page.waitForRequest\` to observe outgoing requests, as in the transition example above — never \`page.route\`. Intercepting is banned for the same reason as PATCHing past a button: it replaces the thing the test is supposed to prove.

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

Harness files are the e2e/integration equivalent of \`.proxy.ts\` files: a factory function, created at describe scope, exposing semantic methods and owning its own lifecycle. Tests never write \`beforeEach\`/\`afterEach\` — a harness declares optional \`beforeEach\` and \`afterEach\` properties, and a ts-jest AST transformer auto-wires those hooks.

\`\`\`typescript
// test/harnesses/guild/guild.harness.ts
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

**For Playwright:** Spec files use \`wireHarnessLifecycle()\` from test fixtures. Spec files MUST import \`{ test, expect }\` from the UI package's web-relative e2e fixtures (e.g. \`test/harnesses/e2e-fixtures\`), NOT from \`@playwright/test\` and NOT from \`@dungeonmaster/testing/e2e\`.

### Import Boundaries

- \`*.harness.ts\` → node:fs/path/os, contracts/stubs, other harnesses, test framework APIs
- \`*.e2e.ts\` / \`*.integration.test.ts\` → harnesses and contracts/stubs only
- **Scenario files CANNOT import:** node:fs, node:path, node:os, node:child_process, .proxy.ts files
- **Harness files CANNOT import:** .proxy.ts files, contract value imports (use .stub.ts)
- **Unit test files CANNOT import:** .harness.ts files

### Mock Boundary Rules

Only mock external services that are: not under your control, have no test mode, and are non-deterministic or costly.

**Valid mocks:** LLM CLI → fake binary, payment processor without sandbox → stub HTTP server
**Invalid mocks:** Your own HTTP endpoints, your own WebSocket messages, your own brokers/adapters

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

**Tests get types from stubs, NOT contracts** — see Type Safety section above for the \`ReturnType<typeof Stub>\` pattern.`;

  // Mocking Mechanics - registerMock
  const mockingMechanics = `**Use \`registerMock\` for all mocking in proxy files.** It replaces \`jest.mock()\`/\`jest.mocked()\`/\`jest.spyOn()\`.

**Why registerMock over jest.mock/jest.spyOn?** What a mock gives back is decided by the ARGUMENTS it was called with, and that configuration is shared across every proxy mocking the same function — one function, one behaviour, the way prod behaves. Reading two different paths in one test gives two different results because the paths differ, not because of the order the reads happen in. With raw \`jest.mock()\`, the second proxy would overwrite the first.

**How it works:** \`calledWith([args]).resolves(value)\` has two halves — \`[args]\` DESCRIBES a call you expect the code to make, \`value\` is what it gets back. All proxies mocking that function share these descriptions, so they cannot disagree. A call matching none THROWS unconditionally, naming what was asked for and what was configured.

**MockHandle API:**

| Method | Purpose |
|--------|---------|
| \`handle.calledWith([args])\` | Describe a call + what it gets back; applies to EVERY matching call |
| \`handle.onceFor([args])\` | Same, applies ONCE — when identical calls must get different results |
| \`handle.callsMatching([args])\` | Which calls actually happened with these arguments (use in assertions) |

An unaddressed \`callsMatching([])\` has no \`.at()\`/index — address it, or assert the whole list.

\`calledWith\` / \`onceFor\` return \`{ returns, resolves, rejects, throws, implement }\` — \`.returns()\`/\`.throws()\` hand back the value/error as-is, \`.resolves()\`/\`.rejects()\` wrap it in a Promise (staging async with \`.returns()\` hands back a raw value the caller then calls \`.then()\` on). \`callsMatching([args])\` is a FRESH SNAPSHOT per call, not a live reference — capture it once and poll it and later calls never show up.

**Staging is SHARED across every proxy mocking the same function** — one function, one behaviour. Two proxies describing it at equally low specificity COLLIDE and the later registration silently wins everywhere — the shape recurs whenever two callers share one Node API: \`readline.createInterface\` (stdout reader vs file tailer), \`fs.readdirSync\` (filenames vs \`{withFileTypes: true}\`), \`path.join\` (sticky default vs one-shot queue). Fix with a DISCRIMINATING address — a predicate, or just more arguments (an argument-count mismatch auto-fails to match) — never by reordering construction, which restores the order-dependency this removes. Two DIFFERENT results for the SAME address is what \`onceFor\` is for; staging both as \`calledWith\` means the later wins on the first call, silently disabling the sequence.

**How arguments are compared:**

Describing fewer arguments than the call passes is a PREFIX match — \`['/a/f.json']\` matches \`readFile('/a/f.json', 'utf8')\`. Objects compare only on the keys you write. RegExp matches a string, Date by time, and a FUNCTION is a test you write yourself, for values you cannot know in advance. Most specific wins; when equally specific a live one-shot wins, then the most recent.

**Where's the address, per target:**

| Target | The address |
|---|---|
| \`fs\` reads/writes (\`readFile\`, \`writeFile\`, \`existsSync\`, \`readdir\`, …) | the PATH (arg 0); write body is arg 1 (\`callsMatching([path]).at(-1)?.[1]\`) |
| \`crypto.randomUUID\`, \`Date.now\`, \`Date.prototype.toISOString\`, \`Math.random\`, \`process.cwd\`, \`os.homedir\` | NO argument — \`calledWith([])\` is honest, not lazy |

**Check the arguments you describe are the ones the function really receives.** \`calledWith([X])\` only fires if X equals what the npm function is actually called with, and callers often change it on the way down — a broker joining a cwd onto a glob pattern. Read the adapter to confirm.

\`\`\`typescript
// Adapter proxy at an I/O boundary
export const fsWriteFileAdapterProxy = () => {
  const handle = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void =>
      handle.calledWith([filePath]).resolves(undefined),
    // Answers for this path only
    getWrittenFor: ({ filePath }: { filePath: FilePath }): unknown =>
      handle.callsMatching([filePath]).at(-1)?.[1],
  };
};
\`\`\`

Globals work identically — see Global Function Mocking above.

### registerSpyOn — Spy on Global Object Methods

\`registerSpyOn\` spies on methods of global objects (process, Date, crypto, Math, etc.) and returns a \`SpyOnHandle\` — an alias of \`MockHandle\`, with the identical \`calledWith\`/\`onceFor\`/\`callsMatching\` API. Throw-on-unmatched is unconditional, EXCEPT \`registerSpyOn({ passthrough: true })\`, where the real implementation is the catch-all and never throws.

\`\`\`typescript
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
stdoutSpy.calledWith([]).returns(true); // record-and-swallow: assert text via callsMatching

// passthrough: true — real implementation runs by default, still overridable per address
const timerSpy = registerSpyOn({ object: globalThis, method: 'setTimeout', passthrough: true });
\`\`\`

**Common targets:** \`process.stdout.write\`, \`Date.now\`, \`crypto.randomUUID\`, \`Math.random\`

### The Rest of \`@dungeonmaster/testing/register-mock\`

| Export | Reach for it when |
|---|---|
| \`registerModuleMock({ module, factory })\` | A whole module must be replaced BEFORE it loads, to stop a crash or a side effect. Runtime no-op — the AST transformer hoists it as \`jest.mock()\`. |
| \`requireActual({ module })\` | A parent proxy needs the real implementation of something a child proxy mocked. Wraps \`jest.requireActual\`. |
| \`registerIsolateModules\` | Testing an entry point with top-level side effects. Wraps \`jest.isolateModules\` + \`jest.doMock\`. |

\`\`\`typescript
registerModuleMock({ module: 'eslint-plugin-jest', factory: () => ({ rules: {} }) });

const realPath = requireActual({ module: 'path' });
handle.calledWith([]).implement((...args) => realPath.join(...args));
\`\`\``;

  // Integration Testing
  const integrationTesting = `**CRITICAL:** Integration tests are **ONLY for startup files and flows**. Use \`.integration.test.ts\` extension, colocated with the file under test — never in a separate test directory.

- **Startup files** — validate that the startup wires up the entire application correctly.
- **Flows** — validate that the flow wires its responders/middleware/adapters correctly across the slice it owns (e.g., HTTP route → responder → broker, MCP request → handler, hook entry → responder).

**All other code** (brokers, guards, transformers, widgets, responders, adapters, etc.) uses **unit tests** (\`.test.ts\`) with colocated proxies.

\`\`\`
src/startup/
  start-my-app.ts
  start-my-app.integration.test.ts     // ✅ colocated
  start-my-app.proxy.ts                // ✅ only when setup is complex (spawning processes, creating clients)

test/start-my-app.integration.test.ts  // ❌ separate test directory
\`\`\`

**Debugging integration test timeouts:**

Integration tests that spawn processes or poll for state can time out silently — Jest reports \`Error: thrown: ""\` and \`has no assertions\`, pointing at the test file instead of the actual failure. When an integration test times out:

1. **Do NOT rerun the test repeatedly.** Integration tests take 10-30+ seconds per run. Retrying burns time without new information.
2. **Trace the code path** from the test's entry point to where it blocks. The test is usually polling for a state that will never arrive.
3. **Check for swallowed errors:** Look for \`try/catch\` blocks in the code under test that mark items as \`failed\` without surfacing the error message. Zod parse failures inside catch handlers are a common culprit.
4. **Search SOURCE, not \`dist/\`:** jest reads source, so a stale \`dist/\` never explains an in-process hang. Use \`discover({ grep: 'oldFieldName' })\`; bash \`grep\` is hook-blocked.
5. **Check poll helpers:** If the test uses \`pollForStatus\` or similar, the poll may be waiting for a status that the system will never reach (e.g., polling for \`complete\` when the quest went to \`blocked\`).`;

  // Lint rules that BLOCK the edit (pre-edit hook)
  const editBlockingRules = `The pre-edit-lint hook runs these rules BEFORE your Edit/Write lands. A violation BLOCKS the edit — the file is NOT written, so re-submit the ENTIRE corrected edit, not a surgical follow-up (nothing was applied). Top offenders when writing tests:

- **Conditionals in tests** (\`jest/no-conditional-in-test\`, upstream): no \`if\`/ternary/\`&&\`/\`switch\`/\`try-catch\` in a test body — split into \`it\` blocks or \`it.each\`.
- **Ad-hoc / inline structural types** (\`@dungeonmaster/ban-adhoc-types\`): no local \`interface\` and no \`x as { foo: string }\` — define types in contracts/ and import them.
- **Non-exported / nested functions** (\`@dungeonmaster/forbid-non-exported-functions\`): every function must be the file's primary export — no helper declared inside a test or proxy.
- **Raw primitives** (\`@dungeonmaster/ban-primitives\`): return types must be branded; to test invalid inputs use \`as never\`, never \`as string\`.`;

  // No Hooks or Conditionals
  const noHooksConditionals = `**CRITICAL:** \`beforeEach\`, \`afterEach\`, \`beforeAll\`, \`afterAll\` are forbidden. All setup and teardown must be inline in each test.

\`\`\`typescript
// ✅ CORRECT - setup and cleanup inline, inside the test
it('VALID: test case => expected result', () => {
  fs.mkdirSync(tempDir, {recursive: true});
  // test logic
  fs.rmSync(tempDir, {recursive: true, force: true});
  expect(result).toBe(expected);
});
\`\`\`

**No conditionals in tests.** An \`if (result.hasError) { expect(...) }\` asserts nothing when the branch is not taken. Write one test per path instead:

\`\`\`typescript
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

- **Control flow:** if/else, switch cases, ternary (\`? :\`), try/catch
- **Operators:** optional chaining (\`?.\`), nullish coalescing (\`??\`)
- **Data patterns:** arrays (\`[]\`/single/multiple), strings (\`''\`/one/many chars), loops (0/1/many), boundaries (min/within/max)
- **Async:** immediate resolution, delayed resolution, rejected promises
- **React/UI:** dynamic JSX values, conditional rendering (\`&&\`/ternary), event handlers (onClick/onChange/onSubmit)

\`\`\`typescript
const processUser = (user: User | null): string => {
  if (!user) return 'No user';        // → it('EMPTY: {user: null} => returns "No user"')
  if (user.isAdmin) return 'Admin';   // → it('VALID: {user: adminUser} => returns "Admin"')
  return user.name;                   // → it('VALID: {user: regularUser} => returns user name')
}
\`\`\``;

  // Combine all sections in proper order
  const markdown = `# Testing Patterns & Philosophy

## Purpose

${purpose}

## Core Principles

### Type Safety

${typeSafety}

### DAMP > DRY

${dampPattern}

### Parameterize State Matrices with \`it.each\`

${parameterizeStateMatrices}

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

## Lint Rules That BLOCK Your Edit (pre-edit hook)

${editBlockingRules}

## Summary Checklist

Before writing any test, verify:

- [ ] Created fresh proxy in test (not shared)
- [ ] Used ReturnType<typeof Stub> for types (not contract imports)
- [ ] No \`any\`, \`as\` or \`@ts-ignore\` used to silence a type error
- [ ] Proxies use registerMock/registerSpyOn (not jest.mocked/jest.spyOn) and set up in constructor
- [ ] Tests use semantic proxy methods (never registerMock/jest.mocked directly in tests)
- [ ] Used toStrictEqual for objects/arrays (no weak matchers)
- [ ] No beforeEach/afterEach hooks
- [ ] No conditionals in tests
- [ ] All branches manually verified against implementation
- [ ] Each test is self-contained and isolated
- [ ] DSL/query logic uses integration tests (real execution)
- [ ] Parameterized state matrices with \`it.each\`/\`describe.each\` when 3+ cases differ only by input value
`;

  return contentTextContract.parse(markdown);
};
