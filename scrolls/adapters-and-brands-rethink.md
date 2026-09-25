# Adapters and branded types: what they buy, what replaces them

> **Superseded in part by `scrolls/brands-types-adapters-rules.md`.** That doc replaces this one's
> areas A and D, and the adapter half of area F. Dungeonmaster ships no adapters for other repos'
> production code: each repo keeps its own adapters. Area B (the unit-test I/O trap and its record),
> area C (proxies), area E (JSX) and the handoff below still stand.

Every number here comes from a scan or a test run made on 2026-09-24. The scan scripts are in `tmp/`
(`adapter-behavior-scan.mjs`, `catchall-scan.mjs`, `lookalike-scan.mjs`) and the trap experiment in
`tmp/trap-exp/`; all can be re-run. What is built so far is in "Status and order of work" near the end.

## The question

Dungeonmaster makes every repo it maintains wrap each npm and Node function in an adapter, and brand
every returned value with a Zod contract. The models maintaining those repos keep producing adapters
that only forward, contracts that check nothing, and brands that leak. **Do adapters and branded types
earn their cost in repos that only models maintain — and if not, what does?**

## What we found

### Rules nothing checks produce hollow compliance

| Rule                                                        | Did anything check the quality?       | What models produced                                                                                                           |
|-------------------------------------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| No `string` or `number` in a return type (`ban-primitives`) | no                                    | `ContentText` — `z.string().brand<'ContentText'>()`, checking nothing, used in 263 files so text returns have a brand to carry |
| Path contracts                                              | no                                    | 16 path contracts in 10 packages, most checking nothing; `FilePath` defined in 6 packages with 3 meanings                      |
| Wrap npm types in contracts                                 | no                                    | eslint-plugin's 597-line hand copy of ESTree; `TypescriptSourceFile` pasted over `as unknown as`                               |
| Brand the Jest report                                       | no                                    | `JestSuiteName` on what is really a file path, every field optional                                                            |
| Adapters handle failures                                    | no                                    | 94 of 347 adapters forward one call; 97 more only forward to another dungeonmaster package                                     |
| Failures staged in tests                                    | no                                    | "file not found" built without Node's `code` 193 times                                                                         |
| `GuildId` is a UUID                                         | **yes — the parse fails on bad data** | works                                                                                                                          |
| `AbsoluteFilePath` in shared                                | **yes — the parse fails on bad data** | works                                                                                                                          |

### Handling lives everywhere except the adapter

The "missing file" handling an adapter should hold is written at the call sites instead:
`fsReadFileAdapter` sits inside `try`/`catch` at 35 sites in 7 packages and behind `.catch` at 30
sites in 6 more, written four different ways (`catch {}` with a comment, `catch { return []; }`,
`.catch(() => null)`, and digging through `error.cause` for `ENOENT`).

### Proxies stage failures the real thing never produces

347 adapter proxies define 359 distinct method names. 179 take a generic `error`, so each test
invents its failure. "File not found" is built without the `code` Node always sets 193 times, and
with it 70 times. Of the 92 implementations tested with a code-less error, 64 catch errors
themselves, and 58 of those catch everything — the only shape that passes such a test.

One of them loses user data. `mcp/.../settings-permissions-add-broker.ts:62-67` swallows every read
error and leaves the settings as `{}`; line 119 writes the result. A `settings.json` that is
unreadable or has one JSON error is replaced by a file holding only `permissions`, losing the user's
other settings, including the hooks other installers wrote. (Found by reading, not by running.)

Across packages it is the same. mcp wraps 17 `StartOrchestrator` methods and server 42; 7 are wrapped
by both, each with its own proxy. The real `getQuest` reports failure as `{ success: false }`
(`quest-get-broker.ts:77-80`), but consumer tests stage thrown errors 40 times and `success: false`
4 times. So `quest-pause-responder.ts:40`, the "Quest not found" branch the real system takes, has
no test.

90 adapter proxies stage a `calledWith([])` answer, which matches every call. 22 are honest, because
the function takes no arguments. At least 44 put a canned answer in the proxy constructor for a
function that takes arguments, so any unexpected call quietly succeeds.

### Folder rules push code into the wrong home

Widgets may not import `@xyflow/react`, so React components live in `web/src/adapters/xyflow/`.
Tests may reach npm only through adapters, so 4 `testing-library` wrappers and `mantine-render` sit
in `web/src/adapters` with no production user. In web, 26 of 38 adapter proxies are empty.

### Brands are mostly labels, and they leak

