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
import {UserStub} from '../contracts/user/user.stub';

const user = UserStub({id: userId});                         // ✅ the stub infers the type
const other: ReturnType<typeof UserStub> = UserStub({id});   // ❌ redundant annotation

type User = ReturnType<typeof UserStub>;                     // ✅ only for a signature
const processUser = ({user}: {user: User}): void => { /* ... */ };
\`\`\`

**Why:** Stubs are the single source of truth for test data, and they return typed values already.

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
    mantineRenderMiddleware({ ui: <ExecutionPanelWidget quest={QuestStub({ status })} /> });
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
          └─ readFileIfExists (REAL) ← Real gateway wrapper code
              └─ fs.promises.readFile (MOCKED) ← Caught by the I/O trap, staged through the wrapper's proxy

Mocked: what the I/O trap or MSW catches, and globals a test pins. Everything else runs real.
*Exception: logic in an external system's DSL/query language (ESLint, SQL, GraphQL) runs against the real system in an integration test
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
| Flows/Startup | ✅ Sometimes | Integration tests with .integration.proxy.ts for complex setup (spawning processes, clients) |`;

  // Proxy Patterns Overview
  const proxyPatterns = `**Detailed proxy patterns for each folder type** - Use \`get-folder-detail({ folderType: "..." })\` to see specific examples: brokers, bindings, widgets, responders, middleware, state, guards.

**Empty Proxy Pattern:**

\`\`\`typescript
// Pure functions, pass-through wrappers - no mocking needed
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

A constructor-level \`calledWith([])\` belongs only to a function that takes no arguments (\`randomUUID\`, \`Date.now\`, \`process.cwd\`), where \`[]\` is the only address there is. A function that takes arguments never gets a constructor default: an unstaged call must throw, so the I/O trap can name the call the proxy forgot. \`ban-proxy-empty-called-with\` and \`ban-proxy-catch-all-defaults\` refuse both the empty address and a predicate that is always true.

**No direct mock manipulation:** tests call semantic proxy methods. \`registerMock\`, \`jest.mocked()\`, \`jest.spyOn()\` and \`jest.mock()\` belong inside the proxy, never in a test file.

\`\`\`typescript
// ✅ CORRECT - semantic method; registerMock lives inside the gateway wrapper's proxy
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

const proxy = readFileProxy();
proxy.returns({path: '/repo/config.json', contents: '{}'});

// ❌ WRONG - either of these in a test file
jest.mocked(readFile).mockResolvedValue('{}');
registerMock({ fn: readFile }).calledWith(['/repo/config.json', 'utf8']).resolves('{}');
\`\`\``;

  // Child Proxy Creation
  const childProxies = `**When to assign child proxy to variable:** you call methods on it (the delegation pattern), or you use it in the return object.

**When to just call it without assignment:** empty proxies returning \`{}\`, needed only to satisfy \`enforce-proxy-child-creation\`, which you never interact with.

Assign first, then call setup on the Identifier — \`const fileProxy = readFileProxy(); fileProxy.returns(...)\`. Never chain setup off the constructor call: \`enforce-proxy-patterns\` only recognises the Identifier form. The Global Function Mocking example below shows the whole shape.`;

  // Global Function Mocking
  const globalMocking = `ANY proxy can mock globals if the code being tested uses them. Not just brokers! Use \`registerMock\` exactly as you do for module mocks:

\`\`\`typescript
import { randomUUID } from '#gateway/node/crypto';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const userCreateBrokerProxy = () => {
  const fileProxy = writeFileProxy();
  // calls are matched on arguments, so globals collide with nothing
  const uuidHandle = registerMock({ fn: randomUUID });
  uuidHandle.calledWith([]).returns('f47ac10b-...'); // no args to key on — the honest catch-all

  return {
    setupUserCreate: ({path}: {path: string}): void => fileProxy.succeeds({path}),
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
  const staticsProxy = `**A statics proxy is empty.** It mutates nothing, because a constant is immutable. To exercise an edge value, pass it into the function under test. Use \`registerSpyOn\` only for a getter.

\`\`\`typescript
export const mcpServerStaticsProxy = (): Record<PropertyKey, never> => ({});
\`\`\``;

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
  const readFileGateway = readFileProxy();
  const globGateway = globProxy();

  return {
    setupFiles: ({ files, root, pattern, ignore }) => {
      globGateway.returns({
        pattern: \`\${root}/\${pattern}\`,
        options: { cwd: root, ignore },
        matches: files.map((f) => f.filepath),
      });
      for (const { filepath, contents } of files) {
        readFileGateway.returns({ path: filepath, contents });
      }
    },
  };
};
\`\`\`

A caller's proxy never \`registerMock\`s the wrapper's underlying outside function itself: only the wrapper's own proxy does that.

### No catch-all answers

No \`calledWith([])\`, and no predicate that is always true, in a proxy constructor for a function that takes arguments. Stage each call by its arguments, so a call the proxy forgot throws. Two opt-in shapes stay inside that rule because nothing stages them by default: a scenario method that answers any path for a virtual file tree (\`setupImplementation\`), and a wrapper proxy's lower-ranked fallback addressed by the path alone (\`returnsOnceFallback\` on \`readFileProxy\`). Every exact stage outranks both.

### A contract field branded \`'#Gateway<Type>'\` takes the gateway's stub

A stub argument for such a field takes the gateway's stub, imported from its own file. A partial fake does not compile.

\`\`\`typescript
import { ErrorStub } from '#gateway/browser/Error/error.stub';

const result = UseQuestSummaryResultStub({ error: ErrorStub() });
\`\`\`

### Build a failure from a recorded one

A failure comes from a wrapper proxy's named scenario, such as \`readFileProxy().missing({ path })\`, or from a recorded-failure stub in the gateway, such as \`FileMissingErrorStub\`. Never a hand-made \`Error\`: its shape is the one you imagined, not the one Node produces, and \`ban-invented-failures\` refuses it.

\`\`\`typescript
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const fileProxy = readFileProxy();
fileProxy.missing({ path: '/repo/config.json' });
fileProxy.throwsMatchingPath({ path: '/repo/other.json', error: FileMissingErrorStub({ path: '/repo/other.json' }) });
\`\`\`

### Never mock another workspace package's export

Never \`registerMock\` another workspace package's export. Compose the proxy it ships beside its API, such as \`StartOrchestratorProxy\`. \`ban-workspace-export-mocks\` refuses the mock.

\`\`\`typescript
// responders/quest/handle/get-quest-work-layer-responder.proxy.ts
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

export const GetQuestWorkLayerResponderProxy = () => {
  const orchestrator = StartOrchestratorProxy();
  // ...semantic methods that delegate to orchestrator
};
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
// ❌ WRONG - magic number in the contract
export const processResultContract = z.object({
  exitCode: z.number().int().min(0).max(255).brand<'ProcessResultExitCode'>(),
});

// ✅ CORRECT - statics/process-result/process-result-statics.ts
export const processResultStatics = { limits: { maxExitCode: 255 } } as const;

// ✅ contracts/process-result/process-result-contract.ts
export const processResultContract = z.object({
  exitCode: z
    .number()
    .int()
    .min(0)
    .max(processResultStatics.limits.maxExitCode)
    .brand<'ProcessResultExitCode'>(),
});
\`\`\`

**Same principle applies to lists and enumerations** — see Parameterize State Matrices above for the full \`it.each\` derive-from-statics rule.`;

  // EndpointMock (StartEndpointMock)
  const endpointMock = `Use \`StartEndpointMock\` for **any test that needs to mock HTTP responses** — broker tests, widget integration tests, or any layer that ultimately calls a fetch gateway wrapper. **Always via the broker proxy layer** — never call it directly in a test file.

**Do NOT use it for** non-HTTP I/O (filesystem, child process — those use the gateway wrapper proxies).

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

  return {
    setupMerge: ({ merging }: { merging: boolean }): void =>
      jsonFetchProxy.setupSuccess({ ...address, body: { merging } }),
    setupError: (): void => jsonFetchProxy.setupConnectionRefused(address),
  };
};
\`\`\`

**The full chain:** Test → Widget Proxy → Binding Proxy → Broker Proxy → the fetch wrapper's proxy → \`StartEndpointMock.listen()\` → MSW. Each layer delegates setup to the layer below, and the fetch wrapper's proxy (\`fetchJsonProxy\` in \`@gateway/browser\`) is the only layer that calls \`StartEndpointMock\`.

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

### Bring the Page to the Front Before Measuring Geometry

A page that is not the active tab reads \`document.visibilityState === "hidden"\`, and Chromium then stops committing layout frames — so every node reads invisible with a zero-ish bounding box. That looks exactly like a product bug and has cost real debugging time. Before ANY \`boundingBox()\`, width, height, overflow or visibility assertion: call \`page.bringToFront()\`, take a \`page.screenshot()\` to force a frame, assert \`document.visibilityState\` is \`'visible'\`, and only then measure.

\`\`\`typescript
// <e2e-eligible-package>/src/flows/session-view/transcript-broken-image.e2e.ts
await page.bringToFront();
await page.screenshot();
const visibilityState = await page.evaluate(() => document.visibilityState);
expect(visibilityState).toBe('visible');

const box = await images.readBrokenThumbnailBoundingBox({ page });
expect(box).toStrictEqual({ width: sizePx, height: sizePx });
\`\`\`

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

- \`*.harness.ts\` → gateway wrappers (\`#gateway/node/fs\`, \`#gateway/node/path\`, ...), contracts/stubs, other harnesses, test framework APIs. An outside package, Node built-ins included, is imported through the gateway here too.
- \`*.e2e.ts\` / \`*.integration.test.ts\` → harnesses and contracts/stubs only
- **Scenario files CANNOT import:** node:fs, node:path, node:os, node:child_process, .proxy.ts files
- **Harness files CANNOT import:** .proxy.ts files, contract value imports (use .stub.ts)
- **Unit test files CANNOT import:** .harness.ts files

### Mock Boundary Rules

Only mock external services that are: not under your control, have no test mode, and are non-deterministic or costly.

**Valid mocks:** LLM CLI → fake binary, payment processor without sandbox → stub HTTP server
**Invalid mocks:** Your own HTTP endpoints, your own WebSocket messages, your own brokers or gateway wrappers

### Scenario File Rules

Scenario files are **scenario descriptions only** — test blocks and assertions, no infrastructure.

**Banned:** \`import {writeFileSync} from 'fs'\`, \`import * as path from 'path'\`, top-level helper functions, \`page.waitForTimeout(N)\`, \`page.route(...)\`

**Allowed:** imports from \`test/harnesses/\`, test framework APIs, \`expect()\`, \`await page.*\`, constants, inline test data`;

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
| \`crypto.randomUUID\`, \`Date.now\`, \`Date.prototype.toISOString\`, \`Math.random\`, \`process.cwd\` | NO argument — \`calledWith([])\` is honest, not lazy |

**Check the arguments you describe are the ones the function really receives.** \`calledWith([X])\` only fires if X equals what the outside function is actually called with, and callers often change it on the way down — a broker joining a cwd onto a glob pattern. Read the gateway wrapper to confirm.

\`\`\`typescript
// The gateway wrapper's own proxy, at the I/O boundary
export const writeFileProxy = () => {
  const handle = registerMock({ fn: writeFile });

  return {
    succeeds: ({ path }: { path: string }): void =>
      handle.calledWith([path]).resolves(undefined),
    // Answers for this path only
    writtenContentsFor: ({ path }: { path: string }): unknown =>
      handle.callsMatching([path]).at(-1)?.[1],
  };
};
\`\`\`

Globals work identically — see Global Function Mocking above.

### registerSpyOn — Spy on Global Object Methods

\`registerSpyOn\` spies on methods of global objects (process, Date, crypto, Math, etc.) and returns a \`SpyOnHandle\` — an alias of \`MockHandle\`, with the identical \`calledWith\`/\`onceFor\`/\`callsMatching\` API. Throw-on-unmatched is unconditional, EXCEPT \`registerSpyOn({ passthrough: true })\`, where the real implementation is the catch-all and never throws.

\`\`\`typescript
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
stdoutSpy.calledWith(['done\\n']).returns(true); // addressed by the written string; assert it via callsMatching

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
// The factory carries every name the module's barrel re-exports; a name missing here reads undefined.
registerModuleMock({
  module: 'eslint-plugin-jest',
  factory: () => ({ default: { rules: {}, configs: {} }, rules: {}, configs: {}, environments: {}, meta: {} }),
});
\`\`\``;

  // Integration Testing
  const integrationTesting = `**CRITICAL:** Integration tests are **ONLY for startup files and flows**. Use \`.integration.test.ts\` extension, colocated with the file under test — never in a separate test directory.

- **Startup files** — validate that the startup wires up the entire application correctly.
- **Flows** — validate that the flow wires its responders/middleware correctly across the slice it owns (e.g., HTTP route → responder → broker, MCP request → handler, hook entry → responder).

**All other code** (brokers, guards, transformers, widgets, responders, etc.) uses **unit tests** (\`.test.ts\`) with colocated proxies.

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

  // Recipes and Ingredients
  const recipesAndIngredients = `A recipe is a named, composable way to put the app into a known state. A siegelense \`seed\` step calls it, an e2e spec calls it, and an integration test calls it — the same recipe works everywhere, because a recipe only builds a plan and never decides who runs it.

An ingredient is one entity's routes — its create, read, update and delete operations. Every ingredient declares \`copies:\`, naming the production code its routes imitate. When an ingredient's route breaks, \`copies:\` is where to look first: diff what it copies against what it writes, because a route that no longer matches production is the usual cause.

### Writing a recipe

Write a recipe so an agent who has read only \`docs --for walking\` can pick it up and use it correctly — nothing more.

- **Name each input after the field it fills.** An input called \`guildId\` fills a \`guildId\` field, so a caller can guess the shape without opening the recipe.
- **Give each input, and each field the recipe returns, a one-line meaning.** A bare key name like \`guildId\` says nothing about what value goes in or what comes out.
- **Declare every field the recipe hands back to later steps.** A \`seed\` step names its own result with \`as\` (\`{ "step": "seed", "recipe": "<name>", "as": "g" }\`), and every step after it reaches into that handle — \`{g.guildId}\`, \`{g.guildSlug}\`. An undeclared field is a field the next step cannot know exists.
- **Keep \`makes\` honest.** \`makes\` states the count of each thing the recipe creates. A recipe that creates three quests and reports one hides state an assertion will trip over later.
- **Write the description for the agent who will read it, not for yourself.** That agent has not read the recipe's code and decides whether to reuse it or write a new one from the description alone.
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
// ❌ WRONG - proves the parser assigns the field, proves nothing about what --format does
const args = widgetCliArgsParse(['create', '--format', 'json']);
expect(args.format).toBe('json');

// ✅ CORRECT - drives the real command and asserts the effect --format documents
const result = await WidgetCliCreateLayerFlow({ args: { format: 'json' } });
expect(result.output).toMatch(/^\\{/u);
\`\`\`

**A test that stages a boundary with a shape the real producer never emits passes while the feature is broken.** Where a flow's argument crosses a package boundary, the coverage that counts is an integration test running the real code on both sides. A unit test whose mock is the only description of that boundary describes the mock, not the boundary, and the two can drift apart with nothing to catch it — a mock invented to match the caller's assumptions, not the producer's real output, is how a documented flag ships broken.

**Restated:** a green suite that never drove a flag through its real path is not evidence the flag works. Cover the default invocation AND the full argument surface — every documented flag, every enum value, every required-flag refusal, every mutually exclusive or co-required combination — crossing every package boundary for real.`;

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

**Reach for \`beforeAll\` there when a cost belongs to the SUITE rather than to a test.** Jest measures a test from \`test_start\` to \`test_done\` and brackets \`beforeEach\`/\`afterEach\` inside that window; \`beforeAll\` runs outside it. Measured with one 500ms sleep in three placements: 7ms charged to the first test from \`beforeAll\`, 502ms from \`beforeEach\`, 505ms from \`afterEach\`. So booting a child, compiling its module graph or waiting on a live session belongs in \`beforeAll\`, with the \`it\` blocks asserting on what it captured — otherwise whichever test happens to run first is reported as the slow one.

**A unit test has the other half of that mechanism: a STATIC import.** Everything a static import pulls in is transformed when jest requires the test file, before any test starts. A dynamic \`await import(...)\` of a large module graph does it inside the test body instead.

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
- [ ] Proxies use registerMock/registerSpyOn (not jest.mocked/jest.spyOn) and set up in constructor
- [ ] Tests use semantic proxy methods (never registerMock/jest.mocked directly in tests)
- [ ] Each stub and proxy imported from its own file; a gateway wrapper's proxy composed, never re-mocked
- [ ] No \`calledWith([])\` or always-true predicate for a function that takes arguments; failures from a named scenario or a recorded stub
- [ ] Used toStrictEqual for objects/arrays (no weak matchers)
- [ ] No beforeEach/afterEach hooks
- [ ] No conditionals in tests
- [ ] All branches manually verified against implementation
- [ ] Each test is self-contained and isolated
- [ ] DSL/query logic uses integration tests (real execution)
- [ ] Parameterized state matrices with \`it.each\`/\`describe.each\` when 3+ cases differ only by input value
- [ ] Every documented argument of an entry point is covered — each flag present, each flag absent, each enum value, the required-flag refusal, each mutually exclusive or co-required combination — reaching real behaviour across any package boundary it crosses
`;

  return markdown;
};
