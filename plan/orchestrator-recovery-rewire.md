# Plan: Re-wire failure recovery + Siegemaster dev-server into the `/dumpster-launch` model

**Status:** awaiting approval. No code written yet.
**Scope this session:** Tier 1 recovery (ward → spiritmender) + Tier 4 splice primitive + Tier 2 dev-server for
Siegemaster.
**Architecture (confirmed by user):** Recovery is signalled through the MCP orchestrator. The terminal-failure setter
splices recovery work items into `quest.workItems[]`; the next `get-next-step()` call returns "spawn spiritmender(s)"
exactly as it returns any other ready item. `get-next-step` stays a pure function of work-item state. The dead
in-process loop stays dead.

---

## 1. Root cause (recap)

Commit `99fbf998` ("pivot orchestration to /dumpster-launch monitor session model", 2026-05-27) moved dispatch into the
user's session and **left the entire recovery apparatus on disk but unwired.** Because a `failed` work item *satisfies*
`dependsOn` (`satisfiesDependencyWorkItemStatusGuard = {complete, failed}`), the chain runs straight past every failure.
Ward fails → siegemaster's `dependsOn:[wardId]` is satisfied → siegemaster dispatches. No spiritmender is ever created
because nothing on the live path creates recovery items.

The live terminal-status setters today:

- `quest-run-ward-broker.ts` — marks ward `complete`/`failed`, persists result. **No recovery.**
- `quest-handle-signal-back-responder.ts` — marks agent items terminal; fires post-walk hook only. **No recovery.** (
  `failed-replan` is collapsed to `failed`.)

The docs predicted exactly this: *"When recovery routing returns, it will hang off the signal-back handler and the
run-ward broker — the two places that currently set terminal status."*

---

## 2. Reusable assets that already exist (do not rewrite)

| Asset                     | Path                                                                                | Reuse                                                                                                                                  |
|---------------------------|-------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| **Recovery template**     | `brokers/quest/orchestration-loop/run-ward-layer-broker.ts:155-308`                 | The exact ward-fail → batched spiritmenders + ward-retry + dep-rewire logic. Port into the live broker.                                |
| **Splice primitive**      | `brokers/quest/work-item-insert/quest-work-item-insert-broker.ts`                   | `replacementMapping` (rewire downstream `dependsOn` old→new) + append. Already pure & tested. **Currently unreferenced — re-wire it.** |
| **Batch builder**         | `transformers/ward-detail-to-spiritmender-batches/`                                 | ward detail JSON → size-N file/error batches.                                                                                          |
| **Spiritmender context**  | `statics/spiritmender-context/spiritmender-context-statics.ts`                      | `wardFailure` vs `postBlightwardenFailure` instruction preambles.                                                                      |
| **Spiritmender prompt**   | `statics/spiritmender-prompt/spiritmender-prompt-statics.ts`                        | Template already reads "Files / Errors / Verification Command / Instructions". No change.                                              |
| **WorkUnit render**       | `transformers/work-unit-to-arguments/work-unit-to-arguments-transformer.ts:241-273` | Spiritmender arg-render **already supports** `filePaths`, `errors`, `verificationCommand`, `contextInstructions`. No change.           |
| **Work-item contract**    | `shared/.../work-item/work-item-contract.ts`                                        | Has `attempt`, `maxAttempts`, `errorMessage`, `insertedBy`, `wardMode`. **No contract change.**                                        |
| **Retry/batch constants** | `statics/slot-manager/slot-manager-statics.ts`                                      | `ward.maxRetries`, `ward.spiritmenderBatchSize`.                                                                                       |

---

## 3. The real new work (NOT a straight port)

A naive port throws. Three genuine gaps:

**G1 — Spiritmender prompt delivery mismatch.**
`workItemToPromptTransformer` (`transformers/work-item-to-prompt/...ts:127-145`) requires a spiritmender work item to
carry a **`steps/<id>`** relatedDataItem and builds the WorkUnit from a single step. But ward-recovery spiritmenders are
**batch-based** — the old path wrote the batch to a `spiritmender-batches/<workItemId>.json` sidecar and set **no**
relatedDataItems. So `get-agent-prompt({agent:'spiritmender'})` would throw `"...has no relatedDataItems"`.
→ **Fix:** in `agentPromptGetBroker` (broker = allowed I/O), when role is `spiritmender` and the sidecar batch file
exists, read it and build the spiritmender WorkUnit directly from
`{filePaths, errors, verificationCommand, contextInstructions}`. Keep the existing step-based path as the fallback (for
any future step-scoped spiritmender). `buildWorkUnitForRoleTransformer` gains a batch-input variant for spiritmender.
The WorkUnit contract + arg-render already support these fields, so the change is localized to the builder + the
broker's role branch.