| What a shared brand's contract checks          | Brands | Most used (files using it)                                   |
|------------------------------------------------|--------|--------------------------------------------------------------|
| Nothing                                        | 11     | `ContentText` (263), `ErrorMessage` (104), `Identifier` (92) |
| Only "not empty"                               | 23     | `QuestId` (241), `SessionId` (93), `ProcessId` (75)          |
| A real check (uuid, regex, refine, int, range) | 44     | `AbsoluteFilePath` (394), `GuildId` (93), `ExitCode` (31)    |

- `QuestId` is `z.string().min(1)`; its stub defaults to `'add-auth'`, and a test passes `'test-quest'`.
- Production code has 30 parameters named `questId` and 25 named `timeoutMs` typed as a plain
  `string` / `number`. `ban-primitives` allows raw parameter types, so a model can pass `'op-id-1'`.
- Zod brands are keyed by name, so all six `FilePath` contracts are one type to TypeScript. An
  unchecked copy passes wherever the checked one is expected.
- Where a brand checks something real, it catches bad data at the first line. That part works.

## The principle

**A rule works when a machine can tell a good answer from a hollow one.** Every failure above is a
rule whose only check was that the model complied. Models also relearn every convention each
session, because none of it is in their training, so a rule must be taught at the moment of the
mistake — by a lint or compiler message that names the fix — not by doctrine read up front.

**No rule is a list a model can edit.** "These packages may skip an adapter" becomes a list, and
models add to lists to get past errors. Every rule below checks structure, runtime behavior, or the
repo's own code.

## The solution

Six areas. Each shows what changes in code — before, after, and what stays — and the lint rules that
enforce it: what each rule flags, what it leaves alone, and why. "An I/O call" means a call to a
function imported from a Node I/O module (`fs`, `fs/promises`, `child_process`, `net`, `http`,
`https`, `dgram`, `dns`) or to the `fetch` global.

### A. Production code calls I/O directly; adapters hold handling

An adapter exists to hold handling — code that decides what happens when an I/O call fails, or
controls repeating or timing around it. A plain call needs no adapter.

```typescript
// before — an adapter that only forwards, plus its proxy and test
export const fsRenameAdapter = async ({ from, to }) => { await rename(from, to); return { success: true }; };
await fsRenameAdapter({ from, to });

// before — the handling that should be in the adapter, repeated at each caller
const raw = await fsReadFileAdapter({ filePath }).catch(() => null);

// after — a plain call imports the function
import { rename } from 'node:fs/promises';
await rename(from, to);

// after — handling lives in one adapter, chosen by what it handles, not by what the caller is for
import { fsReadFileIfExistsAdapter } from '@dungeonmaster/shared/adapters';
const raw = await fsReadFileIfExistsAdapter({ filePath });   // undefined when missing

// unchanged — reshaping the result is the caller's job
const config = configContract.parse(JSON.parse(raw));
```

**Dropped:** dungeonmaster ships no adapters for other repos (see `brands-types-adapters-rules.md`,
A5 and decision 4). Each repo keeps these in its own adapters package. The original text follows.

Adapters with handling that every repo needs ship once, in `@dungeonmaster/shared/adapters`:
`fsReadFileIfExistsAdapter`, `fsEnsureWriteAdapter`, `fsRmIfExistsAdapter`,
`childProcessSpawnCaptureAdapter`, `childProcessSpawnStreamLinesAdapter` (required `onLine`), and
whatever else the clone detector finds repeated. A repo keeps its own handling in its own `adapters/`
folder. A clone detector compares adapters with literals abstracted: two that differ only in a
literal become one adapter with a parameter; two that differ in structure are two behaviors.

A cross-package call is a plain call too: server and mcp call `StartOrchestrator.getQuest(...)`
directly, with no forwarding adapter in between.

#### Rule 1 — handling around an I/O call lives in an adapter

The message names the shipped adapter when one matches, otherwise the package's `adapters/` folder.
Each row is the same call, left alone on the left and flagged on the right outside `adapters/`:

| Left alone — a failure reaches the caller                                          | Flagged — the code decides what a failure means                                         |
|------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| `await readFile(p)`                                                                | `try { await readFile(p) } catch { return defaults }`                                   |
| `await readFile(p)`                                                                | `readFile(p).catch(() => null)`                                                         |
| `readFile(p).then(parse)`                                                          | `readFile(p).then(parse, () => null)`; also `.then(undefined, onError)`                 |
| `await readFile(p)`                                                                | `readFile(p).finally(close)`                                                            |
| `await Promise.all([readFile(a), readFile(b)])` — the first rejection propagates   | `await Promise.allSettled([readFile(a), readFile(b)])` — each rejection is absorbed     |
| `await fetch(primary)`                                                             | `await Promise.any([fetch(primary), fetch(mirror)])` — a failure falls back             |
| `await fetch(url)`                                                                 | `await Promise.race([fetch(url), timeout(5000)])` — a timeout decides                   |
| `await pipeline(source, destination)` (promise form)                               | `pipeline(source, destination, (err) => …)`                                             |
| `for await (const chunk of createReadStream(p))` — a stream error rejects the loop | `createReadStream(p).on('error', onError)`                                              |
| `await readFile(p)`                                                                | `fs.readFile(p, (err, data) => { if (err) … })` — error-first callback                  |
| `await readFile(p)`                                                                | `new Promise((resolve, reject) => { s.on('error', reject) })` — wrapping a callback API |
| `readFileSync(p)`                                                                  | `if (existsSync(p)) { readFileSync(p) }` — check, then use                              |
| `await fetch(u)`                                                                   | `for (…) { try { return await fetch(u) } catch {} }` — retry                            |
| `throw error`                                                                      | `if (error.code === 'ENOENT') …` — branching on the failure                             |

