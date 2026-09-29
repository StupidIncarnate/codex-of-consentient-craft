# B05: every remaining copied library type is deleted, and its callers switch to the gateway's stub

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), wave 3.5, chunks L0, L1, L3, L4 (all 33 copies, not only the ones below). That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/brands-types-tests-rules.md` (BR), C5 table rows for `TypescriptSourceFileStub`, `ChildProcessStub` (hooks), `FileStatsStub`, `TimerHandleStub`, `McpServerClientStub`, lines 1263-1267; "the copies do harm" table, lines 1276-1281; `EslintInstance` in hooks, line 2487 ("Found along the way"); `enforce-stub-usage` extension, line 2235 ("New rules" table row for C5); T3's 12 proxies building their own fake handles, lines 1783-1786 |
| Needs | [G16](../g16-gateway-stubs-node-and-failures.md), [A07](../a07-adapters-hooks.md), [A14](../a14-adapters-testing.md) |
| Unblocks | none directly (runs with [B04](b04-eslint-rules-on-real-tsestree.md)), and Z01–Z07 |
| Packages touched | `testing`, `hooks`, `mcp` (deletion only — see step 4); every package with a proxy that builds its own fake `ChildProcess`/`Socket`/`FSWatcher` — census this at the start, do not assume it is only `hooks` |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent per stub family (`TypescriptSourceFileStub`, `ChildProcessStub`+`FileStatsStub`, `TimerHandleStub`, the 12 fake-handle proxies, `EslintInstance`) — 2-4 files each, since each family's callers cluster in one or two packages |
| Runs alone | No — runs with [B04](b04-eslint-rules-on-real-tsestree.md) |

## Decisions (L1, 2026-09-29)

Each row was checked against the code on 2026-09-29. "Prod users" counts non-test, non-stub, non-proxy files that
mention the contract's file name, from a `python3` walk; it is evidence from that run, not inventory.

| Copy | Decision | Why | Verified |
|---|---|---|---|
| `eslint-plugin` `eslint-rule` (`packages/eslint-plugin/src/contracts/eslint-rule/eslint-rule-contract.ts`) | Copy. Retype to `TSESLint.RuleModule`; a script swaps the type. | Its `meta` parse checks only our own literals. | File exists; 83 prod users (the EPIC said 90). |
| `eslint-plugin` `tsconfig-options` | Our data. Keep. | It is a tsconfig JSON file read from disk, like ward's `tsconfig-json`. | File exists; 2 prod users (`config-tsconfig-broker.ts`, `src/index.ts`). |
| `mcp` `tool-response` | Copy. `CallToolResult`. | A text-only subset of the SDK type. | File exists; 12 prod users. `hooks` holds a second `tool-response` contract, not covered by this row. |
| `orchestrator` `spawn-options-snapshot` | Copy. `SpawnOptions`, picked. | A subset of Node's type recorded for a test read-back. | File exists; 1 prod user (`spawned-options-snapshot-transformer.ts`). |
| `hooks` `eslint-raw-message` | Copy. `Linter.LintMessage`. | ESLint returns it in-process, already typed. | File exists; 1 prod user (`eslint-result-to-lint-result-transformer.ts`). |
| `testing` `endpoint-control` | Copy for `HttpMethod` (msw `HttpMethods`); `EndpointResponseContract` becomes `z.ZodType`. | Both restate a library type. | File exists; 2 prod users (`src/index.ts`, `endpoint-mock-listen-responder.ts`). |
| `eslint-plugin` and `shared` `node-builtin` statics | **Replace with `builtinModules` from `#gateway/node/module`.** The subset is not deliberate. | A hand-picked list drifts with Node. See "node-builtin finding" below. | Both files exist and hold the same 35 names. `#gateway/node/module` already exports `builtinModules` (`packages/@gateway/node/src/module/module.ts:16`). |
| `hooks/@types/error-cause.d.ts` | Delete (L4 does it). Nothing depends on it. | The root target is ES2022, which has `ErrorOptions`. | See "@types finding" below. |
| root `@types/@typescript-eslint__parser/index.d.ts` | Delete (L4 does it), then typecheck the six importers of the parser gateway. | The package ships its own types. | See "@types finding" below. |
| `mcp-server-client` | Delete (dead). | No production importer. | Contract and stub still exist (`packages/mcp/src/contracts/mcp-server-client/`); 0 prod users, only its own stub and test mention it. |

