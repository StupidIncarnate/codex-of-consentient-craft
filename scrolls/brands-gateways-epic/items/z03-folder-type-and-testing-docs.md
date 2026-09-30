# Z03: `get-folder-detail` and `get-testing-patterns`

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/brands-types-tests-rules.md`, folder-type docs table (2346-2365), testing-patterns table (2367-2390); `scrolls/gateway/followup-sustainability.md`, rows 425-428 |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | `mcp` (`folder-constraints-transformer.ts`, `architecture-folder-detail-broker.ts`, `architecture-testing-patterns-broker.ts`, the `*-constraints.md` files), `shared` (`folder-config-statics.ts`), `eslint-plugin` (`enforce-proxy-patterns` message), `testing` (`CLAUDE.md`) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent for `get-folder-detail`-side files, one agent for `get-testing-patterns`-side files |
| Runs alone | no (runs with Z01, Z02, Z04-Z06) |

## Why

`get-folder-detail` and `get-testing-patterns` are two more MCP-served teaching surfaces, alongside
`get-architecture` (Z02) and the gateway's own new doc (Z01). Both still teach pre-epic rules: ad-hoc
type bans that do not distinguish our types from a library's, brand rules from before B1-B9, "mock npm
dependencies at the adapter boundary" instead of composing a gateway wrapper's proxy, and a home-sandbox
section that does not exist yet.

## Current state

Confirmed present, exact current content not re-verified against the doc's line citations (dated
2026-09-24/25):

- `packages/mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts`
- `packages/mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts`
- `packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`
- `packages/mcp/src/statics/folder-constraints/contracts-constraints.md`,
  `transformers-constraints.md`, `responders-constraints.md`, `adapters-constraints.md` (the last one
  goes away with the `adapters/` folder type per Phase 2/A19, not edited here — see Traps)
- `packages/shared/src/statics/folder-config/folder-config-statics.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts`
- `packages/testing/CLAUDE.md`

## Work

### `get-folder-detail` side

| Where (approx.) | Says today | Change to | Doc rule |
|---|---|---|---|
| `folder-constraints-transformer.ts`, ~10 folder types | "All types must come from contracts/" | "Our own types come from contracts/. A library's types are imported from the library." | C2 |
| same file, a "must not" item | "Use raw primitives (string, number) in signatures" | "A field of an object contract is branded. A parameter, return or local is plain, unless it is a field taken through `Owner['key']`." | B1, B6 |
| `architecture-folder-detail-broker.ts` | "Ad-hoc Types Forbidden: All types must come from contracts" | "Ad-hoc types forbidden: our own types come from contracts/, and a library's types from the library." | C2 |
| `contracts-constraints.md` | "All contracts MUST use `.brand<'TypeName'>()` on primitives" | "Every object contract, every object nested in it, and every string and number field carries `.brand<'…'>()`, with the text derived from the owner and the key." | B1, B3 |
| `transformers-constraints.md` | "All transformers MUST validate output using contracts" | "A transformer that returns one of our objects builds it through the object's contract parse. Loose text and numbers are returned plain." | B1, B6 |
| `transformers-constraints.md`, example line | `return contentTextContract.parse(config.purpose);` | `return config.purpose;` | B6 |
| `folder-config-statics.ts`, contracts `allowRegex` | `false` | `true` | B2 |
| `folder-config-statics.ts`, contracts `purpose` | "All data structures must be defined here with branded types." | "Type definitions and validation schemas for the data we define. Every object and every field in it is branded." | B1, C2 |
| `folder-config-statics.ts`, contracts `allowedImports` | No npm package except zod, beside our own statics/errors/contracts and two workspace packages | Unchanged for values; `import type` from a package is allowed in every folder through `enforce-import-dependencies` | C2 |
| `folder-constraints-transformer.ts` / `responders-constraints.md` | "Mock only I/O boundaries (adapters)" | "Mock only what the I/O trap or MSW catches, through the gateway wrapper's proxy." | T2 |
| `contracts-constraints.md` | "Test files MUST import from `.stub.ts` files, NOT from `-contract.ts` files" | "Test files import each stub from its own `.stub.ts` file, never from a contract or a production barrel." | C6 |
| `contracts-constraints.md`, example stub path | `src/contracts/eslint-context/eslint-context.stub.ts` | Removed: that copy is deleted, and an outside type's stub comes from the gateway | C1, C5 |
| `contracts-constraints.md`, new section | nothing on a field holding an outside type | "A field holding an outside package's type reuses the gateway's schema, branded `'#Gateway<Type>'`. Never `z.custom` or `z.instanceof` in a contract." | C9 |
| `contracts-constraints.md`, new section | nothing on unused contracts | "A contract nothing in production parses is deleted, with its stub and test." | C1 |
| `folder-constraints-transformer.ts`, every folder type | no line on outside packages | "An outside package, type or value, is imported only through `#gateway/<folder>/<subpath>`." | C2, gateway |
| every function-exporting folder's `*-constraints.md` | the `void` ban, with `AdapterResult` as the way out | R1's wording, matching the `get-architecture` row in Z02 | R1 |

