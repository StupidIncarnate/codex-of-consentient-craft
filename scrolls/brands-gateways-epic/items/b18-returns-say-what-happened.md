# B18: a function returns what its calls told it, and `void` only when they told it nothing

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), the filler lane. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), R1 "a function returns what its calls told it, and `void` only when they told it nothing", lines 1593-1658; rows 2193, 2236 (moves from pre-edit to ward only); `StartOrchestrator.bootstrap()` may return `void`, line 2141; docs rows 2342 and 2365 |
| Needs | [A19](../a19-adapters-folder-type-gone-caller-rules-on.md) |
| Unblocks | Z01–Z07 |
| Packages touched | Every package with a function returning `Promise<{ success: true }>` or an equivalent single-value shape today — census fresh; known concrete case: `StartOrchestrator.bootstrap()` in `orchestrator` once `A02`'s forwarder-adapter deletion has landed (already a Phase 2 dependency via A19) |
| Checks to run | `lint,typecheck,unit,integration` — this rule needs the type checker, so failures may only surface at `typecheck`, but the behavior change (returning a real value instead of a constant) changes what tests assert, hence `unit`/`integration` too |
| Split | Operator splits per package, 2-4 files per agent — this is a wide, shallow migration (many small functions), not a deep one |
| Runs alone | No |

## Why

`{ success: true }` says nothing: it can only ever be `true`, because a failure throws instead. A caller
that gets it back learns only that nothing threw — which a resolved `Promise<void>` already says. It is
the `ContentText` pattern applied to returns: the old rule demanded a value, nothing checked that the
value said anything, and models returned a constant. 116 of 118 `adapterResultContract` parses were
exactly this shape.

```
// before — 116 of 118 adapterResultContract parses are this literal
export const fsRmIfExistsAdapter = async ({ filePath }: { filePath: string }): Promise<AdapterResult> => {
  try { await rm(filePath); } catch (error) { if (!isNotFoundError(error)) throw error; }
  return adapterResultContract.parse({ success: true });   // was the file there? the caller cannot tell
};

// after — a gateway wrapper returns what the handling learned. One fact, so a plain boolean
// packages/@gateway/node/src/fs__promises/rm-if-exists/rm-if-exists.ts
export const rmIfExists = async ({ filePath }: { filePath: string }): Promise<boolean> => {
  try { await rm(filePath); return true; }
  catch (error) { if (isFsError(error) && error.code === 'ENOENT') return false; throw error; }
};
```

```
// flagged — mkdir reported the first directory it created, and the wrapper threw that away
export const ensureDir = async ({ dirPath }: { dirPath: string }): Promise<void> => {
  await mkdir(dirPath, { recursive: true });
};
// flagged — rmIfExists said whether the file was there, and the broker threw that away
export const questCleanupBroker = async ({ filePath }: { filePath: string }): Promise<void> => {
  await rmIfExists({ filePath });
};
// flagged — a return that can hold only one value says nothing, so it counts as void
): Promise<{ success: true }> => …

// left alone — mkdir's own answer, passed on
export const ensureDir = async ({ dirPath }: { dirPath: string }): Promise<string | undefined> =>
  mkdir(dirPath, { recursive: true });
// left alone — writeFile and rename both return Promise<void>, so there is nothing to report
export const writeFileAtomic = async ({ filePath, contents }: { filePath: string; contents: string }): Promise<void> => {
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, contents, 'utf8');
  await rename(tempPath, filePath);
};
```

**Which calls count:** calls to a gateway export or a broker whose result the function discards. Inside
the gateway, calls to the outside package count too. Built-in methods such as `array.push` or `map.set`
do not count. **Nothing is invented** — a function whose calls told it nothing genuinely returns `void`;
this rule does not make up a value to satisfy itself. **R1 sets a floor, not a ceiling** — a broker may
still return more than its calls told it, such as the updated quest.

`adapterResultContract` goes entirely — the `AdapterResult` shape this rule's predecessor pointed callers
at is deleted, since it is exactly the shape that said nothing.

`StartOrchestrator.bootstrap()` currently returns `{ success: true }`, which R1 counts as `void`. Once the
forwarder adapters that only wrapped it are deleted (Phase 2, already this item's Needs via A19) and this
rule lands, the bootstrap responders call `StartOrchestrator.bootstrap()` directly, and it may return
`void`.

## Current state

Confirmed by reading the source doc's own record of the committed I/O-trap work: `bootstrap()` is
described as returning `{ success: true }` as of commit `fe456add9`, and the doc explicitly says this
becomes `void` once R1 lands and the forwarder adapters (Phase 2) are gone. **Not independently
re-verified this session** — read `packages/orchestrator/src/startup/start-orchestrator.ts` fresh before
editing, since Phase 2 work may have already changed its return shape.

No rule folder named `enforce-folder-return-types` was part of this session's targeted scan (that scan
looked for brand/primitive-named folders specifically) — locate it at the start of this item; it is named
explicitly in the source doc as the rule this item rewrites, and is currently tagged `'pre-edit'` in
`dungeonmaster-rule-enforce-on-statics.ts` (confirmed file exists, tag content not independently
re-checked this session).

## Work

1. **Rewrite `enforce-folder-return-types`.** Today it always refuses `void`/`Promise<void>` and
   recommends `AdapterResult`. The new check: allow `void` **exactly when** every discarded call the
   function makes also returned `void`. A return type that can only ever hold one value (`{ success: true
   }`, `Promise<true>`, a single-member literal union with no real variance) counts as `void` for this
   purpose too — it is refused the same as an explicit `void` return would be refused if the calls it
   discarded returned something real.
