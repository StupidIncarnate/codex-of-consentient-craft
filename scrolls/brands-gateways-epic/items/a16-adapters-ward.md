# A16: Adapters: `ward`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366) and item 33's `killPid` half; `scrolls/gateway-build/coverage.md` ward rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [A03](a03-port-kill-broker.md), [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | ward |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (batches below) |
| Runs alone | no other agent editing `ward` at the same time |

## Current state

Census of `packages/ward/src/adapters/**` run 2026-09-26: 20 files. Two are NOT this item's job —
`net/kill-port/net-kill-port-adapter.ts` and `net/port-in-use/net-port-in-use-adapter.ts` are
[A03](a03-port-kill-broker.md)'s (moved onto the new `shared` port-kill broker there, with a real signal/behaviour
change — read A03's item file, do not duplicate that work here).

That leaves 18 adapters, 5 of which `coverage.md` does not name at all:

| Batch | Path | Replacement |
|---|---|---|
| FS-1 | `adapters/crypto/hash-files/crypto-hash-files-adapter.ts` | split → `@dungeonmaster/node/crypto` (`createHash`) + `@dungeonmaster/node/fs` `readFileSync`; the per-file `ENOENT`/`EISDIR` skip (everything else rethrown) stays ward's own logic |
| FS-1 | `adapters/fs/glob-sync/fs-glob-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `globSync` |
| FS-1 | `adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `ensureDir` |
| FS-1 | `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| FS-2 | `adapters/fs/read-json-sync/fs-read-json-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `readJsonFileSyncIfExists` |
| FS-2 | `adapters/fs/readdir-dirs/fs-readdir-dirs-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readdirEntries` |
| FS-2 | `adapters/fs/readdir/fs-readdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readdirIfExists` |
| FS-2 | `adapters/fs/rename/fs-rename-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rename` |
| FS-3 | `adapters/fs/rm/fs-rm-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rm` |
| FS-3 | `adapters/fs/stat/fs-stat-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `statIfExists` |
| FS-3 | `adapters/fs/unlink/fs-unlink-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `unlink` |
| MISC | `adapters/fs/write-file/fs-write-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFile` |
| MISC | `adapters/os/tmpdir/os-tmpdir-adapter.ts` | gateway → `@dungeonmaster/node/os` (`tmpdir`) |
| TS-SHAPE | `adapters/typescript/module-shape/typescript-module-shape-adapter.ts` | not in `coverage.md` — see below |
| TS-SHAPE | `adapters/typescript/module-shape/export-dependency-from-declaration-layer-adapter.ts` | not in `coverage.md` — see below |
| TS-SHAPE | `adapters/typescript/module-shape/has-export-modifier-layer-adapter.ts` | not in `coverage.md` — see below |
| TS-SHAPE | `adapters/typescript/module-shape/import-dependency-from-declaration-layer-adapter.ts` | not in `coverage.md` — see below |
| TS-SHAPE | `adapters/typescript/module-shape/local-export-names-from-statement-layer-adapter.ts` | not in `coverage.md` — see below |

**The `typescript/module-shape/` family (5 files) is entirely new since `coverage.md` was written.** Confirmed
2026-09-26 by reading all five: they parse one TypeScript source file's top-level statements into
`{ dependencies, localExportNames }` — the shape the platform-crossing walk needs (`scrolls/adapters-to-one-place.md`'s
"Platform code must not reach a package on the other platform" section). Every function is pure: text/AST in, a
plain object out, no I/O of its own. **The top file, `typescript-module-shape-adapter.ts`, already imports
`import * as ts from '#gateway/npm/typescript'`** — it is mid-migration. The four "layer" helpers it composes
(`export-dependency-from-declaration-layer-adapter.ts`, `has-export-modifier-layer-adapter.ts`,
`import-dependency-from-declaration-layer-adapter.ts`, `local-export-names-from-statement-layer-adapter.ts`) still
import raw `typescript`. **Recommended — the executing agent may change this with a reason in DECISIONS:** move all
five out of `adapters/` into `transformers/` (none of them has any adapter-shaped remainder — every one is a pure
data transform), and switch the four still-raw imports to `#gateway/npm/typescript` to match the top file. Keep
every file's own name and its composition into `typescript-module-shape-adapter.ts` (soon
`typescript-module-shape-transformer.ts`) unchanged — this is a folder-type move plus an import-source change,
nothing else.

## Work

1. For every `gateway`-fate row: switch every caller to the named export, imported from its `#gateway/<kind>/<subpath>`
   path.
