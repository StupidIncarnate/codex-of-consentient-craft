# A15: Adapters: `tooling`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` tooling rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | tooling |
| Checks to run | lint, typecheck, unit |
| Split | one agent (only 3 files) |
| Runs alone | no other agent editing `tooling` at the same time |

## Current state

Census of `packages/tooling/src/adapters/**` run 2026-09-26: 3 files, none dead, all fated in `coverage.md`:

| Path | Replacement |
|---|---|
| `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| `adapters/glob/find/glob-find-adapter.ts` | gateway → `@dungeonmaster/npm/glob` `glob` — this copy hard-codes a 4-pattern ignore list, exactly the silent-divergence problem the gateway's single wrapper exists to close; confirm the gateway's real ignore-list default before assuming behaviour is unchanged |
| `adapters/typescript/parse/typescript-parse-adapter.ts` | split → `@dungeonmaster/npm/typescript` (`ts.*`); the AST walk plus the `LiteralOccurrence`/`LiteralValue` contract mapping stay a broker in `tooling` |

## Work

1. Switch every caller of `fs-read-file-adapter.ts` and `glob-find-adapter.ts` to the named gateway export.
2. For `glob-find-adapter.ts`: read the gateway's `glob` wrapper's real ignore-list default and compare it against
   this package's hard-coded 4 patterns before deleting the adapter — if the gateway's default differs, the
   caller's real search results change, and that is worth a DECISIONS note even if it is the right outcome.
3. For `typescript-parse-adapter.ts`: move the raw `ts.*` calls onto `#gateway/npm/typescript`; keep the AST walk
   and the `LiteralOccurrence`/`LiteralValue` contract mapping as a broker in `tooling`.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/node/fs__promises/read-file/read-file.proxy`), never through a barrel, per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete all 3 adapters, their `.proxy.ts`, `.test.ts` and any `.stub.ts`, and their now-empty wrapper folders.
   `packages/tooling/src/adapters/` should then be gone.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 3 adapter files remain, and `packages/tooling/src/adapters/` is gone.
- `npm run ward -- --only lint,typecheck,unit -- packages/tooling` exits 0.

## Traps

- The glob ignore-list drift is one of three copies `scrolls/adapters-to-one-place.md` names as an example of
  copies drifting apart (`server`, `tooling`, `mcp` each behave differently). Confirm which behaviour the gateway
  wrapper actually kept before assuming `tooling`'s callers see no change.

## Plan (G-H, 2026-09-27)

Current tree check (not the 2026-09-26 census): `packages/tooling/src/adapters/` holds only
`typescript/parse/typescript-parse-adapter.{ts,proxy.ts,test.ts}`. `fs/read-file` and `glob/find` are
already gone — commit `7751fb471` ("A01 (part 1): delete adapters that have no callers") deleted both as
dead code with zero callers anywhere in the repo; `duplicate-detection-detect-broker.ts` already calls
`glob` from `#gateway/npm/glob` directly with `globIgnoreStatics.defaults` (the same four patterns
`glob-find-adapter.ts` hard-coded, per that static's own PURPOSE comment) and `readFile` from
`#gateway/node/fs__promises` directly. So this group's only remaining work is the `typescript/parse`
split. Only caller of `typescriptParseAdapter`/`typescriptParseAdapterProxy` anywhere in the repo:
`duplicate-detection-detect-broker.ts` and its `.proxy.ts` (confirmed by a repo-wide `discover` grep).

Files:

- **Create** `packages/tooling/src/brokers/typescript/parse/typescript-parse-broker.ts` — the AST walk and
  `LiteralOccurrence`/`LiteralValue` contract mapping, moved from the adapter, importing `ts` from
  `#gateway/npm/typescript` (a pure pass-through with no `.proxy.ts` of its own) instead of raw `typescript`.
- **Create** `packages/tooling/src/brokers/typescript/parse/typescript-parse-broker.proxy.ts` — empty
  proxy; nothing to mock, same as the adapter's own proxy today.
- **Create** `packages/tooling/src/brokers/typescript/parse/typescript-parse-broker.test.ts` — the
  adapter's existing test suite, renamed onto the broker.
- **Edit** `packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.ts`
  — import `typescriptParseBroker` from `../../typescript/parse/typescript-parse-broker` in place of the
  adapter import.
- **Edit**
  `packages/tooling/src/brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy.ts` —
  compose `typescriptParseBrokerProxy` from `../../typescript/parse/typescript-parse-broker.proxy` in
  place of the adapter proxy.
- **Delete** `packages/tooling/src/adapters/typescript/parse/typescript-parse-adapter.ts`
- **Delete** `packages/tooling/src/adapters/typescript/parse/typescript-parse-adapter.proxy.ts`
- **Delete** `packages/tooling/src/adapters/typescript/parse/typescript-parse-adapter.test.ts`

`packages/tooling/src/adapters/` holds no other files after these three deletions, so the folder is empty.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