### node-builtin finding

The census said "37-of-42". The lists hold 35 names, and Node 22.17's `builtinModules` (minus `_`-prefixed and
`/`-subpath entries) holds 42. The 7 missing are `async_hooks`, `diagnostics_channel`, `inspector`, `punycode`,
`sys`, `trace_events`, `wasi`. Neither file says the omission is deliberate: the eslint-plugin header reads "Lists
Node.js built-in module names for import validation", the shared header reads "Lists Node.js built-in module names,
bare (no `node:` prefix)". No user depends on an exclusion; each one reads the list as "is this a builtin":

- `packages/shared/src/transformers/gateway-path-from-import-source/gateway-path-from-import-source-transformer.ts:48`
  maps a specifier to `#gateway/node/` when its top-level segment is in the list, else `#gateway/npm/`. A missing name
  (`async_hooks`) is mapped to the npm gateway, which is a bug the swap fixes.
- `packages/eslint-plugin/src/brokers/rule/enforce-import-dependencies/validate-external-import-layer-broker.ts:103`
  lets an integration test import a builtin. A missing name is refused today.
- `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.ts:140` reads
  `@dungeonmaster/shared/statics`'s copy to lowercase a global's name (`Buffer` to `buffer`). More names only widen it
  to real builtins.

Notes for whoever does the swap:

- `builtinModules` also holds `fs/promises`-style subpaths and `_http_agent`-style private names. The first user
  compares the bare specifier with `===`, so `fs/promises` in an integration test starts passing. That is correct,
  but it is a behavior change: write a test for it.
- `node:`-only builtins (`node:test`, `node:sqlite`) are not in `builtinModules` on Node 22. The `node:` strip in both
  users happens first, so `node:test` still falls through to "not a builtin" exactly as today.
