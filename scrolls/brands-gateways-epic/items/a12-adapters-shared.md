# A12: Adapters: `shared`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` shared rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | every other A0x item (do this one EARLY — see Why) |
| Packages touched | shared, and — for the cross-package sweep — cli, eslint-plugin, hooks, hydration-recipes, mcp, orchestrator, server, siegelense, tooling, ward, web |
| Checks to run | lint, typecheck, unit |
| Split | shared's own 19 adapters: operator splits, 2 to 4 files per agent. The cross-package sweep is its own, much larger wave — see Work step 3 |
| Runs alone | shared's own batch: no other agent editing `shared` at the same time. The cross-package sweep touches every other package's files one at a time — coordinate with whichever per-package A0x item is active in each package so two agents never edit the same file |

## Why this item is different from every other A0x item

Every other workspace package's `adapters/` folder is a PRIVATE implementation detail — nothing outside the
package imports an adapter file directly. `shared` is the one exception: `packages/shared/package.json`'s
`exports` map carries a `./adapters` entry (alongside `./contracts`, `./guards`, `./transformers`, `./statics`,
`./brokers`, `./errors`, `./testing`), backed by a root `packages/shared/adapters.ts` barrel that re-exports all 19
adapters with `export *`. Its own header says so: `PURPOSE: Barrel export for shared adapters. USAGE: import {
fsAccessAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';`.

A repo-wide search (`python3` os.walk + regex, run 2026-09-26) for the literal import specifier
`@dungeonmaster/shared/adapters` found 249 files importing it directly, across every workspace package but
`config` and `testing`: `cli`, `eslint-plugin`, `hooks`, `hydration-recipes`, `mcp`, `orchestrator` (by far the
largest share), `server`, `siegelense`, `tooling`, `ward`, and a handful of `web`'s own test harnesses. This is a
materially bigger piece of work than any other package's own migration, and it is the reason this item is marked
"do early" in EPIC.md's Notes column: every one of those 249 files also needs its import switched, in ADDITION to
`shared`'s own 19-file migration, before `packages/shared/adapters.ts` (and the `./adapters` export entry) can be
deleted.

## Current state

Census of `packages/shared/src/adapters/**` run 2026-09-26: 19 files, all `gateway` or `split` fate in
`coverage.md`, none in A01's dead list.

| Batch | Path | Replacement |
|---|---|---|
| 1 | `adapters/child-process/spawn-capture/child-process-spawn-capture-adapter.ts` | gateway → `@dungeonmaster/node/child_process` `run` |
| 1 | `adapters/child-process/spawn-stream-lines/child-process-spawn-stream-lines-adapter.ts` | gateway → `@dungeonmaster/node/child_process` `streamLines` |
| 1 | `adapters/child-process/spawn-stream/child-process-spawn-stream-adapter.ts` | gateway → `@dungeonmaster/node/child_process` `stream` |
| 1 | `adapters/fast-xml-parser/parse/fast-xml-parser-parse-adapter.ts` | gateway → `@dungeonmaster/npm/fast-xml-parser` `parseXml` — sad-path hole noted upstream: no `catch` on malformed XML; do not silently fix this, report it if you touch it |
| 2 | `adapters/fetch/get/fetch-get-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchJson` — the fuller `status`+`body`+`.cause` error shape wins the drift reconciliation against web's own copy of the same name (`scrolls/adapters-to-one-place.md`'s own finding) |
| 2 | `adapters/fs/access/fs-access-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `pathExists` |
| 2 | `adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `existsSync` |
| 2 | `adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `ensureDir` |
| 3 | `adapters/fs/read-file-sync/fs-read-file-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `readFileSync` |
| 3 | `adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.ts` | gateway → `@dungeonmaster/node/fs` `readdirEntriesSync` |
| 3 | `adapters/net/free-port-pair/net-free-port-pair-adapter.ts` | gateway → `@dungeonmaster/node/net` `freePortPair` |
| 3 | `adapters/os/homedir/os-homedir-adapter.ts` | split → `@dungeonmaster/node/os` (`homedir`); the `DUNGEONMASTER_HOME` env-override logic is our own and moves into the calling broker |
| 4 | `adapters/os/user-homedir/os-user-homedir-adapter.ts` | gateway → `@dungeonmaster/node/os` (`homedir`) — the adapter added nothing over the raw call |
| 4 | `adapters/path/basename/path-basename-adapter.ts` | gateway → `@dungeonmaster/node/path` `basename` |
| 4 | `adapters/path/dirname/path-dirname-adapter.ts` | gateway → `@dungeonmaster/node/path` `dirname` |
| 4 | `adapters/path/join/path-join-adapter.ts` | gateway → `@dungeonmaster/node/path` `join` |
| 5 | `adapters/path/resolve/path-resolve-adapter.ts` | gateway → `@dungeonmaster/node/path` `resolve` |
| 5 | `adapters/process/cwd/process-cwd-adapter.ts` | gateway → `@dungeonmaster/node/process` `cwd` |
| 5 | `adapters/runtime/dynamic-import/runtime-dynamic-import-adapter.ts` | gateway → `@dungeonmaster/node/module` `dynamicImport` — fills the gap: a curated property alongside `resolvePackageRoot` on the module gateway object, wrapping the same `import()` expression |

