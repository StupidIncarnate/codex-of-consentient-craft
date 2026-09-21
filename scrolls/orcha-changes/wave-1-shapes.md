# Wave 1 — the shapes

**Three sessions, all at once.** Everything here is additive: new contracts, new statics, one lint
rule. Nothing reads any of it yet, so the tree stays green throughout and no session can break
another.

**Model: opus.** This is where the graph grammar gets decided, and the whole epic is written against
it.

**Spec:** plan §3a, §3b, §4, and §7 for the contract-tolerance rule.

---

### 1A — the two graphs, and the check that proves they are sound

```
READ      plan §3a (family graph) · §3b (step graphs, the config block, the reachability table)
          · §7 (why step ids are free strings and families keep their enum)
OWNS      packages/shared/src/statics/quest-flow/quest-flow-statics.ts            NEW
          packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts      NEW
          packages/shared/src/statics/quest-type-registry/quest-type-registry-statics.ts
            — and its colocated test
          one new rule in packages/local-eslint, plus its registration
NO TOUCH  every CALLER of questTypeRegistryStatics. Session 4A rewires them, and there are
          callers in orchestration-start-responder, chat-start-responder, quest-create-broker
          and four web e2e specs. Leave the old export in place beside the new statics
DONE      both graphs exist and both pass the reachability check; the check runs as a lint
          rule AND at server load, from ONE implementation with two callers
ASSERT    every row of §3b's reachability table, each as its own case with a deliberately
          broken fixture graph: a step nothing routes to, a cycle with no exit, a route
          naming a step that does not exist, a plan-reachable step with no `done` route,
          an outcome word outside the four, a cyclic path with no `maxVisits`, a family
          that reaches no `@complete`, a `prompt` or `handler` naming something absent.
          Then the three that must PASS: `adversarial` reached by a route, `recipe` and
          `read` by `mintableOnRequest`, `warpgate` by `appendedAtMerge`
```

**The reason this session is first and alone.** The plan says it plainly: a disconnected step reads as
fine until a quest stalls, and the author left `ward` disconnected in a draft of the plan itself
without noticing. The check is written ALONGSIDE the graphs, not after, so a bad graph cannot be
committed in the first place.

**Do not skip the load-time throw as belt-and-braces.** Lint can be bypassed; the failure mode of a
bad graph in production is a quest that silently stalls rather than one that errors.

---

### 1B — the plan file: its contract, its path, its validation

```
READ      plan §2 (piece versus work item) · §4 (the envelope, the three worked examples,
          the submission checks table)
OWNS      a new contract for the planned-work file and its pieces, batches and plannerMarks
          the `planned-work/<operationItemId>.json` path constant, in the same locations
            statics every other quest path lives in
          the validation this contract enforces at parse time
NO TOUCH  the `quest-work` MCP tool — session 3B owns it and calls this contract
          quest.json's own contract — session 1C owns that
DONE      a plan parses or is refused whole, and every check in §4's table has a case
ASSERT    the two the plan singles out, first: `payload.units[]` 1:1 with
          `assignedUnitIds` catches a dropped terminal AT WRITE TIME, and an assigned unit
          out of scope is refused while a CONTEXT unit out of scope is allowed. Then the
          two the phase decision added: a batch whose pieces name two different `step`
          values is refused, and an `adversarial` piece whose `baselineFor` names a piece
          in the same batch or a later one is refused. **Reject the whole plan, never a
          piece** — a partially-accepted plan is a coverage hole with no owner
```

**Use the three worked examples in §4 as fixtures.** They are cut from a real quest with real ids, and
they are the reason the shapes are what they are — a codeweaver piece carrying ZERO units is legal, and
an off-map family needs the `offmap:<family>` id shape because it hangs on no node and no edge.

---

### 1C — three fields on a work item, and what an observation is

```
READ      plan §1 ("Where the marks live") · §2 · §8 holes 3, 5, 12, 22
OWNS      the quest work-item contract: `step`, `observations[]`, optional `pieceId`,
          optional `payload`
          the observation contract — { unitId, mark, evidence, toSettle?, at }
          the unit-id contract, including the `offmap:<family>` shape
          every stub these need
NO TOUCH  the three sign-off fields on observables, nodes and edges. Wave 5 retires them,
          and they must keep working until it does
          any of the 77 readers of quest.workItems — this is three ADDED fields, and
          nothing existing changes shape
DONE      a quest.json holding the new fields round-trips, and one holding none still
          parses. `toSettle` is REQUIRED when the mark is `cant-meet` and refused
          otherwise
ASSERT    the key is `unitId`, never `observableId` — a terminal node and a labelled edge
          are units too. Then the freeze rule: a work item's observation set is its own,
          one entry per assigned unit, and no write to one work item's set touches
          another's
```

**The three added fields are why `quest.workItems` is not being split.** It is read in 77 non-test
source files and written through 17 call sites that each depend on one atomic rename being the commit
point. Moving it is expensive and buys nothing; adding to it is cheap. Do not widen this session.

---

## What wave 1 must NOT do

| | Why |
|---|---|
| wire anything | wave 4's job. A wave-1 session that rewires a caller breaks the tree for waves 2 and 3 |
| delete `questTypeRegistryStatics` | its callers are still live. The new statics sits beside it |
| write a prompt | wave 6, and not before wave 3 settles what step one returns |
| touch `signoffTrackEligibilityStatics` | wave 5, and the SCOPING half of it survives — see plan §"Retiring the sign-off tracks retires two different things" |
