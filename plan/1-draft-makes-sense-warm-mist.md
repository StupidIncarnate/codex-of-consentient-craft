# Pathseeker Pipeline Refactor — Slice-Authoritative Minions + Wave-Based Reconciliation + Single Verify Pass

## Progress

### Phase 1 — Schema (shared contracts)

- [x] Create new branded `slice-name` contract (+ stub + test)
- [x] Add `slice` + `instructions` fields to `dependency-step-contract.ts`
- [x] Add `observablesSatisfied` to `step-assertion-contract.ts`
- [x] Make `source` REQUIRED on `quest-contract-entry-contract.ts`
- [x] Add formal `slices[]` array to `planning-scope-classification`
- [x] Add `noveltyConcerns[]` to `planning-review-report` (+ new `novelty-concern` contract)
- [x] Update barrel exports in `packages/shared/contracts.ts`
- [x] Build shared workspace
- [x] Fix transitive consumer test failures (quest-modify-broker, quest-get-broker, case-catalog-to-blueprint,
  smoketest-blueprints-statics, enqueue-bundled stale-dist)

### Phase 2 — Validators (orchestrator transformers)

- [x] V1: NEW `quest-step-slice-prefix-mismatch` transformer
- [x] V2: NEW `quest-duplicate-step-focus-files` transformer
- [x] V3: MODIFY `quest-duplicate-contract-names` — embed source path in error
- [x] V4: NEW `quest-unresolved-step-contract-refs` transformer (case (a) + (c) only — (b) inventory adapter doesn't
  exist; pathseeker materializes shared contracts as `status:'existing'`)
- [x] V6: NEW `quest-assertion-banned-matchers` transformer
- [x] V7: NEW `quest-orphan-new-contracts` transformer
- [x] V8: NEW `quest-unsatisfied-observables` transformer
- [x] V9: NEW `quest-step-companion-file-mismatch` transformer
- [x] Register all validators in `quest-validate-spec-transformer` `'invariants'` scope

### Phase 3 — Allowlist

- [x] Add `'steps'` to `seek_synth` allowedFields in `quest-status-input-allowlist-statics`
- [~] Legacy-slice migration **REMOVED** per user direction — codebase is greenfield, no real legacy quests to migrate.
  Transformer + 3 broker call sites stripped; folder sidelined to `tmp/sidelined-quest-migrate-legacy-slice/`. Direct
  `questContract.parse(parsed)` is used at all 3 read sites.

### Phase 4 — Prompt Rewrites

- [x] Rewrite `pathseeker-prompt-statics.ts` (seek_scope/synth/walk/plan rewrites + behavioral-vs-editorial section)
- [x] Rewrite `pathseeker-surface-scope-minion-statics.ts` (output shape: steps + contracts, not reports)
- [x] Rename + rewrite `pathseeker-quest-review-minion-statics.ts` → `pathseeker-verify-minion-statics.ts` (consumers
  updated: agent-prompt-name contract, agent-name-to-prompt transformer, agent-prompt-flow integration test, mcp
  get-agent-prompt-input contract; prose updates in lawbringer-prompt, orchestrator CLAUDE.md, mcp folder-constraints
  docs)

### Phase 5 — Live LLM Roleplay Verification (current)

- [x] Automated ward green (full `npm run ward` exit 0 was clean BEFORE the post-orchestration tweaks below)
- [x] Backend E2E verification 24/24 PASS via `tmp/e2e-pathseeker-refactor.mjs` (caveat: that script was written against
  the OLD V7/V8 gating model — Test 17 / Test 23 will fail if re-run because V7/V8 moved into a new completeness scope;
  do not treat it as authoritative anymore)
- [ ] **Re-run `npm run ward`** — the post-orchestration changes (migration strip, banned-matchers consolidation, staged
  validators, slice filter param, prompt rewrites) have not yet been ward-verified end-to-end. User explicitly held ward
  during iteration. Run before live LLM session.
- [ ] **Live LLM quest run (USER ACTION)** — backend layer is verified at the contract/broker/transformer level;
  LLM-driven behaviors only observable in a real Claude CLI session.

---

## Catch-Up for a New Session

Everything between the original Phase 1–4 implementation and "now" was iterative tightening on prompts + small
structural changes. A new session must read this section before touching the prompts again.

### Migration removed (greenfield)

- `quest-migrate-legacy-slice` transformer + 3 broker call sites stripped.
- Folder sidelined to `tmp/sidelined-quest-migrate-legacy-slice/`.
- All 3 quest-load brokers now call `questContract.parse(parsed)` directly. Legacy quests on disk would fail to parse —
  the user moved/migrated them or accepts they're dead.

### Banned-matchers consolidated to shared

- Source of truth: `packages/shared/src/statics/banned-jest-matchers/banned-jest-matchers-statics.ts`.
- Exports `proseTokens` (the 7 tokens the orchestrator V6 validator scans for) and `eslintRestrictedMatchers` (the
  `Record<name, message>` shape the ESLint rule consumes).
- Old orchestrator-local copy sidelined to `tmp/sidelined-orchestrator-banned-jest-matchers/`.
- Consumers: `packages/orchestrator/src/transformers/quest-assertion-banned-matchers/...` (V6) and
  `packages/eslint-plugin/src/statics/jest-rule/jest-rule-statics.ts`.

