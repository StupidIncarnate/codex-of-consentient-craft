# E2E Flakiness Log

A running record of specific flake hunts: what was flaky, where the bug was,
what fixed it, what dead-ends we hit. New entries go on top.

The methodology lives in `playbook/e2e-flakiness.md`. This file is the case
record — the next agent investigating a flake should grep here for prior art
before starting from scratch.

Each entry follows this shape:

```
## YYYY-MM-DD — <short title>

**Branch / worktree:** <branch-name>
**Failing specs:** <list of <spec.ts:line> entries>
**Symptom:** <one-sentence summary the user would describe>
**Root cause:** <one paragraph>
**Fix location:** <file path(s) where the fix landed>
**Negative results / dead ends:** <what was tried first and why it didn't work>
**Reproducer:** <how to repro it (sweep command, predecessor specs, etc.)>
```

---

## 2026-05-07 — Three CPU-contention flakes (multi-widget WS, rate-limits poll, mcp init startup)

**Branch / worktree:** master.
**Failing specs:**

- `multi-widget-coexistence.spec.ts:43` "VALID: {chat + queue + rate-limits widgets mounted together} => exactly one
  WebSocket opened"
- `rate-limits-live-update.spec.ts:12` "VALID: {snapshot file updated mid-session} => rate-limits card DOM updates via
  WS without reload"
- `mcp/.../mcp-server-flow.integration.test.ts` "VALID: Server starts and responds to initialize request"

**Symptom:** All three failed under full ward (CPU-contended) but passed in
isolation. Multi-widget asserted `backendWsCount === 1` and tripped on
construction-time counting (handshake-failure WSs counted alongside the durable
one). Rate-limits exhausted its 9 s polling timeout because the orchestrator's
5 s file poll fell outside the budget. Mcp init timed out because the harness
slept a fixed 2 s for tsx warmup which wasn't enough under contention.

**Root cause:** None of these are product bugs — they're test-budget mismatches
against worst-case CPU-contended paths.

1. **Multi-widget WS count**: `page.on('websocket')` fires on construction. If
   the dev-mode WS proxy briefly fails handshake under load and the adapter's
   onclose path schedules a 3 s reconnect, the test counts both the dead and
   the durable socket. `backendWsCount` becomes 2.
2. **Multi-widget queue bar (latent)**: separate flake exposed once the WS
   count fix unblocked progress past line 178. The queued quest hit terminal
   state in <1 s because only one fake-CLI response was queued — the queue bar
   was visible for too brief a window for React+Playwright to observe. The
   `execution-queue-streaming.spec.ts` pattern of pausing the quest immediately
   was missing.
3. **Rate-limits poll cycle**: `RateLimitsBootstrapResponder` hard-coded a
   `POLL_INTERVAL_MS = 5000`. The test gives 9 s for a snapshot update to
   propagate. Under load, setInterval ticks slip and the WS round-trip from
   tick → emit → fetch → render exceeds the 9 s budget.
4. **Mcp init startup**: `mcp-server.harness.ts` slept a fixed
   `mcpServerStatics.timeouts.startupMs = 2000` then sent the init request.
   `npx tsx` cold-start under parallel jest+tsc+playwright contention can take
   3-5 s, leaving the request hitting the subprocess before stdio is wired.
   Once the 10 s `requestMs` runs out, the test rejects with `Request 1 timed
   out`.

**Fix locations:**

- `packages/testing/e2e/web/multi-widget-coexistence.spec.ts:128-142,176-178`
  — count only WSs that emit a frame post-handshake (`framesent` /
  `framereceived`), and switch the strict count assertion to `expect.poll`
  over the `WIDGET_TIMEOUT` budget.
- `packages/testing/e2e/web/multi-widget-coexistence.spec.ts:32-37,200-208`
  — bump per-test timeout to 30 s and pause the queued quest immediately
  after `/start` so it stays in the execution queue across the queue-bar
  visibility/text assertions (mirror of `execution-queue-streaming.spec.ts:91-97`).
- `packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.ts:16-30`
  — accept `DUNGEONMASTER_RATE_LIMITS_POLL_MS` env var override of the
  `DEFAULT_POLL_INTERVAL_MS = 5000`. Production keeps 5 s; e2e overrides to 500 ms.
- `packages/testing/playwright.config.ts:webServer.env`
  — set `DUNGEONMASTER_RATE_LIMITS_POLL_MS: '500'` so the poll interval no
  longer dominates the test budget.
