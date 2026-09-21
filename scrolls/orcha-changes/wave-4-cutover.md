# Wave 4 — the cutover

**The one wave where the tree genuinely cannot stay green mid-brief.** Four briefs, dispatched one at a
time, each handing the next a tree that compiles. No batch here — a batch leaves nobody holding the
middle state.

**Model: opus** for 4A and 4D, **sonnet** for 4B and 4C.

**Wave 5 lands in the same window.** 4D deletes `get-qa-checklist` and the sign-off writers behind it;
wave 5 deletes the fields those writers wrote. Ship one without the other and the derivation brokers
disagree with the record. Coordinate the merge, not the authoring.

**This file carries everything a worker needs.** It does not point anywhere else.

---

## Vocabulary, if you have not read waves 1 to 3

**family** one of six role stages · **scope** one family's slice of one quest, today's
`quest.operations[]` item · **step** one stage inside a family, its own dispatched session ·
**work item** one dispatched agent run · **unit** an observable, a terminal node, a labelled edge, or an
off-map family · **the four outcome words** `done` · `unmet` · `empty` · `wall`.

---

### 4A — advance, the selector, and lazy scope creation

```
OWNS      packages/orchestrator/src/brokers/quest/get-next-step/select-batch-layer-broker.ts
          .../compute-next-step-from-quest-layer-broker.ts
          .../compute-ready-work-items-layer-broker.ts
          packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.ts
          packages/orchestrator/src/brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts
          packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.ts
          packages/orchestrator/src/transformers/work-items-to-quest-status/…
          packages/orchestrator/src/transformers/relay-tail-fan-out/…
NO TOUCH  the deterministic handlers (4B) · capacity and instances (4C) · the deletions (4D)
DONE      a family's scopes are minted when that family is ROUTED TO, not at Start;
          `complete` comes from the family graph reaching `@complete`, never from a
          drained ledger; the selector returns a BATCH with a join
ASSERT    parallelism is one line today — `const [first] = ready;` at
          select-batch-layer-broker.ts:17 — so assert the batch and the join, not the
          spawn machinery, which already does `Promise.all`. Then lazy minting fixes a
          real bug: an operator adds an observable mid-quest, and under Start-time minting
          flowrider's scopes were already cut from the flows as they stood at approval, so
          that observable never gets a flowrider session. Assert it DOES now. Then the
          seam rule: `relayTailFanOutTransformer` assigns a glue seam's units to the LATER
          cell only — the orchestrator already computes cell order, so which side comes
          second is a fact it holds at fan-out time
```

### What parallel dispatch actually costs

`nextStepContract`'s `spawn-agents` already carries `agents: z.array(spawnInstructionContract)`, and
`spawnBatchLayerBroker` already spawns the whole array under `Promise.all`, pre-stamping each work item
`in_progress` first. The only thing capping dispatch at one session is
`select-batch-layer-broker.ts:17` — `const [first] = ready;`.

Parallelism is that selector returning a batch, plus a join: the route fires when the last item in the
batch has recorded. Concurrent `quest-work` calls queue behind `questWithModifyLockBroker`, which is
what that lock is for.

---


### Who gets an operational flow, and who has it filtered out

A flow typed `operational` has no running system to walk. Its observables are things like a file
deleted, a config changed, a dependency removed. **Who sees one is an assertion requirement, not a
preference**, so it goes in a table and gets tested:

**Codeweaver owns operational work outright. Flowrider and siegemaster never see it.**

| Family | Operational flows, nodes and observables | Why |
|---|---|---|
| **codeweaver** | **gets all of it** | somebody does the work, and its reviewer is the only session that reads the tree and can confirm the change landed |
| **flowrider** | **filtered out** | it writes tests that walk a flow. There is nothing to walk, and a test asserting a file is absent is a change-detector that goes green the day it is written and blind thereafter |
| **siegemaster** | **filtered out** | it drives a running system by hand. An operational change has no running surface to drive |

