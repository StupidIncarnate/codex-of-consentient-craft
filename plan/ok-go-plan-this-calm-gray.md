# PathSeeker pipeline: collapse `seek_plan`, reshape `seek_walk`, drop verify-minion

## Context

The PathSeeker planning pipeline currently has four `seek_*` statuses (`seek_scope → seek_synth → seek_walk → seek_plan → in_progress`) and three sub-agents (surface-scope-minion, verify-minion). The verify-minion runs once during `seek_plan`, emits a `reviewReport`, and PathSeeker triages every finding by re-reading the cited artifacts — paying for the verify-minion's context twice.

We're consolidating:

1. **PathSeeker becomes the final reviewer.** Its `seek_walk` sweep is reshaped from "hold every focusFile in your head" to **walk each user flow entry → exit, confirming step glue and requirement-reading correctness across slices**. The flow-traversal frame is bounded (flows have natural endpoints), grounded in user-facing semantics (the flow IS the requirement), and naturally crosses slices.
2. **Two new cleanup minions in `seek_walk`, dispatched in parallel before PathSeeker's sweep:**
   - `pathseeker-contract-dedup-minion` — cross-slice near-duplicate contracts AND in-package similar-contract scan (catches "minion reinvented an existing contract in its own package").
   - `pathseeker-assertion-correctness-minion` — assertion well-formedness, clause-mapping depth (assertion actually exercises the claimed `then[]`), paraphrased banned matchers, channel discipline.
3. **`seek_plan` status is removed.** Lifecycle becomes `seek_scope → seek_synth → seek_walk → in_progress`. Novelty handling and exploratory step authoring move into PathSeeker's `seek_walk` sweep (PathSeeker has files in context, can spot unprecedented patterns inline).
4. **Verify-minion is deleted.** Prompt statics, agent-name registry entry, transformer case, integration test, and `reviewReport` contract.
5. **Surface-scope minion's self-verify (Step 9) is strengthened**, and its post-commit readback (Step 11) becomes unconditional — with no downstream verify, the minion's pre-commit pass is the slice-local safety net.

Outcome: one fewer status, one fewer LLM call per quest, two new minions that absorb mechanical-but-cross-slice work, and PathSeeker's sweep grounded in flow-traversal rather than open-ended.

---

## Open decision (worth confirming before execution)

**`walkFindings` contract shape.** The current contract is minimal: `{ filesRead, structuralIssuesFound, planPatches, verifiedAt }` (see `packages/shared/src/contracts/planning-walk-findings/planning-walk-findings-contract.ts`). The PathSeeker prompt today references fabricated fields (`wave1Merges`, `wave2DagOverrides`, `perFileNotes`, `siblingAnchors`, `deferredDecisions`, `architecturalSurprises`) — the prompt persists nothing of the sort because the contract rejects unknown fields.

Two reasonable directions:

- **(a) Simplify prompt to match contract.** Prompt example uses only `filesRead` / `structuralIssuesFound` / `planPatches` / `verifiedAt`. Aligns reality with what's stored. Replan-PathSeeker reads minimal notes.
- **(b) Extend contract for the flow-walk frame.** Add `flowsWalked: [{ flowId, entryNodeId, exitNodeId, gluedTight: boolean, notes: string }]` so the entry-to-exit walk is a first-class persisted artifact. Slightly more useful for replan but requires contract + test + stub + barrel + rebuild.

**Recommendation: (a) for this change, defer (b).** The user said `walkFindings` is only relevant on replan; simpler is fine. Flag (b) as follow-up if replan ergonomics suffer.

---

## Implementation order

The lifecycle change is atomic — status enum removal cascades. One PR, ordered to keep `npm run ward` green at each major step:

### Phase A — additive (safe, no breakage)

**A1. Create two new minion prompt statics.**

Files to create:
- `packages/orchestrator/src/statics/pathseeker-contract-dedup-minion/pathseeker-contract-dedup-minion-statics.ts`
- `packages/orchestrator/src/statics/pathseeker-contract-dedup-minion/pathseeker-contract-dedup-minion-statics.test.ts`
- `packages/orchestrator/src/statics/pathseeker-assertion-correctness-minion/pathseeker-assertion-correctness-minion-statics.ts`
- `packages/orchestrator/src/statics/pathseeker-assertion-correctness-minion/pathseeker-assertion-correctness-minion-statics.test.ts`