- `packages/mcp/src/statics/mcp-server/mcp-server-statics.ts`
  — replace `startupMs: 2000` with `readinessDeadlineMs: 30000`,
  `readinessProbeAttemptMs: 1500`, `readinessProbeIntervalMs: 200`.
- `packages/mcp/test/harnesses/mcp-server/mcp-server.harness.ts`
  — replace fixed `setTimeout(startupMs)` with a recursive `probeReady`
  function that sends throwaway initialize requests with a short per-attempt
  timeout, retrying until success or the readiness deadline. Returns the
  moment the subprocess is actually responsive on stdio. Uses a `.then(ok,
  fail)` outcome flag to satisfy `consistent-return` with a
  void-returning async arrow.

**Negative results / dead ends:**

- **Bumping the multi-widget test's per-test timeout from 10 s → 30 s alone**
  did not help — the queue-bar assertion still failed because the queued quest
  cycled through the orchestration loop and exited terminal in under a second,
  emptying the queue before any React render could surface it. The
  `request.post(/pause)` immediately after `/start` is the deterministic fix.
- **Counting all `page.on('websocket')` constructions** worked when the WS
  consolidation was first verified, but breaks under load where transient
  handshake failures create extra (dead) socket constructions. Frame-activity
  counting is the right relaxation — it still catches a real consolidation
  violation (two durable sockets both exchanging frames) while ignoring
  handshake-failure noise.

**Reproducer:**

```bash
cd packages/testing
# All three pass 30/30 (or 15/15 for mcp integration):
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/multi-widget-coexistence.spec.ts \
  e2e/web/rate-limits-live-update.spec.ts
# Mcp init fix is verified by full integration ward, since under
# parallel CPU contention `npx tsx` takes >2 s to warm.
```

---

## 2026-05-04 — chat-stream-vs-replay-parity:1245 TOOL_ROW header click toggles instead of expands

**Branch / worktree:** master (no worktree — fix landed directly).
**Failing specs:**

- `chat-stream-vs-replay-parity.spec.ts:1245` "VALID: {tool_result whose content is an array of non-text items …} =>
  TOOL_ROW_RESULT renders the item payload (not empty), identical after streaming and after reload"

**Symptom:** Test passes 14/15 in isolation; the lone failure (repeat 12) times
out on `await expect(toolRowResult).toBeVisible()` after the test has clicked
`TOOL_ROW_HEADER`. Page snapshot at failure shows the row's chevron rendered
as `▸` (collapsed) — the click that was supposed to expand the row instead
collapsed it.

**Root cause:** Streaming-side ToolRow auto-expansion gets locked in by
`useState`. `chat-entry-list-widget.tsx:130` sets
`isLastUnpaired = isStreaming && mergedItem.toolResult === null && entry === lastEntryInList`
and passes `defaultExpanded={true}` while it holds. `tool-row-widget.tsx:56`
initializes `useState(defaultExpanded === true)` — which only runs on mount.
When the tool_use arrives in one render before the tool_result, the widget
mounts with `expanded=true`. The tool_result then arrives, `isLastUnpaired`
flips false, but `expanded` stays sticky at `true`. The test then blindly
calls `click({ force: true })` on `TOOL_ROW_HEADER`, which TOGGLES → false
→ `TOOL_ROW_RESULT` unmounts → assertion times out.

When the WS bursts deliver tool_use + tool_result inside a single React
render batch (the normal case), `isLastUnpaired` never fires, the widget
mounts with `expanded=false`, click expands → test passes. Whether the two
arrive in the same batch is timing-dependent (~7% miss rate at workers:1
under default load — 1/15 in this run).

This is intra-spec, not cross-spec leakage — reproduces in isolation.

**Fix location:**