Never flagged: reshaping a result, and a `try` whose block holds no I/O call, such as a responder
turning its own broker's error into a 500.

Why: handling written in one adapter, with its own tests, is written right once. Written at each
call site, it drifts into four versions and its failure branch goes untested.

#### Rule 2 — an adapter must hold handling

```typescript
// flagged — one call, no handling
export const fsRenameAdapter = async ({ from, to }) => { await rename(from, to); return { success: true }; };
// flagged — one call plus reshaping
export const fsReadJsonAdapter = async ({ filePath }) => JSON.parse(await readFile(filePath, 'utf8'));

// left alone — decides what "missing" means
export const fsReadFileIfExistsAdapter = async ({ filePath }) => {
  try { return await readFile(filePath, 'utf8'); }
  catch (error) { if (isNotFoundError(error)) return undefined; throw error; }
};
// left alone — a required line callback over a spawned process is a design decision
childProcessSpawnStreamLinesAdapter({ command, args, cwd, onLine });
```

Why: an adapter that only forwards is a file, a proxy and a test that add nothing, and forwarders
drift — mcp's `get-quest` adapter spreads `...(stage && { stage })` where orchestrator uses
`stage !== undefined`, so an empty string behaves differently on each side.

#### Rule 3 — a silent `catch` block is refused, like a silent `.catch(...)`

```typescript
// flagged
try { … } catch { /* file doesn't exist or is invalid JSON - will create new settings */ }
try { … } catch (error) {}

// left alone
try { … } catch (error) { process.stderr.write(`[settings] read failed: ${String(error)}\n`); }
try { … } catch (error) { if (isNotFoundError(error)) return undefined; throw error; }
```

Why: a comment is not handling. The block form is how the settings broker above swallows an
unreadable file and overwrites it.

### B. Unit tests cannot reach real I/O

A setup file in `@dungeonmaster/testing`, loaded by every package's jest config, traps `fs`,
`fs/promises` and `child_process` in every unit test. A call nothing staged fails the test and names
itself — even when the code under test catches the error, because every trapped call is recorded and
checked after the test.

```typescript
// before — an unstaged read hits the real disk; a catch-everything broker turns it into a pass
it('VALID: {…} => returns defaults', async () => {
  const result = await guildConfigReadBroker({ guildPath });   // reads the real disk, unnoticed
  expect(result).toStrictEqual(defaults);
});
```

```text
after — the same test fails:
Test did real I/O that nothing staged. Stage it through a proxy, or move the test to an integration test:
  [io-trap] unstaged fs/promises.readFile("/home/…/guild.json")
```

How the trap decides, in order — each rule is structural, none is a list:

| A call passes through when                                                                                       | Why                                                                                            |
|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| the test file is an `.integration.test` or `.e2e` file                                                           | those do real I/O by design                                                                    |
| its path is inside `node_modules`                                                                                | a package loading its own files                                                                |
| it reads a fixture under a package's own `test/` directory                                                       | fixtures are test infrastructure                                                               |
| it is a read made by the TypeScript compiler itself                                                              | a type-level test compiles real source, like any DSL engine the testing standards run for real |
| the first repo file on the call stack is a `.test`, `.proxy`, `.stub` or `.harness` file, or lives under `test/` | test code recording a proxy's data from the real thing                                         |

Everything else from implementation code is trapped. The trap is built from plain functions, not
`jest.fn`, so the per-test mock reset cannot disable it, and it reads the call stack as structured
call sites, not as a string, which keeps a real TypeScript compile at 502 ms against 285 ms untrapped.

The proxy-mock hoister keeps every function a proxy did not name trapped, instead of real:

```typescript
// before — mocking readFile left stat, writeFile, mkdir … doing real I/O
jest.mock('fs/promises', () => ({ ...jest.requireActual('fs/promises'), readFile: jest.fn() }));

// after — trapped in unit tests, real in integration tests
jest.mock('fs/promises', () => ({
  ...(globalThis.__ioTrap?.('fs/promises') ?? jest.requireActual('fs/promises')),
  readFile: jest.fn(),
}));

// unchanged — how a proxy mocks a function
registerMock({ fn: readFile }).calledWith([filePath]).resolves(content);
```

A package must do no I/O when imported. The orchestrator's six passive watchers start from
`StartOrchestrator.bootstrap()`, which each host process calls at boot:

```typescript
// before — at module scope in start-orchestrator.ts: importing the barrel started six pollers and watchers
ExecutionQueueFlow.bootstrap();  RateLimitsFlow.bootstrap();  // …four more

// after
export const StartOrchestrator = { bootstrap: () => { /* the same six */ }, … };
// server: OrchestrationBootFlow → StartOrchestrator.bootstrap(), then the server-only normalizeDispatchBoot()
// mcp:    StartMcpServer → OrchestrationBootFlow → StartOrchestrator.bootstrap()
```

### C. Proxies come from the owner of the real thing, with recorded failures

Node's I/O gets one shared proxy per module in `@dungeonmaster/testing`, whose failures are captured
once from real Node inside a testbed — `ENOENT`, `EACCES`, `EISDIR`, a non-zero exit — with the `code`,
`errno`, `syscall` and `path` Node really sends. A workspace package ships the proxy for its own API
in its `testing.ts` barrel, and its own tests check each scenario against its real code.

```typescript
// before — each test invents the failure; each consumer writes its own copy of another package's proxy
proxy.throws({ filePath, error: new Error('ENOENT') });
handle.calledWith([{ questId }]).rejects(new Error('not found'));   // real getQuest never throws this

// after
const fs = fsProxy();                          // @dungeonmaster/testing
fs.fileMissing({ path: settingsPath });        // recorded from real Node
fs.fileContains({ path, content });
fs.writtenTo({ path });

const orchestrator = startOrchestratorProxy(); // @dungeonmaster/orchestrator/testing
orchestrator.questNotFound({ questId });       // { success: false, error } — the real shape

// unchanged — broker proxies compose child proxies and expose scenario methods
export const guildConfigReadBrokerProxy = () => {
  const fs = fsProxy();
  return { setupNoConfig: ({ configPath }) => fs.fileMissing({ path: configPath }) };
};
```

The hoister follows imports of every `@dungeonmaster/*/testing` barrel and the shared proxies, so
their `registerMock` calls are hoisted like any `.proxy.ts` file's. A whole npm package that cannot run
in the test environment (no canvas, no GPU, ESM-only) is replaced through jest's `moduleNameMapper`,
as web already does for `elkjs`; a proxy then imports the package and mocks its functions as usual.

#### Rule 4 — no match-everything default in a proxy constructor

For a function whose declared signature takes arguments:

```typescript
// flagged — every unexpected read now "succeeds" with ''
export const fsReadFileProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  mock.calledWith([]).returns('');
  return { … };
};

// left alone
registerMock({ fn: randomUUID }).calledWith([]).returns(uuid);                  // no arguments: [] is the only address
mock.calledWith([filePath]).returns(content);                                    // addressed
return { existsOnlyFor: ({ filePaths }) => mock.calledWith([isPath]).implement(…) };  // opt-in scenario
```

Why: a constructor default answers calls no test described, so an unexpected call becomes an
invented success — and the trap cannot see it, because the call counts as staged.

#### Rule 5 — no invented failures in a proxy or test

```typescript
// flagged — as the value given to a mock's rejects / throws / a throwing implement
proxy.throws({ filePath, error: new Error('ENOENT') });
handle.calledWith([p]).throws(Object.assign(new Error('x'), { code: 'ENOENT' }));   // still hand-made

// left alone
fs.fileMissing({ path });                                   // recorded failure
orchestrator.questNotFound({ questId });                    // provider-owned scenario
expect(() => run()).toThrow(/^Quest not found$/u);          // asserting what the code under test throws
```

Why: a hand-made failure has the shape the author imagined. Code tested against it learns to catch
everything; code tested against a recorded failure is tested against what Node sends.

#### Rule 6 — no mocking another workspace package's exports

```typescript
// flagged, in server or mcp
registerMock({ fn: StartOrchestrator.getQuest });
registerModuleMock({ module: '@dungeonmaster/orchestrator', factory: () => ({ … }) });

// left alone
const orchestrator = startOrchestratorProxy();   // from @dungeonmaster/orchestrator/testing
registerMock({ fn: readFile });                  // a Node function
```

Why: a consumer's copy of another package's behavior drifts from it. Detected by the import
specifier: it starts with `@dungeonmaster/`, is not a `/testing` subpath, and is not the file's own
package.

