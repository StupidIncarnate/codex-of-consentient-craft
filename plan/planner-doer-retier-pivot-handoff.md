# Handoff: Re-tiering the Planner/Doer split (PathSeeker → Codeweaver → helpers)

**Status:** Implemented across 5 workstreams. `lint` + `typecheck` + `unit` + `integration`
green across all 13 packages. **e2e NOT yet run.** Nothing committed. Branch: `delete-quest-ui`.

This doc is the pickup point for the next session. It captures the *why*, the *what*, the
grounded code facts, and the open tweaks.

---

## 1. How we got here (the motivating defect)

The pivot was triggered by one real quest:
`.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/ea97db12-b8df-44bb-a8dd-4e0a3955871e`
("Delete Quest Button on Root Page"). Two structural faults surfaced:

**Fault 1 — PathSeeker over-reached into mechanics it can't verify.**
The `web-update-guild-session-list-widget` step carried an `instructions[]` line:
*"Add a local `useState` named `confirmingQuestId`."* That contradicted (a) the design decisions
`prevent-duplicate-delete` ("Banish disabled between click and server response") and
`popover-close-on-error` ("popover closes on failure") — both of which require the **parent**
(which owns the async DELETE) to own the state — and (b) the sibling `home-content` step, which
said the parent owns popover-close. Codeweaver silently re-derived the correct architecture:
it **lifted `confirmingQuestId` to the parent** as a controlled prop (`confirmingQuestId` +
`onConfirmingQuestIdChange`) and closes the popover on the async result. Correct outcome, but
**off the record** — codeweaver never flagged the deviation, and `pathseeker-walk` never caught the
contradiction.

The chain of custody of the failure:
1. ChaosWhisperer captured the lifecycle rules as **design decisions** (advisory prose).
2. They were **never embedded as observables**, so they never entered the enforced channel.
3. PathSeeker-surface, with no observable to anchor them, expressed them as a **mechanic
   instruction** (`useState`) and split ownership inconsistently across two steps.
4. **No assertion → nothing enforced → codeweaver was free.** It happened to lift the state
   correctly, but by reasoning, not because a test forced it.

**Fault 2 — novelty/test-difficulty eats a session's context budget.**
The Mantine `Popover` was novel in `web`; codeweaver burned most of a ~290k-token session
discovering the jsdom test recipe (`withinPortal={false}` + `transitionProps={{duration:0}}`)
*inline*, alongside 3 other steps. The novelty was *detected* (walkFindings noted it) but never
*isolated* into its own work unit.