The filtering is the **orchestrator's**, never the session's. A prompt that says "skip operational
units" is a rule an agent can misread; a scope that never contains one cannot be misread.

**Three assertions, and they are negative ones — the hardest kind to remember to write:**

1. **Fan out a quest whose flows are all operational. Assert ZERO flowrider scopes and ZERO
   siegemaster scopes exist.** Not "they complete cleanly" — that they are never minted.
2. **Hand a flowrider or siegemaster scope a runtime flow carrying an operational node. Assert that
   node's units are absent from the scope's unit set.** This is the case that will actually bite: a
   runtime flow can hold a node whose work is operational — a migration that runs once, a config
   written at deploy. **The filter is per unit, not per flow.** Filter only by `flowType` and those
   units arrive at a session that cannot settle them, and the gate then blocks forever.
3. **Assert a codeweaver reviewer marks an operational unit `met` with TREE STATE as evidence, never
   a test path.** The file really deleted, really gone from every import and every route.

And the consequence worth naming: a quest whose flows are all operational routes `empty` past both
verify families and goes riftcarver → codeweaver → `wardFull`, each code-changing family still ending
in its own commit and branch ward. That is correct, and it should have a test of its own, because it
is a whole quest shape that never enters either verify family's graph.

*Future, not this feature:* ChaosWhisperer marks operational items needing a cloud console or another
human-only surface as `reviewByUser`, so they route to a person rather than to a reviewer. Leave room
for the mark; do not assume every operational observable is machine-checkable.

### The unbuilt seam — solved by the fan-out, not by a new mark

The problem: codeweaver orders cells by package kind tier, so the far side of an HTTP seam is routinely
a *later* operation item. Today the answer is a note rather than a verdict — *"If that half is not
built yet, write down what you assumed"* (`codeweaver-prompt-statics.ts:469`) — and all three marks are
wrong for it.

**The fix is upstream of the marks: a glue seam's observables go to the SECOND cell only.** The
orchestrator already computes cell order (package kind tier, then package-graph depth, then name), so
"which side comes second" is a fact it holds at fan-out time, not a judgement anyone makes later. The
later cell can see both halves; the earlier one is never assigned the unit and never has to mark it.

That replaces `packageScope: 'intersection'` for seam units — today a glue node's units go to *every*
cell that tags it, which under a gate that refuses an unmarked assignment would force two cells to mark
the same unit, or block one of them. **One owner, chosen by the ordering the orchestrator already
does.** No fourth mark, and the vocabulary stays at three.

Changed by this: `relayTailFanOutTransformer` (assign seam units to the later cell) and
`signoffTrackEligibilityStatics`' `packageScope` rule, which retires with the tracks anyway.


---

### 4B — the deterministic handlers, and `args`

```
OWNS      four handlers — `commit`, `ward`, `riftcarver`, `cleanup` — and the `args:
          string[]` plumbing
          the deletion of `wardMode` from the operation item, its contract, advance and
            both splices
NO TOUCH  the selector (4A) · the router itself (wave 2) · any prompt (wave 6)
DONE      each handler classifies its exit into one of the four outcome words, and the
          commit handler PUSHES
ASSERT    the handler was invoked with the step's `args` VERBATIM — that is now the only
          thing between a branch ward and a full one. Then the three the plan singles out:
          a 0-file ward scope is `empty`, not green; riftcarver's `repairable` maps to
          `unmet` while both `git-state` and permission-denied map to `wall`; and the
          commit message is DERIVED from the work item's observations, because a handler
          has no prose to write. Then the push: bare, no `-u`, because riftcarver already
          set the upstream at carve time
```

**Three holes collapse into this one change, and one of them is easy to miss.** Siege has no committer
at all once `siegemaster-reviewer` is deleted — both walkers are categorically forbidden to commit.
Codeweaver has too many: nine cells means nine reviewers, one worktree, one `index.lock`, and that
collision is measured rather than theoretical. And nothing committed after a `repair` in ANY family —
including `riftcarver` and `wardFull`, which get no `CLOSE_OUT` and so declare their own `commit` step.

