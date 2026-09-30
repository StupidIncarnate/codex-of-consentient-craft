/**
 * PURPOSE: Generate testing patterns and philosophy documentation for LLMs writing tests
 *
 * USAGE:
 * const markdown = architectureTestingPatternsBroker();
 * // Returns ContentText markdown with testing philosophy, proxy patterns, assertions, and test structure
 *
 * WHEN-TO-USE: When LLMs need to understand how to write tests and create proxy files
 */

export const architectureTestingPatternsBroker = (): string => {
  // Purpose
  const purpose = `**Why so strict?** Loose tests pass when code is broken. Exact tests catch real bugs.`;

  // Core Principles - Type Safety
  const typeSafety = `**CRITICAL:** Test files AND proxy files CANNOT import types from contracts.

Use \`ReturnType<typeof StubName>\` ONLY when you need the type in function signatures or annotations:

\`\`\`typescript
import type {User} from '../contracts/user/user-contract';  // ❌ type from a contract
const user = UserStub({id: userId});                         // ✅ the stub infers the type
type User = ReturnType<typeof UserStub>;                     // ✅ only for a signature
\`\`\`

**Never silence a type error with \`any\`, \`as\`, or \`@ts-ignore\`.** One escape hatch is allowed:

- **Deliberately invalid input** — \`as never\`, never \`as string\` (it types a wrong input as the wrong type). \`expect(() => MyStub({value: 123 as never})).toThrow(/Expected string/u)\`.

A loose string or number needs no brand and no stub in a mock: \`handle.calledWith([filePath]).resolves('content')\`.

**exactOptionalPropertyTypes: OMIT an optional property, never pass \`undefined\`.** Your training says \`optional?: string\` accepts \`undefined\`; this tsconfig setting fails at runtime when you pass it. Write \`myGuard({value: 'test'})\`, not \`myGuard({value: 'test', optional: undefined})\`.`;

  // Core Principles - DAMP > DRY
  const dampPattern = `Tests should be **Descriptive And Meaningful**, not DRY. Each test must be readable standalone without looking at helpers.`;

  // Core Principles - Parameterize State Matrices
  const parameterizeStateMatrices = `**DAMP > DRY still holds.** But when a test is repeated 3 or more times with the only variation being an input value (cycling through every status in a union, every enum member, every invalid input variant), parameterize with \`it.each\`, \`test.each\`, or \`describe.each\`. The body, setup, and assertion shape must be identical across cases — only literal values change.

\`\`\`typescript
// ❌ WRONG - 15 near-identical tests differing only by the status literal
// ✅ CORRECT - one parameterized test, list derived from the canonical static
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

it.each(STATUSES.filter((s) => !questStatusMetadataStatics.statuses[s].isPauseable))(
  'EMPTY: {status: %s} => PAUSE button hidden',
  (status) => { /* identical body and assertion for every case */ },
);
\`\`\`

**Literals in \`expect(...)\` vs \`it.each(...)\`:**
- \`expect(x).toBe('pending')\` — a hardcoded literal in an assertion is fine. It is that case's specific output.
- \`it.each([...])\` — **NEVER hardcode the list of cases.** Derive a finite input set (every status in a union, every enum member, every role) from its \`*-statics.ts\`, Zod \`.options\`, or exported readonly array, then \`.filter()\`/\`.map()\` the subset. A hardcoded array silently skips every member added later.

**When to parameterize:** 3 or more cases whose body, setup and assertion shape are identical and only the literal input differs — union variants, enum members, status matrices, error codes, boundary values. The test proves one rule holds for every member of a set.

**When NOT to parameterize (DAMP wins):** setup differs between cases, assertion shape differs beyond a simple mapping, each case carries a distinct meaning deserving its own sentence-length name, or there are only 2 cases.

**Grouping related variants:** \`describe.each\` when several \`it\` blocks share one parameterization (several \`it\` blocks per pause-capable status). The same derive-from-a-static rule applies.

**Subset-membership expected values:** When \`it.each\` iterates the full list and each case's expected value is "is this member in a subset?" (e.g., "is this status pauseable?"), derive the subset by filtering the same statics source. One statics source drives BOTH the iteration list AND the expected-subset set — don't hand-maintain a second hardcoded copy.

\`\`\`typescript
const PAUSEABLE_STATUSES = new Set(
  STATUSES.filter((s) => questStatusMetadataStatics.statuses[s].isPauseable),
);

it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
  expect(isQuestPauseableQuestStatusGuard({ status })).toBe(PAUSEABLE_STATUSES.has(status));
});
\`\`\`

**Name template rules:** \`%s\` for the case value; keep the \`VALID:\`/\`INVALID:\`/\`EMPTY:\` prefix, which \`enforce-test-name-prefix\` validates on the SUBSTITUTED name, and the \`{input} => result\` shape.`;

  // Core Principles - Test Behavior Not Implementation
  const testBehavior = `\`\`\`typescript
// ✅ CORRECT
it("VALID: {price: 100, tax: 0.1} => returns 110")

// ❌ WRONG - Testing internals
it("VALID: {price: 100} => calls _calculateTax()")
\`\`\``;

  // Core Principles - Unit vs Integration Tests
  const unitVsIntegration = `**Unit Test (mock dependencies):**
- Pure logic you control: transformers, contracts, business rules, validation

**Integration Test (real dependencies):**
- Logic expressed in an external system's DSL/query language (ESLint rules, SQL queries, GraphQL resolvers, regex patterns, template engines), which the external system must interpret for the test to prove anything

ESLint rules run through \`ruleTester.run\` over real code, never by calling \`rule.create({report: jest.fn()})\` with a mock: a mock never proves the selector matches real code.`;

  // Test Structure
  const testStructure = `**Always use describe blocks** - never comments:

\`\`\`typescript
// ✅ CORRECT
describe("UserValidator", () => {
  describe("validateAge()", () => {
    it("VALID: {age: 18} => returns true")
    it("INVALID: {age: -1} => throws 'Age must be positive'")
  })
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
| \`.toBeNull()\` | \`.toBe(null)\` |
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
  const proxyCore = `**Mock only what the I/O trap or MSW catches. Everything else runs REAL.**

When testing any layer, only two kinds of things are mocked:
1. **A call the I/O trap or MSW catches** - compose the gateway wrapper's proxy, imported from its own file, in the proxy of the file that calls the wrapper. A pass-through wrapper (one that only re-exports an outside function, such as \`path\`) runs real and has no proxy.
2. **Globals a test pins** - non-deterministic globals (Date.now(), crypto.randomUUID(), etc.)

All business logic, transformers, guards, brokers, bindings and React hooks run real.`;

  // What Gets Mocked diagram
  const mockingDiagram = `\`\`\`
Widget Test:
Widget                   (REAL)     ← Test renders this
  └─ Broker              (REAL)     ← Real business logic
      ├─ Date.now()      (MOCKED)   ← Mock global function
      └─ readFileIfExists (REAL)    ← Real gateway wrapper code
          └─ fs.promises.readFile (MOCKED) ← Caught by the I/O trap, staged through the wrapper's proxy

Mocked: what the I/O trap or MSW catches, and globals a test pins. Everything else runs real.
\`\`\``;

  // Quick Reference Table
  const quickReference = `| Category | Needs Proxy? | Purpose |
|---|---|---|
| Contracts | ❌ No | Use stubs (.stub.ts files). An outside type comes from the gateway's stub, imported from its own file |
| Errors | ❌ No | Throw directly in tests |
| Brokers | ✅ Sometimes | Compose the proxies of the gateway wrappers the broker calls, each imported from its own \`.proxy\` file, and provide semantic setup. Empty proxy if no dependencies mocked |
| Guards | ❌ No | Pure boolean functions - run real. Optional proxy only to build semantic test data |
| Transformers | ❌ No | Pure data transformation - run real, no mocking needed |
| Statics | ❌ No | Immutable values - test with actual values |
| State | ✅ Yes | Spy on methods, clear state in the constructor, mock external stores |
| Bindings | ✅ Yes | Delegate to broker proxies |
| Middleware | ✅ Yes | Delegate to gateway wrapper proxies |
| Responders | ✅ Yes | Delegate to broker proxies |
| Widgets | ✅ Yes | Delegate to bindings + provide UI triggers/selectors |
| Flows/Startup | ✅ Sometimes | Integration tests; .integration.proxy.ts for complex setup (spawning processes, clients) |`;

  // Proxy Patterns Overview
  const proxyPatterns = `**Detailed proxy patterns for each folder type** - Use \`get-folder-detail({ folderType: "..." })\` to see specific examples: brokers, bindings, widgets, responders, middleware, state, guards.

**Empty Proxy Pattern:**

\`\`\`typescript
// Pure functions, pass-through wrappers - no mocking needed
export const pureTransformerProxy = (): Record<PropertyKey, never> => ({});
\`\`\``;

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

**Why that order:** the constructor (the function body — no \`beforeEach\`, no \`bootstrap()\`) sets up the mocks, so an implementation called first runs unmocked, and a shared proxy makes tests depend on each other.

**Never write manual mock cleanup.** \`@dungeonmaster/testing\` resets every mock between tests; \`mockReset()\`/\`mockClear()\` is redundant.

**No direct mock manipulation:** tests call semantic proxy methods. \`registerMock\`, \`jest.mocked()\`, \`jest.spyOn()\` and \`jest.mock()\` belong inside the proxy, never in a test file.

\`\`\`typescript
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// ✅ semantic method
const proxy = readFileProxy();
proxy.returns({path: '/repo/config.json', contents: '{}'});

// ❌ in a test file
jest.mocked(readFile).mockResolvedValue('{}');
\`\`\``;

  // Child Proxy Creation
  const childProxies = `**When to assign child proxy to variable:** you call methods on it (the delegation pattern), or you use it in the return object.

**When to just call it without assignment:** empty proxies returning \`{}\`, needed only to satisfy \`enforce-proxy-child-creation\`, which you never interact with.

Assign first, then call setup on the Identifier — \`const fileProxy = readFileProxy(); fileProxy.returns(...)\`. Never chain setup off the constructor call: \`enforce-proxy-patterns\` only recognises the Identifier form.`;

  // Global Function Mocking
  const globalMocking = `ANY proxy can mock globals if the code being tested uses them. Not just brokers! Use \`registerMock\` exactly as you do for module mocks; a global with no arguments is staged with \`calledWith([])\`.

**Common globals:** Date.now(), crypto.randomUUID(), Math.random(), console.*

**Critical:** let the function generate values from mocked globals; never construct them by hand.`;

  // Proxy Encapsulation Rule
  const proxyEncapsulation = `**CRITICAL:** Proxies must expose semantic methods, NOT child proxies. Tests should never chain through multiple proxy levels.

\`\`\`typescript
export const questExecuteBrokerProxy = () => {
  const pathseekerProxy = pathseekerPhaseBrokerProxy();
  // ❌ WRONG - returning { pathseekerProxy } forces tests to chain: proxy.pathseekerProxy.slotManagerProxy.loopProxy....resolves({...})
  // ✅ CORRECT - one semantic method that delegates internally: proxy.setupQuestFile({questJson})
  return {
    setupQuestFile: ({questJson}: {questJson: string}): void => pathseekerProxy.setupQuestFile({questJson}),
  };
};
\`\`\`

**Why:** a test knows only its direct proxy and describes WHAT scenario it sets up, not HOW to navigate proxy internals.`;

  // Statics Proxy Pattern
  const staticsProxy = `**A statics proxy is empty.** It mutates nothing, because a constant is immutable. To exercise an edge value, pass it into the function under test. Use \`registerSpyOn\` only for a getter.`;

  // Gateway Proxies and Test Support
  const gatewayProxies = `### Import each stub and proxy from its own file

No production barrel exports a stub or a proxy. A test or proxy file imports each one from the file beside the thing it fakes: \`@dungeonmaster/orchestrator/startup/start-orchestrator.proxy\`, \`#gateway/node/fs/file-missing-error/file-missing-error.stub\`. A stub of our own type parses through its contract; a stub of an outside type comes from the gateway, imported from its own file.

### Compose the gateway wrapper's proxy

The proxy of a file that calls a gateway wrapper composes that wrapper's proxy, imported from the \`.proxy\` file beside the wrapper. A pass-through wrapper runs real and has no proxy. Tests import outside packages through the gateway too.

\`\`\`typescript
// brokers/file/scanner/file-scanner-broker.proxy.ts
import { globProxy } from '#gateway/npm/glob/glob/glob.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const fileScannerBrokerProxy = () => {
  const globGateway = globProxy();
  const readFileGateway = readFileProxy();
  return { setupFiles: ({ files, pattern }) => { /* globGateway.returns({ pattern, matches }); readFileGateway.returns({ path, contents }) per file */ } };
};
\`\`\`

A caller's proxy never \`registerMock\`s the wrapper's underlying outside function itself: only the wrapper's own proxy does that.

### No catch-all answers

No \`calledWith([])\`, and no predicate that is always true, in a proxy constructor for a function that takes arguments. Stage each call by its arguments, so a call the proxy forgot throws. Two opt-in shapes stay inside that rule because nothing stages them by default: a scenario method that answers any path for a virtual file tree (\`setupImplementation\`), and a wrapper proxy's lower-ranked fallback addressed by the path alone (\`returnsOnceFallback\` on \`readFileProxy\`). Every exact stage outranks both. A function that takes NO arguments (\`randomUUID\`, \`Date.now\`, \`process.cwd\`) is the one place a constructor-level \`calledWith([])\` belongs: \`[]\` is the only address there is. \`ban-proxy-empty-called-with\` and \`ban-proxy-catch-all-defaults\` refuse the empty address and an always-true predicate for any other function.

### A contract field branded \`'#Gateway<Type>'\` takes the gateway's stub

A stub argument for such a field takes the gateway's stub, imported from its own file. A partial fake does not compile.

\`\`\`typescript
import { ErrorStub } from '#gateway/browser/Error/error.stub';

const result = UseQuestSummaryResultStub({ error: ErrorStub() });
\`\`\`

### Build a failure from a recorded one

A failure comes from a wrapper proxy's named scenario, such as \`readFileProxy().missing({ path })\`, or from a recorded-failure stub in the gateway, such as \`FileMissingErrorStub\`. Never a hand-made \`Error\`: its shape is the one you imagined, not the one Node produces, and \`ban-invented-failures\` refuses it.

\`\`\`typescript
const fileProxy = readFileProxy();
fileProxy.missing({ path: '/repo/config.json' });
\`\`\`

### Never mock another workspace package's export

Never \`registerMock\` another workspace package's export. Compose the proxy it ships beside its API, such as \`StartOrchestratorProxy\`. \`ban-workspace-export-mocks\` refuses the mock.

\`\`\`typescript
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
\`\`\``;

  // Jest Home Sandbox
  const homeSandbox = `Every Jest run gets a sandbox \`HOME\`, so \`os.homedir()\` already returns a throwaway directory. A test author does nothing to turn it on, and follows these rules:

1. **Do not mock \`os.homedir()\` for isolation.** \`os.homedir\` needs no mock for isolation; it already returns the sandbox. Mock it only to pin a value.
2. **A proxy that needs an expected path under the home calls the real \`homedir()\`,** as it calls \`join\`.
3. **The sandbox \`HOME\` is one directory for the whole run, shared by every worker.** Never assume it is empty. Write under a directory the test owns, such as a testbed from \`installTestbedCreateBroker\`.
4. **To give a spawned process a different home, pass it in that spawn's options:** \`env: { ...process.env, HOME: dir }\`. Assigning \`process.env.HOME\` inside a test does nothing.
5. **A test that changes \`DUNGEONMASTER_HOME\` restores it and never deletes it.**`;

  // No Magic Numbers
  const noMagicNumbers = `**Extract magic numbers to statics files.** Tests and implementation should reference statics, not inline constants.

\`\`\`typescript
// ❌ .max(255) inline in the contract
// ✅ statics/process-result/process-result-statics.ts
export const processResultStatics = { limits: { maxExitCode: 255 } } as const;
// ✅ the contract reads it: .max(processResultStatics.limits.maxExitCode)
\`\`\`

**Same principle applies to lists and enumerations** — see Parameterize State Matrices above for the full \`it.each\` derive-from-statics rule.`;

  // EndpointMock (StartEndpointMock)
  const endpointMock = `Use \`StartEndpointMock\` for **any test that needs to mock HTTP responses** — broker tests, widget integration tests, or any layer that ultimately calls a fetch gateway wrapper. **Always via the broker proxy layer** — never call it directly in a test file.

**Not for** non-HTTP I/O (filesystem, child process): those use the gateway wrapper proxies.

| Method | Response |
|---|---|
| \`resolves({ data })\` | 200 OK with a JSON body |
| \`responds({ status, body })\` | JSON with an explicit status code (4xx, 5xx, 201, 204) |
| \`respondRaw({ status, body, headers })\` | Non-JSON payloads (binary, text, HTML) |
| \`networkError()\` | Connection refused / DNS failure |

\`\`\`typescript
// A broker proxy composes the fetch wrapper's proxy; it never calls StartEndpointMock itself.
import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

export const questMergeBrokerProxy = () => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'post', url: webConfigStatics.api.routes.questMerge } as const;

  return { setupMerge: ({ merging }: { merging: boolean }): void => jsonFetchProxy.setupSuccess({ ...address, body: { merging } }) };
};
\`\`\`

**The full chain:** Test → Widget Proxy → Binding Proxy → Broker Proxy → the fetch wrapper's proxy (\`fetchJsonProxy\` in \`@gateway/browser\`) → \`StartEndpointMock.listen()\` → MSW. Each layer delegates setup downward; only the fetch wrapper's proxy calls \`StartEndpointMock\`.

**MSW lifecycle:** MSW loads in every package, server included, from the root Jest base config, and \`StartEndpointMockSetup\` handles start, per-test handler reset and close. A package adds no setup file for it.`;

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
// set the request watcher up BEFORE the click
const patchPromise = page.waitForRequest((req) => req.method() === 'PATCH');
await page.getByText('Submit').click();
expect((await patchPromise).postDataJSON()).toHaveProperty('status', 'active');
await expect(page.getByText('Are you sure?')).not.toBeVisible({timeout: 5000});   // old UI gone
await expect(page.getByTestId('dashboard-panel')).toBeVisible({timeout: 10_000}); // new UI present
\`\`\`

**Note:** \`.not.toBeVisible()\` is a Playwright matcher, allowed in e2e; the \`.not.*\` ban applies to Jest matchers only.

### Never Sleep, Always Wait for Elements

Never \`await page.waitForTimeout(3000)\`; wait for the element: \`await expect(page.getByTestId('panel')).toBeVisible({timeout: 10_000})\`.

### Bring the Page to the Front Before Measuring Geometry

A page that is not the active tab reads \`document.visibilityState === "hidden"\`, and Chromium then stops committing layout frames — so every node reads invisible with a zero-ish bounding box. That looks exactly like a product bug and has cost real debugging time. Before ANY \`boundingBox()\`, width, height, overflow or visibility assertion: call \`page.bringToFront()\`, take a \`page.screenshot()\` to force a frame, assert \`document.visibilityState\` is \`'visible'\`, and only then measure.

\`\`\`typescript
await page.bringToFront();
await page.screenshot();
const visibilityState = await page.evaluate(() => document.visibilityState);
expect(visibilityState).toBe('visible');
\`\`\`

### Drive State via Server/Filesystem Writes — ONLY for preconditions

This rule applies to **every server-mutating call** (\`request.patch\`/\`post\`/\`delete\`, \`writeQuestFile\`, \`fs.writeFile\`/\`fs.rm\`, harness helpers wrapping these). Use them for the *starting state* only. **Never** use them to perform the mutation the test exercises — if the UI has a control for it, drive it through that UI, or you never verify the control, the handler and the request body/URL.

\`\`\`typescript
// ❌ request.patch(\`/api/quests/\${questId}\`, {data: {status: 'approved'}}) — skips the button; passes while it is broken
// ✅ click the real button
await page.getByTestId('PIXEL_BTN').filter({hasText: 'APPROVE'}).click();
\`\`\`

**Rule of thumb:** seed state the test doesn't care about; drive the mutation the test name is about through the UI, unless it is a pure server-side effect with no control (cron, webhooks).

**Locators:** \`page.getByTestId('<testid>').filter({hasText: '<label>'})\`, not \`getByRole\`; interactive elements have stable testids (\`PIXEL_BTN\`, \`CHAT_INPUT\`).

### Observe Requests, Don't Intercept

Use \`page.waitForRequest\` to observe outgoing requests, never \`page.route\`: intercepting replaces the thing the test is supposed to prove.

### Each Test Owns Its State

Tests must not depend on ordering or state from previous tests. Create all fixtures fresh in each test.

### Timeout Increases Are a Last Resort

When an E2E test fails with a timeout, diagnose state before touching timeouts:

Log each stage and inspect the real system state; check that preconditions hold; if it passes in isolation but fails under load, suspect shared mutable state, not timing. Only after state is confirmed correct at every stage, raise the timeout, with a comment explaining why.`;

  // Test Infrastructure (Harness Pattern)
  const harnessPattern = `### The \`test/\` Directory

\`test/\` holds test infrastructure, as \`src/\` holds application code. Every package with integration/e2e tests MUST have one.

### The \`.harness.ts\` Pattern

Harness files are the e2e/integration equivalent of \`.proxy.ts\` files: a factory function, created at describe scope, exposing semantic methods and owning its own lifecycle. Tests never write \`beforeEach\`/\`afterEach\` — a harness declares optional \`beforeEach\` and \`afterEach\` properties, and a ts-jest AST transformer auto-wires those hooks.

\`\`\`typescript
// test/harnesses/guild/guild.harness.ts
export const guildHarness = () => {
  const createdGuildIds: string[] = [];

  return {
    afterEach: async (): Promise<void> => {
      for (const id of createdGuildIds) await GuildRemoveResponder({guildId: id});
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

- \`*.harness.ts\` → gateway wrappers (\`#gateway/node/fs\`, \`#gateway/node/path\`, ...), contracts/stubs, other harnesses, test framework APIs. An outside package, Node built-ins included, is imported through the gateway here too.
- \`*.e2e.ts\` / \`*.integration.test.ts\` → harnesses and contracts/stubs only
- **Scenario files CANNOT import:** node:fs, node:path, node:os, node:child_process, .proxy.ts files
- **Harness files CANNOT import:** .proxy.ts files, contract value imports (use .stub.ts)
- **Unit test files CANNOT import:** .harness.ts files

### Mock Boundary Rules

Mock only external services that are not under your control, have no test mode, and are non-deterministic or costly (an LLM CLI → fake binary; a payment processor without a sandbox → stub HTTP server). Never your own HTTP endpoints, WebSocket messages, brokers or gateway wrappers.

### Scenario File Rules

Scenario files are **scenario descriptions only** — test blocks, \`expect()\`, \`await page.*\`, constants and inline data, plus imports from \`test/harnesses/\`. **Banned:** \`fs\`/\`path\` imports, top-level helper functions, \`page.waitForTimeout(N)\`, \`page.route(...)\`.`;

  // Stub Factories
  const stubFactories = `**Complete stub patterns in contracts/ folder detail** - Use \`get-folder-detail({ folderType: "contracts" })\`.

**Critical stub rules:**
- Object Stubs: Use \`StubArgument<Type>\` with spread operator + \`contract.parse()\`
- Mixed Data + Functions: Destructure functions from data, preserve function references for \`jest.fn()\`
- Extract properties: ALWAYS use destructuring (\`const { x } = Stub()\`, never \`.property\`)
- Optional fields: Omit defaults (don't set \`undefined\`)

**Tests get types from stubs, NOT contracts** — see Type Safety section above for the \`ReturnType<typeof Stub>\` pattern.`;

  // Mocking Mechanics - registerMock
  const mockingMechanics = `**Use \`registerMock\` for all mocking in proxy files.** It replaces \`jest.mock()\`/\`jest.mocked()\`/\`jest.spyOn()\`.

**Why registerMock over jest.mock/jest.spyOn?** What a mock gives back is decided by the ARGUMENTS it was called with, and that configuration is shared across every proxy mocking the same function — one function, one behaviour, the way prod behaves. With raw \`jest.mock()\`, the second proxy would overwrite the first.

**How it works:** \`calledWith([args]).resolves(value)\` — \`[args]\` DESCRIBES a call you expect, \`value\` is what it gets back. A call matching none THROWS unconditionally, naming what was asked for and what was configured.

**MockHandle API:**

| Method | Purpose |
|--------|---------|
| \`handle.calledWith([args])\` | Describe a call + what it gets back; applies to EVERY matching call |
| \`handle.onceFor([args])\` | Same, applies ONCE — when identical calls must get different results |
| \`handle.callsMatching([args])\` | Which calls actually happened with these arguments (use in assertions) |

An unaddressed \`callsMatching([])\` has no \`.at()\`/index — address it, or assert the whole list.

\`calledWith\` / \`onceFor\` return \`{ returns, resolves, rejects, throws, implement }\` — \`.returns()\`/\`.throws()\` hand back the value/error as-is, \`.resolves()\`/\`.rejects()\` wrap it in a Promise (staging async with \`.returns()\` hands back a raw value the caller then calls \`.then()\` on). \`callsMatching([args])\` is a FRESH SNAPSHOT per call, not a live reference — capture it once and poll it and later calls never show up.

**Staging is SHARED across every proxy mocking the same function** — one function, one behaviour. Two proxies describing it at equally low specificity COLLIDE and the later registration silently wins everywhere — two callers of \`readline.createInterface\`, \`fs.readdirSync\` or \`path.join\` do this. Fix with a DISCRIMINATING address — a predicate, or just more arguments — never by reordering construction. Two DIFFERENT results for the SAME address is what \`onceFor\` is for; staging both as \`calledWith\` silently disables the sequence.

**How arguments are compared:**

Describing fewer arguments than the call passes is a PREFIX match — \`['/a/f.json']\` matches \`readFile('/a/f.json', 'utf8')\`. Objects compare only on the keys you write. RegExp matches a string, Date by time, and a FUNCTION is a test you write yourself, for values you cannot know in advance. Most specific wins; when equally specific a live one-shot wins, then the most recent.

**Where's the address, per target:**

| Target | The address |
|---|---|
| \`fs\` reads/writes (\`readFile\`, \`writeFile\`, \`existsSync\`, \`readdir\`, …) | the PATH (arg 0); write body is arg 1 (\`callsMatching([path]).at(-1)?.[1]\`) |
| \`crypto.randomUUID\`, \`Date.now\`, \`Date.prototype.toISOString\`, \`Math.random\`, \`process.cwd\` | NO argument — \`calledWith([])\` is honest, not lazy |

**Check the arguments you describe are the ones the function really receives.** \`calledWith([X])\` only fires if X equals what the outside function is actually called with, and callers often change it on the way down — a broker joining a cwd onto a glob pattern. Read the gateway wrapper to confirm.

### registerSpyOn — Spy on Global Object Methods

\`registerSpyOn\` spies on methods of global objects (process, Date, crypto, Math, etc.) and returns a \`SpyOnHandle\` — an alias of \`MockHandle\`, with the identical \`calledWith\`/\`onceFor\`/\`callsMatching\` API. Throw-on-unmatched is unconditional, EXCEPT \`registerSpyOn({ passthrough: true })\`, where the real implementation is the catch-all and never throws.

### The Rest of \`@dungeonmaster/testing/register-mock\`

| Export | Reach for it when |
|---|---|
| \`registerModuleMock({ module, factory })\` | A whole module must be replaced BEFORE it loads, to stop a crash or a side effect. Runtime no-op — the AST transformer hoists it as \`jest.mock()\`. |
| \`requireActual({ module })\` | A parent proxy needs the real implementation of something a child proxy mocked. Wraps \`jest.requireActual\`. |
| \`registerIsolateModules\` | Testing an entry point with top-level side effects. Wraps \`jest.isolateModules\` + \`jest.doMock\`. |

The \`registerModuleMock\` factory carries every name the module's barrel re-exports; a name missing there reads undefined.`;

  // Integration Testing
  const integrationTesting = `**CRITICAL:** Integration tests are **ONLY for startup files and flows**. Use \`.integration.test.ts\` extension, colocated with the file under test — never in a separate test directory.

- **Startup files** — the startup wires up the whole application.
- **Flows** — the flow wires its responders/middleware across the slice it owns (HTTP route → responder → broker, MCP request → handler, hook entry → responder).

**All other code** (brokers, guards, transformers, widgets, responders, etc.) uses **unit tests** (\`.test.ts\`) with colocated proxies.

\`\`\`
src/startup/start-my-app.integration.test.ts  // ✅ colocated; start-my-app.proxy.ts only when setup is complex
test/start-my-app.integration.test.ts         // ❌ separate test directory
\`\`\`

**Debugging integration test timeouts:**

A spawning or polling integration test can time out silently — Jest reports \`Error: thrown: ""\` and \`has no assertions\` against the test file, not the actual failure. When one times out:

1. **Do NOT rerun the test repeatedly.** Each run costs 10-30+ seconds and adds no information.
2. **Trace the code path** from the test's entry to where it blocks — usually a poll for a state that never arrives (polling for \`complete\` when the quest went to \`blocked\`).
3. **Check for swallowed errors:** \`try/catch\` blocks that mark items \`failed\` without surfacing the message; Zod parse failures inside catch handlers are a common culprit.
4. **Search SOURCE, not \`dist/\`:** jest reads source. Use \`discover({ grep: 'oldFieldName' })\`; bash \`grep\` is hook-blocked.`;

  // Recipes and Ingredients
  const recipesAndIngredients = `A recipe is a named, composable way to put the app into a known state. A siegelense \`seed\` step calls it, an e2e spec calls it, and an integration test calls it — the same recipe works everywhere, because a recipe only builds a plan and never decides who runs it.

An ingredient is one entity's routes — its create, read, update and delete operations. Every ingredient declares \`copies:\`, naming the production code its routes imitate. When an ingredient's route breaks, \`copies:\` is where to look first: diff what it copies against what it writes, because a route that no longer matches production is the usual cause.

### Writing a recipe

Write a recipe so an agent who has read only \`docs --for walking\` can pick it up and use it correctly — nothing more.

- **Name each input after the field it fills.** An input called \`guildId\` fills a \`guildId\` field, so a caller can guess the shape without opening the recipe.
- **Give each input, and each field the recipe returns, a one-line meaning.** A bare key name like \`guildId\` says nothing about what value goes in or what comes out.
- **Declare every field the recipe hands back to later steps.** A \`seed\` step names its own result with \`as\` (\`{ "step": "seed", "recipe": "<name>", "as": "g" }\`), and every step after it reaches into that handle — \`{g.guildId}\`, \`{g.guildSlug}\`. An undeclared field is a field the next step cannot know exists.
- **Keep \`makes\` honest.** \`makes\` states the count of each thing the recipe creates. A recipe that creates three quests and reports one hides state an assertion will trip over later.
- **Write the description for the agent who will read it.** That agent has not read the recipe's code and decides whether to reuse it from the description alone.
- **Seed TWO of anything an assertion must tell apart.** A recipe that seeds only one of something makes "the right one" and "the first one" the same value, so an off-by-index bug passes against it and a clean result proves nothing.
- **Compose existing recipes before writing a new one.** Two existing recipes often already combine into the state a new task needs. A new recipe where two would compose makes the book bigger without making it more capable.
- **Prove each recipe with a real run.** Run it against a throwaway instance and read back what it produced. An unproven recipe does not fail loudly — it manufactures a defect that does not exist, because nobody checked its claimed state against its real one.

The \`CLAUDE.md\` in a repo's own \`hydration-recipes\` package is where that repo records the specifics of its own recipes and ingredients — which ones exist, what each one copies, and anything particular to that repo's state.`;

  // Argument Coverage for Entry Points
  const argumentCoverage = `**Every documented argument of an entry point needs a test.** Covering the entry point's default invocation is not covering the entry point — a flag no test ever sets is a flag no test ever proves works.

**"Every argument" means, for each entry point:**

- Each flag present.
- Each flag absent, where absence changes behaviour.
- Each value of a documented enum flag.
- The refusal when a required flag is missing.
- Each documented combination that is mutually exclusive or co-required.

**A test that exercises only the argument PARSER does not cover the argument.** Asserting that a flag parses into the right field proves the parser works, not that the flag does anything. The test must reach the BEHAVIOUR the argument selects — the effect the documentation promises, not the value on the way in.

\`\`\`typescript
// ❌ proves the parser, not the flag: expect(widgetCliArgsParse(['create', '--format', 'json']).format).toBe('json');
// ✅ drives the real command and asserts the effect --format documents
const result = await WidgetCliCreateLayerFlow({ args: { format: 'json' } });
expect(result.output).toMatch(/^\\{/u);
\`\`\`

**A test that stages a boundary with a shape the real producer never emits passes while the feature is broken.** Where an argument crosses a package boundary, the coverage that counts is an integration test running the real code on both sides; a mock invented from the caller's assumptions describes the mock, not the boundary.`;

  // Lint rules that BLOCK the edit (pre-edit hook)
  const editBlockingRules = `The pre-edit-lint hook runs these rules BEFORE your Edit/Write lands. A violation BLOCKS the edit — the file is NOT written, so re-submit the ENTIRE corrected edit, not a surgical follow-up (nothing was applied). Top offenders when writing tests:

- **Conditionals in tests** (\`jest/no-conditional-in-test\`, upstream): no \`if\`/ternary/\`&&\`/\`switch\`/\`try-catch\` in a test body — split into \`it\` blocks or \`it.each\`.
- **Ad-hoc / inline structural types** (\`@dungeonmaster/ban-adhoc-types\`): no local \`interface\` and no \`x as { foo: string }\` — define our types in contracts/ and import them.
- **Non-exported / nested functions** (\`@dungeonmaster/forbid-non-exported-functions\`): every function must be the file's primary export — no helper declared inside a test or proxy.
- **Invented failures** (\`@dungeonmaster/ban-invented-failures\`): no hand-made \`Error\` given to a mock's \`rejects\`, \`throws\` or a throwing \`implement\`. Stage the wrapper proxy's named scenario or the gateway's recorded-failure stub.
- **Test support in production** (\`@dungeonmaster/ban-test-support-in-production\`): a stub or proxy is imported only from a test or proxy file.
- **Workspace export mocks** (\`@dungeonmaster/ban-workspace-export-mocks\`): no \`registerMock\` of another workspace package's export.
- **Catch-all answers** (\`@dungeonmaster/ban-proxy-catch-all-defaults\`): no always-true predicate in a proxy's \`calledWith\`. Ward's \`ban-proxy-empty-called-with\` adds the empty address for a function that takes arguments.`;

  // No Hooks or Conditionals
  const noHooksConditionals = `**CRITICAL:** in a UNIT test, \`beforeEach\`, \`afterEach\`, \`beforeAll\` and \`afterAll\` are forbidden — \`jest/no-hooks\` and \`jest/require-hook\` refuse them, along with any statement at describe scope. All setup and teardown goes inline in each test.

**An integration or e2e test MAY use them, and the lint config says so**: \`jest/no-hooks\` is turned off for \`*.integration.test.ts\`, \`*.e2e.test.ts\`, \`*.e2e.ts\` and \`*.harness.ts\`, and nowhere else. Those files own child processes, servers and browsers — things that must be started once for a suite and torn down after it, which no amount of inline setup expresses.

**Reach for \`beforeAll\` there when a cost belongs to the SUITE rather than to a test.** Jest brackets \`beforeEach\`/\`afterEach\` inside a test's \`test_start\` to \`test_done\` window; \`beforeAll\` runs outside it (one 500ms sleep: 7ms charged to the first test from \`beforeAll\`, 502ms from \`beforeEach\`). Boot a child, compile a module graph or wait on a live session in \`beforeAll\`, so the first test is not reported as the slow one.

**A unit test has the other half of that mechanism: a STATIC import.** Everything a static import pulls in is transformed when jest requires the test file, before any test starts. A dynamic \`await import(...)\` of a large module graph does it inside the test body instead.

**No conditionals in tests.** An \`if (result.hasError) { expect(...) }\` asserts nothing when the branch is not taken. Write one test per path instead (\`VALID:\` and \`ERROR:\`), each asserting its own complete result.

**Why:** Hooks create implicit dependencies. Conditionals hide what's being tested. Each test should be completely self-contained.`;

  // 100% Branch Coverage
  const branchCoverage = `**You must manually verify test cases against implementation code.** Jest's \`--coverage\` can miss logical branches.

**Method:** Read implementation line by line and create a test for every conditional path:

- **Control flow:** if/else, switch cases, ternary (\`? :\`), try/catch
- **Operators:** optional chaining (\`?.\`), nullish coalescing (\`??\`)
- **Data patterns:** arrays (\`[]\`/single/multiple), strings (\`''\`/one/many chars), loops (0/1/many), boundaries (min/within/max)
- **Async:** immediate resolution, delayed resolution, rejected promises
- **React/UI:** dynamic JSX values, conditional rendering (\`&&\`/ternary), event handlers (onClick/onChange/onSubmit)`;

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

## Gateway Proxies and Test Support

${gatewayProxies}

## Jest Home Sandbox

${homeSandbox}

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

## Recipes and Ingredients

${recipesAndIngredients}

## Argument Coverage for Entry Points

${argumentCoverage}

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
- [ ] Proxies use registerMock/registerSpyOn, set up in the constructor and expose semantic methods; each stub and proxy imported from its own file; a gateway wrapper's proxy composed, never re-mocked
- [ ] No \`calledWith([])\` catch-all for a function that takes arguments; failures from a named scenario or a recorded stub
- [ ] toStrictEqual for objects/arrays; no hooks; no conditionals; every branch verified; DSL logic in integration tests; \`it.each\` for 3+ cases differing only by input; every documented entry-point argument covered through real code
`;

  return markdown;
};