**Root cause of both:** the planner plans **below its epistemic reach** (prescribes mechanics it
reads-but-can't-run), and there's **no doer-side mechanism to quarantine the unanticipated.**

---

## 2. Why the model is shaped the way it is (orchestrator background)

- The orchestrator does **not** spawn agents. The MCP server is a **state machine**
  (`quest.workItems[]` + `get-next-step`); the user's own Claude session is a **brainless dispatch
  loop** (`/dumpster-launch`). Sequencing lives in `dependsOn` edges, not code.
- **Planner layer = PathSeeker, a 4-stage pipeline:** `pathseeker-surface ×N` (per package) →
  `pathseeker-dedup` + `pathseeker-assertion-correctness` → `pathseeker-walk`. Prompts are statics
  in `packages/orchestrator/src/statics/*-prompt-statics.ts`, served via the `get-agent-prompt` MCP
  tool. Full reference: `docs/quest-role-paths.md` + `packages/orchestrator/CLAUDE.md`.
- **Historical pivot that matters:** PathSeeker *used* to be ONE headless agent (`pathseeker-prompt`,
  deleted in commit `99fbf998` "pivot orchestration to /dumpster-launch monitor session model").
  It walked `seek_scope → seek_synth → seek_walk` and **spawned its minions as sub-agents**, then
  synthesized across them (Wave B + the walk) as one continuous mind. The headless-off pivot
  **flattened** that into independent work items. `pathseeker-walk` inherited the reconciliation
  *job* but reads committed state **cold** — it never watched the minions work. That flattening is
  the structural origin of the cross-step gaps.

### The three laws the redesign honors
1. **Conservation of synthesis** — every fan-out point needs a parent that holds the seam and
   reconciles. Codeweaver delegating implementation makes Codeweaver that parent.
2. **Risk-adaptive depth** — plan deep at *seams* (package interface, novelty, must-hold
   constraint), shallow everywhere there's sibling precedent ("mirror X, stop").
3. **Context tax** — every sub-agent re-reads standards; decompose only when work saved beats
   (standards tax + a coordination hop). The synthesizing parent pre-digests standards for helpers.

### The organizing principle
**PathSeeker plans only to its epistemic reach** — facts it can *verify from structure* (the seam
graph: file nodes + typed contract/prop/selector edges → ordering) or *record from reading*
(examples + rationale) — plus the must-hold constraints **as assertions**. It is forbidden from the
intra-file **logic-to-logic diff**, which belongs to the doer (the only actor that runs the file and
proves choices with tests). Build order is a *data/symbol DAG*, already auto-wired from
`uses[]`/`outputContracts`; mechanics contribute nothing to it.

### Novelty: a predictability split
- **Visible at plan time** (inventory shows Popover novel) → PathSeeker isolates it as a dedicated
  prototype step; downstream mirrors it.
- **Discovered at run time** (jsdom recipe) → Codeweaver quarantines it to a helper that returns a
  distilled artifact. *The rabbit-hole defense lives at the doer (delegation), not in a tighter
  plan* — you cannot plan your way out of the unanticipated.

---

## 3. What was implemented (5 workstreams)

### A — PathSeeker boundary (forbid mechanics, promote constraints to assertions)
Files: `packages/orchestrator/src/statics/pathseeker-surface/pathseeker-surface-statics.ts`,
`.../pathseeker-walk/pathseeker-walk-statics.ts` (+ their `.test.ts`).
- New channel-discipline rule: `instructions[]` may carry removals/imports/sibling citations/
  cross-step constraints/novelty flags but **NOT intra-file logic mechanics**.
- **Constraint-promotion rule** + worked `confirmingQuestId` counter-example in Step 8: a design
  decision constraining runtime state across >1 step (disabled-in-flight / closes-on-result /
  single-open) must become an **assertion**, not a mechanic.
- **Shared-state lifecycle reconciliation** check: added to surface Step 9 self-review AND as
  `pathseeker-walk` Step 2's new **fifth** check ("(e)") — derive the owner from the constraints,
  verify every step agrees. This is the precise check the delete-quest defect fell through.
- Read-through residue (mirror X / prefer X over Y because Z) explicitly routed to Codeweaver.

### B — Visible-novelty isolation + risk-aware chunking
Files: `pathseeker-walk-statics.ts`; `packages/shared/src/contracts/dependency-step/
dependency-step-contract.ts` (new optional `isolate` field);
`packages/orchestrator/src/transformers/steps-to-batch-chunks/steps-to-batch-chunks-transformer.ts`
(+ test).
- Walk now **mandates** an isolated prototype step for "no sibling precedent **OR** known
  test-difficulty"; downstream steps `dependsOn` it and instruct "mirror the prototype".
- New optional `isolate?: boolean` on `DependencyStep` (optional-no-default = zero blast radius on
  existing step literals). The chunker gives an `isolate` step its own chunk.

### C — Codeweaver: tactical-plan gate + delegation protocol + self-review/pivot
Files: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`,
`.../agent-operating-rules/agent-operating-rules-statics.ts` (+ their `.test.ts`).
- New **Gate 4: Tactical Plan & Delegation** (gates renumbered 4→5…7→8). Codeweaver writes the
  logic-to-logic plan against the real files and **commits delegation decisions up front**
  (the model won't self-interrupt 100 turns deep), persisting to `planningNotes.codeweaverPlans`.
- **Helper Delegation Protocol**: a helper is a raw `Agent` sub-agent Codeweaver fully briefs —
  narrow task, a **pre-digested standards subset** (no `get-agent-prompt`/`signal-back`), returns a
  **distilled artifact** (working file + usage examples). Review against the quest; pivot if it
  struggles. Conservation guard: delegate for **isolation**, not to parallelize the slice.
- Operating Rule **4**: the `Agent` tool is synchronous — awaiting a helper does NOT violate Rule 2
  (no-background-wait).

### D — Living execution-plan artifact (+ cold-read fix)
Files: new `packages/shared/src/contracts/planning-codeweaver-plan/` (contract + `.stub.ts` +
`.test.ts`); `packages/shared/src/contracts/quest/quest-contract.ts`
(`planningNotes.codeweaverPlans[]`); `packages/shared/contracts.ts` (barrel);
`packages/orchestrator/src/statics/quest-status-input-allowlist/quest-status-input-allowlist-statics.ts`
(`in_progress.allowedPlanningNotesFields += 'codeweaverPlans'` + the `QuestStatusPlanningNotesField`
union); comment in `.../quest-input-forbidden-fields/quest-input-forbidden-fields-transformer.ts`.
- Shape: `{ id (= codeweaver workItemId), sliceName, logicPlan[], delegations[{pattern, status:
  pending|returned|pivoted, exampleArtifact?, outcome?}], rationale[], updatedAt }`. Id-keyed so
  Codeweaver + helpers patch the same entry; a respawned Codeweaver reads it instead of
  reconstructing from the diff (the cold-read fix).
- **Blast radius handled:** the defaulted-array field means every parsed `planningNotes` output now
  carries `codeweaverPlans: []`. ~23 literals/`toStrictEqual` expectations across
  shared/orchestrator/mcp/testing were updated (fanned out to sonnet agents).

### E — Two-level sub-agent correlation (wire-level only — see open items)
Files: `packages/orchestrator/src/brokers/chat/history-replay/chat-history-replay-broker.ts`
(+ test).
- **Key finding:** the processor's reverse-map (`chat-line-process-transformer.ts`) is already
  **source-agnostic** and shared across all tails, so the **live** path already correlates a helper
  spawned by codeweaver. The real gap was the **replay pre-scan** (PASS 1a/1b), which only walked
  the main session — a helper's completion `tool_result` lives in *codeweaver's* sub-agent JSONL.
  Fix: extended both passes to walk sub-agent files too (`allScanLines`). New 2-level regression
  test in the broker test proves the helper resolves to the helper's toolUseId on replay; existing
  1-level convergence tests stay green.

---

## 4. Verification status (be honest with the user here)

- `npm run build` — green.
- `npm run ward -- --only lint,typecheck,unit,integration` — **PASS, 13 packages, 0 failures**
  (lint 6346 files, typecheck 6328, unit 2252, integration 94).
- **e2e — NOT run.** (A prior session framing of "e2e is heavy" was a rationalization to skip it;
  it is not justified. Run `npm run ward -- --only e2e` as part of final verification.)
- **Nothing committed.**

---

## 5. Open items / tweaks for the next session

1. **Run e2e** (`npm run ward -- --only e2e`) and fix anything red. Then a full `npm run ward`.
2. **E — visual nesting (deferred, contained).** Helpers are now correctly correlated and render as
   their own **labeled, collapsible chain** (observable, not orphaned), but NOT visually *nested*
   under codeweaver. True chain-within-chain rendering needs a recursive rewrite of the
   load-bearing web transformer `collect-subagent-chains-transformer.ts` + the `ChatEntryGroup` /
   `SubagentChainGroup` contract (`innerGroups` would need to allow nested chain groups, not just
   `SingleGroup[]`) + `subagent-chain-widget`. Deliberately not landed unverified-in-browser.
   Decide whether the sibling-chain rendering is acceptable or do the recursive nesting.
3. **F — model tiers (review).** Codeweaver now does tactical planning + synthesis + review. Decide
   whether to bump `codeweaver` from `sonnet` → `opus`. TWO sources of truth must stay in sync:
   `packages/orchestrator/src/statics/role-to-model/role-to-model-statics.ts` AND the hardcoded
   switch in `.../transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts`.
4. **Standards subset (deferred by design).** `get-architecture`/`get-syntax-rules`/
   `get-testing-patterns` return everything (not parameterizable); only `get-folder-detail`/
   `get-project-map`/`get-project-inventory` are scoped. Current approach: Codeweaver pre-digests a
   subset into the helper's prompt (no new MCP plumbing). If you want first-class scoping, add
   folder-type/role params to those three brokers (`packages/mcp/.../architecture/...`).
5. **The real proof.** Run a live `/dumpster-create` → `/dumpster-launch` on a Popover-like
   multi-package feature and confirm: (a) PathSeeker emits the lifecycle constraint as an assertion
   + an isolated prototype step for the novel control; (b) the novel step lands in its own
   codeweaver chunk; (c) Codeweaver writes a tactical plan to `codeweaverPlans`, delegates a
   discovered-novelty piece, and the helper renders as a chain in the quest UI; (d) the living plan
   is readable on the quest. Smoketest verdict is **UI-driven** (repo policy).

---

## 6. Grounded code facts (so the next LLM doesn't re-derive)

- **Quest model:** `planningNotes` = {scopeClassification, surfaceReports[], blightReports[],
  codeweaverPlans[], synthesis, walkFindings} in
  `packages/shared/src/contracts/quest/quest-contract.ts`.
- **Allowlist:** `in_progress` permits top-level `steps, contracts, toolingRequirements, flows,
  status` and planningNotes sub-fields `blightReports, walkFindings, codeweaverPlans`. The carveout
  logic is generic (`quest-input-forbidden-fields-transformer.ts`): adding a sub-field to
  `allowedPlanningNotesFields` is sufficient because `in_progress.blightReportsRule === 'full'`.
- **Array upsert:** `quest-array-upsert-transformer.ts` — by `id`, partial-patch, `{id,_delete:true}`.
  MCP strips `workItems, wardResults, designPort, pausedAtStatus`; any Task sub-agent can call
  `modify-quest`.
- **Chunking:** `steps-to-batch-chunks-transformer.ts` groups by folder-type + caps at
  `defaultMaxStepsPerChunkStatics.value` (`@dungeonmaster/shared/statics`). New `isolate` carve-out
  at the top of the loop.
- **Sub-agent correlation:** `chat-line-process-transformer.ts` keeps `agentIdMap` (toolUseId→
  realAgentId) + `reverseAgentIdMap`, populated source-agnostically from any `user` line's
  `toolUseResult.agentId`. The handle broker shares ONE processor per session across all tails.
  `chat-history-replay-broker.ts` PASS 1a/1b are the replay pre-scan (now over `allScanLines`).
  Web chain-grouping: `packages/web/src/transformers/collect-subagent-chains/` +
  `index-subagent-entries/`, keyed by the Task's wire-level `agentId` (= toolUseId).
- **Prompt statics tests** assert section/needle presence (and walk asserts `Wave A`/`Wave B`/
  `### Status: seek_*` are ABSENT — don't reintroduce those tokens). Statics get colocated `.test.ts`
  (`@dungeonmaster/enforce-implementation-colocation`).
- **Test-file lint gotchas (hit during this work):** test files may NOT import non-stub contracts
  from `@dungeonmaster/shared/contracts`; no conditionals (`&&`/ternary) in tests; no raw `string`
  type annotations (use `PropertyKey`); no `.toBeDefined()` (use explicit `.toBe`/`.toStrictEqual`).

---

## 7. Source plan + related artifacts

- The approved plan lives at `~/.claude/plans/couple-callouts-if-an-nifty-walrus.md` (the same
  workstream breakdown, with the D1/D2/D3 decisions: nested helpers + fix correlation, full
  redesign in one plan, defer standards-MCP-plumbing).
- The defect quest: `ea97db12-b8df-44bb-a8dd-4e0a3955871e`. Codeweaver's session log + returned
  summary (which flags the contract-inlining and `UnstyledButton`→`Box` deviations but NOT the
  state-lift) are in the `a566727d-...` session JSONL under
  `~/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft/`.