### Staged validators (TWO TIERS, not one)

`quest-validate-spec-transformer.ts` now has TWO scopes the modify-quest broker invokes conditionally:

- **`'invariants'` (write-time, EVERY modify-quest call):**
    - V1 — Slice prefix on step IDs
    - V2 — Duplicate focusFile.path
    - V3 — Duplicate contract names (with source-path reconciliation hint)
    - V6 — Banned-matcher scan
    - V9 — Companion file completeness
- **`'completeness'` (only when modify-quest input transitions quest to `'in_progress'`):**
    - V4 — Step contract refs resolve
    - V7 — Orphan new contracts (every `status: 'new'` has a creating step)
    - V8 — Observables coverage (every observable claimed)

Wire-up: `quest-save-invariants-transformer` accepts `nextStatus?: QuestStatus`; `quest-modify-broker` passes
`validated.status` so completeness only fires at the seek_plan → in_progress transition. The `quest.steps.length > 0`
gate on V7/V8 is removed.

### `get-quest` MCP tool gained `slice?: SliceName[]` filter

- Optional array param; when set, broker filters `steps[]` to entries whose `step.slice` is in the array. Other fields (
  flows, contracts, planningNotes, tooling) returned as-is regardless.
- Contracts have no slice field by design, so contracts can't be filtered by slice — minion filters them client-side by
  name when needed.
- Stack: shared contract (`get-quest-input-contract`) → MCP wrapper (extends shared with `format`) → orchestrator
  broker (`quest-get-broker`).
- 6 contract tests + 7 broker tests added.
- **MCP server must be restarted after this change.** User restarted `2026-05-08`.

### Prompt rewrites (post-Phase-4)

Three prompts were tightened heavily after the original Phase 4 landed. If a new session is touching prompts, these are
the live invariants:

#### Pathseeker prompt (`pathseeker-prompt-statics.ts`)

- V1–V9 plan labels stripped from all validator references (use validator names like "Slice prefix on step IDs", not "
  V1").
- **Authority is unconditional at every status.** Earlier framing tied authority to seek_walk Wave 3 only; it now reads
  as "Pathseeker's authority over every step in every slice is unconditional and applies at every status (seek_synth,
  seek_walk, seek_plan)." The "wait for a minion to signal complete/failed before editing its slice" rule remains (
  concurrency, not authority).
- Resume Protocol steps 1–4 ALWAYS run regardless of status (load standards + spec + project-map + repo-root CLAUDE.md +
  planning notes). Steps 5–6 branch on status.
- Small scope still dispatches ONE minion. Multi-package slices supported (slice's `packages` array can have >1 entry).
- seek_walk Wave 3 includes a mandatory **CLAUDE.md compliance sweep**: pathseeker reads every package-level CLAUDE.md
  for every package any slice touches, walks every step, patches step SHAPE on rule violations. Does NOT add directive
  instructions that just cite a doc rule (codeweaver reads docs itself).
- seek_plan triage: pathseeker sanity-checks each criticalItem and warning (verify-minion may have lacked context).
  Confirm-and-fix vs misclassified-and-dismiss; promote-warning-to-critical / confirm-warning / dismiss. Triage counts
  go in signal-back summary.
- Save-Time Validators section split into Write-time / Completeness subsections matching the staged validator
  architecture.

#### Surface-scope minion (`pathseeker-surface-scope-minion-statics.ts`)

- Old `## Boundaries` + `## Do NOT` collapsed to one `## Constraints` section with three buckets: **Scope** / **Channel
  discipline** / **Validator-tripping mistakes**.
- New rule: **Don't redundantly cite docs.** Codeweaver reads CLAUDE.md / get-architecture / get-testing-patterns /
  get-syntax-rules itself. Reserve `instructions[]` for slice-specific decisions.
- New rule: **Read scope hygiene.** Every `get-quest` call must pass `stage: "spec"` or `"spec-obs"`. Loading
  `"planning"` or `"implementation"` without the `slice` filter pulls other minions' in-flight writes into context. The
  one exception is the post-commit verification (Step 10) which uses `stage: "planning", slice: ["{yourSliceName}"]` for
  server-side filtering.
- New Step 4: **Identify Observables and Draft Provisional Mapping.** Before file walks, the minion lists its assigned
  observables and emits a markdown table mapping each to a provisional step intent (focusFile vs focusAction,
  cross-slice `uses[]` candidates).
- New Step 10: **Verify Your Slice Landed.** Post-commit read-back via
  `get-quest({ stage: 'planning', slice: ['{yourSliceName}'] })` to confirm the write persisted as intended.
- `instructions[]` is **one directive per entry**, no prose paragraphs. Pseudo-code, imperative bullets, or structured
  shapes only.
- focusAction examples added (kind: verification / command / sweep-check / custom).
- Empty-slice guidance: commit `steps: []` + `contracts: []` and signal `complete` if research surfaces no work.
- Concurrent-write race callout: whichever minion commits first wins a contract name; the second gets the dedup
  failedCheck.
- Step 1 calls `get-quest({ stage: "spec" })` (no `steps[]` returned at all — server-side excludes by stage).

#### Verify-minion (`pathseeker-verify-minion-statics.ts`)

- New "What NOT to flag — doc redundancy rule" callout. Don't flag a step as missing a doc-citation instruction (
  codeweaver knows). DO flag instructions that redundantly cite docs as **warnings**.

