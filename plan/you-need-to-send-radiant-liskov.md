# Quest-Status Abstraction Layer (+ Bug Fixes from Pathseeker Split)

## Context

When PathSeeker was split out of `in_progress` into phased `seek_scope → seek_synth → seek_walk → seek_plan`, agents patched surface holes as they hit them but missed others — every status check in the codebase was written under the pre-split assumption that "`in_progress` = pathseeker + all downstream agents." Post-split, many sites silently compute the wrong answer.

**Governing principle.** Every `quest.status === 'X'` read — including single-literal checks — must be re-examined under post-split semantics. Single-literal reads are **not** safe by default; a check that happens to test one status today may have been written pre-split meaning "pathseeker or later," which today requires `{seek_*, in_progress}`. Intent audit first, *then* encode the corrected semantics in metadata.

Work-item-status (`pending | in_progress | complete | failed | skipped`) gets the same metadata+guards treatment in v1 — same pattern, same enforcement.

---

## Bug Fixes (land first)

Each is a real bug from the split, not a refactor. Each gets its own PR + test.

### Fix 1 — Recovery missing `seek_*` (critical)
- **File:** `packages/orchestrator/src/statics/recoverable-quest-statuses/recoverable-quest-statuses-statics.ts`
- **Bug:** Set omits all four `seek_*`. If the server crashes while pathseeker is mid-plan, the quest stays frozen.
- **Fix:** Add `'seek_scope','seek_synth','seek_walk','seek_plan'`.
- **Test:** unit assertion on set contents + targeted integration test of `isRecoverableQuestStatusGuard({status: 'seek_synth'})`. Full mid-phase-kill integration is out of scope for this PR (requires harness support we don't have).

### Fix 2 — Legacy-repair filter in startup-recovery
- **File:** `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.ts:72-74`
- **Current:** `(quest) => quest.status === 'in_progress' && !quest.workItems.some(wi => wi.role === 'pathseeker')`
- **Risk if we simply drop the clause:** with Fix 1 broadening `recoverableQuests` to include `created`/`pending`/`explore_*`/`explore_design` plus `seek_*`, dropping the `in_progress` clause inserts pathseeker items for pre-execution quests that shouldn't have them yet.
- **Correct fix:** narrow to `{seek_*, in_progress}` via `isAnyAgentRunningQuestStatusGuard` (introduced in Phase 2). Intent: "quest has progressed past pathseeker spawn but is missing its pathseeker item — repair."
- **Sequencing:** can't land in Phase 1 because the guard doesn't exist yet. Move this specific fix to **Phase 4 (Orchestrator reads)** — same PR as the `recover-guild-layer-responder.ts:44` swap to `isRecoverableQuestStatusGuard`.

### Fix 3 — Startable set has dead entry + stale branch
- **Files:** `packages/orchestrator/src/statics/startable-quest-statuses/startable-quest-statuses-statics.ts` + `packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.ts`
- **Bug:** `'in_progress'` in the startable set is unreachable in normal user-initiated start flow; the Start Quest button is hidden for running quests; recovery takes a different path via startup-recovery-responder. The dead entry keeps a dead branch (`alreadyInProgress` at line 53, consumed by a ternary on line 112) alive.
- **Fix (two edits in one PR):**
  1. Reduce the set to `['approved','design_approved']`.
  2. Delete both the `alreadyInProgress` declaration (line 53) AND the ternary `...(alreadyInProgress ? {} : { status: 'seek_scope' })` at line 112. The transition to `'seek_scope'` becomes unconditional on the normal start path.
- **Test:** unit — assert set contents; unit — assert the responder always writes `status: 'seek_scope'` when starting from `approved`.

### Fix 4 — Execution-phase guard includes terminals
- **File:** `packages/web/src/guards/is-execution-phase/is-execution-phase-guard.ts`
- **Bug:** Returns true for `complete`/`abandoned`. Callers asking "is this quest actively executing?" get `true` for completed quests.
- **Fix:** Replace with two shared guards defined in Phase 2 (`isAnyAgentRunningQuestStatusGuard` and `shouldRenderExecutionPanelQuestStatusGuard`). Each caller is routed individually — see Per-Site Migration. Delete the old guard in Phase 8.

### Fix 5 — Pauseable/resumable conflated
- **File:** `packages/web/src/guards/is-quest-pauseable-or-resumable/is-quest-pauseable-or-resumable-guard.ts`
- **Bug:** One guard covers both running (pause applies) and paused (resume applies). Execution-panel uses it to toggle both buttons — showing Pause on a paused quest and Resume on a running quest.
- **Fix:** Split into `isQuestPauseableQuestStatusGuard` + `isQuestResumableQuestStatusGuard` (both shared). Update execution-panel JSX to gate each button on its own guard. Delete the old guard in Phase 8.

### Fix 6 — Stale section-header labels
- **File:** `packages/web/src/statics/quest-gate-sections/quest-gate-sections-statics.ts`
- **Bug:** `headers` labels for `in_progress`/`paused`/`blocked`/`complete`/`abandoned` all `'SPEC APPROVED'`.
- **Fix:** Update labels to `IN PROGRESS` / `EXECUTION PAUSED` / `EXECUTION BLOCKED` / `EXECUTION COMPLETE` / `ABANDONED`. Move the header map into metadata (replaced by `displayHeaderQuestStatusTransformer`) in Phase 6.

---

## Data Model

Contracts and statics are split per folder-type rules. Interfaces live in `contracts/`; data lives in `statics/`; statics import contract types.

### Contracts

`packages/shared/src/contracts/quest-status-metadata/` (new folder):
- `display-header-contract.ts` — `z.string().brand<'DisplayHeader'>()` (satisfies `ban-primitives`).
- `quest-status-metadata-contract.ts` — Zod schema for the per-status metadata object. Fields (only those actually consumed by guards/transformers — no dead fields):

```ts
// in contract
const questStatusMetadataContract = z.object({
  isPathseekerRunning: z.boolean(),
  isAnyAgentRunning: z.boolean(),
  isActivelyExecuting: z.boolean(),
  isUserPaused: z.boolean(),
  isQuestBlocked: z.boolean(),
  isTerminal: z.boolean(),
  isPauseable: z.boolean(),
  isResumable: z.boolean(),
  isStartable: z.boolean(),
  isRecoverable: z.boolean(),
  isAutoResumable: z.boolean(),
  isGateApproved: z.boolean(),
  isDesignPhase: z.boolean(),
  isPreExecution: z.boolean(),
  shouldRenderExecutionPanel: z.boolean(),
  nextApprovalStatus: questStatusContract.nullable(),
  displayHeader: displayHeaderContract,
});
```

`packages/shared/src/contracts/work-item-status-metadata/work-item-status-metadata-contract.ts`:

```ts
const workItemStatusMetadataContract = z.object({
  isTerminal: z.boolean(),
  satisfiesDependency: z.boolean(),
  isActive: z.boolean(),
  isPending: z.boolean(),
  isComplete: z.boolean(),
  isSkipped: z.boolean(),
  isFailure: z.boolean(),
});
```

### Statics

`packages/shared/src/statics/quest-status-metadata/quest-status-metadata-statics.ts`:

```ts
import { questStatusContract, type QuestStatus } from '@dungeonmaster/shared/contracts';
import type { QuestStatusMetadata } from '@dungeonmaster/shared/contracts';

// Named record type (not inline) — avoids ban-adhoc-types.
type QuestStatusMetadataRecord = Record<QuestStatus, QuestStatusMetadata>;

export const questStatusMetadataStatics = {
  statuses: { /* 20 rows */ },
} as const satisfies { statuses: QuestStatusMetadataRecord };
```

Symmetric for `work-item-status-metadata-statics.ts` with 5 rows.

**Compile-time lock.** Adding a status to `questStatusContract` without adding a metadata row is a TS error at this file. Adding a field to the metadata contract without filling it for every row is a TS error. Every guard inherits coverage because guards are one-liners reading metadata flags.

---

## Guard + Transformer Inventory

All guards in `packages/shared/src/guards/<name>/<name>-guard.ts`, signature `({status}: {status?: QuestStatus}): boolean` (or `WorkItemStatus`), `enforce-optional-guard-params` compliant, three-line bodies (optional-undefined check + metadata read + return).

### Quest-status guards (14)

| Guard | Covers (via metadata flag) |
|---|---|
| `isPreExecutionQuestStatusGuard` | intake + spec-* + design |
| `isPathseekerRunningQuestStatusGuard` | seek_* |
| `isAnyAgentRunningQuestStatusGuard` | seek_* + in_progress |
| `isActivelyExecutingQuestStatusGuard` | exactly `in_progress` (locked — see §Locked Decisions) |
| `isUserPausedQuestStatusGuard` | `paused` |
| `isQuestBlockedQuestStatusGuard` | `blocked` |
| `isTerminalQuestStatusGuard` | complete, abandoned |
| `isQuestPauseableQuestStatusGuard` | seek_* + in_progress |
| `isQuestResumableQuestStatusGuard` | paused, blocked |
| `isStartableQuestStatusGuard` | approved, design_approved |
| `isRecoverableQuestStatusGuard` | intake + spec-* + design + planning + execution (Fix 1 baked in) |
| `isAutoResumableQuestStatusGuard` | in_progress |
| `isGateApprovedQuestStatusGuard` | *_approved |
| `isDesignPhaseQuestStatusGuard` | explore_design + review_design + design_approved |
| `shouldRenderExecutionPanelQuestStatusGuard` | planning + execution + terminal (Fix 4 split) |

### Quest-status transformers (2)

| Transformer | Returns | Replaces |
|---|---|---|
| `nextApprovalQuestStatusTransformer` | `QuestStatus \| null` | web's `questGateSectionsStatics.nextApprovalStatus` |
| `displayHeaderQuestStatusTransformer` | `DisplayHeader` | web's `questGateSectionsStatics.headers` (Fix 6 labels) |

### Work-item-status guards (6)

| Guard | Covers |
|---|---|
| `isTerminalWorkItemStatusGuard` | complete, failed, skipped |
| `satisfiesDependencyWorkItemStatusGuard` | complete, failed |
| `isActiveWorkItemStatusGuard` | in_progress |
| `isPendingWorkItemStatusGuard` | pending |
| `isCompleteWorkItemStatusGuard` | complete |
| `isSkippedWorkItemStatusGuard` | skipped |

Total: 15 quest guards + 6 work-item guards + 2 transformers = 23 surface symbols. ~20 status-row cases per guard via `it.each` parameterized tests over `questStatusContract.options` / `workItemStatusContract.options`.

---

## What Moves / Stays / Deletes

| Existing | Action |
|---|---|
| `questStatusContract`, `workItemStatusContract` | KEEP |
| `questStatusTransitionsStatics` (orchestrator) | MOVE → shared/statics (colocate with metadata) |
| `isRecoverableQuestStatusGuard` (orchestrator) | MOVE → shared; body reads metadata; Fix 1 applied via metadata |
| `quest-has-valid-status-transition-guard` (orchestrator) | KEEP path; update import of the moved static |
| `questStatusInputAllowlistStatics` (orchestrator) | KEEP (authorization policy, orchestrator-only) |
| `autoResumableQuestStatusesStatics` | DELETE (Phase 8) |
| `recoverableQuestStatusesStatics` | DELETE (Phase 8) — but contents broadened in Phase 1 first (Fix 1) |
| `startableQuestStatusesStatics` | DELETE (Phase 8) — contents narrowed in Phase 1 first (Fix 3) |
| `questStageMappingStatics` | KEEP (stage ≠ status vocabulary) |
| `questGateContentRequirementsStatics` (shared) | KEEP (per-status nested-path policy — separate concern) |
| `questGateSectionsStatics.sections` (web) | KEEP (presentation) |
| `questGateSectionsStatics.headers` (web) | DELETE (Phase 6) — labels move to metadata with Fix 6 values |
| `questGateSectionsStatics.nextApprovalStatus` (web) | DELETE (Phase 6) — replaced by `nextApprovalQuestStatusTransformer` |
| `questStatusColorsStatics` (web) | Delete 4 dead keys (`proposed`/`deferred`/`ready`/`partially_complete`); move `failed` into a new `workItemStatus` sub-map; split root into `status: Record<QuestStatus, ColorToken>` + `workItemStatus: Record<WorkItemStatus, ColorToken>` with `satisfies` |
| `isExecutionPhaseGuard` (web) | DELETE (Phase 8) after callers migrate (Fix 4) |
| `isQuestPauseableOrResumableGuard` (web) | DELETE (Phase 8) after callers migrate (Fix 5) |
| `is-design-tab-visible-guard` (web) | KEEP as thin wrapper; body calls `isDesignPhaseQuestStatusGuard` |
| `is-design-start-visible-guard` (web) | KEEP as-is — single-literal `'approved'` check confirmed correct post-audit |

---

## Per-Site Migration

### Orchestrator quest-status reads

| Site | Action |
|---|---|
| `work-items-to-quest-status-transformer.ts:11-22` (inline `PRE_EXECUTION_STATUSES` Set) | → `isPreExecutionQuestStatusGuard`. Also fixes missing `pending`. |
| `work-items-to-quest-status-transformer.ts:31` (`startsWith('seek_')`) | → `isPathseekerRunningQuestStatusGuard`. |
| `work-items-to-quest-status-transformer.ts:40/44/56` (return writes) | No change — output writes. |
| `quest-orchestration-loop-broker.ts:77` | → `isUserPausedQuestStatusGuard`. |
| `quest-orchestration-loop-broker.ts:104` (writes `'blocked'`) | No change — output write. |
| `orchestration-start-responder.ts:43` | → `isStartableQuestStatusGuard`. |
| `orchestration-start-responder.ts:53` + line 112 ternary | DELETE entirely (Fix 3). |
| `pathseeker-pipeline-broker.ts:54` | → `isActivelyExecutingQuestStatusGuard`. Audit confirmed intent match. |
| `pathseeker-pipeline-broker.ts:65` | → `isPathseekerRunningQuestStatusGuard`. |
| `quest-modify-responder.ts:34` | → `isAutoResumableQuestStatusGuard`. |
| `recover-guild-layer-responder.ts:44` | → `isRecoverableQuestStatusGuard`. |
| `recover-guild-layer-responder.ts:73` | → `isAnyAgentRunningQuestStatusGuard({status: quest.status})` (Fix 2 corrected semantics). |
| `orchestration-pause-responder.ts` | No quest-status change. Work-item reads below. |
| `quest-completeness-for-transition-transformer.ts` | No change — case-dispatch on `nextStatus`, not membership. |
| `pathseeker-prompt-statics.ts:379` | No change — literal in prompt template; ESLint allowlist. |

### Orchestrator work-item reads

| Site | Action |
|---|---|
| `next-ready-work-items-transformer.ts:13-14,25,31,35,38` (inline Sets) | → `isTerminalWorkItemStatusGuard`, `satisfiesDependencyWorkItemStatusGuard`. |
| `orchestration-pause-responder.ts:38` | → `isActiveWorkItemStatusGuard`. |
| `recover-guild-layer-responder.ts:54,57,80` | → `isActiveWorkItemStatusGuard` / `isCompleteWorkItemStatusGuard` per line. |
| `quest-active-session-transformer.ts:21` | → `isActiveWorkItemStatusGuard`. |
| `quest-orchestration-loop-broker.ts:140` | → `isActiveWorkItemStatusGuard`. |
| `work-items-to-quest-status-transformer.ts:43` (`item.status === 'in_progress'`) | → `isActiveWorkItemStatusGuard`. |
| `run-blightwarden-layer-broker.ts:133` | → appropriate work-item guard per intent audit. |
| `run-siegemaster-layer-broker.ts:114,175,295` | → appropriate work-item guards per intent audit. |
| `run-ward-layer-broker.ts:154,225` | → appropriate work-item guards per intent audit. |
| `handle-signal-layer-broker.ts` | Markers (markCompleted/markFailed) are writes — no change. |

### Web reads

| Site | Action |
|---|---|
| `is-execution-phase-guard.ts` callers (see mapping below) | Route each to the correct shared guard; delete web guard in Phase 8. |
| `is-quest-pauseable-or-resumable-guard.ts` callers (execution-panel pause + resume buttons) | Pause → `isQuestPauseableQuestStatusGuard`; Resume → `isQuestResumableQuestStatusGuard`. Widget JSX splits. |
| `is-design-tab-visible-guard.ts` body | Rewrite as one-line delegate to `isDesignPhaseQuestStatusGuard`. |
| `is-design-start-visible-guard.ts` | No change. |
| `execution-panel-widget.tsx:87-89` (terminal) | → `isTerminalQuestStatusGuard`. |
| `execution-panel-widget.tsx:143` (`wi.status === 'in_progress'`) | → `isActiveWorkItemStatusGuard`. |
| `quest-chat-widget.tsx:102-104` (`status === 'approved' \|\| 'design_approved'`) | → `isGateApprovedQuestStatusGuard`. |
| `quest-chat-widget.tsx:138` (`status === 'paused' \|\| 'blocked'`) | → `isQuestResumableQuestStatusGuard`. |
| `quest-chat-widget.tsx:143`, `:160` (`isExecutionPhaseGuard` usage) | Route: both are UI rendering gates → `shouldRenderExecutionPanelQuestStatusGuard`. |
| `quest-chat-widget.tsx:296-301` (`approvedReviewStatus` ternary) | → `isGateApprovedQuestStatusGuard` for the classification; keep the ternary literals if they select a write-target status. |
| `quest-chat-widget.tsx:349` (`isExecutionPhaseGuard` gating execution layout) | → `shouldRenderExecutionPanelQuestStatusGuard` (terminal states still render the layout for audit). |
| `quest-chat-widget.tsx:558/563/567` (`nextStatus === 'flows_approved' \| 'approved' \| 'design_approved'`) | These are case-dispatch on `nextStatus` in approval UI. No change — each branch does different work, like `quest-completeness-for-transition-transformer`. |
| `quest-status-colors-statics.ts` | Delete 4 dead keys; move `failed` to `workItemStatus`; split with `satisfies` typing. |
| `quest-gate-sections-statics.ts` | Delete `headers` + `nextApprovalStatus` sub-maps in Phase 6 (replaced by transformers). |

---

## Execution Phases

Each phase = its own PR; ward green between phases.

1. [x] **Bugs 1/3/6** — recoverable broadening (Fix 1), startable narrowing + responder cleanup (Fix 3), header label updates in place (Fix 6). Tests per each.
2. [x] **Foundation** — create contracts + both metadata statics + 15 quest-status guards + 6 work-item-status guards + 2 transformers + barrels. Build shared. No call-site changes. Consistency test lives in `packages/orchestrator/src/statics/quest-status-metadata-consistency.test.ts` — orchestrator-side, imports both legacy orchestrator statics and new shared metadata, asserts `metadata.isRecoverable ⇔ legacyRecoverableSet.has(status)` etc. Deleted in Phase 8.
   > Note: `display-header-contract.ts` lives under `contracts/display-header/` (its own folder) rather than nested under `contracts/quest-status-metadata/` — project-structure rule requires file name == folder name.
   > Note: Statics use plain `as const` instead of `as const satisfies Record<QuestStatus, QuestStatusMetadata>` — statics folder cannot import from contracts per folder-config allowed-imports. Runtime coverage is enforced by the consistency test (Phase 2) and will be fully static in Phase 8 when the compile-time lock is revisited.
   > Note: Consistency test is wrapped as a folder `quest-status-metadata-consistency/` + placeholder `-statics.ts` + colocated test to satisfy `enforce-test-colocation`; both deleted together in Phase 8.
3. [x] **Move existing** — `questStatusTransitionsStatics` + `isRecoverableQuestStatusGuard` → shared; update imports. Rebuild shared before rebuilding orchestrator.
   > Note: ward `--changed` currently crashes on deleted files (non-existent paths leak into ESLint's file-arg list). Not a Phase-3 defect — full `ward -- --only lint` passes. Worth a standalone ward fix before Phase 8's bigger deletion wave.
4. [x] **Orchestrator reads** — all orchestrator quest-status literal swaps per migration table, including Fix 2 (`recover-guild-layer-responder.ts:73` → `isAnyAgentRunningQuestStatusGuard`).
5. **Web Fix 4 + Fix 5** — split web's execution-phase + pauseable guards into the two shared guards each; migrate quest-chat-widget + execution-panel callers per the per-line mapping.
6. **Remaining web reads + presentation cleanup** — terminal check in execution-panel, design-tab delegation, color statics split, gate-sections headers/nextApprovalStatus deletion (now served by transformers).
7. **Work-item reads** — swap all `wi.status === …` reads per the per-site table.
8. **Cleanup + Lint rule landing** — delete legacy orchestrator statics (auto-resumable, recoverable, startable), delete legacy web guards (isExecutionPhaseGuard, isQuestPauseableOrResumableGuard), delete Phase-2 consistency test. **Now** land the ESLint rule (see Enforcement §1) — all pre-existing violations are already gone, so the rule lands green.

---

## Enforcement — Preventing Regression

Four layers of friction once the migration is complete.

### 1. Custom ESLint rule — `@dungeonmaster/ban-status-string-comparisons` (NEW; lands Phase 8)

Syntactic pattern matching, **not** type-aware — no precedent for type-aware rules in this codebase, and pre-edit hooks can't provide type info for transient file paths (per `packages/eslint-plugin/CLAUDE.md`).

**The rule checks syntactic patterns:**

1. Binary `===` / `!==` where:
   - One side is a `MemberExpression` whose property name is `status` and whose object identifier matches a known-status-holder allowlist: `quest`, `workItem`, `wi`, `item`, `postResult.quest` (dotted), `input`, or identifiers matching the regex `/Quest$|Item$/`. (Extendable via rule options.)
   - The other side is a string `Literal` whose value is in the union `questStatusLiterals ∪ workItemStatusLiterals`.
   - Emit diagnostic routed by which enum the literal belongs to. If the literal is in both enums (`in_progress`, `complete`, `pending`), the error message lists both possible guards and asks the author to pick based on context.

2. `switch` statement whose discriminant matches the above member-access pattern AND which contains `case 'LITERAL':` clauses where LITERAL is a known status value.

3. `.startsWith('seek_')`, `.startsWith('explore_')`, `.startsWith('review_')` invocations anywhere.

4. `new Set([...])` or array literals where ≥2 elements are known quest-status or work-item-status literals — flagged as inline membership sets.

**Allowlist (where these patterns remain legal):**
- `packages/shared/src/statics/quest-status-metadata/**`
- `packages/shared/src/statics/work-item-status-metadata/**`
- `packages/shared/src/contracts/quest-status/**`, `packages/shared/src/contracts/work-item-status/**`
- `packages/shared/src/contracts/quest-status-metadata/**`, `packages/shared/src/contracts/work-item-status-metadata/**`
- `packages/shared/src/guards/**-quest-status/**`, `packages/shared/src/guards/**-work-item-status/**`
- `packages/shared/src/transformers/next-approval-quest-status/**`, `packages/shared/src/transformers/display-header-quest-status/**`
- `**/*.test.ts`, `**/*.integration.test.ts`, `**/*.spec.ts`
- `**/*.stub.ts`, `**/*.proxy.ts`
- `**/statics/*-prompt*/**` — agent prompt templates
- `**/orchestrator/src/statics/quest-status-transitions/**` — the transitions static has literal status keys (which is its purpose)

**Error message routing** — status literals that are unambiguous (belong to exactly one enum) emit a targeted suggestion. Ambiguous literals emit both suggestions.

**Rule tests** use RuleTester with fixture file paths inside `packages/eslint-plugin/src/fixtures/` that live inside the real tsconfig's include paths — not `/tmp`. This sidesteps the known `/tmp` lint-failure issue.

### 2. Pre-edit hook runs the rule

The syntactic rule has no file-system or type-program dependencies, so the pre-edit hook runs it cleanly. LLMs see the violation in the same turn they write it.

### 3. TypeScript compile-time lock on the metadata

`Record<QuestStatus, QuestStatusMetadata>` + `as const satisfies` — adding a status to the contract without a metadata row is a TS error at the statics file. Adding a field to the metadata contract without filling it for every row is a TS error.

### 4. Syntax-rules MCP surfacing

Extend `packages/mcp/src/statics/universal-syntax-rules/` with: "Never compare `.status` against string literals — use shared guards (`isActivelyExecutingQuestStatusGuard`, `isPathseekerRunningQuestStatusGuard`, etc.)." LLMs calling `get-syntax-rules` before editing see this.

### Regression smoke test

`packages/eslint-plugin` includes fixture files covering every banned pattern; the rule's unit tests assert each is flagged. If the rule is weakened or the allowlist widened, the tests fail.

### Regression grep target (for humans + verification steps)

`grep -r "\.status\s*===\s*'" packages/` outside the metadata/guards/transformer paths and outside tests/stubs/proxies and outside `plan/` + `info/` directories — expected result after Phase 8: zero hits for quest-status or work-item-status literals.

---

## Verification

- **Phase 1 bugs:**
  - Fix 1: unit — `recoverableQuestStatusesStatics` contents; guard-level `isRecoverableQuestStatusGuard({status: 'seek_synth'}) === true`.
  - Fix 3: unit — `startableQuestStatusesStatics` contents; unit — responder always writes `status: 'seek_scope'` when starting from `approved`.
  - Fix 6: unit — headers contain the new labels.
- **Phase 2 foundation:** consistency test (orchestrator) verifies every `questStatusContract.options` has a metadata row, every `workItemStatusContract.options` has one, metadata flags agree with legacy statics, and internal invariants hold (`isTerminal ⇒ !isActivelyExecuting`, `isAutoResumable ⇒ isActivelyExecuting`, `isPauseable ⇒ isAnyAgentRunning`, etc.).
- **Fix 2 (landed in Phase 4):** integration — recover a seek_plan quest missing its pathseeker work item, assert one is inserted; recover a `pending` quest missing a pathseeker item, assert one is NOT inserted.
- **Phases 5–7:** ward green; manual smoke of pause/resume during `seek_plan` (Fix 5 win); execution panel renders during `seek_*` and for terminal statuses (Fix 4 + renderer guard).
- **Phase 8 final regression:** grep target above; lint rule passes on the full tree.

---

## Locked Decisions

1. **`isActivelyExecutingQuestStatusGuard` is locked to exactly `{in_progress}`.** PURPOSE: "Returns true iff status is exactly `in_progress` — the quest is actively executing code changes (not planning, not paused)." Future broader predicates are new guards with new names; this one never broadens.
2. **Work-item-status in v1 scope.** Same abstraction, same enforcement.
3. **Metadata encodes post-fix semantics.** Bug fixes land first; the metadata in Phase 2 reflects the corrected definitions.
4. **Output writes keep literals.** `status: 'blocked'`, `status: 'seek_scope'`, `status: 'paused'` stay literal. The abstraction is for reads.
5. **Single-literal reads are intent-audited, not auto-kept.** `is-design-start-visible-guard` survived the audit because `approved` is a stable identity. Other single-literal `in_progress` sites were verified or deleted. No single-literal check is assumed safe without confirming pre-split vs post-split intent.
6. **ESLint rule lands in Phase 8, not Phase 2.** Landing it earlier would make every pre-existing violation a lint error, blocking intermediate PRs. The compile-time `Record<QuestStatus, …>` lock provides the Phase-2 enforcement; the lint rule provides the Phase-8+ enforcement.
7. **Consistency test lives in orchestrator**, not shared — shared cannot import orchestrator statics. Test is deleted in Phase 8 with the legacy statics.
8. **ESLint rule is syntactic, not type-aware.** No precedent for type-aware rules here; pre-edit hook incompatible with type-program lookups. Syntactic matching on known holder-object patterns (`quest.status`, `wi.status`, etc.) + literal allowlist covers real cases. Type-aware variant can be a future enhancement if drift returns.
9. **Guard bodies are three lines minimum** — optional-param undefined check + metadata read + return. The plan's earlier "one-line bodies" wording was inaccurate.