**G2 — `get-next-step` doesn't batch spiritmenders.**
`select-batch-layer-broker.ts` returns all `pathseeker-surface` together, `dedup`+`assertion` together, else **one
oldest item**. Multiple ready spiritmenders would dispatch one-at-a-time (slow but correct). The old model ran them in
parallel up to `spiritmenderMaxConcurrent`.
→ **Decision D1 (below).** Recommended: add a spiritmender batch case so all ready spiritmenders for the active quest
dispatch in one `spawn-agents` response.

**G3 — Exhaustion path references a defunct role.**
The old broker, on retry-budget exhaustion, drains+skips pending and inserts a `role:'pathseeker'` replan. The new model
has four pathseeker roles, no single `pathseeker`.
→ **Decision D2 (below).** Recommended for this session: on ward-retry exhaustion, **drain+skip the items downstream of
the failed ward** and let `workItemsToQuestStatusTransformer` derive `blocked`. Defer auto-replan (it needs the 4-role
redesign) — but log it loudly. No silent dead-end.

---

## 4. Workstream A — Ward → Spiritmender recovery (Tier 1 + Tier 4)

**A0. Red tests first** (mandatory; watch them fail on unchanged source):

- `quest-get-next-step-broker.test.ts`: NEW case — quest with ward `failed` + a pending spiritmender (
  `dependsOn:[wardId]`) + a pending siegemaster (`dependsOn:[wardId]`). Assert result is `spawn-agents` with *
  *spiritmender**, not siegemaster. (Today: returns siegemaster → fails.)
- `quest-run-ward-broker.test.ts`: strengthen the `failure path` case — assert that after a non-zero exit, the persisted
  quest gains N `spiritmender` items (`dependsOn:[wardId]`), a `ward` retry item (`attempt+1`, `dependsOn:[spiritIds]`),
  and that the pre-existing downstream siege's `dependsOn` is **rewired** wardId→retryId. (Today: only ward marked
  failed → fails.)
- An integration test (`flows/quest/quest-flow.integration.test.ts` or a new `orchestration` one) covering the full sad
  path: seed chain → ward fails → next get-next-step yields spiritmender → spiritmender completes → ward-retry runs →
  passes → siege proceeds.

**A1. Re-wire the splice primitive.** `questWorkItemInsertBroker` is sound; it just needs a live caller (the ward
broker). No change beyond ensuring its imports/proxy are intact.

**A2. Port recovery into `quest-run-ward-broker.ts`.** After the existing `status === 'failed'` persist, insert the
block adapted from `run-ward-layer-broker.ts:164-308`:

1. Retry budget check (`workItem.attempt >= maxAttempts - 1`). If exhausted → A5.
2. Build batches via
   `wardDetailToSpiritmenderBatchesTransformer({ detailJson, batchSize: slotManagerStatics.ward.spiritmenderBatchSize })`.
3. Select context preamble (`postBlightwardenFailure` if a blightwarden item already completed, else `wardFailure`).
4. Write `spiritmender-batches/<spiritId>.json` sidecars (
   `{filePaths, errors, verificationCommand, contextInstructions}`).
5. Create N spiritmender items (`dependsOn:[wardId]`, `insertedBy:wardId`) + a ward-retry item (`attempt+1`,
   `dependsOn:[spiritIds]`, same `wardMode`).
6.
`questWorkItemInsertBroker({ newWorkItems:[...spirits, retry], replacementMapping:[{oldId:wardId, newId:retryId}] })` —
rewires siege/downstream onto the retry.

