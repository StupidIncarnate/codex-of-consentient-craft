# Quest Orchestrator — Manual Test Plan

Unit tests cover individual brokers and transformers. This doc covers **end-to-end orchestration behavior** — verifying
the system as a whole by checking quest.json state transitions.

---

## How to Run These Tests

### Test Fixtures

**Test quest:**

```
.dungeonmaster-home/.dungeonmaster-dev/guilds/32d4894c-ea9f-4ab5-8b04-818176c70815/quests/3824318d-d0f1-439b-b5e8-898701dfdc54/quest.json
```

**Role prompt statics (modify to control LLM behavior):**

```
packages/orchestrator/src/statics/
  chaoswhisperer-prompt/chaoswhisperer-prompt-statics.ts
  glyphsmith-prompt/glyphsmith-prompt-statics.ts
  pathseeker-prompt/pathseeker-prompt-statics.ts
  codeweaver-prompt/codeweaver-prompt-statics.ts
  siegemaster-prompt/siegemaster-prompt-statics.ts
  lawbringer-prompt/lawbringer-prompt-statics.ts
  spiritmender-prompt/spiritmender-prompt-statics.ts
```

### Test Procedure (per test case)

**Important:** The LLM cannot spawn Claude agent subprocesses from within a Claude Code session (nested session
restriction). All execution must be triggered by the **user** via the web UI or a separate terminal.

**1. Setup (LLM does this)**

- LLM calls out the test case ID, what it tests, and the expected results for:
    - `quest.json` state (work item statuses, quest status, new items created)
    - Backend behavior (errors logged, process state)
    - Frontend behavior (web UI reflects correct state, if applicable)
- LLM modifies `quest.json` to the required entry state for the test
- LLM modifies the relevant role prompt statics to force the LLM agent into the behavior we need (e.g., replace the
  prompt text with "exit immediately with signal complete" or "crash after 5 seconds"). We're in git, so all statics
  changes get reverted after testing.
- LLM tells user what to do next

**2. Execute (User does this)**

- User starts the dev server: `npm run dev` (in a separate terminal, NOT through the LLM)
- User triggers the test action via the web UI (start orchestration, send user message, approve, etc.)
- User tells LLM when execution is done

**3. Verify (LLM does this, User confirms)**

- LLM reads `quest.json` and compares actual state against expected
- LLM checks frontend if the test case has UI expectations
- LLM reports findings to user
- **User confirms "good" or flags discrepancies — LLM does NOT proceed until user confirms**

**4. Teardown (LLM does this ONLY after user confirms)**

- Kill the dev server
- Revert statics changes (`git checkout -- packages/orchestrator/src/statics/`)
- If the test PASSED: move to next test case
- If the test FAILED or uncovered a bug: notate it in the **Bugs Found During Testing** section below, then move on

**5. After each round of test cases**

- LLM launches a sub-agent to add regression tests to the appropriate unit/integration test files in the codebase
- Check with user on which test cases to codify and where they best fit before writing

### Bugs Found During Testing

| Test Case   | Date       | Description                                                                                                                                                                                                                                                                                                                    | Severity | Status                                    |
|-------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------------------------------------|
| H-1 (setup) | 2026-03-17 | Malformed quest.json (e.g. duplicate keys, parse failure) causes the entire quest listing endpoint to return 500. Should skip the broken quest and show an error indicator in the UI for that item only.                                                                                                                       | Medium   | Open                                      |
| H-1 (info)  | 2026-03-17 | Chaos → PathSeeker is NOT an automatic transition. User must manually approve observables (status → `approved`) and then hit Start to trigger OrchestrationStartResponder, which creates the pathseeker work item. The test entry state must be `approved` with chaos `complete`, and the user must click Start in the UI.     | Info     | N/A                                       |
| H-1         | 2026-03-17 | OrchestrationStartResponder transitions quest to `in_progress` but does NOT create pathseeker work item. Root cause: `questModifyBroker` returned `{ success: false }` and the result was never checked. Fix: added error check + throw. 7 tests added. Still need to investigate WHY the modify broker fails for this insert. | Critical | Fixed (error handling), Open (root cause) |

---

## Quest Status + Work Item Lifecycle (full map)

This is the complete map of quest status transitions, work item creation points, and failure-triggered recovery. Every
automatic transition after `in_progress` is driven by work item status changes — the orchestration loop derives quest
status from work items, never sets it directly.

### Phase 1: Spec (manual transitions — user + ChaosWhisperer)

```
[USER] Creates quest via web UI
  │
  ▼
① created
   workItems: [{ chaos, pending }]
  │
  ▼ [USER sends message via web UI chat]
② ChaosWhisperer runs (agent)
   status: created → explore_flows → review_flows (set by ChaosWhisperer during conversation)
  │
  ▼ [USER approves flows in web UI — Gate #1]
③ flows_approved
   status: flows_approved → explore_observables → review_observables (set by ChaosWhisperer)
  │
  ▼ [USER approves observables in web UI — Gate #2]
④ approved
   workItems: [{ chaos, complete }]
```

### Phase 1b: Design (automatic if needsDesign is true)

```
④ approved
  │
  ├─ needsDesign === false → skip to Phase 2 (User clicks Start)
  │
  ▼ needsDesign === true → Glyphsmith auto-starts
④a Glyphsmith runs (agent)
    workItems: [{ chaos, complete }, { glyph, pending }]
    status: approved → explore_design → review_design (set by Glyphsmith during conversation)
  │
  ▼ [USER approves design in web UI — Gate #3]
④b design_approved
    workItems: [{ chaos, complete }, { glyph, complete }]
```

### Phase 2: Execution (automatic transitions — orchestration loop)

**Entry:** User clicks Start in web UI.

```
⑤ in_progress
     - Quest status → in_progress
     - CREATES: pathseeker work item (dependsOn: [completed chat IDs])
     - Orchestration loop starts

   workItems: [{ chaos, complete }, { pathseeker, pending, dependsOn: [chaos-id] }]
```

### Phase 2a: PathSeeker

```
⑥ PathSeeker dispatched (pending → in_progress)
   Agent runs, creates steps, verifies quest integrity
  │
  ├─ VERIFY PASSES ──────────────────────────────────────────────────────────
  │   pathseeker → complete
  │   CREATES:
  │     N × codeweaver   (dependsOn: [pathseeker-id] + inter-step chains)
  │     1 × ward         (dependsOn: [ALL codeweaver IDs], spawnerType: 'command', maxAttempts: 3)
  │     1 × siege        (dependsOn: [ward-id], timeoutMs: 300000)
  │     N × lawbringer   (dependsOn: [siege-id])
  │     1 × final-ward   (dependsOn: [ALL lawbringer IDs], spawnerType: 'command', maxAttempts: 3)
  │
  ├─ VERIFY FAILS (attempt < maxAttempts - 1) ───────────────────────────────
  │   pathseeker → failed
  │   CREATES: pathseeker-retry (dependsOn: [], attempt: +1, insertedBy: failed-ps-id)
  │   Loop recurses → retry dispatched
  │
  ├─ VERIFY FAILS (no retries left) ─────────────────────────────────────────
  │   pathseeker → failed
  │   NO retry created. Quest → blocked.
  │
  ├─ CRASH / TIMEOUT ──────────────────────────────────────────────────────
  │   pathseeker → failed
  │   Same retry/no-retry logic as verify failure above.
  │
  └─ EXCEPTION (spawn failure, quest not found) ───────────────────────────
      pathseeker → failed
      Same retry/no-retry logic as verify failure above.
```

