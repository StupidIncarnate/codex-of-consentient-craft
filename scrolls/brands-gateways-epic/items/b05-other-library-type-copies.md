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

## Plan — L4 rest and L3 leftovers

> Written 2026-09-29 by a planning agent (EPIC rule 14). Every path was opened or censused against the tree at
> commit `570835e3e`. Scope: everything L4 still lists as left, and the L3 leftovers. **Nothing under
> `packages/eslint-plugin` or `packages/local-eslint` is planned for now** (L2 runs in `worktrees/gp-l2-tsestree`)
> except the `node-builtin` row and the `@types` delete, both marked "after L2 merges". Moves out use rule 8
> (`tmp/deletions/L4/<original repo-relative path>`), so "move" below means `mkdir -p` then plain `mv`, after
> `discover` shows nothing imports the file.

### Where the EPIC rows are stale (code wins)

- **Hooks, server and mcp have no L3 leftovers.** The L3 row's "Leftovers for L4" (hooks `LinterConfig` in
  `eslint-config-filter-transformer.ts` plus six calls, `eslint-load-config-broker.test.ts`, server
  `ws-event-relay-broadcast-broker` proxy signature and 3 retypes) landed in `51ccf2b5f` (hooks), `682f9d359` (server)
  and `d483bb39b` (mcp). Today `packages/hooks/src/transformers/eslint-config-filter/eslint-config-filter-transformer.ts`
  types off `Linter` from `#gateway/npm/eslint`, `packages/server/src/brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy.ts`
  builds `WsContextStub`, and `packages/mcp/test/harnesses/mcp-server/mcp-server.harness.ts` plus
  `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts` already import `JsonRpcRequestStub` from the
  gateway. **Never re-run `run.cjs` on hooks, mcp or server**: its census reads `stub-map.json`, matches the gateway
  stub of the same name as a copy, and reports 40 phantom mcp swaps and dead copies that were moved out days ago.
- **`process-signal` is not a type copy.** `packages/ward/src/contracts/raw-output/raw-output-contract.ts:24` uses
  `processSignalContract.nullable().default(null)` as a runtime schema for a field that is also read back from saved
  `.ward/` JSON. `NodeJS.Signals` is a type; the field still needs a schema. Plan: `z.custom<NodeJS.Signals>(...)`
  inside that contract (checks a non-empty string, so a saved value from an older run still parses). Ward is the only
  user outside `shared` itself.
- **The "24 casts" are two different things.** The casts tied to a copy (`nodeFactory as unknown as ts.NodeFactory`,
  `as unknown as TypescriptStatement`, `as unknown as ts.Node` in tests) go with the retype. The
  `cloneMap.get(x) as ts.Expression` downcasts (`mock-calls-to-statements-transformer.ts:276-333`) are `ts.Node` to
  subtype casts unrelated to any copy; leave them for B15 and say so in the report.
- **`packages/testing/src/adapters/` no longer exists**; the item's "Why" row on
  `typescript-ast-to-mock-calls-adapter.ts:25` is gone.
- **The `@types` delete touches ten importers of the parser gateway, not six**: 6 integration tests in eslint-plugin
  (4 `typed-*-transformer.integration.test.ts` plus `void-sink-spy-layer-broker.integration.test.ts` and
  `typed-spy-method-takes-no-args-layer-broker.integration.test.ts`), 2 harnesses, and 2 gateway stubs.
- **`TypescriptProgramStub` was in no script and no earlier row.** `typescriptProgramContract` is
  `z.unknown().brand<'TypescriptProgram'>()` and is parsed at runtime by the ts-jest transformer
  `packages/testing/ts-jest/proxy-mock-transformer.js:90`. Retyping it to `ts.Program` therefore edits a JS file that
  EVERY package's Jest run loads (see "Testing quiet wave").
- **`TimerHandle` retype, decision:** `NodeJS.Timeout | NodeJS.Immediate` (the L3 row), and the guard also accepts
  `number` (what jsdom returns, the case its `typeof handle.hasRef !== 'function'` branch exists for), so the
  "handle without hasRef" test passes a plain number instead of a hand-built object.

### Batches

Sizes are edits per agent; "move" lines are `mv` only. "Composes" names the packages whose proxies the batch's proxies
compose, so the operator gates those too. Each agent runs `npm run ward -- --only lint,typecheck,unit -- <its files>`;
`typecheck` grades a package whole, so in a shared package an agent reports (and does not fix) errors in files that
are not on its list.

