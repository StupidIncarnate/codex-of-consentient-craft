# E2E Flakiness Triage Playbook

How we hunt down and fix flaky e2e tests. This is the methodology — case
records of specific past flakes (symptom, root cause, where the fix landed,
dead ends) live in **`playbook/e2e-flakiness-log.md`**. **Read the log
first** when triaging a new flake — there's a symptom→suspected-bug catalog
at the bottom of the log that points at prior fixes.

This playbook applies whenever you see a Playwright spec that passes alone but
fails intermittently in the broader suite. For user-reported regressions
where the symptom is "the UI doesn't show what should be there" or "an
existing test isn't strict enough to catch this," go to
**`playbook/regression-through-e2e.md`** instead — it owns the
"failing-test-before-fix" workflow for that class of bug.

The playwright tests live at `packages/testing/e2e/web/*.spec.ts`. The harness
pins `workers: 1, fullyParallel: false`, so all runs are serial.

---

## Phase 0: Check the log first

Before running any sweeps, open `playbook/e2e-flakiness-log.md` and:

1. Search the **symptom→suspected-bug catalog** at the bottom for any pattern
   matching what was reported.
2. If there's a candidate, read its full entry — the user-visible failure may
   match a known bug you can fix directly without re-investigating.
3. If a candidate is listed as **OPEN / UNFIXED**, you're picking up where
   someone left off. Read their notes, then go to Phase 2 (skip discovery
   sweeps — the spec list is already known).
4. If nothing matches, proceed to Phase 1.

The log is the institutional memory. E2E flakes recur across infrastructure
changes, and several of the bugs we've found share symptoms with other
unrelated bugs — knowing which ones have been seen before saves hours.

---

## Phase 1: Identify flakes

### 1.1 Run a broad sweep at 15x

```bash
cd packages/testing
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/<spec1>.spec.ts e2e/web/<spec2>.spec.ts ... \
  > /tmp/sweep.log 2>&1
```

Why 15x: with `workers: 1`, 100x is too slow (chat-* sweep is ~7 min at 15x,
~45 min at 100x); 5x doesn't surface enough stragglers. 15x is the sweet spot
where state-accumulation issues reliably reproduce in the late repeats.

Why `--retries=0`: we're hunting flakes, not masking them.

Why `--reporter=line`: gives one-line-per-test progress without overwhelming
output. JSON reporter buries the failure context.

**DO NOT** run two playwright invocations in parallel — both default to port
5737 and the second's webServer either fails to start or kills the first's.
`reuseExistingServer: false` doesn't save you.

### 1.2 Tally failures by spec

```bash
awk '/passed|failed/' /tmp/sweep.log | tail -3
awk '/test-results\/.*test-failed/' /tmp/sweep.log | sort -u | \
  awk -F/ '{print $2}' | awk -F'-chromium' '{print $1}' | sort | uniq -c | sort -rn
```

What the output looks like in a representative bad run:

```
  16 failed
  539 passed (15.1m)

      7 ward-execution-streaming-W-c9334-ut-lines-to-execution-panel
      5 ward-execution-streaming-W-9d812-ut-lines-to-execution-panel
      4 quest-execution-streaming--5eee3-ext-content-from-pathseeker
```

A test that fails 7+ times across 15 repeats is a hard flake. 1–2 fails is
softer — could be timing noise or a different root cause. Cluster the fails
by spec to spot patterns.

### 1.3 Confirm the flake reproduces in a smaller scope

Cut the spec list down to the suspect file plus its likely upstream specs.
If the flake stops reproducing, you have cross-spec leakage (Phase 2).
If it still reproduces, the bug is intra-spec.

```bash
# Suspect: chat-history.spec.ts:62 fails ~60% in full suite. Run alone:
npx playwright test --repeat-each=15 --retries=0 e2e/web/chat-history.spec.ts
# 30/30 pass → cross-spec leakage confirmed
```

---

## Phase 2: Diagnose root cause

### 2.1 Bisect cross-spec leakage

When a spec fails in the full suite but passes alone, find the minimal
predecessor set that triggers the flake.

