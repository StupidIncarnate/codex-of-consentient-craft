# A09: Adapters: `mcp`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` mcp rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [A02](a02-forwarder-adapters.md), [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | mcp |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (batches below) |
| Runs alone | no other agent editing `mcp` at the same time |

## Current state

Census of `packages/mcp/src/adapters/**` run 2026-09-26: 31 files, in three groups this item does NOT touch, plus
11 it does:

- **18 files under `adapters/orchestrator/`** are one-line forwarders into `@dungeonmaster/orchestrator` — those
  are [A02](a02-forwarder-adapters.md)'s job, already done before this item starts.
- **2 files are dead code** — [A01](a01-dead-adapters.md) deletes `fs/glob/fs-glob-adapter.ts` and
  `fs/readdir/fs-readdir-adapter.ts` (both confirmed zero real callers, already done before this item starts).
- **The remaining 11** are this item's scope:

| Batch | Path | Replacement |
|---|---|---|
| 1 | `adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `ensureDir` |
| 1 | `adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFileIfExists` |
| 1 | `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` — **has real callers today** (`file-scanner-broker.ts` and at least six other files under `brokers/`/`statics/`/`transformers/`); `scrolls/gateway/followup-sustainability.md`'s own "Also" step 1 names this file as dead, which this epic's own research found FALSE — do not delete it, migrate it |
| 1 | `adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readdirIfExists` |
| 2 | `adapters/fs/stat/fs-stat-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `statIfExists` |
| 2 | `adapters/fs/write-file/fs-write-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFile` |
| 2 | `adapters/glob/find/glob-find-adapter.ts` | gateway → `@dungeonmaster/npm/glob` `glob` — "winning shape" per the npm gateway's own glob design: required ignore list, no v7 callback fallback |
| 3 | `adapters/path/join/path-join-adapter.ts` | gateway → `@dungeonmaster/node/path` `join` — **has a real caller today** (`agents-plugin-create-broker.ts`, three call sites); the same source claim as `fs-read-file-adapter.ts` above is FALSE for this file too — migrate it, do not delete it |
| 3 | `adapters/path/resolve/path-resolve-adapter.ts` | gateway → `@dungeonmaster/node/path` `resolve` |
| 4 | `adapters/shared-package/resolve/find-shared-package-root-layer-adapter.ts` | gateway → `@dungeonmaster/node/fs` `findUpSync` |
| 4 | `adapters/shared-package/resolve/shared-package-resolve-adapter.ts` | gateway → `@dungeonmaster/node/module` (`resolvePackageRoot`) — a new curated helper wrapping `require.resolve` + `dirname` |

## Work

1. For each row: switch every caller to the named export, imported from its `#gateway/<kind>/<subpath>` path.
2. `glob-find-adapter.ts`'s caller (`mcp-discover-broker.ts` and any other) currently takes its ignore list from
   the caller and leaves out directories — confirm the gateway's `glob` wrapper preserves this exact behaviour
   (per `coverage.md`'s note, this is the "winning shape" the other two packages' copies should have matched); if
   the gateway wrapper behaves differently, report it under LEFT STANDING rather than silently changing this
   package's caller behaviour to match the gateway.
3. `shared-package-resolve-adapter.ts`'s replacement, `resolvePackageRoot`, is a NEW curated gateway helper (not a
   1:1 pass-through) — read its real implementation in `#gateway/node/module` before writing the caller, since its
   signature may not match the old adapter's exactly.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/node/fs__promises/read-file/read-file.proxy`), never through a barrel, per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 11 adapter files remain, and — once [A02](a02-forwarder-adapters.md) and
  [A01](a01-dead-adapters.md)'s mcp work has also landed — `packages/mcp/src/adapters/` is gone entirely.
- `npm run ward -- --only lint,typecheck,unit -- packages/mcp` exits 0.

## Traps

- Confirm [A02](a02-forwarder-adapters.md) has landed (the `orchestrator/` subfolder gone) and
  [A01](a01-dead-adapters.md) has landed (`fs/glob` and `fs/readdir` gone) before you start — this item's own
  Needs table names A02 for exactly this reason.