- Keep the `quest-run-ward-broker` return contract unchanged (the MCP tool's response shape is stable).

**A3. Spiritmender prompt delivery (G1).** Update `agentPromptGetBroker` + `buildWorkUnitForRoleTransformer` so a
batch-based spiritmender resolves its sidecar. Add unit tests for both the sidecar-present and step-based branches.

**A4. Spiritmender batching in get-next-step (G2 / D1).** Add the spiritmender case to `select-batch-layer-broker.ts` +
a test.

**A5. Exhaustion behavior (G3 / D2).** Drain+skip downstream-of-ward; derive `blocked`; `log()` the exhaustion. Test
STATUS-2 path.

---

## 5. Workstream B — Agent-failure recovery via `signal-back` (Tier 1, partial)

`quest-handle-signal-back-responder.ts` is the home for non-ward failures. The old `FAILURE_ROLE_MAP` was:
codeweaver/siegemaster/spiritmender/blightwarden → pathseeker replan; lawbringer → spiritmender; pathseeker-*
/pesteater → bubble.

- **Clean now:** `lawbringer` `failed` → insert spiritmender(s) (same machinery as A). `blightwarden` `failed-replan` →
  today collapses to `failed`; at minimum stop discarding the signal.
- **Needs the 4-role redesign (defer):** codeweaver/siege/blight → "pathseeker replan." Which pathseeker role re-runs?
  What gets drained? This is **Decision D3.**

→ **Recommended scope this session:** implement ward→spiritmender (A) end-to-end and the directly-analogous
`lawbringer→spiritmender`. Defer all `→ pathseeker replan` cases to a follow-up with an explicit 4-role recovery design.
Flag the deferral in `docs/quest-role-paths.md` so it's not silently missing.

---

## 6. Workstream C — Dev-server + build-preflight for Siegemaster (Tier 2)

**The gap:** the only code that ever started a dev server (`run-siegemaster-layer-broker` →
`dev-server-start-loop-layer-broker` → `devServerStartBroker`) is unwired. In the live path nothing starts a server,
runs build-preflight, or injects `devServerUrl` — yet the siege prompt says "navigate to `{devServerUrl}{entryPoint}`."
Every runtime-flow Siegemaster is currently running against nothing.

**This is a genuine architectural fork — Decision D4.** Options:

- **C-opt-A — Agent self-manages (most new-model-pure).** Siegemaster's Playwright config owns the dev server via
  Playwright's `webServer` option (it starts/stops the server for the test run, with port handling). `get-agent-prompt`
  supplies `devCommand` + `port` + `entryPoint`; the prompt instructs the agent to wire `webServer`. No
  orchestrator-owned process, no new MCP tool. Per-siege start/stop overhead, but each siege is its own Task anyway.
  Build-preflight becomes a step the agent runs (or a `command` work item like ward).
- **C-opt-B — Orchestrator-managed lifecycle (most faithful to old behavior).** Add an MCP tool / `command` work item
  that the server handles: start dev server (reuse `devServerStartBroker`, track in `orchestrationProcessesState`)
  before the first siege, tear down after the last. `get-next-step` emits a `start-dev-server` / `stop-dev-server`
  step (sibling to `run-ward`). Robust against N agents fighting over ports; reintroduces an orchestrator-owned **app**
  process (not a Claude runtime — `a9652df3` only disabled Claude runtimes, so this is allowed). More wiring + a new MCP
  surface.
- **C-opt-C — Hybrid:** orchestrator starts/stops keyed to siege dispatch internally (no new MCP tool), siege gets
  `devServerUrl` via `get-agent-prompt`.

→ **Recommendation:** **C-opt-A** for alignment with the dispatch model and minimal new surface, *unless* you want the
orchestrator to own the app lifecycle for multi-siege port safety (then C-opt-B). I need your call before building C.

---

## 7. Open decisions (need your input)

- **D1 — Parallel spiritmenders?** Recommend yes (batch all ready spiritmenders in one `spawn-agents`). Alt: keep
  one-at-a-time (simpler, slower).
- **D2 — Ward-retry exhaustion behavior?** Recommend drain+skip-downstream + derive `blocked` + loud log; defer
  auto-replan. Alt: also insert a pathseeker replan now (pulls in the 4-role redesign).
- **D3 — Agent-failure scope this session?** Recommend ward→spiritmender + lawbringer→spiritmender now; defer
  codeweaver/siege/blight→replan. Alt: do the full FAILURE_ROLE_MAP now (bigger, needs 4-role replan design).
- **D4 — Dev-server ownership (C-opt-A / B / C)?** Recommend A. This blocks Workstream C.

---

## 8. Test plan / invariants to pin

- **New sad-path invariants** (the ones that were missing): ward `failed` + pending downstream ⇒ `get-next-step` yields
  spiritmender; ward-retry depends on all spiritmenders; downstream rewired to retry; retry budget honored; exhaustion ⇒
  `blocked` not silent pass-through.
- Reuse existing invariant IDs in `docs/quest-role-paths.md` (DEP-2, STATUS-2/3) and ADD recovery invariants (e.g. *
  *REC-1** ward-fail inserts spiritmender batch; **REC-2** retry rewires downstream; **REC-3** exhaustion blocks).
- **Tier 5 follow-up (out of scope, but note):** wire `smoketest-in-process-driver-broker` into CI — it's the
  zero-API-spend simulator that would have caught this. Strongly recommend a separate session.

## 9. Sequencing

1. A0 red tests (ward path) → watch fail.
2. A1–A3 (splice re-wire, ward broker port, spiritmender delivery) → A-tests green.
3. A4–A5 (batching, exhaustion) → green.
4. B (lawbringer→spiritmender) if D3 = recommended.
5. C (dev-server) per D4 — separable; can be its own session.
6. `npm run build` → `npm run ward` green. Update `docs/quest-role-paths.md` + `orchestrator/CLAUDE.md` "Failure
   handling" sections to present-tense the now-wired recovery, and mark deferred replan cases.

## 10. Explicitly out of scope / deferred

- Tier 3 concurrency ceiling (separate workstream).
- `→ pathseeker replan` recovery (codeweaver/siege/blight) — needs 4-role redesign.
- `enqueue-recoverable` server-side crash-resume (acceptable: user re-runs `/dumpster-launch`).
- Deleting the now-confirmed-dead in-process loop / slot-manager tree (cleanup pass, later).
