# F56 and F57: gateway proxy read-back

Audited 2026-09-29 against the working tree.

## Current state

- F56 (`@gateway/browser` fetch proxies): DONE. Nothing to plan.
- F57 (`@gateway/node` proxy read-back): PARTLY DONE. Thirteen proxies with a staged seam and a wrapper argument still
  lack a full-argument-tuple read-back. Seven have none, six have a narrow one.

Already done, do not touch: `copy-file`, `append-file`, `close-sync`, `dynamic-import` and every `fs__promises` /
`fs` proxy that exposes `getCallsFor`, `calls` or `callsMatching` over the full tuple.

Out of scope, no seam staged (proxy is `Record<PropertyKey, never>` or works on the real process): `resolve-package-root`,
`is-port-free`, `delete-env`, `set-env`, `get-env`, `set-exit-code`, `next-tick`, `emit`, `set-stdin`, `chdir`,
`is-native-error`, `is-fs-error`, `is-walked-file`.

## Plan

Package: `@gateway/node` only. Every path below is under `packages/@gateway/node/src/`. Each change adds a
`getCallsFor` (or `calls`) returning `readonly unknown[][]` built from `handle.callsMatching([...])`, following
`fs__promises/copy-file/copy-file.proxy.ts`, plus a colocated `*.test.ts` case per new method that asserts the real
recorded tuple. Keep the existing narrow read-backs.

### Batch 1: spawn family, narrow read-backs widened

Files:
- `child_process/spawn-piped/spawn-piped.proxy.ts` (has `getWrittenLinesFor`, `getKillCountFor`, `getSpawnedEnvFor`)
- `child_process/spawn-live/spawn-live.proxy.ts` (has `getSpawnedOptions`, last call only)
- `child_process/spawn-long-lived/spawn-long-lived.proxy.ts` (none)
- `child_process/run-sync-with-input/run-sync-with-input.proxy.ts` (has `getInputFor`, `getSpawnedEnvFor`)

Callers affected: `spawnPipedProxy`, `spawnLiveProxy`, `spawnLongLivedProxy` are imported only by their own colocated
tests. `runSyncWithInputProxy` is composed by `@gateway/bin` `git/git-run-sync/git-run-sync.proxy.ts`.
Gate: `@gateway/node`, `@gateway/bin`.

### Batch 2: sync spawn, stdin reader, probe fetch

Files:
- `child_process/run-sync/run-sync.proxy.ts` (none)
- `readline/line-reader/line-reader.proxy.ts` (only `passesThroughFor`)
- `fetch/fetch-ok/fetch-ok.proxy.ts` (none; still `registerSpyOn({ object: globalThis, method: 'fetch' })` at line 13,
  the same shape F56 removed from `@gateway/browser`. Read it before changing: converting it to MSW is a larger change
  than the read-back, so add the read-back first and raise the conversion as its own item.)

Callers affected: `runSyncProxy` is composed by `testing` `install-testbed-create-broker.proxy.ts` and
`integration-environment-create-broker.proxy.ts`. `lineReaderProxy` by `orchestrator`
`agent-spawn-stream-json-broker.proxy.ts` and `agent-spawn-unified-broker.proxy.ts`. `fetchOkProxy` by `siegelense`
`lane-ready-wait-broker.proxy.ts`.
Gate: `@gateway/node`, `testing`, `orchestrator`, `siegelense`.

### Batch 3: sync fs discovery

Files:
- `fs/find-up-sync/find-up-sync.proxy.ts` (none)
- `fs/glob-sync/glob-sync.proxy.ts` (none)
- `fs/walk-files-sync/walk-files-sync.proxy.ts` (none; stages `readdirSync` and `statSync` mocks)

Callers affected: `globSyncProxy` by `ward` `glob-discover-files-broker.proxy.ts`. `walkFilesSyncProxy` by
`orchestrator` `usage-ledger-scan-broker.proxy.ts` and `shared` `contract-index-build-broker.proxy.ts`.
`findUpSyncProxy` has no composer outside its own test.
Gate: `@gateway/node`, `ward`, `orchestrator`, `shared`.

### Batch 4: async fs compound writers

Files:
- `fs__promises/copy-dir-contents/copy-dir-contents.proxy.ts` (has `rmCallsFor`, `cpCallsFor`, typed `unknown`; no
  `readdir` read-back)
- `fs__promises/copy-dir-contents-entries-recurse/copy-dir-contents-entries-recurse.proxy.ts` (same two, typed `unknown`)
- `fs__promises/write-file-atomic/write-file-atomic.proxy.ts` (only `unlinkCallsForTmp`; `mkdir`, `writeFile`, `rename`
  tuples unread)

Callers affected: `copyDirContentsProxy` by `siegelense` `snapshot-capture-broker.proxy.ts` and
`snapshot-restore-layer-broker.proxy.ts`. `writeFileAtomicProxy` has no composer outside its own test.
Gate: `@gateway/node`, `siegelense`.

## Gating

Per batch: `npm run ward -- --only lint,typecheck,unit -- <the batch's files and their tests>`, then the same scoped
ward over each composing package's proxy and test files listed above. Batches touch disjoint files, so all four can run
concurrently.