- Do not re-delete `fs-read-file-adapter.ts` or `path-join-adapter.ts` — both are alive, confirmed by real callers,
  despite being named as dead examples in the source doc's prose.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan

### G-A

Scope: `packages/mcp/src/adapters/fs/{mkdir,read-file-if-exists,read-file,readdir-if-exists}/` only.
`fsReaddirIfExistsAdapter` has zero real callers anywhere in `packages/mcp` (confirmed by `discover`) —
delete it and its proxy/test with no caller migration.

Delete (adapter + proxy + test, 4 folders, 12 files):
- `packages/mcp/src/adapters/fs/mkdir/fs-mkdir-adapter.ts`
- `packages/mcp/src/adapters/fs/mkdir/fs-mkdir-adapter.proxy.ts`
- `packages/mcp/src/adapters/fs/mkdir/fs-mkdir-adapter.test.ts`
- `packages/mcp/src/adapters/fs/read-file/fs-read-file-adapter.ts`
- `packages/mcp/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts`
- `packages/mcp/src/adapters/fs/read-file/fs-read-file-adapter.test.ts`
- `packages/mcp/src/adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.ts`
- `packages/mcp/src/adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.proxy.ts`
- `packages/mcp/src/adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.test.ts`
- `packages/mcp/src/adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.ts`
- `packages/mcp/src/adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy.ts`
- `packages/mcp/src/adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.test.ts`

Edit (callers, onto `#gateway/node/fs__promises`):
- `packages/mcp/src/brokers/agents/plugin-create/agents-plugin-create-broker.ts` — `fsMkdirAdapter` → `ensureDir`
- `packages/mcp/src/brokers/agents/plugin-create/agents-plugin-create-broker.proxy.ts` — compose `ensureDirProxy`
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts` — `fsReadFileAdapter` → `readFile`, rebrand via `fileContentsContract`
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts` — compose `readFileProxy`
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.test.ts` — the two failing-read tests move from a raw `new Error(...)` to `FsErrorStub`, since the gateway's `throwsMatchingPath` requires a real `FsError` (`.code`), not a bare `Error`
- `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.ts` — `fsReadFileAdapter` → `readFile`
- `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.proxy.ts` — compose `readFileProxy`; stage each of the 14 real constraint files explicitly (the gateway proxy ships no real-disk passthrough the way the old local adapter proxy did — see DECISIONS)
- `packages/mcp/src/brokers/discover-ignore/init/discover-ignore-init-broker.ts` — `fsReadFileIfExistsAdapter` → `readFileIfExists`; `undefined` sentinel becomes `null`
- `packages/mcp/src/brokers/discover-ignore/init/discover-ignore-init-broker.proxy.ts` — compose `readFileIfExistsProxy`

### G-B

Scope: `packages/mcp/src/adapters/{fs/stat,fs/write-file,glob/find,path/join,path/resolve,shared-package/resolve}/`
(21 files, confirmed by `discover` — matches the item's batches 2-4) and every real caller.

`fsStatAdapter` has zero real callers anywhere in `packages/mcp` (confirmed by `discover` with `strict: true` —
only its own definition, proxy and test reference it; the JSDoc's claimed caller, "the Claude Code session
resolver," does not exist in this package) — delete it and its proxy/test with no caller migration, the same
shape as G-A's `readdirIfExists`.

`findSharedPackageRootLayerAdapter` has zero real callers besides `sharedPackageResolveAdapter` itself.
`#gateway/node/module`'s `resolvePackageRoot({specifier, startDir?})` already implements the SAME
`require.resolve` + walk-up-to-`package.json` recursion internally (confirmed by reading its source) — it is
not a thin 1:1 replacement for `sharedPackageResolveAdapter` alone, it subsumes BOTH mcp adapters at once. Both
are deleted together; the layer adapter has no direct gateway successor because nothing needs one. See
DECISIONS.

