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

**1. Setup**

- LLM calls out the test case ID, what it tests, and the expected results for:
    - `quest.json` state (work item statuses, quest status, new items created)
    - Backend behavior (errors logged, process state)
    - Frontend behavior (web UI reflects correct state, if applicable)
- LLM modifies `quest.json` to the required entry state for the test
- LLM modifies the relevant role prompt statics to force the LLM agent into the behavior we need (e.g., replace the
  prompt text with "exit immediately with signal complete" or "crash after 5 seconds"). We're in git, so all statics
  changes get reverted after testing.

**2. Execute**

- Start the dev server: `npm run dev`
- Trigger the test action (start orchestration, send user message, etc.)
- LLM monitors `quest.json` for state changes during execution
- LLM checks backend logs/stderr for expected errors or output

**3. Verify**

- LLM compares actual `quest.json` state against expected
- LLM checks frontend if the test case has UI expectations
- User confirms "good" or flags discrepancies

**4. Teardown**

- Kill the dev server
- Revert statics changes (`git checkout -- packages/orchestrator/src/statics/`)
- If the test PASSED: move to next test case
- If the test FAILED or uncovered a bug: notate it in the **Bugs Found During Testing** section below, then move on

**5. After each round of test cases**

- LLM launches a sub-agent to add regression tests to the appropriate unit/integration test files in the codebase
- Check with user on which test cases to codify and where they best fit before writing

### Bugs Found During Testing

| Test Case              | Date | Description | Severity | Status |
|------------------------|------|-------------|----------|--------|
| *(populated as we go)* |      |             |          |        |

---

## Quest Status Lifecycle (for reference)

```
created ─► explore_flows ─► review_flows ─► flows_approved
                │                 │
                └── (back) ◄──────┘
                                       │
                                       ▼
                              explore_observables ─► review_observables ─► approved
                                       │                    │                 │
                                       └── (back) ◄─────────┘                │
                                                                              │
                                                            ┌─────────────────┤
                                                            ▼                 ▼
                                                    explore_design      in_progress
                                                       │                    │
                                                  review_design        ┌─────┤
                                                       │               │     │
                                                  design_approved      │     ▼
                                                       │               │  blocked ──► in_progress
                                                       ▼               │     │            │
                                                  in_progress          │     ▼            ▼
                                                       │               │  abandoned    complete
                                                       └───────────────┘             abandoned
```

**Who sets quest status:**

