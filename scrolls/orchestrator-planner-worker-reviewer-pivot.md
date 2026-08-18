# The operator/planner/worker/reviewer split

Why planning and verification authority sit where they do in the operations-ledger model, so the design is not
re-litigated. This is the *why*; the wiring reference is `packages/orchestrator/CLAUDE.md` + `docs/quest-role-paths.md`,
and the prompts themselves are `packages/orchestrator/src/statics/`.

---

## 1. The shape

The five operation-owning roles — `codeweaver`, `pesteater`, `flowrider`, `groundstomper`, `siegemaster` — are all
served **ONE prompt**, `operator-prompt-statics.ts`, with a per-role **discipline pack** interpolated at
`$DISCIPLINE` and the discipline's bare id at `$MY_DISCIPLINE`. Each owns one operation item, and its whole session is a
bounded loop of at most three rounds:

```
build → planner-minion → read the plan back → worker-minions ONE AT A TIME → reviewer-minion
      → build → ward(the round's files) → commit the round → loop on the reviewer's REMAINDER
```

`roleToDisciplineStatics` is the map (`codeweaver→implementation`, `pesteater→bug-repro`, `flowrider→below-browser`,
`groundstomper→browser-e2e`, `siegemaster→manual-qa`). Each discipline has one pack carrying four markdown blocks —
`operatorMarkdown`, `plannerMarkdown`, `workerMarkdown`, `reviewerMarkdown` — one per session in the round.
`spiritmender` and `warpgate` keep bespoke prompts and run no round; a `roleToDisciplineStatics` lookup returning
`undefined` IS the "bespoke prompt" signal, not an error.

---

## 2. The three faults this split solves

**Fault 1 — a monolithic operator drops the mandates it was given.** One session asked to plan, delegate, verify, fix,
sign off, commit and signal fills its context mid-loop and starts skipping the dispatches. Measured on a 10.5-hour
quest: an operator ran **217 turns with ZERO `Agent` calls** and wrote **all 27 of its own sign-offs**. The fix is not a
longer prompt — it is a session whose context CANNOT fill, because it is forbidden to read source at all. That is what
the exhaustive ALLOWED/FORBIDDEN table at the top of the operator template buys, and it is why the table is a table:
the prose version of the same rule is the version that got dropped.

**Fault 2 — the author grades its own work.** "Verify independently" is an instruction a filling session ignores. It is
now the SHAPE of the pipeline instead: the `reviewer-minion` is a different session from the one that wrote the code,
and it is the only session on the round that verifies anything.

**Fault 3 — novelty eats a session's context.** A pattern nobody in this repo has built yet is *detected* but never
*isolated*, so the builder burns most of a session discovering the recipe inline. Only the `planner-minion` may spawn a
sub-agent, and only for a bounded **spike** of exactly that. A spike is KEPT on disk and named in the owning piece's
`notes`, so the worker extends a working pattern instead of re-deriving it.

---

## 3. The three laws the split honours

1. **Conservation of synthesis** — every fan-out point needs a parent that holds the seam and reconciles. The operator
   is that parent; its minions return distilled artifacts and the reviewer checks them against the plan.
2. **Risk-adaptive depth** — plan deep at seams (package interface, novelty, must-hold constraint), shallow wherever
   there is sibling precedent ("mirror X, stop"). That judgement is the planner's, made against the real tree.
3. **Context tax** — every sub-agent re-reads the standards, so decompose only when the work saved beats the standards
   tax plus a coordination hop. This is why a piece is a file-group, not a file.

---

## 4. Why THREE generic minions rather than one family per role

With per-role minion families, the thing that varies between `codeweaver` and `siegemaster` is the SUBJECT MATTER, and
the thing that varies between planning and building and grading is the METHOD. A family-per-role therefore duplicated
every method five times, and made "the author never grades its own work" a sentence each family had to keep on its own.
A generic trio crossed with a discipline pack makes the method structural and leaves the packs holding only subject
matter.

**A generic minion therefore cannot be a role**: it has no discipline of its own until a role hands it one, which is
mechanically why `agentPromptClassificationStatics.roleNames` and `.minionNames` stay DISJOINT.

Models are fixed per minion, not per role: `planner-minion` and `reviewer-minion` on **opus**, `worker-minion` on
**sonnet**. Downgrading the reviewer is the expensive mistake.

---

## 5. Five load-bearing rules, each a measurement rather than a preference

- **The operator never opens a source file.** `Read`/`Edit`/`Write` under `src/`, `discover`, the project-map tools
  and the three standards tools are all FORBIDDEN to it. Its minions load the standards; it never does.
- **ONLY the operator runs `npm run build`.** `tsc` writes one shared `dist/` per package, so a second builder hands
  every sibling phantom TS2339s on correct code. Same reason the workers are strictly SERIAL: **one `Agent` call per
  assistant message, never two in one message.** "Independent" in a plan means safe to order any way, not safe to run at
  once.
