# B06: a contract field that holds a gateway type reuses the gateway's schema, branded `#Gateway<Type>`

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/brands-types-tests-rules.md` (BR), C9 "a contract field that holds a gateway type reuses the gateway's schema, branded `#Gateway<Type>`", lines 1529-1589; `StubArgument` row, line 2213 (with its type-level test); rule `enforce-gateway-schema-fields`, line 2268; docs rows, lines 2362 and 2388 |
| Needs | [G20](../g20-gateway-schemas-gateway-brand.md), [B01](b01-zod-v4.md) |
| Unblocks | Z01–Z07 |
| Packages touched | Every contract file with a field holding an outside package's type today — census this at the start; known candidates from the source doc's own examples: work-item-like contracts holding a `ChildProcess`, scan-result-like contracts holding gateway `fs` results (e.g. walked files). `packages/shared` is the most likely home for the widest-used ones. |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent per contract family found in the census, 2-4 files each |
| Runs alone | No |

## Why

Some of our objects hold a value of an outside package's type: a work item holding a `ChildProcess`, a
scan result holding the `WalkedFile`s that `#gateway/node/fs` returned. Today this is written as a bare
`z.custom<ChildProcess>()`, which infers the TypeScript type `ChildProcess` and makes the field required
in the type — but checks nothing at runtime. It accepts a missing field and any junk, in both zod v3 and
v4 (checked 2026-09-26 against zod 3.25.76 and its `zod/v4` build, `tmp/zod-lib-field/`). `z.instanceof`
is a real check but is a *second* check for a type the gateway already owns and already checks once.

The fix: the gateway exports one schema per outside type it owns, beside the type itself, branded
`'#Gateway<Type>'` — `childProcessSchema` beside `child_process.ts`, `walkedFileSchema` beside the `fs`
subpath's walk-files code. Our contract reuses that schema exactly the way B4 reuses another owner's
field — it is not a new brand, it is the gateway's one check, shared by every contract that holds that
type:

```ts
// before — a bare custom schema: the type says ChildProcess, the runtime checks nothing
proc: z.custom<ChildProcess>(),

// after — the gateway exports the schema (child_process/child-process/child-process-schema.ts, fs/walk-files-sync/walked-file-schema.ts)
export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();
export const walkedFileSchema = z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWalkedFile'>();

// our contract reuses it
import {childProcessSchema} from '#gateway/node/child_process';
import {walkedFileSchema} from '#gateway/node/fs';

export const scanContract = z
  .object({
    id: z.string().brand<'ScanId'>(),
    proc: childProcessSchema,              // ChildProcess & brand '#GatewayChildProcess'
    files: z.array(walkedFileSchema),      // WalkedFile & brand '#GatewayWalkedFile'
  })
  .brand<'Scan'>();
```

The `#Gateway` prefix is deliberate and shared on purpose: every contract holding a `WalkedFile` carries
`'#GatewayWalkedFile'`, whatever key it sits under, so one brand text always means the gateway's one
check. No text B3 derives (the normal owner-plus-key brand naming) starts with `#`, so the two brand
families never collide.

## Current state

Confirmed this session (2026-09-26): no `*-schema.ts` file exists anywhere under `packages/@gateway/`
today (a walk of the whole `packages/@gateway` tree for any filename containing `schema` found only
`zod-to-json-schema.ts` and its test — an unrelated npm-package wrapper, not a `#Gateway<Type>` schema).
**This confirms G20 has not landed yet.** This item cannot start until it has; do not attempt to write
the gateway's own schema files as part of this item — that is G20's job. This item's job is entirely on
the contract side: find every contract field that should reuse one of G20's schemas, and make it do so.

The specific contracts named in the source doc's own examples (a work item holding a `ChildProcess`, a
scan result holding `WalkedFile`s) were **not located this session** — they may be illustrative rather
than literal file names from this repo. Census the real contract fields holding outside-package types
before starting; do not assume the doc's `scanContract`/`proc`/`files` example names a real file.