Delete (adapter + proxy + test, 7 folders, 21 files):
- `packages/mcp/src/adapters/fs/stat/fs-stat-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/mcp/src/adapters/fs/write-file/fs-write-file-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/mcp/src/adapters/glob/find/glob-find-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/mcp/src/adapters/path/join/path-join-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/mcp/src/adapters/path/resolve/path-resolve-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/mcp/src/adapters/shared-package/resolve/shared-package-resolve-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/mcp/src/adapters/shared-package/resolve/find-shared-package-root-layer-adapter.ts` (+`.proxy.ts`,
  +`.test.ts`)

Edit (callers, onto `#gateway/*`):
- `packages/mcp/src/brokers/agents/plugin-create/agents-plugin-create-broker.ts` — `pathJoinAdapter` → `join`
  (`#gateway/node/path`); `fsWriteFileAdapter` → `writeFile` (`#gateway/node/fs__promises`)
- `packages/mcp/src/brokers/agents/plugin-create/agents-plugin-create-broker.proxy.ts` — compose
  `writeFileProxy`; `registerMock({fn: join})` on the `#gateway/node/path` import (the gateway ships no
  per-file proxy for `join`, per the recipe's own fallback) with a `requireActual` real-passthrough default
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts` — `sharedPackageResolveAdapter` →
  `resolvePackageRoot` (`#gateway/node/module`)
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts` — compose `resolvePackageRootProxy`
  (empty — the gateway ships no mocking hook for this, it is a real `require.resolve` + real `package.json`
  walk, matching the mcp adapter's own test which was ALSO partly real)
- `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.ts` — `pathResolveAdapter` →
  `resolve` (`#gateway/node/path`)
- `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.proxy.ts` — drop
  `pathResolveAdapterProxy` (no gateway proxy ships for `resolve`, it is a real passthrough); use `resolve`
  directly to compute the same addresses `readFileProxy` is staged against
- `packages/mcp/src/brokers/mcp/discover/mcp-discover-broker.ts` — `globFindAdapter` → `glob`
  (`#gateway/npm/glob`), both hint-probe calls (grep-filtered-empty and directory-hint)
- `packages/mcp/src/brokers/mcp/discover/mcp-discover-broker.proxy.ts` — compose `globProxy` and
  `readFileProxy` directly (NOT through `fileScannerBrokerProxy`'s own `setupFiles`, whose `stageScan` prepends
  a root onto `pattern` — this proxy's own `pattern` params are already the full absolute pattern the broker
  computes, so prepending again would double it); `setupGrepFilteredEmpty` restaged as ONE sticky glob answer
  (glob genuinely matches the files) plus non-grep-matching real read content, instead of the old adapter's two
  order-dependent (`onceFor`) answers — see DECISIONS

## Plan — F39 and F58

F58 finding: the edge graph did NOT have the content fallback (`resolve-package-groups-layer-broker.ts` decided HTTP backend from `hasHonoOrExpressAdapterGuard({ adapterDirNames })` alone, and `packages/server` has no `src/adapters`). It now also treats a package as HTTP backend when any `src/flows/**/*-flow.ts` constructs a Hono/Express app.

Files (all shared):
- `packages/shared/src/brokers/architecture/edge-graph/resolve-package-groups-layer-broker.ts` — add the flow-content fallback
- `packages/shared/src/brokers/architecture/edge-graph/resolve-package-groups-layer-broker.proxy.ts` — `setupPackage` gains `flowFiles`
- `packages/shared/src/brokers/architecture/edge-graph/resolve-package-groups-layer-broker.test.ts` — gateway-only Hono package case
- `packages/shared/src/brokers/architecture/edge-graph/resolve-package-groups-layer-broker.integration.test.ts` — new, real tree

Files (mcp), new integration tests reading real disk:
- `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.integration.test.ts` — every constraint file in `folderConstraintsStatics` loads non-empty, keys are folder types in shared's folder config
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.integration.test.ts` — real `resolvePackageRoot` ends in `/shared`, and a broad scan surfaces a real shared file as `@dungeonmaster/shared/...`