### Phase 2b: Codeweavers (parallel, up to 3 slots)

```
⑦ Codeweavers dispatched
   Each implements one quest step. N work items total, up to 3 slots.
   Items move pending → in_progress only when a slot picks them up.

   workItems: [
     { chaos, complete },
     { pathseeker, complete },
     { cw-1, in_progress }, { cw-2, in_progress }, { cw-3, in_progress },
     { cw-4, pending }, { cw-5, pending },          ◄── waiting for a slot
     { ward, pending, dependsOn: [cw-1, ..., cw-N] },
     { siege, pending, dependsOn: [ward-id] },
     { law-1, pending, dependsOn: [siege-id] }, ...
   ]
  │
  ├─ SUCCESS ───────────────────────────────────────────────────────────────
  │   codeweaver → complete
  │   When ALL codeweavers complete → ward becomes ready
  │
  ├─ FAILURE ───────────────────────────────────────────────────────────────
  │   codeweaver → failed
  │   Remaining in-progress codeweavers drain (run to completion).
  │   All pending work items (remaining codeweavers, ward, siege, lawbringers) → skipped.
  │   CREATES: pathseeker (replan — re-evaluates steps with knowledge of what failed).
  │
  ├─ CRASH / TIMEOUT ──────────────────────────────────────────────────────
  │   Respawned in next available slot (max 3 crash retries — [X4] FIXED).
  │   If no slot available → marked `failed` ([X6] FIXED).
  │
  └─ EXCEPTION (quest not found, step missing) ────────────────────────────
      codeweaver → failed
      Same as FAILURE above — drain, skip pending, spawn pathseeker.
```

### Phase 2c: Ward (single, command-based)

```
⑧ Ward dispatched (pending → in_progress)
   Runs quality checks (lint, typecheck, test). Exit code 0 = pass, non-zero = fail.

   workItems: [
     { chaos, complete }, { pathseeker, complete },
     { cw-1, complete }, { cw-2, complete }, { cw-3, complete },
     { ward, in_progress, dependsOn: [cw-1, cw-2, cw-3], maxAttempts: 3 },
     { siege, pending, dependsOn: [ward-id] },
     { law-1, pending, dependsOn: [siege-id] }, ...
   ]
  │
  ├─ PASS (exit code 0) ──────────────────────────────────────────────────
  │   ward → complete
  │   Siege becomes ready (dependsOn satisfied)
  │
  ├─ FAIL (retries left) ─────────────────────────────────────────────────
  │   ward → failed
  │   CREATES wardResult on quest (exitCode, filePaths, errorSummary)
  │   CREATES:
  │     1 × spiritmender (dependsOn: [], relatedDataItems: ['wardResults/<id>'])
  │     1 × ward-retry   (dependsOn: [spiritmender-id], attempt: +1, insertedBy: failed-ward-id)
  │   Siege dependsOn REWIRED to ward-retry
  │
  │   workItems: [
  │     ..., { ward, failed },
  │     { spiritmender, pending, dependsOn: [] },
  │     { ward-retry, pending, dependsOn: [spiritmender-id], attempt: 1 },
  │     { siege, pending, dependsOn: [ward-retry-id] },  ◄── rewired
  │     ...
  │   ]
  │
  ├─ FAIL (no retries left) ──────────────────────────────────────────────
  │   ward → failed
  │   All pending work items (siege, lawbringers) → skipped.
  │   CREATES: pathseeker (replan).
  │
  ├─ CRASH (process killed) ───────────────────────────────────────────────
  │   exitCode null → treated as failure (exit code 1 fallback).
  │   Same retry/no-retry logic as FAIL above.
  │
  └─ EXCEPTION (quest not found, write failure) ───────────────────────────
      ward → failed
      Same retry/no-retry logic as FAIL above.
```

### Phase 2c-recovery: Spiritmender (quest-level, from ward failure)

```
⑧a Spiritmender dispatched (pending → in_progress)
    Reads ward errors from relatedDataItems. Fixes 1 file per agent slot.

    workItems: [
      ..., { ward, failed },
      { spiritmender, in_progress, dependsOn: [], relatedDataItems: ['wardResults/<id>'] },
      { ward-retry, pending, dependsOn: [spiritmender-id] },
      { siege, pending, dependsOn: [ward-retry-id] },
      ...
    ]
  │
  ├─ SUCCESS ───────────────────────────────────────────────────────────────
  │   spiritmender → complete
  │   Ward-retry becomes ready (dependsOn satisfied)
  │
  ├─ FAILURE ───────────────────────────────────────────────────────────────
  │   spiritmender → failed
  │   All pending work items (ward-retry, siege, lawbringers) → skipped.
  │   CREATES: pathseeker (replan).
  │
  ├─ CRASH / TIMEOUT ──────────────────────────────────────────────────────
  │   Respawned in next available slot (max 3 crash retries — [X4] FIXED).
  │
  └─ EXCEPTION (quest not found, wardResult missing) ──────────────────────
      spiritmender → failed
      Same as FAILURE above — skip pending, spawn pathseeker.
```

### Phase 2d: Siegemaster (single, agent-based)

```
⑨ Siege dispatched (pending → in_progress)
   Verifies ALL observables from ALL flow nodes.

   workItems: [
     ..., { cw-1, complete }, ..., { ward, complete },
     { siege, in_progress, dependsOn: [ward-id] },
     { law-1, pending, dependsOn: [siege-id] }, ...
   ]
  │
  ├─ SUCCESS ──────────────────────────────────────────────────────────────
  │   siege → complete
  │   Lawbringers become ready (dependsOn satisfied)
  │
  ├─ FAILURE ──────────────────────────────────────────────────────────────
  │   siege → failed
  │   All pending work items (lawbringers) → skipped.
  │   CREATES: pathseeker (replan).
  │
  ├─ CRASH / TIMEOUT ──────────────────────────────────────────────────────
  │   siege → failed (not slot-managed — no respawn, treated as failure).
  │   Same as FAILURE above — skip pending, spawn pathseeker.
  │
  └─ EXCEPTION (quest not found) ──────────────────────────────────────────
      siege → failed
      Same as FAILURE above — skip pending, spawn pathseeker.
```

### Phase 2e: Lawbringers (parallel, up to 3 slots)

