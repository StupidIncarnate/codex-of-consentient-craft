# A13: Adapters: `siegelense`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" table rows 4-6 (335-337) and item 33's `currentBranch` half (768-780); `scrolls/gateway-build/coverage.md` and `stays-as-adapter.md` siegelense rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | siegelense |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (grouped by domain below) |
| Runs alone | no other agent editing `siegelense` at the same time |

## Current state

Census of `packages/siegelense/src/adapters/**` run 2026-09-26: 49 files. Two groups this item does NOT touch:

- `dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` — [A02](a02-forwarder-adapters.md)'s job
  (forwards into `@dungeonmaster/config`, not an outside call).
- `git/branch-read/git-branch-read-adapter.ts` — [A01](a01-dead-adapters.md) deletes it as dead code. Confirmed
  2026-09-26 that item 33's own migration already happened: `instance-reserve-broker.ts` already imports
  `currentBranch` from `#gateway/bin/git` directly (its own header even documents the `isGitNotARepositoryErrorGuard`
  reconciliation item 33 calls for). The adapter is simply the leftover, now-orphaned old code — do not re-migrate
  a caller that has already moved.

That leaves 47 adapters, grouped by domain:

**`fs/*` (16 files) — all `gateway` fate, all straightforward `@dungeonmaster/node/fs` or `fs/promises` swaps:**
`append-file` → `appendFile`; `close-fd` → `closeSync`; `copy-file` → `copyFile`; `cp` → `copyDirContents`;
`open-fd` → `openForAppendSync`; `read-file` → `readFile`; `readdir` → `readdirIfExists`; `readlink` →
`readlinkIfLink`; `realpath` → `realpath`; `rename` → `rename`; `rm` → `rm`; `stat` → `statIfExists`; `statfs` →
`diskFreeBytes`; `symlink` → `symlink`; `unlink` → `unlink`; `write-file` → `writeFile`.

**Misc singles (gateway/split, 18 files):**

| Path | Replacement |
|---|---|
| `async/delay/async-delay-adapter.ts` | gateway → `@dungeonmaster/node/setTimeout` (wraps it as an awaitable promise) |
| `child-process/spawn-detached/child-process-spawn-detached-adapter.ts` | gateway → `@dungeonmaster/node/child_process` `spawnDetached` |
| `cli-package/bin-resolve/cli-package-bin-resolve-adapter.ts` | split → `@dungeonmaster/node/fs` `existsSync`, `readFileSync`; the composed bin-path logic stays with `siegelense` |
| `cli-package/bin-resolve/package-root-find-layer-adapter.ts` | gateway → `@dungeonmaster/node/fs` `findUpSync` |
| `crypto/hash/crypto-hash-adapter.ts` | gateway → `@dungeonmaster/node/crypto` (`createHash`) — output validated with a zod brand at the call site, not in the gateway |
| `error/is-native-error/error-is-native-error-adapter.ts` | gateway → `@dungeonmaster/node/util/types` `isNativeError` |
| `fetch/http-request/fetch-http-request-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchJson` |
| `fetch/probe/fetch-probe-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchOk`; the cross-realm `isNativeError` check moves in unchanged |
| `net/unix-request/net-unix-request-adapter.ts` | gateway → `@dungeonmaster/node/net` `unixSocketRequest`; contract parsing moves to the caller |
| `net/unix-serve/net-unix-serve-adapter.ts` | gateway → `@dungeonmaster/node/net` `unixSocketServe`; contract parsing moves to the caller |
| `npm/install/npm-install-adapter.ts` | gateway → `@dungeonmaster/bin/npm` `install` |
| `npm/run-build/npm-run-build-adapter.ts` | gateway → `@dungeonmaster/bin/npm` `runBuild` |
| `os/info/os-info-adapter.ts` | split → `@dungeonmaster/node/os` (`cpus`/`freemem`/`loadavg`/`totalmem`); the MB conversion stays a `siegelense` broker |
| `os/tmpdir/os-tmpdir-adapter.ts` | gateway → `@dungeonmaster/node/os` (`tmpdir`) |
| `pixelmatch/compare/pixelmatch-compare-adapter.ts` | gateway → `@dungeonmaster/npm/pixelmatch` — deliberately no `catch` (its own header says so), kept verbatim |
| `pngjs/decode/pngjs-decode-adapter.ts` | gateway → `@dungeonmaster/npm/pngjs` `decodePng` |
| `process/is-alive/process-is-alive-adapter.ts` | gateway → `@dungeonmaster/node/process` `kill`; the ESRCH classification is our logic and stays a `siegelense` broker |
| `process/kill-group/process-kill-group-adapter.ts` | gateway → `@dungeonmaster/node/process` `kill`; same note |

**`playwright/session/*` (13 files) — the trickiest group, per GW rows 335-337:**

| Path | Fate |
|---|---|
| `dom-read-layer-adapter.ts` | stays → a `siegelense` transformer/statics: pure page-side JS source-string builder, plus our own contract translation of the returned value; no library call |
| `key-press-layer-adapter.ts` | stays → same shape |
| `key-read-layer-adapter.ts` | stays → same shape |
| `root-check-layer-adapter.ts` | stays → same shape |
| `listeners-layer-adapter.ts` | stays → a `siegelense` transformer; formats readings it already collected, imports nothing from `@playwright/test` by design (its own header says so) |
| `paste-layer-adapter.ts` | split → the source-STRING content (referencing `document`, clipboard globals) runs inside the remote browser and is exempt from the gateway rule by the lint carve-out [A19](a19-adapters-folder-type-gone-caller-rules-on.md) builds; but the OUTER `page.evaluate(source)` call that RUNS it is a real `@playwright/test` call in THIS process and moves to `#gateway/npm/playwright__test` |
| `storage-read-layer-adapter.ts` | split → same shape as `paste-layer-adapter.ts` |
| `init-script-add-layer-adapter.ts` | split → the real `Page.addInitScript` call moves to `#gateway/npm/playwright__test`; the `ContentText`/`AdapterResult` translation stays |
| `settle-wait-layer-adapter.ts` | split → same shape (real `Page` method call moves, translation stays) |
| `viewport-set-layer-adapter.ts` | split → same shape (`Page.setViewportSize`) |
| `playwright-session-adapter.ts` | split → `chromium.launch`/`browser.newContext`/`page.on`/`page.evaluate`/`page.waitForTimeout` move to `#gateway/npm/playwright__test`; the `BrowserSession` facade, the ref registry and the settle detector are almost entirely our own logic and stay |
| `ref-registry-layer-adapter.ts` | split → same shape as `playwright-session-adapter.ts` |
| `settle-poll-layer-adapter.ts` | split → same shape |

**The `page.evaluate` split is the one requiring the most care.** GW's own words: "The strings become siegelense
statics or transformers. The `page.evaluate` call goes through `#gateway/npm/playwright__test`." Every one of the
four "stays" adapters above (`dom-read`, `key-press`, `key-read`, `root-check`) builds a JS source string as a
plain template literal and returns it to `playwright-session-adapter.ts`, which is the ONE file that actually
calls `page.evaluate(source)` — confirmed by each "stays" file's own header ("the `page.evaluate(source)` call
that actually runs it lives in `playwright-session-adapter.ts`, not here"). So the split is: the four builders move
to `transformers/`/`statics/` unchanged (they make no outside call at all), and `playwright-session-adapter.ts`'s
own `page.evaluate` calls move onto the gateway's `@playwright/test` wrapper.

## Work

1. For every `fs/*` and "misc single" row: switch every caller to the named export, imported from its
   `#gateway/<kind>/<subpath>` path.
2. For every `playwright/session/*` "stays" row: move the file into `transformers/` or `statics/` (whichever fits
   what it does — a pure string builder taking no state is a transformer; a fixed template with no input is
   statics), keeping its exact string output unchanged. Update `playwright-session-adapter.ts`'s import
   accordingly.
