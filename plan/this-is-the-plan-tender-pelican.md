# Smoketest UI Overhaul: Unify Suites Through Execution View + Cross-Guild Quest Queue

## Progress

- [x] Phase 1: Contract changes — add `questSource` + `smoketestResults` to quest; thread through AddQuestInput, questAddBroker, questHydrateBroker
- [x] Phase 2: Quest delete — new `questDeleteBroker` + `questDeleteResponder`
- [x] Phase 3: Case-catalog → blueprint transformer + bundled MCP/Signals blueprints + `smoketestClearPriorQuestsBroker`
- [x] Phase 4: Rename `brokers/smoketest/run-orchestration-case/` → `run-case/`; delete `brokers/smoketest/run-single-agent-case/`
- [x] Phase 5: Queue state + runner + QuestQueueEntry contract + queue events on orchestration-event-type (not wired to start responder yet)
  > [x] Queue stale-entry bug resolved — new `quest-queue-sync-listener` broker subscribes to `quest-modified` events; on terminal status updates the entry then removes it, on quest-not-found removes by questId. Queue state exposes `removeByQuestId` + `updateEntryStatus`.
- [x] Phase 6: Web-presence state + server WS connect/disconnect hooks + set-web-presence adapter
- [x] Phase 7: Atomic flip — orchestrationStartResponder enqueues + smoketest-run responder rewrite + startup-recovery gating
  > [x] 409 guard fixed — `try/finally { end() }` replaced with `try/catch { end(); throw }` so the active flag clears only on failure. Post-terminal listener clears the flag when the last smoketest quest drains. Server responder maps "already running" error to HTTP 409.
  > [x] Orchestration suite fixed — scenario state is now multi-active keyed by questId (the internal Map already supported it; the artificial `size > 0` throw was the only blocker). All 5 scenarios can register concurrently.
  > [x] Scenario-driver leak fixed — poll tick catches quest-not-found, invokes `stopNow()` (clearInterval + abort + unsubscribe), then fires `onQuestGone` so the responder releases the scenario entry.
- [x] Phase 8: Queue bar widget + `use-quest-queue` binding + GET /api/quests/queue endpoint + get-quest-queue adapter
- [x] Phase 9: Delete drawer + rewire tooling dropdown + slim `useSmoketestRunBinding`
- [ ] Manual E2E verification
- [ ] Plan alignment review (orchestrator-owned)

## Context

The orchestration smoketest currently opens `SmoketestDrawerWidget` — a right-side drawer
with per-case tail-output rows. That shape breaks down when you need to debug: the
scripts, assertions, blueprint, work-item graph, and live agent streams already exist in
the execution view (`ExecutionPanelWidget`) that real quests render into. Each
orchestration scenario already creates a real quest under the `__smoketests` guild via
`questHydrateBroker`, but the Tooling UI doesn't surface it.

MCP (16 probes) and Signals (3 probes) today run as ad-hoc agents via
`smoketestRunSingleAgentCaseBroker`, bypassing the quest model. That's why they need the
drawer. Modeling each full suite as **one quest with many dependsOn-chained work items**
(same role, different prompt overrides) lets the same execution view render them too, and
deletes the drawer plus its bespoke display plumbing.

Simultaneously, the user needs a **cross-guild quest execution queue**. The web handles
quest viewing across any guild (dungeonmaster config lives in the user home), and the
queue must serialize quest execution globally — one quest executes at a time, regardless
of guild — while planning/chat stays parallel. A sticky bar at the home page shows
`Quest N/M — <title>` and expands into the full queue. Kicking off a smoketest suite
enqueues 1–5 quests at the tail.

