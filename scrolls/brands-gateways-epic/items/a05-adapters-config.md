# A05: Adapters: `config`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` config rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | config |
| Checks to run | lint, typecheck, unit |
| Split | one agent (only 3 files remain) |
| Runs alone | no other agent editing `config` at the same time — note [A00](a00-orchestrator-own-proxy.md) and [A02](a02-forwarder-adapters.md) also touch `config` (its `package.json` and a new `testing.ts`), so this item must not run at the same time as either of those |

## Current state

Census of `packages/config/src/adapters/**` run 2026-09-26: 5 files. **Two are already gone before this item
starts** — [A01](a01-dead-adapters.md) deletes `fs/access/fs-access-adapter.ts` and `fs/write-file/fs-write-file-adapter.ts`
as dead code (zero real callers anywhere in `config`, confirmed by a fresh caller census). Do not look for them; if
they still exist when you start, A01 has not landed yet — report LEFT STANDING and wait.

That leaves 3 adapters, all confirmed `gateway` fate in `coverage.md`, small enough for one batch:

| Path | Replacement |
|---|---|
| `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| `adapters/path/dirname/path-dirname-adapter.ts` | gateway → `@dungeonmaster/node/path` `dirname` (wrapper deleted; callers import `path` directly) |
| `adapters/path/join/path-join-adapter.ts` | gateway → `@dungeonmaster/node/path` `join` (wrapper deleted; callers import `path` directly) |

`config-resolve-broker.ts` (`packages/config/src/brokers/config/resolve/config-resolve-broker.ts`) is the one real
caller of `path-dirname-adapter.ts` today (confirmed by reading it: `pathDirnameAdapter({ path: configPath })`) —
expect this to be the main site you touch for that row.

## Work

1. Switch every caller of each of the 3 adapters to the gateway export named, importing from the `#gateway/node/*`
   path it lives at.
2. `path`'s `dirname` and `join` are plain pass-throughs in the gateway (`export * from 'path'`), so this is purely
   an import-source change for those two rows — there is no wrapper behaviour to reconcile, and per T2 a pure
   pass-through needs no proxy at all (a test calls the real `dirname`/`join` directly).
3. Update the caller's own `.proxy.ts` (`config-resolve-broker.proxy.ts` and any other caller's proxy) to compose
   `readFile`'s own proxy directly — `#gateway/node/fs__promises/read-file/read-file.proxy` — per T1/T3. The two
   `path` rows need no proxy composition at all (see step 2).
4. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
5. Delete all 3 adapters, their `.proxy.ts`, `.test.ts` and any `.stub.ts`, and their now-empty wrapper folders.
   `packages/config/src/adapters/` itself should then be empty — delete it too if this is the last item touching
   it.
6. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 3 adapter files (or the 2 A01 already removed) remain under `packages/config/src/adapters/`.
- `packages/config/src/adapters/` is gone.
- `config-resolve-broker.proxy.ts` (and any other former caller's proxy) composes `readFile`'s own `.proxy` file
  directly, imported per file, never through a barrel.
- `npm run ward -- --only lint,typecheck,unit -- packages/config` exits 0.

## Traps

- Confirm A01 has actually landed (its two `config` deletions) before you start.
- Do not touch `packages/config/package.json`'s `exports` or `packages/config/testing.ts` — those belong to
  [A00](a00-orchestrator-own-proxy.md), which should already have landed. If it has not, report LEFT STANDING
  rather than duplicating that work here.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan (G-G, 2026-09-27)

Current tree check (not the 2026-09-26 census) confirmed A01's two deletions had already landed. The
remaining 3 adapters have MORE real callers than the item's "Current state" table names — the census names
`config-resolve-broker.ts` as "the one real caller" of `path-dirname-adapter.ts`, but a fresh read found two
more: `find-parent-configs-layer-broker.ts` and `config-file-find-broker.ts` (the latter also calls
`path-join-adapter.ts`, the only caller of that adapter). `fs-read-file-adapter.ts` has exactly one real
caller, `config-file-load-broker.ts`. This plan supersedes the item's "Current state" table with what the
code showed. `config-resolve-caller.ts`/`.proxy.ts`/`.test.ts` (F18's caller-facing proxy) mock
`configResolveBroker` as a black box and touch none of these three adapters, so they are out of scope.

Files:

- **Delete** `packages/config/src/adapters/fs/read-file/fs-read-file-adapter.ts`
- **Delete** `packages/config/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts`
- **Delete** `packages/config/src/adapters/fs/read-file/fs-read-file-adapter.test.ts`
- **Delete** `packages/config/src/adapters/path/dirname/path-dirname-adapter.ts`
- **Delete** `packages/config/src/adapters/path/dirname/path-dirname-adapter.proxy.ts`
- **Delete** `packages/config/src/adapters/path/dirname/path-dirname-adapter.test.ts`
- **Delete** `packages/config/src/adapters/path/join/path-join-adapter.ts`
- **Delete** `packages/config/src/adapters/path/join/path-join-adapter.proxy.ts`
- **Delete** `packages/config/src/adapters/path/join/path-join-adapter.test.ts`
- **Edit** `packages/config/src/brokers/config/resolve/config-resolve-broker.ts` — `dirname` from
  `#gateway/node/path` in place of `pathDirnameAdapter`.
- **Edit** `packages/config/src/brokers/config/resolve/config-resolve-broker.proxy.ts` — drop the
  `pathDirnameAdapterProxy` composition and the `setupDirname` method; dirname is a real pass-through call
  now, and every existing test's staged `configPath`/`result` pair already matches what real `dirname`
  computes.
- **Edit** `packages/config/src/brokers/config/resolve/config-resolve-broker.test.ts` — remove the
  `proxy.setupDirname(...)` calls the removed method leaves dangling.
- **Edit** `packages/config/src/brokers/config/resolve/find-parent-configs-layer-broker.ts` — `dirname` from
  `#gateway/node/path` in place of `pathDirnameAdapter`.
- **Edit** `packages/config/src/brokers/config/resolve/find-parent-configs-layer-broker.proxy.ts` — drop the
  `pathDirnameAdapterProxy` composition; rework the previously-dead `setupPackageWithParent` method (staged
  by no test) into `setupPackageWithParentAndMonorepoGrandparent`, a shape that actually reaches the
  migrated `dirname` line and whose outcome differs observably when that call's argument is wrong.
- **Edit** `packages/config/src/brokers/config/resolve/find-parent-configs-layer-broker.test.ts` — add the
  test that drives `setupPackageWithParentAndMonorepoGrandparent`, since nothing in the file previously
  exercised the broker's one `dirname` call at all.
- **Edit** `packages/config/src/brokers/config-file/find/config-file-find-broker.ts` — `dirname`/`join` from
  `#gateway/node/path` in place of `pathDirnameAdapter`/`pathJoinAdapter`.
- **Edit** `packages/config/src/brokers/config-file/find/config-file-find-broker.proxy.ts` — drop
  `pathDirnameAdapterProxy`/`pathJoinAdapterProxy`; both gateway functions are plain pass-throughs with no
  proxy of their own (per T2), so the proxy now calls the real `dirname` only to compute the `directory`
  argument it stages `configRootFindBrokerProxy` (from `@dungeonmaster/shared/testing`) with, and lets the
  real `join` compute the broker's return value — every existing test's literal `configPath` already
  matches what real `join` produces.
- **Edit** `packages/config/src/brokers/config-file/load/config-file-load-broker.ts` — `readFile` from
  `#gateway/node/fs__promises` in place of `fsReadFileAdapter`.
- **Edit** `packages/config/src/brokers/config-file/load/config-file-load-broker.proxy.ts` — compose
  `readFileProxy` from `#gateway/node/fs__promises/read-file/read-file.proxy` in place of
  `fsReadFileAdapterProxy`.

`packages/config/src/adapters/` holds no other files after these 9 deletions, so the folder itself is
deleted too.