### D. A brand is required where a name or a boundary calls for one, and it means something

Every function still declares its return type, and a brand is still minted only by parsing its
contract, never by a cast. What changes is where a brand is required. Today `ban-primitives` refuses
`string` and `number` in any return type, so every function that returns text or a number must return
a brand — and, since only a parse mints one, needs a contract and a parse, even for text no one needs
to name. After: a brand is required where a value's name matches one (rule 8) and where outside data
enters (rule 7); once a value carries a brand, it keeps it (rule 9). A return type may be a plain
`string` or `number` when no brand applies.

```typescript
// before — a text return must be branded, so plain text gets a contract that checks nothing
export const summaryLineTransformer = ({ quest }: { quest: Quest }): ContentText =>
  contentTextContract.parse(`${quest.title} — ${quest.status}`);
// before — the name says QuestId, the type says string
export const pauseQuest = ({ questId }: { questId: string }) => …;

// after — the return type is still declared; plain text is a plain string
export const summaryLineTransformer = ({ quest }: { quest: Quest }): string =>
  `${quest.title} — ${quest.status}`;
// after — the name decides
export const pauseQuest = ({ questId }: { questId: QuestId }) => …;

// unchanged — minting a brand means parsing its contract
const questId = questIdContract.parse(raw);
const questId = raw as QuestId;                  // still refused
```

A contract checks the value's real format where it is known — `GuildId` checks for a UUID and catches
bad data; `QuestId` checks only "not empty" and is the first to settle.

The vocabulary is the repo's own contracts — no hand-kept list — and one package owns each brand name.
Paths use one small checked set in `shared`, and adapters return the most specific type they know:

```typescript
// before — a union that rejects the most common shape, and a type that checks nothing
filePathContract.parse('packages/x.ts');        // throws: needs ./ or an absolute path
({ filepath }: { filepath: PathSegment })        // mcp: "PathSegment validates nothing"

// after
AbsolutePath        // starts with / or C:\ ; process cwd, path.resolve return this
RepoRelativePath    // not absolute: 'packages/x.ts' ; git file lists return this
PathSegment         // one segment, no separator: 'x.ts'

// unchanged — role labels over an absolute path
RepoRootCwd, ProjectRootCwd, GuildPathCwd, DungeonmasterHomeCwd
```

A library's own types are imported with `import type`, anywhere; nothing re-types a library by hand.
A scalar leaving a library object into our code is parsed where it enters a branded slot.

```typescript
// before
// eslint-plugin/contracts/tsestree/tsestree-contract.ts — 597 lines re-typing ESTree
const tsSourceFile = sourceFile as unknown as ts.SourceFile;

// after
import type { TSESTree } from '@typescript-eslint/types';
const filePath = absolutePathContract.parse(sourceFile.fileName);
```

`ban-primitives` stops refusing `string` and `number` in return types; rules 8 and 9 replace that half
of it. Explicit return types stay required.

#### Rule 7 — no cast on parsed JSON or response bodies

```typescript
// flagged
const settings = JSON.parse(text) as Settings;
const settings: Settings = JSON.parse(text);      // JSON.parse returns any: the annotation is a cast
const body = (await response.json()) as QuestList;

// left alone
const settings = settingsContract.parse(JSON.parse(text));
const body: unknown = await response.json();      // unknown until a contract parses it
```

Why: outside data gets exactly one check, where it enters. A cast skips it, and nothing downstream
checks again.

#### Rule 8 — a name matching a brand must use it

With `QuestId`, `SessionId` and `TimeoutMs` in the vocabulary:

```typescript
// flagged
({ questId }: { questId: string })
({ parentSessionId }: { parentSessionId: string })     // ends with SessionId
({ timeoutMs }: { timeoutMs: number })

// left alone
({ questId }: { questId: QuestId })
({ label }: { label: string })                          // no brand called Label
```

Why: a model passes `'op-id-1'` to a `string` parameter and nothing stops it. Defining a contract is
what adds a name to the vocabulary, so another repo's `InvoiceNumber` works the same way, with no
list for anyone to keep.

#### Rule 9 — a brand may not be dropped

```typescript
// flagged
const s: string = quest.id;                              // into a plain slot
const toKey = ({ id }: { id: QuestId }): string => id;  // into a plain return
String(questId); `${questId}`; questId.toString();      // stripping on purpose

// left alone
await readFile(filePath, 'utf8');                        // calling Node or npm
const questPath = `${root}/quests/${questId}.json`;      // building a new value
questId === other.id;                                    // comparing
```

Why: TypeScript lets a branded value into a plain slot silently, and from there it flows on under a
name that no longer says what it is.

#### Rule 10 — brand names are unique across the repo, ignoring case

