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

## The refusal has to be useful, because the session must act on it in the same turn

```
REFUSED: 3 of your 7 assigned units are unmarked.

  obs-3   scanning the text finds every absolute path …
  obs-7   a path already inside an image token is not matched twice …
  copy-ok a successful copy reaches the rewrite

Mark each one `met`, `cant-meet` or `unmet` through quest-work, then signal again.
`unmet` is not failure and costs nothing — it mints your successor on exactly these.
```

**Name the units and quote their text.** A bare "you have unmarked units" sends the session back to
fetch its own work definition, which costs a round trip it does not have to spend.

**The last line is deliberate and belongs in the refusal, not only in the prompt.** The failure this
guards against is a session that pads marks to get past the gate. Telling it, at the moment it is
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
{ quest, workItemId } → { ok: true } | { ok: false, unmarked: UnitId[], message: string }
```

A guard or broker in `packages/orchestrator/src/`. It reads the work item's assignment and its
`observations[]`, and returns the unmarked ones.

**A planner passes trivially** — no units assigned, nothing to mark. Do not special-case the role;
fall out of the arithmetic, so a planner that somehow got units is caught rather than waved through.

---

## DONE WHEN

| Assert | |
|---|---|
| a step with one unmarked unit is REFUSED | |
| with all marked it passes | |
| a planner with none assigned passes | |
| **the refusal message names each unmarked unit** | a message that does not is a round trip the session cannot afford |
| a `cant-meet` counts as MARKED | it settles the unit. This is the one people get wrong |
| a reviewer assigned the whole in-scope set is refused on an in-scope unit no piece ever claimed | the reviewer rule, which is the reason this check sits here |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| wire it into `signal-back` | story 19 |
| route after a successful signal | story 15 |
| check whether a mark is HONEST | nothing can. That is prompt text — "never mark a unit you did not settle" — and story 25 puts it in every non-planner prompt |