`mcpServerClientContract`'s `process: z.unknown()` field (named in BR "Found along the way" and in
`b02-contract-index-and-unused-contracts.md`'s Current state) looked like a C9 candidate at first glance,
but it is not: that contract has no production importer at all and is simply deleted (by `b02` or `b05`,
whichever runs first) rather than migrated to a gateway schema.

## Work

1. **Wait for G20.** Confirm `#Gateway<Type>` schemas exist in the gateway (e.g.
   `childProcessSchema`, `walkedFileSchema`, or whatever set G20 actually ships) before starting. If
   dispatched early, report it as blocked.
2. **Census every contract field that holds an outside package's type today.** Look for `z.custom<T>()`
   and `z.instanceof(...)` inside any `*-contract.ts` file in every workspace package, where `T` or the
   instance's class comes from an npm package or Node built-in rather than from our own `contracts/`.
   `z.unknown()` fields that comment-describe an outside type (like the dead `mcpServerClientContract`
   example, and possibly others that are alive) are also candidates — but confirm each is actually parsed
   in production (per C1) before spending time branding a dead field; a dead one is `b02`'s or `b05`'s job
   to delete, not this item's job to migrate.
3. **For each live field, replace the bare `z.custom`/`z.instanceof` with the gateway's schema import**:
   ```
   // flagged — in contracts/
   proc: z.custom<ChildProcess>(),                         // checks nothing at runtime, in zod v3 and v4 alike
   proc: z.instanceof(ChildProcess),                       // a second check for a type the gateway owns
   walked: z.custom<WalkedFile>(isWalkedFile).brand<'#GatewayWalkedFile'>(),   // a copy of the gateway's schema

   // left alone
   proc: childProcessSchema,
   files: z.array(walkedFileSchema).default([]),
   ```
   A class and plain data take the same shape at the call site (import the gateway's schema and reuse
   it); the difference between `z.instanceof` (classes, like `ChildProcess`, Playwright's `Page`) and
   `z.custom` with a check (plain data, like `WalkedFile`) is the gateway's business, not this contract's
   — this item never writes a `z.custom`/`z.instanceof` itself, it only imports.
4. **Confirm the parse keeps the value itself, not a copy.** `parsed.proc === proc` must be `true` after
   the parse — methods and getters must survive, such as `stats.mtime` and `proc.kill()`. Write or run a
   test that asserts this identity for at least one migrated field per contract family, since a `.extend()`
   elsewhere in the same file could otherwise silently break it (checked against zod 3.25.76's v4 build,
   `tmp/zod-lib-field/`, as "the parse keeps the value itself").
5. **A plain value now needs a parse to get in.** Spreading a raw `WalkedFile` straight from a gateway
   call into a `Scan`-shaped object without a parse fails to compile once the field is branded. Callers
   that build these objects need `scanContract.parse({ …, files })`, or `walkedFileSchema.parse(file)` for
   one value — fix every caller the type-check surfaces, do not suppress the error.
6. **Update `StubArgument`** (`packages/shared/src/@types/stub-argument.type.ts`) so it leaves any field
   whose brand starts with `#Gateway` exactly as it is — no recursion into its members, no brand
   stripping. Today it recurses into every object field, making each member optional, which is why a
   class such as `ChildProcess` currently accepts `{ pid: 5 }` in a stub call; that has to stop for
   `#Gateway`-branded fields specifically, while every other field keeps today's behavior.
   ```typescript
   // after: a stub call for a contract holding a #Gateway-branded field must pass the gateway's own stub
   ScanStub({ proc: ChildProcessStub() })   // compiles
   ScanStub({ proc: { pid: 5 } })           // fails to compile: not the gateway's stub
   ```
   Stripping the brand via `Omit` was tried and fails for classes — TypeScript's `Omit` rebuilds the
   type and breaks methods that return `this`, such as `addListener` (checked 2026-09-26). Do not retry
   that approach; leave the field untouched instead.
7. **Add a type-level test for the `StubArgument` change** — this is the "type-level test in
   `@dungeonmaster/shared`" the source doc calls for specifically (BR C9's "How a machine checks it"
   closing line: "`StubArgument`'s change is a type-level test in `@dungeonmaster/shared`"). Confirm the
   test actually fails when the change is reverted (the standing "prove your tests bite" rule from
   `agent-brief.md`).