The **meta quest state machine already exists** as `questStatusMetadataStatics` with per-
status flags (`isActivelyExecuting`, `isTerminal`, `isUserPaused`, `isPauseable`,
`isResumable`, `isRecoverable`, `shouldRenderExecutionPanel`, etc.) plus guards
(`isTerminalQuestStatus`, `isActivelyExecutingQuestStatus`, `isResumableQuestStatus`,
`isRecoverableQuestStatus`, …). The queue leans on these — queue advances when the head
hits `isTerminalQuestStatus(head) === true`; queue is frozen when head is
`isUserPausedQuestStatus(head) === true`; eligibility is
`isActivelyExecutingQuestStatus(status) || isRecoverableQuestStatus(status)`.

**Preserve the existing WS-gated resume behavior.** Today's
`orchestrationStartupRecoveryResponder` fires on server init to auto-resume recoverable
quests. The user wants that gated behind first-WS-connect instead: if the server
restarts with nobody watching, quests stay dormant; first WS client triggers the
recovery sweep. WS disconnect (all clients gone) pauses the active head via the existing
`orchestrationPauseResponder`.

**Errors bubble up.** Queue runner throws, quest transitioning to `blocked`, or explicit
orchestration errors show as a red error badge on the queue bar entry (expandable to
detail).

## What EXISTS (reuse) vs CREATE (new)