### Test fixture for live roleplay

Existing dev quest at
`.dungeonmaster-dev/guilds/516c2cf2-1894-4455-ba8f-dc3e2afe8933/quests/3e98d4fc-849f-440a-8218-2e6b55afaf66/quest.json`
has been transformed to use slice-prefixed step IDs and `slice` fields. Status is `paused`.

Slice breakdown:

- `shared` × 3 — `shared-add-isdeleteblocked-statics`, `shared-create-isdeleteblocked-guard`,
  `shared-update-session-list-item-contract`
- `backend` × 1 — `backend-modify-quest-delete-responder`
- `frontend` × 7 — quest-delete-broker, mantine adapters, widgets, route, contract

Cross-slice `dependsOn` edges preserved (backend → shared, frontend → shared, frontend → frontend).

Sanity checks via the slice filter param:

```
get-quest({ questId: '3e98d4fc-...', stage: 'planning', slice: ['backend'] })   → 1 step
get-quest({ questId: '3e98d4fc-...', stage: 'planning', slice: ['shared'] })    → 3 steps
get-quest({ questId: '3e98d4fc-...', stage: 'planning', slice: ['frontend'] })  → 7 steps
get-quest({ questId: '3e98d4fc-...', stage: 'planning' })                       → 11 steps
```

### Live LLM roleplay — what to watch for

Backend layer is verified at the unit level. The behaviors below only manifest in a real Claude CLI session and need
eyes-on observation:

1. **Resume Protocol step 1–4 fires regardless of status** — pathseeker should batch standards + spec + project-map even
   when resuming into seek_walk, not just seek_scope.
2. **Surface-scope minions commit `steps[]` + `contracts[]` directly during seek_synth** — not `surfaceReports[]`.
3. **Each minion emits an observable-mapping markdown table inline before walking files** — visible in the chat output.
4. **Each minion calls `get-quest` with `stage: "spec"` for its initial read** — no other minions' steps in context.
5. **Each minion does post-commit verification with `slice` filter** — Step 10 of the minion prompt; visible as a
   follow-up `get-quest({ stage: 'planning', slice: ['name'] })` after the commit.
6. **Pathseeker runs 3 distinct waves during seek_walk**, each with its own `modify-quest` commit (semantic similarity →
   cross-slice DAG → corrective walk).
7. **CLAUDE.md compliance sweep happens in Wave 3** — pathseeker reads package-level CLAUDE.md files and patches step
   shape (NOT adding reminder instructions).
8. **Verify-minion runs exactly ONCE during seek_plan** — no retry loop.
9. **Pathseeker triages criticalItems / warnings** — confirms vs dismisses with reasons; signal-back summary reports
   counts.
10. **Pathseeker translates `noveltyConcerns[].recommendsExploratory: true` into concrete exploratory steps** wired into
    the DAG.
11. **Behavioral-vs-editorial split holds** — assertions are `expect(...)`-shaped, instructions are
    one-directive-per-entry pseudo-code/bullets, no prose paragraphs in instructions, no doc-citation noise.
12. **Completeness validators (V4 / V7 / V8) only fire at the seek_plan → in_progress transition**, not on any earlier
    modify-quest call.

### Known caveats / things a new session should NOT redo

- The `tmp/e2e-pathseeker-refactor.mjs` script tests the OLD validator gating model. Do not treat it as authoritative;
  do not "fix" the failures it would now show — the failures are because V7/V8 moved into the new completeness scope.
- `tmp/sidelined-quest-migrate-legacy-slice/` and `tmp/sidelined-orchestrator-banned-jest-matchers/` are intentionally
  sidelined; do not restore.
- `DependencyStepStub` default has `slice: 'backend'` but `id: 'create-login-api'` — slice-prefix-inconsistent. Tests
  using bare stubs through invariants must override `id` (e.g., `'backend-create-login-api'`). Future cleanup possible;
  not blocking.
- The plan file's original Phase 5 had a 5-item list of "needs manual user verification" — that list is superseded by
  the 12-item watch list above.

### Plan deviations (decisions made vs plan literal text)

> **V7 / V8 gated on `quest.steps.length > 0`** — Plan said "save-time invariants run on every modify-quest call." In
> practice, V7 (orphan new contracts) and V8 (unsatisfied observables) are step-relative checks that fire vacuously when
> no steps exist. Without gating, modifying contracts/observables during pre-step phases (chaoswhisperer flow/observable
> authoring) is impossible. Gating preserves the plan's intent (minion commits during seek_synth+ are validated) without
> breaking spec-phase mutations.

> **`DependencyStepStub` default has `slice: 'backend'` but `id: 'create-login-api'` — not slice-prefix-consistent.**
> The stub default would be rejected by V1 if persisted. Tests that need V1-passing stubs must override `id` (e.g.,
`'backend-create-login-api'`) or `slice`. This is acceptable for now; bare-stub tests that don't go through invariants
> are unaffected. Future cleanup could make the stub self-consistent.

---

## Context

The current pathseeker pipeline drifts in three structural ways, observed end-to-end on quest `3e98d4fc` (skull-icon
delete button):

