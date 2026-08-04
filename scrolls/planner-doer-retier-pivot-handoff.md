# The Planner/Doer split (ChaosWhisperer → Codeweaver → minions)

Why planning authority sits where it does in the operations-ledger model: ChaosWhisperer plans the **seams**;
Codeweaver plans and builds the **interiors** at build time and summons `codeweaver-minion` sub-agents for isolation.
This doc captures the *why* so the design isn't re-litigated. Wiring reference: `packages/orchestrator/CLAUDE.md` +
`docs/quest-role-paths.md`.

---

## 1. The two faults this split solves

Both are failure modes of a planner that plans **below its epistemic reach** — prescribing mechanics it can read but
can't run.

**Fault 1 — a planner over-reaches into mechanics it can't verify.** When the plan prescribes intra-file logic (e.g.
"add a local `useState` named `confirmingQuestId`") it can contradict the design decisions (which may require the
*parent* to own that async state) and split ownership inconsistently across scopes. The builder silently re-derives the
correct architecture — but off the record, because no assertion forced it and no planner pass caught the contradiction.
Lifecycle constraints that only live as advisory prose (design decisions) never enter the enforced channel.

**Fault 2 — novelty/test-difficulty eats a session's context budget.** A novel control (e.g. a Mantine `Popover` with a
tricky jsdom test recipe) is *detected* but never *isolated*; the builder burns most of a session discovering the recipe
inline, alongside its other work.

**Root cause of both:** planning mechanics the planner can only read-but-not-run, with no builder-side mechanism to
quarantine the unanticipated.

---

## 2. The fix: plan the seams, build the interiors

Keep the spine that a planning seat CAN verify — flows + observables + seam contracts + `packagesAffected[]`,
user-approved and immutable during execution. Express must-hold lifecycle constraints as **observables**, not as
mechanic prose, so they enter the enforced channel. Then **move planning authority to the build**:

- **ChaosWhisperer (the planner)** authors the spine AND the ordered `operations` implementation ledger —
  `{ role: 'codeweaver', text }` items, one per scope a Codeweaver session builds. It plans at seams (package
  interfaces, novelty, must-hold constraints), shallow everywhere there's sibling precedent. It does NOT prescribe
  intra-file logic; that belongs to the doer, the only actor that runs the file and proves choices with tests.
- **Codeweaver (the doer / synthesizing parent)** reads its handed operation item + git + the ledger, verifies it's the
  right next step, writes the logic-to-logic plan against the real files, **summons `codeweaver-minion` sub-agents** for
  isolated pieces, verifies their output, edits code inline, commits a prose handoff, and signals `done` or `partial`.
  A first-pass "spike" is allowed and kept — committed and noted in the commit message for the next session.

Git is the record of what was built; the commit message is the cross-session handoff. Codeweaver never writes the
ledger — the orchestrator marks status and (on `partial`) appends a `pt N` continuation the next session reads from git.

---

## 3. The three laws the split honors

1. **Conservation of synthesis** — every fan-out point needs a parent that holds the seam and reconciles. Codeweaver
   delegating implementation makes Codeweaver that parent; its minions return distilled artifacts it reviews against the
   quest.
2. **Risk-adaptive depth** — plan deep at *seams* (package interface, novelty, must-hold constraint), shallow wherever
   there's sibling precedent ("mirror X, stop").
3. **Context tax** — every sub-agent re-reads standards; decompose only when the work saved beats the standards tax plus
   a coordination hop. The synthesizing parent pre-digests standards for its minions.

---

## 4. Novelty: a predictability split

- **Visible at plan time** (an inventory shows the control is novel) → ChaosWhisperer scopes it as its own `codeweaver`
  operation item; downstream scopes mirror it.
- **Discovered at run time** (the jsdom recipe surfaces mid-build) → Codeweaver quarantines it to a `codeweaver-minion`
  that returns a distilled artifact (working file + usage examples). The rabbit-hole defense lives at the doer
  (delegation), not in a tighter plan — you cannot plan your way out of the unanticipated.

---

## 5. Codeweaver's delegation protocol

- A minion is a raw `Agent` sub-agent Codeweaver fully briefs: a narrow task, a **pre-digested standards subset**, no
  `get-agent-prompt`/`signal-back` (minions are not work items and not operation items — they call `get-agent-prompt`
  with no `workItemId`, are briefed inline, and never signal back). It returns a distilled artifact; Codeweaver reviews
  it against the quest and pivots if it struggles.
- Conservation guard: delegate for **isolation**, not to parallelize the slice.
- The `Agent` tool is synchronous — awaiting a minion does not violate the no-background-wait operating rule.
- Codeweaver runs on `opus` (`role-to-model-statics`) — it does tactical planning, synthesis, and review.

---

## 6. Grounded code facts (so the next reader doesn't re-derive)

- **Ledger model:** `quest.operations: OperationItem[]` (`{ id, role, text, status: pending|in_progress|complete,
  locked, wardMode? }`) in `packages/shared/src/contracts/operation-item/`. Two writers: ChaosWhisperer (spec-time,
  allowlist-gated `modify-quest`) and the orchestrator (runtime `questOperationsUpdateBroker`). Execution agents never
  write it.
- **Allowlist:** `operations` is writable only at `flows_approved` / `explore_observables` (and the
  `review_observables` back-edge). At `in_progress`, planningNotes writes are limited to `blightReports`. An execution
  agent's `modify-quest{operations}` at `in_progress` is rejected.
- **Prompt statics** live in `packages/orchestrator/src/statics/*-prompt-statics.ts` (relay roles) and
  `*-minion-statics.ts` (parent-summoned minions), served via the `get-agent-prompt` MCP tool. Codeweaver's prompt is
  `codeweaver-prompt-statics.ts`; its minion is `codeweaver-minion-statics.ts`. There are no `.claude/agents/*.md` files
  for these agents. Statics get colocated `.test.ts` (`@dungeonmaster/enforce-implementation-colocation`).
- **Model tiers** live in `role-to-model-statics.ts` — the single source of truth for each role's `--model` flag.
- **Sub-agent correlation:** `chat-line-process-transformer.ts` keeps `agentIdMap` (toolUseId→realAgentId) +
  `reverseAgentIdMap`, populated source-agnostically from any `user` line's `toolUseResult.agentId`. The handle broker
  shares ONE processor per session across all tails; `chat-history-replay-broker.ts` PASS 1a/1b are the replay pre-scan.
  A Codeweaver minion renders as its own labeled, collapsible chain in the quest UI, keyed by the Task's wire-level
  `agentId` (= toolUseId). Full detail: `packages/orchestrator/CLAUDE.md` → "Two-source sub-agent correlation."
- **Test-file lint gotchas:** test files may NOT import non-stub contracts from `@dungeonmaster/shared/contracts`; no
  conditionals (`&&`/ternary) in tests; no raw `string` type annotations (use branded contracts / `PropertyKey`); no
  `.toBeDefined()` (use explicit `.toBe`/`.toStrictEqual`).

---

## 7. The real proof (smoketest verdict is UI-driven, per repo policy)

Run a live `/dumpster-create` → play button (or `/dumpster-launch`) on a novel multi-package feature and confirm:
(a) ChaosWhisperer captures the lifecycle constraint as an observable and scopes the novel control as its own
`codeweaver` operation item; (b) dispatch advances one session at a time down the ledger; (c) Codeweaver delegates a
discovered-novelty piece to a `codeweaver-minion` and the minion renders as a chain in the quest UI; (d) the operations
ledger is readable on the quest (execution panel + QUEST SPEC tab).