### The ward gates — one per family, plus one at the end

Two different jobs, and the old relay only had one of them in the right place.

| Gate | `args` | Runs | Catches |
|---|---|---|---|
| **Family ward** — the `...CLOSE_OUT` trio | `['--committed', '--uncommitted']` — the whole quest branch | at the end of every code-changing family, so **once per cell and once per flow** | breakage attributed to the scope that caused it, while the session that caused it is still the most recent thing in git |
| **`wardFull`** — the relay's last item | `[]` — a bare ward is every check over the whole monorepo | once, after every family has drained | what a branch-scoped run cannot see: a package nobody in this quest touched that now fails |

**`ward(committed)` leaves the relay** — that gate is now inside codeweaver, flowrider and siegemaster
rather than sitting between them — and `wardFull` becomes the last family:

```
riftcarver → codeweaver(×cells) → flowrider(×flows) → siegemaster(×flows) → wardFull → @complete
              each ending in its own branch ward
```

Every arrow in that line is now a `routes.done` entry in `questFlowStatics`, not an array position.

**It is more ward runs, deliberately.** Today one `ward(committed)` runs after *all* codeweaver cells,
so a red names the branch and not the cell. Per-family gates cost N runs and buy attribution: the red
lands on the cell that produced it, and its `repair` step is scoped to that cell's own context.

**`wardMode` is deleted, not extended.** A deterministic step declares `args: string[]` — the flags its
handler is run with — and that is generic where a mode enum never was. `['--committed',
'--uncommitted']` is the branch gate, `[]` is the full one, and the difference between them stops being
a contract change.

Three things follow from `args` that a mode enum could not give:

- **A new ward scope is a config edit.** `['--only', 'lint,typecheck']` as a cheap early gate, or
  `['--onlyTests', '<regex>']`, needs no new enum member and no broker branch.
- **It generalises past ward.** `riftcarver` takes `args: []` today and can take flags tomorrow. Any
  handler added later inherits the field rather than needing its own mode.
- **`wardMode` leaves the operation item too.** The step carries the args, so the field the registry,
  the contract, the advance broker and the splices all copy around has nothing left to say.

**Deterministic steps.** `kind: 'deterministic'` names a handler, so the router runs code instead of
spawning a session. Both ward gates and `riftcarver` classify their exit code into one of the four
words and hand it to the same router. Riftcarver's failure classes map without loss:
`worktreePrepareStepStatics`' `repairable` becomes `unmet`, and both `git-state` and permission-denied
become `wall` — which is *more* correct, since a git-state red genuinely is a wall with no worktree to
send a repair into.

**`spiritmender` stops being a family and becomes the `repair` step** — one prompt appearing in five
graphs with byte-identical config, since it declares no `done` route and returns to whichever gate
minted it. Today that splice is hand-written slice arithmetic in two brokers; it becomes one route
entry each.

**Three roles deliberately have no graph.** `chaoswhisperer`, `bughunt` and `tavernkeeper` are
interactive CHAT roles — the user drives them, they spawn through `chatSpawnBroker` rather than the
dispatch scan, and none of them is a relay step. They keep their work items and prompts untouched.

**`glyphsmith` is deleted, and the design STAGE stays.** The role, its prompt and the chat path that
launches it go; `design_approved` was always set by a human rather than by that session, so the stage
loses nothing it depended on. Scope, measured: about 35 non-test source files name it, and the two
that are more than a list entry are `design-chat-start-responder` and web's `design-session-broker`.
It is independent of the step engine, so it is its own item in the order of work.


### Committing becomes a deterministic step — three holes collapse into one change

"The reviewer is the only committer" was the wrong rule, and two families broke it from opposite ends.