2. For `crypto-hash-files-adapter.ts`: move the raw `createHash`/`readFileSync` calls onto
   `@dungeonmaster/node/crypto` and `@dungeonmaster/node/fs`; keep the per-file `ENOENT`/`EISDIR` skip logic as a
   broker in `ward`.
3. For the `typescript/module-shape/` family: move all five files to `transformers/`, updating the four raw
   `typescript` imports to `#gateway/npm/typescript`, or record a different decision.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/node/fs/glob-sync/glob-sync.proxy`), never through a barrel, per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 18 adapter files this item touches remain, and — once [A03](a03-port-kill-broker.md)'s two files have
  also moved — `packages/ward/src/adapters/` is gone entirely.
- `npm run ward -- --only lint,typecheck,unit -- packages/ward` exits 0.

## Traps

- Confirm [A03](a03-port-kill-broker.md) has landed (the two `net/*` files gone) before treating
  `packages/ward/src/adapters/` as fully empty.
- Ward's own typecheck check spawns `tsc --noEmit --listFiles` on the WHOLE package regardless of file scope
  (`packages/ward/CLAUDE.md`'s own words: "there is no per-file mode") — a narrow file-scoped ward run for THIS
  item still typechecks the whole `ward` package, so a mistake anywhere in `ward` shows up even in a small batch's
  run. That is expected, not a sign your batch grew.

## Plan — G-BB-1

### G-BB-1a

Took the `fsGlobSyncAdapter` row only: `glob-discover-files-broker` (+ `.proxy.ts`, `.test.ts`) created under
`packages/ward/src/brokers/glob/discover-files/`, all 6 listed callers (and their `.proxy.ts`) moved, `adapters/fs/glob-sync/` deleted; a
python `os.walk` re-scan of `packages/ward/src` after the moves confirms zero remaining hits for
`fsGlobSyncAdapter`/`fs-glob-sync-adapter`. The 3 `returnsForAnyPattern` proxy call sites (integration, unit,
typecheck) were rebuilt as `returnsForPatterns`, staged from the SAME real transformer
(`jestDiscoverPatternsTransformer`/`tsconfigDiscoverPatternsTransformer`) the broker itself calls, instead of
porting the old adapter proxy's `typeof pattern === 'string'` predicate — that predicate matches every call
regardless of pattern or cwd and is the same shape as the banned `path: () => true` accept-all stage.

Scope: FS-1, FS-2 and FS-3 batches only (11 adapters, 2 crypto/fs-sync files plus 9 fs files under
`adapters/fs/**` and `adapters/crypto/**`). MISC (`fs/write-file`, `os/tmpdir`) and TS-SHAPE
(`typescript/module-shape/**`) are a later group and are not named below.

A repo-wide caller census (`python3 os.walk` + regex over `packages/ward/src/**/*.ts`, since Bash
`grep`/`find` are hook-blocked and `discover`'s own index was found stale for this exact folder —
`packages/ward/src/brokers/bundle/build/*.ts` matched zero results in `discover({grep:
"cryptoHashFilesAdapter"})` despite `bundle-build-broker.ts` importing it on its own line 29; a direct
`Read` of that file is what caught it) found **24 unique caller files**, each with its own
`.proxy.ts` — 48 files — plus one test file needing a comment-only edit
(`storage-prune-broker.test.ts` line ~142 names `fsStatAdapter` in a comment). That is over the ~30
file threshold this group's instructions set for stopping after the plan, so no code below has been
written; see the report this plan is filed under for the split recommendation.

### Adapters to delete (11 adapters × 3 files = 33 files)

- `packages/ward/src/adapters/crypto/hash-files/crypto-hash-files-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/glob-sync/fs-glob-sync-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/read-file/fs-read-file-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/read-json-sync/fs-read-json-sync-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/readdir-dirs/fs-readdir-dirs-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/readdir/fs-readdir-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/rename/fs-rename-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/rm/fs-rm-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/stat/fs-stat-adapter.ts` (+ `.proxy.ts`, `.test.ts`)
- `packages/ward/src/adapters/fs/unlink/fs-unlink-adapter.ts` (+ `.proxy.ts`, `.test.ts`)

Every one of these folders is left empty once its 3 files are gone and must be removed too.

### New ward-local files (two adapters are not passthroughs; their non-I/O logic needs a home)

- **`packages/ward/src/brokers/bundle/hash-files/bundle-hash-files-broker.ts`** (+ `.proxy.ts`,
  `.test.ts`) — replaces `cryptoHashFilesAdapter` per the item's own Work step 2. Composes `createHash`
  from `#gateway/node/crypto` (a bare `export * from 'crypto'`, so it carries no per-function proxy of
  its own — `createHash`'s output is pure and deterministic, so nothing about it needs mocking) and
  keeps the sorted-path iteration, the NUL `FIELD_SEPARATOR` framing and the per-file ENOENT/EISDIR
  skip (everything else rethrown) verbatim from `crypto-hash-files-adapter.ts` lines 33-68.
  **BLOCKED on the read half — flagged, not solved, here**: the adapter's own proxy
  (`crypto-hash-files-adapter.proxy.ts`) mocks a single-argument `readFileSync(path)` that returns a
  raw `Buffer`, and the hash covers those raw bytes AND `String(contents.length)` (the BYTE length).
  `#gateway/node/fs`'s `readFileSync` (`packages/@gateway/node/src/fs/read-file-sync/read-file-sync.ts`)
  is called two-argument (`[path, 'utf8']`) and is typed to always return a UTF-8 `string` — there is no
  synchronous raw-bytes read anywhere in `#gateway/node/fs/**` (the only raw-bytes reader,
  `readFileBytes`, lives in the ASYNC half, `fs__promises`). Routing this file's read through the
  gateway's `readFileSync` would silently change the digest for any file whose bytes are not valid
  UTF-8, and would change `contents.length` from a byte count to a UTF-16 character count for every
  multi-byte-UTF-8 file already in this repo. Per this group's hard rule ("If the gateway offers no way
  to do something the recipe needs ... STOP on that file and report it; do not work around it"), this
  file is not implementable as the item's recipe describes until `@gateway/node` grows a synchronous
  raw-bytes reader — out of this item's package scope (`ward` only).
- **`packages/ward/src/brokers/glob/discover-files/glob-discover-files-broker.ts`** (+ `.proxy.ts`,
  `.test.ts`) — replaces `fsGlobSyncAdapter`. Composes `globSync` from `#gateway/node/fs`
  (`#gateway/node/fs/glob-sync/glob-sync.proxy`) and keeps the per-pattern iteration, the
  cross-pattern `Set` de-dup, the `GitRelativePath` re-parse and the `discoveredCount` computation
  verbatim from `fs-glob-sync-adapter.ts` lines 34-52. No blocker: `globSync`'s signature
  (`{patterns, cwd, exclude}` → `string[]`) is a straight superset of what the adapter already called.

### Callers to edit (24 files, each with its own `.proxy.ts` — 48 files total)

**`fsGlobSyncAdapter` → `glob-discover-files-broker`** (ward-local, above), composing
`glob-discover-files-broker.proxy` — no gateway proxy is imported directly by these files:
1. `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts` (+ `.proxy.ts`) — also
   `fsReadFileAdapter`, `fsUnlinkAdapter`
2. `packages/ward/src/brokers/check-run/integration/check-run-integration-broker.ts` (+ `.proxy.ts`) —
   also `fsReadFileAdapter`, `fsUnlinkAdapter`
3. `packages/ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.ts` (+ `.proxy.ts`) — also
   `fsReadJsonSyncAdapter`
4. `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.ts` (+ `.proxy.ts`) — also
   `fsReadFileAdapter`, `fsUnlinkAdapter`
5. `packages/ward/src/brokers/platform-crossing/check/platform-crossing-check-broker.ts` (+ `.proxy.ts`) —
   also `fsReadFileAdapter`
6. `packages/ward/src/brokers/bundle/build/collect-inputs-layer-broker.ts` (+ `.proxy.ts`) — also
   `fsReadFileAdapter`

**`fsMkdirAdapter` → `ensureDir` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy`. `ensureDir` returns `void`; both call sites
already discard the old `AdapterResult`, so this is a drop-in swap:
7. `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` (+ `.proxy.ts`) — also
   `cryptoHashFilesAdapter` → `bundle-hash-files-broker` (BLOCKED, see above), `fsRenameAdapter`,
   `fsRmAdapter` (×3 call sites), `fsReadFileAdapter`
8. `packages/ward/src/brokers/storage/save/storage-save-broker.ts` (+ `.proxy.ts`)

**`fsReadFileAdapter` → `readFile` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/read-file/read-file.proxy`. `readFile` returns a plain `string`, not the
branded `FileContents` the adapter parsed — every caller already feeds the result straight into
`JSON.parse` or string concatenation, so this is expected to be behavior-preserving, but confirm on
each file:
9. `packages/ward/src/brokers/command/run/folder-resolve-layer-broker.ts` (+ `.proxy.ts`)
10. `packages/ward/src/brokers/duplicate-install/check/gateway-dependency-names-read-layer-broker.ts`
    (+ `.proxy.ts`)
11. `packages/ward/src/brokers/duplicate-install/check/installed-package-version-read-optional-layer-broker.ts`
    (+ `.proxy.ts`)
12. `packages/ward/src/brokers/platform-crossing/check/read-first-existing-candidate-layer-broker.ts`
    (+ `.proxy.ts`)
13. `packages/ward/src/brokers/platform-crossing/check/read-package-name-optional-layer-broker.ts`
    (+ `.proxy.ts`)
14. `packages/ward/src/brokers/storage/load/storage-load-broker.ts` (+ `.proxy.ts`) — also
    `fsReaddirAdapter`
15. `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.ts` (+ `.proxy.ts`) — also
    `fsReaddirDirsAdapter`
16. `packages/ward/src/brokers/workspace/discover/workspace-discover-broker.ts` (+ `.proxy.ts`)
17. `packages/ward/src/brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.ts`
    (+ `.proxy.ts`) — also `fsStatAdapter`
18. `packages/ward/src/responders/install/write-gitignore/install-write-gitignore-responder.ts`
    (+ `.proxy.ts`)
19. `packages/ward/src/responders/install/write-scripts/install-write-scripts-responder.ts`
    (+ `.proxy.ts`)
20. `packages/ward/src/brokers/bundle/build/resolve-workspace-root-layer-broker.ts` (+ `.proxy.ts`)
- (also #1-#6 above already list their own `fsReadFileAdapter` usage where it coincides with
  `fsGlobSyncAdapter`; #7 (`bundle-build-broker.ts`) also reads via `fsReadFileAdapter`)

**`fsReadJsonSyncAdapter` → `readJsonFileSyncIfExists` from `#gateway/node/fs`**, composing
`#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy`. The one caller
already wraps the call in a bare `try { } catch { tsconfigData stays {} }` that swallows ENOENT and a
JSON parse failure identically, so answering `null` on ENOENT instead of throwing needs that catch
turned into (or paired with) a null-check, not a behavior change to the fallback itself:
21. `packages/ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.ts` — already listed as #3

**`fsReaddirDirsAdapter` → `readdirEntries` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy`. The gateway call returns
`DirEntry[]` (`{name, kind}`) for EVERY entry, not just directories — each caller must add
`entries.filter((e) => e.kind === 'directory').map((e) => fileNameContract.parse(e.name))` in place of
the old already-filtered `FileName[]`:
22. `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.ts` — already listed as #15
23. `packages/ward/src/brokers/workspace/discover/pattern-resolve-layer-broker.ts` (+ `.proxy.ts`)

**`fsReaddirAdapter` → `readdirIfExists` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy`. Answers `null` on a missing
directory instead of throwing ENOENT — every caller's existing `.catch(() => [])` / try-catch becomes a
null-check instead:
24. `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts` (+ `.proxy.ts`) — also
    `fsStatAdapter`, `fsRmAdapter`
25. `packages/ward/src/brokers/storage/load/storage-load-broker.ts` — already listed as #14
26. `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts` (+ `.proxy.ts`, and
    `.test.ts` for the comment naming `fsStatAdapter`) — also `fsStatAdapter`, `fsUnlinkAdapter`

**`fsRenameAdapter` → `rename` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/rename/rename.proxy`. Returns `void`; the one caller already discards the
resolved value and only inspects a thrown error (EEXIST/ENOTEMPTY from a losing publish race):
27. `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` — already listed as #7

**`fsRmAdapter` → `rm` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/rm/rm.proxy`. Returns `void`; every call site already discards the old
`AdapterResult`:
28. `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` — already listed as #7 (×3 call sites)
29. `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts` — already listed as #24
30. `packages/ward/src/brokers/e2e-artifacts/remove/e2e-artifacts-remove-broker.ts` (+ `.proxy.ts`)

**`fsStatAdapter` → `statIfExists` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy`. The OLD adapter returned a real Node
`fs.Stats` (`.mtimeMs`, `.isDirectory()`); the gateway returns a PLAIN `{kind, sizeBytes, modifiedAtMs,
createdAtMs} | null` — every `.mtimeMs` read becomes `.modifiedAtMs`:
31. `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts` — already listed as #24
    (`stats.mtimeMs` at line 73 → `stats.modifiedAtMs`)
32. `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts` — already listed as #26
    (`stats.mtimeMs` at line 60 → `stats.modifiedAtMs`)
33. `packages/ward/src/brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.ts`
    — already listed as #17 (presence-only check, `stats === null`, no field read)

**`fsUnlinkAdapter` → `unlink` from `#gateway/node/fs__promises`**, composing
`#gateway/node/fs__promises/unlink/unlink.proxy`. Returns `void`; every call site already discards the
old `AdapterResult`:
34. `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts` — already listed as #1 (×2 call sites)
35. `packages/ward/src/brokers/check-run/integration/check-run-integration-broker.ts` — already listed as #2
36. `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.ts` — already listed as #4
37. `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts` — already listed as #26

### Deduplicated file count

24 unique caller implementation files, 24 matching `.proxy.ts` files, 1 test file with a comment-only
edit, 2 new ward-local broker domains (6 files: impl + proxy + test, ×2) and 33 adapter files deleted.
Caller `.ts` files plus their composing `.proxy.ts` files alone: 48 — over the ~30 file stop threshold.

### G-BB-1b

Takes 4 of the 5 named adapters — `fs/mkdir`, `fs/read-json-sync`, `fs/readdir-dirs`, `fs/readdir` —
and skips `fs/read-file`, confirmed by a fresh `discover({grep: ...})` caller census (Read wins where
`discover`'s index is stale — reconfirmed on `bundle-build-broker.ts`, the same folder G-BB-1a already
found stale) to have 18 distinct caller files (36 edit targets before adapter deletion), which alone
exceeds the ~30 file budget. The other four adapters total 19 edit targets + 12 adapter-file deletions
= 31, so this group does those four and reports `fs/read-file` under LEFT STANDING for its own group.

Files taken:

- `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` — `fsMkdirAdapter` → `ensureDir`
  (`#gateway/node/fs__promises`); its `fsReadFileAdapter`/`fsRenameAdapter`/`fsRmAdapter`/
  `cryptoHashFilesAdapter` usages are untouched (other groups)
- `packages/ward/src/brokers/bundle/build/bundle-build-broker.proxy.ts` — compose
  `#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy` in place of `fsMkdirAdapterProxy`
- `packages/ward/src/brokers/storage/save/storage-save-broker.ts` — `fsMkdirAdapter` → `ensureDir`
- `packages/ward/src/brokers/storage/save/storage-save-broker.proxy.ts` — compose `ensureDirProxy`
- `packages/ward/src/brokers/storage/save/storage-save-broker.test.ts` — `setupMkdirFail` call site
  adapts to the new FsError-shaped rejection
- `packages/ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.ts` —
  `fsReadJsonSyncAdapter` → `readJsonFileSyncIfExists` (`#gateway/node/fs`)
- `packages/ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.proxy.ts` — compose
  `#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy`
- `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.ts` —
  `fsReaddirDirsAdapter` → `readdirEntries` (`#gateway/node/fs__promises`), filtered to
  `kind === 'directory'`; its `fsReadFileAdapter` usage is untouched (other group)
- `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.proxy.ts` — compose
  `#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy`
- `packages/ward/src/brokers/workspace/discover/pattern-resolve-layer-broker.ts` —
  `fsReaddirDirsAdapter` → `readdirEntries`, filtered to `kind === 'directory'`
- `packages/ward/src/brokers/workspace/discover/pattern-resolve-layer-broker.proxy.ts` — compose
  `readdirEntriesProxy`
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts` — `fsReaddirAdapter` →
  `readdirIfExists` (`#gateway/node/fs__promises`); its `fsStatAdapter`/`fsRmAdapter` usages are
  untouched (other groups)
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.proxy.ts` — compose
  `#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy`
- `packages/ward/src/brokers/storage/load/storage-load-broker.ts` — `fsReaddirAdapter` →
  `readdirIfExists`; its `fsReadFileAdapter` usage is untouched (other group)
- `packages/ward/src/brokers/storage/load/storage-load-broker.proxy.ts` — compose
  `readdirIfExistsProxy`
- `packages/ward/src/brokers/storage/load/storage-load-broker.test.ts` — `setupReaddirFail` call site
  drops its now-unused `error` argument
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts` — `fsReaddirAdapter` →
  `readdirIfExists`; its `fsStatAdapter`/`fsUnlinkAdapter` usages are untouched (other groups)
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.proxy.ts` — compose
  `readdirIfExistsProxy` for the readdir half only
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.test.ts` — `setupReaddirFail` call
  site drops its now-unused `error` argument

Adapters deleted (with proxy and test, 4 × 3 = 12 files):

- `packages/ward/src/adapters/fs/mkdir/{fs-mkdir-adapter.ts,fs-mkdir-adapter.proxy.ts,fs-mkdir-adapter.test.ts}`
- `packages/ward/src/adapters/fs/read-json-sync/{fs-read-json-sync-adapter.ts,fs-read-json-sync-adapter.proxy.ts,fs-read-json-sync-adapter.test.ts}`
- `packages/ward/src/adapters/fs/readdir-dirs/{fs-readdir-dirs-adapter.ts,fs-readdir-dirs-adapter.proxy.ts,fs-readdir-dirs-adapter.test.ts}`
- `packages/ward/src/adapters/fs/readdir/{fs-readdir-adapter.ts,fs-readdir-adapter.proxy.ts,fs-readdir-adapter.test.ts}`

Left for a follow-up group: `fs/read-file` (`fsReadFileAdapter` → `readFile`), its 18 caller files
(including the mkdir/read-json-sync/readdir-dirs/readdir callers above, which keep their
`fsReadFileAdapter` import untouched until then) and their `.proxy.ts` files, plus the adapter's own
3 files.

### G-BB-1c

Takes 3 adapters — `fs/rename`, `fs/rm`, `fs/stat` — migrating all callers onto `#gateway/node/fs__promises` (`rename`, `rm`, `statIfExists`) and deleting their 9 adapter files.
Leaves `fs/unlink` for a follow-up group because `#gateway/node/fs__promises/unlink/unlink.proxy.ts` does not provide `getCallsFor` read-back needed by `storagePruneBrokerProxy.getDeletedPaths()`.

Files to edit:

- `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` — `fsRenameAdapter` → `rename`, `fsRmAdapter` → `rm` (`#gateway/node/fs__promises`); `fsReadFileAdapter`/`cryptoHashFilesAdapter` untouched (other groups)
- `packages/ward/src/brokers/bundle/build/bundle-build-broker.proxy.ts` — compose `renameProxy` and `rmProxy` (`#gateway/node/fs__promises`) in place of `fsRenameAdapterProxy` and `fsRmAdapterProxy`
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts` — `fsRmAdapter` → `rm`, `fsStatAdapter` → `statIfExists` (`#gateway/node/fs__promises`)
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.proxy.ts` — compose `rmProxy` and `statIfExistsProxy` (`#gateway/node/fs__promises`) in place of `fsRmAdapterProxy` and `fsStatAdapterProxy`
- `packages/ward/src/brokers/e2e-artifacts/remove/e2e-artifacts-remove-broker.ts` — `fsRmAdapter` → `rm` (`#gateway/node/fs__promises`)
- `packages/ward/src/brokers/e2e-artifacts/remove/e2e-artifacts-remove-broker.proxy.ts` — compose `rmProxy` (`#gateway/node/fs__promises`) in place of `fsRmAdapterProxy`
- `packages/ward/src/brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.ts` — `fsStatAdapter` → `statIfExists` (`#gateway/node/fs__promises`); replace type predicate filter with plain `x !== null` filter; `fsReadFileAdapter` untouched (other group)
- `packages/ward/src/brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.proxy.ts` — compose `statIfExistsProxy` (`#gateway/node/fs__promises`) in place of `fsStatAdapterProxy`
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts` — `fsStatAdapter` → `statIfExists` (`#gateway/node/fs__promises`); `fsUnlinkAdapter` untouched (left standing pending gateway read-back)
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.proxy.ts` — compose `statIfExistsProxy` (`#gateway/node/fs__promises`) in place of `fsStatAdapterProxy`; keep `fsUnlinkAdapterProxy`
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.test.ts` — update comment referencing `fsStatAdapter` to `statIfExists`

Adapters deleted (with proxy and test, 3 × 3 = 9 files):

- `packages/ward/src/adapters/fs/rename/fs-rename-adapter.ts`
- `packages/ward/src/adapters/fs/rename/fs-rename-adapter.proxy.ts`
- `packages/ward/src/adapters/fs/rename/fs-rename-adapter.test.ts`
- `packages/ward/src/adapters/fs/rm/fs-rm-adapter.ts`
- `packages/ward/src/adapters/fs/rm/fs-rm-adapter.proxy.ts`
- `packages/ward/src/adapters/fs/rm/fs-rm-adapter.test.ts`
- `packages/ward/src/adapters/fs/stat/fs-stat-adapter.ts`
- `packages/ward/src/adapters/fs/stat/fs-stat-adapter.proxy.ts`
- `packages/ward/src/adapters/fs/stat/fs-stat-adapter.test.ts`

Left for a follow-up group:
- `fs/unlink` (`fsUnlinkAdapter` → `unlink`), its 4 caller files (`check-run/e2e`, `check-run/integration`, `check-run/unit`, `storage/prune` unlink half) and their `.proxy.ts` files, plus the adapter's own 3 files.
- `fs/read-file`, `crypto/hash-files`, `fs/write-file`, `os/tmpdir`, `typescript/module-shape` (other groups).

### G-BB-1e

Takes `fs/unlink`'s last 3 callers (the check-run brokers, which also carry `fsReadFileAdapter` — migrated in the same edit since the file is already open) and 12 more `fs/read-file` callers (13 of the 18 total), staying near the ~30-file budget. Package: ward only.

Files edited:

- `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts` — `fsUnlinkAdapter`/`fsReadFileAdapter` → `unlink`/`readFile` (`#gateway/node/fs__promises`)
- `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.proxy.ts` — compose `unlinkProxy`/`readFileProxy` (`#gateway/node/fs__promises/unlink/unlink.proxy`, `.../read-file/read-file.proxy`) in place of the old adapter proxies
- `packages/ward/src/brokers/check-run/integration/check-run-integration-broker.ts` — same swap
- `packages/ward/src/brokers/check-run/integration/check-run-integration-broker.proxy.ts` — same swap; `handleUnlinkProxy.succeedsForAnyPath()` (an accept-all catch-all the old adapter proxy allowed) becomes `handleUnlinkProxy.succeeds({path: handleReportPath})` — the one real address this broker ever unlinks, since the gateway's `unlinkProxy` has no catch-all method
- `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.ts` — same swap
- `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.proxy.ts` — same swap, same `succeeds({path: handleReportPath})` fix
- `packages/ward/src/adapters/fs/unlink/fs-unlink-adapter.ts` (+ `.proxy.ts`, `.test.ts`) — deleted; the 3 check-run brokers were its last callers
- `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` — `fsReadFileAdapter` → `readFile`, added to the file's existing `#gateway/node/fs__promises` import (`ensureDir, rename, rm`)
- `packages/ward/src/brokers/bundle/build/bundle-build-broker.proxy.ts` — compose `readFileProxy` in place of `fsReadFileAdapterProxy`
- `packages/ward/src/brokers/bundle/build/collect-inputs-layer-broker.ts` — same swap
- `packages/ward/src/brokers/bundle/build/collect-inputs-layer-broker.proxy.ts` — same swap
- `packages/ward/src/brokers/bundle/build/resolve-workspace-root-layer-broker.ts` — same swap
- `packages/ward/src/brokers/bundle/build/resolve-workspace-root-layer-broker.proxy.ts` — same swap; `hasNoManifest`'s `readProxy.throws({filePath, error: new Error('ENOENT...')})` becomes `readProxy.missing({path})` (the gateway proxy's own ENOENT-shaped stage)
- `packages/ward/src/brokers/command/run/folder-resolve-layer-broker.ts` — same swap
- `packages/ward/src/brokers/command/run/folder-resolve-layer-broker.proxy.ts` — same swap; `setupThrows` internals move to `.missing()`
- `packages/ward/src/brokers/duplicate-install/check/gateway-dependency-names-read-layer-broker.ts` — same swap
- `packages/ward/src/brokers/duplicate-install/check/gateway-dependency-names-read-layer-broker.proxy.ts` — same swap
- `packages/ward/src/brokers/platform-crossing/check/platform-crossing-check-broker.ts` — `fsReadFileAdapter` → `readFile`, re-branded through `fileContentsContract.parse` (the composed `walkGatewayCrossingsLayerBroker` still takes branded `FileContents`); also fixes F53's `.filter((name): name is GatewayPackageName => …)` type-predicate at line 98 to a plain `name !== undefined` filter
- `packages/ward/src/brokers/platform-crossing/check/platform-crossing-check-broker.proxy.ts` — compose `readFileProxy` in place of `fsReadFileAdapterProxy` (inert; never staged, matching the old adapter proxy's own inert composition)
- `packages/ward/src/brokers/workspace/discover/workspace-discover-broker.ts` — same swap
- `packages/ward/src/brokers/workspace/discover/workspace-discover-broker.proxy.ts` — same swap; `setupNoPackageJson` internals move to `.missing()`
- `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.ts` — same swap
- `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.proxy.ts` — same swap; `setupThrows` internals move to `.missing()`
- `packages/ward/src/brokers/storage/load/storage-load-broker.ts` — same swap (2 call sites)
- `packages/ward/src/brokers/storage/load/storage-load-broker.proxy.ts` — same swap; `setupReadFail` drops its now-unused `error` param (matches G-BB-1b's precedent for `setupReaddirFail`), using `.missing()` internally
- `packages/ward/src/brokers/storage/load/storage-load-broker.test.ts` — `setupReadFail` call site drops the `error` argument
- `packages/ward/src/brokers/command/detail/command-detail-broker.proxy.ts` — composes `storageLoadBrokerProxy`; `setupReadFail` call site drops the `error` argument (typecheck caught this: `setupReadFail`'s signature changed)
- `packages/ward/src/brokers/command/list/command-list-broker.proxy.ts` — same drop
- `packages/ward/src/brokers/command/raw/command-raw-broker.proxy.ts` — same drop
- `packages/ward/src/brokers/command/run/multi-package-layer-broker.proxy.ts` — same drop
- `packages/ward/src/brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.ts` — `fsReadFileAdapter` → `readFile`, added to the file's existing `#gateway/node/fs__promises` import (`statIfExists`); F53's own filter fix already landed in G-BB-1c, confirmed still in place
- `packages/ward/src/brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.proxy.ts` — compose `readFileProxy` in place of `fsReadFileAdapterProxy`

Left standing (fs/read-file, 5 callers + the adapter itself — not deleted, still imported):

- `packages/ward/src/brokers/duplicate-install/check/installed-package-version-read-optional-layer-broker.ts` (+ `.proxy.ts`)
- `packages/ward/src/brokers/platform-crossing/check/read-first-existing-candidate-layer-broker.ts` (+ `.proxy.ts`)
- `packages/ward/src/brokers/platform-crossing/check/read-package-name-optional-layer-broker.ts` (+ `.proxy.ts`)
- `packages/ward/src/responders/install/write-gitignore/install-write-gitignore-responder.ts` (+ `.proxy.ts`)
- `packages/ward/src/responders/install/write-scripts/install-write-scripts-responder.ts` (+ `.proxy.ts`)
- `packages/ward/src/adapters/fs/read-file/fs-read-file-adapter.ts` (+ `.proxy.ts`, `.test.ts`) — undeleted; the 5 callers above still import it

### F55

Migrates `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts` off ward's `fsUnlinkAdapter` onto `unlink` from `#gateway/node/fs__promises`, after adding `getCallsFor({ path })` call read-back to `@gateway/node`'s `fs__promises/unlink/unlink.proxy.ts`.

Files to edit:
- `packages/@gateway/node/src/fs__promises/unlink/unlink.proxy.ts` — add `getCallsFor({ path: PathMatcher })` read-back returning each call's arguments, matching `rm.proxy.ts` and `rename.proxy.ts`
- `packages/@gateway/node/src/fs__promises/unlink/unlink.test.ts` — add test proving `getCallsFor` reads back two calls in order
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts` — import `unlink` from `#gateway/node/fs__promises` and replace `fsUnlinkAdapter` call
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.proxy.ts` — compose `unlinkProxy` from `#gateway/node/fs__promises/unlink/unlink.proxy`, stage candidate paths in `setupWithFiles`, and read back deleted paths via `unlinkProxy().getCallsFor`
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.test.ts` — verify test suite remains green and asserts real deleted paths

Adapter deletion check:
- `packages/ward/src/adapters/fs/unlink/fs-unlink-adapter.ts` (+ `.proxy.ts`, `.test.ts`) — checked with `discover`: 3 callers in other groups (`check-run/e2e`, `check-run/integration`, `check-run/unit`) still import `fsUnlinkAdapter`. Per rule ("delete ... if nothing else imports it"), the adapter is left standing until those callers migrate.

### G-BB-1e and G-BB-1d scope

Code check: `fs/unlink` and its check-run callers were already gone before this chunk; the five `fs/read-file` callers and `crypto/hash-files` remained.

Adapters deleted: `packages/ward/src/adapters/fs/read-file/*` (3 files), `packages/ward/src/adapters/crypto/hash-files/*` (3 files).

Callers edited (each with its `.proxy.ts`), all under `packages/ward/src`:
- `brokers/platform-crossing/check/read-first-existing-candidate-layer-broker`
- `brokers/platform-crossing/check/read-package-name-optional-layer-broker`
- `brokers/duplicate-install/check/installed-package-version-read-optional-layer-broker`
- `responders/install/write-gitignore/install-write-gitignore-responder`
- `responders/install/write-scripts/install-write-scripts-responder`
- `brokers/bundle/build/bundle-build-broker` (`.ts`, `.proxy.ts`): hash call moves to the new broker

New: `brokers/bundle/hash-files/bundle-hash-files-broker` (`.ts`, `.proxy.ts`, `.test.ts`), composing `readFileBytesSyncProxy`.

Proxies composing the callers (tests unchanged, verified by the whole ward unit run): the two platform-crossing layer proxies feed `platform-crossing-check-broker.proxy`; the duplicate-install layer proxy feeds `duplicate-install-check-broker.proxy`; the install responder proxies feed `install-flow`/startup tests; `bundle-build-broker.proxy` feeds `check-run-e2e-broker.proxy`.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->