- `packages/testing/e2e/web/chat-stream-vs-replay-parity.spec.ts:1359-1370`
  (streaming half) and `:1389-1400` (replay half) — replaced unconditional
  `await toolRow.getByTestId('TOOL_ROW_HEADER').click({ force: true })` with
  a conditional click that fires only when `TOOL_ROW_RESULT` is not already in
  the DOM (`(await toolRowResult.count()) === 0`). End state ("row is
  expanded") is now deterministic regardless of which render batch boundary
  the tool_use/tool_result fell across.

The widget behaviour itself is correct UX (auto-expand a streaming tool
call, let the user click to collapse) and was not modified. The latent
product question — should an auto-expanded row collapse itself when streaming
finishes? — is a separate UX decision; the equivalent for `execution-row-
layer-widget` is tracked via `userClickedRef` (see "ward-execution-streaming
racy click" entry below).

**Negative results / dead ends:** None — diagnosis from the page snapshot
(chevron `▸`) pointed straight at "click toggled an already-expanded row,"
and the `chat-entry-list-widget` → `tool-row-widget` `defaultExpanded` →
`useState` chain was the only path that produces an already-expanded row
post-stream.

**Reproducer:**

```bash
cd packages/testing
# Pre-fix: 1/15 fail at repeat ~12.
# Post-fix: 15/15 pass in 39s.
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  --grep "TOOL_ROW_RESULT renders the item payload" \
  e2e/web/chat-stream-vs-replay-parity.spec.ts
```

**Cross-reference for future flake hunters:** other tests in the same spec
that use the unconditional `TOOL_ROW_HEADER`.click()` → `TOOL_ROW_RESULT`
visibility pattern (lines ~667, 710, 1752, 1792, 1987, 2025 — lines 1531
and 1560 fixes landed 2026-05-11; see entry below) are exposed to the same
race. The 1560 occurrence has now been observed flaking on the replay half;
the others have not been observed flaking yet — likely because their
tool_use/tool_result pairing happens inside a sub-agent chain or with a
different stream cadence — but if any of them surfaces with a `▸` chevron
in the failure snapshot, apply the same conditional-click guard.

---

## 2026-05-11 — chat-stream-vs-replay-parity MCP/Bash toolUseResult-array test TOOL_ROW header click toggles instead of expands

**Branch / worktree:** master (no worktree — fix landed directly).
**Failing specs:**

- `chat-stream-vs-replay-parity.spec.ts` "VALID: {tool_result line carries
  top-level toolUseResult as array of text blocks (MCP / Bash text-return shape)}
  => paired TOOL_ROW with non-empty body, identical after streaming and after reload"
  — replay-half `expect(replayToolRowResult).toBeVisible()` timed out (post-fix
  the assertion lands at line 1564).

**Symptom:** Test failed once during a scoped 6-spec run, then passed in
isolation, then passed in a re-run, then passed in the next full ward.
Identical to the 2026-05-04 entry above, but on the MCP/Bash text-return
variant of the parity test — and on the replay half rather than the
streaming half. The cross-reference at the bottom of the 2026-05-04 entry
explicitly called this line out as exposed but not yet observed flaking.

**Root cause:** Same `defaultExpanded={true}` + `useState` sticky-expand race
documented in the 2026-05-04 entry. `chat-entry-list-widget.tsx:130` sets
`isLastUnpaired = isStreaming && mergedItem.toolResult === null && entry === lastEntryInList`
and passes `defaultExpanded={true}` while it holds. `tool-row-widget.tsx:56`
initializes `useState(defaultExpanded === true)` — which only runs on mount.
When the tool_use arrives in one render before the tool_result, the widget
mounts with `expanded=true`. The tool_result then arrives, `isLastUnpaired`
flips false, but `expanded` stays sticky. The test then blindly calls
`click({ force: true })` on `TOOL_ROW_HEADER`, which TOGGLES → false →
`TOOL_ROW_RESULT` unmounts → assertion times out.

Note that the failing assertion is on the REPLAY half — the same race fires
on the replay rerender too, since the replayed JSONL still flows through the
streaming render path before the row reaches its final state. The streaming
half held this time but is exposed to the same race.

**Fix location:**

- `packages/testing/e2e/web/chat-stream-vs-replay-parity.spec.ts:1525-1535`
  (streaming half) and `:1554-1564` (replay half) — replaced unconditional
  `await toolRow.getByTestId('TOOL_ROW_HEADER').click({ force: true })` with
  a conditional click guarded by `(await toolRowResult.count()) === 0`. End
  state ("row is expanded") is now deterministic regardless of which render
  batch boundary the tool_use/tool_result fell across. Same diff shape as
  the 2026-05-04 fix at lines 1368/1400.

The widget behaviour itself is correct UX (auto-expand a streaming tool
call, let the user click to collapse) and was not modified.

**Negative results / dead ends:** None — the prior log entry's
symptom→suspected-bug catalog row ("TOOL_ROW_RESULT toBeVisible times out,
page snapshot shows chevron `▸` collapsed AFTER click") matched directly,
and the cross-reference explicitly named this line as exposed. No new
diagnosis required.

**Reproducer:**

```bash
cd packages/testing
# Pre-fix: 1 failure observed in a scoped 6-spec sweep at workers:1; passes
# in isolation. Post-fix: 15/15 pass in 37.3s.
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  --grep "tool_result line carries top-level toolUseResult as array of text blocks" \
  e2e/web/chat-stream-vs-replay-parity.spec.ts
```

---

## 2026-04-28 — Chat resume-flow flakes (chat-features:85, chat-history:62)

**Branch / worktree:** `worktree-e2e-flake-stragglers`
**Failing specs:**
- `chat-features.spec.ts:85` "VALID: multi-turn conversation"
- `chat-history.spec.ts:62` "EDGE: second message in session resumes"
- `chat-features.spec.ts:145` "VALID: user message appears in chat"

**Symptom:** After first response visible, `CHAT_INPUT` stayed `disabled`
(`isStreaming` pinned `true`). Second `fill('Second message')` timed out
because Playwright respects disabled. Both specs failed at repeats 11–14 in
the broad sweep, passed 30/30 alone.

**Root causes (THREE independent bugs all surfaced as the same symptom):**

1. **Live `chat-complete` dropped during the subscribe-quest replay window.**
   `serverInitResponder`'s per-quest event handler `continue`'d ALL events when
   `replayInProgress` was set for the (client, questId) pair. Replay only
   emits `chat-output`, so suppressing `chat-complete` (and chat-history-complete,
   clarification-request, etc.) was wrong.
2. **Buffered live `chat-output` was drained AFTER the subscribe-quest
   `chat-history-complete` send.** The web flips `isStreaming(false)` on
   chat-history-complete but flips it back to `true` on every chat-output. If
   the drain runs in `.finally` after the chat-history-complete send, the last
   event the client receives is a chat-output that re-pins `isStreaming`.
3. **`chatHistoryCompletePayloadContract` (web) required `chatProcessId`,**
   but subscribe-quest's finisher sends `{questId}` only — no chatProcessId.
   `safeParse` failed silently and `setIsStreaming(false)` never ran from this
   event. Because the web binding has NO questId filter on chat-complete or
   chat-history-complete, the contract loosening is the only way to accept both
   emit shapes.

**Fix locations:**
- Bug 1: `packages/server/src/responders/server/init/server-init-responder.ts`
  — replay-window suppression now scopes to `type === 'chat-output'` only;
  every other PER_QUEST event falls through to direct delivery.
- Bug 2: same file — `chat-history-complete` send moved into `.finally` AFTER
  the buffer drain, so the last event the client receives is always
  `chat-history-complete`.
- Bug 3: `packages/web/src/contracts/chat-history-complete-payload/
  chat-history-complete-payload-contract.ts` — `chatProcessId` made `.optional()`,
  added `questId` `.optional()`. Companion test+stub updated.

**Negative results / dead ends:**
- **Per-questId pre-subscribe chat-output buffer in `serverInitResponder`.**
  Two iterations.
  - First: unconditional append on every chat-output emit, drain on
    subscribe-quest. Caused dupes — replay's JSONL read also delivered the
    same frames via the `quest-replay-` direct-send path. Got "First response
    resolved to 2 elements" strict-mode violations.
  - Second: subscriber-aware (only append when no current subscriber to that
    questId). Helped first-message timing race for some tests but kept dupes
    when JSONL replay also covered the content. Still introduced new dupe
    failures in page-refresh tests.
  - **Verdict: REVERTED.** Any frame in both buffer and JSONL lands twice. The
    right fix turned out to be `questWaitForSessionStampBroker` (separate
    entry below) — make replay actually work instead of bypassing it.

**Reproducer:**
```bash
cd packages/testing
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/chat-features.spec.ts e2e/web/chat-history.spec.ts \
  e2e/web/chat-replay-subagent-grouping.spec.ts e2e/web/chat-send-auto-resumes.spec.ts \
  e2e/web/chat-smoke.spec.ts e2e/web/chat-stop-pauses-quest.spec.ts \
  e2e/web/chat-stop.spec.ts e2e/web/chat-streaming-subagent-grouping.spec.ts \
  e2e/web/chat-unified-pipeline.spec.ts
```
Both `chat-features.spec.ts` and `chat-history.spec.ts` ALONE passed 30/30 at 15x.
Cross-spec leakage warmup: ~10 prior repeats before failures started.

---

## 2026-04-28 — quest-ws-update:177 sessionId-stamp race

**Branch / worktree:** `worktree-e2e-flake-stragglers`
**Failing spec:** `quest-ws-update.spec.ts:177` "VALID: spec panel appears
when quest is linked mid-chat via quest-session-linked WS event"

**Symptom:** New-chat flow's first message: `await expect(page.getByText
('Quest created successfully')).toBeVisible()` timed out. The chat-output
frame for that text never arrived at the client. Failed 3/15 in the
non-chat sweep, all at late repeats.

**Root cause:** Subscribe-quest's replay loads the quest and walks
`workItems` looking for `sessionId !== undefined`. New-chat flow stamps
sessionId on the chaoswhisperer workItem ASYNCHRONOUSLY: CLI emits init
line → `chat-spawn-broker`'s `sessionId$` resolves → `.then` runs
`questGetBroker` → finds the un-stamped chat workItem → calls
`questModifyBroker` → file write completes. Total ~10ms, but a subscribe
that arrives in this window loads the quest before the persist lands and
sees a pending workItem with no sessionId. Replay skips it. The chat-output
emitted before subscribe (no live subscriber yet) is now unrecoverable.

In the failure log, server timestamps inside the WS payloads showed
quest-modified at `T=20:30:46.065Z` (load) and the next quest-modified at
`T+5ms = 20:30:46.070Z` (persist). 5ms gap was enough.

**Fix location:**
- New broker: `packages/server/src/brokers/quest/wait-for-session-stamp/
  quest-wait-for-session-stamp-broker.ts` (+ `.proxy.ts` + `.test.ts`).
  Recursive poll, default 200ms total / 20ms interval, exits early when no
  chaoswhisperer/glyphsmith workItem is still pending without a sessionId.
- Wired into `serverInitResponder.ts` subscribe-quest replay path BEFORE the
  workItems-walk-and-replay loop. Also wired into `serverInitResponder.proxy.ts`.

**Negative results / dead ends:**
- **Stamping sessionId synchronously inside `chat-spawn-broker`.** Considered
  restructuring chat-spawn-broker to await `questModifyBroker` before letting
  `onLine` emit chat-output. Would have meant buffering all stream output
  until persist finished — delays user-visible streaming. Polling on the
  read side is cleaner; only the rare race-window subscribe pays the cost.
- **Adding `guildId` to the `OrchestrationProcess` contract** (as part of the
  broader investigation into stale processes). Considered as more invasive
  alternative to `guildRemoveResponder`'s quest-list sweep. Would have
  required updating ~10 register call sites across orchestrator. Quest-list
  lookup is enough.

**Reproducer:**
```bash
cd packages/testing
# In isolation: passes
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/quest-ws-update.spec.ts
# Under load with chat sweep: fails 3-4/15 around repeats 11-14
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/chat-features.spec.ts e2e/web/chat-history.spec.ts \
  e2e/web/chat-smoke.spec.ts e2e/web/quest-ws-update.spec.ts
```

---

## 2026-04-28 — Cross-spec chat-tail handle leak via guildRemove

**Branch / worktree:** `worktree-e2e-flake-stragglers`
**Failing specs:** None directly — this was a contributing factor to general
slow degradation across long sweeps, not a single-test failure.

**Symptom:** After the chat-* sweep ran, `ward-execution-streaming` flake
rate jumped from 1/30 (clean run alone) to 12/30 (run after chat sweep).
Long-running playwright runs accumulated `fs.watch` handles in the server
process — one per chat session's post-exit tail (`mainTailStopHandle`).

**Root cause:** `guildRemoveResponder` only swept processes whose questId
appeared in `questExecutionQueueState`. Chat post-exit tail handles are
registered in `orchestrationProcessesState` but never enter the queue — so
the queue-only sweep missed them. Every `cleanGuilds()` between specs left
the chat tails alive, accumulating across the entire playwright run until
SIGTERM.

**Fix location:**
- `packages/orchestrator/src/responders/guild/remove/guild-remove-responder.ts`
  — added a quest-list-driven sweep that walks every quest folder under the
  guild, builds a Set of questIds, then iterates
  `orchestrationProcessesState.getAll()` killing any entry whose questId is
  in the set.
- Updated `.proxy.ts` and `.test.ts` companions.

**Negative results / dead ends:** None — the obvious fix worked first try.

**Reproducer:** Hard to isolate. The leak only manifests as cross-spec
timing degradation during long sweeps. After fix, broad sweep e2e flake rate
dropped substantially even on tests this fix didn't directly target.

---

## 2026-04-28 — ward-execution-streaming racy click on `[WARD]` row

**Branch / worktree:** `worktree-e2e-flake-stragglers`
**Failing specs:**
- `ward-execution-streaming.spec.ts:31` "mini boss ward streams output lines to execution panel"
- `ward-execution-streaming.spec.ts:174` "floor boss ward streams output lines to execution panel"

**Symptom:** Slot-streaming chat-output frames carrying `slotIndex` and
`workItemId` ARRIVED at the client over WS — the network log confirmed every
ward output line was delivered. But `executionPanel.getByText('lint
        @dungeonmaster/...')` timed out, and the page snapshot showed the
`[WARD]` row in the execution panel rendered as `▸ ... DONE` (chevron
collapsed) with no expanded body. The activity panel on the right rendered
the same lines — so the entries were in `entriesBySession` and the binding
parsed them correctly.

**Root cause:** Race in `ExecutionRowLayerWidget`'s expansion lifecycle.

- The row's click handler is gated on
  `EXPANDABLE_STATUSES = [in_progress, complete, partially_complete, failed]`.
  When `status === 'pending'` or `'queued'` the click is a silent no-op AND
  `userClickedRef.current` is never flipped true.
- The auto-expand effect fires only while `status === 'in_progress' && hasEntries`.
- The auto-collapse effect fires when leaving `in_progress` IF
  `userClickedRef.current` is false, then resets the ref to false at the end.

For ward, the work item's lifecycle is `pending → in_progress → complete`,
and that progression can be very fast — under broad-sweep load the test's
`wardRow.click()` lands while `status === 'pending'`, the click is dropped,
and by the time entries arrive the row has gone through `in_progress` →
`complete` with `userClickedRef.current === false` the whole way. The
auto-collapse effect collapses the row as it leaves `in_progress`, and there
is no further trigger to re-expand because the click intent was discarded.

In isolation, orchestration was fast enough that `wardRow.click()` reliably
landed at `status === 'in_progress'`, the click stuck (`userClickedRef = true`),
and the auto-collapse on exit was suppressed. Under load (~late repeats in
the chat-* sweep) the timing slid into the pending window, hence the late-
repeat clustering (repeats 9–14).

**Fix location:**
- `packages/testing/e2e/web/ward-execution-streaming.spec.ts:152` and `:336`
  — replaced `executionPanel.getByText('[WARD]').first()` /
  `getByText('[WARD]').nth(1)` with
  `executionPanel.locator('[data-testid="execution-row-header"]').filter
  ({ hasText: '[WARD]' }).filter({ hasText: 'DONE' }).first()` /
  `.nth(1)`. The locator only resolves once the ward row has reached `DONE`
  (status `complete`), so the click always lands on an expandable row and
  toggles `userClickedRef = true` deterministically. Entries that landed in
  `entriesBySession` while the row was auto-collapsed are visible the moment
  the click expands the row.

**Negative results / dead ends:** None — the diagnosis from the failing-test
page snapshot (collapsed chevron + entries visible elsewhere) pointed
directly at the row's expansion lifecycle, and the `EXPANDABLE_STATUSES` /
`userClickedRef` interaction was the only way to land on that state.

**Latent product note** (not addressed in this fix): the same widget
behaviour means a real user clicking a `pending` row gets no feedback and
must re-click after the row becomes expandable. If we want clicks during
non-expandable status to "stick" once the row enters an expandable status,
the fix would live in `packages/web/src/widgets/execution-panel/
execution-row-layer-widget.tsx` — track click intent across status
transitions instead of dropping it inside the `if (isExpandable)` guard.

**Reproducer:**
```bash
cd packages/testing
# Alone: clean even pre-fix
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/ward-execution-streaming.spec.ts
# Under load:
#   pre-fix: 11/450 fails (5 mini boss + 6 floor boss, all at repeats 9–14)
#   post-fix: 0/450 fails for ward-execution-streaming
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/chat-*.spec.ts e2e/web/ward-execution-streaming.spec.ts \
  e2e/web/quest-execution-streaming.spec.ts
```

---

## OPEN / UNFIXED — chat-streaming-subagent grouping flake at late repeats

**Branch / worktree:** `worktree-e2e-flake-stragglers` (not addressed)
**Failing specs:**
- `chat-streaming-subagent-grouping.spec.ts:26` "VALID: {streamed Agent
  tool_use followed by user tool_result with tool_use_result.agentId
  (snake_case)} => sub-agent chain groups its sub-agent tail entries" —
  1/450 in the broad chat-* + execution-streaming sweep, at repeat 14.

**Symptom:** After clicking the SEND button (test fills "Stream sub-agent
via stdout") the test waits for the streamed parent-level assistant text
"All done" via `page.getByText('All done').toBeVisible({ timeout: 10s })`.
The assertion times out. The page snapshot shows:

- The pre-seeded session JSONL replayed correctly: `YOU "Kick off test"` and
  `SUB-AGENT "SUBAGENT_INNER_MARKER_xyz"` are visible.
- The chat input still has "Stream sub-agent via stdout" filled, the SEND
  button has the `[active]` Mantine state (just clicked).
- No `Agent` tool_use, no `tool_result`, no "All done" — so the LIVE-streamed
  response from the queued claude-mock never reached the chat.

**Suspected root cause area** (unconfirmed): the LIVE chat-output frames for
this `chaoswhisperer` work item are dropped because the work item's replay
already succeeded. `serverInitResponder` tracks `replayDeliveredWorkItems` —
if a work item's replay produced any frames, the live buffer for that
(client, questId, workItemId) tuple is dropped on subscribe-quest's
`.finally` to prevent dupes between replay and live paths. The race is:

1. The pre-seeded session JSONL contains "Kick off test" + the sub-agent
   tail. Replay reads this and emits `chat-output` to the client — the
   `chaoswhisperer` work item is now in `replayDeliveredWorkItems`.
2. The user click triggers POST `/chat` which spawns the fake CLI; the
   queued response streams Agent tool_use + tool_result + "All done". These
   are the LIVE frames for the same `chaoswhisperer` work item.
3. If the live frames arrive while `replayInProgressByClient` is still set
   for this quest, they go into `bufferedDuringReplay`. When subscribe-
   quest's `.finally` drains, it sees the work item in
   `replayDeliveredWorkItems` and drops the buffer to avoid dupes — losing
   the live "All done".

This wouldn't be a problem on every repeat because the test's POST `/chat`
might race the replay finish line either way. Late repeats accumulate
server-side state (slow file writes, more events on the bus) which
lengthens the replay window enough to catch the live frames.

**Where the fix probably lives:** `packages/server/src/responders/server/
init/server-init-responder.ts` — the dedupe machinery currently treats
"replay produced N frames for this workItem" as "drop the live buffer for
this workItem". The fix needs to distinguish "frames replay already shipped"
from "frames emitted live AFTER the user's new send", e.g. by stamping the
buffered envelopes with a wall-clock timestamp at enqueue and only dropping
those that pre-date the work item's last replay-emitted frame, OR by
keying replay-vs-live dedupe on `chatProcessId` (live frames carry the new
spawn's chatProcessId, replay frames carry `quest-replay-...`).

**Reproducer:**
```bash
cd packages/testing
# Under broad sweep load (chat-* + execution-streaming): ~1/150 of this test
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/chat-*.spec.ts e2e/web/ward-execution-streaming.spec.ts \
  e2e/web/quest-execution-streaming.spec.ts
# Failed at repeat 14 of chat-streaming-subagent-grouping.spec.ts on this
# branch's broad sweep after the ward-execution-streaming fix.
```

---

## 2026-04-28 — Subagent tail lifecycle race

**Branch / worktree:** Fixed in `worktree-subagent-parity-tests`, merged into
`worktree-e2e-flake-stragglers` (commit `9561ea00`).
**Failing specs:** `chat-stream-vs-replay-parity.spec.ts` test 3 + variants
1–3. The streaming-half assertions previously had a `STREAMING-HALF:
structural-only` comment block dodging the race; that weakening is removed —
streaming-half now asserts entry count, TOOL_ROW count, file-path filters,
status icons, and inner content.

**Symptom:** Sub-agent inner-body chain renders `(0 entries)` in live
streaming. Page reload makes it appear (replay reads JSONL synchronously
start-to-finish).

**Root cause (two distinct races, both addressed):**

1. **Resolve race.** `chatSubagentTailBroker` is started async inside
   `chat-start-responder.onAgentDetected` as fire-and-forget; the broker's
   promise resolves only after `await guildGetBroker(...)` and the sync setup
   of fs-watch-tail. If parent `chat-complete` fires first, `onComplete`
   iterates an empty `subagentStopHandles[]`; the broker is leaked AND its
   eventual `onEntries` emit lands past chat-complete on the wire.
2. **Drain race.** Even when the handle is in the array, `onComplete` calls
   `stop()` synchronously, flipping `fs-watch-tail-adapter`'s `state.stopped`
   to true. The synthetic-emit drain's queued readline `'line'` events fire
   AFTER stopped is set and are no-op'd at the gate inside `rl.on('line')`,
   dropping every line that hadn't yet been delivered.

**Fix locations:**
- `packages/orchestrator/src/adapters/fs/watch-tail/fs-watch-tail-adapter.ts`
  — handle now exposes `initialDrain: Promise<void>`; resolves once the
  synthetic-emit drain has delivered every pre-existing line via `onLine`,
  and `stop()` also resolves it so awaiters never hang on torn-down adapters.
- `packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts`
  — returns `{ stop, initialDrain }` so callers can await drain-before-teardown.
  `chat-main-session-tail-broker` keeps its current shape (`startPosition: 'end'`
  makes the drain a no-op).
- `packages/orchestrator/src/responders/chat/start/chat-start-responder.ts`
  — tracks in-flight broker setups in a Set; setup chain self-removes in
  `.finally`. `onComplete` is now async: awaits all in-flight setups (resolves
  the resolve race), then awaits each handle's `initialDrain` (resolves the
  drain race), then stops each tail, THEN emits `chat-complete`.
- `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts`
  — `onComplete` callback type widens to `void | Promise<void>` so async
  handlers don't trigger `no-misused-promises`. Fires-and-forgets via
  `Promise.resolve(...).catch(...)` (rejected handler logs to stderr).

**Negative results / dead ends:** None recorded — fix landed on first
serious attempt after the two-race diagnosis was clear.

**Cross-reference for future flake hunters:** if you ever see "(0 entries)"
in a live sub-agent chain in real use (not just test), the resolve/drain race
is the suspect; check whether the current handle exposes `initialDrain` and
whether `chat-start-responder.onComplete` is awaiting it.

---

## Symptom → suspected bug catalog (quick reference)

When an agent picks up an e2e flake, this list should be the first thing
checked. Each entry below has a direct link to the entry above.

| Symptom                                                                                        | Likely candidates                                                                                                                                                                                                                                                                                                                                                                                                      |
|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `isStreaming` pinned true / chat input disabled after first response                           | "Chat resume-flow flakes" — three independent bugs share this symptom                                                                                                                                                                                                                                                                                                                                                  |
| `expect(text).toBeVisible()` times out, network log SHOWS the WS frame                         | Web binding's contract `safeParse` rejecting silently, OR row-expansion lifecycle (see "ward-execution-streaming racy click"), OR slot-rendering pipeline                                                                                                                                                                                                                                                              |
| `expect(text).toBeVisible()` times out, no WS frame for that text                              | "quest-ws-update:177 sessionId-stamp race" if first message; live emit before subscribe                                                                                                                                                                                                                                                                                                                                |
| Strict-mode violation: text resolved to N elements                                             | Buffer-replay dupe — frame delivered twice via different paths                                                                                                                                                                                                                                                                                                                                                         |
| Fails at repeat 11+ in broad sweep, passes alone                                               | State accumulation — fs.watch handles, map growth. See "Cross-spec chat-tail handle leak"                                                                                                                                                                                                                                                                                                                              |
| Sub-agent chain renders "(0 entries)"                                                          | "Subagent tail lifecycle race" — fixed (resolve + drain races in chat-start-responder)                                                                                                                                                                                                                                                                                                                                 |
| `TOOL_ROW_RESULT` toBeVisible times out, page snapshot shows chevron `▸` collapsed AFTER click | "chat-stream-vs-replay-parity TOOL_ROW header click toggles instead of expands" — `defaultExpanded={true}` from streaming `isLastUnpaired` window locks `expanded=true` in `useState`, blind click toggles → collapse. Recurs across tests in this spec (2026-05-04 fix landed at lines 1368/1400, 2026-05-11 fix at lines 1531/1560). The cross-reference under the 2026-05-04 entry lists other still-exposed lines. |
| `backendWsCount` is 2+ in multi-widget assertion under full ward, passes alone                 | "Three CPU-contention flakes (multi-widget WS, rate-limits poll, mcp init startup)" — handshake-failure WS counted alongside durable one; count by `framesent`/`framereceived` instead                                                                                                                                                                                                                                 |
| Rate-limits / queue / outbox-watcher visible-update test times out under load                  | "Three CPU-contention flakes" — fixed-poll-interval responders exceed test budget; expose env-var override for the interval                                                                                                                                                                                                                                                                                            |
| `QUEST_QUEUE_BAR_COLLAPSED_LABEL` not visible after `request.post(/start)` in e2e              | Queued quest hits terminal in <1 s — emptying the queue before React renders. Pause the quest immediately after start (see `execution-queue-streaming.spec.ts:91-97` pattern)                                                                                                                                                                                                                                          |
| MCP integration test "Server starts and responds" times out under full ward                    | "Three CPU-contention flakes" — fixed `startupMs` sleep insufficient under tsx cold-start contention; replace with deadline-budgeted readiness probe                                                                                                                                                                                                                                                                   |

When you fix a flake not yet in this catalog, add a new symptom row.