- **Siege has no committer at all.** Its reviewers are the two walkers, and both are categorically
  forbidden to commit — `[NOTHING IS COMMITTED] … You commit nothing, ever`
  (`siegemaster-verifier-statics.ts:159`) and `[NO COMMIT]` (`siegemaster-stress-statics.ts:134`). The
  session that committed siege's pass was `siegemaster-reviewer`, which this plan deletes. So the
  walker cannot signal (dirty tree, gate refuses) and burns 40 visits on the same wall; the family
  ward's `--committed` half grades an empty range; and the fixes ride into `warpgate`'s
  `git merge --squash` as uncommitted working-tree state, which is to say they are dropped.
- **Codeweaver has too many committers.** The rule fixes parallel workers *inside* one cell and says
  nothing about parallel *cells*. Nine cells means nine reviewers, one worktree, one `index.lock` —
  the exact collision measured at twelve concurrent sub-agents, three landing and nine dying.
- **And nothing commits after a `repair`**, in any family, so the next family inherits uncommitted
  work it did not write. That one is wider than the three code-changing families: `riftcarver` and
  `wardFull` run a repair too and get no `CLOSE_OUT`, so each declares its own `commit` step — see
  wave 6's prompt inventory, where the omission surfaced.

**So `commit` is a deterministic step**, serialized behind the per-quest lock, sitting between
`review`/the last clean walk and `ward`. That deletes the reviewer's git section, the `[GIT]` rules,
the sweep mechanic, and the whole index-lock problem in one edit — and it takes real weight off the
reviewer's prompt budget, which was over the line anyway.

**It also PUSHES, because otherwise nothing does.** Today each reviewer ends on a bare `git push`,
and deleting the reviewer's git takes that with it — leaving every commit after the carve local, and
`get-blight-checklist({ scope: 'unpushed' })` reading `@{upstream}..HEAD` as the whole branch forever.
So the handler commits and then pushes, bare, no `-u`: riftcarver already set the upstream at carve
time, which is exactly why that push is `-u` and no later one needs to be.

**A handler writes no prose, so the message is DERIVED from the work item.** The reviewer used to
write `<role>: <what this pass made true>` with its whole return block in the body, and that body was
the pass's only durable record. A deterministic step has no sentence to offer, so it builds one from
what it already holds:

```
<family>/<step>: <the scope — package and flow, or just flow>

met       <unit-id> · <unit-id> · …
cant-meet <unit-id> — <its toSettle>
unmet     <unit-id> — <what is left>
work items: <the ids whose observations this commit is covering>
```

That is strictly more checkable than the prose it replaces — every line is a value off the record
rather than a claim a session made about itself — and `git log` stays the reconstruction route a
later session already uses. Where a commit covers no marks at all (a `repair`, `warpgate`'s own
worktree commits), the subject carries the step and the body carries the work item id alone.

No session in any family runs git at all after this — not a write, not a read — **except `warpgate`,
and that is not a loose end.** Its entire job is `git merge --squash` plus a commit on the base branch at the repo root.
It is a family with one step and no `CLOSE_OUT`, so there is no deterministic `commit` step to collide
with it. The universal claim needs that carve-out written down, or someone reading the rule will take
warpgate's git away and the merge stops working.


---

### 4C — capacity, and the router owning instances

```
OWNS      the capacity read before each lane batch
          `start` and `kill` around every `needsLane` work item
          the instance id as the fifth prompt substitution, in
            packages/orchestrator/src/transformers/work-item-to-prompt/…
          `maxConcurrent: { limit, counts }` enforcement for flowrider's browser cap
NO TOUCH  scrolls/seigelense/remaining-build-items.md's remaining tool work — **read it
          first**, because siegelense is not finished and this depends on the parts that
          are
DONE      a `needsLane` step never dispatches without an instance, and never leaves one
          running after its work item records
ASSERT    `kill` ran when the work item recorded **including when it recorded `wall`** —
          that is the case a session-owned close could never reach, and the whole reason
          this moved off the walker. Then the instance id reached the RENDERED prompt.
          Then the two budgets stay separate: siege lanes come from `suggested`, and
          flowrider's four browser walks are a different pool `capacity` cannot see,
          counted over pieces carrying a browser unit rather than over units
```

