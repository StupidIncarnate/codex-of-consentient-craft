# A04: Adapters: `cli`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` cli rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | cli |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (batches below) |
| Runs alone | no other agent editing `cli` at the same time |

## Current state

Census of `packages/cli/src/adapters/**` run 2026-09-26 (`python3` os.walk, excluding `.test.ts`/`.proxy.ts`/`.stub.ts`):
14 files. **Two are already gone before this item starts** — [A01](a01-dead-adapters.md) deletes
`crypto/random-uuid/crypto-random-uuid-adapter.ts` and `fs/realpath/fs-realpath-adapter.ts` as dead code (zero real
callers, confirmed by a fresh caller census, not `coverage.md`'s stale claim). Do not look for them; if they still
exist when you start, A01 has not landed yet — report LEFT STANDING and wait.

That leaves 12 adapters, grouped into suggested batches:

| Batch | Path | Replacement |
|---|---|---|
| 1 | `adapters/fs/append-file/fs-append-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `appendFile` |
| 1 | `adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `ensureDir` |
| 1 | `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| 1 | `adapters/fs/readdir/fs-readdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readdirIfExists` |
| 2 | `adapters/fs/rename/fs-rename-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rename` |
| 2 | `adapters/fs/stat/fs-stat-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `statIfExists` |
| 2 | `adapters/fs/write-file/fs-write-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFile` |
| 2 | `adapters/process/stdin-read/process-stdin-read-adapter.ts` | gateway → `@dungeonmaster/node/process` `readStdinToEnd` |
| 3 | `adapters/readline/question/readline-question-adapter.ts` | gateway → `@dungeonmaster/node/readline` `question` |
| 3 | `adapters/child-process/exec/child-process-exec-adapter.ts` | gateway → `@dungeonmaster/node/child_process` `runFireAndForget` |
| 3 | `adapters/typescript/content-diagnostics/typescript-content-diagnostics-adapter.ts` | split → `@dungeonmaster/npm/typescript` (`ts.*`); the virtual-file host overrides and the `ErrorMessage` contract mapping stay a `cli` broker |
| 4 | `adapters/typescript/tsconfig-compiler-options-locate/typescript-tsconfig-compiler-options-locate-adapter.ts` | not in `coverage.md` — see below |

**Batch 4's file is not named in any source doc.** Read 2026-09-26: it imports raw `typescript` (`import * as ts
from 'typescript'`) and uses `ts.parseJsonText`, `ts.isObjectLiteralExpression` and similar AST calls to locate
where a tsconfig's `compilerOptions` block starts and ends in the file's TEXT, so a caller can splice in a new
option without reformatting. The whole function is pure — text in, a result object out, no I/O, no our-data
lookups. **Recommended — the executing agent may change this with a reason in DECISIONS:** this is not a
"split" the way `typescript-content-diagnostics-adapter.ts` is (that one keeps our own `ErrorMessage` contract
mapping as an adapter-turned-broker because it composes several `ts.Program` calls with our own contract). Here
there is no adapter-shaped remainder at all — move the whole function into a `transformers/` file in `cli` (it is
a pure data transform, A→B), replacing the raw `import * as ts from 'typescript'` with
`import * as ts from '#gateway/npm/typescript'` (`typescript` is a plain pass-through in the npm gateway, used the
same way by `tooling`'s and `ward`'s own typescript adapters). Reason: clean architecture puts a pure
text-to-position transform in `transformers/`, not in a file named after an adapter it no longer has any adapter
shape left to justify.

## Work

1. For each row in the batches above: switch every caller of the adapter to the gateway export named, importing it
   from the `#gateway/<kind>/<subpath>` path the export lives at. A wrapper's proxy or stub is imported from its own
   file, never a barrel — `#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy`.
2. For the one `split` row (`typescript-content-diagnostics-adapter.ts`): move the raw `ts.*` calls into
   `#gateway/npm/typescript` usage directly (it is a pass-through, so this is just changing the import source);
   keep the virtual-file host overrides and the `ErrorMessage` contract mapping as a broker in `cli`, named for
   what it does (diagnosing a virtual file's compiler errors), not "adapter".
3. For the batch-4 file: follow the recommended decision above (move to `transformers/`), or record a different
   decision with its reason.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly
   (`#gateway/node/<subpath>/<wrapper>/<wrapper>.proxy`, or `#gateway/npm/typescript/typescript.proxy` for the
   pass-through), per T1/T3. A failure scenario that used to live on the adapter's own proxy moves to whichever
   proxy now owns the handling that produces it (T3, "Failure cases move with the handling").
5. New code follows R1 — return what the gateway call told you; `{ success: true }` counts as `void`, so do not
   write a new `adapterResultContract`-shaped return for any of these.
6. Delete each adapter, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty wrapper folder. Never
   leave an adapter standing because its code "does something" — split it and delete it.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught (agent-brief.md).

## Done when

- None of the 12 adapter files (or the 2 A01 already removed) remain under `packages/cli/src/adapters/`.
- `packages/cli/src/adapters/` itself is empty or gone (confirm no other cli adapter item is still in flight
  before deleting the folder — this item's own 12 plus A01's 2 is the package's whole census).
- Every former caller's proxy composes the gateway wrapper's own `.proxy` file directly, imported per file, never
  through a barrel.
- `npm run ward -- --only lint,typecheck,unit -- <every path you touched>` exits 0.

## Traps

- `typescript-content-diagnostics-adapter.ts`'s virtual-file host is the trickiest file in this package — read it
  in full before touching it; the "split" here is not a clean outside-call/our-logic line the way an `fs` wrapper
  is.
- Confirm A01 has actually landed (its two cli deletions) before you start; if the files are still there, this
  item's own scope silently grows by two files that belong to a different item.

## Plan — G-E (batches 1-2: fs append-file/mkdir/read-file/readdir/rename/stat/write-file, process/stdin-read)

Delete (24 files, the 8 adapters this group owns, each with its `.proxy.ts` and `.test.ts`):
- `packages/cli/src/adapters/fs/append-file/fs-append-file-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/fs/read-file/fs-read-file-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/fs/readdir/fs-readdir-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/fs/rename/fs-rename-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/fs/stat/fs-stat-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/fs/write-file/fs-write-file-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/process/stdin-read/process-stdin-read-adapter.ts` (+`.proxy.ts`, `.test.ts`)

Edit (every real caller found by `discover`, scoped to `packages/cli/**`):
- `packages/cli/src/brokers/rate-limits/history-append/rate-limits-history-append-broker.ts` (+`.proxy.ts`) — append-file, mkdir
- `packages/cli/src/brokers/package/scaffold-write/package-scaffold-write-broker.ts` (+`.proxy.ts`) — mkdir, write-file
- `packages/cli/src/brokers/rate-limits/snapshot-write/rate-limits-snapshot-write-broker.ts` (+`.proxy.ts`, `.test.ts`) — mkdir, rename, stat, write-file
- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts` (+`.proxy.ts`, never `.test.ts` — G24) — read-file
- `packages/cli/src/brokers/gateway/tsconfig-compiler-options-write/gateway-tsconfig-compiler-options-write-broker.ts` (+`.proxy.ts`) — read-file, write-file
- `packages/cli/src/responders/install/add-dev-deps/install-add-dev-deps-responder.ts` (+`.proxy.ts`) — read-file, write-file
- `packages/cli/src/responders/install/create-jest/install-create-jest-responder.ts` (+`.proxy.ts`) — read-file, write-file
- `packages/cli/src/responders/install/setup-gateway/install-setup-gateway-responder.ts` (+`.proxy.ts`) — read-file, write-file
- `packages/cli/src/brokers/package/register/package-register-broker.ts` (+`.proxy.ts`) — read-file, write-file
- `packages/cli/src/brokers/gateway/existing-packages-list/gateway-existing-packages-list-broker.ts` (+`.proxy.ts`) — readdir
- `packages/cli/src/brokers/package/discover/package-discover-broker.ts` (+`.proxy.ts`) — readdir
- `packages/cli/src/responders/install/create-playwright/install-create-playwright-responder.ts` (+`.proxy.ts`) — write-file
- `packages/cli/src/responders/install/create-tsconfig/install-create-tsconfig-responder.ts` (+`.proxy.ts`) — write-file
- `packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.ts` (+`.proxy.ts`) — stdin-read

Not edited (G24's uncommitted files — reported as LEFT STANDING if a caller lands there; none did):
`gateway-package-template-statics.ts`, `package-scaffold-config-statics.ts`(+`.test.ts`), `gateway-package-scaffold-files-transformer.test.ts`, `gateway-source-copy-statics.ts`(+`.test.ts`), `gateway-source-copy-broker.test.ts`, `package-seed-frontend-statics.ts`(+`.test.ts`), `package-scaffold-files-transformer.test.ts`, `cli-create-package-responder.test.ts`, `install-flow.integration.test.ts`.

## Plan — G-F (batches 3-4: readline/question, child-process/exec, typescript/content-diagnostics, typescript/tsconfig-compiler-options-locate)

Delete (12 files, the 4 adapters this group owns, each with its `.proxy.ts` and `.test.ts`):
- `packages/cli/src/adapters/readline/question/readline-question-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/child-process/exec/child-process-exec-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/typescript/content-diagnostics/typescript-content-diagnostics-adapter.ts` (+`.proxy.ts`, `.test.ts`)
- `packages/cli/src/adapters/typescript/tsconfig-compiler-options-locate/typescript-tsconfig-compiler-options-locate-adapter.ts` (+`.proxy.ts`, `.test.ts`)

Create (5 files — the split/move targets):
- `packages/cli/src/brokers/typescript/content-diagnostics/typescript-content-diagnostics-broker.ts` — the content-diagnostics adapter's virtual-file host and `ErrorMessage` mapping, unchanged shape, importing `#gateway/npm/typescript` and `#gateway/node/path` instead of raw `typescript`/`path`
- `packages/cli/src/brokers/typescript/content-diagnostics/typescript-content-diagnostics-broker.proxy.ts` — empty proxy (real `ts.Program`, same reasoning as the adapter's old empty proxy)
- `packages/cli/src/brokers/typescript/content-diagnostics/typescript-content-diagnostics-broker.test.ts` — ported from the adapter's test, same cases
- `packages/cli/src/transformers/tsconfig-compiler-options-locate/tsconfig-compiler-options-locate-transformer.ts` — the tsconfig-compiler-options-locate adapter's function, unchanged shape, importing `#gateway/npm/typescript`; no `.proxy.ts` (pure transformer, sibling `tsconfig-compiler-options-set-text-transformer` has none either)
- `packages/cli/src/transformers/tsconfig-compiler-options-locate/tsconfig-compiler-options-locate-transformer.test.ts` — ported from the adapter's test, same cases

Edit (every real caller found by `discover`, scoped to `packages/cli/**`):
- `packages/cli/src/brokers/create-package/resolve-request/create-package-resolve-request-broker.ts` (+`.proxy.ts`) — readline/question → `#gateway/node/readline`'s `question`, called 3× with explicit `input: process.stdin, output: process.stdout`
- `packages/cli/src/responders/cli/serve/cli-serve-responder.ts` (+`.proxy.ts`, `.test.ts`) — child-process/exec → `#gateway/node/child_process`'s `runFireAndForget`
- `packages/cli/src/brokers/gateway/tsconfig-compiler-options-write/gateway-tsconfig-compiler-options-write-broker.ts` (+`.proxy.ts`) — typescript/tsconfig-compiler-options-locate adapter call → `tsconfigCompilerOptionsLocateTransformer`; proxy drops the phantom adapter-proxy composition (transformers take no child-proxy call)
- `packages/cli/test/harnesses/scaffolded-template-typecheck/scaffolded-template-typecheck.harness.ts` — import + call site → `typescriptContentDiagnosticsBroker`
- `packages/cli/src/contracts/tsconfig-compiler-options-locate-result/tsconfig-compiler-options-locate-result-contract.ts` — PURPOSE header renames the adapter it describes
- `packages/cli/src/transformers/tsconfig-compiler-options-set-text/tsconfig-compiler-options-set-text-transformer.ts` — PURPOSE header renames the adapter it credits

Not edited (G24's uncommitted files — none of this group's callers land there):
`gateway-package-template-statics.ts`, `package-scaffold-config-statics.ts`(+`.test.ts`), `gateway-package-scaffold-files-transformer.test.ts`, `gateway-source-copy-statics.ts`(+`.test.ts`), `gateway-source-copy-broker.test.ts`, `package-seed-frontend-statics.ts`(+`.test.ts`), `package-scaffold-files-transformer.test.ts`, `cli-create-package-responder.test.ts`, `install-flow.integration.test.ts`.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