| Status                                 | Set by                        | Trigger                                                            |
|----------------------------------------|-------------------------------|--------------------------------------------------------------------|
| `created`                              | quest-add broker              | `/quest` creates initial quest                                     |
| `explore_flows` → `review_observables` | ChaosWhisperer agent          | via `modify-quest` MCP tool during spec phases                     |
| `approved`                             | User                          | approves observables in web UI (Gate #2)                           |
| `explore_design` → `design_approved`   | Glyphsmith + User             | design flow + approval                                             |
| `in_progress`                          | `OrchestrationStartResponder` | Orchestrator detects startable quest status (line 70)              |
| `blocked`                              | orchestration loop            | `nextReadyWorkItemsTransformer` returns blocked (line 93)          |
| `complete`                             | orchestration loop            | `workItemsToQuestStatusTransformer` — all items complete (line 87) |
| `in_progress` (from blocked)           | orchestration loop            | items become ready again after dynamic insertion                   |

**Critical:** Layer brokers NEVER set quest status. They only modify work item statuses. Quest status is always derived
by the orchestration loop's terminal/blocked checks or error handler.

---

## Known Issues Registry

Issues are tracked here and cross-referenced from role sections. Test these SEPARATELY from functional flows — they
verify broken/risky behavior, not intended behavior.

### Confirmed Bugs

| ID | Affects                       | Description                                                                                                                                                                                                                       | How to Trigger                                                                                              | What to Verify                                                                                           |
|----|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| X1 | ChaosWhisperer, Glyphsmith    | Chat layer broker does NOT check agent exit code. Non-zero exit (crash) marks work item `complete` instead of `failed`. Only JS exceptions reach the catch block.                                                                 | Kill the claude process mid-run (SIGKILL) or have it exit non-zero                                          | Work item is `complete` (bug) instead of `failed` (correct). Quest status unchanged.                     |
| X2 | PathSeeker, Ward, Siegemaster | "Second fetch failure": if `questGetBroker` fails AFTER work item is already marked complete/failed, recovery items are never inserted. Quest silently goes terminal/blocked with no recourse.                                    | Make quest file temporarily unreadable after pathseeker verify passes but before downstream item generation | Work item is `complete` but zero downstream items created. Quest goes `complete` with no implementation. |

### Design Risks (no fix yet — need circuit breakers)

| ID | Affects                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | How to Trigger                                                 | What to Verify                                                                                                    |
|----|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| X4 | Codeweaver, Lawbringer, Spiritmender | Slot manager crash/timeout retry has NO attempt counter. An agent that always crashes retries forever.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Have agent binary consistently crash (e.g., bad config)        | Quest stays `in_progress` indefinitely, work item never reaches `failed`. Process must be manually killed.        |
| X5 | Siegemaster                          | Fix chains have no depth limit. Each failed siege-recheck creates another full codeweaver-fix → ward-rerun → siege-recheck chain indefinitely.                                                                                                                                                                                                                                                                                                                                                                                                           | Have siege agent always fail verification                      | `quest.workItems` grows by 3 per cycle. Quest stays `in_progress` forever.                                        |
| X6 | All slot-managed roles               | Silent drop: if crash/timeout or partially-complete respawn can't get a slot, work item stays "started" with no agent — orphaned.                                                                                                                                                                                                                                                                                                                                                                                                                        | Saturate all 3 slots, then crash an agent when no slot is free | Work item stuck at `started` with no agent. Eventually returns as `failed` when slot manager detects stuck state. |
| X8 | Web UI (execution panel)             | Ad-hoc step detection removed. Previously derived from `step.blockingType === 'needs_role_followup'` (dashed border + AD-HOC tag on spiritmender fix-up steps). Field removed during work-items pivot. `isAdhoc` is now hardcoded `false`. Need to derive ad-hoc status from work item metadata (e.g., `insertedBy` or role) instead.                                                                                                                                                                                                                    | View execution panel with spiritmender-spawned steps           | All steps render identically — no visual distinction between planned and ad-hoc fix-up steps.                     |

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
  Slot manager respawns the agent in the same or next available slot. Session ID is passed for resume. **⚠ [X4]: No
  attempt counter — infinite retry.**

- [ ] **T-FAIL-5: Agent crash — chat roles**
  **⚠ [X1]: Exit code is NOT checked.** Non-zero exit still marks work item `complete`. Only a JS exception (spawn
  failure) reaches the error path.

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
  ├─► 1 × codeweaver-fix (dependsOn: [])
  ├─► 1 × ward-rerun (dependsOn: [codeweaver-fix ID])
  └─► 1 × siege-recheck (dependsOn: [ward-rerun ID])

Slot Manager (on needs-role-followup signal)
  └─► 1 × inline spiritmender (slot-internal, NOT a quest work item)
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

- [ ] **T-SPAWN-3: Siege failure generates fix chain**
  After siege fails, quest.json should contain:
    - 1 codeweaver-fix with `dependsOn: []`, `relatedDataItems: []`
    - 1 ward-rerun with `dependsOn: [codeweaver-fix ID]`, `maxAttempts: 3`
    - 1 siege-recheck with `dependsOn: [ward-rerun ID]`
    - Lawbringer `dependsOn` rewired to siege-recheck ID

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
| Siege        | **Unbounded ⚠ [X5]**         | Creates fix chain (3 items) per failure | Quest stays `in_progress` forever, workItems grows     |
| Codeweaver   | 1 (but crash retry ∞ ⚠ [X4]) | Slot manager respawns on crash          | Quest stays `in_progress` forever                      |
| Lawbringer   | 1 (but crash retry ∞ ⚠ [X4]) | Slot manager respawns on crash          | Quest stays `in_progress` forever                      |
| Spiritmender | 1 (but crash retry ∞ ⚠ [X4]) | Slot manager respawns on crash          | Quest stays `in_progress` forever                      |

**Followup depth limits** (for `needs-role-followup` signal within slot manager):

| Caller       | Max Depth | At limit                                                     |
|--------------|-----------|--------------------------------------------------------------|
| Codeweaver   | 5         | Original item `failed` → ward dep unmet → `blocked`          |
| Lawbringer   | 3         | Original item `failed` → quest terminal, stays `in_progress` |
| Spiritmender | 3         | Original item `failed` → ward retry dep unmet → `blocked`    |

- [ ] **T-RETRY-1: PathSeeker retry preserves maxAttempts and timeoutMs**
  Retry item carries same `maxAttempts: 3` and `timeoutMs` from original.

- [ ] **T-RETRY-2: Ward retry at max = no spiritmender, no retry**
  At attempt 2 (0-indexed, max 3): ward marked `failed`, nothing created. Siege stays pending with failed dep.

- [ ] **T-RETRY-3: Followup depth exceeded = original item failed**
  When `followupDepth >= maxFollowupDepth`, the ORIGINAL work item (not the spiritmender) is marked `failed`.

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
[USER] /quest "Build login page"
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

- [ ] **⚠ [X2]** PathSeeker passes verify, but quest.json write to add downstream items fails:

```
pathseeker: complete  ← already marked before the write
codeweavers/ward/siege/lawbringers: NEVER CREATED

quest.json:
  status: complete  ← ALL items are terminal (just chaos + pathseeker, both complete)
  workItems: [{ chaos, complete }, { pathseeker, complete }]
```

**Quest falsely reports `complete` with zero implementation.** This is bug X2.

---

### SAD-E2E-5: Siege fix chain loops indefinitely

- [ ] **⚠ [X5]** Siege keeps failing, each failure creates a new fix chain:

```
siege-A fails → fix chain 1 (cw-fix-1, ward-rerun-1, siege-recheck-1)
siege-recheck-1 fails → fix chain 2 (cw-fix-2, ward-rerun-2, siege-recheck-2)
siege-recheck-2 fails → fix chain 3 ...
... no depth limit ...

quest.json:
  status: in_progress  ← forever
  workItems: grows by 3 per cycle
```

**Quest never terminates.** Process must be manually killed.

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
| maxAttempts      | 1 (no direct retry — crash retry is infinite via slot manager ⚠ [X4]) |
| maxFollowupDepth | 5                                                                     |
| Timeout          | 600,000ms (10 min)                                                    |
| Known issues     | [X4] infinite crash retry, [X6] silent drop                           |

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

- NOT slot-managed — single agent, no crash retry (crash/timeout = immediate failure → fix chain)
- `isComplete = true` if `signal === 'complete'` OR `exitCode === 0` (either suffices)
- Agent exits 0 with non-complete signal (e.g., `partially-complete`) → treated as complete (potential false positive)
- Fix chain: codeweaver-fix (`relatedDataItems: []`, reads quest context) → ward-rerun (`maxAttempts: 3`, own retry
  budget) → siege-recheck
- ⚠ [X5]: Siege-recheck can itself fail → another fix chain → unbounded. No depth limit.
- Fix chain items carry `insertedBy: <failed-siege-id>` for traceability but this chain is NOT depth-limited
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
  ├─ crashed/timedOut → respawn if slot available, else orphaned ⚠ [X4][X6]
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