```typescript
// flagged
z.string().brand<'AbsoluteFilePath'>()   // shared already defines it
z.string().brand<'Filename'>()           // shared defines FileName

// left alone
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
```

Why: brands are keyed by name, so a second contract with the same name makes an unchecked copy
interchangeable with the checked one.

### E. Folder rules check structure, not packages

There are no per-folder npm allowlists. One structural rule replaces them: **JSX may only appear in
`widgets/` and `flows/`.** The xyflow components move to `widgets/`, and the `testing-library`
wrappers move to `@dungeonmaster/testing`. The rules about which of our own folders may import which
stay as they are.

### F. Shipped adapters and proxies are visible to a consumer's models

**Adapters dropped:** dungeonmaster ships no adapters for other repos (see
`brands-types-adapters-rules.md`, A5 and decision 4). What follows still applies to shipped proxies and
stubs, which only tests load.

In a consumer repo the shipped adapters and proxies live in `node_modules/@dungeonmaster/*`, which the
search tools a model uses do not index. They reach a model the way `registerMock` already does:

| Channel                                     | When the model sees it                                          | What it carries                                                                          |
|---------------------------------------------|-----------------------------------------------------------------|------------------------------------------------------------------------------------------|
| The lint error (rules 1 and 5)              | at the moment it writes the handling or the failure             | the exact import, e.g. `fsReadFileIfExistsAdapter` from `@dungeonmaster/shared/adapters` |
| `get-architecture` / `get-testing-patterns` | at session start                                                | a catalog of every shipped adapter and proxy: name, purpose, import path                 |
| A session snippet                           | every session start, in every repo `dungeonmaster init` touched | a pointer to the catalog                                                                 |
| The clone detector                          | when a copy is written anyway                                   | the shipped adapter it duplicates                                                        |

The catalog is generated from the barrel exports (`@dungeonmaster/shared/adapters`,
`@dungeonmaster/testing`) and each file's PURPOSE header, and the lint messages read the same list,
so neither can drift from the code.

## What it costs

- A large migration: most of 347 adapters, each with a proxy and a test, are deleted or rewritten.
- Broker proxies compose shared proxies in place of per-package adapter proxies.
- A function returning text or a number that no brand names returns a plain `string` or `number`,
  where today it must return a brand. The name it carried is lost; a vacuous contract is too.

## Status and order of work

### Handoff: read this first

**Solid:** the findings above (measured, key cases read in full) and area B (built, full ward green,
uncommitted — the user has not yet decided keep, revert, or keep part).

**Not validated: the lint rules and areas A, C and D.** None was run against the repo. The design
came from file-I/O evidence, and the 347 adapters were only scanned by shape (size, `try`, call
count), never sorted by what they do. Known faults:

- Rule 1 keys on "I/O call" (Node modules and `fetch`). It should key on any external call — any
  function imported from outside the package (npm, Node, another workspace package) — decided by the
  import specifier.
- Rule 2 ("an adapter must hold handling") would refuse the most important adapter in the repo,
  `orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts`,
  which encodes the Claude CLI's protocol (flags, `--settings`, env vars, stdio, `CLAUDE_CLI_PATH`).
  The rule should refuse only a pure forward: one external call, parameters passed straight through.
- That adapter's settings read is `try { readFileSync(settings) } catch { /* may not exist */ }` —
  every error swallowed, so an unreadable `settings.json` spawns Claude without the repo's hooks and
  permissions (read, not run). Rule 3 flags it.
- Open conflict: the architecture bars an adapter from importing another adapter, so that read cannot
  call a shipped `fsReadFileIfExistsAdapter`.

### Changes in the working tree

As of 2026-09-24 all of these are **staged in git and not committed** (staged by something other than
the session that wrote them). They are step 2 — area B — and nothing else. Full `npm run ward`
passed with them (run `1790294805205-6478`).

**1. The unit-test I/O trap** — any unit test whose code under test does real `fs` / `fs/promises` /
`child_process` I/O that nothing staged now fails, naming the call.

| File                                                                                                               | Change                                                                                                                                                                                                                                                  |
|--------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `packages/testing/src/jest.setup-io-trap.js`                                                                       | **New.** The trap: plain-function wrappers over the three modules, the pass-through rules (area B table), a recorder that fails the test in `afterEach`, and `globalThis.__ioTrap(name)` for the hoister. Off for `.integration.test` and `.e2e` files. |
| `packages/testing/src/jest.setup.js`                                                                               | One added line, first: `require('./jest.setup-io-trap');` — every package's jest config loads this file.                                                                                                                                                |
| `packages/testing/src/adapters/typescript/mock-calls-to-statements/typescript-mock-calls-to-statements-adapter.ts` | The hoister's generated mock spreads `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)` instead of `jest.requireActual(m)`, so functions a proxy did not name stay trapped in unit tests.                                                              |
| `…/typescript-mock-calls-to-statements-adapter.test.ts`                                                            | Two expected strings updated to the new generated code.                                                                                                                                                                                                 |