| Area | Exists (reuse) | Create (new) |
|---|---|---|
| Quest status machine | `questStatusMetadataStatics`, `questStatusTransitionsStatics`; guards `isTerminalQuestStatus`, `isActivelyExecutingQuestStatus`, `isUserPausedQuestStatus`, `isPauseableQuestStatus`, `isResumableQuestStatus`, `isRecoverableQuestStatus`, `isAnyAgentRunningQuestStatusGuard`, `isAutoResumableQuestStatus` (in `packages/shared/src/statics/quest-status-metadata/` + `packages/shared/src/guards/`) | — |
| Pause / Resume | `orchestrationPauseResponder` (kills subprocess, resets `in_progress` work items → `pending`, stamps `pausedAtStatus`), `orchestrationResumeResponder` (reads `pausedAtStatus`, transitions back, relaunches loop). Loop itself exits gracefully when `isUserPausedQuestStatus(status)` turns true mid-tick. | — |
| Startup recovery | `orchestrationStartupRecoveryResponder` — sweeps all guilds for recoverable quests and relaunches loops | Gate behind web-presence (invoke on first WS connect, not on server init) |
| Quest list | `questListBroker` | — |
| Quest delete | — | `questDeleteBroker` + `questDeleteResponder` (rmdir quest folder, emit `quest-modified`) |
| Quest add / hydrate | `questAddBroker`, `questHydrateBroker` (sig: `({ blueprint, guildId }) => { questId }`) | Extend hydrate + `AddQuestInput` to accept optional `questSource` |
| Quest source discriminator | — | Add `questSource?: z.enum(['user','smoketest-mcp','smoketest-signals','smoketest-orchestration'])` to `questContract` + `AddQuestInput` |
| Work item contract | `workItemContract` (has `smoketestPromptOverride`, `dependsOn`, all needed fields) | — |
| Work-item floor grouping | `workItemsToFloorGroupsTransformer` (web-side) — already renders a linear dependsOn chain as per-floor rows | — |
| Smoketest blueprints | `smoketestBlueprintsStatics.minimal` (orchestration scenarios) | Add `caseCatalogToBlueprintTransformer` to derive a bundled MCP/Signals blueprint from `smoketestCaseCatalogStatics` — produces N steps / N work items chained via `dependsOn`, each pre-stamped with its `smoketestPromptOverride` |
| Smoketest catalog | `smoketestCaseCatalogStatics` (MCP from `mcpToolsStatics.tools.names`, Signals 3, Orchestration 5) | Per-case `blueprintKey` stays implicit (suite determines shape) |
| Smoketest runners | `smoketestRunOrchestrationCaseBroker` (hydrate → scenario driver → start → poll terminal → assertions → teardown), scenario driver, stamp-override, poll, assert, teardown, ensure-guild | Rename `run-orchestration-case` → `run-case` — same pipeline, scenario driver no-op when scripts are empty (MCP/Signals pre-stamp at hydrate time). Delete `run-single-agent-case/` entirely. |
| Orchestration loop | `questOrchestrationLoopBroker` | — |
| Start quest | `orchestrationStartResponder` (validates, registers process, kicks loop fire-and-forget) | Rewire to enqueue onto the new queue instead of directly kicking. Runner calls the loop when it's the head's turn. |
| Orchestration processes | `orchestrationProcessesState` (`register`, `kill`, `killAll`, `findByProcessId`) | — |
| Per-quest lock | `questWithModifyLockBroker` (per-questId async mutex) | — |
| Cross-quest queue | — | `state/quest-execution-queue/` (FIFO across guilds: `{ questId, guildId, enqueuedAt }`; exposes `enqueue`, `dequeueHead`, `getActive`, `getAll`, `onChange`, `clearBySource`) |
| Queue runner | — | `brokers/quest/execution-queue-runner/` — picks head when WS present, invokes loop, awaits terminal, dequeues, recurses; wraps in try/catch to emit `execution-queue-error` |
| Web presence | — | `state/web-presence/` (boolean isPresent + pub/sub); `adapters/orchestrator/set-web-presence/` so server can toggle it |
| Orchestration events | `orchestrationEventsState` (emit/on/off). Current event types: `phase-change`, `quest-modified`, `chat-*`. | Add `execution-queue-updated` and `execution-queue-error` to `orchestrationEventTypeContract` |
| WS relay | `server-init-responder.ts` subscribes to `quest-modified` and broadcasts. | Extend subscriptions to include `execution-queue-updated` + `execution-queue-error`; also add WS connect/disconnect hooks calling `setWebPresence(true/false)` |
| Smoketest state | `smoketestRunState` (active flag, events) | Keep for the in-progress `suite` kickoff (409 if active), drop the events buffer (no WS progress stream anymore) |
| Web smoketest drawer | `SmoketestDrawerWidget`, `mergeSmoketestCaseResultTransformer`, `useSmoketestRunBinding` (drawer state) | — (deleted) |
| Web execution view | `ExecutionPanelWidget`, `QuestChatWidget` (already gated on `shouldRenderExecutionPanelQuestStatusGuard`), `useAgentOutputBinding` | — |
| Web queue bar | — | `widgets/quest-queue-bar/` + `bindings/use-quest-queue/` + GET `/api/quests/queue` responder + `adapters/orchestrator/get-quest-queue/` |
| Assertion results storage | Quest has `steps[]` + `workItems[]`. No guild-level auxiliary file convention exists. | Add optional `smoketestResults?: { caseId, passed, failures[], output }[]` to `questContract`, written by existing `smoketestAssertFinalStateBroker` post-terminal. Rendering this in the UI is OUT OF SCOPE for this plan (reachable via quest.json on disk). |

## Approach (ordered)

### 1. Contract: add `questSource` + `smoketestResults` to quest

- `packages/shared/src/contracts/quest/quest-contract.ts` — add
  `questSource: z.enum([...]).optional()` and
  `smoketestResults: z.array(smoketestCaseResultContract).optional()`.
- Update stub + colocated test.
- Thread through `AddQuestInput` contract.
- `questAddBroker` + `questHydrateBroker` accept and persist `questSource`. Hydrator
  signature: `({ blueprint, guildId, questSource? }) => { questId }`.

### 2. Quest delete

- New `brokers/quest/delete/quest-delete-broker.ts` — removes
  `~/.dungeonmaster/guilds/{guildId}/quests/{questId}/` via `fsRmAdapter`, emits
  `quest-modified`. Idempotent.
- New `responders/quests/delete/quest-delete-responder.ts` — validates quest is in a
  terminal OR paused OR never-started state (cannot delete an actively running quest —
  caller must pause/abandon first), calls broker.
