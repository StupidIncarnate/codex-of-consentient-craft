# B18: a function returns what its calls told it, and `void` only when they told it nothing

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