## Work

1. For each of the 19 rows above: switch every caller INSIDE `shared` to the named export, imported from its
   `#gateway/<kind>/<subpath>` path.
2. For `os-homedir-adapter.ts` (split): move the raw `homedir()` call onto `@dungeonmaster/node/os`; keep the
   `DUNGEONMASTER_HOME` env-override as a broker in `shared` (do not delete this logic — it is load-bearing per
   the root `CLAUDE.md`'s "Runtime Configuration" table).
3. **The cross-package sweep.** Once shared's own 19 files no longer import raw Node/npm packages themselves,
   re-run the census that found 249 importers (a `python3` os.walk over every package's `.ts`/`.tsx` files,
   regex-matching the literal specifier `@dungeonmaster/shared/adapters` — Bash `grep`/`find` and native Grep/Glob
   are blocked by hooks) to get the current, real list — it will have moved since 2026-09-26. For every file it
   finds, switch its import from `@dungeonmaster/shared/adapters` to the matching `#gateway/<kind>/<subpath>`
   export directly (the same replacement column above, since every one of shared's 19 adapters is a straight
   gateway pass-through or wrapper by then). This is its own wave of work, separate from and larger than shared's
   own 19-file batch — the operator splits it by CONSUMING package (one agent group per package: `cli`,
   `eslint-plugin`, `hooks`, `hydration-recipes`, `mcp`, `orchestrator`, `server`, `siegelense`, `tooling`, `ward`,
   `web`), 2 to 4 files per agent within each group, same as any other item.
4. Once no file anywhere in the repo imports `@dungeonmaster/shared/adapters`, delete
   `packages/shared/adapters.ts` and its `./adapters` entry from `packages/shared/package.json`'s `exports`.
5. Update every affected caller's `.proxy.ts` (in `shared` AND in every consuming package) to compose the gateway
   wrapper's own `.proxy` file directly, imported per file (e.g.
   `#gateway/node/child_process/run/run.proxy`), never through a barrel, per T1/T3.
6. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
7. Delete every one of shared's 19 adapters, their `.proxy.ts`, `.test.ts` and any `.stub.ts`, and their now-empty
   wrapper folders.
8. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 19 adapter files remain under `packages/shared/src/adapters/`, and the folder is gone.
- `packages/shared/adapters.ts` is gone, and `packages/shared/package.json`'s `exports` has no `./adapters` entry.
- A fresh repo-wide search for the literal specifier `@dungeonmaster/shared/adapters` returns zero hits.
- `npm run ward -- --only lint,typecheck,unit -- <every file this item touched, package by package>` exits 0.

## Traps

- **Do this item BEFORE most other A0x items, not after.** Every other package's own item assumes its callers are
  reaching `#gateway/*` directly by the time that item lands; if a package still imports
  `@dungeonmaster/shared/adapters` when its own A0x item runs, that item's agent will find import lines this item
  was supposed to have already fixed, and will not know whose scope they are in.
- The cross-package sweep is large enough that it is easy to under-scope a ward run. Never run a bare
  `npm run ward` for this item's own verification — scope every check to the files actually touched, per package,
  and only the operator's final whole-branch sweep (`--committed --uncommitted`) should ever see the true width of
  this item.
- `web`'s hits are all test harnesses (`test/harnesses/environment/`, `test/harnesses/session/`, and similar) —
  confirm none of `web`'s PRODUCTION code (`src/adapters/**`, outside `test/`) also imports
  `@dungeonmaster/shared/adapters` before assuming the harness list is the whole story for that package; a fresh
  census may find more by the time you run it.
- `eslint-plugin`'s hits include lint-rule files that CHECK for cross-package adapter imports
  (`rule-enforce-import-dependencies`, `rule-gateway-import-boundary`, `is-npm-package-guard`) — these files
  import `@dungeonmaster/shared/adapters` as TEST FIXTURE DATA (to build a realistic adapter-shaped import to test
  their own rule against), not as production code reaching for a real adapter. Read each one before assuming it
  needs the same treatment as a real caller — a rule's own fixture may legitimately keep referencing the OLD
  import form as a negative test case (something the rule should still flag), depending on what the rule tests.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Operator's split (2026-09-27)

Census on 2026-09-27: 75 caller files inside `shared` (each with its `.proxy.ts`), plus 257 importers of `@dungeonmaster/shared/adapters` in other packages. The largest are `orchestrator` (86), `siegelense` (73), `cli` (20), `ward` (17), `mcp` (13) and `server` (11). As in A02, the split is by CALLER file. No caller group deletes an adapter. `shared/adapters.ts`, `shared/testing.ts`'s adapter-proxy exports and the adapters go in a final group, once nothing imports them.

Phase 1 covers `shared`'s own callers. All paths are under `packages/shared/src/brokers/`.

