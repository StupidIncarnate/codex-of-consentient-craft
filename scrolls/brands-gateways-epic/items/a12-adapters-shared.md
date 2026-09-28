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
