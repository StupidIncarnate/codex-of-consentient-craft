# A14: Adapters: `testing`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" table row 7 (line 338); `scrolls/gateway-build/coverage.md` testing rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G22](g22-jest-through-gateway.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | testing |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (batches below) |
| Runs alone | no other agent editing `testing` at the same time — [G22](g22-jest-through-gateway.md) also touches this package (the 7 excluded files below) and must land first |

## Current state

Census of `packages/testing/src/adapters/**` run 2026-09-26: 34 files. **Seven are excluded from this item** —
they are [G22](g22-jest-through-gateway.md)'s job, not this item's: `child-process/mocker/child-process-mocker-adapter.ts`,
`jest/isolate-modules/jest-isolate-modules-adapter.ts`, `jest/register-mock/jest-register-mock-adapter.ts`,
`jest/register-module-mock/jest-register-module-mock-adapter.ts`, `jest/register-spy-on/jest-register-spy-on-adapter.ts`,
`jest/require-actual/jest-require-actual-adapter.ts`, `timers/watch/timers-watch-adapter.ts`. Per the gateway
follow-up doc's own words, these seven "stay in `testing` as brokers or transformers, by what each does"; their
`jest`, `child_process` and timer calls route through `#gateway/npm/jest__globals` and `#gateway/node`, which is
[G22]'s job to build. Confirm G22 has landed before you start — if these 7 files still look untouched, wait.

That leaves 27 adapters:

| Batch | Path | Replacement |
|---|---|---|
| FS-1 | `adapters/child-process/exec-sync/child-process-exec-sync-adapter.ts` | gateway → `@dungeonmaster/node/child_process` `runSync` |
| FS-1 | `adapters/crypto/random-bytes/crypto-random-bytes-adapter.ts` | gateway → `@dungeonmaster/node/crypto` (`randomBytes`) |
| FS-1 | `adapters/error/is-native-error/error-is-native-error-adapter.ts` | gateway → `@dungeonmaster/node/util/types` `isNativeError` |
| FS-1 | `adapters/fs/append-file/fs-append-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `appendFile` |
| FS-2 | `adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `existsSync` |
| FS-2 | `adapters/fs/exists/fs-exists-adapter.ts` | gateway → `@dungeonmaster/node/fs` `existsSync` — **this package has two separate adapters both wrapping the same real function** (`fs-exists-sync-adapter.ts` and `fs-exists-adapter.ts`); confirm both really are duplicates (not one sync, one async) before merging both callers onto the one gateway export |
| FS-2 | `adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `ensureDir` |
| FS-2 | `adapters/fs/queue-metadata-read/fs-queue-metadata-read-adapter.ts` | gateway → `@dungeonmaster/node/fs` `readJsonFileSync` |
| FS-3 | `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| FS-3 | `adapters/fs/readdir/fs-readdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readdirIfExists` |
| FS-3 | `adapters/fs/rm/fs-rm-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rm` |
| FS-3 | `adapters/fs/symlink/fs-symlink-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `symlink` |
| FS-4 | `adapters/fs/unlink/fs-unlink-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `unlink` |
| FS-4 | `adapters/fs/write-file/fs-write-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFile` |
| MSW | `adapters/msw/http/msw-http-adapter.ts` | gateway → `@dungeonmaster/npm/msw` |
| MSW | `adapters/msw/server/msw-server-adapter.ts` | gateway → `@dungeonmaster/npm/msw/node` `setupServer` |
| PATH | `adapters/path/dirname/path-dirname-adapter.ts` | split → `@dungeonmaster/node/path` `dirname`; `FilePath` contract parsing stays a `testing` adapter/broker |
| PATH | `adapters/path/join/path-join-adapter.ts` | split → `@dungeonmaster/node/path` `join`; `FilePath` contract parsing stays |
| PATH | `adapters/path/resolve/path-resolve-adapter.ts` | split → `@dungeonmaster/node/path` `resolve`; `FilePath` contract parsing stays |
| PW | `adapters/playwright/page-events/playwright-page-events-adapter.ts` | split → `@dungeonmaster/npm/@playwright/test`; `page.on(...)` event wiring moves; the `NetworkLogEntry` contract mapping stays |
| PW | `adapters/playwright/test-info-attach/playwright-test-info-attach-adapter.ts` | split → `@dungeonmaster/npm/@playwright/test`; `testInfo.attach(...)` call moves; the `AdapterResult` shape stays |
| TS-1 | `adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter.ts` | split → `@dungeonmaster/npm/typescript` (`ts.*`); the AST walk/factory stays, since our own mock/proxy contracts drive it |
| TS-1 | `adapters/typescript/ast-to-module-mock-calls/typescript-ast-to-module-mock-calls-adapter.ts` | split → same shape |
| TS-1 | `adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter.ts` | split → same shape |
| TS-2 | `adapters/typescript/mock-calls-to-statements/typescript-mock-calls-to-statements-adapter.ts` | split → same shape |
| TS-2 | `adapters/typescript/source-file-getter/typescript-source-file-getter-adapter.ts` | split → `@dungeonmaster/npm/typescript` (`ts.*`) + `@dungeonmaster/node/fs` `readFileSync` as a fallback when no `ts.Program` is available |
| TS-2 | `adapters/typescript/source-file-with-prepended-statements/typescript-source-file-with-prepended-statements-adapter.ts` | split → same shape as TS-1's rows |

