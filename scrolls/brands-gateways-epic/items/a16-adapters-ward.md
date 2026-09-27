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

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