**2. Importing orchestrator no longer starts background work** — the six watchers start from an
explicit `StartOrchestrator.bootstrap()`, called by each process at boot. Same six, same two
processes, so production behavior is unchanged.

| File                                                                                       | Change                                                                                                 |
|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| `packages/orchestrator/src/startup/start-orchestrator.ts`                                  | Module-scope bootstrap calls removed; new `StartOrchestrator.bootstrap()` runs all six.                |
| `packages/orchestrator/src/startup/start-orchestrator.integration.test.ts`                 | New test: `bootstrap()` twice returns `{ success: true }` both times.                                  |
| `packages/orchestrator/src/index.proxy.ts`                                                 | Now an empty proxy; it only existed to neutralize import-time timers.                                  |
| `packages/orchestrator/src/index.test.ts`                                                  | The import-order warning removed.                                                                      |
| `packages/server/src/adapters/orchestrator/bootstrap/*` (adapter, proxy, test)             | **New.** Wraps `StartOrchestrator.bootstrap()`.                                                        |
| `packages/server/src/responders/orchestration/bootstrap/*` (responder, proxy, test)        | **New.** Calls that adapter.                                                                           |
| `packages/server/src/flows/orchestration-boot/orchestration-boot-flow.ts`                  | Calls the bootstrap responder, then the existing server-only normalization.                            |
| `packages/server/src/flows/orchestration-boot/orchestration-boot-flow.integration.test.ts` | Uses `serverAppHarness().setupTestHome()`, which restores `DUNGEONMASTER_HOME` instead of deleting it. |
| `packages/server/src/startup/start-server.ts`                                              | Comment only.                                                                                          |
| `packages/mcp/src/adapters/orchestrator/bootstrap/*` (adapter, proxy, test)                | **New.** Same as server's.                                                                             |
| `packages/mcp/src/responders/orchestration/bootstrap/*` (responder, proxy, test)           | **New.** Same as server's.                                                                             |
| `packages/mcp/src/flows/orchestration-boot/*` (flow, integration test)                     | **New.** Starts the watchers in the MCP child; no normalization.                                       |
| `packages/mcp/src/startup/start-mcp-server.ts`                                             | Calls `OrchestrationBootFlow.bootstrap()` before `McpServerFlow`.                                      |

**3. Comments that described import-time bootstraps**, reworded to the present behavior. No code
change: `orchestrator/CLAUDE.md` (section rewritten), `timer-set-interval-adapter.ts`,
`graph-reachability-check-broker.ts`, `process-stale-watch-flow.ts`, the `WHEN-TO-USE` lines of five
bootstrap responders (execution-queue, sync-listener, orchestration-dispatch, normalize-boot,
smoketest), `local-eslint/…/rule-graph-reachability-broker.ts`, and
`server/…/reconcile-watchers-layer-responder.proxy.ts`.

**4. Testing-package tests that did real I/O**, now staged through their proxies.

| File                                                                                                                        | Change                                                                                              |
|-----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| `packages/testing/src/adapters/fs/exists-sync/fs-exists-sync-adapter.proxy.ts`                                              | Was empty; now mocks `existsSync` by path, plus opt-in `existsOnlyFor` / `existsWhereMatching`.     |
| `…/fs-exists-sync-adapter.test.ts`                                                                                          | Stages paths instead of probing real files.                                                         |
| `packages/testing/src/middleware/import-path-resolver/import-path-resolver-middleware.proxy.ts` and `.test.ts`              | Proxy gains `setupFilesOnDisk` / `setupFilesOnDiskMatching`; tests use described paths.             |
| `packages/testing/src/middleware/import-path-resolver/jsx-extension-test-stub.jsx`                                          | **Deleted.** It existed only as a real file for the old test.                                       |
| `packages/testing/src/adapters/typescript/source-file-getter/typescript-source-file-getter-adapter.proxy.ts` and `.test.ts` | Proxy mocks the adapter's fallback `readFileSync`: `fileContains`, `fileMissing`, `readsRealFiles`. |
| `packages/testing/src/middleware/proxy-mock-collector/proxy-mock-collector-middleware.proxy.ts` and `.test.ts`              | Proxy gains `setupProxyFileMissing`.                                                                |

**5. This doc**, `scrolls/adapters-and-brands-rethink.md`.

**Outside git:** `packages/orchestrator/dist/` was rebuilt (`npm run build --workspace=@dungeonmaster/orchestrator`) so
server and mcp typecheck the new
`bootstrap()`. Scratch experiments are in `tmp/` (`trap-exp/`, the scan scripts) and touch nothing.