| Group | Caller folders |
|---|---|
| SH1 | `architecture/boot-tree`, `architecture/edge-graph` |
| SH2 | `architecture/event-bus`, `architecture/export-name-resolve`, `architecture/gateway-inventory` |
| SH3 | `architecture/import-edges`, `architecture/orphan-detect` |
| SH4 | `architecture/package-e2e-eligible-detect`, `architecture/package-inventory`, `architecture/package-type-detect` |
| SH5 | `architecture/project-map`, `architecture/responder-annotations`, `architecture/source-read`, `architecture/state-writes` |
| SH6 | `architecture/widget-tree`, `architecture/ws-edges`, `architecture/ws-gateway` |
| SH7 | `claude-line/normalize`, `config-root/find`, `cwd/resolve`, `dungeonmaster-home/{ensure,find}` (the os-homedir split: the `DUNGEONMASTER_HOME` override stays ours), `gateway-lint-config/read`, `install/check` |
| SH8 | `locations/claude-*` |
| SH9 | `locations/{dispatch-state-path-find,dispatch-state-tmp-path-find,eslint-config-path-find,guild-config-path-find,guild-path-find,guild-quests-path-find}` |
| SH10 | `locations/{hook-config-path-find,mcp-json-path-find,node-modules-bin-path-find,node-modules-path-find,outbox-path-find,planned-work-path-find}` |
| SH11 | `locations/{quest-folder-path-find,quest-images-path-find,rate-limits-*,tsconfig-path-find}` |
| SH12 | `locations/{usage-ledger-*,ward-*,worktree-path-find}`, `port/{config-walk,resolve}`, `project-root/find`, `quests-folder/{ensure,find}` |

Phase 2 is the sweep of other packages, split per consuming package in groups of 4 to 6 caller files. Phase 3 deletes the adapters, the barrel entries and the `./adapters` export.

### Recipe from SH1 (0d788914a) and the sync-fs follow-up (3b63bf848)

| Old adapter | New call (import from `#gateway/node/fs`) | Proxy to compose, per file |
|---|---|---|
| `fsReadFileSyncAdapter({filePath})` | `contentTextContract.parse(readFileSync(filePath))`. Re-brand it: the gateway returns a plain string. | `#gateway/node/fs/read-file-sync/read-file-sync.proxy`: `readFileSyncProxy()` with `returns({path, contents})` or `throws({path, error})`, `returnsMatchingPath({path: predicate, contents})` and `getCallsFor` |
| `fsExistsSyncAdapter({filePath})` | `existsSync(filePath)` | `#gateway/node/fs/exists-sync/exists-sync.proxy`: `existsSyncProxy()` with `returns({path, exists})`, `returnsMatchingPath({path: predicate, exists})` and `getCallsFor`. It never throws. |
| `fsReaddirWithTypesAdapter({dirPath})` | `readdirEntriesSync(dirPath)`, which returns `DirEntrySync[]` (`{name, kind}`) | `#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy`: `returns`/`throws`/`returnsMatchingPath`/`getCallsFor` |