- A third hand copy exists: `nodeBuiltinModuleNamesForTest` in
  `packages/@gateway/node/src/gateway-node-builtin-globals.integration.test.ts:35` ("Duplicated by hand from
  `nodeBuiltinStatics.modules`"). It cannot import shared (`gateway-import-boundary`) but it can import
  `builtinModules` from `./module/module`, so it goes with the swap.
- `packages/shared/src/statics/node-builtin/node-builtin-statics.test.ts:5` asserts the exact 35-name list with
  `toStrictEqual`, and `packages/eslint-plugin/src/statics/node-builtin/node-builtin-statics.test.ts:5` does the same.
  Both tests go with the statics. `shared/statics.ts:95` re-exports the shared file, and `platform-globals-ban` imports
  it from there, so the barrel line goes too.
- The eslint-plugin statics copy is redundant even before the swap: `@dungeonmaster/shared/statics` already exports
  one and `platform-globals-ban` already uses it.

### @types finding

`packages/hooks/@types/error-cause.d.ts` declares `interface ErrorOptions { cause?: unknown }` and an
`ErrorConstructor` overload. Nothing includes it:

- `packages/hooks/tsconfig.json` has `"typeRoots": ["../../node_modules/@types", "../../@types"]` and
  `"include": ["src/**/*", "src/.test-tmp/**/*", "test/**/*", "*.ts"]`. `packages/hooks/@types` is on neither list.
- The root `tsconfig.json` has `"target": "ES2022"` and `"lib": ["ES2022"]`, and `ES2022` carries `ErrorOptions`.
- The only `cause` users in `hooks` are `packages/hooks/src/brokers/eslint/load-config/eslint-load-config-broker.ts:90`
  (`{ cause: error },`) and
  `packages/hooks/src/brokers/hook-config/load/hook-config-load-broker.ts:49`
  (``throw new Error(`Failed to load config from ${configPath}`, { cause: error });``). Both typecheck through `lib`.

No declared global is used elsewhere. Deleting it is safe by inspection; L4 still confirms with the hooks typecheck.

`@types/@typescript-eslint__parser/index.d.ts` declares `module '@typescript-eslint/parser'` with `parse`,
`parseForESLint`, `version`, `meta`, all typed off `Linter.Parser`. The root `tsconfig.json` `typeRoots` includes
`./@types`, so this ambient declaration is live and it SHADOWS the package's own types. What still depends on it is the
typing of the gateway pass-through (`packages/@gateway/npm/src/typescript-eslint__parser/typescript-eslint__parser.ts`
is `export * from '@typescript-eslint/parser'`), reached by six files: four `typed-*-transformer.integration.test.ts`
files under `packages/eslint-plugin/src/transformers/`, `rule-tester.harness.ts` and `typed-rule-tester.harness.ts`,
plus the gateway's own `parser-module.stub.ts` and `rule-context.stub.ts`. After deletion the package's real types take
over: `parse` becomes typescript-estree's `parse`, not `Linter.Parser['parse']`. L4 deletes it, then runs typecheck on
`eslint-plugin` and `@gateway/npm`; if a harness's `languageOptions.parser` slot rejects the real object, fix the
call site, not the shim. Not verified: `node_modules/@typescript-eslint/parser/package.json` (8.45.0) has no top-level
`types` field, so its types resolve through `exports`; the typecheck will show it.

## Stub paths (from L0)

L0 built every stub `libcopy-census/stub-map.json` marked "proposed" or "does not exist". Apply this mapping when
reading `stub-map.json`; the json itself is not edited. All exist under `packages/@gateway/npm/src/`.

| `stub-map.json` name | Real import path | Export |
|---|---|---|
| `TypescriptProgramStub` (`newImport`: `#gateway/npm/typescript/program/program.stub (proposed)`) | `#gateway/npm/typescript/program/program.stub` | `ProgramStub` |
| `EslintConfigStub` (`.../flat-config/flat-config.stub (proposed)`) | `#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub` | `FlatConfigStub` |
| `LinterConfigStub` (`#gateway/npm/eslint/... flat-config stub (proposed)`) | `#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub` (there is no `eslint` flat-config stub) | `FlatConfigStub` |
| `JsonRpcRequestStub` (`modelcontextprotocol__sdk__types (proposed subpaths)`) | `#gateway/npm/modelcontextprotocol__sdk__types/json-rpc-request/json-rpc-request.stub` | `JsonRpcRequestStub` |
| `JsonRpcResponseStub` | `#gateway/npm/modelcontextprotocol__sdk__types/json-rpc-response/json-rpc-response.stub` | `JsonRpcResponseStub` |
| `ToolCallResultStub` | `#gateway/npm/modelcontextprotocol__sdk__types/call-tool-result/call-tool-result.stub` | `CallToolResultStub` |
| `ToolListResultStub` | `#gateway/npm/modelcontextprotocol__sdk__types/list-tools-result/list-tools-result.stub` | `ListToolsResultStub` |
| `WsClientStub` (`#gateway/npm/hono... (proposed)`) | `#gateway/npm/hono__ws/ws-context/ws-context.stub` | `WsContextStub` |
| `TsestreeStub` (14 stubs exist) | `#gateway/npm/typescript-eslint__utils/<kebab-node>/<kebab-node>.stub`, one per node type, each taking `{ code }`; the `rootTypesWithoutGatewayStub` list in `stub-map.json` is now empty of gaps (see [B04](b04-eslint-rules-on-real-tsestree.md)) | `<Node>Stub` |

`FlatConfigStub` takes `files`, `ignores` and `rules` only (EPIC L0 row). `stub-map.json`'s `EslintConfigStub` and
`LinterConfigStub` key maps also list `plugins` (22 calls) and `languageOptions` (2 calls): those calls are HAND until
L3 decides how to express them.

## Why

Five more library-type copies exist beside the two `eslint-plugin` handles B04 covers, plus one found but
not yet investigated (`EslintInstance`):

| Our stub on a copied type today | Test/proxy files | Calls | Our side | Callers switch to |
|---|---|---|---|---|
| `TypescriptSourceFileStub` (testing) | 7 | 38 | Deleted with its contract. 6 of the 7 caller files already build a real source file and then wrap it. | `SourceFileStub` |
| `ChildProcessStub` (hooks) | 3 | 7 | Deleted with its contract | `ChildProcessStub` from `#gateway/node/child_process/child-process/child-process.stub` |
| `FileStatsStub` (hooks) | 3 | 6 | Deleted with its contract | `StatsStub` |
| `TimerHandleStub` (testing) | 3 | 9 | Deleted with its contract | `TimeoutStub` from `#gateway/node/setTimeout/timeout/timeout.stub` |
| `McpServerClientStub` (mcp) | 3 | 8 | Deleted: its contract has no production importer (C1) | nothing — this one has no replacement, it is dead code |

The copies do harm where they meet real code: production adapters already return the real Node types
(`fsStatAdapter` returns `Promise<Stats>`), so proxies cast the thin copy into the real slot, and code
under test receives an object with no `.kill()`, no `.on()`, no `.isSymbolicLink()`. Concretely:

| Where | What it does |
|---|---|
| `hooks/src/adapters/child-process/spawn/child-process-spawn-adapter.proxy.ts:13` | `returns(childProcess as NodeChildProcess)` |
| `hooks/src/adapters/fs/stat/fs-stat-adapter.proxy.ts:15` | `resolves(stats as unknown as Stats)` |
| `testing/src/adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter.ts:25` | Production code casts the copy back: `sourceFile as unknown as ts.SourceFile` |
| `testing/src/contracts/timer-handle/timer-handle-contract.test.ts:35` | Parsing a real timer through the copy returns `{}`: the parse strips `hasRef` |

Separately, 12 broker and responder proxies build their own fake `ChildProcess`, `Socket` or `FSWatcher`
by hand to mock a raw `spawn` (recorded in `tmp/adaptermove-proxies-fake-handles.txt` at the time the
source doc was written — that file is scratch and may be gone; re-derive the list rather than assuming it
still exists). Each one should use the gateway's stub instead, so no proxy invents its own shape of a
`ChildProcess`.

`enforce-stub-usage` gets extended (C5's rule row) to refuse an object literal cast to a package type in
any test, proxy or stub file — including gateway files themselves, per the gateway follow-up doc's own
rule (GW, item covering "no object literal cast to a package type", referenced at lines 611-613 of that
doc). This item's stub-swap work is what that rule will then enforce going forward; build the swap first,
then confirm the rule catches a reintroduced violation.

## Current state

Confirmed this session (2026-09-26) by reading the files directly:

- `packages/testing/src/contracts/typescript-source-file/typescript-source-file-contract.ts` (+ its
  `.stub.ts` under the same folder) exists.
- `packages/testing/src/contracts/timer-handle/timer-handle-contract.ts` (+ its `.stub.ts`) exists.
- `packages/hooks/src/contracts/child-process/child-process-contract.ts` (+ its `.stub.ts`) exists.
- `packages/hooks/src/contracts/file-stats/file-stats-contract.ts` (+ its `.stub.ts`) exists.
- `packages/mcp/src/contracts/mcp-server-client/mcp-server-client-contract.ts` (+ its `.stub.ts` and
  `.test.ts`) exists. This one is also named in `b02-contract-index-and-unused-contracts.md`'s Current
  state — **do not delete it twice in two items**; whichever item's agent runs first should delete it and
  the other item's agent should find it already gone and check that box off.
- `packages/@gateway/node/src/child_process/` has no `.stub.ts` file yet anywhere under it (confirmed:
  only `.ts`, `.proxy.ts`, `.test.ts` files exist per this session's directory walk) — **this confirms
  G16 has not landed yet**. Do not start the `ChildProcessStub` swap until it has.
- The 12-proxy fake-handle census (`tmp/adaptermove-proxies-fake-handles.txt`) was **not re-derived this
  session** — that path is scratch (`tmp/` is gitignored) and may not exist in this checkout; the
  executing agent must re-find these 12 (or however many currently exist) by reading proxy files that
  construct `new ChildProcess()`/`new Socket()`/`new (something) FSWatcher()`-shaped objects by hand,
  since `grep`/`find` are blocked by hooks — use `discover` or a `python3 os.walk` with a regex for
  `new ChildProcess(` / `new Socket(` / `FSWatcher` across `packages/*/src/**/*.proxy.ts`.
- `EslintInstance` in `packages/hooks/src/contracts/` — **not checked this session**. The source doc
  itself calls this "not yet checked" (BR, "Found along the way": "An `EslintInstance` type copied from
  ESLint, not yet checked"). Read whatever file in `packages/hooks/src/contracts/` declares it before
  deciding whether it is a seventh copy needing the same treatment, or something else.

## Work

1. **Wait for G16.** The `ChildProcessStub` and `TimeoutStub`/setTimeout-handle-stub swaps need the
   gateway's stubs, which G16 builds. If dispatched before G16 is `done`, report it as blocked.
2. **`TypescriptSourceFileStub` → `SourceFileStub`.** Delete `typescript-source-file-contract.ts`, its
   `.stub.ts` and its `.test.ts`. Switch its 38 calls across 7 files to `SourceFileStub` from wherever
   `b04`'s work (or G17, if it is the same underlying stub) exposes it under
   `#gateway/npm/typescript/source-file/source-file.stub` (G17's planned path for this stub) — confirm the
   exact subpath before writing the import; `typescript` is its own gateway subpath, separate from
   `typescript-eslint__utils`. 6 of the 7 caller files
   already build a real source file and then wrap it in the copy — for those, deleting the wrap is
   probably enough; read each to confirm before assuming it is a pure mechanical swap.
3. **`ChildProcessStub` (hooks) → gateway's `ChildProcessStub`.** Delete `child-process-contract.ts` and
   its stub/test in `hooks`. Switch its 7 calls across 3 files to `import { ChildProcessStub } from
   '#gateway/node/child_process/child-process/child-process.stub';` (confirm the exact wrapper-folder name
   G16 gives this stub before writing the import).
4. **`FileStatsStub` → `StatsStub`.** Delete `file-stats-contract.ts` and its stub/test in `hooks`. Switch
   its 6 calls across 3 files to the gateway's `StatsStub`, imported from its own file (confirm the exact
   gateway subpath — likely under `#gateway/node/fs/`).
5. **`TimerHandleStub` → `TimeoutStub`.** Delete `timer-handle-contract.ts` and its stub/test in
   `testing`. Switch its 9 calls across 3 files to `import { TimeoutStub } from
   '#gateway/node/setTimeout/timeout/timeout.stub';` (confirm the exact wrapper-folder name G16 gives this
   stub before writing the import). Note the source bug this fixes: parsing a real timer through the
   old copy returns `{}` because the parse strips `hasRef` — `is-timer-holding-loop-guard.ts:22` calls
   `handle.hasRef()` on a parsed value today, so confirm that guard still works correctly against a real
   `TimeoutStub()` value (it should now have a real `hasRef`, so this is a fix, not a regression, but
   verify it with a test that calls `hasRef()` on the stub's output).
6. **`McpServerClientStub` → deleted, no replacement.** Its contract has no production importer at all
   (confirmed by `b02`'s scan too). Delete `mcp-server-client-contract.ts`, its stub and its test. Check
   whether anything imports the stub for a test double despite the contract being dead — if so, that test
   needs a different value entirely (report what you find; do not invent a replacement without reading
   what the test actually needs).
7. **`EslintInstance` in hooks — investigate first, then decide.** Read the file that declares it. If it
   is a hand copy of an ESLint type used the same way as the other six (built by hand, cast, never parsed
   against real data), it gets the same treatment: delete it, switch callers to the gateway's real
   `ESLint` type import (confirm the correct gateway subpath — probably `#gateway/npm/eslint` or similar;
   check what gateway subpath already exists for the `eslint` package itself). If it turns out to be
   something else (e.g., it already reuses a real type, or is genuinely our own shape), report that in
   DECISIONS and leave it alone rather than force-fitting it to this item's pattern.
8. **The 12 proxies with hand-built fake handles switch to the gateway's stub.** For each proxy that
   builds its own `ChildProcess`/`Socket`/`FSWatcher` to mock a raw `spawn` or similar:
   ```
   // before — a proxy invents its own shape of a ChildProcess
   const fakeChild = { pid: 123, kill: jest.fn(), on: jest.fn() } as unknown as ChildProcess;

   // after — the gateway's stub, real shape, real methods, imported from its own file
   import { ChildProcessStub } from '#gateway/node/child_process/child-process/child-process.stub';
   const child = ChildProcessStub();
   ```
   Re-derive the current list of 12 (or however many exist today) rather than trusting the source doc's
   scratch file — see Current state.
9. **Confirm `enforce-stub-usage`'s C5 extension catches a reintroduced violation.** After the swaps
   above, write one throwaway test-file mutation that casts an object literal to a package type in a test
   or proxy file, confirm the extended rule (built in a different item — check whether it already exists;
   if not, report that the extension itself is still open work, since this item's job is the caller-side
   migration, not necessarily building the rule) flags it, then revert the mutation.

## Lint rules this item adds or changes

This item does not build `enforce-stub-usage`'s C5 extension itself (that rule is general infrastructure
shared with `b04`'s and `b12`'s work) — it migrates callers so the rule, once built, has nothing left to
flag in `testing`, `hooks` and `mcp`. If no other item has built the extension by the time this item runs,
report that as a blocker for the acceptance check in step 9, but do not skip the caller migration itself.

## Teaching text this item changes

None directly — this item's teaching-text impact is folded into C5's general row in
[Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md) ("An outside
type — an AST node, a rule context, a `ChildProcess` — comes from the gateway's stub, imported from its
own file. Never build one by hand and cast it.").

## Done when

- [ ] `TypescriptSourceFileStub`, `ChildProcessStub` (hooks copy), `FileStatsStub`, `TimerHandleStub` and
      `McpServerClientStub` contracts, stubs and tests are all deleted.
- [ ] Every caller of the five switched (where a replacement exists) to the gateway's real stub, imported
      from its own file.
- [ ] `EslintInstance` in hooks is investigated and either migrated the same way or reported as a
      DECISIONS item with the reason it differs.
- [ ] Every proxy that built its own fake `ChildProcess`/`Socket`/`FSWatcher` now uses the gateway's
      stub instead.
- [ ] `is-timer-holding-loop-guard.ts`'s `hasRef()` call is verified against a real `TimeoutStub()` value.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Do not start before G16 is `done` (confirmed not landed this session).
- `McpServerClientStub` and its contract are also named in `b02-contract-index-and-unused-contracts.md`'s
  scope — coordinate so only one item's agent actually deletes it.
- `tmp/adaptermove-proxies-fake-handles.txt` is scratch and gitignored; do not assume it still exists or
  is current. Re-derive the 12-proxy list.
- The `TimerHandleStub` fix changes what `is-timer-holding-loop-guard.ts` receives at runtime (a real
  `hasRef`, not a stripped `{}`) — this is intentionally a behavior fix, not a regression, but it means a
  test asserting the old broken behavior needs to be corrected, not preserved.

## Concessions made while executing