1. **Information loss between minions and pathseeker.** Surface-scope minions emit markdown reports; pathseeker
   translates those reports into step JSON. The translation is a leap that loses fidelity — the minion is the only agent
   that has loaded the slice's package context, but the authoritative step output is generated by an agent (pathseeker)
   that doesn't have that context.

2. **Schema-shaped drift in the assertions array.** With only one prose field per step (`assertions`), every soft
   requirement (file shape, comment text, edit instructions, coverage justifications, design-decision tracing) ends up
   in assertion strings. Pathseeker faithfully follows its prompt's "every design decision is reflected in at least one
   assertion" rule and generates assertions like
   `{ input: "PURPOSE/USAGE metadata header", expected: "...4-sentence rationale paragraph..." }` — assertions that
   cannot compile to `expect(...)` predicates.

3. **Iterative review loop with non-deterministic severity classification.** The quest-review minion runs in a retry
   loop until `signal: clean` or `warnings`. The same plan content classified as warning on pass 1 became critical on
   pass 2 (LLM non-determinism in a fuzzy threshold). Four passes ran where two would have sufficed with better
   prompting and deterministic gates. ~50% of pathseeker's wallclock went to this loop.

The fix is to push step authoring DOWN to the slice authority (surface-scope minions), push verification UP to a single
semantic-judgment minion, run mechanical checks deterministically in the validator, and have pathseeker do its work in
focused waves rather than one mega-pass.

Outcome: pathseeker stops writing implementation prose; minions own their slice's step shape; the verify minion gets a
pre-cleaned plan and runs once; the planner pipeline runs faster with less drift.

---

## New Pipeline

```
seek_scope   → pathseeker classifies, defines slices, dispatches minions in parallel
seek_synth   → surface-scope minions commit steps[] + contracts[] DIRECTLY for their slice
                 (validator runs on every commit; minions fix their own validator failures)
seek_walk    → pathseeker runs 4 waves (dedup → semantic-similarity → DAG → walk)
seek_plan    → ONE verify-minion runs (pre-validated plan); pathseeker fixes any genuine
               issues raised; transitions to in_progress
```

### Phase responsibilities

| Phase      | Who                                   | What                                                                                                                                          |
|------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| seek_scope | pathseeker                            | Classify size; define formal slices (`{name, packages, flowIds}[]`); dispatch                                                                 |
| seek_synth | surface-scope minions (parallel)      | Per-slice: write steps[] + contracts[]; tag everything with `slice`                                                                           |
| seek_walk  | pathseeker                            | Wave 1: dedup (file/contract collisions). Wave 2: semantic-similarity promotions. Wave 3: cross-slice DAG. Wave 4: walk + structural patches. |
| seek_plan  | verify-minion (one pass) → pathseeker | Verify-minion checks semantic fit + flags novelty. Pathseeker fixes flagged issues, may add exploratory steps for novelty, transitions.       |

---

## Schema Changes

### 1. Add `slice` field to step contract

**File:** `packages/shared/src/contracts/dependency-step/dependency-step-contract.ts`

Add required `slice: SliceName` field (new branded string contract).

Step `id` regex stays kebab-case but the validator enforces the prefix at save time: every step's `id` must start with
`${slice}-` (e.g., `backend-create-isdeleteblocked-guard`). Schema-level regex stays liberal; the prefix check is a
save-time invariant tied to the `slice` field's actual value, not a regex pattern.

### 2. No `slice` field on contract entries

Contracts deduplicate by **name + source path**, not by slice tag. When two minions both try to declare a contract with
the same `name`, the validator rejects the second writer with the existing entry's `source` path embedded in the
failedCheck message. The second minion reconciles by either:

- Changing its own write to point at the existing contract's source (e.g., promoting to `packages/shared/...` if
  appropriate), or
- Removing its own write entirely and treating the contract as `status: 'existing'` it imports.

`source` field stays required (today it's optional in the schema; tighten to required during `seek_synth` so the dedup
error message can always cite a path). `source` field is what implicitly identifies ownership.

### 3. Add `instructions` field to step contract; add `observablesSatisfied` to assertion

**File:** `packages/shared/src/contracts/dependency-step/dependency-step-contract.ts`