```bash
# Add ONE upstream spec at a time:
npx playwright test --repeat-each=15 --retries=0 \
  e2e/web/chat-features.spec.ts e2e/web/chat-history.spec.ts
# 105/105 pass → not chat-features alone

# Add more:
npx playwright test --repeat-each=15 --retries=0 \
  e2e/web/chat-features.spec.ts e2e/web/chat-history.spec.ts \
  e2e/web/chat-replay-subagent-grouping.spec.ts ...
# eventually a sweep starts to fail at repeat 11+
```

The "warm-up time" (which repeat number first fails) is informative.
Failures starting at repeat 11+ usually mean state accumulation, not a single
poisoning spec. Failures starting at repeat 1 mean specific state from spec A
breaks spec B.

### 2.2 Read the failure attachments — they have a network log

Playwright failure dumps include a `__NETWORK_LOG__ ... __NETWORK_LOG_END__`
block with HTTP requests AND WS frames. This is the smoking gun for most
flakes.

```bash
# Get the WS log for the LAST failure of a target spec
awk '/<spec name keyword>/{found=1} found && /__NETWORK_LOG__/{cap=1} cap{print} \
  cap && /__NETWORK_LOG_END__/{exit}' /tmp/sweep.log | tail -50
```

What to look for:

- **WS frames present but assertion still failed** → web received the message
  but didn't render or didn't process. Check the web's binding handler for
  silent `safeParse` failures or questId-filter bailouts.
- **WS frames missing** → server emitted but no subscriber, OR server didn't
  emit. Check `clientSubscriptions` filter in `server-init-responder` and the
  PER_QUEST event handler.
- **Frames arrive in wrong order** → React state flips end up wrong. Check
  the `.then` / `.finally` ordering in subscribe-quest's replay path.
- **Inline `updatedAt` timestamps inside payloads** tell you persist-vs-load
  races. A quest-modified at server time `T` followed 5ms later by another
  quest-modified at `T+5ms` with new fields means the first read was stale.

### 2.3 Check the constants

Most e2e flakes trace to one of these load-bearing facts about this
codebase. Before chasing a unique theory, audit which apply:

1. **The server is a single long-lived node process for the entire playwright
   run.** Module-level state in orchestrator/server (`orchestrationProcessesState`,
   `pendingClarificationState`, the maps inside `serverInitResponder`'s closure)
   accumulates across every spec until SIGTERM at end of run. `reuseExistingServer:
   false` means a fresh server PER playwright invocation but NOT per spec.
2. **All `SimpleTextResponseStub`/`ResumeResponseStub` calls default to sessionId
   `e2e-session-00000000-0000-0000-0000-000000000000`.** Different guildPaths keep
   JSONL files distinct on disk, but state keyed by sessionId can collide.
   `pendingClarificationState.sessionQuestions` is the prime example.
3. **Web's WS opens AFTER `questId` is known** (in `useQuestChatBinding`). The
   new-chat path is: POST → questId in HTTP response → navigate → questId set →
   WS opens → subscribe-quest. There's a ~400 ms window between POST-return and
   subscribe-arrival on the server. Anything emitted with no subscriber gets
   dropped.
4. **`chat-spawn-broker` stamps sessionId on the workItem ASYNC** after the CLI's
   init line. ~10ms total. If subscribe-quest arrives in this window, replay loads
   the quest BEFORE the persist lands and skips the workItem. `questWaitForSession-
   StampBroker` exists to absorb this.
5. **Two emit paths for `chat-history-complete` with different payload shapes.**
   `ChatReplayResponder` sends `{chatProcessId, sessionId, questId?, workItemId?}`.
   subscribe-quest's finisher in `serverInitResponder` sends `{questId}` only.
   The web contract must accept BOTH.
6. **Web binding does NO questId filter on `chat-complete` or
   `chat-history-complete`.** ANY of those events sets `isStreaming = false`
   regardless of which questId. `chat-output` IS questId-filtered (line ~89 of
   `use-quest-chat-binding.ts`).
7. **`PER_QUEST_EVENT_TYPES` covers 8 event types, but only `chat-output` is
   dual-emitted by both live broadcast AND replay.** Dedupe machinery
   (`bufferedDuringReplay`, `replayDeliveredWorkItems`, `quest-replay-` prefix
   check) only matters for chat-output. Every other event in that set should
   pass through during the replay window.
8. **`mainTailStopHandle`** (post-exit chat tail in `chat-start-responder.ts`) is
   registered in `orchestrationProcessesState` and persists across guild
   lifetimes. The `guildRemoveResponder` per-quest sweep is the only path that
   cleans them up.
9. **Slot-streaming chat-output (`slotIndex`) goes through `pipelineChatOutput-
   Buffer`** flushed every 100ms — different code path from chat chat-output.
10. **The fake Claude CLI** (`packages/testing/test/harnesses/claude-mock/bin/
    claude`) writes JSONL `fs.writeFileSync` on first call, `fs.appendFileSync`
    when `--resume` is in argv. Per-cwd queue scoping means different specs'
    queues don't bleed.

### 2.4 Recognize symptom clusters

Some symptoms are routinely caused by multiple independent bugs. Don't stop at
the first plausible explanation.

**`isStreaming` pinned `true` after first response (input disabled, fill timeout):**
At least three independent bugs land on this symptom — see
`tmp/e2e-flake-stragglers-progress.md` "Bugs found that share one symptom" for
the catalog. If you fix one and the symptom persists, check the others.

**Chat-output frame arrives via WS but text not visible:**
- Wrong slot rendering predicate in `execution-panel-widget`.
- `chatOutputPayloadContract.safeParse` rejected the payload silently.
- Strict-mode duplicate match (text appears twice — usually a buffer-replay
  dupe). Check for `STRICT MODE VIOLATION` in the assertion message.

**Tests pass alone, fail at repeat 11+ in larger sweeps:**
State accumulation. fs.watch handle leak, map growth, file system clutter.
Check what's mutated by module-level closures — those are the leak surfaces.

---

## Phase 3: Iterate fixes

### 3.1 Always start with a deterministic fix

Banned strategies:
- `setTimeout` / `sleep` to "give the system time".
- `--retries=N` to mask the flake.
- Loosening assertions to skip the failing path ("STREAMING-HALF: structural-only"
  patterns are an existing example of this trap — works in the short term but
  hides a real bug).

Acceptable strategies:
- Polling with a deadline budget (e.g. `questWaitForSessionStampBroker`,
  `chatReplayJsonlReadBroker`'s ENOENT retry) — bounded, deterministic, exits
  early when the condition resolves.
- Reordering operations so completion synchronizes with completion.
- Adding state cleanup hooks at lifecycle boundaries (e.g. `guildRemove-
  Responder` killing per-guild processes).
- Adjusting contracts to accept the actual wire format (when the wire format
  has multiple legitimate emit paths).

### 3.2 Fix → build → unit → focused e2e — in that order, every time

```bash
# 1. After each source change:
npm run build --workspace=@dungeonmaster/<package>

# 2. Confirm types + lint + unit:
npm run ward -- --only lint,typecheck,unit -- packages/<package>

# 3. Re-run JUST the directly-affected spec at 15x:
cd packages/testing
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/<failing-spec>.spec.ts > /tmp/repro.log 2>&1
awk '/passed|failed/' /tmp/repro.log | tail -3
```

If the focused spec passes 15/15, **don't widen the scope yet.** First validate
the fix didn't break anything by re-running the same spec under the broader
context that originally surfaced the flake (Phase 4).

### 3.3 Hook gotchas you will hit

- **Raw `Map<K, number>` value types are blocked** by `require-zod-on-primitives`.
  Top-level `const FOO_MS = 100;` constants and `deadline?: number` parameters in
  broker signatures are accepted (`chat-replay-jsonl-read-broker` uses these).
  The rule fires on type usage in field declarations, not on runtime literals.
- **Nested functions are forbidden.** A recursive helper inside an `await
  loadQuest().then(async () => { ... })` block triggers extraction-to-transformer.
  Either extract to a sibling broker or use an existing one.
- **Non-exported helper functions are forbidden.** A small `const isUnstamped =
  ...` inside a broker file gets rejected with extraction-to-guard suggestion.
  Either inline at every call site or create a real guard file.
- **`while(true)` and any loop with `await` inside hits a triple stack:** `no-await-
  in-loop`, `require-atomic-updates`, `no-loop-func`. Recursive functions with a
  `deadline` param sidestep all three:
  ```ts
  const recur = async (params): Promise<X> => {
    if (terminate(params)) return params.current;
    if (Date.now() >= params.deadline) return params.current;
    await new Promise<void>((r) => setTimeout(r, params.intervalMs));
    return recur({ ...params, current: nextValue });
  };
  ```
- **`'pending'` is in BOTH `quest-status` and `work-item-status` enums.** The local
  `ban-quest-status-literals` rule blocks the literal — use
  `isPendingWorkItemStatusGuard({ status: wi.status })` (or quest-status equivalent
  per context).
- **A new broker file requires `.proxy.ts` AND `.test.ts` colocated AND parent's
  proxy must import the child proxy.** `enforce-implementation-colocation` and
  `enforce-proxy-child-creation` both fire. Three files per broker, plus
  import wire-up in the consuming responder's proxy.

### 3.4 Watch for negative results — they're load-bearing data

Every time a fix doesn't work, write down:
- What the fix was.
- What you expected to happen.
- What actually happened.
- Why it didn't work.

Examples from the flake-stragglers session:

> **Per-questId pre-subscribe chat-output buffer (REVERTED).** Idea: archive
> chat-output frames so a late subscribe could replay them. Result: dupes,
> because replay's JSONL read also delivered the same frames via the
> `quest-replay-` direct-send path. Strict-mode violations on assertion text.
> Verdict: fundamental dedup problem — any frame in both buffer and JSONL lands
> twice. Right fix was to make replay actually work (via
> `questWaitForSessionStampBroker`) instead of bypassing it.

This format is what saves the next person from re-attempting the same dead end.
Stuff it in `tmp/<branch-name>-progress.md` as you go.

---

## Phase 4: Confirm and re-stress

### 4.1 Re-stress the originally-failing spec at 15x in isolation

```bash
cd packages/testing
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/<failing-spec>.spec.ts > /tmp/sweep-target.log 2>&1
awk '/passed|failed/' /tmp/sweep-target.log | tail -3
```

Must be N/N (e.g. 75/75 if the spec has 5 tests). Anything less and the fix
isn't done — even one fail at this scope means the deterministic guarantee is
broken.

### 4.2 Re-stress under the original cross-spec context

```bash
# Run the failing spec PRECEDED BY the specs that originally caused it to leak.
# This is the test that proves you fixed cross-spec leakage, not just intra-spec.
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/<predecessor-1>.spec.ts e2e/web/<predecessor-2>.spec.ts \
  e2e/web/<failing-spec>.spec.ts > /tmp/sweep-context.log 2>&1
```

If the focused 15x passes but the contextual 15x fails, the leak source isn't
fully identified. Go back to Phase 2 with the new failure attachments.

### 4.3 Then, and only then, run the broad sweep

```bash
# 16-spec sweep, ~15 min. Run when you've already validated the focused fix.
npx playwright test --repeat-each=15 --retries=0 --reporter=line \
  e2e/web/chat-features.spec.ts e2e/web/chat-history.spec.ts \
  e2e/web/chat-replay-subagent-grouping.spec.ts e2e/web/chat-send-auto-resumes.spec.ts \
  e2e/web/chat-smoke.spec.ts e2e/web/chat-stop-pauses-quest.spec.ts \
  e2e/web/chat-stop.spec.ts e2e/web/chat-streaming-subagent-grouping.spec.ts \
  e2e/web/chat-unified-pipeline.spec.ts e2e/web/quest-ws-update.spec.ts \
  e2e/web/ward-execution-streaming.spec.ts e2e/web/quest-detail.spec.ts \
  e2e/web/quest-dual-panel.spec.ts e2e/web/quest-execution-streaming.spec.ts \
  e2e/web/session-without-quest.spec.ts e2e/web/clarification-design-decisions.spec.ts \
  > /tmp/sweep-broad.log 2>&1
```

Tally fails by spec (Phase 1.2). Three outcomes:

| Outcome | Meaning |
|---|---|
| 0 fails | Done. Move on. |
| Same fails as before | Fix didn't take effect — wrong root cause OR fix didn't reach the expected code path. Diagnose with Phase 2 again. |
| New fails in unrelated specs | Regression. Bisect: revert the latest change and re-sweep. If fails go away, fix introduced the regression — needs revisit. |

### 4.4 Don't widen scope until the focused scope is green

The temptation when you see broad-sweep fails in OTHER specs is to start
chasing those too. Resist. Each spec gets its own focused fix → focused
re-stress → contextual re-stress before you touch the next one. Otherwise
you'll have multiple in-flight changes and won't know which one introduced a
regression.

---

## Phase 5: Log the fix

Before you walk away from the worktree, add an entry to
`playbook/e2e-flakiness-log.md`. Use the template at the top of that file.
Required fields:

- **Date + short title** — describe the symptom from the user's perspective.
- **Branch / worktree** — so the next person can find the diff.
- **Failing specs** — `<file>:<line>` for each affected test.
- **Symptom** — one sentence the user would say.
- **Root cause** — one paragraph. If multiple independent bugs share the
  symptom, list each separately and explain how they interact.
- **Fix location** — file paths (and line numbers if useful) where the change
  landed. Future readers must be able to find the diff without git
  archaeology.
- **Negative results / dead ends** — fixes you tried that didn't work, and
  WHY. This is the most undervalued field. Save the next agent from
  re-attempting the same approach.
- **Reproducer** — the minimal sweep command that surfaces the flake. If
  cross-spec leakage was involved, list the predecessor specs.

Update the **symptom→suspected-bug catalog** at the bottom of the log if
you've identified a new symptom pattern. The catalog is what Phase 0 of the
next agent's investigation reads.

If the flake is OPEN — i.e. you've identified the symptom and root cause but
ran out of budget or scope to fix it — file it as `## OPEN / UNFIXED — <title>`
so the next agent knows to pick up where you left off.

---

## Common kit

### Sweep run management

```bash
# Don't let ward sweeps timeout — they're 7-15 min on workers:1
# Use timeout=600000 (10 min) for focused sweeps, 1800000 (30 min) for broad.

# DO NOT poll a running playwright run in a sleep loop. Use:
#   - run_in_background: true
#   - Read the .output file once when the task-notification fires.
```

### Useful awk / grep patterns

```bash
# Tally fails by spec
awk '/test-results\/.*test-failed/' /tmp/sweep.log | sort -u | \
  awk -F/ '{print $2}' | awk -F'-chromium' '{print $1}' | sort | uniq -c | sort -rn

# Get final pass/fail line
awk '/passed|failed/' /tmp/sweep.log | tail -3

# Pull network log for nth failure of a test (replace test name keyword)
awk '/<test name keyword>/{count++; if(count==N)found=1} found && /__NETWORK_LOG__/{cap=1} cap{print} cap && /__NETWORK_LOG_END__/{exit}' /tmp/sweep.log

# Find unique error strings
awk '/Locator:/' /tmp/sweep.log | sort -u
awk '/Error: \[/' /tmp/sweep.log | sort -u
```

### Native search is blocked by hooks

Use `mcp__dungeonmaster__discover` for source-tree exploration:

```
discover({ glob: "packages/server/src/responders/server/init/**" })
discover({ grep: "isPendingWorkItemStatusGuard", context: 2 })
```

`mcp__dungeonmaster__get-project-map` once per session before any discover.

### Run from repo root, not packages

`npm run dev`, `npm run prod`, `npm run ward`, `npm run build` — all root-level.
Don't `cd` into a package. To scope ward, pass paths after `--`:

```bash
npm run ward -- --only unit -- packages/orchestrator
```

---

## What "done" looks like

A flaky test is genuinely fixed when:

1. The originally-failing spec passes 15/15 in isolation.
2. The originally-failing spec passes 15/15 when preceded by every spec that
   was in the path that originally surfaced the flake.
3. The broad sweep (16 specs at 15x = ~555 runs) shows 0 fails for that spec.
4. The fix is deterministic — completion-synchronizes-with-completion, not a
   timeout-based hope.
5. Lint, typecheck, unit, integration all green for affected packages.
6. **An entry is added to `playbook/e2e-flakiness-log.md`** with the symptom,
   root cause, fix location, and any dead ends — so the next agent who hits
   a similar symptom can grep their way to the answer instead of
   re-investigating from scratch.

If any of those are unchecked, the flake isn't done. `tmp/` files are
ephemeral and will get garbage-collected — don't put load-bearing
documentation there.