Two families hit this from different directions, and they turn out to need different answers.

Siege runs exactly one round at a time today — *"Both minions return before you brief the next round"*
(`siegemaster-prompt-statics.ts:355`). Flowrider caps browser walks at four. Both were prompt prose an
operator obeyed.

**The cap cannot live in the plan contract**, and the reason is structural: **a mark-minted piece is
by definition not in the plan.** Three walkers marking `unmet` mint three fixers outside any declared
batch, and their returns mint three concurrent re-walks. Nothing the planner wrote bounds it. Wherever
this document earlier said the plan contract enforces the browser cap, it is wrong; the plan check is
an early warning at plan time and the router is the enforcement.

**A siege lane IS a siegelense instance, and how many may run is MEASURED, not declared.**
`dungeonmaster siegelense capacity` answers exactly this question: it returns `suggested` — how many
instances this machine can run right now — alongside the `ceiling` it is never above (a policy knob,
3, at `capacity-statics.ts:26`), a `why` sentence, and the `measured` and `profile` blocks the
judgement came from. With no profile for the spec it answers 2, so the first pair runs and profiles
itself.

So a step that needs a lane declares `needsLane: true` and **no number at all**. The router asks
capacity before dispatching any batch of lane steps and uses `suggested`. Both siege walkers draw on
that one pool, which is the shared budget two per-step numbers could never express. A number in the
config is a guess about a machine; this is a reading off the machine that is actually running.

**And because the router is already reading capacity, the router STARTS AND STOPS the instance too.**
That is the change, and it is worth stating as a rule rather than as a detail:

| `needsLane: true` means the router | Instead of |
|---|---|
| calls `start` before dispatching the work item, and waits for the manifest | the session running `start` as its own step 2 |
| substitutes the **instance id** into the prompt beside the quest, work item, operation item and step ids | the session naming its own lane `<workItemId>-happy` |
| serves the manifest — `baseUrl` and every other address — through `get-quest-work` | the session reading a manifest file it started |
| calls `kill` once the work item records, whatever the outcome | the session closing the lane last, which a crashed session never reaches |

**Three things this fixes that the session-owned version could not.** A session that dies mid-walk
strands an API server, a Vite server and a browser, and nothing notices — the router always reaps,
because reaping is tied to the work item recording rather than to a prompt step running. The pool
count stops being a thing two sessions could each believe differently. And `capacity` is read by the
same code that spends it, so `suggested` and the number actually started cannot drift.

**One case needs a route rather than a rule: the antagonist deliberately breaks its instance.** Today
the prompt tells it to restart as `<workItemId>-adversarial-2`, then `-3`, and record which points ran
either side. Under router-owned instances it cannot restart anything — so **a dead instance is an
`unmet` mark carrying the `status` output and the points not yet driven**, and the router mints the
next work item on those, with a fresh instance. Same behaviour, and now the restarts are visible in
the ledger instead of buried in one session's transcript. Wave 6 carries the prompt half.

**The `operating` docs scope describes the router now, not a session.** It addresses "the session that
opens and closes a pool of instances and assigns tasks to other agents", which is exactly this code.
It gets no prompt reader, and its rules become the router's spec — which is a better place for them
than a prompt that could ignore them.

**Flowrider's browser cap is a different budget and stays declared.** Its walks run under ward's
Playwright, not as siegelense instances, so `capacity` cannot see them in `measured.siegeInstances`
and its answer does not bound them. `maxConcurrent: { limit: 4, counts: 'browser-pieces' }` stays on
that step — the `counts` half matters, because the step also runs below-browser pieces that cost
nothing and must not consume the cap.

Fixers stay unbounded in both families. They touch no lane and no browser.

**Siegelense is not fully built.** `scrolls/seigelense/remaining-build-items.md` is the list of what is
left, and the capacity wiring here depends on the parts of it that are done. That dependency belongs in
the order of work rather than discovered at step 2.


