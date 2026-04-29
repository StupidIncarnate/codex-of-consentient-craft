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

| Symptom                                                                 | Likely candidates                                                                       |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| `isStreaming` pinned true / chat input disabled after first response    | "Chat resume-flow flakes" — three independent bugs share this symptom                  |
| `expect(text).toBeVisible()` times out, network log SHOWS the WS frame  | Web binding's contract `safeParse` rejecting silently, OR row-expansion lifecycle (see "ward-execution-streaming racy click"), OR slot-rendering pipeline |
| `expect(text).toBeVisible()` times out, no WS frame for that text       | "quest-ws-update:177 sessionId-stamp race" if first message; live emit before subscribe |
| Strict-mode violation: text resolved to N elements                       | Buffer-replay dupe — frame delivered twice via different paths                         |
| Fails at repeat 11+ in broad sweep, passes alone                         | State accumulation — fs.watch handles, map growth. See "Cross-spec chat-tail handle leak" |
| Sub-agent chain renders "(0 entries)"                                    | "Subagent tail lifecycle race" — fixed (resolve + drain races in chat-start-responder) |

When you fix a flake not yet in this catalog, add a new symptom row.