#### Wave 1: four agents, disjoint packages, run side by side

**S-A — siegelense, `zod-issue-error` onto `z.ZodError`, part 1 (4 files).**
- edit `packages/siegelense/src/transformers/flag-contract-parse/flag-contract-parse-transformer.ts` (drop the
  `zodIssueErrorContract` import at line 19; `catch (error)` becomes `if (!(error instanceof z.ZodError)) throw error;`
  with `import { z } from '#gateway/npm/zod'`; `.issues` map stays; the header paragraph about "only `contracts/` may
  import `zod`" is rewritten in the present tense)
- edit `packages/siegelense/src/transformers/flag-contract-parse/flag-contract-parse-transformer.test.ts` (lines 17-67 build
  `Object.assign(new Error('ignored'), { issues })`; each becomes `new z.ZodError([{ code: 'custom', message, path }])`;
  the plain-`Error` rethrow test stays)
- edit `packages/siegelense/src/transformers/numeric-flag-parse/numeric-flag-parse-transformer.ts` (import at line 23,
  use at line 39)
- edit `packages/siegelense/src/transformers/numeric-flag-parse/numeric-flag-parse-transformer.test.ts` (lines 21, 40, 59)
- Callers of the three transformers keep their signatures and need no edit: `run-args-parse`, `prune-args-parse`,
  `status-args-parse`, `capacity-args-parse`, `results-args-parse`, `kill-args-parse`, `snapshots-args-parse`,
  `compare-args-parse`, `start-args-parse` transformers and `packages/siegelense/src/flows/siegelense/siegelense-flow.ts`.
- Composes: none (transformers). Risk to check first: lint may refuse a value import of `z` in a `transformers/` file
  (the old header says only `contracts/` may import zod; `packages/server/src/transformers/zod-first-field-error-message/zod-first-field-error-message-transformer.ts`
  imports it as a type only). If it refuses, report and stop; do not invent a workaround.

**S-B — siegelense part 2 (3 files).**
- edit `packages/siegelense/src/transformers/enum-flag-parse/enum-flag-parse-transformer.ts` (import line 24, use line 40)
- edit `packages/siegelense/src/transformers/enum-flag-parse/enum-flag-parse-transformer.test.ts` (line 21)
- edit `packages/siegelense/src/brokers/recipe/seed-run/recipe-seed-run-broker.ts` (import line 23, use line 65; header
  lines 6-8 reworded)
- `packages/siegelense/src/brokers/recipe/seed-run/recipe-seed-run-broker.test.ts` needs no edit: its malformed-answer
  case makes the real `seedResultContract.parse` throw a real `ZodError` (assertion at line 70-72 stays).
- Composes: `recipeSeedRunBrokerProxy` is composed by `packages/siegelense/src/brokers/step/reset/step-reset-broker.proxy.ts`
  and `packages/siegelense/src/brokers/instance/start/instance-start-broker.proxy.ts`; the operator gates
  `step-reset-broker.test.ts` and `instance-start-broker.test.ts` (same package). `@dungeonmaster/shared`, `config`,
  `cli` proxies are reached through `recipesLocateBroker`; no source change there.
- S-A and S-B are the same package with disjoint lists.

**P1 — ward, `process-signal` off the shared contract (4 files).**
- edit `packages/ward/src/contracts/raw-output/raw-output-contract.ts` (line 10 import and line 24:
  `signal: z.custom<NodeJS.Signals>(...).nullable().default(null)`; keep the comment block above it)
- edit `packages/ward/src/contracts/raw-output/raw-output-contract.test.ts` (add: a saved `'SIGKILL'` parses to itself,
  `null` stays `null`, an absent key defaults to `null`, an empty string is refused)
- edit `packages/ward/src/transformers/out-of-memory-report/out-of-memory-report-transformer.test.ts` (lines 4, 51, 67:
  `ProcessSignalStub({ value: 'SIGABRT' })` becomes the literal `'SIGABRT'`, typed `NodeJS.Signals`)
- edit `packages/ward/src/guards/is-out-of-memory-failure/is-out-of-memory-failure-guard.test.ts` (lines 3, 38, 47, 77)
- Other writers of `signal` (`check-run-*-broker.ts`, `scan-package-broker.ts`, `scan-package-broker.proxy.ts:58`,
  `multi-package-layer-broker.ts:153`) already hold `NodeJS.Signals | null` and are not edited; the ward typecheck
  proves it.
- Composes: none changed; the operator gates `packages/ward/src/brokers/check-run` and `brokers/command/run` tests
  (they parse `rawOutputContract`).
- BUILD NEEDED after P2: `ward` (ward's own source changed) and `shared`.

**N1 — node-builtin, the two callers that can move now (3 files).**
- edit `packages/shared/src/transformers/gateway-path-from-import-source/gateway-path-from-import-source-transformer.ts`
  (line 23 import becomes `import { builtinModules } from '#gateway/node/module';`, lines 48-50 read it; header line 5
  reworded)
- edit `packages/shared/src/transformers/gateway-path-from-import-source/gateway-path-from-import-source-transformer.test.ts`
  (add: `async_hooks` maps to `#gateway/node/async_hooks` (a name the old list lacked), `node:test` keeps mapping to
  `#gateway/npm/test`, `node:fs/promises` stays `#gateway/node/fs__promises`)
- edit `packages/@gateway/node/src/gateway-node-builtin-globals.integration.test.ts` (delete the hand list at lines
  35-93, `import { builtinModules } from './module/module';`, `folderNamesABuiltinModule` reads it; PURPOSE lines 8-12
  and the comment at 33-34 rewritten to say it reads Node's own list). The file is a gateway file: it may import
  `./module/module`, and still may not import `@dungeonmaster/shared`.
- Composes: none. The operator gates `packages/@gateway/node/src/gateway-node-exports-shape.integration.test.ts` and
  the other `@gateway/node` integration tests, and shared's `gateway-path-from-import-source` consumers
  (`packages/eslint-plugin` rules; run only after L2 merges).
- Shared's own `nodeBuiltinStatics` stays until E2, because `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.ts:27`
  still imports it from `@dungeonmaster/shared/statics`.

#### Wave 2: after Wave 1, two tiny batches (side by side, different packages)

**S-C — siegelense contract move (0 edits, 3 moves).** Only after S-A and S-B are green and `discover` shows nothing
imports it:
- move `packages/siegelense/src/contracts/zod-issue-error/zod-issue-error-contract.ts`
- move `packages/siegelense/src/contracts/zod-issue-error/zod-issue-error-contract.test.ts`
- move `packages/siegelense/src/contracts/zod-issue-error/zod-issue-error.stub.ts`
- then `npm run ward -- --only lint,typecheck,unit -- packages/siegelense` narrowed to the S-A and S-B files.

**P2 — shared `process-signal` move (1 edit, 3 moves).** After P1 is green:
- edit `packages/shared/src/contracts/contracts.ts` (remove line 164, `export * from './process-signal/process-signal-contract';`)
- move `packages/shared/src/contracts/process-signal/process-signal-contract.ts`
- move `packages/shared/src/contracts/process-signal/process-signal-contract.test.ts`
- move `packages/shared/src/contracts/process-signal/process-signal.stub.ts`
- Composes: none. Users of the barrel line outside ward: none (census of `process-signal`/`ProcessSignal` across
  `packages` shows only ward and shared itself). BUILD NEEDED: `shared`, `ward`.

#### Wave 3: testing, on a quiet tree (the operator applies the script, then four agents side by side)

**Quiet-tree rule.** `packages/testing/ts-jest/proxy-mock-transformer.js` loads `packages/testing/src/middleware/**`
and `packages/testing/src/transformers/**` on every Jest run in every package. A half-edited file there fails unrelated
agents' unit runs, and any edit to those folders changes the transformer's cache `version` (it hashes them), so every
package's next Jest run cold-transforms. Run Waves 3 and 4 with no other agent running ward.

**Wave 3 step 0 — the operator, not an agent.** In `tmp/phase34/l3-stub-swaps/run.cjs` (and the committed copy
`scrolls/brands-gateways-epic/phase34-scripts/l3-stub-swaps/run.cjs`) change line 67's `realType` from `'NodeJS.Timeout'`
to `'(NodeJS.Timeout | NodeJS.Immediate)'`: the parentheses are legal in each position the script writes (`Set<...>`,
`...[]`, `handle?: ...`) and lint `--fix` drops the redundant ones. Then
`node tmp/phase34/l3-stub-swaps/run.cjs testing --keep-blocked --no-dependents apply`. The dry run on 2026-09-29 lands
these 17 files (all inside T1-T4's lists or verified by the operator's ward, next bullet) and leaves testing red at
the hand sites:
`packages/testing/src/brokers/timers/watch/timers-watch-broker.ts`,
`packages/testing/src/guards/is-timer-holding-loop/is-timer-holding-loop-guard.ts`,
`packages/testing/src/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware.ts`,
`packages/testing/src/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware.test.ts`,
`packages/testing/src/middleware/typescript-source-file-get/typescript-source-file-get-middleware.ts`,
`packages/testing/src/transformers/ast-local-export-names/ast-local-export-names-transformer.ts` and `.test.ts`,
`packages/testing/src/transformers/ast-mock-calls/ast-mock-calls-transformer.ts` and `.test.ts`,
`packages/testing/src/transformers/ast-module-mock-calls/ast-module-mock-calls-transformer.ts` and `.test.ts`,
`packages/testing/src/transformers/ast-proxy-imports/ast-proxy-imports-transformer.ts` and `.test.ts`,
`packages/testing/src/transformers/mock-calls-to-statements/mock-calls-to-statements-transformer.ts` and `.test.ts`,
`packages/testing/src/transformers/source-file-prepend-statements/source-file-prepend-statements-transformer.ts` and `.test.ts`.
The eight `ast-*` files need no agent: the script's swap is complete there, and the operator runs
`npm run ward -- --only lint,typecheck,unit -- ` on those eight after Wave 3 (they typecheck only once T2-T4 land).

**T1 — timers (3 files).**
- edit `packages/testing/src/brokers/timers/watch/timers-watch-broker.ts` (finish the script's retype; the blockers are
  lines 57, 87 (`as typeof globalThis.setTimeout` no longer overlaps), 124-131 (an `Immediate` in a `Timeout` slot),
  142-152 (`pendingHandles.delete(handle ?? {})` becomes `if (handle !== undefined) { pendingHandles.delete(handle); }`)).
  Keep the `realSetImmediate` `ReturnType` comment only if still true.
- edit `packages/testing/src/guards/is-timer-holding-loop/is-timer-holding-loop-guard.ts` (param
  `handle?: NodeJS.Timeout | NodeJS.Immediate | number`; the `typeof handle.hasRef !== 'function'` branch stays)
- edit `packages/testing/src/guards/is-timer-holding-loop/is-timer-holding-loop-guard.test.ts` (lines 9-33: real
  `TimeoutStub()` and `TimeoutStub({ unref: true })` from `#gateway/node/setTimeout/timeout/timeout.stub`, plus the
  jsdom case as a plain number; the last test already uses a real interval)
- Composes: `timersWatchBrokerProxy` is composed by `packages/testing/src/brokers/open-handle/tracking/open-handle-tracking-broker.proxy.ts`; the operator gates
  `open-handle-tracking-broker.test.ts`. The `hasRef()`-on-a-real-value check of the Done-when list is this batch's
  guard test.

**T2 — program retype, source-file-get and collector (4 files).** `TypescriptProgram` becomes `ts.Program | undefined`
(the middleware already casts `program as unknown as ts.Program | undefined` because ts-jest passes `undefined` in
transpile-only mode; the test at line 53 exercises that), via `import type * as ts from '#gateway/npm/typescript'`.
- edit `packages/testing/src/middleware/typescript-source-file-get/typescript-source-file-get-middleware.ts` (drops
  lines 29-37 casts)
- edit `packages/testing/src/middleware/typescript-source-file-get/typescript-source-file-get-middleware.test.ts`
  (lines 5, 19, 37, 53, 67: `TypescriptProgramStub` becomes `ProgramStub` from
  `#gateway/npm/typescript/program/program.stub` with `{ code, fileName }`; a program that holds nothing is
  `ProgramStub()` asked for a different path; the transpile-only case passes `undefined`)
- edit `packages/testing/src/middleware/proxy-mock-collector/proxy-mock-collector-middleware.ts` (line 30, 39)
- edit `packages/testing/src/middleware/proxy-mock-collector/proxy-mock-collector-middleware.test.ts` (lines 5-8, 17, 78 and
  the other `NoProgramSourceFileStub()` calls)
- Composes: `typescriptSourceFileGetMiddlewareProxy` (composed by `proxy-mock-collector-middleware.proxy.ts` and
  `proxy-reexport-names-resolve-middleware.proxy.ts`, both untouched); `@gateway/npm` `typescript` stubs.

**T3 — program retype, resolve and top-level middleware (4 files).**
- edit `packages/testing/src/middleware/proxy-reexport-names-resolve/proxy-reexport-names-resolve-middleware.ts` (lines 24, 34)
- edit `packages/testing/src/middleware/proxy-reexport-names-resolve/proxy-reexport-names-resolve-middleware.test.ts` (lines 5-8 and the
  `NoProgramSourceFileStub()` calls)
- edit `packages/testing/src/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware.ts` (finish the script's
  retype of `sourceFile`/`nodeFactory`; `program: ts.Program | undefined`; return type `ts.SourceFile`)
- edit `packages/testing/src/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware.test.ts` (blockers at
  lines 13-22: `TypescriptSourceFileStub({ value: { fileName: 'test.test.ts' } })` becomes
  `SourceFileStub({ code: '', fileName: 'test.test.ts' })`; `TypescriptNodeFactoryStub({ value: {} })` becomes `ts.factory`;
  lines 14, 69, 169 `ProgramStub`; the `printFile(transformed as unknown as ts.SourceFile)` casts at 81 and 181 go)
- Composes: `typescriptProxyMockTransformerMiddlewareProxy` composes the collector and resolve proxies above; all in `testing`.

**T4 — transformers with hand casts (4 files).**
- edit `packages/testing/src/transformers/mock-calls-to-statements/mock-calls-to-statements-transformer.ts` (drop line
  27 `nodeFactory as unknown as ts.NodeFactory` and line 347 `as unknown as TypescriptStatement`; return `ts.Statement[]`)
- edit `packages/testing/src/transformers/mock-calls-to-statements/mock-calls-to-statements-transformer.test.ts` (the 16
  `s as unknown as ts.Node` lines and the 14 `TypescriptNodeFactoryStub` leftovers become `ts.factory`)
- edit `packages/testing/src/transformers/source-file-prepend-statements/source-file-prepend-statements-transformer.ts` (drop the
  three casts at lines 27-29 and the return cast at 38)
- edit `packages/testing/src/transformers/source-file-prepend-statements/source-file-prepend-statements-transformer.test.ts` (lines 12-15, 43-58,
  88-90 `Typescript*Stub` leftovers and the three `printFile(... as unknown as ts.SourceFile)` casts)
- Composes: none (transformers). Callers, all on other batches' lists or the script's: `typescript-proxy-mock-transformer-middleware.ts` (T3).

#### Wave 4: after Wave 3, one agent plus the operator's ward

**T5 — the JS transformer and the five contract folders (1 edit, 15 moves).**
- edit `packages/testing/ts-jest/proxy-mock-transformer.js` (remove the `typescriptProgramContract` require at lines
  22-24 and pass `program` straight through at line 90)
- move `packages/testing/src/contracts/typescript-program/typescript-program-contract.ts`, `typescript-program-contract.test.ts`, `typescript-program.stub.ts`
- move `packages/testing/src/contracts/typescript-source-file/typescript-source-file-contract.ts`, `typescript-source-file-contract.test.ts`, `typescript-source-file.stub.ts`
- move `packages/testing/src/contracts/typescript-node-factory/typescript-node-factory-contract.ts`, `typescript-node-factory-contract.test.ts`, `typescript-node-factory.stub.ts`
- move `packages/testing/src/contracts/typescript-statement/typescript-statement-contract.ts`, `typescript-statement-contract.test.ts`, `typescript-statement.stub.ts`
- move `packages/testing/src/contracts/timer-handle/timer-handle-contract.ts`, `timer-handle-contract.test.ts`, `timer-handle.stub.ts`
- Each move only after `discover` on the contract name and file name (tests, proxies, harnesses, `ts-jest/*.js`
  included) returns nothing outside its own folder. The JS edit cannot be linted by the usual rules
  (`jest.setup*.js`-style files are lint-ignored); prove it with a unit run in `packages/testing` AND one in another
  package (for example `packages/shared/src/transformers/gateway-path-from-import-source/gateway-path-from-import-source-transformer.test.ts`),
  since that package's Jest loads the edited transformer.
- The operator then runs `npm run ward -- --only lint,typecheck,unit -- packages/testing` scoped to the Wave 3 and
  Wave 4 files, and the integration tests of the packages that use ts-jest proxies. BUILD NEEDED: `testing`
  (`ts-jest/*` ships from `packages/testing`).

#### Wave 5: blocked, "after L2 merges" (eslint-plugin is being converted in `worktrees/gp-l2-tsestree`)

**E1 — node-builtin, eslint-plugin side (3 edits, 2 moves).**
- edit `packages/eslint-plugin/src/brokers/rule/enforce-import-dependencies/validate-external-import-layer-broker.ts`
  (line 17 import, line 103 use: `builtinModules` from `#gateway/node/module`)
- edit `packages/eslint-plugin/src/brokers/rule/enforce-import-dependencies/validate-external-import-layer-broker.test.ts`
  (add the behavior change the L1 notes name: an `.integration.test.` file importing `fs/promises` or `async_hooks`
  returns true with no report; `node:test` still falls through to a report)
- edit `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.ts` (line 27 stops
  importing `nodeBuiltinStatics` from `@dungeonmaster/shared/statics`; line 140 reads `builtinModules`)
- move `packages/eslint-plugin/src/statics/node-builtin/node-builtin-statics.ts` and `node-builtin-statics.test.ts`
  (redundant even today; no other file imports them)
- Composes: `validateExternalImportLayerBrokerProxy` is an empty proxy composed by
  `rule-enforce-import-dependencies-broker.proxy.ts`; `rulePlatformGlobalsBanBrokerProxy` is composed by
  `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts`. Gate both with
  their brokers' tests plus `rule-platform-globals-ban-broker.integration.test.ts`.

**E2 — node-builtin, shared side (1 edit, 2 moves).** After E1:
- edit `packages/shared/src/statics/statics.ts` (remove line 95, `export * from './node-builtin/node-builtin-statics';`)
- move `packages/shared/src/statics/node-builtin/node-builtin-statics.ts`
- move `packages/shared/src/statics/node-builtin/node-builtin-statics.test.ts`
- BUILD NEEDED: `shared` (eslint-plugin resolves `@dungeonmaster/shared/statics` through `dist` at lint time).

**E3 — delete the root `@types/@typescript-eslint__parser` (1 move, up to 10 fix sites).**
- move `@types/@typescript-eslint__parser/index.d.ts`. `@types/eslint-plugin-eslint-comments` stays.
- Then typecheck `packages/eslint-plugin` and `packages/@gateway/npm` (the ambient module shadows the package's own
  types; `parse` becomes typescript-estree's, not `Linter.Parser['parse']`). The agent edits ONLY the importers whose
  typecheck fails, from this closed list:
  `packages/eslint-plugin/test/harnesses/rule-tester/rule-tester.harness.ts`,
  `packages/eslint-plugin/test/harnesses/typed-rule-tester/typed-rule-tester.harness.ts`,
  `packages/eslint-plugin/src/transformers/typed-function-takes-no-args/typed-function-takes-no-args-transformer.integration.test.ts`,
  `packages/eslint-plugin/src/transformers/typed-parser-services/typed-parser-services-transformer.integration.test.ts`,
  `packages/eslint-plugin/src/transformers/typed-return-is-void-like/typed-return-is-void-like-transformer.integration.test.ts`,
  `packages/eslint-plugin/src/transformers/typed-type-parameter-name/typed-type-parameter-name-transformer.integration.test.ts`,
  `packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with/void-sink-spy-layer-broker.integration.test.ts`,
  `packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with/typed-spy-method-takes-no-args-layer-broker.integration.test.ts`,
  `packages/@gateway/npm/src/typescript-eslint__utils/rule-context/rule-context.stub.ts`,
  `packages/@gateway/npm/src/typescript-eslint__parser/parser-module/parser-module.stub.ts`.
  A fix goes in the call site, never in a re-created shim. Untyped `require('@typescript-eslint/parser')` sites
  (`packages/eslint-plugin/src/tmp-environment.integration.test.ts:240`,
  `packages/eslint-plugin/src/responders/install/detect-config/install-detect-config-responder.ts:24`,
  `packages/testing/src/statics/integration-environment/integration-environment-statics.ts:43`) are `any` and are not
  affected. E3 runs in the eslint-plugin package alongside E1 only if their lists stay disjoint (they are).
  Do not start it before L2 lands: the harnesses are the files L2 rewrites.

### Totals

14 batches: S-A, S-B, S-C, P1, P2, N1, T1, T2, T3, T4, T5, E1, E2, E3. Agents: 11 now (S-C and P2 are tiny move batches
the operator may do itself), plus 3 blocked on L2. Waves: 1 (S-A, S-B, P1, N1 in parallel), 2 (S-C, P2), 3 (script
apply by the operator, then T1-T4 in parallel, tree quiet), 4 (T5, then the operator's testing ward), 5 (E1, then E2 and
E3 in parallel, after L2 merges). Waves 1-2 can overlap Wave 3 only if no agent is running Jest, which is why Wave 3 is
listed last of the unblocked work. Nothing needs a build inside a wave; the operator builds `shared`, `ward` and
`testing` once at the end of Wave 4.

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

