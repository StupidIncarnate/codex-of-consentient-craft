# A08: Adapters: `hydration` and `hydration-recipes`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" table row 3 (line 334); `scrolls/gateway-build/coverage.md` and `stays-as-adapter.md` hydration/hydration-recipes rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | hydration, hydration-recipes |
| Checks to run | lint, typecheck, unit, integration |
| Split | operator splits, 2 to 4 files per agent (batches below); the error-shape batch runs by itself |
| Runs alone | no other agent editing `hydration` or `hydration-recipes` at the same time. `hydration-recipes` depends on `hydration` (confirmed: `hydration`'s only dependencies are `@dungeonmaster/shared` and `zod`; `hydration-recipes` depends on `@dungeonmaster/hydration`, `@dungeonmaster/orchestrator` and `@dungeonmaster/shared`) — never the reverse, so the shared error-shape work in batch C moves code INTO `hydration`, never the other way |

## Current state

Census run 2026-09-26. None of these 12 files are in A01's dead list.

**`hydration` (3 files):**

| Path | Replacement |
|---|---|
| `adapters/fetch/post/fetch-post-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchWithStatus` — fills the gap: never throws on 4xx/5xx, returns `{status, ok, body}`, walks `.cause` to the deepest error the same way the current adapter does |
| `adapters/fs/ensure-write/fs-ensure-write-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFileCreatingParent` |
| `adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter.ts` | split → `@dungeonmaster/npm/typescript` (`ts.*`); repo-root resolution + `TypeDiagnostic` contract mapping stay a broker |

`packages/hydration/CLAUDE.md` says its `exports` map deliberately has no `./adapters` subpath and that
`fetchPostAdapter`/`fsEnsureWriteAdapter` are "route helpers the runner calls internally" — so their callers are
all inside `hydration` itself; check `brokers.ts`/`transformers.ts` for who calls them before assuming a caller
lives elsewhere. The typescript adapter is TEST-ONLY infrastructure (its own package doc: "a test-only adapter
that grades the negative type-fixture suite with a real `ts.createProgram`" and is excluded from
`tsconfig.build.json`'s emit) — treat its "split" as moving the outside call to
`#gateway/npm/typescript` while its repo-root-resolution and contract-mapping half stays wherever the test
fixtures need it (likely `test/` infrastructure, not a production broker — read `packages/hydration/CLAUDE.md`'s
own tsconfig table before deciding, and do not accidentally pull `typescript` into `dist` — it must stay excluded
from `tsconfig.build.json`).

**`hydration-recipes` (9 files):**

| Batch | Path | Replacement |
|---|---|---|
| A | `adapters/fs/append-file/fs-append-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `appendFile` |
| A | `adapters/fs/rename/fs-rename-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rename` |
| A | `adapters/fs/rm/fs-rm-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rm` |
| A | `adapters/fs/write-file/fs-write-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFile` |
| B | `adapters/fs/write-text/fs-write-text-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFileCreatingParent` |
| B | `adapters/dm-jsonl/append/dm-jsonl-append-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `appendLinesCreatingParent` |
| B | `adapters/fetch/json/fetch-json-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchJson` — throws on non-2xx naming method/url/status/body, matches `fetchJson`'s own shape |
| C | `adapters/dm-http/request/dm-http-request-adapter.ts` | split → `@dungeonmaster/node/fetch` `fetchWithStatus`; the `target.request` branch (calling a route directly, in-process) stays our logic; the fetch-fallback branch now has a home in `fetchWithStatus`'s `{status, ok, body}` shape |
| C | `adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.ts` | stays-as-adapter → a broker/transformer in `hydration-recipes`, but see below — its error SHAPE moves to `hydration` |

**Batch C is the tricky one.** Confirmed 2026-09-26 by reading both files in full:

- `dm-http-response-unwrap-adapter.ts` (`hydration-recipes`) does no library call — it is a guard plus a plain
  `Object.assign(new Error(...), { url, status, body: JSON.stringify(response.body) })` thrown on a non-2xx status.
- `route-failure-transformer.ts` (`hydration`) reads that exact shape back with duck typing:
  `'url' in cause && typeof cause.url === 'string'`, then `status`, then `body`.

They already agree by convention, not by a shared type — GW's own words are "one owner for that error shape, used
by both packages". Since `hydration-recipes` already depends on `hydration` and never the reverse, `hydration` is
the one legal owner. **Recommended — the executing agent may change this with a reason in DECISIONS:** add an
exported error-building function (or a small class, following `errors/` conventions and `packages/CLAUDE.md`) in
`hydration`'s own `errors.ts`/`transformers.ts` export surface — something like
`httpEnvelopeFailureBuildTransformer({ url, status, body })` returning the same `Error`-with-fields shape — and
have `dm-http-response-unwrap-adapter.ts` in `hydration-recipes` call it instead of building the `Object.assign`
inline. Update `route-failure-transformer.ts` to check the real shape that function now produces (an `instanceof`
check, or the same duck-typed read against a shape the new builder is now the single source of) instead of loose
duck typing on both ends. This does not change either function's OBSERVABLE behaviour — it only gives the shape
one place it is defined.

## Work

1. For every `gateway` row: switch every caller to the named export, imported from its `#gateway/<kind>/<subpath>`
   path.
2. For `dm-http-request-adapter.ts`: move the fetch-fallback branch onto `#gateway/node/fetch`'s `fetchWithStatus`;
   keep the `target.request` in-process branch as a broker in `hydration-recipes`.
3. For the error-shape pair (batch C's second row): follow the recommended decision above, or record a different
   one. This is the only piece of this item that adds an export to `hydration`'s public surface — keep the change
   small and confirm `hydration`'s existing `HydrationTransactionRolledBackError`-style error conventions (read
   `hydration/CLAUDE.md`'s own error section) before choosing a class vs. a plain builder function.
4. For `typescript-program-diagnostics-adapter.ts` in `hydration`: move the outside call onto
   `#gateway/npm/typescript`, keep the repo-root-resolution and `TypeDiagnostic` mapping as test infrastructure (it
   is already excluded from `tsconfig.build.json`'s emit — keep it excluded).
5. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (`#gateway/node/fetch/fetch-with-status/fetch-with-status.proxy`), never through a barrel, per T1/T3.
   Failure cases move with the handling (T3) — a scenario the old adapter's proxy staged for a 4xx/5xx now belongs
   on `fetchWithStatus`'s own proxy, since `fetchWithStatus` is what now decides never to throw on one.
6. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
7. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
8. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 3 `hydration` adapters or 9 `hydration-recipes` adapters remain; both `adapters/` folders are gone.
- `hydration`'s public surface exports the error-shape builder (or whatever DECISIONS records instead), and
  `route-failure-transformer.ts` reads the shape that builder now owns.
- `npm run ward -- --only lint,typecheck,unit,integration -- packages/hydration packages/hydration-recipes` exits 0.

## Traps

- `hydration/CLAUDE.md` explicitly says its `exports` map has NO `./adapters` subpath "and that is deliberate" —
  do not add one while doing this migration; route the error-shape builder through `hydration`'s existing
  `errors.ts`/`transformers.ts` subpaths instead.
- `hydration-recipes-not-shipped.integration.test.ts` pins that `hydration-recipes` is NOT in the root
  `package.json` `dependencies` and is `"private": true` — do not touch that.
- `siegelense-recipes-layer-flow.integration.test.ts` and a few others read `hydration-recipes`'s BUILT `dist`
  output (per its own CLAUDE.md, "Build before a listing is honest") — a source-only change here is invisible to
  those tests until a build runs. Report BUILD NEEDED for `@dungeonmaster/hydration-recipes` if your ward run needs
  to prove that path; do not build it yourself.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan

### Group G-M (hydration own adapters)

Scope: `packages/hydration` only.

#### Files to delete:
- `packages/hydration/src/adapters/fetch/post/fetch-post-adapter.ts`
- `packages/hydration/src/adapters/fetch/post/fetch-post-adapter.proxy.ts`
- `packages/hydration/src/adapters/fetch/post/fetch-post-adapter.test.ts`
- `packages/hydration/src/adapters/fetch/post/fetch-post-adapter.integration.test.ts`
- `packages/hydration/src/adapters/fs/ensure-write/fs-ensure-write-adapter.ts`
- `packages/hydration/src/adapters/fs/ensure-write/fs-ensure-write-adapter.proxy.ts`
- `packages/hydration/src/adapters/fs/ensure-write/fs-ensure-write-adapter.test.ts`
- `packages/hydration/src/adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter.ts`
- `packages/hydration/src/adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter.proxy.ts`
- `packages/hydration/src/adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter.test.ts`

#### Files to create:
- `packages/hydration/test/type-fixtures/typescript-program-diagnostics.ts` (test-only helper placed in `test/type-fixtures/` because `.harness.ts` cannot be imported by unit tests per architecture rules; call-site fixture assertions consolidated into `registry-create-broker.test.ts`)


#### Files to edit:
- `packages/hydration/src/brokers/plan/run/op-filter-apply-layer-broker.integration.test.ts`
- `packages/hydration/src/brokers/plan/run/plan-run-broker.integration.test.ts`
- `packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker.test.ts`
- `packages/hydration/src/brokers/registry/create/registry-create-broker.test.ts`
- `packages/hydration/test/harnesses/api-target/api-target.harness.ts`
- `packages/hydration/tsconfig.build.json`
- `packages/hydration/CLAUDE.md`
- `packages/hydration/package.json` (add `@dungeonmaster/node` and `@dungeonmaster/npm` to devDependencies per `gateway-dependency-declared` lint rule)

