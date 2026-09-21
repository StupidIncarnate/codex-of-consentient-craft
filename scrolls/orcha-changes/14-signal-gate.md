# 14 — no session signals with an assigned unit unmarked

```
GOAL      The deterministic gate. A worker that says it is finished while leaving an
          assigned unit unmarked does not get to signal at all.
AFTER     10 · 12 · 13
BEFORE    19 (signal-back calls this)
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus
```

---

## Why this is a gate and not a prompt rule

Every prompt in this system already asks its session to be honest. The gate is what makes one of those
asks structural: **`done` becomes a fact about the record rather than a claim a session makes about
itself.**

It is refused at the TOOL BOUNDARY, before routing is even consulted. A session cannot route past it,
cannot retry past it, and cannot argue with it.

---

## Where the assignment lives — read this before anything else

**This story needs a FIFTH field on `workItemContract`, and story 02 has four.** Say so in your
signal; the conductor decides whether 02 is amended or this story adds it.

```ts
// packages/shared/src/contracts/work-item/work-item-contract.ts
assignedUnitIds: z.array(unitIdContract).default([]),
```

Optional-by-default, exactly like story 02's `observations`, so the additive rule that file's header
depends on still holds and no existing `quest.json` changes shape.

**It cannot be derived, and three separate readings fail:**

| Candidate carrier | Fails because |
|---|---|
| the piece's `assignedUnitIds` via `workItem.pieceId` | story 07: *"`assignedUnitIds` is INTENT, and the router decides what is actually assigned… the router re-filters against the record at dispatch and hands the session only what is still unsettled."* The piece's list and the session's list are deliberately different |
| `payload.units[]` | siegemaster's payload has no `units` key at all — story 07's siege block is `{ path: { nodeIds, branchLabels }, offMapFamily }`. Every siege walker and both fixers would read as assigned nothing, and the gate would pass every one of them |
| re-deriving a reviewer's in-scope set at signal time | it is a different set from the one at dispatch. An observable a reviewer added mid-pass is in-scope for the scope that added it (§8 hole 17), so the gate would refuse a session over a unit that did not exist when it was briefed |

So the router WRITES what it assigned onto the work item it mints (story 15), and this gate READS
that field and nothing else. One field, one writer, one reader.

**The unit ids in it are the ids the enumeration already produces**, not a new vocabulary:

| Kind | Id | Source |
|---|---|---|
| terminal | `<flowId>:terminal:<nodeId>` | `qa-unit-enumerate-transformer.ts:54` |
| branch | `<flowId>:branch:<edgeId>` | `:67` |
| observable | `<flowId>:observable:<observableId>` | `:81` |
| off-map | `<flowId>:off-map:<family>` | `:97` |

---

## The refusal has to be useful, because the session must act on it in the same turn

**This block is the LITERAL message, not a sketch.** Build it exactly, and assert it exactly.

```
REFUSED: 3 of your 7 assigned units are unmarked.

  send-flow:observable:obs-3   scanning the text finds every absolute path …
  send-flow:observable:obs-7   a path already inside an image token is not matched twice
  send-flow:branch:copy-ok     a successful copy reaches the rewrite

Mark each one `met`, `cant-meet` or `unmet` through quest-work, then signal again.
`unmet` is not failure and costs nothing — it mints your successor on exactly these.
```

Composed as:

| Part | Rule |
|---|---|
| line 1 | `REFUSED: ${unmarked} of your ${assigned} assigned units are unmarked.` — both are counts, never ids |
| then | one blank line |
| each row | two leading spaces, the unit id, then spaces padding every id in this message to the widest one plus three, then the unit's text |
| row text | truncated at 80 characters, with ` …` appended when it was longer. That is what the trailing `…` in row one above is |
| overflow | at most 15 rows, then `  … and ${n} more — call get-quest-work({ questId, workItemId }) for the full set.` The 15 is `OUTSTANDING_PREVIEW_LIMIT`, already this shape at `quest-handle-signal-back-responder.ts:73` — reuse the number and the reason, not the constant (it is module-private there) |
| then | one blank line, then the two closing lines above, verbatim and unconditional |

**Where each row's text comes from**, per the unit's `kind` on `qaVerificationUnitContract`:

| Kind | Text |
|---|---|
| `observable` | `observableDescription` |
| `terminal` | `nodeLabel` |
| `branch` | `edgeLabel` |
| `off-map` | `qaOffMapProbeStatics.byFamily[offMapFamily]` from `@dungeonmaster/shared/statics` — the probe sentence, not the family name. The name is already in the id, and repeating it tells the session nothing |

**Name the units and quote their text.** A bare "you have unmarked units" sends the session back to
fetch its own work definition, which costs a round trip it does not have to spend.

**The last two lines are deliberate and belong in the refusal, not only in the prompt.** The failure
this guards against is a session that pads marks to get past the gate. Telling it, at the moment it is
blocked, that `unmet` is free is the cheapest place to prevent that.

---

## The reviewer rule, and why the check is HERE rather than at `@done`

**Every `role: 'reviewer'` step is assigned its scope's WHOLE in-scope unit set** (story 12), filtered
by the step's declared scope (story 11).

A unit no piece ever claimed would otherwise be assigned to nobody, and this gate counts *assigned*
units — so it would pass cleanly with that unit unmarked. The obvious fix is a second check at `@done`.
**That deadlocks**, and it is worth understanding rather than rediscovering:

`@done` fires when the ward step routes there. At that moment no step is minted, no unit is assigned,
and the config declares no route out of a refused terminal. The operation stalls with nothing able to
move it.

One step earlier a route still exists. So the in-scope check and the signal gate become the SAME
check, and an unmarked in-scope unit is an unmarked *assigned* unit, which the ordinary `unmet` route
answers by minting a worker carrying it.

`@done` keeps the same check as a backstop that should never fire. **A backstop that can only stall is
fine; a gate that can only stall is not.**

---

## BUILD

```
packages/orchestrator/src/contracts/signal-gate-result/signal-gate-result-contract.ts
packages/orchestrator/src/contracts/signal-gate-result/signal-gate-result.stub.ts
packages/orchestrator/src/contracts/signal-gate-result/signal-gate-result-contract.test.ts
packages/orchestrator/src/transformers/signal-gate/signal-gate-transformer.ts
packages/orchestrator/src/transformers/signal-gate/signal-gate-transformer.test.ts
```

```ts
export const signalGateTransformer = ({ quest, workItemId }: {
  quest: Quest;
  workItemId: QuestWorkItemId;
}): SignalGateResult => …

// signalGateResultContract — a discriminated union on `ok`:
//   { ok: true }
//   { ok: false, unmarked: UnitId[], message: string }
```

**A TRANSFORMER, not a guard and not a broker.** A guard returns a boolean and this returns the ids
and the prose; a broker does I/O and this does none. It takes a quest object already loaded by its
caller and reads `quest.workItems`, `quest.flows` and nothing else, so story 19 can call it from
inside a lock without paying a second read.

It needs the unit TEXT for the message, and it gets it by calling
`qaUnitEnumerateTransformer({ flow })` — `packages/orchestrator/src/transformers/qa-unit-enumerate/` —
once per flow on the quest and indexing the result by `unit.id`. That transformer is pure, is already
the SINGLE enumeration every other reader shares, and computes ids off the graph rather than minting
them, so the ids it produces are byte-identical to the ones on `assignedUnitIds`.

**An assigned id the enumeration does not produce is still REFUSED, with the id and no text.** A unit
whose node was deleted mid-quest is a real state; dropping the row would let the session signal with
it unmarked.

### A planner passes by arithmetic, and it really does

```
unmarked = workItem.assignedUnitIds.filter(
  (unitId) => !workItem.observations.some((observation) => observation.unitId === unitId),
)
```

That is the whole computation. **Do not read `role` anywhere in this file.**

| Case | Why it falls out |
|---|---|
| an ordinary planner | the router assigns a `role: 'planner'` step no units (story 05's role table), so `assignedUnitIds` is `[]`, so `unmarked` is `[]` |
| a siege planner that wrote `plannerMarks` | it is NOT zero-assigned. When the router accepts a plan it copies `plannerMarks` onto the planner's own work item as its observation set AND adds those unit ids to its `assignedUnitIds` — that is what makes the planner the most recent work item assigned them under story 10's rule. Assigned and marked are then the same set, and `unmarked` is `[]` |
| a planner that somehow got units | refused, exactly like a worker. That is the point of not special-casing |
| a deterministic step (`ward`, `commit`, `cleanup`, `riftcarver`) | it never calls `signal-back` at all — its outcome is its handler's exit code (story 20). If one ever reaches here it carries no units and passes |

A mark's VALUE is irrelevant to this gate. `met`, `cant-meet` and `unmet` all count as marked; only
the absence of an entry counts.

---

## DONE WHEN

| Assert | |
|---|---|
| a step with 7 assigned and 6 marked is REFUSED, `unmarked` holds the one id | |
| with all 7 marked it passes, `{ ok: true }` and no `message` key | |
| a planner with `assignedUnitIds: []` and `observations: []` passes | |
| a planner carrying two `plannerMarks` units, both assigned and both `cant-meet`, passes | the case that proves the arithmetic covers the exception rather than a role check covering it |
| **the refusal message matches the block above CHARACTER FOR CHARACTER** for a 7-assigned / 3-unmarked fixture | build the fixture from the example: unit ids `send-flow:observable:obs-3`, `send-flow:observable:obs-7`, `send-flow:branch:copy-ok`, and the three texts shown. `toBe` on the whole string, never `toContain` on a fragment |
| a 20-unmarked fixture prints 15 rows then `  … and 5 more — call get-quest-work({ questId, workItemId }) for the full set.` | the overflow line, exact |
| an off-map unit's row carries `qaOffMapProbeStatics.byFamily['perf']` truncated at 80 plus ` …` | the second text source, and the one a single-source implementation fills empty |
| a `cant-meet` counts as MARKED | it settles the unit. This is the one people get wrong |
| an assigned id no flow enumerates is refused, its row carrying the id and an empty text column | a deleted node is a real state |
| a reviewer assigned the whole in-scope set is refused on an in-scope unit no piece ever claimed | the reviewer rule, which is the reason this check sits here |
| the quest object is unchanged after the call | it is pure. Assert the input |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| wire it into `signal-back` | story 19 |
| WRITE `assignedUnitIds` — only read it | story 15's router mints work items; this reads what it wrote |
| route after a successful signal | story 15 |
| check whether a mark is HONEST | nothing can. That is prompt text — "never mark a unit you did not settle" — and story 25 puts it in every non-planner prompt |