## Lint rules this item adds or changes

**`enforce-gateway-schema-fields`** — syntax only, so it runs pre-edit.

| What it checks | Where | Message |
|---|---|---|
| No `z.custom` or `z.instanceof` anywhere in `contracts/` | Every `z.object(...)` call, at any depth | `{{key}} uses z.custom/z.instanceof directly. A field holding an outside package's type reuses the gateway's schema, imported from #gateway.` |
| A field whose value must be an outside package's type has only one way in: a schema imported from `#gateway` | Same scope | (same rule; the "left alone" case is exactly a `#gateway`-imported schema identifier used as the field value) |

This rule is new work for this item unless another item has already built it — check before duplicating.
If it does not exist yet when this item starts, build it as part of this item's work, since the caller
migration and the rule that enforces it going forward are the same change in practice (there is nothing
to migrate callers *to* without the rule naming what "the gateway's schema" means structurally).

## Teaching text this item changes

From BR "Folder-type docs: `get-folder-detail`", new section (line 2362): "A field holding an outside
package's type reuses the gateway's schema, branded `'#Gateway<Type>'`. Never `z.custom` or
`z.instanceof` in a contract."

From BR "Testing patterns: `get-testing-patterns`", new section (line 2388): "A contract field branded
`'#Gateway<Type>'` takes the gateway's stub in a stub argument: `ScanStub({ proc: ChildProcessStub() })`.
A partial fake does not compile."

Both are folded into the general Z-phase doc sweep
([Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md)); this item should
leave both statements true for the packages it touches, but the doc files themselves are edited in the
Z phase, not here — unless no later item will touch that specific doc section, in which case write it now
and note it in your report so the Z-phase agent does not duplicate the edit.

## Done when

- [ ] Every live contract field holding an outside package's type imports the gateway's `#Gateway`-branded
      schema instead of writing its own `z.custom`/`z.instanceof`.
- [ ] `parsed.field === originalValue` holds for at least one migrated field per family (identity
      preserved through the parse).
- [ ] Every caller that built one of these objects from a raw gateway value now parses it in.
- [ ] `StubArgument` leaves `#Gateway`-branded fields untouched, with a type-level test that fails when
      reverted.
- [ ] `enforce-gateway-schema-fields` exists, runs pre-edit, and is confirmed against a reintroduced
      `z.custom<ChildProcess>()` mutation.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Do not start before G20 is `done` (confirmed not landed this session — no `*-schema.ts` file exists
  anywhere in the gateway yet).
- The doc's `scanContract`/`ChildProcess`/`WalkedFile` example is illustrative — find the real fields in
  this repo rather than searching for a file named `scan-contract.ts`.
- `Omit`-based brand stripping for class fields was already tried and rejected (breaks `this`-returning
  methods) — do not re-attempt it.
- `mcpServerClientContract` is a decoy: it looks like a C9 candidate but is dead code for `b02`/`b05` to
  delete, not for this item to migrate.

## Concessions made while executing

**The "whole-repo scan is already clean" premise behind switching `enforce-gateway-schema-fields`
straight to `'error'` did not hold on the first pass.** Running the built rule (not the planning
pass's `discover` grep census) as a scoped `npm run ward -- --only lint` over all 1125
`*-contract.ts` files in the repo (run `1790578031004-dfb3`) found 6 violations across 5 files. The
operator's follow-up decision (2026-09-28) was: narrow the rule to its actual purpose (an OUTSIDE
type — an npm package or Node builtin — never a language global or our own workspace type), delete
the two contracts the scan's own census had already flagged as dead, and re-scan. Result:

- **Narrowed the rule** (`rule-enforce-gateway-schema-fields-broker.ts`): it now records every
  `ImportDeclaration`'s local-name → source-specifier mapping per file, and only reports
  `z.custom<T>(...)`/`z.instanceof(X)` when `T`/`X` resolves to an identifier imported from a
  specifier that is neither relative (`.`/`..`) nor `@dungeonmaster/*`. This alone cleared 3 of the
  6 original hits without touching the flagged files: `eslint-context-contract.ts:34`
  (`z.custom<Identifier>()`, where `Identifier` comes from `@dungeonmaster/shared/contracts` — a
  workspace import), `decoded-frame-contract.ts:21` (`z.instanceof(Uint8Array)`, a language global,
  never imported) and `mock-process-behavior-contract.ts:14` (`z.instanceof(Error)`, same). The
  message was updated to name the resolved type and its import source, and the RuleTester test
  gained the three cases the operator asked for (a global builtin, a relative-import type, plus a
  fourth `@dungeonmaster/*` case) and one npm-package invalid case.
- **Both "dead contract" classifications this item and `triage-other.md`'s B02 row carried turn out
  to be wrong — neither was deleted.** Both were traced with `discover` and both have a real caller;
  both had already been independently cleared by the narrowing above, so the scan reaches 0 with no
  deletion needed:
  - `packages/eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts` — `discover`
    for `EslintContext` found roughly 80 rule-broker files across `src/brokers/rule/**` that
    `import type { EslintContext }` from this exact file, in every rule's
    `create: (context: EslintContext) => …` signature. Deleting it breaks the whole package's
    typecheck. The earlier classification checked only whether the SCHEMA VALUE is `.parse()`d in
    production, never whether the file's TYPE EXPORT is imported.
  - `packages/tooling/src/contracts/exec-error/exec-error-contract.ts` — first read as dead from a
    `discover` grep for `ExecError\b` (a word-boundary pattern that cannot match inside
    `ExecErrorStub`, so the actual import line never showed), then genuinely **deleted** along with
    its `.test.ts` and `.stub.ts`, which immediately broke
    `packages/tooling/test/harnesses/tooling-runner/tooling-runner.harness.ts` at typecheck
    (`TS2307: Cannot find module '.../exec-error.stub'`) — caught only by running
    `npm run ward -- --only typecheck -- packages/tooling` per this task's own step 4, not by the
    `discover` census. The harness imports `ExecErrorStub` as a VALUE and derives its own
    `type ExecError = ReturnType<typeof ExecErrorStub>` rather than importing the TYPE directly —
    the exact "tests get types from stubs" pattern `get-testing-patterns` teaches, which is why a
    plain identifier-name grep missed it. **Restored all three files from `git show HEAD:<path>`**
    (confirmed byte-identical via `git diff --stat`, zero output) per the operator's own stop
    condition ("if either has a real caller, stop on it and report") — not deleted.
  - **B02's planner should drop both files from its dead-contract list** — both are alive, and
    neither needs a `z.custom`/`z.instanceof` fix: `eslint-context-contract.ts:34`'s `Identifier` is
    `@dungeonmaster/*`-imported (workspace), and `exec-error-contract.ts`'s `stdout`/`stderr` fields
    use `Buffer`, a Node global never imported in that file — both already pass the narrowed rule
    without any change.
- `packages/web/src/contracts/upload-progress-post/upload-progress-post-contract.ts:27` — also
  cleared by the narrowing, for a different reason: `UploadProgressHandler` is declared in the SAME
  FILE (`type UploadProgressHandler = (params: {...}) => void;`, line 19), never imported at all, so
  it resolves to nothing in the per-file import map and is treated the same as a language global.

**Final whole-repo re-scan (run `1790579686530-a53b`), after restoring the two contracts: 1125/1125
`*-contract.ts` files pass, 0 violations, exit 0.** Registered at `'error'` and tagged `'pre-edit'`,
both live and both clean, with no contract deleted.

## Plan

Checked against code on 2026-09-27:

- The item's own "Current state" (lines 55-62) says G20 "has not landed yet" and blocks this item from
  starting — stale. `childProcessSchema` exists at
  `packages/@gateway/node/src/child_process/child-process/child-process-schema.ts:15` and `walkedFileSchema`
  at `packages/@gateway/node/src/fs/walk-files-sync/walked-file-schema.ts:16`; `EPIC.md:301` marks G20 `done`
  (23f562ee2).