3. For every `playwright/session/*` "split" row: move the real `@playwright/test` call onto
   `#gateway/npm/playwright__test`; keep the our-logic half (translation, facade, ref registry, settle detection)
   as a broker in `siegelense`.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/npm/playwright__test/playwright__test.proxy`), never through a barrel, per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 47 adapter files remain, and — once [A01](a01-dead-adapters.md) and
  [A02](a02-forwarder-adapters.md)'s siegelense work has also landed — `packages/siegelense/src/adapters/` is gone
  entirely.
- `npm run ward -- --only lint,typecheck,unit -- packages/siegelense` exits 0.

## Traps

- Confirm A01 (git-branch-read) and A02 (config-resolve) have landed before you start.
- The `page.evaluate` carve-out in `platform-globals-ban` (a global used inside a string that runs in the browser,
  not in this process) is [A19](a19-adapters-folder-type-gone-caller-rules-on.md)'s job to build into the lint
  rule, not this item's. This item only moves the CALL that invokes `page.evaluate`; it does not need the lint
  carve-out to exist yet to do that move correctly.
- Do not confuse `pixelmatch-compare-adapter.ts`'s deliberate lack of a `catch` with a bug to fix — its own header
  says this is intentional, and the migration should keep it that way.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan — SL-FS1

Group SL-FS1: first four `fs/*` adapters in `packages/siegelense`:
- `packages/siegelense/src/adapters/fs/append-file/` -> `#gateway/node/fs__promises` (`appendFile`)
- `packages/siegelense/src/adapters/fs/close-fd/` -> `#gateway/node/fs` (`closeSync`)
- `packages/siegelense/src/adapters/fs/copy-file/` -> `#gateway/node/fs__promises` (`copyFile`)
- `packages/siegelense/src/adapters/fs/cp/` -> `#gateway/node/fs__promises` (`copyDirContents`)

### Full File Scope (43 files)

#### Adapters to delete (12 files)
- `packages/siegelense/src/adapters/fs/append-file/fs-append-file-adapter.ts`
- `packages/siegelense/src/adapters/fs/append-file/fs-append-file-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/append-file/fs-append-file-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/copy-file/fs-copy-file-adapter.ts`
- `packages/siegelense/src/adapters/fs/copy-file/fs-copy-file-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/copy-file/fs-copy-file-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/cp/fs-cp-adapter.ts`
- `packages/siegelense/src/adapters/fs/cp/fs-cp-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/cp/fs-cp-adapter.test.ts`

#### Direct callers (24 files)
- `packages/siegelense/src/brokers/buffer/append/buffer-append-broker.ts`
- `packages/siegelense/src/brokers/buffer/append/buffer-append-broker.proxy.ts`
- `packages/siegelense/src/brokers/buffer/append/buffer-append-broker.test.ts`
- `packages/siegelense/src/brokers/driving/oddity-append/driving-oddity-append-broker.ts`
- `packages/siegelense/src/brokers/driving/oddity-append/driving-oddity-append-broker.proxy.ts`
- `packages/siegelense/src/brokers/driving/oddity-append/driving-oddity-append-broker.test.ts`
- `packages/siegelense/src/brokers/run/transcript-append/run-transcript-append-broker.ts`
- `packages/siegelense/src/brokers/run/transcript-append/run-transcript-append-broker.proxy.ts`
- `packages/siegelense/src/brokers/run/transcript-append/run-transcript-append-broker.test.ts`
- `packages/siegelense/src/brokers/snapshot/capture/snapshot-capture-broker.ts`
- `packages/siegelense/src/brokers/snapshot/capture/snapshot-capture-broker.proxy.ts`
- `packages/siegelense/src/brokers/snapshot/capture/snapshot-capture-broker.test.ts`
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts`
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.proxy.ts`
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.test.ts`
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.ts`
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.proxy.ts`
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.test.ts`
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.ts`
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.test.ts`
- `packages/siegelense/src/brokers/snapshot/restore-layer/snapshot-restore-layer-broker.ts`
- `packages/siegelense/src/brokers/snapshot/restore-layer/snapshot-restore-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/snapshot/restore-layer/snapshot-restore-layer-broker.test.ts`

#### Composing proxies (7 files)
- `packages/siegelense/src/brokers/run/execute/run-execute-broker.proxy.ts` (composes `bufferAppendBrokerProxy`, `runTranscriptAppendBrokerProxy`, `snapshotCaptureBrokerProxy`)
- `packages/siegelense/src/brokers/step/snapshot/step-snapshot-broker.proxy.ts` (composes `snapshotCaptureBrokerProxy`)
- `packages/siegelense/src/responders/siegelense/driver/siegelense-driver-responder.proxy.ts` (composes `laneBootBrokerProxy`)
- `packages/siegelense/src/brokers/driver/handle-request/driver-handle-request-broker.proxy.ts` (composes `laneTeardownBrokerProxy`)
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.proxy.ts` (composes `laneTeardownBrokerProxy`)
- `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.proxy.ts` (composes `stepHoldBrokerProxy`)
- `packages/siegelense/src/brokers/step/reset/step-reset-broker.proxy.ts` (composes `snapshotRestoreLayerBrokerProxy`)

### Batch Sizing
The 43 files exceed the ~25 file threshold for a single agent pass. Once gateway gaps are resolved, the group should be partitioned:
- Batch A (10 files): `copy-file` adapter (3) + `step-hold-broker` (3) + `run-verb-layer-broker.proxy.ts` (1) + `snapshot-restore-layer-broker` (3)
- Batch B (15 files): `cp` adapter (3) + `snapshot-capture-broker` (3) + `step-snapshot-broker.proxy.ts` (1) + `buffer-append-broker` (3) + `driving-oddity-append-broker` (3) + `run-execute-broker.proxy.ts` (2)
- Batch C (18 files): `append-file` adapter (3) + `close-fd` adapter (3) + `run-transcript-append-broker` (3) + `lane-boot-broker` (3) + `lane-teardown-broker` (3) + 3 driver proxies

### Execution result (SL-FS1)

The gaps listed under the old heading are closed: F57 gave `appendFileProxy.getCallsFor`, `copyFileProxy.getCallsFor`, `copyDirContentsProxy.cpCallsFor`/`rmCallsFor` and `closeSyncProxy.calls` their read-back. All batches were done in one pass; the folder names in the file scope drifted (`step/reset/snapshot-restore-layer-broker`, `driving-oddity/append`), and the code won.

Done:
- `append-file`, `copy-file` and `cp` adapters deleted (folders gone), plus their `siegelense/adapters.ts` barrel line for `copy-file`.
- Callers moved to `#gateway/node/fs__promises` (`appendFile`, `copyFile`, `copyDirContents`): `buffer-append`, `driving-oddity-append`, `run-transcript-append`, `snapshot-capture`, `step-hold`, `snapshot-restore-layer`. The append brokers now return `Promise<void>` (R1); their callers ignored the old `{ success: true }`.
- `lane-boot-broker` moved to `closeSync` from `#gateway/node/fs`.
- Composing proxies gained the staging the deleted adapter proxies used to give for free: `run-verb-layer-broker.proxy.ts` (`setupHoldCopy`), `step-dispatch-broker.proxy.ts` (`stagesHoldCopy`), `step-reset-broker.proxy.ts` (`setupRestoreCpSucceeds` no longer takes `destinationPath`; `copyDirContents` stages by source only).
- `run-execute-broker.proxy.ts`, `step-snapshot-broker.proxy.ts` and the driver proxies needed no edit: the child proxies kept their method names.

Remaining:
- `lane-teardown-broker` (with its proxy, test and the three composing driver proxies) stays on `fsCloseFdAdapter`. Its test `the fd closes happen after the SIGTERM/SIGKILL signals` asserts cross-function order between `kill` and `closeSync`, which `closeSyncProxy` cannot read back; per-call content does not prove order. Once the gateway offers ordering, move it and delete `adapters/fs/close-fd/`.
- Every other adapter in this item (`open-fd` onward, misc singles, `playwright/session/*`) is untouched.


## Plan — SL-FS2

Six adapters were named: `open-fd`, `readdir`, `read-file`, `readlink`, `realpath`, `rename`. Census of callers (2026-09-28, code wins): `read-file` has 61 caller files, `readdir` has 17 non-adapter files, so the full six is far past the ~40-file bound. This pass does the four that fit; `readdir` and `read-file` are left for a follow-up chunk. Composing proxies keep their child proxy method names, so none of them needs an edit (the SL-FS1 approach).

All paths below are under `packages/siegelense/`. Direct callers move onto the gateway; child proxies keep their method names.

### open-fd -> `openForAppendSync` from `#gateway/node/fs` (11 files)
- Adapter, deleted: `src/adapters/fs/open-fd/fs-open-fd-adapter.ts`, `.proxy.ts`, `.test.ts`
- Callers: `src/brokers/instance/start/instance-start-broker.ts`, `.proxy.ts`, `.test.ts`; `src/brokers/lane/boot/lane-boot-broker.ts`, `.proxy.ts`, `.test.ts`
- Comment-only mentions: `src/brokers/lane/boot/server-log-reader-layer-broker.ts`, `src/contracts/file-descriptor/file-descriptor-contract.ts`
- Composing proxies (no edit): `src/responders/siegelense/start/siegelense-start-responder.proxy.ts`, `src/responders/siegelense/driver/siegelense-driver-responder.proxy.ts`

### readlink -> `readlinkIfLink` from `#gateway/node/fs__promises` (6 files)
- Adapter, deleted: `src/adapters/fs/readlink/fs-readlink-adapter.ts`, `.proxy.ts`, `.test.ts`
- Caller: `src/responders/install/link-create/install-link-create-responder.ts`, `.proxy.ts`, `.test.ts`
- Composing (no edit): `src/flows/install/install-flow.ts` imports the responder only

### realpath -> `realpath` from `#gateway/node/fs__promises` (7 files)
- Adapter, deleted: `src/adapters/fs/realpath/fs-realpath-adapter.ts`, `.proxy.ts`, `.test.ts`
- Caller: `src/brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker.ts`, `.proxy.ts`, `.test.ts`
- Direct adapter-proxy user: `src/brokers/run/execute/run-execute-broker.proxy.ts`
- Composing (no edit): step-video, instance-start, instance-kill, lane-teardown, run-execute, instance-entry-layer broker proxies

### rename -> `rename` from `#gateway/node/fs__promises` (6 files)
- Adapter, deleted: `src/adapters/fs/rename/fs-rename-adapter.ts`, `.proxy.ts`, `.test.ts`
- Caller: `src/brokers/registry/write/registry-write-broker.ts`, `.proxy.ts`, `.test.ts`
- Composing (no edit): `src/brokers/registry/update/registry-update-broker.proxy.ts`
- Barrel: remove the `fs-readlink`, `fs-realpath`, `fs-rename` lines from `adapters.ts`

About 30 files. `adapters.ts` also edited.

### Left for a later chunk
- `readdir` (17 files besides the adapter) and `read-file` (61 files besides the adapter).

### Execution result (SL-FS2)

Done: `open-fd`, `readlink`, `realpath` and `rename` adapters deleted (folders gone), and their `adapters.ts` barrel lines for `readlink`, `realpath`, `rename`.
- `instance-start-broker` and `lane-boot-broker` open the log through `openForAppendSync` from `#gateway/node/fs` and brand the descriptor with `fileDescriptorContract.parse` at the call site.
- `locations-repo-link-path-find-broker` calls `realpath` from `#gateway/node/fs__promises`.
- `registry-write-broker` calls `rename` and returns `Promise<void>` (R1); every caller ignored the old `{ success: true }`. Its proxy now reads the renamed pair back from the gateway proxy by exact `from`/`to`.
- `install-link-create-responder` calls plain `readlink`, not `readlinkIfLink`: the responder needs ENOENT and EINVAL kept apart (EINVAL reports "real directory or file; left untouched"), and `readlinkIfLink` folds both into `null`. Its `getReadlinkCalls` reads jest's own call list off `fs/promises` `readlink`, in real order.
- Composing proxies needed no edit; child proxies kept their method names.

Remaining: `readdir` (17 non-adapter files) and `read-file` (61 non-adapter files).

## Plan — SL-FS3

Group SL-FS3: `fs/readdir` adapter in `packages/siegelense`:
- `packages/siegelense/src/adapters/fs/readdir/` -> `readdirIfExists` from `#gateway/node/fs__promises`, staged via `#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy` (`readdirIfExistsProxy`)
- Note: `readdirIfExists` returns `null` where `fsReaddirAdapter` returned `[]`, so callers use `(await readdirIfExists(...)) ?? []`.
- Delete adapter folder with proxy and test, and remove export from `packages/siegelense/adapters.ts`.

### Full File Scope (35 files)

#### Adapter to delete (3 files)
- `packages/siegelense/src/adapters/fs/readdir/fs-readdir-adapter.ts`
- `packages/siegelense/src/adapters/fs/readdir/fs-readdir-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/readdir/fs-readdir-adapter.test.ts`

#### Barrel export to edit (1 file)
- `packages/siegelense/adapters.ts`

#### Direct callers (8 files)
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.ts`
- `packages/siegelense/src/brokers/prune/assets-list/prune-assets-list-broker.ts`
- `packages/siegelense/src/brokers/prune/assets-list/run-shots-layer-broker.ts`
- `packages/siegelense/src/brokers/results/read/run-list-layer-broker.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.ts`

#### Caller proxies (8 files)
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/prune/assets-list/prune-assets-list-broker.proxy.ts`
- `packages/siegelense/src/brokers/prune/assets-list/run-shots-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/results/read/run-list-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.proxy.ts`

#### Caller tests (8 files)
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.test.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.test.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.test.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.test.ts`
- `packages/siegelense/src/brokers/prune/assets-list/prune-assets-list-broker.test.ts`
- `packages/siegelense/src/brokers/prune/assets-list/run-shots-layer-broker.test.ts`
- `packages/siegelense/src/brokers/results/read/run-list-layer-broker.test.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.test.ts`

#### Composing proxies (no edit — child proxies maintain identical public methods and signatures) (6 files)
- `packages/siegelense/src/brokers/capacity/read/capacity-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/citation/resolve/citation-resolve-broker.proxy.ts`
- `packages/siegelense/src/brokers/heartbeat/write/heartbeat-write-broker.proxy.ts`
- `packages/siegelense/src/brokers/prune/instance-reclaim/prune-instance-reclaim-broker.proxy.ts`
- `packages/siegelense/src/brokers/results/read/results-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/status/read/status-read-broker.proxy.ts`

#### Comment-only mention (1 file)
- `packages/siegelense/src/flows/siegelense/siegelense-status-layer-flow.integration.test.ts`

#### Staging fixes exposed by exact-path readdir mock (1 file)
- `packages/siegelense/src/brokers/cleanup/run/cleanup-run-broker.test.ts` — exact staging in tests that assert zero aged assets on reaped instances where the old catch-all mock returned `[]`

## Plan — SL-FS4

Group SL-FS4: first half of `fs/read-file` callers in `packages/siegelense` (12 caller units = 24 caller files: 12 implementations + 12 proxies).
Callers move onto `readFile` or `readFileIfExists` from `#gateway/node/fs__promises`, staged via `#gateway/node/fs__promises/read-file/read-file.proxy` (`readFileProxy`) or `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy` (`readFileIfExistsProxy`).
The adapter itself (`packages/siegelense/src/adapters/fs/read-file/`) is NOT deleted this run; the remaining 18 caller units follow in SL-FS5.

Grouped to have zero shared composing proxies with callers left for the second half:
- `results/read/*` (4 callers) is composed only by `results-read-broker.proxy.ts`.
- `citation/resolve/*` (2 callers) is composed only by `citation-resolve-broker.proxy.ts` and `prune-instance-reclaim-broker.proxy.ts`.
- `driving-oddity/read/` (1 caller) is composed only by `driving-oddity-append-broker.proxy.ts`.
- `machine/oom-count/` (1 caller) is composed only by `machine-read-broker.proxy.ts`.
- `step/file/` (1 caller) is composed only by `run-verb-layer-broker.proxy.ts`.
- `install/*` and `siegelense/run` (3 callers) have no shared composing proxies.

### Scope for SL-FS4 (36 files)

#### Direct callers to migrate (12 files)
- `packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.ts`
- `packages/siegelense/src/brokers/results/read/run-missing-check-layer-broker.ts`
- `packages/siegelense/src/brokers/results/read/server-window-read-layer-broker.ts`
- `packages/siegelense/src/brokers/results/read/transcript-read-layer-broker.ts`
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.ts`
- `packages/siegelense/src/brokers/citation/resolve/citation-resolve-broker.ts`
- `packages/siegelense/src/brokers/driving-oddity/read/driving-oddity-read-broker.ts`
- `packages/siegelense/src/brokers/machine/oom-count/machine-oom-count-broker.ts`
- `packages/siegelense/src/brokers/step/file/step-file-broker.ts`
- `packages/siegelense/src/responders/install/ignore-write/install-ignore-write-responder.ts`
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts`
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.ts`

#### Caller proxies to update (12 files)
- `packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/results/read/run-missing-check-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/results/read/server-window-read-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/results/read/transcript-read-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/citation/resolve/citation-resolve-broker.proxy.ts`
- `packages/siegelense/src/brokers/driving-oddity/read/driving-oddity-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/machine/oom-count/machine-oom-count-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/file/step-file-broker.proxy.ts`
- `packages/siegelense/src/responders/install/ignore-write/install-ignore-write-responder.proxy.ts`
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.proxy.ts`
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.proxy.ts`

#### Caller tests to verify/update (12 files)
- `packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.test.ts`
- `packages/siegelense/src/brokers/results/read/run-missing-check-layer-broker.test.ts`
- `packages/siegelense/src/brokers/results/read/server-window-read-layer-broker.test.ts`
- `packages/siegelense/src/brokers/results/read/transcript-read-layer-broker.test.ts`
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.test.ts`
- `packages/siegelense/src/brokers/citation/resolve/citation-resolve-broker.test.ts`
- `packages/siegelense/src/brokers/driving-oddity/read/driving-oddity-read-broker.test.ts`
- `packages/siegelense/src/brokers/machine/oom-count/machine-oom-count-broker.test.ts`
- `packages/siegelense/src/brokers/step/file/step-file-broker.test.ts`
- `packages/siegelense/src/responders/install/ignore-write/install-ignore-write-responder.test.ts`
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.test.ts`
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.test.ts`

#### Composing proxies (no edit needed — child proxies maintain identical public methods and signatures) (7 files)
- `packages/siegelense/src/brokers/results/read/results-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/prune/instance-reclaim/prune-instance-reclaim-broker.proxy.ts`
- `packages/siegelense/src/brokers/driving-oddity/append/driving-oddity-append-broker.proxy.ts`
- `packages/siegelense/src/brokers/machine/read/machine-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.proxy.ts`
- `packages/siegelense/src/adapters/npm/install/npm-install-adapter.proxy.ts`
- `packages/siegelense/src/adapters/npm/run-build/npm-run-build-adapter.proxy.ts`

### Remaining callers left for second half (SL-FS5) (18 caller units = 36 files + adapter files)
- `packages/siegelense/src/brokers/boot-failure-marker/read/boot-failure-marker-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/cleanup/run/lock-release-layer-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/compare/read/compare-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/registry/read/registry-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/shutdown-reason/read/shutdown-reason-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/snapshot/index-read/snapshot-index-read-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.ts` & `.proxy.ts`
- `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.ts` & `.proxy.ts`
Adapter to delete in SL-FS5:
- `packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.ts`
- `packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.test.ts`
Barrel export to update in SL-FS5:
- `packages/siegelense/adapters.ts`

### Execution result — SL-FS4
- All 12 direct callers migrated onto `readFile` or `readFileIfExists` from `#gateway/node/fs__promises`.
- All 12 test proxies updated to compose `readFileProxy` or `readFileIfExistsProxy`, staging by exact path.
- In `install-ignore-write-responder.proxy.ts`, replaced raw `fs/promises` import with `readProxy.getCallsFor({ path })`.
- In `machine-oom-count-broker.test.ts` and `siegelense-run-responder.test.ts`, updated error assertions from old adapter wrapper message to raw FsError messages (`EACCES: permission denied`, `ENOENT: no such file or directory...`).
- Scoped ward run (`--only lint,typecheck,unit -- <all 36 touched files>`): exit code 0 (`1790630605206-4fb6`).
- Full siegelense unit test run (`--only unit -- packages/siegelense`): exit code 0 (`1790630686705-3d03`, 526/526 files passed).
- Proved tests bite via 3 caller mutations breaking exact gateway argument paths, all producing expected red failures and then restored.


## Plan — SL-FS5

Group SL-FS5: second half of `fs/read-file` callers in `packages/siegelense` (18 caller units = 54 files: 18 implementations + 18 proxies + 18 tests), plus adapter deletion (3 files) and barrel export update (1 file).
Callers move onto `readFile` or `readFileIfExists` from `#gateway/node/fs__promises`, staged via `#gateway/node/fs__promises/read-file/read-file.proxy` (`readFileProxy`) or `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy` (`readFileIfExistsProxy`).
Once all callers are migrated, delete `packages/siegelense/src/adapters/fs/read-file/` and remove export line 12 from `packages/siegelense/adapters.ts`.

### Full File Scope (58 files)

#### Direct callers to migrate (18 files)
- `packages/siegelense/src/brokers/boot-failure-marker/read/boot-failure-marker-read-broker.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts`
- `packages/siegelense/src/brokers/cleanup/run/lock-release-layer-broker.ts`
- `packages/siegelense/src/brokers/compare/read/compare-read-broker.ts`
- `packages/siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.ts`
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts`
- `packages/siegelense/src/brokers/registry/read/registry-read-broker.ts`
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.ts`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.ts`
- `packages/siegelense/src/brokers/shutdown-reason/read/shutdown-reason-read-broker.ts`
- `packages/siegelense/src/brokers/snapshot/index-read/snapshot-index-read-broker.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.ts`
- `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.ts`

#### Caller proxies to update (18 files)
- `packages/siegelense/src/brokers/boot-failure-marker/read/boot-failure-marker-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.proxy.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.proxy.ts`
- `packages/siegelense/src/brokers/cleanup/run/lock-release-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/compare/read/compare-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.proxy.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.proxy.ts`
- `packages/siegelense/src/brokers/registry/read/registry-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/shutdown-reason/read/shutdown-reason-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/snapshot/index-read/snapshot-index-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.proxy.ts`

#### Caller tests to verify/update (18 files)
- `packages/siegelense/src/brokers/boot-failure-marker/read/boot-failure-marker-read-broker.test.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.test.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.test.ts`
- `packages/siegelense/src/brokers/cleanup/run/lock-release-layer-broker.test.ts`
- `packages/siegelense/src/brokers/compare/read/compare-read-broker.test.ts`
- `packages/siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.test.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.test.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.test.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.test.ts`
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.test.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.test.ts`
- `packages/siegelense/src/brokers/registry/read/registry-read-broker.test.ts`
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.test.ts`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.test.ts`
- `packages/siegelense/src/brokers/shutdown-reason/read/shutdown-reason-read-broker.test.ts`
- `packages/siegelense/src/brokers/snapshot/index-read/snapshot-index-read-broker.test.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.test.ts`
- `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.test.ts`

#### Adapter to delete (3 files)
- `packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.ts`
- `packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.test.ts`

#### Barrel export to update (1 file)
- `packages/siegelense/adapters.ts`

#### Composing proxies (no edit needed — child proxies maintain identical public methods and signatures) (18 files)
- `packages/siegelense/src/brokers/capacity/read/capacity-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/cleanup/run/cleanup-run-broker.proxy.ts`
- `packages/siegelense/src/brokers/compare/read/compare-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.proxy.ts`
- `packages/siegelense/src/brokers/heartbeat/write/heartbeat-write-broker.proxy.ts`
- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.proxy.ts`
- `packages/siegelense/src/brokers/instance/run/instance-run-broker.proxy.ts`
- `packages/siegelense/src/brokers/instance/start/instance-start-boot-poll-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.proxy.ts`
- `packages/siegelense/src/brokers/instance/state-resolve/instance-state-resolve-broker.proxy.ts`
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.proxy.ts`
- `packages/siegelense/src/brokers/lane-spec/find/lane-spec-find-broker.proxy.ts`
- `packages/siegelense/src/brokers/prune/run/prune-run-broker.proxy.ts`
- `packages/siegelense/src/brokers/snapshot/capture/snapshot-capture-broker.proxy.ts`
- `packages/siegelense/src/brokers/snapshot/list/snapshot-list-broker.proxy.ts`
- `packages/siegelense/src/brokers/snapshot/resolve/snapshot-resolve-broker.proxy.ts`
- `packages/siegelense/src/brokers/status/read/profile-solo-read-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/status/read/status-read-broker.proxy.ts`

#### Additional caller tests updated due to raw gateway error propagation (1 file)
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.test.ts` (asserts raw EMFILE error message instead of old wrapped adapter error on bootLockAcquireBroker failure)

### Execution result — SL-FS5
- All 18 direct callers migrated onto `readFile` or `readFileIfExists` from `#gateway/node/fs__promises`.
- All 18 caller proxies updated to compose `readFileProxy` or `readFileIfExistsProxy`, staging by exact path.
- Updated `packages/siegelense/src/brokers/instance/start/instance-start-broker.test.ts` to assert raw EMFILE error message.
- Zero callers of `fsReadFileAdapter` remain across the entire repository.
- Deleted `packages/siegelense/src/adapters/fs/read-file/` (3 files: `.ts`, `.proxy.ts`, `.test.ts`).
- Removed `export * from './src/adapters/fs/read-file/fs-read-file-adapter';` from `packages/siegelense/adapters.ts`.
- Scoped ward run (`--only lint,typecheck,unit -- <all 56 touched files>`): exit code 0 (`1790634416231-3508`).
- Full siegelense unit test run (`--only unit -- packages/siegelense`): exit code 0 (`1790634556895-1612`, 525/525 files passed).


## Plan — SL-PW

Chunk: `packages/siegelense/src/adapters/playwright/session/` (41 files: 13 implementations, 13 proxies, 14 unit tests,
1 integration test). Census 2026-09-28, code wins:

- `playwright-session-adapter.ts` already imports `chromium` from `#gateway/npm/playwright__test`. Every other real
  Playwright call (`browser.newContext`, `page.on`, `page.evaluate`, `page.addInitScript`, `page.setViewportSize`,
  `page.waitForTimeout`) is a METHOD on an object that call returns, so none of them names an import to move.
- `playwright-session-adapter.proxy.ts` stages the whole browser by `registerModuleMock({ module: '@playwright/test' })`
  and hand-built fake `Browser`/`BrowserContext`/`Page` objects.
- `packages/@gateway/npm/src/playwright__test/` holds only the barrel and an `expect` stub. It has NO `.proxy.ts` — no
  staging for `chromium.launch` and no fake `Page` a caller could compose.

### Gap (stops the "split" half)

Work step 4 asks each caller's proxy to compose `#gateway/npm/playwright__test/playwright__test.proxy`. That file does
not exist, so moving the facade into `brokers/` would mean either keeping the raw `registerModuleMock` of
`@playwright/test` in a broker proxy (the pattern T1/T3 retire) or writing the gateway proxy, which is outside this
chunk (`packages/@gateway`). Per the dispatch, the split files stay put and the gap is reported:

- needed: `packages/@gateway/npm/src/playwright__test/playwright__test.proxy.ts` (or a `chromium` sub-folder proxy)
  that stages `chromium.launch` addressed by its options and hands back a fake `Browser` -> `BrowserContext` -> `Page`
  whose methods record calls with read-back (`newContext` options, `addInitScript`, `setViewportSize`, `evaluate`
  answered by source content, `waitForTimeout`, `screenshot`, locator `click`/`fill`/`waitFor`/`count`,
  `keyboard.press`, `waitForFunction`, `video().path()`), and lets a test emit `console`, `pageerror`, `request`,
  `response`, `requestfailed` and `websocket` events. `playwright-session-adapter.proxy.ts` lines 143-490 is that
  surface today.

Blocked files (untouched): `paste`, `storage-read`, `init-script-add`, `settle-wait`, `settle-poll`, `viewport-set`,
`ref-registry` layer adapters and `playwright-session-adapter.ts`, each with proxy and test, plus the integration test.
The layers take `page` as a parameter and would become `*-layer-broker.ts` beside a `browser-session/launch` broker;
a layer cannot sit beside an adapter parent in another folder type, so they move only together with the facade.

### Done in this pass: the pure "stays" builders

The transformer folder accepts the factory shape (a first lint run on `root-check` passed), so each builder moved WHOLE,
its output strings byte-identical, to `src/transformers/<name>/<name>-transformer.ts` with its test beside it. Their
empty proxies are gone: a transformer takes none.

| From (`adapters/playwright/session/`) | To (`src/transformers/`) |
|---|---|
| `dom-read-layer-adapter.ts` | `dom-read/dom-read-transformer.ts` (`domReadTransformer`) |
| `key-press-layer-adapter.ts` | `key-press/key-press-transformer.ts` (`keyPressTransformer`) |
| `key-read-layer-adapter.ts` | `key-read/key-read-transformer.ts` (`keyReadTransformer`) |
| `root-check-layer-adapter.ts` | `root-check/root-check-transformer.ts` (`rootCheckTransformer`) |
| `listeners-layer-adapter.ts` | `listener-lines/listener-lines-transformer.ts` (`listenerLinesTransformer`) |

Edited: `playwright-session-adapter.ts` (imports), `.proxy.ts` (five empty child-proxy calls dropped), `.test.ts` (one
test name). Name-only mentions updated: `test/harnesses/evidence-tree/evidence-tree.harness.ts`,
`src/contracts/raw-dom-reading/raw-dom-reading-contract.ts`, `src/statics/results/results-statics.test.ts`,
`src/transformers/run-index-compute/run-index-compute-transformer.ts`.

### Execution result — SL-PW

- Five builders moved; 15 adapter files deleted. 26 files remain in `adapters/playwright/session/`, all blocked on the
  gateway proxy gap above.
- Integration: `npm run ward -- --only integration -- packages/siegelense/src/flows` passed, 15 files (`1790635857614-e648`).


## Plan — SL-MISC

Group SL-MISC: Remaining non-playwright, non-fs adapters in `packages/siegelense`:
Migrate 5 adapters to their `#gateway/*` counterparts and delete them, staying within the ~45-file batch limit (42 files total):
1. `adapters/pixelmatch/compare/` -> `pixelmatch` from `#gateway/npm/pixelmatch` (pass-through function).
2. `adapters/pngjs/decode/` -> `decodePng` from `#gateway/npm/pngjs`, staged via `decodePngProxy` from `#gateway/npm/pngjs/decode-png/decode-png.proxy`.
3. `adapters/crypto/hash/` -> `createHash` from `#gateway/node/crypto` (pass-through function).
4. `adapters/fetch/probe/` -> `fetchOk` from `#gateway/node/fetch`, staged via `fetchOkProxy` from `#gateway/node/fetch/fetch-ok/fetch-ok.proxy`.
5. `adapters/error/is-native-error/` -> `isNativeError` from `#gateway/node/util__types`, staged via `isNativeErrorProxy` from `#gateway/node/util__types/is-native-error/is-native-error.proxy`.

### Full File Scope (42 files)

#### Adapters to delete (15 files)
- `packages/siegelense/src/adapters/pixelmatch/compare/pixelmatch-compare-adapter.ts`
- `packages/siegelense/src/adapters/pixelmatch/compare/pixelmatch-compare-adapter.proxy.ts`
- `packages/siegelense/src/adapters/pixelmatch/compare/pixelmatch-compare-adapter.test.ts`
- `packages/siegelense/src/adapters/pngjs/decode/pngjs-decode-adapter.ts`
- `packages/siegelense/src/adapters/pngjs/decode/pngjs-decode-adapter.proxy.ts`
- `packages/siegelense/src/adapters/pngjs/decode/pngjs-decode-adapter.test.ts`
- `packages/siegelense/src/adapters/crypto/hash/crypto-hash-adapter.ts`
- `packages/siegelense/src/adapters/crypto/hash/crypto-hash-adapter.proxy.ts`
- `packages/siegelense/src/adapters/crypto/hash/crypto-hash-adapter.test.ts`
- `packages/siegelense/src/adapters/fetch/probe/fetch-probe-adapter.ts`
- `packages/siegelense/src/adapters/fetch/probe/fetch-probe-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fetch/probe/fetch-probe-adapter.test.ts`
- `packages/siegelense/src/adapters/error/is-native-error/error-is-native-error-adapter.ts`
- `packages/siegelense/src/adapters/error/is-native-error/error-is-native-error-adapter.proxy.ts`
- `packages/siegelense/src/adapters/error/is-native-error/error-is-native-error-adapter.test.ts`

#### Barrel export to update (1 file)
- `packages/siegelense/adapters.ts` (remove exports for `pixelmatch-compare-adapter` and `pngjs-decode-adapter`)

#### Contract documentation comments to update (2 files)
- `packages/siegelense/src/contracts/decoded-frame/decoded-frame-contract.ts` (remove reference to deleted `pngjsDecodeAdapter`)
- `packages/siegelense/src/contracts/pixel-count/pixel-count-contract.ts` (remove reference to deleted `pixelmatchCompareAdapter`)

#### Direct callers to migrate (8 units = 24 files)
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.ts`
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.test.ts`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.ts`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.test.ts`
- `packages/siegelense/src/brokers/lane-spec/hash/lane-spec-hash-broker.ts`
- `packages/siegelense/src/brokers/lane-spec/hash/lane-spec-hash-broker.proxy.ts`
- `packages/siegelense/src/brokers/lane-spec/hash/lane-spec-hash-broker.test.ts`
- `packages/siegelense/src/brokers/lane/ready-wait/lane-ready-wait-broker.ts`
- `packages/siegelense/src/brokers/lane/ready-wait/lane-ready-wait-broker.proxy.ts`
- `packages/siegelense/src/brokers/lane/ready-wait/lane-ready-wait-broker.test.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.proxy.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.test.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy.ts`
- `packages/siegelense/src/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.test.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.test.ts`
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.ts`
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.proxy.ts`
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.test.ts`
<!-- Discovered during migration as remaining callers of error-is-native-error-adapter in packages/siegelense needed to allow deleting the adapter: -->
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.ts`
- `packages/siegelense/src/brokers/citation/resolve/verified-prelude-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.proxy.ts`
- `packages/siegelense/src/brokers/run/execute/run-execute-step-layer-broker.ts`
- `packages/siegelense/src/brokers/run/execute/run-execute-step-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts`
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.proxy.ts`
<!-- Discovered during migration as remaining callers of crypto-hash-adapter in packages/siegelense needed to allow deleting the adapter: -->
- `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.ts`
- `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/reset/snapshot-restore-layer-broker.test.ts`

#### Composing proxies (no edits needed — child proxies maintain identical public methods and signatures)
- `packages/siegelense/src/brokers/step/dispatch/step-health-broker.proxy.ts`
- `packages/siegelense/src/brokers/compare/read/compare-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.proxy.ts`
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.proxy.ts`
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.proxy.ts`
- `packages/siegelense/src/brokers/machine/read/machine-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/prune/instance-reclaim/prune-instance-reclaim-broker.proxy.ts`
- `packages/siegelense/src/flows/install/install-flow.ts`

### Left for future chunks
- `npm/install` and `npm/run-build` (`install-recipes-scaffold-responder.proxy.ts` needs `getSpawnedCwd()` and `getSpawnedArgs()`).
- `fs/close-fd` (`lane-teardown-broker.test.ts` cross-function ordering assertion with kill).
- `child-process/spawn-detached` (`unrefedPids()` and `[command, args]` matching used in `instance-start-broker.proxy.ts`).
- Remaining `fs/*` adapters (`rm`, `stat`, `statfs`, `symlink`, `unlink`, `write-file`).
### Execution result — SL-MISC

- 5 adapters completely migrated and deleted (15 files removed):
  - `packages/siegelense/src/adapters/pixelmatch/compare/` (3 files) -> `pixelmatch` from `#gateway/npm/pixelmatch`
  - `packages/siegelense/src/adapters/pngjs/decode/` (3 files) -> `decodePng` from `#gateway/npm/pngjs`, staged via `decodePngProxy`
  - `packages/siegelense/src/adapters/crypto/hash/` (3 files) -> `createHash` from `#gateway/node/crypto`
  - `packages/siegelense/src/adapters/fetch/probe/` (3 files) -> `fetchOk` from `#gateway/node/fetch`, staged via `fetchOkProxy`
  - `packages/siegelense/src/adapters/error/is-native-error/` (3 files) -> `isNativeError` from `#gateway/node/util__types`, staged via `isNativeErrorProxy`
- Removed barrel export lines for `pixelmatch-compare-adapter` and `pngjs-decode-adapter` from `packages/siegelense/adapters.ts`.
- Updated contract documentation comments in `decoded-frame-contract.ts` and `pixel-count-contract.ts`.
- Migrated all direct callers, their proxies, and their tests across 13 units:
  - `brokers/shot/blank-read/` (migrated to `decodePng`)
  - `brokers/shot/change-read/` (migrated to `decodePng` and `pixelmatch`)
  - `brokers/lane-spec/hash/` (migrated to `createHash`)
  - `brokers/lane/ready-wait/` (migrated to `fetchOk`)
  - `brokers/boot-lock/acquire/` (migrated to `isNativeError`)
  - `brokers/machine/rss-by-pgid/` (migrated to `isNativeError`)
  - `brokers/orphan/read/` (migrated to `isNativeError`)
  - `responders/install/link-create/` (migrated to `isNativeError`)
  - `brokers/citation/resolve/verified-prelude-layer-broker` (migrated to `isNativeError`)
  - `brokers/registry/lock-acquire/registry-lock-acquire-broker` (migrated to `isNativeError`)
  - `brokers/run/execute/run-execute-step-layer-broker` (migrated to `isNativeError`)
  - `brokers/step/dispatch/step-dispatch-broker` (migrated to `isNativeError`)
  - `brokers/step/reset/snapshot-restore-layer-broker` (migrated to `createHash`)
- Unit test suite run: `npm run ward -- --only unit -- packages/siegelense` passed 100% (522 files passed/0 failed, run `1790638095983-6072`).
- Scoped ward run (`--only lint,unit -- <all touched files>`): exit code 0.

## Plan — F73

Follow-up F73 closes the SL-PW gap: `@gateway/npm`'s `playwright__test` subpath gets a proxy that stages
`chromium.launch` and hands back a fake `Browser` -> `BrowserContext` -> `Page`. Scope is
`packages/@gateway/npm/src/playwright__test/**` only; siegelense is not migrated here.

### Design

- **A wrapper, like F45's `ESLint`.** `chromium/chromium.ts` exports OUR `chromium`: a plain object whose
  `launch` is an arrow property delegating to the real `chromium.launch(options)`. The barrel re-exports it by name
  (`export { chromium } from './chromium/chromium'`), so `chromium` becomes a WRAPPED export with its own proxy, and
  `gateway-colocation`'s completeness check sees the pair. An arrow property, not the real `BrowserType` method,
  so the proxy can spy on it with no `unbound-method` trip and no `as unknown as jest.Mock`.
- **The proxy never loads real Playwright.** Loading `@playwright/test` trips the unit-test I/O trap, so the proxy
  replaces it with `registerModuleMock({ module: '@playwright/test', factory: () => ({}) })`. The wrapper only
  reaches the package at call time, and the spy answers every call before that happens.
- **Every fake method is a `registerSpyOn` handle on a fake object.** `registerSpyOn` works on any object, so the
  fake `Page`/`Browser`/`BrowserContext`/locator get the same argument-addressed dispatch, throw-on-unmatched
  and `callsMatching` read-back as every other proxy. The fakes are built inside the proxy (no stub): the gateway's
  stub convention is a REAL value, and a real `Page` needs a real browser (see `expect.stub.ts`).
- **What is addressed (throws when unstaged, G19):** `chromium.launch` by its options; `page.evaluate` by its
  page function (a string, a RegExp, or a predicate — the same matcher shape `eslint.proxy.ts` takes); locator
  `count` by selector; `page.video()` (no argument, so `[]` is its honest address, but nothing answers until a
  test stages `videoRecorded` or `videoAbsent`).
- **What records and answers (`calledWith([])`, record-and-swallow per the testing doc):** the structural chain
  (`newContext` -> the one context, `newPage` -> the one page, `grantPermissions`, both `close`s) and every void
  action (`goto`, `addInitScript`, `setViewportSize`, `waitForTimeout`, `screenshot`, locator
  `click`/`fill`/`focus`/`waitFor`, `keyboard.press`, `waitForFunction`). Each exists only because a test staged a
  launch; what it was called with is read back. A test overrides one by address: `locatorActionRejects`,
  `waitForFunctionRejects`, `evaluateRejects`.
- **Playwright's string-source quirk is modelled, not bypassed.** Real Playwright applies `evaluate`'s second
  argument only to a FUNCTION page function; a string source is evaluated bare and its arg is dropped, so a
  function-valued expression comes back `undefined`. The proxy stages that at construction as a two-predicate
  address (`[string source, defined arg]`), which outranks any one-argument staging, so a caller that regresses to
  threading `arg` into a string source reads `undefined` just as it would against a real browser.
- **Events:** the fake page is a real `node:events` `EventEmitter`, so `page.on(...)` is the real subscription.
  `emitConsole`, `emitPageError`, `emitRequest`, `emitResponse` (async: flushes one macrotask, so a handler's
  `response.text()` chain settles), `emitRequestFailed` and `emitWebsocket` (returns
  `frameSent`/`frameReceived`/`close` drivers on a second emitter) build the Playwright-shaped objects a listener
  reads.

### Files

- `packages/@gateway/npm/src/playwright__test/playwright__test.ts` — barrel gains the named `chromium` re-export.
- `packages/@gateway/npm/src/playwright__test/chromium/chromium.ts` — new wrapper.
- `packages/@gateway/npm/src/playwright__test/chromium/chromium.proxy.ts` — new proxy.
- `packages/@gateway/npm/src/playwright__test/chromium/chromium.test.ts` — the proxy's own tests, driven through
  the real Playwright types.
- `packages/@gateway/npm/src/playwright__test/chromium/chromium.integration.test.ts` — the wrapper against a real
  headless Chromium (launch, evaluate, close).

### Method mapping — `playwrightSessionAdapterProxy` -> `chromiumProxy`

For the agent that migrates siegelense. Old defaults become explicit staging: every test that reaches a staged read
stages it.

| Old (`playwright-session-adapter.proxy.ts`) | New (`#gateway/npm/playwright__test/chromium/chromium.proxy`) |
|---|---|
| `registerModuleMock('@playwright/test')` + `chromium.launch.mockResolvedValue(browser)` | `launchResolves({ options: { headless: true } })` |
| `lane-boot-broker.proxy`'s `chromium.launch.mock.calls.length` | `getLaunchCalls().length` |
| `getNewContextCalls()` -> `[options]` | `getNewContextCalls()` -> `[[options]]` (argument tuples); `context.grantPermissions` is `getGrantPermissionsCalls()`, `browser.close` is `getBrowserCloseCalls()` |
| `setLocatorCount({ selector, count })` (unstaged = 0) | `locatorCountReturns({ selector, count })` (unstaged throws) |
| `getClickCalls()` / `getFillCalls()` / `getFocusCalls()` / `getWaitForCalls()` -> `{selector, ...}` | `getLocatorCalls({ action: 'click' / 'fill' / 'focus' / 'waitFor' })` -> `[selector, ...args]` tuples |
| `getKeyboardPressCalls()` -> `[key]` | `getKeyboardPressCalls()` -> `[[key]]` |
| `getWaitForFunctionCalls()` -> `{source, options}` | `getWaitForFunctionCalls()` -> `[source, arg, options]` tuples |
| `setWaitForFunctionRejects()` | `waitForFunctionRejects({ source, error })` |
| `getWaitForTimeoutCalls()`, `getInitScripts()`, `getScreenshotCalls()`, `getSetViewportSizeCalls()` | `getWaitForTimeoutCalls()`, `getAddInitScriptCalls()`, `getScreenshotCalls()`, `getSetViewportSizeCalls()`, argument tuples; `page.goto` is `getGotoCalls()` |
| `set{DescribeMatches,NearestNames,KeyRead,DomRead,Focused,Box,SettleProbe}Result`, `setRefState`, `setRootPresent`, `setEvaluateSourceResult` (substring markers, first hit wins) | `evaluateReturns({ source, result })`, `source` a RegExp or predicate on each builder's own marker; the marker ORDER the old proxy relied on becomes one distinct pattern per builder |
| `getStampCalls()` (`'stamp'`/`'unstamp'`) | `evaluateReturns({ source: /setAttribute\('siege-target'/u, result: true })` + `getEvaluateCallsFor({ source })` |
| `setStorageResult` / `getClearStorageCalls` / `getClipboardWrites` (function sources) | `evaluateReturns` / `getEvaluateCallsFor` with a predicate on `String(pageFunction)`; a clipboard write's text is the call tuple's second element |
| `setHasVideo({ hasVideo: false })` / `setVideoPath({ videoPath })` | `videoAbsent()` / `videoRecorded({ path })` |
| `setResponseTextThrows()` | `emitResponse({ ..., body: new Error(...) })` (an `Error` body makes `text()` reject with it) |
| `emitConsoleMessage({ type, text, url, line })` | `emitConsole({ type, text, url, lineNumber })` |
| `emitPageError`, `emitRequestFailed`, `emitWebsocket` | same names; `requestBody` -> `postData` |
| `emitRequestStarted` | `emitRequest` |
| `emitResponse({ ..., requestBody, responseText })` | `emitResponse({ ..., postData, body })` |

Not moved: `homedir`/`join` passthroughs, the six layer child proxies and the `Date.now` spy are the adapter's own
staging, not Playwright's; they stay in the siegelense proxy.

Every unaddressed read-back (`get...Calls()`) returns `RecordedCalls` (`callsMatching([])`'s type: `length`, `map`,
`filter`, iteration, no index); `getEvaluateCallsFor({ source })` is addressed and returns plain tuples.

### Execution result — F73

- Written as planned: wrapper, proxy, unit test (proxy exercised through Playwright's real types) and an integration
  test that launches a real headless Chromium through the wrapper. Barrel re-exports `chromium` by name.
- `npm run ward -- --only lint,typecheck,unit,integration -- packages/@gateway/npm` passed (`1790636625426-0c07`).
- Build needed: `@dungeonmaster/npm` (the barrel and a new wrapper) before anything reads its `dist`.


## Plan — SL-PW2

Finishes `packages/siegelense/src/adapters/playwright/session/` on top of F73's `chromiumProxy`. Census
2026-09-28, code wins: the facade already launches through `chromium` from `#gateway/npm/playwright__test`;
every other Playwright call is a method on what that returns. The one caller outside the folder is
`lane-boot-broker` (implementation, proxy, test).

### Lint-measured constraint that shapes the layers

A layer that takes a `page` cannot get a fake one from `chromiumProxy`: `enforce-proxy-child-creation`
flags `chromiumProxy` as a PHANTOM in a layer proxy (the layer does not import `chromium`), and
`enforce-proxy-patterns` refuses creating it lazily inside `openPage()` instead. Measured on a first
`storage-read-layer-broker` draft (runs `1790637278812-84b3`, `1790637336051-b0ba`). So only the facade,
which imports `chromium`, composes `chromiumProxy`, and no layer takes a `Page`.

### Design

- **The facade becomes `brokers/browser-session/launch/browser-session-launch-broker.ts`**
  (`browserSessionLaunchBroker`). Not under `brokers/step/` (`ban-locator-pick`'s scope). Behaviour,
  source strings and error text unchanged. `Page` is a type import from `#gateway/npm/playwright__test`.
- **Layers beside it, none taking a page:**
  - `ref-registry-layer-broker` — the pure source-string builder and `toResolution`, empty proxy.
  - `settle-wait-layer-broker` / `settle-poll-layer-broker` — take `evaluate({ source })` and
    `pause({ ms })` closures instead of the page; the facade closes them over `page.evaluate` and
    `page.waitForTimeout`. Their proxies build those closures over a virtual clock, as the old fake page
    did, with no cast.
  - `paste-payload-layer-broker` — the page-free half of paste: refuse a missing `filePath`/`value`,
    check the file exists (`existsSync`), read it (`readFileBytesSync`, both `#gateway/node/fs`), pick the
    mime type (`extname` from `#gateway/node/path`), and hand back a `ClipboardPayload`. The facade does the
    page half (focus, clipboard write, `ControlOrMeta+V`).
- **Folded into the facade:** `storage-read`, `init-script-add` and `viewport-set` are one page call each
  (the architecture's "under 50 lines, keep inline"); the facade's own tests already cover them.
- **Brokers cannot import `zod`** (lint-confirmed), so the adapter's private schemas become contracts, each
  with stub and test: `match-count`, `buffer-line-count` (the brands `browser-session-contract.ts` declared
  privately; it now imports them), `raw-ref-state`, `raw-settle-probe`, plus `clipboard-payload` for the
  paste split. `z.array(x)` becomes `x.array()`.
- **R1:** nothing returns `AdapterResult` any more.
- **The facade proxy composes `chromiumProxy`**, stages the launch in its constructor (every facade test
  and `lane-boot`'s browsered boot launch one), and keeps the `Date.now` spy and the `homedir`/`join`
  passthroughs (F73 decision 5). Read-backs follow F73's mapping table; old defaults become explicit staging
  in the test that reaches them.
- The integration test moves beside the facade as `browser-session-launch-broker.integration.test.ts`,
  unchanged apart from the name.

### Files (all under `packages/siegelense/src/`)

New, `brokers/browser-session/launch/`:
- `browser-session-launch-broker.ts`, `.proxy.ts`, `.test.ts`, `.integration.test.ts`
- `ref-registry-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `settle-wait-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `settle-poll-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `paste-payload-layer-broker.ts`, `.proxy.ts`, `.test.ts`

New contracts, each `-contract.ts`, `-contract.test.ts`, `.stub.ts`:
- `contracts/match-count/`, `contracts/buffer-line-count/`, `contracts/raw-ref-state/`,
  `contracts/raw-settle-probe/`, `contracts/clipboard-payload/`

Edited:
- `contracts/browser-session/browser-session-contract.ts` (imports the two count types; header names the broker)
- `brokers/lane/boot/lane-boot-broker.ts`, `.proxy.ts`, `.test.ts` (only the browser lines; its other
  adapter proxies are untouched)
- Name-only mentions: `statics/driver/driver-statics.ts`,
  `transformers/settle-request-shape/settle-request-shape-transformer.ts`,
  `transformers/listener-lines/listener-lines-transformer.ts`, `brokers/step/eval-source/step-eval-source-broker.ts`

Deleted: all 26 files in `adapters/playwright/session/`, then the empty `adapters/playwright/` folder.

## Plan — SL-MISC2

Group SL-MISC2: Continuing migration of remaining siegelense adapters outside playwright session.
Migrate 6 adapters to their `#gateway/*` counterparts and delete them, staying within the ~45-file batch limit (31 files total):
1. `adapters/async/delay/` -> `setTimeout` from `#gateway/node/setTimeout` (wraps as awaitable Promise in caller).
2. `adapters/os/info/` -> `cpus`, `freemem`, `loadavg`, `totalmem` from `#gateway/node/os` (MB conversion stays in `machine-read-broker.ts`).
3. `adapters/fs/statfs/` -> `diskFreeBytes` from `#gateway/node/fs__promises`, staged via `diskFreeBytesProxy` from `#gateway/node/fs__promises/disk-free-bytes/disk-free-bytes.proxy`.
4. `adapters/fs/symlink/` -> `symlink` from `#gateway/node/fs__promises`, staged via `symlinkProxy` from `#gateway/node/fs__promises/symlink/symlink.proxy`.
5. `adapters/npm/install/` -> `install` from `#gateway/bin/npm`, staged via `installProxy` from `#gateway/bin/npm/install/install.proxy`.
6. `adapters/npm/run-build/` -> `runBuild` from `#gateway/bin/npm`, staged via `runBuildProxy` from `#gateway/bin/npm/run-build/run-build.proxy`.

### Full File Scope (31 files)

#### Adapters to delete (18 files)
- `packages/siegelense/src/adapters/async/delay/async-delay-adapter.ts`
- `packages/siegelense/src/adapters/async/delay/async-delay-adapter.proxy.ts`
- `packages/siegelense/src/adapters/async/delay/async-delay-adapter.test.ts`
- `packages/siegelense/src/adapters/os/info/os-info-adapter.ts`
- `packages/siegelense/src/adapters/os/info/os-info-adapter.proxy.ts`
- `packages/siegelense/src/adapters/os/info/os-info-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/statfs/fs-statfs-adapter.ts`
- `packages/siegelense/src/adapters/fs/statfs/fs-statfs-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/statfs/fs-statfs-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/symlink/fs-symlink-adapter.ts`
- `packages/siegelense/src/adapters/fs/symlink/fs-symlink-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/symlink/fs-symlink-adapter.test.ts`
- `packages/siegelense/src/adapters/npm/install/npm-install-adapter.ts`
- `packages/siegelense/src/adapters/npm/install/npm-install-adapter.proxy.ts`
- `packages/siegelense/src/adapters/npm/install/npm-install-adapter.test.ts`
- `packages/siegelense/src/adapters/npm/run-build/npm-run-build-adapter.ts`
- `packages/siegelense/src/adapters/npm/run-build/npm-run-build-adapter.proxy.ts`
- `packages/siegelense/src/adapters/npm/run-build/npm-run-build-adapter.test.ts`

#### Barrel export to update (1 file)
- `packages/siegelense/adapters.ts` (remove exports for `fs-symlink-adapter`, `fs-statfs-adapter`, `os-info-adapter`, and `async-delay-adapter`)

#### Direct callers to migrate (4 units = 12 files)
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.ts`
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.test.ts`
- `packages/siegelense/src/brokers/machine/read/machine-read-broker.ts`
- `packages/siegelense/src/brokers/machine/read/machine-read-broker.proxy.ts`
- `packages/siegelense/src/brokers/machine/read/machine-read-broker.test.ts`
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.ts`
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.proxy.ts`
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.test.ts`
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts`
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.proxy.ts`
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.test.ts`

#### Composing proxies (no edits needed — child proxies maintain identical public methods and signatures)
- `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.proxy.ts`
- `packages/siegelense/src/brokers/status/read/status-read-broker.proxy.ts`
- `packages/siegelense/src/flows/install/install-flow.ts`

### Left for future chunks
- `fs/close-fd` (`lane-teardown-broker.test.ts` cross-function ordering assertion with kill; stays until ordering read-back exists).
- `fetch/http-request` (`step-request-broker.ts` needs `statusText` from gateway fetch which `fetchWithStatus` currently omits).
- `child-process/spawn-detached` (`instance-start-broker.ts`, `lane-boot-broker.ts`).
- `cli-package/bin-resolve` (`cli-package-bin-resolve-adapter.ts`, `package-root-find-layer-adapter.ts`).
- `os/tmpdir` (`instance-kill-broker.ts`, `instance-start-broker.ts`, `locations-instance-home-path-find-broker.ts`, `locations-socket-path-find-broker.ts`).
- `process/is-alive` and `process/kill-group` (`instance-kill-broker.ts`, `lane-boot-broker.ts`, `lane-teardown-broker.ts`, `orphan-read-broker.ts`).
- `net/unix-request` and `net/unix-serve` (`instance-kill-broker.ts`, `instance-run-broker.ts`, `instance-start-boot-poll-layer-broker.ts`, `driver-serve-layer-responder.ts`).
- Remaining `fs/*` adapters (`rm`, `stat`, `unlink`, `write-file`).


### Execution result — SL-PW2

- `packages/siegelense/src/adapters/playwright/` is gone (all 26 files). The facade is
  `brokers/browser-session/launch/browser-session-launch-broker.ts` with four layers (`ref-registry`,
  `settle-wait`, `settle-poll`, `paste-payload`) and five new contracts, as the plan above says.
- The facade proxy composes `chromiumProxy`; every page read is staged by its own source (exact string for
  the ref-registry, key-press and root-check builders, a marker predicate for the rest), and the void page
  writes (stamp, unstamp, storage clear, clipboard write) are record-and-resolve in its constructor.
- The paste clipboard write is one page function over the whole `ClipboardPayload` (text or file) instead of
  two, so `pasteMatch` and `pasteRef` share no nested helper (`forbid-non-exported-functions`).
- The unreachable "either target or ref must be provided" refusal is gone: `pasteMatch` always carries a
  target and `pasteRef` a ref.
- New facade tests: goto options, browser close, grant-permissions, a file paste, a paste refused before the
  page is touched, and unstamp-on-failure for `clickRef` and `pasteRef`.
- Ward: `--only lint,typecheck,unit` over every touched file passed (`1790638164585-28d5`); `--only
  integration` on the moved integration test (real Chromium) passed (`1790638215971-48e6`); `--only
  integration -- packages/siegelense/src/flows` passed, 15 files (`1790638240864-5bbc`).

### Execution result — SL-MISC2

- 6 adapters completely migrated and deleted (18 files removed):
  - `packages/siegelense/src/adapters/async/delay/` (3 files) -> `setTimeout` from `#gateway/node/setTimeout`
  - `packages/siegelense/src/adapters/os/info/` (3 files) -> `cpus`, `freemem`, `loadavg`, `totalmem` from `#gateway/node/os`
  - `packages/siegelense/src/adapters/fs/statfs/` (3 files) -> `diskFreeBytes` from `#gateway/node/fs__promises`
  - `packages/siegelense/src/adapters/fs/symlink/` (3 files) -> `symlink` from `#gateway/node/fs__promises`
  - `packages/siegelense/src/adapters/npm/install/` (3 files) -> `install` from `#gateway/bin/npm`
  - `packages/siegelense/src/adapters/npm/run-build/` (3 files) -> `runBuild` from `#gateway/bin/npm`
- Removed barrel export lines for `fs-symlink-adapter`, `fs-statfs-adapter`, `os-info-adapter`, and `async-delay-adapter` from `packages/siegelense/adapters.ts`.
- Migrated 4 direct caller units:
  - `step-hold-broker.ts` & proxy: direct `setTimeout` call and proxy registration.
  - `machine-read-broker.ts` & proxy: direct `os` metrics + in-broker MB math, direct `diskFreeBytes` call and proxy composition.
  - `install-link-create-responder.ts` & proxy: direct `symlink` call and `symlinkProxy` composition.
  - `install-recipes-scaffold-responder.ts` & proxy: direct `install` and `runBuild` calls, composing `installProxy` and `runBuildProxy`.
- Verified composing proxies and tests: `run-verb-layer-broker.test.ts`, `capacity-read-broker.test.ts`, `status-read-broker.test.ts`, `install-flow.integration.test.ts`.
- Full scoped ward check passed clean:
  `npm run ward -- --only lint,typecheck,unit,integration -- <all 13 touched files>`
  Result: run `1790639949773-7d95`, lint PASS 13/13, typecheck PASS 1432/1432, unit PASS 17/17 (516 discovered), integration PASS 9/9 (23 discovered).

## Plan — SL-LAST

Group SL-LAST: The final chunk for `packages/siegelense`. Complete retirement of all 13 remaining adapters, migration of domain logic into brokers, callers moved to `#gateway/*` wrappers, deletion of `src/adapters/` directory, deletion of `adapters.ts`, and removal of `./adapters` export from `packages/siegelense/package.json`.

### 13 Adapters to Retire & Delete (42 files)
1. `child-process/spawn-detached` (3 files) -> `spawnDetached` from `#gateway/node/child_process`
2. `cli-package/bin-resolve` (6 files including layer adapter) -> domain logic moves to `brokers/cli-package/bin-resolve/`
3. `fetch/http-request` (3 files) -> `fetchWithStatus` from `#gateway/node/fetch`
4. `fs/close-fd` (3 files) -> `closeSync` from `#gateway/node/fs`
5. `fs/rm` (3 files) -> `rm` from `#gateway/node/fs__promises`
6. `fs/stat` (3 files) -> `statIfExists` from `#gateway/node/fs__promises`
7. `fs/unlink` (3 files) -> `unlink` from `#gateway/node/fs__promises`
8. `fs/write-file` (3 files) -> `writeFile` / `writeFileExclusive` from `#gateway/node/fs__promises`
9. `net/unix-request` (3 files) -> domain logic moves to `brokers/driver/socket-request/driver-socket-request-broker.ts`
10. `net/unix-serve` (3 files) -> `unixSocketServe` from `#gateway/node/net` in `driver-serve-layer-responder.ts`
11. `os/tmpdir` (3 files) -> `tmpdir` from `#gateway/node/os`
12. `process/is-alive` (3 files) -> domain logic moves to `brokers/process/is-alive/process-is-alive-broker.ts`
13. `process/kill-group` (3 files) -> domain logic moves to `brokers/process/kill-group/process-kill-group-broker.ts`

### Full File Scope

#### 1. Adapter files to delete (42 files)
- `packages/siegelense/src/adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.ts`
- `packages/siegelense/src/adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.proxy.ts`
- `packages/siegelense/src/adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.test.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.proxy.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.test.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/package-root-find-layer-adapter.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/package-root-find-layer-adapter.proxy.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/package-root-find-layer-adapter.test.ts`
- `packages/siegelense/src/adapters/fetch/http-request/fetch-http-request-adapter.ts`
- `packages/siegelense/src/adapters/fetch/http-request/fetch-http-request-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fetch/http-request/fetch-http-request-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/rm/fs-rm-adapter.ts`
- `packages/siegelense/src/adapters/fs/rm/fs-rm-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/rm/fs-rm-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/stat/fs-stat-adapter.ts`
- `packages/siegelense/src/adapters/fs/stat/fs-stat-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/stat/fs-stat-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/unlink/fs-unlink-adapter.ts`
- `packages/siegelense/src/adapters/fs/unlink/fs-unlink-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/unlink/fs-unlink-adapter.test.ts`
- `packages/siegelense/src/adapters/fs/write-file/fs-write-file-adapter.ts`
- `packages/siegelense/src/adapters/fs/write-file/fs-write-file-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/write-file/fs-write-file-adapter.test.ts`
- `packages/siegelense/src/adapters/net/unix-request/net-unix-request-adapter.ts`
- `packages/siegelense/src/adapters/net/unix-request/net-unix-request-adapter.proxy.ts`
- `packages/siegelense/src/adapters/net/unix-request/net-unix-request-adapter.test.ts`
- `packages/siegelense/src/adapters/net/unix-serve/net-unix-serve-adapter.ts`
- `packages/siegelense/src/adapters/net/unix-serve/net-unix-serve-adapter.proxy.ts`
- `packages/siegelense/src/adapters/net/unix-serve/net-unix-serve-adapter.test.ts`
- `packages/siegelense/src/adapters/os/tmpdir/os-tmpdir-adapter.ts`
- `packages/siegelense/src/adapters/os/tmpdir/os-tmpdir-adapter.proxy.ts`
- `packages/siegelense/src/adapters/os/tmpdir/os-tmpdir-adapter.test.ts`
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.ts`
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.proxy.ts`
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.test.ts`
- `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.ts`
- `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.proxy.ts`
- `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.test.ts`

#### 2. Package exports & entry points to delete / edit (2 files)
- `packages/siegelense/adapters.ts` (delete file)
- `packages/siegelense/package.json` (remove `"./adapters"` export entry)

#### 3. New brokers created from adapters holding domain logic (15 files)
- `packages/siegelense/src/brokers/cli-package/bin-resolve/cli-package-bin-resolve-broker.ts`
- `packages/siegelense/src/brokers/cli-package/bin-resolve/cli-package-bin-resolve-broker.proxy.ts`
- `packages/siegelense/src/brokers/cli-package/bin-resolve/cli-package-bin-resolve-broker.test.ts`
- `packages/siegelense/src/brokers/cli-package/bin-resolve/package-root-find-layer-broker.ts`
- `packages/siegelense/src/brokers/cli-package/bin-resolve/package-root-find-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/cli-package/bin-resolve/package-root-find-layer-broker.test.ts`
- `packages/siegelense/src/brokers/driver/socket-request/driver-socket-request-broker.ts`
- `packages/siegelense/src/brokers/driver/socket-request/driver-socket-request-broker.proxy.ts`
- `packages/siegelense/src/brokers/driver/socket-request/driver-socket-request-broker.test.ts`
- `packages/siegelense/src/brokers/process/is-alive/process-is-alive-broker.ts`
- `packages/siegelense/src/brokers/process/is-alive/process-is-alive-broker.proxy.ts`
- `packages/siegelense/src/brokers/process/is-alive/process-is-alive-broker.test.ts`
- `packages/siegelense/src/brokers/process/kill-group/process-kill-group-broker.ts`
- `packages/siegelense/src/brokers/process/kill-group/process-kill-group-broker.proxy.ts`
- `packages/siegelense/src/brokers/process/kill-group/process-kill-group-broker.test.ts`

#### 4. Direct callers to migrate / update (implementations, proxies, tests)
- `packages/siegelense/src/brokers/boot-failure-marker/read/boot-failure-marker-read-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/boot-failure-marker/write/boot-failure-marker-write-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/cleanup/run/lock-release-layer-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/heartbeat/write/heartbeat-write-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/instance/run/instance-run-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/instance/start/instance-start-boot-poll-layer-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/instance/state-resolve/instance-state-resolve-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/locations/instance-home-path-find/locations-instance-home-path-find-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/locations/socket-path-find/locations-socket-path-find-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/orphan/read/orphan-read-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/prune/assets-list/prune-assets-list-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/prune/instance-reclaim/prune-instance-reclaim-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/registry/write/registry-write-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/results/read/run-missing-check-layer-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/shutdown-reason/read/shutdown-reason-read-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/shutdown-reason/write/shutdown-reason-write-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/snapshot/index-write/snapshot-index-write-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/snapshot/list/snapshot-list-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/snapshot/restore-layer/snapshot-restore-layer-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/brokers/step/request/step-request-broker.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/responders/install/ignore-write/install-ignore-write-responder.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.ts` & `.proxy.ts` & `.test.ts`
- `packages/siegelense/test/harnesses/driver/driver-fleet.harness.ts`
- `packages/siegelense/test/harnesses/snapshot/snapshot-store.harness.ts`
- `packages/siegelense/src/brokers/prune/run/prune-run-broker.integration.test.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-status-layer-flow.integration.test.ts`


