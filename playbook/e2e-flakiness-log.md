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

## OPEN / UNFIXED — execution-slot-streaming flakes

**Branch / worktree:** `worktree-e2e-flake-stragglers` (not addressed)
**Failing specs:**
- `ward-execution-streaming.spec.ts` "mini boss" — 7/15 fails under broad-sweep load
- `ward-execution-streaming.spec.ts` "floor boss" — 5/15 fails under broad-sweep load
- `quest-execution-streaming.spec.ts:31` "pathseeker streaming text" — 4/15 fails

**Symptom:** Slot-streaming chat-output frames (carrying `slotIndex` and
`workItemId`) ARRIVE at the client over WS — the network log confirms the
target text was delivered. But `executionPanel.getByText(...).toBeVisible
({ timeout: 15000 })` still times out. The execution-panel widget renders
nothing for the slot.

**Suspected root cause area** (not confirmed): slot-rendering pipeline in
`packages/web/src/widgets/execution-panel/`. Three angles to investigate:
1. `slotEntries` Map state path — is it being updated correctly under React's
   batching? Check `setSlotEntries` predicate in `useQuestChatBinding`.
2. The execution-panel rendering may be gated on a workItem status the test
   doesn't wait for. Confirm slot rendering activates on `pending` and
   `in_progress`, not just `complete`.
3. Under load, react may batch updates differently — possible stale-closure
   issue in slotEntries Map updates.

**Cross-load behavior:** In isolation (clean non-chat sweep), `ward-execution-
streaming` was 1/30 ≈ 3%. Under load (after the 9-spec chat sweep ran first),
12/30 ≈ 40%. So this is a load-aggravated bug, NOT a load-induced bug. The
flake is real even alone, just rarer.

**Where the fixes from this session DON'T apply:** None of the chat-related
fixes (1–5 in the resume-flow + sessionId-stamp entries above) touch slot-
streaming. `pipelineChatOutputBuffer` (the `slotIndex`-batched flush in
`serverInitResponder`) is a separate code path from the chat chat-output
delivery I fixed.

**Reproducer:**
```bash
cd packages/testing
# Alone: ~1/30 fail
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/ward-execution-streaming.spec.ts e2e/web/quest-execution-streaming.spec.ts
# Under load: ~12/30 fail
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/chat-*.spec.ts e2e/web/ward-execution-streaming.spec.ts \
  e2e/web/quest-execution-streaming.spec.ts
```

---

## 2026-04-28 — Subagent tail lifecycle race (other session, NOT yet fixed in master)

**Branch / worktree:** `worktree-subagent-parity-tests` (separate session
working on this)
**Failing specs:** `chat-stream-vs-replay-parity.spec.ts` tests 3 +
variants 1–3 (currently structurally weakened with `STREAMING-HALF: structural-only`
comment block to dodge the race).

**Symptom:** Sub-agent inner-body chain renders `(0 entries)` in live
streaming. Page reload makes it appear (replay reads JSONL synchronously
start-to-finish).

**Root cause** (per the other session's report): `chatSubagentTailBroker` is
started async inside `chat-start-responder.onAgentDetected`. When
`chat-start-responder.onComplete` fires, it synchronously stops every tail
in `subagentStopHandles[]` — but if the broker hasn't resolved yet, the stop
handle was never pushed; if it has, `state.stopped = true` flips before the
synthetic `'change'` event finishes draining the file. Either way, sub-agent
ChatEntries get dropped.

**Fix location** (planned, not landed): the other session is owning Option C
from their report — track in-flight tail-broker promises, await them in
`onComplete`, then await `stop()` (made async) for each handle, THEN emit
`chat-complete`.

**Why it didn't intersect with this session's flakes:** None of the chat-*
specs that this session targeted use `Task`/`Agent` tool_use. The
`chat-streaming-subagent-grouping` and `chat-replay-subagent-grouping` specs
that DO test sub-agent flow have weaker assertions that don't exercise the
race window. Only `chat-stream-vs-replay-parity` exercises it, and its
streaming-half assertions are gated.

**Cross-reference for future flake hunters:** if you ever see "(0 entries)"
in a live sub-agent chain in real use (not just test), this is the
suspected cause.

---

## Symptom → suspected bug catalog (quick reference)

When an agent picks up an e2e flake, this list should be the first thing
checked. Each entry below has a direct link to the entry above.

| Symptom                                                                 | Likely candidates                                                                       |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| `isStreaming` pinned true / chat input disabled after first response    | "Chat resume-flow flakes" — three independent bugs share this symptom                  |
| `expect(text).toBeVisible()` times out, network log SHOWS the WS frame  | Web binding's contract `safeParse` rejecting silently, OR slot-rendering pipeline      |
| `expect(text).toBeVisible()` times out, no WS frame for that text       | "quest-ws-update:177 sessionId-stamp race" if first message; live emit before subscribe |
| Strict-mode violation: text resolved to N elements                       | Buffer-replay dupe — frame delivered twice via different paths                         |
| Fails at repeat 11+ in broad sweep, passes alone                         | State accumulation — fs.watch handles, map growth. See "Cross-spec chat-tail handle leak" |
| Sub-agent chain renders "(0 entries)"                                    | "Subagent tail lifecycle race" — different worktree                                    |

When you fix a flake not yet in this catalog, add a new symptom row.