`adapters-constraints.md` and the adapters rows of `folder-config-statics.ts` go with the `adapters/`
folder type itself — do not edit `adapters-constraints.md` here; A19 (Phase 2, "adapters stops being a
folder type") deletes it. If A19 has not deleted it by the time this item runs, report that under LEFT
STANDING rather than editing it, since editing a file about to be deleted duplicates work.

### `get-testing-patterns` side

| Where (approx.) | Says today | Change to | Doc rule |
|---|---|---|---|
| `architecture-testing-patterns-broker.ts` | "Raw primitives: return types must be branded" | Drop the return rule. Keep "to test an invalid input, use `as never`". | B6 |
| same file | "define types in contracts/ and import them" | "define our types in contracts/ and import them" | C2 |
| same file | "**Adapters** - Mock npm dependencies (axios, fs, etc.) at adapter boundary" | "Mock a call the I/O trap or MSW catches: compose the gateway wrapper's proxy, imported from its own file, in the proxy of the file that calls it. Pass-throughs run real." | T1, T2 |
| same file | "Compose adapter proxies, provide semantic setup" | "Compose the proxies of the gateway wrappers the broker calls, each imported from its own `.proxy` file, and provide semantic setup." | T1, T2 |
| `packages/testing/CLAUDE.md` | "Path adapter proxies: real passthrough via `requireActual`" | Removed. `path` is a pass-through in the gateway, runs real, and has no proxy. | T2 |
| `architecture-testing-patterns-broker.ts` | constructor-level `calledWith([])` catch-all allowed "when a parent proxy builds this adapter without describing any call of its own" | Drop the exception. A function that takes arguments never gets a constructor default. | T4 |
| same file, example | `handle.calledWith([]).resolves(FileContentsStub({value: 'content'}))` | `handle.calledWith([filePath]).resolves('content')` | T4, B6 |
| `enforce-proxy-patterns` message | "This sets up default mock behavior when proxy is created." | Drop that sentence. | T4 |
| `architecture-testing-patterns-broker.ts` | says nothing about the home sandbox; lists `os.homedir` among no-argument functions to mock | Add the five author rules from T07's "Jest home sandbox" section. Add: "`os.homedir` needs no mock for isolation; it already returns the sandbox." | T2, T07 |
| `packages/testing/CLAUDE.md:105-107` | calls the teardown leak check "the one guard left for code the lint rule `ban-bare-os-home-tmp` can't see" | "The leak check is the guard that the sandbox held. The lint rule is gone." | T07 (do not duplicate — confirm T07 has not already made this exact edit before repeating it) |
| `architecture-testing-patterns-broker.ts` | "Branded Strings: Use single `value` property + `contract.parse(value)`" | Removed. No standalone brand contract exists (B2). | B2, B6 |
| same file | EndpointMock is not for "server-side tests"; enable by adding `start-endpoint-mock-setup.ts` to a package's own `setupFilesAfterEnv` | MSW loads in every package from the root Jest base config, server included | T8/T01 |
| same file | "Only 2 things mocked: I/O npm dependencies + global functions" diagram | "Mocked: what the I/O trap or MSW catches, and globals a test pins. Everything else runs real." | T1, T2 |
| same file | "Contracts ❌ No — Use stubs (.stub.ts files)" | Add: "An outside type — an AST node, a rule context, a `ChildProcess` — comes from the gateway's stub, imported from its own file. Never build one by hand and cast it." | C5 |
| same file, new section | nothing on where test support lives | "Import each stub and proxy from its own file. No production barrel exports them." | C6 |
| same file, new section | nothing on gateway proxies | "The proxy of a file that calls a gateway wrapper composes that wrapper's proxy, imported from the `.proxy` file beside the wrapper. A pass-through runs real and has no proxy. Tests import outside packages through the gateway too." | T1, T2, T3, T7 |
| same file, new section | nothing on catch-all answers | "No `calledWith([])`, and no predicate that is always true, in a proxy constructor for a function that takes arguments. Stage each call by its arguments." | T4 |
| same file, new section | nothing on gateway-branded fields | "A contract field branded `'#Gateway<Type>'` takes the gateway's stub in a stub argument: `ScanStub({ proc: ChildProcessStub() })`. A partial fake does not compile." | C9 |
| same file, new section | nothing on building failures | "A failure comes from a wrapper proxy's named scenario, such as `fileMissing`, or a recorded-failure stub from the gateway, such as `FileMissingErrorStub`. Never a hand-made `Error`." | T5 |
| same file, new section | nothing on mocking another workspace package | "Never `registerMock` another workspace package's export. Compose the proxy it ships beside its API, such as `startOrchestratorProxy`." | T6 |

## Lint rules this item adds or changes

None. Text only, plus one message-string change in `enforce-proxy-patterns` (already listed above), which
mirrors what T05 does to that same file — confirm T05 has not already made this exact edit before
repeating it; if it has, skip it here and note under DECISIONS.

## Teaching text this item changes

This entire item is teaching text: every file named in the two tables above.

## Done when

- Every row in both tables is applied to the finished code's actual current text.
- `adapters-constraints.md` is either already deleted (A19 done) or left untouched with a LEFT STANDING
  note.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- `enforce-proxy-patterns`'s message change overlaps with T05's own work on the same file — check T05's
  status before editing, to avoid two agents editing the same line inconsistently.
- `packages/testing/CLAUDE.md`'s home-sandbox sentence overlaps with T07 — same caution.
- Every stub/proxy import example written into any of these docs must read a per-file path —
  `#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy` or `@dungeonmaster/<pkg>/<path under src>.proxy` —
  per EPIC.md concession 1; never a `_test_` barrel path.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan

Planned 2026-09-30 against HEAD 84dea7b74 (branch `gateway-pivot`) by a read-only planning agent. All line numbers were read at that HEAD and replace the "approx." cells above. Scratch: `tmp/z-plan/` (`census.py`, `g.py`). Master changed none of the files below (`git diff --stat $(git merge-base HEAD master) master` over `packages/mcp/src/brokers/architecture`, `packages/mcp/src/statics/folder-constraints`, `packages/mcp/src/transformers/folder-constraints`, `packages/shared/src/statics/folder-config`, `packages/testing/CLAUDE.md` is empty), so every batch here may run before or after the merge.

### 0. What is already done, and what the item under-counts

- Done: `enforce-proxy-patterns` no longer says "This sets up default mock behavior when proxy is created." (nothing in `packages/**` carries it; the `adapterProxyMustSetupMocks` message at `rule-enforce-proxy-patterns-broker.ts:51` still says "Adapter proxy must describe a call", see Z03-G). `folder-config-statics.ts:49` has `allowRegex: true` for contracts (B2 row done). `packages/testing/CLAUDE.md:105-107` no longer says "the one guard left for code the lint rule `ban-bare-os-home-tmp` can't see" (T07 did it). `jest.config.base.js:31-38` loads `start-endpoint-mock-setup.ts` for every package (T8, the EndpointMock row is still stale in the broker). The contracts md already teaches types-only contract files, the outside-type rule (`contracts-constraints.md:146-149`) and gateway stubs.
- Not in the tables: the `*-constraints.md` files teach the removed adapter and standalone-brand patterns in about a dozen places each. The "Work" rows name only four of them. The audit below is the real scope.
- `adapters-constraints.md` (394 lines) is not in `folderConstraintsStatics` (`packages/mcp/src/statics/folder-constraints/folder-constraints-statics.ts:9-23` lists 13 folder types and no `adapters`), so nothing serves it: an orphan. See D3.
- The R1 row ("the `void` ban, with `AdapterResult` as the way out" in every `*-constraints.md`): no constraints file carries that text. Nothing to edit; the R1 wording belongs once in `folderConstraintsTransformer` (Z03-A).

### 1. Every source file behind `get-folder-detail` and `get-testing-patterns` (full paths)

| Tool | File |
|---|---|
| `get-folder-detail` | `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts` (+ `.test.ts`; `.proxy.ts` is 3 lines) |
| | `packages/mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts` (+ `.test.ts`) |
| | `packages/mcp/src/transformers/folder-purpose/folder-purpose-transformer.ts` (comment `:6`) and `.test.ts` |
| | `packages/mcp/src/statics/folder-constraints/{bindings,brokers,contracts,errors,flows,guards,middleware,responders,startup,state,statics,transformers,widgets}-constraints.md`, mapped by `folder-constraints-statics.ts`; loaded by `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.ts`; copied to `dist` by `packages/mcp/package.json:41` `postbuild` |
| | `packages/shared/src/statics/folder-config/folder-config-statics.ts` (+ `.test.ts`, a full-value copy) |
| | `packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts` (routes; no text) |
| `get-testing-patterns` | `packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts` (948 lines) and `.test.ts` (656 lines) |
| neighbours | `packages/testing/CLAUDE.md`; `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts`; `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.ts` |

### 2. Stale-teaching audit

**`folder-constraints-transformer.ts`** (served for every folder type):

| Line | Stale claim | Current rule |
|---|---|---|
| 29 | "Mock only I/O boundaries (adapters)" (printed when `requireProxy`) | T2: "Mock only what the I/O trap or MSW catches, through the gateway wrapper's proxy." |
| 37 | "Use raw primitives (string, number) in signatures" under **MUST NOT** | Concessions 25 and 29 and B6: loose text and numbers are plain; a parameter named for another object's field takes `Owner['field']` (R8, `enforce-owner-field-reuse`). Replace with the B1/B6 sentence from the "Work" table. |
| 38 | "All types must come from contracts/" | C2: "Our own types come from contracts/. A library's types are imported from the library." |
| (none) | no line on outside packages | Add to the universal `**MUST:**` block (`:23`): "Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`" (C2, gateway; `validate-external-import-layer-broker.ts:38-51` lets a gateway import through every folder type). |
| (none) | no return rule | Add R1's sentence once here, in the universal block, for the function-exporting folders (`enforce-folder-return-types`), not in 13 md files. |

Pinned by `folder-constraints-transformer.test.ts` at `:31-32, :44, :58, :83, :96, :113, :126, :142` (full-string `toStrictEqual` on the three blocks). All of them change; the agent runs the test first and asserts the real new output.

**`architecture-folder-detail-broker.ts`**:

| Line | Stale claim | Current rule |
|---|---|---|
| 136 | "**Ad-hoc Types Forbidden:** All types must come from contracts" | C2: "our own types come from contracts/, and a library's types from the library." |
| 76-84 | "Can import from:" lists `config.allowedImports` with raw packages (`zod`, `hono`, `express`, `react`, `@mantine/core`, ...) and never says that an outside package goes through `#gateway` | The rule lets a gateway import through every folder type regardless of `allowedImports`; the raw names remain valid allow-list entries. Add one fixed line after the list: "An outside package is imported only through `#gateway/<folder>/<subpath>`." Decision D4. |
| 115-119 | (contracts only) note about types-only files | Correct. Add nothing. |

No test pins line 136 or the import lines today: add `it`s that assert the new sentences.

**`folder-config-statics.ts`** (feeds `get-folder-detail` "Purpose", the `<dungeonmaster-folderTypes>` snippet in every session, and Z02's layer diagram):

| Line | Stale claim | Current rule |
|---|---|---|
| 55 | contracts `purpose`: "Type definitions and validation schemas using Zod. All data structures must be defined here with branded types." | "Type definitions and validation schemas for the data we define. Every object and every field in it is branded." (B1, C2). The snippet table keeps only the first sentence, so it stays short. |
| 169 | middleware `whenToUse`: "Combine adapters for infrastructure" (**visible in every session's folder table today**) | "Combine gateway wrappers for infrastructure". |
| 196 | brokers `purpose`: "Business logic orchestration. Compose adapters, guards, transformers to implement domain operations." | "...Compose gateway wrappers, guards, transformers..." |
| 38-45 | contracts `allowedImports` holds `zod` and `@dungeonmaster/orchestrator` | Unchanged for values (Z03 "Work" row 9 says so). |

Pinned by three strings copied in tests: `folder-config-statics.test.ts:49, :163, :190` (the test is a full copy of the statics object) and `packages/mcp/src/transformers/folder-purpose/folder-purpose-transformer.test.ts:11, :21` (plus the comment at `folder-purpose-transformer.ts:6`).

**`*-constraints.md`** (a heading pin governs all of them: `folder-constraints-init-broker.proxy.ts:23-32` and its unit and integration tests require every file to open with `**FOLDER STRUCTURE:**`, brokers to carry `**PROXY PATTERN:**`, guards `**OBJECT ARGUMENTS FOR STATICS:**`, contracts `**CRITICAL - TEST IMPORTS:**`, statics `**CRITICAL RULES:**`. Keep every heading; edit only the body.)

| File | Lines | Stale claim and current rule |
|---|---|---|
| `contracts-constraints.md` | 9-12 | `user-id/user-id-contract.ts`, `user-id.stub.ts` in the folder tree: a standalone scalar brand (B2). Replace with a second object contract. |
| | 36 | "All contracts MUST use `.brand<'TypeName'>()` on primitives (string, number)": B1/B3 wording from the "Work" table (object, nested object, and each string/number field; brand text from owner + key). |
| | 41-45, 49-51 | `userIdContract` standalone, `id: userIdContract`, `email: ...brand<'EmailAddress'>()`, `name: ...brand<'UserName'>()`: brands are `<Owner><Key>` (`'UserId'`, `'UserEmail'`, `'UserName'`), and no standalone scalar contract exists. |
| | 58-62 | "Test files MUST import from `.stub.ts` files, NOT from `-contract.ts` files ... Stub files re-export the contract implementation": C6 wording; a stub does not re-export a contract. The enforcing rule name `ban-contract-in-tests` does not exist in the config (the rule is `@dungeonmaster/enforce-contract-usage-in-tests`, `config-dungeonmaster-broker.ts:97`); fix the name. |
| | 88-99 | "**2. Branded String Stubs (primitives):** `FilePathStub`/`filePathContract`": removed (B2, B6); delete the pattern and renumber (the init integration test does not pin it). |
| | 115, 123, 137 | `channel: z.string().brand<'Channel'>().optional()` plus a standalone `channelContract`: brand `'NotifierChannel'`, no standalone contract. |
| | (new) | Add the C9 paragraph ("A field holding an outside package's type reuses the gateway's schema, branded `'#Gateway<Type>'`; never `z.custom` or `z.instanceof`") and the C1 paragraph ("A contract nothing in production parses is deleted, with its stub and test"). |
| `brokers-constraints.md` | 55 | "call one adapter" -> "call one gateway wrapper". |
| | 96-103 | example imports `../../../adapters/axios/get/axios-get-adapter`, `Url` contract, `as Url`, `userId: UserId`: rewrite with `#gateway/npm/axios`-style wrapper import (verify the live subpath with `discover` before writing), `User['id']`, plain url string. |
| | 116 | imports `CommentContent, PostId, UserId` from `'../../../contracts'`: a barrel of standalone ids; use `Comment['content']`, `Post['id']`, `User['id']`. |
| | 139-153 | "Broker proxies compose child adapter/broker proxies": compose the gateway wrapper's proxy imported from its own `.proxy` file (`#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy`); `axiosGetAdapterProxy` and `UrlStub`/`UserIdStub` imports (`:143-147`, `:163`, `:170`, `:210`) go. |
| | 169-172 | `httpProxy.throws({... error: new Error('User not found')})`: T5, a failure comes from the wrapper proxy's named scenario or the gateway's recorded-failure stub, never a hand-made `Error`. |
| | 199 | "Delegate to child proxies (adapter/broker/state proxies)" -> gateway wrapper/broker/state proxies. |
| `transformers-constraints.md` | 17, 31 | "Cannot call adapters or brokers": "cannot call brokers or gateway wrappers". |
| | 34-46 | "All transformers MUST validate output using contracts ... `dateStringContract.parse(formatted)` ... `return formatted; // Type error - not branded`": B1/B6 row: builds one of our objects through the object's contract; loose text is returned plain. |
| | 121, 124-129 | `DateString` / `dateStringContract`: delete the standalone brand; the example returns an object contract or a plain string. |
| | 142, 150-152 | `ContentText` and `return contentTextContract.parse(config.purpose);` -> `return config.purpose;` (B6 row). |
| `middleware-constraints.md` | 7, 17, 30-36, 49-52, 70-76, 90-91, 101-104, 114-131, 155 | The whole file teaches "infrastructure adapters" (`winstonLogAdapter`, `prometheusIncrementCounterAdapter`, `sentryLogErrorAdapter`, their proxies). The `middleware/` folder type is live (`folder-config-statics.ts:152-171`), e.g. `packages/testing/src/middleware/mantine-render/mantine-render-middleware.ts`. Rewrite as "combines 2+ gateway wrappers" with a live example (agent picks one with `discover`); table row `:32` ("Imports: adapters/, middleware/, statics/") drops `adapters/`. |
| `responders-constraints.md` | 73 | "brokers, adapters should let errors propagate" -> "brokers and gateway wrappers". |
| | 129, 242, 271 | `req.params.id as UserId`, `useParams<{ id: UserId }>()`: a cast is B8/C4's target: parse through the contract (`userContract.shape.id.parse(...)`) or take `unknown`. |
| | 201, 235, 268 | `new Error(...)`, `UserId` type imports: lower priority, same `User['id']` fix. |
| | 219 | "Mock only I/O boundaries (adapters)": T2 wording (pinned nowhere). |
| | 337, 344 | `UserIdStub` import/use: `UserStub().id`. |
| `state-constraints.md` | 32-39, 70-91, 176-179, 192-209, 266-324 | `UserId`/`UserIdStub`/`Url`/`urlContract` standalone brands (`:53, :102-107, :121`); use `User['id']` and plain strings. |
| | 153, 236 | `new Error('Pool not initialized')`, `rejects(new Error('Connection failed'))`: T5. |
| | 258 | "mock the npm package at adapter layer" -> "compose the gateway wrapper's proxy". |
| | 138-139, 222 | `import {Pool} from 'pg'` in a state example: an outside package through `#gateway/npm/pg` (example wrapper; keep it labelled hypothetical). |
| `bindings-constraints.md` | 60, 90-92, 151-172, 198-293 | `UserId`/`UserIdStub`; `:157` "(which sets up adapter mocks, globals, etc.)". |
| `widgets-constraints.md` | 46-47, 117-130, 176-231 | `UserId`/`UserIdStub`; `:138, :146` `throw new Error('Edit button not visible')` in a proxy (T5 tolerates a UI-state guard; leave unless the agent finds `ban-invented-failures` reports it). |
| `guards-constraints.md` | 30 | "Cannot call adapters or brokers": "brokers or gateway wrappers". |
| | 153-189 | `UserId`/`UserIdStub`; `PermissionStub({value: 'admin:read'})` (`:220-279`) is a standalone scalar stub: use `UserStub({permissions: [...]})`. |
| `startup-constraints.md` | 19 | "can import ... `flows/`, `contracts/`, `statics/`, `errors/`, and npm packages. Importing from `brokers/`, `adapters/`..." -> gateway wording, drop `adapters/`. |
| | 70, 102-104, 133 | raw `express`, `react`, `react-router-dom`, `bull` imports in examples (raw-import-ban applies; startup may not import npm packages per EPIC concession 9's preamble). Mark them `#gateway/npm/...` |
| | 156-174 | `FilePathStub`, `RelativePathStub`, `BaseNameStub({value: ...})`: deleted scalar stubs; `installTestbedCreateBroker({ baseName: BaseNameStub(...) })` in CLAUDE.md is the live shape, agent copies from `packages/testing` (verify). |
| `flows-constraints.md` | 89 | "full flow -> responder -> adapter chain" -> "-> broker -> gateway chain". |
| | 96-114, 142, 169, 192 | same `FilePathStub`, `RelativePathStub`, `BaseNameStub`; raw `react-router-dom`, `express` imports. |
| `errors-constraints.md`, `statics-constraints.md` | (none) | Audited; no stale claim found. No edit. |
| `adapters-constraints.md` | all | Orphan; D3. |

**`architecture-testing-patterns-broker.ts`** (line numbers in the template strings):

| Line | Stale claim | Current rule |
|---|---|---|
| 35 | "Branded types in mocks ... `handle.calledWith([]).resolves(FileContentsStub({value: 'content'}))`, never `.resolves('content' as FileContents)`" | T4, B6: `handle.calledWith([filePath]).resolves('content')`; `FileContentsStub` is deleted and a plain value needs no brand. The bullet reduces to a plain-value example; "Two escape hatches" at `:33` becomes one (pinned at `.test.ts:637`). |
| 36 | "`as never`, never `as string` (that violates `ban-primitives`)" | `ban-primitives` is off the config. Keep "`as never`, never `as string`" with reason "it types a wrong input as the wrong type"; the first testing-table row. |
| 65 | `mantineRenderAdapter({ ui: ... })` | the live helper is `mantineRenderMiddleware` (`packages/testing/src/middleware/mantine-render/mantine-render-middleware.ts`); verify its call shape before writing. |
| 222-223 | "only two types of things are mocked: 1. **Adapters** - Mock npm dependencies (axios, fs, etc.) at adapter boundary" | T1/T2 wording from the "Work" table. |
| 236-240 | diagram: `httpAdapter (REAL)` over `axios (MOCKED)`; "Only 2 things mocked: I/O npm dependencies + global functions"; "DSL/query adapters ... run fully real" | "Mocked: what the I/O trap or MSW catches, and globals a test pins. Everything else runs real." Redraw with a gateway wrapper (`readFileIfExists` -> `fs.promises.readFile` trapped). |
| 246 | "Contracts ... includes service objects with methods" | Add the C5 outside-type sentence (the `Contracts ❌ No` row of the testing table). Pinned at `.test.ts:226` (the Contracts row is asserted verbatim, so the test row changes too). |
| 248-249, 255 | Quick-reference `Adapters` row; "Compose adapter proxies"; "Middleware: Delegate to adapter proxies" | Drop the `Adapters` row (no such folder); Brokers: "Compose the proxies of the gateway wrappers the broker calls, each imported from its own `.proxy` file, and provide semantic setup"; Middleware: "Delegate to gateway wrapper proxies". Pinned `.test.ts:229, :232`. |
| 261 | "examples: adapters, brokers, bindings, ..." | drop `adapters`. Pinned `.test.ts:243`. |
| 266 | "Pure functions, DSL adapters - no mocking needed" | "Pure functions, pass-through wrappers". |
| 294 | constructor `calledWith([])` allowed "when a parent proxy builds this adapter without describing any call of its own" | T4: drop the exception (the `calledWith([])` row of the testing table); keep the "record-and-swallow output ... `callsMatching`" clause only for a function that takes no arguments. Also `ban-proxy-catch-all-defaults` and `ban-proxy-empty-called-with` are the enforcing rules (`config-dungeonmaster-broker.ts:206, 223`). |
| 300-305 | `axiosGetAdapterProxy`, `UrlStub('/users/123')`, `registerMock({ fn: readFile }).calledWith([]).resolves(Buffer.from(''))` | a gateway-wrapper proxy example (`readFileProxy`/its named scenarios); the ❌ example keeps a test-file `registerMock` but with an addressed call. |
| 313, 323 | `httpAdapterProxy()` | a real gateway proxy name. |
| 319 | `import { randomUUID } from 'crypto';` in a proxy | raw platform import: `#gateway/node/crypto` (A18; concession 14 covers only testing's timer watcher). Verify the live subpath. |
| 363-379 | "Statics proxies ... Use `Reflect.set()` to mutate readonly constants" with `Reflect.set(userStatics.limits, ...)` | `ban-reflect-outside-guards` (`rule-ban-reflect-outside-guards-broker.ts:32-35`) allows `Reflect.get/set` in `*-guard.ts` and `*-contract.ts` only, and the pre-edit hook enforces it. No proxy in `packages/**` uses `Reflect.set`; every `*-statics.proxy.ts` is `(): Record<PropertyKey, never> => ({})`. Decision D2. Pinned `.test.ts:541`. |
| 386-397 | `exitCodeContract = z.number()...brand<'ExitCode'>()` | B2: no standalone scalar brand. Use an object-contract field example. |
| 403-405 | "any layer that ultimately calls a fetch adapter"; "Do NOT use it for: server-side tests ...; filesystem, child process — those use adapter proxies" | T8/T01: MSW loads in every package from the root base (`jest.config.base.js:31-38`), server included; "fetch gateway wrapper"; "use gateway wrapper proxies". Pinned `.test.ts:563`. |
| 429 | "To enable EndpointMock in a package, add `start-endpoint-mock-setup.ts` to `setupFilesAfterEnv`" | false; delete the sentence (T8). |
| 557-560 | "`*.harness.ts` -> node:fs/path/os ..." | unverified against `raw-import-ban`: the agent reads `rule-raw-import-ban-broker.ts` and the eslint config's harness override before keeping it (T7: "Tests import outside packages through the gateway too"). |
| 568 | "Invalid mocks: ... your own brokers/adapters" | "your own brokers or gateway wrappers". |
| 583 | "Branded Strings: Use single `value` property + `contract.parse(value)`" | Removed (B2, B6). |
| 620 | address table: `os.homedir` listed with the no-argument functions | add "`os.homedir` needs no mock for isolation; it already returns the sandbox" and the five author rules (brands doc `:2016-2024`: do not mock `os.homedir` for isolation; a proxy that needs a home path calls the real `homedir()`; the sandbox `HOME` is shared by the run, so write under a testbed directory; to give a spawned process another home pass `env: { ...process.env, HOME: dir }`; a test that changes `DUNGEONMASTER_HOME` restores it and never deletes it). Pinned `.test.ts:360` (the row). |
| 626-636 | `fsWriteFileAdapterProxy`, `filePath: FilePath` | a gateway-wrapper proxy and a plain string path (B2: `FilePath` is deleted). |
| 676, 678 | "wires its responders/middleware/adapters"; "(brokers, guards, ..., responders, adapters, etc.)" | drop `adapters`. |
| 750, 752 | "define types in contracts/ and import them"; "**Raw primitives** (`@dungeonmaster/ban-primitives`): return types must be branded; ..." | testing-table rows 1 and 2: "define our types in contracts/"; drop the `ban-primitives` bullet or rename it to the live edit-blocking rule it stood for. Pinned `.test.ts:509` (`ruleNeedle`): change the needle to the replacement rule name. |
| (missing) | the six new-section rows of the testing table (new sections: per-file stub/proxy imports C6, gateway proxies T1/T2/T3/T7, catch-all answers T4, gateway-branded fields C9, building failures T5, workspace-package mocks T6) | add as a `## Gateway Proxies and Test Support` section plus short additions; each new sentence gets an `it` with a `^...$` regex. The live enforcing rules to name: `ban-test-support-in-production`, `ban-workspace-export-mocks`, `ban-invented-failures`, `ban-proxy-catch-all-defaults`, `ban-proxy-empty-called-with`. |

**`packages/testing/CLAUDE.md`**: `:23-41` "Path adapter proxies: real passthrough via `requireActual`" names `packages/shared/src/adapters/path/...`, which do not exist; remove the section (T2: `path` is a pass-through in the gateway and has no proxy; its last sentence about `returns()` staying call-order-scoped goes too). Z04 (every CLAUDE.md) must skip this section.

**eslint-plugin messages** (optional, not in the item's tables): `rule-enforce-proxy-patterns-broker.ts:51` "Adapter proxy must describe a call in the constructor..." and `rule-enforce-folder-return-types-broker.ts:43, 45, 47` "(only *-contract.ts and *-adapter.ts may return unknown at the I/O boundary)" name the deleted folder type. A hook prints these to every agent. Their tests assert the message ids, not the text (agent confirms).

### 3. Batches (1 to 3 files each; "+c" marks a comment-only touch)

| Batch | Files | Text work | Checks |
|---|---|---|---|
| **Z03-A** | `packages/mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts`, `folder-constraints-transformer.test.ts` | transformer rows in section 2; rewrite every expected string in the test from real output | `lint,typecheck,unit` |
| **Z03-B** | `packages/mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts`, `...broker.test.ts` | `:136`, the gateway line after `:84`; new `it`s (D4) | `lint,typecheck,unit` |
| **Z03-C** | `packages/shared/src/statics/folder-config/folder-config-statics.ts`, `folder-config-statics.test.ts`, `packages/mcp/src/transformers/folder-purpose/folder-purpose-transformer.test.ts` (+c `folder-purpose-transformer.ts:6`) | the three strings and the copies in the two tests | `lint,typecheck,unit` |
| **Z03-D** | `contracts-constraints.md` | section 2 rows | `lint,typecheck,unit` on `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.test.ts` and `.integration.test.ts` (real disk headings) |
| **Z03-E1** | `brokers-constraints.md`, `middleware-constraints.md` | rows above | same init tests |
| **Z03-E2** | `transformers-constraints.md`, `guards-constraints.md` | rows above | same |
| **Z03-E3** | `bindings-constraints.md`, `widgets-constraints.md` | rows above | same |
| **Z03-E4** | `responders-constraints.md`, `state-constraints.md` | rows above | same |
| **Z03-E5** | `startup-constraints.md`, `flows-constraints.md` | rows above | same |
| **Z03-T1** | `architecture-testing-patterns-broker.ts`, `architecture-testing-patterns-broker.test.ts` | in-place corrections: lines 35, 36, 65, 222-266, 294-323, 363-379, 386-397, 403-429, 568, 583, 620-636, 676-678, 750-752 and the tests pinned at `:226, :229, :232, :243, :360, :509, :541, :563, :637` | `lint,typecheck,unit` |
| **Z03-T2** | same two files, **after T1** | new sections (per-file imports, gateway proxies, catch-all, gateway-branded fields, failures, workspace packages, home-sandbox rules) and one `it` each | `lint,typecheck,unit` |
| **Z03-T3** | `packages/testing/CLAUDE.md` | delete `:23-41` | none (markdown) |
| **Z03-G** (optional, P2) | `rule-enforce-proxy-patterns-broker.ts`, `rule-enforce-folder-return-types-broker.ts` (+ their `.test.ts` if they assert the text) | the three "adapter" message strings | `lint,typecheck,unit` |
| **Z03-X** (operator, `mv`) | `packages/mcp/src/statics/folder-constraints/adapters-constraints.md` | after `discover` proves no importer, `mv` to `tmp/deletions/Z03/packages/mcp/src/statics/folder-constraints/` (agent-brief rule 8) | `folder-constraints-init-broker.integration.test.ts` |

Parallelism: Z03-A, B, C, D, E1-E5, T1 and T3 touch disjoint files and can run side by side; under the operator's agent cap start with A, B, C, T1, then D and E1-E5 four at a time. T2 waits for T1 (same two files). Z03 touches nothing Z02 touches (Z02 owns `architecture-overview-broker.*`, the snippet file and the F129 docs); the only file both read is `folder-config-statics.ts`, edited by Z03-C alone.

Where a batch rewrites an example, the agent writes it against a live file (`discover`, then `Read`), not an invented `UserFetch` world, and keeps every stub and proxy import in the per-file form of concession 1.

### 4. Builds before a live session sees the text

| Text | Needs | Then |
|---|---|---|
| Z03-A, B, D, E1-E5, T1, T2 (mcp) | `npm run build --workspace=@dungeonmaster/mcp` (the `postbuild` also `cp`s the `.md` files into `dist/src/statics/folder-constraints/`) | reconnect the MCP |
| Z03-C (shared) | `npm run build --workspace=@dungeonmaster/shared` | reconnect the MCP; a new session shows the middleware row |
| Z03-T3, Z03-X | none (`tmp/deletions` is not built) | none |
| Z03-G (eslint-plugin) | `npm run build --workspace=@dungeonmaster/eslint-plugin` (the hook runs compiled rules) | none |

### 5. Open decisions

- **D1. Return wording.** Same question as Z02-D1; Z03-A's "MUST NOT" replacement and the contracts/transformers rows must use the wording the operator confirms there.
- **D2. Statics proxies.** The broker's example uses `Reflect.set`, which the lint rule and hook refuse outside guards and contracts, and no proxy does it. Recommendation: rewrite the section to "A statics proxy is empty (`(): Record<PropertyKey, never> => ({})`). To exercise a limit, pass the value into the function under test; use `registerSpyOn` only for a getter." Keep `Reflect.set` out of the doc and out of the rule's allowlist (widening the rule is a lint change, out of this item's "text only" scope, and the F129/Z03 note in EPIC should then read "doc now agrees with the rule").
- **D3. `adapters-constraints.md`.** An unserved orphan. Recommendation: Z03-X moves it to `tmp/deletions/Z03/...`, since the item's "do not edit it" trap assumed A19 would delete it and A19 is done.
- **D4. Raw packages in "Can import from".** The folder-detail import list prints raw names (`zod`, `hono`, `express`, `@mantine/core`) that a consumer must not import directly. Recommendation: keep `allowedImports` values (the rule still reads them) and add the fixed `#gateway` sentence in the broker (Z03-B); do not edit `folder-config-statics.ts` values.
- **D5. Scope of the md rewrite.** The "Work" rows list four md edits; the audit finds about 100 stale lines in 12 files. Recommendation: do all of it (nine agents above), because each file's examples are what a model copies, and the `UserId`/`UserIdStub` pattern is wrong in eight of the 13 files.