- **The plan is PERSISTED, not returned.** The planner writes `quest.planningNotes.operationPlans[]` and returns 3-5
  lines; the operator reads it back with `get-quest-planning-notes`. It has to — the operator cannot check a plan
  against the tree, and a plan that only ever existed in one minion's final message is invisible to the reviewer that
  verifies against it and to any successor session.
- **Fix authority is delegated, not withheld.** A minion that finds a hole in its own work may close it; forbidding that
  defers a one-line fix downstream. What every minion hands up instead goes in `UNFIXABLE` with a named owner:
  architectural fixes, anything crossing pieces, anything needing a product decision.
- **No minion runs `git`, and no minion runs `npm run build`.** The parent owns the round's single commit and is the only
  session on the quest allowed to build. Leaf minions (worker, reviewer) may not delegate at all — a leaf's grandchild
  produces conclusions no gate ever reads, and that shape cost 3m55s of a 10m20s minion run.

---

## 6. Prompt prose loses; a computed gate holds

The post-mortem measured this directly: a computed `scope` parameter with a named consequence bolted to it was passed
correctly **30 times out of 30**, while the prose instruction to "record dispositions as you go" was ignored **13 times
out of 13**. A concern that lives only in a prompt is skipped. So the mandates that matter are gates on `signal-back`,
each running BEFORE any mutation and THROWING back through MCP so the agent sees it:

- **Commit-before-signal** — refuses `done`/`partial`/`blocked` while the quest worktree is dirty, untracked included.
  It asks whether the TREE is clean, never whether a commit was made, so `--allow-empty` satisfies a zero-change round.
- **Sign-off completion** — refuses `done` while any verification unit in scope carries no sign-off on the signalling
  role's OWN track.
- **Review coverage** — refuses `done` while any review unit in `<workItem.startRef>..HEAD` carries no disposition in
  `planningNotes.blightLedger`.

All three refuse ABSENCE, not honesty: every verdict and every disposition clears its unit, so each gate is always
satisfiable truthfully.

---

## 7. Grounded code facts (so the next reader does not re-derive them)

- **Ledger model:** `quest.operations: OperationItem[]` in `packages/shared/src/contracts/operation-item/`. It has
  exactly ONE writer, the orchestrator. `operations` is off the modify-quest allowlist **entirely, at every status** —
  ChaosWhisperer never authors it and no execution agent ever writes it. Content comes from derivation at Start
  (`questBuildRelayGraphBroker`) and runtime mutation (`questOperationsUpdateBroker`).
- **The codeweaver ledger is DERIVED, not authored.** The feature quest's one `codeweaver` seed carries
  `fanOutBy: 'implementation'` and `relayTailFanOutTransformer` expands it at Start into one item per (package, flow)
  cell plus a flow-less foundation item per package.
- **Allowlist at `in_progress`:** `allowedPlanningNotesFields: 'all'` — a planner writes `operationPlans`, a reviewer
  writes `blightLedger`, every role appends `questNotes`. Verification sign-offs are NOT in `planningNotes`: they ride
  `flows`, as `flowriderSignoff` / `siegemasterSignoff` on the element that carries them.
- **Prompt statics** live in `packages/orchestrator/src/statics/`, served by the `get-agent-prompt` MCP tool. There are
  no `.claude/agents/*.md` files for these agents. `agentNameToPromptTransformer` is the exhaustive switch mapping each
  name to its statics + model, and the ONE place `$DISCIPLINE` / `$MY_DISCIPLINE` are substituted; its `never` default
  fails the build when a name is added without a prompt.
- **Minions are NOT work items.** They call `get-agent-prompt({ agent, questId, discipline })` with **no `workItemId`**,
  are briefed inline by their parent, and never call `signal-back`. A minion that passed a workItemId would be caught by
  `subagentStopNeedsBlockGuard` and could only escape by signalling on its PARENT's operation item — completing the
  parent's scope while the parent is still working. `agentPromptGetBroker` throws on all four ways to get that split
  wrong, each with a message naming the actual fault.
- **Sub-agent correlation:** a minion renders as its own labelled, collapsible chain in the quest UI, keyed by the
  Task's wire-level `toolUseId`. Full detail: `packages/orchestrator/CLAUDE.md` → "Two-source sub-agent correlation".
- **Test-file lint gotchas:** test files may NOT import non-stub contracts from `@dungeonmaster/shared/contracts`; no
  conditionals (`&&`/ternary) in tests; no raw `string` type annotations (use branded contracts / `PropertyKey`); no
  `.toBeDefined()` (use explicit `.toBe`/`.toStrictEqual`).

---

## 8. The real proof (the smoketest verdict is UI-driven, per repo policy)

Run a live `/dumpster-create` → play button (or `/dumpster-launch`) on a novel multi-package feature and confirm:
(a) the operator session makes ZERO `Read`/`Edit` calls and dispatches a planner, then workers one at a time, then a
reviewer; (b) the plan lands in `quest.planningNotes.operationPlans` and the operator reads it back rather than
re-asking the planner; (c) each minion renders as its own chain in the quest UI; (d) the round commits before it
signals, and a `done` with an unreviewed file is REFUSED by the review-coverage gate with the outstanding units named.
