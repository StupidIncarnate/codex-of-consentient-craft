# A11: Adapters: `server`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` server rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [A02](a02-forwarder-adapters.md), [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | server |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (batches below) |
| Runs alone | no other agent editing `server` at the same time |

## Current state

Census of `packages/server/src/adapters/**` run 2026-09-26: 62 files. Two groups this item does NOT touch:

- **46 files under `adapters/orchestrator/`** are one-line forwarders into `@dungeonmaster/orchestrator` —
  [A02](a02-forwarder-adapters.md)'s job.
- `adapters/orchestrator/recover-active-quests/orchestrator-recover-active-quests-adapter.ts` (the 47th file in
  that folder) is dead code — [A01](a01-dead-adapters.md) deletes it (zero real callers, confirmed by a fresh
  census; not a forwarder to redirect, just dead).
- `adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter.ts` and
  `adapters/fs/write-file/fs-write-file-adapter.ts` are ALSO dead code — [A01](a01-dead-adapters.md) deletes both.

That leaves 13 adapters:

| Batch | Path | Replacement |
|---|---|---|
| 1 | `adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `ensureDir` |
| 1 | `adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFileBytes` |
| 1 | `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| 1 | `adapters/fs/realpath/fs-realpath-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `realpath` |
| 2 | `adapters/fs/rm/fs-rm-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rm` |
| 2 | `adapters/fs/stat/fs-stat-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `statIfExists` |
| 2 | `adapters/fs/write-file-base64/fs-write-file-base64-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFileFromBase64` |
| 2 | `adapters/fs/write-file-bytes/fs-write-file-bytes-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFileBytes` |
| 3 | `adapters/glob/find/glob-find-adapter.ts` | gateway → `@dungeonmaster/npm/glob` `glob` — this copy has a dead v7-callback fallback the gateway wrapper drops; confirm nothing here depends on that dead branch before deleting the file |
| 3 | `adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts` | gateway → `@dungeonmaster/npm/@hono/node-ws` `createNodeWebSocket` |
| 3 | `adapters/hono/serve/hono-serve-adapter.ts` | gateway → `@dungeonmaster/npm/@hono/node-server` `serve` |
| 4 | `adapters/process/dev-log/process-dev-log-adapter.ts` | split → `@dungeonmaster/node/process` `stdout`, `getEnv`; the `[dev]` prefix and `VERBOSE=1` gating stay a server broker |
| 4 | `adapters/web-bundle/dist-path/web-bundle-dist-path-adapter.ts` | split → `@dungeonmaster/node/module` (`resolvePackageRoot`) + `@dungeonmaster/node/fs` `existsSync`; stays an adapter-turned-broker |

**Batch 4's `process-dev-log-adapter.ts` is widely imported and documented.** `packages/server/CLAUDE.md` tells
every session in this package to route dev-mode logging through it by name
(`import { processDevLogAdapter } from '../adapters/process/dev-log/process-dev-log-adapter';`). Keep the exported
function's name and call shape stable (`processDevLogBroker` or similar, still taking `{ message }` and still
gated behind `VERBOSE=1` with the `[dev]` prefix) so every existing call site only needs its import path updated,
not its call shape — `packages/server/CLAUDE.md`'s own examples of the log format (`[dev] 🌐 WebSocket client
connected`, and so on) must keep producing byte-identical output. Do not update `CLAUDE.md` itself in this item —
that is [Z04](z04-claude-md-and-agents-md.md)'s job, once every A/B/G/T item has landed.

## Work

1. For each `gateway`-fate row: switch every caller to the named export, imported from its `#gateway/<kind>/<subpath>`
   path.
2. For `process-dev-log-adapter.ts`: move the raw `process.stdout.write`/`process.env` calls onto
   `@dungeonmaster/node/process`'s `stdout`/`getEnv`; keep the `[dev]` prefix and `VERBOSE=1` gate as a broker in
   `server`, under the SAME public name every existing caller already imports (read every call site first — this
   file is imported widely).
3. For `web-bundle-dist-path-adapter.ts`: move the outside calls onto `resolvePackageRoot`
   (`@dungeonmaster/node/module`) and `existsSync` (`@dungeonmaster/node/fs`); keep the dist-path resolution logic
   as a broker in `server`.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/node/fs__promises/write-file-bytes/write-file-bytes.proxy`), never through a barrel,
   per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 13 adapter files remain, and — once [A01](a01-dead-adapters.md) and [A02](a02-forwarder-adapters.md)'s
  server work has also landed — `packages/server/src/adapters/` is gone entirely.
- Every existing caller of the dev-log helper still imports a function with the same name and call shape, now from
  a broker, not an adapter.
- `npm run ward -- --only lint,typecheck,unit -- packages/server` exits 0.

## Traps

- Confirm [A01](a01-dead-adapters.md) (3 server deletions) and [A02](a02-forwarder-adapters.md) (46 forwarders)
  have both landed before you start.
- `process-dev-log-adapter.ts` has many call sites across `server` — this is a wide-reaching rename, not a
  contained one; expect your ward scope to touch far more files than the other rows in this item.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