- Broker is also called directly by `smoketestClearPriorQuestsBroker`.

### 3. Smoketest bundling: MCP + Signals → 1 quest per suite

- New `transformers/case-catalog-to-blueprint/case-catalog-to-blueprint-transformer.ts`
  — input: suite + catalog entries; output: a `QuestBlueprint` with N steps + N
  codeweaver work items in a linear `dependsOn` chain, each work item carrying its
  case's `promptKey`-resolved `smoketestPromptOverride`.
- New broker `brokers/smoketest/clear-prior-quests/smoketest-clear-prior-quests-broker.ts`
  — lists `__smoketests` guild quests, filters on `questSource`, deletes via
  `questDeleteBroker`.
- Rename `brokers/smoketest/run-orchestration-case/` → `brokers/smoketest/run-case/`.
  Signature unchanged externally: hydrate blueprint → (optional) register scenario
  scripts + driver → poll terminal → assert → teardown.
- Delete `brokers/smoketest/run-single-agent-case/` (directory).

### 4. Cross-guild queue

- New state `state/quest-execution-queue/`. In-memory FIFO across all guilds.
  Entries: `QuestQueueEntry` (new contract in
  `packages/shared/src/contracts/quest-queue-entry/`) —
  `{ questId, guildId, guildSlug, questTitle, status: QuestStatus, questSource?, enqueuedAt, startedAt?, error?: { message, at } }`.
  Methods: `enqueue`, `dequeueHead`, `getActive`, `getAll`, `onChange`,
  `clearBySource(questSource)`, `setHeadError({ message })`.
- New broker `brokers/quest/execution-queue-runner/`. Runs when:
  - head exists AND
  - `isActivelyExecutingQuestStatus(head.status) || isRecoverableQuestStatus(head.status)`
    AND
  - `webPresenceState.isPresent === true` AND
  - `!isUserPausedQuestStatus(head.status)`.
  Invokes `questOrchestrationLoopBroker({ questId })`. Awaits its exit. If head status is
  now `isTerminalQuestStatus`, dequeue and recurse. If paused, wait on next change. On
  thrown error, set head error on queue entry, emit `execution-queue-error`, do NOT
  dequeue automatically (user must resume or abandon).
- `orchestrationStartResponder` modified — enqueue instead of directly kicking the loop.
- Remove auto-invocation of `orchestrationStartupRecoveryResponder` from
  `start-orchestrator.ts` / server init path; instead, the runner's startup hook scans
  for `isRecoverableQuestStatus`-eligible quests when web presence first flips `true`
  and enqueues them ordered by their persisted creation time.
- `orchestrationEventTypeContract` — add `'execution-queue-updated'` and
  `'execution-queue-error'`. Queue state emits on every mutation.

### 5. Web presence + WS gating

- New state `state/web-presence/` — boolean + pub/sub.
- New adapter `packages/server/src/adapters/orchestrator/set-web-presence/` —
  pass-through to `StartOrchestrator.setWebPresence(bool)`.
- Server WS handler in `server-init-responder.ts` tracks connected client count in a
  module-scoped counter. On first connect → `setWebPresence(true)`. On last disconnect →
  `setWebPresence(false)`. Queue runner subscribes to `webPresenceState.onChange` and
  resumes when `true`; when it flips `false`, runner calls `orchestrationPauseResponder`
  on the active head (existing pause pipeline kills subprocess + resets in-flight work
  items to `pending`).

### 6. Smoketest-run responder rewrite

- Keep `smoketestRunState` for the active-suite flag (409 on concurrent POST); drop its
  event buffer.