## Work

1. For every `gateway`-fate row: switch every caller to the named export, imported from its `#gateway/<kind>/<subpath>`
   path.
2. For every `split`-fate row: move the outside call (the raw `path`/`typescript`/`@playwright/test` use) onto the
   matching gateway export; keep the contract-mapping or AST-walk half as a broker or transformer in `testing`,
   named for what it does now.
3. Confirm the `fs-exists-sync-adapter.ts` / `fs-exists-adapter.ts` duplication before merging their callers — read
   both files in full; if one is genuinely a leftover copy of the other, note it under DECISIONS as a duplicate
   found along the way, not silently fixed as part of the gateway swap.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/node/fs/exists-sync/exists-sync.proxy`), never through a barrel, per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 27 adapter files this item touches remain. The 7 [G22](g22-jest-through-gateway.md) files are a
  separate item's concern — confirm they have landed too before treating `packages/testing/src/adapters/` as
  fully gone.
- `npm run ward -- --only lint,typecheck,unit -- packages/testing` exits 0.

## Traps

- **This package IS the proxy-mock hoister and the I/O trap's own home.** The TS-1/TS-2 batch files are the AST
  machinery that reads every `.proxy.ts` file in the repo and generates `jest.mock()` calls — changing how they
  reach `typescript` risks breaking every OTHER package's tests at once, not just `testing`'s own. Run a wide
  `npm run ward -- --uncommitted` check (not just this package) after this batch lands, and report it clearly if
  anything outside `testing` goes red.
- Confirm [G22](g22-jest-through-gateway.md) has landed (the 7 excluded files already moved) before you start —
  this item's own Needs table names it for exactly this reason.
- `msw`'s ESM-only build has its own Jest-transform story (brands doc: "MSW is ESM and server's Jest does not
  transform it") — do not assume the `msw`/`msw-server` swap behaves identically in every consuming package; this
  item only touches `testing`'s own wrapping, not every package's Jest config.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan — G-Y fs and path

Agent scope: `packages/testing/src/adapters/fs/*` and `path/*` (14 folders). The census found 48 files with
every deletion counted, so this pass does the slice that closes cleanly and leaves the rest for a follow-up.

**Trap finding (read before touching):** `jest.setup-io-trap.js` lets a trapped `fs` call through only when
the first repo frame under `packages/` is test infrastructure, and `packages/testing/src/` counts as
infrastructure. Once a call goes through `#gateway/node/fs`, the first repo frame is the gateway wrapper
(`packages/@gateway/node/src/fs/...`), which is not infrastructure. The one call that runs unstaged inside a unit
run is `openHandleReportBroker`'s append, made from `jest.setup.js`'s `afterAll` whenever ward sets
`DUNGEONMASTER_OPEN_HANDLE_REPORT`. The trap therefore skips `packages/@gateway/` frames and lets the next repo
frame decide (`jest.setup-io-trap.js`, 1 edit).

**This pass (Group A + B1):**

Delete (3 files each: adapter, proxy, test):
- `adapters/fs/append-file`, `adapters/fs/mkdir`, `adapters/fs/queue-metadata-read`, `adapters/fs/rm`,
  `adapters/fs/symlink`, `adapters/fs/unlink`, `adapters/fs/write-file`
- `adapters/fs/exists-sync`, `adapters/path/resolve` (their only callers are the two middlewares below)

Callers moved onto `#gateway/node/fs` and `#gateway/node/path` (each with its proxy; `path` runs real):
- `brokers/open-handle/report/open-handle-report-broker.ts` + `.proxy.ts` (`appendFileSync`, `appendFileSyncProxy`)
- `brokers/install-testbed/create/install-testbed-create-broker.ts` + `.proxy.ts` + `.test.ts`
- `brokers/install-testbed/create/find-repo-root-layer-broker.ts` + `.proxy.ts`
- `brokers/integration-environment/create/integration-environment-create-broker.ts` + `.proxy.ts`
- `middleware/import-path-resolver/import-path-resolver-middleware.ts` + `.proxy.ts`
- `middleware/proxy-mock-collector/proxy-mock-collector-middleware.ts` + `.proxy.ts`

`queue-metadata-read` (real logic: contract parse over a JSON read) becomes a broker:
- new `brokers/queue-metadata/read/queue-metadata-read-broker.ts` + `.proxy.ts` + `.test.ts`
- `package.json`: `exports` + `typesVersions` entry `./adapters/fs/queue-metadata-read` becomes
  `./brokers/queue-metadata/read`
- callers outside testing (import and call line only): `packages/web/test/harnesses/ward-mock/ward-mock.harness.ts`,
  `packages/web/test/harnesses/claude-mock/claude-mock.harness.ts`

Other edits: `packages/testing/src/jest.setup-io-trap.js` (frame skip), `packages/testing/src/jest.setup.js` (comment
naming the deleted adapter).

**Left for a follow-up (need every remaining caller moved together):** adapters `fs/exists`, `fs/read-file`,
`fs/readdir`, `path/dirname`, `path/join` and their callers `middleware/workspace-root-find`,
`nearest-package-json-find`, `package-imports-specifier-resolve`, `workspace-package-import-resolve`,
`workspace-package-json-read` (impl + proxy each), plus the 15 adapter files. `middleware/proxy-reexport-names-resolve`
only names `pathJoinAdapterProxy` inside a fixture string and needs no change.

## Plan — G-Y fs and path, part 2

Agent scope: `packages/testing` only. `path` functions run for real (`#gateway/node/path`); fs goes through
`#gateway/node/fs` (`existsSync`, `readFileSync`, `readdirSync`) and its proxies. Each unstaged path answers
"does not exist" through `returnsMatchingPath({ path: isPath, exists: false })` staged BEFORE exact paths, and an
unstaged directory answers `[]`, which the deleted adapter proxies did by default.

Callers moved (implementation + proxy each), under `packages/testing/src/middleware/`:
- `workspace-package-json-read/workspace-package-json-read-middleware.ts` + `.proxy.ts` (`existsSync`, `readFileSync`)
- `workspace-root-find/workspace-root-find-middleware.ts` + `.proxy.ts` (`join`, `dirname`)
- `nearest-package-json-find/nearest-package-json-find-middleware.ts` + `.proxy.ts` (`join`, `dirname`)
- `package-imports-specifier-resolve/package-imports-specifier-resolve-middleware.ts` + `.proxy.ts` (`dirname`)
- `workspace-package-import-resolve/workspace-package-import-resolve-middleware.ts` + `.proxy.ts` (`existsSync`, `readdirSync`, `join`, `dirname`)

Delete (adapter, proxy, test each): `adapters/fs/exists`, `adapters/fs/read-file`, `adapters/fs/readdir`,
`adapters/path/dirname`, `adapters/path/join`.

Tests of the five middlewares are edited only where they name a deleted adapter.
`proxy-reexport-names-resolve` and `proxy-mock-collector` only name `pathJoinAdapterProxy` inside fixture strings and
need no change.