---

### 4D — the deletions

```
OWNS      packages/orchestrator/src/responders/quest/get-qa-checklist/  — DELETE the
            responder and the MCP tool; its derivation brokers survive as 3A's internals
          the reset-flow-signoffs broker and its MCP tool — DELETE
          packages/orchestrator/src/transformers/role-to-prompt-template/  — DELETE,
            including its `const exhaustiveCheck: never`
          packages/shared/src/statics/quest-type-registry/  — DELETE, once every caller
            reads questFlowStatics
          the spiritmender and warpgate SPLICES — hand-written slice arithmetic in two
            brokers, now one route entry each
          `agentPromptClassificationStatics.operatorRoleNames`
NO TOUCH  the sign-off FIELDS — wave 5, same merge window
          any prompt body — wave 6
DONE      nothing references a deleted symbol, and the tree compiles
ASSERT    `roleToPromptTemplateTransformer` and `agentNameToPromptTransformer` return
          byte-identical templates today and agree only by construction — assert the
          survivor still serves every name the deleted one did, before deleting it
```

**Four callers of `questTypeRegistryStatics` are outside the orchestrator** — `chat-start-responder`,
`quest-create-broker`, and four web e2e specs including `bughunt-begin-transition.e2e`. The e2e specs
read the registry deliberately, so that a seeded relay is checked against real data rather than an
assumption. They need the same treatment, not deletion.

### Everything this brief deletes, and what replaces each

| Thing | What happens to it |
|---|---|
| `get-qa-checklist` (the MCP tool) | **Deleted.** `get-quest-work` is the one startup call. The derivation brokers behind it survive and become that tool's internals |
| `reset-flow-signoffs` (the MCP tool and its broker) | **Deleted.** Absorbed into `quest-work`'s `invalidation` payload |
| `roleToPromptTemplateTransformer` and its `const exhaustiveCheck: never` | **Deleted.** Everything resolves through `agentNameToPromptTransformer`. The two return byte-identical templates today and agree only by construction |
| `questTypeRegistryStatics` | **Deleted**, once every caller reads `questFlowStatics`. Its ordered `startImplementationOps` + `relayTail` arrays became a routed family graph in wave 1 |
| `questBuildRelayGraphBroker`'s Start-time minting | Seeds the ENTRY family rather than the whole ordered tail. Each family's operation items are minted when the previous family's `done` routes to it |
| `wardMode` | **Deleted.** A deterministic step's `args: string[]` replaces it, and the field leaves the operation item, the contract, advance and both splices |
| `agentPromptClassificationStatics.operatorRoleNames` | **Goes.** "Which roles change code" becomes a step field — the answer is per step, not per family |
| `isCommandWorkItemRoleGuard` / `workItemRoleStatics.command` | **Simplifies.** `spawnerType` asks `step.kind`, not the role |
| the `spiritmender` and `warpgate` SPLICES | hand-written slice arithmetic in two brokers today; one route entry each now |
| `roleToModelStatics` | **Superseded for the six families** — the model comes off the step. Survives only for chat roles |
| `subagentStopNeedsBlockGuard` (`@dungeonmaster/hooks`) | Keeps working and covers MORE — every step is a work item, so every step is held until it signals |

**Four callers of `questTypeRegistryStatics` are outside the orchestrator** — `chat-start-responder`,
`quest-create-broker`, and four web e2e specs including `bughunt-begin-transition.e2e`. The e2e specs
read the registry deliberately, so a seeded relay is checked against real data rather than an
assumption. They need the same treatment, not deletion.

**`questAdvanceBroker` needs less change than it looks.** Its guard is on *pending* operation items, and
a pending item still has no work items because the router only mints inside an *in-progress* one. That
guard stays correct. It gains one job: stamping `step: <graph.entry>`. Ordering between families is
enforced by the `dependsOn` chain, not by advance.