- `EPIC.md:351` (the Phase-3 status row) already corrects the header table: "G20 is done. It still needs B01
  (zod v4)." `EPIC.md:346` confirms B01 `done bf8e0d2f6`, merged into this branch. Both needs are met — this
  item is ready now, contrary to the item file's own header `Needs` row.
- The item's "Packages touched" guess (line 9) — "packages/shared is the most likely home" for a work-item
  holding a `ChildProcess` — is wrong. `packages/shared/src/contracts/work-item/work-item-contract.ts` (read
  in full) has no outside-type field, and a repo-wide census (`discover` over every `packages/*/src/contracts/**`
  for `z.custom`/`z.instanceof`) found zero hits anywhere under `packages/shared/src/contracts/`. The doc's
  `scanContract`/`ChildProcess` example is illustrative only, exactly as the item's own "Traps" section
  (lines 176-177) already warns.
- The `mcpServerClientContract` decoy note (lines 69-72, 180-181) is correct but incomplete. The same
  "no production importer" pattern holds for five more contracts: the four `triage-other.md`'s B02 row
  already names as dead (`packages/eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts:34`,
  `packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts:189`,
  `packages/hooks/src/contracts/child-process/child-process-contract.ts:10`,
  `packages/hooks/src/contracts/file-stats/file-stats-contract.ts:12`), plus two this census found that are
  NOT yet on that list — see "Open questions" below.

### Census result: no live migration target exists yet

Two `discover` passes over every `packages/*/src/contracts/**` file (`z.custom<\w+>|z.instanceof\(`, and
`z.unknown\(\)`) found every escape-hatch instance falls into one of three buckets, none of which this item
migrates:

1. **Dead contracts** (no production importer, only self-test/stub importers) — the six above. B02's job.
2. **Function-type predicates** (`z.custom<StartInstallFn>((v) => typeof v === 'function', …)` in
   `packages/cli/src/contracts/install-module/install-module-contract.ts:17`,
   `packages/cli/src/contracts/siegelense-module/siegelense-module-contract.ts:17`,
   `packages/cli/src/contracts/start-server-module/start-server-module-contract.ts:17`,
   `packages/orchestrator/src/contracts/siegelense-instance-kill-module/siegelense-instance-kill-module-contract.ts:17`,
   `packages/orchestrator/src/contracts/siegelense-lane-provision-module/siegelense-lane-provision-module-contract.ts:28,32`,
   `packages/hydration-recipes/src/contracts/dm-target/dm-target-contract.ts:38`,
   `packages/web/src/contracts/upload-progress-post/upload-progress-post-contract.ts:27`) — each checks
   "is this a function" for a dynamically-imported module or callback whose TYPE is defined in the same file,
   not an outside package's type. Not C9's target.
3. **Deliberately-undocumented builtins with no gateway owner** —
   `packages/siegelense/src/contracts/decoded-frame/decoded-frame-contract.ts:21` (`z.instanceof(Uint8Array)`,
   live via `pngjs-decode-adapter.ts:30`) and
   `packages/testing/src/contracts/mock-process-behavior/mock-process-behavior-contract.ts:14`
   (`z.instanceof(Error)`, live via `child-process-mocker-adapter.ts`) each carry their own PURPOSE
   reasoning for staying unbranded, and neither `Uint8Array` nor `Error` is a type any `@gateway/*` subpath
   wraps — no `#Gateway<Type>` schema exists or is warranted for either. Left alone.

**No new gateway schema is needed.** G20's own note (`EPIC.md:301`) — "No `Stats` schema yet, because no
contract holds `fs.Stats`; add one when B06 needs it" — generalizes: no live contract needs `childProcessSchema`
or `walkedFileSchema` either, and none needs a schema G20 hasn't shipped. There is no "batch 0" schema-creation
step.

This makes the item's Work steps 3-5 (replace the escape hatch, confirm parse identity, fix callers) a no-op
for this pass. What remains live: building the rule (Work step 2's other half — going forward, not
backward), and the `StubArgument` fix (Work steps 6-7), both forward-looking infrastructure independent of
whether a live field exists today.

### Batches

