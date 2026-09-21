# 19 — `signal-back` stops deciding anything

```
GOAL      Keep two jobs, lose one, gain one.
AFTER     14 (the gate it calls)
BEFORE    22
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

---

## Four changes

| | |
|---|---|
| **KEEPS** idempotency on redelivery | a second signal for a terminal work item is a no-op |
| **KEEPS** the session-terminal marker | |
| **GAINS** the unmarked-unit refusal | story 14's gate, called here |
| **LOSES** the commit-before-signal gate, and `operationStatus` | see below |

---

## Why the commit gate is DELETED, not scoped

**This took two passes to get right. Do not re-derive it.**

The first answer was to scope the gate to the reviewer, because a batch of parallel workers each gated
on a clean tree is a deadlock — measured rather than theoretical: twelve concurrent sub-agent commits
in one worktree, three landed, nine died on `Unable to create index.lock`.

**That is also wrong.** Once `commit` is a deterministic step (story 20), the reviewer does not commit
either. A reviewer-only gate refuses the reviewer for exactly the reason it would have refused the
workers.

**Nobody commits, so nobody can be gated on having committed.** Every session reaches its signal with a
dirty tree by construction. Keep the gate and a worker that just wrote four files can never signal at
all — it burns its visits against a wall nothing can move.

`gitWorkingTreeFilesBroker` — what the gate measured with — **stays**. It is the reviewer's pass, the
worker's live `DO NOT TOUCH` set, and the fixer's view of what the walk left behind. Story 18 serves it
rather than each session running it.

`operationStatus` goes because routing reads the record now. It carried `partial`, which retires with
duplicate-on-partial.

---

## DONE WHEN

| Assert | |
|---|---|
| a second signal for a terminal work item is a no-op | |
| a signal with an unmarked assigned unit is refused, **and the refusal names which units** | the session must act on it in the same turn |
| a signal with a DIRTY TREE succeeds | the deleted gate. Write this one explicitly, with a fixture holding uncommitted files — it is the regression guard for re-adding the gate |
| `operationStatus: 'partial'` is no longer accepted | |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| implement the gate | story 14. Call it |
| route after a signal | story 15 |
| remove the `pt N` continuation machinery | story 24 |