Add optional `instructions: string[]` array of editorial directives. No length cap (per user's call). Used for:

- "Remove the conditional branch that renders skull when status is `in_progress`"
- "Update PURPOSE comment to mention the new guard logic in present tense"
- "Preserve the existing params/query validation block (lines 33–62) unchanged"
- Cross-step constraints ("this step depends on the cast at widget line 149 being removed by
  `step-update-session-list-item-contract`")

`assertions[]` becomes strictly behavioral by **prompt convention** (not validator-enforced) — every assertion should
compile to an `expect(...)` predicate. The minion and pathseeker prompts get explicit good/bad examples to teach the
boundary; the verify-minion can flag drift as `criticalItems`.

**File:** `packages/shared/src/contracts/step-assertion/step-assertion-contract.ts`

Add optional `observablesSatisfied: ObservableId[]` array on individual assertions. This is per the user's call —
observables can be claimed at either the step level OR at an individual assertion level, depending on whether the
satisfaction is whole-step (e.g., a removal step) or specific-assertion (e.g., the third VALID assertion is the one that
proves a particular observable). Validator V8 unions both sets when checking observable coverage.

### 4. Formalize `slices` on `scopeClassification`

**File:** `packages/shared/src/contracts/planning-scope-classification/`

Today `scopeClassification.slicing` is a prose string. Add a structured `slices: Slice[]` array:

```ts
type Slice = {
    name: SliceName;          // unique within quest
    packages: PackageName[];  // packages this slice owns
    flowIds: FlowNodeId[];    // flows this slice satisfies (may share across slices)
};
```

Pathseeker writes this during `seek_scope`. Minions reference their assigned slice name when committing steps.

### 5. Add `noveltyConcerns` to `reviewReport`

**File:** `packages/shared/src/contracts/planning-review-report/`

Add optional `noveltyConcerns: NoveltyConcern[]` array:

```ts
type NoveltyConcern = {
    area: 'tech' | 'testing' | 'pattern';
    description: string;     // "Step uses @mantine/notifications.show — first time wrapping a namespace method in this repo"
    recommendsExploratory: boolean;
};
```

Pathseeker reads this after the verify-minion runs. If any concern has `recommendsExploratory: true`, pathseeker
considers adding a `focusAction: { kind: 'custom', description: 'Spike: prototype X before committing to step Y' }` step
ahead of the dependent step in the DAG.

---

## Allowlist Changes

**File:** `packages/orchestrator/src/statics/quest-status-input-allowlist/quest-status-input-allowlist-statics.ts`

| Status       | Today                                                                         | After                                                                                                                                                                                        |
|--------------|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `seek_scope` | `allowedPlanningNotesFields: ['scopeClassification']`                         | unchanged (scopeClassification now includes the formal `slices[]` array)                                                                                                                     |
| `seek_synth` | `allowedFields: ['planningNotes', 'contracts', 'tooling', 'flows', 'status']` | **add `'steps'`**. Minions write steps directly during synth. `allowedPlanningNotesFields` stays `['surfaceReports', 'synthesis']` (kept for back-compat / pathseeker's own synthesis notes) |
| `seek_walk`  | unchanged                                                                     | unchanged. Pathseeker waves still write `walkFindings` here.                                                                                                                                 |
| `seek_plan`  | unchanged                                                                     | unchanged.                                                                                                                                                                                   |

The `surfaceReports[]` markdown-report path stays writable for back-compat during the rollout, but the new minion
prompts don't use it. Once we're confident the new flow is stable, remove `surfaceReports` from the allowlist and from
the `planningNotes` schema.

---

## Validator Additions

All run on every `modify-quest` call as save-time invariants. Plug into `questValidateSpecTransformer` `'invariants'`
scope.

### V1 — Slice prefix enforcement on step IDs

**Transformer:** `quest-step-slice-prefix-mismatch-transformer.ts`
**Check:** for every step, `step.id.startsWith(\`${step.slice}-\`)`. Offenders: list of `(stepId, slice)` pairs that
mismatch.

### V2 — Duplicate `focusFile.path` across steps

**Transformer:** `quest-duplicate-step-focus-files-transformer.ts`
**Check:** group steps by `focusFile.path`; offenders are paths claimed by ≥2 steps. Catches the case where two slices
both create the same file (must be promoted to shared / single-owner).

### V3 — Contract name uniqueness with source-path reconciliation hint

**Transformer:** extend existing `quest-duplicate-contract-names-transformer.ts`
**Check:** today this runs at quest level. After: same logic, but error message embeds the EXISTING entry's `source`
path so the minion that triggered the conflict can self-resolve. Failed-check shape: `"Contract \`
MantineNotificationId\` already declared with source \`packages/web/src/contracts/...\`. Either remove your write,
change source to a shared path, or rename your contract."` This is the dedup mechanism — minions resolve at write time;
pathseeker doesn't have to dedup later.

### V4 — Step `outputContracts`/`inputContracts` references must resolve

**Transformer:** `quest-unresolved-step-contract-refs-transformer.ts`
**Check:** every non-`Void` entry in any `step.inputContracts` and `step.outputContracts` must either (a) appear in
`quest.contracts[].name`, or (b) resolve via shared-package contract inventory, or (c) be marked `Void` (allowed for
statics/contracts/startup folder types only — already enforced elsewhere).
Skips inventory lookup when the build cache shows the package hasn't changed; otherwise re-resolves.

### V5 — DROPPED

Originally proposed regex-scan over assertion `input`/`expected` to reject non-behavioral text. Too variable to validate
deterministically — minions write in many phrasings and a regex either misses real violations or flags legitimate
behavioral assertions. Instead: strengthen the surface-scope minion and pathseeker prompts with **explicit good/bad
examples** of behavioral-only TDD assertions. The prose channel for editorial/structural content is the new
`instructions[]` field, and the prompt teaches the boundary by demonstration, not by validator. (Verify-minion can still
flag assertions that look non-behavioral as a `criticalItems` entry — that's LLM judgment, which is what the
verify-minion is for.)

### V6 — Banned-matcher scan

**Transformer:** `quest-assertion-banned-matchers-transformer.ts`
**Check:** scan every assertion's `input` and `expected` for `.toContain(`, `.toMatchObject(`, `.toEqual(` (where
`toStrictEqual` is required), `.toHaveProperty(`, `.includes(...).toBe(`, `expect.any(`, `expect.objectContaining(`.
Source of truth: testing-patterns banned list.

### V7 — Every "new" contract has a creating step

**Transformer:** `quest-orphan-new-contracts-transformer.ts`
**Check:** for every `quest.contracts[i]` with `status: 'new'`, at least one step must list its `name` in
`outputContracts`. Generalizes the existing "Contract Node Anchoring" check one level deeper.

### V8 — `observablesSatisfied` mechanical array audit (step OR assertion level)

**Transformer:** `quest-unsatisfied-observables-transformer.ts`
**Check:** every observable in the flow must be claimed by at least one step OR at least one assertion. Set:
`flatten(quest.flows[].nodes[].observables[].id)`. Coverage:
`flatten(quest.steps[].observablesSatisfied) ∪ flatten(quest.steps[].assertions[].observablesSatisfied)`. The first set
must be a subset of the second. Pure set diff. Caught Pass 4's missing observables on quest 3e98d4fc.

### V9 — Companion file completeness by folder type

**Transformer:** `quest-step-companion-file-mismatch-transformer.ts`
**Check:** infer folder type from `step.focusFile.path`, look up `folderConfigStatics[folderType]`, verify required
companion files (`.proxy.ts` for adapters/brokers/responders/widgets/bindings/state/middleware; `.stub.ts` for
contracts) appear in `step.accompanyingFiles`. Skip for `focusAction` steps.

---

## Prompt Rewrites

### Prompt example boundary — behavioral vs editorial

Both the surface-scope minion prompt and the pathseeker prompt get a new "Assertions vs Instructions" section with
concrete good/bad examples. This replaces the dropped V5 validator. Examples:

```
GOOD assertion (behavioral, compiles to expect()):
  { prefix: "VALID",
    input: "{ status: 'in_progress' }",
    expected: "returns true" }

GOOD assertion (negative behavioral):
  { prefix: "VALID",
    input: "session row with questStatus='in_progress'",
    expected: "no SESSION_ROW_DELETE_SKULL element present within that row's container" }

BAD assertion (editorial — move to instructions[]):
  { prefix: "VALID",
    input: "PURPOSE/USAGE metadata header",
    expected: "header present and present-tense. PURPOSE line reads exactly: '...'" }
  → Should be: instructions: ["Update PURPOSE/USAGE header to describe the new guard logic in present tense"]

BAD assertion (code prescription — move to instructions[]):
  { prefix: "VALID",
    input: "QUEST_DELETE_REJECTED_ERROR constant after modification",
    expected: "value equals exactly 'Quest is currently running. Pause or abandon the quest first.'" }
  → Should be: instructions: ["Replace QUEST_DELETE_REJECTED_ERROR constant with 'Quest is currently running...'"]
    PLUS keep a behavioral assertion that exercises the constant via the responder return value.

BAD assertion (file-shape prescription):
  { prefix: "VALID",
    input: "imports added to widget file",
    expected: "Popover, LoadingOverlay, Portal, Box from '@mantine/core'..." }
  → Should be: instructions: ["Add imports: Popover, LoadingOverlay, Portal, Box from @mantine/core"]
```

The boundary: **if it can be turned into `it('...', () => { expect(...).toBe(...) })`, it's an assertion. If it's a
directive about file shape, comment text, removals, imports, or cross-step constraints, it's an instruction.** The
verify-minion's prompt also gets this same section so it knows what drift to flag as `criticalItems`.

### Pathseeker prompt (`pathseeker-prompt-statics.ts`)

**`seek_scope` section:**

- Output now includes formal `slices[]` (not just prose `slicing` string).
- Dispatch instructions reference the new minion contract (commit steps directly, not reports).

**`seek_synth` section:**

- Drop the synthesis instructions (minions own this now).
- Pathseeker's job in seek_synth is just: wait for all dispatched minions to signal `complete`, then transition to
  `seek_walk`.
- If any minion fails, decide whether to retry that slice or fold it into pathseeker's own seek_walk work.

**`seek_walk` section — rewrite as three explicit waves:**

```
Wave 1 — Semantic similarity. Walk every contract pair across slices.
         Ask: are there two contracts with different names but
         conceptually the same shape (e.g., NotificationToast vs Notice)?
         If yes, merge them — pick the better name, rewrite all
         consumers' inputContracts/outputContracts, set source to a
         shared path. This is LLM judgment — exact name dedup is
         already handled by the validator at minion-write time, so
         this wave focuses on near-duplicates the validator misses.

Wave 2 — Cross-slice DAG. Walk every step's uses[] and inputContracts.
         For each external reference, ensure dependsOn includes a step
         in another slice that produces that symbol. This is where the
         frontend-depends-on-backend wiring happens. Validator V4
         catches unresolved refs; pathseeker wires the ordering.

Wave 3 — Walk. Read every focusFile target in full. For each modify
         step, confirm the structural insertion point exists. For each
         create step, confirm the folder type and sibling pattern.
         Patch step assertions/instructions in place. Add steps the
         minions missed. Update contract source paths to the verified
         actual paths.
```

Mechanical name-dedup that was previously a "Wave 1" is now handled by the validator itself at minion write time (V3
above). Pathseeker's first wave is the LLM-judgment work the validator can't do.

Each wave commits via `modify-quest` independently. Validator runs after each wave.

**`seek_plan` section:**

- Spawn ONE verify-minion (formerly quest-review minion).
- Read its `reviewReport`.
- For `criticalItems`, fix in place. NO second verify-minion pass — strictly one wave. The validator re-runs
  deterministically on each fix, which is sufficient.
- For `warnings`, log and proceed.
- For each `noveltyConcerns[i]` with `recommendsExploratory: true`:
    1. Pathseeker spawns research agents (subagent_type: "Explore") to investigate the novel tech/testing pattern. This
       is an LLM research step — pathseeker uses the agent's findings to inform the plan.
    2. Pathseeker translates the research into one or more concrete coding steps with proper schema (focusFile or
       focusAction:verification for e2e exploration), wires them into the DAG via dependsOn so consumer steps depend on
       them, and commits via modify-quest. These steps look like normal codeweaver steps — they aren't placeholder "
       spike" markers.
    3. The exploratory steps may be e2e exploratory (focusAction with kind: 'verification', running an actual experiment
       script) or implementation prototype steps (focusFile in a sandbox path). Pathseeker decides shape based on what
       kind of unknown the novelty is.
- Transition to `in_progress` and signal back. Codeweaver dispatch happens automatically via the existing orchestration
  loop — there is no human audit gate between pathseeker's signal back and codeweaver's first work item firing.

### Surface-scope minion prompt (`pathseeker-surface-scope-minion-statics.ts`)

Rewrite from "produce a markdown report" to "commit steps[] + contracts[] for your slice." New deliverable spec:

```
For your assigned slice {name}, commit via modify-quest:

steps: array of step objects, each with:
  - id: prefixed with "${name}-" (e.g., "backend-create-isdeleteblocked-guard")
  - slice: "${name}"
  - all required step fields per the schema
  - dependsOn: only step IDs WITHIN your slice (cross-slice deps are pathseeker's job)
  - assertions: behavioral predicates ONLY (must compile to expect(...))
  - instructions: editorial directives (removals, comment updates, file-shape preservation,
    cross-step constraints) — uncapped length, prose form

contracts: array of contract entries owned by your slice, each with:
  - source: REQUIRED, the file path where this contract lives or will be created.
    Pathseeker walks and confirms in seek_walk; minion supplies its best-known path.
  - status: 'new' | 'existing' | 'modified' (per current schema)

If your modify-quest call comes back with a duplicate-contract failedCheck:
  The error includes the EXISTING entry's source path. Choose ONE of:
    a) Remove your contract write (use the existing one as-is).
    b) Change your contract's source to point at the existing one's source
       (no-op for the contract; just signals you're consuming it).
    c) Promote: change BOTH writes to a shared source path
       (e.g., 'packages/shared/src/contracts/...'). Coordinate with the
       other slice's minion via the conflict — usually the cleaner write
       wins and the other minion drops its write.

Do NOT:
  - Write markdown reports to surfaceReports[]
  - Set dependsOn across slices
  - Write your slice's outputs into other slices' steps
```

The minion's per-CLAUDE.md / sibling-pattern / discover work stays. The output shape is what changes.

### Quest review minion → renamed to verify-minion (`pathseeker-quest-review-minion-statics.ts` →
`pathseeker-verify-minion-statics.ts`)

Rewrite around the assumption that the validator has already cleared the deterministic checks. Minion's job:

```
1. Load quest at stage: 'implementation' (steps + contracts).
2. Walk every step. For each step's observablesSatisfied entries, read
   the corresponding observable. Ask: do the step's assertions/
   instructions actually satisfy the observable's intent?
3. Walk cross-slice dependencies. Does each step's uses[] reference
   something a dependsOn step actually creates?
4. Sibling-pattern fit: spot-check a sample of steps against existing
   siblings. Did the slice pick the right pattern?
5. Novelty scan: identify uses[] / contracts referencing tech or testing
   patterns not seen elsewhere in the codebase. Surface these as
   noveltyConcerns with recommendsExploratory set per judgment.
6. Write reviewReport with: criticalItems (must-fix), warnings (should-
   fix), info (FYI), noveltyConcerns. Signal back ONCE.
```

The minion runs ONE pass. No retry loop. If pathseeker raises criticals after the verify-minion runs, pathseeker fixes
them in place — the validator re-runs deterministically on each fix, which is sufficient. There is no second LLM
verification pass.

### Pathseeker pipeline statics (`pathseeker-pipeline-statics.ts`)

`maxAttempts: 3` stays for pathseeker itself. No new retry counter for verify-minion (the prompt enforces single-pass).

---

## Files to Modify

### Schema (Zod contracts in shared)

- `packages/shared/src/contracts/dependency-step/dependency-step-contract.ts` — add `slice`, add `instructions`
- `packages/shared/src/contracts/quest-contract-entry/quest-contract-entry-contract.ts` — make `source` REQUIRED during
  seek_synth (so dedup error messages can always cite a path). NO slice field on contracts.
- `packages/shared/src/contracts/planning-scope-classification/` — add `slices[]` (formal slice registry)
- `packages/shared/src/contracts/planning-review-report/` — add `noveltyConcerns[]`
- `packages/shared/src/contracts/slice-name/` — NEW, branded string for slice names

### Validators (orchestrator transformers)

- NEW: `packages/orchestrator/src/transformers/quest-step-slice-prefix-mismatch/` (V1)
- NEW: `packages/orchestrator/src/transformers/quest-duplicate-step-focus-files/` (V2)
- NEW: `packages/orchestrator/src/transformers/quest-unresolved-step-contract-refs/` (V4)
- NEW: `packages/orchestrator/src/transformers/quest-assertion-banned-matchers/` (V6)
- NEW: `packages/orchestrator/src/transformers/quest-orphan-new-contracts/` (V7)
- NEW: `packages/orchestrator/src/transformers/quest-unsatisfied-observables/` (V8)
- NEW: `packages/orchestrator/src/transformers/quest-step-companion-file-mismatch/` (V9)
- MODIFY: `packages/orchestrator/src/transformers/quest-duplicate-contract-names/` — extend with source-path
  reconciliation hint (V3)
- MODIFY: `packages/orchestrator/src/transformers/quest-validate-spec/quest-validate-spec-transformer.ts` — register new
  validators in `'invariants'` scope

V5 (assertion non-behavioral text scan) is intentionally NOT implemented as a validator — handled via prompt examples +
verify-minion judgment instead.

### Allowlist

- `packages/orchestrator/src/statics/quest-status-input-allowlist/quest-status-input-allowlist-statics.ts` — add
  `'steps'` to `seek_synth` allowedFields

### Prompts

- `packages/orchestrator/src/statics/pathseeker-prompt/pathseeker-prompt-statics.ts` — major rewrite
- `packages/orchestrator/src/statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics.ts` — major
  rewrite (output shape change)
- RENAME + rewrite:
  `packages/orchestrator/src/statics/pathseeker-quest-review-minion/pathseeker-quest-review-minion-statics.ts` →
  `pathseeker-verify-minion-statics.ts`

### Barrel exports + tests

- `packages/shared/contracts.ts` — export new contracts
- All new validators get `.test.ts` siblings (the project's lint rule requires colocation)

### Build/integration

- After shared schema changes: `npm run build --workspace=@dungeonmaster/shared`
- Existing quest fixtures may have `surfaceReports[]` content — leave them; the allowlist/schema keeps `surfaceReports`
  writable for back-compat. Slice-prefix enforcement on existing fixtures: write a one-time migration that adds
  `slice: 'legacy'` to any pre-existing step/contract without one.

---

## Verification

Manual smoke path:

1. Build: `npm run build`
2. Run a small fresh quest end-to-end. Use a 2-slice quest (frontend + backend) similar in shape to quest 3e98d4fc.
3. Watch the pipeline:
    - During `seek_synth`, both surface-scope minions should `modify-quest` with `steps` and `contracts` (NOT with
      `surfaceReports`).
    - Validator should reject any step whose ID doesn't match the slice prefix.
    - Validator should reject any assertion with banned-matcher strings.
    - During `seek_walk`, pathseeker should commit work in 4 distinct `modify-quest` calls (one per wave).
    - Verify-minion should run exactly ONCE during `seek_plan`.
4. Check the resulting `quest.json`:
    - Every step has `slice` set.
    - Every step ID starts with `${slice}-`.
    - `assertions[]` contains only behavioral predicates (`expect(...)`-shaped).
    - `instructions[]` contains the prose directives (removals, comment updates, etc.).
    - `noveltyConcerns[]` may have entries; verify exploratory steps were added where flagged.

Automated:

- New validator transformers each get a `.test.ts` with VALID and INVALID cases.
- Existing pathseeker integration tests in `packages/orchestrator/test/harnesses/orchestration-quest/` need updates to
  reflect the new minion output shape and the wave count.
- `npm run ward` must be green before merge.

Regression watch:

- The `_delete: true` path is uniform across entities (per `questArrayUpsertTransformer`) — pathseeker uses it for
  promote-to-shared moves in Wave 1. Confirm no regression in deletion semantics.
- The per-quest lock in `withQuestModifyLockLayerBroker` already serializes parallel minion writes — this refactor does
  NOT introduce new concurrency risk.
- Back-compat: any in-flight quest using the old `surfaceReports[]` path keeps working until manually drained. The new
  flow is opt-in per fresh quest dispatch via the new minion prompts.

---

## What This Does NOT Change

- Chaos's responsibilities. Chaos still owns flows, observables, design decisions, contract names. (A separate cleanup
  pass on chaos is needed — chaos drift was identified but is out of scope here. See related quest if filed.)
- The status state machine names (`seek_scope` / `seek_synth` / `seek_walk` / `seek_plan`). Only what each phase
  contains changes.
- Codeweaver, ward, lawbringer, siegemaster, spiritmender. None of those agents see schema changes — `slice` and
  `instructions` are additive on the step contract; assertions array meaning is tightened (no additions, just
  behavioral-only enforcement) which means existing codeweaver consumers see fewer non-behavioral assertions and
  existing instructions consumers will receive prose that used to be jammed into assertions.
- The orchestration loop, work-item dispatch, signal-back semantics, or per-quest locking.