**To undo all of it:** `git restore --staged --worktree` the modified files, delete the new files and
directories listed above, restore `jsx-extension-test-stub.jsx` with `git restore`, then rebuild
orchestrator so its `dist` matches the source again.

**Next session, before any design change:**

1. Sort all 347 adapters by what they do — read them, split across sub-agents, 1–3 files each: protocol
   to an external system, failure handling, pure forward, pure library, UI component, test tooling,
   cross-package forward. List the adapters any rule must keep.
2. Write each lint rule as a scan, run it over the whole repo, and hand-check a sample of what it
   flags and what it lets through, including the must-keep list.
3. Rewrite areas A, C and D from what survives.

Each step lands before the rule it replaces is removed.

1. **Done.** The trap experiment: a setup file can trap Node's built-in modules for every unit test.
2. **Done, uncommitted.** Area B: the trap, the hoister change, and `StartOrchestrator.bootstrap()`.
   Full `npm run ward` passes (run `1790294805205-6478`: lint, typecheck, unit 3,757 files,
   integration 182, e2e 133). Record below.
3. Area C: shared proxies and recorded failures; the hoister follows `/testing` barrels; rules 4 and
   5; the generated catalog and the session snippet (area F), with the first shipped item.
4. Area A: rules 1, 2 and 3 and the clone detector; the repeated read-file handling moves into
   `fsReadFileIfExistsAdapter` first.
5. Area C for packages: `startOrchestratorProxy` in orchestrator's `testing.ts` with `questNotFound()`
   checked against the real `getQuest`; rule 6; the server and mcp proxies move to it; a test for
   `quest-pause-responder.ts:40`.
6. Areas A and E: delete forwarding and empty-proxy adapters in batches; JSX only in widgets and flows.
7. Area D: rules 7 to 10; the path set; `ban-primitives` stops refusing plain return types;
   `QuestId` gets its real check.

### Record of step 2

What the trap found when it first ran, 149 unit tests in 7 packages, and what cleared them:

| Found                             | Cause                                                                                                                    | Resolution                                                   |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| mcp 23, server 77, orchestrator 1 | importing orchestrator started six watchers that did real I/O                                                            | `StartOrchestrator.bootstrap()`, called by each host at boot |
| orchestrator 2                    | test code recording data from the real workspace                                                                         | the test-infrastructure caller rule                          |
| cli 2, web 1, hydration 30        | TypeScript stat-ing `node_modules` directories; Playwright reading `/etc/os-release`; type-level compiles of real source | the `node_modules`, fixture and compiler rules               |
| testing 13                        | the testing package's own tests reading real files                                                                       | staged through their proxies                                 |

Files: `packages/testing/src/jest.setup-io-trap.js` (new) and one line in `jest.setup.js`; the hoister
in `typescript-mock-calls-to-statements-adapter.ts`; `start-orchestrator.ts` and new bootstrap
adapters, responders and boot flows in server and mcp; four proxy/test pairs in the testing package.

Gotchas the next session will meet:

- server and mcp typecheck the main `@dungeonmaster/orchestrator` barrel from its compiled
  `dist/src/index.d.ts`, so a new `StartOrchestrator` method needs
  `npm run build --workspace=@dungeonmaster/orchestrator` before their typecheck sees it.
- A server integration test cannot import the main `@dungeonmaster/testing` barrel: MSW is ESM and
  server's jest does not transform it. Use `serverAppHarness().setupTestHome()` for a temp home.
- A test that changes `DUNGEONMASTER_HOME` must restore it, never delete it: the watchers keep ticking,
  and a deleted variable sends them to the developer's real `~/.dungeonmaster`.
- The adapters `get-folder-detail` doc teaches `new Error('ENOENT: …')` with no `code`, the likely
  origin of the code-less failures. It changes with rule 5.

## Open items

1. Which of the 58 catch-everything implementations are real bugs. "Unreadable means start fresh" is
   right for a cache and wrong for a user's settings file.
2. `http` and `net` are not trapped yet; trapping them may interfere with MSW's interceptors.
3. Rule 1 sees only handling next to the I/O call. A promise handled later through a variable
   (`const p = readFile(x); … p.catch(…)`) needs dataflow; a caller wrapping a function that returns
   an I/O promise needs type information across functions.
4. Rule 8 with a very short brand name (`Name`, `Id`) would claim every name ending in it; it may need
   a minimum brand-name length.
5. Rules 8 and 9 need the type checker, which may be too slow for the pre-edit hook; they may run in
   ward only. Not measured.
6. Whether `discover`, `get-project-map` and `get-project-inventory` really skip `node_modules` in a
   consumer repo. Not checked.