Pattern mirror: `packages/orchestrator/src/statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics.ts` (same `prompt.template` + `placeholders` shape, statics colocation test pattern).

**Contract-dedup-minion prompt outline:**
- Read-only minion. Receives quest ID.
- Loads quest at `stage: 'implementation'` (steps + contracts).
- Scans `contracts[]` for two issue classes:
  1. Cross-slice near-duplicates (different names, conceptually same shape — naming-similarity + structural-hash).
  2. In-package pre-existing matches: for each `status: 'new'` contract, calls `get-project-inventory({ packageName })` on the contract's source package and looks for an existing contract that should be reused.
- For each issue: commits the merge/rename/status-flip directly via `modify-quest` (rename consumers' `inputContracts` / `outputContracts`, flip status to `'existing'`, update `source` path). Same authority pattern as surface-scope-minion.
- Signal-back with brief summary of merges performed.

**Assertion-correctness-minion prompt outline:**
- Read-only minion. Receives quest ID.
- Loads quest at `stage: 'implementation'` + `stage: 'spec-obs'`.
- For each step's `assertions[]`:
  1. Channel discipline — is the entry genuinely behavioral or is it editorial drift that should move to `instructions[]`?
  2. Clause mapping — does the assertion's `input`/`expected` actually exercise the `when`/`then` of its claimed observable, or is it a lexical-only match?
  3. Paraphrased banned matchers ("approximately equals", "contains roughly", "matches the structure of") — these slip past the literal banned-matcher validator.
  4. Per-prefix `field` correctness (already a validator, but verify minor cases).
- Applies safe fixes directly via `modify-quest` (move editorial drift to instructions[], strengthen weak clause mappings). Flags ambiguous cases by leaving them and noting in signal-back summary.
- Signal-back with brief summary.

Both prompts must include: doc-redundancy rule (don't tell codeweaver about documented standards), single-pass discipline, no Edit/Write/NotebookEdit, single signal-back at end.

**A2. Register the new agent names.**

Edit `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts` — add two new enum entries.

Edit `agent-prompt-name-contract.test.ts` — add two `VALID:` test cases.

Edit `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts` — add two `case` branches and corresponding imports.

Edit `agent-name-to-prompt-transformer.test.ts` — add two unit tests.

Edit `packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts` — add two integration test cases.

After A1+A2: `npm run build && npm run ward` should still pass. Nothing dispatches the new minions yet.

### Phase B — reshape PathSeeker prompt + surface-scope minion

**B1. Rewrite PathSeeker prompt's `seek_walk` section.**

File: `packages/orchestrator/src/statics/pathseeker-prompt/pathseeker-prompt-statics.ts`

New `seek_walk` structure:

1. **Phase 1 — dispatch cleanup minions in parallel:**
   - `pathseeker-contract-dedup-minion`
   - `pathseeker-assertion-correctness-minion`
   - Wait for both `complete`/`failed` before proceeding.
2. **Phase 2 — single full-flow sweep:**
   - For each user flow in `quest.flows[]`:
     - Trace entry node → exit node, gathering observable IDs at each node.
     - For each observable, find satisfying step(s) in `quest.steps[]`.
     - Read each step's `focusFile` (in full).
     - Confirm: (a) upstream glue — input contracts resolved from previous step's output, (b) downstream glue — output contracts referenced correctly downstream, (c) requirement-reading — minion read the spec correctly, (d) CLAUDE.md / standards integrity for the focusFile.
     - Flag novel patterns inline (no sibling precedent for npm method, contract shape, assertion strategy) and author exploratory step(s) directly when warranted.
3. **Single commit at exit:** `walkFindings` + step patches + any exploratory steps + transition `status: 'in_progress'`. Completeness validators fire on this transition.

Delete the entire `seek_plan` section.

Update `## Status Lifecycle` preamble: drop `seek_plan` from the diagram, remove `planningNotes.reviewReport` from the artifact list.

Update `Resume Protocol`: drop the `seek_plan` branch from step 5; current statuses are `seek_scope | seek_synth | seek_walk`.

Update `Signal-Back Rules` summary template — drop verify-minion triage counts.

Update top-of-file PURPOSE comment to reflect the new lifecycle.

Update `walkFindings` example in prompt to use only fields the contract supports (`filesRead`, `structuralIssuesFound`, `planPatches`, `verifiedAt`) — assumes (a) above.

File: `pathseeker-prompt-statics.test.ts` — update tests to match the new structure (the test file pattern-matches sections via regex; update the regexes that reference `seek_plan` / verify-minion / `reviewReport`).

**B2. Strengthen surface-scope-minion (Step 9 + Step 11).**

File: `packages/orchestrator/src/statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics.ts`

Step 9 (Pre-Commit Self-Review) additions:
- **Observable-satisfaction depth.** New checklist bullet: for each claimed observable, walk every `then[]` clause and confirm the assertion's `input`/`expected` actually exercises the clause's behavior (not just lexical match). If the assertion proves a related fact but not the precise clause, strengthen the assertion text.
- **Novelty self-flag.** New checklist bullet: identify any pattern picked without sibling precedent in the package (an npm method nothing else in the package uses, a contract shape unlike existing siblings, an unusual assertion strategy). List these explicitly so the signal-back summary can surface them to PathSeeker.
- **Same-slice cross-step constraint coherence.** If step A's assertion assumes step B's removal landed first, step B's `instructions[]` must explicitly direct the removal AND step A's `dependsOn` must include B. Check both directions.

Step 11 (Post-Commit Verification) change: **make unconditional.** Remove the "conditional — run only if response signals something unusual" framing. Every minion must read back its slice via `get-quest({ stage: 'planning', slice: [yourSliceName] })` after the commit, confirm every authored step + contract appears as written, and signal `failed` if divergence is detected. This is the minion's last safety net now that verify-minion is gone.

Signal-back template (Step 15) update — add novelty flags field:

```
signal-back({
  signal: 'complete',
  summary: 'Committed {N} steps and {M} contracts for slice {sliceName}. Step IDs: [...]. New contracts: [...]. Novelty flags: [list patterns picked without sibling precedent, or "none"].'
})
```

File: `pathseeker-surface-scope-minion-statics.test.ts` — update regex pattern tests for the new Step 9 / 11 / 15 content.

After B1+B2: prompts changed but the status enum still has `seek_plan`. Quests in flight survive (PathSeeker's old prompt mentioning seek_plan doesn't break; the agent just won't reach the seek_plan section because it'll transition to `in_progress` from seek_walk). `npm run ward` should still pass.

### Phase C — drop `seek_plan` from the lifecycle

**C1. Move completeness validators to fire on `seek_walk → in_progress`.**

File: `packages/orchestrator/src/transformers/quest-completeness-for-transition/quest-completeness-for-transition-transformer.ts`

Change the gate condition from "fires only on `seek_plan → in_progress`" to "fires only on `seek_walk → in_progress`". Remove the `reviewReport` required check (lines ~135–139 per explorer). Existing completeness checks (`unresolved-step-contract-refs`, `orphan-new-contracts`, `unsatisfied-observables`) stay — they just fire at the new transition.

File: `quest-completeness-for-transition-transformer.test.ts` — update test cases (lines 195–315 are the seek_plan completeness tests; rewrite them to assert against seek_walk → in_progress).

**C2. Update modify-quest allowlist.**

File: `packages/orchestrator/src/statics/quest-status-input-allowlist/quest-status-input-allowlist-statics.ts`

Delete the `seek_plan` entry (allowedFields, allowedPlanningNotesFields: `['reviewReport']`).

For `seek_walk`: confirm `steps`, `contracts`, `status`, `flows`, `designDecisions` are allowed (already are per explorer). `allowedPlanningNotesFields`: keep `['walkFindings']`.

File: `quest-status-input-allowlist-statics.test.ts` — delete seek_plan test cases (lines 240–243 + any nearby blocks).

**C3. Update status transitions.**

File: `packages/shared/src/statics/quest-status-transitions/quest-status-transitions-statics.ts`

Change `seek_walk → ['seek_plan', 'seek_scope', 'abandoned', 'paused']` to `seek_walk → ['in_progress', 'seek_scope', 'abandoned', 'paused']`.

Delete the `seek_plan → [...]` entry entirely.

File: `quest-status-transitions-statics.test.ts` — update.

**C4. Drop `seek_plan` from the status enum.**

File: `packages/shared/src/contracts/quest-status/quest-status-contract.ts` — remove `'seek_plan'` from the enum.

File: `quest-status-contract.test.ts` — remove the seek_plan parsing test.

File: `quest-status.stub.ts` — confirm no default uses seek_plan.

File: `packages/shared/src/statics/quest-status-metadata/quest-status-metadata-statics.ts` — remove the seek_plan metadata entry.

File: `quest-status-metadata-statics.test.ts` — remove the seek_plan assertion.

**C5. Update status-gating guards.**

Files:
- `packages/shared/src/guards/is-pathseeker-running-quest-status/is-pathseeker-running-quest-status-guard.ts` — remove `'seek_plan'` from the Set.
- `packages/shared/src/guards/is-any-agent-running-quest-status/is-any-agent-running-quest-status-guard.ts` — remove.
- `packages/shared/src/guards/is-quest-pauseable-quest-status/is-quest-pauseable-quest-status-guard.ts` — remove.

Update each guard's `.test.ts` to drop seek_plan cases.

**C6. Rebuild shared.**

```bash
npm run build --workspace=@dungeonmaster/shared
```

After C1–C6: status enum is `seek_walk → in_progress`, modify-quest rejects writes during a status that no longer exists, completeness fires at the right transition. Anything still referencing the seek_plan status now fails the type-check.

### Phase D — delete verify-minion and `reviewReport`

**D1. Delete the verify-minion prompt and registry.**

Files to delete:
- `packages/orchestrator/src/statics/pathseeker-verify-minion/pathseeker-verify-minion-statics.ts`
- `packages/orchestrator/src/statics/pathseeker-verify-minion/pathseeker-verify-minion-statics.test.ts`
- (The folder is empty after — `mv` to a sideline scratch dir; do not `rm` per project policy.)

Files to edit:
- `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts` — remove `'pathseeker-verify-minion'` from enum (line 13).
- `agent-prompt-name-contract.test.ts` — remove the verify-minion parsing test (lines 13–18).
- `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts` — remove the import + `case 'pathseeker-verify-minion':` branch (lines 32–36).
- `agent-name-to-prompt-transformer.test.ts` — remove the verify-minion unit test (lines 25–33).
- `packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts` — remove the verify-minion import + integration test (lines 9, 26–32).
- `packages/mcp/src/contracts/get-agent-prompt-input/get-agent-prompt-input-contract.ts` — line 16: JSDoc example uses verify-minion; swap for a different example (e.g. `pathseeker-surface-scope-minion`).
- `packages/mcp/src/contracts/get-agent-prompt-input/get-agent-prompt-input-contract.test.ts` — line 13: same swap.

**D2. Delete the `reviewReport` field and contract.**

Files to edit:
- `packages/shared/src/contracts/quest/quest-contract.ts` — remove `reviewReport: planningReviewReportContract.optional()` (line 94) and the import.
- `packages/shared/src/contracts/modify-quest-input/modify-quest-input-contract.ts` — remove line 149 and the import.
- `packages/shared/contracts.ts` — barrel: remove `planning-review-report` export.
- `packages/shared/package.json` — check `exports` for any planning-review-report subpath; remove if present.

Files to delete (mv to sideline):
- `packages/shared/src/contracts/planning-review-report/planning-review-report-contract.ts`
- `packages/shared/src/contracts/planning-review-report/planning-review-report-contract.test.ts`
- `packages/shared/src/contracts/planning-review-report/planning-review-report.stub.ts`

Files to edit (consumers):
- `packages/orchestrator/src/responders/quest/get-planning-notes/quest-get-planning-notes-responder.ts` — drop the `'review'` section from `PlanningNotesSection` enum (lines 19–28) and remove `reviewReport` from the output type (line 28). Update test.
- `packages/testing/src/statics/quest-gate-content-seed/quest-gate-content-seed-transformer.ts` + test — remove the seek_plan seed entry that stubs `reviewReport` (lines 36–40 of the test file).

**D3. Rebuild shared.**

```bash
npm run build --workspace=@dungeonmaster/shared
```

### Phase E — fix downstream references

**E1. Other prompts referencing verify-minion.**

File: `packages/orchestrator/src/statics/lawbringer-prompt/lawbringer-prompt-statics.ts` — line 29 references "observable checking defers to verify-minion". Rewrite to reference PathSeeker's seek_walk flow walk instead.

Update its `.test.ts` if it pattern-matches the changed text.

**E2. Server / web references to seek_plan.**

File: `packages/server/src/responders/quest/pause/quest-pause-responder.ts` — line 52 error message lists pauseable statuses including `seek_plan`. Remove. Update test (line 20).

File: `packages/web/src/widgets/execution-panel/execution-panel-widget.test.ts` — line 2314 expects `seek_plan` in execution phase statuses. Remove.

File: `packages/orchestrator/src/brokers/quest/enqueue-recoverable/quest-enqueue-recoverable-broker.test.ts` — lines 86, 241 use `seek_plan` as test data. Update.

File: `packages/orchestrator/src/statics/quest-hydrate-strategy/quest-hydrate-strategy-statics.test.ts` — lines 36–85 regression tests for blueprint chain. Update to reflect `seek_walk → in_progress`.

File: `packages/orchestrator/src/transformers/quest-input-forbidden-fields/quest-input-forbidden-fields-transformer.test.ts` — lines 787–891 are seek_plan forbidden-field tests. Delete those test blocks.

**E3. E2E + integration tests.**

File: `packages/orchestrator/src/flows/quest/quest-flow.integration.test.ts` — lines 36–110: full-lifecycle test. Update transitions to skip seek_plan.

File: `packages/testing/e2e/web/pathseeker-phased-statuses.spec.ts` — lines 170–198: seek_plan UI rendering test. Delete the seek_plan-specific block; keep the others.

File: `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.test.ts` — seek_walk failure-routing tests. Update if they reference seek_plan as a target status.

File: `packages/orchestrator/src/brokers/quest/orchestration-loop/run-pathseeker-layer-broker.test.ts` — (per explorer the file has tests at lines 158–600+ asserting verify-minion spawn). Actually re-checked the broker source — verify-minion isn't spawned from the broker; it's spawned from PathSeeker's own prompt tool-calls. So this broker doesn't need code changes, but its tests may pattern-match on workItem creation paths that mention verify; update where needed.

**E4. Docs.**

File: `packages/orchestrator/CLAUDE.md` — lines 322, 345, 470–473, 555–557:
- Remove `pathseeker-verify-minion` from the agent roster table.
- Add `pathseeker-contract-dedup-minion` and `pathseeker-assertion-correctness-minion` to the roster.
- Update the seek_plan lifecycle description to reflect collapse (the lifecycle now ends at seek_walk → in_progress).

File: `packages/mcp/CLAUDE.md` — lines 100, 183: verify-minion references; remove.

File: `playbook/smoketest-orchestrator.md` — lines 505–508: drop seek_plan UI expectations.

File: `docs/quest-role-paths.md` — lines 445–1037 have verify-minion paths; either delete the section or add a "removed" note. Per project rule "don't document historical state," delete it.

### Phase F — build + ward + smoke

```bash
npm run build
npm run ward
```

Expected: `npm run ward` exits 0. Every test file referenced above has been updated to reflect the new lifecycle. Zero greppable references to `seek_plan`, `reviewReport`, `pathseeker-verify-minion` (other than possibly historical `plan/` markdown files that the user can decide on).

---

## Critical files to modify (quick index)

| Concern | File |
|---|---|
| Status enum | `packages/shared/src/contracts/quest-status/quest-status-contract.ts` |
| Status transitions | `packages/shared/src/statics/quest-status-transitions/quest-status-transitions-statics.ts` |
| Status metadata | `packages/shared/src/statics/quest-status-metadata/quest-status-metadata-statics.ts` |
| Status gating guards (3 files) | `packages/shared/src/guards/is-*-quest-status/` |
| Quest contract (planningNotes) | `packages/shared/src/contracts/quest/quest-contract.ts` |
| modify-quest input contract | `packages/shared/src/contracts/modify-quest-input/modify-quest-input-contract.ts` |
| modify-quest allowlist | `packages/orchestrator/src/statics/quest-status-input-allowlist/quest-status-input-allowlist-statics.ts` |
| Completeness validators gate | `packages/orchestrator/src/transformers/quest-completeness-for-transition/quest-completeness-for-transition-transformer.ts` |
| Agent-name enum | `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts` |
| Agent-name → prompt transformer | `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts` |
| PathSeeker prompt | `packages/orchestrator/src/statics/pathseeker-prompt/pathseeker-prompt-statics.ts` |
| Surface-scope minion prompt | `packages/orchestrator/src/statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics.ts` |
| Lawbringer prompt | `packages/orchestrator/src/statics/lawbringer-prompt/lawbringer-prompt-statics.ts` |
| Verify-minion (delete) | `packages/orchestrator/src/statics/pathseeker-verify-minion/` |
| reviewReport contract (delete) | `packages/shared/src/contracts/planning-review-report/` |
| Contract-dedup-minion (create) | `packages/orchestrator/src/statics/pathseeker-contract-dedup-minion/` |
| Assertion-correctness-minion (create) | `packages/orchestrator/src/statics/pathseeker-assertion-correctness-minion/` |
| Get-planning-notes responder | `packages/orchestrator/src/responders/quest/get-planning-notes/quest-get-planning-notes-responder.ts` |
| Pause responder error message | `packages/server/src/responders/quest/pause/quest-pause-responder.ts` |
| Quest gate seed | `packages/testing/src/statics/quest-gate-content-seed/quest-gate-content-seed-transformer.ts` |
| Orchestrator CLAUDE.md | `packages/orchestrator/CLAUDE.md` |
| Quest role paths doc | `docs/quest-role-paths.md` |
| Smoketest playbook | `playbook/smoketest-orchestrator.md` |

---

## Existing utilities to reuse

- `AgentPromptNameStub` (`packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name.stub.ts`) — for tests of new minion names.
- `agentNameToPromptTransformer` (`packages/orchestrator/src/transformers/agent-name-to-prompt/`) — pattern to extend for the two new minions.
- Surface-scope-minion's Step 9 self-review checklist — adapt as the structural template for assertion-correctness-minion's review logic.
- `pathseekerSurfaceScopeMinionStatics` shape (`prompt.template` + `placeholders.arguments`) — exact shape to mirror for the two new minion statics.
- `questModifyBroker` (`packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts`) — already enforces save-time + completeness validators; both new minions reuse it for their commits.
- `get-project-inventory` MCP tool — contract-dedup-minion uses this for in-package similarity scan (cited in the surface-scope-minion prompt as the canonical way to enumerate leaf-utility folders).

---

## Verification

1. **Build clean:** `npm run build` exits 0.
2. **Ward green:** `npm run ward` exits 0 with `timeout: 600000`. Any new test additions are deterministic.
3. **Grep-zero invariants** (run after the change lands):
   - `grep -r "seek_plan" packages/` → zero hits (except possibly in `plan/` markdown).
   - `grep -r "pathseeker-verify-minion" packages/` → zero hits.
   - `grep -r "reviewReport" packages/` → zero hits.
   - `grep -r "planningReviewReportContract" packages/` → zero hits.
4. **Status transition contract test** asserts the transition graph: `seek_walk` can only transition to `in_progress | seek_scope | abandoned | paused`.
5. **Full-lifecycle integration test** (`packages/orchestrator/src/flows/quest/quest-flow.integration.test.ts`) walks a quest through `approved → seek_scope → seek_synth → seek_walk → in_progress` (5 transitions, not 6).
6. **E2E smoke** — `npm run prod`, drive a small quest through the UI, confirm pathseeker phase shows three statuses (not four) in the execution panel, no verify-minion work item ever appears, quest reaches `in_progress` and codeweaver fires.
7. **Manual prompt sanity check** — open `pathseeker-prompt-statics.ts` and read the new `seek_walk` section end-to-end as if you were the agent reading it cold. Confirm: minion dispatch is unambiguous, flow-walk steps are sequenced, exit commit shape is concrete, walkFindings example matches the contract.