```
⑩ Lawbringers dispatched
   Each verifies all changed files (not just step file lists — actual git diff from execution).
   N work items total, up to 3 slots. Items move pending → in_progress only when a slot picks them up.

   workItems: [
     ..., { siege, complete },
     { law-1, in_progress, dependsOn: [siege-id] },
     { law-2, in_progress, dependsOn: [siege-id] },
     { law-3, in_progress, dependsOn: [siege-id] },
     { law-4, pending }, { law-5, pending },          ◄── waiting for a slot
   ]
  │
  ├─ SUCCESS ───────────────────────────────────────────────────────────────
  │   lawbringer → complete
  │   When ALL lawbringers complete → final ward fires (full project quality check)
  │
  ├─ FAILURE ───────────────────────────────────────────────────────────────
  │   lawbringer → failed
  │   CREATES: spiritmender (targeted fix for the failed lawbringer's files).
  │   Other lawbringers continue running — no skip, no drain.
  │
  ├─ CRASH / TIMEOUT ──────────────────────────────────────────────────────
  │   Respawned in next available slot (max 3 crash retries — [X4] FIXED).
  │
  └─ EXCEPTION (quest not found, step missing) ────────────────────────────
      lawbringer → failed
      Same as FAILURE above — spawn spiritmender, no skip.
```

### Phase 2f: Final Ward (full project quality gate)

```
⑪ Final Ward dispatched (pending → in_progress)
   Full project quality check — same as Phase 2c ward but runs after lawbringers.
   This is the second ward gate in the flow (first is after codeweavers).

   workItems: [
     ..., { law-1, complete }, { law-2, complete }, ...,
     { final-ward, in_progress, dependsOn: [ALL lawbringer IDs], maxAttempts: 3 },
   ]
  │
  ├─ PASS (exit code 0) ──────────────────────────────────────────────────
  │   final-ward → complete
  │   All items complete → quest → complete ✓
  │
  ├─ FAIL (retries left) ─────────────────────────────────────────────────
  │   Same as Phase 2c ward — spiritmender + ward-retry cycle.
  │
  ├─ FAIL (no retries left) ──────────────────────────────────────────────
  │   final-ward → failed
  │   CREATES: pathseeker (replan).
  │
  ├─ CRASH (process killed) ───────────────────────────────────────────────
  │   Same as FAIL — retry/no-retry logic.
  │
  └─ EXCEPTION ────────────────────────────────────────────────────────────
      Same as FAIL — retry/no-retry logic.
```

### Quest Terminal States

```
COMPLETE:  Every work item is complete (or skipped).
BLOCKED:   Nothing can make progress — failed items with no retries left, no pending items satisfiable.
ABANDONED: User manually abandons.
```

### Work Item Creation Summary

| When                                   | Creates                 | dependsOn                             |
|----------------------------------------|-------------------------|---------------------------------------|
| User creates quest via web UI          | 1 × chaoswhisperer      | `[]`                                  |
| needsDesign === true after approved    | 1 × glyphsmith          | `[]`                                  |
| User clicks Start                      | 1 × pathseeker          | `[completed chat IDs]`                |
| PathSeeker verify passes               | N × codeweaver          | `[pathseeker-id + inter-step chains]` |
| PathSeeker verify passes               | 1 × ward                | `[ALL codeweaver IDs]`                |
| PathSeeker verify passes               | 1 × siege               | `[ward-id]`                           |
| PathSeeker verify passes               | N × lawbringer          | `[siege-id]`                          |
| PathSeeker verify passes               | 1 × final-ward          | `[ALL lawbringer IDs]`                |
| PathSeeker verify fails (retries left) | 1 × pathseeker-retry    | `[]`                                  |
| Codeweaver fails                       | 1 × pathseeker (replan) | `[]` + pending items → skipped        |
| Ward fails (retries left)              | 1 × spiritmender        | `[]`                                  |
| Ward fails (retries left)              | 1 × ward-retry          | `[spiritmender-id]`                   |
| Ward fails (no retries left)           | 1 × pathseeker (replan) | `[]` + pending items → skipped        |
| Spiritmender fails (ward recovery)     | 1 × pathseeker (replan) | `[]` + pending items → skipped        |
| Siege fails                            | 1 × pathseeker (replan) | `[]` + pending items → skipped        |
| Lawbringer fails                       | 1 × spiritmender        | `[]`                                  |

### Who sets quest status

