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

G-C (2026-09-28): two of the item's eight adapters could not be migrated — see the Plan section
below for the full reasoning. `stat` is blocked because `#gateway/node/fs__promises`'s `stat`/
`statIfExists` return `{kind, sizeBytes, modifiedAtMs}` with no `birthtime`, and `session-list-broker.ts`
needs it. `rm` is blocked because `#gateway/node/fs__promises`'s `rmProxy` exposes only exact-path
`succeeds`/`rejects`, no `getCallsFor`/read-back (unlike its sibling `ensureDirProxy`), and
`quest-new-responder.test.ts` asserts the exact `[path, {recursive, force}]` tuple `rm` received. Both
gaps need a gateway-side fix (`stat` gaining a birthtime field, or `rmProxy` gaining a `getCallsFor`
matching `ensureDirProxy`'s) before A11 can close fully.

## Plan — G-C (2026-09-28)

Scope: `packages/server/src/adapters/fs/{mkdir,read-file-bytes,read-file,realpath,rm,stat,write-file-base64,write-file-bytes}/`
(batches 1-2). Package: server only.

Two of the eight are blocked — gateway `#gateway/node/fs__promises` offers no way to complete them, so
they and their sole caller are left untouched and reported:

- **`stat`** — `fs-stat-adapter.ts` returns raw `fs.Stats` and its only caller,
  `session-list-broker.ts`, reads `stats.birthtime.toISOString()`. The gateway's `stat`/`statIfExists`
  return `FileStat = {kind, sizeBytes, modifiedAtMs}` — no `birthtime` field exists anywhere in
  `#gateway/node/fs__promises` or `#gateway/node/fs`. `fs-stat-adapter.ts`, its `.proxy.ts` and
  `.test.ts` stay; only `session-list-broker.ts`'s OTHER call (`fsReadFileAdapter`) migrates.
- **`rm`** — `fs-rm-adapter.ts`'s only caller, `quest-new-responder.ts`, and its test assert the exact
  `[path, {recursive, force}]` tuple `rm` received. `#gateway/node/fs__promises`'s `rmProxy` exposes only
  `succeeds`/`rejects` (both exact-path-only) — no `getCallsFor`/read-back, unlike its sibling
  `ensureDirProxy`. `fs-rm-adapter.ts` (+`.proxy.ts`+`.test.ts`) and `quest-new-responder.ts`
  (+`.proxy.ts`) stay untouched.

Delete (adapter + proxy + test each, folder goes empty):
- `packages/server/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/fs/read-file/fs-read-file-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/fs/realpath/fs-realpath-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/fs/write-file-base64/fs-write-file-base64-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/fs/write-file-bytes/fs-write-file-bytes-adapter.ts` (+`.proxy.ts`+`.test.ts`)

Edit (callers, onto `#gateway/node/fs__promises`):
- `packages/server/src/brokers/image/serve/image-serve-broker.ts` — `fsRealpathAdapter`→`realpath`,
  `fsReadFileBytesAdapter`→`readFileBytes`
- `packages/server/src/brokers/image/serve/image-serve-broker.proxy.ts` — compose `realpathProxy`,
  `readFileBytesProxy`
- `packages/server/src/brokers/local-image/copy/local-image-copy-broker.ts` — `fsReadFileBytesAdapter`→
  `readFileBytes`, `fsWriteFileBytesAdapter`→`writeFileBytes` (its `.filter()` predicate is B17-6's, left as-is)
- `packages/server/src/brokers/local-image/copy/local-image-copy-broker.proxy.ts` — compose
  `readFileBytesProxy`, `writeFileBytesProxy`; add a `sourceReadAttemptedPaths` read-back method
- `packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.ts` —
  `fsMkdirAdapter`→`ensureDir`, `fsWriteFileBase64Adapter`→`writeFileFromBase64`
- `packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.proxy.ts` — compose
  `ensureDirProxy`/`writeFileFromBase64Proxy` (satisfies `enforce-proxy-child-creation`) plus a direct
  predicate-addressed `registerMock` on each gateway export (mirrors `chat-subagent-tail-broker.proxy.ts`'s
  `ensureDir` pattern), since every dirPath/destination this broker computes is runtime-minted and the
  gateway's `succeeds`/`rejects` take only an exact literal path
- `packages/server/src/brokers/session/list/session-list-broker.ts` — `fsReadFileAdapter`→`readFile` only;
  `fsStatAdapter` stays (blocked, see above)
- `packages/server/src/brokers/session/list/session-list-broker.proxy.ts` — compose `readFileProxy` for the
  read half only
- `packages/server/src/brokers/web-bundle/response/web-bundle-response-broker.ts` — `fsReadFileAdapter`→
  `readFile`
- `packages/server/src/brokers/web-bundle/response/web-bundle-response-broker.proxy.ts` — compose
  `readFileProxy`
- `packages/server/src/responders/quest/riftcarver-detail/quest-riftcarver-detail-responder.ts` —
  `fsReadFileAdapter`→`readFile`
- `packages/server/src/responders/quest/riftcarver-detail/quest-riftcarver-detail-responder.proxy.ts` —
  compose `readFileProxy`
- `packages/server/src/responders/quest/ward-detail/quest-ward-detail-responder.ts` —
  `fsReadFileAdapter`→`readFile`
- `packages/server/src/responders/quest/ward-detail/quest-ward-detail-responder.proxy.ts` — compose
  `readFileProxy`
- `packages/server/src/responders/server/init/server-init-responder.ts` — `fsReadFileAdapter`→`readFile`
- `packages/server/src/responders/server/init/server-init-responder.proxy.ts` — compose `readFileProxy`

Found during implementation, added to scope (same package, both compose `pastedImagePersistBrokerProxy`
and each ran its OWN read-only `registerMock({fn: writeFile})` on raw `fs/promises` to read back upload
payloads — broken once the persist broker's write moved off that raw path; redirected to the gateway's
`writeFileFromBase64` instead, which also drops a pre-existing raw-`fs/promises` import each file carried):
- `packages/server/src/responders/quest/chat/quest-chat-responder.proxy.ts`
- `packages/server/src/responders/quest/new/quest-new-responder.proxy.ts`

## Plan — G-D (2026-09-28)

Scope: `packages/server/src/adapters/{glob/find,hono/create-node-web-socket,hono/serve,process/dev-log,web-bundle/dist-path,zod/first-field-error-message}/`
(batches 3-4, plus the item's undocumented ninth adapter). Package: server only, sequenced after G-C.

Every one of the six has a real gateway route — none is blocked.

**`glob/find`** → `#gateway/npm/glob`'s `glob` (required `ignore`, and `nodir` defaults to `true`
where the deleted copy's underlying `nodir: false` never changed — passed explicitly to keep
scan behaviour identical). Sole caller: `session-list-broker.ts`'s two direct/cross-project scans.

**`hono/create-node-web-socket`** and **`hono/serve`** already import their npm calls through
`#gateway/npm/hono__node-ws` / `#gateway/npm/hono__node-server` internally — the adapter step
itself is just a redundant forwarder. Neither wrapper subpath ships a `.proxy.ts` (confirmed:
`packages/@gateway/npm/src/hono__node-ws/node-web-socket/` and
`.../hono__node-server/server/` hold only `.stub.ts` files), so per the recipe's "or
`registerMock({ fn: join })` on the `#gateway/*` import where the gateway ships no proxy" clause,
the sole caller's own proxy (`server-init-responder.proxy.ts`) stages `createNodeWebSocket`/`serve`
directly via `registerMock` on the gateway import, inlining the deleted adapters' own proxy bodies
verbatim (including `hono-serve-adapter.proxy.ts`'s `registerModuleMock({ module: '@hono/node-server' })`,
which blocks the RAW npm package's own module-load side effect — SIGTERM listener registration —
and must stay pointed at the raw specifier, since that is the module whose load it is suppressing,
not the gateway barrel). Sole caller: `server-init-responder.ts`.

**`process/dev-log`** splits per the item: `@dungeonmaster/node/process`'s `stdout`/`getEnv` for the
I/O, a new **broker** (`brokers/process/dev-log/process-dev-log-broker.ts`, export
`processDevLogBroker`) for the `[dev]`-prefix/`VERBOSE=1` gating logic — an adapter may not compose
another adapter, but the gating logic has no npm call of its own to wrap, so it is business logic,
not an I/O boundary. Same `{ message }` shape, same output. Wide caller list (read every call site
first, confirmed exhaustive via `discover`): `brokers/image/serve/image-serve-broker.ts`,
`responders/image/serve/image-serve-responder.ts`,
`responders/quest-driven-watchers/bootstrap/quest-driven-watchers-bootstrap-responder.ts`,
`responders/quest-driven-watchers/bootstrap/reconcile-watchers-layer-responder.ts`,
`responders/server/init/server-init-responder.ts` — each with its own `.proxy.ts`. `CLAUDE.md`'s
own dev-log section is untouched here, per the item (Z04's job).

**`web-bundle/dist-path`** splits per the item: `resolvePackageRoot` (`#gateway/node/module`) +
`existsSync` (`#gateway/node/fs`) for the I/O, a new **broker**
(`brokers/web-bundle/dist-path/web-bundle-dist-path-broker.ts`, export `webBundleDistPathBroker`)
for the resolution logic, alongside its sibling `brokers/web-bundle/response/`. Fixes the F32 note
in the same move: the deleted adapter's own proxy staged `existsSync` with an address-less
`calledWith([]).returns(true)` (answers ANY path) and imported raw `fs`'s `existsSync` directly —
the new broker's proxy addresses `existsSyncProxy()` by the REAL dist path
`resolvePackageRoot` really resolves for `@dungeonmaster/web` (that resolution has no mocking hook
— see `resolve-package-root.proxy.ts`'s own header — so it runs for real in the proxy too), and
imports only `#gateway/node/fs/exists-sync/exists-sync.proxy`. Sole caller:
`brokers/web-bundle/response/web-bundle-response-broker.ts` (+ `.proxy.ts`, which calls the real
broker directly the same way it called the real adapter before).

**`zod/first-field-error-message`** (the item's ninth, undocumented adapter — no outside call at
all) becomes a **transformer**: `transformers/zod-first-field-error-message/zod-first-field-error-message-transformer.ts`,
export `zodFirstFieldErrorMessageTransformer`. Its body only reads `.issues`/`.message`/`.path` off
a `z.ZodError`, but `transformers/` may not import `zod` (only `contracts/` may) — so it takes
`error: unknown` and matches the shape through a new contract,
`contracts/zod-issue-error/zod-issue-error-contract.ts` (+`.test.ts`+`.stub.ts`), copying
siegelense's own `zod-issue-error-contract.ts` (`flagContractParseTransformer`'s solution to the
identical problem). Five callers, each just the import swap (transformers need no proxy, so each
composing `.proxy.ts` drops its `zodFirstFieldErrorMessageAdapterProxy()` call and import
entirely — `parseImplementationImportsTransformer` excludes transformer imports from
`enforce-proxy-child-creation`'s tracked set): `responders/quest/chat/quest-chat-responder.ts`,
`responders/quest/clarify/quest-clarify-responder.ts`,
`responders/quest/followup/quest-followup-responder.ts`,
`responders/quest/new/quest-new-responder.ts`, `responders/quest/user-add/quest-user-add-responder.ts`
— each with its own `.proxy.ts`.

New files:
- `packages/server/src/contracts/zod-issue-error/zod-issue-error-contract.ts` (+`.test.ts`+`.stub.ts`)
- `packages/server/src/transformers/zod-first-field-error-message/zod-first-field-error-message-transformer.ts` (+`.test.ts`)
- `packages/server/src/statics/glob-ignore/glob-ignore-statics.ts` (+`.test.ts`) — the four ignore
  patterns the deleted `glob-find-adapter.ts` hard-coded, now required as an explicit caller arg
- `packages/server/src/brokers/process/dev-log/process-dev-log-broker.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/brokers/web-bundle/dist-path/web-bundle-dist-path-broker.ts` (+`.proxy.ts`+`.test.ts`)

Edit (callers, onto the gateway/new files above):
- `packages/server/src/brokers/session/list/session-list-broker.ts` — glob
- `packages/server/src/brokers/session/list/session-list-broker.proxy.ts` — glob
- `packages/server/src/responders/server/init/server-init-responder.ts` — hono create-node-web-socket,
  hono serve, process-dev-log
- `packages/server/src/responders/server/init/server-init-responder.proxy.ts` — hono, process-dev-log
- `packages/server/src/brokers/image/serve/image-serve-broker.ts` — process-dev-log
- `packages/server/src/brokers/image/serve/image-serve-broker.proxy.ts` — process-dev-log
- `packages/server/src/responders/image/serve/image-serve-responder.ts` — process-dev-log
- `packages/server/src/responders/image/serve/image-serve-responder.proxy.ts` — process-dev-log
- `packages/server/src/responders/quest-driven-watchers/bootstrap/quest-driven-watchers-bootstrap-responder.ts` — process-dev-log
- `packages/server/src/responders/quest-driven-watchers/bootstrap/quest-driven-watchers-bootstrap-responder.proxy.ts` — process-dev-log
- `packages/server/src/responders/quest-driven-watchers/bootstrap/reconcile-watchers-layer-responder.ts` — process-dev-log
- `packages/server/src/responders/quest-driven-watchers/bootstrap/reconcile-watchers-layer-responder.proxy.ts` — process-dev-log
- `packages/server/src/brokers/web-bundle/response/web-bundle-response-broker.ts` — web-bundle-dist-path
- `packages/server/src/brokers/web-bundle/response/web-bundle-response-broker.proxy.ts` — web-bundle-dist-path
- `packages/server/src/responders/quest/chat/quest-chat-responder.ts` — zod transformer
- `packages/server/src/responders/quest/chat/quest-chat-responder.proxy.ts` — zod transformer
- `packages/server/src/responders/quest/clarify/quest-clarify-responder.ts` — zod transformer
- `packages/server/src/responders/quest/clarify/quest-clarify-responder.proxy.ts` — zod transformer
- `packages/server/src/responders/quest/followup/quest-followup-responder.ts` — zod transformer
- `packages/server/src/responders/quest/followup/quest-followup-responder.proxy.ts` — zod transformer
- `packages/server/src/responders/quest/new/quest-new-responder.ts` — zod transformer
- `packages/server/src/responders/quest/new/quest-new-responder.proxy.ts` — zod transformer (`fs-rm-adapter`
  and its raw `fs/promises` `rm` import in this same file stay untouched — G-C's blocked `fs/rm`)
- `packages/server/src/responders/quest/user-add/quest-user-add-responder.ts` — zod transformer
- `packages/server/src/responders/quest/user-add/quest-user-add-responder.proxy.ts` — zod transformer

Delete (adapter + proxy + test each, folder goes empty):
- `packages/server/src/adapters/glob/find/glob-find-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/hono/serve/hono-serve-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/process/dev-log/process-dev-log-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/web-bundle/dist-path/web-bundle-dist-path-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/zod/first-field-error-message/zod-first-field-error-message-adapter.ts` (+`.proxy.ts`+`.test.ts`)

Not touched (blocked, G-C's concession, another agent's gateway fix): `packages/server/src/adapters/fs/{rm,stat}/`
and their sole callers `quest-new-responder.ts`/`session-list-broker.ts`'s `fsStatAdapter` half.
`packages/server/src/adapters/` is NOT fully empty after this item lands — those two folders remain.

## Plan — F44 callers

Scope: `packages/server/src/adapters/fs/{stat,rm}/` (the two G-C left standing) and their sole
callers. Package: server only. The gateway gap G-C hit is closed by cbbe03451 (built): `stat`/
`statIfExists` now return `createdAtMs` (from `birthtimeMs`), and `rmProxy` gained a `getCallsFor`
read-back of each call's full `[path, options]` tuple. Both adapters migrate now.

Edit (callers, onto `#gateway/node/fs__promises`):
- `packages/server/src/brokers/session/list/session-list-broker.ts` — `fsStatAdapter` → `stat`;
  `stats.birthtime.toISOString()` → `new Date(stats.createdAtMs).toISOString()` (same ISO string,
  since `createdAtMs` is `Math.floor(stats.birthtimeMs)`, the same source `Stats.birthtime` derives
  from); `stats.mtimeMs` → `stats.modifiedAtMs`
- `packages/server/src/brokers/session/list/session-list-broker.proxy.ts` — compose `statProxy`
  (`#gateway/node/fs__promises/stat/stat.proxy`) in place of `fsStatAdapterProxy`; `setupFileStat`
  stages `returnsFile({path, sizeBytes: 0, modifiedAtMs, createdAtMs: birthtime.getTime()})`;
  `setupFileStatError` stages `throwsMatchingPath({path, error})` mirroring the file this proxy
  already does the identical FsError-shaping trick for (`setupFileContentError`'s
  `Object.assign(error, {code: ...})`)
- `packages/server/src/responders/quest/new/quest-new-responder.ts` — `fsRmAdapter` → `rm`
- `packages/server/src/responders/quest/new/quest-new-responder.proxy.ts` — compose `rmProxy`
  (`#gateway/node/fs__promises/rm/rm.proxy`) in place of `fsRmAdapterProxy`; since the real removal
  target (`locationsQuestFolderPathFindBroker`'s output) is minted from a guildId/questId this proxy
  never receives ahead of test setup and `rmProxy`'s own `succeeds`/`rejects` take only an exact
  literal path, the real call is mocked directly on the gateway `rm` export instead (mirrors
  `pasted-image-persist-broker.proxy.ts`'s own `ensureDir`/`writeFileFromBase64` pattern), addressed
  by the one structural fact every such call shares — the path always falls under a guild's `quests`
  directory; `getRemovedFolderCallsInOrder` reads back through `rmProxy().getCallsFor`, which shares
  the same underlying mock; drops the raw `import { rm } from 'fs/promises'` entirely

Delete (adapter + proxy + test each, folder goes empty):
- `packages/server/src/adapters/fs/stat/fs-stat-adapter.ts` (+`.proxy.ts`+`.test.ts`)
- `packages/server/src/adapters/fs/rm/fs-rm-adapter.ts` (+`.proxy.ts`+`.test.ts`)

After this: `packages/server/src/adapters/` no longer exists (both `fs/stat/` and `fs/rm/` are the
only folders left standing after G-C/G-D, per the census in "Current state").

## Plan — F49

Scope: `@gateway/npm`'s `hono__node-server` and `hono__node-ws` subpaths, plus server's
`server-init-responder.proxy.ts`. Packages: `@gateway/npm` and `server` only.

New (gateway wrapper, proxy, test — the subpath folders `server/` and `node-web-socket/` already
hold a `.stub.ts` each from G18; this adds the missing wrapper + proxy the colocation rule requires
once a wrapper file exists):
- `packages/@gateway/npm/src/hono__node-server/server/server.ts` — OUR guarded `serve`, narrowed to
  the `{fetch, port, hostname}` / `{port}` listener shape every caller in this repo passes, typed via
  `Parameters<typeof pkgServe>`/`ReturnType<typeof pkgServe>` rather than hand-duplicating `@hono/node-server`'s
  `Options`/`AddressInfo` unions
- `packages/@gateway/npm/src/hono__node-server/server/server.proxy.ts` — `serveProxy`, mocks OUR
  wrapper `serve` directly (it has no guard logic of its own to preserve real, unlike `glob`), stages
  the one call address-less (`calledWith([])` — a fresh closure-over-app-under-test every call, so
  `[]` is the honest address, matching this file's own `outboxWatchHandle` precedent), captures
  `{fetch, port, hostname}`, and returns a real, never-listening `ServerType` via `@hono/node-server`'s
  own `createAdaptorServer` (builds the real Node `http.Server`, skips `.listen()`) — no cast
- `packages/@gateway/npm/src/hono__node-server/server/server.test.ts` — proves `serveProxy` captures
  the real fetch handler, port and hostname, and that a call with no explicit hostname still returns
  a real usable `ServerType`
- `packages/@gateway/npm/src/hono__node-ws/node-web-socket/node-web-socket.ts` — OUR guarded
  `createNodeWebSocket`, pass-through typed via `Parameters<typeof pkgCreateNodeWebSocket>`/`ReturnType<>`
- `packages/@gateway/npm/src/hono__node-ws/node-web-socket/node-web-socket.proxy.ts` —
  `createNodeWebSocketProxy`, mocks OUR wrapper directly (address-less, same reasoning as `serve`:
  each call closes over a fresh `Hono` app), captures the real `app` and the `upgradeWebSocket`
  factory, returns a real `NodeWebSocket` (built once for real against a throwaway `Hono`, so `wss`
  is a real `WebSocketServer` and never a cast) with `injectWebSocket` overridden to a no-op and
  `upgradeWebSocket` overridden to capture-then-delegate to the real one
- `packages/@gateway/npm/src/hono__node-ws/node-web-socket/node-web-socket.test.ts` — proves the
  proxy captures the real `app` passed in and the same factory function Hono receives from
  `upgradeWebSocket`, and that `injectWebSocket` is a callable no-op

Edit (existing files):
- `packages/@gateway/npm/src/hono__node-server/server/server.stub.ts` — `ServerStub` now imports
  `serve` from `./server` (OUR wrapper) instead of raw `@hono/node-server`, matching every other
  gateway stub's "call this subpath's own wrapper" rule
- `packages/@gateway/npm/src/hono__node-server/hono__node-server.ts` — becomes
  `export * from '@hono/node-server'; export { serve } from './server/server';`, same shape as
  `glob.ts`'s override line
- `packages/@gateway/npm/src/hono__node-server/hono__node-server.test.ts` — adds the second
  `it` block `glob.test.ts` carries, asserting `ourModule.serve` is OUR wrapper's `serve`
- `packages/@gateway/npm/src/hono__node-ws/node-web-socket/node-web-socket.stub.ts` —
  `NodeWebSocketStub` now imports `createNodeWebSocket` from `./node-web-socket`
- `packages/@gateway/npm/src/hono__node-ws/hono__node-ws.ts` — becomes
  `export * from '@hono/node-ws'; export { createNodeWebSocket } from './node-web-socket/node-web-socket';`
- `packages/@gateway/npm/src/hono__node-ws/hono__node-ws.test.ts` — adds the override-assertion
  `it` block
- `packages/server/src/responders/server/init/server-init-responder.proxy.ts` — composes
  `serveProxy()` and `createNodeWebSocketProxy()` in place of the two raw `registerMock({fn: serve})`
  / `registerMock({fn: createNodeWebSocket})` calls; drops the `as never` / `as unknown as` casts on
  both; `getCapturedWebSocketAppIsHono` reads the app back through `createNodeWebSocketProxy`'s own
  capture instead of `wsHandle.callsMatching([])`; `dispatchRequest` reads the captured fetch through
  `serveProxy`'s capture instead of its own local `serveCaptured`; `simulateConnection`/
  `simulateMessage`/`simulateDisconnect` invoke the captured upgrade factory read back from
  `createNodeWebSocketProxy` instead of a local `wsCaptured.factory`. Every public proxy method name
  and parameter stays the same.

Not touched: `server-init-responder.ts` (production code) — it already imports `serve` and
`createNodeWebSocket` by the same names from the same `#gateway/npm/*` specifiers, so the barrel
override means zero changes there.
