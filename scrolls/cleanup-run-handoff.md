# Cleanup run — handoff

Master (this repo's default branch) is at commit `f7b3a5e57`. A full ward run — this repo's own
lint, typecheck, unit, integration and end-to-end verification sweep, invoked as `npm run ward` —
passes clean across all 17 packages this repo is split into: 10,549 files linted, 10,525
typechecked, 3,712 unit tests, 178 integration tests and 129 end-to-end browser tests, zero
failures, recorded under ward's own run id `1790079729869-78c7`. 43 commits landed on master since
commit `b3c96266a`.

## Where the work lives

A worktree is an isolated checkout of this repo under `worktrees/`, with its own branch, so several
agents can work on different pieces of the repo at once without colliding on one checkout.

| Worktree path | Branch | State |
|---|---|---|
| `worktrees/orchestrator-step-engine` | `orchestrator-step-engine` | merged into master, work complete |
| `worktrees/orcha-27-28` | `orcha-27-28` | merged into master; most of its plan is unstarted |
| `worktrees/siegelense-build-items` | `siegelense-build-items` | merged into master; most of its plan is unstarted |

Both remaining worktrees, `worktrees/orcha-27-28` and `worktrees/siegelense-build-items`, were
carved from master at commit `de2a43b2c`. Everything committed inside them is already on master.
They are kept, rather than deleted, because their queued work continues there — see "The two
plans" below.

A fourth worktree, `worktrees/flows-one-file-per-route`, was removed during this run. It held eight
uncommitted files, and those eight were shown to be byte-identical to the copies already committed
on master, so nothing was lost by deleting it. Its diff is backed up, but only inside a session
scratch directory — nowhere committed in the repo — so that backup is gone once that directory is
cleared.

## The two plans

Both plans below were produced during this run and existed only in the session that made them
until now; they are written here because nothing else records them. Each plan is a list of units,
where a unit is a batch of one to three files one agent can take on its own.

### Plan A — the UI set and the independent work

Plan A covers two documents, `scrolls/orcha-changes/27-ui.md` and
`scrolls/orcha-changes/28-independent.md`. Work it in `worktrees/orcha-27-28`. The Source column
below names which subsection of one of those two documents each unit is drawn from (`27a`, `28a`,
and so on).

| Unit | What it does | Files | Source | Status |
|---|---|---|---|---|
| 1 | execution row identity | execution-panel-widget.tsx, execution-work-item-row-layer-widget.tsx, execution-row-layer-widget.tsx | 27a | DONE |
| 2 | projection transformer and binding, mirroring use-quest-summary-binding.ts | a new transformer and a new binding | 27b | queued |
| 3 | churn view and units readout | execution-row-layer-widget.tsx, execution-work-item-row-layer-widget.tsx | 27c | queued |
| 4 | unclaimed-operations tail and progress counter | unclaimed-operations-transformer.ts, execution-status-bar-layer-widget.tsx | 27d | queued |
| 5 | COVERAGE section | quest-summary-widget.tsx, flow-row-layer-widget.tsx, track-row-layer-widget.tsx | 27d | queued |
| 6 | UNCONFIRMABLE debt list | quest-summary-widget.tsx, unconfirmable-row-layer-widget.tsx | 27d | queued |
| 7 | ward-mode tag and retry badge | operation-row-layer-widget.tsx, ward-result-row-layer-widget.tsx, execution-row-layer-widget.tsx | 27d | queued |
| 8 | DETAILS-tab ledger | operations-ledger-widget.tsx, operation-row-layer-widget.tsx | 27d | queued |
| 9 | auto-expand and scroll, dependency labels, role colour | execution-row-layer-widget.tsx, execution-row-subtitle-transformer.ts, execution-step-status-config-statics.ts | 27e | queued |
| 10 | retire PARTIAL and pt-N | execution-step-status-config-statics.ts, operations-partial-continuation.e2e.ts | 27e | queued |
| 11 | back-edge badge, unmet list, fallback | execution-row-layer-widget.tsx, execution-work-item-row-layer-widget.tsx | 27f | queued |
| 12 | SPEC-tab recipe callout | react-flow-diagram-widget.tsx, flow-node-detail-panel-layer-widget.tsx | 27g | queued |
| 13 | glyphsmith prefix and spawn logic | chat-spawn-broker.ts, run-chat-layer-broker.ts, chat-prompt-build-transformer.ts | 28a | queued |
| 14 | glyphsmith responder branch | resolve-chat-quest-layer-broker.ts, design-chat-start-responder.ts, design-session-broker.ts | 28a | queued |
| 15 | delete glyphsmith-prompt-statics, add riftcarver to the floor list | glyphsmith-prompt-statics.ts and test, execution-floor-config-statics.ts and test | 28a, 28b | queued |
| 16 | delete the dead orchestration phase contract and dag transformers | orchestration-phase-contract.ts with test and stub, dag-topological-sort-transformer.ts, dag-ready-nodes-process-transformer.ts | 28b | DONE |
| 17 | correct the slot manager example and the browser-walk rule | slot-manager-statics.ts, orchestrator/CLAUDE.md | 28b | DONE |
| 18 | verifyByHuman flag | flow-observable-contract.ts with test and stub | 28c | BLOCKED on decision 3 |
| 19 | human-check verificationMethods value | step-scope-statics.ts and test, session-forensics/track-denominator-statics.ts | 28c | BLOCKED, needs 18 |
| 20 | automatability block and filter | a new shared statics file, the get-quest-work filter site | 28c | BLOCKED, needs 18 |
| 21 | citation kind and human-check panel | siegelense citation-kind-contract.ts, a new panel widget | 28c | BLOCKED, needs 18 |
| 22 | hydration tail step field | quest-hydrate-broker.ts and its test | 28d | DONE |

Ordering rules for Plan A: unit 1 comes before unit 2. Units 3 through 12 come after unit 2,
because they build on the row shapes it establishes. Units 5 and 6 both edit
`quest-summary-widget.tsx`, so they run one after the other. Units 13, 14 and 15 all touch
glyphsmith — an agent role that used to run a quest's design-chat stage and that this batch of
units deletes outright — so they run one after the other too. Unit 18 comes before 19, 20 and 21.
Units 16, 17 and 22 depend on nothing.

### Plan B — the siegelense build items

Plan B covers `scrolls/seigelense/remaining-build-items.md`. The folder is spelled `seigelense`,
which differs from the package the document is about, `packages/siegelense` — that is a spelling
inconsistency already in the repo's folder name, not a typo introduced here. Work it in
`worktrees/siegelense-build-items`. That document lists items across three states: some already
built, some overtaken by later design changes, and most still to build.

A "lane" below means one throwaway instance of the running app — an API server, a Vite dev server
and a headless browser — that a verification round spins up for itself to drive; "siege-driver" was
the old, now-deleted mechanism for standing one up by hand.

| Unit | What it does | Files | Status |
|---|---|---|---|
| 1 | delete the siege-driver lane | packages/web/test/siege-driver/siege-lane.ts, siege-driver.ts, siege-command.ts | DONE |
| 2 | repoint every fixture and runbook off the deleted lane | is-locator-pick-scope-file-guard.ts, rule-ban-locator-pick-broker.test.ts, playbook/smoketest-instances.md, orchestrator/CLAUDE.md, global-setup.ts, siege-adversarial-walker-statics.ts | DONE |
| 3 | catch a bare @scope/name in the lint rule | banned-package-path-names-transformer.ts and test | BLOCKED, see loose ends |
| 4 | element delta on an acting step | step-reading-contract.ts, key-read-layer-adapter.ts | queued |
| 5 | wire compare's elements field, needs 4 | compare-answer-contract.ts, the compare broker | queued |
| 6 | settle detector for click, then propagate | step-click-broker.ts, step-paste/type/wait-for brokers | queued |
| 7 | convert quest and session harnesses, then drop the raw fs fallback | quest.harness.ts, session.harness.ts | queued |
| 8 | fix the quest-completed, guild-mid-execution and nested-chain recipes | recipes-quest-completed-broker.ts, recipes-guild-mid-execution-broker.ts, session-with-nested-chain-broker.ts | queued |
| 9 | wire or delete the ninth recipe | recipes-catalog-broker.ts and test | queued |
| 10 | caller-supplied guild and work-item ids, and timestamps | guild-add-broker.ts, quest-hydrate-broker.ts | queued |
| 11 | quest two-route comparison browser test | a new spec under web/src/flows/home | queued |
| 12 | write-route storage cross-check, the mkdir ruling, delete RecipePackageMissingError, add an unusable instance state | guild-write-route-broker.ts, quest-write-route-broker.ts, instance-state-contract.ts | queued |
| 13 | sweep the rename leftovers | package-lock.json, siegelense-recipes-not-shipped.integration.test.ts, hydration-recipes/CLAUDE.md | queued |
| 14 | fix the nested-subagent double render and the create-guild left edge | collect-subagent-chains-transformer.ts, guild-empty-state-widget.tsx | DONE |
| 15 | the oddities file and the .dungeonmaster-assets move | locations-statics.ts, a new oddities file, .gitignore | queued |

Ordering for Plan B: unit 1 before 2; unit 4 before 5; unit 7's two halves in order; everything else
independent.

## Defects found and fixed

None of these were on the itinerary handed to this run; they surfaced while working it. Two terms
recur in the table below. A "work item" is one dispatched agent session, tracked as one entry on a
quest's ledger. A "quest" is dungeonmaster's own unit of work — one user request, carried from spec
through finished code — tracked end to end as one JSON file.

| Defect | Where | What it caused |
|---|---|---|
| packageNames default dropped | quest-summary-build-transformer.ts | an undefined key forwarded into a strict schema parse, rejected under exactOptionalPropertyTypes |
| a retired sign-off field still read | invalidation-apply-layer-broker.ts | a typecheck break; the clearing it did is obsolete by design per HANDOFF.md:99-104 |
| raw ENOENT reaching callers and users | quest-find-quest-path-broker.ts:63 | an unguarded readdirSync, where the same file's per-guild loop guards the identical call |
| entry step taken from the wrong family | quest-build-relay-graph-broker.ts:85 and :93 | the error "step `carve` is not declared in family `codeweaver`", after which the quest blocks |
| the same defect latent in hydration | quest-hydrate-broker.ts | a hydrated quest's first work item carried no step at all |
| a nested chain's body entry rendering twice | collect-subagent-chains-transformer.ts | an entry consumed into a chain stayed in the buffer and flushed again as a stray row |
| the adversarial walker never signalling back | siege-adversarial-walker-statics.ts | its work item never reaches a terminal state, orphan recovery retries to maxResets 3, the quest blocks |
| create-guild inputs misaligned | guild-empty-state-widget.tsx | the wider row's left edge sat 37.875px out, measured in a browser |
| a test-isolation leak | the server integration suite | a schema error threw ahead of the cleanup call, handing the next test a data directory with no guilds folder |

Three of these share one shape: an entry step or family taken from a hardcoded default instead of
resolved from the item's own family.

## Two traps worth remembering

1. **Lint reads compiled output, not source.** This repo's ESLint rules import
   `@dungeonmaster/shared/statics` when they load, and ESLint sets no "source" condition — the
   mechanism that otherwise makes every other check read `@dungeonmaster/shared`'s TypeScript
   source directly. So a worktree whose compiled output (its `dist/` folder) trails its source
   fails lint rules the source has already relaxed. One run showed 13 files failing a rule master
   had already changed; building cleared all 13 files and two integration-test failures along with
   them.
2. **Browser tests serve the compiled bundle, not the source.** Playwright, the browser-test runner
   ward drives for end-to-end checks, serves `packages/web/dist` — the built output of the web
   package. An uncommitted widget change stays invisible to a browser test until that package is
   rebuilt. A layout assertion measured a 37.875px failure against a fix that was already sitting
   in the source but not yet built.

## Known loose ends

- Roughly a dozen files in `packages/siegelense` carry provenance comments citing line numbers in
  the retired prototype document. Those citations point at nothing now.
- `packages/siegelense/src/statics/driver/driver-statics.ts` still names
  `packages/web/test/siege-driver/siege-lane.ts` in a comment, even though Plan B unit 1 deletes
  that file.
- Plan B unit 3 is blocked, and the reason is structural. `rule-no-hardcoded-package-names-broker.ts`
  hands its transformer only a string literal's own text, so a package name written as plain data
  (for example, `'@dungeonmaster/web'` inside a variable) and the same string written as an import
  source are byte-identical to the rule. The fix belongs in the broker, not the transformer:
  withhold literals whose parent is an ImportDeclaration, an ImportExpression or a require() call.
  A transformer-only fix was built during this run and, tested empirically, flagged legitimate
  imports as violations — so it was reverted.
- `docs/quest-role-paths.md` does not list `siege-adversarial-walker` — one of the agent roles
  siegemaster (the hands-on verification role) dispatches to attack a running system — even though
  this repo's own project guide makes per-role path coverage mandatory.

## Decisions waiting on you

These are the things no agent may decide on its own.

### 1. The sign-off contracts

**What a sign-off track was.** Before this repo's step-based execution model existed, each
verification unit — one terminal, one labelled branch, one embedded observable, or one off-map
probe family on a flow diagram, see decision 2 below for what those are — carried three fields
directly: `codeweaverSignoff`, `flowriderSignoff` and `siegemasterSignoff`, one per agent role that
verifies a flow. Each held a `Signoff` shape: a verdict (`confirmed` or `unconfirmable`), the
evidence behind it, and, for an `unconfirmable` verdict, an instruction for what would settle it.
`signoffTrackContract` is the enum naming those three field names. `signoffTracksStatics` is the
statics file holding that field list and a second, overlapping list — which roles are measured over
which units — side by side. `signoffContract` is the shape of one sign-off entry itself.

**What story 26 changes.** "Story 26" names a planned batch of work, documented in
`scrolls/orcha-changes/26-signoff-retirement.md` as a 31-session plan, none of it yet executed — it
is not part of either worktree above; it is separate, later work. It retires those three per-unit
fields outright, because story 11 (already landed, before this run) built a replacement:
`stepScopeStatics`, which keys the same scoping information off the execution STEP a unit belongs
to rather than off a hardcoded per-role field. The plan's own session 3 names `signoff-contract.ts`,
`signoff-track-contract.ts` and `signoff-tracks-statics.ts` for deletion together, quoting the
wider step-engine design plan's own retirement list, and carries no blocking dependency inside this
set.

**Why they are still standing.** Simply because story 26 has not run yet. Nothing in this cleanup
pass touched it.

**Which live code reads each**, confirmed by reading the current imports:

| Contract or statics | Defined at | Live (non-test) reader |
|---|---|---|
| `signoffContract` | `packages/shared/src/contracts/signoff/signoff-contract.ts` | `quest-summary-unconfirmable-contract.ts:47` — types the `signoff` field of one unconfirmable entry |
| `signoffTrackContract` | `packages/shared/src/contracts/signoff-track/signoff-track-contract.ts:33` | none outside its own definition file; every other importer is a test or a stub |
| `signoffTracksStatics` | `packages/shared/src/statics/signoff-tracks/signoff-tracks-statics.ts` | `signoff-track-contract.ts:31` and `signoff-denominator-track-contract.ts:28`, each building its own enum off it |

**A discrepancy worth flagging.** The open question actually recorded at
`scrolls/orcha-changes/26-signoff-retirement.md:229` is not about this trio. It is about a fourth,
sibling contract: `signoffDenominatorTrackContract` (the plan's session 5), which names which units
each role's track is MEASURED over, rather than which fields exist. The document asks whether that
contract "retire[s] outright, or survive[s] re-keyed" onto a candidate replacement
(`agentRoleContract`, or the family key `agentFlowStatics` uses), "but wiring either in is a design
decision, not a search result."

The quote, verbatim, `scrolls/orcha-changes/26-signoff-retirement.md:229-230`:

> The conductor decides; until then, carry the enum unchanged and let session 6 read it exactly as
> today, so behaviour does not shift on a guess.

"Session 6" there means the plan's session 6 — three sibling contracts
(`quest-summary-track-counts-contract.ts`, `quest-summary-flow-contract.ts`,
`quest-summary-unconfirmable-contract.ts`) that each key a row on `signoffDenominatorTrackContract`.
So this open question blocks the plan's session 5, and through it session 6 — not session 3, the
trio named above, which the plan already resolves unconditionally.

**What each choice means for the trio itself.** If it retires (session 3 runs, as the plan already
resolves it), the three per-unit fields disappear from `flow-node-contract.ts`,
`flow-edge-contract.ts` and `flow-observable-contract.ts` along with their off-map sibling,
`signoffVerdictContract` retires alongside them, and every downstream reader — 39 files by the
plan's own measured count, spread across `shared`, `orchestrator`, `session-forensics` and `mcp` —
is re-pointed at `stepScopeStatics`. The web's COVERAGE block, which currently renders per-track
sign-off counts, goes blank until story 27 rebuilds it against the replacement; the plan calls that
expected, not a regression. If the trio is kept — story 26 simply does not run — the repo carries
two parallel scoping mechanisms indefinitely: the old per-role fields these three contracts
describe, and the step-keyed `stepScopeStatics` story 11 already built to replace them.

**What unblocks when it is answered.** Story 26's session 5 (`signoffDenominatorTrackContract`
itself) and session 6, the three contracts keyed on it. No other session in story 26 waits on this.

### 2. Story 26's holes have no owner

**What a user now sees.** Open a quest's summary today and its per-flow, per-track counts are
fiction. `questSummaryBuildTransformer`
(`packages/orchestrator/src/transformers/quest-summary-build/quest-summary-build-transformer.ts:134-135`)
hardcodes every track's `confirmed` count to `0` and its `unconfirmable` count to `0`, whatever the
quest's real state is, and the whole-quest `unconfirmable` debt list (line 158 of the same file) is
hardcoded to an empty array. Separately, `qaChecklistBuildTransformer`
(`packages/orchestrator/src/transformers/qa-checklist-build/qa-checklist-build-transformer.ts:119`)
sets `remainingItemIds` to every verification unit in the flow — a terminal, a labelled branch, an
embedded observable, or an off-map probe family — regardless of which track (codeweaver, flowrider
or siegemaster) is asking, because the function's `track` parameter is declared but never read in
its body. So the checklist a verification role pulls to know what is left to check always reports
the whole flow as outstanding, whichever role asks and however much of it a previous role already
covered. It gates nothing.

**Why story 27 cannot fix it.** Story 27 — the UI rebuild covered by Plan A above — is scoped to one
package. Its own header, `scrolls/orcha-changes/27-ui.md:6`, reads:

> PACKAGE   @dungeonmaster/web

Both broken transformers live in `@dungeonmaster/orchestrator`, a different package story 27 never
touches.

**The consequence.** A quest cannot presently be measured as verified — its summary and its
checklist both report a state that does not reflect what any role actually confirmed — and no
planned story, in either plan above, targets either file.

**What unblocks when this is answered.** A quest's summary and its checklist report real coverage
once a story is scoped to these two files; until one is, nothing does.

### 3. Author-only enforcement

**What `verifyByHuman` is meant to be.** It is a new boolean field, planned for
`flowObservableContract` — the contract for one verifiable outcome on a flow node, see decision 2
above — that marks an observable as a class no automated test or reading pass can settle, something
only a person can judge. It is meant to work like the existing `verifyByReading` field does today:
an observable flagged that way drops out of the automated roles' (flowrider's, siegemaster's) work
lists and routes instead to a person, at the end of the quest, alongside a screen recording.

**What "author-only enforcement" means.** Both `verifyByReading` and the planned `verifyByHuman` are
meant to be set only by ChaosWhisperer and BugHunt, the two intake roles that write a quest's spec —
never by an execution role partway through the quest. "Author-only" is that restriction;
"enforcement" is how firmly it holds. Two different things could enforce it: prompt text, where the
agent's own instructions simply tell it not to set the field and nothing stops it if it does anyway,
or a real mechanism, where code — a schema refinement or a runtime guard — refuses the write
outright, whoever attempts it.

**What is true today, confirmed by reading the code.** The existing rule, for `verifyByReading`, is
prompt text only. `packages/orchestrator/CLAUDE.md:933` states it in prose: "`verifyByReading: true`
is the one field that says \"no test settles this\"." and, further down the same paragraph, at
`:940`, "Only ChaosWhisperer and BugHunt can set this." (`scrolls/orcha-changes/28-independent.md`
cites this same text at `orchestrator/CLAUDE.md:851` — that line number has drifted since the scroll
was written; :933 and :940 are the real, current lines.) `dumpster-create-prompt-statics.ts:158`
repeats the same instruction to the authoring agent. But `verifyByReading` on
`flowObservableContract` is a bare `.optional()` boolean with no Zod refinement and no runtime guard
anywhere restricting who may set it — the restriction is words in a prompt, and nothing in code
currently checks who is calling.

The quote, verbatim, `scrolls/orcha-changes/28-independent.md:202`:

> An open question blocks 28c-1 — OPEN, the conductor decides. Is author-only enforcement prompt
> text, or a real mechanism?

**What each choice implies for units 18 through 21** (`verifyByHuman` on the contract, the
human-check value in the step's declared scope, the automatability filter, and the citation-kind
panel — see Plan A above). If the answer is "prompt text", unit 18 copies `verifyByReading`'s exact
shape — a bare optional boolean, no refinement — and the work is cheap: the document itself calls
matching that precedent cheap. If the answer is "a real mechanism", the document's own text says
apply it to BOTH flags, not just the new one — so unit 18 also has to retrofit enforcement onto the
already-shipped `verifyByReading`, new machinery beyond what unit 18's own scope currently
describes. Units 19, 20 and 21 each build on unit 18's contract shape, so none of the four can start
until this is decided.

**What unblocks when it is answered.** Units 18 through 21 of Plan A, all currently blocked per the
Plan A table above.

### 4. Two siegelense items, 5c and 9c

**Item 5c — the `recording` route.** Siegelense — the tool that runs the real app as an addressable
instance for verification rounds, see the "lane" gloss under Plan B above — lets a recipe declare
more than one way to build the state a round needs. `write` writes files directly; `api` calls the
app's own HTTP endpoints; a third, `recording`, is meant to replay bytes captured off a real system
at some past moment rather than build state at all. `recording` is fully wired into the type system
and the runner — the enum accepts it, a route function can be declared for it, the runner calls it
exactly like the other two — but nothing in the repo has ever declared one: no ingredient uses it,
no test exercises it. `scrolls/seigelense/remaining-build-items.md:321-322` calls this out directly:
"This is a decision to make now, not a discovery to leave for whoever ships the first one."

The two options, quoted verbatim, `scrolls/seigelense/remaining-build-items.md:351-358`:

> **The decision, either way, is this pass's:**
>
> - **Build it** — one real state in this repo written as a `recording` ingredient, plus the four
>   rows above. That ingredient is what proves the route, the same way
>   `guild-two-route-comparison.e2e.ts` proves the two-target plan.
> - **Or delete it** — out of `hydrationRouteContract`, out of `hydrationRoutesContract`, out of
>   `RoutesFor`'s third branch, and out of the route-select and failure-classification branches.

Building it means writing a capture path (nothing records a recording today), a field saying what
version it was captured from and when, and honest failure messages naming the recording rather than
a URL that never existed for a replay. Deleting it means removing the enum value and every branch
that reads it, and losing the third row of the diagnosis table in `packages/hydration/CLAUDE.md`.
The document is explicit that leaving it exactly as it stands — declared, wired, unproven — is the
one option that costs something (`remaining-build-items.md:360-362`): "It reads to every author as
a supported route, so somebody eventually declares one, and what they get is a `write` route that is
picked last, is told it needs a server, and reports its failures with three empty fields."

**Item 9c — the seventh `docs` scope.** A siege session asks for documentation through a `docs` call
carrying a scope naming who is asking and why. Six scopes are named in the design; a seventh,
`operational`, exists in the code too, and at first reads as a stray duplicate of `operating`. It is
not: `scrolls/seigelense/remaining-build-items.md:555-558` explains `operational` has its own
audience — a session verifying a flow with no screen, driven entirely through server logs and the
`request` / `file` / `until { file }` steps, the headless verification lane, where a UI-driven scope
like `operating` does not apply.

Its own three options, `scrolls/seigelense/remaining-build-items.md:565-569`:

| Option | What it means |
|---|---|
| Delete `operational` | the honest reading if nothing browserless is ever walked; the seven scopes become six |
| Keep it for the whole-quest off-map item | an all-operational quest falls back to one whole-quest item that still attacks the running system headlessly; the audience line gets rewritten to say so |
| Decide `operating` alongside it | `operating` addresses a role — "the session that opens and closes a pool of instances" — that a newer orchestrator-plan change has also eliminated |

The document names the second option as likelier but flags its own dependency
(`remaining-build-items.md:572-575`): "the whole-quest off-map item is an OPEN question in the plan,
not a settled one — its siege planner returns `empty` on an all-operational quest and mints no such
item. Settle that first; this follows from it."

**A note on this handoff's own framing.** 5c and 9c do not turn on the identical open question. 5c's
decision — build the `recording` route, or delete it — is self-contained. 9c's likeliest resolution
depends on a separate, still-open question inside the orchestrator step-engine plan: whether an
all-operational quest gets one whole-quest off-map verification item. That is not the same question
5c asks; both are simply undecided at the same time.

**What unblocks when each is answered.** 5c unblocks whoever next needs a `recording`-route
ingredient, either with a proven pattern to copy or with the misleading option removed. 9c has no
unblock of its own before the orchestrator plan's whole-quest off-map question resolves — it waits
on that, not on a decision made here.

### 5. The row disambiguator format

**The problem it solves.** The execution panel — the UI surface listing every dispatched work item
as it runs — used to name each row by its scope alone: the operation item it works, or its role
name as a fallback. That stays unique as long as one scope has one live session. It stops being
unique the moment a scope holds several — several parallel workers on the same step, or a plan step
followed by a review step followed by a commit step, all on the same operation.

**How the fix resolves a collision**, read directly from the code. `ExecutionPanelWidget` groups
every visible row by its scope first
(`packages/web/src/widgets/execution-panel/execution-panel-widget.tsx:252-274`). A scope holding
only one row gets no disambiguator at all, and that row's name renders exactly as before. A scope
holding two or more rows escalates in two steps
(`execution-panel-widget.tsx:276-312`): first by the work item's own `step` — the stage within its
family's graph, such as plan, work, review, commit or ward — which separates a plan session from its
own review session. Where more than one sibling shares even that same step, such as parallel workers
dispatched together, it escalates again, to that work item's live `sessionId`, or, for a work item
not yet dispatched, its own work item id — always unique either way.
`ExecutionWorkItemRowLayerWidget`
(`packages/web/src/widgets/execution-panel/execution-work-item-row-layer-widget.tsx:135-140`) then
renders the row's name as the scope label alone when no disambiguator was assigned, or as
`` `${scopeLabel} (${sessionDisambiguator})` `` when one was — for example, `core: config adapter
(plan)`.

**This format is a choice made during this run, not something 27a specified.**
`scrolls/orcha-changes/27-ui.md` names row identity (unit 1 / 27a) as a shared decision the rest of
the set depends on, but it does not prescribe the parenthetical rendering itself — that shape was
decided while building it.

**Why it is cheapest to change now.** Units 2 through 12 of Plan A all read row identity as their
foundation — the churn view, the COVERAGE section, the ward-mode tag, the auto-expand behaviour, and
the rest all key off the same row-name and row-grouping shape unit 1 established. Changing the
disambiguator's format after any of them land means touching every one of those units a second
time; changing it now touches only `execution-panel-widget.tsx` and
`execution-work-item-row-layer-widget.tsx`.

**What unblocks when it is answered.** Nothing is currently blocked on this — Plan A's units 2
through 12 already build against the format described above. Answering it is a matter of doing so
before more code depends on the current shape, not of removing a block.