Traps:
- A `brokers/` file may not import `fs`, not even as a type. So a readdir broker returns `DirEntrySync[]`, and each consumer changes `.isDirectory()` to `.kind === 'directory'` and so on.
- `enforce-proxy-child-creation` requires composing the gateway proxy for every gateway name the implementation imports.
- For a path known only at run time, stage it with `returnsMatchingPath({ path: (p) => …, … })`. Never fall back to a raw `registerMock` on `fs`. The only exception is a proxy that also offers a 0-argument `setupImplementation` computed per path (see 3b63bf848's note).
- Find consumers with `discover` using `strict: true` on the bare identifier. An alternation pattern misses some.
- A cross-gateway import typechecks against `@gateway/node`'s compiled output. If `shared`'s typecheck says a gateway proxy method "does not exist", report "build needed: @gateway/node". Do not work around it.

### Recipe for `childProcessSpawnCaptureAdapter` callers (F25, 5b3a16ede)

The broker calls `run({ command, args, cwd })` from `#gateway/node/child_process`. Where the old adapter answered a missing program as a failed run, keep that behaviour by catching `RunNotFoundError` only:

```ts
await run({ command, args, cwd }).catch((error: unknown) => {
  if (!(error instanceof RunNotFoundError)) throw error;
  return { exitCode: 1, output: '', signal: null, timedOut: false };
});
```

The proxy composes the gateway's proxies and stages each call by the exact keys that tell it apart:

```ts
const run = runProxy();
RunNotFoundErrorProxy(); // only when the broker imports RunNotFoundError
run.setupSuccess({ command: 'git', args: ['rev-parse', '--verify', 'main'], exitCode: 0, stdout: '', stderr: '' });
run.setupError({ command: 'git', args: [...], error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }) });
run.getCallsFor({ command: 'git' }); // each call's args array, in call order
```

Never `registerMock({ fn: run })` in a caller's proxy: `runProxy()` now addresses by `command`, `args` and `cwd`.

### Phase 2 census (2026-09-27, after F29)

192 files outside `shared` still import the adapters or their proxies, not counting the orchestrator quest brokers (O3, O4) and siegelense machine, registry, orphan and profile brokers (SL5) in flight. `shared` itself has only three type-only imports left, all in `brokers/architecture/orphan-detect/*.test.ts`. `ward`, `hooks`, `hydration-recipes`, `mcp`, `config` and `tooling` are clean; `cli` has one file left.

| Package | Files | Planned groups |
|---|---|---|
| orchestrator | 101 | `adapters/git/*` (15 folders, the orchestrator's own git adapters on `run`); chat and directory brokers; guild and guild-config; lane and planned-work; smoketest; step-handler; ward and worktree brokers; install and quest responders; three test harnesses |
| siegelense | 69 | npm and playwright adapters; boot-lock, instance and lane brokers; prune, results, status and step brokers; recipe loaders (`dynamicImport`); install and run responders; two harnesses |
| session-forensics | 14 | one group |
| web | 5 | `playwright.config.ts` and four e2e harnesses (homedir only) |
| server | 2 | `responders/server/init` |
| cli | 1 | `bin/cli-entry.ts` |

Phase 3 deletes `packages/shared/src/adapters/`, `packages/shared/adapters.ts`, the "Adapter Proxies" block of `packages/shared/testing.ts` and the `./adapters` export, once this census is empty.

### Trap: a passthrough join composed from far away (O3, O7)

`configRootFindBrokerProxy`, `dungeonmasterHomeFindBrokerProxy` and their kin give the shared `#gateway/node/path` `join` mock a real-passthrough default. A broker whose proxy reaches them transitively (through `questFindQuestPathBrokerProxy`, `questCwdResolveBrokerProxy`, `questRepoRootBrokerProxy` or `cwdResolveBrokerProxy`) can build a wrong path and still pass, because the wrong join is answered for real and a loader proxy that reads by call order serves the right content anyway. Such a broker's proxy exposes `getQuestFileJoinArgs` (read back with `joinHandle.callsMatching([folderPath]).at(0)`), and its test asserts the exact join tuple. Prove it: mutate the join and watch that test fail.

### G-Q

The 3 type-only imports named in "Phase 2 census" above:
- `packages/shared/src/brokers/architecture/orphan-detect/architecture-orphan-detect-broker.test.ts`
- `packages/shared/src/brokers/architecture/orphan-detect/list-walked-folder-files-layer-broker.test.ts`
- `packages/shared/src/brokers/architecture/orphan-detect/walk-reachable-files-layer-broker.test.ts`

Each has `type Dirent = ReturnType<typeof fsReaddirWithTypesAdapter>[0]`, a type-only import of the
shared adapter this item deletes, used to build fake `fs.Dirent`-shaped objects (`isDirectory()`,
`isFile()`, ... methods) that `safeReaddirLayerBrokerProxy.setupReaddirImplementation` feeds straight
to the mocked RAW `fs.readdirSync` — the REAL, unmocked `readdirEntriesSync` then calls those methods
to compute `kind` for real, one layer up. `DirEntrySync` (`{name, kind}`, no methods) is NOT a
same-shape swap here: the real gateway mapping would call `.isFile()` on a plain `{name, kind}` object
and throw at runtime. A direct `import type { Dirent } from 'fs'` in a `.test.ts` file is blocked by
the pre-edit hook (`enforce-import-dependencies`: "brokers/ cannot import external package fs") even
though this domain's sibling `.proxy.ts` files already do exactly that — proxies are exempted, tests
are not. Fix: `#gateway/node/fs`'s own barrel re-exports the whole `'fs'` module (`export * from 'fs'`
in `packages/@gateway/node/src/fs/fs.ts:10`), so `import type { Dirent } from '#gateway/node/fs'` is
an INTERNAL import (matches the hook's own "only internal imports allowed") carrying the identical
real-`fs.Dirent` type. No production code or runtime staging logic in these three files changes.

## Plan

### G-P

Hydration-recipes' last three callers of `@dungeonmaster/shared/adapters`, their proxies, tests, and every composing proxy in hydration-recipes.

Files to edit:
- `packages/hydration-recipes/src/brokers/guild/directory-ensure/guild-directory-ensure-broker.ts` — migrate `pathResolveAdapter` and `fsMkdirAdapter` to `#gateway/node/path` (`resolve`) and `#gateway/node/fs__promises` (`ensureDir`)
- `packages/hydration-recipes/src/brokers/guild/directory-ensure/guild-directory-ensure-broker.proxy.ts` — compose `#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy` (`ensureDirProxy`), expose `setupDirectoryCreation` and `pathsTouched`
- `packages/hydration-recipes/src/brokers/guild/directory-ensure/guild-directory-ensure-broker.test.ts` — stage directory creation via `proxy.setupDirectoryCreation`
- `packages/hydration-recipes/src/brokers/guild/directory-ensure/guild-directory-ensure-broker.integration.test.ts` — integration test verifying directory ensure on real disk
- `packages/hydration-recipes/src/brokers/guild/unique-path-resolve/guild-unique-path-resolve-broker.ts` — migrate `fsExistsSyncAdapter` to `#gateway/node/fs` (`existsSync`)
- `packages/hydration-recipes/src/brokers/guild/unique-path-resolve/guild-unique-path-resolve-broker.proxy.ts` — compose `#gateway/node/fs/exists-sync/exists-sync.proxy` (`existsSyncProxy`), expose `setupExisting` and `setupFree`
- `packages/hydration-recipes/src/brokers/guild/unique-path-resolve/guild-unique-path-resolve-broker.test.ts` — stage free candidate paths via `proxy.setupFree`
- `packages/hydration-recipes/src/brokers/session/unique-id-resolve/session-unique-id-resolve-broker.ts` — migrate `fsExistsSyncAdapter` to `#gateway/node/fs` (`existsSync`)
- `packages/hydration-recipes/src/brokers/session/unique-id-resolve/session-unique-id-resolve-broker.proxy.ts` — compose `#gateway/node/fs/exists-sync/exists-sync.proxy` (`existsSyncProxy`), expose `setupExisting` and `setupFree`
- `packages/hydration-recipes/src/brokers/session/unique-id-resolve/session-unique-id-resolve-broker.test.ts` — stage free candidate paths via `proxy.setupFree`
- `packages/hydration-recipes/src/brokers/guild/api-route/guild-api-route-broker.proxy.ts` — compose child proxies, expose `setupDirectoryCreation` and `setupPathFree`
- `packages/hydration-recipes/src/brokers/guild/api-route/guild-api-route-broker.test.ts` — stage directory creation and free candidate path
- `packages/hydration-recipes/src/brokers/guild/write-route/guild-write-route-broker.proxy.ts` — delegate `setupDirectoryCreation` and stage candidate path as free in `succeeds`/`succeedsWithId`/`setupDirectoryCreation`
- `packages/hydration-recipes/src/brokers/session/write-route/session-write-route-broker.proxy.ts` — stage free candidate path in `succeeds` and expose `setupFree`
- `packages/hydration-recipes/src/brokers/session/write-route/session-write-route-broker.test.ts` — stage free candidate path in error case test

### G-V

Riftcarver's step handler off `childProcessSpawnStreamLinesAdapter`/`pathJoinAdapter` onto `#gateway/node/*`, plus F35's raw-`spawn`-for-`cp` cleanup; and F34's other half — the cleanup and ward step-handler proxies move off a raw `streamLines` mock onto `streamLinesProxy`'s own `getOptionsFor`/`getSpawnedArgs` read-back (F34/F35, cbbe03451 gave the gateway proxy the read-back this needed).

Files to edit:
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts` — `childProcessSpawnStreamLinesAdapter` (`@dungeonmaster/shared/adapters`) → `streamLines` (`#gateway/node/child_process`) for the typecheck spawn
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts` — compose `streamLinesProxy` (`#gateway/node/child_process/stream-lines/stream-lines.proxy`) actively (staged in `setupQuest`/`setupTypecheckFails`, never unconditionally, so an inert construction via `stepHandlerRunBrokerProxy` never collides with ward's own `'dungeonmaster-ward'` address); drop the raw `spawn`(`child_process`)/`mkdir`(`fs/promises`) imports and their two `as never` casts — mock the gateway's own `run` (`#gateway/node/child_process`) and `ensureDir` (`#gateway/node/fs__promises`) directly instead (same "mocked at the wrapper" pattern already used here for `readdirEntriesSync`/`existsSync`/`join`, since the implementation file itself never imports `run`/`ensureDir` and `enforce-proxy-child-creation` refuses a nested `runProxy()`/`ensureDirProxy()` composition here); drop the `pathJoinAdapter` mock entirely — `questOperationsUpdateBroker` (real, out of this item's scope) still calls it for real, and leaving it out of the `@dungeonmaster/shared/adapters` module mock's override list lets `jest.requireActual` serve the real, already-correct implementation
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.test.ts` — no change; existing scenarios cover the migration
- `packages/orchestrator/src/brokers/step-handler/cleanup/step-handler-cleanup-broker.proxy.ts` — attempted, reverted: **BLOCKED**, same reason as ward below (see "Trap: ward's `streamLines` and `run` share one address space" — its closing paragraph covers cleanup too).
- `packages/orchestrator/src/brokers/step-handler/ward/step-handler-ward-broker.proxy.ts` — attempted, reverted: **BLOCKED**, not a file this item can land as planned. See "Trap: ward's `streamLines` and `run` share one address space" below.

### Trap: a shared wrapper function mocked directly replaces it for the WHOLE test file

`registerMock({fn: X})` is keyed on the function REFERENCE `X`, shared across every proxy that mocks it in one test
file — that is the whole point (`get-testing-patterns`' "one function, one behaviour"). It also means mocking a
GATEWAY WRAPPER directly (`run`, `streamLines`, `ensureDir` — anything whose own body calls a lower-level primitive,
as opposed to a near-passthrough like `existsSync`/`readdirEntriesSync`/`join`) replaces that wrapper's REAL
implementation for every OTHER caller in the same test file too — including one that expected the wrapper's real
body to run so it could reach a DIFFERENT proxy's OWN lower-level stage (`ensureDirProxy`/`runProxy` mock `mkdir`/
`spawn`, one level BELOW the wrapper, precisely so the wrapper's own real logic keeps running for everyone). Two
confirmed instances, both in `step-handler-riftcarver-broker.proxy.ts` during this item, both reproduced and fixed
the same way (mock the RAW primitive instead, one level below the wrapper — matching the gateway's own
`run.proxy.ts`/`ensure-dir.proxy.ts` convention):
- `registerMock({fn: run})` (staged for the `cp` hardlink, addressed `{command: 'cp'}`) made `run` a dispatcher with
  ONLY that address staged — `wardDetailBroker`'s own REAL call to `run({command: 'dungeonmaster-ward', args:
  ['detail', ...], ...})` (composed via `wardDetailBrokerProxy` → `runProxy`, expecting `spawn` mocked underneath)
  then hit this dispatcher instead and threw `nothing set up for this call`. Fixed: mock `spawn` (raw `child_process`
  — see the next trap for why the GATEWAY import of `spawn` doesn't work either) instead of `run`.
- `registerMock({fn: ensureDir})` (staged for the node_modules-mirror `mkdir` calls) made `ensureDir` a dispatcher
  with only THOSE addresses staged — `stepHandlerWardBroker`'s own ward-results directory `ensureDir` call (composed
  via `step-handler-ward-broker.proxy.ts` → `ensureDirProxy`, expecting `mkdir` mocked underneath) then hit this
  dispatcher instead and threw the same way. Fixed: mock `mkdir` (raw `fs/promises`) instead of `ensureDir`.

### Trap: ward's `streamLines` and `run` share one address space

`stepHandlerWardBroker`'s own spawn (`streamLines`, command `dungeonmaster-ward`, args `['run', ...]`) and
`wardDetailBroker`'s own spawn (`run`, SAME command `dungeonmaster-ward`, args `['detail', ...]`) both reduce to the
identical raw `spawn` (`'child_process'`) mock underneath — `streamLinesProxy` and `runProxy` both `registerMock({fn:
spawn})` on the SAME shared handle. `runProxy().setupSuccess` accepts an `args`/`cwd` refinement; `streamLinesProxy(
).setupSuccess` accepts `command` ONLY (confirmed: `packages/@gateway/node/src/child_process/stream-lines/stream-lines.proxy.ts`'s
own `setupSuccess` signature has no `args`/`cwd` param). `wardDetailBrokerProxy` (`packages/orchestrator/src/brokers/ward/detail/ward-detail-broker.proxy.ts`)
already stages `run` addressed by `{command: WARD_COMMAND}` alone too (no `args`), so BOTH proxies stage the exact
same address `['dungeonmaster-ward']` at equal specificity. Composing `stepHandlerWardBrokerProxy` with
`streamLinesProxy()` staged actively (`wardExits` → `spawn.setupSuccess({command: WARD_COMMAND, ...})`, called AFTER
`detailProxy.setupSuccess(...)` inside the same method) makes the LATER registration win everywhere
(`mockStagedBestMatchTransformer`: "later-written staging wins" at equal score) — so ward's OWN run gets answered
by the `run`-shaped mock, which emits `'exit'`, never `'close'`. `streamLines()`'s real wrapper (`stream-lines.ts`)
listens ONLY for `child.on('close', ...)`, so its promise never resolves — a real, confirmed hang (`TIMEOUT: Test
killed before reaching any expect() calls`, all three `wardExits`-driven tests in `step-handler-ward-broker.test.ts`
plus `step-handler-run-broker.test.ts`'s ward-dispatch test). Reproduced outside jest with a minimal script
mirroring `createMockChild`/`setupSuccess` exactly — the mock mechanics themselves are correct; the collision is
address-space, not implementation. **Fix needed on the gateway side** (`packages/@gateway/node`, out of this item's
scope): give `streamLinesProxy().setupSuccess` (and its sibling stage methods) the same `args`/`cwd` params
`runProxy().setupSuccess` already has, so two callers of the SAME binary via different gateway wrappers can be
staged at different specificities. Until then, `step-handler-ward-broker.proxy.ts` stays on its pre-migration
design: `streamLinesProxy()` composed INERTLY (satisfies `enforce-proxy-child-creation`) and `streamLines` itself
mocked directly, exactly as it was before this item.

### F51

Gives `streamLinesProxy` the `args`/`cwd` match `runProxy` already has, then moves cleanup, ward and riftcarver's
step-handler proxies off their raw `streamLines`/`spawn`/`mkdir` mocks onto the gateway's own proxies, which is
what the two Trap sections above were blocked on.

Files to edit:
- `packages/@gateway/node/src/child_process/stream-lines/stream-lines.proxy.ts` — add a local `SpawnArgsMatcher`
  type and `buildSpawnAddress` helper (same shape as `run.proxy.ts`'s own, duplicated rather than shared — `run.proxy.ts`'s own comment explains why a matcher type stays local to its own file), so `setupSuccess`/`setupSignalKill`/`setupStderrOnly`/`setupError` each take optional `args`/`cwd` params and address the underlying `spawn` mock the same way `runProxy` does. `getOptionsFor`/`getSpawnedArgs` stay as they are — they already read back `cwd` and the raw args array.
- `packages/@gateway/node/src/child_process/stream-lines/stream-lines.test.ts` — new tests proving two `setupSuccess` calls for the SAME `command` with different `args` resolve to different staged results, and that a call whose args do not match either falls through as unanswered.
- `packages/orchestrator/src/brokers/step-handler/ward/step-handler-ward-broker.proxy.ts` — drop the raw `registerMock({fn: streamLines})` queue and its `import { streamLines } from '#gateway/node/child_process'`; stage the handler's own spawn through `streamLinesProxy().setupSuccess({command: WARD_COMMAND, args: <predicate matching the 'run' subcommand>, exitCode, stdoutLines})`, which the real `streamLines` wrapper now runs for real against, discriminating it from `wardDetailBrokerProxy`'s own `runProxy().setupSuccess({command: WARD_COMMAND, ...})` (no args) staged for the `detail` subcommand. `getSpawnedWardArgs`/`getSpawnedWardCwd` move onto `streamLinesProxy`'s own `getSpawnedArgs`/`getOptionsFor`.
- `packages/orchestrator/src/brokers/step-handler/ward/step-handler-ward-broker.test.ts` — no behavior change expected; re-run to confirm every existing assertion still holds against the new staging.
- `packages/orchestrator/src/brokers/step-handler/cleanup/step-handler-cleanup-broker.proxy.ts` — drop the raw `registerMock({fn: streamLines})` and its `import { streamLines } from '#gateway/node/child_process'`; stage through `streamLinesProxy().setupSuccess({command: cleanupCliCallStatics.call.bin, exitCode, stdoutLines})` (no `args`/`cwd` needed — cleanup's own command, `'dungeonmaster'`, never collides with ward's `'dungeonmaster-ward'`). `getSpawnedCommand`/`getSpawnedArgs`/`getSpawnedCwd` move onto `streamLinesProxy`'s own read-back.
- `packages/orchestrator/src/brokers/step-handler/cleanup/step-handler-cleanup-broker.test.ts` — no behavior change expected; re-run to confirm.
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts` — drop the raw `registerMock({fn: spawn})` staged for the `cp` hardlink call (and its `createCpChild`/`ChildProcess`/`EventEmitter`/`Readable`/`spawn` imports), replacing it with `runProxy().setupSuccess({command: 'cp', exitCode: 0, stdout: '', stderr: ''})` — `runProxy` and `streamLinesProxy` share the one raw `spawn` mock underneath (same as `wardDetailBrokerProxy`/`stepHandlerWardBrokerProxy` already rely on), and `'cp'` never collides with `wardCommandStatics.bin`. Drop the raw `registerMock({fn: mkdir})` (and its `mkdir` import from `'fs/promises'`) staged for the node_modules-mirror and riftcarver-results directories, replacing each `.calledWith([path]).resolves(undefined)` call with `ensureDirProxy().succeeds({path})` — the same proxy `riftcarverPersistResultBrokerProxy` and `stepHandlerWardBrokerProxy` already compose, safe here because each stages a DIFFERENT path.
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.test.ts` — no behavior change expected; re-run to confirm.
- `packages/orchestrator/src/brokers/step-handler/run/step-handler-run-broker.proxy.ts` — no edit expected (composes the three above unchanged); re-run its whole-file test to prove cleanup, ward and riftcarver's proxies now coexist with no address collision.
- `packages/orchestrator/src/brokers/step-handler/run/step-handler-run-broker.test.ts` — no behavior change expected; re-run to confirm.

**This also blocks cleanup, transitively — not from its own address space, but from ward's fix for the trap above.**
Ward's own `registerMock({fn: streamLines})` (staged `{command: 'dungeonmaster-ward'}`) is itself an instance of the
PREVIOUS trap ("a shared wrapper function mocked directly replaces it for the WHOLE test file") — it replaces
`streamLines` globally for every file that composes ward's proxy. `stepHandlerCleanupBrokerProxy`, migrated onto
`streamLinesProxy()` (spawn-level, needing `streamLines`'s real body to run so it can reach the mocked `spawn`),
passes on its OWN, standalone test file (nothing else there touches `streamLines`), but fails wherever
`step-handler-run-broker.proxy.ts` composes it ALONGSIDE ward's: ward's direct mock answers cleanup's own
`streamLines({command: 'dungeonmaster', ...})` call too (the dispatcher has nothing staged for the `'dungeonmaster'`
address, only ward's `'dungeonmaster-ward'` one), and throws the same `nothing set up for this call`. Cleanup's own
migration is sound in isolation; it is ward's forced non-migration that makes it unsafe wherever the two are
composed together. Both proxies have to agree on ONE strategy (both mock `streamLines` directly) until the gateway
gap above closes and ward can move too.

### G-S

Siegelense's remaining callers of `@dungeonmaster/shared/adapters` and shared's adapter-proxy barrel
(`@dungeonmaster/shared/testing`) — SL10's own named scope plus the two `registry/*` extras the Phase 2 triage
found. Package: siegelense only.

Files to edit:
- `packages/siegelense/src/brokers/recipe/seed-run/recipe-seed-run-broker.ts` — `runtimeDynamicImportAdapter` (`@dungeonmaster/shared/adapters`) → `dynamicImport` (`#gateway/node/module`)
- `packages/siegelense/src/brokers/recipe/seed-run/recipe-seed-run-broker.proxy.ts` — compose `dynamicImportProxy` (`#gateway/node/module/dynamic-import/dynamic-import.proxy`, phantom — the gateway proxy stages nothing) and `registerMock({ fn: dynamicImport })` addressed by `{ path }`, matching the established pattern in `packages/cli/src/brokers/install/execute/install-execute-broker.proxy.ts`
- `packages/siegelense/src/brokers/recipes/read/recipes-read-broker.ts` — same `dynamicImport` swap
- `packages/siegelense/src/brokers/recipes/read/recipes-read-broker.proxy.ts` — same `dynamicImportProxy` + `registerMock({ fn: dynamicImport })` pattern
- `packages/siegelense/src/brokers/step/seed/step-seed-broker.ts` — same `dynamicImport` swap
- `packages/siegelense/src/brokers/step/seed/step-seed-broker.proxy.ts` — same `dynamicImportProxy` + `registerMock({ fn: dynamicImport })` pattern
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts` — `fsMkdirAdapter` (`@dungeonmaster/shared/adapters`) → `ensureDir` (`#gateway/node/fs__promises`); drops the now-unused `filePathContract` import (`ensureDir` takes a raw string, no re-brand needed)
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.proxy.ts` — compose `ensureDirProxy` (`#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy`); the old shared proxy answered every unaddressed call via its own `calledWith([]).resolves(...)` catch-all default, which the gateway proxy carries none of, so `stagePathResolution` now explicitly stages `mkdirProxy.succeeds({ path: rootPath })` (the exact real address every scenario resolves) and `getCreatedDirs` reads back via `mkdirProxy.getCallsFor({ path: rootPath })`
- `packages/siegelense/src/brokers/registry/read/registry-read-broker.ts` — `fsExistsSyncAdapter` (`@dungeonmaster/shared/adapters`) → `existsSync` (`#gateway/node/fs`); drops the now-unused `filePathContract` import
- `packages/siegelense/src/brokers/registry/read/registry-read-broker.proxy.ts` — compose `existsSyncProxy` (`#gateway/node/fs/exists-sync/exists-sync.proxy`), renaming staged params (`filePath`→`path`, `result`→`exists`) — every call site already addresses a specific `registryPath`, so no reliance on the deleted catch-all
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.ts` — `fsExistsSyncAdapter`/`fsMkdirAdapter`/`pathJoinAdapter` (`@dungeonmaster/shared/adapters`) → `existsSync` (`#gateway/node/fs`), `ensureDir` (`#gateway/node/fs__promises`), `join` (`#gateway/node/path`); drops the now-unused `filePathContract` import
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.proxy.ts` — compose `existsSyncProxy`, `ensureDirProxy`; `join` carries no gateway proxy (a raw passthrough per `#gateway/node/path`), so a sticky real-passthrough default (`requireActual({module:'path'})` + `registerMock({fn: join}).calledWith([]).implement(...)`) is registered directly here, matching `configRootFindBrokerProxy`'s own established pattern — the record-path join stays unaddressed, exactly as it was under the old `pathJoinAdapterProxy`
- `packages/siegelense/src/brokers/prune/run/prune-run-broker.integration.test.ts` — `fsMkdirAdapter` (`@dungeonmaster/shared/adapters`) → `ensureDir` (`#gateway/node/fs__promises`), real disk calls (this is an integration test with nothing mocked); drops the now-unused `FilePathStub` import (its only use was wrapping `fsMkdirAdapter`'s branded input)
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.test.ts` — drops the dedicated "composed with a cross-package proxy" describe block and its `processCwdAdapterProxy` (`@dungeonmaster/shared/testing`) import — see DECISIONS in the report
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.proxy.ts` (not in the original named scope; added here because `enforce-import-dependencies`'s "a test file may only import its own colocated proxy" rule blocks composing `#gateway/node/process/exit/exit.proxy` directly from the `.test.ts` file) — composes `#gateway/node/process/exit/exit.proxy`'s `exitProxy` unconditionally in its own constructor, BEFORE `registerMock({fn: kill})`, so the cross-package `process`-mock-merge regression the deleted `processCwdAdapterProxy` composition used to guard explicitly is now guarded on every test that constructs this proxy — the gateway's own `cwdProxy` is an intentionally empty, real-only proxy (no staging) and cannot reproduce it, but `exitProxy` spies on `process.exit` via the identical `registerSpyOn({object: process, ...})` mechanism the old `processCwdAdapterProxy` used on `process.cwd`, so the same merge path (`mockCallsMergeByModuleTransformer`) is still exercised
- `packages/siegelense/test/harnesses/driver-fleet/driver-fleet.harness.ts` — `pathJoinAdapter` (`@dungeonmaster/shared/adapters`) → raw `join` from `'path'`, matching the established harness convention (`test/harnesses/seed-home/seed-home.harness.ts` already imports raw `path`; the testing-patterns' harness import rules allow `node:fs/path/os` directly)
- `packages/siegelense/test/harnesses/seed-home/seed-home.harness.ts` — `runtimeDynamicImportAdapter` (`@dungeonmaster/shared/adapters`) → `dynamicImport` (`#gateway/node/module`)