| Status                                 | Set by             | When                                                    |
|----------------------------------------|--------------------|---------------------------------------------------------|
| `created`                              | System             | User creates quest via web UI                           |
| `explore_flows` → `review_observables` | ChaosWhisperer     | During spec conversation                                |
| `approved`                             | User               | Approves observables in web UI (Gate #2)                |
| `explore_design` → `design_approved`   | Glyphsmith + User  | Design conversation + approval (Gate #3)                |
| `in_progress`                          | System             | User clicks Start (manual trigger)                      |
| `blocked`                              | Orchestration loop | Pending items with all-failed deps, nothing in_progress |
| `complete`                             | Orchestration loop | All work items complete                                 |
| `in_progress` (from blocked)           | Orchestration loop | New items inserted, deps satisfiable again              |

**Critical:** Layer brokers NEVER set quest status. They only modify work item statuses. Quest status is always derived
by the orchestration loop's terminal/blocked checks or error handler.

**Critical:** The transition from `approved`/`design_approved` → `in_progress` is the ONLY manual transition in the
execution phase. Everything after that is automatic — driven by the orchestration loop dispatching work items and
deriving quest status from their states.

---

## Known Issues Registry

Issues are tracked here and cross-referenced from role sections. Test these SEPARATELY from functional flows — they
verify broken/risky behavior, not intended behavior.

### Confirmed Bugs

| ID | Affects                       | Description                                                                                                                                                                                                                       | Status |
|----|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------|
| X1 | ChaosWhisperer, Glyphsmith    | Chat layer broker does NOT check agent exit code. Non-zero exit (crash) marks work item `complete` instead of `failed`. Only JS exceptions reach the catch block.                                                                 | **FIXED** — `run-chat-layer-broker.ts` now checks exit code; non-zero exit throws, caught by error handler which marks work item `failed`. Regression test in `run-chat-layer-broker.test.ts`. |
| X2 | PathSeeker, Ward, Siegemaster | "Second fetch failure": if `questGetBroker` fails AFTER work item is already marked complete/failed, recovery items are never inserted. Quest silently goes terminal/blocked with no recourse.                                    | **FIXED** — `run-pathseeker-layer-broker.ts` now throws on second fetch failure instead of silently dropping downstream items. Error propagates to orchestration loop catch block. Regression test in `run-pathseeker-layer-broker.test.ts`. |

### Design Risks

| ID | Affects                              | Description                                                                                                                                               | Status |
|----|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|--------|
| X4 | Codeweaver, Lawbringer, Spiritmender | Slot manager crash/timeout retry has NO attempt counter. An agent that always crashes retries forever.                                                    | **FIXED** — Added `crashRetries` field to `ActiveAgent` contract. Slot manager increments on each respawn; after 3 crashes, marks work item `failed`. Regression tests in `orchestration-loop-layer-broker.test.ts`. |
| X5 | Siegemaster                          | Fix chains have no depth limit. Each failed siege-recheck creates another full codeweaver-fix → ward-rerun → siege-recheck chain indefinitely.            | **FIXED** — Fix chain removed entirely from `run-siegemaster-layer-broker.ts`. Siege failure now skips pending items + creates pathseeker replan. Regression tests in `run-siegemaster-layer-broker.test.ts`. |
| X6 | All slot-managed roles               | Silent drop: if crash/timeout or partially-complete respawn can't get a slot, work item stays "started" with no agent — orphaned.                         | **FIXED** — Slot manager now detects no-slot-available on crash respawn and marks work item `failed`. Regression test in `orchestration-loop-layer-broker.test.ts`. |
| X8 | Web UI (execution panel)             | Ad-hoc step detection removed. `isAdhoc` is hardcoded `false`. Need to derive ad-hoc status from work item metadata (e.g., `insertedBy` or role) instead. | **FIXED** — `execution-panel-widget.tsx` now derives `isAdhoc` from `wi?.insertedBy !== undefined`. Steps created by recovery roles render with AD-HOC indicator. Regression tests in `execution-panel-widget.test.tsx`. |

---

---

## System Tenets

Rules that govern orchestration behavior. Each is testable independently. If any tenet is violated, the specific rule is
broken regardless of which role triggered it.

### Dispatch Rules

> Who runs when. These constrain which work items the loop picks on each iteration.

- [ ] **T-DISPATCH-1: Chat mutual exclusion**
  Only ONE chat role (chaoswhisperer OR glyphsmith) can be `in_progress` at a time. If one is running, the other is
  skipped even if ready.

  | Entry | Expected |
    |-------|----------|
  | Chaos `in_progress`, Glyph `pending` (deps satisfied) | Glyph stays `pending` |
  | Glyph `in_progress`, Chaos `pending` (deps satisfied) | Chaos stays `pending` |

- [ ] **T-DISPATCH-2: Chat requires user message**
  Chat roles are never dispatched without a `userMessage`. No message = bounce, nothing changes.

  | Entry | Expected |
    |-------|----------|
  | Chaos `pending`, ready, no `userMessage` | Chaos stays `pending`, quest unchanged |

- [ ] **T-DISPATCH-3: Single chat item per dispatch**
  Even if multiple chaos (or glyph) items are `pending` and ready, only the FIRST is dispatched.

  | Entry | Expected |
    |-------|----------|
  | Chaos-A `pending`, Chaos-B `pending`, both ready | Chaos-A dispatched, Chaos-B stays `pending` |

- [ ] **T-DISPATCH-4: Non-chat roles dispatch as full group**
  All ready items of the same non-chat role are dispatched together (e.g., 3 codeweavers at once).

  | Entry | Expected |
    |-------|----------|
  | CW-1 `pending` ready, CW-2 `pending` ready, CW-3 `pending` (dep unmet) | CW-1 and CW-2 both dispatched, CW-3 stays `pending` |

- [ ] **T-DISPATCH-5: One role group per loop iteration**
  Loop picks the first ready role group (Map insertion order), dispatches it, then recurses. Other ready role groups
  wait.

  | Entry | Expected |
    |-------|----------|
  | Codeweavers ready AND lawbringers ready | Whichever role group is first in Map runs. Other waits for next loop iteration. |

- [ ] **T-DISPATCH-6: Abort signal = immediate exit**
  If `abortSignal.aborted` is true at loop entry, nothing happens. No quest load, no dispatch, no status change.

- [ ] **T-DISPATCH-7: Loop recurses without user message**
  After any role completes, the loop recurses but does NOT pass `userMessage`. This means chat roles won't trigger on
  the re-entry (prevents infinite chat dispatch).

### Dependency & Ordering Rules

> The `dependsOn` field on work items is the SOLE mechanism that controls execution order. There are no hardcoded role
> sequences.

- [ ] **T-DEP-1: Ready = all deps complete**
  A work item is "ready" only when EVERY item in its `dependsOn` array has status `complete`.

  | Entry | Expected |
    |-------|----------|
  | CW-1 `pending`, dependsOn: [PS-1]. PS-1 is `complete` | CW-1 is ready |
  | CW-1 `pending`, dependsOn: [PS-1]. PS-1 is `in_progress` | CW-1 is NOT ready |
  | CW-1 `pending`, dependsOn: [PS-1, CW-0]. PS-1 `complete`, CW-0 `pending` | CW-1 is NOT ready |

- [ ] **T-DEP-2: Failed dep = never ready**
  A work item whose deps include ANY `failed` item will never become ready. It contributes to `blocked`.

  | Entry | Expected |
    |-------|----------|
  | Ward `pending`, dependsOn: [CW-1, CW-2, CW-3]. CW-2 is `failed` | Ward is never ready. Quest → `blocked` (if nothing else in_progress). |

- [ ] **T-DEP-3: The standard dependency chain**
  When PathSeeker succeeds and generates work items, the `dependsOn` wiring MUST produce this execution order:
  ```
  pathseeker → codeweavers (parallel, with inter-step chains) → ward → siege → lawbringers (parallel)
  ```
  Verify by checking `dependsOn` arrays:
    - Each codeweaver: `dependsOn` includes pathseeker ID (+ preceding codeweaver IDs if steps have deps)
    - Ward: `dependsOn` includes ALL codeweaver IDs
    - Siege: `dependsOn: [ward ID]`
    - Each lawbringer: `dependsOn: [siege ID]`

- [ ] **T-DEP-4: Replacement mapping rewires downstream deps**
  When a retry item replaces a failed item (ward retry replaces ward, siege-recheck replaces siege), downstream
  `dependsOn` arrays are updated to point to the NEW item.

  | Before | After replacement |
    |--------|-------------------|
  | Siege `dependsOn: [ward-A]`, ward-A `failed` | Siege `dependsOn: [ward-B]` (ward-B is the retry) |
  | Lawbringers `dependsOn: [siege-A]`, siege-A `failed` | Lawbringers `dependsOn: [siege-B]` (siege-recheck) |

- [ ] **T-DEP-5: Replacement chains compose**
  If ward fails twice: ward-A → ward-B → ward-C, siege should end up `dependsOn: [ward-C]`.

### Quest Status Rules

> Quest status is DERIVED from work item states. Layer brokers never set it directly (except chat roles via MCP during
> their agent run).

- [ ] **T-STATUS-1: All items complete → quest `complete`**

  | Entry | Expected |
    |-------|----------|
  | Every work item is `complete` | `quest.status` → `complete` |

- [ ] **T-STATUS-2: Pending items with all-failed deps → quest `blocked`**

  | Entry | Expected |
    |-------|----------|
  | Some items `pending`, ALL their deps are `failed`, nothing `in_progress` | `quest.status` → `blocked` |

- [ ] **T-STATUS-3: All terminal but not all complete → quest stays `in_progress`**
  This is the "terminal but not blocked" state — no pending items exist, so nothing CAN be blocked.

  | Entry | Expected |
    |-------|----------|
  | All pathseekers `failed`, no pending items | `quest.status` stays `in_progress` (NOT `blocked`) |

- [ ] **T-STATUS-4: Pre-execution statuses are preserved**
  If quest is in `created`, `explore_flows`, `review_flows`, etc., the loop NEVER changes it to `blocked` or
  `in_progress`. Only the chat agent (via MCP) or the OrchestrationStartResponder can advance these.

  | Entry | Expected |
    |-------|----------|
  | Quest `explore_flows`, chaos `failed` | `quest.status` stays `explore_flows` |

- [ ] **T-STATUS-5: Items still in_progress → quest stays `in_progress`**
  Even if some items are failed, if anything is still running, quest doesn't go `blocked` yet.

  | Entry | Expected |
    |-------|----------|
  | CW-1 `failed`, CW-2 `in_progress` | `quest.status` stays `in_progress` |

### Failure Handling Rules

> How every role handles failures. These are universal — test once, not per role.

- [ ] **T-FAIL-1: JS exception → role group's in_progress items all marked `failed`**
  When a layer broker throws, the loop catch block marks ALL items that were dispatched in that group as `failed` with
  an `errorMessage`.

- [ ] **T-FAIL-2: Quest not found → throw, process exits**
  If `questGetBroker` can't find the quest (deleted, corrupted), the error propagates to the loop's `.catch`. Process is
  removed from active state. Error logged to stderr.

- [ ] **T-FAIL-3: Double fault — error in error handler**
  If the catch block itself fails (e.g., quest write fails while trying to mark items `failed`), the original error is
  still re-thrown. Not swallowed.

- [ ] **T-FAIL-4: Agent crash (non-zero exit) — slot-managed roles**
  Slot manager respawns the agent in the same or next available slot. Session ID is passed for resume. **[X4] FIXED:**
  Crash retries limited to 3 via `crashRetries` counter on `ActiveAgent`.

- [ ] **T-FAIL-5: Agent crash — chat roles**
  **[X1] FIXED:** Exit code is now checked. Non-zero exit marks work item `failed`.

- [ ] **T-FAIL-6: Agent timeout**
  Agent is killed after `timeoutMs`. Slot-managed roles: respawned with sessionId. Non-slot roles (pathseeker, siege):
  treated as failure, normal error path.

  | Role | Timeout |
    |------|---------|
  | PathSeeker | 600,000ms (10 min) |
  | Codeweaver | 600,000ms (10 min) |
  | Siegemaster | 300,000ms (5 min) |
  | Lawbringer | 300,000ms (5 min) |
  | Spiritmender | 600,000ms (10 min) |

### Role Spawning Rules

> Who creates who. This is the dependency graph of work item creation.

```
User action
  └─► OrchestrationStartResponder
       └─► pathseeker (dependsOn: completed chaos/glyph IDs)

PathSeeker (on verify success)
  ├─► N × codeweaver (dependsOn: pathseeker + inter-step chains)
  ├─► 1 × ward (dependsOn: ALL codeweaver IDs)
  ├─► 1 × siege (dependsOn: ward ID)
  └─► N × lawbringer (dependsOn: siege ID)

Ward (on failure, attempts remain)
  ├─► 1 × spiritmender (dependsOn: [], immediately ready)
  └─► 1 × ward-retry (dependsOn: [spiritmender ID])

Siege (on failure)
  └─► 1 × pathseeker replan (dependsOn: [], pending items → skipped)

```

- [ ] **T-SPAWN-1: PathSeeker generates correct item shapes**
  After verify passes with N steps, quest.json should contain:
    - N codeweaver items, each with `relatedDataItems: ['steps/<stepId>']`
    - 1 ward item with `spawnerType: 'command'`, `maxAttempts: 3`
    - 1 siege item with `timeoutMs: 300000`
    - N lawbringer items, each with `relatedDataItems: ['steps/<stepId>']`

- [ ] **T-SPAWN-2: Ward failure generates spiritmender + retry**
  After ward fails (attempt < max), quest.json should contain:
    - 1 new spiritmender with `dependsOn: []` and `relatedDataItems: ['wardResults/<id>']`
    - 1 new ward-retry with `dependsOn: [spiritmender ID]` and `attempt: previous + 1`
    - Siege `dependsOn` rewired to ward-retry ID

- [ ] **T-SPAWN-3: Siege failure skips pending + spawns pathseeker replan**
  After siege fails, quest.json should contain:
  - All pending lawbringers → `skipped`
  - 1 new pathseeker with `dependsOn: []` (replan)

- [ ] **T-SPAWN-4: OrchestrationStartResponder creates pathseeker only once**
  If any work item with `role: 'pathseeker'` exists (regardless of status), no new pathseeker is created on restart.

  | Entry | Expected |
    |-------|----------|
  | All pathseekers `failed`, user restarts | No new pathseeker. Quest is stuck. **This is a known limitation.** |

### Retry & Recovery Budgets

| Role         | Max Attempts                 | Mechanism                               | What happens at limit                                  |
|--------------|------------------------------|-----------------------------------------|--------------------------------------------------------|
| PathSeeker   | 3                            | Creates own retry work item             | All pathseekers `failed`, quest stuck at `in_progress` |
| Ward         | 3                            | Creates spiritmender + retry work item  | No retry, siege dep unmet → quest `blocked`            |
| Siege        | 1                             | Skips pending + creates pathseeker replan | No retry, pending items skipped, pathseeker replans    |
| Codeweaver   | 1 (crash retry max 3)         | Slot manager respawns on crash (max 3)   | After 3 crashes → work item `failed`                  |
| Lawbringer   | 1 (crash retry max 3)         | Slot manager respawns on crash (max 3)   | After 3 crashes → work item `failed`                  |
| Spiritmender | 1 (crash retry max 3)         | Slot manager respawns on crash (max 3)   | After 3 crashes → work item `failed`                  |

- [ ] **T-RETRY-1: PathSeeker retry preserves maxAttempts and timeoutMs**
  Retry item carries same `maxAttempts: 3` and `timeoutMs` from original.

- [ ] **T-RETRY-2: Ward retry at max = no spiritmender, no retry**
  At attempt 2 (0-indexed, max 3): ward marked `failed`, nothing created. Siege stays pending with failed dep.

### Quest Contract Integrity

> What quest.json MUST enforce to keep the combinatorial space sane. If these invariants break, all bets are off.

- [ ] **T-CONTRACT-1: dependsOn references must be valid**
  Every ID in a work item's `dependsOn` array must reference an existing work item in the same quest.

- [ ] **T-CONTRACT-2: No circular dependencies**
  The dependency graph must be a DAG. No cycles.

- [ ] **T-CONTRACT-3: relatedDataItems must reference valid collections**
  Format is `'collection/id'`. Valid collections: `steps`, `wardResults`. ID must exist in the quest.

- [ ] **T-CONTRACT-4: Chat roles set quest status only within their phase**
  ChaosWhisperer: `created` → `explore_flows` → ... → `review_observables`
  Glyphsmith: `approved` → `explore_design` → ... → `design_approved`
  No cross-phase jumps.

- [ ] **T-CONTRACT-5: Slot-to-quest mapping integrity**
  For spiritmender: result mapping uses `result.completed` flag (not per-slot-ID matching) to determine quest work item
  status. One quest work item fans out to N file-based work units — if ANY fails, the quest work item is marked
  `failed`.

- [ ] **T-CONTRACT-6: insertedBy traceability**
  Dynamically created items (retries, spiritmenders, fix chains) have `insertedBy` pointing to the failed item that
  triggered their creation. This chain must be traceable.

---

## Full End-to-End Happy Paths

These walk the entire quest lifecycle. Verify quest.json at each checkpoint.

### E2E-1: Simple quest — no design phase, no failures

> The shortest possible path from quest creation to completion.

- [ ] **Checkpoint flow:**

```
[USER] Creates quest "Build login page" via web UI
  │
  ▼
① quest.json created
   status: created
   workItems: [{ chaos, pending }]
  │
  ▼ [USER sends message]
② ChaosWhisperer runs
   status: review_observables (set by agent via MCP)
   workItems: [{ chaos, complete, sessionId: <uuid> }]
   flows/requirements/observables: populated
  │
  ▼ [USER approves observables in web UI]
③ Quest approved
   status: approved
  │
  ▼ [USER starts orchestration]
④ OrchestrationStartResponder fires
   status: in_progress
   workItems: [{ chaos, complete }, { pathseeker, pending, dependsOn: [chaos-id] }]
  │
  ▼
⑤ PathSeeker runs + verify passes (3 steps)
   status: in_progress
   workItems: [
     { chaos, complete },
     { pathseeker, complete },
     { cw-1, pending, dependsOn: [ps-id] },
     { cw-2, pending, dependsOn: [ps-id, cw-1-id] },
     { cw-3, pending, dependsOn: [ps-id] },
     { ward, pending, dependsOn: [cw-1, cw-2, cw-3] },
     { siege, pending, dependsOn: [ward-id] },
     { law-1, pending, dependsOn: [siege-id] },
     { law-2, pending, dependsOn: [siege-id] },
     { law-3, pending, dependsOn: [siege-id] }
   ]
  │
  ▼
⑥ Codeweavers run (parallel, up to 3 slots)
   cw-1, cw-2, cw-3 → complete (respecting inter-step deps)
  │
  ▼
⑦ Ward runs (npm run ward)
   ward → complete (exit code 0)
  │
  ▼
⑧ Siegemaster runs
   siege → complete
  │
  ▼
⑨ Lawbringers run (parallel, up to 3 slots)
   law-1, law-2, law-3 → complete
  │
  ▼
⑩ All items complete
   status: complete ✓
```

**At each checkpoint, open quest.json and verify:**

- `quest.status` matches expected
- Work item statuses match expected
- No unexpected work items appeared
- `dependsOn` arrays are intact

---

### E2E-2: Quest with design phase

- [ ] Same as E2E-1, but after ChaosWhisperer completes and user approves observables, a Glyphsmith phase runs:

```
② ChaosWhisperer → review_observables
  ▼ [USER approves]
③ status: approved
  ▼ [USER sends design message]
③a Glyphsmith runs
   status: design_approved (set by agent via MCP)
   workItems: [{ chaos, complete }, { glyph, complete, sessionId: <uuid> }]
  ▼ [USER starts orchestration]
④ OrchestrationStartResponder fires
   ... continues same as E2E-1 from ④ onward
```

---

### E2E-3: Ward fails once, spiritmender recovers

- [ ] Happy recovery path through ward failure:

```
⑦ Ward runs → fails (exit code 1)
   ward-A → failed, errorMessage: 'ward_failed'
   NEW: spiritmender-1 (pending, dependsOn: [], relatedDataItems: ['wardResults/<id>'])
   NEW: ward-B (pending, dependsOn: [spiritmender-1], attempt: 1)
   siege dependsOn rewired: [ward-B] (was [ward-A])
  │
  ▼
⑦a Spiritmender runs → fixes files → complete
  │
  ▼
⑦b Ward-B runs → passes (exit code 0)
   ward-B → complete
  │
  ▼
⑧ Siege becomes ready (dependsOn: [ward-B] satisfied)
   ... continues normally
```

**What to check in quest.json after ⑦:**

- `quest.wardResults` has an entry with exitCode, filePaths, errorSummary
- Spiritmender's `relatedDataItems` points to that wardResult
- Ward-B has `attempt: 1`, `insertedBy: ward-A-id`
- Siege `dependsOn` contains ward-B id (NOT ward-A)

---

### E2E-4: Siege fails, fix chain recovers

- [ ] Happy recovery through siege failure:

```
⑧ Siege runs → fails
   siege-A → failed, errorMessage: 'siege_check_failed'
   NEW: codeweaver-fix (pending, dependsOn: [], relatedDataItems: [])
   NEW: ward-rerun (pending, dependsOn: [cw-fix], maxAttempts: 3)
   NEW: siege-recheck (pending, dependsOn: [ward-rerun])
   lawbringer dependsOn rewired: [siege-recheck] (was [siege-A])
  │
  ▼
⑧a Codeweaver-fix runs → complete
  ▼
⑧b Ward-rerun runs → passes
  ▼
⑧c Siege-recheck runs → passes
  ▼
⑨ Lawbringers become ready (dependsOn: [siege-recheck] satisfied)
   ... continues normally
```

---

### E2E-5: PathSeeker fails, retries, succeeds

- [ ] PathSeeker verify fails then succeeds on retry:

```
⑤ PathSeeker runs → verify fails (attempt 0)
   ps-A → failed, errorMessage: 'verification_failed'
   NEW: ps-B (pending, dependsOn: [], attempt: 1, insertedBy: ps-A-id)
  │
  ▼
⑤a PathSeeker retry runs → verify passes
   ps-B → complete
   NEW: codeweavers, ward, siege, lawbringers (same as normal ⑤)
  │
  ▼
⑥ Codeweavers ready
   ... continues normally
```

---

## End-to-End Sad Paths

Failures where the quest CANNOT self-recover. User intervention required.

### SAD-E2E-1: PathSeeker exhausts all retries

- [ ] PathSeeker fails 3 times:

```
ps-A fails (attempt 0) → ps-B created
ps-B fails (attempt 1) → ps-C created
ps-C fails (attempt 2) → NO retry (max reached)

quest.json:
  status: in_progress  ← NOT blocked (no pending items with failed deps — just no pending items at all)
  workItems: [
    { chaos, complete },
    { ps-A, failed },
    { ps-B, failed },
    { ps-C, failed }
  ]
```

**Quest is stuck.** No work items are pending, nothing is in_progress, but not everything is complete.
User must intervene. Restarting orchestration won't help (pathseeker already exists, won't be recreated).

---

### SAD-E2E-2: Codeweaver fails → ward blocked → quest blocked

- [ ] One codeweaver fails, blocking the rest of the pipeline:

```
cw-1: complete
cw-2: failed  ← agent couldn't implement this step
cw-3: complete

ward: pending, dependsOn: [cw-1, cw-2, cw-3]  ← cw-2 is failed, dep NEVER satisfiable

quest.json:
  status: blocked
  workItems: [... ward pending with failed dep ...]
```

**Quest is blocked.** Ward can never run because cw-2 is failed. User must intervene.

---

### SAD-E2E-3: Ward exhausts all retries

- [ ] Ward fails 3 times (with spiritmender cycles):

```
ward-A fails (attempt 0) → spiritmender + ward-B
spiritmender completes → ward-B fails (attempt 1) → spiritmender-2 + ward-C
spiritmender-2 completes → ward-C fails (attempt 2) → NO retry

quest.json:
  status: blocked
  siege: pending, dependsOn: [ward-C]  ← ward-C is failed
```

---

### SAD-E2E-4: Quest file write fails after successful work ("second fetch failure")

- [ ] **[X2] FIXED** PathSeeker passes verify, but quest.json write to add downstream items fails:
  Now throws an error instead of silently dropping downstream items. Error propagates to orchestration loop catch block.

---

### SAD-E2E-5: Siege fix chain loops indefinitely

- [ ] **[X5] FIXED** Siege fix chain removed entirely. Siege failure now skips pending items + creates pathseeker replan.
  Quest terminates cleanly (blocked or replanned) instead of growing indefinitely.

---

## Role-Specific Reference

> The tenets above cover universal behavior. Below is reference material for each role's unique characteristics: what it
> does, how it spawns, and quirks specific to that role.

### ChaosWhisperer

| Property          | Value                                                                  |
|-------------------|------------------------------------------------------------------------|
| Layer broker      | `run-chat-layer-broker.ts`                                             |
| Spawner           | `agent` (via `agentSpawnUnifiedBroker`)                                |
| Sets quest status | Yes, via MCP: `created` → `explore_flows` → ... → `review_observables` |
| Session resume    | If work item has `sessionId`, raw message sent (no template)           |
| Known issues      | [X1] exit code not checked                                             |

**Role-specific quirk:** ChaosWhisperer is the ONLY role (along with Glyphsmith) that sets quest status directly. All
other roles rely on the loop to derive status from work item states.

---

### Glyphsmith

| Property          | Value                                                                             |
|-------------------|-----------------------------------------------------------------------------------|
| Layer broker      | `run-chat-layer-broker.ts` (same as ChaosWhisperer, different prompt)             |
| Spawner           | `agent` (via `agentSpawnUnifiedBroker`)                                           |
| Sets quest status | Yes, via MCP: `approved` → `explore_design` → `review_design` → `design_approved` |
| Session resume    | Same as ChaosWhisperer                                                            |
| Known issues      | [X1] exit code not checked                                                        |

**Role-specific quirk:** Uses `glyphsmithPromptStatics` template (NOT chaoswhisperer). Same dispatch rules as
ChaosWhisperer (covered by T-DISPATCH-1 through T-DISPATCH-3). Glyphsmith completion + `design_approved` status is what
triggers OrchestrationStartResponder to create pathseeker.

---

### PathSeeker

| Property     | Value                                                    |
|--------------|----------------------------------------------------------|
| Layer broker | `run-pathseeker-layer-broker.ts`                         |
| Spawner      | `agent` (via `agentSpawnByRoleBroker`, NOT slot manager) |
| Created by   | OrchestrationStartResponder                              |
| maxAttempts  | 3                                                        |
| Timeout      | 600,000ms (10 min)                                       |
| Known issues | [X2] second fetch failure                                |

**What it does:** Runs agent to create implementation steps, then runs `questVerifyBroker` to validate. On verify pass,
generates all downstream work items (codeweavers, ward, siege, lawbringers) via `stepsToWorkItemsTransformer`.

**Role-specific quirks:**

- Has a post-agent verification step — unique among roles. Agent can "succeed" but verify can still fail.
- Agent timeout → process killed → verify runs anyway (likely fails since agent was killed mid-work)
- Zero steps after verify pass → empty downstream items → quest goes `complete` with no implementation work
- Retry resumes the same Claude session (sessionId carried forward)
- Step `dependsOn` with forward references silently drop the dep (codeweaver only depends on pathseeker)

---

### Codeweaver

| Property         | Value                                                                 |
|------------------|-----------------------------------------------------------------------|
| Layer broker     | `run-codeweaver-layer-broker.ts`                                      |
| Spawner          | `agent` (via slot manager, up to 3 concurrent)                        |
| Created by       | PathSeeker (via `stepsToWorkItemsTransformer`)                        |
| maxAttempts      | 1 (no direct retry — crash retry max 3 via slot manager)              |
| maxFollowupDepth | 5                                                                     |
| Timeout          | 600,000ms (10 min)                                                    |
| Known issues     | [X4] FIXED, [X6] FIXED                                                |

**What it does:** Implements a single quest step. Resolves its step from `relatedDataItems`, builds work unit with step
context + related contracts/observables, runs via slot manager.

**Role-specific quirks:**

- On success: marks work item `complete` (steps no longer have a status field — execution state is derived from work
  items)
- On failure: marks work item `failed`
- `relatedDataItems` must point to `steps/<stepId>` — throws if missing, wrong collection, or step not found
- Codeweaver-fix items (from siege fix chain) have `relatedDataItems: []` — they operate from overall quest context, not
  a specific step
- Inter-step deps create codeweaver dependency chains (CW-2 dependsOn CW-1 if step-2 depends on step-1)

---

### Ward

| Property     | Value                                          |
|--------------|------------------------------------------------|
| Layer broker | `run-ward-layer-broker.ts`                     |
| Spawner      | `command` (npm run ward — NOT an agent)        |
| Created by   | PathSeeker (via `stepsToWorkItemsTransformer`) |
| maxAttempts  | 3                                              |
| Known issues | [X2] second fetch failure                      |

**What it does:** Runs quality checks (lint, typecheck, test). Exit code 0 = pass. Non-zero = fail, triggering
spiritmender + retry cycle.

**Role-specific quirks:**

- Only non-agent role — spawns a shell command, not a Claude process
- Extracts `runId` from stdout via regex `^run: (.+)$`, reads `.ward/run-<id>.json` for structured results
- If regex fails or file missing → `wardResultJson` is null → falls back to quest step file paths for spiritmender
- Stores `wardResult` on quest (exitCode, filePaths, errorSummary) before creating recovery items
- Exactly ONE spiritmender per ward failure (regardless of file count). The spiritmender fans out to 1-per-file
  internally.
- Ward retry `dependsOn: [spiritmender IDs]`. If no file paths found → no spiritmender → retry `dependsOn: []` (
  immediately ready)
- exitCode null (process killed) → stored as 1 via `?? 1` fallback
- File paths extracted from `checks[].projectResults[].errors[].filePath` and `testFailures[].suitePath`, deduplicated

---

### Spiritmender

| Property         | Value                                                                      |
|------------------|----------------------------------------------------------------------------|
| Layer broker     | `run-spiritmender-layer-broker.ts` (quest-level) / inline via slot manager |
| Spawner          | `agent` (via slot manager, up to 3 concurrent)                             |
| Created by       | Ward (quest-level) or Slot Manager (inline, via `needs-role-followup`)     |
| maxFollowupDepth | 3                                                                          |
| Known issues     | [X4] infinite crash retry                                                  |

**Two distinct paths exist:**

1. **Quest-level:** Dispatched by orchestration loop. Resolves wardResult from `relatedDataItems`. Creates 1 work unit
   per file path. Each agent sees ALL concatenated errors (not just its own file's).
2. **Inline:** Spawned inside slot manager via `needs-role-followup` signal. Uses file paths from `signal.context`. Does
   NOT create quest work items. Operates purely within slot manager's WorkTracker.

**Role-specific quirks:**

- Empty `relatedDataItems` → zero work units → instant "complete" with no actual work
- Inline spiritmender: `signal.context` undefined → falls back to `[startPath]`
- `maxFollowupDepth` varies by caller: codeweaver=5, lawbringer=3, spiritmender=3

---

### Siegemaster

| Property     | Value                                                             |
|--------------|-------------------------------------------------------------------|
| Layer broker | `run-siegemaster-layer-broker.ts`                                 |
| Spawner      | `agent` (single, via `agentSpawnByRoleBroker` — NOT slot manager) |
| Created by   | PathSeeker (via `stepsToWorkItemsTransformer`)                    |
| maxAttempts  | 1                                                                 |
| Timeout      | 300,000ms (5 min)                                                 |
| Known issues | [X2] second fetch failure, [X5] unbounded fix chains              |

**What it does:** Verifies ALL observables from ALL flow nodes are satisfied. Collects observables via
`quest.flows.flatMap(f => f.nodes).flatMap(n => n.observables)`.

**Role-specific quirks:**

- NOT slot-managed — single agent, no crash retry (crash/timeout = immediate failure)
- `isComplete = true` if `signal === 'complete'` OR `exitCode === 0` (either suffices)
- Agent exits 0 with non-complete signal (e.g., `partially-complete`) → treated as complete (potential false positive)
- **[X5] FIXED:** Fix chain removed. Siege failure now skips pending items (lawbringers, final-ward) + creates pathseeker replan with `dependsOn: []` and `insertedBy: <failed-siege-id>`
- Abort signal during execution → agent NOT killed (abort only checked at loop entry) → runs to timeout

---

### Lawbringer

| Property         | Value                                          |
|------------------|------------------------------------------------|
| Layer broker     | `run-lawbringer-layer-broker.ts`               |
| Spawner          | `agent` (via slot manager, up to 3 concurrent) |
| Created by       | PathSeeker (via `stepsToWorkItemsTransformer`) |
| maxAttempts      | 1                                              |
| maxFollowupDepth | 3                                              |
| Timeout          | 300,000ms (5 min)                              |
| Known issues     | [X4] infinite crash retry, [X6] silent drop    |

**What it does:** Final verification of individual steps. Receives ONLY `filePaths` (deduplicated `filesToCreate` +
`filesToModify`). No step, quest, or observable context.

**Role-specific quirks:**

- Last role in the chain — nothing depends on lawbringer items
- Failed lawbringer NEVER causes quest → `blocked` (blocked requires pending items with failed deps)
- Failed lawbringer → quest stays `in_progress` (terminal but not complete)
- All lawbringers complete + all other items complete → quest → `complete`
- `needs-role-followup` always spawns spiritmender (hardcoded, regardless of `targetRole` in signal)
- Slot-to-quest mapping uses sequential index-based IDs (`work-item-0`, etc.) bridged to quest UUIDs

---

<details>
<summary><strong>Developer Reference: Slot Manager Flow Diagrams</strong></summary>

### Agent Spawn Result (agentSpawnByRoleBroker)

```
agentSpawnByRoleBroker
  │
  ├─ build prompt from template + work unit arguments
  ├─ append continuationContext if provided
  │
  ▼
agentSpawnUnifiedBroker (child process: claude CLI)
  │
  ├─ streams JSONL lines:
  │    ├─ each line parsed via streamJsonLineContract.safeParse
  │    │    └─ parse fails → line ignored (not JSON)
  │    ├─ streamJsonToTextTransformer → captured in outputLines[]
  │    └─ signalFromStreamTransformer → updates lastSignal
  │
  ├─ onComplete fires with { exitCode, sessionId }:
  │    ├─ exitCode === 0, lastSignal present → { crashed: false, timedOut: false, signal: lastSignal }
  │    ├─ exitCode === 0, no signal → { crashed: false, timedOut: false, signal: null }
  │    ├─ exitCode !== 0, not timed out → { crashed: true, timedOut: false, signal: lastSignal|null }
  │    └─ killed by timeout → { crashed: false, timedOut: true, signal: lastSignal|null }
  │
  └─ catch (spawn itself throws) → { crashed: true, signal: null, sessionId: null, exitCode: null }
```

### Slot Manager — Per-Slot Decision Tree

```
orchestrationLoopLayerBroker (one iteration)
  │
  ├─ CHECK: workTracker.isAllTerminal() AND no active agents?
  │    ├─ any failed → { completed: false, incompleteIds, failedIds }
  │    └─ none failed → { completed: true }
  │
  ├─ CHECK: slot available AND ready work items? → spawn agent in slot
  ├─ CHECK: no active agents AND no ready items? → stuck: { completed: false }
  │
  ▼
Promise.race(activeAgents) → first agent to finish
  │
  ▼
RESULT ROUTING:
  ├─ crashed/timedOut → respawn if slot available (max 3 retries), else mark failed [X4][X6] FIXED
  ├─ signal null → markPartiallyCompleted
  ├─ signal 'complete' → markCompleted (if followupDepth > 0: re-queue original)
  ├─ signal 'partially-complete' → respawn with continuationContext
  └─ signal 'needs-role-followup' → markBlocked original, spawn spiritmender (if depth < max)
```

### Orchestration Loop

```
questOrchestrationLoopBroker
  ├─ abortSignal.aborted → return
  ├─ quest not found → throw
  ├─ questTerminal → recalculate status, return
  ├─ questBlocked → set blocked, return
  ├─ ready = [] but in_progress → return (wait)
  ├─ group ready by role → pick first group
  ├─ chat + no message → return
  ├─ chat + other chat in_progress → return
  ├─ mark items in_progress → dispatch → recurse
  └─ error: mark failed → recalculate status → re-throw
```

### OrchestrationStartResponder

```
OrchestrationStartResponder({ questId })
  ├─ quest not found → throw
  ├─ status not in [approved, design_approved, in_progress] → throw
  ├─ existing process → return same processId (idempotent)
  ├─ set quest → in_progress (if not already)
  ├─ create pathseeker if none exists (any status)
  └─ fire-and-forget: questOrchestrationLoopBroker
```

</details>