| Batch | Files | What | Depends on | Runs beside |
|---|---|---|---|---|
| B06-1 | see list below (11 files, 2 packages) | Build `enforce-gateway-schema-fields`, wire it into the plugin, tag it `pre-edit` | none | B06-2 |
| B06-2 | `packages/shared/src/@types/stub-argument.type.ts`, `packages/shared/src/@types/stub-argument.test.ts` | `StubArgument` leaves a `#Gateway`-branded field untouched; type-level test proves it | none | B06-1 |

**B06-1 files** (a rule + its test + every registration file, per `agent-brief.md`'s "one batch" carve-out —
confirmed live via `discover`, not `packages/eslint-plugin/CLAUDE.md`'s own "Adding New Rules" recipe, which
is stale: it names `src/startup/start-eslint-plugin.ts` as the registration point, but that file is now a
2-line delegator to `EslintPluginFlow` — read in full, no `rules` object remains there. The `gateway-schema-brand`
rule's real wiring, confirmed by `discover`, is the responder below):

- `packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.ts` (new — the rule implementation; flags `z.custom`/`z.instanceof` anywhere inside a `z.object(...)` in any `*-contract.ts`)
- `packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.proxy.ts` (new)
- `packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.test.ts` (new — RuleTester; must include an `invalid` case reintroducing `z.custom<ChildProcess>()`, per the item's "Done when" checklist)
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts` (edit — import the broker, add to the `rules` interface and the assembled rules map, modeled on `gateway-schema-brand`'s wiring at :79/:163/:252)
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts` (edit — proxy wiring, modeled on :86/:171)
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.test.ts` (edit — add the rule name to its full rule-name-list assertion, modeled on :80)
- `packages/eslint-plugin/src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts` (edit — same list, modeled on :78)
- `packages/eslint-plugin/src/startup/start-eslint-plugin.integration.test.ts` (edit — same list, modeled on :78)
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` (edit — register `'@dungeonmaster/enforce-gateway-schema-fields'`, see "Open questions" for `'off'` vs `'error'`)
- `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` (edit — tag `'pre-edit'`, modeled on `'@dungeonmaster/ban-proxy-catch-all-defaults': 'pre-edit'` at :88)
- `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts` (edit — mirror the tag)
- `packages/eslint-plugin/CLAUDE.md` (edit — its own "Adding New Rules" step 3 names `src/startup/start-eslint-plugin.ts` as the registration point; confirmed stale by reading that file in full (a 2-line delegator to `EslintPluginFlow`, no `rules` object) — repoint the sentence at `src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts`)

Added during implementation: `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` — the plan called this file "not edited", but it also hardcodes the total pre-edit rule count (`expect(preEditCount).toBe(74)`, comment "11 third-party + 63 @dungeonmaster"); adding one pre-edit `@dungeonmaster` rule makes that assertion stale, so it needs the two numbers bumped by one, alongside the completeness checks it already ran (fails if the rule is registered in `config-dungeonmaster-broker.ts` but missing from `dungeonmasterRuleEnforceOnStatics`, or vice versa).

Added during implementation (operator instruction, 2026-09-28 — narrow the rule and clear the scan):

- `packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.ts` and `.test.ts` (edited again, replacing the batch's original version) — narrowed to only flag `z.custom<T>(...)`/`z.instanceof(X)` when `T`/`X` resolves, via the file's own `ImportDeclaration`s, to an identifier imported from a non-relative, non-`@dungeonmaster/*` source. See "Concessions made while executing" for the full before/after and why neither `packages/eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts` nor `packages/tooling/src/contracts/exec-error/exec-error-contract.ts` needed deleting — both were briefly touched (the latter genuinely deleted, then restored byte-identical from `git show HEAD:<path>` after breaking a real caller) but neither is part of this item's final diff.
- `packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.ts` and its `.test.ts` (edited again) — narrowed per the operator's decision: only flags `z.custom<T>(...)`/`z.instanceof(X)` when `T`/`X` resolves (via the file's own `ImportDeclaration`s) to an identifier imported from a non-relative, non-`@dungeonmaster/*` source. A language global (unimported — `Error`, `Uint8Array`) or our own type (relative or workspace import) passes.

**B06-2 files:**

- `packages/shared/src/@types/stub-argument.type.ts` (edit — `StubArgumentBase<T>` currently has no branch for a zod-branded non-primitive object; it falls into `UnbrandRecord<T>`, which makes every member optional — the same mechanism that already special-cases `Promise` and a zod-schema shape (lines 99-112) needs a third arm: detect a brand literal starting with `'#Gateway'` and return `T` unchanged. `Omit`-based stripping was already tried and rejected (breaks `this`-returning methods) — do not re-attempt it.)
- `packages/shared/src/@types/stub-argument.test.ts` (edit — add the type-level test the item's Work step 7 and "Done when" checklist require; import a real gateway schema's inferred type, e.g. `childProcessSchema` from `#gateway/node/child_process`, to assert `StubArgument<{proc: <that type>}>` accepts only the full stub, not `{pid: 5}`. `packages/shared/src/brokers/**` already imports `#gateway/node/*` extensively post-A12 — e.g. `packages/shared/src/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.ts:9` — so this import path is proven to resolve; confirm the test actually fails when the new branch is reverted.)

### Verification

| Batch | Ward | Consumer check |
|---|---|---|
| B06-1 | `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.ts packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.proxy.ts packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.test.ts packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.test.ts packages/eslint-plugin/src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts packages/eslint-plugin/src/startup/start-eslint-plugin.integration.test.ts packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts` | `@dungeonmaster/eslint-plugin` is published (EPIC rule 13) — operator runs `npm run build:clean` then `npm run check:consumer` before commit |
| B06-2 | `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/@types/stub-argument.type.ts packages/shared/src/@types/stub-argument.test.ts` | `@dungeonmaster/shared` is published (EPIC rule 13) — same `check:consumer` gate |

Neither batch touches a `.proxy.ts` another package composes, so no cross-package whole-unit-suite run is
needed beyond the operator's standard full `npm run ward` before merge.

### Build needed

- `shared` — the live pre-edit hook reads `dungeonmasterRuleEnforceOnStatics` at runtime through
  `packages/hooks/src/adapters/dungeonmaster-eslint-plugin/get-pre-edit-rules/dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.ts:10`,
  which resolves `@dungeonmaster/shared/statics` via compiled `dist` (hooks run as a real process, not under
  ward's `--conditions=source`). Rebuild after B06-1 lands so the new tag takes effect live, and after B06-2
  so `npm run prod` / a consumer's install carries the fixed `StubArgument`.
- `eslint-plugin` — rebuild if lint outside ward (or the MCP server) needs to see the new rule; ward itself
  reads source and needs no build.

### Open questions

1. Two more dead/unused contracts this census found, not yet on `triage-other.md`'s B02 six-item list —
   route to B02's planner, not this item's job:
   - `packages/tooling/src/contracts/exec-error/exec-error-contract.ts` — only importer outside its own
     contract family is `packages/tooling/test/harnesses/tooling-runner/tooling-runner.harness.ts:18`, a
     type-only `ReturnType<typeof ExecErrorStub>` reference, not a production `.parse()` call.
   - `packages/server/src/contracts/ws-client/ws-client-contract.ts` — the `WsClient` TYPE is live in
     `packages/server/src/responders/server/init/server-init-responder.ts` and
     `packages/server/src/brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.ts`, but the
     `wsClientContract` SCHEMA is never `.parse()`d in production — line 167 of `server-init-responder.ts`
     casts with `ws as WsClient` instead. Not a C9 candidate either way: no `@gateway/*` subpath wraps `ws`
     or Hono's websocket handle.
2. `enforce-gateway-schema-fields`: land tagged `pre-edit` and `'error'` directly in B06-1 (this planning
   pass's own repo-wide scan already found zero violations — re-run it once more inside the batch to catch
   any drift since 2026-09-27, then flip straight to `'error'`), or land `'off'` first per the epic's default
   "scan, then switch on separately" process? Recommend the former, since the item's own text treats the
   migration and the rule as one change and there is nothing to sweep — but this is a process choice for the
   operator, not a technical unknown.

