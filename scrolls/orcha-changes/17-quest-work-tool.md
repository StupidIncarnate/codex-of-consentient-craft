# 17 — `quest-work`, the write surface

```
GOAL      One MCP tool every LLM step calls, with six payloads. This is what routing reads.
AFTER     07 · 08 · 09 · 01
BEFORE    19 · 25
PACKAGE   @dungeonmaster/orchestrator (responder) + @dungeonmaster/mcp (tool)
MODEL     sonnet
```

---

## The six payloads

| Payload | Sent by | Carries |
|---|---|---|
| `plan` | a planner | the pieces and their batches, plus `plannerMarks` |
| `observations` | any prompt step holding units | per **unit**, one of `met` / `cant-meet` / `unmet`, with evidence. `toSettle` required on `cant-meet` |
| `amendment` | any step | a change to the plan the run has revealed |
| `outcome` | any step holding NO units, and any step hitting a wall | the declared word and its reason — the channel `signal-back` no longer has |
| `invalidation` | a siege fixer, off its `REACHES:` line | a `flowId` and a reason. Every unit on that flow is re-opened — the bulk lever `reset-flow-signoffs` was |
| `request` | any step | the step it is blocked on — `recipe` or `read` — and why. The router mints it and returns to the asker, so the asker names no route |

**Keyed by `unitId`, never `observableId`.** A terminal node and a labelled edge are units too, and
they sign on the node and the edge rather than on an observable.

---

## Four rules the tool enforces, and each has a failure behind it

### `toSettle` is required on `cant-meet` and refused elsewhere

Story 01's refinement. Assert it reaches the tool boundary — a contract that refuses and a tool that
strips are indistinguishable until the day a `cant-meet` lands with no instruction and nobody can act
on it.

### `outcome` is accepted from a step holding no units and REFUSED from one holding some

This is what makes `done` a fact about the record rather than a claim. A worker that says `done` while
holding an `unmet` unit is contradicting its own marks.

### `plan` is refused WHOLE, never per piece

A partially-accepted plan is a coverage hole with no owner. Story 08 has the nineteen checks; this
tool runs them and returns the error. **The error names the piece id and the check**, because the
planner has to act on it inside the same turn.

### `invalidation` keeps the three guards the old broker had

Read `quest-reset-flow-signoffs-broker.ts` before writing this. It carries:

| Guard | Where |
|---|---|
| the `walk-reset` note requirement | in that broker |
| the siegemaster-only authority check | `:92` |
| the in-scope check | `:101` |

Each has an error message behind it. Carry all three across, messages included. A bulk lever with no
authority check is a session able to erase another family's whole flow.

---

## Concurrency

Concurrent calls queue behind `questWithModifyLockBroker`, which is what that lock is for. **Use it.**
Parallel dispatch lands in story 21 and this tool is the thing several sessions call at once.

---

## DONE WHEN

| Assert | |
|---|---|
| all six payloads round-trip | |
| `cant-meet` with no `toSettle` is refused AT THE TOOL | not only at the contract |
| `outcome` from a unit-holding step is refused, naming the units | |
| a plan failing one check is refused WHOLE, and the message names the piece and the check | |
| `invalidation` from a non-siegemaster role is refused with the existing message | do not rewrite that message |
| `request` for a step that is not `mintableOnRequest` is refused | a session cannot conjure an arbitrary step |
| two concurrent `observations` writes both land | the lock |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| act on any payload | story 15's router reads the record it writes |
| delete `reset-flow-signoffs` | story 24. It stays live until then |
| build the read tool | story 18 |
| touch `signal-back` | story 19 |