2. **This needs the type checker** (to know what each discarded call's own return type is), so it **moves
   from pre-edit to ward only**. Remove its `'pre-edit'` tag in
   `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`.
   A wrong `void` is now caught by ward, not at the edit — this is a deliberate behavior change (row
   2236), not a bug to avoid.
3. **Census every function returning `Promise<{ success: true }>` or an equivalent single-value shape**,
   fresh (the 116-of-118 `adapterResultContract` figure is a pre-Phase-2 snapshot; most of these adapters
   are already gone or renamed by the time this item runs — find the current equivalents, likely now
   gateway wrappers or brokers).
4. **For each flagged function, trace what its discarded calls actually told it**, and return that instead
   of the constant:
   - A gateway wrapper around a Node/npm call that reports something real (existed, was created, byte
     count, etc.) returns that real value, typed as plainly as the fact allows (a `boolean` for a yes/no
     fact, per [B14](b14-type-alias-and-adhoc-type-rules.md)'s B6 — "one fact is better as `Promise<boolean>`
     than a one-field object").
   - A broker that only forwards a wrapper's own `void`/no-real-signal result stays `void`.
   - A broker that discards a call telling it something real (like `rmIfExists`'s existed/didn't-exist
     fact) must stop discarding it — pass the real value through, or use it to decide what to return.
5. **Fix every test asserting the old constant.** 87 adapter tests (pre-Phase-2 snapshot) assert the
   literal `{ success: true }` — each surviving test now asserts what the function actually returns, such
   as `resolves.toBeUndefined()` for an `mkdir` wrapper that created nothing new, or
   `resolves.toBe(true)`/`resolves.toBe(false)` for a real yes/no fact.
6. **Delete `adapterResultContract`** (its contract, stub, test, and every import) once its last caller is
   migrated.
7. **Confirm `StartOrchestrator.bootstrap()` may now return `void`.** Once Phase 2's forwarder-adapter
   deletion (A02, upstream of this item's A19 dependency) has removed every adapter that only wrapped
   `bootstrap()`, change its return type to `void` and update its one caller-facing test
   (`start-orchestrator.integration.test.ts`, which today asserts `bootstrap()` twice returns `{ success:
   true }` both times — per the committed I/O-trap record) to assert the new `void`/no-throw behavior
   instead.
8. **Read the wider context of the committed I/O trap work** (`packages/orchestrator/src/startup/start-orchestrator.ts`,
   its integration test, the server/mcp `orchestrator-bootstrap` adapters mentioned in the source doc's
   "Status" section) before touching any of it — this code was deliberately shaped this way as an interim
   step, explicitly waiting for R1 and the forwarder-adapter deletion to both land before it could be
   simplified further.

## Lint rules this item adds or changes

| Rule | Change | Pre-edit? |
|---|---|---|
| `enforce-folder-return-types` | Rewritten per R1: `void` allowed exactly when every discarded call also returned `void` (a single-value return type counts as `void`); message no longer recommends `AdapterResult` | **No — moves from `'pre-edit'` to ward only**, since it now needs the type checker |

## Teaching text this item changes

From BR "Architecture docs" (row 2342): "Same file [`architecture-overview-broker.ts`], new section:
Nothing on returns beyond the `void` ban" → "Return what your calls told you. `void` only when every
call you discard returned `void`. `{ success: true }` counts as `void`." Doc rule: R1.

From BR "Folder-type docs" (row 2365): "Every function-exporting folder's `*-constraints.md`: The `void`
ban, with `AdapterResult` as the way out" → "R1's wording, as in the `get-architecture` row." (i.e., every
per-folder-type constraints doc gets the same replacement text, not just the general architecture doc.)

Finished in full in [Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md);
this item should confirm the rule's final behavior and message text in its report so that phase copies
accurate wording.

## Done when

- [ ] `enforce-folder-return-types` is rewritten per R1, uses the type checker, and its `'pre-edit'` tag
      is removed from `dungeonmaster-rule-enforce-on-statics.ts`.
- [ ] `adapterResultContract` and every import of it are deleted.
- [ ] Every function that discarded a call telling it something real now returns that real value (or
      passes it through) instead of a constant.
- [ ] Every test asserting the old `{ success: true }` constant now asserts the real returned value.
- [ ] `StartOrchestrator.bootstrap()` returns `void` (confirmed Phase 2's forwarder-adapter deletion has
      landed first), with its integration test updated.
- [ ] `npm run ward -- --only lint,typecheck,unit,integration -- <touched files>` exits 0.

## Traps

- Do not invent a value where calls genuinely told the function nothing — `void` is still correct there;
  this rule does not ban `void`, it bans a `void` in disguise as a fake-informative constant.
- `StartOrchestrator.bootstrap()`'s return type depends on Phase 2 (forwarder-adapter deletion) having
  actually landed — check A02's/A19's status before changing it, or you will change a signature something
  else in Phase 2 still depends on.
- Removing the `'pre-edit'` tag is a real behavior change for every developer's edit-time feedback loop —
  a wrong `void` now only surfaces at `npm run ward`, not at the moment of the edit. This is deliberate,
  not an oversight — do not try to "fix" it by finding a way to keep it pre-edit.

## Concessions made while executing

## Plan

Checked against code on 2026-09-27:
- `packages/orchestrator/src/startup/start-orchestrator.ts:80-96`: Item notes `StartOrchestrator.bootstrap()` return shape was not independently re-verified; verified it returns `AdapterResult` via `ProcessStaleWatchFlow.bootstrap()`. Phase 2 forwarder adapters (item A02) were deleted in commit `3747a95c0`, so the only external caller is `packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.ts:14`.
- `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.ts:17` and `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts:13`: Item notes rule folder was unlocated; located and verified active.
- `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts:33`: Item notes pre-edit tag content was not independently re-checked; verified `'@dungeonmaster/enforce-folder-return-types': 'pre-edit'` is active and covered by `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts:22`.
- `packages/orchestrator/src/startup/start-orchestrator.proxy.ts:101-104,398-403`: Cross-package proxy was already added in A00 and is composed by `packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.proxy.ts:12-14`.
- `packages/shared/src/contracts/adapter-result/adapter-result-contract.ts:1-20`: Item lists deleting `adapterResultContract` upon finishing split (a); verified ~143 usages across 11 packages (e.g. `cli`, `config`, `mcp`, `server`, `ward`), so contract deletion must be deferred to the final batch of split (b).

### Split (a): Files Created, Edited, or Deleted

#### Orchestrator
- `packages/orchestrator/src/flows/execution-queue/execution-queue-flow.ts` (edit)
- `packages/orchestrator/src/flows/execution-queue/execution-queue-flow.integration.test.ts` (edit: update bootstrap test to assert void return instead of `{ success: true }`)
- `packages/orchestrator/src/responders/execution-queue/bootstrap/execution-queue-bootstrap-responder.ts` (edit)
- `packages/orchestrator/src/responders/execution-queue/bootstrap/execution-queue-bootstrap-responder.test.ts` (edit)
- `packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.ts` (edit)
- `packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.test.ts` (edit)
- `packages/orchestrator/src/flows/orchestration-dispatch/orchestration-dispatch-flow.ts` (edit)
- `packages/orchestrator/src/flows/orchestration-dispatch/orchestration-dispatch-flow.integration.test.ts` (edit: update bootstrap test to assert void return instead of `{ success: true }`)
- `packages/orchestrator/src/responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.ts` (edit)
- `packages/orchestrator/src/responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.test.ts` (edit)
- `packages/orchestrator/src/flows/process-stale-watch/process-stale-watch-flow.ts` (edit)
- `packages/orchestrator/src/flows/process-stale-watch/process-stale-watch-flow.integration.test.ts` (edit: update bootstrap test to assert void return instead of `{ success: true }`)
- `packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.ts` (edit)
- `packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.test.ts` (edit)
- `packages/orchestrator/src/flows/smoketest/smoketest-flow.ts` (edit)
- `packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.ts` (edit)
- `packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.test.ts` (edit)
- `packages/orchestrator/src/responders/smoketest/bootstrap-listener/drain-listener-layer-responder.ts` (edit)
- `packages/orchestrator/src/responders/smoketest/bootstrap-listener/drain-listener-layer-responder.test.ts` (edit)
- `packages/orchestrator/src/flows/rate-limits/rate-limits-flow.ts` (edit)
- `packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.ts` (edit)
- `packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.proxy.ts` (edit)
- `packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.test.ts` (edit)
- `packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.ts` (edit)
- `packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.test.ts` (edit)
- `packages/orchestrator/src/startup/start-orchestrator.ts` (edit)
- `packages/orchestrator/src/startup/start-orchestrator.proxy.ts` (edit)
- `packages/orchestrator/src/startup/start-orchestrator.integration.test.ts` (edit)

#### Server
- `packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.ts` (edit)
- `packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.proxy.ts` (edit)
- `packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.test.ts` (edit)

#### Shared
- `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` (edit)
- `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts` (edit)

#### ESLint Plugin
- `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts` (edit)
- `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.test.ts` (edit)
- `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.ts` (edit)
- `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.test.ts` (edit)
- `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` (edit)

### Split (a): Batches

| Batch ID | Files | Action | Depends On | Runs Beside |
|---|---|---|---|---|
| B18-1 | `packages/orchestrator/src/responders/execution-queue/bootstrap/execution-queue-bootstrap-responder.ts`<br>`packages/orchestrator/src/responders/execution-queue/bootstrap/execution-queue-bootstrap-responder.test.ts` | Change return type to `void` and assert `toBeUndefined()`. | B18-11, B18-12 | B18-3, B18-4, B18-5, B18-6, B18-7, B18-8 |
| B18-2 | `packages/orchestrator/src/flows/execution-queue/execution-queue-flow.ts`<br>`packages/orchestrator/src/flows/execution-queue/execution-queue-flow.integration.test.ts`<br>`packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.ts`<br>`packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.test.ts` | Change `bootstrap()` and `bootstrapSyncListener()` to return `void`. | B18-1, B18-11, B18-12 | B18-3, B18-4, B18-5, B18-6, B18-7, B18-8 |
| B18-3 | `packages/orchestrator/src/flows/orchestration-dispatch/orchestration-dispatch-flow.ts`<br>`packages/orchestrator/src/flows/orchestration-dispatch/orchestration-dispatch-flow.integration.test.ts`<br>`packages/orchestrator/src/responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.ts`<br>`packages/orchestrator/src/responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.test.ts` | Change dispatch bootstrap flow and responder to return `void`. | B18-11, B18-12 | B18-1, B18-2, B18-4, B18-5, B18-6, B18-7, B18-8 |
| B18-4 | `packages/orchestrator/src/flows/process-stale-watch/process-stale-watch-flow.ts`<br>`packages/orchestrator/src/flows/process-stale-watch/process-stale-watch-flow.integration.test.ts`<br>`packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.ts`<br>`packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.test.ts` | Change stale-watch bootstrap flow and responder to return `void`. | B18-11, B18-12 | B18-1, B18-2, B18-3, B18-5, B18-6, B18-7, B18-8 |
| B18-5 | `packages/orchestrator/src/flows/smoketest/smoketest-flow.ts`<br>`packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.ts`<br>`packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.test.ts` | Change smoketest bootstrap flow and listener responder to return `void`. | B18-11, B18-12 | B18-1, B18-2, B18-3, B18-4, B18-6, B18-7, B18-8 |
| B18-6 | `packages/orchestrator/src/responders/smoketest/bootstrap-listener/drain-listener-layer-responder.ts`<br>`packages/orchestrator/src/responders/smoketest/bootstrap-listener/drain-listener-layer-responder.test.ts` | Change drain listener layer responder and test to return `void`. | B18-11, B18-12 | B18-1, B18-2, B18-3, B18-4, B18-5, B18-7, B18-8 |
| B18-7 | `packages/orchestrator/src/flows/rate-limits/rate-limits-flow.ts`<br>`packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.ts`<br>`packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.proxy.ts`<br>`packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.test.ts` | Change rate-limits bootstrap flow, responder, proxy and test to return `void`. | B18-8, B18-11, B18-12 | B18-1, B18-2, B18-3, B18-4, B18-5, B18-6 |
| B18-8 | `packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.ts`<br>`packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.test.ts` | Change evaluate-hold layer responder and test to return `void`. | B18-11, B18-12 | B18-1, B18-2, B18-3, B18-4, B18-5, B18-6, B18-7 |
| B18-9 | `packages/orchestrator/src/startup/start-orchestrator.ts`<br>`packages/orchestrator/src/startup/start-orchestrator.proxy.ts`<br>`packages/orchestrator/src/startup/start-orchestrator.integration.test.ts` | Change `StartOrchestrator.bootstrap()` to return `void`, proxy returns `undefined`, test asserts `toBeUndefined()`. | B18-1, B18-2, B18-3, B18-4, B18-5, B18-6, B18-7, B18-8, B18-11, B18-12 | None |
| B18-10 | `packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.ts`<br>`packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.proxy.ts`<br>`packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.test.ts` | Change server orchestration bootstrap responder to return `void`, proxy returns `undefined`, test asserts `toBeUndefined()`. | B18-9, B18-11, B18-12 | None |
| B18-11 | `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`<br>`packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts` | Remove `'pre-edit'` tag for `@dungeonmaster/enforce-folder-return-types`. | None | B18-1 through B18-10, B18-12 |
| B18-12 | `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts`<br>`packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.test.ts` | Rewrite layer broker to inspect discarded call types via type checker adapter and permit `void` only when discarded calls return `void`. | None | B18-1 through B18-11 |
| B18-13 | `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.ts`<br>`packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.test.ts`<br>`packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` | Update rule broker description/messages and update integration test counts/checks for ward-only rule timing. | B18-11, B18-12 | B18-10 |

### Verification per Batch

- **B18-1**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/responders/execution-queue/bootstrap/execution-queue-bootstrap-responder.ts packages/orchestrator/src/responders/execution-queue/bootstrap/execution-queue-bootstrap-responder.test.ts`
- **B18-2**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/flows/execution-queue/execution-queue-flow.ts packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.ts packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.test.ts`
- **B18-3**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/flows/orchestration-dispatch/orchestration-dispatch-flow.ts packages/orchestrator/src/responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.ts packages/orchestrator/src/responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.test.ts`
- **B18-4**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/flows/process-stale-watch/process-stale-watch-flow.ts packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.ts packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.test.ts`
- **B18-5**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/flows/smoketest/smoketest-flow.ts packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.ts packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.test.ts`
- **B18-6**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/responders/smoketest/bootstrap-listener/drain-listener-layer-responder.ts packages/orchestrator/src/responders/smoketest/bootstrap-listener/drain-listener-layer-responder.test.ts`
- **B18-7**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/flows/rate-limits/rate-limits-flow.ts packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.ts packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.proxy.ts packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.test.ts`
- **B18-8**: `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.ts packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.test.ts`
- **B18-9**: `npm run ward -- --only lint,typecheck,unit,integration -- packages/orchestrator/src/startup/start-orchestrator.ts packages/orchestrator/src/startup/start-orchestrator.proxy.ts packages/orchestrator/src/startup/start-orchestrator.integration.test.ts`
  - Cross-package unit suite: `StartOrchestratorProxy` is composed by `packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.proxy.ts`. Both `packages/orchestrator` and `packages/server` whole unit suites must run: `npm run ward -- --only unit -- packages/orchestrator packages/server`.
- **B18-10**: `npm run ward -- --only lint,typecheck,unit -- packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.ts packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.proxy.ts packages/server/src/responders/orchestration/bootstrap/orchestration-bootstrap-responder.test.ts`
  - Package unit suite: `npm run ward -- --only unit -- packages/server`.
- **B18-11**: `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts`
- **B18-12**: `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.test.ts`
- **B18-13**: `npm run ward -- --only lint,typecheck,unit,integration -- packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.ts packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.test.ts packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts`

### Build and Consumer Discipline

- **Build requirements**:
  - `packages/shared`: If any process runs compiled output during testing, build with `npm run build --workspace=@dungeonmaster/shared`.
  - `packages/orchestrator`: If compiled output is executed by server/mcp or init tests, build with `npm run build --workspace=@dungeonmaster/orchestrator`.
  - `packages/eslint-plugin`: If plugin is run via external eslint loader, build with `npm run build --workspace=@dungeonmaster/eslint-plugin`.
- **Consumer impact**:
  - Split (a) does NOT change any template files or files written by `dungeonmaster init`.
  - No consumer export contracts or public bindings change in split (a). `check:consumer` is not required until split (b) deletes `adapterResultContract`.

### Split (b): Broad Census per Package

#### Non-Deferred Packages (`src/adapters/` does not exist)
- **`session-forensics`**:
  - `packages/session-forensics/src/startup/start-session-forensics.ts` (`init()` returns `AdapterResult`)
  - `packages/session-forensics/src/startup/start-session-forensics.proxy.ts`
  - `packages/session-forensics/src/startup/start-session-forensics.test.ts`
  - `packages/session-forensics/src/responders/session-forensics/init/session-forensics-init-responder.ts`
  - `packages/session-forensics/src/responders/session-forensics/init/session-forensics-init-responder.test.ts`

#### Deferred Packages (`src/adapters/` still exists)
- **`cli` (deferred: `src/adapters/` still exists)**:
  - `packages/cli/src/adapters/siegelense/run/siegelense-run-adapter.ts`
  - `packages/cli/src/adapters/siegelense/run/siegelense-run-adapter.test.ts`
  - `packages/cli/src/brokers/command/execute-command/command-execute-command-broker.ts`
  - `packages/cli/src/brokers/command/execute-command/command-execute-command-broker.test.ts`
- **`config` (deferred: `src/adapters/` still exists)**:
  - `packages/config/src/adapters/fs/ensure-file/fs-ensure-file-adapter.ts`
  - `packages/config/src/adapters/fs/ensure-file/fs-ensure-file-adapter.test.ts`
  - `packages/config/src/adapters/fs/write-file-atomic/fs-write-file-atomic-adapter.ts`
  - `packages/config/src/adapters/fs/write-file-atomic/fs-write-file-atomic-adapter.test.ts`
  - `packages/config/src/responders/install/create-config/install-create-config-responder.ts`
  - `packages/config/src/responders/install/create-config/install-create-config-responder.test.ts`
- **`eslint-plugin` (deferred: `src/adapters/` still exists)**:
  - `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts` (handled in split a)
  - `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.test.ts` (handled in split a)
- **`hooks` (deferred: `src/adapters/` still exists)**:
  - `packages/hooks/src/adapters/fs/append-file-sync/fs-append-file-sync-adapter.ts`
  - `packages/hooks/src/adapters/fs/append-file-sync/fs-append-file-sync-adapter.test.ts`
  - `packages/hooks/src/adapters/fs/ensure-dir-sync/fs-ensure-dir-sync-adapter.ts`
  - `packages/hooks/src/adapters/fs/ensure-dir-sync/fs-ensure-dir-sync-adapter.test.ts`
  - `packages/hooks/src/adapters/fs/write-file-sync/fs-write-file-sync-adapter.ts`
  - `packages/hooks/src/adapters/fs/write-file-sync/fs-write-file-sync-adapter.test.ts`
  - `packages/hooks/src/responders/install/create-settings/install-create-settings-responder.ts`
  - `packages/hooks/src/responders/install/create-settings/install-create-settings-responder.test.ts`
- **`hydration` (deferred: `src/adapters/` still exists)**:
  - `packages/hydration/src/adapters/fs/create-dir/fs-create-dir-adapter.ts`
  - `packages/hydration/src/adapters/fs/create-dir/fs-create-dir-adapter.test.ts`
  - `packages/hydration/src/adapters/fs/write-file/fs-write-file-adapter.ts`
  - `packages/hydration/src/adapters/fs/write-file/fs-write-file-adapter.test.ts`
- **`hydration-recipes` (deferred: `src/adapters/` still exists)**:
  - `packages/hydration-recipes/src/adapters/recipe/mcp/tool-recipe-mcp-adapter.ts`
  - `packages/hydration-recipes/src/adapters/recipe/mcp/tool-recipe-mcp-adapter.test.ts`
  - `packages/hydration-recipes/src/adapters/recipe/signals/tool-recipe-signals-adapter.ts`
  - `packages/hydration-recipes/src/adapters/recipe/signals/tool-recipe-signals-adapter.test.ts`
- **`mcp` (deferred: `src/adapters/` still exists)**:
  - `packages/mcp/src/adapters/file/rm/file-rm-adapter.ts`
  - `packages/mcp/src/adapters/file/rm/file-rm-adapter.test.ts`
  - `packages/mcp/src/adapters/file/write/file-write-adapter.ts`
  - `packages/mcp/src/adapters/file/write/file-write-adapter.test.ts`
  - `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts`
  - `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts`
  - `packages/mcp/src/responders/install/config-create/install-config-create-responder.ts`
  - `packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts`
- **`orchestrator` (deferred: `src/adapters/` still exists — non-split-(a) callers)**:
  - `packages/orchestrator/src/brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.ts`
  - `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-batch-layer-broker.ts`
  - `packages/orchestrator/src/brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.ts`
  - `packages/orchestrator/src/responders/clarify/answer/clarify-answer-responder.ts`
  - `packages/orchestrator/src/responders/clarify/answer/clarify-answer-responder.test.ts`
  - `packages/orchestrator/src/responders/comment/batch/comment-batch-responder.ts`
  - `packages/orchestrator/src/responders/comment/batch/comment-batch-responder.test.ts`
  - `packages/orchestrator/src/responders/guild/remove/guild-remove-responder.ts`
  - `packages/orchestrator/src/responders/guild/remove/guild-remove-responder.test.ts`
  - `packages/orchestrator/src/responders/install/commands-create/install-commands-create-responder.ts`
  - `packages/orchestrator/src/responders/install/commands-create/install-commands-create-responder.test.ts`
  - `packages/orchestrator/src/responders/install/repo-scaffold/install-repo-scaffold-responder.ts`
  - `packages/orchestrator/src/responders/install/repo-scaffold/install-repo-scaffold-responder.test.ts`
  - `packages/orchestrator/src/responders/orchestration/delete/orchestration-delete-responder.ts`
  - `packages/orchestrator/src/responders/orchestration/delete/orchestration-delete-responder.test.ts`
  - `packages/orchestrator/src/responders/orchestration/merge/orchestration-merge-responder.ts`
  - `packages/orchestrator/src/responders/orchestration/merge/orchestration-merge-responder.test.ts`
  - `packages/orchestrator/src/responders/orchestration/resume/orchestration-resume-responder.ts`
  - `packages/orchestrator/src/responders/orchestration/resume/orchestration-resume-responder.test.ts`
  - `packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.ts`
  - `packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.test.ts`
  - `packages/orchestrator/src/responders/orchestration-dispatch/pause/orchestration-dispatch-pause-responder.ts`
  - `packages/orchestrator/src/responders/orchestration-dispatch/pause/orchestration-dispatch-pause-responder.test.ts`
  - `packages/orchestrator/src/responders/orchestration-dispatch/play/orchestration-dispatch-play-responder.ts`
  - `packages/orchestrator/src/responders/orchestration-dispatch/play/orchestration-dispatch-play-responder.test.ts`
  - `packages/orchestrator/src/responders/worktree/create/worktree-create-responder.ts`
  - `packages/orchestrator/src/responders/worktree/create/worktree-create-responder.test.ts`
- **`server` (deferred: `src/adapters/` still exists — non-split-(a) callers)**:
  - `packages/server/src/responders/install/scaffold-repo/install-scaffold-repo-responder.ts`
  - `packages/server/src/responders/install/scaffold-repo/install-scaffold-repo-responder.test.ts`
- **`shared` (deferred: `src/adapters/` still exists — contract deletion in final batch)**:
  - `packages/shared/src/contracts/adapter-result/adapter-result-contract.ts` (delete)
  - `packages/shared/src/contracts/adapter-result/adapter-result-contract.test.ts` (delete)
  - `packages/shared/src/contracts/adapter-result/adapter-result.stub.ts` (delete)
  - `packages/shared/src/contracts/adapter-result/adapter-result.stub.test.ts` (delete)
- **`siegelense` (deferred: `src/adapters/` still exists)**:
  - `packages/siegelense/src/adapters/fs/write-file-sync/fs-write-file-sync-adapter.ts`
  - `packages/siegelense/src/adapters/fs/write-file-sync/fs-write-file-sync-adapter.test.ts`
  - `packages/siegelense/src/adapters/fs/ensure-dir-sync/fs-ensure-dir-sync-adapter.ts`
  - `packages/siegelense/src/adapters/fs/ensure-dir-sync/fs-ensure-dir-sync-adapter.test.ts`
- **`testing` (deferred: `src/adapters/` still exists)**:
  - `packages/testing/src/adapters/fs/ensure-dir/fs-ensure-dir-adapter.ts`
  - `packages/testing/src/adapters/fs/ensure-dir/fs-ensure-dir-adapter.test.ts`
  - `packages/testing/src/adapters/fs/write-file/fs-write-file-adapter.ts`
  - `packages/testing/src/adapters/fs/write-file/fs-write-file-adapter.test.ts`
  - `packages/testing/src/adapters/fs/rm/fs-rm-adapter.ts`
  - `packages/testing/src/adapters/fs/rm/fs-rm-adapter.test.ts`
- **`tooling` (deferred: `src/adapters/` still exists)**:
  - `packages/tooling/src/adapters/fs/ensure-dir/fs-ensure-dir-adapter.ts`
  - `packages/tooling/src/adapters/fs/ensure-dir/fs-ensure-dir-adapter.test.ts`
  - `packages/tooling/src/adapters/fs/write-file/fs-write-file-adapter.ts`
  - `packages/tooling/src/adapters/fs/write-file/fs-write-file-adapter.test.ts`
- **`ward` (deferred: `src/adapters/` still exists)**:
  - `packages/ward/src/adapters/fs/write-file/fs-write-file-adapter.ts`
  - `packages/ward/src/adapters/fs/write-file/fs-write-file-adapter.test.ts`
  - `packages/ward/src/adapters/process/exit/process-exit-adapter.ts`
  - `packages/ward/src/adapters/process/exit/process-exit-adapter.test.ts`
- **`web` (deferred: `src/adapters/` still exists)**:
  - `packages/web/src/adapters/storage/local-storage-adapter.ts`
  - `packages/web/src/adapters/storage/local-storage-adapter.test.ts`

### Open Questions

1. **Handling Ward-Only Timing in `dungeonmaster-rule-enforce-on.integration.test.ts`**: The test at line 251 asserts that every registered `@dungeonmaster/*` rule in `configDungeonmasterBroker` exists in `dungeonmasterRuleEnforceOnStatics`. Untagging `@dungeonmaster/enforce-folder-return-types` from `dungeonmasterRuleEnforceOnStatics` causes this test to fail unless the test explicitly exempts ward-only typed rules (following `ban-proxy-empty-called-with`) or `dungeonmasterRuleEnforceOnStatics` introduces a `'ward-only'` timing entry.
2. **Encapsulated Watcher Handles in Responders**: `ProcessStaleWatchBootstrapResponder` and `RateLimitsBootstrapResponder` store their returned timer/watcher handles in private module state (`processStaleWatchBootstrapState.setHandle`, `rateLimitsBootstrapState.setHandle`) and currently return `{ success: true as const }` solely to satisfy the legacy no-void rule. Confirm that both responders should return `void`, keeping the handles strictly encapsulated.

## Plan — F54 and F53 (orchestrator)

Scope: the orchestrator-package rows of EPIC.md follow-ups F54 (`enforce-folder-return-types` reds) and F53 (`ban-contract-type-predicates` reds), only the files each row names for `orchestrator`. Checked against code on 2026-09-28: both rules' current implementations were read directly (`packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts`, `.../ban-contract-type-predicates/rule-ban-contract-type-predicates-broker.ts`) rather than assumed from the row text.

### `enforce-folder-return-types` (F54)

For each function, the fix is either "return the informative value the discarded call told it" or "stop discarding the call" (capture it and act on it), per R1 — never a config or rule edit.

- `packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.ts` (edit) — discards `questOperationsUpdateBroker`'s `{quest} | null`. Returns `Promise<boolean>` instead of `Promise<AdapterResult>`: `result !== null` (did it actually enter a scope, or was it a no-op). Drops the now-unused `adapterResultContract`/`AdapterResult` import.
  - `packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.test.ts` (edit) — 8 `expect(result).toStrictEqual({ success: true })` sites become `.toBe(true)` (creates-a-work-item scenarios) or `.toBe(false)` (resume-guard / no-pending-ops / redelivery no-op scenarios).
  - `packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.proxy.ts` — read only; no change needed (delegates wholesale to the operations-update proxy, never touches the return shape).
  - Callers `packages/orchestrator/src/brokers/quest/get-next-step/scan-once-layer-broker.ts:125` and `packages/orchestrator/src/responders/quest/handle-signal-back/quest-handle-signal-back-responder.ts:176` both call it nested inside an `if` block already, so neither trips `enforce-folder-return-types` itself and neither needs a source change — confirmed by reading both call sites.
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-one-agent-layer-broker.ts` (edit) — the flagged discard is `unregisterProcess?.({ processId })`: an optional-chained call on a `(params) => void` callback types as `void | undefined`, and `eslintTypedReturnIsVoidLikeAdapter` cannot tell that apart from a real value (a union of >1 member falls through to its property-count check, which returns `false`/"informative" for an empty-property union). Fix is a guarded call (`if (unregisterProcess) { unregisterProcess({ processId }); }`) rather than optional chaining — same runtime behaviour, no `void | undefined` union for the checker to misread. No return-type or caller change.
- `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts` (edit) — the flagged discard is the bare `await questModifyBroker(...)` marking the dispatching chat work item `in_progress` (step 7). Captures the result and logs on failure, matching the two existing `transitionResult`/`!success` checks already in this same file for the terminal/blocked transitions. Return type (`Promise<AdapterResult>`) and every external caller unchanged.
  - `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy.ts` (edit) — adds `setupChatDispatchThrows` (stages `runChatLayerBrokerProxy().setupSpawnThrow`, which also stops the loop's self-recursion so a unit test can reach the dispatch branch at all) and `setupInProgressMarkFails` (one-shot failure on the next `questModifyBroker` call).
  - `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.test.ts` (edit) — new `describe('dispatching a chat role')` test: stages the in-progress mark to fail and the chat dispatch to throw, asserts the whole call rejects and the stderr line sequence includes the new failure log. This is new coverage — no existing test in this file reaches the dispatch branch (confirmed: `userMessage` appears nowhere else in the file, and the file's own header says its coverage is state-mutation/short-circuit only).
- `packages/orchestrator/src/brokers/quest/session-record/quest-session-record-broker.ts` (edit) — discards `questOperationsUpdateBroker`'s `{quest} | null`, same shape as `quest-advance-broker.ts`. Returns `Promise<boolean>` (`result !== null` — did it append a row, or was the sessionId already recorded). Drops the unused `adapterResultContract`/`AdapterResult` import.
  - `packages/orchestrator/src/brokers/quest/session-record/quest-session-record-broker.test.ts` (edit) — none of the existing tests asserted the return value (only persisted-quest state), so no existing assertion needed to change; adds `expect(result).toBe(true|false)` to each of the 5 tests to actually prove the new behaviour.
  - `packages/orchestrator/src/brokers/quest/session-record/quest-session-record-broker.proxy.ts` — read only; no change needed.
  - Callers (`chat-spawn-broker.ts`, `spawn-one-agent-layer-broker.ts`'s own `.then().catch()` site) are all fire-and-forget (`.catch()` chains that never consume the resolved value) — confirmed by reading both call sites — so none needs a change.
- `packages/orchestrator/src/brokers/quest/work-item-insert/quest-work-item-insert-broker.ts` (edit) — discards `questModifyBroker`'s real `ModifyQuestResult` behind a hardcoded `{ success: true }`. This broker has no production caller (confirmed unreferenced in the package map — only its own test/proxy import it), so the fix passes the real result straight through: `return questModifyBroker({...})`, return type `Promise<ModifyQuestResult>`. Drops the unused `adapterResultContract`/`AdapterResult` import.
  - `packages/orchestrator/src/brokers/quest/work-item-insert/quest-work-item-insert-broker.proxy.ts` (edit) — adds `setupModifyFailure` (delegates to the composed `questModifyBrokerProxy().setupResolveFailureOnce()`).
  - `packages/orchestrator/src/brokers/quest/work-item-insert/quest-work-item-insert-broker.test.ts` (edit) — the two existing tests keep asserting `.resolves.toStrictEqual({ success: true })` (now the REAL passthrough value, which still happens to be `{success:true}` for a successful modify); adds one new test staging a modify failure and asserting the broker returns that failure verbatim instead of the old hardcoded success.

### `ban-contract-type-predicates` (F53)

Both fixes replace a hand-written `(x): x is OurType` with a plain `!== null` filter; TypeScript's inferred type predicates (no explicit annotation needed) still narrow the result, confirmed by a green typecheck. No rule or config edit — the rule stays `off`.

- `packages/orchestrator/src/brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker.ts` (edit) — `candidates.find((g): g is GuildListItem => g !== null)` → `candidates.find((g) => g !== null)`.
- `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.ts` (edit) — `gatedQuests.filter((quest): quest is Quest => quest !== null)` → `gatedQuests.filter((quest) => quest !== null)`.

### Checks

`npm run ward -- --only lint,typecheck,unit,integration -- <the files above>`, then `npm run ward -- --only unit -- packages/orchestrator packages/server packages/mcp` for the whole-package regression (orchestration-loop's and work-item-insert's proxies are composed only within `orchestrator`; nothing here is imported by `server` or `mcp`, but the wide run is cheap insurance).


## Plan — Split (b): every remaining `AdapterResult` and `{ success: true }` return

Checked against code on 2026-09-29 (the worktree at `cf49035d0` plus the uncommitted `@gateway/npm` edit). Everything
below comes from a fresh dry run of `phase34-scripts/b18-adapter-result/run.cjs` over the whole repo
(`--no-verify --sample-out=tmp/b18-sample --leftovers=tmp/b18-left.json`, about 2 minutes) and a scan of the tree, not
from the census earlier in this file.

Measured by that run: 174 functions found, **163 convert**, 177 discarding callers, 50 forwarders, 11 function types
retyped, 216 files rewritten (153 source, 61 tests, 2 proxies), 182 asserts rewritten to `.toBeUndefined()`, 0 new
diagnostics in the script's own verify pass. Hand queue: the same 11 functions as `leftovers.json`, 4 stubs, 4 proxies,
19 comment-only files, 50 `{ success: true }` asserts left alone. Nothing in the run touches `src/adapters/`: no
package has that folder any more, so the census under "Split (b): Broad Census per Package" above is history, and this
section is the scope.

### How the script is run

1. Once, from the worktree root: `cp -a scrolls/brands-gateways-epic/phase34-scripts tmp/phase34`.
2. Per package: `node tmp/phase34/b18-adapter-result/run.cjs --pkgs=<pkg> --sample-out=tmp/b18-sample-<pkg> --leftovers=tmp/b18-left-<pkg>.json`.
   It writes copies only. Prove them with `lib/verify-sample.cjs --check=...` (see the script's header), then copy the
   sample tree over `packages/` with plain `cp -a` (an overwrite, no deletion). The script matches imports by the
   imported NAME (`AdapterResult`, `adapterResultContract`, `AdapterResultStub`), never by module specifier, so it
   works on barrel imports and on 3.3's per-file imports alike.
3. **A per-package run converts more than the whole-repo run.** Measured: `--pkgs=orchestrator` converts all 46 of
   orchestrator's functions (the whole-repo run converts 41 and leaves `guildRemoveBroker`, `questDeleteBroker`,
   `GuildRemoveResponder`, the `GuildFlow.remove` slot and the `removeGuild` slot), because a caller in another package
   that parses or forwards the value is out of that run's sight. So per-package runs are safe only for packages no
   other package's forwarder or parse depends on. The hand queue below is written for the whole-repo leftover set;
   after each per-package run, diff its `converted` count against the whole-repo figure (table below). A larger number
   means the run took a hand-queue function, and its dependents' typecheck goes red until that hand batch lands.
4. Every run is typecheck-proof only. `unit` runs before each package's commit (README row `b18-adapter-result`).

### Script order and gate

Dependency order, leaf packages first. `converted` is what the whole-repo run gives that package.

| # | Package | functions / converted | Files the script rewrites | Gate (`npm run ward -- --only lint,typecheck,unit -- packages/<pkg>`; dependents get `--only typecheck,unit`) |
|---|---|---|---|---|
| 1 | `testing` | 1 / 1 | 1 | testing |
| 2 | `config` | 1 / 1 | 1 | config + orchestrator, siegelense, ward (typecheck,unit) |
| 3 | `session-forensics` | 1 / 1 | 1 | session-forensics |
| 4 | `tooling` | 6 / 6 | 4 | tooling |
| 5 | `hooks` | 13 / 13 | 14 | hooks |
| 6 | `eslint-plugin` | 17 / 17 | 19 | eslint-plugin + local-eslint, mcp (typecheck,unit) |
| 7 | `ward` | 16 / 16 | 23 | ward + mcp (typecheck,unit) |
| 8 | `web` | 12 / 12 | 21 | web |
| 9 | `orchestrator` | 46 / 41 | 53 | orchestrator + cli, hydration-recipes, mcp, server (typecheck,unit) |
| 10 | `hydration-recipes` | 9 / 8 | 14 | hydration-recipes + server, web (typecheck,unit) |
| 11 | `server` | 6 / 6 | 8 | server + cli (typecheck,unit) |
| 12 | `mcp` | 4 / 4 | 6 | mcp |
| 13 | `cli` | 7 / 3 | 5 | cli + siegelense (typecheck,unit) |
| 14 | `siegelense` | 35 / 34 | 46 | siegelense |

`shared`, `hydration` and `local-eslint` have no function to convert; `shared` is edited only by the last step. Linked
group: run orchestrator, hydration-recipes, server and mcp in that order as one wave and gate them together at the end
of it (orchestrator's `StartOrchestrator` methods are what server and mcp forward, and `start-orchestrator.proxy.ts`
is composed by server and mcp proxies), so a red between two of them is expected and is not a stop. cli and
siegelense reach each other only through `dynamicImport`, which types nothing, so their order is free.

### Files the script rewrites (per package, from `tmp/b18-sample`)

Each package's list is its agent's complete scope for the script step. Hand-queue files appear here too when the
script also edits them; the hand batch then starts from the script's output.


**testing** (1 files)

- `packages/testing/src/brokers/integration-environment/cleanup-all/integration-environment-cleanup-all-broker.ts`

**config** (1 files)

- `packages/config/src/brokers/config/resolve/find-parent-configs-layer-broker.ts`

**session-forensics** (1 files)

- `packages/session-forensics/src/startup/start-session-forensics.ts`

**tooling** (4 files)

- `packages/tooling/src/responders/adapter-census/run/adapter-census-run-responder.ts`
- `packages/tooling/src/responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder.ts`
- `packages/tooling/src/startup/start-adapter-census.ts`
- `packages/tooling/src/startup/start-primitive-duplicate-detection.ts`

**hooks** (14 files)

- `packages/hooks/src/brokers/install/agents-setup/install-agents-setup-broker.test.ts`
- `packages/hooks/src/brokers/install/agents-setup/install-agents-setup-broker.ts`
- `packages/hooks/src/startup/start-agy-pre-tool-hook.ts`
- `packages/hooks/src/startup/start-agy-stop-hook.ts`
- `packages/hooks/src/startup/start-post-ask-question-hook.ts`
- `packages/hooks/src/startup/start-post-edit-hook.ts`
- `packages/hooks/src/startup/start-pre-bash-hook.ts`
- `packages/hooks/src/startup/start-pre-edit-hook.ts`
- `packages/hooks/src/startup/start-pre-folder-detail-hook.ts`
- `packages/hooks/src/startup/start-pre-mcp-caller-hook.ts`
- `packages/hooks/src/startup/start-pre-search-hook.ts`
- `packages/hooks/src/startup/start-session-snippet-hook.ts`
- `packages/hooks/src/startup/start-subagent-stop-hook.ts`
- `packages/hooks/src/startup/start-worktree-create-hook.ts`

**eslint-plugin** (19 files)

- `packages/eslint-plugin/src/brokers/rule/ban-primitives/check-primitive-violation-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/ban-unknown-payload-in-discriminated-union/check-discriminated-union-variants-layer-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/ban-unknown-payload-in-discriminated-union/check-discriminated-union-variants-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/report-bin-program-spawn-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-harness-patterns/validate-harness-constructor-side-effects-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-project-structure/validate-export-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-param-binding/check-unbound-type-properties-layer-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-param-binding/check-unbound-type-properties-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-no-exposed-child-proxies-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-object-expression-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-constructor-side-effects-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-function-return-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-return-statement-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/gateway-return-unknown-not-caller-type/check-any-leak-return-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/gateway-schema-brand/check-schema-brand-text-layer-broker.ts`
- `packages/eslint-plugin/src/transformers/eslint-rules-disable-conflicts/eslint-rules-disable-conflicts-transformer.ts`
- `packages/eslint-plugin/src/transformers/validate-function-params-use-object-destructuring/validate-function-params-use-object-destructuring-transformer.ts`

**ward** (23 files)

- `packages/ward/src/brokers/command/detail/command-detail-broker.ts`
- `packages/ward/src/brokers/command/list/command-list-broker.ts`
- `packages/ward/src/brokers/command/raw/command-raw-broker.ts`
- `packages/ward/src/brokers/command/run/command-run-broker.ts`
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.test.ts`
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts`
- `packages/ward/src/brokers/e2e-artifacts/remove/e2e-artifacts-remove-broker.test.ts`
- `packages/ward/src/brokers/e2e-artifacts/remove/e2e-artifacts-remove-broker.ts`
- `packages/ward/src/brokers/jest-cache/prune/jest-cache-prune-broker.test.ts`
- `packages/ward/src/brokers/jest-cache/prune/jest-cache-prune-broker.ts`
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.test.ts`
- `packages/ward/src/brokers/storage/prune/storage-prune-broker.ts`
- `packages/ward/src/brokers/storage/save/storage-save-broker.test.ts`
- `packages/ward/src/brokers/storage/save/storage-save-broker.ts`
- `packages/ward/src/flows/ward/ward-flow.integration.test.ts`
- `packages/ward/src/flows/ward/ward-flow.ts`
- `packages/ward/src/responders/ward/detail/ward-detail-responder.ts`
- `packages/ward/src/responders/ward/list/ward-list-responder.ts`
- `packages/ward/src/responders/ward/raw/ward-raw-responder.ts`
- `packages/ward/src/responders/ward/run/ward-run-responder.ts`
- `packages/ward/src/responders/ward/scan/ward-scan-responder.ts`
- `packages/ward/src/startup/start-ward.integration.test.ts`
- `packages/ward/src/startup/start-ward.ts`

**web** (21 files)

- `packages/web/src/bindings/use-comment-queue-sweep/use-comment-queue-sweep-binding.test.ts`
- `packages/web/src/bindings/use-comment-queue-sweep/use-comment-queue-sweep-binding.ts`
- `packages/web/src/brokers/composer/insert-image/composer-insert-image-broker.test.ts`
- `packages/web/src/brokers/composer/insert-image/composer-insert-image-broker.ts`
- `packages/web/src/brokers/composer/insert-text/composer-insert-text-broker.test.ts`
- `packages/web/src/brokers/composer/insert-text/composer-insert-text-broker.ts`
- `packages/web/src/brokers/composer/write/composer-write-broker.test.ts`
- `packages/web/src/brokers/composer/write/composer-write-broker.ts`
- `packages/web/src/brokers/draft-images/read/migrate-legacy-records-layer-broker.test.ts`
- `packages/web/src/brokers/draft-images/read/migrate-legacy-records-layer-broker.ts`
- `packages/web/src/brokers/draft-images/save/draft-images-save-broker.test.ts`
- `packages/web/src/brokers/draft-images/save/draft-images-save-broker.ts`
- `packages/web/src/brokers/quest/modify/quest-modify-broker.test.ts`
- `packages/web/src/brokers/quest/modify/quest-modify-broker.ts`
- `packages/web/src/brokers/react-root/mount/react-root-mount-broker.ts`
- `packages/web/src/flows/app-mount/app-mount-flow.tsx`
- `packages/web/src/responders/app/mount/app-mount-responder.test.ts`
- `packages/web/src/responders/app/mount/app-mount-responder.ts`
- `packages/web/src/responders/web-socket-channel/connect/web-socket-channel-connect-responder.test.ts`
- `packages/web/src/responders/web-socket-channel/connect/web-socket-channel-connect-responder.ts`
- `packages/web/src/startup/start-app.ts`

**orchestrator** (53 files)

- `packages/orchestrator/src/brokers/chat/history-replay/chat-history-replay-broker.test.ts`
- `packages/orchestrator/src/brokers/chat/history-replay/chat-history-replay-broker.ts`
- `packages/orchestrator/src/brokers/guild-config/write/guild-config-write-broker.ts`
- `packages/orchestrator/src/brokers/planned-work/write/planned-work-write-broker.test.ts`
- `packages/orchestrator/src/brokers/planned-work/write/planned-work-write-broker.ts`
- `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.ts`
- `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/start-subagent-tail-layer-broker.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-batch-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-batch-layer-broker.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-one-agent-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-one-agent-layer-broker.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.ts`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/run-chat-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/run-chat-layer-broker.ts`
- `packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts`
- `packages/orchestrator/src/brokers/quest/persist/quest-persist-broker.ts`
- `packages/orchestrator/src/brokers/quest/queue-sync-listener/process-sync-event-layer-broker.proxy.ts`
- `packages/orchestrator/src/brokers/quest/queue-sync-listener/process-sync-event-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/queue-sync-listener/process-sync-event-layer-broker.ts`
- `packages/orchestrator/src/brokers/riftcarver/persist-result/riftcarver-persist-result-broker.test.ts`
- `packages/orchestrator/src/brokers/riftcarver/persist-result/riftcarver-persist-result-broker.ts`
- `packages/orchestrator/src/brokers/smoketest/post-terminal-listener/process-terminal-event-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/smoketest/post-terminal-listener/process-terminal-event-layer-broker.ts`
- `packages/orchestrator/src/brokers/smoketest/scenario-driver/smoketest-sweep-pending-work-items-layer-broker.ts`
- `packages/orchestrator/src/brokers/smoketest/sign-outstanding-units/smoketest-sign-outstanding-units-broker.ts`
- `packages/orchestrator/src/brokers/smoketest/stamp-override/smoketest-stamp-override-broker.ts`
- `packages/orchestrator/src/brokers/smoketest/teardown-quest/smoketest-teardown-quest-broker.test.ts`
- `packages/orchestrator/src/brokers/smoketest/teardown-quest/smoketest-teardown-quest-broker.ts`
- `packages/orchestrator/src/brokers/ward/persist-result/ward-persist-result-broker.test.ts`
- `packages/orchestrator/src/brokers/ward/persist-result/ward-persist-result-broker.ts`
- `packages/orchestrator/src/brokers/worktree/populate-node-modules/worktree-populate-node-modules-broker.test.ts`
- `packages/orchestrator/src/brokers/worktree/populate-node-modules/worktree-populate-node-modules-broker.ts`
- `packages/orchestrator/src/brokers/worktree/seed-dist/worktree-seed-dist-broker.test.ts`
- `packages/orchestrator/src/brokers/worktree/seed-dist/worktree-seed-dist-broker.ts`
- `packages/orchestrator/src/brokers/worktree/verify-links/worktree-verify-links-broker.test.ts`
- `packages/orchestrator/src/brokers/worktree/verify-links/worktree-verify-links-broker.ts`
- `packages/orchestrator/src/contracts/node-dispatch-runner/node-dispatch-runner-contract.ts`
- `packages/orchestrator/src/flows/chat-stop-all/chat-stop-all-flow.ts`
- `packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts`
- `packages/orchestrator/src/responders/chat/stop-all/chat-stop-all-responder.ts`
- `packages/orchestrator/src/responders/clarify/answer/clarify-answer-responder.ts`
- `packages/orchestrator/src/responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.ts`
- `packages/orchestrator/src/responders/quest/handle-signal-back/quest-handle-signal-back-responder.integration.test.ts`
- `packages/orchestrator/src/responders/quest/handle-signal-back/quest-handle-signal-back-responder.test.ts`
- `packages/orchestrator/src/responders/quest/handle-signal-back/quest-handle-signal-back-responder.ts`
- `packages/orchestrator/src/responders/smoketest/run/overwrite-work-items-layer-responder.proxy.ts`
- `packages/orchestrator/src/responders/smoketest/run/overwrite-work-items-layer-responder.ts`
- `packages/orchestrator/src/startup/start-orchestrator.ts`

**hydration-recipes** (14 files)

- `packages/hydration-recipes/src/brokers/guild/directory-ensure/guild-directory-ensure-broker.ts`
- `packages/hydration-recipes/src/brokers/operation/remove-route/operation-remove-route-broker.test.ts`
- `packages/hydration-recipes/src/brokers/operation/remove-route/operation-remove-route-broker.ts`
- `packages/hydration-recipes/src/brokers/quest/corrupt-to-legacy-schema/quest-corrupt-to-legacy-schema-broker.ts`
- `packages/hydration-recipes/src/brokers/quest/persist-direct/quest-persist-direct-broker.test.ts`
- `packages/hydration-recipes/src/brokers/quest/persist-direct/quest-persist-direct-broker.ts`
- `packages/hydration-recipes/src/brokers/quest/ward-result-detail-write/quest-ward-result-detail-write-broker.test.ts`
- `packages/hydration-recipes/src/brokers/quest/ward-result-detail-write/quest-ward-result-detail-write-broker.ts`
- `packages/hydration-recipes/src/brokers/session/nested-chain/session-nested-chain-broker.test.ts`
- `packages/hydration-recipes/src/brokers/session/nested-chain/session-nested-chain-broker.ts`
- `packages/hydration-recipes/src/brokers/session/remove-route/session-remove-route-broker.test.ts`
- `packages/hydration-recipes/src/brokers/session/remove-route/session-remove-route-broker.ts`
- `packages/hydration-recipes/src/brokers/subagent/remove-route/subagent-remove-route-broker.test.ts`
- `packages/hydration-recipes/src/brokers/subagent/remove-route/subagent-remove-route-broker.ts`

**server** (8 files)

- `packages/server/src/brokers/process/dev-log/process-dev-log-broker.ts`
- `packages/server/src/flows/graph-reachability-boot/graph-reachability-boot-flow.integration.test.ts`
- `packages/server/src/flows/graph-reachability-boot/graph-reachability-boot-flow.ts`
- `packages/server/src/flows/server/server-flow.ts`
- `packages/server/src/responders/graph-reachability/check/graph-reachability-check-responder.test.ts`
- `packages/server/src/responders/graph-reachability/check/graph-reachability-check-responder.ts`
- `packages/server/src/responders/server/init/server-init-responder.ts`
- `packages/server/src/startup/start-server.ts`

**mcp** (6 files)

- `packages/mcp/src/brokers/agents/plugin-create/agents-plugin-create-broker.test.ts`
- `packages/mcp/src/brokers/agents/plugin-create/agents-plugin-create-broker.ts`
- `packages/mcp/src/flows/mcp-server/mcp-server-flow.ts`
- `packages/mcp/src/responders/server/init/server-init-responder.test.ts`
- `packages/mcp/src/responders/server/init/server-init-responder.ts`
- `packages/mcp/src/startup/start-mcp-server.ts`

**cli** (5 files)

- `packages/cli/src/responders/cli/init/cli-init-responder.ts`
- `packages/cli/src/responders/cli/serve/cli-serve-responder.test.ts`
- `packages/cli/src/responders/cli/serve/cli-serve-responder.ts`
- `packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.test.ts`
- `packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.ts`

**siegelense** (46 files)

- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.test.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.test.ts`
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts`
- `packages/siegelense/src/brokers/registry/lock-release/registry-lock-release-broker.test.ts`
- `packages/siegelense/src/brokers/registry/lock-release/registry-lock-release-broker.ts`
- `packages/siegelense/src/brokers/step/target-resolve/step-target-resolve-broker.test.ts`
- `packages/siegelense/src/brokers/step/target-resolve/step-target-resolve-broker.ts`
- `packages/siegelense/src/flows/driver/driver-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-capacity-layer-flow.integration.test.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-capacity-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-cleanup-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-compare-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-docs-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-kill-layer-flow.integration.test.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-kill-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-prune-layer-flow.integration.test.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-prune-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-recipes-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-results-layer-flow.integration.test.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-results-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-run-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-snapshots-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-start-layer-flow.ts`
- `packages/siegelense/src/flows/siegelense/siegelense-status-layer-flow.ts`
- `packages/siegelense/src/responders/siegelense/capacity/siegelense-capacity-responder.test.ts`
- `packages/siegelense/src/responders/siegelense/capacity/siegelense-capacity-responder.ts`
- `packages/siegelense/src/responders/siegelense/cleanup/siegelense-cleanup-responder.ts`
- `packages/siegelense/src/responders/siegelense/compare/siegelense-compare-responder.ts`
- `packages/siegelense/src/responders/siegelense/docs/siegelense-docs-responder.test.ts`
- `packages/siegelense/src/responders/siegelense/docs/siegelense-docs-responder.ts`
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.ts`
- `packages/siegelense/src/responders/siegelense/driver/siegelense-driver-responder.ts`
- `packages/siegelense/src/responders/siegelense/kill/siegelense-kill-responder.ts`
- `packages/siegelense/src/responders/siegelense/prune/siegelense-prune-responder.test.ts`
- `packages/siegelense/src/responders/siegelense/prune/siegelense-prune-responder.ts`
- `packages/siegelense/src/responders/siegelense/recipes/siegelense-recipes-responder.ts`
- `packages/siegelense/src/responders/siegelense/results/siegelense-results-responder.ts`
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.ts`
- `packages/siegelense/src/responders/siegelense/snapshots/siegelense-snapshots-responder.ts`
- `packages/siegelense/src/responders/siegelense/start/siegelense-start-responder.ts`
- `packages/siegelense/src/responders/siegelense/status/siegelense-status-responder.ts`
- `packages/siegelense/src/startup/start-siegelense-driver.ts`
- `packages/siegelense/src/startup/start-siegelense.ts`

### Hand queue, in batches of 2-4 files

Every batch: run after that package's script step, then `npm run ward -- --only lint,typecheck,unit -- <the batch files>`.
The rule for what a function returns instead: it returns what its calls told it, and `void` when they told it nothing
(R1, "Why" above). No batch below invents a value.

**cli** (5 batches)

- **B18b-cli-1** `packages/cli/src/contracts/siegelense-module/siegelense-module-contract.ts`, `packages/cli/src/contracts/siegelense-module/siegelense-module.stub.ts`, `packages/cli/src/contracts/siegelense-module/siegelense-module-contract.test.ts`. `StartSiegelenseFn` becomes `(params) => Promise<void>`; the stub's `StartSiegelense` resolves `undefined`; the contract test's line 18 asserts `toBeUndefined()` and its title says "resolving undefined".
- **B18b-cli-2** `packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.ts`, `packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.test.ts`. `CliSiegelenseResponder` returns `Promise<void>`. What replaces `adapterResultContract.parse(result)`: nothing. `StartSiegelense` is the module contract's own `Promise<void>` function, so the responder ends at `await siegelenseModule.StartSiegelense({ args });`, and the parse's runtime check is gone because a `void` result has no shape to check (the module contract already checks that the export is a function). The test's seven `jest.fn().mockResolvedValue({ success: true })` become `mockResolvedValue(undefined)`.
- **B18b-cli-3** `packages/cli/src/contracts/start-server-module/start-server-module-contract.ts`, `packages/cli/src/contracts/start-server-module/start-server-module.stub.ts`, `packages/cli/src/contracts/start-server-module/start-server-module-contract.test.ts`. `StartServerFn` returns `void` (the script converts `StartServer` in server); the stub's `StartServer: () => undefined`; the test's line 18 asserts `toBeUndefined()`.
- **B18b-cli-4** `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts`, `packages/cli/src/responders/cli/create-package/cli-create-package-responder.test.ts`. `CliCreatePackageResponder` returns `Promise<void>`: the dry-run branch is a bare `return;`, the tail returns nothing. Every call it makes returns either `void` (`stdout.write`) or a value it already uses (`writtenFiles`, `registered`). Five asserts (lines 39, 87, 132, 178, 356) become `toBeUndefined()`.
- **B18b-cli-5** `packages/cli/src/flows/cli/cli-flow.ts`, `packages/cli/src/startup/start-cli.ts`, `packages/cli/src/flows/cli/cli-flow.integration.test.ts`, `packages/cli/src/startup/start-cli.integration.test.ts`. `CliFlow` and `StartCli` return `Promise<void>`. The `init`, `statusline-tap` and `start` branches drop their `return adapterResultContract.parse(...)`; the `create-package` and `siegelense` branches return their responder's promise. Read both integration tests for a `.resolves` on the old constant and assert `toBeUndefined()`.

**hydration-recipes** (2 batches)

- **B18b-hr-1** `packages/hydration-recipes/src/brokers/guild/remove-route/guild-remove-route-broker.ts`, `packages/hydration-recipes/src/brokers/guild/remove-route/guild-remove-route-broker.test.ts`, `packages/hydration-recipes/src/brokers/guild/remove-route/guild-remove-route-broker.proxy.ts`. Returns `Promise<void>`. What replaces `adapterResultContract.parse(body)` on the HTTP branch: the `dmHttpResponseUnwrapTransformer({ response, url })` call stays as a bare statement, because that transformer is what throws on a non-2xx response; its body is `{ success: true }` (`GuildRemoveResponder`'s reply) and says nothing further, so nothing parses it. The in-process branch is `await guildRemoveBroker({ guildId });`. The test's asserts at lines 17, 41, 57 become `toBeUndefined()`; the proxy needs no edit unless it types a resolved value (read it).
- **B18b-hr-2** `packages/hydration-recipes/src/brokers/quest/remove-route/quest-remove-route-broker.ts`, `packages/hydration-recipes/src/brokers/quest/remove-route/quest-remove-route-broker.test.ts`. Not in `leftovers.json` and it reads `.success` (SD10's case): `const { success } = await questDeleteBroker(...)` cannot compile once `questDeleteBroker` is `void`. Becomes `await questDeleteBroker({ questId, guildId }); return { deleted: true };`. Decision for the agent to report: `rm` with `force: true` and the outbox append tell `questDeleteBroker` nothing, so `deleted: true` restates "it did not throw"; if the route's return contract lets the field go, drop it instead.

**orchestrator** (4 batches)

- **B18b-orch-1** `packages/orchestrator/src/brokers/guild/remove/guild-remove-broker.ts`, `packages/orchestrator/src/brokers/guild/remove/guild-remove-broker.test.ts`. `Promise<void>`; its calls (`guildConfigReadBroker`, `guildConfigWriteBroker`) already return `void` or are used; the not-found case still throws `GuildNotFoundError`. Test lines 22 and 43 become `.resolves.toBeUndefined()`.
- **B18b-orch-2** `packages/orchestrator/src/brokers/quest/delete/quest-delete-broker.ts`, `packages/orchestrator/src/brokers/quest/delete/quest-delete-broker.test.ts`. Returns `Promise<void>` (drop `{ success: true as const }`); test lines 20 and 39 become `toBeUndefined()`. Callers `orchestration-delete-responder.ts` and `smoketest-clear-prior-quests-broker.ts` are script files.
- **B18b-orch-3** `packages/orchestrator/src/responders/guild/remove/guild-remove-responder.ts`, `packages/orchestrator/src/responders/guild/remove/guild-remove-responder.test.ts`, `packages/orchestrator/src/startup/start-orchestrator.ts`. The responder ends `await guildRemoveBroker({ guildId });` and returns `Promise<void>`; the test at line 16 becomes `.resolves.toBeUndefined()`; `removeGuild` (line 121) returns `Promise<void>`. `packages/orchestrator/src/flows/guild/guild-flow.ts` line 39 needs no edit: its `RemoveResult` is `Awaited<ReturnType<typeof GuildRemoveResponder>>`, so it follows.
- **B18b-orch-4** `packages/orchestrator/src/contracts/node-dispatch-runner/node-dispatch-runner.stub.ts`, `packages/orchestrator/src/brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.proxy.ts`, `packages/orchestrator/src/startup/start-orchestrator.proxy.ts`, `packages/orchestrator/src/brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.test.ts`. The controller stub's `start`, `stop` and `kick` return `undefined` (`kick` resolves `undefined`); the loop proxy's `spawnBatchMock` resolves `undefined`; `start-orchestrator.proxy.ts` drops its `AdapterResult` alias (line 74) and the `result: AdapterResult` parameters (lines 301, 935) of the `handleSignalBack` staging, whose mock resolves `undefined`; the runner test replaces its ten `AdapterResultStub()` uses with `undefined`. Lands together with B18b-server-1 and B18b-mcp-1, which pass `result:` into that staging.

**server** (1 batch)

- **B18b-server-1** `packages/server/src/responders/quest/signal-back/quest-signal-back-responder.proxy.ts`, `packages/server/src/responders/quest/signal-back/quest-signal-back-responder.test.ts`. Drop the `AdapterResult` alias and the `result` parameter; the test stops passing `result: AdapterResultStub()`.

**mcp** (1 batch)

- **B18b-mcp-1** `packages/mcp/src/responders/interaction/handle/interaction-handle-responder.proxy.ts`, `packages/mcp/src/responders/interaction/handle/interaction-handle-responder.test.ts`. `handleSignalBackResolves({ result: AdapterResultStub() })` becomes `handleSignalBackResolves()`; read the test for the same argument.

**siegelense** (4 batches)

- **B18b-sg-1** `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.ts`, `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.test.ts`, `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.proxy.ts`. `driverHeartbeatTickBroker` returns `Promise<void>` (its `heartbeatWriteBroker` result is used inside; the sampler `.catch` swallows nothing new). The caller the script refused, `const firstBeat = driverHeartbeatTickBroker(...).catch(...)` in `driver-serve-layer-responder.ts` line 128, only awaits the promise (lines 175, 203), so it needs no change beyond the script's. The tests' asserts at lines 36 and 114 become `.toBeUndefined()`; the proxy's `heartbeatTickHandle.calledWith(...).resolves({ success: true })` (line 121) becomes `.resolves(undefined)`.
- **B18b-sg-2** `packages/siegelense/src/flows/siegelense/siegelense-prune-layer-flow.integration.test.ts`. The five asserts (lines 517, 540, 561, 582, 605) read a prune flow result that is `void` once the script lands; assert `toBeUndefined()` after confirming each subject's type in the typechecker.

**web** (1 batch)

- **B18b-web-1** `packages/web/src/responders/web-socket-channel/connect/web-socket-channel-connect-responder.test.ts`. Its `AdapterResult` mention is a live line, not a comment: replace with `undefined` per the responder's converted signature.

**eslint-plugin and shared fixtures** (1 batch each)

- **B18b-ep-1** `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.test.ts`, `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts`. Two live `AdapterResult` lines in the test (fixture strings) and one comment in the broker. Rewrite the fixtures to a plain `boolean` or `void` return, and the comment to say what the rule reports now.
- **B18b-sh-1** `packages/shared/src/transformers/hook-flow-import-extract/hook-flow-import-extract-transformer.test.ts`. Two fixture-string lines name `adapterResultContract`; replace with another contract name so the last step's scan is clean.

**Comment-only files** (19 files, 5 batches; each comment states what the function returns now, in the present tense, no history)

- **B18b-c-1** `packages/eslint-plugin/src/brokers/rule/ban-unknown-payload-in-discriminated-union/check-discriminated-union-variants-layer-broker.ts`, `packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/report-bin-program-spawn-layer-broker.ts`, `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.ts`, `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/start-subagent-tail-layer-broker.ts`
- **B18b-c-2** `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts`, `packages/siegelense/src/flows/siegelense/siegelense-capacity-layer-flow.ts`, `packages/siegelense/src/flows/siegelense/siegelense-cleanup-layer-flow.ts`, `packages/siegelense/src/flows/siegelense/siegelense-compare-layer-flow.ts`
- **B18b-c-3** `packages/siegelense/src/flows/siegelense/siegelense-docs-layer-flow.ts`, `packages/siegelense/src/flows/siegelense/siegelense-prune-layer-flow.ts`, `packages/siegelense/src/flows/siegelense/siegelense-recipes-layer-flow.ts`, `packages/siegelense/src/flows/siegelense/siegelense-results-layer-flow.ts`
- **B18b-c-4** `packages/siegelense/src/flows/siegelense/siegelense-run-layer-flow.ts`, `packages/siegelense/src/flows/siegelense/siegelense-snapshots-layer-flow.ts`, `packages/siegelense/src/flows/siegelense/siegelense-status-layer-flow.ts`, `packages/siegelense/src/startup/start-siegelense-driver.ts`
- **B18b-c-5** `packages/web/src/brokers/draft-images/read/migrate-legacy-records-layer-broker.ts`, `packages/web/src/brokers/draft-images/save/draft-images-save-broker.ts`

Batch count per package: cli 5, hydration-recipes 2, orchestrator 4, server 1, mcp 1, siegelense 2 (plus comments), web 1 (plus comments), eslint-plugin 1, shared 1, comment-only 5. Total 23. Every other package (config, hooks, session-forensics, testing, tooling, ward) is script-only.

Asserts left alone on purpose (`{ success: true }` belongs to another contract; 50 in the run): `quest-modify-broker.test.ts` (17 asserts), `quest-modify-or-throw-broker.test.ts`, `quest-work-item-insert-broker.test.ts` (F54 returns `ModifyQuestResult`), `mcp-server-flow.integration.test.ts` (3, modify-quest tool JSON), `content-item-agent-id-set-at-index-transformer.test.ts`, and the `add-quest-result`, `modify-quest-result`, `get-quest-status-result`, `quest-modify-response` contract tests. Read each once: a subject that turns out to be `void` is a batch miss, not a leave.

### Last step: remove `adapterResultContract`

Runs only after every batch above is merged and this scan is empty (python `os.walk` over `packages/`, regex
`AdapterResult|adapterResult|adapter-result`, excluding `node_modules`, `dist`, `.ward`) apart from the contract's own
folder, `packages/shared/contracts.ts` (or, after 3.3-S1, `packages/shared/src/contracts/contracts.ts`), and
`packages/mcp/src/statics/folder-constraints/adapters-constraints.md` (three lines; teaching text, Z03's).

1. `mkdir -p tmp/deletions/b18/packages/shared/src/contracts/adapter-result`.
2. `mv` each of `packages/shared/src/contracts/adapter-result/adapter-result-contract.ts`, `adapter-result-contract.test.ts`, `adapter-result.stub.ts`, `adapter-result.stub.test.ts` to that folder (rule 20; no `rm`). Report them under DELETIONS.
3. Drop the two barrel lines, `export * from './src/contracts/adapter-result/adapter-result-contract';` and `export * from './src/contracts/adapter-result/adapter-result.stub';` (lines 417 and 418 of `packages/shared/contracts.ts` today).
4. Gate: `npm run ward -- --only lint,typecheck,unit -- packages/shared`, then `--only typecheck,unit` on every other package. Then the operator runs `npm run build:clean` and `npm run check:consumer` (the contract is published API of `@dungeonmaster/shared/contracts`).

### Collisions with wave 3.3

3.3-S1 and S2 rewrite import lines in every package; B18-b edits the same lines (it drops `AdapterResult`,
`adapterResultContract` and `AdapterResultStub` from named imports) and the same test and proxy files. Two runs on one
file must go in sequence, and the second starts from the first's output. Recommended: **B18-b after 3.3, per package,
right after that package's S3.** The script keys on names, so it works on per-file imports.

| Where | Collides with 3.3? |
|---|---|
| Script step, every package | Yes: every rewritten file imports from `@dungeonmaster/shared/contracts` or its stub. Run after that package's S2/S3. 3.3 groups: shared; config, hydration, session-forensics, eslint-plugin, local-eslint, tooling, testing; orchestrator, hydration-recipes, siegelense, ward, hooks; cli, mcp, server, web. |
| B18b-cli-1, cli-3 | Yes: the two module stubs import `AdapterResultStub` from shared (S2 and SD2 rewrite stub imports). |
| B18b-cli-2, cli-4, cli-5, hr-1, orch-1, orch-2, orch-3, sg-1 | Yes: each source file imports `AdapterResult` and `adapterResultContract` from the barrel. |
| B18b-orch-4, server-1, mcp-1, web-1 | Yes: proxy, stub and test imports of `AdapterResultStub` (3.3-S3 also deletes `testing.ts` barrels these proxies may sit behind). |
| B18b-hr-2, sg-2 | No: neither imports the contract. |
| B18b-ep-1, sh-1 | Partly: strings only, but `check-folder-return-type-layer-broker.test.ts` is also eslint-plugin's L2 (`TSESTree` retype) territory; run it after L2 or before, never beside it. |
| B18b-c-1 to c-5 | No: comments only, no import line. Runnable in any free slot, including during 3.3. |
| Last step | Yes: 3.3-S1 for `shared` moves the contracts barrel into `src/contracts/`, and B18-b's `shared` edit must follow it there. Run it last of everything, after 3.3-R. |

### What in the old text no longer matches

- The split (b) census above lists `src/adapters/` files in "deferred" packages. No package has `src/adapters/` now (A19); those files are gateway wrappers or brokers, or gone.
- Figures: "116 of 118", "87 adapter tests", "~143 usages across 11 packages" (this file), "156 candidate functions, 38 by script" (EPIC row B18 and the Filler lane) and "172 / 161 / 213 files" (EPIC row SD10, README) are all superseded by the numbers at the top of this plan: 174 / 163 / 216, on a tree that moved.
- The row-SD10 "1 diagnostic left (the orchestrator `node-dispatch-runner.stub.ts:10`)" no longer shows: this run reports 0. The stub still names `adapterResultContract`, so it stays in B18b-orch-4 for the scan, not for a diagnostic.
- Work items 1, 2, 7 and 8 (rule rewrite, `pre-edit` tag, `StartOrchestrator.bootstrap()`) are split (a), done. F54 (the `Plan — F54 and F53` section) is applied in the tree: `quest-advance-broker`, `quest-session-record-broker` return `Promise<boolean>` and `quest-work-item-insert-broker` returns `ModifyQuestResult`, so the script does not touch them and they are not in this queue.
- "Delete `adapterResultContract`" (item step 6) is rule 20's move to `tmp/deletions/`, not a delete.