- Flow:
  1. `try/finally` around body (ends `smoketestRunState` on exit).
  2. Ensure `__smoketests` guild via `smoketestEnsureGuildBroker`.
  3. `smoketestClearPriorQuestsBroker({ questSource: 'smoketest-<suite>' })`.
  4. Hydrate (MCP/Signals: 1 quest via `caseCatalogToBlueprintTransformer`;
     Orchestration: 5 quests via existing `smoketestScenariosStatics`), stamping
     `questSource`.
  5. For each resulting `questId`, `questExecutionQueueState.enqueue(...)`.
  6. Respond `{ enqueued: [{ questId, guildSlug, sessionId }] }`.
- Assertions hook: existing `smoketestAssertFinalStateBroker` runs as a post-terminal
  listener (subscribe to `quest-modified`, filter for the hydrated questIds, fire when
  `isTerminalQuestStatus`). Result written onto `quest.smoketestResults` via
  `questModifyBroker` or a direct write-under-lock.
- Post-case teardown (port-free / process-gone checks, quest delete) — run in the same
  terminal listener for orchestration scenarios that declared
  `postTeardownChecks`. Quests remain on disk until the next run of that suite.

### 7. Queue bar + tooling dropdown

- New `widgets/quest-queue-bar/quest-queue-bar-widget.tsx` — top-sticky strip
  (fixed-position at the top of the layout; visible on every route). Collapsed view:
  `Quest <activeIndex+1>/<total> — <activeQuestTitle>` + error icon if head has
  `error`. Chevron expands a list; each row is a link to
  `/:guildSlug/session/:sessionId`. Styled via `emberDepthsThemeStatics`. Hidden when
  queue is empty.
- New binding `bindings/use-quest-queue/use-quest-queue-binding.ts` — persistent WS
  subscription to `execution-queue-updated` + `execution-queue-error`; seeds via
  GET `/api/quests/queue`. Derives `{ activeEntry, allEntries, errorEntry }`.
- Mount in `widgets/app/app-widget.tsx`, ungated by route.
- `useSmoketestRunBinding` slims to `run({ suite })` — POSTs, receives first enqueued
  quest, navigates to its execution view via router.
- `ToolingDropdownWidget` button spins when `useQuestQueueBinding.activeEntry` has a
  smoketest-suite `questSource`; clicking while running navigates to the active smoketest
  quest instead of opening the menu.
- Delete: `widgets/smoketest-drawer/`, `transformers/merge-smoketest-case-result/`,
  `smoketest-progress` enum entry + its `dev-log-generic-event-format` formatting,
  drawer-state in the binding.

## Critical files (rollup with NEW / MOD / DEL)

```
NEW  packages/shared/src/contracts/quest-queue-entry/
NEW  packages/orchestrator/src/state/quest-execution-queue/
NEW  packages/orchestrator/src/state/web-presence/
NEW  packages/orchestrator/src/brokers/quest/execution-queue-runner/
NEW  packages/orchestrator/src/brokers/quest/delete/
NEW  packages/orchestrator/src/brokers/smoketest/clear-prior-quests/
NEW  packages/orchestrator/src/transformers/case-catalog-to-blueprint/
NEW  packages/server/src/adapters/orchestrator/get-quest-queue/
NEW  packages/server/src/adapters/orchestrator/set-web-presence/
NEW  packages/server/src/responders/quests/queue/
NEW  packages/server/src/responders/quests/delete/
NEW  packages/web/src/widgets/quest-queue-bar/
NEW  packages/web/src/bindings/use-quest-queue/

REN  orchestrator brokers/smoketest/run-orchestration-case/ → run-case/

MOD  packages/shared/src/contracts/quest/quest-contract.ts (+questSource, +smoketestResults)
MOD  packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts (+queue events; −smoketest-progress)
MOD  packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.ts (thread questSource)
MOD  packages/orchestrator/src/brokers/quest/add/quest-add-broker.ts (thread questSource)
MOD  packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.ts (enqueue)
MOD  packages/orchestrator/src/responders/orchestration/startup-recovery/orchestration-startup-recovery-responder.ts (gate behind web-presence trigger)
MOD  packages/orchestrator/src/responders/smoketest/run/smoketest-run-responder.ts (rewrite)
MOD  packages/orchestrator/src/startup/start-orchestrator.ts (bootstrap runner + new exports)
MOD  packages/server/src/responders/server/init/server-init-responder.ts (WS presence + queue event subscriptions)
MOD  packages/web/src/widgets/app/app-widget.tsx (drop drawer, mount queue bar)
MOD  packages/web/src/widgets/tooling-dropdown/tooling-dropdown-widget.tsx
MOD  packages/web/src/bindings/use-smoketest-run/use-smoketest-run-binding.ts

DEL  packages/orchestrator/src/brokers/smoketest/run-single-agent-case/
DEL  packages/web/src/widgets/smoketest-drawer/
DEL  packages/web/src/transformers/merge-smoketest-case-result/
```

## Verification

1. `npm run build && npm run ward -- --timeout 600000` — all green.
2. `npm run dev`; open http://dungeonmaster.localhost:4751/. Drawer widget absent from DOM.
3. Tooling → Signals:
   - Nav to `/__smoketests/session/<session>`, execution view renders 1 quest, 3
     codeweaver floors chained by `dependsOn`.
   - Queue bar: `Quest 1/1 — Smoketest: Signals`.
   - Floors transition serially; each agent emits its scripted signal.
4. Tooling → MCP: 1 quest, 16 floors.
5. Tooling → Orchestration: 5 quests; bar shows `Quest 1/5`, `2/5`, …; scenario driver
   still stamps overrides on dynamically spawned retry work items as today.
6. Cross-guild: start a real quest in another guild mid-Orchestration run. It enqueues
   at the tail of the same queue; starts only after the 5 smoketest scenarios finish.
   Queue bar shows it in the expanded list with its guild slug prefix.
7. Pause active head → bar stays on that entry; queue does NOT advance. Resume → head
   resumes; queue continues. (Uses existing `orchestrationPauseResponder` /
   `orchestrationResumeResponder`.)
8. Prior-run cleanup: run Orchestration twice. First run's 5 quests are deleted from
   `__smoketests` before the second run's 5 are enqueued. Signals / MCP quests from
   prior runs untouched (`questSource` scoped).
9. WS presence:
   - Close every browser tab. Active head transitions to `paused` via
     `orchestrationPauseResponder`.
   - Reopen browser → WS connects → runner picks head back up (existing resume path).
10. Server restart mid-quest:
    - Kill dev server. Restart via `npm run dev`. No browser open.
    - Check `orchestrationStartupRecoveryResponder` does NOT auto-launch loops (change
      verified — its invocation moves to first-WS-connect).
    - Open browser → WS connects → recovery sweep enqueues recoverable quests ordered
      by original creation time; head resumes.
11. Error bubbling:
    - Quest transitions to `blocked` → queue advances (blocked is terminal per
      `isTerminalQuestStatus`); bar shows a red marker on that expanded-list row.
    - Queue runner throws (fault-inject in dev) → head entry gets `error` set; bar
      shows persistent red banner; queue halts until head is resumed / abandoned.
12. DevTools WS: `execution-queue-updated` + `execution-queue-error` events visible;
    `smoketest-progress` not emitted.
13. GET `/api/quests/queue` returns current queue.
14. POST `/api/tooling/smoketest/run` while smoketest-run is active → 409 (unchanged).
15. Queue bar hidden when queue is empty.

## Out of scope

- Playwright e2e for new UI — follow-up.
- UI rendering of `quest.smoketestResults` — data lands on disk this round; a future
  follow-up can surface it in the QUEST SPEC tab.
- Claude rate-limit mitigation — unchanged.
- Concurrent execution across guilds — queue serializes by design.
- Pausing a queued-but-not-active quest — queued items aren't running yet; pause is the
  standard per-quest pause once at the head.
- Persisting queue to disk across server restarts — in-memory only; recovered from
  quest files on first WS connect.
